/**
 * Server Metrics Tools Tests
 *
 * Unit tests for server metrics tools including getServerByGroup.
 *
 * @version 1.0.0
 * @created 2026-01-19
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock precomputed-state
vi.mock('../data/precomputed-state', () => ({
  getCurrentState: vi.fn(() => ({
    timestamp: new Date().toISOString(),
    servers: [
      {
        id: 'web-nginx-icn-01',
        name: 'Web Server 01',
        type: 'web',
        status: 'online',
        cpu: 45,
        memory: 62,
        disk: 55,
        network: 120,
      },
      {
        id: 'web-nginx-icn-02',
        name: 'Web Server 02',
        type: 'web',
        status: 'warning',
        cpu: 78,
        memory: 82,
        disk: 60,
        network: 150,
      },
      {
        id: 'db-mysql-icn-01',
        name: 'Database Primary',
        type: 'database',
        status: 'online',
        cpu: 55,
        memory: 70,
        disk: 65,
        network: 200,
      },
      {
        id: 'db-mysql-icn-02',
        name: 'Database Replica',
        type: 'database',
        status: 'online',
        cpu: 35,
        memory: 55,
        disk: 60,
        network: 180,
      },
      {
        id: 'lb-haproxy-icn-01',
        name: 'Load Balancer 01',
        type: 'loadbalancer',
        status: 'online',
        cpu: 25,
        memory: 40,
        disk: 30,
        network: 500,
      },
      {
        id: 'cache-redis-icn-01',
        name: 'Cache Server 01',
        type: 'cache',
        status: 'online',
        cpu: 30,
        memory: 85,
        disk: 20,
        network: 300,
      },
      {
        id: 'cache-redis-icn-02',
        name: 'Cache Server 02',
        type: 'cache',
        status: 'warning',
        cpu: 40,
        memory: 88,
        disk: 25,
        network: 280,
      },
      {
        id: 'api-node-icn-01',
        name: 'API Server 01',
        type: 'application',
        status: 'online',
        cpu: 50,
        memory: 60,
        disk: 40,
        network: 150,
      },
      {
        id: 'storage-nfs-icn-01',
        name: 'Storage Server 01',
        type: 'storage',
        status: 'critical',
        cpu: 20,
        memory: 30,
        disk: 92,
        network: 100,
      },
    ],
    systemHealth: {
      overall: 'warning',
      healthyCount: 6,
      warningCount: 2,
      criticalCount: 1,
    },
  })),
}));

// Mock cache-layer
vi.mock('../lib/cache-layer', () => ({
  getDataCache: vi.fn(() => ({
    getMetrics: vi.fn((_key: string, compute: () => Promise<unknown>) => compute()),
    getOrCompute: vi.fn((_type: string, _key: string, compute: () => Promise<unknown>) => compute()),
  })),
}));

// Mock fixed-24h-metrics
vi.mock('../data/fixed-24h-metrics', () => ({
  FIXED_24H_DATASETS: [],
  getDataAtMinute: vi.fn(() => ({ cpu: 50, memory: 60, disk: 40, network: 100 })),
  getRecentData: vi.fn(() => []),
}));

import { getServerByGroup, getServerMetrics, filterServers } from './server-metrics';

// ============================================================================
// getServerByGroup Tests
// ============================================================================

describe('getServerByGroup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Functionality', () => {
    it('should return database servers for "db" input', async () => {
      const result = await getServerByGroup.execute({ group: 'db' }, {} as never);

      expect(result.success).toBe(true);
      expect(result.group).toBe('database');
      expect(result.servers).toHaveLength(2);
      expect(result.servers[0].type).toBe('database');
      expect(result.summary.total).toBe(2);
      expect(result.summary.online).toBe(2);
    });

    it('should return database servers for "database" input', async () => {
      const result = await getServerByGroup.execute({ group: 'database' }, {} as never);

      expect(result.success).toBe(true);
      expect(result.group).toBe('database');
      expect(result.servers).toHaveLength(2);
    });

    it('should return loadbalancer servers for "lb" input', async () => {
      const result = await getServerByGroup.execute({ group: 'lb' }, {} as never);

      expect(result.success).toBe(true);
      expect(result.group).toBe('loadbalancer');
      expect(result.servers).toHaveLength(1);
      expect(result.servers[0].id).toBe('lb-haproxy-icn-01');
    });

    it('should return web servers for "web" input', async () => {
      const result = await getServerByGroup.execute({ group: 'web' }, {} as never);

      expect(result.success).toBe(true);
      expect(result.group).toBe('web');
      expect(result.servers).toHaveLength(2);
      expect(result.summary.online).toBe(1);
      expect(result.summary.warning).toBe(1);
    });

    it('should return cache servers for "cache" input', async () => {
      const result = await getServerByGroup.execute({ group: 'cache' }, {} as never);

      expect(result.success).toBe(true);
      expect(result.group).toBe('cache');
      expect(result.servers).toHaveLength(2);
    });

    it('should return application servers for "api" input', async () => {
      const result = await getServerByGroup.execute({ group: 'api' }, {} as never);

      expect(result.success).toBe(true);
      expect(result.group).toBe('application');
      expect(result.servers).toHaveLength(1);
    });

    it('should return application servers for "app" input', async () => {
      const result = await getServerByGroup.execute({ group: 'app' }, {} as never);

      expect(result.success).toBe(true);
      expect(result.group).toBe('application');
      expect(result.servers).toHaveLength(1);
    });

    it('should return storage servers for "storage" input', async () => {
      const result = await getServerByGroup.execute({ group: 'storage' }, {} as never);

      expect(result.success).toBe(true);
      expect(result.group).toBe('storage');
      expect(result.servers).toHaveLength(1);
      expect(result.summary.critical).toBe(1);
    });
  });

  describe('Abbreviation Mapping', () => {
    it('should map "db" to "database"', async () => {
      const result = await getServerByGroup.execute({ group: 'db' }, {} as never);
      expect(result.group).toBe('database');
    });

    it('should map "lb" to "loadbalancer"', async () => {
      const result = await getServerByGroup.execute({ group: 'lb' }, {} as never);
      expect(result.group).toBe('loadbalancer');
    });

    it('should map "api" to "application"', async () => {
      const result = await getServerByGroup.execute({ group: 'api' }, {} as never);
      expect(result.group).toBe('application');
    });

    it('should map "app" to "application"', async () => {
      const result = await getServerByGroup.execute({ group: 'app' }, {} as never);
      expect(result.group).toBe('application');
    });
  });

  describe('Case Insensitivity', () => {
    it('should handle uppercase input "DB"', async () => {
      const result = await getServerByGroup.execute({ group: 'DB' }, {} as never);
      expect(result.success).toBe(true);
      expect(result.group).toBe('database');
    });

    it('should handle mixed case "DataBase"', async () => {
      const result = await getServerByGroup.execute({ group: 'DataBase' }, {} as never);
      expect(result.success).toBe(true);
      expect(result.group).toBe('database');
    });

    it('should handle uppercase "WEB"', async () => {
      const result = await getServerByGroup.execute({ group: 'WEB' }, {} as never);
      expect(result.success).toBe(true);
      expect(result.group).toBe('web');
    });
  });

  describe('Summary Calculation', () => {
    it('should correctly count online servers', async () => {
      const result = await getServerByGroup.execute({ group: 'database' }, {} as never);
      expect(result.summary.online).toBe(2);
      expect(result.summary.warning).toBe(0);
      expect(result.summary.critical).toBe(0);
    });

    it('should correctly count warning servers', async () => {
      const result = await getServerByGroup.execute({ group: 'web' }, {} as never);
      expect(result.summary.online).toBe(1);
      expect(result.summary.warning).toBe(1);
      expect(result.summary.critical).toBe(0);
    });

    it('should correctly count critical servers', async () => {
      const result = await getServerByGroup.execute({ group: 'storage' }, {} as never);
      expect(result.summary.online).toBe(0);
      expect(result.summary.warning).toBe(0);
      expect(result.summary.critical).toBe(1);
    });

    it('should have total equal to sum of status counts', async () => {
      const result = await getServerByGroup.execute({ group: 'cache' }, {} as never);
      const { total, online, warning, critical } = result.summary;
      expect(total).toBe(online + warning + critical);
    });
  });

  describe('Response Structure', () => {
    it('should include all required fields in response', async () => {
      const result = await getServerByGroup.execute({ group: 'db' }, {} as never);

      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('group');
      expect(result).toHaveProperty('servers');
      expect(result).toHaveProperty('summary');
      expect(result).toHaveProperty('timestamp');
    });

    it('should include all required fields in server objects', async () => {
      const result = await getServerByGroup.execute({ group: 'db' }, {} as never);

      expect(result.servers[0]).toHaveProperty('id');
      expect(result.servers[0]).toHaveProperty('name');
      expect(result.servers[0]).toHaveProperty('type');
      expect(result.servers[0]).toHaveProperty('status');
      expect(result.servers[0]).toHaveProperty('cpu');
      expect(result.servers[0]).toHaveProperty('memory');
      expect(result.servers[0]).toHaveProperty('disk');
    });

    it('should return valid timestamp', async () => {
      const result = await getServerByGroup.execute({ group: 'db' }, {} as never);

      expect(result.timestamp).toBeDefined();
      expect(new Date(result.timestamp).getTime()).not.toBeNaN();
    });
  });

  describe('Edge Cases', () => {
    it('should return empty array for unknown group type', async () => {
      const result = await getServerByGroup.execute({ group: 'unknown-type' }, {} as never);

      expect(result.success).toBe(true);
      expect(result.group).toBe('unknown-type');
      expect(result.servers).toHaveLength(0);
      expect(result.summary.total).toBe(0);
    });

    it('should handle whitespace in input', async () => {
      const result = await getServerByGroup.execute({ group: '  db  ' }, {} as never);

      expect(result.success).toBe(true);
      expect(result.group).toBe('database');
    });

    it('should NOT false match partial type names', async () => {
      // This tests that "database" doesn't match "databaseX" or similar
      const result = await getServerByGroup.execute({ group: 'data' }, {} as never);

      expect(result.success).toBe(true);
      expect(result.servers).toHaveLength(0); // "data" is not a valid type
    });

    it('should handle empty string input', async () => {
      const result = await getServerByGroup.execute({ group: '' }, {} as never);

      expect(result.success).toBe(true);
      expect(result.servers).toHaveLength(0);
    });
  });

  describe('Type Normalization', () => {
    it('should normalize "db" to "database" in response', async () => {
      const result = await getServerByGroup.execute({ group: 'db' }, {} as never);

      expect(result.group).toBe('database');
      result.servers.forEach((server: { type: string }) => {
        expect(server.type).toBe('database');
      });
    });

    it('should normalize "lb" to "loadbalancer" in response', async () => {
      const result = await getServerByGroup.execute({ group: 'lb' }, {} as never);

      expect(result.group).toBe('loadbalancer');
    });

    it('should normalize "api" to "application" in response', async () => {
      const result = await getServerByGroup.execute({ group: 'api' }, {} as never);

      expect(result.group).toBe('application');
    });

    it('should normalize "app" to "application" in response', async () => {
      const result = await getServerByGroup.execute({ group: 'app' }, {} as never);

      expect(result.group).toBe('application');
    });

    it('should keep non-aliased types as-is', async () => {
      const result = await getServerByGroup.execute({ group: 'cache' }, {} as never);

      expect(result.group).toBe('cache');
    });
  });

  describe('Summary Validation', () => {
    it('should have summary.total equal to servers array length', async () => {
      const result = await getServerByGroup.execute({ group: 'web' }, {} as never);

      expect(result.summary.total).toBe(result.servers.length);
    });

    it('should have status counts sum equal to total', async () => {
      const result = await getServerByGroup.execute({ group: 'database' }, {} as never);
      const { total, online, warning, critical } = result.summary;

      expect(online + warning + critical).toBe(total);
    });

    it('should return zero counts for empty group', async () => {
      const result = await getServerByGroup.execute({ group: 'nonexistent' }, {} as never);

      expect(result.summary.total).toBe(0);
      expect(result.summary.online).toBe(0);
      expect(result.summary.warning).toBe(0);
      expect(result.summary.critical).toBe(0);
    });
  });
});

// ============================================================================
// getServerMetrics Tests (Sanity Check)
// ============================================================================

describe('getServerMetrics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return all servers when no serverId specified', async () => {
    const result = await getServerMetrics.execute({ metric: 'all' }, {} as never);

    expect(result.success).toBe(true);
    expect(result.servers).toHaveLength(9);
    expect(result.summary.total).toBe(9);
  });

  it('should return specific server when serverId specified', async () => {
    const result = await getServerMetrics.execute(
      { serverId: 'db-mysql-icn-01', metric: 'all' },
      {} as never
    );

    expect(result.success).toBe(true);
    expect(result.servers).toHaveLength(1);
    expect(result.servers[0].id).toBe('db-mysql-icn-01');
  });
});

// ============================================================================
// filterServers Tests (Sanity Check)
// ============================================================================

describe('filterServers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should filter servers by CPU threshold', async () => {
    const result = await filterServers.execute(
      { field: 'cpu', operator: '>', value: 70, limit: 10 },
      {} as never
    );

    expect(result.success).toBe(true);
    expect(result.condition).toBe('cpu > 70%');
    expect(result.servers.length).toBeGreaterThan(0);
    result.servers.forEach((server: { cpu: number }) => {
      expect(server.cpu).toBeGreaterThan(70);
    });
  });

  it('should filter servers by memory threshold', async () => {
    const result = await filterServers.execute(
      { field: 'memory', operator: '>=', value: 80, limit: 10 },
      {} as never
    );

    expect(result.success).toBe(true);
    expect(result.condition).toBe('memory >= 80%');
  });

  it('should respect limit parameter', async () => {
    const result = await filterServers.execute(
      { field: 'cpu', operator: '>', value: 0, limit: 3 },
      {} as never
    );

    expect(result.success).toBe(true);
    expect(result.servers.length).toBeLessThanOrEqual(3);
  });
});
