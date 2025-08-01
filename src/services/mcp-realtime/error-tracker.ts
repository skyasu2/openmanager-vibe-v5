/**
 * 🚨 MCP 오류 추적 및 분석 시스템 v3.0
 *
 * 실시간 오류 감지, 패턴 분석, 자동 분류
 * - 오류 패턴 분석 및 근본 원인 추적
 * - 예측적 오류 방지
 * - 자동 우선순위 결정
 * - 실시간 알림 및 대응 가이드
 */

import { Redis } from '@upstash/redis';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { MCPServerName } from '../mcp-monitor/types';

// 🚨 오류 분류 및 심각도
export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';
export type ErrorCategory =
  | 'connection' // 연결 오류
  | 'timeout' // 타임아웃
  | 'authentication' // 인증 오류
  | 'authorization' // 권한 오류
  | 'validation' // 입력 검증
  | 'database' // DB 오류
  | 'cache' // 캐시 오류
  | 'network' // 네트워크 오류
  | 'resource' // 자원 부족
  | 'logic' // 비즈니스 로직
  | 'external' // 외부 서비스
  | 'system' // 시스템 오류
  | 'unknown'; // 분류되지 않음

// 📊 오류 상세 정보
export interface ErrorDetails {
  id: string;
  timestamp: number;
  serverId: MCPServerName;

  // 기본 정보
  category: ErrorCategory;
  severity: ErrorSeverity;
  message: string;
  stack?: string;
  code?: string | number;

  // 컨텍스트
  context: {
    userId?: string;
    sessionId?: string;
    requestId?: string;
    endpoint?: string;
    method?: string;
    userAgent?: string;
    ip?: string;
  };

  // 시스템 상태
  systemState: {
    memoryUsage: number;
    cpuUsage: number;
    diskUsage: number;
    networkLatency: number;
    activeConnections: number;
  };

  // 관련 메트릭
  metrics: {
    responseTime: number;
    throughput: number;
    errorRate: number;
    consecutiveErrors: number;
    similarErrorsLast24h: number;
  };

  // 분석 결과
  analysis: {
    rootCause?: string;
    impact: number; // 0-100
    likelihood: number; // 0-100 (재발 가능성)
    correlatedErrors: string[];
    suggestedActions: string[];
  };

  // 상태 추적
  status: 'new' | 'investigating' | 'resolved' | 'ignored';
  assignedTo?: string;
  resolvedAt?: number;
  resolution?: string;
}

// 📈 오류 패턴 분석
export interface ErrorPattern {
  id: string;
  name: string;
  category: ErrorCategory;
  confidence: number; // 0-100

  // 패턴 특성
  characteristics: {
    frequency: 'rare' | 'occasional' | 'frequent' | 'constant';
    timing: 'random' | 'periodic' | 'burst' | 'cascade';
    scope: 'single-server' | 'multi-server' | 'system-wide';
    duration: 'transient' | 'persistent' | 'intermittent';
  };

  // 발생 조건
  conditions: {
    timeRanges?: string[]; // ['09:00-17:00']
    loadThresholds?: number; // CPU/Memory 임계값
    dependencies?: string[]; // 의존성 서비스
    userPatterns?: string[]; // 사용자 행동 패턴
  };

  // 영향 분석
  impact: {
    severity: ErrorSeverity;
    affectedUsers: number;
    businessImpact: number; // 0-100
    financialImpact: number; // 예상 손실 ($)
  };

  // 예측 및 대응
  prediction: {
    nextOccurrence?: number; // 예상 다음 발생 시간
    preventionActions: string[];
    mitigationStrategies: string[];
  };

  // 통계
  statistics: {
    totalOccurrences: number;
    firstSeen: number;
    lastSeen: number;
    averageResolutionTime: number;
    recurrenceRate: number;
  };
}

// 🎯 오류 추적 설정
interface ErrorTrackerConfig {
  collection: {
    maxErrorsPerSecond: number; // 100
    batchSize: number; // 50
    retentionDays: number; // 30
    compressionThreshold: number; // 1000 bytes
  };

  analysis: {
    patternDetectionMinSamples: number; // 10
    correlationWindowMinutes: number; // 30
    rootCauseAnalysisDepth: number; // 5
    mlModelUpdateIntervalHours: number; // 24
  };

  alerting: {
    immediateAlertThreshold: ErrorSeverity; // 'high'
    burstDetectionThreshold: number; // 10 errors/minute
    cascadeDetectionEnabled: boolean; // true
    notificationChannels: string[];
  };

