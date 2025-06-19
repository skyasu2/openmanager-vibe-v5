/**
 * 📊 Universal AI Logger v2.0
 *
 * Multi-AI 시스템의 모든 상호작용을 포괄적으로 로깅하는 통합 시스템
 *
 * Features:
 * - Multi-AI 사고 과정 로깅
 * - 사용자 피드백 수집 및 연동
 * - 실시간 성능 메트릭 추적
 * - 학습 데이터 자동 생성
 * - 시각화를 위한 데이터 제공
 */

import { aiLogger, LogLevel, LogCategory } from './AILogger';
import { EventEmitter } from 'events';

// =============================================================================
// 🎯 로깅 인터페이스들
// =============================================================================

export interface AIInteractionEvent {
  sessionId: string;
  userId?: string;
  query: string;
  processedQuery?: string;
  detectedIntent?: any;
  complexityScore?: number;
  engines: AIEngineEvent[];
  fusionStrategy?: string;
  weights?: number[];
  consensusScore?: number;
  finalConfidence?: number;
  response: {
    primary: string;
    supporting?: string[];
    qualityScore?: number;
  };
  processingTime?: number;
  timestamp?: string;
}

export interface AIEngineEvent {
  id: string;
  type: string;
  thinkingSteps: ThinkingStep[];
  processingTime: number;
  result: any;
  confidence: number;
  contribution: number;
  status: 'success' | 'failed' | 'timeout' | 'error';
  error?: any;
}

export interface ThinkingStep {
  step: string;
  timestamp: string;
  thinking: string;
  progress: number;
  confidence: number;
  status: 'thinking' | 'processing' | 'completed';
}

export interface UserFeedback {
  satisfaction?: number; // 1-5 별점
  useful?: boolean;
  accurate?: boolean;
  completeness?: number; // 1-5
  clarity?: number; // 1-5
  comments?: string;
  suggestions?: string;
  timestamp: string;
}

export interface AIInteractionLog {
  // 기본 정보
  timestamp: string;
  sessionId: string;
  userId?: string;

  // 쿼리 정보
  query: {
    original: string;
    processed?: string;
    intent?: any;
    complexity: number;
  };

  // AI 엔진별 세부 로깅
  engines: {
    engineId: string;
    engineType: string;

    // 사고 과정 로깅
    thinkingSteps: ThinkingStep[];
    processingTime: number;

    // 결과 로깅
    result: any;
    confidence: number;
    contribution: number;

    // 성공/실패 로깅
    status: 'success' | 'failed' | 'timeout' | 'error';
    errorDetails?: any;
  }[];

  // 융합 과정 로깅
  fusion: {
    strategy: string;
    weights: number[];
    consensusScore: number;
    finalConfidence: number;
  };

  // 최종 결과
  response: {
    primary: string;
    supporting: string[];
    quality: number;
  };

  // 사용자 피드백 시스템
  feedback?: UserFeedback;

  // 성능 메트릭
  metrics: {
    totalProcessingTime: number;
    engineCount: number;
    successRate: number;
    tier: string;
  };
}

// =============================================================================
// 📊 Universal AI Logger
// =============================================================================

export class UniversalAILogger extends EventEmitter {
  private static instance: UniversalAILogger | null = null;
  private activeLogs: Map<string, Partial<AIInteractionLog>> = new Map();
  private completedLogs: AIInteractionLog[] = [];
  private maxLogRetention = 1000; // 최대 1000개 로그 보관

  private constructor() {
    super();
    this.startLogCleanup();
  }

  public static getInstance(): UniversalAILogger {
    if (!UniversalAILogger.instance) {
      UniversalAILogger.instance = new UniversalAILogger();
    }
    return UniversalAILogger.instance;
  }

  /**
   * 🚀 AI 상호작용 로깅 시작
   */
  async startInteraction(
    sessionId: string,
    query: string,
    userId?: string
  ): Promise<void> {
    const logEntry: Partial<AIInteractionLog> = {
      timestamp: new Date().toISOString(),
      sessionId,
      userId,
      query: {
        original: query,
        complexity: this.calculateComplexity(query),
      },
      engines: [],
      metrics: {
        totalProcessingTime: 0,
        engineCount: 0,
        successRate: 0,
        tier: 'unknown',
      },
    };

    this.activeLogs.set(sessionId, logEntry);

    // 실시간 이벤트 발송
    this.emit('interaction_started', {
      sessionId,
      query,
      timestamp: logEntry.timestamp,
    });

    aiLogger.info(
      LogCategory.AI_ENGINE,
      `새로운 AI 상호작용 시작: ${query.substring(0, 100)}...`,
      { sessionId, userId }
    );
  }

