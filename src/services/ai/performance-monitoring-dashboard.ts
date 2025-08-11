/**
 * 🎯 AI 성능 모니터링 대시보드
 * 
 * Phase 3 완료 후 실시간 성능 추적 및 최적화 피드백
 * - 152ms 목표 달성률 실시간 추적
 * - 병목지점 자동 식별 및 알림
 * - 성능 트렌드 분석 및 예측
 * 
 * @author AI Systems Engineer
 * @version 1.0.0
 */

import { getUltraPerformanceAIEngine } from './ultra-performance-ai-engine';
import { getAIPerformanceBenchmark } from './performance-benchmark';
import type { QueryRequest, QueryResponse } from './SimplifiedQueryEngine';

interface PerformanceMetric {
  timestamp: number;
  responseTime: number;
  targetAchieved: boolean;
  cacheType?: string;
  optimizations: string[];
  engine: string;
  memoryUsage: number;
}

interface PerformanceTrend {
  period: 'last_5min' | 'last_hour' | 'last_day';
  averageResponseTime: number;
  targetAchievementRate: number;
  improvement: number; // vs previous period
  bottlenecks: string[];
}

interface AlertConfig {
  responseTimeThreshold: number; // ms
  targetRateThreshold: number; // percentage
  memoryThreshold: number; // MB
  alertCooldown: number; // ms
}

interface OptimizationInfo {
  cacheType?: string;
  optimizationsApplied?: string[];
  optimizationSteps?: string[];
  totalTime?: number;
  parallelTasks?: string[];
  engineUsed?: string;
}

interface PerformanceSummary {
  totalRequests: number;
  avgResponseTime: number;
  targetAchievementRate: number;
  cacheHitRate: number;
  peakMemoryUsage: number;
  topOptimizations: string[];
  topBottlenecks: string[];
}

interface AutoOptimizationResult {
  adjustedCacheSize?: number;
  triggeredWarmup?: boolean;
  improvedParallelization?: boolean;
  optimizedEngineRouting?: boolean;
  [key: string]: unknown;
}

export class PerformanceMonitoringDashboard {
  private static instance: PerformanceMonitoringDashboard;
  
  private metrics: PerformanceMetric[] = [];
  private maxMetricHistory = 10000; // 최대 1만개 기록
  private alerts: Array<{
    type: string;
    message: string;
    timestamp: number;
    severity: 'low' | 'medium' | 'high';
  }> = [];
  
  private config: AlertConfig = {
    responseTimeThreshold: 200, // 200ms 초과 시 알림
    targetRateThreshold: 70, // 70% 미만 시 알림
    memoryThreshold: 100, // 100MB 초과 시 알림
    alertCooldown: 300000, // 5분 쿨다운
  };
  
  private lastAlerts = new Map<string, number>();
  private isMonitoring = false;
  private monitoringInterval: NodeJS.Timeout | null = null;
  
  private constructor() {}
  
  public static getInstance(): PerformanceMonitoringDashboard {
    if (!PerformanceMonitoringDashboard.instance) {
      PerformanceMonitoringDashboard.instance = new PerformanceMonitoringDashboard();
    }
    return PerformanceMonitoringDashboard.instance;
  }
  
  /**
   * 🎯 성능 메트릭 기록
   */
  recordMetric(
    response: QueryResponse & { optimizationInfo?: OptimizationInfo },
    request: QueryRequest,
    actualResponseTime?: number
  ): void {
    const metric: PerformanceMetric = {
      timestamp: Date.now(),
      responseTime: actualResponseTime || response.processingTime || 0,
      targetAchieved: (actualResponseTime || response.processingTime || 0) <= 152,
      cacheType: response.optimizationInfo?.cacheType,
      optimizations: response.optimizationInfo?.optimizationsApplied || [],
      engine: response.engine,
      memoryUsage: this.getCurrentMemoryUsage(),
    };
    
    this.metrics.push(metric);
    
    // 기록 수 제한
    if (this.metrics.length > this.maxMetricHistory) {
      this.metrics = this.metrics.slice(-this.maxMetricHistory);
    }
    
    // 실시간 분석
    this.analyzeRealTimePerformance(metric);
  }
  
