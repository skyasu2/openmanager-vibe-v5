/**
 * 🔮 예측 분석 API 엔드포인트
 * GET /api/prediction/analyze
 *
 * AI 기반 서버 장애 예측 및 성능 분석
 * - 서버별 장애 확률 계산
 * - 예측 시계열 분석
 * - 예방 조치 권장사항
 * - TensorFlow.js 기반 LSTM 모델
 */

import { NextRequest, NextResponse } from 'next/server';
import { predictiveAnalysisEngine } from '@/engines/PredictiveAnalysisEngine';
import { RealServerDataGenerator } from '@/services/data-generator/RealServerDataGenerator';

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    const { searchParams } = new URL(request.url);
    const serverId = searchParams.get('serverId') || 'all';
    const timeframe = parseInt(searchParams.get('timeframe') || '24'); // hours
    const includeRecommendations =
      searchParams.get('recommendations') !== 'false';

    console.log(
      `🔮 예측 분석 시작: serverId=${serverId}, timeframe=${timeframe}h`
    );

    // 1. 서버 데이터 수집
    const dataGenerator = RealServerDataGenerator.getInstance();
    await dataGenerator.initialize();

    let targetServers;
    if (serverId === 'all') {
      targetServers = dataGenerator.getAllServers();
    } else {
      const server = dataGenerator.getServerById(serverId);
      targetServers = server ? [server] : [];
    }

    if (targetServers.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: '분석할 서버를 찾을 수 없습니다',
          serverId,
        },
        { status: 404 }
      );
    }

    // 2. 예측 분석 실행
    const predictions = [];
    let totalFailureProbability = 0;
    let highRiskCount = 0;

    for (const server of targetServers) {
      console.log(`📊 ${server.id} 서버 예측 분석 중...`);

      // 서버 메트릭을 예측 엔진 형식으로 변환
      const metricData = {
        serverId: server.id,
        timestamp: new Date(),
        metrics: {
          cpu: server.metrics.cpu,
          memory: server.metrics.memory,
          disk: server.metrics.disk,
          network_in: server.metrics.network.in,
          network_out: server.metrics.network.out,
          requests: server.metrics.requests,
          errors: server.metrics.errors,
          uptime: server.metrics.uptime,
          health_score: server.health.score,
        },
      };

      // 예측 분석 실행
      const prediction = await predictiveAnalysisEngine.predict(metricData);

      // 추가 분석 정보 계산
      const analysisDetails = {
        ...prediction,
        serverInfo: {
          id: server.id,
          name: server.name,
          type: server.type,
          environment: server.environment,
          location: server.location,
          status: server.status,
        },
        riskFactors: calculateRiskFactors(server),
        predictedTime: calculatePredictedFailureTime(
          prediction.failureProbability
        ),
        confidence: calculateConfidence(server.metrics, server.health.score),
        preventiveActions: generatePreventiveActions(
          server,
          prediction.failureProbability
        ),
      };

      predictions.push(analysisDetails);
      totalFailureProbability += prediction.failureProbability;

      if (prediction.failureProbability > 70) {
        highRiskCount++;
      }
    }

    // 3. 종합 분석 결과 생성
    const averageFailureProbability =
      totalFailureProbability / targetServers.length;
    const systemRiskLevel = getSystemRiskLevel(
      averageFailureProbability,
      highRiskCount
    );

    // 4. 권장사항 생성 (옵션)
    let systemRecommendations = [];
    if (includeRecommendations) {
      systemRecommendations = generateSystemRecommendations(
        predictions,
        averageFailureProbability,
        highRiskCount
      );
    }

    // 5. 예측 정확도 정보
    const accuracyMetrics = {
      modelVersion: predictiveAnalysisEngine.getModelVersion(),
      dataQuality: calculateDataQuality(targetServers),
      predictionConfidence: calculateOverallConfidence(predictions),
      lastTrainingDate: predictiveAnalysisEngine.getLastTrainingDate(),
      sampleSize: targetServers.length,
    };

    const processingTime = Date.now() - startTime;

    const response = {
      success: true,
      timestamp: new Date().toISOString(),
      processingTime: `${processingTime}ms`,

      // 요청 정보
      request: {
        serverId,
        timeframe: `${timeframe}h`,
        serverCount: targetServers.length,
        includeRecommendations,
      },

      // 예측 결과
      prediction: {
        overallRisk: {
          averageFailureProbability:
            Math.round(averageFailureProbability * 100) / 100,
          highRiskServers: highRiskCount,
          systemRiskLevel,
          nextPredictedFailure: findNextPredictedFailure(predictions),
        },

        serverPredictions: predictions.map(p => ({
          serverId: p.serverId,
          serverName: p.serverInfo.name,
          serverType: p.serverInfo.type,
          environment: p.serverInfo.environment,
          currentStatus: p.serverInfo.status,
          failureProbability: Math.round(p.failureProbability * 100) / 100,
          riskLevel:
            p.failureProbability > 70
              ? 'high'
              : p.failureProbability > 40
                ? 'medium'
                : 'low',
          predictedTime: p.predictedTime,
          confidence: p.confidence,
          riskFactors: p.riskFactors,
          preventiveActions: p.preventiveActions.slice(0, 3), // 상위 3개만
        })),
      },

      // 시스템 권장사항
      ...(includeRecommendations && {
        recommendations: {
          immediate: systemRecommendations.filter(
            r => r.priority === 'immediate'
          ),
          shortTerm: systemRecommendations.filter(
            r => r.priority === 'short-term'
          ),
          longTerm: systemRecommendations.filter(
            r => r.priority === 'long-term'
          ),
        },
      }),

      // 모델 정확도 정보
      modelAccuracy: accuracyMetrics,

      // 메타데이터
      metadata: {
        analysisType: 'predictive_failure_analysis',
        engine: 'PredictiveAnalysisEngine',
        algorithm: 'LSTM + Statistical Analysis',
        dataSource: 'RealServerDataGenerator',
        cacheEnabled: false,
        apiVersion: 'v1.0.0',
      },
    };

    console.log(
      `✅ 예측 분석 완료: ${targetServers.length}개 서버, ${processingTime}ms`
    );

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'no-cache, must-revalidate',
        'X-Processing-Time': `${processingTime}ms`,
        'X-Server-Count': targetServers.length.toString(),
        'X-High-Risk-Count': highRiskCount.toString(),
        'X-Average-Risk': averageFailureProbability.toFixed(2),
      },
    });
  } catch (error) {
    console.error('❌ 예측 분석 실패:', error);

    return NextResponse.json(
      {
        success: false,
        error: '예측 분석 중 오류가 발생했습니다',
        details: error instanceof Error ? error.message : '알 수 없는 오류',
        timestamp: new Date().toISOString(),
        processingTime: `${Date.now() - startTime}ms`,
      },
      { status: 500 }
    );
  }
}

