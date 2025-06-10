/**
 * 🔧 통합 메트릭 API 엔드포인트
 *
 * 404 에러 해결을 위한 통합 메트릭 제공
 * - 서버 상태 통합
 * - 시스템 메트릭 통합
 * - 실시간 상태 정보
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // 현재 시간
    const timestamp = new Date().toISOString();

    // 모의 데이터 생성 (실제 환경에서는 실제 데이터 소스에서 가져옴)
    const unifiedMetrics = {
      servers: {
        total: 30,
        active: 28,
        warning: 2,
        critical: 0,
        averageCpu: 45.7,
        averageMemory: 67.3,
        averageDisk: 34.8,
      },
      system: {
        uptime: '15일 7시간 23분',
        totalRequests: 1247892,
        errorRate: 0.003,
        responseTime: 145,
        throughput: 2847,
      },
      alerts: {
        total: 12,
        critical: 0,
        warning: 2,
        info: 10,
        resolved: 156,
      },
      performance: {
        cpuTrend: 'stable',
        memoryTrend: 'increasing',
        diskTrend: 'stable',
        networkTrend: 'stable',
      },
      timestamp,
      source: 'unified-metrics-api',
      version: '1.0.0',
    };

    return NextResponse.json({
      success: true,
      data: unifiedMetrics,
      timestamp,
    });
  } catch (error) {
    console.error('❌ 통합 메트릭 조회 실패:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '통합 메트릭 조회 실패',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