  /**
   * 📊 실시간 성능 분석
   */
  private analyzeRealTimePerformance(metric: PerformanceMetric): void {
    // 응답시간 임계값 확인
    if (metric.responseTime > this.config.responseTimeThreshold) {
      this.triggerAlert('response_time', 
        `응답시간 임계값 초과: ${metric.responseTime.toFixed(1)}ms (임계값: ${this.config.responseTimeThreshold}ms)`,
        'medium'
      );
    }
    
    // 메모리 사용량 확인
    if (metric.memoryUsage > this.config.memoryThreshold) {
      this.triggerAlert('memory_usage',
        `메모리 사용량 높음: ${metric.memoryUsage.toFixed(1)}MB (임계값: ${this.config.memoryThreshold}MB)`,
        'high'
      );
    }
    
    // 최근 성능 트렌드 분석 (최근 10개 요청)
    if (this.metrics.length >= 10) {
      const recentMetrics = this.metrics.slice(-10);
      const targetRate = recentMetrics.filter(m => m.targetAchieved).length / recentMetrics.length;
      
      if (targetRate < this.config.targetRateThreshold / 100) {
        this.triggerAlert('target_rate',
          `152ms 목표 달성률 낮음: ${(targetRate * 100).toFixed(1)}% (임계값: ${this.config.targetRateThreshold}%)`,
          'medium'
        );
      }
    }
  }
  
  /**
   * 🚨 알림 발생
   */
  private triggerAlert(type: string, message: string, severity: 'low' | 'medium' | 'high'): void {
    const now = Date.now();
    const lastAlert = this.lastAlerts.get(type) || 0;
    
    // 쿨다운 체크
    if (now - lastAlert < this.config.alertCooldown) {
      return;
    }
    
    this.alerts.push({
      type,
      message,
      timestamp: now,
      severity,
    });
    
    this.lastAlerts.set(type, now);
    
    // 콘솔 출력
    const emoji = severity === 'high' ? '🔴' : severity === 'medium' ? '🟡' : '🟢';
    console.warn(`${emoji} AI 성능 알림 [${type}]: ${message}`);
  }
  
  /**
   * 📈 성능 트렌드 분석
   */
  getPerformanceTrend(period: 'last_5min' | 'last_hour' | 'last_day'): PerformanceTrend {
    const now = Date.now();
    let cutoffTime: number;
    let previousCutoffTime: number;
    
    switch (period) {
      case 'last_5min':
        cutoffTime = now - 5 * 60 * 1000;
        previousCutoffTime = cutoffTime - 5 * 60 * 1000;
        break;
      case 'last_hour':
        cutoffTime = now - 60 * 60 * 1000;
        previousCutoffTime = cutoffTime - 60 * 60 * 1000;
        break;
      case 'last_day':
        cutoffTime = now - 24 * 60 * 60 * 1000;
        previousCutoffTime = cutoffTime - 24 * 60 * 60 * 1000;
        break;
    }
    
    const currentMetrics = this.metrics.filter(m => m.timestamp >= cutoffTime);
    const previousMetrics = this.metrics.filter(
      m => m.timestamp >= previousCutoffTime && m.timestamp < cutoffTime
    );
    
    // 현재 기간 통계
    const avgResponseTime = currentMetrics.length > 0 
      ? currentMetrics.reduce((sum, m) => sum + m.responseTime, 0) / currentMetrics.length
      : 0;
    
    const targetRate = currentMetrics.length > 0
      ? currentMetrics.filter(m => m.targetAchieved).length / currentMetrics.length
      : 0;
    
    // 이전 기간과 비교
    const prevAvgResponseTime = previousMetrics.length > 0
      ? previousMetrics.reduce((sum, m) => sum + m.responseTime, 0) / previousMetrics.length
      : avgResponseTime;
    
    const improvement = prevAvgResponseTime > 0 
      ? ((prevAvgResponseTime - avgResponseTime) / prevAvgResponseTime) * 100
      : 0;
    
    // 병목지점 식별
    const bottlenecks = this.identifyBottlenecks(currentMetrics);
    
    return {
      period,
      averageResponseTime: avgResponseTime,
      targetAchievementRate: targetRate * 100,
      improvement,
      bottlenecks,
    };
  }
  
