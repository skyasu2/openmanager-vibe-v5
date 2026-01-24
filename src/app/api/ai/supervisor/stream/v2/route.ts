/**
 * Cloud Run AI Supervisor Stream V2 Proxy (Resumable Mode)
 *
 * @endpoint POST /api/ai/supervisor/stream/v2
 * @endpoint GET /api/ai/supervisor/stream/v2?sessionId=xxx (Resume)
 *
 * AI SDK v6 Native UIMessageStream with resumable stream support.
 * Uses official `resumable-stream` package for Redis-based stream persistence.
 *
 * Benefits:
 * - Native AI SDK protocol preserved (UIMessageStream)
 * - Resumable streams via Redis (survives reconnects, refreshes)
 * - Works directly with useChat + resume option
 * - Structured data events (handoffs, tool calls, metadata)
 *
 * @see https://ai-sdk.dev/docs/ai-sdk-ui/chatbot-resume-streams
 * @created 2026-01-24
 * @updated 2026-01-24 - Added resumable stream support
 */

import { generateId } from 'ai';
import type { NextRequest } from 'next/server';
import { after, NextResponse } from 'next/server';
import { createResumableStreamContext } from 'resumable-stream';
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

// Allow streaming responses up to 60 seconds (Vercel Hobby: max 60s)
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
// 🔁 GET - Resume Stream (AI SDK v6 Official Pattern)
// ============================================================================

// CODEX Review: GET 핸들러에도 인증/레이트리밋 적용 필요 (보안)
const resumeStreamHandler = async (req: NextRequest) => {
  const url = new URL(req.url);
  const rawSessionId = url.searchParams.get('sessionId');

  // CODEX Review: sessionId 검증 추가 (길이/형식 제한)
  const sessionIdResult = z.string().min(8).max(128).safeParse(rawSessionId);
  if (!sessionIdResult.success) {
    return NextResponse.json(
      { error: 'sessionId required (8-128 chars)' },
      { status: 400 }
    );
  }
  const sessionId = sessionIdResult.data;

  logger.info(
    `🔄 [SupervisorStreamV2] Resume request for session: ${sessionId}`
  );

  // Check for active stream in Redis
  const activeStreamId = await getActiveStreamId(sessionId);

  if (!activeStreamId) {
    // No active stream - 204 No Content (AI SDK official pattern)
    logger.debug(
      `[SupervisorStreamV2] No active stream for session: ${sessionId}`
    );
    return new Response(null, { status: 204 });
  }

  try {
    // Create resumable stream context with Next.js after() for cleanup
    const streamContext = createResumableStreamContext({
      waitUntil: after,
    });

    // Attempt to resume existing stream
    const resumedStream =
      await streamContext.resumeExistingStream(activeStreamId);

    logger.info(`✅ [SupervisorStreamV2] Stream resumed: ${activeStreamId}`);

    return new Response(resumedStream, {
      headers: {
        ...UI_MESSAGE_STREAM_HEADERS,
        'X-Session-Id': sessionId,
        'X-Stream-Id': activeStreamId,
        'X-Resumed': 'true',
      },
    });
  } catch (error) {
    // Stream expired or not found - clear state and return 204
    logger.warn(`[SupervisorStreamV2] Stream resume failed:`, error);
    await clearActiveStreamId(sessionId);
    return new Response(null, { status: 204 });
  }
};

// Apply auth and rate limiting to GET handler
export const GET = withRateLimit(
  rateLimiters.aiAnalysis,
  withAuth(resumeStreamHandler)
);

// ============================================================================
// 🌊 POST - Create Resumable UIMessageStream
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
        headerSessionId ||
        bodySessionId ||
        querySessionId ||
        // CODEX Review: Use generateId() for cryptographic randomness
        generateId();

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

      // 6. Generate stream ID for resumability
      const streamId = generateId();

      // 7. Proxy to Cloud Run v2 endpoint
      const apiSecret = process.env.CLOUD_RUN_API_SECRET;
      const streamUrl = `${cloudRunUrl}/api/ai/supervisor/stream/v2`;

      logger.info(`🔗 [SupervisorStreamV2] Connecting to: ${streamUrl}`);
      logger.info(`🆔 [SupervisorStreamV2] Stream ID: ${streamId}`);

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 55000); // 55s timeout

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

        // Note: clearTimeout moved to finally block (P1-3 fix)

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

        // 8. Create resumable stream context
        const streamContext = createResumableStreamContext({
          waitUntil: after,
        });

        // 9. Transform Uint8Array stream to string stream for resumable-stream
        // AI SDK v6 Best Practice: Use resumable-stream for durability
        const textStream = cloudRunResponse.body!.pipeThrough(
          new TextDecoderStream()
        );

        const resumableStream = await streamContext.createNewResumableStream(
          streamId,
          () => textStream
        );

        // 10. Save stream ID to Redis for resumption
        await saveActiveStreamId(sessionId, streamId);

        logger.info(`✅ [SupervisorStreamV2] Resumable stream started`);

        // 11. Return resumable stream response
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
        // Clear stream state on error
        await clearActiveStreamId(sessionId);

        if (error instanceof Error && error.name === 'AbortError') {
          logger.error('❌ [SupervisorStreamV2] Request timeout');
          return NextResponse.json(
            { success: false, error: 'Stream timeout', sessionId },
            { status: 504 }
          );
        }

        throw error;
      } finally {
        // 🎯 P1-3 Fix: Guaranteed timeout cleanup regardless of success/failure
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
