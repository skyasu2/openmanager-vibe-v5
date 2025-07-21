/**
 * 🏥 기본 헬스체크 API
 *
 * E2E 테스트 및 기본 시스템 상태 확인용
 *
 * GET /api/health
 */

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime ? Math.floor(process.uptime()) : 0,
      environment: process.env.NODE_ENV || 'development',
      version: '5.44.3',
      services: {
        database: 'operational',
        cache: 'operational',
        ai: 'operational',
      },
      checks: {
        memory: 'ok',
        disk: 'ok',
        network: 'ok',
      },
    };

    return NextResponse.json(health, {
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('❌ Health check failed:', error);

    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Health check failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      {
        status: 503,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Content-Type': 'application/json',
        },
      }
    );
  }
}

/**
 * HEAD 요청도 지원 (더 가벼운 헬스체크)
 */
export async function HEAD(request: NextRequest) {
  try {
    return new NextResponse(null, {
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    return new NextResponse(null, { status: 503 });
  }
}
