import { NextResponse } from 'next/server';
import debug from '@/utils/debug';

export const dynamic = 'force-dynamic';

/**
 * 🚀 데이터 생성기 상태 확인 API
 *
 * 목업 데이터 기반으로 시뮬레이션된 데이터 생성기 상태 반환
 */
export async function GET() {
  try {
    debug.log('🔍 데이터 생성기 상태 확인');

    // 목업 환경에서는 항상 실행 중으로 처리
    const response = {
      success: true,
      data: {
        isRunning: true,
        uptime: Math.floor(Math.random() * 3600000), // 랜덤 업타임 (밀리초)
        mode: 'mock',
        serversActive: 10,
        lastUpdate: new Date().toISOString(),
        performance: {
          cpu: Math.floor(Math.random() * 30) + 10, // 10-40%
          memory: Math.floor(Math.random() * 40) + 20, // 20-60%
          requests: Math.floor(Math.random() * 1000) + 500, // 500-1500
        },
      },
      timestamp: Date.now(),
    };

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    debug.error('❌ 데이터 생성기 상태 확인 실패:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get data generator status',
        data: {
          isRunning: false,
        },
      },
      { status: 500 }
    );
  }
}
