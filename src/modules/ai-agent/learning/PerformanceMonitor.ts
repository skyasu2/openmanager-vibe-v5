/**
 * 🔄 AI 에이전트 학습 성능 모니터 - 통합 버전 래퍼
 * 
 * 통합된 성능 모니터링 시스템을 사용하도록 리다이렉트
 * - 하위 호환성 보장
 * - AI 학습 특화 기능 유지
 * - 중복 코드 제거
 */

'use client';

// 통합 성능 모니터에서 필요한 기능 가져오기
import {
  UnifiedPerformanceMonitor,
  UnifiedMetrics,
  UnifiedAlert,
  MonitoringConfig
} from '../../../services/monitoring/UnifiedPerformanceMonitor';

// 기존 타입들 (하위 호환성)
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

export interface MonitoringConfig_Legacy {
  metricsRetentionDays: number;
  alertThresholds: {
    successRateMin: number;
    confidenceMin: number;
    responseTimeMax: number;
    errorRateMax: number;
  };
  trendAnalysisWindow: number;
  enableRealTimeAlerts: boolean;
  performanceCheckInterval: number;
}

/**
 * 🎯 AI 에이전트 학습 성능 모니터 (통합 버전 래퍼)
 */
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private unifiedMonitor: UnifiedPerformanceMonitor;
  private config: MonitoringConfig_Legacy;

  private constructor(config?: Partial<MonitoringConfig_Legacy>) {
    this.config = {
      metricsRetentionDays: 30,
      alertThresholds: {
        successRateMin: 0.7,
        confidenceMin: 0.6,
        responseTimeMax: 5000,
        errorRateMax: 0.3
      },
      trendAnalysisWindow: 24,
      enableRealTimeAlerts: true,
      performanceCheckInterval: 15,
      ...config
    };

    // 통합 모니터 인스턴스 가져오기
    this.unifiedMonitor = UnifiedPerformanceMonitor.getInstance({
      enabled: true,
      monitors: {
        learning: true,
        hybrid: false,
        system: false,
        benchmark: false,
      },
      intervals: {
        learning: this.config.performanceCheckInterval * 60 * 1000,
        hybrid: 30 * 1000,
        system: 60 * 1000,
        benchmark: 5 * 1000,
        unified: 60 * 1000,
      },
      alerts: {
        enabled: this.config.enableRealTimeAlerts,
        aggregation: true,
        thresholds: {
          successRate: this.config.alertThresholds.successRateMin,
          responseTime: this.config.alertThresholds.responseTimeMax,
          memoryUsage: 80,
          cpuUsage: 80,
          errorRate: this.config.alertThresholds.errorRateMax,
        },
      },
    });
  }

  public static getInstance(config?: Partial<MonitoringConfig_Legacy>): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor(config);
    }
    return PerformanceMonitor.instance;
  }

  /**
   * 성능 모니터링 시작
   */
  public startMonitoring(): void {
    console.log('🔍 [AI Learning PerformanceMonitor] 성능 모니터링을 시작합니다.');
    this.unifiedMonitor.startMonitoring().catch(error => {
      console.error('❌ [AI Learning PerformanceMonitor] 모니터링 시작 실패:', error);
    });
  }

  /**
   * 성능 모니터링 중지
   */
  public stopMonitoring(): void {
    console.log('🔍 [AI Learning PerformanceMonitor] 성능 모니터링을 중지합니다.');
    this.unifiedMonitor.stopMonitoring().catch(error => {
      console.error('❌ [AI Learning PerformanceMonitor] 모니터링 중지 실패:', error);
    });
  }

  /**
   * 실시간 성능 메트릭 수집
   */
  async collectCurrentMetrics(): Promise<PerformanceMetrics> {
    try {
      const unifiedMetrics = await this.unifiedMonitor.collectUnifiedMetrics();

      // 통합 메트릭에서 학습 메트릭 추출
      return {
        timestamp: unifiedMetrics.timestamp,
        totalInteractions: unifiedMetrics.learning.totalInteractions,
        successRate: unifiedMetrics.learning.successRate,
        averageConfidence: unifiedMetrics.learning.averageConfidence,
        averageResponseTime: unifiedMetrics.learning.averageResponseTime,
        userSatisfactionRate: unifiedMetrics.learning.userSatisfactionRate,
        errorRate: unifiedMetrics.learning.errorRate,
        improvementRate: unifiedMetrics.learning.improvementRate,
        activePatterns: unifiedMetrics.learning.activePatterns,
        pendingUpdates: unifiedMetrics.learning.pendingUpdates,
      };
    } catch (error) {
      console.error('❌ [AI Learning PerformanceMonitor] 메트릭 수집 실패:', error);
      return this.createEmptyMetrics(new Date());
    }
  }

  /**
   * 성능 트렌드 분석
   */
  async analyzePerformanceTrends(): Promise<PerformanceTrend[]> {
    try {
      const history = this.unifiedMonitor.getMetricsHistory(this.config.trendAnalysisWindow);

      if (history.length < 2) {
        return [];
      }

      const trends: PerformanceTrend[] = [];
      const latest = history[history.length - 1];
      const previous = history[0];

      // 성공률 트렌드
      const successRateChange = latest.learning.successRate - previous.learning.successRate;
      trends.push({
        metric: 'successRate',
        trend: this.determineTrend('successRate', successRateChange),
        changeRate: (successRateChange / previous.learning.successRate) * 100,
        significance: this.calculateSignificance(Math.abs(successRateChange) * 100),
      });

      // 응답 시간 트렌드
      const responseTimeChange = latest.learning.averageResponseTime - previous.learning.averageResponseTime;
      trends.push({
        metric: 'averageResponseTime',
        trend: this.determineTrend('averageResponseTime', responseTimeChange),
        changeRate: (responseTimeChange / previous.learning.averageResponseTime) * 100,
        significance: this.calculateSignificance(Math.abs(responseTimeChange / previous.learning.averageResponseTime) * 100),
      });

      return trends;
    } catch (error) {
      console.error('❌ [AI Learning PerformanceMonitor] 트렌드 분석 실패:', error);
      return [];
    }
  }

  /**
   * 성능 알림 생성
   */
  async generatePerformanceAlerts(metrics: PerformanceMetrics): Promise<PerformanceAlert[]> {
    try {
      const unifiedAlerts = this.unifiedMonitor.getActiveAlerts();

      // 통합 알림을 학습 알림 형식으로 변환
      return unifiedAlerts
        .filter(alert => alert.source === 'learning')
        .map(alert => ({
          id: alert.id,
          type: alert.type as 'performance_degradation' | 'improvement_opportunity' | 'system_issue',
          severity: alert.severity as 'critical' | 'warning' | 'info',
          message: alert.message,
          metrics: alert.metrics || {},
          timestamp: alert.timestamp,
          acknowledged: alert.acknowledged,
          recommendations: alert.recommendations || [],
        }));
    } catch (error) {
      console.error('❌ [AI Learning PerformanceMonitor] 알림 생성 실패:', error);
      return [];
    }
  }

  /**
   * 성능 리포트 생성
   */
  async generatePerformanceReport(): Promise<{
    currentMetrics: PerformanceMetrics;
    trends: PerformanceTrend[];
    alerts: PerformanceAlert[];
    recommendations: string[];
    summary: string;
  }> {
    try {
      const currentMetrics = await this.collectCurrentMetrics();
      const trends = await this.analyzePerformanceTrends();
      const alerts = await this.generatePerformanceAlerts(currentMetrics);
      const recommendations = this.generateRecommendations(currentMetrics, trends, alerts);
      const summary = this.generateSummary(currentMetrics, trends, alerts);

      return {
        currentMetrics,
        trends,
        alerts,
        recommendations,
        summary,
      };
    } catch (error) {
      console.error('❌ [AI Learning PerformanceMonitor] 리포트 생성 실패:', error);
      throw error;
    }
  }

  /**
   * 알림 확인 처리
   */
  acknowledgeAlert(alertId: string): boolean {
    return this.unifiedMonitor.acknowledgeAlert(alertId);
  }

  /**
   * 메트릭 히스토리 조회
   */
  getMetricsHistory(hours?: number): PerformanceMetrics[] {
    try {
      const unifiedHistory = this.unifiedMonitor.getMetricsHistory(hours || 24);

      return unifiedHistory.map(unified => ({
        timestamp: unified.timestamp,
        totalInteractions: unified.learning.totalInteractions,
        successRate: unified.learning.successRate,
        averageConfidence: unified.learning.averageConfidence,
        averageResponseTime: unified.learning.averageResponseTime,
        userSatisfactionRate: unified.learning.userSatisfactionRate,
        errorRate: unified.learning.errorRate,
        improvementRate: unified.learning.improvementRate,
        activePatterns: unified.learning.activePatterns,
        pendingUpdates: unified.learning.pendingUpdates,
      }));
    } catch (error) {
      console.error('❌ [AI Learning PerformanceMonitor] 히스토리 조회 실패:', error);
      return [];
    }
  }

  /**
   * 활성 알림 조회
   */
  getActiveAlerts(): PerformanceAlert[] {
    try {
      const unifiedAlerts = this.unifiedMonitor.getActiveAlerts();

      return unifiedAlerts
        .filter(alert => alert.source === 'learning')
        .map(alert => ({
          id: alert.id,
          type: alert.type as 'performance_degradation' | 'improvement_opportunity' | 'system_issue',
          severity: alert.severity as 'critical' | 'warning' | 'info',
          message: alert.message,
          metrics: alert.metrics || {},
          timestamp: alert.timestamp,
          acknowledged: alert.acknowledged,
          recommendations: alert.recommendations || [],
        }));
    } catch (error) {
      console.error('❌ [AI Learning PerformanceMonitor] 활성 알림 조회 실패:', error);
      return [];
    }
  }

  /**
   * 모니터링 상태 조회
   */
  getMonitoringStatus(): {
    isMonitoring: boolean;
    config: MonitoringConfig_Legacy;
    metricsCount: number;
    activeAlertsCount: number;
    lastCheckTime: Date | null;
  } {
    const stats = this.unifiedMonitor.getStats();

    return {
      isMonitoring: stats.isMonitoring,
      config: this.config,
      metricsCount: stats.metricsCount,
      activeAlertsCount: stats.activeAlertsCount,
      lastCheckTime: stats.lastCollectionTime,
    };
  }

  // 헬퍼 메서드들
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
      pendingUpdates: 0,
    };
  }

  private determineTrend(metric: keyof PerformanceMetrics, changeRate: number): 'improving' | 'declining' | 'stable' {
    const threshold = 0.05; // 5% 변화 임계값

    if (Math.abs(changeRate) < threshold) {
      return 'stable';
    }

    // 성공률, 신뢰도, 사용자 만족도, 개선율은 높을수록 좋음
    const positiveMetrics = ['successRate', 'averageConfidence', 'userSatisfactionRate', 'improvementRate'];

    if (positiveMetrics.includes(metric)) {
      return changeRate > 0 ? 'improving' : 'declining';
    } else {
      // 응답 시간, 에러율은 낮을수록 좋음
      return changeRate < 0 ? 'improving' : 'declining';
    }
  }

  private calculateSignificance(changePercent: number): 'high' | 'medium' | 'low' {
    if (changePercent > 20) return 'high';
    if (changePercent > 10) return 'medium';
    return 'low';
  }

  private generateRecommendations(
    metrics: PerformanceMetrics,
    trends: PerformanceTrend[],
    alerts: PerformanceAlert[]
  ): string[] {
    const recommendations: string[] = [];

    // 성능 기반 권장사항
    if (metrics.successRate < 0.8) {
      recommendations.push('AI 모델 재학습 또는 파라미터 튜닝을 고려하세요');
    }

    if (metrics.averageResponseTime > 2000) {
      recommendations.push('응답 시간 최적화를 위한 캐싱 전략을 검토하세요');
    }

    if (metrics.errorRate > 0.2) {
      recommendations.push('에러율 감소를 위한 데이터 품질 개선이 필요합니다');
    }

    // 트렌드 기반 권장사항
    const decliningTrends = trends.filter(t => t.trend === 'declining' && t.significance === 'high');
    if (decliningTrends.length > 0) {
      recommendations.push('성능 저하 트렌드가 감지되었습니다. 시스템 점검을 권장합니다');
    }

    return recommendations.length > 0 ? recommendations : ['현재 AI 학습 성능이 양호합니다'];
  }

  private generateSummary(
    metrics: PerformanceMetrics,
    trends: PerformanceTrend[],
    alerts: PerformanceAlert[]
  ): string {
    const successRate = (metrics.successRate * 100).toFixed(1);
    const responseTime = metrics.averageResponseTime.toFixed(0);
    const errorRate = (metrics.errorRate * 100).toFixed(1);

    let status = '양호';
    if (metrics.successRate < 0.7 || metrics.errorRate > 0.3) {
      status = '주의 필요';
    } else if (metrics.successRate > 0.9 && metrics.errorRate < 0.1) {
      status = '우수';
    }

    return `AI 학습 성능 상태: ${status} | 성공률: ${successRate}% | 평균 응답시간: ${responseTime}ms | 에러율: ${errorRate}% | 활성 알림: ${alerts.length}개`;
  }
} 