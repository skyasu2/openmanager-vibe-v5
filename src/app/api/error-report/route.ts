import { NextRequest, NextResponse } from 'next/server';

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
    const body: ErrorReport = await request.json();

    // 기본 validation
    if (!body.error || !body.timestamp || !body.page) {
      return NextResponse.json(
        { success: false, error: 'Required fields missing' },
        { status: 400 }
      );
    }

    // 추가 메타데이터 수집
    const errorReport = {
      ...body,
      userAgent: request.headers.get('user-agent'),
      url: request.url,
      ip: request.headers.get('x-forwarded-for'),
      referer: request.headers.get('referer'),
    };

    // 에러 로그 출력
    console.error('🚨 Client Error Report:', {
      page: errorReport.page,
      error: errorReport.error,
      timestamp: errorReport.timestamp,
      userAgent: errorReport.userAgent,
    });

    // 스택 트레이스가 있으면 별도 로그
    if (errorReport.stack) {
      console.error('📋 Stack Trace:', errorReport.stack);
    }

    // TODO: 실제 서비스에서는 다음과 같은 처리를 추가할 수 있습니다:
    // - 데이터베이스에 저장
    // - 외부 에러 추적 서비스 (Sentry, Bugsnag 등)로 전송
    // - 슬랙/이메일 알림
    // - 에러 패턴 분석

    // 개발 환경에서는 더 자세한 정보 출력
    if (process.env.NODE_ENV === 'development') {
      console.table({
        Page: errorReport.page,
        Error: errorReport.error.slice(0, 100),
        Time: errorReport.timestamp,
        Browser: errorReport.userAgent?.slice(0, 50),
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Error report received',
      reportId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    });

  } catch (error) {
    console.error('❌ Error processing error report:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process error report',
        details: error instanceof Error ? error.message : 'Unknown error'
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
  return NextResponse.json({}, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400'
    }
  });
}