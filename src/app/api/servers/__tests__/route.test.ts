import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET as getServers } from '../route';
import { GET as getAllServers } from '../all/route';
import { GET as getServerById } from '../[id]/route';
import { getMockSystem } from '@/mock';

// Mock dependencies
vi.mock('@/mock', () => ({
  getMockSystem: vi.fn(),
}));

describe('/api/servers API Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    console.log = vi.fn();
    console.error = vi.fn();
  });

  describe('GET /api/servers', () => {
    it('리다이렉트를 /api/servers/all로 수행해야 함', async () => {
      const request = new NextRequest('http://localhost:3000/api/servers');
      
      const response = await getServers(request);
      
      expect(response.status).toBe(308); // Permanent Redirect
      expect(response.headers.get('location')).toContain('/api/servers/all');
    });
  });

  describe('GET /api/servers/all', () => {
    const mockServers = [
      {
        id: 'web-001',
        hostname: 'web-server-001',
        status: 'online',
        cpu: 45.5,
        memory: 62.3,
        disk: 35.2,
        environment: 'aws',
        role: 'web',
      },
      {
        id: 'db-001',
        hostname: 'db-server-001',
        status: 'warning',
        cpu: 75.5,
        memory: 85.3,
        disk: 65.2,
        environment: 'onpremise',
        role: 'database',
      },
      {
        id: 'api-001',
        hostname: 'api-server-001',
        status: 'critical',
        cpu: 95.5,
        memory: 92.3,
        disk: 85.2,
        environment: 'gcp',
        role: 'api',
      },
    ];

    beforeEach(() => {
      const mockSystem = {
        getServers: vi.fn().mockReturnValue(mockServers),
      };
      vi.mocked(getMockSystem).mockReturnValue(mockSystem as ReturnType<typeof getMockSystem>);
    });

    it('모든 서버 목록을 반환해야 함', async () => {
      const response = await getAllServers();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(3);
      expect(data.count).toBe(3);
      expect(data.dataSource).toBe('mock-only');
    });

    it('서버 통계를 정확히 계산해야 함', async () => {
      const response = await getAllServers();
      const data = await response.json();

      expect(data.stats).toEqual({
        total: 3,
        online: 1,
        warning: 1,
        critical: 1,
      });
    });

    it('캐싱 헤더를 포함해야 함', async () => {
      const response = await getAllServers();

      expect(response.headers.get('Cache-Control')).toBe(
        'public, s-maxage=30, stale-while-revalidate=60'
      );
      expect(response.headers.get('CDN-Cache-Control')).toBe('public, s-maxage=30');
    });

    it('오류 발생 시 적절한 에러 응답을 반환해야 함', async () => {
      const mockSystem = {
        getServers: vi.fn().mockImplementation(() => {
          throw new Error('Mock error');
        }),
      };
      vi.mocked(getMockSystem).mockReturnValue(mockSystem as ReturnType<typeof getMockSystem>);

      const response = await getAllServers();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Failed to fetch servers');
    });
  });

  describe('GET /api/servers/[id]', () => {
    const mockServer = {
      id: 'web-001',
      hostname: 'web-server-001',
      name: 'Web Server 001',
      role: 'web',
      environment: 'aws',
      status: 'online',
      cpu: 45.5,
      memory: 62.3,
      disk: 35.2,
      network: 100,
      uptime: 864000, // 10 days
      lastUpdate: '2024-01-15T10:00:00Z',
      alerts: [],
    };

    beforeEach(() => {
      const mockSystem = {
        getServers: vi.fn().mockReturnValue([mockServer]),
        getSystemInfo: vi.fn().mockReturnValue({
          scenario: 'mixed',
        }),
      };
      vi.mocked(getMockSystem).mockReturnValue(mockSystem as ReturnType<typeof getMockSystem>);
    });

    it('ID로 특정 서버를 찾아야 함', async () => {
      const request = new NextRequest('http://localhost:3000/api/servers/web-001');
      const params = Promise.resolve({ id: 'web-001' });

      const response = await getServerById(request, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.server_info.id).toBe('web-001');
      expect(data.data.server_info.hostname).toBe('web-server-001');
    });

    it('hostname으로도 서버를 찾을 수 있어야 함', async () => {
      const request = new NextRequest('http://localhost:3000/api/servers/web-server-001');
      const params = Promise.resolve({ id: 'web-server-001' });

      const response = await getServerById(request, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.server_info.id).toBe('web-001');
    });

    it('서버를 찾을 수 없을 때 404를 반환해야 함', async () => {
      const request = new NextRequest('http://localhost:3000/api/servers/unknown');
      const params = Promise.resolve({ id: 'unknown' });

      const response = await getServerById(request, { params });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Server not found');
      expect(data.available_servers).toBeDefined();
    });

    it('히스토리 데이터를 요청 시 포함해야 함', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/servers/web-001?history=true&range=1h'
      );
      const params = Promise.resolve({ id: 'web-001' });

      const response = await getServerById(request, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.history).toBeDefined();
      expect(data.data.history.time_range).toBe('1h');
      expect(data.data.history.data_points).toHaveLength(100);
    });

    it('레거시 형식을 지원해야 함', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/servers/web-001?format=legacy'
      );
      const params = Promise.resolve({ id: 'web-001' });

      const response = await getServerById(request, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.server).toBeDefined();
      expect(data.server.id).toBe('web-001');
      expect(data.meta.format).toBe('legacy');
    });

    it('Prometheus 형식은 410 Gone을 반환해야 함', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/servers/web-001?format=prometheus'
      );
      const params = Promise.resolve({ id: 'web-001' });

      const response = await getServerById(request, { params });
      const data = await response.json();

      expect(response.status).toBe(410); // Gone
      expect(data.error).toBe('Prometheus format is no longer supported');
    });

    it('커스텀 헤더를 포함해야 함', async () => {
      const request = new NextRequest('http://localhost:3000/api/servers/web-001');
      const params = Promise.resolve({ id: 'web-001' });

      const response = await getServerById(request, { params });

      expect(response.headers.get('X-Server-Id')).toBe('web-001');
      expect(response.headers.get('X-Hostname')).toBe('web-server-001');
      expect(response.headers.get('X-Server-Status')).toBe('online');
      expect(response.headers.get('X-Processing-Time-Ms')).toBeDefined();
    });

    it('업타임을 올바른 형식으로 포맷해야 함', async () => {
      const request = new NextRequest('http://localhost:3000/api/servers/web-001');
      const params = Promise.resolve({ id: 'web-001' });

      const response = await getServerById(request, { params });
      const data = await response.json();

      expect(data.data.server_info.uptime).toBe('10d 0h 0m');
    });

    it('역할에 따른 적절한 서비스를 생성해야 함', async () => {
      const request = new NextRequest('http://localhost:3000/api/servers/web-001');
      const params = Promise.resolve({ id: 'web-001' });

      const response = await getServerById(request, { params });
      const data = await response.json();

      const services = data.data.services;
      expect(services).toContainEqual(
        expect.objectContaining({ name: 'nginx', port: 80 })
      );
      expect(services).toContainEqual(
        expect.objectContaining({ name: 'nodejs', port: 3000 })
      );
    });

    it('오류 발생 시 적절한 에러 응답을 반환해야 함', async () => {
      const mockSystem = {
        getServers: vi.fn().mockImplementation(() => {
          throw new Error('Database connection failed');
        }),
      };
      vi.mocked(getMockSystem).mockReturnValue(mockSystem as ReturnType<typeof getMockSystem>);

      const request = new NextRequest('http://localhost:3000/api/servers/web-001');
      const params = Promise.resolve({ id: 'web-001' });

      const response = await getServerById(request, { params });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Server information retrieval failed');
    });
  });
});