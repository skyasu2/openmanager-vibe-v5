import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '../../../src/app/api/simulate/data/route';

// Mock NextRequest
function createMockRequest(
  url: string = 'http://localhost:3000/api/simulate/data'
): NextRequest {
  return {
    url,
    headers: new Headers(),
  } as any;
}

describe('GET /api/simulate/data', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('기본 데이터 요청', () => {
    it('should return current simulation data', async () => {
      const mockRequest = createMockRequest();

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('currentStep');
      expect(data.data).toHaveProperty('totalSteps');
      expect(data.data).toHaveProperty('isActive');
      expect(data.data).toHaveProperty('progress');
      expect(data.data).toHaveProperty('stepDescription');
      expect(data.data).toHaveProperty('stepIcon');

      // 기본 값 검증
      expect(typeof data.data.currentStep).toBe('number');
      expect(data.data.totalSteps).toBe(12);
      expect(typeof data.data.isActive).toBe('boolean');
      expect(typeof data.data.progress).toBe('number');
      expect(data.data.progress).toBeGreaterThanOrEqual(0);
      expect(data.data.progress).toBeLessThanOrEqual(100);
    });
  });

  describe('상태 요청 (action=status)', () => {
    it('should return detailed status information', async () => {
      const mockRequest = createMockRequest(
        'http://localhost:3000/api/simulate/data?action=status'
      );

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('currentStep');
      expect(data.data).toHaveProperty('totalSteps');
      expect(data.data).toHaveProperty('isActive');
      expect(data.data).toHaveProperty('progress');
      expect(data.data).toHaveProperty('stepInfo');
      expect(data.data).toHaveProperty('timing');

      // stepInfo 상세 정보 확인
      expect(data.data.stepInfo).toHaveProperty('description');
      expect(data.data.stepInfo).toHaveProperty('icon');
      expect(data.data.stepInfo).toHaveProperty('category');
      expect(data.data.stepInfo).toHaveProperty('duration');

      // timing 정보 확인
      expect(data.data.timing).toHaveProperty('startTime');
      expect(data.data.timing).toHaveProperty('elapsedSeconds');
      expect(data.data.timing).toHaveProperty('nextStepETA');
      expect(data.data.timing).toHaveProperty('estimatedCompletion');

      // 시간 형식 검증
      expect(() => new Date(data.data.timing.startTime)).not.toThrow();
      expect(
        () => new Date(data.data.timing.estimatedCompletion)
      ).not.toThrow();
    });
  });

  describe('단계별 진행 상태', () => {
    it('should have valid step progression', async () => {
      const mockRequest = createMockRequest(
        'http://localhost:3000/api/simulate/data?action=status'
      );

      const response = await GET(mockRequest);
      const data = await response.json();

      const { currentStep, totalSteps, progress } = data.data;

      // 단계 범위 검증
      expect(currentStep).toBeGreaterThanOrEqual(0);
      expect(currentStep).toBeLessThan(totalSteps);

      // 진행률 계산 검증
      const expectedProgress = Math.round(
        ((currentStep + 1) / totalSteps) * 100
      );
      expect(progress).toBe(expectedProgress);
    });

    it('should handle completion state correctly', async () => {
      const mockRequest = createMockRequest(
        'http://localhost:3000/api/simulate/data?action=status'
      );

      const response = await GET(mockRequest);
      const data = await response.json();

      // 실제 API 동작: currentStep < totalSteps 이면 활성 상태
      const { currentStep, totalSteps, isActive, progress, timing } = data.data;

      // 진행 중인 상태 확인
      if (currentStep < totalSteps) {
        expect(isActive).toBe(true);
        expect(progress).toBeLessThanOrEqual(100);
        if (timing) {
          expect(timing.nextStepETA).toBeGreaterThanOrEqual(0);
        }
      } else {
        // 완료된 상태
        expect(isActive).toBe(false);
        expect(progress).toBe(100);
        if (timing) {
          expect(timing.nextStepETA).toBe(0);
        }
      }
    });
  });

  describe('에러 처리', () => {
    it('should handle malformed URL gracefully', async () => {
      const mockRequest = createMockRequest('invalid-url');

      const response = await GET(mockRequest);

      // URL 파싱 에러가 발생해도 500 에러로 처리
      expect(response.status).toBe(500);

      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBeDefined();
    });
  });
});
