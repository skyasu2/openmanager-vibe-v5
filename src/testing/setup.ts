import { QueryClient } from '@tanstack/react-query';
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import fetch from 'node-fetch';
import { afterEach, vi } from 'vitest';

// 🚨 최우선 환경 변수 설정 (모든 import보다 먼저)
(process.env as any).NODE_ENV = 'test';
(process.env as any).FORCE_MOCK_REDIS = 'true';
(process.env as any).FORCE_MOCK_GOOGLE_AI = 'true';
(process.env as any).NEXT_PUBLIC_SUPABASE_URL =
  'https://test-project.supabase.co';
(process.env as any).SUPABASE_URL = 'https://test-project.supabase.co';
(process.env as any).NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
(process.env as any).SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
(process.env as any).UPSTASH_REDIS_REST_URL = 'https://test-redis.upstash.io';
(process.env as any).UPSTASH_REDIS_REST_TOKEN = 'test-redis-token';
(process.env as any).GOOGLE_AI_API_KEY = 'test-google-ai-key';
// Slack 환경변수 제거됨
(process.env as any).RENDER_MCP_SERVER_URL = 'https://test-mcp.onrender.com';

// DOM 정리
afterEach(() => {
  cleanup();
});

// 🎭 테스트 환경에서 목업 모드 강제 활성화
process.env.FORCE_MOCK_REDIS = 'true';
process.env.FORCE_MOCK_GOOGLE_AI = 'true';

// 🔧 테스트 환경에서 process 객체 보완 (더 강화된 버전)
const originalCwd = process.cwd;
if (!process.cwd || typeof process.cwd !== 'function') {
  (process as any).cwd = () => process.env.PWD || '/test-workspace';
}

// 🧠 process.memoryUsage 모킹 (모든 환경에서 호환성 보장)
if (!process.memoryUsage) {
  (process as any).memoryUsage = (): NodeJS.MemoryUsage => ({
    rss: 32 * 1024 * 1024, // 32MB
    heapTotal: 16 * 1024 * 1024, // 16MB
    heapUsed: 12 * 1024 * 1024, // 12MB
    external: 2 * 1024 * 1024, // 2MB
    arrayBuffers: 1 * 1024 * 1024, // 1MB
  });
}

// 🔧 Sonic Boom 더 강화된 모킹
vi.mock('sonic-boom', () => ({
  default: vi.fn(() => ({
    write: vi.fn(),
    flush: vi.fn(),
    end: vi.fn(),
    destroy: vi.fn(),
    on: vi.fn(),
    emit: vi.fn(),
    once: vi.fn(),
    removeListener: vi.fn(),
  })),
  SonicBoom: vi.fn(() => ({
    write: vi.fn(),
    flush: vi.fn(),
    end: vi.fn(),
    destroy: vi.fn(),
    on: vi.fn(),
    emit: vi.fn(),
    once: vi.fn(),
    removeListener: vi.fn(),
  })),
}));

// 🔧 process 전역 모킹 보강
(global as any).process = {
  ...global.process,
  cwd: () => process.env.PWD || '/test-workspace',
  memoryUsage: (): NodeJS.MemoryUsage => ({
    rss: 32 * 1024 * 1024,
    heapTotal: 16 * 1024 * 1024,
    heapUsed: 12 * 1024 * 1024,
    external: 2 * 1024 * 1024,
    arrayBuffers: 1 * 1024 * 1024,
  }),
  env: {
    ...global.process.env,
    NODE_ENV: 'test',
    FORCE_MOCK_REDIS: 'true',
    FORCE_MOCK_GOOGLE_AI: 'true',
    NEXT_PUBLIC_SUPABASE_URL: 'https://test-project.supabase.co',
    UPSTASH_REDIS_REST_URL: 'https://test-redis.upstash.io',
  },
};

// 🔧 AI 모델 관련 바이너리 모킹
vi.mock('@xenova/transformers', () => ({
  AutoTokenizer: {
    from_pretrained: vi.fn(() =>
      Promise.resolve({
        encode: vi.fn(() => [1, 2, 3]),
        decode: vi.fn(() => 'mocked response'),
      })
    ),
  },
  AutoModel: {
    from_pretrained: vi.fn(() =>
      Promise.resolve({
        forward: vi.fn(() => ({ logits: [[0.1, 0.9]] })),
      })
    ),
  },
  pipeline: vi.fn(() => Promise.resolve(vi.fn(() => 'mocked result'))),
}));

// 🔧 Redis 에러 모킹
vi.mock('redis-errors', () => ({
  default: class MockRedisError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'RedisError';
    }
  },
  RedisError: class RedisError extends Error { },
  ParserError: class ParserError extends Error { },
  ReplyError: class ReplyError extends Error { },
}));

// 🛡️ 헬스체크 차단 방지 - 테스트 컨텍스트 명시적 설정
process.env.HEALTH_CHECK_CONTEXT = 'false'; // 테스트에서는 헬스체크 비활성화
process.env.TEST_CONTEXT = 'true'; // 테스트 컨텍스트 활성화
process.env.DISABLE_HEALTH_CHECK = 'true'; // 헬스체크 완전 비활성화

// 🔴 Redis 연결 차단 방지 - 완전 목업 모드
process.env.REDIS_CONNECTION_DISABLED = 'true';
process.env.UPSTASH_REDIS_DISABLED = 'true';

// 🧪 테스트 전용 환경 설정
process.env.STORYBOOK = 'false'; // Storybook이 아닌 순수 테스트 환경

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
  // SLACK_WEBHOOK_URL 제거됨
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

// 최적화된 Mock 서버 데이터 제거 (실제 API 테스트로 대체)
// export const mockServerData = { ... };

// 테스트용 실제 API 호출 헬퍼
export const createTestApiCall = async (endpoint: string, method: 'GET' | 'POST' = 'GET', body?: any) => {
  try {
    const response = await fetch(`http://localhost:3002${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      return {
        success: false,
        error: `API 호출 실패: ${response.status}`,
        data: null,
      };
    }

    const data = await response.json();
    return {
      success: true,
      data,
      error: null,
    };
  } catch (error) {
    return {
      success: false,
      error: `네트워크 오류: ${error}`,
      data: null,
    };
  }
};

// 테스트용 서버 상태 검증
export const validateTestServerHealth = async () => {
  const healthCheck = await createTestApiCall('/api/health');
  return healthCheck.success;
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
