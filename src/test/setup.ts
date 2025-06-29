import '@testing-library/jest-dom';
import { vi } from 'vitest';

// 🌐 전역 목업 설정 (Vitest 3.0 스타일)
globalThis.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

globalThis.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// 🎨 CSS 모듈 목업
vi.mock('*.module.css', () => ({}));
vi.mock('*.module.scss', () => ({}));
vi.mock('*.module.sass', () => ({}));

// 🖼️ 이미지 및 정적 파일 목업
vi.mock('*.png', () => ({ default: 'test-file-stub' }));
vi.mock('*.jpg', () => ({ default: 'test-file-stub' }));
vi.mock('*.jpeg', () => ({ default: 'test-file-stub' }));
vi.mock('*.gif', () => ({ default: 'test-file-stub' }));
vi.mock('*.svg', () => ({ default: 'test-file-stub' }));

// 🚀 Next.js 목업 (2025년 최신 버전)
vi.mock('next/router', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    reload: vi.fn(),
    pathname: '/',
    query: {},
    asPath: '/',
    route: '/',
    isReady: true,
    isPreview: false,
  }),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock('next/image', () => ({
  default: (props: any) => props,
}));

// 📊 Chart.js 목업 (2025년 최신)
vi.mock('chart.js/auto', () => ({
  Chart: vi.fn().mockImplementation(() => ({
    destroy: vi.fn(),
    update: vi.fn(),
    render: vi.fn(),
  })),
  registerables: [],
}));

// 🌊 Framer Motion 목업
vi.mock('framer-motion', () => ({
  motion: {
    div: 'div',
    span: 'span',
    button: 'button',
    p: 'p',
    h1: 'h1',
    h2: 'h2',
    h3: 'h3',
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
  useAnimation: () => ({
    start: vi.fn(),
    stop: vi.fn(),
    set: vi.fn(),
  }),
}));

// 🎯 React Query 목업 (TanStack Query v5)
vi.mock('@tanstack/react-query', () => ({
  useQuery: () => ({
    data: null,
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  }),
  useMutation: () => ({
    mutate: vi.fn(),
    isLoading: false,
    error: null,
  }),
  QueryClient: vi.fn(),
  QueryClientProvider: ({ children }: { children: React.ReactNode }) =>
    children,
}));

// 🔔 Toast 목업
vi.mock('react-hot-toast', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    loading: vi.fn(),
    dismiss: vi.fn(),
    promise: vi.fn(),
  },
  Toaster: () => null,
}));

// 📊 OpenManager 특화 목업
vi.mock('@/lib/environment/auto-decrypt-env', () => ({
  initializeEnvironment: vi.fn().mockResolvedValue(undefined),
  ensureInitialized: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/lib/environment/server-only-env', () => ({
  getServerEnv: vi.fn().mockReturnValue({}),
  validateServerEnv: vi.fn().mockReturnValue(true),
}));

// 🔄 Redis 목업
vi.mock('@/lib/redis/redis-client', () => ({
  redisClient: {
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
    exists: vi.fn(),
    ping: vi.fn().mockResolvedValue('PONG'),
  },
}));

// 🧠 AI 엔진 목업
vi.mock('@/lib/ai/google-ai-service', () => ({
  GoogleAIService: {
    generateText: vi.fn().mockResolvedValue('Test AI response'),
    analyzeText: vi.fn().mockResolvedValue({ sentiment: 'positive' }),
  },
}));

// 🗄️ Supabase 목업
vi.mock('@/lib/supabase/supabase-client', () => ({
  supabaseClient: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
  },
}));

// 📈 Analytics 목업
vi.mock('@vercel/analytics/react', () => ({
  Analytics: () => null,
  track: vi.fn(),
}));

vi.mock('@vercel/speed-insights/next', () => ({
  SpeedInsights: () => null,
}));

// 🌍 환경 변수는 vitest.config.ts에서 설정됨

// 🎯 테스트 헬퍼 함수들
export const createMockComponent = (name: string) => {
  return vi.fn().mockImplementation(({ children, ...props }) => ({
    type: name,
    props: { ...props, children },
  }));
};

export const createMockHook = <T>(defaultValue: T) => {
  return vi.fn().mockReturnValue(defaultValue);
};

// 🔧 테스트 유틸리티
export const flushPromises = () => new Promise(setImmediate);

export const waitForNextTick = () =>
  new Promise(resolve => process.nextTick(resolve));

// 🧪 Vitest 3.0 새로운 기능들
// - 향상된 스냅샷 테스트
// - 개선된 Coverage 리포팅
// - 더 빠른 테스트 실행
// - TypeScript 성능 향상

console.log(
  '📚 Vitest 3.0 + Testing Library 테스트 환경 설정 완료! (2025-06-30 00:50 KST)'
);
