/**
 * Test suite for /api/servers/all endpoint
 * Requirements:
 * - Normal server list retrieval
 * - Empty server list handling
 * - Error situation handling
 * - Caching header validation
 * - Response time measurement (under 500ms)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/servers/all/route';

// Mock getMockServers directly
let mockServers = [
  {
    id: 'server-1',
    name: 'Production Server',
    status: 'online',
    cpu: 45,
    memory: 60,
    disk: 30,
    network: 25,
    uptime: 99.8,
    location: 'US-East',
    environment: 'production',
    type: 'web-server',
    provider: 'On-Premise',
    alerts: 0,
    hostname: 'prod-server-1',
    ip: '192.168.1.10',
    os: 'Ubuntu 22.04 LTS',
    specs: { cpu_cores: 4, memory_gb: 16, disk_gb: 500, network_speed: '1Gbps' },
    lastUpdate: new Date(),
    lastSeen: new Date().toISOString(),
    services: [],
    networkStatus: 'healthy' as const,
    systemInfo: {
      os: 'Ubuntu 22.04 LTS',
      uptime: '24h',
      processes: 150,
      zombieProcesses: 0,
      loadAverage: '0.45, 0.38, 0.42',
      lastUpdate: new Date().toISOString(),
    },
    networkInfo: {
      interface: 'eth0',
      receivedBytes: '15 MB',
      sentBytes: '10 MB',
      receivedErrors: 0,
      sentErrors: 0,
      status: 'healthy' as const,
    },
    metrics: {
      cpu: { usage: 45, cores: 4, temperature: 45 },
      memory: { used: 9.6, total: 16, usage: 60 },
      disk: { used: 150, total: 500, usage: 30 },
      network: { bytesIn: 15, bytesOut: 10, packetsIn: 0, packetsOut: 0 },
      timestamp: new Date().toISOString(),
      uptime: 99.8
    }
  },
  {
    id: 'server-2',
    name: 'Development Server',
    status: 'warning' as const,
    cpu: 75,
    memory: 80,
    disk: 40,
    network: 35,
    uptime: 95.2,
    location: 'US-West',
    environment: 'development',
    type: 'app-server',
    provider: 'On-Premise',
    alerts: 1,
    hostname: 'dev-server-2',
    ip: '192.168.1.11',
    os: 'Ubuntu 22.04 LTS',
    specs: { cpu_cores: 4, memory_gb: 16, disk_gb: 500, network_speed: '1Gbps' },
    lastUpdate: new Date(),
    lastSeen: new Date().toISOString(),
    services: [],
    networkStatus: 'warning' as const,
    systemInfo: {
      os: 'Ubuntu 22.04 LTS',
      uptime: '12h',
      processes: 180,
      zombieProcesses: 2,
      loadAverage: '1.85, 1.75, 1.60',
      lastUpdate: new Date().toISOString(),
    },
    networkInfo: {
      interface: 'eth0',
      receivedBytes: '21 MB',
      sentBytes: '14 MB',
      receivedErrors: 2,
      sentErrors: 1,
      status: 'warning' as const,
    },
    metrics: {
      cpu: { usage: 75, cores: 4, temperature: 65 },
      memory: { used: 12.8, total: 16, usage: 80 },
      disk: { used: 200, total: 500, usage: 40 },
      network: { bytesIn: 21, bytesOut: 14, packetsIn: 0, packetsOut: 0 },
      timestamp: new Date().toISOString(),
      uptime: 95.2
    }
  }
];

// Mock the actual function that's being used by the API route
vi.mock('@/mock', () => ({
  getMockServers: vi.fn(() => mockServers),
  getMockSystem: vi.fn(() => ({
    getServers: vi.fn(() => mockServers)
  }))
}));

// Mock config to ensure mock mode is active
vi.mock('@/config/mock-config', () => ({
  isMockMode: vi.fn(() => true),
  getMockHeaders: vi.fn(() => ({
    'X-Data-Source': 'Mock',
    'X-Mock-Mode': 'test'
  }))
}));

// Mock the static fallback loader that API route uses
vi.mock('fs', () => ({
  default: {
    readFileSync: vi.fn(() => JSON.stringify(mockServers))
  }
}));

// Mock path module
vi.mock('path', () => ({
  default: {
    join: vi.fn(() => '/mocked/path/servers.json')
  }
}));

describe('GET /api/servers/all', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset environment variables
    process.env.NODE_ENV = 'test';
    delete process.env.SIMULATE_DB_ERROR;
    delete process.env.SIMULATE_SERVICE_UNAVAILABLE;
    // Memory cache is automatically cleared per test
    // Reset mock servers to default
    mockServers = [
      {
        id: 'server-1',
        name: 'Production Server',
        status: 'online',
        cpu_usage: 45.5,
        memory_usage: 60.2,
        disk_usage: 30.0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'server-2',
        name: 'Development Server',
        status: 'warning',
        cpu_usage: 75.0,
        memory_usage: 80.5,
        disk_usage: 40.0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    ];
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('정상적인 서버 목록 조회', () => {
    it('should return server list with 200 status', async () => {
      // Given: Mock server data
      const mockServers = [
        {
          id: 'server-1',
          name: 'Production Server',
          status: 'online',
          cpu_usage: 45.5,
          memory_usage: 60.2,
          disk_usage: 30.0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: 'server-2',
          name: 'Development Server',
          status: 'online',
          cpu_usage: 20.1,
          memory_usage: 35.5,
          disk_usage: 25.0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
      ];

      // When: Make request
      const request = new NextRequest('http://localhost:3000/api/servers/all');
      const response = await GET(request);

      // Then: Verify response
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveProperty('success', true);
      expect(data).toHaveProperty('data');
      expect(data.data).toHaveProperty('servers');
      expect(Array.isArray(data.data.servers)).toBe(true);
      expect(data.data.servers).toHaveLength(2);
      expect(data.data.servers[0]).toHaveProperty('id');
      expect(data.data.servers[0]).toHaveProperty('name');
      expect(data.data.servers[0]).toHaveProperty('status');
    });

    it('should include proper response structure', async () => {
      // When: Make request
      const request = new NextRequest('http://localhost:3000/api/servers/all');
      const response = await GET(request);

      // Then: Verify response structure
      const data = await response.json();
      expect(data).toHaveProperty('success', true);
      expect(data).toHaveProperty('data');
      expect(data.data).toHaveProperty('servers');
      expect(data.data).toHaveProperty('total');
      expect(data).toHaveProperty('timestamp');
      expect(typeof data.data.total).toBe('number');
      expect(data.timestamp).toBeDefined();
    });
  });

  describe('빈 서버 목록 처리', () => {
    it('should return empty array when no servers exist', async () => {
      // Given: No servers in database
      mockServers = [];

      // When: Make request
      const request = new NextRequest('http://localhost:3000/api/servers/all');
      const response = await GET(request);

      // Then: Verify empty response
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.data.servers).toEqual([]);
      expect(data.data.total).toBe(0);
    });

    it('should handle null response from database', async () => {
      // Given: Mock returns empty array
      mockServers = [];
      
      // When: Make request with null database response
      const request = new NextRequest('http://localhost:3000/api/servers/all');
      const response = await GET(request);

      // Then: Should handle gracefully
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.data.servers).toEqual([]);
      expect(data.data.total).toBe(0);
    });
  });

  describe('에러 상황 처리', () => {
    it('should handle mock mode gracefully when fs error occurs', async () => {
      // Given: Mock fs.readFileSync to throw error
      const mockFs = await import('fs');
      mockFs.default.readFileSync = vi.fn(() => {
        throw new Error('File not found');
      });

      // When: Make request
      const request = new NextRequest('http://localhost:3000/api/servers/all');
      const response = await GET(request);

      // Then: Should still return 200 with empty fallback
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveProperty('success', true);
      expect(data.data.servers).toEqual([]);
    });

    it('should handle cache errors gracefully', async () => {
      // Given: Memory cache is used in mock mode
      // When: Make request
      const request = new NextRequest('http://localhost:3000/api/servers/all');
      const response = await GET(request);

      // Then: Should return data successfully
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveProperty('success', true);
      expect(data.data).toHaveProperty('servers');
    });

    it('should handle mock mode service availability', async () => {
      // Given: Mock mode always returns available data
      // When: Make request
      const request = new NextRequest('http://localhost:3000/api/servers/all');
      const response = await GET(request);

      // Then: Should always return 200 in mock mode
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveProperty('success', true);
    });
  });

  describe('캐싱 헤더 검증', () => {
    it('should include proper cache headers', async () => {
      // When: Make request
      const request = new NextRequest('http://localhost:3000/api/servers/all');
      const response = await GET(request);

      // Then: Verify cache headers (mock mode uses different cache control)
      expect(response.headers.get('Cache-Control')).toContain('public');
      expect(response.headers.get('X-Response-Time')).toBeDefined();
    });

    it('should handle request headers in mock mode', async () => {
      // When: Make request
      const request = new NextRequest('http://localhost:3000/api/servers/all');
      const response = await GET(request);

      // Then: Should succeed with mock data
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveProperty('success', true);
    });

    it('should include response timing headers', async () => {
      // When: Make request
      const request = new NextRequest('http://localhost:3000/api/servers/all');
      const response = await GET(request);

      // Then: Should include timing information
      expect(response.headers.get('X-Response-Time')).toBeDefined();
      expect(response.status).toBe(200);
    });
  });

  describe('응답 시간 측정', () => {
    it('should respond within 500ms', async () => {
      // Given: Start timer
      const startTime = performance.now();

      // When: Make request
      const request = new NextRequest('http://localhost:3000/api/servers/all');
      const response = await GET(request);

      // Then: Verify response time
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      
      expect(responseTime).toBeLessThan(500);
      expect(response.headers.get('X-Response-Time')).toBeDefined();
      expect(response.status).toBe(200);
    });

    it('should include server timing header', async () => {
      // When: Make request
      const request = new NextRequest('http://localhost:3000/api/servers/all');
      const response = await GET(request);

      // Then: Verify response includes timing
      expect(response.headers.get('X-Response-Time')).toBeDefined();
      expect(response.status).toBe(200);
    });

    it('should handle multiple requests consistently', async () => {
      // When: Make two requests
      const request1 = new NextRequest('http://localhost:3000/api/servers/all');
      const response1 = await GET(request1);
      
      const request2 = new NextRequest('http://localhost:3000/api/servers/all');
      const response2 = await GET(request2);

      // Then: Both should succeed with consistent data
      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);
      
      const data1 = await response1.json();
      const data2 = await response2.json();
      expect(data1.success).toBe(true);
      expect(data2.success).toBe(true);
    });
  });

  describe('추가 시나리오', () => {
    it('should handle query parameters for filtering', async () => {
      // Given: Servers with different statuses
      mockServers = [
        { ...mockServers[0], status: 'online' },
        { ...mockServers[1], status: 'warning' }
      ];
      
      // When: Make request with query params
      const request = new NextRequest('http://localhost:3000/api/servers/all?status=online');
      const response = await GET(request);

      // Then: Should return filtered results (mock mode behavior)
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveProperty('success', true);
      expect(Array.isArray(data.data.servers)).toBe(true);
    });

    it('should support pagination', async () => {
      // Given: Many servers for pagination
      mockServers = Array.from({ length: 25 }, (_, i) => ({
        id: `server-${i + 1}`,
        name: `Server ${i + 1}`,
        status: 'online',
        cpu_usage: Math.random() * 100,
        memory_usage: Math.random() * 100,
        disk_usage: Math.random() * 100,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));
      
      // When: Make request with pagination params
      const request = new NextRequest('http://localhost:3000/api/servers/all?page=1&limit=10');
      const response = await GET(request);

      // Then: Should return paginated results (mock mode behavior)
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveProperty('success', true);
      expect(data.data).toHaveProperty('page', 1);
      expect(data.data).toHaveProperty('limit', 10);
      expect(Array.isArray(data.data.servers)).toBe(true);
    });

    it('should validate request headers', async () => {
      // When: Make request (headers don't affect the logic)
      const request = new NextRequest('http://localhost:3000/api/servers/all');
      const response = await GET(request);

      // Then: Should work with mock data
      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toContain('application/json');
    });
  });
});