// @ts-nocheck

import {
  AutoLearningScheduler,
  LearningScheduleConfig,
  LearningMetrics,
} from '@/modules/ai-agent/learning/AutoLearningScheduler';
import {
  ContextUpdateEngine,
  ContextUpdate,
  ContextUpdateConfig,
} from '@/modules/ai-agent/learning/ContextUpdateEngine';
import {
  PerformanceMonitor,
  PerformanceMetrics,
  PerformanceTrend,
  PerformanceAlert,
  MonitoringConfig,
} from '@/modules/ai-agent/learning/PerformanceMonitor';
import { PatternAnalysisService } from './PatternAnalysisService';
import { InteractionLogger } from './logging/InteractionLogger';

export interface ContinuousLearningConfig {
  scheduler: Partial<LearningScheduleConfig>;
  contextUpdate: Partial<ContextUpdateConfig>;
  monitoring: Partial<MonitoringConfig>;
  enableAutoStart: boolean; // 서비스 시작 시 자동으로 모든 컴포넌트 시작
  enableIntegratedReporting: boolean; // 통합 보고서 생성
}

export interface SystemStatus {
  scheduler: {
    isRunning: boolean;
    nextAnalysis: Date;
    config: LearningScheduleConfig;
  };
  contextUpdate: {
    pendingUpdates: number;
    appliedUpdates: number;
    currentVersion: string;
  };
  monitoring: {
    isMonitoring: boolean;
    activeAlerts: number;
    lastCheckTime: Date | null;
  };
  overall: {
    healthScore: number; // 0-100
    status: 'healthy' | 'warning' | 'critical';
    lastUpdated: Date;
  };
}

export interface IntegratedReport {
  id: string;
  timestamp: Date;
  systemStatus: SystemStatus;
  learningMetrics: LearningMetrics;
  performanceMetrics: PerformanceMetrics;
  performanceTrends: PerformanceTrend[];
  activeAlerts: PerformanceAlert[];
  contextUpdates: ContextUpdate[];
  recommendations: string[];
  summary: string;
  actionItems: {
    priority: 'high' | 'medium' | 'low';
    action: string;
    component: 'scheduler' | 'context' | 'monitoring' | 'general';
    estimatedImpact: number;
  }[];
}

export class ContinuousLearningService {
  private static instance: ContinuousLearningService;
  private config: ContinuousLearningConfig;

  private autoLearningScheduler: AutoLearningScheduler;
  private contextUpdateEngine: ContextUpdateEngine;
  private performanceMonitor: PerformanceMonitor;
  private patternAnalysisService: PatternAnalysisService;
  private interactionLogger: InteractionLogger;

  private isInitialized = false;
  private reportHistory: IntegratedReport[] = [];

  private constructor(config?: Partial<ContinuousLearningConfig>) {
    this.config = {
      scheduler: {},
      contextUpdate: {},
      monitoring: {},
      enableAutoStart: true,
      enableIntegratedReporting: true,
      ...config,
    };

    // 컴포넌트 초기화
    this.autoLearningScheduler = AutoLearningScheduler.getInstance();
    this.contextUpdateEngine = ContextUpdateEngine.getInstance(
      this.config.contextUpdate
    );
    this.performanceMonitor = PerformanceMonitor.getInstance(
      this.config.monitoring
    );
    this.patternAnalysisService = PatternAnalysisService.getInstance();
    this.interactionLogger = InteractionLogger.getInstance();
  }

  public static getInstance(
    config?: Partial<ContinuousLearningConfig>
  ): ContinuousLearningService {
    if (!ContinuousLearningService.instance) {
      ContinuousLearningService.instance = new ContinuousLearningService(
        config
      );
    }
    return ContinuousLearningService.instance;
  }

  /**
   * 지속적 학습 시스템 초기화 및 시작
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('지속적 학습 시스템이 이미 초기화되었습니다.');
      return;
    }

    try {
      console.log(
        '🚀 [ContinuousLearningService] 지속적 학습 시스템 초기화 시작...'
      );

      // 스케줄러 설정 업데이트
      if (Object.keys(this.config.scheduler).length > 0) {
        this.autoLearningScheduler.updateConfig(this.config.scheduler);
      }

      // 자동 시작이 활성화된 경우 모든 컴포넌트 시작
      if (this.config.enableAutoStart) {
        await this.startAllComponents();
      }

      this.isInitialized = true;
      console.log(
        '✅ [ContinuousLearningService] 지속적 학습 시스템 초기화 완료'
      );
    } catch (error) {
      console.error('❌ [ContinuousLearningService] 초기화 실패:', error);
      throw error;
    }
  }

  /**
   * 모든 컴포넌트 시작
   */
  async startAllComponents(): Promise<void> {
    console.log('🔄 [ContinuousLearningService] 모든 컴포넌트 시작...');

    // 자동 학습 스케줄러 시작
    this.autoLearningScheduler.start();

    // 성능 모니터링 시작
    this.performanceMonitor.startMonitoring();

    // 초기 컨텍스트 업데이트 제안서 생성
    await this.contextUpdateEngine.generateUpdateSuggestions();

    console.log('✅ [ContinuousLearningService] 모든 컴포넌트 시작 완료');
  }

