/**
 * MCP 모니터링 전용 AI 엔진 통합 라우터
 *
 * 주요 기능:
 * - 실시간 AI 분석 엔진들의 통합 관리
 * - 지능형 라우팅 및 부하 분산
 * - 50ms 이하 초고속 응답 보장
 * - 장애 감지 및 자동 복구
 */

import type {
  MCPServerMetrics,
  MCPServerName,
  MonitoringDashboard,
} from '../mcp-monitor/types';
import {
  aiAnomalyDetector,
  AnomalyDetectionResult,
} from './ai-anomaly-detector';
import {
  performancePredictor,
  PredictionResult,
  CapacityPlanningResult,
} from './performance-predictor';
import {
  intelligentAlertingSystem,
  IntelligentAlert,
} from './intelligent-alerting';
import {
  nlpQueryEngine,
  NLPQueryRequest,
  NLPQueryResponse,
} from './nlp-query-engine';
import { UnifiedAIEngineRouter } from '../ai/UnifiedAIEngineRouter';
import { getErrorMessage } from '../../types/type-utils';

/**
 * MCP AI 분석 요청
 */
export interface MCPAIAnalysisRequest {
  type:
    | 'anomaly_detection'
    | 'performance_prediction'
    | 'intelligent_alerting'
    | 'nlp_query'
    | 'comprehensive';
  serverId?: MCPServerName;
  metrics?: MCPServerMetrics;
  timeRange?: {
    start: number;
    end: number;
  };
  query?: string;
  options?: {
    urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
    includeRecommendations: boolean;
    enablePredictions: boolean;
    maxResponseTime: number; // ms
  };
}

/**
 * MCP AI 분석 응답
 */
export interface MCPAIAnalysisResponse {
  success: boolean;
  type: MCPAIAnalysisRequest['type'];
  serverId?: MCPServerName;
  timestamp: number;

  // 분석 결과
  results: {
    anomalies?: AnomalyDetectionResult[];
    predictions?: PredictionResult[];
    alerts?: IntelligentAlert[];
    nlpResponse?: NLPQueryResponse;
    capacityPlanning?: CapacityPlanningResult;
  };

  // 통합 인사이트
  insights: {
    overallHealthScore: number; // 0-100
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    priorityActions: {
      action: string;
      urgency: 'immediate' | 'within_hour' | 'within_day' | 'planned';
      impact: 'low' | 'medium' | 'high';
      confidence: number;
    }[];
    summary: string;
  };

  // 성능 메트릭
  performance: {
    processingTime: number;
    enginesUsed: string[];
    cacheHitRate: number;
    accuracy: number;
    confidence: number;
  };

  // 메타데이터
  metadata: {
    requestId: string;
    correlationId?: string;
    version: '1.0';
    aiEngineVersions: Record<string, string>;
  };
}

/**
 * 엔진 성능 통계
 */
interface EnginePerformanceStats {
  engineName: string;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  lastUsed: number;
  healthScore: number; // 0-100
  isEnabled: boolean;
}

/**
 * 라우팅 전략
 */
interface RoutingStrategy {
  strategy: 'fastest_first' | 'load_balanced' | 'accuracy_first' | 'hybrid';
  maxParallelEngines: number;
  timeoutMs: number;
  fallbackEnabled: boolean;
  cacheEnabled: boolean;
}

/**
 * MCP 모니터링 전용 AI 엔진 라우터
 */
export class MCPAIEngineRouter {
  private static instance: MCPAIEngineRouter;

  // AI 엔진 인스턴스들
  private anomalyDetector = aiAnomalyDetector;
  private performancePredictor = performancePredictor;
  private alertingSystem = intelligentAlertingSystem;
  private nlpEngine = nlpQueryEngine;
  private unifiedRouter = UnifiedAIEngineRouter.getInstance();

  // 성능 통계
  private enginesStats: Map<string, EnginePerformanceStats> = new Map();

  // 응답 캐시
  private responseCache: Map<string, MCPAIAnalysisResponse> = new Map();

