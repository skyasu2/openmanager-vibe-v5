import { InteractionLogger } from '../../../services/ai-agent/logging/InteractionLogger';
import { PatternAnalysisService } from '../../../services/ai-agent/PatternAnalysisService';
import { AutoLearningScheduler } from './AutoLearningScheduler';
import { ContextUpdateEngine } from './ContextUpdateEngine';

export interface PerformanceMetrics {
  timestamp: Date;
  totalInteractions: number;
  successRate: number;
  averageConfidence: number;
  averageResponseTime: number;
  userSatisfactionRate: number;
  errorRate: number;
  improvementRate: number;
  activePatterns: number;
  pendingUpdates: number;
}

export interface PerformanceTrend {
  metric: keyof PerformanceMetrics;
  trend: 'improving' | 'declining' | 'stable';
  changeRate: number; // 변화율 (%)
  significance: 'high' | 'medium' | 'low';
}

export interface PerformanceAlert {
  id: string;
  type: 'performance_degradation' | 'improvement_opportunity' | 'system_issue';
  severity: 'critical' | 'warning' | 'info';
  message: string;
  metrics: Partial<PerformanceMetrics>;
  timestamp: Date;
  acknowledged: boolean;
  recommendations: string[];
}

export interface MonitoringConfig {
  metricsRetentionDays: number; // 메트릭 보관 기간
  alertThresholds: {
    successRateMin: number;
    confidenceMin: number;
    responseTimeMax: number;
    errorRateMax: number;
  };
  trendAnalysisWindow: number; // 트렌드 분석 기간 (시간)
  enableRealTimeAlerts: boolean;
  performanceCheckInterval: number; // 성능 체크 간격 (분)
}

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private config: MonitoringConfig;
  private interactionLogger: InteractionLogger;
  private patternAnalysisService: PatternAnalysisService;
  private autoLearningScheduler: AutoLearningScheduler;
  private contextUpdateEngine: ContextUpdateEngine;
  
  private metricsHistory: PerformanceMetrics[] = [];
  private activeAlerts: Map<string, PerformanceAlert> = new Map();
  private monitoringInterval: NodeJS.Timeout | null = null;
  private isMonitoring = false;

  private constructor(config?: Partial<MonitoringConfig>) {
    this.config = {
      metricsRetentionDays: 30,
      alertThresholds: {
        successRateMin: 0.7,
        confidenceMin: 0.6,
        responseTimeMax: 5000,
        errorRateMax: 0.3
      },
      trendAnalysisWindow: 24, // 24시간
      enableRealTimeAlerts: true,
      performanceCheckInterval: 15, // 15분마다
      ...config
    };

    this.interactionLogger = InteractionLogger.getInstance();
    this.patternAnalysisService = PatternAnalysisService.getInstance();
    this.autoLearningScheduler = AutoLearningScheduler.getInstance();
    this.contextUpdateEngine = ContextUpdateEngine.getInstance();
  }

  public static getInstance(config?: Partial<MonitoringConfig>): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor(config);
    }
    return PerformanceMonitor.instance;
  }

  /**
   * 성능 모니터링 시작
   */
  public startMonitoring(): void {
    if (this.isMonitoring) {
      console.log('성능 모니터링이 이미 실행 중입니다.');
      return;
    }

    this.isMonitoring = true;
    console.log('🔍 [PerformanceMonitor] 성능 모니터링을 시작합니다.');

    // 즉시 첫 번째 성능 체크 실행
    this.performPerformanceCheck();

    // 주기적 성능 체크 스케줄링
    this.monitoringInterval = setInterval(() => {
      this.performPerformanceCheck();
    }, this.config.performanceCheckInterval * 60 * 1000);
  }

  /**
   * 성능 모니터링 중지
   */
  public stopMonitoring(): void {
    if (!this.isMonitoring) {
      console.log('성능 모니터링이 실행되고 있지 않습니다.');
      return;
    }

    this.isMonitoring = false;
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    console.log('🔍 [PerformanceMonitor] 성능 모니터링을 중지했습니다.');
  }

  /**
   * 실시간 성능 메트릭 수집
   */
  async collectCurrentMetrics(): Promise<PerformanceMetrics> {
    try {
      const now = new Date();
      
      // 최근 1시간 데이터 조회
      const recentInteractions = await this.interactionLogger.getInteractions({
        startDate: new Date(now.getTime() - 60 * 60 * 1000),
        endDate: now
      });

      // 기본 메트릭 계산
      const totalInteractions = recentInteractions.length;
      
      if (totalInteractions === 0) {
        return this.createEmptyMetrics(now);
      }

      const successfulInteractions = recentInteractions.filter((i: any) => 
        i.userFeedback === 'helpful' || i.confidence > 0.7
      );

      const successRate = successfulInteractions.length / totalInteractions;
      
      const averageConfidence = recentInteractions.reduce((sum: number, i: any) => 
        sum + i.confidence, 0) / totalInteractions;
      
      const averageResponseTime = recentInteractions.reduce((sum: number, i: any) => 
        sum + i.responseTime, 0) / totalInteractions;

      // 사용자 만족도 계산
      const feedbackInteractions = recentInteractions.filter((i: any) => i.userFeedback);
      const userSatisfactionRate = feedbackInteractions.length > 0 ?
        feedbackInteractions.filter((i: any) => i.userFeedback === 'helpful').length / feedbackInteractions.length : 0;

      const errorRate = 1 - successRate;

      // 개선율 계산 (이전 시간 대비)
      const improvementRate = await this.calculateImprovementRate();

      // 시스템 상태 정보
      const schedulerStatus = await this.autoLearningScheduler.getSchedulerStatus();
      const pendingUpdates = this.contextUpdateEngine.getPendingUpdates().length;

      const metrics: PerformanceMetrics = {
        timestamp: now,
        totalInteractions,
        successRate,
        averageConfidence,
        averageResponseTime,
        userSatisfactionRate,
        errorRate,
        improvementRate,
        activePatterns: schedulerStatus.metrics.activePatterns,
        pendingUpdates
      };

      return metrics;

    } catch (error) {
      console.error('❌ [PerformanceMonitor] 메트릭 수집 실패:', error);
      return this.createEmptyMetrics(new Date());
    }
  }

  /**
   * 성능 트렌드 분석
   */
  async analyzePerformanceTrends(): Promise<PerformanceTrend[]> {
    if (this.metricsHistory.length < 2) {
      return [];
    }

    const trends: PerformanceTrend[] = [];
    const recentMetrics = this.getRecentMetrics(this.config.trendAnalysisWindow);
    
    if (recentMetrics.length < 2) {
      return trends;
    }

    const oldestMetric = recentMetrics[0];
    const latestMetric = recentMetrics[recentMetrics.length - 1];

    // 주요 메트릭들의 트렌드 분석
    const metricsToAnalyze: (keyof PerformanceMetrics)[] = [
      'successRate', 'averageConfidence', 'averageResponseTime', 
      'userSatisfactionRate', 'errorRate', 'improvementRate'
    ];

    for (const metric of metricsToAnalyze) {
      const oldValue = oldestMetric[metric] as number;
      const newValue = latestMetric[metric] as number;
      
      if (typeof oldValue === 'number' && typeof newValue === 'number' && oldValue !== 0) {
        const changeRate = ((newValue - oldValue) / oldValue) * 100;
        const trend = this.determineTrend(metric, changeRate);
        const significance = this.calculateSignificance(Math.abs(changeRate));

        trends.push({
          metric,
          trend,
          changeRate,
          significance
        });
      }
    }

    console.log(`📈 [PerformanceMonitor] 트렌드 분석 완료: ${trends.length}개 메트릭 분석`);
    return trends;
  }

  /**
   * 성능 알림 생성 및 관리
   */
  async generatePerformanceAlerts(metrics: PerformanceMetrics): Promise<PerformanceAlert[]> {
    const alerts: PerformanceAlert[] = [];

    // 성공률 저하 알림
    if (metrics.successRate < this.config.alertThresholds.successRateMin) {
      alerts.push(this.createAlert(
        'performance_degradation',
        'critical',
        `성공률이 ${(metrics.successRate * 100).toFixed(1)}%로 임계값(${(this.config.alertThresholds.successRateMin * 100).toFixed(1)}%) 미만입니다.`,
        { successRate: metrics.successRate },
        [
          '패턴 분석을 실행하여 실패 원인을 파악하세요.',
          '새로운 패턴 제안을 검토하고 적용하세요.',
          '사용자 피드백을 분석하여 개선점을 찾으세요.'
        ]
      ));
    }

    // 신뢰도 저하 알림
    if (metrics.averageConfidence < this.config.alertThresholds.confidenceMin) {
      alerts.push(this.createAlert(
        'performance_degradation',
        'warning',
        `평균 신뢰도가 ${(metrics.averageConfidence * 100).toFixed(1)}%로 낮습니다.`,
        { averageConfidence: metrics.averageConfidence },
        [
          '컨텍스트 업데이트를 통해 응답 품질을 개선하세요.',
          '지식 베이스를 확장하여 더 정확한 응답을 제공하세요.'
        ]
      ));
    }

    // 응답 시간 증가 알림
    if (metrics.averageResponseTime > this.config.alertThresholds.responseTimeMax) {
      alerts.push(this.createAlert(
        'system_issue',
        'warning',
        `평균 응답 시간이 ${metrics.averageResponseTime.toFixed(0)}ms로 증가했습니다.`,
        { averageResponseTime: metrics.averageResponseTime },
        [
          '시스템 리소스 사용량을 확인하세요.',
          '패턴 매칭 알고리즘을 최적화하세요.',
          '캐싱 전략을 검토하세요.'
        ]
      ));
    }

    // 오류율 증가 알림
    if (metrics.errorRate > this.config.alertThresholds.errorRateMax) {
      alerts.push(this.createAlert(
        'performance_degradation',
        'critical',
        `오류율이 ${(metrics.errorRate * 100).toFixed(1)}%로 높습니다.`,
        { errorRate: metrics.errorRate },
        [
          '즉시 패턴 분석을 실행하여 문제를 파악하세요.',
          '최근 변경사항을 검토하고 롤백을 고려하세요.',
          '시스템 로그를 확인하여 근본 원인을 찾으세요.'
        ]
      ));
    }

    // 개선 기회 알림
    if (metrics.pendingUpdates > 10) {
      alerts.push(this.createAlert(
        'improvement_opportunity',
        'info',
        `${metrics.pendingUpdates}개의 대기 중인 컨텍스트 업데이트가 있습니다.`,
        { pendingUpdates: metrics.pendingUpdates },
        [
          '대기 중인 업데이트를 검토하고 적용하세요.',
          '자동 승인 임계값을 조정하여 효율성을 높이세요.'
        ]
      ));
    }

    // 새로운 알림들을 활성 알림 목록에 추가
    for (const alert of alerts) {
      this.activeAlerts.set(alert.id, alert);
    }

    if (alerts.length > 0) {
      console.log(`🚨 [PerformanceMonitor] ${alerts.length}개의 새로운 알림이 생성되었습니다.`);
    }

    return alerts;
  }

  /**
   * 성능 보고서 생성
   */
  async generatePerformanceReport(): Promise<{
    currentMetrics: PerformanceMetrics;
    trends: PerformanceTrend[];
    alerts: PerformanceAlert[];
    recommendations: string[];
    summary: string;
  }> {
    const currentMetrics = await this.collectCurrentMetrics();
    const trends = await this.analyzePerformanceTrends();
    const alerts = Array.from(this.activeAlerts.values()).filter(a => !a.acknowledged);
    const recommendations = this.generateRecommendations(currentMetrics, trends, alerts);
    const summary = this.generateSummary(currentMetrics, trends, alerts);

    console.log('📊 [PerformanceMonitor] 성능 보고서 생성 완료');

    return {
      currentMetrics,
      trends,
      alerts,
      recommendations,
      summary
    };
  }

  /**
   * 알림 확인 처리
   */
  acknowledgeAlert(alertId: string): boolean {
    const alert = this.activeAlerts.get(alertId);
    if (!alert) {
      return false;
    }

    alert.acknowledged = true;
    console.log(`✅ [PerformanceMonitor] 알림 확인: ${alertId}`);
    return true;
  }

  /**
   * 메트릭 히스토리 조회
   */
  getMetricsHistory(hours?: number): PerformanceMetrics[] {
    if (!hours) {
      return [...this.metricsHistory];
    }

    const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.metricsHistory.filter(m => m.timestamp > cutoffTime);
  }

  /**
   * 활성 알림 조회
   */
  getActiveAlerts(): PerformanceAlert[] {
    return Array.from(this.activeAlerts.values()).filter(a => !a.acknowledged);
  }

  /**
   * 모니터링 상태 조회
   */
  getMonitoringStatus(): {
    isMonitoring: boolean;
    config: MonitoringConfig;
    metricsCount: number;
    activeAlertsCount: number;
    lastCheckTime: Date | null;
  } {
    return {
      isMonitoring: this.isMonitoring,
      config: this.config,
      metricsCount: this.metricsHistory.length,
      activeAlertsCount: this.getActiveAlerts().length,
      lastCheckTime: this.metricsHistory.length > 0 ? 
        this.metricsHistory[this.metricsHistory.length - 1].timestamp : null
    };
  }

  // Private 메서드들
  private async performPerformanceCheck(): Promise<void> {
    try {
      console.log('🔍 [PerformanceMonitor] 성능 체크 실행...');

      // 현재 메트릭 수집
      const metrics = await this.collectCurrentMetrics();
      
      // 메트릭 히스토리에 추가
      this.metricsHistory.push(metrics);
      
      // 오래된 메트릭 정리
      this.cleanupOldMetrics();

      // 실시간 알림 생성 (활성화된 경우)
      if (this.config.enableRealTimeAlerts) {
        await this.generatePerformanceAlerts(metrics);
      }

      console.log('✅ [PerformanceMonitor] 성능 체크 완료:', {
        successRate: (metrics.successRate * 100).toFixed(1) + '%',
        confidence: (metrics.averageConfidence * 100).toFixed(1) + '%',
        responseTime: metrics.averageResponseTime.toFixed(0) + 'ms'
      });

    } catch (error) {
      console.error('❌ [PerformanceMonitor] 성능 체크 실패:', error);
    }
  }

  private async calculateImprovementRate(): Promise<number> {
    if (this.metricsHistory.length < 2) {
      return 0;
    }

    const recent = this.metricsHistory.slice(-2);
    const oldMetric = recent[0];
    const newMetric = recent[1];

    if (oldMetric.successRate === 0) {
      return 0;
    }

    return ((newMetric.successRate - oldMetric.successRate) / oldMetric.successRate) * 100;
  }

  private createEmptyMetrics(timestamp: Date): PerformanceMetrics {
    return {
      timestamp,
      totalInteractions: 0,
      successRate: 0,
      averageConfidence: 0,
      averageResponseTime: 0,
      userSatisfactionRate: 0,
      errorRate: 0,
      improvementRate: 0,
      activePatterns: 0,
      pendingUpdates: 0
    };
  }

  private getRecentMetrics(hours: number): PerformanceMetrics[] {
    const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.metricsHistory.filter(m => m.timestamp > cutoffTime);
  }

  private determineTrend(metric: keyof PerformanceMetrics, changeRate: number): 'improving' | 'declining' | 'stable' {
    const threshold = 5; // 5% 변화를 기준으로 판단

    if (Math.abs(changeRate) < threshold) {
      return 'stable';
    }

    // 메트릭별로 개선/악화 방향이 다름
    const improvingMetrics = ['successRate', 'averageConfidence', 'userSatisfactionRate', 'improvementRate', 'activePatterns'];
    const decliningMetrics = ['averageResponseTime', 'errorRate'];

    if (improvingMetrics.includes(metric as string)) {
      return changeRate > 0 ? 'improving' : 'declining';
    } else if (decliningMetrics.includes(metric as string)) {
      return changeRate < 0 ? 'improving' : 'declining';
    }

    return 'stable';
  }

  private calculateSignificance(changeRate: number): 'high' | 'medium' | 'low' {
    if (changeRate > 20) return 'high';
    if (changeRate > 10) return 'medium';
    return 'low';
  }

  private createAlert(
    type: PerformanceAlert['type'],
    severity: PerformanceAlert['severity'],
    message: string,
    metrics: Partial<PerformanceMetrics>,
    recommendations: string[]
  ): PerformanceAlert {
    return {
      id: this.generateAlertId(),
      type,
      severity,
      message,
      metrics,
      timestamp: new Date(),
      acknowledged: false,
      recommendations
    };
  }

  private generateRecommendations(
    metrics: PerformanceMetrics,
    trends: PerformanceTrend[],
    alerts: PerformanceAlert[]
  ): string[] {
    const recommendations: string[] = [];

    // 트렌드 기반 권장사항
    const decliningTrends = trends.filter(t => t.trend === 'declining' && t.significance !== 'low');
    if (decliningTrends.length > 0) {
      recommendations.push('성능 저하 트렌드가 감지되었습니다. 즉시 패턴 분석을 실행하세요.');
    }

    // 메트릭 기반 권장사항
    if (metrics.successRate < 0.8) {
      recommendations.push('성공률 개선을 위해 새로운 패턴 제안을 검토하고 적용하세요.');
    }

    if (metrics.pendingUpdates > 5) {
      recommendations.push('대기 중인 컨텍스트 업데이트를 검토하여 시스템 성능을 개선하세요.');
    }

    // 알림 기반 권장사항
    const criticalAlerts = alerts.filter(a => a.severity === 'critical');
    if (criticalAlerts.length > 0) {
      recommendations.push('중요한 성능 문제가 발견되었습니다. 즉시 조치가 필요합니다.');
    }

    return recommendations;
  }

  private generateSummary(
    metrics: PerformanceMetrics,
    trends: PerformanceTrend[],
    alerts: PerformanceAlert[]
  ): string {
    const successRate = (metrics.successRate * 100).toFixed(1);
    const confidence = (metrics.averageConfidence * 100).toFixed(1);
    const responseTime = metrics.averageResponseTime.toFixed(0);

    let summary = `현재 시스템 성능: 성공률 ${successRate}%, 신뢰도 ${confidence}%, 응답시간 ${responseTime}ms`;

    const improvingTrends = trends.filter(t => t.trend === 'improving').length;
    const decliningTrends = trends.filter(t => t.trend === 'declining').length;

    if (improvingTrends > decliningTrends) {
      summary += '. 전반적으로 성능이 개선되고 있습니다.';
    } else if (decliningTrends > improvingTrends) {
      summary += '. 성능 저하 경향이 감지되었습니다.';
    } else {
      summary += '. 성능이 안정적으로 유지되고 있습니다.';
    }

    if (alerts.length > 0) {
      summary += ` ${alerts.length}개의 알림이 활성화되어 있습니다.`;
    }

    return summary;
  }

  private cleanupOldMetrics(): void {
    const cutoffTime = new Date(Date.now() - this.config.metricsRetentionDays * 24 * 60 * 60 * 1000);
    this.metricsHistory = this.metricsHistory.filter(m => m.timestamp > cutoffTime);
  }

  private generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
} 