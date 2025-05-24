import { NextRequest, NextResponse } from 'next/server';

interface ErrorReport {
  message: string;
  stack?: string;
  componentStack?: string;
  timestamp: string;
  url: string;
  userAgent: string;
}

export async function POST(request: NextRequest) {
  try {
    const errorData: ErrorReport = await request.json();
    
    // 로그 형식 정리
    const logEntry = {
      level: 'error',
      timestamp: errorData.timestamp,
      message: errorData.message,
      stack: errorData.stack,
      componentStack: errorData.componentStack,
      context: {
        url: errorData.url,
        userAgent: errorData.userAgent,
        environment: process.env.NODE_ENV
      }
    };

    // 콘솔에 에러 로깅
    console.error('[Error Report]', JSON.stringify(logEntry, null, 2));

    // 프로덕션 환경에서는 실제 모니터링 서비스로 전송
    if (process.env.NODE_ENV === 'production') {
      // 예: Sentry, LogRocket, 또는 다른 모니터링 서비스
      // await sendToMonitoringService(logEntry);
    }

    return NextResponse.json(
      { 
        success: true, 
        message: 'Error report received',
        reportId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      },
      { 
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST',
          'Access-Control-Allow-Headers': 'Content-Type'
        }
      }
    );

  } catch (error) {
    console.error('Failed to process error report:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to process error report' 
      },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST',
          'Access-Control-Allow-Headers': 'Content-Type'
        }
      }
    );
  }
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