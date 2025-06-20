import { describe, it, expect } from 'vitest';

// 실제 성능 데이터 검증 함수들
const validateMetricRange = (
  value: number,
  min: number,
  max: number
): boolean => {
  return value >= min && value <= max;
};

const calculatePerformanceScore = (
  cpu: number,
  memory: number,
  responseTime: number
): number => {
  const cpuScore = Math.max(0, 100 - cpu);
  const memoryScore = Math.max(0, 100 - memory);
  const responseScore = Math.max(0, 100 - Math.min(responseTime / 10, 100));
  return (cpuScore + memoryScore + responseScore) / 3;
};

const detectAnomalies = (metrics: any[], threshold: number = 2): any[] => {
  const anomalies: any[] = [];

  for (let i = 1; i < metrics.length; i++) {
    const current = metrics[i];
    const previous = metrics[i - 1];

    const cpuChange = Math.abs(current.cpu - previous.cpu);
    const memoryChange = Math.abs(current.memory - previous.memory);

    if (cpuChange > threshold * 10 || memoryChange > threshold * 10) {
      anomalies.push({
        timestamp: current.timestamp,
        type: cpuChange > memoryChange ? 'cpu-spike' : 'memory-spike',
        severity: Math.max(cpuChange, memoryChange) > 50 ? 'high' : 'medium',
      });
    }
  }

  return anomalies;
};

// Mock 성능 데이터
const mockPerformanceData = {
  timestamp: '2025-01-01T00:00:00Z',
  system: {
    cpu: { usage: 45.2, cores: 8, load: [1.2, 1.1, 0.9] },
    memory: { used: 6.2, total: 16, percentage: 38.8 },
    disk: { used: 450, total: 1000, percentage: 45 },
    network: { incoming: 1250, outgoing: 890, totalBytes: 2140 },
  },
  application: {
    activeConnections: 245,
    requestsPerSecond: 150,
    responseTime: { avg: 85, p95: 120, p99: 180 },
    errorRate: 0.02,
  },
  services: {
    redis: { connected: true, responseTime: 2.1 },
    database: { connected: true, responseTime: 15.3 },
    mcp: { connected: true, responseTime: 8.7 },
  },
};

