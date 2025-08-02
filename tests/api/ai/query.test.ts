import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GET, POST, OPTIONS } from '@/app/api/ai/query/route';
import { NextRequest } from 'next/server';

// Mock withAuth to bypass authentication
vi.mock('@/lib/api-auth', () => ({
  withAuth: (handler: any) => handler,
  checkAPIAuth: vi.fn().mockResolvedValue(null),
}));

// Mock SimplifiedQueryEngine
vi.mock('@/services/ai/SimplifiedQueryEngine', () => {
  const mockQueryEngine = {
    _initialize: vi.fn().mockResolvedValue(undefined),
    query: vi.fn(),
    healthCheck: vi.fn(),
    cleanupCache: vi.fn(),
  };

  return {
    SimplifiedQueryEngine: vi.fn(() => mockQueryEngine),
    getSimplifiedQueryEngine: vi.fn(() => mockQueryEngine),
  };
});

import { getSimplifiedQueryEngine } from '@/services/ai/SimplifiedQueryEngine';

describe('API: /api/ai/query', () => {
  let mockQueryEngine: any;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Get the mock query engine instance
    mockQueryEngine = getSimplifiedQueryEngine();

    // Reset mock implementations
    mockQueryEngine._initialize.mockResolvedValue(undefined);
    mockQueryEngine.query.mockReset();
    mockQueryEngine.healthCheck.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('GET /api/ai/query', () => {
    // @created-date: 2025-08-02
    it('should return health status for GET requests', async () => {
      const request = new NextRequest('http://localhost:3000/api/ai/query');
      
      // Mock health check response
      mockQueryEngine.healthCheck.mockResolvedValue({
        status: 'healthy',
        engines: {
          localRAG: true,
          googleAI: true,
          mcp: true,
        },
      });
      
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.service).toBe('ai-query-optimized');
      expect(data.status).toBe('healthy');
      expect(data.engines).toBeDefined();
      expect(data.capabilities).toBeDefined();
    });
  });

  describe('POST /api/ai/query', () => {
    // @created-date: 2025-08-02
    it('should process AI query successfully with local mode', async () => {
      const request = new NextRequest('http://localhost:3000/api/ai/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: 'What is the server status?',
          mode: 'local',
        }),
      });

      mockQueryEngine.query.mockResolvedValue({
        success: true,
        response: 'The server is running normally.',
        confidence: 0.95,
        engine: 'local-rag',
        processingTime: 120,
        thinkingSteps: ['Analyzing query', 'Checking server status'],
        metadata: {
          complexity: { score: 0.3, recommendation: 'simple' },
          cacheHit: false,
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.response).toBe('The server is running normally.');
      expect(data.engine).toBe('local-rag');
      expect(data.responseTime).toBeLessThan(500);
      expect(data.metadata.mode).toBe('local');
    });

    // @created-date: 2025-08-02
    it('should select appropriate engine based on query complexity', async () => {
      const complexQuery = 'Analyze the performance trends over the last month and provide optimization recommendations based on machine learning predictions';
      
      const request = new NextRequest('http://localhost:3000/api/ai/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: complexQuery,
          mode: 'auto',
        }),
      });

      mockQueryEngine.query.mockResolvedValue({
        success: true,
        response: 'Based on ML analysis, here are the recommendations...',
        confidence: 0.88,
        engine: 'google-ai',
        processingTime: 350,
        thinkingSteps: ['Analyzing complexity', 'Selecting engine', 'Processing with Google AI'],
        metadata: {
          complexity: { score: 0.85, recommendation: 'complex' },
          cacheHit: false,
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(mockQueryEngine.query).toHaveBeenCalledWith(
        expect.objectContaining({
          query: complexQuery,
          mode: 'auto',
        })
      );
      expect(data.engine).toBe('google-ai');
      expect(data.metadata.complexity.score).toBe(0.85);
    });

    // @created-date: 2025-08-02
    it('should enforce response time under 500ms', async () => {
      const request = new NextRequest('http://localhost:3000/api/ai/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: 'Quick status check',
          mode: 'local',
        }),
      });

      mockQueryEngine.query.mockResolvedValue({
        success: true,
        response: 'Status: OK',
        confidence: 0.99,
        engine: 'local-rag',
        processingTime: 150,
        thinkingSteps: ['Quick check'],
        metadata: {
          complexity: { score: 0.1, recommendation: 'simple' },
          cacheHit: true,
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.responseTime).toBeLessThan(500);
      expect(response.headers.get('X-Response-Time')).toBeDefined();
      expect(Number(response.headers.get('X-Response-Time'))).toBeLessThan(500);
    });

    // @created-date: 2025-08-02
    it('should return 400 for empty query', async () => {
      const request = new NextRequest('http://localhost:3000/api/ai/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: '',
          mode: 'auto',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Query parameter is required');
    });

    // @created-date: 2025-08-02
    it('should return 400 for excessively long query', async () => {
      const longQuery = 'a'.repeat(1001); // Over 1000 character limit
      
      const request = new NextRequest('http://localhost:3000/api/ai/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: longQuery,
          mode: 'auto',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Query too long (max 1000 characters)');
    });

    // @created-date: 2025-08-02
    it('should handle service unavailable errors gracefully', async () => {
      const request = new NextRequest('http://localhost:3000/api/ai/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: 'Test query',
          mode: 'google-ai',
        }),
      });

      mockQueryEngine.query.mockRejectedValue(new Error('Service temporarily unavailable'));

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Query processing failed');
      expect(data.message).toBe('Service temporarily unavailable');
    });

    // @created-date: 2025-08-02
    it('should handle X-AI-Mode header when body mode takes precedence', async () => {
      const request = new NextRequest('http://localhost:3000/api/ai/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-AI-Mode': 'google-ai',
        },
        body: JSON.stringify({
          query: 'Analyze complex patterns',
          mode: 'local', // body mode should take precedence over header
        }),
      });

      mockQueryEngine.query.mockResolvedValue({
        success: true,
        response: 'Complex pattern analysis complete',
        confidence: 0.92,
        engine: 'local-rag',
        processingTime: 180,
        thinkingSteps: ['Using local RAG as specified'],
        metadata: {
          complexity: { score: 0.7, recommendation: 'complex' },
          cacheHit: false,
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      // Body mode should take precedence over X-AI-Mode header
      expect(mockQueryEngine.query).toHaveBeenCalledWith(
        expect.objectContaining({
          query: 'Analyze complex patterns',
          mode: 'local', // Body mode takes precedence
        })
      );
      expect(data.engine).toBe('local-rag');
      expect(data.metadata.mode).toBe('local');
    });

    // @created-date: 2025-08-02
    it('should test different AI modes (local, google-ai, auto)', async () => {
      const modes = ['local', 'google-ai', 'auto'] as const;
      
      for (const mode of modes) {
        const request = new NextRequest('http://localhost:3000/api/ai/query', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: 'Test query for different modes',
            mode,
          }),
        });

        const expectedEngine = mode === 'auto' ? 'local-rag' : mode === 'local' ? 'local-rag' : 'google-ai';
        
        mockQueryEngine.query.mockResolvedValue({
          success: true,
          response: `Response from ${mode} mode`,
          confidence: 0.9,
          engine: expectedEngine,
          processingTime: 150,
          thinkingSteps: [`Processing with ${mode} mode`],
          metadata: {
            complexity: { score: 0.5, recommendation: 'medium' },
            cacheHit: false,
          },
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.engine).toBe(expectedEngine);
        expect(data.response).toContain('Response from');
        expect(data.metadata.mode).toBe(mode);
      }
    });

    // @created-date: 2025-08-02
    it('should validate request body structure', async () => {
      const invalidRequests = [
        { body: JSON.stringify({ mode: 'auto' }) }, // Missing query
        { body: JSON.stringify({ query: 123 }) }, // Query not string
        { body: 'invalid json' }, // Invalid JSON
      ];

      for (const invalidReq of invalidRequests) {
        const request = new NextRequest('http://localhost:3000/api/ai/query', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: invalidReq.body,
        });

        const response = await POST(request);
        const data = await response.json();
        
        expect(response.status).toBeGreaterThanOrEqual(400);
        expect(response.status).toBeLessThan(600);
        expect(data.success).toBe(false);
      }
    });

    // @created-date: 2025-08-02
    it('should include thinking steps when requested', async () => {
      const request = new NextRequest('http://localhost:3000/api/ai/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: 'Explain server architecture',
          mode: 'google-ai',
          includeThinking: true,
        }),
      });

      const thinkingSteps = [
        'Understanding the query context',
        'Analyzing system architecture',
        'Formulating comprehensive response',
      ];

      mockQueryEngine.query.mockResolvedValue({
        success: true,
        response: 'The server architecture consists of...',
        confidence: 0.95,
        engine: 'google-ai',
        processingTime: 320,
        thinkingSteps,
        metadata: {
          complexity: { score: 0.8, recommendation: 'complex' },
          cacheHit: false,
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.metadata.includeThinking).toBe(true);
      expect(data.metadata.thinkingSteps).toEqual(thinkingSteps);
    });

    // @created-date: 2025-08-02
    it('should handle cache hit scenarios', async () => {
      const request = new NextRequest('http://localhost:3000/api/ai/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: 'Get current metrics',
          mode: 'local',
        }),
      });

      mockQueryEngine.query.mockResolvedValue({
        success: true,
        response: 'Current metrics: CPU 45%, Memory 60%',
        confidence: 0.99,
        engine: 'local-rag',
        processingTime: 25, // Very fast due to cache
        thinkingSteps: ['Retrieved from cache'],
        metadata: {
          complexity: { score: 0.2, recommendation: 'simple' },
          cacheHit: true,
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.metadata.cacheHit).toBe(true);
      expect(response.headers.get('Cache-Control')).toBe('public, max-age=60');
      expect(response.headers.get('X-Cache-Status')).toBe('HIT');
    });
  });

  describe('OPTIONS /api/ai/query', () => {
    // @created-date: 2025-08-02
    it('should handle CORS preflight requests', async () => {
      const request = new NextRequest('http://localhost:3000/api/ai/query', {
        method: 'OPTIONS',
      });

      const response = await OPTIONS(request);

      expect(response.status).toBe(200);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
      expect(response.headers.get('Access-Control-Allow-Methods')).toBe('GET, POST, OPTIONS');
      expect(response.headers.get('Access-Control-Allow-Headers')).toBe('Content-Type, Authorization, X-AI-Mode');
      expect(response.headers.get('Access-Control-Max-Age')).toBe('86400');
    });
  });
});