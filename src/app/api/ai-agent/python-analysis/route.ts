/**
 * Python Analysis API Endpoint
 * 
 * 🐍 Python 기반 AI 분석 엔진 전용 API
 * - 시계열 예측, 이상 탐지, 분류, 클러스터링, 상관관계 분석
 * - EnhancedAIAgentEngine과 통합
 * - 실시간 서버 메트릭 분석
 */

import { NextRequest, NextResponse } from 'next/server';
import { enhancedAIAgentEngine } from '@/modules/ai-agent/core/EnhancedAIAgentEngine';
import { PythonAnalysisRunner } from '@/modules/ai-agent/core/PythonAnalysisRunner';
import { 
  AnalysisRequest,
  ForecastRequest,
  AnomalyRequest,
  ClassificationRequest,
  ClusteringRequest,
  CorrelationRequest,
  PythonAnalysisResult
} from '@/modules/ai-agent/types/PythonAnalysisTypes';

interface PythonAnalysisAPIRequest {
  action: 'analyze' | 'forecast' | 'anomaly' | 'classification' | 'clustering' | 'correlation' | 'status';
  serverData?: any;
  analysisConfig?: {
    methods?: string[];
    params?: Record<string, any>;
  };
  data?: any;
}

interface PythonAnalysisAPIResponse {
  success: boolean;
  data?: any;
  error?: string;
  metadata: {
    timestamp: string;
    processingTime: number;
    engineStatus: string;
    version: string;
  };
}

/**
 * 🔍 POST - Python 분석 실행
 */
export async function POST(request: NextRequest): Promise<NextResponse<PythonAnalysisAPIResponse>> {
  const startTime = Date.now();
  
  try {
    const body: PythonAnalysisAPIRequest = await request.json();
    const { action, serverData, analysisConfig, data } = body;

    // 엔진 초기화 확인
    if (!enhancedAIAgentEngine) {
      return NextResponse.json({
        success: false,
        error: 'AI Agent Engine이 초기화되지 않았습니다.',
        metadata: {
          timestamp: new Date().toISOString(),
          processingTime: Date.now() - startTime,
          engineStatus: 'not_initialized',
          version: '1.0.0'
        }
      }, { status: 500 });
    }

    const pythonRunner = PythonAnalysisRunner.getInstance();

    switch (action) {
      case 'analyze':
        // 통합 분석 실행
        return await handleIntegratedAnalysis(serverData, analysisConfig, startTime);

      case 'forecast':
        // 시계열 예측
        return await handleForecastAnalysis(pythonRunner, data as ForecastRequest, startTime);

      case 'anomaly':
        // 이상 탐지
        return await handleAnomalyAnalysis(pythonRunner, data as AnomalyRequest, startTime);

      case 'classification':
        // 분류 분석
        return await handleClassificationAnalysis(pythonRunner, data as ClassificationRequest, startTime);

      case 'clustering':
        // 클러스터링
        return await handleClusteringAnalysis(pythonRunner, data as ClusteringRequest, startTime);

      case 'correlation':
        // 상관관계 분석
        return await handleCorrelationAnalysis(pythonRunner, data as CorrelationRequest, startTime);

      case 'status':
        // 엔진 상태 조회
        return await handleStatusCheck(startTime);

      default:
        return NextResponse.json({
          success: false,
          error: `지원하지 않는 액션: ${action}`,
          metadata: {
            timestamp: new Date().toISOString(),
            processingTime: Date.now() - startTime,
            engineStatus: 'error',
            version: '1.0.0'
          }
        }, { status: 400 });
    }

  } catch (error) {
    console.error('Python Analysis API 오류:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
      metadata: {
        timestamp: new Date().toISOString(),
        processingTime: Date.now() - startTime,
        engineStatus: 'error',
        version: '1.0.0'
      }
    }, { status: 500 });
  }
}

/**
 * 🔍 GET - Python 엔진 상태 조회
 */
