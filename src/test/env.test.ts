/**
 * 🧪 테스트 환경 설정 테스트
 * env.config.ts의 환경변수 설정을 검증합니다
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  TEST_ENV_CONFIG,
  setupTestEnvironment,
  setupEnvironmentGroup,
  ENV_GROUPS,
} from './env.config';

// ===============================
// 🧪 실제 테스트 케이스들
// ===============================

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
        'http://localhost:54321'
      );
      expect(TEST_ENV_CONFIG.NEXT_PUBLIC_SUPABASE_ANON_KEY).toBe(
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
      );
      expect(TEST_ENV_CONFIG.SUPABASE_SERVICE_ROLE_KEY).toBe(
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
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
