/**
 * Cloud Run AI Supervisor Stream Proxy
 *
 * @endpoint POST /api/ai/supervisor/stream
 *
 * Real-time SSE streaming from Cloud Run to Frontend.
 * Supports Server-Sent Events (SSE) for token-by-token streaming.
 *
 * @created 2026-01-09
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
  compressContext,
  shouldCompress,
} from '@/lib/ai/utils/context-compressor';
import {
  extractLastUserQuery,
  type HybridMessage,
  normalizeMessagesForCloudRun,
} from '@/lib/ai/utils/message-normalizer';
import { analyzeQueryComplexity } from '@/lib/ai/utils/query-complexity';
import { withAuth } from '@/lib/auth/api-auth';
import { logger } from '@/lib/logging';
import { rateLimiters, withRateLimit } from '@/lib/security/rate-limiter';
import { quickSanitize } from '../security';

// Allow streaming responses up to 60 seconds (Vercel Hobby: max 60s)
export const maxDuration = 60;

// ============================================================================
// 🛡️ Backpressure Configuration
// ============================================================================

/** Maximum buffer size before triggering overflow protection (64KB) */
const MAX_BUFFER_SIZE = 64 * 1024;

/** Warning threshold for buffer size (48KB) */
const BUFFER_WARNING_THRESHOLD = 48 * 1024;

// ============================================================================
// 📋 Request Schema
// ============================================================================

const textPartSchema = z.object({
  type: z.literal('text'),
  text: z.string(),
});

