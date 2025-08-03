/**
 * 🎭 개발용 Mock GCP Functions
 * 
 * 개발/테스트 환경에서 실제 GCP Functions 대신 사용
 * - Korean NLP 처리
 * - ML Analytics (이상 감지, 트렌드 분석, 예측)
 * - 통합 AI 처리
 * - 서버 모니터링 도메인 특화
 */

import { getErrorMessage } from '@/types/type-utils';

// Types
interface KoreanNLPEntity {
  type: 'server' | 'metric' | 'status' | 'action' | 'time';
  value: string;
  confidence: number;
  normalized: string;
}

interface KoreanNLPResult {
  intent: string;
  entities: KoreanNLPEntity[];
  semantic_analysis: {
    main_topic: string;
    sub_topics: string[];
    urgency_level: 'low' | 'medium' | 'high' | 'critical';
    technical_complexity: number;
  };
  server_context: {
    target_servers: string[];
    metrics: string[];
    time_range?: { period: string };
    comparison_type?: string;
  };
  response_guidance: {
    response_type: 'informational' | 'analytical' | 'actionable' | 'alerting';
    detail_level: 'summary' | 'detailed' | 'comprehensive';
    visualization_suggestions: string[];
    follow_up_questions: string[];
  };
  quality_metrics: {
    confidence: number;
    processing_time: number;
    analysis_depth: number;
    context_relevance: number;
  };
}

interface AnomalyResult {
  is_anomaly: boolean;
  severity: 'low' | 'medium' | 'high';
  confidence: number;
  timestamp: string;
  value: number;
  expected_range: [number, number];
}

interface TrendAnalysis {
  direction: 'increasing' | 'decreasing' | 'stable';
  rate_of_change: number;
  prediction_24h: number;
  confidence: number;
}

interface MLAnalysisResult {
  anomalies: AnomalyResult[];
  trend: TrendAnalysis;
  patterns: Array<{
    type: string;
    description: string;
    confidence: number;
  }>;
  recommendations: string[];
}

interface MockGCPStats {
  nlpCalls: number;
  mlCalls: number;
  unifiedCalls: number;
  totalCalls: number;
  errors: number;
  avgProcessingTime: number;
  startTime: number;
}

/**
 * Mock GCP Functions 클래스
 */
export class DevMockGCPFunctions {
  private stats: MockGCPStats = {
    nlpCalls: 0,
    mlCalls: 0,
    unifiedCalls: 0,
    totalCalls: 0,
    errors: 0,
    avgProcessingTime: 0,
    startTime: Date.now(),
  };

  private processingTimes: number[] = [];

  // 서버 모니터링 특화 패턴
  private koreanPatterns = {
    servers: ['서버', '시스템', '노드', 'server', 'system', 'node'],
    metrics: ['CPU', '메모리', '디스크', '네트워크', 'memory', 'disk', 'network'],
    urgency: {
      critical: ['긴급', '심각', '다운', '장애', 'urgent', 'critical', 'down'],
      high: ['높음', '위험', '경고', 'high', 'danger', 'warning'],
      medium: ['확인', '점검', '분석', 'check', 'inspect', 'analyze'],
      low: ['일반', '정보', '상태', 'general', 'info', 'status'],
    },
  };

  constructor(
    private config: {
      enableLogging?: boolean;
      simulatedLatency?: number;
      errorRate?: number;
    } = {}
  ) {
    this.config = {
      enableLogging: true,
      simulatedLatency: 100,
      errorRate: 0,
      ...config,
    };

    this.log('🎭 DevMockGCPFunctions 초기화 완료');
  }

  private log(...args: unknown[]) {
    if (this.config.enableLogging) {
      console.log('[DevMockGCP]', ...args);
    }
  }

  private async simulateLatency() {
    if (this.config.simulatedLatency && this.config.simulatedLatency > 0) {
      await new Promise(resolve => 
        setTimeout(resolve, this.config.simulatedLatency)
      );
    }
  }

  private shouldError(): boolean {
    return Math.random() < (this.config.errorRate || 0);
  }