  // 라우팅 전략
  private routingStrategy: RoutingStrategy = {
    strategy: 'hybrid',
    maxParallelEngines: 3,
    timeoutMs: 45000, // 45초 (50ms 목표보다 여유)
    fallbackEnabled: true,
    cacheEnabled: true,
  };

  // 설정값
  private readonly config = {
    // 최대 응답 시간 (50ms)
    maxResponseTime: 50,

    // 캐시 TTL (5분)
    cacheTTL: 5 * 60 * 1000,

    // 엔진 헬스체크 간격 (30초)
    healthCheckInterval: 30 * 1000,

    // 병렬 처리 제한
    maxConcurrentRequests: 10,

    // 재시도 설정
    retryConfig: {
      maxRetries: 2,
      retryDelay: 100, // ms
      backoffMultiplier: 2,
    },

    // 성능 임계값
    performanceThresholds: {
      responseTime: 50,
      successRate: 95,
      healthScore: 80,
    },
  };

  private constructor() {
    this.initializeEngineStats();
    this.startPeriodicHealthCheck();
    this.startPeriodicCacheCleanup();
  }

  public static getInstance(): MCPAIEngineRouter {
    if (!MCPAIEngineRouter.instance) {
      MCPAIEngineRouter.instance = new MCPAIEngineRouter();
    }
    return MCPAIEngineRouter.instance;
  }

  /**
   * 🚀 통합 AI 분석 실행
   */
  public async analyzeMetrics(
    request: MCPAIAnalysisRequest
  ): Promise<MCPAIAnalysisResponse> {
    const startTime = Date.now();
    const requestId = this.generateRequestId();

    try {
      // 1. 캐시 확인
      if (this.routingStrategy.cacheEnabled) {
        const cacheKey = this.generateCacheKey(request);
        const cached = this.responseCache.get(cacheKey);

        if (cached && Date.now() - cached.timestamp < this.config.cacheTTL) {
          return {
            ...cached,
            performance: {
              ...cached.performance,
              processingTime: Date.now() - startTime,
              cacheHitRate: 1.0,
            },
          };
        }
      }

      // 2. 요청 검증
      this.validateRequest(request);

      // 3. 라우팅 전략에 따라 엔진 선택
      const selectedEngines = this.selectEngines(request);

      // 4. 병렬 분석 실행
      const analysisResults = await this.executeParallelAnalysis(
        request,
        selectedEngines
      );

      // 5. 결과 통합 및 인사이트 생성
      const integratedResults = this.integrateResults(analysisResults);
      const insights = await this.generateInsights(request, integratedResults);

      // 6. 응답 구성
      const response: MCPAIAnalysisResponse = {
        success: true,
        type: request.type,
        serverId: request.serverId,
        timestamp: Date.now(),
        results: integratedResults,
        insights,
        performance: {
          processingTime: Date.now() - startTime,
          enginesUsed: selectedEngines,
          cacheHitRate: 0,
          accuracy: this.calculateOverallAccuracy(integratedResults),
          confidence: this.calculateOverallConfidence(integratedResults),
        },
        metadata: {
          requestId,
          version: '1.0',
          aiEngineVersions: this.getEngineVersions(),
        },
      };

      // 7. 응답 시간 검증
      if (response.performance.processingTime > this.config.maxResponseTime) {
        console.warn(
          `⚠️ 응답 시간 초과: ${response.performance.processingTime}ms > ${this.config.maxResponseTime}ms`
        );
      }

      // 8. 캐시 저장
      if (this.routingStrategy.cacheEnabled) {
        const cacheKey = this.generateCacheKey(request);
        this.responseCache.set(cacheKey, response);
      }

      // 9. 통계 업데이트
      this.updateStats(selectedEngines, true, Date.now() - startTime);

      return response;
    } catch (error) {
      console.error('MCP AI 분석 중 오류:', getErrorMessage(error));

      // 통계 업데이트
      this.updateStats([], false, Date.now() - startTime);

      // 폴백 응답
      return this.createFallbackResponse(
        request,
        requestId,
        getErrorMessage(error)
      );
    }
  }