  automation: {
    autoClassificationEnabled: boolean; // true
    autoAssignmentEnabled: boolean; // false
    autoResolutionEnabled: boolean; // false (critical errors only)
    learningModeEnabled: boolean; // true
  };
}

/**
 * MCP 오류 추적 및 분석 시스템
 */
export class MCPErrorTracker {
  private redis: Redis;
  private supabase: SupabaseClient;
  private config: ErrorTrackerConfig;

  // 오류 저장소
  private recentErrors: Map<string, ErrorDetails[]> = new Map();
  private errorPatterns: Map<string, ErrorPattern> = new Map();

  // 실시간 추적
  private errorRateCounters: Map<MCPServerName, number> = new Map();
  private lastErrorBurst: Map<MCPServerName, number> = new Map();

  // 타이머
  private analysisTimer: NodeJS.Timeout | null = null;
  private cleanupTimer: NodeJS.Timeout | null = null;
  private patternUpdateTimer: NodeJS.Timeout | null = null;

  constructor(
    redis: Redis,
    supabase: SupabaseClient,
    config?: Partial<ErrorTrackerConfig>
  ) {
    this.redis = redis;
    this.supabase = supabase;
    this.config = {
      collection: {
        maxErrorsPerSecond: 100,
        batchSize: 50,
        retentionDays: 30,
        compressionThreshold: 1000,
      },
      analysis: {
        patternDetectionMinSamples: 10,
        correlationWindowMinutes: 30,
        rootCauseAnalysisDepth: 5,
        mlModelUpdateIntervalHours: 24,
      },
      alerting: {
        immediateAlertThreshold: 'high',
        burstDetectionThreshold: 10,
        cascadeDetectionEnabled: true,
        notificationChannels: ['console', 'database'],
      },
      automation: {
        autoClassificationEnabled: true,
        autoAssignmentEnabled: false,
        autoResolutionEnabled: false,
        learningModeEnabled: true,
      },
      ...config,
    };

    this.startAutomation();
  }

  /**
   * 🚨 오류 수집 및 즉시 분석
   */
  async trackError(error: {
    serverId: MCPServerName;
    message: string;
    stack?: string;
    code?: string | number;
    context?: Partial<ErrorDetails['context']>;
    systemState?: Partial<ErrorDetails['systemState']>;
  }): Promise<ErrorDetails> {
    const errorId = this.generateErrorId();
    const timestamp = Date.now();

    // 기본 오류 정보 구성
    const errorDetails: ErrorDetails = {
      id: errorId,
      timestamp,
      serverId: error.serverId,
      category: await this.classifyError(error.message, error.stack),
      severity: await this.assessSeverity(
        error.message,
        error.stack,
        error.serverId
      ),
      message: error.message,
      stack: error.stack,
      code: error.code,

      context: {
        requestId: this.generateRequestId(),
        ...error.context,
      },

      systemState: {
        memoryUsage: 0,
        cpuUsage: 0,
        diskUsage: 0,
        networkLatency: 0,
        activeConnections: 0,
        ...error.systemState,
      },

      metrics: await this.collectErrorMetrics(error.serverId),
      analysis: await this.performInitialAnalysis(error, timestamp),

      status: 'new',
    };

    // 즉시 저장 및 분석
    await Promise.all([
      this.storeError(errorDetails),
      this.updateErrorCounters(error.serverId),
      this.checkForAlerts(errorDetails),
      this.updateRecentErrors(error.serverId, errorDetails),
    ]);

    console.log(
      `🚨 [ErrorTracker] Error tracked: ${errorId} (${errorDetails.severity})`
    );

    return errorDetails;
  }

