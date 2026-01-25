/**
 * Cloud Run AI Supervisor Stream V2 Proxy
 *
 * @endpoint POST /api/ai/supervisor/stream/v2
 * @endpoint GET /api/ai/supervisor/stream/v2?sessionId=xxx (Resume stream)
 *
 * AI SDK v6 Native UIMessageStream proxy to Cloud Run.
 *
 * Features:
 * - Upstash-compatible resumable stream (polling-based)
 * - Redis List storage for stream chunks
 * - Auto-expire after 10 minutes
 *
 * @see https://ai-sdk.dev/docs/ai-sdk-ui/chatbot-resume-streams
 * @created 2026-01-24
 * @updated 2026-01-24 - Implemented Upstash-compatible resumable stream
 */

import { generateId } from 'ai';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
  extractLastUserQuery,
  type HybridMessage,
  normalizeMessagesForCloudRun,
} from '@/lib/ai/utils/message-normalizer';
import { withAuth } from '@/lib/auth/api-auth';
import { logger } from '@/lib/logging';
import { rateLimiters, withRateLimit } from '@/lib/security/rate-limiter';
import { quickSanitize } from '../../security';
import {
  clearActiveStreamId,
  getActiveStreamId,
  saveActiveStreamId,
} from './stream-state';
import { createUpstashResumableContext } from './upstash-resumable';

// Allow streaming responses up to 60 seconds
// Vercel Tier Limits: Free=10s, Pro=60s (current), Enterprise=900s
export const maxDuration = 60;

// UI Message Stream headers (AI SDK standard)
const UI_MESSAGE_STREAM_HEADERS = {
  'Content-Type': 'text/event-stream',
  'Cache-Control': 'no-cache',
  Connection: 'keep-alive',
};

// ============================================================================
// 📋 Request Schema
// ============================================================================

const textPartSchema = z.object({
  type: z.literal('text'),
  text: z.string(),
});

const partSchema = z.union([
  textPartSchema,
  z.object({ type: z.literal('tool-invocation') }).passthrough(),
  z.object({ type: z.literal('tool-result') }).passthrough(),
  z.object({ type: z.literal('file') }).passthrough(),
  z.object({ type: z.literal('reasoning') }).passthrough(),
  z.object({ type: z.literal('source') }).passthrough(),
  z.object({ type: z.literal('step-start') }).passthrough(),
  z.object({ type: z.literal('step-finish') }).passthrough(),
  z.object({ type: z.string() }).passthrough(),
]);

const messageSchema = z.object({
  id: z.string().optional(),
  role: z.enum(['user', 'assistant', 'system']),
  parts: z.array(partSchema).optional(),
  content: z.string().optional(),
  createdAt: z.union([z.string(), z.date()]).optional(),
});

const requestSchema = z.object({
  messages: z.array(messageSchema).min(1).max(50),
  sessionId: z.string().optional(),
});

// ============================================================================
// 🔁 GET - Resume Stream (Upstash-compatible polling)
// ============================================================================

const resumeStreamHandler = async (req: NextRequest) => {
  const url = new URL(req.url);
  const rawSessionId = url.searchParams.get('sessionId');
  const skipParam = url.searchParams.get('skip');

  // 🎯 CODEX Review Fix: skip 파라미터 검증 (NaN/음수 방지)
  const skipChunks = skipParam ? Number(skipParam) : 0;
  if (!Number.isInteger(skipChunks) || skipChunks < 0) {
    return NextResponse.json(
      { error: 'skip must be a non-negative integer' },
      { status: 400 }
    );
  }

  const sessionIdResult = z.string().min(8).max(128).safeParse(rawSessionId);
  if (!sessionIdResult.success) {
    return NextResponse.json(
      { error: 'sessionId required (8-128 chars)' },
      { status: 400 }
    );
  }
  const sessionId = sessionIdResult.data;

  logger.info(
    `🔄 [SupervisorStreamV2] Resume request for session: ${sessionId}, skip: ${skipChunks}`
  );

  // Check for active stream in Redis
  const activeStreamId = await getActiveStreamId(sessionId);

  if (!activeStreamId) {
    logger.debug(
      `[SupervisorStreamV2] No active stream for session: ${sessionId}`
    );
    return new Response(null, { status: 204 });
  }

  // Create resumable context and attempt to resume
  const resumableContext = createUpstashResumableContext();
  const streamStatus = await resumableContext.hasExistingStream(activeStreamId);

  if (!streamStatus) {
    logger.debug(
      `[SupervisorStreamV2] Stream not found in Redis: ${activeStreamId}`
    );
    await clearActiveStreamId(sessionId);
    return new Response(null, { status: 204 });
  }

  // 🎯 CODEX Review Fix: completed 상태에서도 남은 chunk 재전송 허용
  // 네트워크 단절 후 복구 시 이미 완료된 스트림도 이어받기 가능
  if (streamStatus === 'completed') {
    logger.info(
      `[SupervisorStreamV2] Stream completed, attempting resume for remaining chunks: ${activeStreamId}`
    );
  }

  // Resume the stream (works for both active and completed)
  const resumedStream = await resumableContext.resumeExistingStream(
    activeStreamId,
    skipChunks
  );

  if (!resumedStream) {
    logger.warn(
      `[SupervisorStreamV2] Failed to resume stream: ${activeStreamId}`
    );
    await clearActiveStreamId(sessionId);
    return new Response(null, { status: 204 });
  }

  // 🎯 CODEX Review R3 Fix: 완료된 스트림은 one-shot replay이므로
  // session mapping 즉시 정리 (더 이상 polling 불필요)
  if (streamStatus === 'completed') {
    await clearActiveStreamId(sessionId);
    logger.info(
      `[SupervisorStreamV2] Cleared session mapping for completed stream: ${activeStreamId}`
    );
  }

  logger.info(`✅ [SupervisorStreamV2] Stream resumed: ${activeStreamId}`);

  return new Response(resumedStream, {
    headers: {
      ...UI_MESSAGE_STREAM_HEADERS,
      'X-Session-Id': sessionId,
      'X-Stream-Id': activeStreamId,
      'X-Resumed': 'true',
      'X-Skip-Chunks': String(skipChunks),
    },
  });
};

