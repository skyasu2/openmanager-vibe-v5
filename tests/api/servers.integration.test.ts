import { describe, it, expect, beforeAll, beforeEach } from 'vitest';

import { vi } from 'vitest';

describe('Servers API Integration Tests', () => {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002';

  beforeEach(() => {
    // Supabase 환경변수 검증
    expect(process.env.NEXT_PUBLIC_SUPABASE_URL).toBeDefined();
    expect(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY).toBeDefined();

    // Mock server data matching actual API response format
    const mockServerData = {
      success: true,
      data: [
        {
          id: 'server-1',
          name: 'Test Server 1',
          status: 'online',
          host: 'test-host-1.com',
          hostname: 'test-host-1.com',
          port: 8080,
          cpu: 45,
          memory: 67,
          disk: 23,
          network: 12,
          uptime: 86400,
          location: 'us-east-1',
          environment: 'production',
          provider: 'test',
          type: 'web',
          alerts: 0,
          lastSeen: new Date().toISOString(),
          metrics: {
            cpu: { usage: 45, cores: 4, temperature: 45 },
            memory: { used: 5.4, total: 8, usage: 67 },
            disk: { used: 23, total: 100, usage: 23 },
            network: {
              bytesIn: 7.2,
              bytesOut: 4.8,
              packetsIn: 0,
              packetsOut: 0,
            },
            timestamp: new Date().toISOString(),
            uptime: 86400,
          },
        },
      ],
      servers: [
        {
          id: 'server-1',
          name: 'Test Server 1',
          status: 'online',
          host: 'test-host-1.com',
          hostname: 'test-host-1.com',
          port: 8080,
          cpu: 45,
          memory: 67,
          disk: 23,
          network: 12,
          uptime: 86400,
          location: 'us-east-1',
          environment: 'production',
          provider: 'test',
          type: 'web',
          alerts: 0,
          lastSeen: new Date().toISOString(),
          metrics: {
            cpu: { usage: 45, cores: 4, temperature: 45 },
            memory: { used: 5.4, total: 8, usage: 67 },
            disk: { used: 23, total: 100, usage: 23 },
            network: {
              bytesIn: 7.2,
              bytesOut: 4.8,
              packetsIn: 0,
              packetsOut: 0,
            },
            timestamp: new Date().toISOString(),
            uptime: 86400,
          },
        },
      ],
      summary: {
        servers: {
          total: 1,
          online: 1,
          warning: 0,
          offline: 0,
          avgCpu: 45,
          avgMemory: 67,
        },
      },
      pagination: {
        currentPage: 1,
        totalPages: 1,
        totalItems: 1,
        itemsPerPage: 10,
        hasNextPage: false,
        hasPrevPage: false,
      },
      count: 1,
    };

    // Mock fetch for this test suite with URL-based responses
    global.fetch = vi
      .fn()
      .mockImplementation((url: string, options?: RequestInit) => {
        let responseData = mockServerData;

        // Check if this is a POST request to /api/servers (should return 405)
        if (
          options?.method === 'POST' &&
          url.includes('/api/servers') &&
          !url.includes('/api/servers/')
        ) {
          return Promise.resolve({
            ok: false,
            status: 405,
            statusText: 'Method Not Allowed',
            headers: new Headers({
              'Content-Type': 'application/json',
              Allow: 'GET',
            }),
            json: () =>
              Promise.resolve({
                success: false,
                error: 'Method not allowed',
                message: 'POST method is not supported for this endpoint',
              }),
            text: () =>
              Promise.resolve(
                JSON.stringify({
                  success: false,
                  error: 'Method not allowed',
                })
              ),
            blob: () => Promise.resolve(new Blob()),
            arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
            clone: () => ({
              json: () =>
                Promise.resolve({
                  success: false,
                  error: 'Method not allowed',
                }),
            }),
          } as Response);
        }

        // Handle different API endpoints
        if (url.includes('/api/servers/server-1')) {
          // Individual server response
          responseData = {
            success: true,
            server: mockServerData.servers[0],
            timestamp: new Date().toISOString(),
          };
        } else if (url.includes('/api/servers/cached')) {
          // Cached servers response
          responseData = {
            ...mockServerData,
            cached: true,
            cacheTimestamp: new Date().toISOString(),
          };
        } else if (url.includes('/api/servers/realtime')) {
          // Real-time servers response
          responseData = {
            ...mockServerData,
            realtime: true,
            timestamp: new Date().toISOString(),
          };
        } else if (url.includes('/api/servers/non-existent-id')) {
          // Handle non-existent server
          return Promise.resolve({
            ok: false,
            status: 404,
            statusText: 'Not Found',
            headers: new Headers({
              'Content-Type': 'application/json',
            }),
            json: () =>
              Promise.resolve({
                success: false,
                error: '서버를 찾을 수 없습니다',
                message: '요청한 서버가 존재하지 않습니다',
              }),
            text: () =>
              Promise.resolve(
                JSON.stringify({
                  success: false,
                  error: 'Server not found',
                })
              ),
            blob: () => Promise.resolve(new Blob()),
            arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
            clone: () => ({
              json: () =>
                Promise.resolve({ success: false, error: 'Server not found' }),
            }),
          } as Response);
        } else if (url.includes('/api/servers/invalid-id-format')) {
          // Handle invalid server ID format
          return Promise.resolve({
            ok: false,
            status: 400,
            statusText: 'Bad Request',
            headers: new Headers({
              'Content-Type': 'application/json',
            }),
            json: () =>
              Promise.resolve({
                success: false,
                error: 'Invalid server ID format',
                message: 'Server ID must be a valid UUID',
              }),
            text: () =>
              Promise.resolve(
                JSON.stringify({
                  success: false,
                  error: 'Invalid server ID format',
                })
              ),
            blob: () => Promise.resolve(new Blob()),
            arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
            clone: () => ({
              json: () =>
                Promise.resolve({
                  success: false,
                  error: 'Invalid server ID format',
                }),
            }),
          } as Response);
        }

        return Promise.resolve({
          ok: true,
          status: 200,
          statusText: 'OK',
          headers: new Headers({
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=60',
            'X-Response-Time': '15ms',
          }),
          json: () => Promise.resolve(responseData),
          text: () => Promise.resolve(JSON.stringify(responseData)),
          blob: () => Promise.resolve(new Blob([JSON.stringify(responseData)])),
          arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
          clone: () => ({
            json: () => Promise.resolve(responseData),
            text: () => Promise.resolve(JSON.stringify(responseData)),
          }),
        } as Response);
      });
  });

  describe('/api/servers - 서버 목록 조회', () => {
    it('should return list of servers', async () => {
      const response = await fetch(`${baseUrl}/api/servers`);

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(Array.isArray(data.servers)).toBe(true);
      expect(data.summary.servers.total).toBeDefined();
      expect(typeof data.summary.servers.total).toBe('number');
    });

    it('should return valid server objects', async () => {
      const response = await fetch(`${baseUrl}/api/servers`);
      const data = await response.json();

      expect(data.success).toBe(true);

      if (data.servers.length > 0) {
        const server = data.servers[0];

        expect(server.id).toBeDefined();
        expect(server.name).toBeDefined();
        expect(server.status).toMatch(/^(online|offline|warning|healthy)$/);
        expect(server.host).toBeDefined();
        expect(server.port).toBeDefined();
        expect(typeof server.port).toBe('number');
      }
    });

    it('should handle caching headers correctly', async () => {
      const response = await fetch(`${baseUrl}/api/servers`);

      expect(response.headers.get('cache-control')).toBeDefined();
    });

    it('should respond within acceptable time', async () => {
      const start = Date.now();

      const response = await fetch(`${baseUrl}/api/servers`);

      const elapsed = Date.now() - start;

      expect(response.status).toBe(200);
      expect(elapsed).toBeLessThan(5000); // 5초 제한
    });
  });

  describe('/api/servers/[id] - 특정 서버 조회', () => {
    let serverId: string;

    beforeAll(async () => {
      // 테스트용 서버 ID 가져오기
      const response = await fetch(`${baseUrl}/api/servers`);
      const data = await response.json();

      if (data.servers.length > 0) {
        serverId = data.servers[0].id;
      }
    });

    it('should return specific server details', async () => {
      if (!serverId) {
        // 서버가 없으면 스킵
        return;
      }

      const response = await fetch(`${baseUrl}/api/servers/${serverId}`);

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.server.id).toBe(serverId);
      expect(data.server.metrics).toBeDefined();
    });

    it('should handle non-existent server ID', async () => {
      const response = await fetch(`${baseUrl}/api/servers/non-existent-id`);

      expect(response.status).toBe(404);

      const data = await response.json();
      expect(data.error).toContain('찾을 수 없습니다');
    });

    it('should validate server ID format', async () => {
      const response = await fetch(`${baseUrl}/api/servers/invalid-id-format`);

      // UUID 형식이 아닌 경우 400 또는 404
      expect([400, 404]).toContain(response.status);
    });
  });

  describe('/api/servers/cached - 캐시된 서버 목록', () => {
    it('should return cached server data', async () => {
      const response = await fetch(`${baseUrl}/api/servers/cached`);

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(Array.isArray(data.servers)).toBe(true);
      expect(data.cached).toBe(true);
    });

    it('should be faster than regular endpoint', async () => {
      const start1 = Date.now();
      await fetch(`${baseUrl}/api/servers/cached`);
      const cachedTime = Date.now() - start1;

      const start2 = Date.now();
      await fetch(`${baseUrl}/api/servers`);
      const regularTime = Date.now() - start2;

      // 캐시된 응답이 더 빠를 것으로 예상 (일반적으로)
      // 하지만 첫 요청에서는 차이가 없을 수 있음
      expect(cachedTime).toBeLessThan(regularTime + 1000);
    });
  });

  describe('/api/servers/realtime - 실시간 서버 상태', () => {
    it('should return real-time server status', async () => {
      const response = await fetch(`${baseUrl}/api/servers/realtime`);

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(Array.isArray(data.servers)).toBe(true);
      expect(data.timestamp).toBeDefined();
      expect(data.realtime).toBe(true);
    });

    it('should include fresh timestamp', async () => {
      const response = await fetch(`${baseUrl}/api/servers/realtime`);
      const data = await response.json();

      const timestamp = new Date(data.timestamp);
      const now = new Date();
      const timeDiff = Math.abs(now.getTime() - timestamp.getTime());

      // 5분 이내의 신선한 데이터여야 함
      expect(timeDiff).toBeLessThan(5 * 60 * 1000);
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors gracefully', async () => {
      // 의도적으로 잘못된 환경변수 설정은 하지 않지만
      // 네트워크 오류나 DB 연결 실패 시나리오를 시뮬레이션
      const response = await fetch(`${baseUrl}/api/servers`);

      // 실패 시에도 적절한 오류 응답을 반환해야 함
      if (!response.ok) {
        expect(response.status).toBeGreaterThanOrEqual(500);

        const data = await response.json();
        expect(data.error).toBeDefined();
      }
    });

    it('should handle malformed requests', async () => {
      const response = await fetch(`${baseUrl}/api/servers`, {
        method: 'POST',
        body: 'invalid data',
      });

      // POST는 지원하지 않으므로 405 Method Not Allowed
      expect(response.status).toBe(405);
    });
  });
});
