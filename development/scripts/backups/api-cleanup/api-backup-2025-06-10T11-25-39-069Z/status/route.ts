/**
 * 🏥 시스템 상태 확인 API
 * 전역 상태 동기화를 위한 엔드포인트
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      isActive: false,
      status: 'inactive',
      warmup: {
        active: false,
        completed: false,
        count: 0,
        remaining: 0,
      },
      python: {
        isWarm: false,
        status: 'removed',
        responseTime: 0,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        isActive: false,
        status: 'error',
        error: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
