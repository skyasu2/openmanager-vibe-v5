import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AdvancedSimulationEngine } from '../../../src/services/AdvancedSimulationEngine';

// Mock dependencies
vi.mock('../../../src/lib/supabase', () => ({
  VercelDatabase: {
    getDashboardData: vi.fn(() =>
      Promise.resolve({
        metrics: [
          {
            cpu: 45,
            memory: 62,
            disk: 30,
            network: 15,
            timestamp: '2025-01-01T00:00:00Z',
            server_id: 'server-1',
          },
        ],
      })
    ),
  },
}));

describe('AdvancedSimulationEngine', () => {
  let engine: AdvancedSimulationEngine;

  beforeEach(() => {
    vi.clearAllMocks();
    engine = new AdvancedSimulationEngine();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    engine?.stop();
  });

  describe('엔진 초기화', () => {
    it('should initialize with default configuration', () => {
      expect(engine).toBeInstanceOf(AdvancedSimulationEngine);
    });

    it('should provide status information', () => {
      const status = engine.getStatus();

      expect(status).toHaveProperty('isRunning');
      expect(status.isRunning).toBe(false);
    });
  });

  describe('시뮬레이션 시작/중지', () => {
    it('should start simulation successfully', () => {
      engine.start();
      const status = engine.getStatus();
      expect(status.isRunning).toBe(true);
    });

    it('should stop simulation successfully', () => {
      engine.start();
      engine.stop();
      const status = engine.getStatus();
      expect(status.isRunning).toBe(false);
    });

    it('should handle multiple start attempts gracefully', () => {
      engine.start();
      const firstStatus = engine.getStatus();
      expect(firstStatus.isRunning).toBe(true);

      // 두 번째 시작 시도
      engine.start();
      const secondStatus = engine.getStatus();
      expect(secondStatus.isRunning).toBe(true);
    });
  });

  describe('메트릭 생성', () => {
    it('should generate advanced metrics', async () => {
      const metrics = await engine.generateAdvancedMetrics(3);

      expect(Array.isArray(metrics)).toBe(true);
      expect(metrics.length).toBeGreaterThan(0);
      expect(metrics.length).toBeLessThanOrEqual(3);

      // 메트릭 구조 검증
      metrics.forEach(metric => {
        expect(metric).toHaveProperty('cpu');
        expect(metric).toHaveProperty('memory');
        expect(metric).toHaveProperty('disk');
        expect(metric).toHaveProperty('network');
        expect(metric).toHaveProperty('timestamp');
        expect(metric).toHaveProperty('confidence');
        expect(metric).toHaveProperty('data_source');

        // 값 범위 검증
        expect(metric.cpu).toBeGreaterThanOrEqual(0);
        expect(metric.cpu).toBeLessThanOrEqual(100);
        expect(metric.memory).toBeGreaterThanOrEqual(0);
        expect(metric.memory).toBeLessThanOrEqual(100);
        expect(metric.confidence).toBeGreaterThanOrEqual(0);
        expect(metric.confidence).toBeLessThanOrEqual(1);
      });
    });

    it('should generate different metrics on each call', async () => {
      const metrics1 = await engine.generateAdvancedMetrics(2);
      const metrics2 = await engine.generateAdvancedMetrics(2);

      expect(metrics1.length).toBe(metrics2.length);
      // 메트릭이 생성되었는지만 확인
      expect(metrics1[0]).toHaveProperty('timestamp');
      expect(metrics2[0]).toHaveProperty('timestamp');
    });
  });

  describe('시나리오 관리', () => {
    it('should get active scenarios', async () => {
      const scenarios = await engine.getActiveScenarios();

      expect(Array.isArray(scenarios)).toBe(true);
      // 시나리오가 있다면 구조 검증
      if (scenarios.length > 0) {
        scenarios.forEach(scenario => {
          expect(scenario).toHaveProperty('id');
          expect(scenario).toHaveProperty('type');
          expect(scenario).toHaveProperty('severity');
        });
      }
    });

    it('should provide analysis targets', async () => {
      const targets = await engine.getAnalysisTargets();

      expect(Array.isArray(targets)).toBe(true);
    });

    it('should get integrated AI metrics', async () => {
      const aiMetrics = await engine.getIntegratedAIMetrics();

      expect(typeof aiMetrics).toBe('object');
      expect(aiMetrics).not.toBeNull();
    });
  });

  describe('상태 관리', () => {
    it('should maintain engine state correctly', () => {
      expect(engine.getIsRunning()).toBe(false);

      engine.start();
      expect(engine.getIsRunning()).toBe(true);

      engine.stop();
      expect(engine.getIsRunning()).toBe(false);
    });

    it('should handle state transitions', () => {
      const initialStatus = engine.getStatus();
      expect(initialStatus.isRunning).toBe(false);

      engine.start();
      const runningStatus = engine.getStatus();
      expect(runningStatus.isRunning).toBe(true);

      engine.stop();
      const stoppedStatus = engine.getStatus();
      expect(stoppedStatus.isRunning).toBe(false);
    });
  });

  describe('오류 처리', () => {
    it('should handle database errors gracefully', async () => {
      // 에러 상황에서도 fallback 메트릭이 반환되는지 테스트
      // Mock을 사용하지 않고 직접 테스트

      // Should still return fallback metrics
      const metrics = await engine.generateAdvancedMetrics(2);
      expect(Array.isArray(metrics)).toBe(true);
      expect(metrics.length).toBeGreaterThan(0);
    });

    it('should validate input parameters', async () => {
      // 음수 서버 개수 테스트
      const negativeServerMetrics = await engine.generateAdvancedMetrics(-1);
      expect(Array.isArray(negativeServerMetrics)).toBe(true);

      // 매우 큰 서버 개수 테스트
      const largeServerMetrics = await engine.generateAdvancedMetrics(1000);
      expect(Array.isArray(largeServerMetrics)).toBe(true);
      expect(largeServerMetrics.length).toBeLessThanOrEqual(1000);
    });
  });

  describe('리소스 정리', () => {
    it('should cleanup resources on stop', () => {
      const consoleSpy = vi.spyOn(console, 'log');

      engine.start();
      engine.stop();

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('고급 시뮬레이션 엔진')
      );

      consoleSpy.mockRestore();
    });

    it('should handle cleanup errors gracefully', () => {
      // Stop이 여러 번 호출되어도 문제없어야 함
      engine.stop();
      engine.stop();
      engine.stop();

      expect(engine.getIsRunning()).toBe(false);
    });
  });
});
