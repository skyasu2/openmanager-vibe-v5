/**
 * 🎯 MCP 성능 모니터링 시스템 v1.0
 *
 * 담당 기능:
 * - 서버 성능 통계 수집
 * - 로드 밸런싱 및 최적화
 * - 헬스 스코어 계산
 * - 성능 기반 서버 선택
 */

import type { MCPServerConfig } from './MCPServerManager';

interface PerformanceMetrics {
  totalRequests: number;
  totalResponseTime: number;
  serverLoadBalance: Map<string, number>;
  lastOptimized: number;
}

export class MCPPerformanceMonitor {
  private performanceMetrics: PerformanceMetrics;
  private monitoringInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.performanceMetrics = {
      totalRequests: 0,
      totalResponseTime: 0,
      serverLoadBalance: new Map<string, number>(),
      lastOptimized: Date.now(),
    };

    this.startPerformanceMonitoring();
  }

  /**
   * 🚀 성능 모니터링 시작
   */
  private startPerformanceMonitoring(): void {
    // 5분마다 성능 통계 출력 및 최적화
    this.monitoringInterval = setInterval(
      () => {
        this.logPerformanceStats();
      },
      5 * 60 * 1000
    );

    console.log('📊 MCP 성능 모니터링 시작됨 (5분 간격)');
  }

  /**
   * 📊 성능 통계 로깅
   */
  private logPerformanceStats(): void {
    const { totalRequests, totalResponseTime, serverLoadBalance } =
      this.performanceMetrics;

    console.log('📊 MCP 성능 통계:');
    console.log(`  📈 총 요청 수: ${totalRequests}`);

    if (totalRequests > 0) {
      const avgResponseTime = totalResponseTime / totalRequests;
      console.log(`  ⚡ 평균 응답시간: ${avgResponseTime.toFixed(2)}ms`);
    }

    console.log('  🎯 서버별 로드:');
    for (const [server, load] of serverLoadBalance.entries()) {
      console.log(`    - ${server}: ${load}회`);
    }
  }

  /**
   * ⚡ 서버 성능 최적화
   */
  optimizeServerPerformance(servers: Map<string, MCPServerConfig>): void {
    console.log('📊 MCP 서버 성능 최적화 시작...');

    for (const [serverName, config] of servers.entries()) {
      if (config.stats) {
        const { totalRequests, successfulRequests, averageResponseTime } =
          config.stats;

        // 헬스 스코어 계산 (성공률 + 응답시간 기반)
        const successRate =
          totalRequests > 0 ? (successfulRequests / totalRequests) * 100 : 100;
        const responseScore = Math.max(0, 100 - averageResponseTime / 10); // 1초 = 10점 감점
        config.stats.healthScore = successRate * 0.7 + responseScore * 0.3;

        console.log(
          `  📈 ${serverName}: 성공률 ${successRate.toFixed(1)}%, 평균응답 ${averageResponseTime}ms, 헬스 ${config.stats.healthScore.toFixed(1)}`
        );

        // 성능이 낮은 서버 비활성화
        if (config.stats.healthScore < 30 && totalRequests > 10) {
          console.warn(`⚠️ ${serverName} 서버 성능 저하로 임시 비활성화`);
          config.enabled = false;
        }
      }
    }

    this.performanceMetrics.lastOptimized = Date.now();
  }

  /**
   * 🎯 최적 서버 선택 (로드 밸런싱)
   */
  selectOptimalServer(
    servers: Map<string, MCPServerConfig>,
    clients: Map<string, any>,
    excludeServers: string[] = []
  ): string | null {
    const availableServers = Array.from(servers.entries()).filter(
      ([name, config]) =>
        config.enabled && !excludeServers.includes(name) && clients.has(name)
    );

    if (availableServers.length === 0) return null;

    // 헬스 스코어 기반 선택
    const sortedServers = availableServers.sort((a, b) => {
      const scoreA = a[1].stats?.healthScore || 50;
      const scoreB = b[1].stats?.healthScore || 50;
      return scoreB - scoreA;
    });

    const selectedServer = sortedServers[0][0];

    // 로드 밸런싱 통계 업데이트
    const currentLoad =
      this.performanceMetrics.serverLoadBalance.get(selectedServer) || 0;
    this.performanceMetrics.serverLoadBalance.set(
      selectedServer,
      currentLoad + 1
    );

    return selectedServer;
  }

  /**
   * 📊 서버 통계 업데이트
   */
  updateServerStats(
    serverName: string,
    responseTime: number,
    success: boolean,
    servers: Map<string, MCPServerConfig>
  ): void {
    const config = servers.get(serverName);
    if (!config) return;

    if (!config.stats) {
      config.stats = {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        averageResponseTime: 0,
        lastUsed: Date.now(),
        healthScore: 100,
      };
    }

    const stats = config.stats;
    stats.totalRequests++;
    stats.lastUsed = Date.now();

    if (success) {
      stats.successfulRequests++;
    } else {
      stats.failedRequests++;
    }

    // 이동 평균으로 응답시간 업데이트
    stats.averageResponseTime =
      (stats.averageResponseTime * (stats.totalRequests - 1) + responseTime) /
      stats.totalRequests;

    // 전역 성능 메트릭 업데이트
    this.performanceMetrics.totalRequests++;
    this.performanceMetrics.totalResponseTime += responseTime;

    console.log(
      `📊 ${serverName} 통계 업데이트: ${success ? '✅' : '❌'} ${responseTime}ms`
    );
  }

  /**
   * 📈 성능 리포트 생성
   */
  generatePerformanceReport(servers: Map<string, MCPServerConfig>): unknown {
    const report = {
      timestamp: new Date().toISOString(),
      globalMetrics: {
        totalRequests: this.performanceMetrics.totalRequests,
        averageResponseTime:
          this.performanceMetrics.totalRequests > 0
            ? this.performanceMetrics.totalResponseTime /
              this.performanceMetrics.totalRequests
            : 0,
        lastOptimized: new Date(
          this.performanceMetrics.lastOptimized
        ).toISOString(),
      },
      serverMetrics: {} as Record<string, any>,
      loadBalancing: Object.fromEntries(
        this.performanceMetrics.serverLoadBalance
      ),
    };

    // 서버별 상세 메트릭
    for (const [name, config] of servers.entries()) {
      if (config.stats) {
        const successRate =
          config.stats.totalRequests > 0
            ? (config.stats.successfulRequests / config.stats.totalRequests) *
              100
            : 0;

        report.serverMetrics[name] = {
          enabled: config.enabled,
          totalRequests: config.stats.totalRequests,
          successfulRequests: config.stats.successfulRequests,
          failedRequests: config.stats.failedRequests,
          successRate: successRate.toFixed(2) + '%',
          averageResponseTime:
            config.stats.averageResponseTime.toFixed(2) + 'ms',
          healthScore: config.stats.healthScore.toFixed(1),
          lastUsed: new Date(config.stats.lastUsed).toISOString(),
        };
      }
    }

    return report;
  }

  /**
   * 🔄 성능 메트릭 초기화
   */
  resetMetrics(): void {
    this.performanceMetrics = {
      totalRequests: 0,
      totalResponseTime: 0,
      serverLoadBalance: new Map<string, number>(),
      lastOptimized: Date.now(),
    };

    console.log('🔄 성능 메트릭 초기화됨');
  }

  /**
   * 📊 현재 성능 상태 조회
   */
  getPerformanceStatus(): unknown {
    return {
      totalRequests: this.performanceMetrics.totalRequests,
      averageResponseTime:
        this.performanceMetrics.totalRequests > 0
          ? this.performanceMetrics.totalResponseTime /
            this.performanceMetrics.totalRequests
          : 0,
      serverLoadDistribution: Object.fromEntries(
        this.performanceMetrics.serverLoadBalance
      ),
      lastOptimized: new Date(
        this.performanceMetrics.lastOptimized
      ).toISOString(),
      monitoringActive: this.monitoringInterval !== null,
    };
  }

  /**
   * 🛑 성능 모니터링 중지
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      console.log('🛑 MCP 성능 모니터링 중지됨');
    }
  }

  /**
   * 🎯 서버 추천 (성능 기반)
   */
  recommendOptimalServers(
    servers: Map<string, MCPServerConfig>,
    limit: number = 3
  ): string[] {
    const enabledServers = Array.from(servers.entries())
      .filter(([_, config]) => config.enabled && config.stats)
      .sort((a, b) => {
        const scoreA = a[1].stats?.healthScore || 0;
        const scoreB = b[1].stats?.healthScore || 0;
        return scoreB - scoreA;
      })
      .slice(0, limit)
      .map(([name]) => name);

    console.log(`🎯 추천 서버 (상위 ${limit}개):`, enabledServers);
    return enabledServers;
  }
}
