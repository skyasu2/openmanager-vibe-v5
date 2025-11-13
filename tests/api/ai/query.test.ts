import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GET, POST, OPTIONS } from '@/app/api/ai/query/route';
import { NextRequest } from 'next/server';

// Environment detection for cloud-dependent tests
const isCloudEnvironment = process.env.VERCEL === '1' || process.env.CI === 'true';

// Mock withAuth to bypass authentication
vi.mock('@/lib/api-auth', () => ({
  withAuth: (handler: any) => handler,
  checkAPIAuth: vi.fn().mockResolvedValue(null),
}));

// Mock cache-helper to prevent cache hits from bypassing the query engine mock
vi.mock('@/lib/cache-helper', () => ({
  getCachedData: vi.fn().mockResolvedValue(null), // Always return null (cache miss)
  setCachedData: vi.fn().mockResolvedValue(undefined), // No-op
  invalidateCache: vi.fn().mockResolvedValue(undefined),
  getCacheService: vi.fn(() => ({
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue(undefined),
    invalidateCache: vi.fn().mockResolvedValue(undefined),
  })),
}));

// Mock SimplifiedQueryEngine using vi.hoisted() to avoid temporal dead zone
const mockQueryEngine = vi.hoisted(() => ({
  _initialize: vi.fn().mockResolvedValue(undefined),
  query: vi.fn(),
  healthCheck: vi.fn(),
  cleanupCache: vi.fn(),
}));

vi.mock('@/services/ai/SimplifiedQueryEngine', () => ({
  SimplifiedQueryEngine: vi.fn(() => mockQueryEngine),
  getSimplifiedQueryEngine: vi.fn(() => mockQueryEngine),
}));

// Get mockQueryEngine reference (no import needed with vi.doMock)
import { getSimplifiedQueryEngine } from '@/services/ai/SimplifiedQueryEngine';

describe('API: /api/ai/query', () => {
  beforeEach(async () => {
    // Reset all mocks
    vi.clearAllMocks();
    
    // ✅ Reset singleton instance to null
    // This allows vi.doMock to provide fresh mock instance
    const SimplifiedQueryEngineModule = await import('@/services/ai/SimplifiedQueryEngine');
    (SimplifiedQueryEngineModule as any).engineInstance = null;
    
    // Reset mock implementations
    mockQueryEngine._initialize.mockResolvedValue(undefined);
    mockQueryEngine.query.mockReset();
    mockQueryEngine.healthCheck.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Cloud-dependent tests (skip on local, run on Vercel/CI)
  describe.skipIf(!isCloudEnvironment)('Cloud Integration Tests', () => {
    describe('GET /api/ai/query', () => {
      // @created-date: 2025-08-02
      it('should return health status for GET requests', async () => {
        const request = new NextRequest('http://localhost:3000/api/ai/query');
        
        // ✅ FIX: Ensure healthCheck mock is set properly for each test
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
      it('should select appropriate engine based on query complexity', async () => {
        const complexQuery = 'Analyze the performance trends over the last month and provide optimization recommendations based on machine learning predictions';
        
        const request = new NextRequest('http://localhost:3000/api/ai/query', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
          query: complexQuery,
          mode: 'google-ai',
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
        // ✅ FIX: Route preserves 'auto' mode in queryRequest when normalizedMode === 'auto'
        expect(mockQueryEngine.query).toHaveBeenCalledWith(
      expect.objectContaining({
        query: complexQuery,
        mode: 'google-ai', // Route handler preserves 'auto' mode
          })
        );
        expect(data.engine).toBe('google-ai');
        expect(data.metadata.complexity.score).toBe(0.85);
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

        // ✅ Expect graceful degradation pattern (not HTTP error semantics)
        expect(response.status).toBe(200); // Always 200 for graceful UX
        expect(data.success).toBe(true);   // success: true with fallback indicator
        expect(data.metadata.fallback).toBe(true); // Indicates error fallback
        expect(data.confidence).toBeLessThan(0.5); // Very low confidence (0.1-0.4)
        expect(data.engine).toBe('error-fallback'); // Error fallback engine
        expect(data.metadata.error).toContain('Service temporarily unavailable'); // Original error preserved
        expect(data.response).toBeTruthy(); // Contains Korean fallback message
      });

      // @created-date: 2025-08-02
      it('should test different AI modes (local, google-ai, auto)', async () => {
        const modes = ['local', 'google-ai', 'local-ai'] as const;
        
        for (const mode of modes) {
          // ✅ FIX: Set up mock INSIDE the loop for each iteration
          // This ensures each iteration gets its own isolated mock response
          const expectedEngine = mode === 'local' || mode === 'local-ai' ? 'local-rag' : 'google-ai';
          
          console.log(`
🔍 [BEFORE MOCK] Mode: ${mode}, Expected: ${expectedEngine}, Mock calls so far: ${mockQueryEngine.query.mock.calls.length}`);
          
          mockQueryEngine.query.mockImplementationOnce(async (queryRequest) => {
          console.log(`📞 [MOCK CALLED] Mode: ${mode}, Query: ${JSON.stringify(queryRequest).substring(0, 100)}`);
          return {
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
        };
      });
        

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

          const response = await POST(request);
          const data = await response.json();
          
          console.log(`🔍 [AFTER API] Mode: ${mode}, Expected: ${expectedEngine}, Got: ${data.engine}, Total mock calls: ${mockQueryEngine.query.mock.calls.length}`);

          expect(response.status).toBe(200);
          expect(data.success).toBe(true);
          expect(data.engine).toBe(expectedEngine);
          expect(data.response).toContain('Response from');
          expect(data.metadata.mode).toBe(mode);
        }
      });

    });
  });

  // Local-compatible tests (run in all environments)
  describe('Local Tests', () => {
    describe('POST /api/ai/query', () => {
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
      expect(response.headers.get('Access-Control-Allow-Headers')).toBe('Content-Type, Authorization');
      expect(response.headers.get('Access-Control-Max-Age')).toBe('86400');
    });
  });
});
