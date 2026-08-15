/**
 * Supervisor Stream V2 — Cloud Run 업스트림 fetch 파이프라인
 *
 * `route.ts` POST 핸들러에서 "서킷브레이커 + fetch + 재시도 + 업스트림 상태 분기"
 * 책임만 분리한 모듈이다. 동작은 추출 이전과 동일하다:
 * - attemptTimeouts 순서대로 재시도 (retryable status / abort·timeout / 기타 실패)
 * - 보안 정책 차단(400 + prompt_injection)은 terminal 응답으로 종결
 * - 비재시도 오류는 terminal 오류 응답, 재시도 소진은 서킷브레이커 fallback
 */

import { TRACEPARENT_HEADER } from '@/config/ai-proxy.config';
import {
  type ExecutionResult,
  executeWithCircuitBreakerAndFallback,
} from '@/lib/ai/circuit-breaker';
import { createCloudRunAuthHeaders } from '@/lib/ai-proxy/cloud-run-auth';
import { logger } from '@/lib/logging';
import {
  createStreamErrorResponse,
  createStreamPolicyBlockResponse,
} from './route-utils';
import type { StreamTerminalCategory } from './stream-response-builder';
import { fetchWithResponseHeaderTimeout } from './stream-timeouts';

const STREAM_CIRCUIT_BREAKER_SERVICE = 'cloud-run-supervisor-stream';

export type CloudRunStreamFetchResult =
  | { type: 'upstream'; response: Response }
  | {
      type: 'terminal';
      /** 종결 분류 — 호출부가 표기 일관성을 유지한 채 로깅할 수 있게 함께 전달한다 */
      category: Extract<
        StreamTerminalCategory,
        'upstream_policy_blocked' | 'upstream_error' | 'upstream_fallback'
      >;
      response: Response;
    };

export interface CloudRunStreamFetchOutcome {
  /** 서킷브레이커 실행 결과 (source: 'primary' | 'fallback') */
  result: ExecutionResult<CloudRunStreamFetchResult>;
  /** fallback 응답에 기록된 사유 (로깅용) */
  fallbackReason: string;
}

export interface StreamUpstreamTraceContext {
  enabled: boolean;
  traceId: string;
  traceIdHeader: string;
  traceparent: string;
}

function isSecurityPolicyBlockResponse(
  status: number,
  errorText: string
): boolean {
  if (status !== 400) return false;
  if (!errorText.trim()) return false;

  const lowerText = errorText.toLowerCase();
  if (
    lowerText.includes('prompt_injection') ||
    lowerText.includes('security: blocked input')
  ) {
    return true;
  }

  try {
    const parsed = JSON.parse(errorText) as unknown;
    if (!parsed || typeof parsed !== 'object') return false;
    const record = parsed as Record<string, unknown>;
    return [record.error, record.code, record.message].some(
      (value) =>
        typeof value === 'string' &&
        /prompt_injection|security:\s*blocked input/i.test(value)
    );
  } catch {
    return false;
  }
}

export async function executeCloudRunStreamFetch(params: {
  streamUrl: string;
  apiSecret: string;
  attemptTimeouts: number[];
  /** 업스트림 전송 body (필드 구성은 호출부가 소유) */
  upstreamBody: Record<string, unknown>;
  rateLimitIdentityHeaders: Record<string, string>;
  traceContext: StreamUpstreamTraceContext;
  signal: AbortSignal;
  createFallbackStreamResponse: (reason: string) => Response;
}): Promise<CloudRunStreamFetchOutcome> {
  const {
    streamUrl,
    apiSecret,
    attemptTimeouts,
    upstreamBody,
    rateLimitIdentityHeaders,
    traceContext,
    signal,
    createFallbackStreamResponse,
  } = params;

  let fallbackReason = 'circuit_breaker_open';

  const result =
    await executeWithCircuitBreakerAndFallback<CloudRunStreamFetchResult>(
      STREAM_CIRCUIT_BREAKER_SERVICE,
      async () => {
        for (const [i, timeoutMs] of attemptTimeouts.entries()) {
          const attempt = i + 1;
          const hasNextAttempt = i < attemptTimeouts.length - 1;

          try {
            logger.info(
              `[SupervisorStreamV2] Cloud Run attempt ${attempt}/${attemptTimeouts.length} (timeout=${timeoutMs}ms)`
            );
            const response = await fetchWithResponseHeaderTimeout(
              streamUrl,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Accept: 'text/event-stream',
                  ...(await createCloudRunAuthHeaders({
                    apiSecret,
                    serviceUrl: streamUrl,
                  })),
                  ...rateLimitIdentityHeaders,
                  ...(traceContext.enabled
                    ? {
                        [TRACEPARENT_HEADER]: traceContext.traceparent,
                        [traceContext.traceIdHeader]: traceContext.traceId,
                      }
                    : {}),
                },
                body: JSON.stringify(upstreamBody),
                signal,
              },
              timeoutMs
            );

            if (response.ok) {
              return { type: 'upstream', response };
            }

            const errorText = await response.text();
            const status = response.status;
            const isRetryableStatus =
              status >= 500 || status === 408 || status === 504;

            logger.error(
              `❌ [SupervisorStreamV2] Cloud Run error (attempt ${attempt}): ${status} - ${errorText}`
            );

            if (isSecurityPolicyBlockResponse(status, errorText)) {
              return {
                type: 'terminal',
                category: 'upstream_policy_blocked',
                response: createStreamPolicyBlockResponse(),
              };
            }

            if (isRetryableStatus && hasNextAttempt) {
              logger.warn(
                `[SupervisorStreamV2] Retrying after upstream ${status} (attempt ${attempt + 1}/${attemptTimeouts.length})`
              );
              continue;
            }

            if (isRetryableStatus) {
              fallbackReason = `cloud_run_${status}`;
              throw new Error(
                `Cloud Run retryable status ${status}: ${errorText}`
              );
            }

            return {
              type: 'terminal',
              category: 'upstream_error',
              response: createStreamErrorResponse(
                `AI 엔진 오류 (${status}). 잠시 후 다시 시도해주세요.`
              ),
            };
          } catch (error) {
            if (
              error instanceof Error &&
              error.message.startsWith('Cloud Run retryable status')
            ) {
              throw error;
            }

            // AbortError: caller disconnect | TimeoutError: response header timeout
            const isAbortError =
              error instanceof Error &&
              (error.name === 'AbortError' || error.name === 'TimeoutError');

            if (isAbortError && hasNextAttempt) {
              logger.warn(
                `[SupervisorStreamV2] Attempt ${attempt} timeout; retrying (${attempt + 1}/${attemptTimeouts.length})`
              );
              continue;
            }

            if (!isAbortError && hasNextAttempt) {
              logger.warn(
                `[SupervisorStreamV2] Attempt ${attempt} failed; retrying (${attempt + 1}/${attemptTimeouts.length})`
              );
              continue;
            }

            if (isAbortError) {
              logger.error(
                '❌ [SupervisorStreamV2] Request timeout, using fallback'
              );
              fallbackReason = 'cloud_run_timeout';
              throw error;
            }

            logger.error(
              '❌ [SupervisorStreamV2] Upstream fetch failed, using fallback'
            );
            fallbackReason = 'cloud_run_fetch_failed';
            throw error;
          }
        }

        fallbackReason = 'cloud_run_unavailable';
        throw new Error('No Cloud Run response after retries');
      },
      async () => ({
        type: 'terminal',
        category: 'upstream_fallback',
        response: createFallbackStreamResponse(fallbackReason),
      })
    );

  return { result, fallbackReason };
}
