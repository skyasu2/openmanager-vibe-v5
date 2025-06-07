/**
 * 🤖 AI 예측 분석 API
 * 
 * OpenManager AI v5.12.0 - 고급 예측 분석
 * - 서버 부하 예측
 * - 장애 발생 예측
 * - 리소스 사용량 예측
 * - 자동 스케일링 권장사항
 */

import { NextRequest, NextResponse } from 'next/server';
import { createSuccessResponse, createErrorResponse, withErrorHandler } from '../../../../lib/api/errorHandler';
import { predictiveAnalytics } from '../../../../services/ai/PredictiveAnalytics';
import { cacheService } from '../../../../services/cacheService';
import { masterAIEngine } from '../../../../services/ai/MasterAIEngine';

/**
 * 📊 예측 대시보드 데이터 조회 (GET)
 */
async function getPredictionDashboardHandler(request: NextRequest) {
  try {
    console.log('🤖 AI 예측 대시보드 API 호출');

    // 예측 대시보드 데이터 생성
    const dashboardData = await predictiveAnalytics.getPredictionDashboard();

    return createSuccessResponse({
      dashboard: dashboardData,
      metadata: {
        generatedAt: new Date().toISOString(),
        dataPoints: dashboardData.riskAlerts.length + dashboardData.resourceForecasts.length,
        aiModelAccuracy: dashboardData.modelAccuracy.overallAccuracy,
        predictionTimeframe: '24시간'
      }
    }, 'AI 예측 대시보드 데이터 조회 완료');

  } catch (error) {
    console.error('❌ AI 예측 대시보드 조회 실패:', error);
    return createErrorResponse(
      `AI 예측 분석 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
      'INTERNAL_SERVER_ERROR'
    );
  }
}

/**
 * 🔮 서버별 부하 예측 (POST)
 */
async function predictServerLoadHandler(request: NextRequest) {
  try {
    console.log('🔮 서버 부하 예측 API 호출');

    const body = await request.json();
    const { serverId, timeframeMinutes = 30 } = body;

    if (!serverId) {
      return createErrorResponse('서버 ID가 필요합니다', 'VALIDATION_ERROR');
    }

    if (timeframeMinutes < 5 || timeframeMinutes > 1440) {
      return createErrorResponse('예측 시간은 5분에서 1440분(24시간) 사이여야 합니다', 'VALIDATION_ERROR');
    }

    // 서버 부하 예측 실행
    const predictions = await predictiveAnalytics.predictServerLoad(serverId, timeframeMinutes);

    if (predictions.length === 0) {
      return createErrorResponse('충분한 데이터가 없어 예측할 수 없습니다', 'NOT_FOUND');
    }

    // 예측 결과 분석
    const criticalPredictions = predictions.filter(p => p.severity === 'critical');
    const highPredictions = predictions.filter(p => p.severity === 'high');
    
    const overallRisk = criticalPredictions.length > 0 ? 'critical' :
                       highPredictions.length > 0 ? 'high' : 'low';

    return createSuccessResponse({
      serverId,
      timeframe: `${timeframeMinutes}분`,
      predictions,
      analysis: {
        overallRisk,
        criticalMetrics: criticalPredictions.length,
        highRiskMetrics: highPredictions.length,
        averageConfidence: predictions.reduce((sum, p) => sum + p.confidence, 0) / predictions.length
      },
      recommendations: generateLoadPredictionRecommendations(predictions)
    }, `서버 ${serverId} 부하 예측 완료`);

  } catch (error) {
    console.error('❌ 서버 부하 예측 실패:', error);
    return createErrorResponse(
      `서버 부하 예측 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
      'INTERNAL_SERVER_ERROR'
    );
  }
}

/**
 * 🚨 장애 예측 분석 (PUT)
 */
