/**
 * 🧪 메트릭 검증 유틸리티 테스트
 * 서버 메트릭의 안전한 처리를 위한 검증 로직 테스트
 */

import { describe, expect, it, vi } from 'vitest';
import {
  generateSafeMetricValue,
  type ServerMetrics,
  validateMetricValue,
  validateServerMetrics,
} from './metricValidation';

vi.mock('@/lib/logging', () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

describe('metricValidation', () => {
  describe('validateMetricValue', () => {
    it('정상적인 값을 그대로 반환한다', () => {
      expect(validateMetricValue(50, 'cpu')).toBe(50);
      expect(validateMetricValue(0, 'cpu')).toBe(0);
      expect(validateMetricValue(100, 'cpu')).toBe(100);
    });

    it('음수 값을 0으로 보정한다', () => {
      expect(validateMetricValue(-10, 'cpu')).toBe(0);
      expect(validateMetricValue(-1, 'cpu')).toBe(0);
      expect(validateMetricValue(-100, 'cpu')).toBe(0);
    });

    it('100 초과 값을 100으로 보정한다', () => {
      expect(validateMetricValue(150, 'cpu')).toBe(100);
      expect(validateMetricValue(101, 'cpu')).toBe(100);
      expect(validateMetricValue(999, 'cpu')).toBe(100);
    });

    it('NaN 값을 0으로 보정한다', () => {
      expect(validateMetricValue(NaN, 'cpu')).toBe(0);
      expect(validateMetricValue(Number.NaN, 'cpu')).toBe(0);
    });

    it('Infinity 값을 100으로 보정한다', () => {
      expect(validateMetricValue(Infinity, 'cpu')).toBe(100);
      expect(validateMetricValue(-Infinity, 'cpu')).toBe(0);
    });

    it('소수점 값을 올바르게 처리한다', () => {
      expect(validateMetricValue(45.7, 'cpu')).toBe(45.7);
      expect(validateMetricValue(99.9, 'cpu')).toBe(99.9);
      expect(validateMetricValue(100.1, 'cpu')).toBe(100);
    });
  });

  describe('generateSafeMetricValue', () => {
    it('정상적인 범위 내에서 값을 생성한다', () => {
      const result1 = generateSafeMetricValue(50, 10, 'cpu');
      const result2 = generateSafeMetricValue(30, 5, 'memory');

      // 랜덤 함수이므로 범위 체크로 검증
      expect(result1).toBeGreaterThanOrEqual(0);
      expect(result1).toBeLessThanOrEqual(100);
      expect(result2).toBeGreaterThanOrEqual(0);
      expect(result2).toBeLessThanOrEqual(100);
    });

    it('범위를 벗어나는 결과를 보정한다', () => {
      // 극단적인 변화량으로 100을 초과하거나 0 미만이 될 가능성이 높은 경우
      const result1 = generateSafeMetricValue(95, 20, 'cpu'); // 최대 115까지 가능 -> 100으로 clamp
      const result2 = generateSafeMetricValue(5, 20, 'memory'); // 최소 -15까지 가능 -> 0으로 clamp

      expect(result1).toBeLessThanOrEqual(100);
      expect(result2).toBeGreaterThanOrEqual(0);
    });

    it('NaN 입력을 안전하게 처리한다', () => {
      const result1 = generateSafeMetricValue(NaN, 10, 'disk');
      const result2 = generateSafeMetricValue(50, NaN, 'network');
      const result3 = generateSafeMetricValue(NaN, NaN, 'cpu');

      // NaN 입력 시 유효한 범위의 값을 반환하는지 확인
      expect(Number.isFinite(result1)).toBe(true);
      expect(result1).toBeGreaterThanOrEqual(0);
      expect(result1).toBeLessThanOrEqual(100);

      expect(Number.isFinite(result2)).toBe(true);
      expect(result2).toBeGreaterThanOrEqual(0);
      expect(result2).toBeLessThanOrEqual(100);

      expect(Number.isFinite(result3)).toBe(true);
      expect(result3).toBeGreaterThanOrEqual(0);
      expect(result3).toBeLessThanOrEqual(100);
    });

    it('메트릭 타입별로 적절한 기본값을 사용한다', () => {
      expect(generateSafeMetricValue(0, 0, 'cpu')).toBeGreaterThanOrEqual(0);
      expect(generateSafeMetricValue(0, 0, 'memory')).toBeGreaterThanOrEqual(0);
      expect(generateSafeMetricValue(0, 0, 'disk')).toBeGreaterThanOrEqual(0);
      expect(generateSafeMetricValue(0, 0, 'network')).toBeGreaterThanOrEqual(
        0
      );
    });
  });

  describe('validateServerMetrics', () => {
    it('정상적인 메트릭 객체를 그대로 반환한다', () => {
      const validMetrics = {
        cpu: 45,
        memory: 50,
        disk: 20,
        network: 80,
      };

      const result = validateServerMetrics(validMetrics);
      expect(result).toEqual({
        cpu: 45,
        memory: 50,
        disk: 20,
        network: 80,
      });
    });

    it('잘못된 메트릭 값들을 보정한다', () => {
      const invalidMetrics = {
        cpu: -10,
        memory: 120,
        disk: NaN,
        network: Infinity,
      };

      const result = validateServerMetrics(invalidMetrics);

      expect(result.cpu).toBe(0); // -10 → 0
      expect(result.memory).toBe(100); // 120 → 100
      expect(result.disk).toBe(0); // NaN → 0
      expect(result.network).toBe(100); // Infinity → 100
    });

    it('누락된 필드를 기본값으로 채운다', () => {
      const incompleteMetrics: Partial<ServerMetrics> = {
        cpu: 45,
        memory: 60,
      };

      const result = validateServerMetrics(incompleteMetrics);

      expect(result.cpu).toBe(45);
      expect(result.memory).toBe(60);
      expect(result.disk).toBe(0); // 기본값
      expect(result.network).toBe(0); // 기본값
    });

    it('빈 객체를 안전한 기본값으로 변환한다', () => {
      const result = validateServerMetrics({});

      expect(result.cpu).toBe(0);
      expect(result.memory).toBe(0);
      expect(result.disk).toBe(0);
      expect(result.network).toBe(0);
    });

    it('null/undefined 입력을 안전하게 처리한다', () => {
      const resultNull = validateServerMetrics(null);
      const resultUndefined = validateServerMetrics(undefined);

      [resultNull, resultUndefined].forEach((result) => {
        expect(result.cpu).toBeDefined();
        expect(result.memory).toBeDefined();
        expect(result.disk).toBeDefined();
        expect(result.network).toBeDefined();
      });
    });
  });

  describe('에지 케이스', () => {
    it('매우 큰 숫자를 처리한다', () => {
      expect(validateMetricValue(Number.MAX_VALUE, 'cpu')).toBe(100);
      expect(validateMetricValue(Number.MAX_SAFE_INTEGER, 'cpu')).toBe(100);
    });

    it('매우 작은 숫자를 처리한다', () => {
      expect(validateMetricValue(Number.MIN_VALUE, 'cpu')).toBe(0);
      expect(validateMetricValue(Number.MIN_SAFE_INTEGER, 'cpu')).toBe(0);
    });

    it('문자열 형태의 숫자를 처리한다', () => {
      expect(validateMetricValue(Number('50'), 'cpu')).toBe(50);
      expect(validateMetricValue(Number('invalid'), 'cpu')).toBe(0); // NaN
    });

    it('객체나 배열 입력을 안전하게 처리한다', () => {
      expect(validateMetricValue({} as unknown as number, 'cpu')).toBe(0);
      expect(validateMetricValue([] as unknown as number, 'cpu')).toBe(0);
      expect(validateMetricValue(null as unknown as number, 'cpu')).toBe(0);
      expect(validateMetricValue(undefined as unknown as number, 'cpu')).toBe(
        0
      );
    });
  });
});
