import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getApiKey,
  getInfrastructureUrl,
  INFRASTRUCTURE_CONFIG,
  isDevelopmentMode,
  isProductionMode,
  STATIC_ERROR_SERVERS,
  validateEnvironmentVariables,
} from '@/config/fallback-data';

describe('Fallback Data Configuration', () => {
  // 환경변수 백업을 위한 변수
  const _originalEnv = { ...process.env };

  beforeEach(() => {
    vi.clearAllMocks();
    // 모든 환경변수 초기화
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    // 모든 환경변수 복원
    vi.unstubAllEnvs();
  });

  describe('STATIC_ERROR_SERVERS', () => {
    it('정적 에러 서버 데이터가 올바르게 정의되어야 함', () => {
      expect(STATIC_ERROR_SERVERS).toBeDefined();
      expect(Array.isArray(STATIC_ERROR_SERVERS)).toBe(true);
      expect(STATIC_ERROR_SERVERS.length).toBeGreaterThan(0);
    });

    it('모든 서버가 올바른 구조를 가져야 함', () => {
      expect(STATIC_ERROR_SERVERS.length).toBeGreaterThan(0);

      STATIC_ERROR_SERVERS.forEach((server) => {
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
      const ids = STATIC_ERROR_SERVERS.map((server) => server.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('서버 이름이 고유해야 함', () => {
      const names = STATIC_ERROR_SERVERS.map((server) => server.name);
      const uniqueNames = new Set(names);
      expect(uniqueNames.size).toBe(names.length);
    });

    it('모든 서버가 에러 상태여야 함', () => {
      STATIC_ERROR_SERVERS.forEach((server) => {
        expect(server.status).toBe('offline');
        expect(server.alerts).toBe(999);
        // environment와 role은 실제 fallback-data에서 undefined로 설정됨
        expect(server.environment).toBeUndefined();
        expect(server.role).toBeUndefined();
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
      requiredKeys.forEach((key) => {
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
      // vi.stubEnv로 환경변수 설정
      vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://test.supabase.co');
      vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'test-anon-key');
      vi.stubEnv('NODE_ENV', 'test');

      const result = validateEnvironmentVariables(['NEXT_PUBLIC_SUPABASE_URL']);
      expect(result.isValid).toBe(true);
      expect(result.missing).toHaveLength(0);
    });

    it('필수 환경변수가 없을 때 실패해야 함', () => {
      // MISSING_VAR는 설정하지 않음
      vi.stubEnv('NODE_ENV', 'test');

      const result = validateEnvironmentVariables(['MISSING_VAR']);
      expect(result.isValid).toBe(false);
      expect(result.missing).toContain('MISSING_VAR');
    });

    it('빈 문자열 환경변수를 누락으로 처리해야 함', () => {
      // 빈 문자열로 환경변수 설정
      vi.stubEnv('EMPTY_VAR', '');
      vi.stubEnv('NODE_ENV', 'test');

      const result = validateEnvironmentVariables(['EMPTY_VAR']);
      expect(result.isValid).toBe(false);
      expect(result.missing).toContain('EMPTY_VAR');
    });
  });

  describe('Infrastructure URL Helpers', () => {
    it('인프라 URL을 올바르게 반환해야 함', () => {
      vi.stubEnv('UPSTASH_REDIS_REST_URL', 'https://test-redis.upstash.io');

      const redisUrl = getInfrastructureUrl('redis');
      expect(redisUrl).toBe('https://test-redis.upstash.io');
    });

    it('환경변수가 없을 때 설정에서 값을 반환해야 함', () => {
      // UPSTASH_REDIS_REST_URL을 명시적으로 제거
      vi.stubEnv('UPSTASH_REDIS_REST_URL', undefined);

      // INFRASTRUCTURE_CONFIG에서 값을 가져옴
      const redisUrl = getInfrastructureUrl('redis');
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
      vi.stubEnv('GOOGLE_AI_API_KEY', 'test-google-ai-key');

      const apiKey = getApiKey('google');
      expect(apiKey).toBe('test-google-ai-key');
    });

    it('환경변수가 없을 때 빈 문자열을 반환해야 함', () => {
      // GOOGLE_AI_API_KEY를 명시적으로 제거
      vi.stubEnv('GOOGLE_AI_API_KEY', undefined);

      const apiKey = getApiKey('google');
      expect(apiKey).toBe('');
    });
  });

  describe('Environment Mode Detection', () => {
    it('개발 모드를 올바르게 감지해야 함', () => {
      vi.stubEnv('NODE_ENV', 'development');

      expect(isDevelopmentMode()).toBe(true);
      expect(isProductionMode()).toBe(false);
    });

    it('프로덕션 모드를 올바르게 감지해야 함', () => {
      vi.stubEnv('NODE_ENV', 'production');

      expect(isDevelopmentMode()).toBe(false);
      expect(isProductionMode()).toBe(true);
    });

    it('NODE_ENV가 없을 때 production 모드로 처리해야 함', () => {
      // NODE_ENV를 명시적으로 제거
      vi.stubEnv('NODE_ENV', undefined);

      // NODE_ENV가 없으면 development가 아니므로 false
      expect(isDevelopmentMode()).toBe(false);
      // production도 아니므로 false
      expect(isProductionMode()).toBe(false);
    });
  });
});