export async function GET(): Promise<NextResponse<PythonAnalysisAPIResponse>> {
  const startTime = Date.now();

  try {
    const engineStatus = enhancedAIAgentEngine.getEngineStatus();
    const pythonStatus = enhancedAIAgentEngine.getPythonEngineStatus();

    return NextResponse.json({
      success: true,
      data: {
        engine: engineStatus,
        python: pythonStatus,
        capabilities: {
          forecast: true,
          anomaly_detection: true,
          classification: true,
          clustering: true,
          correlation_analysis: true
        },
        supported_models: {
          forecast: ['arima', 'prophet', 'linear'],
          anomaly: ['isolation_forest', 'autoencoder', 'lof', 'knn'],
          classification: ['random_forest', 'gradient_boost', 'svm'],
          clustering: ['kmeans', 'dbscan', 'hierarchical'],
          correlation: ['pearson', 'spearman', 'kendall']
        }
      },
      metadata: {
        timestamp: new Date().toISOString(),
        processingTime: Date.now() - startTime,
        engineStatus: engineStatus.isInitialized ? 'running' : 'stopped',
        version: '1.0.0'
      }
    });

  } catch (error) {
    console.error('Python Engine 상태 조회 오류:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '상태 조회 실패',
      metadata: {
        timestamp: new Date().toISOString(),
        processingTime: Date.now() - startTime,
        engineStatus: 'error',
        version: '1.0.0'
      }
    }, { status: 500 });
  }
}

// ===== 핸들러 함수들 =====

/**
 * 📊 통합 분석 처리
 */
async function handleIntegratedAnalysis(
  serverData: any,
  analysisConfig: any,
  startTime: number
): Promise<NextResponse<PythonAnalysisAPIResponse>> {
  try {
    // EnhancedAIAgentEngine을 통한 통합 분석
    const analysisResult = await enhancedAIAgentEngine.executePythonAnalysis(serverData);

    if (!analysisResult) {
      return NextResponse.json({
        success: false,
        error: 'Python 분석 엔진을 사용할 수 없습니다.',
        metadata: {
          timestamp: new Date().toISOString(),
          processingTime: Date.now() - startTime,
          engineStatus: 'python_unavailable',
          version: '1.0.0'
        }
      }, { status: 503 });
    }

    return NextResponse.json({
      success: true,
      data: {
        analysis: analysisResult,
        insights: {
          summary: analysisResult.summary,
          key_findings: generateKeyFindings(analysisResult),
          recommendations: analysisResult.summary.recommendations,
          confidence_level: getConfidenceLevel(analysisResult.summary.confidence_score)
        }
      },
      metadata: {
        timestamp: new Date().toISOString(),
        processingTime: Date.now() - startTime,
        engineStatus: 'success',
        version: '1.0.0'
      }
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: `통합 분석 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
      metadata: {
        timestamp: new Date().toISOString(),
        processingTime: Date.now() - startTime,
        engineStatus: 'error',
        version: '1.0.0'
      }
    }, { status: 500 });
  }
}

/**
 * 🔮 시계열 예측 처리
 */
async function handleForecastAnalysis(
  pythonRunner: PythonAnalysisRunner,
  data: ForecastRequest,
  startTime: number
): Promise<NextResponse<PythonAnalysisAPIResponse>> {
  try {
    const result = await pythonRunner.forecastTimeSeries(data);

    return NextResponse.json({
      success: result.success,
      data: result.success ? {
        forecast: result.result,
        visualization_data: prepareForecastVisualization(result.result!)
      } : undefined,
      error: result.success ? undefined : '시계열 예측 실패',
      metadata: {
        timestamp: new Date().toISOString(),
        processingTime: Date.now() - startTime,
        engineStatus: result.success ? 'success' : 'error',
        version: '1.0.0'
      }
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: `예측 분석 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
      metadata: {
        timestamp: new Date().toISOString(),
        processingTime: Date.now() - startTime,
        engineStatus: 'error',
        version: '1.0.0'
      }
    }, { status: 500 });
  }
}

