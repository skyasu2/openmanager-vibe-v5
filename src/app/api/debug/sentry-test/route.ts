/**
 * Sentry Test Endpoint
 *
 * 테스트용 에러를 발생시켜 Sentry 연동 확인
 * Production에서만 실제 에러 전송
 */

import * as Sentry from '@sentry/nextjs';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const action = url.searchParams.get('action') || 'info';

  // 상태 정보
  if (action === 'info') {
    return NextResponse.json({
      status: 'ok',
      sentry: {
        enabled: process.env.NODE_ENV === 'production',
        dsn: process.env.SENTRY_DSN ? 'configured' : 'missing',
        environment: process.env.NODE_ENV,
      },
      timestamp: new Date().toISOString(),
    });
  }

  // 테스트 에러 발생
  if (action === 'error') {
    try {
      // 의도적 에러 발생
      throw new Error('Sentry Test Error - 테스트용 에러입니다');
    } catch (error) {
      // Sentry에 에러 전송
      Sentry.captureException(error, {
        tags: {
          type: 'test',
          endpoint: '/api/debug/sentry-test',
        },
        extra: {
          triggered_at: new Date().toISOString(),
          user_agent: request.headers.get('user-agent'),
        },
      });

      // Sentry에 이벤트 플러시
      await Sentry.flush(2000);

      return NextResponse.json({
        status: 'error_sent',
        message: 'Test error captured and sent to Sentry',
        timestamp: new Date().toISOString(),
      });
    }
  }

  // 테스트 메시지 전송
  if (action === 'message') {
    Sentry.captureMessage('Sentry Test Message - 연결 테스트', {
      level: 'info',
      tags: { type: 'test' },
    });

    await Sentry.flush(2000);

    return NextResponse.json({
      status: 'message_sent',
      message: 'Test message sent to Sentry',
      timestamp: new Date().toISOString(),
    });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
