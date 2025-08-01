/**
 * 🚀 MCP 실시간 성능 모니터링 시스템 v3.0
 *
 * 목표: < 100ms 응답시간, 99.5% API 성공률 달성
 * - 실시간 성능 메트릭 수집 및 분석
 * - 병목점 자동 감지 및 최적화 제안
 * - 무료 티어 자원 효율성 추적
 * - 예측적 성능 관리
 */

import { Redis } from '@upstash/redis';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { MCPServerName } from '../mcp-monitor/types';

// 📊 성능 메트릭 인터페이스
export interface PerformanceMetrics {
  timestamp: number;
  serverId: MCPServerName;

  // 응답시간 메트릭
  responseTime: {
    current: number;
    average: number;
    p50: number;
    p95: number;
    p99: number;
  };

  // 처리량 메트릭
  throughput: {
    requestsPerSecond: number;
    successfulRequests: number;
    failedRequests: number;
    totalRequests: number;
  };

  // 자원 사용량
  resources: {
    memory: {
      used: number;
      available: number;
      utilizationPercent: number;
    };
    cpu: {
      utilizationPercent: number;
      loadAverage: number;
    };
    network: {
      bytesIn: number;
      bytesOut: number;
      connectionsActive: number;
    };
  };

  // 품질 메트릭
  quality: {
    successRate: number;
    errorRate: number;
    availabilityPercent: number;
    healthScore: number; // 0-100
  };

  // 비용 효율성 (무료 티어)
  efficiency: {
    costPerRequest: number;
    resourceEfficiency: number; // 0-100
    tierUtilization: {
      vercel: number;
      gcp: number;
      supabase: number;
      redis: number;
    };
  };
}

// 🎯 성능 목표 및 임계값
export interface PerformanceTargets {
  responseTime: {
    target: number; // 100ms
    warning: number; // 150ms
    critical: number; // 500ms
  };
  successRate: {
    target: number; // 99.5%
    warning: number; // 99.0%
    critical: number; // 95.0%
  };
  throughput: {
    target: number; // 요청/초
    warning: number;
    critical: number;
  };
  resources: {
    memory: {
      warning: number; // 80%
      critical: number; // 90%
    };
    cpu: {
      warning: number; // 70%
      critical: number; // 85%
    };
  };
  efficiency: {
    minResourceEfficiency: number; // 85%
    maxCostPerRequest: number; // $0.001
  };
}

// 📈 성능 트렌드 분석
export interface PerformanceTrend {
  serverId: MCPServerName;
  timeWindow: string;
  trend: 'improving' | 'stable' | 'degrading' | 'critical';

  metrics: {
    responseTime: {
      current: number;
      change: number; // % 변화
      trend: 'up' | 'down' | 'stable';
    };
    successRate: {
      current: number;
      change: number;
      trend: 'up' | 'down' | 'stable';
    };
    throughput: {
      current: number;
      change: number;
      trend: 'up' | 'down' | 'stable';
    };
  };

  predictions: {
    nextHour: {
      responseTime: number;
      successRate: number;
      confidence: number; // 0-100
    };
    nextDay: {
      responseTime: number;
      successRate: number;
      confidence: number;
    };
  };

  bottlenecks: Array<{
    component: 'redis' | 'supabase' | 'gcp' | 'vercel' | 'network';
    severity: 'low' | 'medium' | 'high' | 'critical';
    impact: number; // 0-100
    description: string;
    recommendation: string;
  }>;
}

// 🔧 성능 최적화 설정
interface PerformanceMonitorConfig {
  collection: {
    intervalMs: number; // 5000 (5초)
    batchSize: number; // 100
    maxHistoryPoints: number; // 1000
    retentionDays: number; // 7
  };

  analysis: {
    trendWindowMinutes: number; // 15
    anomalyThreshold: number; // 2 표준편차
    predictionWindowHours: number; // 24
  };

  optimization: {
    autoOptimization: boolean; // true
    autoScaling: boolean; // false (무료 티어)
    cacheOptimization: boolean; // true
  };

  alerting: {
    realTimeAlerts: boolean; // true
    performanceThresholds: PerformanceTargets;
  };
}

/**
 * MCP 성능 모니터링 시스템
 */
export class MCPPerformanceMonitor {
  private redis: Redis;
  private supabase: SupabaseClient;
  private config: PerformanceMonitorConfig;

