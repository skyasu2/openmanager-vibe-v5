import { NextRequest, NextResponse } from 'next/server';
import { withAPIMetrics } from '@/utils/api-metrics';

// ❌ Edge Runtime 제거 - Vercel Edge Requests 과금 방지
// export const runtime = 'edge'; // 제거됨

/**
 * 🚀 Ping API - Node.js Runtime으로 변경
 * 최소 지연시간 확인을 위한 초경량 API
 *
 * ✅ Edge Runtime → Node.js Runtime 변경으로 Edge Requests 과금 방지
 * ✅ Vercel Edge Middleware 제거 후 API 내부 메트릭 수집 적용
 */
export async function GET(request: NextRequest) {
  return withAPIMetrics(request, async () => {
    const startTime = Date.now();

    return NextResponse.json(
      {
        pong: true,
        timestamp: new Date().toISOString(),
        responseTime: Date.now() - startTime,
        runtime: 'nodejs', // Edge → Node.js Runtime 변경됨을 표시
        middleware: 'removed', // Edge Middleware 제거됨을 표시
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'X-Runtime': 'nodejs', // Edge → Node.js 변경
          'X-Response-Time': `${Date.now() - startTime}ms`,
          'X-Middleware-Status': 'removed',
          'X-Edge-Requests-Optimized': 'true', // Edge Requests 최적화 완료
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  });
}

export async function POST(request: NextRequest) {
  return withAPIMetrics(request, async () => {
    const startTime = Date.now();

    try {
      const body = await request.json().catch(() => ({}));
      const echoData = {
        received: body,
        echo: true,
        timestamp: new Date().toISOString(),
        responseTime: Date.now() - startTime,
        runtime: 'nodejs', // Edge → Node.js Runtime 변경됨을 표시
        middleware: 'removed', // Edge Middleware 제거됨을 표시
      };

      return NextResponse.json(echoData, {
        status: 200,
        headers: {
          'Cache-Control': 'no-cache',
          'X-Runtime': 'nodejs', // Edge → Node.js 변경
          'X-Response-Time': `${Date.now() - startTime}ms`,
          'X-Middleware-Status': 'removed',
          'X-Edge-Requests-Optimized': 'true', // Edge Requests 최적화 완료
        },
      });
    } catch (error) {
      return NextResponse.json(
        {
          error: 'Invalid JSON',
          timestamp: new Date().toISOString(),
          responseTime: Date.now() - startTime,
          runtime: 'nodejs', // Edge → Node.js Runtime 변경됨
          middleware: 'removed',
        },
        {
          status: 400,
          headers: {
            'X-Runtime': 'nodejs', // Edge → Node.js 변경
            'X-Error': 'true',
            'X-Middleware-Status': 'removed',
            'X-Edge-Requests-Optimized': 'true', // Edge Requests 최적화 완료
          },
        }
      );
    }
  });
}