  /**
   * 💭 AI 엔진 사고 과정 로깅
   */
  logThinkingStep(data: {
    sessionId: string;
    engineId: string;
    step: ThinkingStep;
  }): void {
    const logEntry = this.activeLogs.get(data.sessionId);
    if (!logEntry) return;

    // 해당 엔진 찾기 또는 생성
    let engineLog = logEntry.engines?.find(e => e.engineId === data.engineId);
    if (!engineLog) {
      engineLog = {
        engineId: data.engineId,
        engineType: this.getEngineType(data.engineId),
        thinkingSteps: [],
        processingTime: 0,
        result: null,
        confidence: 0,
        contribution: 0,
        status: 'success',
      };
      logEntry.engines = logEntry.engines || [];
      logEntry.engines.push(engineLog);
    }

    // 사고 과정 추가
    engineLog.thinkingSteps.push(data.step);

    // 실시간 이벤트 발송
    this.emit('thinking_logged', {
      sessionId: data.sessionId,
      engineId: data.engineId,
      step: data.step,
    });

    // 상세 로깅
    aiLogger.debug(
      LogCategory.AI_ENGINE,
      `[${data.engineId}] 사고 과정 로깅: ${data.step.thinking}`,
      { sessionId: data.sessionId, progress: data.step.progress }
    );
  }

  /**
   * ✅ AI 엔진 결과 로깅
   */
  logEngineResult(data: {
    sessionId: string;
    engineId: string;
    result: any;
    confidence: number;
    processingTime: number;
    status: 'success' | 'failed' | 'timeout' | 'error';
    error?: any;
  }): void {
    const logEntry = this.activeLogs.get(data.sessionId);
    if (!logEntry) return;

    const engineLog = logEntry.engines?.find(e => e.engineId === data.engineId);
    if (!engineLog) return;

    // 결과 업데이트
    engineLog.result = data.result;
    engineLog.confidence = data.confidence;
    engineLog.processingTime = data.processingTime;
    engineLog.status = data.status;
    if (data.error) {
      engineLog.errorDetails = data.error;
    }

    // 실시간 이벤트 발송
    this.emit('engine_completed', {
      sessionId: data.sessionId,
      engineId: data.engineId,
      status: data.status,
      confidence: data.confidence,
    });

    aiLogger.info(
      LogCategory.AI_ENGINE,
      `[${data.engineId}] 엔진 처리 완료 (${data.status})`,
      {
        sessionId: data.sessionId,
        confidence: data.confidence,
        processingTime: data.processingTime,
      }
    );
  }

  /**
   * 🔄 융합 과정 로깅
   */
  logFusionProcess(data: {
    sessionId: string;
    strategy: string;
    weights: number[];
    consensusScore: number;
    finalConfidence: number;
  }): void {
    const logEntry = this.activeLogs.get(data.sessionId);
    if (!logEntry) return;

    logEntry.fusion = {
      strategy: data.strategy,
      weights: data.weights,
      consensusScore: data.consensusScore,
      finalConfidence: data.finalConfidence,
    };

    this.emit('fusion_logged', {
      sessionId: data.sessionId,
      fusion: logEntry.fusion,
    });

    aiLogger.info(
      LogCategory.AI_ENGINE,
      `융합 과정 완료: ${data.strategy} (합의도: ${data.consensusScore})`,
      { sessionId: data.sessionId }
    );
  }

  /**
   * 🏁 AI 상호작용 완료
   */
  async completeInteraction(data: {
    sessionId: string;
    response: {
      primary: string;
      supporting?: string[];
      qualityScore?: number;
    };
    processingTime: number;
    tier: string;
  }): Promise<AIInteractionLog> {
    const logEntry = this.activeLogs.get(data.sessionId);
    if (!logEntry) {
      throw new Error(`Session ${data.sessionId} not found`);
    }

    // 최종 로그 완성
    const completedLog: AIInteractionLog = {
      ...logEntry,
      response: {
        primary: data.response.primary,
        supporting: data.response.supporting || [],
        quality: data.response.qualityScore || 0,
      },
      metrics: {
        totalProcessingTime: data.processingTime,
        engineCount: logEntry.engines?.length || 0,
        successRate: this.calculateSuccessRate(logEntry.engines || []),
        tier: data.tier,
      },
    } as AIInteractionLog;

    // 활성 로그에서 제거하고 완료 로그에 추가
    this.activeLogs.delete(data.sessionId);
    this.completedLogs.push(completedLog);

    // 로그 수 제한
    if (this.completedLogs.length > this.maxLogRetention) {
      this.completedLogs.splice(
        0,
        this.completedLogs.length - this.maxLogRetention
      );
    }

    // 실시간 이벤트 발송
    this.emit('interaction_completed', {
      sessionId: data.sessionId,
      log: completedLog,
    });

    // 학습 데이터 큐에 추가
    this.queueForLearning(completedLog);

    aiLogger.info(LogCategory.AI_ENGINE, `AI 상호작용 완료 로깅`, {
      sessionId: data.sessionId,
      processingTime: data.processingTime,
      tier: data.tier,
      quality: data.response.qualityScore,
    });

    return completedLog;
  }

