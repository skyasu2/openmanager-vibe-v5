/**
 * 📊 컨텍스트 관리 시스템
 *
 * MCP 엔진의 상태 정보 및 학습된 패턴 관리
 * - 단기/장기 메모리 관리
 * - 세션 컨텍스트 추적
 * - 패턴 학습 및 저장
 */

// 🧠 컨텍스트 인터페이스들
export interface Context {
  system: {
    current_metrics: MetricsSnapshot;
    historical_trends: TrendData;
    known_issues: Issue[];
  };
  patterns: {
    daily_patterns: Pattern[];
    weekly_patterns: Pattern[];
    anomaly_patterns: AnomalyPattern[];
  };
  session: {
    query_history: Query[];
    analysis_results: Result[];
    user_preferences: Preferences;
  };
  domain: {
    thresholds: Record<string, number>;
    rules: BusinessRule[];
    correlations: MetricCorrelation[];
  };
}

export interface MetricsSnapshot {
  timestamp: string;
  cpu: number;
  memory: number;
  disk: number;
  network: { in: number; out: number };
  responseTime: number;
  errorRate: number;
}

export interface TrendData {
  timeRange: string;
  direction: 'increasing' | 'decreasing' | 'stable';
  confidence: number;
  slope: number;
}

export interface Issue {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  firstOccurred: string;
  lastOccurred: string;
  frequency: number;
}

export interface Pattern {
  id: string;
  type: 'daily' | 'weekly' | 'monthly';
  description: string;
  confidence: number;
  parameters: Record<string, any>;
  learnedAt: string;
}

export interface AnomalyPattern {
  id: string;
  description: string;
  signature: number[];
  confidence: number;
  occurrences: number;
  lastSeen: string;
}

export interface Query {
  id: string;
  text: string;
  timestamp: string;
  intent: string;
  confidence: number;
}

export interface Result {
  queryId: string;
  toolsUsed: string[];
  result: unknown;
  confidence: number;
  timestamp: string;
}

export interface Preferences {
  sensitivity: 'low' | 'medium' | 'high';
  detailedAnalysis: boolean;
  notificationLevel: 'minimal' | 'normal' | 'verbose';
}

export interface BusinessRule {
  id: string;
  name: string;
  condition: string;
  action: string;
  priority: number;
  active: boolean;
}

export interface MetricCorrelation {
  metric1: string;
  metric2: string;
  correlation: number;
  confidence: number;
  timelag: number;
}

export interface EnrichedQuery {
  original_query: string;
  metrics: string[];
  time_range: string;
  rules: BusinessRule[];
  session_context: Query[];
}

export interface SessionContext {
  sessionId: string;
  queries: Query[];
  results: Result[];
  startTime: string;
  lastActivity: string;
}

/**
 * 🧠 컨텍스트 관리자 메인 클래스
 */
export class ContextManager {
  private currentContext: Context;
  private shortTermMemory: Map<string, any> = new Map();
  private sessionContext: SessionContext;
  private contextId: string;

  constructor() {
    this.contextId = this.generateContextId();
    this.currentContext = this._initializeDefaultContext();
    this.sessionContext = this._initializeSession();
  }

