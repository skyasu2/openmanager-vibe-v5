/**
 * 🧪 테스트 환경 전용 환경변수 설정
 * Vitest와 Jest 호환성을 위한 통합 설정
 */

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
  // 🤖 AI 서비스 Mock 설정
  // ===============================
  GOOGLE_AI_API_KEY: 'mock-google-ai-key',
  GOOGLE_AI_ENABLED: 'false',
  FORCE_MOCK_GOOGLE_AI: 'true',
  GOOGLE_AI_QUOTA_PROTECTION: 'true',
  GOOGLE_AI_TEST_LIMIT_PER_DAY: '0',
  GOOGLE_AI_HEALTH_CHECK_CACHE_HOURS: '24',
  OPENAI_API_KEY: 'mock-openai-key',

  // ===============================
  // 🔐 인증 및 보안 Mock 설정
  // ===============================
  NEXTAUTH_SECRET: 'mock-nextauth-secret-for-testing-only',
  NEXTAUTH_URL: 'http://localhost:3000',
  JWT_SECRET: 'mock-jwt-secret-for-testing',

  // ===============================
  // 📡 외부 서비스 Mock 설정
  // ===============================
  SLACK_WEBHOOK_URL: 'https://mock-slack-webhook.test',
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
  MOCK_SERVER_COUNT: '15',
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
 */
export function setupTestEnvironment() {
  Object.entries(TEST_ENV_CONFIG).forEach(([key, value]) => {
    if (typeof vi !== 'undefined' && vi.stubEnv) {
      // Vitest 환경
      vi.stubEnv(key, value);
    } else {
      // 기타 환경
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
    if (typeof vi !== 'undefined' && vi.stubEnv) {
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

// ===============================
// 🧪 실제 테스트 케이스들
// ===============================

import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('🧪 테스트 환경변수 설정', () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  describe('📋 기본 환경변수 설정', () => {
    it('TEST_ENV_CONFIG가 올바르게 정의되어야 함', () => {
      expect(TEST_ENV_CONFIG).toBeDefined();
      expect(TEST_ENV_CONFIG.NODE_ENV).toBe('test');
      expect(TEST_ENV_CONFIG.VITEST).toBe('true');
      expect(TEST_ENV_CONFIG.CI).toBe('true');
    });

    it('애플리케이션 기본 설정이 포함되어야 함', () => {
      expect(TEST_ENV_CONFIG.NEXT_PUBLIC_APP_NAME).toBe('OpenManager Vibe');
      expect(TEST_ENV_CONFIG.NEXT_PUBLIC_APP_VERSION).toBe('5.44.3');
    });
  });

  describe('🗄️ 데이터베이스 Mock 설정', () => {
    it('Supabase Mock 설정이 올바르게 정의되어야 함', () => {
      expect(TEST_ENV_CONFIG.NEXT_PUBLIC_SUPABASE_URL).toBe(
        'https://mock-supabase.test'
      );
      expect(TEST_ENV_CONFIG.NEXT_PUBLIC_SUPABASE_ANON_KEY).toBe(
        'mock-anon-key'
      );
      expect(TEST_ENV_CONFIG.SUPABASE_SERVICE_ROLE_KEY).toBe(
        'mock-service-key'
      );
    });

    it('Redis Mock 설정이 올바르게 정의되어야 함', () => {
      expect(TEST_ENV_CONFIG.UPSTASH_REDIS_REST_URL).toBe(
        'https://mock-redis.test'
      );
      expect(TEST_ENV_CONFIG.FORCE_MOCK_REDIS).toBe('true');
      expect(TEST_ENV_CONFIG.REDIS_CONNECTION_DISABLED).toBe('true');
    });
  });

  describe('🤖 AI 서비스 Mock 설정', () => {
    it('Google AI Mock 설정이 올바르게 정의되어야 함', () => {
      expect(TEST_ENV_CONFIG.GOOGLE_AI_ENABLED).toBe('false');
      expect(TEST_ENV_CONFIG.FORCE_MOCK_GOOGLE_AI).toBe('true');
      expect(TEST_ENV_CONFIG.GOOGLE_AI_API_KEY).toBe('mock-google-ai-key');
    });

    it('AI 할당량 보호 설정이 활성화되어야 함', () => {
      expect(TEST_ENV_CONFIG.GOOGLE_AI_QUOTA_PROTECTION).toBe('true');
      expect(TEST_ENV_CONFIG.GOOGLE_AI_TEST_LIMIT_PER_DAY).toBe('0');
    });
  });

  describe('🔧 환경변수 설정 함수들', () => {
    it('setupTestEnvironment 함수가 모든 환경변수를 설정해야 함', () => {
      setupTestEnvironment();

      // 주요 환경변수들이 설정되었는지 확인
      expect(process.env.NODE_ENV).toBe('test');
      expect(process.env.VITEST).toBe('true');
      expect(process.env.FORCE_MOCK_REDIS).toBe('true');
      expect(process.env.GOOGLE_AI_ENABLED).toBe('false');
    });

    it('setupEnvironmentGroup 함수가 특정 그룹만 설정해야 함', () => {
      setupEnvironmentGroup('basic');

      expect(process.env.NODE_ENV).toBe('test');
      expect(process.env.VITEST).toBe('true');
      expect(process.env.CI).toBe('true');
    });

    it('ENV_GROUPS가 올바르게 분류되어야 함', () => {
      expect(ENV_GROUPS.basic).toBeDefined();
      expect(ENV_GROUPS.database).toBeDefined();
      expect(ENV_GROUPS.ai_services).toBeDefined();
      expect(ENV_GROUPS.local_optimization).toBeDefined();

      expect(ENV_GROUPS.basic.NODE_ENV).toBe('test');
      expect(ENV_GROUPS.database.FORCE_MOCK_REDIS).toBe('true');
      expect(ENV_GROUPS.ai_services.GOOGLE_AI_ENABLED).toBe('false');
    });
  });

  describe('🏗️ 로컬 개발 최적화', () => {
    it('로컬 개발 모드가 활성화되어야 함', () => {
      expect(TEST_ENV_CONFIG.USE_LOCAL_DEVELOPMENT).toBe('true');
      expect(TEST_ENV_CONFIG.FORCE_LOCAL_MODE).toBe('true');
      expect(TEST_ENV_CONFIG.DISABLE_EXTERNAL_SERVICES).toBe('true');
    });

    it('헬스체크가 비활성화되어야 함', () => {
      expect(TEST_ENV_CONFIG.DISABLE_HEALTH_CHECK).toBe('true');
      expect(TEST_ENV_CONFIG.HEALTH_CHECK_CONTEXT).toBe('false');
    });
  });

  describe('📈 성능 및 디버깅 설정', () => {
    it('테스트 최적화 설정이 활성화되어야 함', () => {
      expect(TEST_ENV_CONFIG.ENABLE_TEST_CACHE).toBe('true');
      expect(TEST_ENV_CONFIG.DISABLE_ANALYTICS).toBe('true');
      expect(TEST_ENV_CONFIG.DISABLE_TRACKING).toBe('true');
    });

    it('디버그 설정이 올바르게 정의되어야 함', () => {
      expect(TEST_ENV_CONFIG.DEBUG).toBe('openmanager:test');
      expect(TEST_ENV_CONFIG.LOG_LEVEL).toBe('warn');
      expect(TEST_ENV_CONFIG.MEMORY_LEAK_DETECTION).toBe('true');
    });
  });
});
