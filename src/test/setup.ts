/**
 * Vitest Test Setup
 * DOM testing 환경 설정
 */

import React from 'react';
import { expect, vi } from 'vitest';
import '@testing-library/jest-dom';

// React를 global에 추가 (jsdom 환경에서 JSX 지원)
globalThis.React = React;

import { toHaveNoViolations } from 'jest-axe';
import {
  createSupabaseMock,
  SupabaseMockBuilder,
} from './helpers/supabase-mock';

// jest-axe matcher 등록
expect.extend(toHaveNoViolations);

// Supabase Client Mock - 향상된 Builder 패턴 사용
vi.mock('@/lib/supabase/client', () => {
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
    json: () =>
      Promise.resolve({
        data: {
          response: 'Mock AI response',
          confidence: 0.9,
        },
      }),
    text: () => Promise.resolve('Mock text response'),
    headers: new Headers(),
    url,
  });
}) as typeof fetch;

// Global mocks
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    key: vi.fn((index: number) => Object.keys(store)[index] || null),
    get length() {
      return Object.keys(store).length;
    },
  };
})();

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

Object.defineProperty(globalThis, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
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

// IntersectionObserver Mock - 클래스 기반 (Next.js use-intersection.js 호환)
class IntersectionObserverMock implements IntersectionObserver {
  readonly root: Element | Document | null = null;
  readonly rootMargin: string = '';
  readonly thresholds: ReadonlyArray<number> = [];

  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
  takeRecords = vi.fn().mockReturnValue([]);
}

Object.defineProperty(globalThis, 'IntersectionObserver', {
  value: IntersectionObserverMock,
  writable: true,
});

// ResizeObserver Mock - 클래스 기반
class ResizeObserverMock implements ResizeObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}

Object.defineProperty(globalThis, 'ResizeObserver', {
  value: ResizeObserverMock,
  writable: true,
});
