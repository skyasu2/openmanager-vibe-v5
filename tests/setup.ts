/**
 * 🧪 Vitest Test Setup Configuration
 * OpenManager Vibe v5 - 기본 테스트 환경 설정
 */

import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterAll, afterEach, beforeAll, beforeEach, vi } from 'vitest';

// React 19 호환성 설정
import { setupReactTestCompat } from '../src/lib/react-compat';

// React 호환성 설정 초기화
setupReactTestCompat();

// 환경변수 설정 (테스트용)
if (!process.env.NODE_ENV) {
  Object.defineProperty(process.env, 'NODE_ENV', {
    value: 'test',
    writable: false,
    enumerable: true,
    configurable: true,
  });
}

// 테스트용 환경변수 설정
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test-project.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.REDIS_PASSWORD = '';
process.env.GOOGLE_AI_API_KEY = 'test-google-ai-key';
process.env.UPSTASH_REDIS_REST_URL = 'https://test-redis.upstash.io';
process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token';
process.env.NEXT_PUBLIC_APP_NAME = 'OpenManager Vibe v5';
process.env.NEXT_PUBLIC_APP_VERSION = '5.44.0';
process.env.VITEST = 'true';
process.env.FORCE_MOCK_REDIS = 'true';
process.env.FORCE_MOCK_GOOGLE_AI = 'true';
process.env.TEST_ISOLATION = 'true';
process.env.DISABLE_HEALTH_CHECK = 'true';

// 전역 테스트 설정
beforeAll(async () => {
  // React act 환경 설정
  if (typeof globalThis !== 'undefined') {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  }

  // 콘솔 경고 억제 (테스트 환경)
  const originalWarn = console.warn;
  console.warn = (...args: any[]) => {
    const message = args.join(' ');
    if (
      message.includes('ReactDOMTestUtils.act') ||
      message.includes('React.act') ||
      message.includes('act(...)') ||
      message.includes('ONNX Runtime') ||
      message.includes('Sharp')
    ) {
      return;
    }
    originalWarn.apply(console, args);
  };
});

// 각 테스트 전 설정
beforeEach(() => {
  // Mock 타이머 설정
  vi.useFakeTimers({
    shouldAdvanceTime: true,
  });

  // 고정된 시간 설정 (테스트 일관성)
  const mockDate = new Date('2024-06-19T12:26:40.000Z');
  vi.setSystemTime(mockDate);
});

// 각 테스트 후 정리
afterEach(() => {
  // React Testing Library 정리
  cleanup();

  // Mock 타이머 정리
  vi.useRealTimers();

  // 모든 모의 함수 정리
  vi.clearAllMocks();
  vi.clearAllTimers();
});

// 전체 테스트 종료 후 정리
afterAll(async () => {
  // React act 환경 정리
  if (typeof globalThis !== 'undefined') {
    globalThis.IS_REACT_ACT_ENVIRONMENT = false;
  }
});

// 글로벌 fetch mock 설정
global.fetch = vi.fn();

// ResizeObserver mock
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// IntersectionObserver mock
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// matchMedia mock
Object.defineProperty(window, 'matchMedia', {
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

// localStorage mock
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
  configurable: true,
});

// sessionStorage mock
Object.defineProperty(window, 'sessionStorage', {
  value: localStorageMock,
  writable: true,
  configurable: true,
});

// URL.createObjectURL mock
global.URL.createObjectURL = vi.fn(() => 'mock-object-url');
global.URL.revokeObjectURL = vi.fn();

// 에러 핸들링 개선 (Edge Runtime 호환성)
if (typeof process !== 'undefined' && process.on) {
  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  });
}

// 테스트 환경 확인
console.log('🧪 Test environment initialized');
console.log('📦 React version:', require('react').version);
console.log('🌍 Node environment:', process.env.NODE_ENV);

