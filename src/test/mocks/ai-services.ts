/**
 * 🤖 AI 서비스 Mock
 */

import { vi } from 'vitest';

// 테스트 환경에서는 항상 Mock 사용
const isTestEnvironment =
  process.env.NODE_ENV === 'test' || process.env.VITEST === 'true';

// Google AI - 테스트 환경에서는 항상 Mock
console.log('🎭 Google AI Mock 활성화됨 (테스트 환경)');
vi.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: vi.fn().mockImplementation(() => ({
    getGenerativeModel: vi.fn(() => ({
      generateContent: vi.fn(() =>
        Promise.resolve({
          response: {
            text: vi.fn(() => 'Mock AI response'),
          },
        })
      ),
    })),
  })),
}));

// OpenAI Mock 제거됨 - 프로젝트에서 사용하지 않는 서비스

// Embedding Service Mock
vi.mock('@/services/ai/embedding-service', () => ({
  embeddingService: {
    createEmbedding: vi.fn().mockImplementation((text: string) => {
      // 간단한 mock 임베딩 생성 (384차원)
      const hash = text
        .split('')
        .reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const embedding = new Array(384)
        .fill(0)
        .map((_, i) => Math.sin((hash + i) * 0.1) * 0.5 + 0.5);
      return Promise.resolve(embedding);
    }),
    generateEmbedding: vi.fn().mockImplementation((text: string) => {
      const hash = text
        .split('')
        .reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const embedding = new Array(384)
        .fill(0)
        .map((_, i) => Math.sin((hash + i) * 0.1) * 0.5 + 0.5);
      return Promise.resolve(embedding);
    }),
  },
}));

// MCP Context Loader - 테스트 환경에서는 항상 Mock
console.log('🎭 MCP Context Loader Mock 활성화됨 (테스트 환경)');
vi.mock('@/services/mcp/CloudContextLoader', () => ({
  CloudContextLoader: {
    getInstance: vi.fn(() => ({
      queryMCPContextForRAG: vi.fn().mockResolvedValue({
        tools: [],
        resources: [],
        prompts: [],
        error: null,
      }),
      getIntegratedStatus: vi.fn().mockResolvedValue({
        mcpServer: {
          status: 'online',
          availableTools: 10,
          availableResources: 5,
        },
      }),
    })),
  },
}));

// Supabase RAG Engine - 테스트 환경에서는 항상 Mock
console.log('🎭 Supabase RAG Engine Mock 활성화됨 (테스트 환경)');
vi.mock('@/services/ai/supabase-rag-engine', () => ({
  getSupabaseRAGEngine: vi.fn(() => ({
    _initialize: vi.fn().mockResolvedValue(undefined),
    generateEmbedding: vi.fn().mockImplementation((text: string) => {
      const hash = text
        .split('')
        .reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const embedding = new Array(384)
        .fill(0)
        .map((_, i) => Math.sin((hash + i) * 0.1) * 0.5 + 0.5);
      return Promise.resolve(embedding);
    }),
    searchSimilar: vi.fn().mockResolvedValue({
      results: [
        {
          content: 'Mock RAG result',
          similarity: 0.85,
          metadata: { source: 'test' },
        },
      ],
      totalResults: 1,
      cached: false,
    }),
    isInitialized: true,
  })),
}));

// Query Cache Manager Mock
vi.mock('@/services/ai/query-cache-manager', () => ({
  getQueryCacheManager: vi.fn(() => ({
    getFromPatternCache: vi.fn().mockResolvedValue(null),
    setPatternCache: vi.fn().mockResolvedValue(undefined),
    clearCache: vi.fn().mockResolvedValue(undefined),
  })),
}));

// Vector Search Optimizer Mock
vi.mock('@/services/ai/vector-search-optimizer', () => ({
  getVectorSearchOptimizer: vi.fn(() => ({
    optimizeSearch: vi.fn().mockResolvedValue({
      optimized: true,
      strategy: 'default',
    }),
  })),
}));
