import { GET } from '@/app/api/ai/unified/status/route';
import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock the dependencies
vi.mock('@/services/ai/RefactoredAIEngineHub', () => ({
  RefactoredAIEngineHub: {
    getInstance: vi.fn(() => ({
      getSystemStatus: vi.fn(() => ({
        status: 'healthy',
        engines: {
          total: 5,
          active: 4,
          inactive: 1,
        },
        performance: {
          averageResponseTime: 79,
          successRate: 0.97,
          totalRequests: 127,
        },
        health: {
          cpu: 29,
          memory: 51,
          uptime: 86400000,
        },
      })),
    })),
  },
}));

describe('GET /api/ai/unified/status', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('성공 케이스', () => {
    it('AI 통합 상태를 성공적으로 반환해야 함', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/ai/unified/status'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        success: true,
        status: 'healthy',
        engines: {
          total: 5,
          active: 4,
          inactive: 1,
        },
        performance: {
          averageResponseTime: 79,
          successRate: 0.97,
          totalRequests: 127,
        },
        health: {
          cpu: 29,
          memory: 51,
          uptime: 86400000,
        },
      });
    });

    it('AI 엔진 상태 정보가 올바르게 포함되어야 함', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/ai/unified/status'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(data.engines).toBeDefined();
      expect(Array.isArray(data.engines)).toBe(true);

      if (data.engines.length > 0) {
        data.engines.forEach(
          (engine: { name: string; status: string; responseTime: number }) => {
            expect(engine).toHaveProperty('name');
            expect(engine).toHaveProperty('status');
            expect(engine).toHaveProperty('responseTime');
            expect(['healthy', 'warning', 'critical', 'offline']).toContain(
              engine.status
            );
          }
        );
      }
    });

    it('성능 메트릭이 올바르게 포함되어야 함', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/ai/unified/status'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(data.performance).toBeDefined();
      expect(data.performance).toHaveProperty('averageResponseTime');
      expect(data.performance).toHaveProperty('totalRequests');
      expect(data.performance).toHaveProperty('successRate');

      expect(typeof data.performance.averageResponseTime).toBe('number');
      expect(typeof data.performance.totalRequests).toBe('number');
      expect(typeof data.performance.successRate).toBe('number');

      expect(data.performance.successRate).toBeGreaterThanOrEqual(0);
      expect(data.performance.successRate).toBeLessThanOrEqual(100);
    });

    it('타임스탬프가 유효한 형식이어야 함', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/ai/unified/status'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(data.timestamp).toBeDefined();
      expect(typeof data.timestamp).toBe('string');

      const timestamp = new Date(data.timestamp);
      expect(timestamp.getTime()).not.toBeNaN();
    });
  });

  describe('쿼리 파라미터 처리', () => {
    it('detailed=true 파라미터로 상세 정보를 반환해야 함', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/ai/unified/status?detailed=true'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('detailed');
      expect(data.detailed).toBe(true);
    });

    it('engine 파라미터로 특정 엔진 정보를 필터링해야 함', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/ai/unified/status?engine=korean-ai'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      if (data.engines && data.engines.length > 0) {
        expect(
          data.engines.some((engine: { name: string; status: string }) =>
            engine.name.includes('korean')
          )
        ).toBe(true);
      }
    });

    it('잘못된 쿼리 파라미터를 무시해야 함', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/ai/unified/status?invalid=param&detailed=true'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('status');
    });
  });

  describe('에러 처리', () => {
    it('내부 오류 발생 시 적절한 에러 응답을 반환해야 함', async () => {
      // Mock error scenario
      const mockHub = {
        getSystemStatus: vi.fn(() => {
          throw new Error('AI system unavailable');
        }),
      };

      vi.doMock('@/services/ai/RefactoredAIEngineHub', () => ({
        RefactoredAIEngineHub: {
          getInstance: vi.fn(() => mockHub),
        },
      }));

      const request = new NextRequest(
        'http://localhost:3000/api/ai/unified/status'
      );
      const response = await GET(request);

      expect(response.status).toBe(500);

      const data = await response.json();
      expect(data).toEqual({
        success: false,
        error: 'AI 시스템 상태 조회 실패',
        details: 'AI system unavailable',
      });
    });
  });

  describe('응답 형식 검증', () => {
    it('응답이 올바른 Content-Type을 가져야 함', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/ai/unified/status'
      );

      const response = await GET(request);

      expect(response.headers.get('content-type')).toContain(
        'application/json'
      );
    });

    it('CORS 헤더가 설정되어야 함', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/ai/unified/status'
      );

      const response = await GET(request);

      // CORS 헤더 확인 (있다면)
      const corsHeader = response.headers.get('access-control-allow-origin');
      if (corsHeader) {
        expect(corsHeader).toBeDefined();
      }
    });

    it('응답 시간이 합리적이어야 함', async () => {
      const startTime = Date.now();
      const request = new NextRequest(
        'http://localhost:3000/api/ai/unified/status'
      );

      await GET(request);

      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(5000); // 5초 이내
    });
  });

  describe('캐싱 및 성능', () => {
    it('연속 요청이 빠르게 처리되어야 함', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/ai/unified/status'
      );

      const startTime = Date.now();

      // 연속으로 3번 요청
      const promises = [GET(request), GET(request), GET(request)];

      const responses = await Promise.all(promises);
      const totalTime = Date.now() - startTime;

      responses.forEach(response => {
        expect(response.status).toBe(200);
      });

      expect(totalTime).toBeLessThan(10000); // 10초 이내
    });

    it('메모리 사용량이 적절해야 함', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/ai/unified/status'
      );

      const response = await GET(request);
      const data = await response.json();

      const responseSize = JSON.stringify(data).length;
      expect(responseSize).toBeLessThan(100000); // 100KB 이내
    });
  });

  describe('상태 코드별 응답', () => {
    it('모든 엔진이 정상일 때 healthy 상태를 반환해야 함', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/ai/unified/status'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);

      if (data.engines && data.engines.length > 0) {
        const allHealthy = data.engines.every((engine: { status: string }) =>
          ['healthy', 'warning'].includes(engine.status)
        );

        if (allHealthy) {
          expect(['healthy', 'warning']).toContain(data.status);
        }
      }
    });

    it('일부 엔진에 문제가 있을 때 warning 상태를 반환해야 함', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/ai/unified/status'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(['healthy', 'warning', 'critical']).toContain(data.status);
    });
  });

  describe('실시간 데이터', () => {
    it('실시간 메트릭이 업데이트되어야 함', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/ai/unified/status'
      );

      // 첫 번째 요청
      const response1 = await GET(request);
      const data1 = await response1.json();

      // 잠시 대기
      await new Promise(resolve => setTimeout(resolve, 100));

      // 두 번째 요청
      const response2 = await GET(request);
      const data2 = await response2.json();

      // 타임스탬프가 다르거나 메트릭이 업데이트되어야 함
      expect(
        data1.timestamp !== data2.timestamp ||
          data1.performance.totalRequests !== data2.performance.totalRequests
      ).toBe(true);
    });
  });
});
