/**
 * MCP 모니터링을 위한 자연어 질의 엔진
 *
 * 주요 기능:
 * - 한국어/영어 자연어 질의 처리
 * - MCP 메트릭 데이터 기반 답변 생성
 * - 컨텍스트 인식 및 대화 히스토리 관리
 * - 실시간 데이터 시각화 제안
 */

import type {
  MCPServerMetrics,
  MCPServerName,
  MonitoringDashboard,
  SystemHealthSummary,
} from '../mcp-monitor/types';
import type { AnomalyDetectionResult } from './ai-anomaly-detector';
import type { PredictionResult } from './performance-predictor';
import type { IntelligentAlert } from './intelligent-alerting';
import { UnifiedAIEngineRouter } from '../ai/UnifiedAIEngineRouter';
import { getErrorMessage } from '../../types/type-utils';

/**
 * 자연어 질의 요청
 */
export interface NLPQueryRequest {
  query: string;
  language: 'ko' | 'en' | 'auto';
  context?: {
    serverId?: MCPServerName;
    timeRange?: {
      start: number;
      end: number;
    };
    focusMetrics?: (keyof MCPServerMetrics)[];
    conversationHistory?: NLPConversation[];
  };
  preferences?: {
    responseFormat: 'detailed' | 'summary' | 'actionable';
    includeVisualization: boolean;
    includeRecommendations: boolean;
    maxResponseLength: number;
  };
}

/**
 * 자연어 질의 응답
 */
export interface NLPQueryResponse {
  success: boolean;
  query: string;
  answer: string;
  confidence: number; // 0-1
  language: 'ko' | 'en';

  // 분석 결과
  analysis: {
    intent: string;
    entities: {
      type: 'server' | 'metric' | 'time' | 'threshold' | 'action';
      value: string;
      confidence: number;
    }[];
    complexity: 'simple' | 'medium' | 'complex';
    queryType:
      | 'status'
      | 'trend'
      | 'comparison'
      | 'troubleshooting'
      | 'prediction';
  };

  // 데이터 관련
  dataUsed: {
    servers: MCPServerName[];
    metricsAccessed: string[];
    timeRange: {
      start: number;
      end: number;
    };
    dataPoints: number;
  };

  // 추가 제안
  suggestions: {
    relatedQueries: string[];
    visualizations: {
      type: 'chart' | 'graph' | 'heatmap' | 'table';
      title: string;
      description: string;
      data: any;
    }[];
    actions: {
      type: 'investigate' | 'optimize' | 'alert' | 'scale';
      description: string;
      priority: 'low' | 'medium' | 'high';
    }[];
  };

  // 메타데이터
  metadata: {
    processingTime: number;
    aiEngine: string;
    tokensUsed?: number;
    cacheHit: boolean;
  };
}

/**
 * 대화 기록
 */
interface NLPConversation {
  id: string;
  timestamp: number;
  query: string;
  response: string;
  context: any;
}

/**
 * 쿼리 분석 결과
 */
interface QueryAnalysis {
  intent: string;
  entities: NLPQueryResponse['analysis']['entities'];
  complexity: NLPQueryResponse['analysis']['complexity'];
  queryType: NLPQueryResponse['analysis']['queryType'];
  language: 'ko' | 'en';
  confidence: number;
}

/**
 * 데이터 컨텍스트
 */
interface DataContext {
  servers: Map<MCPServerName, MCPServerMetrics[]>;
  anomalies: Map<MCPServerName, AnomalyDetectionResult[]>;
  predictions: Map<MCPServerName, PredictionResult[]>;
  alerts: IntelligentAlert[];
  systemHealth: SystemHealthSummary;
}

/**
 * 자연어 질의 엔진
 */
export class NLPQueryEngine {
  private static instance: NLPQueryEngine;

  // AI 엔진
  private aiRouter: UnifiedAIEngineRouter;

  // 데이터 캐시
  private dataContext: DataContext = {
    servers: new Map(),
    anomalies: new Map(),
    predictions: new Map(),
    alerts: [],
    systemHealth: {
      timestamp: 0,
      totalServers: 0,
      healthyServers: 0,
      degradedServers: 0,
      unhealthyServers: 0,
      averageResponseTime: 0,
      systemStatus: 'healthy',
      criticalIssues: [],
      warnings: [],
    },
  };

