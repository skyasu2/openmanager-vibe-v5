import '@testing-library/jest-dom';
import { afterAll, afterEach, beforeAll, vi } from 'vitest';

// Mock 환경 설정
beforeAll(() => {
  // 환경 변수 설정 (NODE_ENV는 이미 test로 설정됨)
  if (!process.env.NODE_ENV) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (process.env as any).NODE_ENV = 'test';
  }
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
  process.env.GOOGLE_AI_API_KEY = 'test-google-ai-key';

  // 전역 fetch mock
  global.fetch = vi.fn();

  // console 경고 억제
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  // 각 테스트 후 모든 mock 초기화
  vi.clearAllMocks();
});

afterAll(() => {
  // 테스트 완료 후 정리
  vi.restoreAllMocks();
});

// Redis 모킹
vi.mock('ioredis', () => ({
  default: vi.fn(() => ({
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
    exists: vi.fn(),
    disconnect: vi.fn(),
  })),
}));

// Next.js 관련 모킹
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
  })),
  usePathname: vi.fn(() => '/'),
  useSearchParams: vi.fn(() => new URLSearchParams()),
}));

// Supabase 모킹
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
    },
  })),
}));

// TensorFlow 모킹
vi.mock('@tensorflow/tfjs-node', () => ({}));
vi.mock('@tensorflow/tfjs-node-gpu', () => ({}));
vi.mock('@tensorflow/tfjs', () => ({}));

// 빈 export로 모듈 선언
export {};
