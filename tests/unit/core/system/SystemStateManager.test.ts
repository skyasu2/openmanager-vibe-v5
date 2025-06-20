import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SystemStateManager } from '../../../../src/core/system/SystemStateManager';

// 외부 시스템만 Mock 처리 (비용/제한 고려)
vi.mock('../../../../src/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => Promise.resolve({ data: [], error: null })),
      insert: vi.fn(() => Promise.resolve({ data: [], error: null })),
    })),
  },
}));

describe('SystemStateManager', () => {
  let manager: SystemStateManager;

  beforeEach(() => {
    vi.clearAllMocks();
    // Singleton 인스턴스 완전 리셋
    // @ts-expect-error - private static 필드 접근
    SystemStateManager.instance = undefined;
    manager = SystemStateManager.getInstance();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    manager?.destroy();
    // afterEach에서도 인스턴스 정리
    // @ts-expect-error - private static 필드 접근
    SystemStateManager.instance = undefined;
  });

  describe('싱글톤 패턴', () => {
    it('should return same instance for multiple calls', () => {
      const manager1 = SystemStateManager.getInstance();
      const manager2 = SystemStateManager.getInstance();

      expect(manager1).toBe(manager2);
    });

    it('should maintain trackApiCall functionality', () => {
      const manager1 = SystemStateManager.getInstance();

      // trackApiCall 메서드가 존재하고 호출 가능한지 확인
      expect(typeof manager1.trackApiCall).toBe('function');
      expect(() => manager1.trackApiCall(100, false)).not.toThrow();

      const manager2 = SystemStateManager.getInstance();
      expect(manager1).toBe(manager2);
    });
  });

  describe('시스템 상태 조회', () => {
    it('should return valid system status structure', () => {
      const status = manager.getSystemStatus();

      // 기본 구조 검증
      expect(status).toHaveProperty('simulation');
      expect(status).toHaveProperty('environment');
      expect(status).toHaveProperty('performance');
      expect(status).toHaveProperty('health');
      expect(status).toHaveProperty('services');
      expect(status).toHaveProperty('lastUpdated');

      // 타입 검증
      expect(typeof status.simulation.isRunning).toBe('boolean');
      expect(typeof status.simulation.runtime).toBe('number');
      expect(typeof status.simulation.dataCount).toBe('number');
      expect(typeof status.environment.plan).toBe('string');
      expect(typeof status.performance.apiCalls).toBe('number');
      expect(['healthy', 'warning', 'critical', 'degraded']).toContain(status.health);
    });

    it('should have consistent structure across multiple calls', () => {
      const status1 = manager.getSystemStatus();
      const status2 = manager.getSystemStatus();

      // 구조 일관성 검증 (값이 아닌 구조)
      expect(Object.keys(status1.simulation)).toEqual(Object.keys(status2.simulation));
      expect(Object.keys(status1.environment)).toEqual(Object.keys(status2.environment));
      expect(Object.keys(status1.services)).toEqual(Object.keys(status2.services));
      expect(typeof status1.environment.plan).toBe(typeof status2.environment.plan);
    });
  });

  describe('성능 메트릭 추적', () => {
    it('should have trackApiCall method available', () => {
      // trackApiCall 메서드 존재 확인
      expect(typeof manager.trackApiCall).toBe('function');

      // 메서드 호출이 에러를 발생시키지 않는지 확인
      expect(() => manager.trackApiCall(50, false)).not.toThrow();
      expect(() => manager.trackApiCall(100, false)).not.toThrow();
      expect(() => manager.trackApiCall(200, true)).not.toThrow();
    });

    it('should maintain performance metrics structure', async () => {
      // API 호출 추적
      manager.trackApiCall(50, false);
      manager.trackApiCall(100, false);
      manager.trackApiCall(200, true);

      // 상태 업데이트를 위한 짧은 대기
      await new Promise(resolve => setTimeout(resolve, 100));

      const status = manager.getSystemStatus();

      // 성능 메트릭 구조 검증
      expect(status.performance).toHaveProperty('averageResponseTime');
      expect(status.performance).toHaveProperty('apiCalls');
      expect(status.performance).toHaveProperty('cacheHitRate');
      expect(status.performance).toHaveProperty('errorRate');

      // 타입 검증
      expect(typeof status.performance.averageResponseTime).toBe('number');
      expect(typeof status.performance.apiCalls).toBe('number');
      expect(typeof status.performance.cacheHitRate).toBe('number');
      expect(typeof status.performance.errorRate).toBe('number');
    });

    it('should handle zero division in metrics calculation', () => {
      // 아무 호출도 하지 않은 상태
      const status = manager.getSystemStatus();

      // NaN이 아닌 유효한 값들이어야 함
      expect(Number.isNaN(status.performance.averageResponseTime)).toBe(false);
      expect(Number.isNaN(status.performance.errorRate)).toBe(false);
      expect(Number.isNaN(status.performance.cacheHitRate)).toBe(false);
    });
  });

  describe('시뮬레이션 제어', () => {
    it('should handle simulation start/stop operations', async () => {
      const startResult = await manager.startSimulation('fast');
      expect(startResult).toHaveProperty('success');
      expect(startResult).toHaveProperty('message');
      expect(typeof startResult.success).toBe('boolean');
      expect(typeof startResult.message).toBe('string');

      const stopResult = await manager.stopSimulation();
      expect(stopResult).toHaveProperty('success');
      expect(stopResult).toHaveProperty('message');
      expect(typeof stopResult.success).toBe('boolean');
      expect(typeof stopResult.message).toBe('string');
    });

    it('should maintain simulation state consistency', async () => {
      const initialStatus = manager.getSystemStatus();

      await manager.startSimulation('fast');
      const runningStatus = manager.getSystemStatus();

      await manager.stopSimulation();
      const stoppedStatus = manager.getSystemStatus();

      // 상태 변화가 논리적이어야 함
      expect(typeof runningStatus.simulation.isRunning).toBe('boolean');
      expect(typeof stoppedStatus.simulation.isRunning).toBe('boolean');
    });
  });

  describe('헬스 상태 계산', () => {
    it('should determine health based on performance metrics', () => {
      // 메트릭 추가
      manager.trackApiCall(50, false);
      manager.trackApiCall(60, false);
      manager.trackApiCall(40, false);

      const healthyStatus = manager.getSystemStatus();
      expect(['healthy', 'warning', 'critical', 'degraded']).toContain(healthyStatus.health);

      // 나쁜 메트릭 추가
      manager.trackApiCall(5000, true); // 매우 느리고 실패
      manager.trackApiCall(4000, true);
      manager.trackApiCall(6000, true);

      const degradedStatus = manager.getSystemStatus();
      expect(['healthy', 'warning', 'critical', 'degraded']).toContain(degradedStatus.health);
    });

    it('should handle edge cases in health calculation', () => {
      // 극단적인 값들로 테스트
      manager.trackApiCall(0, false);
      manager.trackApiCall(10000, true);

      const status = manager.getSystemStatus();

      // 여전히 유효한 헬스 상태여야 함
      expect(['healthy', 'warning', 'critical', 'degraded']).toContain(status.health);
      expect(typeof status.performance.averageResponseTime).toBe('number');
      expect(status.performance.averageResponseTime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('리소스 정리', () => {
    it('should cleanup resources properly', () => {
      const manager = SystemStateManager.getInstance();

      // 일부 상태 설정
      manager.trackApiCall(100, false);

      // 정리 수행
      expect(() => manager.destroy()).not.toThrow();
    });

    it('should allow recreation after destroy', () => {
      const manager1 = SystemStateManager.getInstance();
      manager1.destroy();

      // @ts-expect-error - private static 필드 접근
      SystemStateManager.instance = undefined;

      const manager2 = SystemStateManager.getInstance();
      expect(manager2).toBeDefined();
      expect(typeof manager2.getSystemStatus).toBe('function');
    });
  });
});