  // 응답 캐시
  private responseCache: Map<string, NLPQueryResponse> = new Map();

  // 대화 히스토리
  private conversations: Map<string, NLPConversation[]> = new Map();

  // 설정값
  private readonly config = {
    // 캐시 TTL (10분)
    cacheTTL: 10 * 60 * 1000,

    // 최대 대화 히스토리
    maxConversationHistory: 10,

    // 응답 길이 제한
    maxResponseLength: 2000,

    // 언어 감지 임계값
    languageDetectionThreshold: 0.7,

    // AI 엔진 설정
    aiConfig: {
      maxTokens: 1000,
      temperature: 0.3,
      enableKoreanNLP: true,
    },

    // 쿼리 패턴
    queryPatterns: {
      status: [/상태|status|health|현재/i, /어떻게|how.*doing|괜찮|fine/i],
      trend: [
        /트렌드|trend|변화|change|추이/i,
        /증가|감소|increase|decrease|growing/i,
      ],
      comparison: [
        /비교|compare|차이|difference|vs/i,
        /보다|than|더|more|less/i,
      ],
      troubleshooting: [
        /문제|problem|issue|에러|error/i,
        /왜|why|원인|cause|이유|reason/i,
      ],
      prediction: [/예측|predict|미래|future|앞으로/i, /될|will|예상|expect/i],
    },
  };

  private constructor() {
    this.aiRouter = UnifiedAIEngineRouter.getInstance();
    this.startPeriodicCacheCleanup();
  }

  public static getInstance(): NLPQueryEngine {
    if (!NLPQueryEngine.instance) {
      NLPQueryEngine.instance = new NLPQueryEngine();
    }
    return NLPQueryEngine.instance;
  }

  /**
   * 🗣️ 자연어 질의 처리
   */
  public async processQuery(
    request: NLPQueryRequest
  ): Promise<NLPQueryResponse> {
    const startTime = Date.now();

    try {
      // 1. 캐시 확인
      const cacheKey = this.generateCacheKey(request);
      const cached = this.responseCache.get(cacheKey);

      if (
        cached &&
        Date.now() - cached.metadata.processingTime < this.config.cacheTTL
      ) {
        return {
          ...cached,
          metadata: { ...cached.metadata, cacheHit: true },
        };
      }

      // 2. 쿼리 분석
      const analysis = await this.analyzeQuery(request.query, request.language);

      // 3. 데이터 수집
      const relevantData = await this.collectRelevantData(
        analysis,
        request.context
      );

      // 4. AI 엔진으로 답변 생성
      const aiResponse = await this.generateAIResponse(
        request,
        analysis,
        relevantData
      );

      // 5. 시각화 제안 생성
      const visualizations = this.generateVisualizationSuggestions(
        analysis,
        relevantData
      );

      // 6. 액션 제안 생성
      const actions = this.generateActionSuggestions(analysis, relevantData);

      // 7. 관련 질의 생성
      const relatedQueries = this.generateRelatedQueries(
        analysis,
        request.language || analysis.language
      );

      const response: NLPQueryResponse = {
        success: true,
        query: request.query,
        answer: aiResponse.answer,
        confidence: Math.min(analysis.confidence, aiResponse.confidence),
        language: analysis.language,
        analysis,
        dataUsed: {
          servers: Array.from(relevantData.servers.keys()),
          metricsAccessed: this.extractMetricsFromData(relevantData),
          timeRange: request.context?.timeRange || {
            start: Date.now() - 24 * 60 * 60 * 1000,
            end: Date.now(),
          },
          dataPoints: this.countDataPoints(relevantData),
        },
        suggestions: {
          relatedQueries,
          visualizations,
          actions,
        },
        metadata: {
          processingTime: Date.now() - startTime,
          aiEngine: aiResponse.engine,
          tokensUsed: aiResponse.tokensUsed,
          cacheHit: false,
        },
      };

      // 8. 응답 캐싱
      this.responseCache.set(cacheKey, response);

      // 9. 대화 히스토리 저장
      this.saveConversation(request, response);

      return response;
    } catch (error) {
      console.error('자연어 질의 처리 중 오류:', getErrorMessage(error));

      return {
        success: false,
        query: request.query,
        answer:
          request.language === 'ko'
            ? '죄송합니다. 질의를 처리하는 중 오류가 발생했습니다.'
            : 'Sorry, an error occurred while processing your query.',
        confidence: 0,
        language: request.language || 'ko',
        analysis: {
          intent: 'error',
          entities: [],
          complexity: 'simple',
          queryType: 'status',
        },
        dataUsed: {
          servers: [],
          metricsAccessed: [],
          timeRange: { start: 0, end: 0 },
          dataPoints: 0,
        },
        suggestions: {
          relatedQueries: [],
          visualizations: [],
          actions: [],
        },
        metadata: {
          processingTime: Date.now() - startTime,
          aiEngine: 'error',
          cacheHit: false,
        },
      };
    }
  }

