/**
 * 🎯 MCP 실시간 모니터링 시스템 데모 통합 예시
 *
 * 실제 운영 환경에서의 사용법과 성능 테스트
 * - Redis + Supabase 통합 워크플로우
 * - 실시간 메트릭 수집 및 분석
 * - 성능 최적화 데모
 */

import { Redis } from '@upstash/redis';
import { createClient } from '@supabase/supabase-js';
import { createMCPRealtimeManager } from './index';
import type {
  MCPServerMetrics,
  HealthCheckResult,
  MonitoringEvent,
  MCPServerName,
} from '../mcp-monitor/types';

// 🚀 데모 설정
const DEMO_CONFIG = {
  // 테스트 서버 목록
  testServers: [
    'filesystem',
    'github',
    'supabase',
    'memory',
    'playwright',
  ] as MCPServerName[],

  // 시뮬레이션 설정
  simulation: {
    durationMinutes: 5,
    metricsIntervalSeconds: 15,
    eventProbability: 0.1,
    anomalyProbability: 0.05,
  },

  // 성능 목표
  performanceTargets: {
    cacheHitRate: 80,
    avgResponseTime: 150,
    maxMemoryUsage: 180,
    maxStorageUsage: 100,
  },
};

/**
 * 🎲 메트릭 시뮬레이터
 */
class MCPMetricsSimulator {
  private baselineMetrics: Map<MCPServerName, Partial<MCPServerMetrics>> =
    new Map();

  constructor() {
    this.initializeBaselines();
  }

  /**
   * 🎯 랜덤 메트릭 생성
   */
  generateMetrics(
    serverId: MCPServerName,
    timestamp: number
  ): MCPServerMetrics {
    const baseline = this.baselineMetrics.get(serverId) || {};

    // 기본 메트릭에 변동성 추가
    const responseTime = this.addVariation(baseline.responseTime || 100, 0.3);
    const successRate = this.addVariation(
      baseline.successRate || 95,
      0.1,
      80,
      100
    );
    const errorRate = Math.max(0, 100 - successRate);

    // 이상 징후 시뮬레이션
    const hasAnomaly =
      Math.random() < DEMO_CONFIG.simulation.anomalyProbability;

    return {
      serverId,
      timestamp,
      status: this.generateStatus(successRate, hasAnomaly),
      responseTime: hasAnomaly ? responseTime * 3 : responseTime,
      successRate: hasAnomaly ? Math.max(50, successRate - 30) : successRate,
      errorRate: hasAnomaly ? Math.min(50, errorRate + 30) : errorRate,
      requestCount: this.addVariation(100, 0.5, 10, 500),
      errorCount: Math.round((hasAnomaly ? errorRate + 30 : errorRate) * 0.1),
      uptime: Date.now() - Math.random() * 86400000, // 최대 24시간
      memoryUsage: hasAnomaly
        ? this.addVariation(80, 0.5, 60, 100)
        : this.addVariation(45, 0.3, 20, 70),
      circuitBreakerState:
        hasAnomaly && Math.random() < 0.3 ? 'open' : 'closed',
      lastError: hasAnomaly ? this.generateRandomError() : undefined,
    };
  }

  /**
   * 🏥 헬스체크 결과 생성
   */
  generateHealthCheck(
    serverId: MCPServerName,
    timestamp: number
  ): HealthCheckResult {
    const isHealthy = Math.random() > 0.1; // 90% 성공률

    return {
      serverId,
      timestamp,
      success: isHealthy,
      responseTime: isHealthy
        ? this.addVariation(50, 0.4, 10, 200)
        : this.addVariation(2000, 0.5, 1000, 5000),
      error: isHealthy ? undefined : this.generateRandomError(),
      metadata: {
        version: '1.0.0',
        capabilities: ['read', 'write', 'list'],
        connectionPool: this.addVariation(5, 0.3, 1, 10),
      },
    };
  }

  /**
   * 📢 모니터링 이벤트 생성
   */
  generateEvent(
    serverId: MCPServerName,
    timestamp: number
  ): MonitoringEvent | null {
    if (Math.random() > DEMO_CONFIG.simulation.eventProbability) {
      return null; // 이벤트 없음
    }

    const eventTypes = [
      'status_change',
      'performance_degradation',
      'recovery',
      'circuit_breaker',
    ] as const;
    const severities = ['info', 'warning', 'error', 'critical'] as const;

    const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
    const severity = severities[Math.floor(Math.random() * severities.length)];

    return {
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      serverId,
      type: eventType,
      severity,
      message: this.generateEventMessage(eventType, severity),
      timestamp,
      metadata: {
        source: 'simulator',
        category: 'performance',
        details: `Event generated for ${serverId}`,
      },
    };
  }

