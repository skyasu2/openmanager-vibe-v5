/**
 * 🧪 Dashboard Server Utils 단위 테스트
 *
 * Vercel 무료 티어 안전:
 * - 순수 함수 테스트 (외부 API 호출 없음)
 * - Mock된 Web Worker 통계 사용
 * - 동기 연산만 수행
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { EnhancedServerData } from '@/types/dashboard/server-dashboard.types';

// Mock useWorkerStats hook
vi.mock('@/hooks/useWorkerStats', () => ({
  calculateServerStatsFallback: vi.fn((servers) => ({
    total: servers.length,
    online: servers.filter(
      (s: EnhancedServerData) => s.status === 'normal' || s.status === 'online'
    ).length,
    offline: servers.filter((s: EnhancedServerData) => s.status === 'offline')
      .length,
    unknown: servers.filter((s: EnhancedServerData) => s.status === 'unknown')
      .length,
    warning: servers.filter((s: EnhancedServerData) => s.status === 'warning')
      .length,
    critical: servers.filter((s: EnhancedServerData) => s.status === 'critical')
      .length,
    averageCpu:
      servers.length > 0
        ? servers.reduce(
            (sum: number, s: EnhancedServerData) => sum + (s.cpu || 0),
            0
          ) / servers.length
        : 0,
    averageMemory:
      servers.length > 0
        ? servers.reduce(
            (sum: number, s: EnhancedServerData) => sum + (s.memory || 0),
            0
          ) / servers.length
        : 0,
  })),
}));

import {
  _groupServersByStatus,
  _hasValidLength,
  adaptWorkerStatsToLegacy,
  calculatePagination,
  calculateServerStats,
  formatUptime,
  getServerGroupKey,
  isValidArray,
  isValidNumber,
  isValidServer,
} from './server-utils';

describe('Dashboard Server Utils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============================================================================
  // Type Guard 함수 테스트
  // ============================================================================
  describe('isValidArray', () => {
    it('should return true for non-empty arrays', () => {
      expect(isValidArray([1, 2, 3])).toBe(true);
      expect(isValidArray(['a', 'b'])).toBe(true);
      expect(isValidArray([{ id: '1' }])).toBe(true);
    });

    it('should return false for empty arrays', () => {
      expect(isValidArray([])).toBe(false);
    });

    it('should return false for non-arrays', () => {
      expect(isValidArray(null)).toBe(false);
      expect(isValidArray(undefined)).toBe(false);
      expect(isValidArray('string')).toBe(false);
      expect(isValidArray(123)).toBe(false);
      expect(isValidArray({})).toBe(false);
    });
  });

  describe('isValidServer', () => {
    it('should return true for valid server objects', () => {
      const server: EnhancedServerData = {
        id: 'server-1',
        name: 'Test Server',
        status: 'normal',
        cpu: 50,
        memory: 60,
        disk: 70,
        uptime: 86400,
        type: 'web',
        roles: ['web'],
        ip: '192.168.1.1',
        lastUpdated: Date.now(),
        metrics: {},
      };
      expect(isValidServer(server)).toBe(true);
    });

    it('should return true for minimal server with string id', () => {
      expect(isValidServer({ id: 'server-id' })).toBe(true);
    });

    it('should return false for null or undefined', () => {
      expect(isValidServer(null)).toBe(false);
      expect(isValidServer(undefined)).toBe(false);
    });

    it('should return false for objects without id', () => {
      expect(isValidServer({})).toBe(false);
      expect(isValidServer({ name: 'server' })).toBe(false);
    });

    it('should return false for objects with non-string id', () => {
      expect(isValidServer({ id: 123 })).toBe(false);
      expect(isValidServer({ id: null })).toBe(false);
    });
  });

  describe('isValidNumber', () => {
    it('should return true for valid positive numbers', () => {
      expect(isValidNumber(0)).toBe(true);
      expect(isValidNumber(100)).toBe(true);
      expect(isValidNumber(3.14)).toBe(true);
    });

    it('should return false for negative numbers', () => {
      expect(isValidNumber(-1)).toBe(false);
      expect(isValidNumber(-100)).toBe(false);
    });

    it('should return false for NaN and Infinity', () => {
      expect(isValidNumber(Number.NaN)).toBe(false);
      expect(isValidNumber(Number.POSITIVE_INFINITY)).toBe(false);
      expect(isValidNumber(Number.NEGATIVE_INFINITY)).toBe(false);
    });

    it('should return false for non-numbers', () => {
      expect(isValidNumber(null)).toBe(false);
      expect(isValidNumber(undefined)).toBe(false);
      expect(isValidNumber('100')).toBe(false);
      expect(isValidNumber({})).toBe(false);
    });
  });

  describe('_hasValidLength', () => {
    it('should return true for arrays', () => {
      expect(_hasValidLength([1, 2, 3])).toBe(true);
      expect(_hasValidLength([])).toBe(true);
    });

    // Note: _hasValidLength checks typeof === 'object', so primitives (strings) return false
    it('should return false for strings (primitive type)', () => {
      // 함수 구현이 typeof value === 'object'를 체크하므로
      // 문자열(primitive)은 false 반환
      expect(_hasValidLength('hello')).toBe(false);
      expect(_hasValidLength('')).toBe(false);
    });

    it('should return true for objects with length property', () => {
      expect(_hasValidLength({ length: 5 })).toBe(true);
    });

    it('should return false for null/undefined', () => {
      expect(_hasValidLength(null)).toBe(false);
      expect(_hasValidLength(undefined)).toBe(false);
    });

    it('should return false for objects without length', () => {
      expect(_hasValidLength({})).toBe(false);
      expect(_hasValidLength({ size: 5 })).toBe(false);
    });

    it('should return false for negative length', () => {
      // isValidNumber requires value >= 0
      expect(_hasValidLength({ length: -1 })).toBe(false);
    });
  });

  // ============================================================================
  // getServerGroupKey 테스트
  // ============================================================================
  describe('getServerGroupKey', () => {
    it('should generate consistent key for same servers', () => {
      const servers: EnhancedServerData[] = [
        {
          id: 's1',
          name: 'Server 1',
          status: 'normal',
          cpu: 50,
          memory: 60,
          disk: 70,
          uptime: 0,
          type: 'web',
          roles: [],
          ip: '',
          lastUpdated: 0,
          metrics: {},
        },
        {
          id: 's2',
          name: 'Server 2',
          status: 'warning',
          cpu: 80,
          memory: 90,
          disk: 85,
          uptime: 0,
          type: 'db',
          roles: [],
          ip: '',
          lastUpdated: 0,
          metrics: {},
        },
      ];

      const key1 = getServerGroupKey(servers);
      const key2 = getServerGroupKey(servers);

      expect(key1).toBe(key2);
    });

    it('should generate different keys for different servers', () => {
      const servers1: EnhancedServerData[] = [
        {
          id: 's1',
          name: 'Server 1',
          status: 'normal',
          cpu: 50,
          memory: 60,
          disk: 70,
          uptime: 0,
          type: 'web',
          roles: [],
          ip: '',
          lastUpdated: 0,
          metrics: {},
        },
      ];
      const servers2: EnhancedServerData[] = [
        {
          id: 's1',
          name: 'Server 1',
          status: 'warning',
          cpu: 80,
          memory: 60,
          disk: 70,
          uptime: 0,
          type: 'web',
          roles: [],
          ip: '',
          lastUpdated: 0,
          metrics: {},
        },
      ];

      const key1 = getServerGroupKey(servers1);
      const key2 = getServerGroupKey(servers2);

      expect(key1).not.toBe(key2);
    });

    it('should include all relevant fields in key', () => {
      const servers: EnhancedServerData[] = [
        {
          id: 'test-id',
          name: 'Test',
          status: 'normal',
          cpu: 45,
          memory: 55,
          disk: 65,
          uptime: 0,
          type: 'web',
          roles: [],
          ip: '',
          lastUpdated: 0,
          metrics: {},
        },
      ];

      const key = getServerGroupKey(servers);

      expect(key).toContain('test-id');
      expect(key).toContain('normal');
      expect(key).toContain('45');
      expect(key).toContain('55');
      expect(key).toContain('65');
    });
  });

  // ============================================================================
  // _groupServersByStatus 테스트
  // ============================================================================
  describe('_groupServersByStatus', () => {
    it('should group servers by status', () => {
      const servers: EnhancedServerData[] = [
        {
          id: 's1',
          name: 'S1',
          status: 'normal',
          cpu: 50,
          memory: 50,
          disk: 50,
          uptime: 0,
          type: 'web',
          roles: [],
          ip: '',
          lastUpdated: 0,
          metrics: {},
        },
        {
          id: 's2',
          name: 'S2',
          status: 'normal',
          cpu: 50,
          memory: 50,
          disk: 50,
          uptime: 0,
          type: 'web',
          roles: [],
          ip: '',
          lastUpdated: 0,
          metrics: {},
        },
        {
          id: 's3',
          name: 'S3',
          status: 'warning',
          cpu: 80,
          memory: 50,
          disk: 50,
          uptime: 0,
          type: 'db',
          roles: [],
          ip: '',
          lastUpdated: 0,
          metrics: {},
        },
      ];

      const groups = _groupServersByStatus(servers);

      expect(groups.get('normal')?.length).toBe(2);
      expect(groups.get('warning')?.length).toBe(1);
    });

    it('should handle empty array', () => {
      const groups = _groupServersByStatus([]);
      expect(groups.size).toBe(0);
    });

    it('should use "unknown" for missing status', () => {
      const servers = [
        {
          id: 's1',
          name: 'S1',
          status: undefined,
          cpu: 50,
          memory: 50,
          disk: 50,
          uptime: 0,
          type: 'web',
          roles: [],
          ip: '',
          lastUpdated: 0,
          metrics: {},
        },
      ] as unknown as EnhancedServerData[];

      const groups = _groupServersByStatus(servers);

      expect(groups.get('unknown')?.length).toBe(1);
    });
  });

  // ============================================================================
  // adaptWorkerStatsToLegacy 테스트
  // ============================================================================
  describe('adaptWorkerStatsToLegacy', () => {
    it('should convert Worker stats to legacy format', () => {
      const workerStats = {
        total: 10,
        online: 7,
        offline: 1,
        unknown: 1,
        warning: 1,
        critical: 0,
        averageCpu: 45.5,
        averageMemory: 60.3,
        averageUptime: 86400,
        totalBandwidth: 1000,
        typeDistribution: { web: 5, db: 3, api: 2 },
        performanceMetrics: { calculationTime: 5, serversProcessed: 10 },
      };

      const result = adaptWorkerStatsToLegacy(workerStats);

      expect(result.total).toBe(10);
      expect(result.online).toBe(7);
      expect(result.unknown).toBe(1); // uses unknown, not offline
      expect(result.warning).toBe(1);
      expect(result.critical).toBe(0);
      expect(result.avgCpu).toBe(46); // rounded
      expect(result.avgMemory).toBe(60); // rounded
      expect(result.avgDisk).toBe(0);
      expect(result.averageCpu).toBe(45.5);
      expect(result.averageMemory).toBe(60.3);
      expect(result.averageUptime).toBe(86400);
      expect(result.totalBandwidth).toBe(1000);
      expect(result.typeDistribution).toEqual({ web: 5, db: 3, api: 2 });
      expect(result.performanceMetrics?.calculationTime).toBe(5);
    });

    it('should handle partial stats with defaults', () => {
      const partialStats = {
        total: 5,
      };

      const result = adaptWorkerStatsToLegacy(partialStats);

      expect(result.total).toBe(5);
      expect(result.online).toBe(0);
      expect(result.unknown).toBe(0);
      expect(result.warning).toBe(0);
      expect(result.critical).toBe(0);
      expect(result.avgCpu).toBe(0);
      expect(result.avgMemory).toBe(0);
    });

    it('should use offline as fallback for unknown', () => {
      const stats = {
        total: 5,
        offline: 2,
      };

      const result = adaptWorkerStatsToLegacy(stats);

      expect(result.unknown).toBe(2);
    });
  });

  // ============================================================================
  // calculatePagination 테스트
  // ============================================================================
  describe('calculatePagination', () => {
    it('should calculate correct pagination', () => {
      const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

      const page1 = calculatePagination(items, 1, 3);
      expect(page1.paginatedItems).toEqual([1, 2, 3]);
      expect(page1.totalPages).toBe(4);

      const page2 = calculatePagination(items, 2, 3);
      expect(page2.paginatedItems).toEqual([4, 5, 6]);

      const page4 = calculatePagination(items, 4, 3);
      expect(page4.paginatedItems).toEqual([10]);
    });

    it('should handle empty array', () => {
      const result = calculatePagination([], 1, 10);

      expect(result.paginatedItems).toEqual([]);
      expect(result.totalPages).toBe(0);
    });

    it('should handle items fitting in one page', () => {
      const items = [1, 2, 3];

      const result = calculatePagination(items, 1, 10);

      expect(result.paginatedItems).toEqual([1, 2, 3]);
      expect(result.totalPages).toBe(1);
    });

    it('should return empty for out-of-range page', () => {
      const items = [1, 2, 3];

      const result = calculatePagination(items, 10, 2);

      expect(result.paginatedItems).toEqual([]);
      expect(result.totalPages).toBe(2);
    });

    it('should work with object arrays', () => {
      const items = [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }];

      const result = calculatePagination(items, 1, 2);

      expect(result.paginatedItems).toEqual([{ id: 1 }, { id: 2 }]);
      expect(result.totalPages).toBe(2);
    });
  });

  // ============================================================================
  // formatUptime 테스트
  // ============================================================================
  describe('formatUptime', () => {
    it('should format days and hours', () => {
      // 3일 5시간 = 3 * 86400 + 5 * 3600 = 277200초
      const result = formatUptime(277200);
      expect(result).toBe('3d 5h');
    });

    it('should format hours and minutes when less than 1 day', () => {
      // 5시간 30분 = 5 * 3600 + 30 * 60 = 19800초
      const result = formatUptime(19800);
      expect(result).toBe('5h 30m');
    });

    it('should format only minutes when less than 1 hour', () => {
      // 45분 = 45 * 60 = 2700초
      const result = formatUptime(2700);
      expect(result).toBe('45m');
    });

    it('should handle 0', () => {
      expect(formatUptime(0)).toBe('0m');
    });

    it('should handle exact boundaries', () => {
      // Exactly 1 day
      expect(formatUptime(86400)).toBe('1d 0h');
      // Exactly 1 hour
      expect(formatUptime(3600)).toBe('1h 0m');
    });
  });

  // ============================================================================
  // calculateServerStats 테스트
  // ============================================================================
  describe('calculateServerStats', () => {
    it('should calculate stats for server array', () => {
      const servers: EnhancedServerData[] = [
        {
          id: 's1',
          name: 'Server 1',
          status: 'normal',
          cpu: 40,
          memory: 50,
          disk: 60,
          uptime: 86400,
          type: 'web',
          roles: [],
          ip: '',
          lastUpdated: 0,
          metrics: {},
        },
        {
          id: 's2',
          name: 'Server 2',
          status: 'normal',
          cpu: 60,
          memory: 70,
          disk: 80,
          uptime: 172800,
          type: 'db',
          roles: [],
          ip: '',
          lastUpdated: 0,
          metrics: {},
        },
      ];

      const result = calculateServerStats(servers);

      expect(result.total).toBe(2);
      expect(result.online).toBe(2);
      expect(result.avgCpu).toBe(50); // (40+60)/2 rounded
      expect(result.avgMemory).toBe(60); // (50+70)/2 rounded
    });

    it('should return zeros for empty array', () => {
      const result = calculateServerStats([]);

      expect(result.total).toBe(0);
      expect(result.online).toBe(0);
      expect(result.unknown).toBe(0);
      expect(result.warning).toBe(0);
      expect(result.critical).toBe(0);
      expect(result.avgCpu).toBe(0);
      expect(result.avgMemory).toBe(0);
      expect(result.avgDisk).toBe(0);
    });

    it('should return cached result for same servers', () => {
      const servers: EnhancedServerData[] = [
        {
          id: 's1',
          name: 'Server 1',
          status: 'normal',
          cpu: 50,
          memory: 50,
          disk: 50,
          uptime: 0,
          type: 'web',
          roles: [],
          ip: '',
          lastUpdated: 0,
          metrics: {},
        },
      ];

      // First call
      const result1 = calculateServerStats(servers);
      // Second call with same servers
      const result2 = calculateServerStats(servers);

      expect(result1).toEqual(result2);
    });
  });
});