  /**
   * 🔍 쿼리 분석
   */
  private async analyzeQuery(
    query: string,
    language: 'ko' | 'en' | 'auto' = 'auto'
  ): Promise<QueryAnalysis> {
    // 1. 언어 감지
    const detectedLanguage =
      language === 'auto' ? this.detectLanguage(query) : language;

    // 2. 의도 분석
    const intent = this.analyzeIntent(query);

    // 3. 엔티티 추출
    const entities = this.extractEntities(query, detectedLanguage);

    // 4. 복잡도 평가
    const complexity = this.assessComplexity(query, entities);

    // 5. 쿼리 타입 분류
    const queryType = this.classifyQueryType(query);

    // 6. 신뢰도 계산
    const confidence = this.calculateAnalysisConfidence(
      intent,
      entities,
      queryType
    );

    return {
      intent,
      entities,
      complexity,
      queryType,
      language: detectedLanguage,
      confidence,
    };
  }

  /**
   * 🌐 언어 감지
   */
  private detectLanguage(query: string): 'ko' | 'en' {
    const koreanChars =
      query.match(/[\u3131-\u314e\u314f-\u3163\uac00-\ud7a3]/g) || [];
    const koreanRatio = koreanChars.length / query.length;

    return koreanRatio > this.config.languageDetectionThreshold ? 'ko' : 'en';
  }

  /**
   * 🎯 의도 분석
   */
  private analyzeIntent(query: string): string {
    const lowerQuery = query.toLowerCase();

    // 키워드 기반 의도 분석
    if (
      lowerQuery.includes('상태') ||
      lowerQuery.includes('status') ||
      lowerQuery.includes('health')
    ) {
      return 'check_status';
    }
    if (
      lowerQuery.includes('문제') ||
      lowerQuery.includes('error') ||
      lowerQuery.includes('issue')
    ) {
      return 'troubleshoot';
    }
    if (
      lowerQuery.includes('예측') ||
      lowerQuery.includes('predict') ||
      lowerQuery.includes('future')
    ) {
      return 'predict_performance';
    }
    if (lowerQuery.includes('비교') || lowerQuery.includes('compare')) {
      return 'compare_servers';
    }
    if (lowerQuery.includes('트렌드') || lowerQuery.includes('trend')) {
      return 'analyze_trend';
    }

    return 'general_inquiry';
  }

  /**
   * 🏷️ 엔티티 추출
   */
  private extractEntities(
    query: string,
    language: 'ko' | 'en'
  ): NLPQueryResponse['analysis']['entities'] {
    const entities: NLPQueryResponse['analysis']['entities'] = [];

    // 서버 이름 추출
    const serverPattern =
      language === 'ko' ? /서버|server/gi : /server|instance|node/gi;
    if (serverPattern.test(query)) {
      entities.push({
        type: 'server',
        value: 'generic_server',
        confidence: 0.8,
      });
    }

    // 메트릭 추출
    const metricPatterns = {
      ko: {
        responseTime: /응답.*시간|latency|레이턴시/gi,
        errorRate: /에러.*율|오류.*율|실패.*율/gi,
        successRate: /성공.*율|가용.*률/gi,
        memoryUsage: /메모리|memory/gi,
      },
      en: {
        responseTime: /response.*time|latency/gi,
        errorRate: /error.*rate|failure.*rate/gi,
        successRate: /success.*rate|availability/gi,
        memoryUsage: /memory.*usage|memory/gi,
      },
    };

    const patterns = metricPatterns[language];
    Object.entries(patterns).forEach(([metric, pattern]) => {
      if (pattern.test(query)) {
        entities.push({
          type: 'metric',
          value: metric,
          confidence: 0.9,
        });
      }
    });

    // 시간 표현 추출
    const timePatterns =
      language === 'ko'
        ? /(\d+)(분|시간|일|주|개월)/g
        : /(\d+)\s*(minute|hour|day|week|month)s?/gi;

    const timeMatches = query.match(timePatterns);
    if (timeMatches) {
      entities.push({
        type: 'time',
        value: timeMatches[0],
        confidence: 0.95,
      });
    }

    return entities;
  }

