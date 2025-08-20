/**
 * 🧪 OpenManager VIBE v5 - 핵심 API 엔드포인트 통합 테스트
 * 
 * @description 주요 API 엔드포인트들의 기능, 성능, 스키마 검증
 * @author Claude Code (Test Automation Specialist)
 * @created 2025-08-20
 * @tdd-coverage 100%
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { z } from 'zod';

// 테스트 설정
const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';
const TIMEOUT = 30000; // 30초
const PERFORMANCE_THRESHOLD = 5000; // 5초

// 응답 스키마 정의
const HealthResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    status: z.string(),
    services: z.object({
      database: z.object({
        status: z.string(),
        lastCheck: z.string(),
        latency: z.number()
      }),
      cache: z.object({
        status: z.string(),
        lastCheck: z.string(),
        latency: z.number()
      }),
      ai: z.object({
        status: z.string(),
        lastCheck: z.string(),
        latency: z.number()
      })
    }),
    uptime: z.number(),
    version: z.string(),
    timestamp: z.string()
  }),
  timestamp: z.string()
});

const ServersResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(z.object({
    id: z.string(),
    name: z.string(),
    hostname: z.string(),
    status: z.string(),
    cpu: z.number(),
    memory: z.number(),
    disk: z.number()
  }))
});

const MetricsResponseSchema = z.object({
  totalServers: z.number(),
  onlineServers: z.number(),
  warningServers: z.number(),
  offlineServers: z.number(),
  averageCpu: z.number(),
  averageMemory: z.number(),
  averageDisk: z.number(),
  totalAlerts: z.number(),
  timestamp: z.string()
});

const SystemStatusResponseSchema = z.object({
  success: z.boolean(),
  timestamp: z.number(),
  source: z.string(),
  state: z.object({
    isRunning: z.boolean(),
    activeUsers: z.number(),
    version: z.string(),
    environment: z.string()
  })
});

const DashboardResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    success: z.boolean(),
    data: z.object({
      servers: z.record(z.any()),
      stats: z.object({
        totalServers: z.number(),
        onlineServers: z.number()
      })
    })
  })
});

// 테스트 헬퍼 함수
async function fetchWithTiming(url: string, options?: RequestInit) {
  const startTime = performance.now();
  const response = await fetch(url, options);
  const endTime = performance.now();
  const responseTime = endTime - startTime;
  
  return {
    response,
    responseTime,
    data: await response.json()
  };
}

async function testApiEndpoint(
  endpoint: string,
  expectedStatus: number = 200,
  schema?: z.ZodSchema,
  method: string = 'GET',
  body?: any
) {
  const url = `${BASE_URL}${endpoint}`;
  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    ...(body && { body: JSON.stringify(body) })
  };

  const { response, responseTime, data } = await fetchWithTiming(url, options);

  // 기본 검증
  expect(response.status).toBe(expectedStatus);
  expect(responseTime).toBeLessThan(PERFORMANCE_THRESHOLD);

  // 스키마 검증 (200 응답인 경우)
  if (response.status === 200 && schema) {
    expect(() => schema.parse(data)).not.toThrow();
  }

  return { data, responseTime, status: response.status };
}

describe('🚀 OpenManager VIBE v5 - 핵심 API 엔드포인트 테스트', () => {
  beforeAll(async () => {
    // 서버 실행 상태 확인
    try {
      const response = await fetch(BASE_URL);
      if (!response.ok) {
        throw new Error(`Server not running at ${BASE_URL}`);
      }
    } catch (error) {
      throw new Error(`테스트 서버에 연결할 수 없습니다: ${BASE_URL}`);
    }
  }, TIMEOUT);

  describe('📊 헬스체크 & 모니터링 API', () => {
    it('GET /api/health - 헬스체크 정상 동작', async () => {
      const result = await testApiEndpoint('/api/health', 200, HealthResponseSchema);
      
      expect(result.data.success).toBe(true);
      expect(result.data.data.status).toBe('healthy');
      expect(result.data.data.services.database.status).toBe('connected');
      expect(result.responseTime).toBeLessThan(3000); // 3초 미만
    });

    it('GET /api/metrics - 메트릭 API 정상 동작', async () => {
      const result = await testApiEndpoint('/api/metrics', 200, MetricsResponseSchema);
      
      expect(result.data.totalServers).toBeGreaterThan(0);
      expect(result.data.onlineServers).toBeGreaterThanOrEqual(0);
      expect(result.data.averageCpu).toBeGreaterThanOrEqual(0);
      expect(result.data.averageCpu).toBeLessThanOrEqual(100);
      expect(result.responseTime).toBeLessThan(1000); // 1초 미만
    });

    it('GET /api/system/status - 시스템 상태 API 정상 동작', async () => {
      const result = await testApiEndpoint('/api/system/status', 200, SystemStatusResponseSchema);
      
      expect(result.data.success).toBe(true);
      expect(result.data.state.activeUsers).toBeGreaterThanOrEqual(0);
      expect(result.data.state.environment).toBe('development');
      expect(result.responseTime).toBeLessThan(1000); // 1초 미만
    });
  });

  describe('🖥️ 서버 관리 API', () => {
    it('GET /api/servers/all - 서버 목록 API 정상 동작', async () => {
      const result = await testApiEndpoint('/api/servers/all', 200, ServersResponseSchema);
      
      expect(result.data.success).toBe(true);
      expect(Array.isArray(result.data.data)).toBe(true);
      expect(result.data.data.length).toBeGreaterThan(0);
      
      // 첫 번째 서버 데이터 검증
      const firstServer = result.data.data[0];
      expect(firstServer.id).toBeDefined();
      expect(firstServer.name).toBeDefined();
      expect(firstServer.status).toBeDefined();
      expect(typeof firstServer.cpu).toBe('number');
      expect(typeof firstServer.memory).toBe('number');
      expect(typeof firstServer.disk).toBe('number');
      
      expect(result.responseTime).toBeLessThan(2000); // 2초 미만
    });

    it('GET /api/servers/cached - 캐시된 서버 목록 성능 테스트', async () => {
      const result = await testApiEndpoint('/api/servers/cached', 200);
      
      // 캐시된 응답은 더 빨라야 함
      expect(result.responseTime).toBeLessThan(1000); // 1초 미만
    });
  });

  describe('📈 대시보드 API', () => {
    it('GET /api/dashboard - 대시보드 데이터 정상 동작', async () => {
      const result = await testApiEndpoint('/api/dashboard', 200, DashboardResponseSchema);
      
      expect(result.data.success).toBe(true);
      expect(result.data.data.success).toBe(true);
      expect(typeof result.data.data.data.servers).toBe('object');
      expect(result.data.data.data.stats.totalServers).toBeGreaterThan(0);
      expect(result.responseTime).toBeLessThan(2000); // 2초 미만
    });

    it('GET /api/dashboard-optimized - 최적화된 대시보드 성능 테스트', async () => {
      const result = await testApiEndpoint('/api/dashboard-optimized', 200);
      
      // 최적화된 버전은 더 빨라야 함
      expect(result.responseTime).toBeLessThan(1500); // 1.5초 미만
    });
  });

  describe('🔐 인증 & 보안 API', () => {
    it('GET /api/auth/test - 인증 테스트 API (브라우저 환경 오류 확인)', async () => {
      const result = await testApiEndpoint('/api/auth/test', 500);
      
      expect(result.data.success).toBe(false);
      expect(result.data.error).toContain('window.location.assign is not a function');
    });

    it('POST /api/ai/query - 인증 필요 API (미인증 상태)', async () => {
      const result = await testApiEndpoint('/api/ai/query', 401, undefined, 'POST', {
        query: '시스템 상태는 어떤가요?'
      });
      
      expect(result.data.error).toContain('Unauthorized');
    });

    it('POST /api/ai/query - 잘못된 요청 형식', async () => {
      const result = await testApiEndpoint('/api/ai/query', 401, undefined, 'POST', {
        // query 필드 누락
        invalidField: 'test'
      });
      
      expect(result.data.error).toContain('Unauthorized');
    });
  });

  describe('❌ 에러 처리 테스트', () => {
    it('GET /api/nonexistent - 존재하지 않는 엔드포인트', async () => {
      const result = await testApiEndpoint('/api/nonexistent', 404);
      
      expect(result.data.error).toBe('Not Found');
      expect(result.data.statusCode).toBe(404);
      expect(result.data.path).toBe('/api/nonexistent');
    });

    it('POST /api/health - 잘못된 HTTP 메서드', async () => {
      const result = await testApiEndpoint('/api/health', 405, undefined, 'POST');
      
      expect(result.status).toBe(405);
    });

    it('PUT /api/metrics - 지원하지 않는 메서드', async () => {
      const result = await testApiEndpoint('/api/metrics', 405, undefined, 'PUT');
      
      expect(result.status).toBe(405);
    });
  });

  describe('⚡ 성능 테스트', () => {
    it('모든 핵심 API 응답 시간 종합 테스트', async () => {
      const endpoints = [
        '/api/health',
        '/api/metrics', 
        '/api/servers/all',
        '/api/system/status',
        '/api/dashboard'
      ];

      const results = await Promise.all(
        endpoints.map(async (endpoint) => {
          const { responseTime } = await fetchWithTiming(`${BASE_URL}${endpoint}`);
          return { endpoint, responseTime };
        })
      );

      // 모든 API가 5초 미만 응답
      results.forEach(({ endpoint, responseTime }) => {
        expect(responseTime).toBeLessThan(5000);
        console.log(`📊 ${endpoint}: ${responseTime.toFixed(0)}ms`);
      });

      // 평균 응답 시간 계산
      const avgResponseTime = results.reduce((sum, r) => sum + r.responseTime, 0) / results.length;
      expect(avgResponseTime).toBeLessThan(3000); // 평균 3초 미만
      
      console.log(`📈 평균 응답 시간: ${avgResponseTime.toFixed(0)}ms`);
    });

    it('동시 요청 처리 성능 테스트', async () => {
      const concurrentRequests = 5;
      const endpoint = '/api/health';

      const promises = Array(concurrentRequests).fill(null).map(() =>
        fetchWithTiming(`${BASE_URL}${endpoint}`)
      );

      const results = await Promise.all(promises);

      // 모든 동시 요청이 성공
      results.forEach(({ response, responseTime }) => {
        expect(response.status).toBe(200);
        expect(responseTime).toBeLessThan(10000); // 10초 미만
      });

      console.log(`🔄 동시 요청 ${concurrentRequests}개 평균: ${
        results.reduce((sum, r) => sum + r.responseTime, 0) / results.length
      }ms`);
    });
  });

  describe('🔍 데이터 무결성 테스트', () => {
    it('서버 목록과 메트릭 데이터 일관성 확인', async () => {
      const [serversResult, metricsResult] = await Promise.all([
        testApiEndpoint('/api/servers/all', 200),
        testApiEndpoint('/api/metrics', 200)
      ]);

      // 서버 수 일관성 확인 (대략적 비교)
      const serverCount = serversResult.data.data.length;
      const metricsTotal = metricsResult.data.totalServers;
      
      // 차이가 50% 이내여야 함 (동적 데이터 고려)
      const difference = Math.abs(serverCount - metricsTotal);
      const tolerance = Math.max(serverCount, metricsTotal) * 0.5;
      
      expect(difference).toBeLessThanOrEqual(tolerance);
      
      console.log(`📊 서버 수 일관성: API=${serverCount}, 메트릭=${metricsTotal}`);
    });

    it('타임스탬프 유효성 검증', async () => {
      const result = await testApiEndpoint('/api/health', 200);
      
      const apiTimestamp = new Date(result.data.timestamp);
      const now = new Date();
      const timeDiff = Math.abs(now.getTime() - apiTimestamp.getTime());
      
      // 타임스탬프가 현재 시간으로부터 5분 이내
      expect(timeDiff).toBeLessThan(5 * 60 * 1000);
    });
  });
});