  /**
   * 📊 오류 패턴 분석
   */
  async analyzeErrorPatterns(
    serverId?: MCPServerName,
    timeWindow: '1h' | '6h' | '24h' | '7d' = '24h'
  ): Promise<ErrorPattern[]> {
    const cacheKey = `error_patterns:${serverId || 'all'}:${timeWindow}`;

    // 캐시된 패턴 확인
    const cached = await this.redis.get<ErrorPattern[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const windowMs = this.parseTimeWindow(timeWindow);
    const cutoff = Date.now() - windowMs;

    // 오류 데이터 조회
    const errors = await this.getErrorsInTimeWindow(serverId, cutoff);

    if (errors.length < this.config.analysis.patternDetectionMinSamples) {
      return [];
    }

    // 패턴 감지 알고리즘 실행
    const patterns = await this.detectPatterns(errors);

    // 결과 캐싱 (15분)
    await this.redis.setex(cacheKey, 900, patterns);

    return patterns;
  }

  /**
   * 🔍 근본 원인 분석
   */
  async performRootCauseAnalysis(errorId: string): Promise<{
    rootCause: string;
    contributingFactors: Array<{
      factor: string;
      impact: number; // 0-100
      evidence: string[];
    }>;
    timeline: Array<{
      timestamp: number;
      event: string;
      type: 'error' | 'metric' | 'system' | 'user';
    }>;
    recommendations: Array<{
      action: string;
      priority: 'high' | 'medium' | 'low';
      effort: 'low' | 'medium' | 'high';
      impact: 'low' | 'medium' | 'high';
    }>;
  }> {
    const error = await this.getErrorById(errorId);
    if (!error) {
      throw new Error(`Error not found: ${errorId}`);
    }

    // 1. 시간축 이벤트 수집
    const timeline = await this.buildEventTimeline(error);

    // 2. 상관관계 분석
    const correlations = await this.findCorrelations(error, timeline);

    // 3. 시스템 상태 분석
    const systemAnalysis = await this.analyzeSystemState(error);

    // 4. 근본 원인 추론
    const rootCause = await this.inferRootCause(
      error,
      correlations,
      systemAnalysis
    );

    // 5. 기여 요인 식별
    const contributingFactors = await this.identifyContributingFactors(
      error,
      correlations,
      systemAnalysis
    );

    // 6. 권장사항 생성
    const recommendations = await this.generateRecommendations(
      rootCause,
      contributingFactors
    );

    return {
      rootCause,
      contributingFactors,
      timeline,
      recommendations,
    };
  }

  /**
   * 📈 오류 대시보드 데이터
   */
  async getDashboardData(timeWindow: '1h' | '6h' | '24h' = '24h'): Promise<{
    overview: {
      totalErrors: number;
      criticalErrors: number;
      newErrorsLast24h: number;
      resolvedErrorsLast24h: number;
      averageResolutionTime: number;
      currentErrorRate: number;
    };
    breakdown: {
      byCategory: Array<{
        category: ErrorCategory;
        count: number;
        percentage: number;
      }>;
      bySeverity: Array<{
        severity: ErrorSeverity;
        count: number;
        percentage: number;
      }>;
      byServer: Array<{
        serverId: MCPServerName;
        count: number;
        percentage: number;
      }>;
    };
    trends: Array<{
      timestamp: number;
      totalErrors: number;
      criticalErrors: number;
      errorRate: number;
    }>;
    topPatterns: ErrorPattern[];
    recentAlerts: Array<{
      timestamp: number;
      serverId: MCPServerName;
      severity: ErrorSeverity;
      message: string;
      status: string;
    }>;
    recommendations: Array<{
      type: 'immediate' | 'short-term' | 'long-term';
      priority: 'high' | 'medium' | 'low';
      title: string;
      description: string;
      impact: string;
    }>;
  }> {
    const windowMs = this.parseTimeWindow(timeWindow);
    const cutoff = Date.now() - windowMs;

    // 병렬로 데이터 수집
    const [errors, patterns, alerts, trends] = await Promise.all([
      this.getErrorsInTimeWindow(undefined, cutoff),
      this.analyzeErrorPatterns(undefined, timeWindow),
      this.getRecentAlerts(windowMs),
      this.getErrorTrends(windowMs),
    ]);

    // 개요 통계 계산
    const overview = {
      totalErrors: errors.length,
      criticalErrors: errors.filter((e) => e.severity === 'critical').length,
      newErrorsLast24h: errors.filter(
        (e) => e.timestamp >= Date.now() - 24 * 60 * 60 * 1000
      ).length,
      resolvedErrorsLast24h: errors.filter(
        (e) =>
          e.status === 'resolved' &&
          (e.resolvedAt || 0) >= Date.now() - 24 * 60 * 60 * 1000
      ).length,
      averageResolutionTime: this.calculateAverageResolutionTime(errors),
      currentErrorRate: this.calculateCurrentErrorRate(),
    };

    // 분류별 분석
    const breakdown = {
      byCategory: this.groupErrorsByCategory(errors),
      bySeverity: this.groupErrorsBySeverity(errors),
      byServer: this.groupErrorsByServer(errors),
    };

    // 상위 패턴 필터링
    const topPatterns = patterns
      .sort((a, b) => b.impact.businessImpact - a.impact.businessImpact)
      .slice(0, 5);

    // 권장사항 생성
    const recommendations = await this.generateDashboardRecommendations(
      errors,
      patterns,
      overview
    );

    return {
      overview,
      breakdown,
      trends,
      topPatterns,
      recentAlerts: alerts,
      recommendations,
    };
  }

  /**
   * 🎯 예측적 오류 방지
   */
  async predictPotentialErrors(
    serverId: MCPServerName,
    lookAheadHours: number = 24
  ): Promise<
    Array<{
      category: ErrorCategory;
      probability: number; // 0-100
      expectedTime: number; // timestamp
      severity: ErrorSeverity;
      preventionActions: string[];
      confidence: number; // 0-100
    }>
  > {
    // 현재 시스템 상태 분석
    const currentState = await this.getCurrentSystemState(serverId);

    // 히스토리 패턴 분석
    const historicalPatterns = await this.analyzeHistoricalPatterns(serverId);

    // 트렌드 분석
    const trends = await this.analyzeTrends(serverId, lookAheadHours);

    // ML 기반 예측 (간단한 규칙 기반으로 시작)
    const predictions = await this.generatePredictions(
      currentState,
      historicalPatterns,
      trends,
      lookAheadHours
    );

    return predictions.sort((a, b) => b.probability - a.probability);
  }

  /**
   * 🔧 자동 복구 제안
   */
  async suggestAutoRecovery(errorId: string): Promise<{
    applicable: boolean;
    confidence: number; // 0-100
    actions: Array<{
      type: 'restart' | 'scale' | 'fallback' | 'cache-clear' | 'config-update';
      description: string;
      risk: 'low' | 'medium' | 'high';
      estimatedTime: number; // minutes
      successProbability: number; // 0-100
    }>;
    prerequisites: string[];
    rollbackPlan: string[];
  }> {
    const error = await this.getErrorById(errorId);
    if (!error) {
      throw new Error(`Error not found: ${errorId}`);
    }

    // 자동 복구 가능성 평가
    const applicability = await this.evaluateAutoRecoveryApplicability(error);

    if (!applicability.applicable) {
      return {
        applicable: false,
        confidence: 0,
        actions: [],
        prerequisites: [],
        rollbackPlan: [],
      };
    }

    // 복구 액션 생성
    const actions = await this.generateRecoveryActions(error);

    // 전제 조건 및 롤백 계획
    const prerequisites = await this.identifyPrerequisites(error, actions);
    const rollbackPlan = await this.createRollbackPlan(actions);

    return {
      applicable: true,
      confidence: applicability.confidence,
      actions,
      prerequisites,
      rollbackPlan,
    };
  }

  // === Private Helper Methods ===

  private startAutomation(): void {
    // 패턴 분석 (5분마다)
    this.analysisTimer = setInterval(
      async () => {
        try {
          await this.performScheduledAnalysis();
        } catch (error) {
          console.error('❌ [ErrorTracker] Scheduled analysis failed:', error);
        }
      },
      5 * 60 * 1000
    );

    // 정리 작업 (1시간마다)
    this.cleanupTimer = setInterval(
      async () => {
        try {
          await this.performCleanup();
        } catch (error) {
          console.error('❌ [ErrorTracker] Cleanup failed:', error);
        }
      },
      60 * 60 * 1000
    );

    // 패턴 업데이트 (24시간마다)
    this.patternUpdateTimer = setInterval(
      async () => {
        try {
          await this.updatePatterns();
        } catch (error) {
          console.error('❌ [ErrorTracker] Pattern update failed:', error);
        }
      },
      24 * 60 * 60 * 1000
    );

    console.log('🤖 [ErrorTracker] Automation started');
  }

  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async classifyError(
    message: string,
    stack?: string
  ): Promise<ErrorCategory> {
    if (!this.config.automation.autoClassificationEnabled) {
      return 'unknown';
    }

    const text = `${message} ${stack || ''}`.toLowerCase();

    // 규칙 기반 분류
    if (text.includes('connection') || text.includes('connect'))
      return 'connection';
    if (text.includes('timeout') || text.includes('timed out'))
      return 'timeout';
    if (text.includes('unauthorized') || text.includes('authentication'))
      return 'authentication';
    if (text.includes('forbidden') || text.includes('permission'))
      return 'authorization';
    if (text.includes('validation') || text.includes('invalid'))
      return 'validation';
    if (
      text.includes('database') ||
      text.includes('sql') ||
      text.includes('query')
    )
      return 'database';
    if (text.includes('redis') || text.includes('cache')) return 'cache';
    if (text.includes('network') || text.includes('socket')) return 'network';
    if (text.includes('memory') || text.includes('resource')) return 'resource';
    if (text.includes('external') || text.includes('api')) return 'external';
    if (text.includes('system') || text.includes('server')) return 'system';

    return 'logic';
  }

  private async assessSeverity(
    message: string,
    stack?: string,
    serverId?: MCPServerName
  ): Promise<ErrorSeverity> {
    const text = `${message} ${stack || ''}`.toLowerCase();

    // 키워드 기반 심각도 평가
    if (
      text.includes('critical') ||
      text.includes('fatal') ||
      text.includes('panic')
    ) {
      return 'critical';
    }

    if (
      text.includes('error') ||
      text.includes('exception') ||
      text.includes('failed')
    ) {
      return 'high';
    }

    if (text.includes('warning') || text.includes('deprecated')) {
      return 'medium';
    }

    // 서버별 컨텍스트 고려
    if (serverId) {
      const recentErrors = this.errorRateCounters.get(serverId) || 0;
      if (recentErrors > 10) {
        return 'high'; // 연속 오류 발생 시 심각도 상향
      }
    }

    return 'low';
  }

  private async collectErrorMetrics(
    serverId: MCPServerName
  ): Promise<ErrorDetails['metrics']> {
    const recentErrors = this.recentErrors.get(serverId) || [];
    const last24h = recentErrors.filter(
      (e) => e.timestamp >= Date.now() - 24 * 60 * 60 * 1000
    );

    return {
      responseTime: 0, // 실제 구현에서는 성능 모니터에서 가져옴
      throughput: 0,
      errorRate: 0,
      consecutiveErrors: this.errorRateCounters.get(serverId) || 0,
      similarErrorsLast24h: last24h.length,
    };
  }

  private async performInitialAnalysis(
    error: any,
    timestamp: number
  ): Promise<ErrorDetails['analysis']> {
    return {
      impact: 50, // 기본값, 실제로는 복잡한 계산
      likelihood: 30,
      correlatedErrors: [],
      suggestedActions: [
        '로그 상세 분석',
        '시스템 리소스 확인',
        '관련 서비스 상태 점검',
      ],
    };
  }

  private async storeError(error: ErrorDetails): Promise<void> {
    try {
      // Redis에 캐싱
      const cacheKey = `error:${error.serverId}:${error.id}`;
      await this.redis.setex(cacheKey, 24 * 60 * 60, error); // 24시간

      // Supabase에 저장
      await this.supabase.from('error_tracking').insert({
        id: error.id,
        server_id: error.serverId,
        timestamp: new Date(error.timestamp).toISOString(),
        category: error.category,
        severity: error.severity,
        message: error.message,
        stack: error.stack,
        code: error.code?.toString(),
        context: error.context,
        system_state: error.systemState,
        metrics: error.metrics,
        analysis: error.analysis,
        status: error.status,
        created_at: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Failed to store error:', err);
    }
  }

  private async updateErrorCounters(serverId: MCPServerName): Promise<void> {
    const current = this.errorRateCounters.get(serverId) || 0;
    this.errorRateCounters.set(serverId, current + 1);

    // 1분 후 카운터 감소
    setTimeout(() => {
      const updated = this.errorRateCounters.get(serverId) || 0;
      this.errorRateCounters.set(serverId, Math.max(0, updated - 1));
    }, 60 * 1000);
  }

  private async checkForAlerts(error: ErrorDetails): Promise<void> {
    const shouldAlert =
      error.severity === 'critical' ||
      (error.severity === 'high' && error.metrics.consecutiveErrors >= 5) ||
      this.detectErrorBurst(error.serverId);

    if (shouldAlert) {
      await this.sendAlert(error);
    }
  }

  private detectErrorBurst(serverId: MCPServerName): boolean {
    const currentCount = this.errorRateCounters.get(serverId) || 0;
    const threshold = this.config.alerting.burstDetectionThreshold;

    if (currentCount >= threshold) {
      const lastBurst = this.lastErrorBurst.get(serverId) || 0;
      const timeSinceLastBurst = Date.now() - lastBurst;

      // 5분 내에 다시 버스트가 발생하면 알림
      if (timeSinceLastBurst < 5 * 60 * 1000) {
        return false;
      }

      this.lastErrorBurst.set(serverId, Date.now());
      return true;
    }

    return false;
  }

  private updateRecentErrors(
    serverId: MCPServerName,
    error: ErrorDetails
  ): void {
    if (!this.recentErrors.has(serverId)) {
      this.recentErrors.set(serverId, []);
    }

    const recent = this.recentErrors.get(serverId)!;
    recent.push(error);

    // 최근 100개만 유지
    if (recent.length > 100) {
      recent.splice(0, recent.length - 100);
    }
  }

  private parseTimeWindow(timeWindow: string): number {
    const windows = {
      '1h': 60 * 60 * 1000,
      '6h': 6 * 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
    };
    return windows[timeWindow as keyof typeof windows] || windows['24h'];
  }

  private async getErrorsInTimeWindow(
    serverId: MCPServerName | undefined,
    cutoff: number
  ): Promise<ErrorDetails[]> {
    try {
      let query = this.supabase
        .from('error_tracking')
        .select('*')
        .gte('timestamp', new Date(cutoff).toISOString())
        .order('timestamp', { ascending: false });

      if (serverId) {
        query = query.eq('server_id', serverId);
      }

      const { data, error } = await query.limit(1000);

      if (error) throw error;

      return (data || []).map(this.mapDatabaseToErrorDetails);
    } catch (error) {
      console.error('Failed to get errors from database:', error);
      return [];
    }
  }

  private async detectPatterns(
    errors: ErrorDetails[]
  ): Promise<ErrorPattern[]> {
    const patterns: ErrorPattern[] = [];

    // 카테고리별 그룹화
    const byCategory = this.groupBy(errors, 'category');

    for (const [category, categoryErrors] of Object.entries(byCategory)) {
      if (
        categoryErrors.length < this.config.analysis.patternDetectionMinSamples
      ) {
        continue;
      }

      // 패턴 특성 분석
      const pattern = await this.analyzeErrorGroup(
        category as ErrorCategory,
        categoryErrors
      );

      if (pattern.confidence >= 70) {
        patterns.push(pattern);
      }
    }

    return patterns;
  }

  private async analyzeErrorGroup(
    category: ErrorCategory,
    errors: ErrorDetails[]
  ): Promise<ErrorPattern> {
    const now = Date.now();
    const sortedByTime = errors.sort((a, b) => a.timestamp - b.timestamp);

    // 빈도 분석
    const timeSpan =
      sortedByTime[sortedByTime.length - 1].timestamp -
      sortedByTime[0].timestamp;
    const frequency = this.classifyFrequency(errors.length, timeSpan);

    // 타이밍 패턴 분석
    const timing = this.analyzeTiming(sortedByTime);

    // 범위 분석
    const uniqueServers = new Set(errors.map((e) => e.serverId)).size;
    const scope =
      uniqueServers === 1
        ? 'single-server'
        : uniqueServers <= 3
          ? 'multi-server'
          : 'system-wide';

    // 영향 분석
    const impact = this.calculatePatternImpact(errors);

    return {
      id: `pattern_${category}_${now}`,
      name: `${category} 오류 패턴`,
      category,
      confidence: 80,

      characteristics: {
        frequency,
        timing,
        scope,
        duration: 'intermittent',
      },

      conditions: {
        timeRanges: [],
        dependencies: [],
      },

      impact,

      prediction: {
        preventionActions: [
          `${category} 관련 모니터링 강화`,
          '예방적 점검 수행',
        ],
        mitigationStrategies: ['자동 복구 메커니즘 구현', '알림 임계값 조정'],
      },

      statistics: {
        totalOccurrences: errors.length,
        firstSeen: sortedByTime[0].timestamp,
        lastSeen: sortedByTime[sortedByTime.length - 1].timestamp,
        averageResolutionTime: this.calculateAverageResolutionTime(errors),
        recurrenceRate: this.calculateRecurrenceRate(errors),
      },
    };
  }

  private classifyFrequency(
    count: number,
    timeSpanMs: number
  ): ErrorPattern['characteristics']['frequency'] {
    const perHour = (count / timeSpanMs) * (60 * 60 * 1000);

    if (perHour < 0.1) return 'rare';
    if (perHour < 1) return 'occasional';
    if (perHour < 10) return 'frequent';
    return 'constant';
  }

  private analyzeTiming(
    errors: ErrorDetails[]
  ): ErrorPattern['characteristics']['timing'] {
    if (errors.length < 3) return 'random';

    const intervals = [];
    for (let i = 1; i < errors.length; i++) {
      intervals.push(errors[i].timestamp - errors[i - 1].timestamp);
    }

    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const variance =
      intervals.reduce(
        (acc, interval) => acc + Math.pow(interval - avgInterval, 2),
        0
      ) / intervals.length;

    // 분산이 작으면 주기적, 크면 무작위
    if (variance < avgInterval * 0.2) return 'periodic';
    if (Math.max(...intervals) > avgInterval * 3) return 'burst';

    return 'random';
  }

  private calculatePatternImpact(
    errors: ErrorDetails[]
  ): ErrorPattern['impact'] {
    const severityWeights = { low: 1, medium: 2, high: 3, critical: 4 };
    const totalWeight = errors.reduce(
      (acc, e) => acc + severityWeights[e.severity],
      0
    );
    const avgSeverity = totalWeight / errors.length;

    const criticalCount = errors.filter(
      (e) => e.severity === 'critical'
    ).length;
    const severity =
      criticalCount > 0
        ? 'critical'
        : avgSeverity >= 3
          ? 'high'
          : avgSeverity >= 2
            ? 'medium'
            : 'low';

    return {
      severity,
      affectedUsers: Math.min(100, errors.length * 2), // 추정
      businessImpact: Math.min(100, avgSeverity * 25),
      financialImpact: errors.length * 0.01, // $0.01 per error 추정
    };
  }

  private calculateAverageResolutionTime(errors: ErrorDetails[]): number {
    const resolved = errors.filter(
      (e) => e.status === 'resolved' && e.resolvedAt
    );
    if (resolved.length === 0) return 0;

    const times = resolved.map(
      (e) => (e.resolvedAt! - e.timestamp) / 1000 / 60
    ); // minutes
    return Math.round(times.reduce((a, b) => a + b, 0) / times.length);
  }

  private calculateRecurrenceRate(errors: ErrorDetails[]): number {
    // 간단한 재발률 계산 (실제로는 더 복잡한 로직 필요)
    return Math.min(100, (errors.length / 30) * 100); // 30일 기준 백분율
  }

  private calculateCurrentErrorRate(): number {
    const total = Array.from(this.errorRateCounters.values()).reduce(
      (a, b) => a + b,
      0
    );
    return total; // 분당 오류 수
  }

  private groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
    return array.reduce(
      (groups, item) => {
        const value = String(item[key]);
        if (!groups[value]) {
          groups[value] = [];
        }
        groups[value].push(item);
        return groups;
      },
      {} as Record<string, T[]>
    );
  }

  private groupErrorsByCategory(
    errors: ErrorDetails[]
  ): Array<{ category: ErrorCategory; count: number; percentage: number }> {
    const groups = this.groupBy(errors, 'category');
    const total = errors.length;

    return Object.entries(groups)
      .map(([category, categoryErrors]) => ({
        category: category as ErrorCategory,
        count: categoryErrors.length,
        percentage: Math.round((categoryErrors.length / total) * 100),
      }))
      .sort((a, b) => b.count - a.count);
  }

  private groupErrorsBySeverity(
    errors: ErrorDetails[]
  ): Array<{ severity: ErrorSeverity; count: number; percentage: number }> {
    const groups = this.groupBy(errors, 'severity');
    const total = errors.length;

    return Object.entries(groups)
      .map(([severity, severityErrors]) => ({
        severity: severity as ErrorSeverity,
        count: severityErrors.length,
        percentage: Math.round((severityErrors.length / total) * 100),
      }))
      .sort((a, b) => b.count - a.count);
  }

  private groupErrorsByServer(
    errors: ErrorDetails[]
  ): Array<{ serverId: MCPServerName; count: number; percentage: number }> {
    const groups = this.groupBy(errors, 'serverId');
    const total = errors.length;

    return Object.entries(groups)
      .map(([serverId, serverErrors]) => ({
        serverId: serverId as MCPServerName,
        count: serverErrors.length,
        percentage: Math.round((serverErrors.length / total) * 100),
      }))
      .sort((a, b) => b.count - a.count);
  }

  private mapDatabaseToErrorDetails(dbRecord: any): ErrorDetails {
    return {
      id: dbRecord.id,
      timestamp: new Date(dbRecord.timestamp).getTime(),
      serverId: dbRecord.server_id,
      category: dbRecord.category,
      severity: dbRecord.severity,
      message: dbRecord.message,
      stack: dbRecord.stack,
      code: dbRecord.code,
      context: dbRecord.context || {},
      systemState: dbRecord.system_state || {},
      metrics: dbRecord.metrics || {},
      analysis: dbRecord.analysis || {
        impact: 0,
        likelihood: 0,
        correlatedErrors: [],
        suggestedActions: [],
      },
      status: dbRecord.status,
      assignedTo: dbRecord.assigned_to,
      resolvedAt: dbRecord.resolved_at
        ? new Date(dbRecord.resolved_at).getTime()
        : undefined,
      resolution: dbRecord.resolution,
    };
  }

  // 추가 메서드들은 실제 구현에서 완성...
  private async getErrorById(errorId: string): Promise<ErrorDetails | null> {
    // 구현 필요
    return null;
  }

  private async buildEventTimeline(error: ErrorDetails): Promise<any[]> {
    // 구현 필요
    return [];
  }

  private async findCorrelations(
    error: ErrorDetails,
    timeline: any[]
  ): Promise<any> {
    // 구현 필요
    return {};
  }

  private async analyzeSystemState(error: ErrorDetails): Promise<any> {
    // 구현 필요
    return {};
  }

  private async inferRootCause(
    error: ErrorDetails,
    correlations: any,
    systemAnalysis: any
  ): Promise<string> {
    // 구현 필요
    return '근본 원인 분석 중...';
  }

  private async identifyContributingFactors(
    error: ErrorDetails,
    correlations: any,
    systemAnalysis: any
  ): Promise<any[]> {
    // 구현 필요
    return [];
  }

  private async generateRecommendations(
    rootCause: string,
    contributingFactors: any[]
  ): Promise<any[]> {
    // 구현 필요
    return [];
  }

  private async getRecentAlerts(windowMs: number): Promise<any[]> {
    // 구현 필요
    return [];
  }

  private async getErrorTrends(windowMs: number): Promise<any[]> {
    // 구현 필요
    return [];
  }

  private async generateDashboardRecommendations(
    errors: ErrorDetails[],
    patterns: ErrorPattern[],
    overview: any
  ): Promise<any[]> {
    // 구현 필요
    return [];
  }

  private async performScheduledAnalysis(): Promise<void> {
    // 구현 필요
  }

  private async performCleanup(): Promise<void> {
    // 구현 필요
  }

  private async updatePatterns(): Promise<void> {
    // 구현 필요
  }

  private async sendAlert(error: ErrorDetails): Promise<void> {
    console.log(
      `🚨 [ErrorTracker] ALERT: ${error.severity} error in ${error.serverId}: ${error.message}`
    );
  }

  // 예측 관련 메서드들
  private async getCurrentSystemState(serverId: MCPServerName): Promise<any> {
    return {};
  }

  private async analyzeHistoricalPatterns(
    serverId: MCPServerName
  ): Promise<any> {
    return {};
  }

  private async analyzeTrends(
    serverId: MCPServerName,
    lookAheadHours: number
  ): Promise<any> {
    return {};
  }

  private async generatePredictions(
    currentState: any,
    patterns: any,
    trends: any,
    lookAheadHours: number
  ): Promise<any[]> {
    return [];
  }

  // 자동 복구 관련 메서드들
  private async evaluateAutoRecoveryApplicability(
    error: ErrorDetails
  ): Promise<{ applicable: boolean; confidence: number }> {
    return { applicable: false, confidence: 0 };
  }

  private async generateRecoveryActions(error: ErrorDetails): Promise<any[]> {
    return [];
  }

  private async identifyPrerequisites(
    error: ErrorDetails,
    actions: any[]
  ): Promise<string[]> {
    return [];
  }

  private async createRollbackPlan(actions: any[]): Promise<string[]> {
    return [];
  }

  /**
   * 🧹 리소스 정리
   */
  async cleanup(): Promise<void> {
    if (this.analysisTimer) clearInterval(this.analysisTimer);
    if (this.cleanupTimer) clearInterval(this.cleanupTimer);
    if (this.patternUpdateTimer) clearInterval(this.patternUpdateTimer);

    this.recentErrors.clear();
    this.errorPatterns.clear();
    this.errorRateCounters.clear();
    this.lastErrorBurst.clear();

    console.log('✅ [ErrorTracker] Cleanup completed');
  }
}

// 팩토리 함수
export function createErrorTracker(
  redis: Redis,
  supabase: SupabaseClient,
  config?: Partial<ErrorTrackerConfig>
): MCPErrorTracker {
  return new MCPErrorTracker(redis, supabase, config);
}

// 타입 익스포트
export type { ErrorTrackerConfig };