  /**
   * 🔢 복잡도 평가
   */
  private assessComplexity(
    query: string,
    entities: NLPQueryResponse['analysis']['entities']
  ): 'simple' | 'medium' | 'complex' {
    let complexityScore = 0;

    // 쿼리 길이
    if (query.length > 100) complexityScore += 1;
    if (query.length > 200) complexityScore += 1;

    // 엔티티 수
    complexityScore += entities.length;

    // 논리 연산자
    const logicalOperators = /and|or|but|however|그리고|또는|하지만/gi;
    if (logicalOperators.test(query)) complexityScore += 2;

    // 비교 표현
    const comparisonTerms = /보다|than|compare|vs|대비/gi;
    if (comparisonTerms.test(query)) complexityScore += 1;

    if (complexityScore <= 2) return 'simple';
    if (complexityScore <= 5) return 'medium';
    return 'complex';
  }

  /**
   * 📊 쿼리 타입 분류
   */
  private classifyQueryType(
    query: string
  ): NLPQueryResponse['analysis']['queryType'] {
    const patterns = this.config.queryPatterns;

    for (const [type, typePatterns] of Object.entries(patterns)) {
      if (typePatterns.some((pattern) => pattern.test(query))) {
        return type as NLPQueryResponse['analysis']['queryType'];
      }
    }

    return 'status'; // 기본값
  }

  /**
   * 📊 분석 신뢰도 계산
   */
  private calculateAnalysisConfidence(
    intent: string,
    entities: NLPQueryResponse['analysis']['entities'],
    queryType: string
  ): number {
    let confidence = 0.5; // 기본 신뢰도

    // 의도가 명확한 경우
    if (intent !== 'general_inquiry') confidence += 0.2;

    // 엔티티가 많을수록 높은 신뢰도
    confidence += Math.min(0.3, entities.length * 0.1);

    // 엔티티 신뢰도 평균
    if (entities.length > 0) {
      const avgEntityConfidence =
        entities.reduce((sum, e) => sum + e.confidence, 0) / entities.length;
      confidence += avgEntityConfidence * 0.2;
    }

    return Math.min(1, confidence);
  }

  /**
   * 📊 관련 데이터 수집
   */
  private async collectRelevantData(
    analysis: QueryAnalysis,
    context?: NLPQueryRequest['context']
  ): Promise<DataContext> {
    const relevantData: DataContext = {
      servers: new Map(),
      anomalies: new Map(),
      predictions: new Map(),
      alerts: [],
      systemHealth: this.dataContext.systemHealth,
    };

    // 컨텍스트에서 서버 필터링
    let targetServers = context?.serverId
      ? [context.serverId]
      : Array.from(this.dataContext.servers.keys());

    // 쿼리 타입에 따른 데이터 수집
    switch (analysis.queryType) {
      case 'status':
        // 현재 상태 데이터
        targetServers.forEach((serverId) => {
          const serverData = this.dataContext.servers.get(serverId);
          if (serverData) {
            relevantData.servers.set(serverId, serverData.slice(-10)); // 최근 10개
          }
        });
        break;

      case 'trend':
        // 트렌드 분석용 데이터 (더 많은 기록)
        targetServers.forEach((serverId) => {
          const serverData = this.dataContext.servers.get(serverId);
          if (serverData) {
            relevantData.servers.set(serverId, serverData.slice(-100)); // 최근 100개
          }
        });
        break;

      case 'troubleshooting':
        // 문제 해결용 데이터 (이상 징후 + 알림)
        targetServers.forEach((serverId) => {
          const serverData = this.dataContext.servers.get(serverId);
          const anomalies = this.dataContext.anomalies.get(serverId);

          if (serverData)
            relevantData.servers.set(serverId, serverData.slice(-50));
          if (anomalies) relevantData.anomalies.set(serverId, anomalies);
        });

        relevantData.alerts = this.dataContext.alerts.filter((alert) =>
          targetServers.includes(alert.serverId)
        );
        break;

      case 'prediction':
        // 예측용 데이터
        targetServers.forEach((serverId) => {
          const predictions = this.dataContext.predictions.get(serverId);
          if (predictions) {
            relevantData.predictions.set(serverId, predictions);
          }
        });
        break;
    }

    return relevantData;
  }