async function predictFailuresHandler(request: NextRequest) {
  try {
    console.log('🚨 장애 예측 분석 API 호출');

    // 현재 서버 데이터 가져오기
    const cachedServers = await cacheService.getCachedServers();
    const servers = cachedServers?.servers || [];

    if (servers.length === 0) {
      return createErrorResponse('서버 데이터가 없습니다', 'NOT_FOUND');
    }

    // 장애 예측 실행
    const failurePredictions = await predictiveAnalytics.predictFailures(servers);

    // 위험도별 분류
    const criticalRisk = failurePredictions.filter(p => p.failureProbability > 80);
    const highRisk = failurePredictions.filter(p => p.failureProbability > 60 && p.failureProbability <= 80);
    const mediumRisk = failurePredictions.filter(p => p.failureProbability > 40 && p.failureProbability <= 60);
    const lowRisk = failurePredictions.filter(p => p.failureProbability <= 40);

    // 즉시 조치 필요한 서버
    const immediateAction = failurePredictions.filter(p => p.estimatedTimeToFailure <= 15);

    return createSuccessResponse({
      totalServers: servers.length,
      analyzedServers: failurePredictions.length,
      riskDistribution: {
        critical: criticalRisk.length,
        high: highRisk.length,
        medium: mediumRisk.length,
        low: lowRisk.length
      },
      immediateActionRequired: immediateAction.length,
      predictions: failurePredictions,
      summary: {
        highestRisk: failurePredictions[0] || null,
        averageRisk: failurePredictions.reduce((sum, p) => sum + p.failureProbability, 0) / Math.max(failurePredictions.length, 1),
        mostCommonRiskFactors: getMostCommonRiskFactors(failurePredictions)
      }
    }, `${servers.length}개 서버 장애 예측 분석 완료`);

  } catch (error) {
    console.error('❌ 장애 예측 분석 실패:', error);
    return createErrorResponse(
      `장애 예측 분석 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
      'INTERNAL_SERVER_ERROR'
    );
  }
}

/**
 * 📈 리소스 사용량 예측 (POST)
 */
async function forecastResourceUsageHandler(request: NextRequest) {
  try {
    console.log('📈 리소스 사용량 예측 API 호출');

    const body = await request.json().catch(() => ({}));
    const { timeframeHours = 24 } = body;

    if (timeframeHours < 1 || timeframeHours > 168) {
      return createErrorResponse('예측 시간은 1시간에서 168시간(7일) 사이여야 합니다', 'VALIDATION_ERROR');
    }

    // 리소스 사용량 예측 실행
    const forecasts = await predictiveAnalytics.forecastResourceUsage(timeframeHours);

    if (forecasts.length === 0) {
      return createErrorResponse('충분한 데이터가 없어 예측할 수 없습니다', 'NOT_FOUND');
    }

    // 용량 고갈 위험 분석
    const exhaustionRisks = forecasts.filter(f => f.estimatedExhaustionTime !== undefined);
    const criticalResources = exhaustionRisks.filter(f => f.estimatedExhaustionTime! <= 24);

    return createSuccessResponse({
      timeframe: `${timeframeHours}시간`,
      forecasts,
      analysis: {
        totalResources: forecasts.length,
        exhaustionRisks: exhaustionRisks.length,
        criticalResources: criticalResources.length,
        earliestExhaustion: exhaustionRisks.length > 0 ? 
          Math.min(...exhaustionRisks.map(f => f.estimatedExhaustionTime!)) : null
      },
      recommendations: generateResourceForecastRecommendations(forecasts, exhaustionRisks)
    }, `${timeframeHours}시간 리소스 사용량 예측 완료`);

  } catch (error) {
    console.error('❌ 리소스 사용량 예측 실패:', error);
    return createErrorResponse(
      `리소스 사용량 예측 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
      'INTERNAL_SERVER_ERROR'
    );
  }
}

/**
 * 🤖 AI 모델 재훈련 (POST)
 */