// 유틸리티 함수들

function calculateRiskFactors(server: any): string[] {
  const factors = [];

  if (server.metrics.cpu > 80) factors.push('높은 CPU 사용률');
  if (server.metrics.memory > 85) factors.push('높은 메모리 사용률');
  if (server.metrics.disk > 90) factors.push('높은 디스크 사용률');
  if (server.metrics.errors > 5) factors.push('높은 에러율');
  if (server.health.score < 70) factors.push('낮은 헬스 스코어');
  if (server.status === 'warning') factors.push('경고 상태');
  if (server.status === 'error') factors.push('오류 상태');

  return factors;
}

function calculatePredictedFailureTime(probability: number): string | null {
  if (probability < 30) return null;

  // 확률에 따른 예상 시간 계산
  const hours = Math.max(1, Math.round((100 - probability) / 10));

  if (hours < 24) {
    return `${hours}시간 내`;
  } else {
    const days = Math.round(hours / 24);
    return `${days}일 내`;
  }
}

function calculateConfidence(metrics: any, healthScore: number): number {
  // 메트릭 데이터 품질과 헬스 스코어를 기반으로 신뢰도 계산
  let confidence = 0.7; // 기본 신뢰도

  if (healthScore > 80) confidence += 0.15;
  if (metrics.uptime > 86400) confidence += 0.1; // 1일 이상 운영
  if (metrics.errors < 2) confidence += 0.05;

  return Math.min(0.95, confidence);
}

