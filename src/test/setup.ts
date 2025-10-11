/**
 * Vitest Test Setup
 * DOM testing 환경 설정
 */

import { vi } from 'vitest';
import '@testing-library/jest-dom';
import { createSupabaseMock, SupabaseMockBuilder } from './helpers/supabase-mock';

// Supabase Client Mock - 향상된 Builder 패턴 사용
vi.mock('@/lib/supabase/supabase-client', () => {
  return createSupabaseMock(
    new SupabaseMockBuilder()
      .withData([])
      .withError(null)
      .withVectorSearchResults([
        {
          id: '1',
          content: 'Test content',
          similarity: 0.85,
          metadata: { category: 'test' },
        },
      ])
  );
});

// PostgresVectorDB Mock - 초기화 및 캐시 객체 포함
vi.mock('@/services/ai/postgres-vector-db', () => {
  return {
    PostgresVectorDB: vi.fn().mockImplementation(() => ({
      getStats: vi.fn().mockResolvedValue({
        total_documents: 10,
        total_categories: 3,
      }),
      search: vi.fn().mockResolvedValue([
        {
          id: '1',
          content: 'Test content',
          similarity: 0.85,
          metadata: { category: 'test' },
        },
      ]),
      addDocument: vi.fn().mockResolvedValue({ success: true }),
      clearCollection: vi.fn().mockResolvedValue({ success: true }),
      // 초기화 관련 메서드
      _initialize: vi.fn().mockResolvedValue(undefined),
      isInitialized: true,
    })),
  };
});

// CloudContextLoader Mock
vi.mock('@/services/mcp/CloudContextLoader', () => ({
  CloudContextLoader: {
    getInstance: vi.fn(() => ({
      queryMCPContextForRAG: vi.fn().mockResolvedValue({
        files: [],
        systemContext: {},
      }),
    })),
  },
}));

// Embedding Service Mock
vi.mock('@/services/ai/embedding-service', () => ({
  embeddingService: {
    createEmbedding: vi.fn().mockResolvedValue(new Array(384).fill(0.1)),
  },
}));

// Logger Mock
vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

// Fetch Mock - 더 현실적인 응답
globalThis.fetch = vi.fn().mockImplementation((url: string) => {
  return Promise.resolve({
    ok: true,
    status: 200,
    statusText: 'OK',
    json: () => Promise.resolve({
      data: {
        response: 'Mock AI response',
        confidence: 0.9
      }
    }),
    text: () => Promise.resolve('Mock text response'),
    headers: new Headers(),
    url,
  });
}) as typeof fetch;

// Global mocks
Object.defineProperty(globalThis, 'localStorage', {
  value: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  },
  writable: true,
});

Object.defineProperty(globalThis, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

Object.defineProperty(globalThis, 'IntersectionObserver', {
  value: vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  })),
  writable: true,
});

Object.defineProperty(globalThis, 'ResizeObserver', {
  value: vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  })),
  writable: true,
});