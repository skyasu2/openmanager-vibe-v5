import '@testing-library/jest-dom';
import { beforeEach, vi } from 'vitest';

// 🧪 테스트 환경 초기화
console.log('🧪 Vitest test environment initialized');
console.log('🌍 Node environment:', process.env.NODE_ENV);
console.log('🚨 Force exit enabled:', process.env.FORCE_EXIT);
console.log('🔄 CI mode:', process.env.CI);

// 🎭 Mock 환경 설정
vi.stubEnv('NODE_ENV', 'test');
vi.stubEnv('VITEST', 'true');
vi.stubEnv('FORCE_EXIT', 'true');
vi.stubEnv('CI', 'true');

// 🔧 테스트 실패 해결 - 누락된 환경 변수 추가
vi.stubEnv('FORCE_MOCK_REDIS', 'true');
vi.stubEnv('FORCE_MOCK_GOOGLE_AI', 'true');
vi.stubEnv('NEXT_PUBLIC_APP_NAME', 'OpenManager Vibe');
vi.stubEnv('NEXT_PUBLIC_APP_VERSION', '5.44.3');
vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://mock-supabase.test');
vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'mock-anon-key');
vi.stubEnv('UPSTASH_REDIS_REST_URL', 'https://mock-redis.test');
vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', 'mock-redis-token');
vi.stubEnv('GOOGLE_AI_API_KEY', 'mock-google-ai-key');
vi.stubEnv('OPENAI_API_KEY', 'mock-openai-key');
vi.stubEnv('NEXTAUTH_SECRET', 'mock-nextauth-secret');
vi.stubEnv('NEXTAUTH_URL', 'http://localhost:3000');

// 🌐 브라우저 API Mock
if (typeof window !== 'undefined') {
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
}

// 🔧 Console API Mock (필요시)
global.console = {
  ...console,
  // 테스트 중 불필요한 콘솔 로그 제거
  log: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};

// 🔧 Global 설정
beforeEach(() => {
  // 각 테스트 실행 전 환경 정리
  vi.clearAllMocks();
  vi.clearAllTimers();
});

// 🚨 프로세스 종료 핸들러 (CI 환경에서 강제 종료)
if (process.env.CI === 'true' || process.env.FORCE_EXIT === 'true') {
  process.on('SIGINT', () => {
    console.log('\n🚨 테스트 강제 종료 중...');
    process.exit(0);
  });
}

// 🎯 테스트 환경 최적화
process.env.FORCE_EXIT = 'true';
process.env.CI = 'true';

export {};
