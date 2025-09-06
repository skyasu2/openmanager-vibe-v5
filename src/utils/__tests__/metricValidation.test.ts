/**
 * 🧪 메트릭 검증 유틸리티 테스트
 * 서버 메트릭의 안전한 처리를 위한 검증 로직 테스트
 */

import { describe, it, expect } from 'vitest';
import { 
  validateMetricValue, 
  validateServerMetrics, 
  generateSafeMetricValue,
  type MetricType 
} from '../metricValidation';

describe('metricValidation', () => {
  describe('validateMetricValue', () => {
    it('정상적인 값을 그대로 반환한다', () => {
      expect(validateMetricValue(50)).toBe(50);
      expect(validateMetricValue(0)).toBe(0);
      expect(validateMetricValue(100)).toBe(100);
    });

    it('음수 값을 0으로 보정한다', () => {
      expect(validateMetricValue(-10)).toBe(0);
      expect(validateMetricValue(-1)).toBe(0);
      expect(validateMetricValue(-100)).toBe(0);
    });

    it('100 초과 값을 100으로 보정한다', () => {
      expect(validateMetricValue(150)).toBe(100);
      expect(validateMetricValue(101)).toBe(100);
      expect(validateMetricValue(999)).toBe(100);
    });

    it('NaN 값을 0으로 보정한다', () => {
      expect(validateMetricValue(NaN)).toBe(0);
      expect(validateMetricValue(Number.NaN)).toBe(0);
    });

    it('Infinity 값을 100으로 보정한다', () => {
      expect(validateMetricValue(Infinity)).toBe(100);
      expect(validateMetricValue(-Infinity)).toBe(0);
    });

    it('소수점 값을 올바르게 처리한다', () => {
      expect(validateMetricValue(45.7)).toBe(45.7);
      expect(validateMetricValue(99.9)).toBe(99.9);
      expect(validateMetricValue(100.1)).toBe(100);
    });
  });

  describe('generateSafeMetricValue', () => {
    it('정상적인 변화량을 적용한다', () => {
      expect(generateSafeMetricValue(50, 10, 'cpu')).toBe(60);
      expect(generateSafeMetricValue(30, -5, 'memory')).toBe(25);
    });

    it('범위를 벗어나는 결과를 보정한다', () => {
      expect(generateSafeMetricValue(90, 20, 'cpu')).toBe(100);
      expect(generateSafeMetricValue(10, -20, 'memory')).toBe(0);
    });

    it('NaN 입력을 안전하게 처리한다', () => {
      expect(generateSafeMetricValue(NaN, 10, 'disk')).toBe(10);
      expect(generateSafeMetricValue(50, NaN, 'network')).toBe(50);
      expect(generateSafeMetricValue(NaN, NaN, 'cpu')).toBe(0);
    });

    it('메트릭 타입별로 적절한 기본값을 사용한다', () => {
      expect(generateSafeMetricValue(0, 0, 'cpu')).toBeGreaterThanOrEqual(0);
      expect(generateSafeMetricValue(0, 0, 'memory')).toBeGreaterThanOrEqual(0);
      expect(generateSafeMetricValue(0, 0, 'disk')).toBeGreaterThanOrEqual(0);
      expect(generateSafeMetricValue(0, 0, 'network')).toBeGreaterThanOrEqual(0);
    });
  });

  describe('validateServerMetrics', () => {
    it('정상적인 메트릭 객체를 그대로 반환한다', () => {
      const validMetrics = {
        cpu: { usage: 45, cores: 4, temperature: 50 },
        memory: { used: 4, total: 8, usage: 50 },
        disk: { used: 100, total: 500, usage: 20 },
        network: { bytesIn: 1000, bytesOut: 800, packetsIn: 100, packetsOut: 80 },
        timestamp: new Date().toISOString(),
        uptime: 86400,
      };

      const result = validateServerMetrics(validMetrics);
      expect(result).toEqual(validMetrics);
    });

    it('잘못된 메트릭 값들을 보정한다', () => {
      const invalidMetrics = {
        cpu: { usage: -10, cores: 4, temperature: 150 },
        memory: { used: -2, total: 8, usage: 120 },
        disk: { used: 600, total: 500, usage: NaN },
        network: { bytesIn: -100, bytesOut: Infinity, packetsIn: 100, packetsOut: 80 },
        timestamp: new Date().toISOString(),
        uptime: 86400,
      };

      const result = validateServerMetrics(invalidMetrics);
      
      expect(result.cpu.usage).toBe(0); // -10 → 0
      expect(result.memory.usage).toBe(100); // 120 → 100
      expect(result.disk.usage).toBe(0); // NaN → 0
      expect(result.network.bytesIn).toBe(0); // -100 → 0
      expect(result.network.bytesOut).toBeGreaterThanOrEqual(0); // Infinity 처리
    });

    it('누락된 필드를 기본값으로 채운다', () => {
      const incompleteMetrics: any = {
        cpu: { usage: 45 },
        memory: { usage: 60 },
        timestamp: new Date().toISOString(),
      };

      const result = validateServerMetrics(incompleteMetrics);
      
      expect(result.cpu).toBeDefined();
      expect(result.memory).toBeDefined();
      expect(result.disk).toBeDefined();
      expect(result.network).toBeDefined();
      expect(result.uptime).toBeGreaterThanOrEqual(0);
    });

    it('빈 객체를 안전한 기본값으로 변환한다', () => {
      const result = validateServerMetrics({} as any);
      
      expect(result.cpu).toBeDefined();
      expect(result.memory).toBeDefined();
      expect(result.disk).toBeDefined();
      expect(result.network).toBeDefined();
      expect(result.timestamp).toBeDefined();
      expect(result.uptime).toBeGreaterThanOrEqual(0);
    });

    it('null/undefined 입력을 안전하게 처리한다', () => {
      const resultNull = validateServerMetrics(null as any);
      const resultUndefined = validateServerMetrics(undefined as any);
      
      [resultNull, resultUndefined].forEach(result => {
        expect(result.cpu).toBeDefined();
        expect(result.memory).toBeDefined();
        expect(result.disk).toBeDefined();
        expect(result.network).toBeDefined();
        expect(result.timestamp).toBeDefined();
        expect(result.uptime).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('에지 케이스', () => {
    it('매우 큰 숫자를 처리한다', () => {
      expect(validateMetricValue(Number.MAX_VALUE)).toBe(100);
      expect(validateMetricValue(Number.MAX_SAFE_INTEGER)).toBe(100);
    });

    it('매우 작은 숫자를 처리한다', () => {
      expect(validateMetricValue(Number.MIN_VALUE)).toBe(Number.MIN_VALUE);
      expect(validateMetricValue(Number.MIN_SAFE_INTEGER)).toBe(0);
    });

    it('문자열 형태의 숫자를 처리한다', () => {
      expect(validateMetricValue(Number('50'))).toBe(50);
      expect(validateMetricValue(Number('invalid'))).toBe(0); // NaN
    });

    it('객체나 배열 입력을 안전하게 처리한다', () => {
      expect(validateMetricValue({} as any)).toBe(0);
      expect(validateMetricValue([] as any)).toBe(0);
      expect(validateMetricValue(null as any)).toBe(0);
      expect(validateMetricValue(undefined as any)).toBe(0);
    });
  });
});