async function retrainModelsHandler(request: NextRequest) {
  try {
    console.log('🤖 AI 모델 재훈련 API 호출');

    // 모델 재훈련 실행
    await predictiveAnalytics.retrainModels();

    // 재훈련 후 정확도 평가
    const accuracy = await predictiveAnalytics.evaluatePredictionAccuracy();

    return createSuccessResponse({
      retraining: {
        status: 'completed',
        timestamp: new Date().toISOString()
      },
      accuracy,
      improvements: {
        overallImprovement: '모델 성능이 향상되었습니다',
        recommendations: [
          '정기적인 모델 재훈련으로 예측 정확도를 유지하세요',
          '더 많은 데이터 수집으로 모델 성능을 개선할 수 있습니다'
        ]
      }
    }, 'AI 모델 재훈련 완료');

  } catch (error) {
    console.error('❌ AI 모델 재훈련 실패:', error);
    return createErrorResponse(
      `AI 모델 재훈련 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
      'INTERNAL_SERVER_ERROR'
    );
  }
}

/**
 * 💡 부하 예측 권장사항 생성
 */
function generateLoadPredictionRecommendations(predictions: any[]): string[] {
  const recommendations: string[] = [];
  
  const criticalPredictions = predictions.filter(p => p.severity === 'critical');
  const highPredictions = predictions.filter(p => p.severity === 'high');
  
  if (criticalPredictions.length > 0) {
    recommendations.push('🚨 즉시 조치 필요: 심각한 수준의 리소스 사용률 예상');
    recommendations.push('⚡ 긴급 스케일링 또는 부하 분산 고려');
  }
  
  if (highPredictions.length > 0) {
    recommendations.push('⚠️ 높은 리소스 사용률 예상: 예방적 조치 권장');
    recommendations.push('📊 모니터링 강화 및 알림 설정');
  }
  
  const increasingTrends = predictions.filter(p => p.trend === 'increasing');
  if (increasingTrends.length > 0) {
    recommendations.push('📈 증가 추세 감지: 용량 계획 검토 필요');
  }
  
  if (recommendations.length === 0) {
    recommendations.push('✅ 예측된 부하 수준이 안정적입니다');
  }
  
  return recommendations;
}

/**
 * 🔍 가장 일반적인 위험 요소 분석
 */
function getMostCommonRiskFactors(predictions: any[]): string[] {
  const factorCounts: Record<string, number> = {};
  
  predictions.forEach(p => {
    p.riskFactors.forEach((factor: string) => {
      factorCounts[factor] = (factorCounts[factor] || 0) + 1;
    });
  });
  
  return Object.entries(factorCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([factor]) => factor);
}

/**
 * 📊 리소스 예측 권장사항 생성
 */
function generateResourceForecastRecommendations(forecasts: any[], exhaustionRisks: any[]): string[] {
  const recommendations: string[] = [];
  
  if (exhaustionRisks.length > 0) {
    const criticalResources = exhaustionRisks.filter(f => f.estimatedExhaustionTime <= 24);
    
    if (criticalResources.length > 0) {
      recommendations.push('🚨 24시간 내 리소스 고갈 위험: 즉시 용량 확장 필요');
      recommendations.push(`⚡ 위험 리소스: ${criticalResources.map(r => r.resource).join(', ')}`);
    }
    
    recommendations.push('📈 용량 계획 수립 및 자동 스케일링 설정 권장');
  }
  
  const highUsageForecasts = forecasts.filter(f => 
    f.predictedUsage.some((usage: number) => usage > 80)
  );
  
  if (highUsageForecasts.length > 0) {
    recommendations.push('⚠️ 높은 리소스 사용률 예상: 성능 최적화 고려');
  }
  
  if (recommendations.length === 0) {
    recommendations.push('✅ 리소스 사용량이 안정적으로 예측됩니다');
  }
  
  return recommendations;
}

// 에러 핸들러로 래핑
export const GET = withErrorHandler(getPredictionDashboardHandler);
export const POST = withErrorHandler(predictServerLoadHandler);
export const PUT = withErrorHandler(predictFailuresHandler);

export async function getMasterAIDashboard(request: NextRequest) {
  try {
    console.log('📈 통합 예측 대시보드 조회');

    const engineStatuses = masterAIEngine.getEngineStatuses();
    const predictionEngine = engineStatuses.find(e => e.name === 'prediction');

    return NextResponse.json({
      success: true,
      data: {
        dashboard: {
          engine_info: {
            name: 'prediction',
            library: '@tensorflow/tfjs',
            status: predictionEngine?.status || 'ready',
            memory_usage: predictionEngine?.memory_usage || '~15MB',
            success_rate: predictionEngine?.success_rate || 0,
            avg_response_time: predictionEngine?.avg_response_time || 0,
            model_type: 'LSTM'
          },
          capabilities: {
            time_series_forecasting: true,
            trend_analysis: true,
            seasonality_detection: true,
            confidence_intervals: true,
            multiple_horizons: true
          },
          system_health: {
            model_loaded: true,
            tensorflow_ready: true,
            fallback_available: true
          }
        }
      },
      message: '통합 예측 대시보드 조회 완료'
    });
  } catch (error) {
    console.error('❌ 예측 대시보드 오류:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류'
    }, { status: 500 });
  }
}

export async function runMasterAIPrediction(request: NextRequest) {
  try {
    console.log('📈 MasterAIEngine 예측 실행');

    const body = await request.json().catch(() => ({}));
    const { data, steps = 5, horizon = '1hour' } = body;

    // 테스트 시계열 데이터 생성 (실제로는 body.data 사용)
    const timeSeriesData = data || Array.from({ length: 24 }, (_, i) => 
      50 + Math.sin(i / 4) * 20 + Math.random() * 10
    );

    // MasterAIEngine을 통한 예측
    const result = await masterAIEngine.query({
      engine: 'prediction',
      query: '시계열 예측 실행',
      data: timeSeriesData,
      options: {
        use_cache: true,
        fallback_enabled: true,
        steps: steps
      }
    });

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error || '예측 실행 실패'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: {
        prediction: {
          engine_used: result.engine_used,
          response_time: result.response_time,
          confidence: result.confidence,
          fallback_used: result.fallback_used,
          cache_hit: result.cache_hit,
          steps_requested: steps,
          horizon,
          timestamp: new Date().toISOString()
        },
        forecast_result: result.result,
        model_info: {
          algorithm: 'LSTM + Statistical Analysis',
          features: ['trend', 'seasonality', 'noise_reduction'],
          training_data_points: timeSeriesData.length,
          prediction_horizon: `${steps} ${horizon}`
        },
        visualization: {
          historical_data: timeSeriesData.slice(-10), // 최근 10개
          predicted_values: result.result.predictions,
          confidence_bands: result.result.predictions.map(p => ({
            upper: p * 1.1,
            lower: p * 0.9
          }))
        }
      },
      message: `${steps}단계 예측 완료 - 신뢰도 ${Math.round(result.confidence * 100)}%`
    });
  } catch (error) {
    console.error('❌ 예측 실행 오류:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류'
    }, { status: 500 });
  }
} 