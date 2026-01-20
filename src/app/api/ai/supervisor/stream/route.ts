/**
 * Cloud Run AI Supervisor Stream Proxy
 *
 * @endpoint POST /api/ai/supervisor/stream
 * @endpoint GET /api/ai/supervisor/stream?sessionId=xxx (Resume)
 *
 * Real-time SSE streaming with Resumable Streams support.
 * - Streams from Cloud Run to Frontend
 * - Saves partial results to Redis for recovery
 * - Supports stream resumption on reconnect
 *
 * @created 2026-01-09
 * @updated 2026-01-19 - Added Resumable Streams support
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { STREAM_ERROR_MARKER } from '@/lib/ai/constants/stream-errors';
import {
  compressContext,
  shouldCompress,
} from '@/lib/ai/utils/context-compressor';
import {
  extractLastUserQuery,
  type HybridMessage,
  normalizeMessagesForCloudRun,
} from '@/lib/ai/utils/message-normalizer';
import { withAuth } from '@/lib/auth/api-auth';
import { logger } from '@/lib/logging';
import { getRedisClient, isRedisEnabled } from '@/lib/redis/client';
import { rateLimiters, withRateLimit } from '@/lib/security/rate-limiter';
import { quickSanitize } from '../security';

// Allow streaming responses up to 60 seconds (Vercel Hobby: max 60s)
export const maxDuration = 60;

// ============================================================================
// 📦 Redis Stream State Keys
// ============================================================================

const STREAM_KEY_PREFIX = 'ai:stream:';
/** 활성 스트리밍 TTL: 10분 (복잡한 분석 쿼리 지원) */
const STREAM_TTL_SECONDS = 600;
/** 완료 후 TTL: 5분 (캐시용, 메모리 절약) */
const COMPLETED_TTL_SECONDS = 300;

interface StreamState {
  sessionId: string;
  content: string;
  status: 'streaming' | 'completed' | 'error';
  lastUpdate: number;
  /** 시퀀스 번호: 데이터 중복/손실 방지를 위한 monotonic counter */
  sequence: number;
  metadata?: {
    agentPath?: string[];
    toolsCalled?: string[];
  };
}

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
// 🔄 Stream State Management (Redis)
// ============================================================================

async function saveStreamState(state: StreamState): Promise<void> {
  if (!isRedisEnabled()) return;

  const redis = getRedisClient();
  if (!redis) return;

  try {
    // 동적 TTL: 스트리밍 중이면 10분, 완료/에러면 5분 (메모리 절약)
    const ttl =
      state.status === 'streaming' ? STREAM_TTL_SECONDS : COMPLETED_TTL_SECONDS;

    await redis.set(
      `${STREAM_KEY_PREFIX}${state.sessionId}`,
      JSON.stringify(state),
      { ex: ttl }
    );
  } catch (e) {
    logger.warn('[Stream] Failed to save state to Redis:', e);
  }
}

async function getStreamState(sessionId: string): Promise<StreamState | null> {
  if (!isRedisEnabled()) return null;

  const redis = getRedisClient();
  if (!redis) return null;

  try {
    const data = await redis.get<string>(`${STREAM_KEY_PREFIX}${sessionId}`);
    return data ? JSON.parse(data) : null;
  } catch (e) {
    logger.warn('[Stream] Failed to get state from Redis:', e);
    return null;
  }
}

// ============================================================================
// 🔁 GET - Resume Stream (재연결 시 부분 결과 반환)
// ============================================================================

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const sessionId = url.searchParams.get('sessionId');

  if (!sessionId) {
    return NextResponse.json({ error: 'sessionId required' }, { status: 400 });
  }

  const state = await getStreamState(sessionId);

  if (!state) {
    // 활성 스트림 없음
    return new Response(null, { status: 204 });
  }

  // 저장된 부분 결과 반환 (sequence 포함)
  return NextResponse.json({
    sessionId: state.sessionId,
    content: state.content,
    status: state.status,
    canResume: state.status === 'streaming',
    sequence: state.sequence,
    metadata: state.metadata,
  });
}