  private updateStats(processingTime: number) {
    this.processingTimes.push(processingTime);
    if (this.processingTimes.length > 100) {
      this.processingTimes.shift();
    }
    
    const sum = this.processingTimes.reduce((a, b) => a + b, 0);
    this.stats.avgProcessingTime = sum / this.processingTimes.length;
  }

  /**
   * Korean NLP 분석
   */
  async analyzeKoreanNLP(
    query: string,
    context?: Record<string, any>
  ): Promise<{ success: boolean; data?: KoreanNLPResult; error?: string }> {
    const startTime = Date.now();
    this.stats.nlpCalls++;
    this.stats.totalCalls++;

    try {
      await this.simulateLatency();

      if (this.shouldError()) {
        throw new Error('Mock NLP processing error');
      }

      this.log(`🔍 Korean NLP 분석: ${query}`);

      // 쿼리 분석
      const urgencyLevel = this.detectUrgency(query);
      const entities = this.extractEntities(query);
      const intent = this.classifyIntent(query);
      const mainTopic = this.extractMainTopic(query);

      const result: KoreanNLPResult = {
        intent,
        entities,
        semantic_analysis: {
          main_topic: mainTopic,
          sub_topics: this.extractSubTopics(query),
          urgency_level: urgencyLevel,
          technical_complexity: this.calculateComplexity(query),
        },
        server_context: {
          target_servers: this.extractTargetServers(query),
          metrics: this.extractMetrics(query),
          time_range: this.extractTimeRange(query),
          comparison_type: this.extractComparisonType(query),
        },
        response_guidance: {
          response_type: urgencyLevel === 'critical' ? 'alerting' : 
                        intent === 'analysis' ? 'analytical' : 'informational',
          detail_level: entities.length > 3 ? 'comprehensive' : 'summary',
          visualization_suggestions: this.generateVisualizationSuggestions(query),
          follow_up_questions: this.generateFollowUpQuestions(query),
        },
        quality_metrics: {
          confidence: 0.85 + Math.random() * 0.1,
          processing_time: Date.now() - startTime,
          analysis_depth: 0.8,
          context_relevance: 0.9,
        },
      };

      this.updateStats(Date.now() - startTime);
      this.log(`✅ Korean NLP 분석 완료 (${Date.now() - startTime}ms)`);

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      this.stats.errors++;
      this.log('❌ Korean NLP 오류:', error);
      return {
        success: false,
        error: getErrorMessage(error),
      };
    }
  }

  /**
   * ML Analytics 분석
   */
  async analyzeMLMetrics(
    metrics: Array<{
      timestamp: string;
      value: number;
      server_id: string;
      metric_type: string;
    }>,
    context?: Record<string, any>
  ): Promise<{ success: boolean; data?: MLAnalysisResult; error?: string }> {
    const startTime = Date.now();
    this.stats.mlCalls++;
    this.stats.totalCalls++;

    try {
      await this.simulateLatency();

      if (this.shouldError()) {
        throw new Error('Mock ML processing error');
      }

      this.log(`📊 ML Analytics 분석: ${metrics.length}개 메트릭`);

      // 이상 감지
      const anomalies = this.detectAnomalies(metrics);
      
      // 트렌드 분석
      const trend = this.analyzeTrend(metrics);
      
      // 패턴 찾기
      const patterns = this.findPatterns(metrics);
      
      // 추천 생성
      const recommendations = this.generateMLRecommendations(
        anomalies,
        trend,
        patterns
      );

      const result: MLAnalysisResult = {
        anomalies,
        trend,
        patterns,
        recommendations,
      };

      this.updateStats(Date.now() - startTime);
      this.log(`✅ ML Analytics 완료 (${Date.now() - startTime}ms)`);

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      this.stats.errors++;
      this.log('❌ ML Analytics 오류:', error);
      return {
        success: false,
        error: getErrorMessage(error),
      };
    }
  }

