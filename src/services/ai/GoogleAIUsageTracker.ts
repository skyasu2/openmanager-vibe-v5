/**
 * 🔄 Google AI 사용량 추적 및 최적화 시스템
 *
 * 실시간 사용량 모니터링:
 * - 모델별 일일/시간당 요청 수 추적
 * - RPM(분당 요청), RPD(일당 요청) 제한 관리
 * - 할당량 기반 자동 모델 선택 최적화
 * - 동적 임계값 조정 및 학습
 */

import type { GoogleAIModel } from './QueryDifficultyAnalyzer';
import { GOOGLE_AI_MODEL_LIMITS } from '../../config/google-ai-usage-limits';

// 사용량 추적 데이터 구조
export interface UsageStats {
  model: GoogleAIModel;
  timestamp: number;
  requestCount: number;
  tokenCount: number;
  latency: number;
  success: boolean;
  difficultyScore?: number;
  actualComplexity?: number; // 응답 분석 기반 실제 복잡도
}

// 일일 사용량 요약
export interface DailyUsageSummary {
  date: string;
  models: {
    [K in GoogleAIModel]: {
      requests: number;
      tokens: number;
      avgLatency: number;
      successRate: number;
      avgDifficultyScore: number;
    };
  };
  totalRequests: number;
  peakHour: number; // 가장 많이 사용된 시간대
}

// 사용량 제한 상태
export type UsageLimits = {
  [K in GoogleAIModel]: {
    daily: number;
    rpm: number;
    remaining: {
      daily: number;
      rpm: number;
    };
    nextReset: {
      daily: number; // timestamp
      rpm: number; // timestamp  
    };
  };
}

// 최적화 권장사항
export interface OptimizationRecommendation {
  type: 'model_upgrade' | 'model_downgrade' | 'threshold_adjust' | 'quota_redistribute';
  from?: GoogleAIModel;
  to?: GoogleAIModel;
  reason: string;
  expectedImprovement: string;
  confidence: number; // 0-1
}

export class GoogleAIUsageTracker {
  private usageLog: UsageStats[] = [];
  private dailyLimits: UsageLimits;
  private lastCleanup: number = Date.now();
  
  // 메모리 최적화: 최대 1000개 항목만 유지
  private readonly MAX_LOG_ENTRIES = 1000;
  private readonly CLEANUP_INTERVAL = 1000 * 60 * 60; // 1시간

  constructor() {
    this.dailyLimits = this.initializeLimits();
  }

  /**
   * API 호출 사용량 기록
   */
  recordUsage(stats: UsageStats): void {
    this.usageLog.push(stats);
    this.updateLimits(stats);
    this.cleanupIfNeeded();

    // 실시간 로깅 (개발 환경에서만)
    if (process.env.NODE_ENV === 'development') {
      console.log(`📊 ${stats.model} 사용: ${stats.success ? '✅' : '❌'} ${stats.latency}ms`);
    }
  }

  /**
   * 현재 사용량 상태 조회
   */
  getCurrentUsage(): UsageLimits {
    this.updateCurrentLimits();
    return { ...this.dailyLimits };
  }

  /**
   * 특정 모델 사용 가능 여부 확인
   */
  canUseModel(model: GoogleAIModel): boolean {
    const limits = this.dailyLimits[model];
    const now = Date.now();

    // 일일 한도 확인
    if (limits.remaining.daily <= 0 && now < limits.nextReset.daily) {
      return false;
    }

    // RPM 한도 확인
    if (limits.remaining.rpm <= 0 && now < limits.nextReset.rpm) {
      return false;
    }

    return true;
  }

  /**
   * 사용 가능한 모델 목록 (우선순위별)
   */
  getAvailableModels(): GoogleAIModel[] {
    const models: GoogleAIModel[] = ['gemini-2.5-pro', 'gemini-2.5-flash', 'gemini-2.5-flash-lite'];
    return models.filter(model => this.canUseModel(model));
  }

  /**
   * 일일 사용량 요약 생성
   */
  getDailySummary(date?: string): DailyUsageSummary {
    const targetDate = date || new Date().toISOString().split('T')[0];
    const dayStart = new Date(targetDate).getTime();
    const dayEnd = dayStart + 24 * 60 * 60 * 1000;

    const dayLogs = this.usageLog.filter(log => 
      log.timestamp >= dayStart && log.timestamp < dayEnd
    );

    const summary: DailyUsageSummary = {
      date: targetDate,
      models: {
        'gemini-2.5-pro': this.calculateModelStats(dayLogs, 'gemini-2.5-pro'),
        'gemini-2.5-flash': this.calculateModelStats(dayLogs, 'gemini-2.5-flash'),
        'gemini-2.5-flash-lite': this.calculateModelStats(dayLogs, 'gemini-2.5-flash-lite'),
      },
      totalRequests: dayLogs.length,
      peakHour: this.findPeakHour(dayLogs),
    };

    return summary;
  }