// AI SDK v5 호환: 알려진 타입 + unknown 타입 모두 허용
// discriminatedUnion 대신 union 사용하여 유연성 확보
const partSchema = z.union([
  textPartSchema,
  z.object({ type: z.literal('tool-invocation') }).passthrough(),
  z.object({ type: z.literal('tool-result') }).passthrough(),
  z.object({ type: z.literal('file') }).passthrough(),
  z.object({ type: z.literal('reasoning') }).passthrough(),
  z.object({ type: z.literal('source') }).passthrough(),
  z.object({ type: z.literal('step-start') }).passthrough(),
  z.object({ type: z.literal('step-finish') }).passthrough(),
  // Fallback: 알 수 없는 타입도 허용 (AI SDK 업데이트 대응)
  z
    .object({ type: z.string() })
    .passthrough(),
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
// 🌊 SSE Stream Proxy
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

      // 3. Extract and sanitize query (consistent with /supervisor endpoint)
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

      // 3.5. 복잡도 기반 Job Queue 리다이렉트 (2026-01-18 추가)
      // very_complex 쿼리는 스트리밍 대신 Job Queue 사용 권장
      const complexity = analyzeQueryComplexity(userQuery);
      const shouldUseJobQueue =
        complexity.level === 'very_complex' ||
        (complexity.level === 'complex' &&
          /보고서|리포트|근본.*원인|장애.*분석/i.test(userQuery));

      if (shouldUseJobQueue) {
        logger.info(
          `🔀 [SupervisorStream] Redirecting to Job Queue (complexity: ${complexity.level})`
        );
        // SSE 형식으로 redirect 이벤트 전송 (클라이언트에서 처리)
        const encoder = new TextEncoder();
        const redirectEvent = JSON.stringify({
          type: 'redirect',
          data: {
            mode: 'job-queue',
            complexity: complexity.level,
            estimatedTime: Math.round(complexity.recommendedTimeout / 1000),
            message: '복잡한 분석 요청입니다. 비동기 처리로 전환합니다.',
          },
        });
        const stream = new ReadableStream({
          start(controller) {
            controller.enqueue(encoder.encode(`data: ${redirectEvent}\n\n`));
            controller.close();
          },
        });
        return new NextResponse(stream, {
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'X-Session-Id': sessionId,
            'X-Redirect-Mode': 'job-queue',
          },
        });
      }

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

      // 6. Proxy SSE stream from Cloud Run
      const apiSecret = process.env.CLOUD_RUN_API_SECRET;
      const streamUrl = `${cloudRunUrl}/api/ai/supervisor/stream`;

      logger.info(`🔗 [SupervisorStream] Connecting to: ${streamUrl}`);

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 120000);

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
          return NextResponse.json(
            {
              success: false,
              error: `Stream error: ${cloudRunResponse.status}`,
            },
            { status: cloudRunResponse.status }
          );
        }

        // 7. Create a readable stream that transforms SSE events to plain text
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
        let totalBufferSize = 0;
        let backpressureWarned = false;

        const stream = new ReadableStream({
          async pull(controller) {
            try {
              const { done, value } = await reader.read();

              // Backpressure: Check buffer size before processing
              if (totalBufferSize > MAX_BUFFER_SIZE) {
                logger.warn(
                  `⚠️ [SupervisorStream] Buffer overflow protection triggered (${Math.round(totalBufferSize / 1024)}KB)`
                );
                controller.enqueue(
                  encoder.encode(
                    '\n\n⚠️ 스트림 버퍼 초과. 연결을 재시도해 주세요.\n'
                  )
                );
                controller.close();
                reader.cancel();
                return;
              }

              // Backpressure warning at threshold
              if (
                totalBufferSize > BUFFER_WARNING_THRESHOLD &&
                !backpressureWarned
              ) {
                logger.warn(
                  `⚠️ [SupervisorStream] Buffer approaching limit (${Math.round(totalBufferSize / 1024)}KB)`
                );
                backpressureWarned = true;
              }

              if (done) {
                // Process any remaining buffer
                if (buffer) {
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
                        // Handle handoff in remaining buffer
                        if (event.type === 'handoff' && event.data) {
                          const { from, to, reason } = event.data as {
                            from: string;
                            to: string;
                            reason?: string;
                          };
                          const handoffMsg = `\n\n🔄 **${from}** → **${to}**${reason ? `: ${reason}` : ''}\n\n`;
                          controller.enqueue(encoder.encode(handoffMsg));
                        }
                        if (event.type === 'error') {
                          const errorMsg =
                            typeof event.data?.message === 'string'
                              ? event.data.message
                              : 'Stream error';
                          controller.enqueue(
                            encoder.encode(`\n\n⚠️ 오류: ${errorMsg}`)
                          );
                        }
                      } catch {
                        // Ignore parse errors
                      }
                    }
                  }
                }
                controller.close();
                return;
              }

              // Decode chunk and add to buffer
              const chunk = decoder.decode(value, { stream: true });
              buffer += chunk;
              totalBufferSize += chunk.length;

              // Process complete lines
              const lines = buffer.split('\n');
              buffer = lines.pop() || ''; // Keep incomplete line in buffer

              // Update buffer size after processing (buffer now only contains incomplete line)
              totalBufferSize = buffer.length;

              for (const line of lines) {
                if (line.startsWith('data:')) {
                  try {
                    const jsonStr = line.slice(5).trim();
                    if (!jsonStr) continue;

                    const event = JSON.parse(jsonStr);

                    // Handle text_delta: pass through content for streaming
                    if (event.type === 'text_delta' && event.data) {
                      controller.enqueue(encoder.encode(event.data));
                    }

                    // Handle handoff: show agent transition in stream
                    if (event.type === 'handoff' && event.data) {
                      const { from, to, reason } = event.data as {
                        from: string;
                        to: string;
                        reason?: string;
                      };
                      const handoffMsg = `\n\n🔄 **${from}** → **${to}**${reason ? `: ${reason}` : ''}\n\n`;
                      controller.enqueue(encoder.encode(handoffMsg));
                      logger.info(
                        `🔄 [SupervisorStream] Handoff: ${from} → ${to}`
                      );
                    }

                    // Handle agent_status: show agent activity indicator
                    if (event.type === 'agent_status' && event.data) {
                      const { agent, status } = event.data as {
                        agent: string;
                        status: 'thinking' | 'processing' | 'complete';
                      };
                      // Only show thinking/processing status as inline indicator
                      if (status === 'thinking' || status === 'processing') {
                        const statusEmoji = status === 'thinking' ? '🤔' : '⚙️';
                        const statusMsg = `${statusEmoji} *${agent}*... `;
                        controller.enqueue(encoder.encode(statusMsg));
                      }
                    }

                    // Handle error: forward error message and close stream
                    if (event.type === 'error') {
                      const errorMsg =
                        typeof event.data?.message === 'string'
                          ? event.data.message
                          : 'Stream error';
                      logger.error(
                        `❌ [SupervisorStream] Cloud Run error: ${errorMsg}`
                      );
                      controller.enqueue(
                        encoder.encode(`\n\n⚠️ 오류: ${errorMsg}`)
                      );
                      controller.close();
                      return;
                    }
                  } catch {
                    // Ignore parse errors for malformed lines
                  }
                }
              }
            } catch (error) {
              logger.error('❌ [SupervisorStream] Stream error:', error);
              controller.error(error);
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
          },
        });
      } catch (error) {
        clearTimeout(timeout);

        if (error instanceof Error && error.name === 'AbortError') {
          logger.error('❌ [SupervisorStream] Request timeout');
          return NextResponse.json(
            { success: false, error: 'Stream timeout' },
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