  /**
   * 통합 AI 처리
   */
  async processUnifiedAI(
    request: {
      type: 'report' | 'prediction' | 'optimization';
      data: Record<string, any>;
    }
  ): Promise<{ success: boolean; data?: unknown; error?: string }> {
    const startTime = Date.now();
    this.stats.unifiedCalls++;
    this.stats.totalCalls++;

    try {
      await this.simulateLatency();

      if (this.shouldError()) {
        throw new Error('Mock Unified AI processing error');
      }

      this.log(`🤖 통합 AI 처리: ${request.type}`);

      let result: unknown;

      switch (request.type) {
        case 'report':
          result = this.generateAIReport(request.data);
          break;
        case 'prediction':
          result = this.generatePrediction(request.data);
          break;
        case 'optimization':
          result = this.generateOptimization(request.data);
          break;
        default:
          throw new Error(`Unknown request type: ${request.type}`);
      }

      this.updateStats(Date.now() - startTime);
      this.log(`✅ 통합 AI 처리 완료 (${Date.now() - startTime}ms)`);

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      this.stats.errors++;
      this.log('❌ 통합 AI 오류:', error);
      return {
        success: false,
        error: getErrorMessage(error),
      };
    }
  }

  // Helper methods for Korean NLP
  private detectUrgency(query: string): 'low' | 'medium' | 'high' | 'critical' {
    const lowerQuery = query.toLowerCase();
    
    for (const [level, patterns] of Object.entries(this.koreanPatterns.urgency)) {
      if (patterns.some(p => lowerQuery.includes(p))) {
        return level as any;
      }
    }
    
    return 'low';
  }

  private extractEntities(query: string): KoreanNLPEntity[] {
    const entities: KoreanNLPEntity[] = [];
    const lowerQuery = query.toLowerCase();

    // 서버 엔티티
    if (this.koreanPatterns.servers.some(s => lowerQuery.includes(s))) {
      entities.push({
        type: 'server',
        value: 'general_server',
        confidence: 0.8,
        normalized: 'server',
      });
    }

    // 메트릭 엔티티
    this.koreanPatterns.metrics.forEach(metric => {
      if (lowerQuery.includes(metric.toLowerCase())) {
        entities.push({
          type: 'metric',
          value: metric,
          confidence: 0.9,
          normalized: metric.toLowerCase(),
        });
      }
    });

    // 시간 엔티티
    const timePatterns = ['오늘', '어제', '최근', 'today', 'yesterday', 'recent'];
    timePatterns.forEach(pattern => {
      if (lowerQuery.includes(pattern)) {
        entities.push({
          type: 'time',
          value: pattern,
          confidence: 0.85,
          normalized: pattern,
        });
      }
    });

    return entities;
  }

  private classifyIntent(query: string): string {
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('분석') || lowerQuery.includes('analyze')) {
      return 'analysis';
    } else if (lowerQuery.includes('최적화') || lowerQuery.includes('optimize')) {
      return 'optimization';
    } else if (lowerQuery.includes('문제') || lowerQuery.includes('error')) {
      return 'troubleshooting';
    }
    
