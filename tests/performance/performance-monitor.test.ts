import { describe, it, expect, beforeEach, vi } from 'vitest';
import { performanceMonitor, measurePerformance } from '@/lib/monitoring/performance-monitor';

describe('PerformanceMonitor', () => {
  beforeEach(() => {
    // 각 테스트 전에 메트릭 초기화
    performanceMonitor.reset();
  });

  describe('쿼리 성능 추적', () => {
    it('쿼리 실행 시간을 기록해야 함', () => {
      // Given
      const queryType = 'SELECT_USER';
      const duration = 150;

      // When
      performanceMonitor.recordQueryTime(queryType, duration);

      // Then
      const avgTime = performanceMonitor.getAverageQueryTime(queryType);
      expect(avgTime).toBe(duration);
    });

    it('여러 쿼리의 평균 시간을 계산해야 함', () => {
      // Given
      const queryType = 'SELECT_USER';
      const durations = [100, 200, 300];

      // When
      durations.forEach(duration => {
        performanceMonitor.recordQueryTime(queryType, duration);
      });

      // Then
      const avgTime = performanceMonitor.getAverageQueryTime(queryType);
      expect(avgTime).toBe(200);
    });

    it('존재하지 않는 쿼리 타입은 0을 반환해야 함', () => {
      // When
      const avgTime = performanceMonitor.getAverageQueryTime('NON_EXISTENT');

      // Then
      expect(avgTime).toBe(0);
    });
  });

  describe('API 응답 시간 추적', () => {
    it('API 응답 시간을 기록해야 함', () => {
      // Given
      const endpoint = '/api/users';
      const duration = 250;

      // When
      performanceMonitor.recordApiLatency(endpoint, duration);

      // Then
      const avgLatency = performanceMonitor.getAverageApiLatency(endpoint);
      expect(avgLatency).toBe(duration);
    });

    it('메타데이터와 함께 기록할 수 있어야 함', () => {
      // Given
      const endpoint = '/api/users';
      const duration = 300;
      const metadata = { statusCode: 200, method: 'GET' };

      // When
      performanceMonitor.recordApiLatency(endpoint, duration, metadata);

      // Then
      const report = performanceMonitor.generateReport();
      expect(report.apis[endpoint]).toBeDefined();
      expect(report.apis[endpoint].count).toBe(1);
    });
  });

  describe('성능 리포트 생성', () => {
    it('전체 성능 리포트를 생성해야 함', () => {
      // Given
      performanceMonitor.recordQueryTime('SELECT_USER', 100);
      performanceMonitor.recordQueryTime('SELECT_USER', 200);
      performanceMonitor.recordApiLatency('/api/users', 150);
      performanceMonitor.recordApiLatency('/api/posts', 250);

      // When
      const report = performanceMonitor.generateReport();

      // Then
      expect(report.timestamp).toBeDefined();
      expect(report.queries['SELECT_USER']).toEqual({
        avg: 150,
        count: 2,
        p95: 200,
      });
      expect(report.apis['/api/users']).toEqual({
        avg: 150,
        count: 1,
        p95: 150,
      });
      expect(report.system.memoryUsage).toBeDefined();
      expect(report.system.uptime).toBeGreaterThan(0);
    });

    it('95 백분위수를 올바르게 계산해야 함', () => {
      // Given
      const queryType = 'COMPLEX_QUERY';
      // 20개의 샘플 데이터 (95 백분위는 19번째 값)
      for (let i = 1; i <= 20; i++) {
        performanceMonitor.recordQueryTime(queryType, i * 10);
      }

      // When
      const report = performanceMonitor.generateReport();

      // Then
      expect(report.queries[queryType].p95).toBe(190); // 19번째 값
    });
  });

  describe('임계값 체크', () => {
    it('임계값을 초과하는 항목을 찾아야 함', () => {
      // Given
      performanceMonitor.recordQueryTime('SLOW_QUERY', 300);
      performanceMonitor.recordQueryTime('FAST_QUERY', 50);
      performanceMonitor.recordApiLatency('/api/slow', 500);
      performanceMonitor.recordApiLatency('/api/fast', 100);

      // When
      const violations = performanceMonitor.checkThresholds({
        queryTimeMs: 200,
        apiLatencyMs: 300,
      });

      // Then
      expect(violations).toHaveLength(2);
      expect(violations).toContainEqual({
        type: 'query',
        name: 'SLOW_QUERY',
        avg: 300,
        threshold: 200,
      });
      expect(violations).toContainEqual({
        type: 'api',
        name: '/api/slow',
        avg: 500,
        threshold: 300,
      });
    });

    it('임계값 내의 항목은 포함하지 않아야 함', () => {
      // Given
      performanceMonitor.recordQueryTime('NORMAL_QUERY', 100);
      performanceMonitor.recordApiLatency('/api/normal', 200);

      // When
      const violations = performanceMonitor.checkThresholds({
        queryTimeMs: 200,
        apiLatencyMs: 300,
      });

      // Then
      expect(violations).toHaveLength(0);
    });
  });

  describe('메트릭 관리', () => {
    it('특정 타입의 메트릭을 초기화할 수 있어야 함', () => {
      // Given
      performanceMonitor.recordQueryTime('QUERY_1', 100);
      performanceMonitor.recordApiLatency('/api/test', 200);

      // When
      performanceMonitor.resetType('query');

      // Then
      expect(performanceMonitor.getAverageQueryTime('QUERY_1')).toBe(0);
      expect(performanceMonitor.getAverageApiLatency('/api/test')).toBe(200);
    });

    it('특정 이름의 메트릭만 초기화할 수 있어야 함', () => {
      // Given
      performanceMonitor.recordQueryTime('QUERY_1', 100);
      performanceMonitor.recordQueryTime('QUERY_2', 200);

      // When
      performanceMonitor.resetType('query', 'QUERY_1');

      // Then
      expect(performanceMonitor.getAverageQueryTime('QUERY_1')).toBe(0);
      expect(performanceMonitor.getAverageQueryTime('QUERY_2')).toBe(200);
    });
  });

  describe('measurePerformance 데코레이터', () => {
    it('비동기 함수의 실행 시간을 자동으로 측정해야 함', async () => {
      // Given
      class TestService {
//         @measurePerformance('query', 'TEST_QUERY')
//         async fetchData() {
//           await new Promise(resolve => setTimeout(resolve, 100));
//           return { success: true };
//         }
//       }
// 
//       const service = new TestService();
// 
//       // When
//       const result = await service.fetchData();
// 
//       // Then
//       expect(result).toEqual({ success: true });
//       const avgTime = performanceMonitor.getAverageQueryTime('TEST_QUERY');
//       expect(avgTime).toBeGreaterThanOrEqual(100);
//       expect(avgTime).toBeLessThan(150); // 여유 시간 포함
//     });
// 
//     it('에러가 발생해도 시간을 측정해야 함', async () => {
//       // Given
//       class TestService {
//         @measurePerformance('api', 'ERROR_ENDPOINT')
        async failingMethod() {
          await new Promise(resolve => setTimeout(resolve, 50));
          throw new Error('Test error');
        }
      }

      const service = new TestService();

      // When/Then
      await expect(service.failingMethod()).rejects.toThrow('Test error');
      
      const report = performanceMonitor.generateReport();
      expect(report.apis['ERROR_ENDPOINT']).toBeDefined();
      expect(report.apis['ERROR_ENDPOINT'].count).toBe(1);
    });
  });
});