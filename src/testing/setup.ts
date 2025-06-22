import { QueryClient } from '@tanstack/react-query';
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import fetch from 'node-fetch';
import { afterEach, vi } from 'vitest';

// DOM 정리
afterEach(() => {
  cleanup();
});

// 🎭 테스트 환경에서 목업 모드 강제 활성화
process.env.FORCE_MOCK_REDIS = 'true';
process.env.FORCE_MOCK_GOOGLE_AI = 'true';

// 🔧 테스트 환경에서 process 객체 보완
if (!process.cwd) {
  process.cwd = () => process.env.PWD || '/test';
}

// 🎨 Sharp 모듈 목업 (AI 모델 로드 문제 해결)
vi.mock('sharp', () => ({
  default: vi.fn(() => ({
    resize: vi.fn().mockReturnThis(),
    jpeg: vi.fn().mockReturnThis(),
    png: vi.fn().mockReturnThis(),
    toBuffer: vi.fn().mockResolvedValue(Buffer.from('mock-image')),
  })),
}));

// 테스트 환경 변수 설정
const testEnvVars = {
  NODE_ENV: 'test',
  FORCE_MOCK_REDIS: 'true', // 🎭 목업 레디스 강제 사용
  FORCE_MOCK_GOOGLE_AI: 'true', // 🎭 목업 Google AI 강제 사용
  NEXT_PUBLIC_SUPABASE_URL: 'https://test-project.supabase.co',
  SUPABASE_URL: 'https://test-project.supabase.co',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
  SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
  UPSTASH_REDIS_REST_URL: 'https://test-redis.upstash.io',
  UPSTASH_REDIS_REST_TOKEN: 'test-redis-token',
  GOOGLE_AI_API_KEY: 'test-google-ai-key',
  SLACK_WEBHOOK_URL: 'https://hooks.slack.com/test',
  RENDER_MCP_SERVER_URL: 'https://test-mcp.onrender.com',
  // 🛡️ 테스트용 Redis 설정 (사용되지 않음)
  REDIS_URL: '', // 빈 값으로 설정하여 목업 모드 강제
  REDIS_HOST: '',
  REDIS_PASSWORD: '',
};

// 환경 변수 적용
Object.assign(process.env, testEnvVars);

// 실제 fetch를 사용하도록 설정 (Slack 테스트를 위해)
if (!globalThis.fetch) {
  globalThis.fetch = fetch as any;
}

// console 출력 허용 (디버깅을 위해)
global.console = {
  ...console,
  // log, error, warn 등을 실제로 출력하도록 허용
};

// 테스트용 타이머 mock
vi.mock('timers', () => ({
  setInterval: vi.fn(),
  clearInterval: vi.fn(),
  setTimeout: vi.fn(),
  clearTimeout: vi.fn(),
}));

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

// 최적화된 Mock 서버 데이터 (2개만 유지)
export const mockServerData = {
  success: true,
  data: {
    servers: [
      {
        id: 'test-web-01',
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
        id: 'test-api-01',
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

// 테스트용 유틸리티 함수
export const createMockRequest = (url: string, options: RequestInit = {}) => {
  return new Request(url, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
};

export const createMockNextRequest = (url: string, init: RequestInit = {}) => {
  return {
    url,
    method: init.method || 'GET',
    headers: new Headers(init.headers),
    json: async () => JSON.parse((init.body as string) || '{}'),
    text: async () => (init.body as string) || '',
  } as any;
};
