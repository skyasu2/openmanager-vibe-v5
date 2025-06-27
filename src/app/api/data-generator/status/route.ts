/**
 * 📊 데이터 생성기 상태 조회 API - 최적화 버전
 *
 * 대시보드 직접 접속 시 빠른 응답을 위한 최적화된 상태 조회
 */

import { RealServerDataGenerator } from '@/services/data-generator/RealServerDataGenerator';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    // 🚀 빠른 응답을 위한 캐시된 상태 조회
    const realServerDataGenerator = RealServerDataGenerator.getInstance();

    // 🔥 즉시 상태 반환 (초기화 대기하지 않음)
    const status = realServerDataGenerator.getStatus();
    const responseTime = Date.now() - startTime;

    // 🚀 최적화된 응답 구조
    const optimizedResponse = {
      success: true,
      data: {
        isInitialized: status.isInitialized,
        isRunning: status.isRunning,
        serverCount: status.serverCount || 0,
        lastUpdate: new Date().toISOString(),
        uptime: 0,
        // 🔥 성능 메트릭
        performance: {
          responseTime,
          healthy: true,
          quickLoad: responseTime < 100, // 100ms 이하면 빠른 로드
        },
      },
      timestamp: new Date().toISOString(),
      responseTime,
    };

    console.log(`📊 데이터 생성기 상태 조회 완료 (${responseTime}ms)`);

    return NextResponse.json(optimizedResponse);
  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error('❌ 데이터 생성기 상태 조회 실패:', error);

    // 🚀 에러 시에도 기본 상태 반환 (폴백)
    return NextResponse.json(
      {
        success: false,
        data: {
          isInitialized: false,
          isRunning: false,
          serverCount: 0,
          lastUpdate: new Date().toISOString(),
          uptime: 0,
          performance: {
            responseTime,
            healthy: false,
            quickLoad: false,
          },
        },
        error: error instanceof Error ? error.message : '상태 조회 실패',
        timestamp: new Date().toISOString(),
        responseTime,
      },
      { status: 200 }
    ); // 🚀 에러여도 200 응답으로 폴백 처리
  }
}
