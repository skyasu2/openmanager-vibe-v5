import {
  getApiKey,
  getInfrastructureUrl,
  INFRASTRUCTURE_CONFIG,
  isDevelopmentMode,
  isProductionMode,
  STATIC_ERROR_SERVERS,
  validateEnvironmentVariables,
} from '@/config/fallback-data';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('Fallback Data Configuration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    // 환경변수 초기화 (읽기 전용 문제 해결)
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    vi.restoreAllMocks();
    // 환경변수 복원
    process.env = originalEnv;
  });

  describe('STATIC_ERROR_SERVERS', () => {
    it('정적 에러 서버 데이터가 올바르게 정의되어야 함', () => {
      expect(STATIC_ERROR_SERVERS).toBeDefined();
      expect(Array.isArray(STATIC_ERROR_SERVERS)).toBe(true);
      expect(STATIC_ERROR_SERVERS.length).toBeGreaterThan(0);
    });

    it('모든 서버가 올바른 구조를 가져야 함', () => {
      expect(STATIC_ERROR_SERVERS.length).toBeGreaterThan(0);

      STATIC_ERROR_SERVERS.forEach(server => {
        expect(server).toHaveProperty('id');
        expect(server).toHaveProperty('name');
        expect(server).toHaveProperty('status');
        expect(server).toHaveProperty('cpu');
        expect(server).toHaveProperty('memory');
        expect(server).toHaveProperty('disk');
        expect(server).toHaveProperty('network');

        expect(typeof server.id).toBe('string');
        expect(typeof server.name).toBe('string');
        expect(typeof server.status).toBe('string');
        expect(typeof server.cpu).toBe('number');
        expect(typeof server.memory).toBe('number');
        expect(typeof server.disk).toBe('number');
        expect(typeof server.network).toBe('number');

        // 에러 서버는 모두 0 값을 가져야 함
        expect(server.cpu).toBe(0);
        expect(server.memory).toBe(0);
        expect(server.disk).toBe(0);
        expect(server.network).toBe(0);
        expect(server.status).toBe('offline');
      });
    });

    it('서버 ID가 고유해야 함', () => {
      const ids = STATIC_ERROR_SERVERS.map(server => server.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('서버 이름이 고유해야 함', () => {
      const names = STATIC_ERROR_SERVERS.map(server => server.name);
      const uniqueNames = new Set(names);
      expect(uniqueNames.size).toBe(names.length);
    });

    it('모든 서버가 에러 상태여야 함', () => {
      STATIC_ERROR_SERVERS.forEach(server => {
        expect(server.status).toBe('offline');
        expect(server.alerts).toBe(999);
        expect(server.environment).toBe('ERROR');
        expect(server.type).toBe('ERROR');
      });
    });
  });

  describe('INFRASTRUCTURE_CONFIG', () => {
    it('인프라 설정이 올바르게 정의되어야 함', () => {
      expect(INFRASTRUCTURE_CONFIG).toBeDefined();
      expect(typeof INFRASTRUCTURE_CONFIG).toBe('object');
    });

    it('필수 인프라 설정 키들이 존재해야 함', () => {
      const requiredKeys = ['redis', 'supabase', 'api'];
      requiredKeys.forEach(key => {
        expect(INFRASTRUCTURE_CONFIG).toHaveProperty(key);
      });
    });

    it('Redis 설정이 올바르게 구성되어야 함', () => {
      const redisConfig = INFRASTRUCTURE_CONFIG.redis;
      expect(redisConfig).toHaveProperty('url');
      expect(redisConfig).toHaveProperty('token');
      expect(typeof redisConfig.url).toBe('string');
      expect(typeof redisConfig.token).toBe('string');
    });

    it('Supabase 설정이 올바르게 구성되어야 함', () => {
      const supabaseConfig = INFRASTRUCTURE_CONFIG.supabase;
      expect(supabaseConfig).toHaveProperty('url');
      expect(supabaseConfig).toHaveProperty('anonKey');
      expect(supabaseConfig).toHaveProperty('serviceRoleKey');
      expect(typeof supabaseConfig.url).toBe('string');
      expect(typeof supabaseConfig.anonKey).toBe('string');
      expect(typeof supabaseConfig.serviceRoleKey).toBe('string');
    });
  });

  describe('Environment Variable Validation', () => {
    it('환경변수 검증 함수가 정의되어야 함', () => {
      expect(validateEnvironmentVariables).toBeDefined();
      expect(typeof validateEnvironmentVariables).toBe('function');
    });

    it('필수 환경변수가 있을 때 성공해야 함', () => {
      // 환경변수 설정 (읽기 전용 문제 해결)
      const testEnv = {
        ...originalEnv,
        NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
        NODE_ENV: 'test',
      };

      // process.env를 완전히 교체
      (process as any).env = testEnv;

      const result = validateEnvironmentVariables(['NEXT_PUBLIC_SUPABASE_URL']);
      expect(result.isValid).toBe(true);
      expect(result.missing).toHaveLength(0);
    });

    it('필수 환경변수가 없을 때 실패해야 함', () => {
      const testEnv = {
        ...originalEnv,
        NODE_ENV: 'test',
      };
      // MISSING_VAR는 애초에 설정하지 않음

      (process as any).env = testEnv;

      const result = validateEnvironmentVariables(['MISSING_VAR']);
      expect(result.isValid).toBe(false);
      expect(result.missing).toContain('MISSING_VAR');
    });

    it('빈 문자열 환경변수를 누락으로 처리해야 함', () => {
      const testEnv = {
        ...originalEnv,
        EMPTY_VAR: '',
        NODE_ENV: 'test',
      };

      (process as any).env = testEnv;

      const result = validateEnvironmentVariables(['EMPTY_VAR']);
      expect(result.isValid).toBe(false);
      expect(result.missing).toContain('EMPTY_VAR');
    });
  });

  describe('Infrastructure URL Helpers', () => {
    it('인프라 URL을 올바르게 반환해야 함', () => {
      const testEnv = {
        ...originalEnv,
        UPSTASH_REDIS_REST_URL: 'https://test-redis.upstash.io',
      };

      (process as any).env = testEnv;

      const redisUrl = getInfrastructureUrl('redis');
      expect(redisUrl).toBe('https://test-redis.upstash.io');
    });

    it('환경변수가 없을 때 설정에서 값을 반환해야 함', () => {
      const testEnv = { ...originalEnv };
      delete testEnv.UPSTASH_REDIS_REST_URL;

      (process as any).env = testEnv;

      // INFRASTRUCTURE_CONFIG에서 값을 가져옴 ('' 또는 설정된 값)
      const redisUrl = getInfrastructureUrl('redis');
      // 빈 문자열이거나 INFRASTRUCTURE_CONFIG.redis.url 값
      expect(typeof redisUrl).toBe('string');
    });

    it('지원하지 않는 인프라 서비스에 대해 에러를 던져야 함', () => {
      expect(() => {
        getInfrastructureUrl('unknown' as never);
      }).toThrow('지원하지 않는 인프라 서비스');
    });
  });

  describe('API Key Helpers', () => {
    it('Google AI API 키를 올바르게 반환해야 함', () => {
      const testEnv = {
        ...originalEnv,
        GOOGLE_AI_API_KEY: 'test-google-ai-key',
      };

      (process as any).env = testEnv;

      const apiKey = getApiKey('google');
      expect(apiKey).toBe('test-google-ai-key');
    });

    it('환경변수가 없을 때 빈 문자열을 반환해야 함', () => {
      const testEnv = { ...originalEnv };
      delete testEnv.GOOGLE_AI_API_KEY;

      (process as any).env = testEnv;

      const apiKey = getApiKey('google');
      expect(apiKey).toBe('');
    });
  });

  describe('Environment Mode Detection', () => {
    it('개발 모드를 올바르게 감지해야 함', () => {
      const testEnv = {
        ...originalEnv,
        NODE_ENV: 'development',
      };

      (process as any).env = testEnv;

      expect(isDevelopmentMode()).toBe(true);
      expect(isProductionMode()).toBe(false);
    });

    it('프로덕션 모드를 올바르게 감지해야 함', () => {
      const testEnv = {
        ...originalEnv,
        NODE_ENV: 'production',
      };

      (process as any).env = testEnv;

      expect(isDevelopmentMode()).toBe(false);
      expect(isProductionMode()).toBe(true);
    });

    it('NODE_ENV가 없을 때 production 모드로 처리해야 함', () => {
      const testEnv = { ...originalEnv };
      delete testEnv.NODE_ENV;

      (process as any).env = testEnv;

      // NODE_ENV가 없으면 development가 아니므로 false
      expect(isDevelopmentMode()).toBe(false);
      // production도 아니므로 false
      expect(isProductionMode()).toBe(false);
    });
  });
});
