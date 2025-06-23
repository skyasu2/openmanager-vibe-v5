import { NextRequest, NextResponse } from 'next/server';

/**
 * 🔄 AI 쿼리 API v1 (리다이렉트)
 *
 * 이 엔드포인트는 /api/ai/smart-fallback으로 리다이렉트됩니다.
 * 기존 호환성을 위해 유지되며, 새로운 요청은 smart-fallback을 사용하세요.
 */
export async function POST(request: NextRequest) {
  try {
    // 요청 본문 읽기
    const body = await request.json();

    // smart-fallback API로 프록시
    const smartFallbackUrl = new URL('/api/ai/smart-fallback', request.url);

    const response = await fetch(smartFallbackUrl.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'AI-Query-Proxy/1.0',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    return NextResponse.json(
      {
        ...data,
        _proxied: true,
        _originalEndpoint: '/api/v1/ai/query',
        _redirectedTo: '/api/ai/smart-fallback',
      },
      { status: response.status }
    );
  } catch (error) {
    console.error('❌ AI 쿼리 프록시 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Query proxy failed',
        message: '직접 /api/ai/smart-fallback을 사용해주세요.',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
