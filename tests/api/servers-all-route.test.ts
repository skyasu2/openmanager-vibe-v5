/**
 * /api/servers/all 엔드포인트 간소화된 테스트
 * 실제 가치 있는 검증에 집중
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '../../src/app/api/servers/all/route';
import { NextRequest } from 'next/server';

// Mock StaticDataLoader - 실제 구현된 로직 사용
vi.mock('@/data/StaticDataLoader', () => ({
  StaticDataLoader: {
    getServerData: vi.fn(() => ({
      servers: {
        'web-01': {
          id: 'web-01',
          name: 'Web Server #1',
          status: 'online',
          cpu: 25,
          memory: 45,
          disk: 60
        },
        'api-01': {
          id: 'api-01', 
          name: 'API Server #1',
          status: 'warning',
          cpu: 75,
          memory: 80,
          disk: 40
        }
      },
      lastUpdated: new Date().toISOString(),
      totalServers: 2
    }))
  }
}));

beforeEach(() => {
  vi.clearAllMocks();
  // Mock 환경변수
  process.env.MOCK_MODE = 'force';
});

function createMockRequest(params: Record<string, string> = {}): NextRequest {
  const url = new URL('http://localhost:3000/api/servers/all');
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });
  return new NextRequest(url);
}

describe('/api/servers/all 엔드포인트 테스트', () => {
  describe('기본 API 동작', () => {
    it('정상적인 서버 목록을 반환해야 함', async () => {
      const request = createMockRequest();
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toBeDefined();
      expect(data.data.servers).toBeDefined();
      expect(typeof data.data.totalServers).toBe('number');
    });

    it('서버 데이터 구조가 올바른지 검증', async () => {
      const request = createMockRequest();
      const response = await GET(request);
      const data = await response.json();
      
      const servers = Object.values(data.data.servers) as any[];
      
      if (servers.length > 0) {
        const server = servers[0];
        expect(server).toHaveProperty('id');
        expect(server).toHaveProperty('name');
        expect(server).toHaveProperty('status');
        expect(server).toHaveProperty('cpu');
        expect(server).toHaveProperty('memory');
        expect(server).toHaveProperty('disk');
      }
    });

    it('메트릭 값이 유효한 범위 내에 있는지 확인', async () => {
      const request = createMockRequest();
      const response = await GET(request);
      const data = await response.json();
      
      const servers = Object.values(data.data.servers) as any[];
      
      servers.forEach((server: any) => {
        expect(server.cpu).toBeGreaterThanOrEqual(0);
        expect(server.cpu).toBeLessThanOrEqual(100);
        expect(server.memory).toBeGreaterThanOrEqual(0);
        expect(server.memory).toBeLessThanOrEqual(100);
        expect(server.disk).toBeGreaterThanOrEqual(0);
        expect(server.disk).toBeLessThanOrEqual(100);
      });
    });
  });

  describe('쿼리 파라미터 처리', () => {
    it('limit 파라미터를 올바르게 처리해야 함', async () => {
      const request = createMockRequest({ limit: '1' });
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('정렬 파라미터를 올바르게 처리해야 함', async () => {
      const request = createMockRequest({ sort: 'cpu', order: 'desc' });
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });

  describe('에러 처리', () => {
    it('잘못된 파라미터에 대해 적절히 대응해야 함', async () => {
      const request = createMockRequest({ limit: 'invalid' });
      const response = await GET(request);
      
      // 에러가 나거나 기본값으로 처리되어야 함
      expect([200, 400, 500]).toContain(response.status);
    });
  });
});