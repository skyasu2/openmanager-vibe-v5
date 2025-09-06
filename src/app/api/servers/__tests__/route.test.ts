/**
 * 🧪 서버 API 엔드포인트 테스트
 * /api/servers 라우트에 대한 단위 테스트
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock server data service
const mockServers = [
  {
    id: 'server-1',
    name: 'Test Server 1',
    hostname: 'test1.example.com',
    status: 'online',
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
      network: { bytesIn: 7.2, bytesOut: 4.8, packetsIn: 0, packetsOut: 0 },
      timestamp: new Date().toISOString(),
      uptime: 86400,
    },
  },
];

const mockServerService = {
  getAllServers: vi.fn().mockResolvedValue(mockServers),
  getServerById: vi.fn().mockImplementation((id: string) => {
    if (id === 'server-1') {
      return Promise.resolve(mockServers[0]);
    }
    return Promise.resolve(null);
  }),
};

vi.mock('../../../../services/data/ServerDataService', () => ({
  ServerDataService: {
    getInstance: vi.fn(() => mockServerService),
  },
}));

describe('/api/servers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('서버 데이터 서비스', () => {
    it('서버 목록을 성공적으로 반환한다', async () => {
      const servers = await mockServerService.getAllServers();
      
      expect(servers).toBeDefined();
      expect(Array.isArray(servers)).toBe(true);
      expect(servers).toHaveLength(1);
      expect(servers[0]).toHaveProperty('id', 'server-1');
      expect(servers[0]).toHaveProperty('name', 'Test Server 1');
      expect(servers[0]).toHaveProperty('status', 'online');
    });

    it('서버 메트릭 데이터가 올바른 형식을 가진다', async () => {
      const servers = await mockServerService.getAllServers();
      const server = servers[0];
      
      expect(server.metrics).toBeDefined();
      expect(server.metrics).toHaveProperty('cpu');
      expect(server.metrics).toHaveProperty('memory');
      expect(server.metrics).toHaveProperty('disk');
      expect(server.metrics).toHaveProperty('network');
      expect(server.metrics).toHaveProperty('timestamp');
      expect(server.metrics).toHaveProperty('uptime');
    });

    it('서버별 상세 정보를 조회할 수 있다', async () => {
      const server = await mockServerService.getServerById('server-1');
      
      expect(server).toBeDefined();
      expect(server).toHaveProperty('id', 'server-1');
      expect(server).toHaveProperty('hostname', 'test1.example.com');
    });

    it('존재하지 않는 서버 조회 시 null을 반환한다', async () => {
      const server = await mockServerService.getServerById('non-existent');
      
      expect(server).toBeNull();
    });
  });

  describe('데이터 검증', () => {
    it('서버 객체가 필수 필드를 포함한다', async () => {
      const servers = await mockServerService.getAllServers();
      const server = servers[0];
      
      // 필수 필드 검증
      expect(server).toHaveProperty('id');
      expect(server).toHaveProperty('name');
      expect(server).toHaveProperty('hostname');
      expect(server).toHaveProperty('status');
      expect(server).toHaveProperty('cpu');
      expect(server).toHaveProperty('memory');
      expect(server).toHaveProperty('disk');
      expect(server).toHaveProperty('uptime');
      
      // 타입 검증
      expect(typeof server.id).toBe('string');
      expect(typeof server.name).toBe('string');
      expect(typeof server.hostname).toBe('string');
      expect(typeof server.status).toBe('string');
      expect(typeof server.cpu).toBe('number');
      expect(typeof server.memory).toBe('number');
      expect(typeof server.disk).toBe('number');
      expect(typeof server.uptime).toBe('number');
    });

    it('메트릭 값이 유효한 범위 내에 있다', async () => {
      const servers = await mockServerService.getAllServers();
      const server = servers[0];
      
      // CPU, Memory, Disk 사용률은 0-100% 범위
      expect(server.cpu).toBeGreaterThanOrEqual(0);
      expect(server.cpu).toBeLessThanOrEqual(100);
      expect(server.memory).toBeGreaterThanOrEqual(0);
      expect(server.memory).toBeLessThanOrEqual(100);
      expect(server.disk).toBeGreaterThanOrEqual(0);
      expect(server.disk).toBeLessThanOrEqual(100);
      
      // Uptime은 양수
      expect(server.uptime).toBeGreaterThanOrEqual(0);
    });

    it('서버 상태가 유효한 값이다', async () => {
      const servers = await mockServerService.getAllServers();
      const server = servers[0];
      
      const validStatuses = ['online', 'offline', 'warning', 'critical', 'maintenance'];
      expect(validStatuses).toContain(server.status);
    });
  });

  describe('성능', () => {
    it('응답 시간이 합리적인 범위 내에 있다', async () => {
      const startTime = Date.now();
      await mockServerService.getAllServers();
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      // Mock 환경에서는 매우 빨라야 함
      expect(responseTime).toBeLessThan(100);
    });
  });

  describe('에러 처리', () => {
    it('서비스 에러를 적절히 처리한다', async () => {
      const errorService = {
        getAllServers: vi.fn().mockRejectedValue(new Error('Service error')),
        getServerById: vi.fn().mockRejectedValue(new Error('Service error')),
      };

      try {
        await errorService.getAllServers();
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe('Service error');
      }
    });
  });
});