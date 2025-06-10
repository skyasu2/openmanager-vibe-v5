/**
 * 🏆 경연대회 상태 API
 *
 * 기능:
 * - 경연대회 모드 상태 확인
 * - 리소스 사용량 모니터링
 * - 자동 종료 타이머 관리
 * - 실시간 최적화 제어
 */

import { NextRequest, NextResponse } from 'next/server';
import { competitionConfig } from '@/config/competition-config';
import { unifiedDataBroker } from '@/services/data-collection/UnifiedDataBroker';

export async function GET(request: NextRequest) {
  try {
    const status = competitionConfig.getStatus();
    const brokerMetrics = unifiedDataBroker.getMetrics();

    return NextResponse.json({
      success: true,
      data: {
        competition: status,
        broker: brokerMetrics,
        environment: {
          vercelTier: status.config.environment.vercelTier,
          redisTier: status.config.environment.redisTier,
          supabaseTier: status.config.environment.supabaseTier,
        },
        limits: status.config.limits,
        performance: {
          dataGenerationInterval:
            status.config.performance.dataGenerationInterval,
          cacheStrategy: status.config.performance.cacheStrategy,
          batchSize: status.config.performance.batchSize,
        },
        optimization: {
          autoShutdown: status.config.features.autoShutdown,
          smartOnOff: status.config.features.smartOnOff,
          resourceMonitoring: status.config.features.resourceMonitoring,
          realTimeOptimization: status.config.features.realTimeOptimization,
        },
        timestamps: {
          remainingTime: status.remainingTime,
          runningTime: status.runningTime,
          dataFreshness: brokerMetrics.dataFreshness,
        },
        resourceUsage: {
          redisCommands: brokerMetrics.redisCommands,
          redisCommandsPercent:
            (brokerMetrics.redisCommands / status.config.limits.redisCommands) *
            100,
          cacheHitRate: brokerMetrics.cacheHitRate,
          activeSubscribers: brokerMetrics.activeSubscribers,
        },
      },
    });
  } catch (error) {
    console.error('경연대회 상태 조회 실패:', error);
    return NextResponse.json(
      {
        success: false,
        error: '상태 조회 실패',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...params } = body;

    switch (action) {
      case 'toggle-active':
        const { active } = params;
        unifiedDataBroker.setActive(active);
        competitionConfig.toggleActive(active);

        return NextResponse.json({
          success: true,
          message: `경연대회 모드 ${active ? '활성화' : '비활성화'}`,
          data: { isActive: active },
        });

      case 'optimize':
        const { metrics } = params;
        competitionConfig.optimizeForUsage(metrics);

        return NextResponse.json({
          success: true,
          message: '실시간 최적화 적용',
          data: competitionConfig.getStatus(),
        });

      case 'shutdown':
        competitionConfig.shutdown();
        unifiedDataBroker.shutdown();

        return NextResponse.json({
          success: true,
          message: '경연대회 시스템 종료',
        });

      default:
        return NextResponse.json(
          {
            success: false,
            error: '지원하지 않는 액션',
            supportedActions: ['toggle-active', 'optimize', 'shutdown'],
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('경연대회 액션 실행 실패:', error);
    return NextResponse.json(
      {
        success: false,
        error: '액션 실행 실패',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