describe('Performance Metrics Logic', () => {
  describe('메트릭 데이터 검증', () => {
    it('should validate metric data types', () => {
      const metrics = mockPerformanceData;

      // 시스템 메트릭 타입 검증
      expect(typeof metrics.system.cpu.usage).toBe('number');
      expect(typeof metrics.system.memory.percentage).toBe('number');
      expect(typeof metrics.system.disk.percentage).toBe('number');
      expect(typeof metrics.system.network.totalBytes).toBe('number');

      // 애플리케이션 메트릭 타입 검증
      expect(typeof metrics.application.activeConnections).toBe('number');
      expect(typeof metrics.application.requestsPerSecond).toBe('number');
      expect(typeof metrics.application.errorRate).toBe('number');
    });

    it('should validate metric ranges', () => {
      const metrics = mockPerformanceData;

      // 백분율 메트릭은 0-100 범위여야 함
      expect(validateMetricRange(metrics.system.cpu.usage, 0, 100)).toBe(true);
      expect(
        validateMetricRange(metrics.system.memory.percentage, 0, 100)
      ).toBe(true);
      expect(validateMetricRange(metrics.system.disk.percentage, 0, 100)).toBe(
        true
      );

      // 에러율은 0-1 범위여야 함
      expect(validateMetricRange(metrics.application.errorRate, 0, 1)).toBe(
        true
      );
    });

    it('should validate timestamp format', () => {
      const metrics = mockPerformanceData;
      const timestamp = new Date(metrics.timestamp);

      expect(timestamp).toBeInstanceOf(Date);
      expect(timestamp.getTime()).not.toBeNaN();
    });
  });

  describe('성능 점수 계산', () => {
    it('should calculate performance score correctly', () => {
      const score1 = calculatePerformanceScore(30, 40, 100); // 좋은 성능
      const score2 = calculatePerformanceScore(80, 90, 500); // 나쁜 성능

      expect(score1).toBeGreaterThan(score2);
      expect(score1).toBeGreaterThan(50);
      expect(score2).toBeLessThan(50);
    });

    it('should handle edge cases in performance calculation', () => {
      const perfectScore = calculatePerformanceScore(0, 0, 0);
      const worstScore = calculatePerformanceScore(100, 100, 1000);

      expect(perfectScore).toBe(100);
      expect(worstScore).toBeGreaterThanOrEqual(0);
    });
  });

  describe('임계값 감지', () => {
    it('should detect high CPU usage', () => {
      const highCpuMetrics = {
        ...mockPerformanceData,
        system: {
          ...mockPerformanceData.system,
          cpu: { ...mockPerformanceData.system.cpu, usage: 95 },
        },
      };

      const isHighCpuUsage = highCpuMetrics.system.cpu.usage > 90;
      expect(isHighCpuUsage).toBe(true);
    });

    it('should detect high memory usage', () => {
      const highMemoryMetrics = {
        ...mockPerformanceData,
        system: {
          ...mockPerformanceData.system,
          memory: { ...mockPerformanceData.system.memory, percentage: 85 },
        },
      };

      const isHighMemoryUsage = highMemoryMetrics.system.memory.percentage > 80;
      expect(isHighMemoryUsage).toBe(true);
    });

    it('should detect slow response times', () => {
      const slowResponseMetrics = {
        ...mockPerformanceData,
        application: {
          ...mockPerformanceData.application,
          responseTime: { avg: 500, p95: 800, p99: 1200 },
        },
      };

      const isSlowResponse =
        slowResponseMetrics.application.responseTime.avg > 200;
      expect(isSlowResponse).toBe(true);
    });
  });

  describe('이상 감지', () => {
    it('should detect performance anomalies', () => {
      const historicalData = [
        { timestamp: '2025-01-01T00:00:00Z', cpu: 40, memory: 35 },
        { timestamp: '2025-01-01T00:01:00Z', cpu: 45, memory: 38 },
        { timestamp: '2025-01-01T00:02:00Z', cpu: 90, memory: 42 }, // CPU 스파이크
        { timestamp: '2025-01-01T00:03:00Z', cpu: 50, memory: 85 }, // 메모리 스파이크
      ];

      const anomalies = detectAnomalies(historicalData);

      expect(anomalies.length).toBeGreaterThan(0);
      expect(anomalies[0]).toHaveProperty('type');
      expect(anomalies[0]).toHaveProperty('severity');
      expect(['cpu-spike', 'memory-spike']).toContain(anomalies[0].type);
    });

    it('should not detect anomalies in stable metrics', () => {
      const stableData = [
        { timestamp: '2025-01-01T00:00:00Z', cpu: 40, memory: 35 },
        { timestamp: '2025-01-01T00:01:00Z', cpu: 42, memory: 36 },
        { timestamp: '2025-01-01T00:02:00Z', cpu: 41, memory: 37 },
      ];

      const anomalies = detectAnomalies(stableData);
      expect(anomalies.length).toBe(0);
    });
  });

  describe('서비스 상태 검증', () => {
    it('should validate service health', () => {
      const metrics = mockPerformanceData;

      Object.values(metrics.services).forEach((service: any) => {
        expect(service).toHaveProperty('connected');
        expect(service).toHaveProperty('responseTime');
        expect(typeof service.connected).toBe('boolean');
        expect(typeof service.responseTime).toBe('number');
        expect(service.responseTime).toBeGreaterThan(0);
      });
    });

    it('should detect service failures', () => {
      const failedServiceMetrics = {
        ...mockPerformanceData,
        services: {
          ...mockPerformanceData.services,
          redis: { connected: false, responseTime: 0 },
        },
      };

      const isRedisDown = !failedServiceMetrics.services.redis.connected;
      expect(isRedisDown).toBe(true);
    });
  });

  describe('리소스 사용률 계산', () => {
    it('should calculate resource utilization percentages', () => {
      const metrics = mockPerformanceData;

      // 메모리 사용률 계산 검증
      const expectedMemoryPercentage =
        (metrics.system.memory.used / metrics.system.memory.total) * 100;
      expect(Math.round(expectedMemoryPercentage * 10) / 10).toBe(
        metrics.system.memory.percentage
      );

      // 디스크 사용률 계산 검증
      const expectedDiskPercentage =
        (metrics.system.disk.used / metrics.system.disk.total) * 100;
      expect(expectedDiskPercentage).toBe(metrics.system.disk.percentage);
    });

    it('should calculate network throughput', () => {
      const metrics = mockPerformanceData;
      const expectedTotalBytes =
        metrics.system.network.incoming + metrics.system.network.outgoing;

      expect(expectedTotalBytes).toBe(metrics.system.network.totalBytes);
    });
  });

  describe('성능 트렌드 분석', () => {
    it('should calculate performance trends', () => {
      const historicalData = [
        {
          timestamp: '2025-01-01T00:00:00Z',
          cpu: 40,
          memory: 35,
          responseTime: 80,
        },
        {
          timestamp: '2025-01-01T00:01:00Z',
          cpu: 45,
          memory: 38,
          responseTime: 85,
        },
        {
          timestamp: '2025-01-01T00:02:00Z',
          cpu: 50,
          memory: 42,
          responseTime: 90,
        },
      ];

      // CPU 트렌드 계산
      const cpuTrend = historicalData.map(d => d.cpu);
      const isIncreasingCpuTrend = cpuTrend[2] > cpuTrend[0];
      expect(isIncreasingCpuTrend).toBe(true);

      // 응답 시간 트렌드 계산
      const responseTimeTrend = historicalData.map(d => d.responseTime);
      const avgResponseTimeIncrease =
        (responseTimeTrend[2] - responseTimeTrend[0]) / responseTimeTrend[0];
      expect(avgResponseTimeIncrease).toBe(0.125); // 12.5% 증가
    });
  });
});
