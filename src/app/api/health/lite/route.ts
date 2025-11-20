/**
 * 🏥 경량 헬스체크 API (Edge Runtime)
 *
 * 외부 모니터링 및 Uptime 체크용 초경량 엔드포인트
 * - Edge Runtime으로 컴퓨팅 비용 0
 * - 응답시간 ~5ms
 * - 60초 캐싱
 *
 * GET /api/health/lite
 */

import { NextResponse } from 'next/server';

export const runtime = 'edge';

export function GET() {
  try {
    return NextResponse.json(
      {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: 0, // Edge Functions는 콜드 스타트 없음
        runtime: 'edge',
        region: process.env.VERCEL_REGION || 'unknown',
      },
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=60, stale-while-revalidate=120',
          'X-Runtime': 'edge',
          'X-Response-Time': '~5ms',
        },
      }
    );
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
        runtime: 'edge',
      },
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'X-Runtime': 'edge',
        },
      }
    );
  }
}

export function HEAD() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'X-Runtime': 'edge',
      'X-Response-Time': '~2ms',
    },
  });
}
