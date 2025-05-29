import '@testing-library/jest-dom';
import { expect, beforeAll, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import { QueryClient } from '@tanstack/react-query';

// DOM 정리
afterEach(() => {
  cleanup();
});

// 전역 fetch mock 설정
beforeAll(() => {
  global.fetch = vi.fn();
});

// React Query 테스트 유틸리티
export const createTestQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
};

// Mock 데이터
export const mockServerData = {
  success: true,
  data: {
    servers: [
      {
        id: 'test-server-1',
        hostname: 'test-web-01',
        name: 'test-web-01',
        status: 'healthy',
        environment: 'test',
        role: 'web',
        cpu_usage: 45,
        memory_usage: 67,
        disk_usage: 23,
        response_time: 120,
        uptime: 86400000,
        last_updated: new Date().toISOString(),
      },
      {
        id: 'test-server-2',
        hostname: 'test-api-01',
        name: 'test-api-01',
        status: 'warning',
        environment: 'test',
        role: 'api',
        cpu_usage: 78,
        memory_usage: 82,
        disk_usage: 45,
        response_time: 250,
        uptime: 86400000 * 2,
        last_updated: new Date().toISOString(),
      },
    ],
  },
};

export const mockSystemStatus = {
  success: true,
  status: 'healthy',
  uptime: 86400000,
  version: 'v5.11.0-test',
  components: {
    database: 'healthy',
    cache: 'healthy',
    queue: 'healthy',
  },
  metrics: {
    cpu: 45,
    memory: 60,
    disk: 30,
  },
};

// 공통 테스트 유틸리티
export const createMockResponse = (data: any, ok = true) => {
  return Promise.resolve({
    ok,
    status: ok ? 200 : 500,
    json: () => Promise.resolve(data),
  } as Response);
}; 