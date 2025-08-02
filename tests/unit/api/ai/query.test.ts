/**
 * @tdd-red
 * TDD RED Phase: Writing failing tests for /api/ai/query endpoint
 * 
 * Test scenarios:
 * 1. POST request processing AI queries
 * 2. Various query complexity levels (simple, moderate, complex)
 * 3. Automatic engine selection verification
 * 4. Timeout handling (450ms)
 * 5. Error handling (long queries, invalid requests)
 * 6. Caching behavior verification
 * 7. GET request status check
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock modules
vi.mock('@/services/ai/SimplifiedQueryEngine', () => {
  const mockInstance = {
    handleQuery: vi.fn(),
    getHealthStatus: vi.fn(),
    _initialize: vi.fn().mockResolvedValue(undefined),
  };
  
  return {
    SimplifiedQueryEngine: vi.fn().mockImplementation(() => mockInstance),
    getSimplifiedQueryEngine: vi.fn(() => mockInstance),
  };
});

vi.mock('@/lib/redis', () => ({
  default: {
    get: vi.fn(),
    setex: vi.fn(),
    del: vi.fn(),
  },
}));

vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          data: [],
          error: null,
        })),
      })),
    })),
  })),
}));

// Mock authentication
vi.mock('@/lib/api-auth', () => ({
  withAuth: vi.fn((handler) => handler),
}));

// Import after mocks
import { GET, POST } from '@/app/api/ai/query/route';
import { SimplifiedQueryEngine, getSimplifiedQueryEngine } from '@/services/ai/SimplifiedQueryEngine';
import redis from '@/lib/redis';

describe('/api/ai/query endpoint', () => {
  let mockEngine: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockEngine = getSimplifiedQueryEngine();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('POST /api/ai/query', () => {
    describe('Basic query processing', () => {
      it('should process a simple AI query successfully', async () => {
        // Arrange
        const mockQuery = '서버 상태는 어때?';
        const mockResponse = {
          answer: '현재 모든 서버가 정상 작동 중입니다.',
          confidence: 0.95,
          engine: 'google',
          processingTime: 120,
          complexity: 'simple',
        };

        mockEngine.handleQuery.mockResolvedValueOnce(mockResponse);

        const request = new NextRequest('http://localhost:3000/api/ai/query', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ query: mockQuery }),
        });

        // Act
        const response = await POST(request);
        const data = await response.json();

        // Assert
        expect(response.status).toBe(200);
        expect(data).toMatchObject({
          success: true,
          data: mockResponse,
        });
        expect(mockEngine.handleQuery).toHaveBeenCalledWith(mockQuery);
      });

      it('should handle moderate complexity queries', async () => {
        // Arrange
        const mockQuery = '지난 24시간 동안의 CPU 사용률 추이를 분석하고 이상 패턴이 있었는지 알려줘';
        const mockResponse = {
          answer: 'CPU 사용률 분석 결과: 평균 45%, 최대 78%, 14:30에 스파이크 발생',
          confidence: 0.88,
          engine: 'google',
          processingTime: 250,
          complexity: 'moderate',
        };

        mockEngine.handleQuery.mockResolvedValueOnce(mockResponse);

        const request = new NextRequest('http://localhost:3000/api/ai/query', {
          method: 'POST',
          body: JSON.stringify({ query: mockQuery }),
        });

        // Act
        const response = await POST(request);
        const data = await response.json();

        // Assert
        expect(response.status).toBe(200);
        expect(data.data.complexity).toBe('moderate');
        expect(data.data.processingTime).toBeGreaterThan(200);
      });

      it('should handle complex queries with automatic engine selection', async () => {
        // Arrange
        const mockQuery = '서버 클러스터의 전체적인 성능을 분석하고, 병목 현상이 발생하는 지점을 찾아서 최적화 방안을 제시해줘. 특히 데이터베이스 연결 풀과 캐시 히트율을 중점적으로 봐줘.';
        const mockResponse = {
          answer: '복잡한 분석 결과...',
          confidence: 0.82,
          engine: 'supabase', // Complex query uses Supabase RAG
          processingTime: 380,
          complexity: 'complex',
        };

        mockEngine.handleQuery.mockResolvedValueOnce(mockResponse);

        const request = new NextRequest('http://localhost:3000/api/ai/query', {
          method: 'POST',
          body: JSON.stringify({ query: mockQuery }),
        });

        // Act
        const response = await POST(request);
        const data = await response.json();

        // Assert
        expect(response.status).toBe(200);
        expect(data.data.engine).toBe('supabase');
        expect(data.data.complexity).toBe('complex');
      });
    });

    describe('Caching behavior', () => {
      it('should cache successful query results', async () => {
        // Arrange
        const mockQuery = '서버 목록';
        const mockResponse = {
          answer: '서버 3대 운영 중',
          confidence: 0.95,
          engine: 'google',
          processingTime: 100,
          complexity: 'simple',
        };

        mockEngine.handleQuery.mockResolvedValueOnce(mockResponse);
        (redis.get as any).mockResolvedValueOnce(null);

        const request = new NextRequest('http://localhost:3000/api/ai/query', {
          method: 'POST',
          body: JSON.stringify({ query: mockQuery }),
        });

        // Act
        await POST(request);

        // Assert
        expect(redis.setex).toHaveBeenCalledWith(
          expect.stringContaining('ai:query:'),
          300, // 5분 캐시
          JSON.stringify(mockResponse)
        );
      });

      it('should return cached results for repeated queries', async () => {
        // Arrange
        const mockQuery = '서버 상태';
        const cachedResponse = {
          answer: '캐시된 응답',
          confidence: 0.95,
          engine: 'google',
          processingTime: 50,
          complexity: 'simple',
        };

        (redis.get as any).mockResolvedValueOnce(JSON.stringify(cachedResponse));

        const request = new NextRequest('http://localhost:3000/api/ai/query', {
          method: 'POST',
          body: JSON.stringify({ query: mockQuery }),
        });

        // Act
        const response = await POST(request);
        const data = await response.json();

        // Assert
        expect(response.status).toBe(200);
        expect(data.data).toEqual(cachedResponse);
        expect(mockEngine.handleQuery).not.toHaveBeenCalled();
      });
    });

    describe('Timeout handling', () => {
      it('should timeout after 450ms and return appropriate response', async () => {
        // Arrange
        const mockQuery = '매우 복잡한 분석 요청';
        
        // Simulate timeout
        mockEngine.handleQuery.mockImplementation(() => 
          new Promise((resolve) => setTimeout(resolve, 500))
        );

        const request = new NextRequest('http://localhost:3000/api/ai/query', {
          method: 'POST',
          body: JSON.stringify({ query: mockQuery }),
        });

        // Act
        const response = await POST(request);
        const data = await response.json();

        // Assert
        expect(response.status).toBe(504);
        expect(data).toMatchObject({
          success: false,
          error: 'Query timeout',
          message: expect.stringContaining('450ms'),
        });
      });
    });

    describe('Error handling', () => {
      it('should reject queries longer than 500 characters', async () => {
        // Arrange
        const longQuery = 'a'.repeat(501);
        const request = new NextRequest('http://localhost:3000/api/ai/query', {
          method: 'POST',
          body: JSON.stringify({ query: longQuery }),
        });

        // Act
        const response = await POST(request);
        const data = await response.json();

        // Assert
        expect(response.status).toBe(400);
        expect(data).toMatchObject({
          success: false,
          error: 'Query too long',
          message: expect.stringContaining('500 characters'),
        });
        expect(mockEngine.handleQuery).not.toHaveBeenCalled();
      });

      it('should handle missing query parameter', async () => {
        // Arrange
        const request = new NextRequest('http://localhost:3000/api/ai/query', {
          method: 'POST',
          body: JSON.stringify({}),
        });

        // Act
        const response = await POST(request);
        const data = await response.json();

        // Assert
        expect(response.status).toBe(400);
        expect(data).toMatchObject({
          success: false,
          error: 'Bad Request',
          message: 'Query is required',
        });
      });

      it('should handle invalid JSON body', async () => {
        // Arrange
        const request = new NextRequest('http://localhost:3000/api/ai/query', {
          method: 'POST',
          body: 'invalid json',
        });

        // Act
        const response = await POST(request);
        const data = await response.json();

        // Assert
        expect(response.status).toBe(400);
        expect(data).toMatchObject({
          success: false,
          error: 'Bad Request',
        });
      });

      it('should handle engine errors gracefully', async () => {
        // Arrange
        mockEngine.handleQuery.mockRejectedValueOnce(new Error('Engine failure'));

        const request = new NextRequest('http://localhost:3000/api/ai/query', {
          method: 'POST',
          body: JSON.stringify({ query: '서버 상태' }),
        });

        // Act
        const response = await POST(request);
        const data = await response.json();

        // Assert
        expect(response.status).toBe(500);
        expect(data).toMatchObject({
          success: false,
          error: 'Internal Server Error',
          message: expect.stringContaining('Engine failure'),
        });
      });
    });
  });

  describe('GET /api/ai/query', () => {
    it('should return AI engine health status', async () => {
      // Arrange
      const mockHealthStatus = {
        status: 'healthy',
        engines: {
          google: { available: true, responseTime: 85 },
          supabase: { available: true, responseTime: 120 },
          korean: { available: false, responseTime: null },
        },
        uptime: 86400,
        lastCheck: new Date().toISOString(),
      };

      mockEngine.getHealthStatus.mockResolvedValueOnce(mockHealthStatus);

      const request = new NextRequest('http://localhost:3000/api/ai/query', {
        method: 'GET',
      });

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data).toMatchObject({
        success: true,
        data: mockHealthStatus,
      });
    });

    it('should handle health check errors', async () => {
      // Arrange
      mockEngine.getHealthStatus.mockRejectedValueOnce(new Error('Health check failed'));

      const request = new NextRequest('http://localhost:3000/api/ai/query', {
        method: 'GET',
      });

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(503);
      expect(data).toMatchObject({
        success: false,
        error: 'Service Unavailable',
        message: expect.stringContaining('Health check failed'),
      });
    });
  });

  describe('Integration scenarios', () => {
    it('should handle concurrent requests without interference', async () => {
      // Arrange
      const queries = [
        { query: 'query1', response: { answer: 'answer1' } },
        { query: 'query2', response: { answer: 'answer2' } },
        { query: 'query3', response: { answer: 'answer3' } },
      ];

      queries.forEach(({ response }) => {
        mockEngine.handleQuery.mockResolvedValueOnce({
          ...response,
          confidence: 0.9,
          engine: 'google',
          processingTime: 100,
          complexity: 'simple',
        });
      });

      // Act
      const requests = queries.map(({ query }) =>
        POST(
          new NextRequest('http://localhost:3000/api/ai/query', {
            method: 'POST',
            body: JSON.stringify({ query }),
          })
        )
      );

      const responses = await Promise.all(requests);
      const results = await Promise.all(responses.map(r => r.json()));

      // Assert
      expect(responses).toHaveLength(3);
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
      
      results.forEach((result, index) => {
        expect(result.data.answer).toBe(queries[index].response.answer);
      });
    });
  });
});