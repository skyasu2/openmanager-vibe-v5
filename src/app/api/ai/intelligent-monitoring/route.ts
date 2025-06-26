/**
 * 🧠 지능형 모니터링 통합 API
 *
 * 3단계 AI 분석 워크플로우:
 * 1단계: 🚨 이상 탐지
 * 2단계: 🔍 근본 원인 분석
 * 3단계: 🔮 예측적 모니터링
 */

import { PredictiveAnalysisEngine } from '@/engines/PredictiveAnalysisEngine';
import { AnomalyDetection } from '@/services/ai/AnomalyDetection';
import { KoreanAIEngine } from '@/services/ai/korean-ai-engine';
import { NextRequest, NextResponse } from 'next/server';

interface IntelligentAnalysisRequest {
  serverId?: string;
  analysisDepth: 'quick' | 'standard' | 'deep';
  includeSteps: {
    anomalyDetection: boolean;
    rootCauseAnalysis: boolean;
    predictiveMonitoring: boolean;
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const analysisRequest: IntelligentAnalysisRequest = {
      serverId: body.serverId,
      analysisDepth: body.analysisDepth || 'standard',
      includeSteps: {
        anomalyDetection: body.includeSteps?.anomalyDetection ?? true,
        rootCauseAnalysis: body.includeSteps?.rootCauseAnalysis ?? true,
        predictiveMonitoring: body.includeSteps?.predictiveMonitoring ?? true,
      },
    };

    const analysisId = `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const startTime = Date.now();

    console.log('🧠 지능형 모니터링 분석 시작:', {
      analysisId,
      serverId: analysisRequest.serverId,
      depth: analysisRequest.analysisDepth,
      steps: analysisRequest.includeSteps,
    });

    // Korean AI 엔진 초기화
    const koreanAI = new KoreanAIEngine();
    await koreanAI.initialize();

    const result = {
      analysisId,
      timestamp: new Date().toISOString(),
      request: analysisRequest,
      anomalyDetection: {
        status: 'skipped' as 'completed' | 'failed' | 'skipped',
        anomalies: [] as any[],
        summary: '',
        confidence: 0,
        processingTime: 0,
      },
      rootCauseAnalysis: {
        status: 'skipped' as 'completed' | 'failed' | 'skipped',
        causes: [] as any[],
        aiInsights: [] as any[],
        summary: '',
        confidence: 0,
        processingTime: 0,
      },
      predictiveMonitoring: {
        status: 'skipped' as 'completed' | 'failed' | 'skipped',
        predictions: [] as any[],
        recommendations: [] as any[],
        summary: '',
        confidence: 0,
        processingTime: 0,
      },
      overallResult: {
        severity: 'low' as 'low' | 'medium' | 'high' | 'critical',
        actionRequired: false,
        priorityActions: [] as any[],
        summary: '',
        confidence: 0,
        totalProcessingTime: 0,
      },
    };

    // 1단계: 이상 탐지
    if (analysisRequest.includeSteps.anomalyDetection) {
      const stepStartTime = Date.now();
      try {
        console.log('🚨 이상 탐지 실행 중...');

        // 목업 서버 메트릭 데이터
        const serverMetrics = [
          {
            id: analysisRequest.serverId || 'web-server-01',
            hostname: 'web-server-01.example.com',
            cpu_usage: 75,
            memory_usage: 82,
            disk_usage: 65,
            response_time: 250,
            status: 'running',
            uptime: 95.8,
            timestamp: new Date().toISOString(),
          },
        ];

        // 이상 탐지 엔진 사용
        const anomalyDetection = AnomalyDetection.getInstance();
        const anomalies: any[] = await anomalyDetection.detectAnomalies(serverMetrics);

        result.anomalyDetection = {
          status: 'completed',
          anomalies,
          summary:
            anomalies.length === 0
              ? '현재 시스템에서 이상 징후가 감지되지 않았습니다.'
              : `총 ${anomalies.length}개의 이상 징후가 감지되었습니다.`,
          confidence: anomalies.length === 0 ? 0.95 : 0.8,
          processingTime: Date.now() - stepStartTime,
        };

        console.log(`✅ 이상 탐지 완료: ${anomalies.length}개 이상 징후 발견`);
      } catch (error) {
        console.error('❌ 이상 탐지 실패:', error);
        result.anomalyDetection = {
          status: 'failed',
          anomalies: [],
          summary: '이상 탐지 실행 중 오류가 발생했습니다.',
          confidence: 0,
          processingTime: Date.now() - stepStartTime,
        };
      }
    }

    // 2단계: 근본 원인 분석
    if (analysisRequest.includeSteps.rootCauseAnalysis) {
      const stepStartTime = Date.now();
      try {
        console.log('🔍 근본 원인 분석 실행 중...');

        const causes: any[] = [];
        const aiInsights: Array<{
          engine: string;
          insight: any;
          confidence: any;
          supportingData: any;
        }> = [];

        // Korean AI 엔진을 사용한 근본 원인 분석
        try {
          const prompt = `시스템에서 ${result.anomalyDetection.anomalies.length}개의 이상 징후가 발견되었습니다. 근본 원인을 분석해주세요.
            
이상 징후: ${JSON.stringify(result.anomalyDetection.anomalies, null, 2)}

근본 원인 분석 결과를 다음 형식으로 제공해주세요:
1. 가장 가능성 높은 원인
2. 증거 및 근거
3. 권장 조치사항`;

          const response = await koreanAI.processQuery(prompt);

          if (response.success) {
            aiInsights.push({
              engine: 'KoreanAI',
              insight: response.response,
              confidence: response.confidence,
              supportingData: {
                anomalies: result.anomalyDetection.anomalies,
              },
            });

            causes.push({
              id: 'korean_ai_cause_1',
              category: 'system',
              description: response.response.substring(0, 200) + '...',
              probability: response.confidence,
              evidence: [response.response],
              aiEngine: 'KoreanAI',
              recommendations: ['Korean AI 권장사항 확인 필요'],
            });
          }
        } catch (error) {
          console.warn('Korean AI 분석 실패:', error);
        }

        // 기본 근본 원인 분석
        if (result.anomalyDetection.anomalies.length > 0) {
          result.anomalyDetection.anomalies.forEach(
            (anomaly: any, index: number) => {
              causes.push({
                id: `basic_cause_${index}`,
                category: 'system',
                description: `${anomaly.description || '시스템 이상'}으로 인한 성능 저하`,
                probability: 0.7,
                evidence: [anomaly.description || '이상 징후 감지'],
                aiEngine: 'BasicAnalysis',
                recommendations: ['시스템 점검 필요'],
              });
            }
          );
        }

        result.rootCauseAnalysis = {
          status: 'completed',
          causes: causes.sort((a, b) => b.probability - a.probability),
          aiInsights,
          summary:
            causes.length === 0
              ? '명확한 근본 원인을 식별하지 못했습니다.'
              : `${aiInsights.length}개 AI 엔진 분석 결과, 가장 가능성 높은 원인: ${causes[0]?.description} (확률: ${Math.round((causes[0]?.probability || 0) * 100)}%)`,
          confidence: causes.length > 0 ? 0.8 : 0.3,
          processingTime: Date.now() - stepStartTime,
        };

        console.log(`✅ 근본 원인 분석 완료: ${causes.length}개 원인 식별`);
      } catch (error) {
        console.error('❌ 근본 원인 분석 실패:', error);
        result.rootCauseAnalysis = {
          status: 'failed',
          causes: [],
          aiInsights: [],
          summary: '근본 원인 분석 실행 중 오류가 발생했습니다.',
          confidence: 0,
          processingTime: Date.now() - stepStartTime,
        };
      }
    }

    // 3단계: 예측적 모니터링
    if (analysisRequest.includeSteps.predictiveMonitoring) {
      const stepStartTime = Date.now();
      try {
        console.log('🔮 예측적 모니터링 실행 중...');

        const predictions: any[] = [];
        const recommendations: any[] = [];

        // 예측적 분석 엔진 사용
        const predictiveEngine = new PredictiveAnalysisEngine();

        if (analysisRequest.serverId) {
          const prediction = await predictiveEngine.predictFailure(
            analysisRequest.serverId
          );
          if (prediction) {
            predictions.push(prediction);
            recommendations.push(...(prediction.preventiveActions || []));
          }
        } else {
          // 시스템 전체 예측
          const serverIds = ['web-server-01', 'web-server-02', 'db-server-01'];
          for (const serverId of serverIds) {
            try {
              const prediction =
                await predictiveEngine.predictFailure(serverId);
              if (prediction) {
                predictions.push(prediction);
              }
            } catch (error) {
              console.warn(`서버 ${serverId} 예측 실패:`, error);
            }
          }

          // 시스템 레벨 권장사항
          const highRiskServers = predictions.filter(
            p => p.failureProbability > 70
          );
          if (highRiskServers.length > 0) {
            recommendations.push(
              '🚨 고위험 서버들에 대한 즉시 점검 및 예방 조치 필요'
            );
            recommendations.push('⚡ 로드 밸런싱 재구성으로 부하 분산');
          }
          if (predictions.length > 2) {
            recommendations.push('📊 시스템 전반적 용량 계획 검토');
          }
        }

        const avgRisk =
          predictions.length > 0
            ? predictions.reduce(
              (sum, p) => sum + (p.failureProbability || 0),
              0
            ) / predictions.length
            : 0;
        const highRiskCount = predictions.filter(
          p => p.failureProbability > 70
        ).length;

        result.predictiveMonitoring = {
          status: 'completed',
          predictions,
          recommendations,
          summary:
            predictions.length === 0
              ? '예측 분석을 위한 충분한 데이터가 없습니다.'
              : `${predictions.length}개 서버 분석 결과, 평균 장애 위험도: ${Math.round(avgRisk)}%, 고위험 서버: ${highRiskCount}개`,
          confidence: predictions.length > 0 ? 0.8 : 0.5,
          processingTime: Date.now() - stepStartTime,
        };

        console.log(
          `✅ 예측적 모니터링 완료: ${predictions.length}개 예측 생성`
        );
      } catch (error) {
        console.error('❌ 예측적 모니터링 실패:', error);
        result.predictiveMonitoring = {
          status: 'failed',
          predictions: [],
          recommendations: [],
          summary: '예측적 모니터링 실행 중 오류가 발생했습니다.',
          confidence: 0,
          processingTime: Date.now() - stepStartTime,
        };
      }
    }

    // 통합 결과 생성
    const anomalyCount = result.anomalyDetection.anomalies?.length || 0;
    const criticalCauses =
      result.rootCauseAnalysis.causes?.filter(c => c.probability > 0.7)
        .length || 0;
    const highRiskPredictions =
      result.predictiveMonitoring.predictions?.filter(
        p => p.failureProbability > 70
      ).length || 0;

    // 심각도 계산
    let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';
    if (highRiskPredictions > 0 || criticalCauses > 2) {
      severity = 'critical';
    } else if (anomalyCount > 3 || criticalCauses > 0) {
      severity = 'high';
    } else if (anomalyCount > 1) {
      severity = 'medium';
    }

    const actionRequired = severity === 'critical' || severity === 'high';
    const priorityActions: string[] = [];

    if (highRiskPredictions > 0) {
      priorityActions.push('🚨 장애 위험 서버 즉시 점검 필요');
    }
    if (criticalCauses > 0) {
      priorityActions.push('🔍 근본 원인 해결 조치 실행');
    }
    if (anomalyCount > 3) {
      priorityActions.push('📊 시스템 전반적 성능 점검');
    }

    // 통합 요약 생성
    const summaryParts: string[] = [];
    if (result.anomalyDetection.status === 'completed') {
      summaryParts.push(result.anomalyDetection.summary);
    }
    if (result.rootCauseAnalysis.status === 'completed') {
      summaryParts.push(result.rootCauseAnalysis.summary);
    }
    if (result.predictiveMonitoring.status === 'completed') {
      summaryParts.push(result.predictiveMonitoring.summary);
    }

    const totalConfidence =
      (result.anomalyDetection.confidence +
        result.rootCauseAnalysis.confidence +
        result.predictiveMonitoring.confidence) /
      3;

    result.overallResult = {
      severity,
      actionRequired,
      priorityActions,
      summary: `[${severity.toUpperCase()}] ${summaryParts.join(' ')}`,
      confidence: Math.round(totalConfidence * 100) / 100,
      totalProcessingTime: Date.now() - startTime,
    };

    console.log(
      `✅ 지능형 모니터링 분석 완료: ${analysisId} (${result.overallResult.totalProcessingTime}ms)`
    );

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('❌ 지능형 모니터링 API 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: '지능형 모니터링 분석 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : '알 수 없는 오류',
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    message: '🧠 지능형 모니터링 API',
    description:
      '3단계 AI 분석 워크플로우: 이상 탐지 → 근본 원인 분석 → 예측적 모니터링',
    endpoints: {
      POST: '지능형 모니터링 분석 실행',
      'GET /status': '분석 상태 조회',
    },
    version: '1.0.0',
  });
}