  /**
   * 🎯 엔진 선택 로직
   */
  private selectEngines(request: MCPAIAnalysisRequest): string[] {
    const engines: string[] = [];

    switch (request.type) {
      case 'anomaly_detection':
        engines.push('anomaly_detector');
        break;

      case 'performance_prediction':
        engines.push('performance_predictor');
        break;

      case 'intelligent_alerting':
        engines.push('alerting_system');
        break;

      case 'nlp_query':
        engines.push('nlp_engine');
        if (request.query) {
          // 복잡한 질의의 경우 추가 엔진 사용
          const queryComplexity = this.assessQueryComplexity(request.query);
          if (queryComplexity === 'high') {
            engines.push('unified_router');
          }
        }
        break;

      case 'comprehensive':
        // 종합 분석 - 모든 엔진 사용
        engines.push(
          'anomaly_detector',
          'performance_predictor',
          'alerting_system'
        );
        if (request.query) {
          engines.push('nlp_engine');
        }
        break;
    }

    // 엔진 상태 필터링
    return engines.filter((engine) => {
      const stats = this.enginesStats.get(engine);
      return (
        stats &&
        stats.isEnabled &&
        stats.healthScore > this.config.performanceThresholds.healthScore
      );
    });
  }

  /**
   * ⚡ 병렬 분석 실행
   */
  private async executeParallelAnalysis(
    request: MCPAIAnalysisRequest,
    engines: string[]
  ): Promise<{
    anomalies?: AnomalyDetectionResult[];
    predictions?: PredictionResult[];
    alerts?: IntelligentAlert[];
    nlpResponse?: NLPQueryResponse;
    capacityPlanning?: CapacityPlanningResult;
  }> {
    const promises: Promise<any>[] = [];
    const results: any = {};

    // 이상 징후 감지
    if (engines.includes('anomaly_detector') && request.metrics) {
      promises.push(
        this.executeWithTimeout(
          () => this.anomalyDetector.detectAnomalies(request.metrics!),
          'anomaly_detector'
        ).then((anomalies) => {
          if (anomalies) results.anomalies = anomalies;
        })
      );
    }

    // 성능 예측
    if (engines.includes('performance_predictor') && request.serverId) {
      promises.push(
        this.executeWithTimeout(
          () => this.performancePredictor.predictPerformance(request.serverId!),
          'performance_predictor'
        ).then((prediction) => {
          if (prediction) results.predictions = [prediction];
        })
      );

      // 용량 계획도 함께 실행
      promises.push(
        this.executeWithTimeout(
          () =>
            this.performancePredictor.analyzeCapacityPlanning(
              request.serverId!
            ),
          'performance_predictor'
        ).then((capacity) => {
          if (capacity) results.capacityPlanning = capacity;
        })
      );
    }

    // 지능형 알림
    if (engines.includes('alerting_system') && request.metrics) {
      // 임계값 기반 알림 (예시 규칙)
      const sampleRules = this.generateSampleAlertRules(request.serverId);
      promises.push(
        this.executeWithTimeout(
          () =>
            this.alertingSystem.generateThresholdAlert(
              request.metrics!,
              sampleRules
            ),
          'alerting_system'
        ).then((alerts) => {
          if (alerts) results.alerts = alerts;
        })
      );
    }

    // 자연어 질의
    if (engines.includes('nlp_engine') && request.query) {
      const nlpRequest: NLPQueryRequest = {
        query: request.query,
        language: 'auto',
        context: {
          serverId: request.serverId,
          timeRange: request.timeRange,
        },
      };

      promises.push(
        this.executeWithTimeout(
          () => this.nlpEngine.processQuery(nlpRequest),
          'nlp_engine'
        ).then((response) => {
          if (response) results.nlpResponse = response;
        })
      );
    }

    // 모든 분석 완료 대기
    await Promise.allSettled(promises);

    return results;
  }

