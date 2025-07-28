/**
 * 🧠 SupabaseRAGEngine 기본 단위 테스트
 * 
 * RAG 엔진의 핵심 기능을 테스트합니다.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SupabaseRAGEngine, getSupabaseRAGEngine } from '../supabase-rag-engine';
import { PostgresVectorDB } from '../postgres-vector-db';
import { CloudContextLoader } from '@/services/mcp/CloudContextLoader';
import { getRedis } from '@/lib/redis';
import { embeddingService } from '../embedding-service';

// Mock dependencies
vi.mock('../postgres-vector-db');
vi.mock('@/services/mcp/CloudContextLoader');
vi.mock('@/lib/redis');
vi.mock('../embedding-service');

describe('SupabaseRAGEngine', () => {
  let engine: SupabaseRAGEngine;
  let mockVectorDB: any;
  let mockContextLoader: any;
  let mockRedis: any;
  
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock PostgresVectorDB
    mockVectorDB = {
      getStats: vi.fn().mockResolvedValue({
        total_documents: 10,
        total_categories: 3,
      }),
      search: vi.fn().mockResolvedValue({
        success: true,
        results: [
          {
            id: '1',
            content: 'Test content',
            similarity: 0.85,
            metadata: { category: 'test' },
          },
        ],
        total: 1,
      }),
      addDocument: vi.fn().mockResolvedValue({ success: true }),
      clearCollection: vi.fn().mockResolvedValue({ success: true }),
    };
    
    // Mock CloudContextLoader
    mockContextLoader = {
      queryMCPContextForRAG: vi.fn().mockResolvedValue({
        files: [],
        systemContext: {},
      }),
    };
    
    // Mock Redis
    mockRedis = {
      get: vi.fn().mockResolvedValue(null),
      set: vi.fn().mockResolvedValue('OK'),
      setex: vi.fn().mockResolvedValue('OK'),
    };
    
    // Mock embeddingService
    vi.mocked(embeddingService.generateEmbedding).mockResolvedValue({
      success: true,
      embedding: new Array(384).fill(0.1),
      tokens: 10,
      model: 'text-embedding-3-small',
    });
    
    // Set up mocks
    vi.mocked(PostgresVectorDB).mockImplementation(() => mockVectorDB);
    vi.mocked(CloudContextLoader.getInstance).mockReturnValue(mockContextLoader);
    vi.mocked(getRedis).mockReturnValue(mockRedis);
    
    engine = new SupabaseRAGEngine();
  });
  
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize successfully', async () => {
      await engine.initialize();
      
      expect(mockVectorDB.getStats).toHaveBeenCalled();
      expect(engine['isInitialized']).toBe(true);
    });

    it('should only initialize once', async () => {
      await engine.initialize();
      await engine.initialize();
      await engine.initialize();
      
      expect(mockVectorDB.getStats).toHaveBeenCalledTimes(1);
    });

    it('should load initial knowledge base when empty', async () => {
      mockVectorDB.getStats.mockResolvedValue({
        total_documents: 0,
        total_categories: 0,
      });
      
      // Mock loadInitialKnowledgeBase
      engine['loadInitialKnowledgeBase'] = vi.fn().mockResolvedValue(undefined);
      
      await engine.initialize();
      
      expect(engine['loadInitialKnowledgeBase']).toHaveBeenCalled();
    });

    it('should handle initialization errors gracefully', async () => {
      mockVectorDB.getStats.mockRejectedValue(new Error('DB error'));
      
      await expect(engine.initialize()).resolves.toBeUndefined();
      expect(engine['isInitialized']).toBe(true);
    });
  });

  describe('Search Similar', () => {
    beforeEach(async () => {
      await engine.initialize();
    });

    it('should perform basic search', async () => {
      const result = await engine.searchSimilar('테스트 쿼리');
      
      expect(result.success).toBe(true);
      expect(result.results).toHaveLength(1);
      expect(result.results[0].content).toBe('Test content');
      expect(embeddingService.generateEmbedding).toHaveBeenCalledWith('테스트 쿼리');
    });

    it('should use cache when available', async () => {
      mockRedis.get.mockResolvedValue(JSON.stringify({
        success: true,
        results: [{ content: 'Cached result' }],
        totalResults: 1,
        cached: true,
      }));
      
      const result = await engine.searchSimilar('캐시된 쿼리', { cached: true });
      
      expect(result.cached).toBe(true);
      expect(result.results[0].content).toBe('Cached result');
      expect(mockVectorDB.search).not.toHaveBeenCalled();
    });

    it('should handle search with options', async () => {
      await engine.searchSimilar('쿼리', {
        maxResults: 5,
        threshold: 0.7,
        category: 'test-category',
      });
      
      expect(mockVectorDB.search).toHaveBeenCalledWith(
        expect.any(Array),
        expect.objectContaining({
          limit: 5,
          threshold: 0.7,
          category: 'test-category',
        })
      );
    });

    it('should include MCP context when enabled', async () => {
      mockContextLoader.queryMCPContextForRAG.mockResolvedValue({
        files: [{ path: '/test.ts', content: 'test file' }],
        systemContext: { test: true },
      });
      
      const result = await engine.searchSimilar('MCP 쿼리', {
        enableMCP: true,
      });
      
      expect(mockContextLoader.queryMCPContextForRAG).toHaveBeenCalled();
      expect(result.mcpContext).toBeDefined();
    });

    it('should handle embedding service errors', async () => {
      vi.mocked(embeddingService.generateEmbedding).mockResolvedValue({
        success: false,
        error: 'Embedding error',
      });
      
      const result = await engine.searchSimilar('에러 쿼리');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('임베딩 생성 실패');
    });

    it('should handle vector DB search errors', async () => {
      mockVectorDB.search.mockResolvedValue({
        success: false,
        error: 'Search error',
      });
      
      const result = await engine.searchSimilar('검색 에러');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Search error');
    });
  });

  describe('Add Document', () => {
    beforeEach(async () => {
      await engine.initialize();
    });

    it('should add document successfully', async () => {
      const result = await engine.addDocument({
        content: 'New document content',
        category: 'test',
        metadata: { author: 'test' },
      });
      
      expect(result.success).toBe(true);
      expect(embeddingService.generateEmbedding).toHaveBeenCalledWith('New document content');
      expect(mockVectorDB.addDocument).toHaveBeenCalled();
    });

    it('should clear search cache after adding document', async () => {
      // Add some cache
      engine['searchCache'].set('test-key', {} as any);
      
      await engine.addDocument({
        content: 'New content',
        category: 'test',
      });
      
      expect(engine['searchCache'].size).toBe(0);
    });

    it('should handle add document errors', async () => {
      mockVectorDB.addDocument.mockResolvedValue({
        success: false,
        error: 'Add error',
      });
      
      const result = await engine.addDocument({
        content: 'Error content',
        category: 'test',
      });
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Add error');
    });
  });

  describe('Health Check', () => {
    it('should return healthy status', async () => {
      await engine.initialize();
      
      const health = await engine.healthCheck();
      
      expect(health.status).toBe('healthy');
      expect(health.vectorDB).toBe(true);
      expect(health.embeddingService).toBe(true);
      expect(health.redis).toBe(true);
    });

    it('should handle unhealthy vector DB', async () => {
      mockVectorDB.getStats.mockRejectedValue(new Error('DB error'));
      
      const health = await engine.healthCheck();
      
      expect(health.status).toBe('unhealthy');
      expect(health.vectorDB).toBe(false);
    });
  });

  describe('Caching', () => {
    beforeEach(async () => {
      await engine.initialize();
    });

    it('should cache search results in Redis', async () => {
      await engine.searchSimilar('캐싱 테스트', { cached: true });
      
      expect(mockRedis.setex).toHaveBeenCalledWith(
        expect.stringContaining('rag:search:'),
        300, // TTL
        expect.any(String)
      );
    });

    it('should use memory cache for embeddings', async () => {
      // First call
      await engine.searchSimilar('동일한 쿼리');
      
      // Second call should use cached embedding
      await engine.searchSimilar('동일한 쿼리');
      
      expect(embeddingService.generateEmbedding).toHaveBeenCalledTimes(1);
    });

    it('should handle Redis errors gracefully', async () => {
      mockRedis.get.mockRejectedValue(new Error('Redis error'));
      
      const result = await engine.searchSimilar('Redis 에러 테스트');
      
      expect(result.success).toBe(true); // Should still work
      expect(mockVectorDB.search).toHaveBeenCalled();
    });
  });

  describe('Clear Knowledge Base', () => {
    it('should clear knowledge base and caches', async () => {
      await engine.initialize();
      
      // Add some cache
      engine['embeddingCache'].set('test', []);
      engine['searchCache'].set('test', {} as any);
      
      const result = await engine.clearKnowledgeBase();
      
      expect(result.success).toBe(true);
      expect(mockVectorDB.clearCollection).toHaveBeenCalled();
      expect(engine['embeddingCache'].size).toBe(0);
      expect(engine['searchCache'].size).toBe(0);
    });
  });

  describe('Singleton Pattern', () => {
    it('should return same instance', () => {
      const instance1 = getSupabaseRAGEngine();
      const instance2 = getSupabaseRAGEngine();
      
      expect(instance1).toBe(instance2);
    });
  });

  describe('Edge Cases', () => {
    beforeEach(async () => {
      await engine.initialize();
    });

    it('should handle empty search query', async () => {
      const result = await engine.searchSimilar('');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('빈 쿼리');
    });

    it('should handle very long queries', async () => {
      const longQuery = '긴 쿼리 '.repeat(100);
      const result = await engine.searchSimilar(longQuery);
      
      expect(result.success).toBe(true);
      expect(embeddingService.generateEmbedding).toHaveBeenCalledWith(
        expect.stringContaining('긴 쿼리')
      );
    });

    it('should handle special characters in queries', async () => {
      const specialQuery = '테스트!@#$%^&*()';
      const result = await engine.searchSimilar(specialQuery);
      
      expect(result.success).toBe(true);
    });

    it('should work without Redis in browser environment', () => {
      // Simulate browser environment
      const originalWindow = global.window;
      global.window = {} as any;
      
      const browserEngine = new SupabaseRAGEngine();
      expect(browserEngine['redis']).toBeNull();
      
      // Restore
      global.window = originalWindow;
    });
  });
});