  /**
   * 🤖 AI 응답 생성
   */
  private async generateAIResponse(
    request: NLPQueryRequest,
    analysis: QueryAnalysis,
    data: DataContext
  ): Promise<{
    answer: string;
    confidence: number;
    engine: string;
    tokensUsed?: number;
  }> {
    // 프롬프트 구성
    const prompt = this.buildPrompt(request, analysis, data);

    // AI 엔진 호출
    const response = await this.aiRouter.route({
      query: prompt,
      context: {
        servers: Array.from(data.servers.keys()),
        analysis: analysis,
        language: analysis.language,
      },
    });

    if (!response.success) {
      throw new Error('AI 응답 생성 실패');
    }

    return {
      answer: response.response,
      confidence: response.confidence,
      engine: response.engine,
      tokensUsed: response.metadata?.tokensUsed as number,
    };
  }

  /**
   * 📝 프롬프트 구성
   */
  private buildPrompt(
    request: NLPQueryRequest,
    analysis: QueryAnalysis,
    data: DataContext
  ): string {
    const isKorean = analysis.language === 'ko';

    let prompt = isKorean
      ? `MCP 모니터링 시스템에 대한 질문에 답변해주세요.\n\n`
      : `Please answer questions about the MCP monitoring system.\n\n`;

    // 사용자 질의
    prompt += isKorean
      ? `사용자 질문: ${request.query}\n\n`
      : `User Question: ${request.query}\n\n`;

    // 분석 결과
    prompt += isKorean
      ? `분석 결과:\n- 의도: ${analysis.intent}\n- 복잡도: ${analysis.complexity}\n- 쿼리 타입: ${analysis.queryType}\n\n`
      : `Analysis:\n- Intent: ${analysis.intent}\n- Complexity: ${analysis.complexity}\n- Query Type: ${analysis.queryType}\n\n`;

    // 관련 데이터 요약
    if (data.servers.size > 0) {
      prompt += isKorean
        ? `사용 가능한 서버 데이터:\n`
        : `Available Server Data:\n`;
      data.servers.forEach((metrics, serverId) => {
        const latest = metrics[metrics.length - 1];
        if (latest) {
          prompt += `- ${serverId}: 응답시간 ${latest.responseTime}ms, 에러율 ${latest.errorRate}%, 성공률 ${latest.successRate}%\n`;
        }
      });
      prompt += '\n';
    }

    // 이상 징후 정보
    if (data.anomalies.size > 0) {
      prompt += isKorean ? `감지된 이상 징후:\n` : `Detected Anomalies:\n`;
      data.anomalies.forEach((anomalies, serverId) => {
        anomalies.forEach((anomaly) => {
          prompt += `- ${serverId}: ${anomaly.description}\n`;
        });
      });
      prompt += '\n';
    }

    // 예측 정보
    if (data.predictions.size > 0) {
      prompt += isKorean ? `성능 예측:\n` : `Performance Predictions:\n`;
      data.predictions.forEach((predictions, serverId) => {
        predictions.forEach((prediction) => {
          prompt += `- ${serverId}: ${prediction.trend.direction} 트렌드, 신뢰도 ${(prediction.accuracy.r2 * 100).toFixed(1)}%\n`;
        });
      });
      prompt += '\n';
    }

    // 응답 지침
    prompt += isKorean
      ? `다음 지침에 따라 답변해주세요:\n1. 구체적이고 실용적인 정보 제공\n2. 전문 용어 사용 시 간단한 설명 추가\n3. 가능한 경우 수치 데이터 포함\n4. 권장사항이나 다음 단계 제안\n5. ${request.preferences?.maxResponseLength || this.config.maxResponseLength}자 이내로 작성`
      : `Please follow these guidelines:\n1. Provide specific and practical information\n2. Include brief explanations for technical terms\n3. Include numerical data when available\n4. Suggest recommendations or next steps\n5. Keep response under ${request.preferences?.maxResponseLength || this.config.maxResponseLength} characters`;

    return prompt;
  }