  /**
   * 🔧 Private: 기준값 초기화
   */
  private initializeBaselines(): void {
    DEMO_CONFIG.testServers.forEach((serverId) => {
      this.baselineMetrics.set(serverId, {
        responseTime: 80 + Math.random() * 100, // 80-180ms
        successRate: 90 + Math.random() * 10, // 90-100%
        requestCount: 50 + Math.random() * 100, // 50-150 requests
      });
    });
  }

  /**
   * 🔧 Private: 변동성 추가
   */
  private addVariation(
    base: number,
    variation: number,
    min?: number,
    max?: number
  ): number {
    const change = base * variation * (Math.random() - 0.5) * 2;
    let result = Math.round(base + change);

    if (min !== undefined) result = Math.max(min, result);
    if (max !== undefined) result = Math.min(max, result);

    return result;
  }

  /**
   * 🔧 Private: 상태 생성
   */
  private generateStatus(
    successRate: number,
    hasAnomaly: boolean
  ): 'connected' | 'disconnected' | 'degraded' {
    if (hasAnomaly && Math.random() < 0.2) return 'disconnected';
    if (successRate < 80) return 'degraded';
    return 'connected';
  }

  /**
   * 🔧 Private: 랜덤 에러 생성
   */
  private generateRandomError(): string {
    const errors = [
      'Connection timeout',
      'Server overloaded',
      'Rate limit exceeded',
      'Authentication failed',
      'Network unreachable',
      'Service unavailable',
      'Internal server error',
      'Request validation failed',
    ];

    return errors[Math.floor(Math.random() * errors.length)];
  }

  /**
   * 🔧 Private: 이벤트 메시지 생성
   */
  private generateEventMessage(type: string, severity: string): string {
    const messages = {
      status_change: [
        'Server status changed to degraded',
        'Connection restored after outage',
        'Server went offline unexpectedly',
      ],
      performance_degradation: [
        'Response time increased significantly',
        'Error rate above threshold',
        'Memory usage critically high',
      ],
      recovery: [
        'Service recovered from failure',
        'Performance metrics normalized',
        'Connection stability restored',
      ],
      circuit_breaker: [
        'Circuit breaker opened due to failures',
        'Circuit breaker reset after recovery',
        'Circuit breaker in half-open state',
      ],
    };

    const typeMessages = messages[type as keyof typeof messages] || [
      'Unknown event occurred',
    ];
    return `[${severity.toUpperCase()}] ${typeMessages[Math.floor(Math.random() * typeMessages.length)]}`;
  }
}

/**
 * 📊 성능 분석기
 */
class PerformanceAnalyzer {
  private metrics: Array<{
    timestamp: number;
    operation: string;
    duration: number;
    success: boolean;
    cacheHit?: boolean;
  }> = [];