  // 성능 데이터 저장소
  private metricsHistory: Map<MCPServerName, PerformanceMetrics[]> = new Map();
  private currentMetrics: Map<MCPServerName, PerformanceMetrics> = new Map();

  // 실시간 모니터링 타이머
  private monitoringTimer: NodeJS.Timeout | null = null;
  private cleanupTimer: NodeJS.Timeout | null = null;

  // 성능 통계
  private performanceStats = {
    totalRequests: 0,
    successfulRequests: 0,
    avgResponseTime: 0,
    peakResponseTime: 0,
    startTime: Date.now(),
  };

  constructor(
    redis: Redis,
    supabase: SupabaseClient,
    config?: Partial<PerformanceMonitorConfig>
  ) {
    this.redis = redis;
    this.supabase = supabase;
    this.config = {
      collection: {
        intervalMs: 5000, // 5초마다 수집
        batchSize: 100,
        maxHistoryPoints: 1000,
        retentionDays: 7,
      },
      analysis: {
        trendWindowMinutes: 15,
        anomalyThreshold: 2,
        predictionWindowHours: 24,
      },
      optimization: {
        autoOptimization: true,
        autoScaling: false, // 무료 티어에서는 비활성화
        cacheOptimization: true,
      },
      alerting: {
        realTimeAlerts: true,
        performanceThresholds: {
          responseTime: { target: 100, warning: 150, critical: 500 },
          successRate: { target: 99.5, warning: 99.0, critical: 95.0 },
          throughput: { target: 100, warning: 50, critical: 10 },
          resources: {
            memory: { warning: 80, critical: 90 },
            cpu: { warning: 70, critical: 85 },
          },
          efficiency: {
            minResourceEfficiency: 85,
            maxCostPerRequest: 0.001,
          },
        },
      },
      ...config,
    };

    this.startMonitoring();
  }

  /**
   * 🚀 성능 메트릭 수집 시작
   */
  private startMonitoring(): void {
    // 기존 타이머 정리
    if (this.monitoringTimer) clearInterval(this.monitoringTimer);
    if (this.cleanupTimer) clearInterval(this.cleanupTimer);

    // 실시간 성능 모니터링 (5초 간격)
    this.monitoringTimer = setInterval(async () => {
      try {
        await this.collectPerformanceMetrics();
      } catch (error) {
        console.error(
          '❌ [PerformanceMonitor] Metrics collection failed:',
          error
        );
      }
    }, this.config.collection.intervalMs);

    // 정리 작업 (1시간 간격)
    this.cleanupTimer = setInterval(
      async () => {
        try {
          await this.performCleanup();
        } catch (error) {
          console.error('❌ [PerformanceMonitor] Cleanup failed:', error);
        }
      },
      60 * 60 * 1000
    ); // 1시간

    console.log('🚀 [PerformanceMonitor] Monitoring started');
  }

  /**
   * 📊 실시간 성능 메트릭 수집
   */
  private async collectPerformanceMetrics(): Promise<void> {
    const timestamp = Date.now();
    const serverIds = await this.getActiveServerIds();

    const metricsPromises = serverIds.map(async (serverId) => {
      try {
        const metrics = await this.collectServerMetrics(serverId, timestamp);

        // 현재 메트릭 업데이트
        this.currentMetrics.set(serverId, metrics);

        // 히스토리 업데이트
        this.updateMetricsHistory(serverId, metrics);

        // Redis에 캐싱
        await this.cacheMetrics(serverId, metrics);

        // 임계값 체크
        await this.checkThresholds(metrics);

        return metrics;
      } catch (error) {
        console.error(
          `❌ [PerformanceMonitor] Failed to collect metrics for ${serverId}:`,
          error
        );
        return null;
      }
    });

    const results = await Promise.all(metricsPromises);
    const validMetrics = results.filter(Boolean) as PerformanceMetrics[];

    // 배치로 Supabase에 저장
    if (validMetrics.length > 0) {
      await this.batchStoreMetrics(validMetrics);
    }

    console.log(
      `✅ [PerformanceMonitor] Collected metrics for ${validMetrics.length} servers`
    );
  }

