/**
 * 성능 모니터링 모듈
 * @description API 응답 시간, 쿼리 성능, 시스템 메트릭을 추적하고 분석
 * @author Central Supervisor
 * @date 2025-01-27
 */

interface PerformanceMetric {
  timestamp: number;
  duration: number;
  metadata?: Record<string, any>;
}

interface PerformanceReport {
  timestamp: string;
  queries: Record<string, { avg: number; count: number; p95: number }>;
  apis: Record<string, { avg: number; count: number; p95: number }>;
  system: {
    memoryUsage: NodeJS.MemoryUsage;
    uptime: number;
  };
}

class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private queryTimes: Map<string, PerformanceMetric[]> = new Map();
  private apiLatencies: Map<string, PerformanceMetric[]> = new Map();
  private readonly maxMetricsPerType = 1000; // 각 타입별 최대 보관 메트릭 수

  private constructor() {}

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  /**
   * 쿼리 실행 시간 기록
   */
  recordQueryTime(
    queryType: string,
    duration: number,
    metadata?: Record<string, any>
  ) {
    this.recordMetric(this.queryTimes, queryType, duration, metadata);
  }

  /**
   * API 응답 시간 기록
   */
  recordApiLatency(
    endpoint: string,
    duration: number,
    metadata?: Record<string, any>
  ) {
    this.recordMetric(this.apiLatencies, endpoint, duration, metadata);
  }

  /**
   * 메트릭 기록 (내부 헬퍼)
   */
  private recordMetric(
    storage: Map<string, PerformanceMetric[]>,
    key: string,
    duration: number,
    metadata?: Record<string, any>
  ) {
    if (!storage.has(key)) {
      storage.set(key, []);
    }

    const metrics = storage.get(key)!;
    metrics.push({
      timestamp: Date.now(),
      duration,
      metadata,
    });

    // 최대 개수 유지
    if (metrics.length > this.maxMetricsPerType) {
      metrics.shift();
    }
  }

  /**
   * 평균 시간 계산
   */
  private calculateAverage(metrics: PerformanceMetric[]): number {
    if (metrics.length === 0) return 0;
    const sum = metrics.reduce((acc, m) => acc + m.duration, 0);
    return Math.round(sum / metrics.length);
  }

  /**
   * 95 백분위수 계산
   */
  private calculateP95(metrics: PerformanceMetric[]): number {
    if (metrics.length === 0) return 0;
    const sorted = [...metrics].sort((a, b) => a.duration - b.duration);
    const index = Math.ceil(metrics.length * 0.95) - 1;
    return sorted[index].duration;
  }

  /**
   * 특정 쿼리 타입의 평균 시간 조회
   */
  getAverageQueryTime(queryType: string): number {
    const metrics = this.queryTimes.get(queryType) || [];
    return this.calculateAverage(metrics);
  }

  /**
   * 특정 API의 평균 응답 시간 조회
   */
  getAverageApiLatency(endpoint: string): number {
    const metrics = this.apiLatencies.get(endpoint) || [];
    return this.calculateAverage(metrics);
  }

  /**
   * 전체 성능 리포트 생성
   */
  generateReport(): PerformanceReport {
    const report: PerformanceReport = {
      timestamp: new Date().toISOString(),
      queries: {},
      apis: {},
      system: {
        memoryUsage: process.memoryUsage(),
        uptime: process.uptime(),
      },
    };

    // 쿼리 메트릭 집계
    this.queryTimes.forEach((metrics, queryType) => {
      report.queries[queryType] = {
        avg: this.calculateAverage(metrics),
        count: metrics.length,
        p95: this.calculateP95(metrics),
      };
    });

    // API 메트릭 집계
    this.apiLatencies.forEach((metrics, endpoint) => {
      report.apis[endpoint] = {
        avg: this.calculateAverage(metrics),
        count: metrics.length,
        p95: this.calculateP95(metrics),
      };
    });

    return report;
  }

  /**
   * 성능 임계값 체크
   */
  checkThresholds(thresholds: {
    queryTimeMs?: number;
    apiLatencyMs?: number;
  }): Array<{ type: string; name: string; avg: number; threshold: number }> {
    const violations: Array<{
      type: string;
      name: string;
      avg: number;
      threshold: number;
    }> = [];

    // 쿼리 시간 체크
    if (thresholds.queryTimeMs) {
      this.queryTimes.forEach((metrics, queryType) => {
        const avg = this.calculateAverage(metrics);
        if (avg > thresholds.queryTimeMs!) {
          violations.push({
            type: 'query',
            name: queryType,
            avg,
            threshold: thresholds.queryTimeMs!,
          });
        }
      });
    }

    // API 응답 시간 체크
    if (thresholds.apiLatencyMs) {
      this.apiLatencies.forEach((metrics, endpoint) => {
        const avg = this.calculateAverage(metrics);
        if (avg > thresholds.apiLatencyMs!) {
          violations.push({
            type: 'api',
            name: endpoint,
            avg,
            threshold: thresholds.apiLatencyMs!,
          });
        }
      });
    }

    return violations;
  }

  /**
   * 메트릭 초기화
   */
  reset() {
    this.queryTimes.clear();
    this.apiLatencies.clear();
  }

  /**
   * 특정 타입의 메트릭만 초기화
   */
  resetType(type: 'query' | 'api', name?: string) {
    const storage = type === 'query' ? this.queryTimes : this.apiLatencies;

    if (name) {
      storage.delete(name);
    } else {
      storage.clear();
    }
  }
}

// 싱글톤 인스턴스 export
export const performanceMonitor = PerformanceMonitor.getInstance();

// 타입 export
export type { PerformanceMetric, PerformanceReport };

// 헬퍼 함수: 성능 측정 데코레이터
export function measurePerformance(type: 'query' | 'api', name: string) {
  return function (
    target: unknown,
    propertyName: string,
    descriptor: PropertyDescriptor
  ) {
    // 테스트 환경에서 descriptor가 올바르게 전달되지 않는 경우 처리
    if (!descriptor || typeof descriptor.value !== 'function') {
      console.warn(`measurePerformance decorator: descriptor.value is not a function for ${String(propertyName)}`);
      return descriptor;
    }
    
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: unknown[]) {
      const start = Date.now();
      try {
        const result = await originalMethod.apply(this, args);
        const duration = Date.now() - start;

        if (type === 'query') {
          performanceMonitor.recordQueryTime(name, duration);
        } else {
          performanceMonitor.recordApiLatency(name, duration);
        }

        return result;
      } catch (error) {
        const duration = Date.now() - start;

        if (type === 'query') {
          performanceMonitor.recordQueryTime(name, duration, { error: true });
        } else {
          performanceMonitor.recordApiLatency(name, duration, { error: true });
        }

        throw error;
      }
    };

    return descriptor;
  };
}
