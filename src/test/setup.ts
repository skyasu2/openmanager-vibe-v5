/**
 * 🧪 통합 테스트 환경 설정
 * Jest → Vitest 완전 마이그레이션 완료
 */

import '@testing-library/jest-dom';
import { vi } from 'vitest';
import { type ReactNode } from 'react';
import { setupTestEnvironment } from './env.config';

// 환경에 따른 Mock 로딩
// DOM 환경에서만 브라우저 Mock 로드
if (typeof window !== 'undefined') {
  await import('./mocks'); // 브라우저 Mock 포함
} else {
  await import('./mocks/index-node'); // Node 전용 Mock
}

// ===============================
// 🔧 환경변수 통합 설정
// ===============================
setupTestEnvironment();

// ===============================
// ⚛️ React 전역 설정
// ===============================
global.React = React;

// ===============================
// 🌐 브라우저 API Mock (DOM 환경에서만 설정)
// ===============================
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'matchMedia', {
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
}

// ===============================
// 📡 WebAPI Mock
// ===============================
// Mock fetch with proper Response object and realistic server data
global.fetch = vi.fn().mockImplementation((url: string) => {
  // Mock server data matching actual API response format
  const mockServerData = {
    success: true,
    data: [
      {
        id: 'server-1',
        name: 'Test Server 1',
        status: 'online',
        host: 'test-host-1.com',
        hostname: 'test-host-1.com',
        port: 8080,
        cpu: 45,
        memory: 67,
        disk: 23,
        network: 12,
        uptime: 86400,
        location: 'us-east-1',
        environment: 'production',
        provider: 'test',
        type: 'web',
        alerts: 0,
        lastSeen: new Date().toISOString(),
        metrics: {
          cpu: { usage: 45, cores: 4, temperature: 45 },
          memory: { used: 5.4, total: 8, usage: 67 },
          disk: { used: 23, total: 100, usage: 23 },
          network: { bytesIn: 7.2, bytesOut: 4.8, packetsIn: 0, packetsOut: 0 },
          timestamp: new Date().toISOString(),
          uptime: 86400
        }
      }
    ],
    servers: [
      {
        id: 'server-1',
        name: 'Test Server 1',
        status: 'online',
        host: 'test-host-1.com',
        hostname: 'test-host-1.com',
        port: 8080,
        cpu: 45,
        memory: 67,
        disk: 23,
        network: 12,
        uptime: 86400,
        location: 'us-east-1',
        environment: 'production',
        provider: 'test',
        type: 'web',
        alerts: 0,
        lastSeen: new Date().toISOString(),
        metrics: {
          cpu: { usage: 45, cores: 4, temperature: 45 },
          memory: { used: 5.4, total: 8, usage: 67 },
          disk: { used: 23, total: 100, usage: 23 },
          network: { bytesIn: 7.2, bytesOut: 4.8, packetsIn: 0, packetsOut: 0 },
          timestamp: new Date().toISOString(),
          uptime: 86400
        }
      }
    ],
    summary: {
      servers: {
        total: 1,
        online: 1,
        warning: 0,
        offline: 0,
        avgCpu: 45,
        avgMemory: 67
      }
    },
    pagination: {
      currentPage: 1,
      totalPages: 1,
      totalItems: 1,
      itemsPerPage: 10,
      hasNextPage: false,
      hasPrevPage: false
    },
    count: 1
  };

  return Promise.resolve({
    ok: true,
    status: 200,
    statusText: 'OK',
    headers: new Headers({
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=60'
    }),
    json: () => Promise.resolve(mockServerData),
    text: () => Promise.resolve(JSON.stringify(mockServerData)),
    blob: () => Promise.resolve(new Blob([JSON.stringify(mockServerData)])),
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
    clone: () => ({ 
      json: () => Promise.resolve(mockServerData),
      text: () => Promise.resolve(JSON.stringify(mockServerData))
    })
  } as Response);
});

if (typeof window !== 'undefined') {
  interface _MockEventSource extends EventSource {
    close: ReturnType<typeof vi.fn>;
    addEventListener: ReturnType<typeof vi.fn>;
    removeEventListener: ReturnType<typeof vi.fn>;
  }

  interface EventSourceConstructor {
    new (url: string | URL, eventSourceInitDict?: EventSourceInit): EventSource;
    readonly CONNECTING: 0;
    readonly OPEN: 1;
    readonly CLOSED: 2;
  }

  const EventSourceMock = vi.fn().mockImplementation(() => ({
    close: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    readyState: 1,
    url: 'https://mock-sse.test',
    withCredentials: false,
  })) as unknown as EventSourceConstructor;

  global.EventSource = EventSourceMock;
}

// ===============================
// 📊 Canvas API Mock (차트 라이브러리용)
// ===============================
if (typeof window !== 'undefined' && HTMLCanvasElement) {
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
}

// ===============================
// 🗺️ Navigator API Mock
// ===============================
if (typeof navigator !== 'undefined') {
  Object.defineProperty(navigator, 'clipboard', {
    writable: true,
    value: {
      writeText: vi.fn().mockResolvedValue(undefined),
      readText: vi.fn().mockResolvedValue(''),
    },
  });
}

// ===============================
// 🎭 React Query Mock
// ===============================
vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(),
  useQueryClient: vi.fn(),
  QueryClient: vi.fn(),
  QueryClientProvider: ({ children }: { children: ReactNode }) =>
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
  AnimatePresence: ({ children }: { children: ReactNode }) => children,
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

// 타이머 Mock 완전 비활성화 (타임아웃 문제 해결)
// Vitest의 fake timer는 테스트 실행을 불안정하게 만들 수 있음

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
  waitFor: (ms: number = 0) =>
    new Promise((resolve) => setTimeout(resolve, ms)),

  // Mock 함수 생성
  createMockFn: <T extends (...args: never[]) => unknown>(implementation?: T) =>
    vi.fn(implementation),

  // 환경변수 임시 설정 (vi.stubEnv 사용)
  withEnv: <T>(envVars: Record<string, string>, fn: () => T): T => {
    // 기존 환경변수 백업
    const originalEnv: Record<string, string | undefined> = {};
    Object.keys(envVars).forEach((key) => {
      originalEnv[key] = process.env[key];
    });

    // vi.stubEnv로 환경변수 설정
    Object.entries(envVars).forEach(([key, value]) => {
      vi.stubEnv(key, value);
    });

    try {
      return fn();
    } finally {
      // 원래 값으로 복원
      Object.entries(originalEnv).forEach(([key, value]) => {
        if (value === undefined) {
          vi.unstubAllEnvs(key);
        } else {
          vi.stubEnv(key, value);
        }
      });
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