// ============================================================================
// 🌊 POST - SSE Stream Proxy
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
          '⚠️ [SupervisorStream] Invalid payload:',
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
        `stream_${Date.now()}`;

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
        `🌊 [SupervisorStream] Query: "${userQuery.slice(0, 50)}..."`
      );
      logger.info(`📡 [SupervisorStream] Session: ${sessionId}`);

      // 4. Normalize and compress messages
      const normalizedMessages = normalizeMessagesForCloudRun(messages);
      let messagesToSend = normalizedMessages;

      if (shouldCompress(normalizedMessages.length, 4)) {
        const compression = compressContext(normalizedMessages, {
          keepRecentCount: 3,
          maxTotalMessages: 6,
          maxCharsPerMessage: 800,
        });
        messagesToSend = compression.messages;
        logger.info(
          `🗜️ [SupervisorStream] Context compressed: ${compression.originalCount} → ${compression.compressedCount}`
        );
      }

      // 5. Get Cloud Run URL
      const cloudRunUrl = process.env.CLOUD_RUN_AI_ENGINE_URL;
      if (!cloudRunUrl) {
        logger.error(
          '❌ [SupervisorStream] CLOUD_RUN_AI_ENGINE_URL not configured'
        );
        return NextResponse.json(
          { success: false, error: 'Streaming not available' },
          { status: 503 }
        );
      }

      // 6. Initialize stream state in Redis
      let currentSequence = 0;
      const initialState: StreamState = {
        sessionId,
        content: '',
        status: 'streaming',
        lastUpdate: Date.now(),
        sequence: currentSequence,
        metadata: { agentPath: [], toolsCalled: [] },
      };
      await saveStreamState(initialState);

      // 7. Proxy SSE stream from Cloud Run
      const apiSecret = process.env.CLOUD_RUN_API_SECRET;
      const streamUrl = `${cloudRunUrl}/api/ai/supervisor/stream`;

      logger.info(`🔗 [SupervisorStream] Connecting to: ${streamUrl}`);

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 55000); // 55초 타임아웃 (Vercel 60초 전 안전 마진)

      try {
        const cloudRunResponse = await fetch(streamUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'text/event-stream',
            ...(apiSecret && { 'X-API-Key': apiSecret }),
          },
          body: JSON.stringify({
            messages: messagesToSend,
            sessionId,
          }),
          signal: controller.signal,
        });

        clearTimeout(timeout);

        if (!cloudRunResponse.ok) {
          const errorText = await cloudRunResponse.text();
          logger.error(
            `❌ [SupervisorStream] Cloud Run error: ${cloudRunResponse.status} - ${errorText}`
          );

          // 에러 상태 저장
          currentSequence++;
          await saveStreamState({
            ...initialState,
            status: 'error',
            content: `Error: ${cloudRunResponse.status}`,
            sequence: currentSequence,
          });

          return NextResponse.json(
            {
              success: false,
              error: `Stream error: ${cloudRunResponse.status}`,
            },
            { status: cloudRunResponse.status }
          );
        }

        // 8. Create streaming response with Redis state saving
        const encoder = new TextEncoder();
        const decoder = new TextDecoder();

        const reader = cloudRunResponse.body?.getReader();
        if (!reader) {
          return NextResponse.json(
            { success: false, error: 'No response body' },
            { status: 500 }
          );
        }

        let buffer = '';
        let accumulatedContent = '';
        let lastSaveTime = Date.now();
        const SAVE_INTERVAL_MS = 2000; // 2초마다 Redis에 저장

        const stream = new ReadableStream({
          async pull(streamController) {
            try {
              const { done, value } = await reader.read();

              if (done) {
                // 완료 시 최종 상태 저장
                currentSequence++;
                await saveStreamState({
                  sessionId,
                  content: accumulatedContent,
                  status: 'completed',
                  lastUpdate: Date.now(),
                  sequence: currentSequence,
                  metadata: initialState.metadata,
                });

                if (buffer) {
                  processBuffer(buffer, streamController, encoder);
                }
                streamController.close();
                return;
              }

              const chunk = decoder.decode(value, { stream: true });
              buffer += chunk;

              const lines = buffer.split('\n');
              buffer = lines.pop() || '';

              for (const line of lines) {
                if (line.startsWith('data:')) {
                  try {
                    const jsonStr = line.slice(5).trim();
                    if (!jsonStr) continue;

                    const event = JSON.parse(jsonStr);

                    if (event.type === 'text_delta' && event.data) {
                      streamController.enqueue(encoder.encode(event.data));
                      accumulatedContent += event.data;
                    }

                    if (event.type === 'handoff' && event.data) {
                      const { from, to, reason } = event.data;
                      const handoffMsg = `\n\n🔄 **${from}** → **${to}**${reason ? `: ${reason}` : ''}\n\n`;
                      streamController.enqueue(encoder.encode(handoffMsg));
                      accumulatedContent += handoffMsg;

                      // Agent path 추적
                      initialState.metadata?.agentPath?.push(to);
                    }

                    if (event.type === 'tool_call' && event.data?.toolName) {
                      initialState.metadata?.toolsCalled?.push(
                        event.data.toolName
                      );
                    }

                    if (event.type === 'error') {
                      const errorMsg =
                        typeof event.data?.message === 'string'
                          ? event.data.message
                          : 'Stream error';
                      logger.error(`❌ [SupervisorStream] Error: ${errorMsg}`);

                      currentSequence++;
                      await saveStreamState({
                        sessionId,
                        content: accumulatedContent,
                        status: 'error',
                        lastUpdate: Date.now(),
                        sequence: currentSequence,
                      });

                      streamController.enqueue(
                        encoder.encode(`\n\n${STREAM_ERROR_MARKER} ${errorMsg}`)
                      );
                      streamController.close();
                      return;
                    }
                  } catch {
                    // Ignore parse errors
                  }
                }
              }

              // 주기적으로 Redis에 상태 저장 (백업)
              const now = Date.now();
              if (now - lastSaveTime > SAVE_INTERVAL_MS) {
                currentSequence++;
                await saveStreamState({
                  sessionId,
                  content: accumulatedContent,
                  status: 'streaming',
                  lastUpdate: now,
                  sequence: currentSequence,
                  metadata: initialState.metadata,
                });
                lastSaveTime = now;
              }
            } catch (error) {
              logger.error('❌ [SupervisorStream] Stream error:', error);
              streamController.error(error);
            }
          },

          cancel() {
            reader.cancel();
          },
        });

        logger.info(`✅ [SupervisorStream] Stream started`);

        return new NextResponse(stream, {
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Cache-Control': 'no-cache',
            'X-Session-Id': sessionId,
            'X-Backend': 'cloud-run-stream',
            'X-Resumable': 'true',
          },
        });
      } catch (error) {
        clearTimeout(timeout);

        if (error instanceof Error && error.name === 'AbortError') {
          logger.error('❌ [SupervisorStream] Request timeout');

          // 타임아웃 시 부분 결과 저장
          currentSequence++;
          await saveStreamState({
            sessionId,
            content: 'Request timed out',
            status: 'error',
            lastUpdate: Date.now(),
            sequence: currentSequence,
          });

          return NextResponse.json(
            { success: false, error: 'Stream timeout', sessionId },
            { status: 504 }
          );
        }

        throw error;
      }
    } catch (error) {
      logger.error('❌ [SupervisorStream] Error:', error);
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

// Helper function to process remaining buffer
function processBuffer(
  buffer: string,
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder
) {
  const lines = buffer.split('\n');
  for (const line of lines) {
    if (line.startsWith('data:')) {
      try {
        const jsonStr = line.slice(5).trim();
        if (!jsonStr) continue;
        const event = JSON.parse(jsonStr);
        if (event.type === 'text_delta' && event.data) {
          controller.enqueue(encoder.encode(event.data));
        }
      } catch {
        // Ignore parse errors
      }
    }
  }
}
