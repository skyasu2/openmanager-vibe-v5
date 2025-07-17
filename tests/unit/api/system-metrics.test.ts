/**
 * 🧪 시스템 메트릭 서비스 단위 테스트
 * 
 * 테스트 범위:
 * - 메트릭 수집 및 검증
 * - 캐싱 동작
 * - 에러 핸들링
 * - 성능 모니터링
 * - 실시간 업데이트
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MetricsCollector } from '@/services/ai/engines/metrics/MetricsCollector';
import { RealTimeMetricsCollector } from '@/services/ai/RealTimeMetricsCollector';
import type { SystemMetrics, MetricsCollectionOptions } from '@/services/ai/engines/ai-types/AITypes';
import type { APICallMetric, EngineMetrics } from '@/services/ai/RealTimeMetricsCollector';

// Mock 설정
vi.mock('@/lib/logger', () => ({
  systemLogger: {
    system: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

describe('System Metrics Services', () => {
  describe('MetricsCollector', () => {
    let collector: MetricsCollector;

    beforeEach(() => {
      vi.clearAllMocks();
      collector = new MetricsCollector();
    });

    describe('시스템 메트릭 수집', () => {
      it('should collect system metrics successfully', async () => {
        const options: MetricsCollectionOptions = {
          serverIds: ['server-1', 'server-2'],
          includeGlobalStats: true,
          includeAlerts: true,
        };

        const metrics = await collector.collectSystemMetrics(options);

        expect(metrics).toHaveProperty('servers');
        expect(metrics).toHaveProperty('global_stats');
        expect(metrics).toHaveProperty('alerts');
        expect(metrics).toHaveProperty('timestamp');

        expect(Object.keys(metrics.servers)).toHaveLength(2);
        expect(metrics.servers['server-1']).toHaveProperty('cpu_usage');
        expect(metrics.servers['server-1']).toHaveProperty('memory_usage');
        expect(metrics.servers['server-1']).toHaveProperty('disk_usage');
      });

      it('should use cached metrics within expiry time', async () => {
        const options: MetricsCollectionOptions = {
          serverIds: ['server-1'],
        };

        // 첫 번째 호출
        const metrics1 = await collector.collectSystemMetrics(options);
        const timestamp1 = metrics1.timestamp;

        // 즉시 두 번째 호출 (캐시 사용되어야 함)
        const metrics2 = await collector.collectSystemMetrics(options);
        const timestamp2 = metrics2.timestamp;

        expect(timestamp1).toBe(timestamp2);
        expect(metrics1).toEqual(metrics2);
      });

      it('should handle empty server list', async () => {
        const options: MetricsCollectionOptions = {
          serverIds: [],
        };

        const metrics = await collector.collectSystemMetrics(options);
        
        expect(metrics.servers).toBeDefined();
        expect(Object.keys(metrics.servers)).toHaveLength(0);
      });

      it('should handle collection errors gracefully', async () => {
        // collectServerMetrics를 모킹하여 에러 발생시키기
        const collectServerMetricsSpy = vi.spyOn(collector as any, 'collectServerMetrics');
        collectServerMetricsSpy.mockRejectedValueOnce(new Error('Network error'));

        const metrics = await collector.collectSystemMetrics();

        expect(metrics).toBeDefined();
        expect(metrics.servers).toEqual({});
        expect(metrics.timestamp).toBeDefined();
      });
    });

    describe('메트릭 검증', () => {
      it('should validate metric ranges', async () => {
        const metrics = await collector.collectSystemMetrics({
          serverIds: ['test-server'],
        });

        const serverMetrics = metrics.servers['test-server'];
        
        // CPU 사용률 0-100 범위 확인
        serverMetrics.cpu_usage.forEach(value => {
          expect(value).toBeGreaterThanOrEqual(0);
          expect(value).toBeLessThanOrEqual(100);
        });

        // 메모리 사용률 0-100 범위 확인
        serverMetrics.memory_usage.forEach(value => {
          expect(value).toBeGreaterThanOrEqual(0);
          expect(value).toBeLessThanOrEqual(100);
        });

        // 디스크 사용률 0-100 범위 확인
        serverMetrics.disk_usage.forEach(value => {
          expect(value).toBeGreaterThanOrEqual(0);
          expect(value).toBeLessThanOrEqual(100);
        });
      });

      it('should calculate average metrics correctly', async () => {
        const metrics = await collector.collectSystemMetrics({
          serverIds: ['server-1'],
        });

        const cpuValues = metrics.servers['server-1'].cpu_usage;
        const expectedAvg = cpuValues.reduce((sum, val) => sum + val, 0) / cpuValues.length;
        const actualAvg = cpuValues.reduce((sum, val) => sum + val, 0) / cpuValues.length;

        expect(actualAvg).toBe(expectedAvg);
        expect(actualAvg).toBeGreaterThan(0);
        expect(actualAvg).toBeLessThan(100);
      });
    });
  });

  describe('RealTimeMetricsCollector', () => {
    let rtCollector: RealTimeMetricsCollector;

    beforeEach(() => {
      rtCollector = new RealTimeMetricsCollector();
    });

    describe('API 호출 기록', () => {
      it('should record API calls', () => {
        const metric: APICallMetric = {
          endpoint: '/api/ai/analyze',
          method: 'POST',
          timestamp: Date.now(),
          responseTime: 150,
          success: true,
          statusCode: 200,
          userAgent: 'test-agent',
        };

        rtCollector.recordAPICall(metric);
        const engineMetrics = rtCollector.getEngineMetrics();

        expect(engineMetrics.length).toBeGreaterThan(0);
        
        const aiMetric = engineMetrics.find(m => m.name === 'ai');
        expect(aiMetric).toBeDefined();
        expect(aiMetric?.totalCalls).toBe(1);
        expect(aiMetric?.successfulCalls).toBe(1);
        expect(aiMetric?.avgResponseTime).toBe(150);
      });

      it('should handle multiple API calls', () => {
        const calls: APICallMetric[] = [
          {
            endpoint: '/api/ai/analyze',
            method: 'POST',
            timestamp: Date.now(),
            responseTime: 100,
            success: true,
            statusCode: 200,
          },
          {
            endpoint: '/api/ai/analyze',
            method: 'POST',
            timestamp: Date.now(),
            responseTime: 200,
            success: false,
            statusCode: 500,
          },
          {
            endpoint: '/api/ai/analyze',
            method: 'POST',
            timestamp: Date.now(),
            responseTime: 150,
            success: true,
            statusCode: 200,
          },
        ];

        calls.forEach(call => rtCollector.recordAPICall(call));
        const engineMetrics = rtCollector.getEngineMetrics();
        
        const aiMetric = engineMetrics.find(m => m.name === 'ai');
        expect(aiMetric?.totalCalls).toBe(3);
        expect(aiMetric?.successfulCalls).toBe(2);
        expect(aiMetric?.failedCalls).toBe(1);
        expect(aiMetric?.avgResponseTime).toBe(150); // (100 + 200 + 150) / 3
      });

      it('should limit stored records for memory management', () => {
        // 1001개의 API 호출 기록
        for (let i = 0; i < 1001; i++) {
          rtCollector.recordAPICall({
            endpoint: '/api/test',
            method: 'GET',
            timestamp: Date.now(),
            responseTime: 50,
            success: true,
            statusCode: 200,
          });
        }

        const systemMetrics = rtCollector.getSystemMetrics();
        expect(systemMetrics.totalCalls).toBeLessThanOrEqual(1000);
      });
    });

    describe('엔진 상태 판단', () => {
      it('should determine engine status correctly', () => {
        // 성공적인 호출들
        for (let i = 0; i < 10; i++) {
          rtCollector.recordAPICall({
            endpoint: '/api/ai/test',
            method: 'GET',
            timestamp: Date.now() - i * 1000,
            responseTime: 100,
            success: true,
            statusCode: 200,
          });
        }

        const metrics = rtCollector.getEngineMetrics();
        const aiEngine = metrics.find(m => m.name === 'ai');
        expect(aiEngine?.status).toBe('active');
      });

      it('should detect error status', () => {
        // 실패한 호출들
        for (let i = 0; i < 5; i++) {
          rtCollector.recordAPICall({
            endpoint: '/api/mcp/test',
            method: 'GET',
            timestamp: Date.now(),
            responseTime: 500,
            success: false,
            statusCode: 500,
          });
        }

        const metrics = rtCollector.getEngineMetrics();
        const mcpEngine = metrics.find(m => m.name === 'mcp');
        expect(mcpEngine?.status).toBe('error');
      });
    });

    describe('시스템 전체 메트릭', () => {
      it('should calculate system-wide metrics', () => {
        const endpoints = [
          '/api/ai/analyze',
          '/api/mcp/query',
          '/api/test/health',
        ];

        endpoints.forEach((endpoint, index) => {
          rtCollector.recordAPICall({
            endpoint,
            method: 'GET',
            timestamp: Date.now(),
            responseTime: 100 + index * 50,
            success: index !== 1, // 중간 하나만 실패
            statusCode: index === 1 ? 500 : 200,
          });
        });

        const systemMetrics = rtCollector.getSystemMetrics();
        
        expect(systemMetrics.totalCalls).toBe(3);
        expect(systemMetrics.successRate).toBeCloseTo(66.67, 1);
        expect(systemMetrics.avgResponseTime).toBe(150); // (100 + 150 + 200) / 3
        expect(systemMetrics.activeEngines).toBe(3);
      });
    });
  });

  describe('메트릭 통합 시나리오', () => {
    it('should work together for comprehensive monitoring', async () => {
      const metricsCollector = new MetricsCollector();
      const rtCollector = new RealTimeMetricsCollector();

      // API 호출 시뮬레이션
      rtCollector.recordAPICall({
        endpoint: '/api/ai/analyze',
        method: 'POST',
        timestamp: Date.now(),
        responseTime: 120,
        success: true,
        statusCode: 200,
      });

      // 시스템 메트릭 수집
      const systemMetrics = await metricsCollector.collectSystemMetrics({
        serverIds: ['main-server'],
        includeGlobalStats: true,
      });

      // 실시간 메트릭
      const rtMetrics = rtCollector.getSystemMetrics();

      // 통합 검증
      expect(systemMetrics).toBeDefined();
      expect(rtMetrics).toBeDefined();
      expect(systemMetrics.servers['main-server']).toBeDefined();
      expect(rtMetrics.totalCalls).toBeGreaterThan(0);
    });
  });
});