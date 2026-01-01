/**
 * Cloud Run AI Supervisor Proxy
 *
 * @endpoint POST /api/ai/supervisor
 *
 * Architecture:
 * - Primary: Cloud Run ai-engine (Multi-Agent System)
 * - Fallback: Simple error response
 * - All AI processing handled by Cloud Run
 *
 * Changes (2025-12-22 v5.83.9):
 * - Added normalizeMessagesForCloudRun(): AI SDK v5 parts[] → Cloud Run content 변환
 * - Added sessionId query parameter 지원 (TextStreamChatTransport 호환)
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { executeWithCircuitBreakerAndFallback } from '@/lib/ai/circuit-breaker';
import { createFallbackResponse } from '@/lib/ai/fallback/ai-fallback-handler';
import {
  extractLastUserQuery,
  type HybridMessage,
  normalizeMessagesForCloudRun,
} from '@/lib/ai/utils/message-normalizer';
import { calculateDynamicTimeout } from '@/lib/ai/utils/query-complexity';
import { isCloudRunEnabled, proxyToCloudRun } from '@/lib/ai-proxy/proxy';
import { withAuth } from '@/lib/auth/api-auth';
import { rateLimiters, withRateLimit } from '@/lib/security/rate-limiter';
import { quickSanitize } from './security';

// ============================================================================
// 🔧 Stream Transformer: Vercel Data Stream Protocol → Plain Text
// ============================================================================
// Cloud Run이 반환하는 Data Stream Protocol을 파싱하여 순수 텍스트로 변환
//
// @see https://sdk.vercel.ai/docs/ai-sdk-ui/stream-protocol
// ============================================================================

/**
 * Vercel AI SDK Data Stream Protocol 상수
 *
 * @warning 이 프로토콜은 Vercel AI SDK 버전에 의존합니다.
 *          SDK 업그레이드 시 호환성 확인 필요
 *
 * @see https://sdk.vercel.ai/docs/ai-sdk-ui/stream-protocol
 */
const DATA_STREAM_PREFIXES = {
  TEXT: '0', // 텍스트 콘텐츠 (주요)
  DATA: '2', // JSON 데이터 배열
  ERROR: '3', // 에러 메시지
  ANNOTATION: '8', // 메시지 주석
  FINISH: 'd', // 완료 신호
  START: 'e', // 시작 신호
} as const;

/**
 * Data Stream Protocol 라인 파싱 정규식
 *
 * @pattern ^(prefix):(content)$
 * - prefix: 숫자 또는 알파벳 한 글자
 * - content: JSON 문자열 또는 객체
 *
 * @fragility 이 정규식은 SDK 프로토콜 변경에 취약합니다.
 *            SDK 버전 업그레이드 시 반드시 테스트 필요
 */
const DATA_STREAM_LINE_REGEX = /^([0-9a-z]):(.*)$/;

/**
 * Data Stream Protocol을 Plain Text로 변환하는 TransformStream
 *
 * @description
 * Cloud Run이 반환하는 `0:"텍스트"` 형식을 파싱하여 순수 텍스트만 추출합니다.
 * TextStreamChatTransport와 함께 사용됩니다.
 *
 * @example
 * Input:  0:"Hello "\n0:"World"\nd:{"finishReason":"stop"}
 * Output: Hello World
 *
 * @warning
 * - Vercel AI SDK v5 Data Stream Protocol에 의존
 * - Cloud Run 응답 형식 변경 시 파싱 실패 가능
 * - 장기적으로 SDK의 공식 파서 사용 권장
 */
// NOTE: Reserved for future streaming implementation
function _createDataStreamParserTransform(): TransformStream<
  Uint8Array,
  Uint8Array
