/**
 * 성능 모니터링 시스템
 */

export interface PerformanceMetrics {
  timestamp: number;
  server: string;

  // 응답 시간
  responseTime: {
    min: number;
    max: number;
    avg: number;
    p50: number;
    p95: number;
    p99: number;
  };

  // 처리량
  throughput: {
    requestsPerSecond: number;
    bytesPerSecond: number;
    successRate: number;
  };

  // 리소스 사용량
  resources: {
    cpuUsage: number;
    memoryUsage: number;
    activeConnections: number;
    queueDepth: number;
  };

  // 에러율
  errors: {
    rate: number;
    types: Record<string, number>;
  };
}

export class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetrics[]> = new Map();
  private readonly maxMetricsPerServer = 1000;

  recordMetrics(server: string, metrics: Partial<PerformanceMetrics>): void {
    const serverMetrics = this.metrics.get(server) || [];

    const newMetrics: PerformanceMetrics = {
      timestamp: Date.now(),
      server,
      responseTime: metrics.responseTime || {
        min: 0,
        max: 0,
        avg: 0,
        p50: 0,
        p95: 0,
        p99: 0,
      },
      throughput: metrics.throughput || {
        requestsPerSecond: 0,
        bytesPerSecond: 0,
        successRate: 1,
      },
      resources: metrics.resources || {
        cpuUsage: 0,
        memoryUsage: 0,
        activeConnections: 0,
        queueDepth: 0,
      },
      errors: metrics.errors || {
        rate: 0,
        types: {},
      },
    };

    serverMetrics.push(newMetrics);

    // 최대 개수 유지
    if (serverMetrics.length > this.maxMetricsPerServer) {
      serverMetrics.shift();
    }

    this.metrics.set(server, serverMetrics);
  }

  getMetrics(
    server: string,
    timeRange?: { start: number; end: number }
  ): PerformanceMetrics[] {
    const serverMetrics = this.metrics.get(server) || [];

    if (!timeRange) {
      return serverMetrics;
    }

    return serverMetrics.filter(
      (m) => m.timestamp >= timeRange.start && m.timestamp <= timeRange.end
    );
  }

  getLatestMetrics(server: string): PerformanceMetrics | null {
    const serverMetrics = this.metrics.get(server) || [];
    return serverMetrics[serverMetrics.length - 1] || null;
  }

  clearMetrics(server?: string): void {
    if (server) {
      this.metrics.delete(server);
    } else {
      this.metrics.clear();
    }
  }

  calculateAverageMetrics(
    server: string,
    windowSize: number = 60000
  ): PerformanceMetrics | null {
    const now = Date.now();
    const metrics = this.getMetrics(server, {
      start: now - windowSize,
      end: now,
    });

    if (metrics.length === 0) {
      return null;
    }

    const sum = metrics.reduce(
      (acc, m) => ({
        responseTime: {
          min: Math.min(acc.responseTime.min, m.responseTime.min),
          max: Math.max(acc.responseTime.max, m.responseTime.max),
          avg: acc.responseTime.avg + m.responseTime.avg,
          p50: acc.responseTime.p50 + m.responseTime.p50,
          p95: acc.responseTime.p95 + m.responseTime.p95,
          p99: acc.responseTime.p99 + m.responseTime.p99,
        },
        throughput: {
          requestsPerSecond:
            acc.throughput.requestsPerSecond + m.throughput.requestsPerSecond,
          bytesPerSecond:
            acc.throughput.bytesPerSecond + m.throughput.bytesPerSecond,
          successRate: acc.throughput.successRate + m.throughput.successRate,
        },
        resources: {
          cpuUsage: acc.resources.cpuUsage + m.resources.cpuUsage,
          memoryUsage: acc.resources.memoryUsage + m.resources.memoryUsage,
          activeConnections:
            acc.resources.activeConnections + m.resources.activeConnections,
          queueDepth: acc.resources.queueDepth + m.resources.queueDepth,
        },
        errors: {
          rate: acc.errors.rate + m.errors.rate,
          types: acc.errors.types,
        },
      }),
      {
        responseTime: {
          min: Infinity,
          max: -Infinity,
          avg: 0,
          p50: 0,
          p95: 0,
          p99: 0,
        },
        throughput: { requestsPerSecond: 0, bytesPerSecond: 0, successRate: 0 },
        resources: {
          cpuUsage: 0,
          memoryUsage: 0,
          activeConnections: 0,
          queueDepth: 0,
        },
        errors: { rate: 0, types: {} },
      }
    );

    const count = metrics.length;

    return {
      timestamp: now,
      server,
      responseTime: {
        min: sum.responseTime.min,
        max: sum.responseTime.max,
        avg: sum.responseTime.avg / count,
        p50: sum.responseTime.p50 / count,
        p95: sum.responseTime.p95 / count,
        p99: sum.responseTime.p99 / count,
      },
      throughput: {
        requestsPerSecond: sum.throughput.requestsPerSecond / count,
        bytesPerSecond: sum.throughput.bytesPerSecond / count,
        successRate: sum.throughput.successRate / count,
      },
      resources: {
        cpuUsage: sum.resources.cpuUsage / count,
        memoryUsage: sum.resources.memoryUsage / count,
        activeConnections: sum.resources.activeConnections / count,
        queueDepth: sum.resources.queueDepth / count,
      },
      errors: {
        rate: sum.errors.rate / count,
        types: sum.errors.types,
      },
    };
  }
}