  /**
   * 📝 메트릭 기록
   */
  recordMetric(
    operation: string,
    duration: number,
    success: boolean,
    cacheHit?: boolean
  ): void {
    this.metrics.push({
      timestamp: Date.now(),
      operation,
      duration,
      success,
      cacheHit,
    });

    // 최근 1000개 메트릭만 유지
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }
  }

  /**
   * 📈 성능 분석 결과 생성
   */
  generateReport(): {
    summary: {
      totalOperations: number;
      successRate: number;
      avgDuration: number;
      cacheHitRate: number;
    };
    operationBreakdown: Record<
      string,
      {
        count: number;
        avgDuration: number;
        successRate: number;
      }
    >;
    recommendations: string[];
  } {
    if (this.metrics.length === 0) {
      return {
        summary: {
          totalOperations: 0,
          successRate: 0,
          avgDuration: 0,
          cacheHitRate: 0,
        },
        operationBreakdown: {},
        recommendations: ['No data available for analysis'],
      };
    }

    // 전체 통계
    const totalOperations = this.metrics.length;
    const successfulOps = this.metrics.filter((m) => m.success).length;
    const successRate = (successfulOps / totalOperations) * 100;
    const avgDuration =
      this.metrics.reduce((sum, m) => sum + m.duration, 0) / totalOperations;

    const cacheMetrics = this.metrics.filter((m) => m.cacheHit !== undefined);
    const cacheHitRate =
      cacheMetrics.length > 0
        ? (cacheMetrics.filter((m) => m.cacheHit).length /
            cacheMetrics.length) *
          100
        : 0;

    // 작업별 분석
    const operationBreakdown: Record<string, any> = {};

    for (const metric of this.metrics) {
      if (!operationBreakdown[metric.operation]) {
        operationBreakdown[metric.operation] = {
          metrics: [],
          count: 0,
        };
      }

      operationBreakdown[metric.operation].metrics.push(metric);
      operationBreakdown[metric.operation].count++;
    }

    // 작업별 통계 계산
    for (const [operation, data] of Object.entries(operationBreakdown)) {
      const opMetrics = data.metrics;
      operationBreakdown[operation] = {
        count: data.count,
        avgDuration:
          opMetrics.reduce((sum: number, m: any) => sum + m.duration, 0) /
          opMetrics.length,
        successRate:
          (opMetrics.filter((m: any) => m.success).length / opMetrics.length) *
          100,
      };
    }

    // 권장사항 생성
    const recommendations = this.generateRecommendations(
      successRate,
      avgDuration,
      cacheHitRate
    );

    return {
      summary: {
        totalOperations,
        successRate: Math.round(successRate * 100) / 100,
        avgDuration: Math.round(avgDuration * 100) / 100,
        cacheHitRate: Math.round(cacheHitRate * 100) / 100,
      },
      operationBreakdown,
      recommendations,
    };
  }

  /**
   * 🔧 Private: 권장사항 생성
   */
  private generateRecommendations(
    successRate: number,
    avgDuration: number,
    cacheHitRate: number
  ): string[] {
    const recommendations: string[] = [];

    if (successRate < 95) {
      recommendations.push(
        `성공률이 ${successRate.toFixed(1)}%로 낮습니다. 에러 처리 및 재시도 로직을 개선하세요.`
      );
    }

    if (avgDuration > DEMO_CONFIG.performanceTargets.avgResponseTime) {
      recommendations.push(
        `평균 응답시간이 ${avgDuration.toFixed(0)}ms로 목표치(${DEMO_CONFIG.performanceTargets.avgResponseTime}ms)를 초과합니다.`
      );
    }

    if (cacheHitRate < DEMO_CONFIG.performanceTargets.cacheHitRate) {
      recommendations.push(
        `캐시 히트율이 ${cacheHitRate.toFixed(1)}%로 목표치(${DEMO_CONFIG.performanceTargets.cacheHitRate}%)보다 낮습니다.`
      );
    }

    if (recommendations.length === 0) {
      recommendations.push('모든 성능 지표가 목표치를 달성했습니다! 👍');
    }

    return recommendations;
  }
}

/**
 * 🎯 메인 데모 실행기
 */
export class MCPRealtimeDemo {
  private manager: any; // MCPRealtimeManager
  private simulator: MCPMetricsSimulator;
  private analyzer: PerformanceAnalyzer;
  private isRunning = false;

  constructor() {
    this.simulator = new MCPMetricsSimulator();
    this.analyzer = new PerformanceAnalyzer();
  }

  /**
   * 🚀 데모 시작
   */
  async startDemo(): Promise<void> {
    if (this.isRunning) {
      throw new Error('Demo is already running');
    }

    console.log(
      '🚀 [MCPRealtimeDemo] Starting MCP Realtime Monitoring Demo...'
    );
    console.log(
      `📊 Duration: ${DEMO_CONFIG.simulation.durationMinutes} minutes`
    );
    console.log(
      `🔄 Metrics interval: ${DEMO_CONFIG.simulation.metricsIntervalSeconds} seconds`
    );
    console.log(`🎯 Test servers: ${DEMO_CONFIG.testServers.join(', ')}`);

    try {
      // Redis 및 Supabase 클라이언트 초기화
      const redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL!,
        token: process.env.UPSTASH_REDIS_REST_TOKEN!,
      });

      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      // MCP 실시간 관리자 초기화
      this.manager = createMCPRealtimeManager(redis, supabase, {
        performance: {
          targetCacheHitMs: 100,
          targetCacheMissMs: 300,
          minCacheHitRate: DEMO_CONFIG.performanceTargets.cacheHitRate,
          alertThresholds: {
            responseTime: 1000,
            errorRate: 15,
            memoryUsage: DEMO_CONFIG.performanceTargets.maxMemoryUsage,
            storageUsage: DEMO_CONFIG.performanceTargets.maxStorageUsage,
          },
        },
      });

