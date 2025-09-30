/**
 * 🕐 타임존 테스트 API
 *
 * MockContextLoader와 시간 관련 함수들의 타임존 설정을 검증하는 임시 테스트 엔드포인트
 */

import { NextResponse } from 'next/server';
import { MockContextLoader } from '@/services/ai/MockContextLoader';
import { getCurrentSimulatedHour } from '@/mock/fixedHourlyData';

export async function GET() {
  try {
    // MockContextLoader 인스턴스 생성
    const mockContextLoader = MockContextLoader.getInstance();
    const mockContext = mockContextLoader.getMockContext();

    // 현재 시간 정보 수집
    const now = new Date();

    const timeInfo = {
      // 시스템 기본 시간
      systemTime: now.toISOString(),
      systemLocal: now.toLocaleString(),

      // 한국 시간 (Asia/Seoul)
      koreaTime: now.toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }),
      koreaTimeString: now.toLocaleTimeString('ko-KR', {
        hour12: false,
        timeZone: 'Asia/Seoul'
      }),

      // MockContextLoader에서 제공하는 시간 정보
      mockContextTime: mockContext?.currentTime || 'MockContext 없음',

      // fixedHourlyData의 현재 시뮬레이션 시간
      simulatedHour: getCurrentSimulatedHour(),

      // 베르셀 환경 정보
      environment: {
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        locale: Intl.DateTimeFormat().resolvedOptions().locale,
        nodeEnv: process.env.NODE_ENV,
        vercelRegion: process.env.VERCEL_REGION || 'N/A',
      }
    };

    return NextResponse.json({
      success: true,
      message: '타임존 테스트 결과',
      data: timeInfo,
      timestamp: now.toISOString()
    });

  } catch (error) {
    console.error('타임존 테스트 오류:', error);

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}