  /**
   * 🔍 병목지점 자동 식별
   */
  private identifyBottlenecks(metrics: PerformanceMetric[]): string[] {
    const bottlenecks: string[] = [];
    
    if (metrics.length === 0) return bottlenecks;
    
    // 캐시 적중률 낮음
    const cachedCount = metrics.filter(m => m.cacheType !== undefined).length;
    const cacheRate = cachedCount / metrics.length;
    if (cacheRate < 0.5) {
      bottlenecks.push(`캐시 적중률 낮음 (${(cacheRate * 100).toFixed(1)}%)`);
    }
    
    // 높은 응답시간 패턴
    const highLatencyCount = metrics.filter(m => m.responseTime > 200).length;
    if (highLatencyCount > metrics.length * 0.2) {
      bottlenecks.push('응답시간 지연 패턴 발견');
    }
    
    // 메모리 사용량 패턴
    const avgMemory = metrics.reduce((sum, m) => sum + m.memoryUsage, 0) / metrics.length;
    if (avgMemory > 80) {
      bottlenecks.push(`높은 메모리 사용량 (${avgMemory.toFixed(1)}MB)`);
    }
    
    // 최적화 실패 패턴
    const optimizationCounts = new Map<string, number>();
    metrics.forEach(m => {
      m.optimizations.forEach(opt => {
        optimizationCounts.set(opt, (optimizationCounts.get(opt) || 0) + 1);
      });
    });
    
    const failedOptimizations = Array.from(optimizationCounts.entries())
      .filter(([opt, count]) => opt.includes('failed') && count > metrics.length * 0.1)
      .map(([opt]) => opt);
    
    if (failedOptimizations.length > 0) {
      bottlenecks.push(`최적화 실패: ${failedOptimizations.join(', ')}`);
    }
    
    return bottlenecks;
  }
  
  /**
   * 📊 현재 성능 대시보드
   */
  getCurrentDashboard(): {
    summary: {
      totalRequests: number;
      averageResponseTime: number;
      targetAchievementRate: number;
      cacheHitRate: number;
      activeAlerts: number;
    };
    trends: {
      last5min: PerformanceTrend;
      lastHour: PerformanceTrend;
      lastDay: PerformanceTrend;
    };
    recentAlerts: Array<{
      type: string;
      message: string;
      timestamp: number;
      severity: 'low' | 'medium' | 'high';
    }>;
    recommendations: string[];
  } {
    const recentMetrics = this.metrics.slice(-100); // 최근 100개
    
    // 요약 통계
    const summary = {
      totalRequests: this.metrics.length,
      averageResponseTime: recentMetrics.length > 0 
        ? recentMetrics.reduce((sum, m) => sum + m.responseTime, 0) / recentMetrics.length
        : 0,
      targetAchievementRate: recentMetrics.length > 0
        ? recentMetrics.filter(m => m.targetAchieved).length / recentMetrics.length * 100
        : 0,
      cacheHitRate: recentMetrics.length > 0
        ? recentMetrics.filter(m => m.cacheType !== undefined).length / recentMetrics.length * 100
        : 0,
      activeAlerts: this.alerts.filter(a => Date.now() - a.timestamp < 3600000).length, // 1시간 내
    };
    
    // 트렌드 분석
    const trends = {
      last5min: this.getPerformanceTrend('last_5min'),
      lastHour: this.getPerformanceTrend('last_hour'),
      lastDay: this.getPerformanceTrend('last_day'),
    };
    
    // 최근 알림 (최근 24시간)
    const recentAlerts = this.alerts
      .filter(a => Date.now() - a.timestamp < 86400000)
      .slice(-10); // 최근 10개
    
    // 추천사항 생성
    const recommendations = this.generateRecommendations(summary, trends);
    
    return {
      summary,
      trends,
      recentAlerts,
      recommendations,
    };
  }
  