  /**
   * 💬 사용자 피드백 업데이트
   */
  async updateFeedback(
    sessionId: string,
    feedback: UserFeedback
  ): Promise<void> {
    // 완료된 로그에서 찾기
    const logIndex = this.completedLogs.findIndex(
      log => log.sessionId === sessionId
    );
    if (logIndex === -1) return;

    this.completedLogs[logIndex].feedback = feedback;

    // 실시간 이벤트 발송
    this.emit('feedback_received', {
      sessionId,
      feedback,
    });

    // 학습 시스템에 피드백 전달
    await this.processFeedbackForLearning(sessionId, feedback);

    aiLogger.info(LogCategory.AI_ENGINE, `사용자 피드백 수신`, {
      sessionId,
      satisfaction: feedback.satisfaction,
      useful: feedback.useful,
    });
  }

  /**
   * 📊 실시간 통계 조회
   */
  getRealtimeStats() {
    const recentLogs = this.completedLogs.slice(-100); // 최근 100개

    return {
      // 활성 상호작용
      activeInteractions: this.activeLogs.size,

      // 총 로그 수
      totalLogs: this.completedLogs.length,

      // 최근 성능 지표
      recent: {
        averageProcessingTime: this.calculateAverageProcessingTime(recentLogs),
        averageQuality: this.calculateAverageQuality(recentLogs),
        successRate: this.calculateOverallSuccessRate(recentLogs),
        tierDistribution: this.calculateTierDistribution(recentLogs),
        feedbackStats: this.calculateFeedbackStats(recentLogs),
      },

      // 엔진별 통계
      engineStats: this.calculateEngineStats(recentLogs),

      // 시간대별 트렌드
      hourlyTrend: this.calculateHourlyTrend(recentLogs),
    };
  }

  /**
   * 📈 분석용 통계 데이터 가져오기
   */
  getAnalytics() {
    const stats = this.getRealtimeStats();

    return {
      ...stats,
      // 추가 분석 정보
      activeEngines: this.activeLogs.size,
      averageResponseTime: stats.recent.averageProcessingTime,
      currentQuality: stats.recent.averageQuality,
      successRate: stats.recent.successRate,
    };
  }

  /**
   * 🔍 로그 검색
   */
  searchLogs(criteria: {
    sessionId?: string;
    userId?: string;
    timeRange?: { start: Date; end: Date };
    tier?: string;
    minQuality?: number;
    hasError?: boolean;
    hasFeedback?: boolean;
  }): AIInteractionLog[] {
    return this.completedLogs.filter(log => {
      if (criteria.sessionId && log.sessionId !== criteria.sessionId)
        return false;
      if (criteria.userId && log.userId !== criteria.userId) return false;
      if (criteria.tier && log.metrics.tier !== criteria.tier) return false;
      if (criteria.minQuality && log.response.quality < criteria.minQuality)
        return false;
      if (criteria.hasError !== undefined) {
        const hasError = log.engines.some(
          e => e.status === 'error' || e.status === 'failed'
        );
        if (criteria.hasError !== hasError) return false;
      }
      if (criteria.hasFeedback !== undefined) {
        if (criteria.hasFeedback !== !!log.feedback) return false;
      }
      if (criteria.timeRange) {
        const logTime = new Date(log.timestamp);
        if (
          logTime < criteria.timeRange.start ||
          logTime > criteria.timeRange.end
        )
          return false;
      }

      return true;
    });
  }

  /**
   * 🔧 유틸리티 메서드들
   */
  private calculateComplexity(query: string): number {
    // 간단한 복잡도 계산 (실제로는 더 정교한 로직 필요)
    const length = query.length;
    const wordCount = query.split(' ').length;
    const hasQuestion = query.includes('?');
    const hasSpecialChars = /[^\w\s가-힣]/.test(query);

    let complexity = Math.min(length / 100, 1) * 0.3;
    complexity += Math.min(wordCount / 20, 1) * 0.3;
    complexity += hasQuestion ? 0.2 : 0;
    complexity += hasSpecialChars ? 0.2 : 0;

    return Math.round(complexity * 100) / 100;
  }

  private getEngineType(engineId: string): string {
    // 실제 엔진에서 전달된 타입 정보 사용 (미리 정의하지 않음)
    return engineId; // 단순히 engineId를 반환하거나, 실제 엔진에서 타입 정보를 받아옴
  }

  private calculateSuccessRate(engines: any[]): number {
    if (engines.length === 0) return 0;
    const successCount = engines.filter(e => e.status === 'success').length;
    return Math.round((successCount / engines.length) * 100) / 100;
  }

