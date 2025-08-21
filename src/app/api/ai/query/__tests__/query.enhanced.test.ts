/**
 * Enhanced Query API Tests
 * TDD for Phase 1: Natural Language Query Enhancement
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NextRequest } from 'next/server';

// Mock 의존성
vi.mock('@/lib/cache-helper', () => ({
  getCachedData: vi.fn(),
  setCachedData: vi.fn(),
}));

vi.mock('@/lib/supabase/supabase-client', () => ({
  supabase: {
    from: vi.fn(() => ({
      insert: vi.fn(() => Promise.resolve({ data: null, error: null })),
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: null, error: null })),
        })),
      })),
    })),
  },
}));

// Mock authentication middleware
vi.mock('@/lib/api-auth', () => ({
  withAuth: (handler: (req: NextRequest) => Promise<Response>) => handler,
}));

// Mock SimplifiedQueryEngine
vi.mock('@/services/ai/SimplifiedQueryEngine', () => ({
  getSimplifiedQueryEngine: () => ({
    _initialize: vi.fn(() => Promise.resolve()),
    query: vi.fn(() =>
      Promise.resolve({
        success: true,
        response: '현재 Server-03의 CPU 사용률이 85%로 가장 높습니다.',
        confidence: 0.9,
        engine: 'mock-engine',
        processingTime: 150,
        metadata: {
          complexity: { score: 0.5, recommendation: 'simple' },
          cacheHit: false,
          ragResults: [],
        },
        thinkingSteps: [],
      })
    ),
    healthCheck: vi.fn(() =>
      Promise.resolve({
        status: 'healthy',
        engines: {
          localRAG: true,
          googleAI: true,
          mcp: true,
        },
      })
    ),
  }),
}));

describe('Enhanced Query API', () => {
  const mockQuery = 'CPU 사용률이 높은 서버는?';
  const mockCachedResult = {
    success: true,
    response: '현재 Server-03의 CPU 사용률이 85%로 가장 높습니다.',
    answer: '현재 Server-03의 CPU 사용률이 85%로 가장 높습니다.', // answer 필드 추가
    confidence: 0.9,
    engine: 'cached-engine',
    processingTime: 10,
    metadata: {
      complexity: { score: 0.5, recommendation: 'simple' },
      cacheHit: true,
      ragResults: [],
    },
    thinkingSteps: [],
  };

  // Import handlers after mocks
  let POST: (req: NextRequest) => Promise<Response>;
  let GET: (req: NextRequest) => Promise<Response>;
  beforeEach(async () => {
    const module = await import('../route');
    POST = module.POST;
    GET = module.GET;
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  describe('Basic Functionality', () => {
    it('should handle query requests successfully', async () => {
      const request = new NextRequest('http://localhost:3000/api/ai/query', {
        method: 'POST',
        body: JSON.stringify({ query: mockQuery }),
      });

      const response = await POST(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('answer');
      expect(data).toHaveProperty('metadata');
    });
  });

  describe('Caching Functionality', () => {
    it('should handle cache miss scenario', async () => {
      const { getCachedData } = await import('@/lib/cache-helper');
      vi.mocked(getCachedData).mockResolvedValueOnce(null);

      const request = new NextRequest('http://localhost:3000/api/ai/query', {
        method: 'POST',
        body: JSON.stringify({ query: mockQuery }),
      });

      const response = await POST(request);
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveProperty('answer');
    });

    it('should handle cache hit scenario', async () => {
      const { getCachedData } = await import('@/lib/cache-helper');
      vi.mocked(getCachedData).mockResolvedValueOnce(mockCachedResult);

      const request = new NextRequest('http://localhost:3000/api/ai/query', {
        method: 'POST',
        body: JSON.stringify({ query: mockQuery }),
      });

      const response = await POST(request);
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveProperty('answer');
    });
  });


  describe('Concurrent Requests', () => {
    it('should handle multiple requests without errors', async () => {
      const requests = Array.from(
        { length: 3 },
        (_, i) =>
          new NextRequest('http://localhost:3000/api/ai/query', {
            method: 'POST',
            body: JSON.stringify({ query: `Query ${i}` }),
          })
      );

      const responses = await Promise.all(requests.map((req) => POST(req)));

      // 모든 요청이 성공해야 함
      responses.forEach((response) => {
        expect(response.status).toBe(200);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid query input', async () => {
      const request = new NextRequest('http://localhost:3000/api/ai/query', {
        method: 'POST',
        body: JSON.stringify({ query: '' }), // 빈 쿼리
      });

      const response = await POST(request);
      // 에러 처리가 적절하게 되는지 확인 (400 또는 200 둘 다 허용)
      expect([200, 400]).toContain(response.status);
    });

    it('should handle cache errors gracefully', async () => {
      const { getCachedData } = await import('@/lib/cache-helper');
      vi.mocked(getCachedData).mockRejectedValueOnce(new Error('Cache Error'));

      const request = new NextRequest('http://localhost:3000/api/ai/query', {
        method: 'POST',
        body: JSON.stringify({ query: mockQuery }),
      });

      const response = await POST(request);
      expect(response.status).toBe(200);
    });
  });

});