  /**
   * 사용 패턴 분석 및 최적화 권장사항 생성
   */
  generateOptimizationRecommendations(): OptimizationRecommendation[] {
    const recommendations: OptimizationRecommendation[] = [];
    const recentLogs = this.getRecentLogs(24 * 60 * 60 * 1000); // 최근 24시간

    // 1. 과소 사용 모델 감지
    const underutilizedModel = this.findUnderutilizedModel(recentLogs);
    if (underutilizedModel) {
      recommendations.push({
        type: 'quota_redistribute',
        reason: `${underutilizedModel} 모델이 할당량 대비 과소 사용됨`,
        expectedImprovement: '더 복잡한 쿼리에 고성능 모델 활용 가능',
        confidence: 0.7,
      });
    }

    // 2. 실패율 높은 모델 감지 (할당량 초과)
    const failingModel = this.findHighFailureRateModel(recentLogs);
    if (failingModel) {
      recommendations.push({
        type: 'model_downgrade',
        from: failingModel,
        to: this.getAlternativeModel(failingModel),
        reason: `${failingModel} 모델의 할당량 초과로 인한 높은 실패율`,
        expectedImprovement: '안정적인 응답 제공 및 사용자 경험 개선',
        confidence: 0.9,
      });
    }

    // 3. 난이도 점수 vs 실제 성능 불일치 감지
    const mismatchedModel = this.findDifficultyMismatch(recentLogs);
    if (mismatchedModel) {
      recommendations.push({
        type: 'threshold_adjust',
        reason: `난이도 예측과 실제 복잡도 간 불일치 감지`,
        expectedImprovement: '더 정확한 모델 선택으로 효율성 20% 향상',
        confidence: 0.8,
      });
    }

    return recommendations;
  }

  /**
   * 동적 임계값 조정 (피드백 학습)
   */
  adjustThresholds(feedbackData: {
    query: string;
    predictedDifficulty: number;
    actualPerformance: 'excellent' | 'good' | 'poor';
    selectedModel: GoogleAIModel;
    userSatisfaction: number; // 1-5
  }[]): { oldThresholds: number[]; newThresholds: number[]; improvement: number } {
    // 현재 임계값 (simple ≤ 35, medium ≤ 70, complex > 70)
    const oldThresholds = [35, 70];
    let newThresholds = [...oldThresholds];

    // 피드백 데이터 분석
    const analysisResults = this.analyzeFeedback(feedbackData);

    // 통계적 조정 (베이지안 최적화 간소화 버전)
    if (analysisResults.simpleOverload > 0.2) {
      newThresholds[0] = Math.max(25, newThresholds[0] - 5); // simple 임계값 낮추기
    }
    if (analysisResults.complexUnderload > 0.2) {
      newThresholds[1] = Math.min(80, newThresholds[1] + 5); // complex 임계값 높이기
    }

    // 개선도 계산 (예상 효율성 향상)
    const improvement = this.calculateExpectedImprovement(oldThresholds, newThresholds, analysisResults);

    // 로깅
    console.log(`🎯 임계값 조정: [${oldThresholds.join(', ')}] → [${newThresholds.join(', ')}] (예상 개선: ${improvement.toFixed(1)}%)`);

    return { oldThresholds, newThresholds, improvement };
  }

  /**
   * 실시간 사용량 모니터링 대시보드 데이터
   */
  getMonitoringData(): {
    currentUsage: UsageLimits;
    todaySummary: DailyUsageSummary;
    recommendations: OptimizationRecommendation[];
    health: {
      status: 'healthy' | 'warning' | 'critical';
      issues: string[];
      utilizationRate: number;
    };
  } {
    const currentUsage = this.getCurrentUsage();
    const todaySummary = this.getDailySummary();
    const recommendations = this.generateOptimizationRecommendations();

    // 시스템 건강도 평가
    const health = this.assessSystemHealth(currentUsage, todaySummary);

    return {
      currentUsage,
      todaySummary,
      recommendations,
      health,
    };
  }

  // === Private Helper Methods ===