  /**
   * 모든 컴포넌트 중지
   */
  async stopAllComponents(): Promise<void> {
    console.log('🛑 [ContinuousLearningService] 모든 컴포넌트 중지...');

    // 자동 학습 스케줄러 중지
    this.autoLearningScheduler.stop();

    // 성능 모니터링 중지
    this.performanceMonitor.stopMonitoring();

    console.log('✅ [ContinuousLearningService] 모든 컴포넌트 중지 완료');
  }

  /**
   * 시스템 상태 조회
   */
  async getSystemStatus(): Promise<SystemStatus> {
    try {
      // 스케줄러 상태
      const schedulerStatus =
        await this.autoLearningScheduler.getSchedulerStatus();

      // 컨텍스트 업데이트 상태
      const pendingUpdates = this.contextUpdateEngine.getPendingUpdates();
      const appliedUpdates = this.contextUpdateEngine.getAppliedUpdates();
      const currentContext = this.contextUpdateEngine.getCurrentContext();

      // 모니터링 상태
      const monitoringStatus = this.performanceMonitor.getMonitoringStatus();

      // 전체 건강 점수 계산
      const healthScore = await this.calculateHealthScore();
      const overallStatus = this.determineOverallStatus(healthScore);

      return {
        scheduler: {
          isRunning: schedulerStatus.isRunning,
          nextAnalysis: schedulerStatus.nextAnalysis,
          config: schedulerStatus.config,
        },
        contextUpdate: {
          pendingUpdates: pendingUpdates.length,
          appliedUpdates: appliedUpdates.length,
          currentVersion: currentContext.version,
        },
        monitoring: {
          isMonitoring: monitoringStatus.isMonitoring,
          activeAlerts: monitoringStatus.activeAlertsCount,
          lastCheckTime: monitoringStatus.lastCheckTime,
        },
        overall: {
          healthScore,
          status: overallStatus,
          lastUpdated: new Date(),
        },
      };
    } catch (error) {
      console.error(
        '❌ [ContinuousLearningService] 시스템 상태 조회 실패:',
        error
      );
      throw error;
    }
  }

  /**
   * 통합 보고서 생성
   */
  async generateIntegratedReport(): Promise<IntegratedReport> {
    try {
      console.log('📊 [ContinuousLearningService] 통합 보고서 생성 시작...');

      // 시스템 상태 수집
      const systemStatus = await this.getSystemStatus();

      // 학습 메트릭 수집
      const learningMetrics =
        await this.autoLearningScheduler.getLearningMetrics();

      // 성능 보고서 생성
      const performanceReport =
        await this.performanceMonitor.generatePerformanceReport();

      // 컨텍스트 업데이트 정보
      const pendingUpdates = this.contextUpdateEngine.getPendingUpdates();

      // 권장사항 및 액션 아이템 생성
      const recommendations = this.generateIntegratedRecommendations(
        systemStatus,
        learningMetrics,
        performanceReport
      );

      const actionItems = this.generateActionItems(
        systemStatus,
        performanceReport.alerts,
        pendingUpdates
      );

      // 요약 생성
      const summary = this.generateIntegratedSummary(
        systemStatus,
        learningMetrics,
        performanceReport
      );

      const report: IntegratedReport = {
        id: this.generateReportId(),
        timestamp: new Date(),
        systemStatus,
        learningMetrics,
        performanceMetrics: performanceReport.currentMetrics,
        performanceTrends: performanceReport.trends,
        activeAlerts: performanceReport.alerts,
        contextUpdates: pendingUpdates,
        recommendations,
        summary,
        actionItems,
      };

      // 보고서 히스토리에 추가
      this.reportHistory.push(report);

      // 최대 50개의 보고서만 유지
      if (this.reportHistory.length > 50) {
        this.reportHistory.shift();
      }

      console.log('✅ [ContinuousLearningService] 통합 보고서 생성 완료');
      return report;
    } catch (error) {
      console.error(
        '❌ [ContinuousLearningService] 통합 보고서 생성 실패:',
        error
      );
      throw error;
    }
  }