/**
 * 🚨 이상 탐지 처리
 */
async function handleAnomalyAnalysis(
  pythonRunner: PythonAnalysisRunner,
  data: AnomalyRequest,
  startTime: number
): Promise<NextResponse<PythonAnalysisAPIResponse>> {
  try {
    const result = await pythonRunner.detectAnomalies(data);

    return NextResponse.json({
      success: result.success,
      data: result.success ? {
        anomalies: result.result,
        summary: {
          total_samples: result.result!.statistics.total_samples,
          anomaly_count: result.result!.statistics.anomaly_count,
          anomaly_rate: result.result!.statistics.anomaly_percentage,
          severity: getAnomalySeverity(result.result!.statistics.anomaly_percentage)
        }
      } : undefined,
      error: result.success ? undefined : '이상 탐지 실패',
      metadata: {
        timestamp: new Date().toISOString(),
        processingTime: Date.now() - startTime,
        engineStatus: result.success ? 'success' : 'error',
        version: '1.0.0'
      }
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: `이상 탐지 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
      metadata: {
        timestamp: new Date().toISOString(),
        processingTime: Date.now() - startTime,
        engineStatus: 'error',
        version: '1.0.0'
      }
    }, { status: 500 });
  }
}

/**
 * 🎲 분류 분석 처리
 */
async function handleClassificationAnalysis(
  pythonRunner: PythonAnalysisRunner,
  data: ClassificationRequest,
  startTime: number
): Promise<NextResponse<PythonAnalysisAPIResponse>> {
  try {
    const result = await pythonRunner.classifyData(data);

    return NextResponse.json({
      success: result.success,
      data: result.success ? {
        classification: result.result,
        model_performance: {
          accuracy: result.result!.accuracy,
          cross_validation: result.result!.cross_validation_scores,
          feature_importance: result.result!.feature_importance
        }
      } : undefined,
      error: result.success ? undefined : '분류 분석 실패',
      metadata: {
        timestamp: new Date().toISOString(),
        processingTime: Date.now() - startTime,
        engineStatus: result.success ? 'success' : 'error',
        version: '1.0.0'
      }
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: `분류 분석 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
      metadata: {
        timestamp: new Date().toISOString(),
        processingTime: Date.now() - startTime,
        engineStatus: 'error',
        version: '1.0.0'
      }
    }, { status: 500 });
  }
}

/**
 * 🎯 클러스터링 처리
 */
async function handleClusteringAnalysis(
  pythonRunner: PythonAnalysisRunner,
  data: ClusteringRequest,
  startTime: number
): Promise<NextResponse<PythonAnalysisAPIResponse>> {
  try {
    const result = await pythonRunner.performClustering(data);

    return NextResponse.json({
      success: result.success,
      data: result.success ? {
        clustering: result.result,
        cluster_quality: {
          silhouette_score: result.result!.silhouette_score,
          calinski_harabasz: result.result!.calinski_harabasz_score,
          davies_bouldin: result.result!.davies_bouldin_score,
          quality_rating: getClusterQuality(result.result!.silhouette_score)
        }
      } : undefined,
      error: result.success ? undefined : '클러스터링 실패',
      metadata: {
        timestamp: new Date().toISOString(),
        processingTime: Date.now() - startTime,
        engineStatus: result.success ? 'success' : 'error',
        version: '1.0.0'
      }
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: `클러스터링 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
      metadata: {
        timestamp: new Date().toISOString(),
        processingTime: Date.now() - startTime,
        engineStatus: 'error',
        version: '1.0.0'
      }
    }, { status: 500 });
  }
}

/**
 * 🔗 상관관계 분석 처리
 */
async function handleCorrelationAnalysis(
  pythonRunner: PythonAnalysisRunner,
  data: CorrelationRequest,
  startTime: number
): Promise<NextResponse<PythonAnalysisAPIResponse>> {
  try {
    const result = await pythonRunner.analyzeCorrelations(data);

    return NextResponse.json({
      success: result.success,
      data: result.success ? {
        correlation: result.result,
        insights: {
          strongest_correlation: findStrongestCorrelation(result.result!.correlations),
          significant_pairs: result.result!.correlations.filter(c => c.significance !== 'none'),
          correlation_summary: summarizeCorrelations(result.result!.correlations)
        }
      } : undefined,
      error: result.success ? undefined : '상관관계 분석 실패',
      metadata: {
        timestamp: new Date().toISOString(),
        processingTime: Date.now() - startTime,
        engineStatus: result.success ? 'success' : 'error',
        version: '1.0.0'
      }
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: `상관관계 분석 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
      metadata: {
        timestamp: new Date().toISOString(),
        processingTime: Date.now() - startTime,
        engineStatus: 'error',
        version: '1.0.0'
      }
    }, { status: 500 });
  }
}

