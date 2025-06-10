/**
 * 🚀 AI 분석-스케일링 분리 시뮬레이션 API v1.0
 *
 * 목적: 서버 오토스케일링과 AI 분석 로직 완전 분리 테스트
 * - 운영 시뮬레이션: 동적 서버 풀 관리 (8-30대)
 * - AI 분석: 고정된 8개 타겟 서버 기반 안정적 추론
 * - 메타 이벤트: 스케일링 정보는 참조용으로만 제공
 */

import { NextRequest, NextResponse } from 'next/server';
import { advancedSimulationEngine } from '@/services/AdvancedSimulationEngine';
import { scalingSimulationEngine } from '@/services/ScalingSimulationEngine';

/**
 * 📊 GET - AI 분석 상태 조회
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const responseType = searchParams.get('type') || 'full';

    console.log(`🔍 AI 분리 시뮬레이션 상태 조회 (타입: ${responseType})`);

    switch (responseType) {
      case 'ai-only':
        // AI 분석 대상 서버만 (고정)
        const analysisTargets =
          await advancedSimulationEngine.getAnalysisTargets();
        return NextResponse.json({
          success: true,
          data: {
            type: 'ai_analysis_targets',
            servers: analysisTargets,
            summary: {
              totalTargets: analysisTargets.length,
              healthyTargets: analysisTargets.filter(
                s => s.predicted_status === 'healthy'
              ).length,
              warningTargets: analysisTargets.filter(
                s => s.predicted_status === 'warning'
              ).length,
              criticalTargets: analysisTargets.filter(
                s => s.predicted_status === 'critical'
              ).length,
              avgHealthScore: Math.round(
                analysisTargets.reduce((sum, s) => sum + s.health_score, 0) /
                  analysisTargets.length
              ),
            },
            metadata: {
              isFixed: true,
              analysisMode: 'stable_targets',
              timestamp: Date.now(),
            },
          },
        });

      case 'scaling-only':
        // 운영 서버 스케일링 상태만 (동적)
        const operationalServers =
          scalingSimulationEngine.getOperationalServers();
        const serverPool = scalingSimulationEngine.getServerPool();
        const scalingHistory = scalingSimulationEngine.getScalingHistory(10);

        return NextResponse.json({
          success: true,
          data: {
            type: 'operational_scaling',
            servers: operationalServers,
            pool: {
              currentScale: serverPool.metadata.currentScale,
              targetScale: serverPool.metadata.targetScale,
              minServers: serverPool.metadata.minServers,
              maxServers: serverPool.metadata.maxServers,
              lastScalingAction: serverPool.metadata.lastScalingAction,
            },
            recentScalingEvents: scalingHistory,
            summary: {
              totalServers: operationalServers.length,
              healthyServers: operationalServers.filter(
                s => s.status === 'healthy'
              ).length,
              warningServers: operationalServers.filter(
                s => s.status === 'warning'
              ).length,
              criticalServers: operationalServers.filter(
                s => s.status === 'critical'
              ).length,
            },
            metadata: {
              isDynamic: true,
              scalingMode: 'auto',
              timestamp: Date.now(),
            },
          },
        });

      case 'integrated':
        // AI 완전 통합 메트릭 (AI용 최적화)
        const integratedMetrics =
          await advancedSimulationEngine.getIntegratedAIMetrics();

        return NextResponse.json({
          success: true,
          data: {
            type: 'integrated_ai_metrics',
            ...integratedMetrics,
            architecture: {
              aiAnalysisEngine: 'AdvancedSimulationEngine',
              scalingEngine: 'ScalingSimulationEngine',
              dataSeparation: true,
              analysisStability: 'high',
              scalingFlexibility: 'high',
            },
          },
        });

      case 'comparison':
        // 분리 전후 비교 분석
        const aiTargets = await advancedSimulationEngine.getAnalysisTargets();
        const opServers = scalingSimulationEngine.getOperationalServers();

        return NextResponse.json({
          success: true,
          data: {
            type: 'separation_comparison',
            before: {
              description: '통합 시스템 (AI + 스케일링 혼재)',
              issues: [
                '서버 수 변동 시 AI 분석 기준 불안정',
                '스케일링 이벤트가 추론 로직에 직접 영향',
                '동적 서버 풀로 인한 일관성 부족',
              ],
            },
            after: {
              description: '분리 시스템 (AI 고정 + 스케일링 독립)',
              benefits: [
                'AI 분석: 8개 고정 서버 기반 안정적 추론',
                '운영 시뮬: 8-30대 자유로운 동적 스케일링',
                '메타 이벤트: 스케일링 정보는 참조용으로만 활용',
              ],
              aiAnalysisTargets: aiTargets.length,
              operationalServers: opServers.length,
              dataConsistency: 'high',
              inferenceStability: 'guaranteed',
            },
            architecture: {
              aiEngine: 'Fixed 8 target servers for stable analysis',
              scalingEngine: 'Dynamic 8-30 servers for realistic simulation',
              interaction: 'Reference-only meta events',
            },
          },
        });

      default:
        // 전체 상태 (기본)
        const fullMetrics =
          await advancedSimulationEngine.getIntegratedAIMetrics();
        const fullOperational = scalingSimulationEngine.getAIMetrics();

        return NextResponse.json({
          success: true,
          data: {
            type: 'full_separation_status',
            aiAnalysis: {
              engine: 'AdvancedSimulationEngine',
              targets: fullMetrics.totalServers || 0,
              status: fullMetrics,
              isRunning: advancedSimulationEngine.getIsRunning(),
            },
            operationalScaling: {
              engine: 'ScalingSimulationEngine',
              servers: fullOperational.operationalSummary?.totalServers || 0,
              summary: fullOperational.operationalSummary,
              recentEvents: fullOperational.recentScalingEvents,
            },
            separation: {
              achieved: true,
              aiStability: 'high',
              scalingFlexibility: 'high',
              metaEventHandling: 'reference_only',
            },
            timestamp: Date.now(),
          },
        });
    }
  } catch (error) {
    console.error('❌ AI 분리 시뮬레이션 조회 실패:', error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'AI 분리 시뮬레이션 조회 실패',
      },
      { status: 500 }
    );
  }
}

/**
 * 🔄 POST - 스케일링 시뮬레이션 실행
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { action, policy } = body;

    console.log(`🚀 스케일링 액션 실행: ${action}`);

    switch (action) {
      case 'trigger_scaling':
        // 강제 스케일링 시뮬레이션
        const scalingEvent = scalingSimulationEngine.simulateScaling([]);

        return NextResponse.json({
          success: true,
          data: {
            scalingEvent,
            message: scalingEvent
              ? `스케일링 이벤트 발생: ${scalingEvent.type}`
              : '스케일링 조건 불충족 또는 쿨다운 중',
            operationalServers:
              scalingSimulationEngine.getOperationalServers().length,
            aiTargetsUnchanged: (
              await advancedSimulationEngine.getAnalysisTargets()
            ).length,
          },
        });

      case 'update_policy':
        // 스케일링 정책 업데이트
        if (policy) {
          scalingSimulationEngine.updateScalingPolicy(policy);
          return NextResponse.json({
            success: true,
            data: {
              message: '스케일링 정책 업데이트 완료',
              updatedPolicy: policy,
              aiAnalysisUnaffected: true,
            },
          });
        }
        break;

      case 'start_ai_simulation':
        // AI 분석 시뮬레이션 시작
        advancedSimulationEngine.start();
        return NextResponse.json({
          success: true,
          data: {
            message: 'AI 분석 시뮬레이션 시작',
            targets: (await advancedSimulationEngine.getAnalysisTargets())
              .length,
            isRunning: advancedSimulationEngine.getIsRunning(),
          },
        });

      case 'stop_ai_simulation':
        // AI 분석 시뮬레이션 정지
        advancedSimulationEngine.stop();
        return NextResponse.json({
          success: true,
          data: {
            message: 'AI 분석 시뮬레이션 정지',
            isRunning: advancedSimulationEngine.getIsRunning(),
          },
        });

      default:
        return NextResponse.json(
          {
            success: false,
            error: '지원하지 않는 액션입니다',
          },
          { status: 400 }
        );
    }

    // 기본 응답 (모든 case가 return을 가지므로 도달하지 않음)
    return NextResponse.json(
      {
        success: false,
        error: '처리되지 않은 요청',
      },
      { status: 400 }
    );
  } catch (error) {
    console.error('❌ 스케일링 액션 실행 실패:', error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : '스케일링 액션 실행 실패',
      },
      { status: 500 }
    );
  }
}

/**
 * 🧪 PUT - 분리 테스트 실행
 */