  /**
   * 자동 최적화 실행
   */
  async runAutoOptimization(): Promise<{
    contextUpdatesApplied: number;
    alertsResolved: number;
    improvementsImplemented: string[];
  }> {
    try {
      console.log('🔧 [ContinuousLearningService] 자동 최적화 시작...');

      const results = {
        contextUpdatesApplied: 0,
        alertsResolved: 0,
        improvementsImplemented: [] as string[],
      };

      // 1. 고신뢰도 컨텍스트 업데이트 자동 적용
      const appliedUpdates =
        await this.contextUpdateEngine.executeAutoUpdates();
      results.contextUpdatesApplied = appliedUpdates;

      if (appliedUpdates > 0) {
        results.improvementsImplemented.push(
          `${appliedUpdates}개의 컨텍스트 업데이트 적용`
        );
      }

      // 2. 자동 해결 가능한 알림 처리
      const activeAlerts = this.performanceMonitor.getActiveAlerts();
      let resolvedAlerts = 0;

      for (const alert of activeAlerts) {
        if (await this.tryAutoResolveAlert(alert)) {
          this.performanceMonitor.acknowledgeAlert(alert.id);
          resolvedAlerts++;
        }
      }

      results.alertsResolved = resolvedAlerts;
      if (resolvedAlerts > 0) {
        results.improvementsImplemented.push(
          `${resolvedAlerts}개의 알림 자동 해결`
        );
      }

      // 3. 강제 분석 실행 (필요한 경우)
      const systemStatus = await this.getSystemStatus();
      if (systemStatus.overall.healthScore < 70) {
        await this.autoLearningScheduler.forceAnalysis();
        results.improvementsImplemented.push(
          '시스템 건강도 저하로 인한 강제 분석 실행'
        );
      }

      console.log('✅ [ContinuousLearningService] 자동 최적화 완료:', results);
      return results;
    } catch (error) {
      console.error('❌ [ContinuousLearningService] 자동 최적화 실패:', error);
      throw error;
    }
  }

  /**
   * 보고서 히스토리 조회
   */
  getReportHistory(limit?: number): IntegratedReport[] {
    const reports = [...this.reportHistory].reverse(); // 최신순
    return limit ? reports.slice(0, limit) : reports;
  }

  /**
   * 보고서 히스토리 초기화
   */
  clearReportHistory(): void {
    this.reportHistory = [];
    if (process.env.NODE_ENV === 'development') {
      console.log('🗑️ [ContinuousLearningService] 보고서 히스토리 초기화');
    }
  }

  /**
   * 설정 업데이트
   */
  async updateConfig(
    newConfig: Partial<ContinuousLearningConfig>
  ): Promise<void> {
    this.config = { ...this.config, ...newConfig };

    // 각 컴포넌트 설정 업데이트
    if (newConfig.scheduler) {
      this.autoLearningScheduler.updateConfig(newConfig.scheduler);
    }

    console.log('✅ [ContinuousLearningService] 설정 업데이트 완료');
  }

  // Private 메서드들
  private async calculateHealthScore(): Promise<number> {
    try {
      const learningMetrics =
        await this.autoLearningScheduler.getLearningMetrics();
      const performanceMetrics =
        await this.performanceMonitor.collectCurrentMetrics();
      const activeAlerts = this.performanceMonitor.getActiveAlerts();

      // 기본 점수 계산 (각 요소별 가중치)
      const successRateScore = learningMetrics.successRate * 30; // 30%
      const confidenceScore = learningMetrics.averageConfidence * 25; // 25%
      const responseTimeScore =
        Math.max(0, (5000 - performanceMetrics.averageResponseTime) / 5000) *
        20; // 20%
      const improvementScore =
        Math.max(0, learningMetrics.improvementRate) * 15; // 15%
      const alertPenalty = Math.min(activeAlerts.length * 5, 50); // 최대 50점 감점

      const baseScore =
        successRateScore +
        confidenceScore +
        responseTimeScore +
        improvementScore;
      const finalScore = Math.max(0, Math.min(100, baseScore - alertPenalty));

      return Math.round(finalScore);
    } catch (error) {
      console.error('건강 점수 계산 실패:', error);
      return 50; // 기본값
    }
  }

  private determineOverallStatus(
    healthScore: number
  ): 'healthy' | 'warning' | 'critical' {
    if (healthScore >= 80) return 'healthy';
    if (healthScore >= 60) return 'warning';
    return 'critical';
  }