> {
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buffer = '';

  /**
   * JSON 문자열 안전하게 파싱
   */
  const safeJsonParse = (str: string): unknown => {
    try {
      return JSON.parse(str);
    } catch {
      return null;
    }
  };

  /**
   * 텍스트 콘텐츠 추출 (prefix: 0)
   */
  const extractTextContent = (content: string): string | null => {
    const parsed = safeJsonParse(content);
    if (typeof parsed === 'string') {
      return parsed;
    }
    // JSON 파싱 실패 시 raw content 반환 (fallback)
    if (content.startsWith('"') && content.endsWith('"')) {
      return content.slice(1, -1);
    }
    return null;
  };

  /**
   * 에러 메시지 추출 (prefix: 3)
   */
  const extractErrorMessage = (content: string): string => {
    const parsed = safeJsonParse(content);

    if (typeof parsed === 'string') {
      // 중첩된 JSON 에러 처리
      const innerParsed = safeJsonParse(parsed);
      if (
        innerParsed &&
        typeof innerParsed === 'object' &&
        'error' in innerParsed
      ) {
        const errorObj = innerParsed as { error?: { message?: string } };
        return errorObj.error?.message || parsed;
      }
      return parsed;
    }

    if (parsed && typeof parsed === 'object' && 'message' in parsed) {
      return (parsed as { message: string }).message;
    }

    return content;
  };

  return new TransformStream({
    transform(chunk, controller) {
      buffer += decoder.decode(chunk, { stream: true });

      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // 마지막 불완전한 라인은 버퍼에 유지

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        const match = trimmed.match(DATA_STREAM_LINE_REGEX);
        if (!match?.[1] || match[2] === undefined) continue;

        const prefix = match[1];
        const content = match[2];

        switch (prefix) {
          case DATA_STREAM_PREFIXES.TEXT: {
            const text = extractTextContent(content);
            if (text) {
              controller.enqueue(encoder.encode(text));
            }
            break;
          }

          case DATA_STREAM_PREFIXES.ERROR: {
            const errorMsg = extractErrorMessage(content);
            controller.enqueue(encoder.encode(`\n\n⚠️ AI 오류: ${errorMsg}`));
            break;
          }

          // DATA, ANNOTATION, FINISH, START: 메타데이터는 무시
          // 필요 시 여기에 추가 처리 로직 구현 가능
        }
      }
    },

    flush(controller) {
      // 버퍼에 남은 불완전한 라인 처리
      if (buffer.trim()) {
        const match = buffer.trim().match(DATA_STREAM_LINE_REGEX);
        if (match?.[1] === DATA_STREAM_PREFIXES.TEXT && match[2]) {
          const text = extractTextContent(match[2]);
          if (text) {
            controller.enqueue(encoder.encode(text));
          }
        }
      }
    },
  });
}

// Allow streaming responses up to 120 seconds (Vercel Pro: max 300s)
// Note: Increased from 60s to handle complex NLQ queries with tool calls
// Supervisor → Agent → Tool → Verifier pipeline can take 60-90s
export const maxDuration = 120;

// ============================================================================
// 📋 Request Schema (Zod Validation)
// ============================================================================

// AI SDK v5 UIMessage 'parts' 포맷
const textPartSchema = z.object({
  type: z.literal('text'),
  text: z.string(),
});

const partSchema = z.discriminatedUnion('type', [
  textPartSchema,
  // 다른 part 타입들 (tool-invocation, tool-result 등)은 무시
  z
    .object({ type: z.literal('tool-invocation') })
    .passthrough(),
  z.object({ type: z.literal('tool-result') }).passthrough(),
  z.object({ type: z.literal('file') }).passthrough(),
  z.object({ type: z.literal('reasoning') }).passthrough(),
]);

// 하이브리드 메시지 스키마: AI SDK v5 (parts) + 레거시 (content) 모두 지원
const messageSchema = z.object({
  id: z.string().optional(),
  role: z.enum(['user', 'assistant', 'system']),
  // AI SDK v5: parts 배열 (UIMessage 포맷)
  parts: z.array(partSchema).optional(),
  // 레거시: content 문자열
  content: z.string().optional(),
  // 추가 메타데이터 허용
  createdAt: z.union([z.string(), z.date()]).optional(),
});