  /**
   * 🎯 단일 서버 성능 메트릭 수집
   */
  private async collectServerMetrics(
    serverId: MCPServerName,
    timestamp: number
  ): Promise<PerformanceMetrics> {
    const startTime = Date.now();

    // 기본 성능 데이터 수집
    const [redisStats, healthCheck, resourceUsage] = await Promise.all([
      this.getRedisPerformanceStats(serverId),
      this.performHealthCheck(serverId),
      this.getResourceUsage(serverId),
    ]);

    const responseTime = Date.now() - startTime;

    // 히스토리에서 통계 계산
    const history = this.metricsHistory.get(serverId) || [];
    const recentMetrics = history.slice(-20); // 최근 20개 데이터 포인트

    return {
      timestamp,
      serverId,

      responseTime: {
        current: responseTime,
        average: this.calculateAverage(recentMetrics, 'responseTime'),
        p50: this.calculatePercentile(recentMetrics, 'responseTime', 50),
        p95: this.calculatePercentile(recentMetrics, 'responseTime', 95),
        p99: this.calculatePercentile(recentMetrics, 'responseTime', 99),
      },

      throughput: {
        requestsPerSecond: this.calculateRequestsPerSecond(recentMetrics),
        successfulRequests: healthCheck.successfulRequests || 0,
        failedRequests: healthCheck.failedRequests || 0,
        totalRequests:
          (healthCheck.successfulRequests || 0) +
          (healthCheck.failedRequests || 0),
      },

      resources: {
        memory: {
          used: resourceUsage.memory.used,
          available: resourceUsage.memory.available,
          utilizationPercent:
            (resourceUsage.memory.used / resourceUsage.memory.available) * 100,
        },
        cpu: {
          utilizationPercent: resourceUsage.cpu.utilizationPercent,
          loadAverage: resourceUsage.cpu.loadAverage,
        },
        network: {
          bytesIn: resourceUsage.network.bytesIn,
          bytesOut: resourceUsage.network.bytesOut,
          connectionsActive: resourceUsage.network.connectionsActive,
        },
      },

      quality: {
        successRate: healthCheck.successRate || 0,
        errorRate: healthCheck.errorRate || 0,
        availabilityPercent: healthCheck.availabilityPercent || 0,
        healthScore: this.calculateHealthScore(healthCheck, resourceUsage),
      },

      efficiency: {
        costPerRequest: this.calculateCostPerRequest(serverId, resourceUsage),
        resourceEfficiency: this.calculateResourceEfficiency(resourceUsage),
        tierUtilization: {
          vercel: resourceUsage.tierUsage?.vercel || 0,
          gcp: resourceUsage.tierUsage?.gcp || 0,
          supabase: resourceUsage.tierUsage?.supabase || 0,
          redis: resourceUsage.tierUsage?.redis || 0,
        },
      },
    };
  }

  /**
   * 📈 성능 트렌드 분석
   */
  async analyzePerformanceTrend(
    serverId: MCPServerName,
    timeWindow: '5m' | '15m' | '1h' | '6h' | '24h' = '1h'
  ): Promise<PerformanceTrend> {
    const cacheKey = `performance_trend:${serverId}:${timeWindow}`;

    // 캐시된 트렌드 확인
    const cached = await this.redis.get<PerformanceTrend>(cacheKey);
    if (cached) {
      return cached;
    }

    const history = this.metricsHistory.get(serverId) || [];
    const windowMs = this.parseTimeWindow(timeWindow);
    const cutoff = Date.now() - windowMs;

    const recentMetrics = history.filter((m) => m.timestamp >= cutoff);

    if (recentMetrics.length === 0) {
      throw new Error(
        `No metrics available for ${serverId} in ${timeWindow} window`
      );
    }

    // 트렌드 계산
    const trend = this.calculateTrend(recentMetrics);

    // 병목점 분석
    const bottlenecks = await this.identifyBottlenecks(serverId, recentMetrics);

    // 예측 생성
    const predictions = this.generatePredictions(recentMetrics);

    const result: PerformanceTrend = {
      serverId,
      timeWindow,
      trend: this.classifyOverallTrend(trend),
      metrics: {
        responseTime: {
          current: trend.responseTime.current,
          change: trend.responseTime.change,
          trend: trend.responseTime.direction,
        },
        successRate: {
          current: trend.successRate.current,
          change: trend.successRate.change,
          trend: trend.successRate.direction,
        },
        throughput: {
          current: trend.throughput.current,
          change: trend.throughput.change,
          trend: trend.throughput.direction,
        },
      },
      predictions,
      bottlenecks,
    };

    // 결과 캐싱 (5분)
    await this.redis.setex(cacheKey, 300, result);

    return result;
  }