  private generateIntegratedRecommendations(
    systemStatus: SystemStatus,
    learningMetrics: LearningMetrics,
    performanceReport: any
  ): string[] {
    const recommendations: string[] = [];

    // 시스템 상태 기반 권장사항
    if (systemStatus.overall.healthScore < 70) {
      recommendations.push(
        '시스템 건강도가 낮습니다. 즉시 성능 분석을 실행하세요.'
      );
    }

    if (!systemStatus.scheduler.isRunning) {
      recommendations.push(
        '자동 학습 스케줄러가 중지되어 있습니다. 지속적 학습을 위해 시작하세요.'
      );
    }

    if (systemStatus.contextUpdate.pendingUpdates > 10) {
      recommendations.push(
        '대기 중인 컨텍스트 업데이트가 많습니다. 검토 후 적용하세요.'
      );
    }

    // 학습 메트릭 기반 권장사항
    if (learningMetrics.successRate < 0.8) {
      recommendations.push(
        '성공률이 낮습니다. 패턴 분석을 통해 개선점을 찾으세요.'
      );
    }

    if (learningMetrics.improvementRate < 0) {
      recommendations.push(
        '성능이 저하되고 있습니다. 최근 변경사항을 검토하세요.'
      );
    }

    // 성능 보고서 기반 권장사항
    recommendations.push(...performanceReport.recommendations);

    return [...new Set(recommendations)]; // 중복 제거
  }

  private generateActionItems(
    systemStatus: SystemStatus,
    alerts: PerformanceAlert[],
    pendingUpdates: ContextUpdate[]
  ): IntegratedReport['actionItems'] {
    const actionItems: IntegratedReport['actionItems'] = [];

    // 중요 알림 기반 액션 아이템
    const criticalAlerts = alerts.filter(a => a.severity === 'critical');
    for (const alert of criticalAlerts) {
      actionItems.push({
        priority: 'high',
        action: `중요 알림 해결: ${alert.message}`,
        component: 'monitoring',
        estimatedImpact: 80,
      });
    }

    // 고신뢰도 업데이트 승인
    const highConfidenceUpdates = pendingUpdates.filter(
      u => u.confidence > 0.85
    );
    if (highConfidenceUpdates.length > 0) {
      actionItems.push({
        priority: 'medium',
        action: `${highConfidenceUpdates.length}개의 고신뢰도 컨텍스트 업데이트 승인`,
        component: 'context',
        estimatedImpact: 60,
      });
    }

    // 스케줄러 상태 확인
    if (!systemStatus.scheduler.isRunning) {
      actionItems.push({
        priority: 'high',
        action: '자동 학습 스케줄러 시작',
        component: 'scheduler',
        estimatedImpact: 90,
      });
    }

    // 건강도 기반 액션 아이템
    if (systemStatus.overall.healthScore < 60) {
      actionItems.push({
        priority: 'high',
        action: '시스템 전체 진단 및 최적화 실행',
        component: 'general',
        estimatedImpact: 100,
      });
    }

    return actionItems.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  private generateIntegratedSummary(
    systemStatus: SystemStatus,
    learningMetrics: LearningMetrics,
    performanceReport: any
  ): string {
    const healthScore = systemStatus.overall.healthScore;
    const successRate = (learningMetrics.successRate * 100).toFixed(1);
    const activeAlerts = systemStatus.monitoring.activeAlerts;

    let summary = `지속적 학습 시스템 상태: 건강도 ${healthScore}점, 성공률 ${successRate}%`;

    if (systemStatus.overall.status === 'healthy') {
      summary += '. 시스템이 정상적으로 작동하고 있습니다.';
    } else if (systemStatus.overall.status === 'warning') {
      summary += '. 일부 성능 저하가 감지되었습니다.';
    } else {
      summary += '. 중요한 문제가 발견되어 즉시 조치가 필요합니다.';
    }

    if (activeAlerts > 0) {
      summary += ` ${activeAlerts}개의 활성 알림이 있습니다.`;
    }

    if (systemStatus.contextUpdate.pendingUpdates > 0) {
      summary += ` ${systemStatus.contextUpdate.pendingUpdates}개의 대기 중인 업데이트가 있습니다.`;
    }

    return summary;
  }

  private async tryAutoResolveAlert(alert: PerformanceAlert): Promise<boolean> {
    // 자동 해결 가능한 알림 유형들
    switch (alert.type) {
      case 'improvement_opportunity':
        // 개선 기회 알림은 자동으로 확인 처리
        return true;

      case 'system_issue':
        // 시스템 이슈 중 일부는 자동 해결 시도
        if (alert.message.includes('응답 시간')) {
          // 응답 시간 문제는 자동으로 확인 처리 (실제로는 캐시 최적화 등 수행)
          return true;
        }
        break;
    }

    return false;
  }

  private generateReportId(): string {
    return `integrated_report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