function generatePreventiveActions(server: any, probability: number): string[] {
  const actions = [];

  if (probability > 70) {
    actions.push('즉시 서버 점검 및 리소스 모니터링 강화');
    actions.push('백업 서버 준비 및 장애 대응 계획 활성화');
  }

  if (server.metrics.cpu > 80) {
    actions.push('CPU 부하 분산 또는 스케일 업 검토');
  }

  if (server.metrics.memory > 85) {
    actions.push('메모리 사용량 최적화 및 메모리 리크 점검');
  }

  if (server.metrics.disk > 90) {
    actions.push('디스크 정리 및 용량 확장 검토');
  }

  if (server.metrics.errors > 5) {
    actions.push('애플리케이션 로그 분석 및 에러 원인 파악');
  }

  if (actions.length === 0) {
    actions.push('정기적인 헬스 체크 지속');
    actions.push('모니터링 강화 및 예방적 유지보수');
  }

  return actions;
}

function getSystemRiskLevel(
  averageProbability: number,
  highRiskCount: number
): string {
  if (highRiskCount > 0 || averageProbability > 60) return 'high';
  if (averageProbability > 30) return 'medium';
  return 'low';
}

function generateSystemRecommendations(
  predictions: any[],
  averageProbability: number,
  highRiskCount: number
) {
  const recommendations = [];

  if (highRiskCount > 0) {
    recommendations.push({
      priority: 'immediate',
      title: '고위험 서버 즉시 대응',
      description: `${highRiskCount}개 서버가 높은 장애 위험을 보이고 있습니다`,
      action: '즉시 점검 및 부하 분산 검토',
    });
  }

  if (averageProbability > 40) {
    recommendations.push({
      priority: 'short-term',
      title: '시스템 전반적 최적화',
      description: '전체 시스템의 평균 위험도가 높습니다',
      action: '인프라 확장 및 성능 튜닝',
    });
  }

  recommendations.push({
    priority: 'long-term',
    title: '예방적 모니터링 강화',
    description: '지속적인 시스템 안정성 확보',
    action: '자동화된 모니터링 및 알림 시스템 구축',
  });

  return recommendations;
}

function findNextPredictedFailure(predictions: any[]) {
  const highRiskPredictions = predictions
    .filter(p => p.failureProbability > 50)
    .sort((a, b) => b.failureProbability - a.failureProbability);

  if (highRiskPredictions.length === 0) return null;

  const next = highRiskPredictions[0];
  return {
    serverId: next.serverId,
    serverName: next.serverInfo.name,
    probability: Math.round(next.failureProbability * 100) / 100,
    timeToFailure: next.predictedTime,
  };
}

function calculateDataQuality(servers: any[]): number {
  let qualityScore = 1.0;

  // 서버 수가 적으면 품질 점수 감소
  if (servers.length < 10) qualityScore -= 0.1;

  // 서버 상태가 좋지 않으면 품질 점수 감소
  const unhealthyServers = servers.filter(s => s.health.score < 70).length;
  qualityScore -= (unhealthyServers / servers.length) * 0.2;

  return Math.max(0.5, qualityScore);
}

function calculateOverallConfidence(predictions: any[]): number {
  const totalConfidence = predictions.reduce((sum, p) => sum + p.confidence, 0);
  return totalConfidence / predictions.length;
}