  /**
   * 🆔 컨텍스트 ID 생성
   */
  private generateContextId(): string {
    return `ctx_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * 🏗️ 기본 컨텍스트 초기화
   */
  private _initializeDefaultContext(): Context {
    return {
      system: {
        current_metrics: {
          timestamp: new Date().toISOString(),
          cpu: 0,
          memory: 0,
          disk: 0,
          network: { in: 0, out: 0 },
          responseTime: 0,
          errorRate: 0,
        },
        historical_trends: {
          timeRange: '1hour',
          direction: 'stable',
          confidence: 0.5,
          slope: 0,
        },
        known_issues: [],
      },
      patterns: {
        daily_patterns: [],
        weekly_patterns: [],
        anomaly_patterns: [],
      },
      session: {
        query_history: [],
        analysis_results: [],
        user_preferences: {
          sensitivity: 'medium',
          detailedAnalysis: false,
          notificationLevel: 'normal',
        },
      },
      domain: {
        thresholds: {
          cpu_warning: 70,
          cpu_critical: 90,
          memory_warning: 80,
          memory_critical: 95,
          response_time_warning: 500,
          response_time_critical: 1000,
          error_rate_warning: 5,
          error_rate_critical: 10,
        },
        rules: [
          {
            id: 'high_cpu_rule',
            name: 'High CPU Usage Alert',
            condition: 'cpu > 80',
            action: 'trigger_alert',
            priority: 1,
            active: true,
          },
        ],
        correlations: [],
      },
    };
  }

  /**
   * 🎯 세션 초기화
   */
  private _initializeSession(): SessionContext {
    return {
      sessionId: this.generateContextId(),
      queries: [],
      results: [],
      startTime: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
    };
  }

  /**
   * 🔄 컨텍스트 업데이트
   */
  async update(updateData: unknown): Promise<void> {
    try {
      this.sessionContext.lastActivity = new Date().toISOString();

      // updateData가 객체인지 확인
      if (!updateData || typeof updateData !== 'object') return;

      const data = updateData as any;

      // 사용자 선호도 업데이트
      if ('user_preferences' in data && data.user_preferences) {
        this.currentContext.session.user_preferences = {
          ...this.currentContext.session.user_preferences,
          ...data.user_preferences,
        };
      }

      // 세션 ID 업데이트
      if ('session_id' in data && data.session_id) {
        this.sessionContext.sessionId = data.session_id;
      }

      // 메트릭 데이터 업데이트
      if ('metrics' in data && data.metrics) {
        this.updateMetrics(data.metrics);
      }

      // 단기 메모리에 저장
      this.shortTermMemory.set('last_update', {
        timestamp: new Date().toISOString(),
        data: updateData,
      });
    } catch (error) {
      console.error('❌ 컨텍스트 업데이트 오류:', error);
    }
  }

  /**
   * 📊 메트릭 업데이트
   */
  private updateMetrics(metrics: unknown): void {
    if (!metrics || typeof metrics !== 'object') return;
    
    const metricsData = metrics as any;
    
    this.currentContext.system.current_metrics = {
      timestamp: new Date().toISOString(),
      cpu: 'cpu' in metricsData ? metricsData.cpu : 0,
      memory: 'memory' in metricsData ? metricsData.memory : 0,
      disk: 'disk' in metricsData ? metricsData.disk : 0,
      network: {
        in: 'networkIn' in metricsData ? metricsData.networkIn : 0,
        out: 'networkOut' in metricsData ? metricsData.networkOut : 0,
      },
      responseTime: 'responseTime' in metricsData ? metricsData.responseTime : 0,
      errorRate: 'errorRate' in metricsData ? metricsData.errorRate : 0,
    };

    // 트렌드 계산
    this.updateTrends(metrics);
  }

  /**
   * 📈 트렌드 업데이트
   */
  private updateTrends(metrics: unknown): void {
    // 간단한 트렌드 계산 로직
    const historical = this.shortTermMemory.get('historical_metrics') || [];
    historical.push(metrics);

    // 최근 10개 데이터만 보관
    if (historical.length > 10) {
      historical.shift();
    }

    this.shortTermMemory.set('historical_metrics', historical);

    // 트렌드 방향 계산
    if (historical.length >= 3) {
      const recent = historical.slice(-3);
      const cpuTrend = this.calculateTrend(recent.map((m: any) => m.cpu || 0));

      this.currentContext.system.historical_trends = {
        timeRange: '10minutes',
        direction: cpuTrend.direction,
        confidence: cpuTrend.confidence,
        slope: cpuTrend.slope,
      };
    }
  }

  /**
   * 📊 트렌드 계산
   */
  private calculateTrend(values: number[]): {
    direction: 'increasing' | 'decreasing' | 'stable';
    confidence: number;
    slope: number;
  } {
    if (values.length < 2) {
      return { direction: 'stable', confidence: 0.5, slope: 0 };
    }

    // 선형 회귀를 통한 기울기 계산
    const n = values.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = values.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * values[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);

    let direction: 'increasing' | 'decreasing' | 'stable';
    if (Math.abs(slope) < 0.5) {
      direction = 'stable';
    } else if (slope > 0) {
      direction = 'increasing';
    } else {
      direction = 'decreasing';
    }

    const confidence = Math.min(Math.abs(slope) / 5, 1); // 0-1 범위로 정규화

    return { direction, confidence, slope };
  }

  /**
   * 🧠 쿼리 강화
   */
  async enrichQuery(query: string): Promise<EnrichedQuery> {
    // 1. 이전 대화 참조
    const previousQueries = this.sessionContext.queries.slice(-5);

    // 2. 관련 메트릭 식별
    const relevantMetrics = this.identifyRelevantMetrics(query);

    // 3. 시간 컨텍스트 추가
    const timeContext = this.extractTimeContext(query);

    // 4. 도메인 규칙 적용
    const applicableRules = this.findApplicableRules(query);

    return {
      original_query: query,
      metrics: relevantMetrics,
      time_range: timeContext,
      rules: applicableRules,
      session_context: previousQueries,
    };
  }

  /**
   * 🔍 관련 메트릭 식별
   */
  private identifyRelevantMetrics(query: string): string[] {
    const metrics: string[] = [];
    const queryLower = query.toLowerCase();

    if (queryLower.includes('cpu') || queryLower.includes('프로세서')) {
      metrics.push('cpu');
    }
    if (queryLower.includes('memory') || queryLower.includes('메모리')) {
      metrics.push('memory');
    }
    if (queryLower.includes('disk') || queryLower.includes('디스크')) {
      metrics.push('disk');
    }
    if (queryLower.includes('network') || queryLower.includes('네트워크')) {
      metrics.push('network');
    }
    if (queryLower.includes('response') || queryLower.includes('응답')) {
      metrics.push('responseTime');
    }
    if (queryLower.includes('error') || queryLower.includes('오류')) {
      metrics.push('errorRate');
    }

    // 기본값으로 모든 메트릭 포함
    if (metrics.length === 0) {
      metrics.push(
        'cpu',
        'memory',
        'disk',
        'network',
        'responseTime',
        'errorRate'
      );
    }

    return metrics;
  }

  /**
   * ⏰ 시간 컨텍스트 추출
   */
  private extractTimeContext(query: string): string {
    const queryLower = query.toLowerCase();

    if (queryLower.includes('지금') || queryLower.includes('현재')) {
      return 'current';
    }
    if (queryLower.includes('1시간') || queryLower.includes('hour')) {
      return '1hour';
    }
    if (queryLower.includes('하루') || queryLower.includes('day')) {
      return '1day';
    }
    if (queryLower.includes('일주일') || queryLower.includes('week')) {
      return '1week';
    }

    return 'default';
  }

  /**
   * 📋 적용 가능한 규칙 찾기
   */
  private findApplicableRules(query: string): BusinessRule[] {
    return this.currentContext.domain.rules.filter(
      rule =>
        rule.active && query.toLowerCase().includes(rule.name.toLowerCase())
    );
  }

  /**
   * 📚 패턴 학습 및 저장
   */
  async learnPattern(data: unknown, patternType: string): Promise<void> {
    try {
      const pattern = await this.extractPattern(data, patternType);

      // 단기 메모리에 저장
      const patternKey = `pattern_${Date.now()}`;
      this.shortTermMemory.set(patternKey, pattern);

      // 중요 패턴은 컨텍스트에 영구 저장
      if (pattern.significance > 0.8) {
        if (patternType === 'daily') {
          this.currentContext.patterns.daily_patterns.push(pattern);
        } else if (patternType === 'weekly') {
          this.currentContext.patterns.weekly_patterns.push(pattern);
        } else if (patternType === 'anomaly') {
          this.currentContext.patterns.anomaly_patterns.push(pattern);
        }

        // 최대 패턴 수 제한
        this.limitPatternStorage();
      }
    } catch (error) {
      console.error('❌ 패턴 학습 오류:', error);
    }
  }

  /**
   * 🎯 패턴 추출
   */
  private async extractPattern(data: unknown, patternType: string): Promise<any> {
    return {
      id: `pattern_${Date.now()}`,
      type: patternType,
      description: `Learned ${patternType} pattern`,
      confidence: Math.random() * 0.3 + 0.7, // 0.7-1.0
      parameters: data,
      learnedAt: new Date().toISOString(),
      significance: Math.random() * 0.5 + 0.5, // 0.5-1.0
    };
  }

  /**
   * 🗃️ 패턴 저장소 제한 (무료 티어 최적화)
   */
  private limitPatternStorage(): void {
    // 무료 티어 최적화: 실용성과 효율성 균형 (15개)
    const maxPatterns = 15;

    if (this.currentContext.patterns.daily_patterns.length > maxPatterns) {
      this.currentContext.patterns.daily_patterns =
        this.currentContext.patterns.daily_patterns.slice(-maxPatterns);
    }

    if (this.currentContext.patterns.weekly_patterns.length > maxPatterns) {
      this.currentContext.patterns.weekly_patterns =
        this.currentContext.patterns.weekly_patterns.slice(-maxPatterns);
    }

    if (this.currentContext.patterns.anomaly_patterns.length > maxPatterns) {
      this.currentContext.patterns.anomaly_patterns =
        this.currentContext.patterns.anomaly_patterns.slice(-maxPatterns);
    }
  }

  /**
   * 💾 결과 저장
   */
  async save(result: unknown): Promise<void> {
    try {
      // result가 객체인지 확인
      if (!result || typeof result !== 'object') {
        console.warn('⚠️ 유효하지 않은 결과:', result);
        return;
      }

      const resultData = result as any;

      // 세션 컨텍스트에 결과 저장
      const analysisResult: Result = {
        queryId: 'queryId' in resultData ? resultData.queryId : `result_${Date.now()}`,
        toolsUsed: 'tools_used' in resultData ? resultData.tools_used : [],
        result: result,
        confidence: 'confidence' in resultData ? resultData.confidence : 0.8,
        timestamp: new Date().toISOString(),
      };

      this.sessionContext.results.push(analysisResult);
      this.currentContext.session.analysis_results.push(analysisResult);

      // 무료 티어 최적화: 실용성 고려하여 35개로 설정
      if (this.sessionContext.results.length > 35) {
        this.sessionContext.results.shift();
      }

      if (this.currentContext.session.analysis_results.length > 35) {
        this.currentContext.session.analysis_results.shift();
      }

      // 단기 메모리에도 저장
      this.shortTermMemory.set('last_result', analysisResult);
    } catch (error) {
      console.error('❌ 결과 저장 오류:', error);
    }
  }

  /**
   * 📖 현재 컨텍스트 반환
   */
  getCurrent(): Context {
    return this.currentContext;
  }

  /**
   * 🆔 컨텍스트 ID 반환
   */
  getId(): string {
    return this.contextId;
  }

  /**
   * 📝 쿼리 추가
   */
  addQuery(query: string, intent: string, confidence: number): void {
    const queryObj: Query = {
      id: `query_${Date.now()}`,
      text: query,
      timestamp: new Date().toISOString(),
      intent,
      confidence,
    };

    this.sessionContext.queries.push(queryObj);
    this.currentContext.session.query_history.push(queryObj);

    // 무료 티어 최적화: 쿼리 히스토리 18개로 설정
    if (this.sessionContext.queries.length > 18) {
      this.sessionContext.queries.shift();
    }

    if (this.currentContext.session.query_history.length > 18) {
      this.currentContext.session.query_history.shift();
    }
  }

  /**
   * 📊 컨텍스트 통계
   */
  getStats(): unknown {
    return {
      contextId: this.contextId,
      sessionId: this.sessionContext.sessionId,
      queryCount: this.sessionContext.queries.length,
      resultCount: this.sessionContext.results.length,
      patternCount: {
        daily: this.currentContext.patterns.daily_patterns.length,
        weekly: this.currentContext.patterns.weekly_patterns.length,
        anomaly: this.currentContext.patterns.anomaly_patterns.length,
      },
      shortTermMemorySize: this.shortTermMemory.size,
      lastActivity: this.sessionContext.lastActivity,
      uptime: Date.now() - new Date(this.sessionContext.startTime).getTime(),
    };
  }

  /**
   * 🧹 메모리 정리 (무료 티어 최적화)
   */
  cleanup(): void {
    // 무료 티어 최적화: 45분으로 설정 (실용성과 효율성 균형)
    const fortyFiveMinutesAgo = Date.now() - 2700000; // 45분

    for (const [key, value] of this.shortTermMemory.entries()) {
      if (
        value.timestamp &&
        new Date(value.timestamp).getTime() < fortyFiveMinutesAgo
      ) {
        this.shortTermMemory.delete(key);
      }
    }

    console.log(
      `🧹 컨텍스트 메모리 정리 완료 (무료 티어 최적화): ${this.shortTermMemory.size}개 항목 유지`
    );
  }
}
