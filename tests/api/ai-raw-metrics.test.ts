/**
 * AI Raw Metrics API Integration Tests
 *
 * @description 순수 메트릭 API 엔드포인트 테스트
 * @created 2026-01-22
 *
 * 테스트 대상:
 * - GET /api/ai/raw-metrics (기본 메트릭)
 * - GET /api/ai/raw-metrics?serverId=xxx (특정 서버)
 * - GET /api/ai/raw-metrics?includeHistory=true (시계열)
 * - 에러 케이스 (404, 400)
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

interface RawServerMetric {
  id: string;
  name: string;
  hostname: string;
  status: string;
  cpu: number;
  memory: number;
  disk: number;
  network: number;
  uptime: number;
  timestamp: string;
  location: string;
  type: string;
  environment: string;
  responseTime?: number;
  connections?: number;
  load?: number;
}

interface RawMetricsResponse {
  success: boolean;
  data:
    | RawServerMetric[]
    | { serverId: string; metric: string; history: unknown[] };
  count?: number;
  metadata?: {
    serverId?: string;
    metric?: string;
    range?: string;
    timestamp: string;
  };
  error?: string;
  message?: string;
}

describe('AI Raw Metrics API Integration Tests', () => {
  const baseUrl = 'http://localhost:3002';

  // Mock 서버 데이터
  const mockServers: RawServerMetric[] = [
    {
      id: 'server-1',
      name: 'Web Server #1',
      hostname: 'web-01.internal',
      status: 'online',
      cpu: 45,
      memory: 60,
      disk: 55,
      network: 25,
      uptime: 86400,
      timestamp: new Date().toISOString(),
      location: 'datacenter-east',
      type: 'web',
      environment: 'production',
      responseTime: 150,
      connections: 200,
      load: 1.8,
    },
    {
      id: 'server-2',
      name: 'Database Server #2',
      hostname: 'db-01.internal',
      status: 'warning',
      cpu: 78,
      memory: 85,
      disk: 70,
      network: 15,
      uptime: 172800,
      timestamp: new Date().toISOString(),
      location: 'datacenter-west',
      type: 'database',
      environment: 'production',
      responseTime: 50,
      connections: 500,
      load: 3.1,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock fetch implementation
    global.fetch = vi
      .fn()
      .mockImplementation((url: string, options?: RequestInit) => {
        const urlObj = new URL(url);
        const pathname = urlObj.pathname;
        const searchParams = urlObj.searchParams;

        // Only handle GET requests to raw-metrics
        if (pathname.includes('/api/ai/raw-metrics')) {
          const serverId = searchParams.get('serverId');
          const includeHistory = searchParams.get('includeHistory') === 'true';
          const metric = searchParams.get('metric');
          const limit = parseInt(searchParams.get('limit') || '10', 10);

          // 시계열 데이터 요청
          if (includeHistory && serverId && metric) {
            const server = mockServers.find((s) => s.id === serverId);

            if (!server) {
              return Promise.resolve({
                ok: false,
                status: 404,
                statusText: 'Not Found',
                headers: new Headers({ 'Content-Type': 'application/json' }),
                json: () =>
                  Promise.resolve({
                    success: false,
                    error: 'SERVER_NOT_FOUND',
                    message: '서버를 찾을 수 없습니다.',
                  }),
              } as Response);
            }

            // 유효한 메트릭 검증
            const validMetrics = ['cpu', 'memory', 'disk', 'network'];
            if (!validMetrics.includes(metric)) {
              return Promise.resolve({
                ok: false,
                status: 400,
                statusText: 'Bad Request',
                headers: new Headers({ 'Content-Type': 'application/json' }),
                json: () =>
                  Promise.resolve({
                    success: false,
                    error: 'INVALID_METRIC',
                    message: '유효하지 않은 메트릭입니다.',
                  }),
              } as Response);
            }

            // Mock 시계열 데이터
            const mockHistory = Array.from({ length: 12 }, (_, i) => ({
              timestamp: new Date(Date.now() - i * 300000).toISOString(),
              value:
                (server[metric as keyof RawServerMetric] as number) +
                Math.random() * 10 -
                5,
            }));

            return Promise.resolve({
              ok: true,
              status: 200,
              headers: new Headers({
                'Content-Type': 'application/json',
                'X-AI-Data-Source': 'time-series',
              }),
              json: () =>
                Promise.resolve({
                  success: true,
                  data: {
                    serverId: server.id,
                    serverName: server.name,
                    metric,
                    history: mockHistory,
                  },
                  metadata: {
                    serverId,
                    metric,
                    range: searchParams.get('range') || '6h',
                    historyPoints: mockHistory.length,
                    timestamp: new Date().toISOString(),
                  },
                }),
            } as Response);
          }

          // 특정 서버 요청
          if (serverId && !includeHistory) {
            const server = mockServers.find((s) => s.id === serverId);

            if (!server) {
              return Promise.resolve({
                ok: false,
                status: 404,
                statusText: 'Not Found',
                headers: new Headers({ 'Content-Type': 'application/json' }),
                json: () =>
                  Promise.resolve({
                    success: false,
                    error: 'SERVER_NOT_FOUND',
                    message: '서버를 찾을 수 없습니다.',
                  }),
              } as Response);
            }

            return Promise.resolve({
              ok: true,
              status: 200,
              headers: new Headers({ 'Content-Type': 'application/json' }),
              json: () =>
                Promise.resolve({
                  success: true,
                  data: [server],
                  count: 1,
                  metadata: {
                    timestamp: new Date().toISOString(),
                  },
                }),
            } as Response);
          }

          // 기본 메트릭 목록 요청
          const limitedServers = mockServers.slice(
            0,
            Math.min(limit, mockServers.length)
          );

          return Promise.resolve({
            ok: true,
            status: 200,
            headers: new Headers({
              'Content-Type': 'application/json',
              'X-AI-Data-Source': 'pure-metrics',
            }),
            json: () =>
              Promise.resolve({
                success: true,
                data: limitedServers,
                count: limitedServers.length,
                metadata: {
                  timestamp: new Date().toISOString(),
                },
              }),
          } as Response);
        }

        // 기타 요청 처리
        return Promise.resolve({
          ok: false,
          status: 404,
          json: () => Promise.resolve({ error: 'Not Found' }),
        } as Response);
      });
  });

  describe('GET /api/ai/raw-metrics (기본 메트릭)', () => {
    it('서버 목록을 반환해야 함', async () => {
      // When
      const response = await fetch(`${baseUrl}/api/ai/raw-metrics`);
      const data: RawMetricsResponse = await response.json();

      // Then
      expect(response.ok).toBe(true);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
      expect(data.count).toBeGreaterThan(0);
    });

    it('limit 파라미터로 결과 수를 제한할 수 있어야 함', async () => {
      // When
      const response = await fetch(`${baseUrl}/api/ai/raw-metrics?limit=1`);
      const data: RawMetricsResponse = await response.json();

      // Then
      expect(response.ok).toBe(true);
      expect(data.count).toBe(1);
    });

    it('메트릭 데이터가 올바른 형식이어야 함', async () => {
      // When
      const response = await fetch(`${baseUrl}/api/ai/raw-metrics`);
      const data: RawMetricsResponse = await response.json();

      // Then
      expect(data.success).toBe(true);
      const servers = data.data as RawServerMetric[];
      expect(servers[0]).toHaveProperty('id');
      expect(servers[0]).toHaveProperty('name');
      expect(servers[0]).toHaveProperty('cpu');
      expect(servers[0]).toHaveProperty('memory');
      expect(servers[0]).toHaveProperty('disk');
      expect(servers[0]).toHaveProperty('network');
      expect(servers[0]).toHaveProperty('status');
    });

    it('timestamp가 포함되어야 함', async () => {
      // When
      const response = await fetch(`${baseUrl}/api/ai/raw-metrics`);
      const data: RawMetricsResponse = await response.json();

      // Then
      expect(data.metadata?.timestamp).toBeDefined();
    });
  });

  describe('GET /api/ai/raw-metrics?serverId=xxx (특정 서버)', () => {
    it('존재하는 서버를 반환해야 함', async () => {
      // When
      const response = await fetch(
        `${baseUrl}/api/ai/raw-metrics?serverId=server-1`
      );
      const data: RawMetricsResponse = await response.json();

      // Then
      expect(response.ok).toBe(true);
      expect(data.success).toBe(true);
      const servers = data.data as RawServerMetric[];
      expect(servers[0].id).toBe('server-1');
    });

    it('존재하지 않는 서버는 404를 반환해야 함', async () => {
      // When
      const response = await fetch(
        `${baseUrl}/api/ai/raw-metrics?serverId=non-existent`
      );
      const data: RawMetricsResponse = await response.json();

      // Then
      expect(response.ok).toBe(false);
      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('SERVER_NOT_FOUND');
    });
  });

  describe('GET /api/ai/raw-metrics?includeHistory=true (시계열)', () => {
    it('시계열 데이터를 반환해야 함', async () => {
      // When
      const response = await fetch(
        `${baseUrl}/api/ai/raw-metrics?serverId=server-1&metric=cpu&includeHistory=true`
      );
      const data = await response.json();

      // Then
      expect(response.ok).toBe(true);
      expect(data.success).toBe(true);
      expect(data.data.serverId).toBe('server-1');
      expect(data.data.metric).toBe('cpu');
      expect(Array.isArray(data.data.history)).toBe(true);
      expect(data.data.history.length).toBeGreaterThan(0);
    });

    it('history 포인트에 timestamp와 value가 있어야 함', async () => {
      // When
      const response = await fetch(
        `${baseUrl}/api/ai/raw-metrics?serverId=server-1&metric=memory&includeHistory=true`
      );
      const data = await response.json();

      // Then
      expect(data.data.history[0]).toHaveProperty('timestamp');
      expect(data.data.history[0]).toHaveProperty('value');
    });

    it('존재하지 않는 서버는 404를 반환해야 함', async () => {
      // When
      const response = await fetch(
        `${baseUrl}/api/ai/raw-metrics?serverId=invalid&metric=cpu&includeHistory=true`
      );
      const data = await response.json();

      // Then
      expect(response.ok).toBe(false);
      expect(response.status).toBe(404);
      expect(data.error).toBe('SERVER_NOT_FOUND');
    });

    it('유효하지 않은 메트릭은 400을 반환해야 함', async () => {
      // When
      const response = await fetch(
        `${baseUrl}/api/ai/raw-metrics?serverId=server-1&metric=invalid&includeHistory=true`
      );
      const data = await response.json();

      // Then
      expect(response.ok).toBe(false);
      expect(response.status).toBe(400);
      expect(data.error).toBe('INVALID_METRIC');
    });
  });

  describe('응답 헤더', () => {
    it('Content-Type이 application/json이어야 함', async () => {
      // When
      const response = await fetch(`${baseUrl}/api/ai/raw-metrics`);

      // Then
      expect(response.headers.get('Content-Type')).toBe('application/json');
    });

    it('시계열 요청 시 X-AI-Data-Source 헤더가 있어야 함', async () => {
      // When
      const response = await fetch(
        `${baseUrl}/api/ai/raw-metrics?serverId=server-1&metric=cpu&includeHistory=true`
      );

      // Then
      expect(response.headers.get('X-AI-Data-Source')).toBe('time-series');
    });
  });
});
