/**
 * Supervisor Error Handler
 *
 * supervisor/route.ts에서 분리된 에러 분류 및 응답 로직
 *
 * @created 2026-02-01 (route.ts SRP 분리)
 */

import { NextResponse } from 'next/server';
import { logger } from '@/lib/logging';

/**
 * Supervisor 에러를 분류하고 적절한 HTTP 응답 생성
 */
export function handleSupervisorError(error: unknown): NextResponse {
  logger.error('❌ AI 스트리밍 처리 실패:', error);

  if (error instanceof Error) {
    logger.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack?.slice(0, 500),
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
        },
        {
          status: 503,
          headers: { 'Retry-After': retryAfter },
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
