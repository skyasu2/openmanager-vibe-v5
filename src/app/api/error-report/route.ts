import { NextRequest, NextResponse } from 'next/server';
import { generateId } from '@/lib/utils-functions';

interface ErrorReport {
  error: string;
  digest?: string;
  stack?: string;
  timestamp: string;
  page: string;
  userAgent?: string;
  url?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const headers = request.headers;

    // 에러 리포트 데이터 검증
    const errorReport = {
      timestamp: new Date().toISOString(),
      page: body.page || 'unknown',
      error: body.error || 'No error message',
      userAgent: headers.get('user-agent') || 'unknown',
      url: body.url || 'unknown',
      userId: body.userId,
      sessionId: body.sessionId,
      level: body.level || 'error',
      component: body.component,
      action: body.action,
      additionalInfo: body.additionalInfo,
      stack: body.stack,
    };

    console.log('📝 Error Report:', {
      timestamp: errorReport.timestamp,
      page: errorReport.page,
      error: errorReport.error.substring(0, 100),
      userAgent: errorReport.userAgent?.substring(0, 50),
    });

    // 실제 서비스 에러 처리 구현
    try {
      // 1. 데이터베이스에 에러 로그 저장
      const errorLog = {
        id: generateId(),
        timestamp: new Date().toISOString(),
        level: errorReport.level,
        message: errorReport.error,
        stack: errorReport.stack,
        userAgent: errorReport.userAgent,
        url: errorReport.url,
        userId: errorReport.userId,
        sessionId: errorReport.sessionId,
        metadata: {
          component: errorReport.component,
          action: errorReport.action,
          additionalInfo: errorReport.additionalInfo,
        },
      };

      // 로컬 로그 저장 (실제 환경에서는 데이터베이스 연동)
      console.error('🚨 에러 리포트:', errorLog);

      // 2. 심각한 에러의 경우 관리자에게 알림 전송
      if (errorReport.level === 'critical' || errorReport.level === 'error') {
        try {
          // Slack 알림 전송 (환경변수에 웹훅 URL이 있는 경우)
          if (process.env.SLACK_WEBHOOK_URL) {
            await fetch(process.env.SLACK_WEBHOOK_URL, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                text: `🚨 OpenManager 에러 발생`,
                attachments: [
                  {
                    color: 'danger',
                    fields: [
                      {
                        title: '메시지',
                        value: errorReport.error,
                        short: false,
                      },
                      {
                        title: '컴포넌트',
                        value: errorReport.component || 'Unknown',
                        short: true,
                      },
                      {
                        title: '시간',
                        value: new Date().toLocaleString('ko-KR'),
                        short: true,
                      },
                    ],
                  },
                ],
              }),
            });
          }
        } catch (notificationError) {
          console.error('알림 전송 실패:', notificationError);
        }
      }

      // 3. 에러 패턴 분석 (간단한 구현)
      const errorPattern = {
        component: errorReport.component,
        message: errorReport.error,
        frequency: 1,
        lastOccurred: new Date().toISOString(),
      };

      // 실제 환경에서는 Redis나 데이터베이스에 패턴 저장
      console.log('📊 에러 패턴 분석:', errorPattern);

      return NextResponse.json({
        success: true,
        message: '에러 리포트가 성공적으로 저장되었습니다.',
        errorId: errorLog.id,
        timestamp: errorLog.timestamp,
      });
    } catch (processingError) {
      console.error('에러 처리 중 오류 발생:', processingError);

      return NextResponse.json(
        {
          success: false,
          message: '에러 리포트 처리 중 문제가 발생했습니다.',
          error:
            processingError instanceof Error
              ? processingError.message
              : 'Unknown error',
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error processing error report:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to process error report',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// GET 요청 시 에러 리포팅 상태 확인
export async function GET() {
  return NextResponse.json({
    service: 'Error Reporting API',
    status: 'active',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      POST: 'Submit error report',
      GET: 'Check service status',
    },
  });
}

// OPTIONS 요청 처리 (CORS preflight)
export async function OPTIONS() {
  return NextResponse.json(
    {},
    {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400',
      },
    }
  );
}
