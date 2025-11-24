import { NextRequest, NextResponse } from 'next/server';

/**
 * 개발 ?�경 ?�용 ?�스???�큰 ?�공 API (App Router)
 *
 * 보안 ?�책:
 * - 개발 ?�경(localhost)?�서�??�동
 * - ?�로?�션?�서??403 Forbidden 반환
 * - ?�시 ?�큰�??�공 (?�사??불�?)
 */

// Route Segment Config
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export function GET(request: NextRequest) {
  // 개발 환경 검증
  const isDevelopment = process.env.NODE_ENV === 'development';
  const host = request.headers.get('host') || '';
  const isLocalhost = host.includes('localhost') || host.includes('127.0.0.1');

  // ?�로?�션 ?�경?�서??즉시 차단
  if (!isDevelopment || !isLocalhost) {
    return NextResponse.json(
      {
        error: 'Forbidden',
        message:
          'Development tools are only available in development environment',
        environment: process.env.NODE_ENV,
        host: host,
      },
      { status: 403 }
    );
  }

  try {
    // ?�시 ?�스???�큰 ?�성 (개발 ?�경??
    const timestamp = Date.now();
    const randomBytes = Math.random().toString(36).substring(2);
    const testToken = `dev-test-${timestamp}-${randomBytes}`;

    // ?�경 변?�에???�제 bypass secret 가?�오�?(개발 ?�경?�서�?
    const actualBypassSecret =
      process.env.VERCEL_AUTOMATION_BYPASS_SECRET ||
      process.env.NEXT_PUBLIC_DEV_BYPASS_SECRET ||
      'dev-bypass-fallback';

    return NextResponse.json({
      success: true,
      token: actualBypassSecret,
      testToken: testToken,
      environment: 'development',
      timestamp: new Date().toISOString(),
      message: 'Test token provided for development environment only',
      security: {
        environment_verified: true,
        localhost_verified: isLocalhost,
        token_type: 'temporary',
        expires_in: '1 hour',
      },
    });
  } catch (error) {
    console.error('Error generating test token:', error);

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'Failed to generate test token',
        environment: process.env.NODE_ENV,
      },
      { status: 500 }
    );
  }
}
