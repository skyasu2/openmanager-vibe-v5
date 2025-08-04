/**
 * 🤖 AI 서비스 Mock
 */

import { vi } from 'vitest';

// Google AI - 조건부 Mock (환경변수에 따라)
const shouldMockGoogleAI = process.env.FORCE_MOCK_GOOGLE_AI === 'true' || 
                          !process.env.GOOGLE_AI_API_KEY ||
                          process.env.GOOGLE_AI_API_KEY === 'mock-google-ai-key';

if (shouldMockGoogleAI) {
  console.log('🎭 Google AI Mock 활성화됨');
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
} else {
  console.log('🌐 실제 Google AI 서비스 사용 중');
}

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

// MCP Context Loader - 조건부 Mock
const shouldMockMCP = process.env.FORCE_MOCK_MCP === 'true' || 
                     process.env.USE_REAL_SERVICES !== 'true';

if (shouldMockMCP) {
  console.log('🎭 MCP Context Loader Mock 활성화됨');
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
} else {
  console.log('🌐 실제 MCP Context Loader 사용 중');
}

// Supabase RAG Engine - 조건부 Mock (실제 서비스 테스트 시 제외)
const shouldMockSupabaseRAG = process.env.FORCE_MOCK_SUPABASE === 'true' || 
                             process.env.USE_REAL_SERVICES !== 'true';

if (shouldMockSupabaseRAG) {
  console.log('🎭 Supabase RAG Engine Mock 활성화됨');
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
} else {
  console.log('🌐 실제 Supabase RAG Engine 사용 중');
}

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