const requestSchema = z.object({
  messages: z.array(messageSchema).min(1).max(50),
  sessionId: z.string().optional(),
});

// ============================================================================
// 🔧 Utility: 메시지 정규화 (중앙화됨)
// ============================================================================
// @see /src/lib/ai/utils/message-normalizer.ts
// - extractTextFromHybridMessage(): 텍스트 추출
// - normalizeMessagesForCloudRun(): Cloud Run 형식 변환
// - extractLastUserQuery(): 마지막 사용자 쿼리 추출
// ============================================================================

// ============================================================================
// 🧠 Main Handler - Cloud Run Multi-Agent System
// ============================================================================

export const POST = withRateLimit(
  rateLimiters.aiAnalysis,
  withAuth(async (req: NextRequest) => {
    try {
      // 1. Zod 스키마 검증
      const body = await req.json();
      const parseResult = requestSchema.safeParse(body);

      if (!parseResult.success) {
        console.warn(
          '⚠️ [Supervisor] Invalid payload:',
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

      // ====================================================================
      // sessionId 추출 (2026-01-01 v5.84.0 개선)
      // ====================================================================
      // AI SDK v5 DefaultChatTransport는 body/headers 모두 지원
      // 우선순위: Header > Body > Query Param (레거시 호환)
      // ====================================================================
      const url = new URL(req.url);
      const headerSessionId = req.headers.get('X-Session-Id');
      const querySessionId = url.searchParams.get('sessionId');
      const clientSessionId =
        headerSessionId || bodySessionId || querySessionId;

      // 2. 마지막 사용자 쿼리 추출 + 입력 정제 (중앙화된 유틸리티 사용)
      const rawQuery =
        extractLastUserQuery(messages as HybridMessage[]) ||
        'System status check';

      // 빈 쿼리 방어
      if (!rawQuery || rawQuery.trim() === '') {
        return NextResponse.json(
          {
            success: false,
            error: 'Empty query',
            message: '쿼리를 입력해주세요.',
          },
          { status: 400 }
        );
      }

      const userQuery = quickSanitize(rawQuery);

      // 2. 세션 ID 생성/사용
      const sessionId = clientSessionId || `session_${Date.now()}`;

      // 3. 동적 타임아웃 계산 (2025-12-30 추가)
      const dynamicTimeout = calculateDynamicTimeout(userQuery, {
        messageCount: messages.length,
        minTimeout: 15000, // 최소 15초
        maxTimeout: 120000, // 최대 120초
      });

      console.log(`🚀 [Supervisor] Query: "${userQuery.slice(0, 50)}..."`);
      console.log(`📡 [Supervisor] Session: ${sessionId}`);
      console.log(`⏱️ [Supervisor] Dynamic timeout: ${dynamicTimeout}ms`);

      // 3. 스트리밍 요청 여부 확인
      // AI SDK v5 DefaultChatTransport는 */* 또는 다양한 Accept 헤더를 보냄
      // supervisor 엔드포인트는 기본적으로 스트리밍 활성화
      // 명시적으로 application/json만 요청하는 경우에만 JSON 응답
      const acceptHeader = req.headers.get('accept') || '';
      const wantsJsonOnly = acceptHeader === 'application/json';
      const wantsStream = !wantsJsonOnly;

      // 4. Cloud Run 프록시 모드 (Primary - CLOUD_RUN_ENABLED=true)
      if (isCloudRunEnabled()) {
        console.log('☁️ [Supervisor] Using Cloud Run backend');

        // AI SDK v5 parts 형식 → Cloud Run content 형식으로 정규화
        const normalizedMessages = normalizeMessagesForCloudRun(messages);
        console.log(
          `📝 [Supervisor] Normalized ${messages.length} messages → ${normalizedMessages.length} for Cloud Run`
        );

        if (wantsStream) {
          // ================================================================
          // 🔧 Cloud Run JSON 응답 처리 (2025-12-30 Circuit Breaker + Fallback)
          // ================================================================
          // Cloud Run은 현재 JSON 응답을 반환함 (스트리밍 미구현)
          // JSON 응답에서 텍스트를 추출하여 plain text로 반환
          // Circuit Breaker + Fallback으로 장애 대응
          // ================================================================
          const result = await executeWithCircuitBreakerAndFallback<
            NextResponse<unknown>
          >(
            'cloud-run-supervisor-stream',
            // Primary: Cloud Run 호출
            async () => {
              const proxyResult = await proxyToCloudRun({
                path: '/api/ai/supervisor',
                body: { messages: normalizedMessages, sessionId },
                timeout: dynamicTimeout,
              });

              if (!proxyResult.success || !proxyResult.data) {
                throw new Error(
                  proxyResult.error ?? 'Cloud Run request failed'
                );
              }

              const data = proxyResult.data as {
                success?: boolean;
                response?: string;
                error?: string;
              };

              if (data.success && data.response) {
                // ================================================================
                // 🔧 Data Stream Protocol 형식으로 변환 (AI SDK v5 호환)
                // useChat 훅이 파싱할 수 있도록 표준 프로토콜 사용
                // @see https://sdk.vercel.ai/docs/ai-sdk-ui/stream-protocol
                // ================================================================
                const dataStreamResponse = [
                  `0:${JSON.stringify(data.response)}`,
                  'd:{"finishReason":"stop","usage":{"promptTokens":0,"completionTokens":0}}',
                  '', // 마지막 줄바꿈
                ].join('\n');

                return new NextResponse(dataStreamResponse, {
                  headers: {
                    'Content-Type': 'text/plain; charset=utf-8',
                    'Cache-Control': 'no-cache',
                    'X-Session-Id': sessionId,
                    'X-Backend': 'cloud-run',
                    'X-Stream-Protocol': 'data-stream-v1',
                  },
                });
              } else if (data.error) {
                // 에러도 Data Stream Protocol 형식으로 반환
                const errorMessage = `⚠️ AI 오류: ${data.error}`;
                const errorStreamResponse = [
                  `0:${JSON.stringify(errorMessage)}`,
                  'd:{"finishReason":"error","usage":{"promptTokens":0,"completionTokens":0}}',
                  '',
                ].join('\n');

                return new NextResponse(errorStreamResponse, {
                  headers: {
                    'Content-Type': 'text/plain; charset=utf-8',
                    'X-Session-Id': sessionId,
                    'X-Backend': 'cloud-run',
                    'X-Stream-Protocol': 'data-stream-v1',
                  },
                });
              }

              throw new Error('Invalid response from Cloud Run');
            },
            // Fallback: 로컬 폴백 응답 (Data Stream Protocol)
            () => {
              const fallback = createFallbackResponse('supervisor', {
                query: userQuery,
              });
              const fallbackText = fallback.data?.response ?? fallback.message;
              const fallbackStreamResponse = [
                `0:${JSON.stringify(fallbackText)}`,
                'd:{"finishReason":"stop","usage":{"promptTokens":0,"completionTokens":0}}',
                '',
              ].join('\n');

              return new NextResponse(fallbackStreamResponse, {
                headers: {
                  'Content-Type': 'text/plain; charset=utf-8',
                  'X-Session-Id': sessionId,
                  'X-Backend': 'fallback',
                  'X-Fallback-Response': 'true',
                  'X-Retry-After': '30000',
                  'X-Stream-Protocol': 'data-stream-v1',
                },
              });
            }
          );

          // 폴백 사용 시 로깅
          if (result.source === 'fallback') {
            console.log('⚠️ [Supervisor] Using fallback response (stream mode)');
          }

          return result.data;
        } else {
          // Cloud Run 단일 응답 프록시 (Circuit Breaker + Fallback)
          const result = await executeWithCircuitBreakerAndFallback<
            Record<string, unknown>
          >(
            'cloud-run-supervisor-json',
            // Primary: Cloud Run 호출
            async () => {
              const proxyResult = await proxyToCloudRun({
                path: '/api/ai/supervisor',
                body: { messages: normalizedMessages, sessionId },
                timeout: dynamicTimeout,
              });

              if (!proxyResult.success || !proxyResult.data) {
                throw new Error(
                  proxyResult.error ?? 'Cloud Run request failed'
                );
              }

              return {
                ...(proxyResult.data as Record<string, unknown>),
                _backend: 'cloud-run',
              };
            },
            // Fallback: 로컬 폴백 응답
            () =>
              ({
                ...createFallbackResponse('supervisor', { query: userQuery }),
                sessionId,
                _backend: 'fallback',
              }) as Record<string, unknown>
          );

          // 폴백 사용 시 헤더 추가
          if (result.source === 'fallback') {
            console.log('⚠️ [Supervisor] Using fallback response (json mode)');
            return NextResponse.json(result.data, {
              headers: {
                'X-Session-Id': sessionId,
                'X-Fallback-Response': 'true',
                'X-Retry-After': '30000',
              },
            });
          }

          return NextResponse.json(result.data, {
            headers: { 'X-Session-Id': sessionId },
          });
        }
      }

      // 5. Fallback: Cloud Run 비활성화 시 폴백 응답
      console.warn('⚠️ [Supervisor] Cloud Run disabled, returning fallback');
      const fallback = createFallbackResponse('supervisor', {
        query: userQuery,
      });

      return NextResponse.json(
        {
          ...fallback,
          sessionId,
          _backend: 'fallback',
        },
        {
          headers: {
            'X-Session-Id': sessionId,
            'Retry-After': '30',
          },
        }
      );
    } catch (error) {
      console.error('❌ AI 스트리밍 처리 실패:', error);

      // 에러 상세 정보 로깅
      if (error instanceof Error) {
        console.error('Error details:', {
          name: error.name,
          message: error.message,
          stack: error.stack?.slice(0, 500),
        });

        // Circuit Breaker 에러 처리
        if (error.message.includes('일시적으로 중단되었습니다')) {
          // Circuit Breaker가 열린 상태 - Retry-After 헤더 추가
          const retryMatch = error.message.match(/(\d+)초 후/);
          const retryAfter = retryMatch?.[1] ?? '60';

          return NextResponse.json(
            {
              success: false,
              error: 'AI service circuit open',
              message: error.message,
              retryAfter: parseInt(retryAfter, 10),
            },
            {
              status: 503,
              headers: {
                'Retry-After': retryAfter,
              },
            }
          );
        }

        // 타임아웃 에러 처리
        if (
          error.message.includes('timeout') ||
          error.message.includes('TIMEOUT')
        ) {
          return NextResponse.json(
            {
              success: false,
              error: 'Request timeout',
              message:
                'AI 분석이 시간 내에 완료되지 않았습니다. 더 간단한 질문으로 시도해주세요.',
            },
            { status: 504 }
          );
        }
      }

      return NextResponse.json(
        {
          success: false,
          error: 'AI processing failed',
          message:
            error instanceof Error ? error.message : 'Unknown error occurred',
        },
        { status: 500 }
      );
    }
  })
);

// ============================================================================
// 📊 Architecture Note
// ============================================================================
//
// All AI agents run on Cloud Run ai-engine:
// - Supervisor (Groq Llama-8b): Intent classification & routing
// - NLQ Agent (Groq Llama-70b): Server metrics queries
// - Analyst Agent (Mistral): Pattern analysis & anomaly detection
// - Reporter Agent (Cerebras): Incident reports & RAG
//
// This proxy forwards all requests to Cloud Run.
//
// ============================================================================
