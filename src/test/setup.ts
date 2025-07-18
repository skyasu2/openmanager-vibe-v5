/**
 * 🧪 통합 테스트 환경 설정
 * Jest → Vitest 완전 마이그레이션 완료
 */

import '@testing-library/jest-dom';
import { vi } from 'vitest';
import * as React from 'react';
import { setupTestEnvironment } from './env.config';
// import './mocks'; // 타임아웃 문제 디버깅을 위해 임시 비활성화

// ===============================
// 🔧 환경변수 통합 설정
// ===============================
setupTestEnvironment();

// ===============================
// ⚛️ React 전역 설정
// ===============================
global.React = React;

// ===============================
// 🌐 브라우저 API Mock (전역)
// ===============================
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

Object.defineProperty(window, 'ResizeObserver', {
  writable: true,
  value: vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  })),
});

Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  value: vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  })),
});

Object.defineProperty(window, 'scrollTo', {
  writable: true,
  value: vi.fn(),
});

Object.defineProperty(window, 'scroll', {
  writable: true,
  value: vi.fn(),
});

// ===============================
// 📡 WebAPI Mock
// ===============================
global.fetch = vi.fn();
const EventSourceMock = vi.fn().mockImplementation(() => ({
  close: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  readyState: 1,
  url: 'https://mock-sse.test',
  withCredentials: false,
}));

(EventSourceMock as any).CONNECTING = 0;
(EventSourceMock as any).OPEN = 1;
(EventSourceMock as any).CLOSED = 2;

global.EventSource = EventSourceMock as any;

// ===============================
// 📊 Canvas API Mock (차트 라이브러리용)
// ===============================
HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({
  fillRect: vi.fn(),
  clearRect: vi.fn(),
  getImageData: vi.fn(() => ({
    data: new Array(4),
  })),
  putImageData: vi.fn(),
  createImageData: vi.fn(),
  setTransform: vi.fn(),
  drawImage: vi.fn(),
  save: vi.fn(),
  fillText: vi.fn(),
  restore: vi.fn(),
  beginPath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  closePath: vi.fn(),
  stroke: vi.fn(),
  translate: vi.fn(),
  scale: vi.fn(),
  rotate: vi.fn(),
  arc: vi.fn(),
  fill: vi.fn(),
  measureText: vi.fn(() => ({ width: 0 })),
  transform: vi.fn(),
  rect: vi.fn(),
  clip: vi.fn(),
});

// ===============================
// 🗺️ Navigator API Mock
// ===============================
Object.defineProperty(navigator, 'clipboard', {
  writable: true,
  value: {
    writeText: vi.fn().mockResolvedValue(undefined),
    readText: vi.fn().mockResolvedValue(''),
  },
});

// ===============================
// 🎭 React Query Mock
// ===============================
vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(),
  useQueryClient: vi.fn(),
  QueryClient: vi.fn(),
  QueryClientProvider: ({ children }: { children: React.ReactNode }) =>
    children,
}));

// ===============================
// 🔧 Next.js Router Mock
// ===============================
vi.mock('next/router', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    pathname: '/',
    query: {},
    asPath: '/',
    route: '/',
    events: {
      on: vi.fn(),
      off: vi.fn(),
      emit: vi.fn(),
    },
  })),
}));

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  })),
  usePathname: vi.fn(() => '/'),
  useSearchParams: vi.fn(() => new URLSearchParams()),
}));

// ===============================
// 📈 Analytics Mock
// ===============================
vi.mock('@vercel/analytics', () => ({
  Analytics: () => null,
  track: vi.fn(),
}));

// ===============================
// 🎥 Framer Motion Mock (성능 최적화)
// ===============================
vi.mock('framer-motion', () => ({
  motion: {
    div: 'div',
    span: 'span',
    p: 'p',
    h1: 'h1',
    h2: 'h2',
    h3: 'h3',
    button: 'button',
    section: 'section',
    article: 'article',
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
  useAnimation: () => ({
    start: vi.fn(),
    stop: vi.fn(),
    set: vi.fn(),
  }),
  useMotionValue: () => ({ get: vi.fn(), set: vi.fn() }),
  useSpring: () => ({ get: vi.fn(), set: vi.fn() }),
  useTransform: () => ({ get: vi.fn() }),
}));

// ===============================
// ⚡ 성능 최적화 설정
// ===============================

// 콘솔 출력 최적화 (에러만 표시)
global.console = {
  ...console,
  log: vi.fn(),
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: console.error, // 에러는 실제 출력
};

// 타이머 Mock (테스트 속도 향상)
// vi.useFakeTimers(); // 타임아웃 문제로 임시 비활성화

// ===============================
// 🧹 테스트 정리
// ===============================
afterEach(() => {
  vi.clearAllMocks();
  // vi.clearAllTimers(); // 타이머 Mock 비활성화로 인해 주석처리
});

afterAll(() => {
  vi.restoreAllMocks();
  // vi.useRealTimers(); // 타이머 Mock 비활성화로 인해 주석처리
});

// ===============================
// 🔍 테스트 유틸리티
// ===============================
export const testUtils = {
  // 비동기 테스트 헬퍼
  waitFor: (ms: number = 0) => new Promise(resolve => setTimeout(resolve, ms)),

  // Mock 함수 생성
  createMockFn: <T extends (...args: any[]) => any>(implementation?: T) =>
    vi.fn(implementation),

  // 환경변수 임시 설정
  withEnv: <T>(envVars: Record<string, string>, fn: () => T): T => {
    const original = { ...process.env };
    Object.assign(process.env, envVars);
    try {
      return fn();
    } finally {
      process.env = original;
    }
  },

  // Mock 데이터 생성
  createMockServer: () => ({
    id: 'test-server-1',
    hostname: 'test-server',
    status: 'healthy' as const,
    role: 'web' as const,
    environment: 'test' as const,
    cpu_usage: 45,
    memory_usage: 60,
    disk_usage: 30,
    network_in: 100,
    network_out: 150,
    uptime: 86400,
    response_time: 120,
    last_updated: new Date().toISOString(),
  }),
};
