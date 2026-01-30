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
 * Changes (2026-01-10 v5.85.0):
 * - Refactored: schemas.ts, cache-utils.ts 분리
 *
 * Changes (2025-12-22 v5.83.9):
 * - Added normalizeMessagesForCloudRun(): AI SDK v5 parts[] → Cloud Run content 변환
 * - Added sessionId query parameter 지원 (TextStreamChatTransport 호환)
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getMaxTimeout, getMinTimeout } from '@/config/ai-proxy.config';
import {
  type AIEndpoint,
  getAICache,
  setAICache,
} from '@/lib/ai/cache/ai-response-cache';
import { executeWithCircuitBreakerAndFallback } from '@/lib/ai/circuit-breaker';
import { createFallbackResponse } from '@/lib/ai/fallback/ai-fallback-handler';
import {
  compressContext,
  shouldCompress,
} from '@/lib/ai/utils/context-compressor';
import {
  extractLastUserQuery,
  type HybridMessage,
  normalizeMessagesForCloudRun,
} from '@/lib/ai/utils/message-normalizer';
import {
  analyzeQueryComplexity,
  calculateDynamicTimeout,
} from '@/lib/ai/utils/query-complexity';
import { isCloudRunEnabled, proxyToCloudRun } from '@/lib/ai-proxy/proxy';
import { withAuth } from '@/lib/auth/api-auth';
import { logger } from '@/lib/logging';
import { rateLimiters, withRateLimit } from '@/lib/security/rate-limiter';
import { isStatusQuery, shouldSkipCache } from './cache-utils';
import { cloudRunResponseSchema, requestSchema } from './schemas';
import { securityCheck } from './security';