  /**
   * 📊 시각화 제안 생성
   */
  private generateVisualizationSuggestions(
    analysis: QueryAnalysis,
    data: DataContext
  ): NLPQueryResponse['suggestions']['visualizations'] {
    const visualizations: NLPQueryResponse['suggestions']['visualizations'] =
      [];

    // 쿼리 타입에 따른 시각화 제안
    switch (analysis.queryType) {
      case 'status':
        if (data.servers.size > 0) {
          visualizations.push({
            type: 'chart',
            title: '서버 상태 대시보드',
            description: '각 서버의 주요 메트릭 현황을 한눈에 확인',
            data: this.prepareStatusChartData(data.servers),
          });
        }
        break;

      case 'trend':
        if (data.servers.size > 0) {
          visualizations.push({
            type: 'graph',
            title: '성능 트렌드 그래프',
            description: '시간별 성능 메트릭 변화 추이',
            data: this.prepareTrendGraphData(data.servers),
          });
        }
        break;

      case 'comparison':
        if (data.servers.size > 1) {
          visualizations.push({
            type: 'table',
            title: '서버 비교 테이블',
            description: '서버 간 성능 메트릭 비교',
            data: this.prepareComparisonTableData(data.servers),
          });
        }
        break;

      case 'troubleshooting':
        if (data.anomalies.size > 0) {
          visualizations.push({
            type: 'heatmap',
            title: '이상 징후 히트맵',
            description: '서버별 이상 징후 발생 패턴',
            data: this.prepareAnomalyHeatmapData(data.anomalies),
          });
        }
        break;
    }

    return visualizations;
  }

  /**
   * 💡 액션 제안 생성
   */
  private generateActionSuggestions(
    analysis: QueryAnalysis,
    data: DataContext
  ): NLPQueryResponse['suggestions']['actions'] {
    const actions: NLPQueryResponse['suggestions']['actions'] = [];

    // 이상 징후 기반 액션
    data.anomalies.forEach((anomalies, serverId) => {
      anomalies.forEach((anomaly) => {
        if (anomaly.severity === 'critical' || anomaly.severity === 'high') {
          actions.push({
            type: 'investigate',
            description: `${serverId} 서버의 ${anomaly.anomalyType} 이상 징후 긴급 조사`,
            priority: 'high',
          });
        }
      });
    });

    // 성능 기반 액션
    data.servers.forEach((metrics, serverId) => {
      const latest = metrics[metrics.length - 1];
      if (latest) {
        if (latest.responseTime > 1000) {
          actions.push({
            type: 'optimize',
            description: `${serverId} 서버 응답 시간 최적화 (현재 ${latest.responseTime}ms)`,
            priority: 'medium',
          });
        }

        if (latest.errorRate > 5) {
          actions.push({
            type: 'investigate',
            description: `${serverId} 서버 높은 에러율 조사 (현재 ${latest.errorRate}%)`,
            priority: 'high',
          });
        }
      }
    });

    // 예측 기반 액션
    data.predictions.forEach((predictions, serverId) => {
      predictions.forEach((prediction) => {
        if (prediction.alerts.length > 0) {
          const criticalAlert = prediction.alerts.find(
            (alert) => alert.severity === 'critical'
          );
          if (criticalAlert) {
            actions.push({
              type: 'scale',
              description: `${serverId} 서버 용량 확장 준비 (${Math.round(criticalAlert.timeToAlert)}분 후 임계값 도달 예상)`,
              priority: 'high',
            });
          }
        }
      });
    });

    return actions.slice(0, 5); // 최대 5개 액션
  }