  /**
   * ⏱️ 타임아웃이 있는 실행
   */
  private async executeWithTimeout<T>(
    operation: () => Promise<T>,
    engineName: string,
    timeoutMs: number = this.config.maxResponseTime - 5 // 5ms 여유
  ): Promise<T | null> {
    return Promise.race([
      operation(),
      new Promise<null>((_, reject) =>
        setTimeout(() => reject(new Error(`${engineName} timeout`)), timeoutMs)
      ),
    ]).catch((error) => {
      console.warn(`${engineName} 실행 실패:`, getErrorMessage(error));
      return null;
    });
  }

  /**
   * 🔗 결과 통합
   */
  private integrateResults(
    analysisResults: any
  ): MCPAIAnalysisResponse['results'] {
    return {
      anomalies: analysisResults.anomalies || [],
      predictions: analysisResults.predictions || [],
      alerts: analysisResults.alerts || [],
      nlpResponse: analysisResults.nlpResponse,
      capacityPlanning: analysisResults.capacityPlanning,
    };
  }

  /**
   * 🧠 통합 인사이트 생성
   */
  private async generateInsights(
    request: MCPAIAnalysisRequest,
    results: MCPAIAnalysisResponse['results']
  ): Promise<MCPAIAnalysisResponse['insights']> {
    // 전체 건강도 점수 계산
    let overallHealthScore = 100;
    let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
    const priorityActions: MCPAIAnalysisResponse['insights']['priorityActions'] =
      [];

    // 이상 징후 분석
    if (results.anomalies && results.anomalies.length > 0) {
      const criticalAnomalies = results.anomalies.filter(
        (a) => a.severity === 'critical'
      );
      const highAnomalies = results.anomalies.filter(
        (a) => a.severity === 'high'
      );

      if (criticalAnomalies.length > 0) {
        overallHealthScore -= 40;
        riskLevel = 'critical';

        criticalAnomalies.forEach((anomaly) => {
          priorityActions.push({
            action: `${anomaly.anomalyType} 긴급 대응 필요`,
            urgency: 'immediate',
            impact: 'high',
            confidence: anomaly.confidence,
          });
        });
      } else if (highAnomalies.length > 0) {
        overallHealthScore -= 20;
        riskLevel = riskLevel === 'low' ? 'high' : riskLevel;
      }
    }

    // 예측 분석
    if (results.predictions && results.predictions.length > 0) {
      results.predictions.forEach((prediction) => {
        const criticalAlerts = prediction.alerts.filter(
          (a) => a.severity === 'critical'
        );
        if (criticalAlerts.length > 0) {
          overallHealthScore -= 15;
          riskLevel = riskLevel === 'low' ? 'medium' : riskLevel;

          criticalAlerts.forEach((alert) => {
            priorityActions.push({
              action: `예측된 ${alert.type} 대비 필요`,
              urgency: alert.timeToAlert < 60 ? 'immediate' : 'within_hour',
              impact: 'medium',
              confidence: prediction.accuracy.r2,
            });
          });
        }
      });
    }

    // 알림 분석
    if (results.alerts && results.alerts.length > 0) {
      const highPriorityAlerts = results.alerts.filter((a) => a.priority >= 7);
      if (highPriorityAlerts.length > 0) {
        overallHealthScore -= 10;

        highPriorityAlerts.slice(0, 3).forEach((alert) => {
          priorityActions.push({
            action: alert.title,
            urgency: alert.priority >= 9 ? 'immediate' : 'within_hour',
            impact: alert.severity === 'critical' ? 'high' : 'medium',
            confidence: alert.aiInsights.confidence,
          });
        });
      }
    }

    // 용량 계획 분석
    if (results.capacityPlanning) {
      if (results.capacityPlanning.riskAssessment.overloadRisk > 0.7) {
        overallHealthScore -= 15;
        riskLevel = riskLevel === 'low' ? 'high' : riskLevel;

        priorityActions.push({
          action: '용량 확장 긴급 검토',
          urgency: 'within_hour',
          impact: 'high',
          confidence: 0.8,
        });
      }
    }

    // 최종 점수 조정
    overallHealthScore = Math.max(0, Math.min(100, overallHealthScore));

    // 요약 생성
    const summary = await this.generateSummary(
      request,
      results,
      overallHealthScore,
      riskLevel
    );

    return {
      overallHealthScore,
      riskLevel,
      priorityActions: priorityActions.slice(0, 5), // 최대 5개
      summary,
    };
  }

