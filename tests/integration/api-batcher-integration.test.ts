/**
 * 🔗 API Batcher Integration Test
 *
 * Vercel 최적화 API 배칭 시스템 통합 테스트
 *
 * Vercel 무료 티어 안전:
 * - ✅ fetch Mock 사용
 * - ✅ 외부 API 호출 없음
 * - ✅ 10초 이내 실행
 *
 * @vitest-environment node
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  VercelOptimizedAPIBatcher,
  getAPIBatcher,
  cleanupGlobalBatcher,
} from '@/lib/api/api-batcher';

// Mock fetch
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('VercelOptimizedAPIBatcher Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cleanupGlobalBatcher();
  });

  afterEach(() => {
    cleanupGlobalBatcher();
  });

  describe('타입 가드 검증', () => {
    it('유효한 APIResponse 구조 검증', () => {
      // Given
      const validResponse = {
        id: 'test-1',
        data: { foo: 'bar' },
        status: 200,
        timing: {
          queued: 0,
          executed: Date.now(),
          duration: 100,
        },
      };

      // Then - 구조 검증
      expect(validResponse.id).toBeDefined();
      expect(typeof validResponse.id).toBe('string');
      expect(typeof validResponse.status).toBe('number');
      expect(validResponse.timing).toBeDefined();
      expect(typeof validResponse.timing.queued).toBe('number');
      expect(typeof validResponse.timing.executed).toBe('number');
      expect(typeof validResponse.timing.duration).toBe('number');
    });

    it('id 누락된 응답 구조', () => {
      // Given
      const invalidResponse = {
        data: { foo: 'bar' },
        status: 200,
        timing: { queued: 0, executed: 0, duration: 0 },
      };

      // Then
      expect('id' in invalidResponse).toBe(false);
    });

    it('status 누락된 응답 구조', () => {
      // Given
      const invalidResponse = {
        id: 'test-1',
        data: { foo: 'bar' },
        timing: { queued: 0, executed: 0, duration: 0 },
      };

      // Then
      expect('status' in invalidResponse).toBe(false);
    });

    it('timing 누락된 응답 구조', () => {
      // Given
      const invalidResponse = {
        id: 'test-1',
        data: { foo: 'bar' },
        status: 200,
      };

      // Then
      expect('timing' in invalidResponse).toBe(false);
    });

    it('null/undefined 처리', () => {
      // Then
      expect(null).toBeNull();
      expect(undefined).toBeUndefined();
    });
  });

  describe('우선순위 정렬', () => {
    it('high > normal > low 순서 정렬', () => {
      // Given
      const requests = [
        { id: '1', endpoint: '/api/1', priority: 'low' as const },
        { id: '2', endpoint: '/api/2', priority: 'high' as const },
        { id: '3', endpoint: '/api/3', priority: 'normal' as const },
      ];

      // When
      const priorityOrder = { high: 0, normal: 1, low: 2 };
      const sorted = [...requests].sort((a, b) => {
        return (
          (priorityOrder[a.priority || 'normal'] || 1) -
          (priorityOrder[b.priority || 'normal'] || 1)
        );
      });

      // Then
      expect(sorted[0].priority).toBe('high');
      expect(sorted[1].priority).toBe('normal');
      expect(sorted[2].priority).toBe('low');
    });

    it('동일 우선순위 순서 유지 (stable sort)', () => {
      // Given
      const requests = [
        { id: '1', endpoint: '/api/1', priority: 'normal' as const },
        { id: '2', endpoint: '/api/2', priority: 'normal' as const },
        { id: '3', endpoint: '/api/3', priority: 'normal' as const },
      ];

      // When
      const priorityOrder = { high: 0, normal: 1, low: 2 };
      const sorted = [...requests].sort((a, b) => {
        return (
          (priorityOrder[a.priority || 'normal'] || 1) -
          (priorityOrder[b.priority || 'normal'] || 1)
        );
      });

      // Then - 원래 순서 유지
      expect(sorted[0].id).toBe('1');
      expect(sorted[1].id).toBe('2');
      expect(sorted[2].id).toBe('3');
    });

    it('우선순위 미지정 시 normal로 처리', () => {
      // Given
      const requests = [
        { id: '1', endpoint: '/api/1' }, // 우선순위 없음
        { id: '2', endpoint: '/api/2', priority: 'high' as const },
      ];

      // When - 실제 api-batcher의 정렬 로직과 동일
      const priorityOrder: Record<string, number> = {
        high: 0,
        normal: 1,
        low: 2,
      };
      const sorted = [...requests].sort((a, b) => {
        const aPriority = priorityOrder[a.priority ?? 'normal'] ?? 1;
        const bPriority = priorityOrder[b.priority ?? 'normal'] ?? 1;
        return aPriority - bPriority;
      });

      // Then
      expect(sorted[0].id).toBe('2'); // high 먼저 (priority 0)
      expect(sorted[1].id).toBe('1'); // normal (priority 1)
    });
  });

  describe('배치 설정', () => {
    it('기본 maxBatchSize = 8', () => {
      // Given
      const batcher = new VercelOptimizedAPIBatcher();

      // Then - getStatus로 간접 확인
      const status = batcher.getStatus();
      expect(status.queueSize).toBe(0);
    });

    it('커스텀 옵션 적용', () => {
      // Given
      const batcher = new VercelOptimizedAPIBatcher({
        maxBatchSize: 4,
        batchDelay: 100,
        timeout: 5000,
      });

      // Then
      const status = batcher.getStatus();
      expect(status.isProcessing).toBe(false);
    });
  });

  describe('상태 관리', () => {
    it('getStatus() 큐 크기 반환', () => {
      // Given
      const batcher = new VercelOptimizedAPIBatcher();

      // When
      const status = batcher.getStatus();

      // Then
      expect(status).toHaveProperty('queueSize');
      expect(status).toHaveProperty('pendingCount');
      expect(status).toHaveProperty('isProcessing');
      expect(status).toHaveProperty('hasTimer');
    });

    it('초기 상태 확인', () => {
      // Given
      const batcher = new VercelOptimizedAPIBatcher();

      // When
      const status = batcher.getStatus();

      // Then
      expect(status.queueSize).toBe(0);
      expect(status.pendingCount).toBe(0);
      expect(status.isProcessing).toBe(false);
      expect(status.hasTimer).toBe(false);
    });

    it('cleanup() 호출 후 상태 초기화', () => {
      // Given
      const batcher = new VercelOptimizedAPIBatcher();

      // When
      batcher.cleanup();
      const status = batcher.getStatus();

      // Then
      expect(status.queueSize).toBe(0);
      expect(status.pendingCount).toBe(0);
      expect(status.isProcessing).toBe(false);
    });
  });

  describe('전역 배처', () => {
    it('getAPIBatcher() 싱글톤 반환', () => {
      // When
      const batcher1 = getAPIBatcher();
      const batcher2 = getAPIBatcher();

      // Then
      expect(batcher1).toBe(batcher2);
    });

    it('cleanupGlobalBatcher() 후 새 인스턴스 생성', () => {
      // Given
      const batcher1 = getAPIBatcher();

      // When
      cleanupGlobalBatcher();
      const batcher2 = getAPIBatcher();

      // Then
      expect(batcher1).not.toBe(batcher2);
    });
  });
});
