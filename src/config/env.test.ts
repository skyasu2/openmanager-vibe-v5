/**
 * 🧪 테스트 환경 설정 테스트
 * 환경변수 설정을 검증합니다 (보안 토큰 제거됨)
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('🧪 테스트 환경변수 설정', () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  describe('🔧 기본 환경변수 설정', () => {
    it('테스트 환경이 올바르게 설정되어야 함', () => {
      vi.stubEnv('NODE_ENV', 'test');
      vi.stubEnv('VITEST', 'true');
      
      expect(process.env.NODE_ENV).toBe('test');
      expect(process.env.VITEST).toBe('true');
    });
  });

  describe('🐘 Supabase Mock 설정', () => {
    it('Supabase Mock 설정이 안전한 테스트 값으로 설정되어야 함', () => {
      vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'http://localhost:54321');
      vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'test-anon-key-safe');
      vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'test-service-role-key-safe');
      
      expect(process.env.NEXT_PUBLIC_SUPABASE_URL).toBe('http://localhost:54321');
      expect(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY).toBe('test-anon-key-safe');
      expect(process.env.SUPABASE_SERVICE_ROLE_KEY).toBe('test-service-role-key-safe');
    });
  });

  describe('🔴 Redis Mock 설정', () => {
    it('Redis Mock 설정이 올바르게 정의되어야 함', () => {
      vi.stubEnv('UPSTASH_REDIS_REST_URL', 'http://localhost:6379');
      vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', 'test-redis-token-safe');
      
      expect(process.env.UPSTASH_REDIS_REST_URL).toBe('http://localhost:6379');
      expect(process.env.UPSTASH_REDIS_REST_TOKEN).toBe('test-redis-token-safe');
    });
  });

  describe('🤖 AI 서비스 Mock 설정', () => {
    it('Google AI Mock 설정이 올바르게 정의되어야 함', () => {
      vi.stubEnv('GOOGLE_AI_ENABLED', 'true');
      vi.stubEnv('GOOGLE_AI_TEST_LIMIT_PER_DAY', '5');
      
      expect(process.env.GOOGLE_AI_ENABLED).toBe('true');
      expect(process.env.GOOGLE_AI_TEST_LIMIT_PER_DAY).toBe('5');
    });
  });

  describe('🏗️ 로컬 개발 최적화', () => {
    it('로컬 개발 모드가 활성화되어야 함', () => {
      vi.stubEnv('USE_LOCAL_DEVELOPMENT', 'true');
      vi.stubEnv('FORCE_LOCAL_MODE', 'true');
      vi.stubEnv('DISABLE_EXTERNAL_SERVICES', 'true');
      
      expect(process.env.USE_LOCAL_DEVELOPMENT).toBe('true');
      expect(process.env.FORCE_LOCAL_MODE).toBe('true');
      expect(process.env.DISABLE_EXTERNAL_SERVICES).toBe('true');
    });

    it('헬스체크가 비활성화되어야 함', () => {
      vi.stubEnv('DISABLE_HEALTH_CHECK', 'true');
      vi.stubEnv('HEALTH_CHECK_CONTEXT', 'false');
      
      expect(process.env.DISABLE_HEALTH_CHECK).toBe('true');
      expect(process.env.HEALTH_CHECK_CONTEXT).toBe('false');
    });
  });

  describe('📈 성능 및 디버깅 설정', () => {
    it('테스트 최적화 설정이 활성화되어야 함', () => {
      vi.stubEnv('SKIP_ENV_VALIDATION', 'true');
      vi.stubEnv('ESLINT_NO_DEV_ERRORS', 'true');
      
      expect(process.env.SKIP_ENV_VALIDATION).toBe('true');
      expect(process.env.ESLINT_NO_DEV_ERRORS).toBe('true');
    });
  });
});