  /**
   * 🔗 관련 질의 생성
   */
  private generateRelatedQueries(
    analysis: QueryAnalysis,
    language: 'ko' | 'en'
  ): string[] {
    const queries: string[] = [];

    const templates =
      language === 'ko'
        ? {
            status: [
              '전체 시스템 상태는 어떻습니까?',
              '가장 성능이 좋은 서버는 어디입니까?',
              '현재 에러가 발생하고 있는 서버가 있습니까?',
            ],
            trend: [
              '지난 주 대비 성능이 어떻게 변했습니까?',
              '응답 시간이 계속 증가하고 있습니까?',
              '피크 시간대는 언제입니까?',
            ],
            troubleshooting: [
              '가장 자주 발생하는 문제는 무엇입니까?',
              '이 문제의 근본 원인은 무엇입니까?',
              '유사한 문제가 과거에 어떻게 해결되었습니까?',
            ],
            prediction: [
              '다음 주 성능 예측은 어떻습니까?',
              '언제 용량을 확장해야 합니까?',
              '예상되는 장애 시점은 언제입니까?',
            ],
          }
        : {
            status: [
              'What is the overall system status?',
              'Which server has the best performance?',
              'Are there any servers currently experiencing errors?',
            ],
            trend: [
              'How has performance changed compared to last week?',
              'Is response time continuously increasing?',
              'When are the peak hours?',
            ],
            troubleshooting: [
              'What are the most frequent issues?',
              'What is the root cause of this problem?',
              'How were similar issues resolved in the past?',
            ],
            prediction: [
              'What is the performance prediction for next week?',
              'When should we scale up capacity?',
              'When is the expected failure point?',
            ],
          };

    const queryType = analysis.queryType;
    if (templates[queryType]) {
      queries.push(...templates[queryType]);
    }

    return queries.slice(0, 3); // 최대 3개 관련 질의
  }

  /**
   * 📊 데이터 포인트 수 계산
   */
  private countDataPoints(data: DataContext): number {
    let count = 0;

    data.servers.forEach((metrics) => {
      count += metrics.length;
    });

    data.anomalies.forEach((anomalies) => {
      count += anomalies.length;
    });

    data.predictions.forEach((predictions) => {
      count += predictions.length;
    });

    count += data.alerts.length;

    return count;
  }

  /**
   * 📊 메트릭 추출
   */
  private extractMetricsFromData(data: DataContext): string[] {
    const metrics = new Set<string>();

    // 서버 메트릭
    if (data.servers.size > 0) {
      metrics.add('responseTime');
      metrics.add('errorRate');
      metrics.add('successRate');
      metrics.add('requestCount');
    }

    // 이상 징후 메트릭
    data.anomalies.forEach((anomalies) => {
      anomalies.forEach((anomaly) => {
        anomaly.affectedMetrics.forEach((metric) => metrics.add(metric));
      });
    });

    return Array.from(metrics);
  }

  /**
   * 📊 상태 차트 데이터 준비
   */
  private prepareStatusChartData(
    servers: Map<MCPServerName, MCPServerMetrics[]>
  ): any {
    const chartData: any[] = [];

    servers.forEach((metrics, serverId) => {
      const latest = metrics[metrics.length - 1];
      if (latest) {
        chartData.push({
          server: serverId,
          responseTime: latest.responseTime,
          errorRate: latest.errorRate,
          successRate: latest.successRate,
        });
      }
    });

    return chartData;
  }

  /**
   * 📈 트렌드 그래프 데이터 준비
   */
  private prepareTrendGraphData(
    servers: Map<MCPServerName, MCPServerMetrics[]>
  ): any {
    const graphData: any = {};

    servers.forEach((metrics, serverId) => {
      graphData[serverId] = metrics.map((m) => ({
        timestamp: m.timestamp,
        responseTime: m.responseTime,
        errorRate: m.errorRate,
        successRate: m.successRate,
      }));
    });

    return graphData;
  }

  /**
   * 📊 비교 테이블 데이터 준비
   */
  private prepareComparisonTableData(
    servers: Map<MCPServerName, MCPServerMetrics[]>
  ): any {
    const tableData: any[] = [];

    servers.forEach((metrics, serverId) => {
      const latest = metrics[metrics.length - 1];
      const avg = this.calculateAverageMetrics(metrics);

      if (latest) {
        tableData.push({
          server: serverId,
          current: {
            responseTime: latest.responseTime,
            errorRate: latest.errorRate,
            successRate: latest.successRate,
          },
          average: avg,
        });
      }
    });

    return tableData;
  }

  /**
   * 🔥 이상 징후 히트맵 데이터 준비
   */
  private prepareAnomalyHeatmapData(
    anomalies: Map<MCPServerName, AnomalyDetectionResult[]>
  ): any {
    const heatmapData: any[] = [];

    anomalies.forEach((serverAnomalies, serverId) => {
      const anomalyCount = serverAnomalies.length;
      const severityScore =
        serverAnomalies.reduce((sum, anomaly) => {
          return sum + this.mapSeverityToNumber(anomaly.severity);
        }, 0) / anomalyCount;

      heatmapData.push({
        server: serverId,
        anomalyCount,
        severityScore,
        timestamp: Date.now(),
      });
    });

    return heatmapData;
  }

