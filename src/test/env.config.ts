/**
 * 🧪 테스트 환경 전용 환경변수 설정
 * Vitest와 Jest 호환성을 위한 통합 설정
 *
 * Note: 이 파일은 테스트 케이스를 포함하지 않습니다.
 * 테스트는 별도의 env.test.ts 파일에 있습니다.
 */

import { vi } from 'vitest';

export const TEST_ENV_CONFIG = {
  // ===============================
  // 🔧 기본 테스트 환경 설정
  // ===============================
  NODE_ENV: 'test',
  VITEST: 'true',
  CI: 'true',
  FORCE_EXIT: 'true',

  // ===============================
  // 📱 애플리케이션 기본 설정
  // ===============================
  NEXT_PUBLIC_APP_NAME: 'OpenManager Vibe',
  NEXT_PUBLIC_APP_VERSION: '5.44.3',

  // ===============================
  // 🗄️ 데이터베이스 Mock 설정
  // ===============================
  NEXT_PUBLIC_SUPABASE_URL: 'https://mock-supabase.test',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'mock-anon-key',
  SUPABASE_SERVICE_ROLE_KEY: 'mock-service-key',

  // ===============================
  // 📊 Redis Mock 설정
  // ===============================
  UPSTASH_REDIS_REST_URL: 'https://mock-redis.test',
  UPSTASH_REDIS_REST_TOKEN: 'mock-token',
  FORCE_MOCK_REDIS: 'true',
  REDIS_CONNECTION_DISABLED: 'true',
  UPSTASH_REDIS_DISABLED: 'true',

  // ===============================
  // 🤖 AI 서비스 설정 (실제 서비스 우선)
  // ===============================
  // Google AI는 실제 환경변수가 있으면 사용, 없으면 Mock
  GOOGLE_AI_ENABLED: 'true',
  FORCE_MOCK_GOOGLE_AI: 'false', // 실제 서비스 우선 사용
  GOOGLE_AI_QUOTA_PROTECTION: 'true',
  GOOGLE_AI_TEST_LIMIT_PER_DAY: '5', // 테스트용 제한
  GOOGLE_AI_HEALTH_CHECK_CACHE_HOURS: '24',
  // OpenAI 제거됨 - 사용하지 않는 서비스

  // ===============================
  // 🔐 인증 및 보안 Mock 설정
  // ===============================
  NEXTAUTH_SECRET: 'mock-nextauth-secret-for-testing-only',
  NEXTAUTH_URL: 'http://localhost:3000',
  JWT_SECRET: 'mock-jwt-secret-for-testing',

  // ===============================
  // 📡 외부 서비스 Mock 설정
  // ===============================
  WEBHOOK_SECRET: 'mock-webhook-secret',

  // ===============================
  // 🏗️ 로컬 개발 최적화
  // ===============================
  USE_LOCAL_DEVELOPMENT: 'true',
  FORCE_LOCAL_MODE: 'true',
  DISABLE_EXTERNAL_SERVICES: 'true',
  DISABLE_HEALTH_CHECK: 'true',
  HEALTH_CHECK_CONTEXT: 'false',
  DISABLE_VIRTUALIZATION: 'true',
  PREFERRED_RUNTIME: 'local',

  // ===============================
  // 🎭 테스트 데이터 설정
  // ===============================
  TEST_DATA_GENERATION: 'true',
  MOCK_SERVER_COUNT: '10',
  DEFAULT_SERVER_STATUS: 'healthy',
  ENABLE_CHAOS_TESTING: 'false',

  // ===============================
  // 📈 성능 및 디버깅
  // ===============================
  DEBUG: 'openmanager:test',
  LOG_LEVEL: 'warn',
  ENABLE_PERFORMANCE_MONITORING: 'false',
  MEMORY_LEAK_DETECTION: 'true',

  // ===============================
  // 🌐 브라우저 테스트 설정
  // ===============================
  TEST_TIMEOUT: '30000',
  HEADLESS_MODE: 'true',
  BROWSER_LOGS: 'false',

  // ===============================
  // 🔄 캐싱 및 최적화
  // ===============================
  ENABLE_TEST_CACHE: 'true',
  CACHE_TTL: '300',
  DISABLE_ANALYTICS: 'true',
  DISABLE_TRACKING: 'true',
} as const;

/**
 * 환경변수를 일괄 설정하는 함수
 * Vitest의 vi.stubEnv를 우선 사용
 */
export function setupTestEnvironment() {
  Object.entries(TEST_ENV_CONFIG).forEach(([key, value]) => {
    if (typeof vi !== 'undefined' && vi?.stubEnv) {
      // Vitest 환경에서 안전하게 환경변수 설정
      vi.stubEnv(key, value);
    } else {
      // Fallback (일반적으로 사용되지 않음)
      process.env[key] = value;
    }
  });
}

/**
 * 특정 환경변수 그룹만 설정
 */
export function setupEnvironmentGroup(group: keyof typeof ENV_GROUPS) {
  const groupConfig = ENV_GROUPS[group];
  Object.entries(groupConfig).forEach(([key, value]) => {
    if (typeof vi !== 'undefined' && vi?.stubEnv) {
      vi.stubEnv(key, value);
    } else {
      process.env[key] = value;
    }
  });
}

/**
 * 환경변수 그룹별 분류
 */
export const ENV_GROUPS = {
  basic: {
    NODE_ENV: TEST_ENV_CONFIG.NODE_ENV,
    VITEST: TEST_ENV_CONFIG.VITEST,
    CI: TEST_ENV_CONFIG.CI,
  },
  database: {
    NEXT_PUBLIC_SUPABASE_URL: TEST_ENV_CONFIG.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY:
      TEST_ENV_CONFIG.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    FORCE_MOCK_REDIS: TEST_ENV_CONFIG.FORCE_MOCK_REDIS,
  },
  ai_services: {
    GOOGLE_AI_ENABLED: TEST_ENV_CONFIG.GOOGLE_AI_ENABLED,
    FORCE_MOCK_GOOGLE_AI: TEST_ENV_CONFIG.FORCE_MOCK_GOOGLE_AI,
    GOOGLE_AI_API_KEY: TEST_ENV_CONFIG.GOOGLE_AI_API_KEY,
  },
  local_optimization: {
    USE_LOCAL_DEVELOPMENT: TEST_ENV_CONFIG.USE_LOCAL_DEVELOPMENT,
    FORCE_LOCAL_MODE: TEST_ENV_CONFIG.FORCE_LOCAL_MODE,
    DISABLE_EXTERNAL_SERVICES: TEST_ENV_CONFIG.DISABLE_EXTERNAL_SERVICES,
  },
} as const;