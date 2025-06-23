import { NextRequest, NextResponse } from 'next/server';

/**
 * 🔄 AI 모니터링 API v1 (리다이렉트)
 *
 * 이 엔드포인트는 /api/ai/intelligent-monitoring으로 리다이렉트됩니다.
 * 기존 호환성을 위해 유지되며, 새로운 요청은 intelligent-monitoring을 사용하세요.
 */
export async function POST(request: NextRequest) {
  try {
    // 요청 본문 읽기
    const body = await request.json();

    // intelligent-monitoring API로 프록시
    const monitoringUrl = new URL(
      '/api/ai/intelligent-monitoring',
      request.url
    );

    const response = await fetch(monitoringUrl.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'AI-Monitor-Proxy/1.0',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    return NextResponse.json(
      {
        ...data,
        _proxied: true,
        _originalEndpoint: '/api/v1/ai/monitor',
        _redirectedTo: '/api/ai/intelligent-monitoring',
      },
      { status: response.status }
    );
  } catch (error) {
    console.error('❌ AI 모니터링 프록시 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Monitoring proxy failed',
        message: '직접 /api/ai/intelligent-monitoring을 사용해주세요.',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