  /**
   * 💡 최적화 추천사항 생성
   */
  private generateRecommendations(
    summary: PerformanceSummary,
    trends: PerformanceTrend[]
  ): string[] {
    const recommendations: string[] = [];
    
    // 응답시간 기반 추천
    if (summary.averageResponseTime > 152) {
      recommendations.push('평균 응답시간이 목표(152ms)를 초과했습니다. 캐싱 전략을 강화하세요.');
    }
    
    // 목표 달성률 기반 추천
    if (summary.targetAchievementRate < 80) {
      recommendations.push('152ms 목표 달성률이 낮습니다. 병렬 처리 최적화를 검토하세요.');
    }
    
    // 캐시 적중률 기반 추천
    if (summary.cacheHitRate < 60) {
      recommendations.push('캐시 적중률이 낮습니다. 예측적 캐싱 알고리즘을 개선하세요.');
    }
    
    // 트렌드 기반 추천
    if (trends.last5min.improvement < -10) {
      recommendations.push('최근 5분간 성능이 저하되었습니다. 시스템 리소스를 확인하세요.');
    }
    
    if (trends.lastHour.bottlenecks.length > 2) {
      recommendations.push('다수의 병목지점이 감지되었습니다. 시스템 최적화가 필요합니다.');
    }
    
    // 알림 기반 추천
    if (summary.activeAlerts > 5) {
      recommendations.push('활성 알림이 많습니다. 근본 원인을 파악하여 해결하세요.');
    }
    
    return recommendations;
  }
  
  /**
   * ⚙️ 자동 최적화 실행
   */
  async runAutoOptimization(): Promise<{
    applied: string[];
    results: AutoOptimizationResult;
  }> {
    const applied: string[] = [];
    
    const dashboard = this.getCurrentDashboard();
    
    // 캐시 적중률 낮을 때 - 캐시 워밍업
    if (dashboard.summary.cacheHitRate < 50) {
      try {
        const engine = getUltraPerformanceAIEngine();
        await this.performCacheWarmup(engine);
        applied.push('cache_warmup');
      } catch (error) {
        console.warn('캐시 워밍업 실패:', error);
      }
    }
    
    // 응답시간 높을 때 - 캐시 크기 증가
    if (dashboard.summary.averageResponseTime > 200) {
      try {
        const engine = getUltraPerformanceAIEngine();
        engine.updateConfiguration({
          predictiveCacheSize: 100, // 크기 증가
          embeddingCacheTimeout: 1800000, // 30분으로 연장
        });
        applied.push('cache_size_increase');
      } catch (error) {
        console.warn('캐시 크기 조정 실패:', error);
      }
    }
    
    // 결과 측정을 위한 벤치마크 실행
    let results = null;
    try {
      const benchmark = getAIPerformanceBenchmark();
      results = await benchmark.validateTargetAchievement(152, 10);
    } catch (error) {
      console.warn('자동 최적화 결과 측정 실패:', error);
    }
    
    return { applied, results };
  }
  