    return 'inquiry';
  }

  private extractMainTopic(query: string): string {
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('성능') || lowerQuery.includes('performance')) {
      return '성능 분석';
    } else if (lowerQuery.includes('모니터링') || lowerQuery.includes('monitoring')) {
      return '모니터링';
    } else if (lowerQuery.includes('장애') || lowerQuery.includes('failure')) {
      return '장애 처리';
    }
    
    return '일반 쿼리';
  }

  private extractSubTopics(query: string): string[] {
    const subTopics: string[] = [];
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('cpu')) subTopics.push('CPU 분석');
    if (lowerQuery.includes('메모리')) subTopics.push('메모리 분석');
    if (lowerQuery.includes('네트워크')) subTopics.push('네트워크 분석');
    
    return subTopics;
  }

  private calculateComplexity(query: string): number {
    // 쿼리 길이와 엔티티 수를 기반으로 복잡도 계산
    const entities = this.extractEntities(query);
    const complexity = Math.min(1, (query.length * 0.001) + (entities.length * 0.1));
    return complexity;
  }

  private extractTargetServers(query: string): string[] {
    // 간단한 서버 패턴 매칭
    const serverPatterns = /([a-zA-Z]+-[a-zA-Z]+-\d+)/g;
    const matches = query.match(serverPatterns) || [];
    return matches;
  }

  private extractMetrics(query: string): string[] {
    const metrics: string[] = [];
    const lowerQuery = query.toLowerCase();
    
    this.koreanPatterns.metrics.forEach(metric => {
      if (lowerQuery.includes(metric.toLowerCase())) {
        metrics.push(metric.toLowerCase());
      }
    });
    
    return metrics;
  }

  private extractTimeRange(query: string): { period: string } | undefined {
    const timePatterns: Record<string, string[]> = {
      '1h': ['1시간', '한시간', '1 hour'],
      '24h': ['24시간', '하루', '1일', '24 hours', 'day'],
      '7d': ['일주일', '1주일', '1 week'],
    };
    
    const lowerQuery = query.toLowerCase();
    
    for (const [period, patterns] of Object.entries(timePatterns)) {
      if (patterns.some(p => lowerQuery.includes(p))) {
        return { period };
      }
    }
    
    return undefined;
  }

  private extractComparisonType(query: string): string | undefined {
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('현재') || lowerQuery.includes('current')) {
      return 'current';
    } else if (lowerQuery.includes('과거') || lowerQuery.includes('past')) {
      return 'historical';
    } else if (lowerQuery.includes('트렌드') || lowerQuery.includes('trend')) {
      return 'trend';
    }
    
    return undefined;
  }

  private generateVisualizationSuggestions(query: string): string[] {
    const suggestions: string[] = [];
    const metrics = this.extractMetrics(query);
    
    if (metrics.includes('cpu')) suggestions.push('CPU 사용률 차트');
    if (metrics.includes('memory')) suggestions.push('메모리 사용량 그래프');
    if (query.includes('시간') || query.includes('trend')) {
      suggestions.push('시계열 트렌드 그래프');
    }
    
    return suggestions;
  }

  private generateFollowUpQuestions(query: string): string[] {
    const questions: string[] = [];
    const metrics = this.extractMetrics(query);
    
    if (metrics.length === 1) {
      questions.push('다른 메트릭도 함께 확인하시겠습니까?');
    }
    if (!this.extractTimeRange(query)) {
      questions.push('특정 시간 범위를 지정하시겠습니까?');
    }
    
    return questions;
  }

  // Helper methods for ML Analytics
  private detectAnomalies(metrics: unknown[]): AnomalyResult[] {
    const anomalies: AnomalyResult[] = [];
    
    // 간단한 이상 감지 시뮬레이션
    metrics.forEach((metric, index) => {
      if (metric.value > 85 || metric.value < 10) {
        anomalies.push({
          is_anomaly: true,
          severity: metric.value > 90 ? 'high' : 'medium',
          confidence: 0.85,
          timestamp: metric.timestamp,
          value: metric.value,
          expected_range: [20, 80],
        });
      }
    });
    
    return anomalies;
  }

  private analyzeTrend(metrics: unknown[]): TrendAnalysis {
    // 간단한 트렌드 분석 시뮬레이션
    const values = metrics.map(m => m.value);
    const avgValue = values.reduce((a, b) => a + b, 0) / values.length;
    const lastValue = values[values.length - 1];
    
    let direction: 'increasing' | 'decreasing' | 'stable' = 'stable';
    if (lastValue > avgValue * 1.1) direction = 'increasing';
    else if (lastValue < avgValue * 0.9) direction = 'decreasing';
    
    return {
      direction,
      rate_of_change: (lastValue - avgValue) / avgValue,
      prediction_24h: lastValue * (1 + (Math.random() * 0.2 - 0.1)),
      confidence: 0.75,
    };
  }

  private findPatterns(metrics: unknown[]): Array<{ type: string; description: string; confidence: number }> {
    const patterns: Array<{ type: string; description: string; confidence: number }> = [];
    
    // 간단한 패턴 찾기 시뮬레이션
    patterns.push({
      type: 'peak_hour',
      description: '오후 2-3시에 최대 사용량 발생',
      confidence: 0.8,
    });
    
    if (metrics.length > 50) {
      patterns.push({
        type: 'weekly_cycle',
        description: '주간 사용량 패턴 감지됨',
        confidence: 0.7,
      });
    }
    
    return patterns;
  }

  private generateMLRecommendations(
    anomalies: AnomalyResult[],
    trend: TrendAnalysis,
    patterns: unknown[]
  ): string[] {
    const recommendations: string[] = [];
    
    const highSeverityCount = anomalies.filter(a => a.severity === 'high').length;
    if (highSeverityCount > 0) {
      recommendations.push(
        `🚨 ${highSeverityCount}개의 심각한 이상 징후가 감지되었습니다. 즉시 확인이 필요합니다.`
      );
    }
    
    if (trend.direction === 'increasing' && trend.rate_of_change > 0.2) {
      recommendations.push(
        '📈 지속적인 증가 추세가 감지되었습니다. 용량 확장을 고려하세요.'
      );
    }
    
    patterns.forEach(pattern => {
      if (pattern.type === 'peak_hour') {
        recommendations.push(
          `💡 ${pattern.description}. 이 시간대에 리소스를 집중 배치하세요.`
        );
      }
    });
    
    return recommendations;
  }

  // Helper methods for Unified AI
  private generateAIReport(data: unknown): unknown {
    return {
      title: '서버 상태 보고서',
      summary: '전반적으로 안정적인 상태이나 일부 최적화가 필요합니다.',
      sections: [
        {
          title: '현재 상태',
          content: '모든 서버가 정상 작동 중입니다.',
        },
        {
          title: '권장 사항',
          content: 'CPU 사용률이 높은 서버의 부하 분산을 고려하세요.',
        },
      ],
      generated_at: new Date().toISOString(),
    };
  }

  private generatePrediction(data: unknown): unknown {
    return {
      predictions: [
        {
          metric: 'cpu',
          current: 65,
          predicted_1h: 68,
          predicted_24h: 72,
          confidence: 0.8,
        },
        {
          metric: 'memory',
          current: 45,
          predicted_1h: 46,
          predicted_24h: 48,
          confidence: 0.85,
        },
      ],
      risk_level: 'medium',
      action_required: false,
    };
  }

  private generateOptimization(data: unknown): unknown {
    return {
      recommendations: [
        {
          type: 'resource_allocation',
          description: 'CPU 리소스 재분배',
          impact: 'high',
          effort: 'medium',
        },
        {
          type: 'caching',
          description: '캐싱 전략 개선',
          impact: 'medium',
          effort: 'low',
        },
      ],
      estimated_improvement: '15-20%',
    };
  }

  /**
   * 통계 조회
   */
  getStats() {
    const uptime = Date.now() - this.stats.startTime;
    return {
      ...this.stats,
      uptime,
      uptimeFormatted: `${Math.floor(uptime / 1000)}s`,
      errorRate: this.stats.totalCalls > 0 
        ? ((this.stats.errors / this.stats.totalCalls) * 100).toFixed(2) + '%'
        : '0%',
    };
  }

  /**
   * Mock 초기화
   */
  reset() {
    this.stats = {
      nlpCalls: 0,
      mlCalls: 0,
      unifiedCalls: 0,
      totalCalls: 0,
      errors: 0,
      avgProcessingTime: 0,
      startTime: Date.now(),
    };
    this.processingTimes = [];
    this.log('Mock GCP Functions 초기화됨');
  }
}

// 싱글톤 인스턴스
let instance: DevMockGCPFunctions | null = null;

export function getDevMockGCPFunctions(config?: unknown): DevMockGCPFunctions {
  if (!instance) {
    instance = new DevMockGCPFunctions(config);
  }
  return instance;
}

// GCP Functions 호환 인터페이스
export class MockGCPFunctionsClient {
  private mock: DevMockGCPFunctions;

  constructor(config?: unknown) {
    this.mock = getDevMockGCPFunctions(config);
  }

  async callFunction(
    functionName: string,
    data: unknown
  ): Promise<{ success: boolean; data?: unknown; error?: string }> {
    switch (functionName) {
      case 'enhanced-korean-nlp':
        return this.mock.analyzeKoreanNLP(data.query, data.context);
      
      case 'ml-analytics-engine':
        return this.mock.analyzeMLMetrics(data.metrics, data.context);
      
      case 'unified-ai-processor':
        return this.mock.processUnifiedAI(data);
      
      default:
        return {
          success: false,
          error: `Unknown function: ${functionName}`,
        };
    }
  }

  getStats() {
    return this.mock.getStats();
  }

  reset() {
    this.mock.reset();
  }
}