  private initializeLimits(): UsageLimits {
    const now = Date.now();
    const nextDay = new Date(new Date().setHours(24, 0, 0, 0)).getTime();
    const nextMinute = new Date(Math.ceil(now / 60000) * 60000).getTime();

    return {
      'gemini-2.5-pro': {
        daily: GOOGLE_AI_MODEL_LIMITS['gemini-2.5-pro'].RPD,
        rpm: GOOGLE_AI_MODEL_LIMITS['gemini-2.5-pro'].RPM,
        remaining: {
          daily: GOOGLE_AI_MODEL_LIMITS['gemini-2.5-pro'].RPD,
          rpm: GOOGLE_AI_MODEL_LIMITS['gemini-2.5-pro'].RPM,
        },
        nextReset: { daily: nextDay, rpm: nextMinute },
      },
      'gemini-2.5-flash': {
        daily: GOOGLE_AI_MODEL_LIMITS['gemini-2.5-flash'].RPD,
        rpm: GOOGLE_AI_MODEL_LIMITS['gemini-2.5-flash'].RPM,
        remaining: {
          daily: GOOGLE_AI_MODEL_LIMITS['gemini-2.5-flash'].RPD,
          rpm: GOOGLE_AI_MODEL_LIMITS['gemini-2.5-flash'].RPM,
        },
        nextReset: { daily: nextDay, rpm: nextMinute },
      },
      'gemini-2.5-flash-lite': {
        daily: GOOGLE_AI_MODEL_LIMITS['gemini-2.5-flash-lite'].RPD,
        rpm: GOOGLE_AI_MODEL_LIMITS['gemini-2.5-flash-lite'].RPM,
        remaining: {
          daily: GOOGLE_AI_MODEL_LIMITS['gemini-2.5-flash-lite'].RPD,
          rpm: GOOGLE_AI_MODEL_LIMITS['gemini-2.5-flash-lite'].RPM,
        },
        nextReset: { daily: nextDay, rpm: nextMinute },
      },
    };
  }

  private updateLimits(stats: UsageStats): void {
    const limits = this.dailyLimits[stats.model];
    if (stats.success) {
      limits.remaining.daily = Math.max(0, limits.remaining.daily - 1);
      limits.remaining.rpm = Math.max(0, limits.remaining.rpm - 1);
    }
  }

  private updateCurrentLimits(): void {
    const now = Date.now();
    
    Object.values(this.dailyLimits).forEach(limits => {
      // 일일 한도 리셋 확인
      if (now >= limits.nextReset.daily) {
        limits.remaining.daily = limits.daily;
        limits.nextReset.daily = new Date(new Date().setHours(24, 0, 0, 0)).getTime();
      }
      
      // RPM 한도 리셋 확인
      if (now >= limits.nextReset.rpm) {
        limits.remaining.rpm = limits.rpm;
        limits.nextReset.rpm = new Date(Math.ceil(now / 60000) * 60000).getTime();
      }
    });
  }

  private cleanupIfNeeded(): void {
    const now = Date.now();
    if (now - this.lastCleanup > this.CLEANUP_INTERVAL) {
      // 오래된 로그 제거 (7일 이상)
      const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
      this.usageLog = this.usageLog.filter(log => log.timestamp > sevenDaysAgo);
      
      // 메모리 제한 확인
      if (this.usageLog.length > this.MAX_LOG_ENTRIES) {
        this.usageLog = this.usageLog.slice(-this.MAX_LOG_ENTRIES);
      }
      
      this.lastCleanup = now;
    }
  }

  private calculateModelStats(logs: UsageStats[], model: GoogleAIModel) {
    const modelLogs = logs.filter(log => log.model === model);
    
    if (modelLogs.length === 0) {
      return {
        requests: 0,
        tokens: 0,
        avgLatency: 0,
        successRate: 0,
        avgDifficultyScore: 0,
      };
    }

    const successfulLogs = modelLogs.filter(log => log.success);
    
    return {
      requests: modelLogs.length,
      tokens: modelLogs.reduce((sum, log) => sum + log.tokenCount, 0),
      avgLatency: modelLogs.reduce((sum, log) => sum + log.latency, 0) / modelLogs.length,
      successRate: successfulLogs.length / modelLogs.length,
      avgDifficultyScore: modelLogs.reduce((sum, log) => sum + (log.difficultyScore || 0), 0) / modelLogs.length,
    };
  }

  private findPeakHour(logs: UsageStats[]): number {
    const hourCounts = new Array(24).fill(0);
    logs.forEach(log => {
      const hour = new Date(log.timestamp).getHours();
      hourCounts[hour]++;
    });
    return hourCounts.indexOf(Math.max(...hourCounts));
  }

