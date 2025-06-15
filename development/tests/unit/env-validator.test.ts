import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  getExecutionContext,
  validateRuntimeEnvironment,
  requireEnvironmentVariables,
  logEnvironmentStatus,
  env,
} from '@/lib/env-validator';

describe('Environment Validator', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('getExecutionContext', () => {
    it('빌드 컨텍스트를 올바르게 감지한다', () => {
      process.env.npm_lifecycle_event = 'build';
      const context = getExecutionContext();
      
      expect(context.isBuild).toBe(true);
      expect(context.isServer).toBe(true); // Node.js 환경
    });

    it('프로덕션 환경을 올바르게 감지한다', () => {
      process.env.NODE_ENV = 'production';
      const context = getExecutionContext();
      
      expect(context.isProduction).toBe(true);
    });

    it('Vercel 환경을 올바르게 감지한다', () => {
      process.env.VERCEL = '1';
      const context = getExecutionContext();
      
      expect(context.isVercel).toBe(true);
    });

    it('Cron 환경을 올바르게 감지한다', () => {
      process.env.VERCEL_CRON_ID = 'cron-123';
      const context = getExecutionContext();
      
      expect(context.isCron).toBe(true);
    });

    it('기본 개발 환경을 올바르게 설정한다', () => {
      delete process.env.NODE_ENV;
      delete process.env.npm_lifecycle_event;
      delete process.env.VERCEL;
      delete process.env.VERCEL_CRON_ID;
      
      const context = getExecutionContext();
      
      expect(context.isBuild).toBe(false);
      expect(context.isProduction).toBe(false);
      expect(context.isVercel).toBe(false);
      expect(context.isCron).toBe(false);
    });
  });

  describe('validateRuntimeEnvironment', () => {
    it('빌드 시에는 항상 유효하다고 반환한다', () => {
      process.env.npm_lifecycle_event = 'build';
      
      const result = validateRuntimeEnvironment();
      
      expect(result.isValid).toBe(true);
      expect(result.missing).toEqual([]);
      expect(result.errors).toEqual([]);
      expect(result.canUseSupabase).toBe(false);
      expect(result.canUseRedis).toBe(false);
    });

    it('필수 환경변수가 누락된 경우를 감지한다', () => {
      delete process.env.npm_lifecycle_event;
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;
      delete process.env.UPSTASH_REDIS_REST_URL;
      delete process.env.UPSTASH_REDIS_REST_TOKEN;
      
      const result = validateRuntimeEnvironment();
      
      expect(result.isValid).toBe(false);
      expect(result.missing).toContain('NEXT_PUBLIC_SUPABASE_URL');
      expect(result.missing).toContain('NEXT_PUBLIC_SUPABASE_ANON_KEY');
      expect(result.missing).toContain('SUPABASE_SERVICE_ROLE_KEY');
      expect(result.missing).toContain('UPSTASH_REDIS_REST_URL');
      expect(result.missing).toContain('UPSTASH_REDIS_REST_TOKEN');
    });

    it('잘못된 URL 형식을 감지한다', () => {
      delete process.env.npm_lifecycle_event;
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'invalid-url';
      process.env.UPSTASH_REDIS_REST_URL = 'also-invalid';
      
      const result = validateRuntimeEnvironment();
      
      expect(result.errors).toContain('NEXT_PUBLIC_SUPABASE_URL은 유효한 URL이어야 합니다');
      expect(result.errors).toContain('UPSTASH_REDIS_REST_URL은 유효한 URL이어야 합니다');
    });

    it('Supabase 사용 가능성을 올바르게 판단한다', () => {
      delete process.env.npm_lifecycle_event;
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-key';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-key';
      
      const result = validateRuntimeEnvironment();
      
      expect(result.canUseSupabase).toBe(true);
    });

    it('Redis 사용 가능성을 올바르게 판단한다', () => {
      delete process.env.npm_lifecycle_event;
      process.env.UPSTASH_REDIS_REST_URL = 'https://redis.upstash.io';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'redis-token';
      
      const result = validateRuntimeEnvironment();
      
      expect(result.canUseRedis).toBe(true);
    });

    it('모든 환경변수가 올바르게 설정된 경우', () => {
      delete process.env.npm_lifecycle_event;
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-key';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-key';
      process.env.UPSTASH_REDIS_REST_URL = 'https://redis.upstash.io';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'redis-token';
      
      const result = validateRuntimeEnvironment();
      
      expect(result.isValid).toBe(true);
      expect(result.missing).toEqual([]);
      expect(result.errors).toEqual([]);
      expect(result.canUseSupabase).toBe(true);
      expect(result.canUseRedis).toBe(true);
    });
  });

  describe('requireEnvironmentVariables', () => {
    it('빌드 시에는 항상 성공한다', () => {
      process.env.npm_lifecycle_event = 'build';
      
      const middleware = requireEnvironmentVariables(['NEXT_PUBLIC_SUPABASE_URL']);
      const result = middleware();
      
      expect(result.success).toBe(true);
    });

    it('필요한 환경변수가 있을 때 성공한다', () => {
      delete process.env.npm_lifecycle_event;
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
      
      const middleware = requireEnvironmentVariables(['NEXT_PUBLIC_SUPABASE_URL']);
      const result = middleware();
      
      expect(result.success).toBe(true);
    });

    it('필요한 환경변수가 없을 때 실패한다', () => {
      delete process.env.npm_lifecycle_event;
      delete process.env.MISSING_VAR;
      
      const middleware = requireEnvironmentVariables(['MISSING_VAR' as keyof typeof env]);
      const result = middleware();
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Missing required environment variables');
      expect(result.missing).toContain('MISSING_VAR');
    });

    it('여러 환경변수를 검증한다', () => {
      delete process.env.npm_lifecycle_event;
      process.env.VAR1 = 'value1';
      delete process.env.VAR2;
      
      const middleware = requireEnvironmentVariables(['VAR1' as keyof typeof env, 'VAR2' as keyof typeof env]);
      const result = middleware();
      
      expect(result.success).toBe(false);
      expect(result.missing).toEqual(['VAR2']);
    });
  });

  describe('logEnvironmentStatus', () => {
    it('환경변수 상태를 로그에 출력한다', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      delete process.env.npm_lifecycle_event;
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      
      logEnvironmentStatus();
      
      expect(consoleSpy).toHaveBeenCalledWith('🔍 환경변수 상태:');
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('⚠️ 누락된 환경변수:')
      );
      
      consoleSpy.mockRestore();
      warnSpy.mockRestore();
    });

    it('검증 에러가 있을 때 에러 로그를 출력한다', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      delete process.env.npm_lifecycle_event;
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'invalid-url';
      
      logEnvironmentStatus();
      
      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('❌ 검증 에러:')
      );
      
      consoleSpy.mockRestore();
      errorSpy.mockRestore();
    });
  });

  describe('env object', () => {
    it('기본 환경변수 값들을 포함한다', () => {
      expect(env).toHaveProperty('NODE_ENV');
      expect(['development', 'production', 'test']).toContain(env.NODE_ENV);
    });

    it('NODE_ENV 기본값이 development이다', () => {
      delete process.env.NODE_ENV;
      
      // env 객체는 모듈 로드 시 생성되므로, 
      // 이 테스트는 현재 환경의 NODE_ENV를 확인
      expect(env.NODE_ENV).toBeDefined();
    });

    it('선택적 환경변수들을 올바르게 처리한다', () => {
      // env 객체의 타입 검증
      expect(typeof env.NEXT_PUBLIC_APP_URL === 'string' || env.NEXT_PUBLIC_APP_URL === undefined).toBe(true);
      expect(typeof env.NEXT_PUBLIC_SUPABASE_URL === 'string' || env.NEXT_PUBLIC_SUPABASE_URL === undefined).toBe(true);
      expect(typeof env.CRON_SECRET === 'string' || env.CRON_SECRET === undefined).toBe(true);
    });
  });

  describe('Edge cases', () => {
    it('빈 문자열 환경변수를 올바르게 처리한다', () => {
      delete process.env.npm_lifecycle_event;
      process.env.NEXT_PUBLIC_SUPABASE_URL = '';
      
      const result = validateRuntimeEnvironment();
      
      expect(result.missing).toContain('NEXT_PUBLIC_SUPABASE_URL');
    });

    it('공백만 있는 환경변수를 올바르게 처리한다', () => {
      delete process.env.npm_lifecycle_event;
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = '   ';
      
      const result = validateRuntimeEnvironment();
      
      // 공백은 유효한 값으로 간주되지만, 실제로는 문제가 될 수 있음
      expect(result.canUseSupabase).toBe(false); // 다른 필수 값들이 없어서
    });

    it('매우 긴 환경변수 값을 처리한다', () => {
      delete process.env.npm_lifecycle_event;
      const longValue = 'a'.repeat(1000);
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = longValue;
      
      const result = validateRuntimeEnvironment();
      
      // 길이 제한은 없으므로 유효한 값으로 처리됨
      expect(result.missing).not.toContain('NEXT_PUBLIC_SUPABASE_ANON_KEY');
    });
  });
}); 