// ============================================================================
// ⚡ maxDuration - Vercel 빌드 타임 상수
// ============================================================================
// Next.js가 정적 분석하므로 리터럴 값 필수. 티어 변경 시 아래 값 수동 변경:
// - Free tier:  export const maxDuration = 10;
// - Pro tier:   export const maxDuration = 60;
// @see src/config/ai-proxy.config.ts (런타임 타임아웃 설정)
// ============================================================================
export const maxDuration = 10; // 🔧 현재: Free tier

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
        logger.warn(
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

      // 🛡️ Prompt Injection 방어 (securityCheck 업그레이드)
      const { sanitizedInput, shouldBlock, inputCheck } =
        securityCheck(rawQuery);
      if (shouldBlock) {
        logger.warn(
          `🛡️ [Supervisor] Blocked injection attempt: ${inputCheck.patterns.join(', ')}`
        );
        return NextResponse.json(
          {
            success: false,
            error: 'Security: blocked input',
            message: '보안 정책에 의해 차단된 요청입니다.',
          },
          { status: 400 }
        );
      }
      const userQuery = sanitizedInput;

      // 2. 세션 ID 생성/사용
      const sessionId = clientSessionId || `session_${Date.now()}`;

      // 3. 동적 타임아웃 계산 (티어별 자동 조정)
      const dynamicTimeout = calculateDynamicTimeout(userQuery, {
        messageCount: messages.length,
        minTimeout: getMinTimeout('supervisor'),
        maxTimeout: getMaxTimeout('supervisor'),
      });

      logger.info(`🚀 [Supervisor] Query: "${userQuery.slice(0, 50)}..."`);
      logger.info(`📡 [Supervisor] Session: ${sessionId}`);
      logger.info(`⏱️ [Supervisor] Dynamic timeout: ${dynamicTimeout}ms`);

      // ====================================================================
      // 3.5. 복잡도 기반 Job Queue 리다이렉트 (2026-01-18 추가)
      // ====================================================================
      // very_complex 쿼리 또는 보고서 생성 요청은 Job Queue로 전환
      // 202 Accepted 응답으로 클라이언트에게 비동기 처리 알림
      // ====================================================================
      const complexity = analyzeQueryComplexity(userQuery);
      const shouldUseJobQueue =
        complexity.level === 'very_complex' ||
        (complexity.level === 'complex' &&
          /보고서|리포트|근본.*원인|장애.*분석/i.test(userQuery));

      if (shouldUseJobQueue) {
        logger.info(
          `🔀 [Supervisor] Redirecting to Job Queue (complexity: ${complexity.level})`
        );
        return NextResponse.json(
          {
            success: true,
            redirect: 'job-queue',
            complexity: complexity.level,
            estimatedTime: Math.round(complexity.recommendedTimeout / 1000),
            message: '복잡한 분석 요청입니다. 비동기 처리로 전환합니다.',
          },
          {
            status: 202, // Accepted
            headers: {
              'X-Session-Id': sessionId,
              'X-Redirect-Mode': 'job-queue',
            },
          }
        );
      }

      // ====================================================================
      // 3. 캐시 조회 (2026-01-08 v5.85.0 추가)
      // ====================================================================
      const skipCache = shouldSkipCache(userQuery, messages.length);
      const cacheEndpoint: AIEndpoint = isStatusQuery(userQuery)
        ? 'supervisor-status'
        : 'supervisor';

      if (!skipCache) {
        const cacheResult = await getAICache(
          sessionId,
          userQuery,
          cacheEndpoint
        );
        if (cacheResult.hit && cacheResult.data?.response) {
          logger.info(
            `📦 [Supervisor] Cache HIT (${cacheResult.source}, ${cacheResult.latencyMs}ms)`
          );
          // Accept 헤더에 따라 응답 형식 결정
          const acceptHeader = req.headers.get('accept') || '';
          const wantsJsonOnly = acceptHeader === 'application/json';

          if (wantsJsonOnly) {
            return NextResponse.json(
              { ...cacheResult.data, _cached: true },
              { headers: { 'X-Session-Id': sessionId, 'X-Cache': 'HIT' } }
            );
          }
          return new NextResponse(cacheResult.data.response, {
            headers: {
              'Content-Type': 'text/plain; charset=utf-8',
              'Cache-Control': 'no-cache',
              'X-Session-Id': sessionId,
              'X-Cache': 'HIT',
              'X-Backend': 'cache',
            },
          });
        }
        logger.info(`📦 [Supervisor] Cache MISS`);
      } else {
        logger.info(`📦 [Supervisor] Cache SKIP (context or realtime query)`);
      }

      // 4. 스트리밍 요청 여부 확인
      // AI SDK v5 DefaultChatTransport는 */* 또는 다양한 Accept 헤더를 보냄
      // supervisor 엔드포인트는 기본적으로 스트리밍 활성화
      // 명시적으로 application/json만 요청하는 경우에만 JSON 응답
      const acceptHeaderFinal = req.headers.get('accept') || '';
      const wantsJsonOnly = acceptHeaderFinal === 'application/json';
      const wantsStream = !wantsJsonOnly;

      // 4. Cloud Run 프록시 모드 (Primary - CLOUD_RUN_ENABLED=true)
      if (isCloudRunEnabled()) {
        logger.info('☁️ [Supervisor] Using Cloud Run backend');

        // AI SDK v5 parts 형식 → Cloud Run content 형식으로 정규화
        const normalizedMessages = normalizeMessagesForCloudRun(messages);

        // ====================================================================
        // 5. 컨텍스트 압축 (2026-01-08 v5.85.0 추가)
        // ====================================================================
        // 메시지가 많을 경우 토큰 절감을 위해 압축
        let messagesToSend = normalizedMessages;
        if (shouldCompress(normalizedMessages.length, 4)) {
          const compression = compressContext(normalizedMessages, {
            keepRecentCount: 3,
            maxTotalMessages: 6,
            maxCharsPerMessage: 800,
          });
          messagesToSend = compression.messages;
          logger.info(
            `🗜️ [Supervisor] Context compressed: ${compression.originalCount} → ${compression.compressedCount} messages (${compression.compressionRatio}% saved)`
          );
        }

        logger.info(
          `📝 [Supervisor] Normalized ${messages.length} messages → ${messagesToSend.length} for Cloud Run`
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
                body: { messages: messagesToSend, sessionId },
                timeout: dynamicTimeout,
              });

              if (!proxyResult.success || !proxyResult.data) {
                throw new Error(
                  proxyResult.error ?? 'Cloud Run request failed'
                );
              }

              // 🔧 Zod 검증으로 타입 단언 제거 (2026-01-28)
              const parseResult = cloudRunResponseSchema.safeParse(
                proxyResult.data
              );

              if (!parseResult.success) {
                throw new Error(
                  `Invalid Cloud Run response: ${parseResult.error.message}`
                );
              }

              const data = parseResult.data;

              if (data.success && data.response) {
                // ================================================================
                // 🔧 TextStreamChatTransport용 일반 텍스트 응답
                // useChat + TextStreamChatTransport는 plain text를 기대함
                // @see https://ai-sdk.dev/docs/ai-sdk-ui/stream-protocol
                // ================================================================

                // 캐시 저장 (비동기, 응답 지연 없음)
                if (!skipCache) {
                  setAICache(
                    sessionId,
                    userQuery,
                    {
                      success: true,
                      response: data.response,
                      source: 'cloud-run',
                    },
                    cacheEndpoint
                  ).catch((err) =>
                    logger.warn('[Supervisor] Cache set failed:', err)
                  );
                }

                return new NextResponse(data.response, {
                  headers: {
                    'Content-Type': 'text/plain; charset=utf-8',
                    'Cache-Control': 'no-cache',
                    'X-Session-Id': sessionId,
                    'X-Backend': 'cloud-run',
                    'X-Cache': 'MISS',
                  },
                });
              } else if (data.error) {
                // 에러도 텍스트로 반환
                const errorMessage = `⚠️ AI 오류: ${data.error}`;
                return new NextResponse(errorMessage, {
                  headers: {
                    'Content-Type': 'text/plain; charset=utf-8',
                    'X-Session-Id': sessionId,
                    'X-Backend': 'cloud-run',
                  },
                });
              }

              throw new Error('Invalid response from Cloud Run');
            },
            // Fallback: 로컬 폴백 응답 (Plain Text)
            () => {
              const fallback = createFallbackResponse('supervisor', {
                query: userQuery,
              });
              const fallbackText = fallback.data?.response ?? fallback.message;

              return new NextResponse(fallbackText, {
                headers: {
                  'Content-Type': 'text/plain; charset=utf-8',
                  'Cache-Control': 'no-store, no-cache, must-revalidate',
                  'X-Session-Id': sessionId,
                  'X-Backend': 'fallback',
                  'X-Fallback-Response': 'true',
                  'X-Retry-After': '30000',
                },
              });
            }
          );

          // 폴백 사용 시 로깅
          if (result.source === 'fallback') {
            logger.info('⚠️ [Supervisor] Using fallback response (stream mode)');
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
                body: { messages: messagesToSend, sessionId },
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
            logger.info('⚠️ [Supervisor] Using fallback response (json mode)');
            return NextResponse.json(result.data, {
              headers: {
                'Cache-Control': 'no-store, no-cache, must-revalidate',
                'X-Session-Id': sessionId,
                'X-Fallback-Response': 'true',
                'X-Retry-After': '30000',
              },
            });
          }

          // 캐시 저장 (성공 응답만, 비동기)
          if (!skipCache && result.data) {
            const responseData = result.data as {
              success?: boolean;
              response?: string;
            };
            if (responseData.success && responseData.response) {
              setAICache(
                sessionId,
                userQuery,
                {
                  success: true,
                  response: responseData.response,
                  source: 'cloud-run',
                },
                cacheEndpoint
              ).catch((err) =>
                logger.warn('[Supervisor] Cache set failed:', err)
              );
            }
          }

          return NextResponse.json(result.data, {
            headers: { 'X-Session-Id': sessionId, 'X-Cache': 'MISS' },
          });
        }
      }

      // 5. Fallback: Cloud Run 비활성화 시 폴백 응답
      logger.warn('⚠️ [Supervisor] Cloud Run disabled, returning fallback');
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
            'Cache-Control': 'no-store, no-cache, must-revalidate',
            'X-Session-Id': sessionId,
            'Retry-After': '30',
          },
        }
      );
    } catch (error) {
      logger.error('❌ AI 스트리밍 처리 실패:', error);

      // 에러 상세 정보 로깅
      if (error instanceof Error) {
        logger.error('Error details:', {
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