  /**
   * 🔥 캐시 워밍업 실행
   */
  private async performCacheWarmup(engine: ReturnType<typeof getUltraPerformanceAIEngine>): Promise<void> {
    const warmupQueries = [
      '서버 상태 확인',
      'CPU 사용률 분석',
      '메모리 사용량',
      '디스크 용량',
      '네트워크 상태',
      '시스템 건강상태',
      '성능 지표',
      '로그 분석',
      '보안 상태',
      '알림 설정',
    ];
    
    const warmupPromises = warmupQueries.map(async (query) => {
      try {
        await engine.query({
          query,
          mode: 'local',
          options: { timeoutMs: 152, cached: true },
        });
      } catch (error) {
        console.warn(`워밍업 실패 (${query}):`, error);
      }
    });
    
    await Promise.allSettled(warmupPromises);
    console.log('🔥 캐시 워밍업 완료:', warmupQueries.length, '개 쿼리');
  }
  
  /**
   * 📊 메모리 사용량 조회
   */
  private getCurrentMemoryUsage(): number {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      return process.memoryUsage().heapUsed / 1024 / 1024; // MB
    }
    return 0;
  }
  
  /**
   * ▶️ 모니터링 시작
   */
  startMonitoring(intervalMs: number = 30000): void {
    if (this.isMonitoring) {
      console.warn('모니터링이 이미 실행 중입니다.');
      return;
    }
    
    this.isMonitoring = true;
    console.log(`📊 AI 성능 모니터링 시작 (${intervalMs/1000}초 간격)`);
    
    this.monitoringInterval = setInterval(async () => {
      try {
        const dashboard = this.getCurrentDashboard();
        
        // 주요 지표 로그
        console.log('📊 성능 현황:', {
          요청수: dashboard.summary.totalRequests,
          평균응답시간: `${dashboard.summary.averageResponseTime.toFixed(1)}ms`,
          목표달성률: `${dashboard.summary.targetAchievementRate.toFixed(1)}%`,
          캐시적중률: `${dashboard.summary.cacheHitRate.toFixed(1)}%`,
          활성알림: dashboard.summary.activeAlerts,
        });
        
        // 자동 최적화 실행 (필요시)
        if (dashboard.summary.targetAchievementRate < 70 || 
            dashboard.summary.averageResponseTime > 200) {
          console.log('🔧 자동 최적화 실행...');
          const optimization = await this.runAutoOptimization();
          if (optimization.applied.length > 0) {
            console.log('✅ 최적화 적용:', optimization.applied);
          }
        }
        
      } catch (error) {
        console.error('📊 모니터링 오류:', error);
      }
    }, intervalMs);
  }
  
  /**
   * ⏹️ 모니터링 중지
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    this.isMonitoring = false;
    console.log('📊 AI 성능 모니터링 중지');
  }
  
  /**
   * 🧹 데이터 정리
   */
  cleanup(maxAge: number = 86400000): void { // 기본 24시간
    const cutoffTime = Date.now() - maxAge;
    
    // 오래된 메트릭 제거
    this.metrics = this.metrics.filter(m => m.timestamp > cutoffTime);
    
    // 오래된 알림 제거
    this.alerts = this.alerts.filter(a => a.timestamp > cutoffTime);
    
    console.log('🧹 모니터링 데이터 정리 완료');
  }
}

// 싱글톤 접근
export function getPerformanceMonitoringDashboard(): PerformanceMonitoringDashboard {
  return PerformanceMonitoringDashboard.getInstance();
}

// 편의 함수들
export function startPerformanceMonitoring(intervalMs: number = 30000): void {
  const dashboard = getPerformanceMonitoringDashboard();
  dashboard.startMonitoring(intervalMs);
}

export function stopPerformanceMonitoring(): void {
  const dashboard = getPerformanceMonitoringDashboard();
  dashboard.stopMonitoring();
}

export function recordAIPerformance(
  response: QueryResponse & { optimizationInfo?: OptimizationInfo },
  request: QueryRequest,
  actualResponseTime?: number
): void {
  const dashboard = getPerformanceMonitoringDashboard();
  dashboard.recordMetric(response, request, actualResponseTime);
}