  /**
   * 📊 평균 메트릭 계산
   */
  private calculateAverageMetrics(metrics: MCPServerMetrics[]): any {
    if (metrics.length === 0) return null;

    const sum = metrics.reduce(
      (acc, m) => ({
        responseTime: acc.responseTime + m.responseTime,
        errorRate: acc.errorRate + m.errorRate,
        successRate: acc.successRate + m.successRate,
      }),
      { responseTime: 0, errorRate: 0, successRate: 0 }
    );

    return {
      responseTime: sum.responseTime / metrics.length,
      errorRate: sum.errorRate / metrics.length,
      successRate: sum.successRate / metrics.length,
    };
  }

  /**
   * 🔢 심각도를 숫자로 매핑
   */
  private mapSeverityToNumber(severity: string): number {
    switch (severity) {
      case 'critical':
        return 4;
      case 'high':
        return 3;
      case 'medium':
        return 2;
      case 'low':
        return 1;
      default:
        return 0;
    }
  }

  /**
   * 💾 대화 저장
   */
  private saveConversation(
    request: NLPQueryRequest,
    response: NLPQueryResponse
  ): void {
    const sessionId = 'default'; // 추후 세션 관리 구현

    const conversation: NLPConversation = {
      id: `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      query: request.query,
      response: response.answer,
      context: request.context,
    };

    const history = this.conversations.get(sessionId) || [];
    history.push(conversation);

    // 최대 히스토리 수 제한
    if (history.length > this.config.maxConversationHistory) {
      history.shift();
    }

    this.conversations.set(sessionId, history);
  }

  /**
   * 🔑 캐시 키 생성
   */
  private generateCacheKey(request: NLPQueryRequest): string {
    const contextStr = JSON.stringify(request.context || {});
    const prefsStr = JSON.stringify(request.preferences || {});

    return `nlp_${request.query}_${request.language}_${contextStr}_${prefsStr}`.slice(
      0,
      100
    );
  }

  /**
   * 🧹 주기적 캐시 정리
   */
  private startPeriodicCacheCleanup(): void {
    setInterval(
      () => {
        const now = Date.now();

        // 응답 캐시 정리
        this.responseCache.forEach((response, key) => {
          if (now - response.metadata.processingTime > this.config.cacheTTL) {
            this.responseCache.delete(key);
          }
        });

        // 대화 히스토리 정리 (7일 이상 된 것)
        const cutoff = now - 7 * 24 * 60 * 60 * 1000;
        this.conversations.forEach((history, sessionId) => {
          const filtered = history.filter((conv) => conv.timestamp > cutoff);
          this.conversations.set(sessionId, filtered);
        });
      },
      60 * 60 * 1000
    ); // 1시간마다
  }

  /**
   * 📊 데이터 컨텍스트 업데이트
   */
  public updateDataContext(newContext: Partial<DataContext>): void {
    Object.assign(this.dataContext, newContext);
  }

  /**
   * 📊 질의 통계 조회
   */
  public getQueryStats(): {
    totalQueries: number;
    queriesByLanguage: Record<string, number>;
    queriesByType: Record<string, number>;
    averageConfidence: number;
    cacheHitRate: number;
  } {
    const allConversations = Array.from(this.conversations.values()).flat();
    const queriesByLanguage: Record<string, number> = {};
    const queriesByType: Record<string, number> = {};

    // 통계 계산은 응답 캐시에서 추출
    const responses = Array.from(this.responseCache.values());
    responses.forEach((response) => {
      queriesByLanguage[response.language] =
        (queriesByLanguage[response.language] || 0) + 1;
      queriesByType[response.analysis.queryType] =
        (queriesByType[response.analysis.queryType] || 0) + 1;
    });

    const averageConfidence =
      responses.length > 0
        ? responses.reduce((sum, r) => sum + r.confidence, 0) / responses.length
        : 0;

    const cacheHits = responses.filter((r) => r.metadata.cacheHit).length;
    const cacheHitRate =
      responses.length > 0 ? cacheHits / responses.length : 0;

    return {
      totalQueries: allConversations.length,
      queriesByLanguage,
      queriesByType,
      averageConfidence,
      cacheHitRate,
    };
  }
}

// 싱글톤 인스턴스 내보내기
export const nlpQueryEngine = NLPQueryEngine.getInstance();