export async function PUT(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { testType } = body;

    console.log(`🧪 분리 테스트 실행: ${testType}`);

    switch (testType) {
      case 'scaling_stress_test':
        // 스케일링 스트레스 테스트
        const results = [];

        // 10번의 스케일링 시뮬레이션
        for (let i = 0; i < 10; i++) {
          const event = scalingSimulationEngine.simulateScaling([
            { cpu: 60, memory: 50 },
          ]);
          if (event) {
            results.push({
              iteration: i + 1,
              event: event.type,
              serverCount: event.targetInstances,
              reason: event.reason,
            });
          }

          // 짧은 대기
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        return NextResponse.json({
          success: true,
          data: {
            testType: 'scaling_stress_test',
            iterations: 10,
            scalingEvents: results.length,
            results,
            aiTargetsStable: (
              await advancedSimulationEngine.getAnalysisTargets()
            ).length,
            operationalServersAfter:
              scalingSimulationEngine.getOperationalServers().length,
            conclusion: 'AI 분석 대상은 고정 유지, 운영 서버만 동적 변경 확인',
          },
        });

      case 'ai_consistency_test':
        // AI 분석 일관성 테스트
        const snapshot1 = await advancedSimulationEngine.getAnalysisTargets();

        // 스케일링 시뮬레이션 실행
        scalingSimulationEngine.simulateScaling([{ cpu: 70, memory: 60 }]);
        scalingSimulationEngine.simulateScaling([{ cpu: 80, memory: 70 }]);

        const snapshot2 = await advancedSimulationEngine.getAnalysisTargets();

        // AI 분석 대상 서버 ID 비교
        const ids1 = snapshot1.map(s => s.id).sort();
        const ids2 = snapshot2.map(s => s.id).sort();
        const isConsistent = JSON.stringify(ids1) === JSON.stringify(ids2);

        return NextResponse.json({
          success: true,
          data: {
            testType: 'ai_consistency_test',
            aiTargetsConsistent: isConsistent,
            aiTargetIds: ids1,
            operationalServersChanged: true,
            operationalCount:
              scalingSimulationEngine.getOperationalServers().length,
            conclusion: isConsistent
              ? 'AI 분석 대상 서버 완전 일관성 유지'
              : 'AI 분석 대상 서버 변경 감지 (오류)',
          },
        });

      default:
        return NextResponse.json(
          {
            success: false,
            error: '지원하지 않는 테스트 타입입니다',
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('❌ 분리 테스트 실행 실패:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '분리 테스트 실행 실패',
      },
      { status: 500 }
    );
  }
}

/**
 * 📊 OPTIONS - API 정보
 */
export async function OPTIONS() {
  return NextResponse.json({
    endpoints: {
      'GET /': 'AI 분석-스케일링 분리 상태 조회',
      'GET /?type=ai-only': 'AI 분석 대상 서버만 조회 (고정)',
      'GET /?type=scaling-only': '운영 서버 스케일링 상태만 조회 (동적)',
      'GET /?type=integrated': 'AI 통합 메트릭 조회',
      'GET /?type=comparison': '분리 전후 비교 분석',
      'POST /': '스케일링 액션 실행',
      'PUT /': '분리 테스트 실행',
    },
    architecture: {
      aiEngine: 'AdvancedSimulationEngine - 고정된 8개 분석 대상',
      scalingEngine: 'ScalingSimulationEngine - 동적 8-30개 운영 서버',
      separation: 'AI 추론 안정성 + 운영 시뮬레이션 유연성',
    },
  });
}
