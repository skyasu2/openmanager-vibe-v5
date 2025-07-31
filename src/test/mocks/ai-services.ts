/**
 * 🤖 AI 서비스 Mock
 */

import { vi } from 'vitest';

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

vi.mock('openai', () => ({
  OpenAI: vi.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: vi.fn(() =>
          Promise.resolve({
            choices: [{ message: { content: 'Mock OpenAI response' } }],
          })
        ),
      },
    },
  })),
}));

// Embedding Service Mock
vi.mock('@/services/ai/embedding-service', () => ({
  embeddingService: {
    createEmbedding: vi.fn().mockImplementation((text: string) => {
      // 간단한 mock 임베딩 생성 (384차원)
      const hash = text.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const embedding = new Array(384).fill(0).map((_, i) => 
        Math.sin((hash + i) * 0.1) * 0.5 + 0.5
      );
      return Promise.resolve(embedding);
    }),
    generateEmbedding: vi.fn().mockImplementation((text: string) => {
      const hash = text.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const embedding = new Array(384).fill(0).map((_, i) => 
        Math.sin((hash + i) * 0.1) * 0.5 + 0.5
      );
      return Promise.resolve(embedding);
    }),
  },
}));

// MCP Context Loader Mock
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