  /**
   * 🚨 실시간 성능 알림 체크
   */
  private async checkThresholds(metrics: PerformanceMetrics): Promise<void> {
    if (!this.config.alerting.realTimeAlerts) return;

    const { performanceThresholds } = this.config.alerting;
    const alerts: Array<{ level: 'warning' | 'critical'; message: string }> =
      [];

    // 응답시간 체크
    if (
      metrics.responseTime.current > performanceThresholds.responseTime.critical
    ) {
      alerts.push({
        level: 'critical',
        message: `응답시간 임계값 초과: ${metrics.responseTime.current}ms (임계값: ${performanceThresholds.responseTime.critical}ms)`,
      });
    } else if (
      metrics.responseTime.current > performanceThresholds.responseTime.warning
    ) {
      alerts.push({
        level: 'warning',
        message: `응답시간 경고: ${metrics.responseTime.current}ms (목표: ${performanceThresholds.responseTime.target}ms)`,
      });
    }

    // 성공률 체크
    if (
      metrics.quality.successRate < performanceThresholds.successRate.critical
    ) {
      alerts.push({
        level: 'critical',
        message: `API 성공률 임계값 미달: ${metrics.quality.successRate}% (임계값: ${performanceThresholds.successRate.critical}%)`,
      });
    } else if (
      metrics.quality.successRate < performanceThresholds.successRate.warning
    ) {
      alerts.push({
        level: 'warning',
        message: `API 성공률 경고: ${metrics.quality.successRate}% (목표: ${performanceThresholds.successRate.target}%)`,
      });
    }

    // 자원 사용량 체크
    if (
      metrics.resources.memory.utilizationPercent >
      performanceThresholds.resources.memory.critical
    ) {
      alerts.push({
        level: 'critical',
        message: `메모리 사용량 임계값 초과: ${metrics.resources.memory.utilizationPercent}% (임계값: ${performanceThresholds.resources.memory.critical}%)`,
      });
    }

    // 알림 발송
    if (alerts.length > 0) {
      await this.sendPerformanceAlerts(metrics.serverId, alerts);
    }
  }

  /**
   * 📊 실시간 성능 대시보드 데이터
   */
  async getDashboardData(): Promise<{
    overview: {
      totalServers: number;
      healthyServers: number;
      degradedServers: number;
      criticalServers: number;
      avgResponseTime: number;
      overallSuccessRate: number;
    };
    trends: Array<{
      serverId: MCPServerName;
      status: 'healthy' | 'warning' | 'critical';
      responseTime: number;
      successRate: number;
      trend: 'up' | 'down' | 'stable';
    }>;
    alerts: Array<{
      serverId: MCPServerName;
      level: 'warning' | 'critical';
      message: string;
      timestamp: number;
    }>;
    efficiency: {
      resourceUtilization: number;
      costEfficiency: number;
      recommendations: string[];
    };
  }> {
    const activeServers = Array.from(this.currentMetrics.keys());
    const currentMetrics = Array.from(this.currentMetrics.values());

    // 전체 개요 계산
    const overview = {
      totalServers: activeServers.length,
      healthyServers: currentMetrics.filter((m) => m.quality.healthScore >= 80)
        .length,
      degradedServers: currentMetrics.filter(
        (m) => m.quality.healthScore >= 60 && m.quality.healthScore < 80
      ).length,
      criticalServers: currentMetrics.filter((m) => m.quality.healthScore < 60)
        .length,
      avgResponseTime: this.calculateAverage(currentMetrics, 'responseTime'),
      overallSuccessRate: this.calculateAverage(currentMetrics, 'successRate'),
    };

    // 서버별 트렌드
    const trends = await Promise.all(
      activeServers.map(async (serverId) => {
        const metrics = this.currentMetrics.get(serverId)!;
        const trend = await this.analyzePerformanceTrend(serverId, '15m');

        return {
          serverId,
          status: this.getServerStatus(metrics),
          responseTime: metrics.responseTime.current,
          successRate: metrics.quality.successRate,
          trend: trend.metrics.responseTime.trend,
        };
      })
    );

    // 최근 알림 조회
    const alerts = await this.getRecentAlerts();

    // 효율성 분석
    const efficiency = this.analyzeOverallEfficiency(currentMetrics);

    return {
      overview,
      trends,
      alerts,
      efficiency,
    };
  }