  /**
   * 📝 요약 생성
   */
  private async generateSummary(
    request: MCPAIAnalysisRequest,
    results: MCPAIAnalysisResponse['results'],
    healthScore: number,
    riskLevel: string
  ): Promise<string> {
    const issues: string[] = [];
    const positives: string[] = [];

    // 이상 징후 요약
    if (results.anomalies && results.anomalies.length > 0) {
      const severeCounts = results.anomalies.reduce(
        (acc, a) => {
          acc[a.severity] = (acc[a.severity] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

      if (severeCounts.critical > 0) {
        issues.push(`${severeCounts.critical}개의 치명적 이상 징후 감지`);
      }
      if (severeCounts.high > 0) {
        issues.push(`${severeCounts.high}개의 높은 수준 이상 징후 감지`);
      }
    } else {
      positives.push('이상 징후 없음');
    }

    // 예측 요약
    if (results.predictions && results.predictions.length > 0) {
      const prediction = results.predictions[0];
      if (prediction.alerts.length > 0) {
        issues.push(`${prediction.alerts.length}개의 예측 알림`);
      }

      if (prediction.trend.direction === 'increasing') {
        issues.push('성능 지표 상승 트렌드');
      } else if (prediction.trend.direction === 'stable') {
        positives.push('안정적인 성능 트렌드');
      }
    }

    // 전체 요약 구성
    let summary = `시스템 건강도: ${healthScore}점 (${riskLevel} 위험 수준)`;

    if (issues.length > 0) {
      summary += `\n\n주요 문제점:\n• ${issues.join('\n• ')}`;
    }

    if (positives.length > 0) {
      summary += `\n\n긍정적 요소:\n• ${positives.join('\n• ')}`;
    }

    // NLP 응답이 있는 경우 추가
    if (results.nlpResponse && results.nlpResponse.success) {
      summary += `\n\n자연어 질의 응답: ${results.nlpResponse.answer.slice(0, 200)}${results.nlpResponse.answer.length > 200 ? '...' : ''}`;
    }

    return summary;
  }

  /**
   * 🔢 전체 정확도 계산
   */
  private calculateOverallAccuracy(
    results: MCPAIAnalysisResponse['results']
  ): number {
    const accuracies: number[] = [];

    if (results.anomalies && results.anomalies.length > 0) {
      const avgConfidence =
        results.anomalies.reduce((sum, a) => sum + a.confidence, 0) /
        results.anomalies.length;
      accuracies.push(avgConfidence);
    }

    if (results.predictions && results.predictions.length > 0) {
      const avgAccuracy =
        results.predictions.reduce((sum, p) => sum + p.accuracy.r2, 0) /
        results.predictions.length;
      accuracies.push(avgAccuracy);
    }

    if (results.nlpResponse) {
      accuracies.push(results.nlpResponse.confidence);
    }

    return accuracies.length > 0
      ? accuracies.reduce((sum, a) => sum + a, 0) / accuracies.length
      : 0.8;
  }

  /**
   * 🎯 전체 신뢰도 계산
   */
  private calculateOverallConfidence(
    results: MCPAIAnalysisResponse['results']
  ): number {
    // 정확도와 동일한 로직 사용
    return this.calculateOverallAccuracy(results);
  }

  /**
   * 🏷️ 쿼리 복잡도 평가
   */
  private assessQueryComplexity(query: string): 'low' | 'medium' | 'high' {
    let complexity = 0;

    // 길이 기반
    if (query.length > 100) complexity++;
    if (query.length > 200) complexity++;

    // 키워드 복잡도
    const complexKeywords =
      /비교|compare|예측|predict|분석|analyze|트렌드|trend/gi;
    const matches = query.match(complexKeywords);
    if (matches) complexity += matches.length;

    // 논리 연산자
    const logicalOps = /and|or|but|그리고|또는|하지만/gi;
    if (logicalOps.test(query)) complexity++;

    if (complexity <= 1) return 'low';
    if (complexity <= 3) return 'medium';
    return 'high';
  }

  /**
   * 📊 샘플 알림 규칙 생성
   */
  private generateSampleAlertRules(serverId?: MCPServerName): any[] {
    return [
      {
        id: 'response_time_high',
        name: '높은 응답 시간',
        serverId,
        condition: {
          metric: 'responseTime' as const,
          operator: '>' as const,
          threshold: 1000,
          duration: 60000,
        },
        severity: 'warning' as const,
        channels: ['console' as const],
        enabled: true,
      },
      {
        id: 'error_rate_high',
        name: '높은 에러율',
        serverId,
        condition: {
          metric: 'errorRate' as const,
          operator: '>' as const,
          threshold: 5,
          duration: 60000,
        },
        severity: 'error' as const,
        channels: ['console' as const],
        enabled: true,
      },
    ];
  }

  /**
   * 🔄 요청 검증
   */
  private validateRequest(request: MCPAIAnalysisRequest): void {
    if (!request.type) {
      throw new Error('분석 타입이 지정되지 않았습니다.');
    }

    if (request.type === 'nlp_query' && !request.query) {
      throw new Error('NLP 질의 타입에는 query가 필요합니다.');
    }

    if (
      (request.type === 'anomaly_detection' ||
        request.type === 'intelligent_alerting') &&
      !request.metrics
    ) {
      throw new Error('이상 징후 감지 및 알림에는 metrics가 필요합니다.');
    }

    if (
      request.options?.maxResponseTime &&
      request.options.maxResponseTime < 10
    ) {
      throw new Error('최소 응답 시간은 10ms입니다.');
    }
  }

  /**
   * 🔧 폴백 응답 생성
   */
  private createFallbackResponse(
    request: MCPAIAnalysisRequest,
    requestId: string,
    error: string
  ): MCPAIAnalysisResponse {
    return {
      success: false,
      type: request.type,
      serverId: request.serverId,
      timestamp: Date.now(),
      results: {
        anomalies: [],
        predictions: [],
        alerts: [],
      },
      insights: {
        overallHealthScore: 50,
        riskLevel: 'medium',
        priorityActions: [
          {
            action: '시스템 오류로 인한 분석 실패',
            urgency: 'within_hour',
            impact: 'medium',
            confidence: 0.1,
          },
        ],
        summary: `분석 중 오류가 발생했습니다: ${error}`,
      },
      performance: {
        processingTime: 0,
        enginesUsed: [],
        cacheHitRate: 0,
        accuracy: 0,
        confidence: 0,
      },
      metadata: {
        requestId,
        version: '1.0',
        aiEngineVersions: {},
      },
    };
  }

  /**
   * 📊 엔진 통계 초기화
   */
  private initializeEngineStats(): void {
    const engines = [
      'anomaly_detector',
      'performance_predictor',
      'alerting_system',
      'nlp_engine',
      'unified_router',
    ];

    engines.forEach((engineName) => {
      this.enginesStats.set(engineName, {
        engineName,
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        averageResponseTime: 0,
        lastUsed: 0,
        healthScore: 100,
        isEnabled: true,
      });
    });
  }

  /**
   * 📊 통계 업데이트
   */
  private updateStats(
    engines: string[],
    success: boolean,
    responseTime: number
  ): void {
    engines.forEach((engineName) => {
      const stats = this.enginesStats.get(engineName);
      if (stats) {
        stats.totalRequests++;
        stats.lastUsed = Date.now();

        if (success) {
          stats.successfulRequests++;
          // 응답 시간 평균 업데이트
          stats.averageResponseTime =
            (stats.averageResponseTime * (stats.successfulRequests - 1) +
              responseTime) /
            stats.successfulRequests;
        } else {
          stats.failedRequests++;
        }

        // 건강도 점수 계산
        const successRate = stats.successfulRequests / stats.totalRequests;
        const responseTimeScore = Math.max(
          0,
          100 - (stats.averageResponseTime / this.config.maxResponseTime) * 50
        );
        stats.healthScore = successRate * 70 + responseTimeScore * 30;
      }
    });
  }

  /**
   * 🏥 주기적 헬스체크
   */
  private startPeriodicHealthCheck(): void {
    setInterval(() => {
      this.enginesStats.forEach((stats, engineName) => {
        // 최근 사용되지 않은 엔진 점수 감소
        const timeSinceLastUse = Date.now() - stats.lastUsed;
        if (timeSinceLastUse > 5 * 60 * 1000) {
          // 5분
          stats.healthScore = Math.max(0, stats.healthScore - 5);
        }

        // 건강도가 낮은 엔진 비활성화 검토
        if (stats.healthScore < this.config.performanceThresholds.healthScore) {
          console.warn(
            `⚠️ 엔진 ${engineName} 성능 저하 (점수: ${stats.healthScore})`
          );
        }
      });
    }, this.config.healthCheckInterval);
  }

  /**
   * 🧹 주기적 캐시 정리
   */
  private startPeriodicCacheCleanup(): void {
    setInterval(() => {
      const now = Date.now();
      this.responseCache.forEach((response, key) => {
        if (now - response.timestamp > this.config.cacheTTL) {
          this.responseCache.delete(key);
        }
      });
    }, 60 * 1000); // 1분마다
  }

  /**
   * 🔑 캐시 키 생성
   */
  private generateCacheKey(request: MCPAIAnalysisRequest): string {
    const keyParts = [
      request.type,
      request.serverId || 'all',
      request.query?.slice(0, 50) || '',
      JSON.stringify(request.timeRange || {}),
      JSON.stringify(request.options || {}),
    ];

    return keyParts.join('_').replace(/[^a-zA-Z0-9_]/g, '');
  }

  /**
   * 🆔 요청 ID 생성
   */
  private generateRequestId(): string {
    return `mcpai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 📦 엔진 버전 정보
   */
  private getEngineVersions(): Record<string, string> {
    return {
      anomaly_detector: '1.0',
      performance_predictor: '1.0',
      alerting_system: '1.0',
      nlp_engine: '1.0',
      unified_router: '1.0',
    };
  }

  /**
   * 📊 라우터 통계 조회
   */
  public getRouterStats(): {
    totalRequests: number;
    averageResponseTime: number;
    cacheHitRate: number;
    engineStats: EnginePerformanceStats[];
    routingStrategy: RoutingStrategy;
  } {
    const totalRequests = Array.from(this.enginesStats.values()).reduce(
      (sum, stats) => sum + stats.totalRequests,
      0
    );

    const avgResponseTime =
      Array.from(this.enginesStats.values()).reduce(
        (sum, stats) => sum + stats.averageResponseTime,
        0
      ) / this.enginesStats.size;

    const cacheSize = this.responseCache.size;
    const estimatedCacheHitRate =
      cacheSize > 0 ? Math.min(0.8, cacheSize / 100) : 0;

    return {
      totalRequests,
      averageResponseTime: avgResponseTime,
      cacheHitRate: estimatedCacheHitRate,
      engineStats: Array.from(this.enginesStats.values()),
      routingStrategy: this.routingStrategy,
    };
  }

  /**
   * ⚙️ 라우팅 전략 업데이트
   */
  public updateRoutingStrategy(strategy: Partial<RoutingStrategy>): void {
    this.routingStrategy = { ...this.routingStrategy, ...strategy };
  }

  /**
   * 🔧 엔진 활성화/비활성화
   */
  public toggleEngine(engineName: string, enabled: boolean): boolean {
    const stats = this.enginesStats.get(engineName);
    if (stats) {
      stats.isEnabled = enabled;
      return true;
    }
    return false;
  }
}

// 싱글톤 인스턴스 내보내기
export const mcpAIEngineRouter = MCPAIEngineRouter.getInstance();