      this.isRunning = true;
      await this.runSimulation();
    } catch (error) {
      console.error('❌ [MCPRealtimeDemo] Demo failed:', error);
      throw error;
    }
  }

  /**
   * 🔄 시뮬레이션 실행
   */
  private async runSimulation(): Promise<void> {
    const startTime = Date.now();
    const endTime =
      startTime + DEMO_CONFIG.simulation.durationMinutes * 60 * 1000;
    const interval = DEMO_CONFIG.simulation.metricsIntervalSeconds * 1000;

    let cycleCount = 0;

    console.log('📈 [MCPRealtimeDemo] Starting data collection simulation...');

    while (Date.now() < endTime && this.isRunning) {
      const cycleStart = Date.now();
      cycleCount++;

      try {
        // 1. 메트릭 수집 및 저장
        await this.collectAndStoreMetrics(cycleStart);

        // 2. 헬스체크 수행
        await this.performHealthChecks(cycleStart);

        // 3. 이벤트 처리
        await this.processEvents(cycleStart);

        // 4. 주기적 성능 분석 (매 10사이클)
        if (cycleCount % 10 === 0) {
          await this.performPerformanceAnalysis();
        }

        // 5. 상태 출력 (매 5사이클)
        if (cycleCount % 5 === 0) {
          await this.printStatus(cycleCount);
        }
      } catch (error) {
        console.error(
          `❌ [MCPRealtimeDemo] Cycle ${cycleCount} failed:`,
          error
        );
        this.analyzer.recordMetric('cycle', Date.now() - cycleStart, false);
      }

      // 다음 사이클까지 대기
      const cycleTime = Date.now() - cycleStart;
      const waitTime = Math.max(0, interval - cycleTime);

      if (waitTime > 0) {
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      }
    }

    console.log('🏁 [MCPRealtimeDemo] Simulation completed');
    await this.generateFinalReport();
  }

  /**
   * 📊 메트릭 수집 및 저장
   */
  private async collectAndStoreMetrics(timestamp: number): Promise<void> {
    const startTime = Date.now();

    try {
      // 모든 테스트 서버에 대한 메트릭 생성
      const metrics: MCPServerMetrics[] = DEMO_CONFIG.testServers.map(
        (serverId) => this.simulator.generateMetrics(serverId, timestamp)
      );

      // 관리자를 통해 수집 및 저장
      const result = await this.manager.collectMetrics(
        metrics,
        `demo_session_${Date.now()}`
      );

      const duration = Date.now() - startTime;
      this.analyzer.recordMetric(
        'collect_metrics',
        duration,
        result.cached && result.stored,
        result.cached
      );

      if (duration > 500) {
        console.warn(
          `⚠️ [MCPRealtimeDemo] Slow metrics collection: ${duration}ms`
        );
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      this.analyzer.recordMetric('collect_metrics', duration, false);
      throw error;
    }
  }

  /**
   * 🏥 헬스체크 수행
   */
  private async performHealthChecks(timestamp: number): Promise<void> {
    const startTime = Date.now();

    try {
      // 랜덤하게 일부 서버만 헬스체크 (실제 환경 시뮬레이션)
      const serversToCheck = DEMO_CONFIG.testServers.filter(
        () => Math.random() > 0.5
      );

      if (serversToCheck.length === 0) return;

      const healthChecks: HealthCheckResult[] = serversToCheck.map((serverId) =>
        this.simulator.generateHealthCheck(serverId, timestamp)
      );

      await this.manager.processHealthChecks(healthChecks);

      const duration = Date.now() - startTime;
      this.analyzer.recordMetric('health_checks', duration, true);
    } catch (error) {
      const duration = Date.now() - startTime;
      this.analyzer.recordMetric('health_checks', duration, false);
      throw error;
    }
  }

  /**
   * 📢 이벤트 처리
   */
  private async processEvents(timestamp: number): Promise<void> {
    const startTime = Date.now();

    try {
      // 이벤트 생성 (확률적)
      const events: MonitoringEvent[] = [];

      for (const serverId of DEMO_CONFIG.testServers) {
        const event = this.simulator.generateEvent(serverId, timestamp);
        if (event) {
          events.push(event);
        }
      }

      if (events.length > 0) {
        await this.manager.processEvents(events);
        console.log(`📢 [MCPRealtimeDemo] Processed ${events.length} events`);
      }

      const duration = Date.now() - startTime;
      this.analyzer.recordMetric('process_events', duration, true);
    } catch (error) {
      const duration = Date.now() - startTime;
      this.analyzer.recordMetric('process_events', duration, false);
      throw error;
    }
  }

  /**
   * 📈 성능 분석 수행
   */
  private async performPerformanceAnalysis(): Promise<void> {
    const startTime = Date.now();

    try {
      // 랜덤 서버에 대한 성능 분석
      const randomServer =
        DEMO_CONFIG.testServers[
          Math.floor(Math.random() * DEMO_CONFIG.testServers.length)
        ];

      const trend = await this.manager.analyzePerformance(randomServer, '15m');

      console.log(
        `📈 [MCPRealtimeDemo] Performance trend for ${randomServer}: ${trend.trend}`
      );

      const duration = Date.now() - startTime;
      this.analyzer.recordMetric('performance_analysis', duration, true);
    } catch (error) {
      const duration = Date.now() - startTime;
      this.analyzer.recordMetric('performance_analysis', duration, false);
      console.error('❌ Performance analysis failed:', error);
    }
  }

  /**
   * 📊 상태 출력
   */
  private async printStatus(cycleCount: number): Promise<void> {
    try {
      const stats = await this.manager.getRealtimeStats();

      console.log('\n📊 [MCPRealtimeDemo] Current Status:');
      console.log(`   Cycle: ${cycleCount}`);
      console.log(`   Cache Hit Rate: ${stats.cache.hitRate.toFixed(1)}%`);
      console.log(
        `   Avg Response Time: ${stats.cache.avgResponseTime.toFixed(0)}ms`
      );
      console.log(`   Memory Usage: ${stats.cache.memoryUsage.toFixed(1)}MB`);
      console.log(`   Active Servers: ${stats.system.activeServers}`);
      console.log(`   Health Score: ${stats.system.overallHealthScore}`);

      if (stats.urgentActions.length > 0) {
        console.log(`   🚨 Urgent Actions: ${stats.urgentActions.length}`);
      }
    } catch (error) {
      console.error('❌ Status update failed:', error);
    }
  }

  /**
   * 📋 최종 보고서 생성
   */
  private async generateFinalReport(): Promise<void> {
    console.log('\n📋 [MCPRealtimeDemo] Generating Final Report...');

    try {
      // 성능 분석 보고서
      const performanceReport = this.analyzer.generateReport();

      console.log('\n🎯 Performance Summary:');
      console.log(
        `   Total Operations: ${performanceReport.summary.totalOperations}`
      );
      console.log(`   Success Rate: ${performanceReport.summary.successRate}%`);
      console.log(
        `   Avg Duration: ${performanceReport.summary.avgDuration}ms`
      );
      console.log(
        `   Cache Hit Rate: ${performanceReport.summary.cacheHitRate}%`
      );

      console.log('\n🔧 Operation Breakdown:');
      for (const [operation, stats] of Object.entries(
        performanceReport.operationBreakdown
      )) {
        console.log(`   ${operation}:`);
        console.log(`     Count: ${stats.count}`);
        console.log(`     Avg Duration: ${stats.avgDuration.toFixed(0)}ms`);
        console.log(`     Success Rate: ${stats.successRate.toFixed(1)}%`);
      }

      console.log('\n💡 Recommendations:');
      performanceReport.recommendations.forEach((rec) => {
        console.log(`   • ${rec}`);
      });

      // 시스템 통계
      const finalStats = await this.manager.getRealtimeStats();

      console.log('\n📊 Final System Stats:');
      console.log(
        `   Overall Health Score: ${finalStats.system.overallHealthScore}`
      );
      console.log(
        `   Data Retention Compliance: ${finalStats.system.dataRetentionCompliance}%`
      );
      console.log(
        `   Cache Memory Usage: ${finalStats.cache.memoryUsage.toFixed(1)}MB / 256MB`
      );
      console.log(
        `   Database Storage: ${finalStats.database.storageUsage.toFixed(1)}MB / 500MB`
      );

      if (finalStats.recommendations.length > 0) {
        console.log('\n🎯 System Recommendations:');
        finalStats.recommendations.forEach((rec) => {
          console.log(`   • ${rec}`);
        });
      }
    } catch (error) {
      console.error('❌ Final report generation failed:', error);
    }
  }

  /**
   * 🛑 데모 중지
   */
  async stopDemo(): Promise<void> {
    console.log('🛑 [MCPRealtimeDemo] Stopping demo...');

    this.isRunning = false;

    if (this.manager) {
      await this.manager.cleanup();
    }

    console.log('✅ [MCPRealtimeDemo] Demo stopped');
  }
}

/**
 * 🎯 데모 실행 함수
 */
export async function runMCPRealtimeDemo(): Promise<void> {
  const demo = new MCPRealtimeDemo();

  try {
    await demo.startDemo();
  } catch (error) {
    console.error('❌ Demo execution failed:', error);
    throw error;
  } finally {
    await demo.stopDemo();
  }
}

// 직접 실행 지원
if (require.main === module) {
  runMCPRealtimeDemo().catch(console.error);
}
