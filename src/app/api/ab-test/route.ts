/**
 * 🧪 A/B 테스트 관리 API v1.0
 *
 * 점진적 API 교체를 위한 A/B 테스트 관리 엔드포인트
 * - 실시간 성능 메트릭 조회
 * - 트래픽 분할 조정
 * - 자동 롤백 설정
 */

import { abTestManager, type ABTestGroup } from '@/lib/ab-test-manager';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/ab-test
 *
 * A/B 테스트 현재 상태 및 결과 조회
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'status';

    switch (action) {
      case 'status':
        return await getABTestStatus();

      case 'results':
        return await getABTestResults();

      case 'metrics':
        return await getDetailedMetrics();

      case 'assign_group': {
        const userKey = searchParams.get('user_key') || 'anonymous';
        const forceGroup = searchParams.get('group') as ABTestGroup;
        const assignedGroup = await abTestManager.assignUserToGroup(
          userKey,
          forceGroup
        );

        return NextResponse.json({
          success: true,
          data: {
            userKey,
            assignedGroup,
            forceGroup: forceGroup || null,
          },
          timestamp: new Date().toISOString(),
        });
      }

      default:
        return NextResponse.json(
          {
            success: false,
            error: '지원하지 않는 액션',
            availableActions: ['status', 'results', 'metrics', 'assign_group'],
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('❌ A/B 테스트 API GET 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/ab-test
 *
 * A/B 테스트 설정 및 제어
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...params } = body;

    switch (action) {
      case 'update_traffic':
        return await updateTrafficSplit(params);

      case 'emergency_rollback':
        return await emergencyRollback(params);

      case 'record_metric':
        return await recordMetric(params);

      case 'update_config':
        return await updateConfig(params);

      case 'cleanup':
        await abTestManager.cleanup();
        return NextResponse.json({
          success: true,
          message: 'A/B 테스트 데이터 정리 완료',
          timestamp: new Date().toISOString(),
        });

      default:
        return NextResponse.json(
          {
            success: false,
            error: '지원하지 않는 액션',
            availableActions: [
              'update_traffic',
              'emergency_rollback',
              'record_metric',
              'update_config',
              'cleanup',
            ],
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('❌ A/B 테스트 API POST 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// ==============================================
// 🔧 헬퍼 함수들
// ==============================================

async function getABTestStatus() {
  try {
    await abTestManager.initialize();

    // 간단한 상태 정보
    const [legacyGroup, optimizedGroup] = await Promise.all([
      abTestManager.assignUserToGroup('status-check-legacy', 'legacy'),
      abTestManager.assignUserToGroup('status-check-optimized', 'optimized'),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        enabled: true,
        groups: {
          legacy: { available: legacyGroup === 'legacy' },
          optimized: { available: optimizedGroup === 'optimized' },
        },
        message: 'A/B 테스트 시스템 활성화됨',
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
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

async function getABTestResults() {
  try {
    await abTestManager.initialize();
    const results = await abTestManager.getResults();

    return NextResponse.json({
      success: true,
      data: {
        legacy: {
          ...results.legacy,
          description: '기존 API (GCP + Redis Pipeline)',
        },
        optimized: {
          ...results.optimized,
          description: '최적화 API (Redis Template Cache)',
        },
        comparison: results.comparison,
        analysis: {
          performanceImprovement: results.comparison.performanceGain > 0,
          significantGain: results.comparison.performanceGain > 50,
          recommendation: results.comparison.recommendation,
          rolloutReady: results.comparison.shouldRollout,
        },
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: '결과 조회 실패',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

async function getDetailedMetrics() {
  try {
    await abTestManager.initialize();
    const results = await abTestManager.getResults();

    // 상세 메트릭 분석
    const analysis = {
      performanceAnalysis: {
        avgResponseTimeImprovement: results.comparison.performanceGain,
        legacyAvgTime: results.legacy.avgResponseTime,
        optimizedAvgTime: results.optimized.avgResponseTime,
        targetAchieved: results.optimized.avgResponseTime < 10, // 10ms 목표
      },
      reliabilityAnalysis: {
        legacyErrorRate: results.legacy.errorRate,
        optimizedErrorRate: results.optimized.errorRate,
        errorRateImprovement:
          ((results.legacy.errorRate - results.optimized.errorRate) /
            Math.max(results.legacy.errorRate, 0.001)) *
          100,
        reliabilityTarget: results.optimized.errorRate < 0.01, // 1% 목표
      },
      trafficAnalysis: {
        legacyRequests: results.legacy.requestCount,
        optimizedRequests: results.optimized.requestCount,
        totalRequests:
          results.legacy.requestCount + results.optimized.requestCount,
        trafficSplit: {
          legacy:
            Math.round(
              (results.legacy.requestCount /
                (results.legacy.requestCount +
                  results.optimized.requestCount)) *
                100
            ) || 0,
          optimized:
            Math.round(
              (results.optimized.requestCount /
                (results.legacy.requestCount +
                  results.optimized.requestCount)) *
                100
            ) || 0,
        },
      },
    };

    return NextResponse.json({
      success: true,
      data: {
        rawResults: results,
        analysis,
        recommendations: generateRecommendations(analysis),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: '상세 메트릭 조회 실패',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

async function updateTrafficSplit(params: any) {
  try {
    const { legacyPercent, optimizedPercent } = params;

    if (
      typeof legacyPercent !== 'number' ||
      typeof optimizedPercent !== 'number'
    ) {
      return NextResponse.json(
        {
          success: false,
          error: '유효한 퍼센트 값이 필요합니다',
        },
        { status: 400 }
      );
    }

    await abTestManager.adjustTrafficSplit(legacyPercent, optimizedPercent);

    return NextResponse.json({
      success: true,
      message: `트래픽 분할 업데이트: Legacy ${legacyPercent}%, Optimized ${optimizedPercent}%`,
      data: {
        trafficSplit: {
          legacy: legacyPercent,
          optimized: optimizedPercent,
        },
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: '트래픽 분할 업데이트 실패',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

async function emergencyRollback(params: any) {
  try {
    const { reason } = params;

    if (!reason || typeof reason !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: '롤백 사유가 필요합니다',
        },
        { status: 400 }
      );
    }

    await abTestManager.emergencyRollback(reason);

    return NextResponse.json({
      success: true,
      message: '긴급 롤백 완료',
      data: {
        reason,
        newTrafficSplit: {
          legacy: 100,
          optimized: 0,
        },
        rollbackTime: new Date().toISOString(),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: '긴급 롤백 실패',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

async function recordMetric(params: any) {
  try {
    const { group, responseTime, success, error } = params;

    if (
      !group ||
      typeof responseTime !== 'number' ||
      typeof success !== 'boolean'
    ) {
      return NextResponse.json(
        {
          success: false,
          error: '필수 메트릭 데이터가 누락되었습니다',
        },
        { status: 400 }
      );
    }

    await abTestManager.recordMetric(group, responseTime, success, error);

    return NextResponse.json({
      success: true,
      message: '메트릭 기록 완료',
      data: {
        group,
        responseTime,
        success,
        recordedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: '메트릭 기록 실패',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

async function updateConfig(params: any) {
  try {
    const { config } = params;

    if (!config || typeof config !== 'object') {
      return NextResponse.json(
        {
          success: false,
          error: '유효한 설정 객체가 필요합니다',
        },
        { status: 400 }
      );
    }

    await abTestManager.updateConfig(config);

    return NextResponse.json({
      success: true,
      message: 'A/B 테스트 설정 업데이트 완료',
      data: {
        updatedConfig: config,
        updatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: '설정 업데이트 실패',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

function generateRecommendations(analysis: any): string[] {
  const recommendations: string[] = [];

  // 성능 기반 추천
  if (analysis.performanceAnalysis.avgResponseTimeImprovement > 80) {
    recommendations.push('🚀 매우 높은 성능 개선: 즉시 최적화 API로 전환 권장');
  } else if (analysis.performanceAnalysis.avgResponseTimeImprovement > 50) {
    recommendations.push('✅ 높은 성능 개선: 더 많은 테스트 후 전환 고려');
  } else if (analysis.performanceAnalysis.avgResponseTimeImprovement > 20) {
    recommendations.push('📊 보통 성능 개선: 추가 모니터링 필요');
  } else {
    recommendations.push('⚠️ 낮은 성능 개선: 최적화 방법 재검토 필요');
  }

  // 안정성 기반 추천
  if (analysis.reliabilityAnalysis.optimizedErrorRate < 0.01) {
    recommendations.push('🛡️ 높은 안정성: 에러율 목표 달성');
  } else if (analysis.reliabilityAnalysis.optimizedErrorRate < 0.05) {
    recommendations.push('⚠️ 보통 안정성: 에러율 개선 필요');
  } else {
    recommendations.push('🚨 낮은 안정성: 최적화 로직 점검 필요');
  }

  // 트래픽 기반 추천
  const totalRequests = analysis.trafficAnalysis.totalRequests;
  if (totalRequests < 100) {
    recommendations.push(
      '📈 더 많은 테스트 데이터 수집 필요 (현재: ' + totalRequests + '개 요청)'
    );
  } else if (totalRequests > 1000) {
    recommendations.push('📊 충분한 테스트 데이터 확보: 신뢰할 수 있는 결과');
  }

  return recommendations;
}
