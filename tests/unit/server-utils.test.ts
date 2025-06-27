import { describe, expect, it } from 'vitest';
import { Server } from '../../src/types/server';
import {
  hasSafeProperty,
  isSafeArray,
  safeServerAccess,
  safeServerFilter,
  safeServerSearch,
  safeServerTransform,
} from '../../src/utils/server-utils';

describe('server-utils', () => {
  const mockServer: Server = {
    id: 'server-1',
    name: 'Test Server',
    ip: '192.168.1.100',
    location: 'Seoul',
    status: 'online',
    cpu: 75,
    memory: 60,
    disk: 45,
    network: 25,
    uptime: '2h 30m',
    alerts: 3,
    services: [
      { name: 'nginx', status: 'running', port: 80 },
      { name: 'mysql', status: 'running', port: 3306 },
    ],
    lastUpdate: new Date('2024-01-01T10:00:00Z'),
    networkStatus: 'healthy',
  };

  describe('safeServerAccess', () => {
    describe('name', () => {
      it('should return server name when available', () => {
        expect(safeServerAccess.name(mockServer)).toBe('Test Server');
      });

      it('should return default when server is null/undefined', () => {
        expect(safeServerAccess.name(null)).toBe('Unknown Server');
        expect(safeServerAccess.name(undefined)).toBe('Unknown Server');
      });
    });

    describe('hostname', () => {
      it('should return hostname when available', () => {
        const serverWithHostname = { ...mockServer, hostname: 'test-host' };
        expect(safeServerAccess.hostname(serverWithHostname)).toBe('test-host');
      });

      it('should fallback to name when hostname not available', () => {
        expect(safeServerAccess.hostname(mockServer)).toBe('Test Server');
      });

      it('should return default when server is null/undefined', () => {
        expect(safeServerAccess.hostname(null)).toBe('unknown-host');
        expect(safeServerAccess.hostname(undefined)).toBe('unknown-host');
      });
    });

    describe('status', () => {
      it('should return server status when available', () => {
        expect(safeServerAccess.status(mockServer)).toBe('online');
      });

      it('should return default when server is null/undefined', () => {
        expect(safeServerAccess.status(null)).toBe('offline');
        expect(safeServerAccess.status(undefined)).toBe('offline');
      });
    });

    describe('alerts', () => {
      it('should handle number alerts', () => {
        expect(safeServerAccess.alerts(mockServer)).toBe(3);
      });

      it('should handle array alerts', () => {
        const serverWithArrayAlerts = {
          ...mockServer,
          alerts: ['alert1', 'alert2'],
        };
        expect(safeServerAccess.alerts(serverWithArrayAlerts)).toBe(2);
      });

      it('should handle undefined alerts', () => {
        const serverWithoutAlerts: Partial<Server> = { ...mockServer };
        delete serverWithoutAlerts.alerts;
        expect(safeServerAccess.alerts(serverWithoutAlerts as Server)).toBe(0);
      });

      it('should handle null alerts', () => {
        expect(safeServerAccess.alerts(null)).toBe(0);
      });
    });

    describe('cpu/memory/disk/network', () => {
      it('should return correct values when available', () => {
        expect(safeServerAccess.cpu(mockServer)).toBe(75);
        expect(safeServerAccess.memory(mockServer)).toBe(60);
        expect(safeServerAccess.disk(mockServer)).toBe(45);
        expect(safeServerAccess.network(mockServer)).toBe(25);
      });

      it('should return 0 when server is null/undefined', () => {
        expect(safeServerAccess.cpu(null)).toBe(0);
        expect(safeServerAccess.memory(null)).toBe(0);
        expect(safeServerAccess.disk(null)).toBe(0);
        expect(safeServerAccess.network(null)).toBe(0);
      });
    });
  });

  describe('safeServerSearch', () => {
    it('should find servers by name', () => {
      expect(safeServerSearch(mockServer, 'Test')).toBe(true);
      expect(safeServerSearch(mockServer, 'test')).toBe(true);
      expect(safeServerSearch(mockServer, 'NonExistent')).toBe(false);
    });

    it('should find servers by IP', () => {
      expect(safeServerSearch(mockServer, '192.168')).toBe(true);
      expect(safeServerSearch(mockServer, '10.0.0')).toBe(false);
    });

    it('should handle empty search terms', () => {
      expect(safeServerSearch(mockServer, '')).toBe(true);
      expect(safeServerSearch(mockServer, ' ')).toBe(true);
    });

    it('should handle null/undefined servers', () => {
      expect(safeServerSearch(null, 'test')).toBe(true);
      expect(safeServerSearch(undefined, 'test')).toBe(true);
    });
  });

  describe('safeServerFilter', () => {
    const servers = [
      mockServer,
      null,
      undefined,
      { ...mockServer, status: 'warning' as const },
    ];

    it('should filter by search term', () => {
      const result = safeServerFilter(servers, 'Test');
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Test Server');
    });

    it('should filter by status', () => {
      const result = safeServerFilter(servers, '', 'online');
      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('online');
    });

    it('should handle null/undefined servers', () => {
      const result = safeServerFilter(servers, '', 'all');
      expect(result).toHaveLength(2); // null과 undefined는 필터링됨
    });
  });

  describe('safeServerTransform', () => {
    it('should transform server to enhanced format', () => {
      const result = safeServerTransform(mockServer);
      expect(result).toHaveProperty('id', 'server-1');
      expect(result).toHaveProperty('name', 'Test Server');
      expect(result).toHaveProperty('status', 'running');
      expect(result.metrics).toHaveProperty('cpu', 75);
      expect(result.metrics).toHaveProperty('memory', 60);
      expect(result.metrics.network).toHaveProperty('in', 25);
      expect(result.metrics.network).toHaveProperty('out', 20); // 25 * 0.8
    });

    it('should throw error for null server', () => {
      expect(() => safeServerTransform(null)).toThrow(
        'Server data is required for transformation'
      );
      expect(() => safeServerTransform(undefined)).toThrow(
        'Server data is required for transformation'
      );
    });
  });

  describe('isSafeArray', () => {
    it('should validate arrays correctly', () => {
      expect(isSafeArray([1, 2, 3])).toBe(true);
      expect(isSafeArray(['a', 'b'])).toBe(true);
      expect(isSafeArray([])).toBe(false);
      expect(isSafeArray(null)).toBe(false);
      expect(isSafeArray(undefined)).toBe(false);
    });
  });

  describe('hasSafeProperty', () => {
    it('should check property existence safely', () => {
      expect(hasSafeProperty(mockServer, 'name')).toBe(true);
      expect(hasSafeProperty(mockServer, 'id')).toBe(true);
      expect(hasSafeProperty(null, 'name')).toBe(false);
      expect(hasSafeProperty(undefined, 'name')).toBe(false);
    });
  });
});
