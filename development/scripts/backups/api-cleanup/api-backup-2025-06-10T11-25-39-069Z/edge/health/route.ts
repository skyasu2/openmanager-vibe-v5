import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

/**
 * 🚀 Edge Function - Health Check
 * 빠른 시스템 상태 확인을 위한 경량 API
 */
export async function GET(request: NextRequest) {
  try {
    const startTime = Date.now();

    // 기본 시스템 정보
    const systemInfo = {
      timestamp: new Date().toISOString(),
      status: 'healthy',
      version: '5.22.0',
      environment: process.env.NODE_ENV || 'development',
      region: process.env.VERCEL_REGION || 'local',
    };

    // Edge Runtime에서 사용 가능한 정보들
    const userAgent = request.headers.get('user-agent') || '';
    const origin = request.headers.get('origin') || '';
    const ip =
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      'unknown';

    // 응답 시간 계산
    const responseTime = Date.now() - startTime;

    // 헬스체크 결과
    const healthData = {
      ...systemInfo,
      performance: {
        responseTime: `${responseTime}ms`,
        edgeRuntime: true,
      },
      client: {
        ip: ip.split(',')[0].trim(), // 첫 번째 IP만 사용
        userAgent: userAgent.substring(0, 100), // 보안을 위해 제한
        origin,
      },
      services: {
        api: 'online',
        database: 'simulated',
        cache: 'edge-optimized',
      },
    };

    return NextResponse.json(
      {
        success: true,
        data: healthData,
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, max-age=10, s-maxage=5',
          'Access-Control-Allow-Origin': '*',
          'X-Edge-Function': 'health-check',
          'X-Response-Time': `${responseTime}ms`,
        },
      }
    );
  } catch (error) {
    console.error('[Edge/Health] Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Health check failed',
        timestamp: new Date().toISOString(),
      },
      {
        status: 503,
        headers: {
          'Cache-Control': 'no-cache',
          'X-Edge-Function': 'health-check',
          'X-Error': 'true',
        },
      }
    );
  }
}

export async function HEAD(request: NextRequest) {
  // HEAD 요청은 헤더만 반환 (더 빠른 헬스체크)
  try {
    const responseTime = Date.now();

    return new NextResponse(null, {
      status: 200,
      headers: {
        'X-Health-Status': 'ok',
        'X-Response-Time': `${Date.now() - responseTime}ms`,
        'X-Edge-Function': 'health-check-head',
        'Cache-Control': 'public, max-age=5',
      },
    });
  } catch (error) {
    return new NextResponse(null, {
      status: 503,
      headers: {
        'X-Health-Status': 'error',
        'X-Edge-Function': 'health-check-head',
      },
    });
  }
}
