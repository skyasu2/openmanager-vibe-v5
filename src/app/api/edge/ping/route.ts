import { NextRequest, NextResponse } from 'next/server';
import { withAPIMetrics } from '@/utils/api-metrics';

export const runtime = 'edge';

/**
 * 🚀 Edge Function - Ping
 * 최소 지연시간 확인을 위한 초경량 API
 *
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
        middleware: 'removed', // Edge Middleware 제거됨을 표시
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'X-Edge-Function': 'ping',
          'X-Response-Time': `${Date.now() - startTime}ms`,
          'X-Middleware-Status': 'removed',
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
        middleware: 'removed', // Edge Middleware 제거됨을 표시
      };

      return NextResponse.json(echoData, {
        status: 200,
        headers: {
          'Cache-Control': 'no-cache',
          'X-Edge-Function': 'ping-echo',
          'X-Response-Time': `${Date.now() - startTime}ms`,
          'X-Middleware-Status': 'removed',
        },
      });
    } catch (error) {
      return NextResponse.json(
        {
          error: 'Invalid JSON',
          timestamp: new Date().toISOString(),
          responseTime: Date.now() - startTime,
          middleware: 'removed',
        },
        {
          status: 400,
          headers: {
            'X-Edge-Function': 'ping-echo',
            'X-Error': 'true',
            'X-Middleware-Status': 'removed',
          },
        }
      );
    }
  });
}