export const GET = withRateLimit(
  rateLimiters.aiAnalysis,
  withAuth(resumeStreamHandler)
);

// ============================================================================
// 🌊 POST - Create UIMessageStream (Pass-through, no resumable)
// ============================================================================

export const POST = withRateLimit(
  rateLimiters.aiAnalysis,
  withAuth(async (req: NextRequest) => {
    try {
      // 1. Validate request
      const body = await req.json();
      const parseResult = requestSchema.safeParse(body);

      if (!parseResult.success) {
        logger.warn(
          '⚠️ [SupervisorStreamV2] Invalid payload:',
          parseResult.error.issues
        );
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid request payload',
            details: parseResult.error.issues.map((i) => i.message).join(', '),
          },
          { status: 400 }
        );
      }

      const { messages, sessionId: bodySessionId } = parseResult.data;

      // 2. Extract session ID
      const url = new URL(req.url);
      const headerSessionId = req.headers.get('X-Session-Id');
      const querySessionId = url.searchParams.get('sessionId');
      const sessionId =
        headerSessionId || bodySessionId || querySessionId || generateId();

      // 3. Extract and sanitize query
      const rawQuery = extractLastUserQuery(messages as HybridMessage[]);
      if (!rawQuery?.trim()) {
        return NextResponse.json(
          { success: false, error: 'Empty query' },
          { status: 400 }
        );
      }
      const userQuery = quickSanitize(rawQuery);

      logger.info(
        `🌊 [SupervisorStreamV2] Query: "${userQuery.slice(0, 50)}..."`
      );
      logger.info(`📡 [SupervisorStreamV2] Session: ${sessionId}`);

      // 4. Normalize messages for Cloud Run
      const normalizedMessages = normalizeMessagesForCloudRun(messages);

      // 5. Get Cloud Run URL
      const cloudRunUrl = process.env.CLOUD_RUN_AI_ENGINE_URL;
      if (!cloudRunUrl) {
        logger.error(
          '❌ [SupervisorStreamV2] CLOUD_RUN_AI_ENGINE_URL not configured'
        );
        return NextResponse.json(
          { success: false, error: 'Streaming not available' },
          { status: 503 }
        );
      }

      // 6. Generate stream ID for tracking
      const streamId = generateId();

      // 7. Proxy to Cloud Run v2 endpoint
      const apiSecret = process.env.CLOUD_RUN_API_SECRET;
      const streamUrl = `${cloudRunUrl}/api/ai/supervisor/stream/v2`;

      logger.info(`🔗 [SupervisorStreamV2] Connecting to: ${streamUrl}`);
      logger.info(`🆔 [SupervisorStreamV2] Stream ID: ${streamId}`);

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 55000);

      try {
        const cloudRunResponse = await fetch(streamUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'text/event-stream',
            ...(apiSecret && { 'X-API-Key': apiSecret }),
          },
          body: JSON.stringify({
            messages: normalizedMessages,
            sessionId,
          }),
          signal: controller.signal,
        });

        if (!cloudRunResponse.ok) {
          const errorText = await cloudRunResponse.text();
          logger.error(
            `❌ [SupervisorStreamV2] Cloud Run error: ${cloudRunResponse.status} - ${errorText}`
          );

          return NextResponse.json(
            {
              success: false,
              error: `Stream error: ${cloudRunResponse.status}`,
            },
            { status: cloudRunResponse.status }
          );
        }

        if (!cloudRunResponse.body) {
          return NextResponse.json(
            { success: false, error: 'No response body' },
            { status: 500 }
          );
        }

        // 8. Save stream ID to Redis for tracking
        await saveActiveStreamId(sessionId, streamId);

        // 9. Wrap stream with Upstash-compatible resumable context
        const resumableContext = createUpstashResumableContext();
        const resumableStream = await resumableContext.createNewResumableStream(
          streamId,
          () => cloudRunResponse.body!
        );

        logger.info(`✅ [SupervisorStreamV2] Stream started (resumable)`);

        // 10. Return resumable stream response
        return new Response(resumableStream, {
          headers: {
            ...UI_MESSAGE_STREAM_HEADERS,
            'X-Session-Id': sessionId,
            'X-Stream-Id': streamId,
            'X-Backend': 'cloud-run-stream-v2',
            'X-Stream-Protocol': 'ui-message-stream',
            'X-Resumable': 'true',
          },
        });
      } catch (error) {
        // Clear both session mapping and resumable stream data
        await clearActiveStreamId(sessionId);
        const cleanupContext = createUpstashResumableContext();
        await cleanupContext.clearStream(streamId);

        if (error instanceof Error && error.name === 'AbortError') {
          logger.error('❌ [SupervisorStreamV2] Request timeout');
          return NextResponse.json(
            { success: false, error: 'Stream timeout', sessionId },
            { status: 504 }
          );
        }

        throw error;
      } finally {
        clearTimeout(timeout);
      }
    } catch (error) {
      logger.error('❌ [SupervisorStreamV2] Error:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Stream processing failed',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 }
      );
    }
  })
);
