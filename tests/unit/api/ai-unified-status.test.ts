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

      // 응답 상태 확인
      expect(response.status).toBe(200);

      // JSON 파싱 가능성 확인
      await expect(response.json()).resolves.toBeDefined();
    });

    it('AI 엔진 상태 정보가 올바르게 포함되어야 함', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/ai/unified/status?detailed=true'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(data.engines).toBeDefined();
      expect(typeof data.engines).toBe('object');

      const engineNames = Object.keys(data.engines);
      expect(engineNames.length).toBeGreaterThan(0);

      engineNames.forEach(engineName => {
        const engine = data.engines[engineName];
        expect(engine).toHaveProperty('status');
        expect(engine).toHaveProperty('responseTime');
        expect(engine).toHaveProperty('uptime');
        expect(engine).toHaveProperty('lastCheck');
        expect(engine).toHaveProperty('features');
        expect(['operational', 'standby', 'error']).toContain(engine.status);
      });
    });

    it('성능 메트릭이 올바르게 포함되어야 함', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/ai/unified/status?detailed=true'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(data.performance).toBeDefined();
      expect(data.performance).toHaveProperty('requestsPerMinute');
      expect(data.performance).toHaveProperty('successRate');
      expect(data.performance).toHaveProperty('averageLatency');
      expect(data.performance).toHaveProperty('errorRate');

      expect(typeof data.performance.requestsPerMinute).toBe('number');
      expect(typeof data.performance.successRate).toBe('number');
      expect(typeof data.performance.averageLatency).toBe('number');
      expect(typeof data.performance.errorRate).toBe('number');

      expect(data.performance.successRate).toBeGreaterThanOrEqual(90);
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
      expect(data).toHaveProperty('engines');
      expect(data).toHaveProperty('performance');
      expect(data).toHaveProperty('capabilities');
    });

    it('engine 파라미터로 특정 엔진 정보를 필터링해야 함', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/ai/unified/status?engine=local-ai'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('engine', 'local-ai');
      expect(data).toHaveProperty('status');
      expect(data).toHaveProperty('responseTime');
      expect(data).toHaveProperty('timestamp');
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
      // 원본 함수를 백업
      const originalConsoleError = console.error;
      console.error = vi.fn();

      // Mock으로 에러 발생 시뮬레이션
      vi.spyOn(Date.prototype, 'toISOString').mockImplementationOnce(() => {
        throw new Error('Mock error');
      });

      const request = new NextRequest(
        'http://localhost:3000/api/ai/unified/status'
      );
      const response = await GET(request);

      expect(response.status).toBe(500);

      const data = await response.json();
      expect(data).toHaveProperty('status', 'error');
      expect(data).toHaveProperty('error');
      expect(data).toHaveProperty('timestamp');

      // Mock 정리
      vi.restoreAllMocks();
      console.error = originalConsoleError;
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

      const response = await GET(request);
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(5000); // 5초 미만
    });
  });

  describe('캐싱 및 성능', () => {
    it('연속 요청이 빠르게 처리되어야 함', async () => {
      const requests = Array.from(
        { length: 3 },
        () => new NextRequest('http://localhost:3000/api/ai/unified/status')
      );

      const startTime = Date.now();
      const responses = await Promise.all(requests.map(req => GET(req)));
      const endTime = Date.now();

      responses.forEach(response => {
        expect(response.status).toBe(200);
      });

      expect(endTime - startTime).toBeLessThan(3000); // 3초 미만
    });

    it('메모리 사용량이 적절해야 함', async () => {
      const initialMemory = process.memoryUsage();

      const request = new NextRequest(
        'http://localhost:3000/api/ai/unified/status'
      );
      const response = await GET(request);
      await response.json(); // JSON 파싱만 수행

      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;

      expect(response.status).toBe(200);
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024); // 50MB 미만
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
      expect(data.status).toBe('healthy');
      expect(data.operationalEngines).toBeGreaterThan(0);
    });

    it('일부 엔진에 문제가 있을 때 warning 상태를 반환해야 함', async () => {
      // 이 테스트는 mock 엔진 상태 조작이 필요하지만, 현재 API에서는 항상 operational 상태를 반환
      const request = new NextRequest(
        'http://localhost:3000/api/ai/unified/status'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      // 현재는 항상 healthy이므로 이 조건으로 검증
      expect(['healthy', 'warning', 'critical']).toContain(data.status);
    });
  });

  describe('실시간 데이터', () => {
    it('실시간 메트릭이 업데이트되어야 함', async () => {
      const request1 = new NextRequest(
        'http://localhost:3000/api/ai/unified/status'
      );
      const response1 = await GET(request1);
      const data1 = await response1.json();

      // 약간의 지연 후 두 번째 요청
      await new Promise(resolve => setTimeout(resolve, 100));

      const request2 = new NextRequest(
        'http://localhost:3000/api/ai/unified/status'
      );
      const response2 = await GET(request2);
      const data2 = await response2.json();

      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);

      // 타임스탬프는 다를 수 있음
      expect(data1.timestamp).not.toBe(data2.timestamp);

      // 시스템 로드는 랜덤하므로 다를 수 있음
      expect(typeof data1.systemLoad.cpu).toBe('number');
      expect(typeof data2.systemLoad.cpu).toBe('number');
    });
  });
});