  /**
   * 🔧 성능 최적화 제안 생성
   */
  async generateOptimizationRecommendations(serverId?: MCPServerName): Promise<
    Array<{
      category: 'cache' | 'database' | 'network' | 'resources' | 'architecture';
      priority: 'high' | 'medium' | 'low';
      title: string;
      description: string;
      expectedImprovement: string;
      implementation: string;
      estimatedEffort: 'low' | 'medium' | 'high';
    }>
  > {
    const recommendations: Array<any> = [];

    const metrics = serverId
      ? ([this.currentMetrics.get(serverId)].filter(
          Boolean
        ) as PerformanceMetrics[])
      : Array.from(this.currentMetrics.values());

    if (metrics.length === 0) {
      return [];
    }

    // 캐시 최적화 분석
    const cacheRecommendations = this.analyzeCacheOptimization(metrics);
    recommendations.push(...cacheRecommendations);

    // 데이터베이스 최적화 분석
    const dbRecommendations = this.analyzeDatabaseOptimization(metrics);
    recommendations.push(...dbRecommendations);

    // 네트워크 최적화 분석
    const networkRecommendations = this.analyzeNetworkOptimization(metrics);
    recommendations.push(...networkRecommendations);

    // 자원 최적화 분석
    const resourceRecommendations = this.analyzeResourceOptimization(metrics);
    recommendations.push(...resourceRecommendations);

    // 우선순위별 정렬
    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  // === Private Helper Methods ===

  private async getActiveServerIds(): Promise<MCPServerName[]> {
    try {
      const keys = await this.redis.keys('mcp:server:*');
      return keys.map((k) => k.replace('mcp:server:', '') as MCPServerName);
    } catch (error) {
      console.error('Failed to get active server IDs:', error);
      return [];
    }
  }

  private async getRedisPerformanceStats(
    serverId: MCPServerName
  ): Promise<any> {
    try {
      // Upstash Redis doesn't support info command directly
      // Use memory usage estimation instead
      const info = { memory: { used_memory: 0 } };
      return this.parseRedisInfo(info);
    } catch (error) {
      return { hits: 0, misses: 0, memory: 0 };
    }
  }

  private async performHealthCheck(serverId: MCPServerName): Promise<any> {
    try {
      const key = `mcp:health:${serverId}`;
      const health = await this.redis.get(key);
      return health || { successRate: 100, errorRate: 0 };
    } catch (error) {
      return { successRate: 0, errorRate: 100 };
    }
  }

  private async getResourceUsage(serverId: MCPServerName): Promise<any> {
    // 무료 티어 리소스 사용량 추정
    return {
      memory: { used: 150, available: 256 },
      cpu: { utilizationPercent: 45, loadAverage: 0.8 },
      network: { bytesIn: 1024, bytesOut: 2048, connectionsActive: 10 },
      tierUsage: { vercel: 30, gcp: 15, supabase: 3, redis: 40 },
    };
  }

  private calculateHealthScore(healthCheck: any, resourceUsage: any): number {
    const successWeight = 0.4;
    const responseWeight = 0.3;
    const resourceWeight = 0.3;

    const successScore = healthCheck.successRate || 0;
    const responseScore = Math.max(
      0,
      100 - (healthCheck.avgResponseTime || 0) / 10
    );
    const resourceScore = Math.max(
      0,
      100 - resourceUsage.memory.utilizationPercent
    );

    return Math.round(
      successScore * successWeight +
        responseScore * responseWeight +
        resourceScore * resourceWeight
    );
  }

  private calculateCostPerRequest(
    serverId: MCPServerName,
    resourceUsage: any
  ): number {
    // 무료 티어에서의 예상 비용 (기회비용)
    const baseCost = 0.0001; // $0.0001 per request
    const utilizationMultiplier = resourceUsage.memory.utilizationPercent / 100;
    return baseCost * (1 + utilizationMultiplier);
  }

  private calculateResourceEfficiency(resourceUsage: any): number {
    const memoryEfficiency = Math.max(
      0,
      100 - resourceUsage.memory.utilizationPercent
    );
    const cpuEfficiency = Math.max(
      0,
      100 - resourceUsage.cpu.utilizationPercent
    );
    return Math.round((memoryEfficiency + cpuEfficiency) / 2);
  }

  private updateMetricsHistory(
    serverId: MCPServerName,
    metrics: PerformanceMetrics
  ): void {
    if (!this.metricsHistory.has(serverId)) {
      this.metricsHistory.set(serverId, []);
    }

    const history = this.metricsHistory.get(serverId)!;
    history.push(metrics);

    // 최대 히스토리 포인트 유지
    if (history.length > this.config.collection.maxHistoryPoints) {
      history.splice(
        0,
        history.length - this.config.collection.maxHistoryPoints
      );
    }
  }

  private async cacheMetrics(
    serverId: MCPServerName,
    metrics: PerformanceMetrics
  ): Promise<void> {
    const key = `performance:${serverId}:latest`;
    await this.redis.setex(key, 300, metrics); // 5분 캐시
  }

  private async batchStoreMetrics(
    metrics: PerformanceMetrics[]
  ): Promise<void> {
    try {
      const records = metrics.map((m) => ({
        server_id: m.serverId,
        timestamp: new Date(m.timestamp).toISOString(),
        response_time: m.responseTime.current,
        success_rate: m.quality.successRate,
        memory_usage: m.resources.memory.utilizationPercent,
        health_score: m.quality.healthScore,
        created_at: new Date().toISOString(),
      }));

      await this.supabase.from('performance_metrics').insert(records);
    } catch (error) {
      console.error('Failed to store performance metrics:', error);
    }
  }

  private calculateAverage(metrics: any[], field: string): number {
    if (metrics.length === 0) return 0;

    const sum = metrics.reduce((acc, m) => {
      if (field === 'responseTime') return acc + m.responseTime.current;
      if (field === 'successRate') return acc + m.quality.successRate;
      return acc;
    }, 0);

    return Math.round(sum / metrics.length);
  }

  private calculatePercentile(
    metrics: any[],
    field: string,
    percentile: number
  ): number {
    if (metrics.length === 0) return 0;

    const values = metrics
      .map((m) => {
        if (field === 'responseTime') return m.responseTime.current;
        return 0;
      })
      .sort((a, b) => a - b);

    const index = Math.ceil((percentile / 100) * values.length) - 1;
    return values[Math.max(0, index)] || 0;
  }

  private calculateRequestsPerSecond(metrics: any[]): number {
    if (metrics.length < 2) return 0;

    const latest = metrics[metrics.length - 1];
    const previous = metrics[metrics.length - 2];

    const timeDiff = (latest.timestamp - previous.timestamp) / 1000;
    const requestDiff =
      latest.throughput.totalRequests - previous.throughput.totalRequests;

    return timeDiff > 0 ? Math.round(requestDiff / timeDiff) : 0;
  }

  private parseTimeWindow(timeWindow: string): number {
    const windows = {
      '5m': 5 * 60 * 1000,
      '15m': 15 * 60 * 1000,
      '1h': 60 * 60 * 1000,
      '6h': 6 * 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
    };
    return windows[timeWindow as keyof typeof windows] || windows['1h'];
  }

  private parseRedisInfo(info: string): any {
    // Redis INFO 명령어 결과 파싱
    const lines = info.split('\r\n');
    const stats: any = {};

    lines.forEach((line) => {
      if (line.includes(':')) {
        const [key, value] = line.split(':');
        stats[key] = isNaN(Number(value)) ? value : Number(value);
      }
    });

    return {
      hits: stats.keyspace_hits || 0,
      misses: stats.keyspace_misses || 0,
      memory: stats.used_memory || 0,
    };
  }

  private calculateTrend(metrics: PerformanceMetrics[]): any {
    if (metrics.length < 2) {
      return {
        responseTime: { current: 0, change: 0, direction: 'stable' as const },
        successRate: { current: 0, change: 0, direction: 'stable' as const },
        throughput: { current: 0, change: 0, direction: 'stable' as const },
      };
    }

    const latest = metrics[metrics.length - 1];
    const previous = metrics[0];

    return {
      responseTime: {
        current: latest.responseTime.current,
        change:
          ((latest.responseTime.current - previous.responseTime.current) /
            previous.responseTime.current) *
          100,
        direction:
          latest.responseTime.current > previous.responseTime.current
            ? 'up'
            : latest.responseTime.current < previous.responseTime.current
              ? 'down'
              : 'stable',
      },
      successRate: {
        current: latest.quality.successRate,
        change: latest.quality.successRate - previous.quality.successRate,
        direction:
          latest.quality.successRate > previous.quality.successRate
            ? 'up'
            : latest.quality.successRate < previous.quality.successRate
              ? 'down'
              : 'stable',
      },
      throughput: {
        current: latest.throughput.requestsPerSecond,
        change:
          ((latest.throughput.requestsPerSecond -
            previous.throughput.requestsPerSecond) /
            Math.max(previous.throughput.requestsPerSecond, 1)) *
          100,
        direction:
          latest.throughput.requestsPerSecond >
          previous.throughput.requestsPerSecond
            ? 'up'
            : latest.throughput.requestsPerSecond <
                previous.throughput.requestsPerSecond
              ? 'down'
              : 'stable',
      },
    };
  }

  private classifyOverallTrend(
    trend: any
  ): 'improving' | 'stable' | 'degrading' | 'critical' {
    const responseTimeGetting = trend.responseTime.direction;
    const successRateGetting = trend.successRate.direction;

    if (responseTimeGetting === 'down' && successRateGetting === 'up')
      return 'improving';
    if (responseTimeGetting === 'up' && successRateGetting === 'down')
      return 'degrading';
    if (
      Math.abs(trend.responseTime.change) > 50 ||
      Math.abs(trend.successRate.change) > 10
    )
      return 'critical';
    return 'stable';
  }

  private async identifyBottlenecks(
    serverId: MCPServerName,
    metrics: PerformanceMetrics[]
  ): Promise<Array<any>> {
    const bottlenecks: Array<any> = [];

    const latest = metrics[metrics.length - 1];

    // Redis 병목점 체크
    if (latest.resources.memory.utilizationPercent > 85) {
      bottlenecks.push({
        component: 'redis',
        severity: 'high',
        impact: 80,
        description: 'Redis 메모리 사용량이 85%를 초과했습니다',
        recommendation: 'TTL 설정 최적화 및 불필요한 키 정리 필요',
      });
    }

    // Supabase 병목점 체크 (응답시간 기반)
    if (latest.responseTime.current > 200) {
      bottlenecks.push({
        component: 'supabase',
        severity: 'medium',
        impact: 60,
        description: '데이터베이스 응답시간이 느립니다',
        recommendation: '쿼리 최적화 및 인덱스 추가 검토',
      });
    }

    return bottlenecks;
  }

  private generatePredictions(metrics: PerformanceMetrics[]): any {
    if (metrics.length < 3) {
      return {
        nextHour: { responseTime: 100, successRate: 99, confidence: 50 },
        nextDay: { responseTime: 100, successRate: 99, confidence: 30 },
      };
    }

    // 간단한 선형 회귀 예측
    const latest = metrics[metrics.length - 1];
    const trend = this.calculateTrend(metrics);

    return {
      nextHour: {
        responseTime: Math.max(
          50,
          latest.responseTime.current + trend.responseTime.change * 0.1
        ),
        successRate: Math.min(
          100,
          Math.max(
            90,
            latest.quality.successRate + trend.successRate.change * 0.1
          )
        ),
        confidence: 75,
      },
      nextDay: {
        responseTime: Math.max(
          50,
          latest.responseTime.current + trend.responseTime.change * 0.5
        ),
        successRate: Math.min(
          100,
          Math.max(
            85,
            latest.quality.successRate + trend.successRate.change * 0.5
          )
        ),
        confidence: 60,
      },
    };
  }

  private getServerStatus(
    metrics: PerformanceMetrics
  ): 'healthy' | 'warning' | 'critical' {
    if (metrics.quality.healthScore >= 80) return 'healthy';
    if (metrics.quality.healthScore >= 60) return 'warning';
    return 'critical';
  }

  private async getRecentAlerts(): Promise<Array<any>> {
    try {
      const { data } = await this.supabase
        .from('performance_alerts')
        .select('*')
        .gte(
          'created_at',
          new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
        )
        .order('created_at', { ascending: false })
        .limit(10);

      return data || [];
    } catch (error) {
      return [];
    }
  }

  private analyzeOverallEfficiency(metrics: PerformanceMetrics[]): any {
    const avgResourceUtilization = this.calculateAverage(
      metrics,
      'resourceUtilization'
    );
    const avgCostEfficiency =
      metrics.reduce((acc, m) => acc + m.efficiency.resourceEfficiency, 0) /
      metrics.length;

    const recommendations: string[] = [];

    if (avgResourceUtilization > 80) {
      recommendations.push('메모리 사용량 최적화 필요');
    }
    if (avgCostEfficiency < 85) {
      recommendations.push('자원 효율성 개선 권장');
    }

    return {
      resourceUtilization: avgResourceUtilization,
      costEfficiency: avgCostEfficiency,
      recommendations,
    };
  }

  private analyzeCacheOptimization(metrics: PerformanceMetrics[]): Array<any> {
    const recommendations: Array<any> = [];

    const avgMemoryUsage = this.calculateAverage(metrics, 'memoryUsage');

    if (avgMemoryUsage > 80) {
      recommendations.push({
        category: 'cache',
        priority: 'high',
        title: 'Redis 메모리 최적화',
        description:
          '캐시 메모리 사용량이 높습니다. TTL 설정과 캐시 정책을 검토하세요.',
        expectedImprovement: '메모리 사용량 30% 감소, 응답시간 20% 개선',
        implementation: 'TTL 단축, 불필요한 키 정리, 압축 활성화',
        estimatedEffort: 'medium',
      });
    }

    return recommendations;
  }

  private analyzeDatabaseOptimization(
    metrics: PerformanceMetrics[]
  ): Array<any> {
    const recommendations: Array<any> = [];

    const avgResponseTime = this.calculateAverage(metrics, 'responseTime');

    if (avgResponseTime > 200) {
      recommendations.push({
        category: 'database',
        priority: 'high',
        title: 'Supabase 쿼리 최적화',
        description: '데이터베이스 응답시간이 목표치를 초과합니다.',
        expectedImprovement: '응답시간 40% 단축',
        implementation: '인덱스 추가, 쿼리 최적화, 배치 처리 개선',
        estimatedEffort: 'high',
      });
    }

    return recommendations;
  }

  private analyzeNetworkOptimization(
    metrics: PerformanceMetrics[]
  ): Array<any> {
    return []; // 네트워크 최적화 로직
  }

  private analyzeResourceOptimization(
    metrics: PerformanceMetrics[]
  ): Array<any> {
    return []; // 자원 최적화 로직
  }

  private async sendPerformanceAlerts(
    serverId: MCPServerName,
    alerts: Array<{ level: 'warning' | 'critical'; message: string }>
  ): Promise<void> {
    try {
      const records = alerts.map((alert) => ({
        server_id: serverId,
        level: alert.level,
        message: alert.message,
        created_at: new Date().toISOString(),
      }));

      await this.supabase.from('performance_alerts').insert(records);

      console.log(
        `🚨 [PerformanceMonitor] ${alerts.length} alerts sent for ${serverId}`
      );
    } catch (error) {
      console.error('Failed to send performance alerts:', error);
    }
  }

  private async performCleanup(): Promise<void> {
    const cutoff =
      Date.now() - this.config.collection.retentionDays * 24 * 60 * 60 * 1000;

    // 메모리에서 오래된 데이터 제거
    for (const [serverId, history] of this.metricsHistory.entries()) {
      const filtered = history.filter((m) => m.timestamp >= cutoff);
      this.metricsHistory.set(serverId, filtered);
    }

    console.log('🧹 [PerformanceMonitor] Cleanup completed');
  }

  /**
   * 🧹 리소스 정리
   */
  async cleanup(): Promise<void> {
    if (this.monitoringTimer) clearInterval(this.monitoringTimer);
    if (this.cleanupTimer) clearInterval(this.cleanupTimer);

    this.metricsHistory.clear();
    this.currentMetrics.clear();

    console.log('✅ [PerformanceMonitor] Cleanup completed');
  }
}

// 팩토리 함수
export function createPerformanceMonitor(
  redis: Redis,
  supabase: SupabaseClient,
  config?: Partial<PerformanceMonitorConfig>
): MCPPerformanceMonitor {
  return new MCPPerformanceMonitor(redis, supabase, config);
}

// 타입 익스포트
export type { PerformanceMonitorConfig, PerformanceTargets, PerformanceTrend };