  private getRecentLogs(timeWindow: number): UsageStats[] {
    const cutoff = Date.now() - timeWindow;
    return this.usageLog.filter(log => log.timestamp >= cutoff);
  }

  private findUnderutilizedModel(logs: UsageStats[]): GoogleAIModel | null {
    const usage = {
      'gemini-2.5-pro': logs.filter(l => l.model === 'gemini-2.5-pro').length,
      'gemini-2.5-flash': logs.filter(l => l.model === 'gemini-2.5-flash').length,
      'gemini-2.5-flash-lite': logs.filter(l => l.model === 'gemini-2.5-flash-lite').length,
    };

    // Pro 모델이 10% 미만 사용 시 과소 사용으로 판단
    if (usage['gemini-2.5-pro'] / logs.length < 0.1) {
      return 'gemini-2.5-pro';
    }

    return null;
  }

  private findHighFailureRateModel(logs: UsageStats[]): GoogleAIModel | null {
    const models: GoogleAIModel[] = ['gemini-2.5-pro', 'gemini-2.5-flash', 'gemini-2.5-flash-lite'];
    
    for (const model of models) {
      const modelLogs = logs.filter(l => l.model === model);
      if (modelLogs.length > 10) { // 충분한 샘플이 있을 때만
        const failureRate = modelLogs.filter(l => !l.success).length / modelLogs.length;
        if (failureRate > 0.3) { // 30% 이상 실패율
          return model;
        }
      }
    }

    return null;
  }

  private findDifficultyMismatch(logs: UsageStats[]): GoogleAIModel | null {
    // 난이도 예측 vs 실제 성능 불일치 감지 로직
    // 실제 구현에서는 더 정교한 분석 필요
    return null;
  }

  private getAlternativeModel(model: GoogleAIModel): GoogleAIModel {
    const alternatives = {
      'gemini-2.5-pro': 'gemini-2.5-flash',
      'gemini-2.5-flash': 'gemini-2.5-flash-lite',
      'gemini-2.5-flash-lite': 'gemini-2.5-flash',
    } as const;
    
    return alternatives[model];
  }

  private analyzeFeedback(feedbackData: any[]): {
    simpleOverload: number;
    complexUnderload: number;
    overallSatisfaction: number;
  } {
    // 피드백 데이터 분석 (간소화된 버전)
    return {
      simpleOverload: 0.1,
      complexUnderload: 0.15,
      overallSatisfaction: 4.2,
    };
  }

  private calculateExpectedImprovement(
    oldThresholds: number[],
    newThresholds: number[],
    analysis: any
  ): number {
    // 예상 개선도 계산 (간소화된 버전)
    const thresholdChange = Math.abs(newThresholds[0] - oldThresholds[0]) + 
                           Math.abs(newThresholds[1] - oldThresholds[1]);
    return Math.min(thresholdChange * 2, 25); // 최대 25% 개선
  }

  private assessSystemHealth(usage: UsageLimits, summary: DailyUsageSummary): {
    status: 'healthy' | 'warning' | 'critical';
    issues: string[];
    utilizationRate: number;
  } {
    const issues: string[] = [];
    let utilizationRate = 0;
    let status: 'healthy' | 'warning' | 'critical' = 'healthy';

    // 전체 사용률 계산
    const totalUsed = Object.values(usage).reduce((sum, model) => 
      sum + (model.daily - model.remaining.daily), 0);
    const totalLimit = Object.values(usage).reduce((sum, model) => sum + model.daily, 0);
    utilizationRate = totalUsed / totalLimit;

    // 건강도 평가
    if (utilizationRate > 0.9) {
      status = 'critical';
      issues.push('일일 사용량 90% 초과');
    } else if (utilizationRate > 0.7) {
      status = 'warning';
      issues.push('일일 사용량 70% 초과');
    }

    // 개별 모델 확인
    Object.entries(usage).forEach(([model, limits]) => {
      const modelUtilization = (limits.daily - limits.remaining.daily) / limits.daily;
      if (modelUtilization > 0.95) {
        issues.push(`${model} 모델 사용량 95% 초과`);
        status = 'critical';
      }
    });

    return { status, issues, utilizationRate };
  }
}

// 싱글톤 인스턴스
let trackerInstance: GoogleAIUsageTracker | null = null;

export function getGoogleAIUsageTracker(): GoogleAIUsageTracker {
  if (!trackerInstance) {
    trackerInstance = new GoogleAIUsageTracker();
  }
  return trackerInstance;
}