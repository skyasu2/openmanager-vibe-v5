/**
 * Supervisor Error Handler
 *
 * supervisor/route.ts에서 분리된 에러 분류 및 응답 로직
 *
 * @created 2026-02-01 (route.ts SRP 분리)
 * @updated 2026-02-03 (P1: traceId 파라미터 추가)
 */

import * as Sentry from '@sentry/nextjs';
import { NextResponse } from 'next/server';
import { getObservabilityConfig } from '@/config/ai-proxy.config';
import { logger } from '@/lib/logging';

/**
 * Supervisor 에러를 분류하고 적절한 HTTP 응답 생성
 *
 * @param error - 발생한 에러
 * @param traceId - 요청 추적 ID (선택적)
 */
export function handleSupervisorError(
  error: unknown,
  traceId?: string
): NextResponse {
  const observabilityConfig = getObservabilityConfig();
  const traceInfo = traceId ? ` (trace: ${traceId})` : '';

  logger.error(`❌ AI 스트리밍 처리 실패${traceInfo}:`, error);

  // Sentry에 AI context와 함께 에러 전송
  Sentry.withScope((scope) => {
    scope.setTag('component', 'ai-supervisor');
    if (traceId) scope.setTag('traceId', traceId);
    if (error instanceof Error) {
      const isCircuitOpen = error.message.includes('일시적으로 중단되었습니다');
      const isTimeout =
        error.message.includes('timeout') || error.message.includes('TIMEOUT');
      scope.setTag(
        'ai_error_type',
        isCircuitOpen ? 'circuit_open' : isTimeout ? 'timeout' : 'general'
      );
    }
    scope.setLevel(
      error instanceof Error && error.message.includes('timeout')
        ? 'warning'
        : 'error'
    );
    Sentry.captureException(error);
  });

  // 공통 헤더 생성
  const baseHeaders: Record<string, string> = {};
  if (traceId && observabilityConfig.enableTraceId) {
    baseHeaders[observabilityConfig.traceIdHeader] = traceId;
  }

  if (error instanceof Error) {
    logger.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack?.slice(0, 500),
      traceId,
    });

    // Circuit Breaker Open
    if (error.message.includes('일시적으로 중단되었습니다')) {
      const retryMatch = error.message.match(/(\d+)초 후/);
      const retryAfter = retryMatch?.[1] ?? '60';

      return NextResponse.json(
        {
          success: false,
          error: 'AI service circuit open',
          message: error.message,
          retryAfter: parseInt(retryAfter, 10),
          traceId,
        },
        {
          status: 503,
          headers: { 'Retry-After': retryAfter, ...baseHeaders },
        }
      );
    }

    // Timeout
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
          traceId,
        },
        { status: 504, headers: baseHeaders }
      );
    }
  }

  return NextResponse.json(
    {
      success: false,
      error: 'AI processing failed',
      message:
        error instanceof Error ? error.message : 'Unknown error occurred',
      traceId,
    },
    { status: 500, headers: baseHeaders }
  );
}
