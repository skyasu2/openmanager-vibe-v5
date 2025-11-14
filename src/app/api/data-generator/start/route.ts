import { NextResponse } from 'next/server';
import debug from '@/utils/debug';

export const dynamic = 'force-dynamic';

/**
 * 🚀 데이터 생성기 시작 API
 *
 * 목업 데이터 기반으로 시뮬레이션된 데이터 생성기 시작
 */
export function POST() {
  try {
    debug.log('🚀 데이터 생성기 시작 요청');

    // 목업 환경에서는 항상 성공으로 처리
    const response = {
      success: true,
      message: '데이터 생성기가 시작되었습니다',
      data: {
        isRunning: true,
        startTime: new Date().toISOString(),
        mode: 'mock',
        serversGenerated: 10,
      },
      timestamp: Date.now(),
    };

    debug.log('✅ 데이터 생성기 시작 완료');

    return NextResponse.json(response);
  } catch (error) {
    debug.error('❌ 데이터 생성기 시작 실패:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to start data generator',
        message: '데이터 생성기 시작에 실패했습니다',
      },
      { status: 500 }
    );
  }
}