/**
 * 📊 상태 확인 처리
 */
async function handleStatusCheck(startTime: number): Promise<NextResponse<PythonAnalysisAPIResponse>> {
  try {
    const pythonStatus = enhancedAIAgentEngine.getPythonEngineStatus();

    return NextResponse.json({
      success: true,
      data: pythonStatus,
      metadata: {
        timestamp: new Date().toISOString(),
        processingTime: Date.now() - startTime,
        engineStatus: pythonStatus.enabled ? 'running' : 'disabled',
        version: '1.0.0'
      }
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: `상태 확인 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
      metadata: {
        timestamp: new Date().toISOString(),
        processingTime: Date.now() - startTime,
        engineStatus: 'error',
        version: '1.0.0'
      }
    }, { status: 500 });
  }
}

// ===== 유틸리티 함수들 =====

function generateKeyFindings(analysis: PythonAnalysisResult): string[] {
  const findings: string[] = [];

  if (analysis.forecast) {
    const trend = analysis.forecast.trend_analysis?.direction || 'stable';
    findings.push(`시계열 예측: ${trend} 추세 감지`);
  }

  if (analysis.anomaly) {
    const rate = analysis.anomaly.statistics.anomaly_percentage;
    findings.push(`이상 탐지: ${rate.toFixed(1)}% 이상치 발견`);
  }

  if (analysis.correlation) {
    const strongCorrs = analysis.correlation.correlations.filter(c => Math.abs(c.coefficient) > 0.7);
    findings.push(`상관관계: ${strongCorrs.length}개 강한 상관관계 발견`);
  }

  return findings;
}

function getConfidenceLevel(score: number): string {
  if (score >= 80) return 'high';
  if (score >= 60) return 'medium';
  return 'low';
}

function prepareForecastVisualization(forecast: any): any {
  return {
    chart_data: {
      forecast_values: forecast.forecast,
      confidence_bands: {
        lower: forecast.confidence_lower,
        upper: forecast.confidence_upper
      }
    },
    trend_info: forecast.trend_analysis
  };
}

function getAnomalySeverity(percentage: number): string {
  if (percentage > 15) return 'critical';
  if (percentage > 10) return 'high';
  if (percentage > 5) return 'medium';
  return 'low';
}

function getClusterQuality(silhouetteScore: number): string {
  if (silhouetteScore > 0.7) return 'excellent';
  if (silhouetteScore > 0.5) return 'good';
  if (silhouetteScore > 0.25) return 'fair';
  return 'poor';
}

function findStrongestCorrelation(correlations: any[]): any {
  return correlations.reduce((strongest, current) => 
    Math.abs(current.coefficient) > Math.abs(strongest.coefficient) ? current : strongest
  );
}

function summarizeCorrelations(correlations: any[]): any {
  const positive = correlations.filter(c => c.coefficient > 0).length;
  const negative = correlations.filter(c => c.coefficient < 0).length;
  const strong = correlations.filter(c => Math.abs(c.coefficient) > 0.7).length;
  
  return {
    total: correlations.length,
    positive_correlations: positive,
    negative_correlations: negative,
    strong_correlations: strong
  };
} 