  private calculateAverageProcessingTime(logs: AIInteractionLog[]): number {
    if (logs.length === 0) return 0;
    const total = logs.reduce(
      (sum, log) => sum + log.metrics.totalProcessingTime,
      0
    );
    return Math.round(total / logs.length);
  }

  private calculateAverageQuality(logs: AIInteractionLog[]): number {
    if (logs.length === 0) return 0;
    const total = logs.reduce((sum, log) => sum + log.response.quality, 0);
    return Math.round((total / logs.length) * 100) / 100;
  }

  private calculateOverallSuccessRate(logs: AIInteractionLog[]): number {
    if (logs.length === 0) return 0;
    const total = logs.reduce((sum, log) => sum + log.metrics.successRate, 0);
    return Math.round((total / logs.length) * 100) / 100;
  }

  private calculateTierDistribution(logs: AIInteractionLog[]): {
    [tier: string]: number;
  } {
    const distribution: { [tier: string]: number } = {};
    logs.forEach(log => {
      distribution[log.metrics.tier] =
        (distribution[log.metrics.tier] || 0) + 1;
    });
    return distribution;
  }

  private calculateFeedbackStats(logs: AIInteractionLog[]): any {
    const logsWithFeedback = logs.filter(log => log.feedback);
    if (logsWithFeedback.length === 0) return null;

    const satisfactionSum = logsWithFeedback.reduce(
      (sum, log) => sum + (log.feedback?.satisfaction || 0),
      0
    );
    const usefulCount = logsWithFeedback.filter(
      log => log.feedback?.useful
    ).length;

    return {
      responseRate: Math.round((logsWithFeedback.length / logs.length) * 100),
      averageSatisfaction:
        Math.round((satisfactionSum / logsWithFeedback.length) * 100) / 100,
      usefulPercentage: Math.round(
        (usefulCount / logsWithFeedback.length) * 100
      ),
    };
  }

  private calculateEngineStats(logs: AIInteractionLog[]): any {
    const stats: { [engineId: string]: any } = {};

    logs.forEach(log => {
      log.engines.forEach(engine => {
        if (!stats[engine.engineId]) {
          stats[engine.engineId] = {
            usageCount: 0,
            totalProcessingTime: 0,
            averageConfidence: 0,
            successRate: 0,
            successCount: 0,
          };
        }

        const engineStats = stats[engine.engineId];
        engineStats.usageCount++;
        engineStats.totalProcessingTime += engine.processingTime;
        engineStats.averageConfidence += engine.confidence;
        if (engine.status === 'success') {
          engineStats.successCount++;
        }
      });
    });

    // 평균 계산
    Object.keys(stats).forEach(engineId => {
      const engineStats = stats[engineId];
      engineStats.averageProcessingTime = Math.round(
        engineStats.totalProcessingTime / engineStats.usageCount
      );
      engineStats.averageConfidence =
        Math.round(
          (engineStats.averageConfidence / engineStats.usageCount) * 100
        ) / 100;
      engineStats.successRate =
        Math.round((engineStats.successCount / engineStats.usageCount) * 100) /
        100;
    });

    return stats;
  }

  private calculateHourlyTrend(logs: AIInteractionLog[]): any[] {
    const hourlyData: { [hour: string]: number } = {};

    logs.forEach(log => {
      const hour = new Date(log.timestamp).getHours();
      const hourKey = `${hour.toString().padStart(2, '0')}:00`;
      hourlyData[hourKey] = (hourlyData[hourKey] || 0) + 1;
    });

    return Object.entries(hourlyData)
      .map(([hour, count]) => ({
        hour,
        count,
      }))
      .sort((a, b) => a.hour.localeCompare(b.hour));
  }

  private async queueForLearning(log: AIInteractionLog): Promise<void> {
    // 학습 데이터 큐에 추가하는 로직
    // 실제로는 별도의 학습 시스템과 연동
    this.emit('learning_data_queued', { log });
  }

  private async processFeedbackForLearning(
    sessionId: string,
    feedback: UserFeedback
  ): Promise<void> {
    // 피드백을 학습 시스템에 전달하는 로직
    this.emit('feedback_for_learning', { sessionId, feedback });
  }

  private startLogCleanup(): void {
    // 주기적으로 오래된 로그 정리 (24시간마다)
    setInterval(
      () => {
        const cutoffTime = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7일 전
        this.completedLogs = this.completedLogs.filter(
          log => new Date(log.timestamp) > cutoffTime
        );

        aiLogger.info(LogCategory.AI_ENGINE, '로그 정리 완료', {
          remainingLogs: this.completedLogs.length,
        });
      },
      24 * 60 * 60 * 1000
    );
  }
}

// 싱글톤 인스턴스 export
export const universalAILogger = UniversalAILogger.getInstance();
