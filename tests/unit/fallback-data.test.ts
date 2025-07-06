import {
  getApiKey,
  getInfrastructureUrl,
  INFRASTRUCTURE_CONFIG,
  isDevelopmentMode,
  isProductionMode,
  STATIC_ERROR_SERVERS,
  UNIFIED_FALLBACK_SERVERS,
  validateEnvironmentVariables
} from '@/config/fallback-data';
// Jest globals are available without import

describe('Fallback Data Configuration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('UNIFIED_FALLBACK_SERVERS', () => {
    it('통합 폴백 서버 데이터가 올바르게 정의되어야 함', () => {
      expect(UNIFIED_FALLBACK_SERVERS).toBeDefined();
      expect(Array.isArray(UNIFIED_FALLBACK_SERVERS)).toBe(true);
      expect(UNIFIED_FALLBACK_SERVERS.length).toBeGreaterThan(0);
    });

    it('모든 서버가 올바른 구조를 가져야 함', () => {
      expect(UNIFIED_FALLBACK_SERVERS.length).toBeGreaterThan(0);

      UNIFIED_FALLBACK_SERVERS.forEach(server => {
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

        expect(server.cpu).toBeGreaterThanOrEqual(0);
        expect(server.cpu).toBeLessThanOrEqual(100);
        expect(server.memory).toBeGreaterThanOrEqual(0);
        expect(server.memory).toBeLessThanOrEqual(100);
        expect(server.disk).toBeGreaterThanOrEqual(0);
        expect(server.disk).toBeLessThanOrEqual(100);
        expect(server.network).toBeGreaterThanOrEqual(0);
      });
    });

    it('서버 ID가 고유해야 함', () => {
      const ids = UNIFIED_FALLBACK_SERVERS.map(server => server.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('서버 이름이 고유해야 함', () => {
      const names = UNIFIED_FALLBACK_SERVERS.map(server => server.name);
      const uniqueNames = new Set(names);
      expect(uniqueNames.size).toBe(names.length);
    });

    it('다양한 서버 상태가 포함되어야 함', () => {
      const statuses = UNIFIED_FALLBACK_SERVERS.map(server => server.status);
      const uniqueStatuses = new Set(statuses);

      expect(uniqueStatuses.has('healthy')).toBe(true);
      expect(uniqueStatuses.size).toBeGreaterThan(1); // 최소 2개 이상의 상태
    });

    it('서버 메트릭이 현실적인 범위에 있어야 함', () => {
      UNIFIED_FALLBACK_SERVERS.forEach(server => {
        // Critical 상태 서버는 높은 메트릭을 가져야 함
        if (server.status === 'critical') {
          expect(
            server.cpu > 80 || server.memory > 80 || server.disk > 80
          ).toBe(true);
        }

        // Healthy 상태 서버는 적절한 메트릭을 가져야 함
        if (server.status === 'healthy') {
          expect(server.cpu).toBeLessThan(80);
          expect(server.memory).toBeLessThan(80);
        }
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
      const mockEnv = {
        NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
        NODE_ENV: 'test',
      };

      jest.stubGlobal('process', { env: mockEnv });

      const result = validateEnvironmentVariables(['NEXT_PUBLIC_SUPABASE_URL']);
      expect(result.isValid).toBe(true);
      expect(result.missing).toHaveLength(0);
    });

    it('필수 환경변수가 없을 때 실패해야 함', () => {
      const mockEnv = {
        NODE_ENV: 'test',
      };

      jest.stubGlobal('process', { env: mockEnv });

      const result = validateEnvironmentVariables(['MISSING_VAR']);
      expect(result.isValid).toBe(false);
      expect(result.missing).toContain('MISSING_VAR');
    });

    it('빈 문자열 환경변수를 누락으로 처리해야 함', () => {
      const mockEnv = {
        EMPTY_VAR: '',
        NODE_ENV: 'test',
      };

      jest.stubGlobal('process', { env: mockEnv });

      const result = validateEnvironmentVariables(['EMPTY_VAR']);
      expect(result.isValid).toBe(false);
      expect(result.missing).toContain('EMPTY_VAR');
    });
  });

  describe('Infrastructure URL Helpers', () => {
    it('인프라 URL을 올바르게 반환해야 함', () => {
      // 테스트 환경에서는 기본 설정값이 반환되므로 해당 값으로 검증
      const redisUrl = getInfrastructureUrl('redis');
      expect(redisUrl).toBe('https://test-redis.upstash.io');
    });

    it('환경변수가 없을 때 폴백 URL을 반환해야 함', () => {
      const mockEnv = {
        NODE_ENV: 'test',
      };

      jest.stubGlobal('process', { env: mockEnv });

      const redisUrl = getInfrastructureUrl('redis');
      expect(redisUrl).toBe(INFRASTRUCTURE_CONFIG.redis.url);
    });

    it('지원하지 않는 인프라 서비스에 대해 에러를 던져야 함', () => {
      expect(() => {
        getInfrastructureUrl('unknown' as never);
      }).toThrow('지원하지 않는 인프라 서비스');
    });
  });

  describe('API Key Helpers', () => {
    it('API 키를 올바르게 반환해야 함', () => {
      const mockEnv = {
        GOOGLE_AI_API_KEY: 'custom-api-key',
        NODE_ENV: 'test',
      };

      jest.stubGlobal('process', { env: mockEnv });

      const apiKey = getApiKey('google');
      expect(apiKey).toBe('custom-api-key');
    });

    it('환경변수가 없을 때 폴백 키를 반환해야 함', () => {
      const mockEnv = {
        NODE_ENV: 'development',
      };

      jest.stubGlobal('process', { env: mockEnv });

      const apiKey = getApiKey('google');
      expect(apiKey).toBe(INFRASTRUCTURE_CONFIG.api.googleAI.fallbackKey);
    });

    it('프로덕션에서 폴백 키 사용 시 경고해야 함', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => { });

      const mockEnv = {
        NODE_ENV: 'production',
      };

      jest.stubGlobal('process', { env: mockEnv });

      getApiKey('google');
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('프로덕션에서 폴백 API 키 사용')
      );

      consoleSpy.mockRestore();
    });

    it('지원하지 않는 API 서비스에 대해 에러를 던져야 함', () => {
      expect(() => {
        getApiKey('unknown' as never);
      }).toThrow('지원하지 않는 API 서비스');
    });
  });

  describe('Environment Mode Helpers', () => {
    it('개발 모드를 올바르게 감지해야 함', () => {
      const mockEnv = {
        NODE_ENV: 'development',
      };

      jest.stubGlobal('process', { env: mockEnv });

      expect(isDevelopmentMode()).toBe(true);
      expect(isProductionMode()).toBe(false);
    });

    it('프로덕션 모드를 올바르게 감지해야 함', () => {
      const mockEnv = {
        NODE_ENV: 'production',
      };

      jest.stubGlobal('process', { env: mockEnv });

      expect(isDevelopmentMode()).toBe(false);
      expect(isProductionMode()).toBe(true);
    });

    it('테스트 모드를 개발 모드로 처리해야 함', () => {
      const mockEnv = {
        NODE_ENV: 'test',
      };

      jest.stubGlobal('process', { env: mockEnv });

      expect(isDevelopmentMode()).toBe(true);
      expect(isProductionMode()).toBe(false);
    });
  });

  describe('Data Consistency', () => {
    it('폴백 서버 데이터가 일관성을 가져야 함', () => {
      // 서버 상태와 메트릭의 일관성 검증
      UNIFIED_FALLBACK_SERVERS.forEach(server => {
        if (server.status === 'critical') {
          const highMetrics = [server.cpu, server.memory, server.disk].filter(
            metric => metric > 85
          );
          expect(highMetrics.length).toBeGreaterThan(0);
        }

        if (server.status === 'healthy') {
          const highMetrics = [server.cpu, server.memory, server.disk].filter(
            metric => metric > 90
          );
          expect(highMetrics.length).toBe(0);
        }
      });
    });

    it('인프라 설정이 환경별로 적절해야 함', () => {
      // 개발 환경
      const mockDevEnv = { NODE_ENV: 'development' };
      jest.stubGlobal('process', { env: mockDevEnv });

      expect(isDevelopmentMode()).toBe(true);

      // 프로덕션 환경
      const mockProdEnv = { NODE_ENV: 'production' };
      jest.stubGlobal('process', { env: mockProdEnv });

      expect(isProductionMode()).toBe(true);
    });
  });

  describe('Performance and Memory', () => {
    it('폴백 데이터 로딩이 빨라야 함', () => {
      const startTime = Date.now();

      // 데이터 접근
      const servers = UNIFIED_FALLBACK_SERVERS;
      const config = INFRASTRUCTURE_CONFIG;

      const loadTime = Date.now() - startTime;
      expect(loadTime).toBeLessThan(100); // 100ms 이내

      expect(servers).toBeDefined();
      expect(config).toBeDefined();
    });

    it('메모리 사용량이 적절해야 함', () => {
      const serversSize = JSON.stringify(UNIFIED_FALLBACK_SERVERS).length;
      const configSize = JSON.stringify(INFRASTRUCTURE_CONFIG).length;

      // 1MB 이내로 제한
      expect(serversSize).toBeLessThan(1024 * 1024);
      expect(configSize).toBeLessThan(1024 * 1024);
    });
  });
});

