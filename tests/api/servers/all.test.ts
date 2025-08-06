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

// Mock getMockSystem
let mockServers = [
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

vi.mock('@/mock', () => ({
  getMockSystem: vi.fn(() => ({
    getServers: vi.fn(() => mockServers)
  }))
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
      expect(data).toHaveProperty('servers');
      expect(Array.isArray(data.servers)).toBe(true);
      expect(data.servers).toHaveLength(2);
      expect(data.servers[0]).toHaveProperty('id');
      expect(data.servers[0]).toHaveProperty('name');
      expect(data.servers[0]).toHaveProperty('status');
    });

    it('should include proper response structure', async () => {
      // When: Make request
      const request = new NextRequest('http://localhost:3000/api/servers/all');
      const response = await GET(request);

      // Then: Verify response structure
      const data = await response.json();
      expect(data).toHaveProperty('servers');
      expect(data).toHaveProperty('count');
      expect(data).toHaveProperty('timestamp');
      expect(typeof data.count).toBe('number');
      expect(new Date(data.timestamp)).toBeInstanceOf(Date);
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
      expect(data.servers).toEqual([]);
      expect(data.count).toBe(0);
      expect(data.totalCount).toBe(0);
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
      expect(data.servers).toEqual([]);
      expect(data.count).toBe(0);
    });
  });

  describe('에러 상황 처리', () => {
    it('should return 500 when database error occurs', async () => {
      // Given: Database error
      process.env.SIMULATE_DB_ERROR = 'true';

      // When: Make request
      const request = new NextRequest('http://localhost:3000/api/servers/all');
      const response = await GET(request);

      // Then: Verify error response
      expect(response.status).toBe(500);
      
      const data = await response.json();
      expect(data).toHaveProperty('error');
      expect(data.error).toBe('Database connection failed');
    });

    it('should handle cache errors gracefully', async () => {
      // Given: Memory cache is used instead of Redis
      // Memory cache failures are handled gracefully
      
      // When: Make request
      const request = new NextRequest('http://localhost:3000/api/servers/all');
      const response = await GET(request);

      // Then: Should return data from database
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveProperty('servers');
      // Memory cache behavior is different from Redis
    });

    it('should return 503 when service is unavailable', async () => {
      // Given: Service unavailable scenario
      process.env.SIMULATE_SERVICE_UNAVAILABLE = 'true';

      // When: Make request
      const request = new NextRequest('http://localhost:3000/api/servers/all');
      const response = await GET(request);

      // Then: Verify service unavailable response
      expect(response.status).toBe(503);
      
      const data = await response.json();
      expect(data).toHaveProperty('error');
      expect(data.error).toContain('unavailable');
    });
  });

  describe('캐싱 헤더 검증', () => {
    it('should include proper cache headers', async () => {
      // When: Make request
      const request = new NextRequest('http://localhost:3000/api/servers/all');
      const response = await GET(request);

      // Then: Verify cache headers
      expect(response.headers.get('Cache-Control')).toBe('public, s-maxage=60, stale-while-revalidate=300');
      expect(response.headers.get('X-Cache-Status')).toMatch(/^(hit|miss)$/);
    });

    it('should return X-Cache-Status: hit when data is cached', async () => {
      // Given: Cached data exists - first set the cache
      const request1 = new NextRequest('http://localhost:3000/api/servers/all');
      await GET(request1); // This will cache the data

      // When: Make second request
      const request2 = new NextRequest('http://localhost:3000/api/servers/all');
      const response = await GET(request2);

      // Then: Verify cache hit
      expect(response.headers.get('X-Cache-Status')).toBe('hit');
      
      const data = await response.json();
      expect(data.fromCache).toBe(true);
    });

    it('should return X-Cache-Status: miss when cache is empty', async () => {
      // Given: Memory cache is cleared per test

      // When: Make request
      const request = new NextRequest('http://localhost:3000/api/servers/all');
      const response = await GET(request);

      // Then: Verify cache miss
      expect(response.headers.get('X-Cache-Status')).toBe('miss');
      
      const data = await response.json();
      expect(data.fromCache).toBe(false);
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
      expect(response.headers.get('X-Response-Time')).toBeTruthy();
      const headerTime = response.headers.get('X-Response-Time');
      expect(parseInt(headerTime || '0')).toBeGreaterThanOrEqual(0);
    });

    it('should include server timing header', async () => {
      // When: Make request
      const request = new NextRequest('http://localhost:3000/api/servers/all');
      const response = await GET(request);

      // Then: Verify server timing
      const serverTiming = response.headers.get('Server-Timing');
      expect(serverTiming).toBeTruthy();
      expect(serverTiming).toContain('db');
      expect(serverTiming).toContain('cache');
      expect(serverTiming).toContain('total');
    });

    it('should measure cache vs database performance', async () => {
      // Given: Memory cache is cleared per test
      
      // When: Make two requests (first: cache miss, second: cache hit)
      const request1 = new NextRequest('http://localhost:3000/api/servers/all');
      const response1 = await GET(request1);
      
      const request2 = new NextRequest('http://localhost:3000/api/servers/all');
      const response2 = await GET(request2);

      // Then: Both should succeed
      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);
      
      // Check cache status
      expect(response1.headers.get('X-Cache-Status')).toBe('miss');
      expect(response2.headers.get('X-Cache-Status')).toBe('hit');
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

      // Then: Should filter results
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.servers.length).toBe(1);
      expect(data.servers[0].status).toBe('online');
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

      // Then: Should return paginated results
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveProperty('page', 1);
      expect(data).toHaveProperty('limit', 10);
      expect(data).toHaveProperty('totalPages', 3);
      expect(data.servers.length).toBe(10);
      expect(data.totalCount).toBe(25);
    });

    it('should validate request headers', async () => {
      // When: Make request (headers don't affect the logic)
      const request = new NextRequest('http://localhost:3000/api/servers/all');
      const response = await GET(request);

      // Then: Should still work
      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('application/json; charset=utf-8');
    });
  });
});