describe('STATIC_ERROR_SERVERS', () => {
  it('정적 에러 서버 데이터가 올바르게 정의되어야 함', () => {
    expect(STATIC_ERROR_SERVERS).toBeDefined();
    expect(Array.isArray(STATIC_ERROR_SERVERS)).toBe(true);
    expect(STATIC_ERROR_SERVERS.length).toBeGreaterThan(0);
  });

  it('should have at least 1 server', () => {
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

      expect(server.cpu).toBeGreaterThanOrEqual(0);
      expect(server.cpu).toBeLessThanOrEqual(100);
      expect(server.memory).toBeGreaterThanOrEqual(0);
      expect(server.memory).toBeLessThanOrEqual(100);
      expect(server.disk).toBeGreaterThanOrEqual(0);
      expect(server.disk).toBeLessThanOrEqual(100);
      expect(server.network).toBeGreaterThanOrEqual(0);
    });
  });

  it('server ID should be unique', () => {
    const ids = STATIC_ERROR_SERVERS.map(server => server.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('server name should be unique', () => {
    const names = STATIC_ERROR_SERVERS.map(server => server.name);
    const uniqueNames = new Set(names);
    expect(uniqueNames.size).toBe(names.length);
  });

  it('should include various server statuses', () => {
    const statuses = STATIC_ERROR_SERVERS.map(server => server.status);
    const uniqueStatuses = new Set(statuses);

    expect(uniqueStatuses.has('healthy')).toBe(true);
    expect(uniqueStatuses.size).toBeGreaterThan(1); // at least 2 different statuses
  });

  it('server metrics should be realistic', () => {
    STATIC_ERROR_SERVERS.forEach(server => {
      // Critical status server should have high metrics
      if (server.status === 'critical') {
        expect(
          server.cpu > 80 || server.memory > 80 || server.disk > 80
        ).toBe(true);
      }

      // Healthy status server should have appropriate metrics
      if (server.status === 'healthy') {
        expect(server.cpu).toBeLessThan(80);
        expect(server.memory).toBeLessThan(80);
      }
    });
  });

  it('data consistency', () => {
    // server status and metric consistency verification
    STATIC_ERROR_SERVERS.forEach(server => {
      if (server.status === 'critical') {
        const highMetrics = [server.cpu, server.memory, server.disk].filter(
          metric => metric > 85
        );
        expect(highMetrics.length).toBeGreaterThan(0);
      }

      if (server.status === 'healthy') {
        const highMetrics = [server.cpu, server.memory, server.disk].filter(
          metric => metric > 90
        );
        expect(highMetrics.length).toBe(0);
      }
    });
  });

  it('infrastructure configuration should be appropriate for environment', () => {
    // development environment
    const mockDevEnv = { NODE_ENV: 'development' };
    jest.stubGlobal('process', { env: mockDevEnv });

    expect(isDevelopmentMode()).toBe(true);

    // production environment
    const mockProdEnv = { NODE_ENV: 'production' };
    jest.stubGlobal('process', { env: mockProdEnv });

    expect(isProductionMode()).toBe(true);
  });

  it('performance', () => {
    const startTime = Date.now();

    // data access
    const servers = STATIC_ERROR_SERVERS;
    const config = INFRASTRUCTURE_CONFIG;

    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(100); // within 100ms

    expect(servers).toBeDefined();
    expect(config).toBeDefined();
  });

  it('memory usage', () => {
    const serversSize = JSON.stringify(STATIC_ERROR_SERVERS).length;
    const configSize = JSON.stringify(INFRASTRUCTURE_CONFIG).length;

    // within 1MB limit
    expect(serversSize).toBeLessThan(1024 * 1024);
    expect(configSize).toBeLessThan(1024 * 1024);
  });
});

describe('Static Error Data Configuration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });
});
