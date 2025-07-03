/**
 * 🔒 Google AI API 할당량 관리자 v2025.7.1
 * OpenManager Vibe v5
 *
 * Google AI API의 할당량을 안전하게 관리하여 과도한 요청을 방지합니다.
 * 헬스체크, 테스트, 실제 서비스 호출에 대한 제한을 적용합니다.
 *
 * 📋 2025년 7월 최신 할당량 (TPM 기능 추가):
 * - 분당 요청: 15회 (RPM)
 * - 분당 토큰: 800,000개 (TPM) - 안전 마진 적용
 * - 일일 요청: 1,500회 (RPD)
 */

import { Redis } from '@upstash/redis';

interface QuotaConfig {
  dailyLimit: number;
  hourlyLimit: number;
  minuteLimit: number;
  tpmLimit: number; // 🚀 분당 토큰 제한
  testLimit: number;
  healthCheckCacheHours: number;
  circuitBreakerThreshold: number;
  model: 'gemini-2.0-flash' | 'gemini-2.5-flash' | 'gemini-2.5-pro';
}

interface QuotaStatus {
  dailyUsed: number;
  hourlyUsed: number;
  minuteUsed: number;
  tpmUsed: number; // 🚀 분당 토큰 사용량
  testUsed: number;
  lastHealthCheck: number;
  circuitBreakerCount: number;
  isBlocked: boolean;
  model: string;
  remainingDaily: number;
  remainingMinute: number;
  remainingTpm: number; // 🚀 남은 분당 토큰
}

export class GoogleAIQuotaManager {
  private redis: Redis;
  private config: QuotaConfig;
  private readonly REDIS_PREFIX = 'google_ai_quota:';
  private isMockMode: boolean = false;

  constructor() {
    this.initializeRedis();

    const selectedModel = (process.env.GOOGLE_AI_MODEL ||
      'gemini-2.0-flash') as QuotaConfig['model'];

    this.config = {
      dailyLimit: parseInt(process.env.GOOGLE_AI_DAILY_LIMIT || '1200'), // 무료 한도: 1500 (20% 안전 마진)
      hourlyLimit: parseInt(process.env.GOOGLE_AI_HOURLY_LIMIT || '50'),
      minuteLimit: parseInt(process.env.GOOGLE_AI_MINUTE_LIMIT || '10'), // 무료 한도: 15 (33% 안전 마진)
      tpmLimit: parseInt(process.env.GOOGLE_AI_TPM_LIMIT || '800000'), // 무료 한도: 1M (20% 안전 마진)
      testLimit: parseInt(process.env.GOOGLE_AI_TEST_LIMIT_PER_DAY || '5'), // 더 엄격한 테스트 제한
      healthCheckCacheHours: parseInt(
        process.env.GOOGLE_AI_HEALTH_CHECK_CACHE_HOURS || '24' // 24시간 캐시로 확대
      ),
      circuitBreakerThreshold: parseInt(
        process.env.GOOGLE_AI_CIRCUIT_BREAKER_THRESHOLD || '5'
      ),
      model: selectedModel,
    };

    console.log('📊 Google AI 할당량 설정 (v2025.7.3 - 무료 한도 최적화):', {
      model: this.config.model,
      dailyLimit: this.config.dailyLimit,
      minuteLimit: this.config.minuteLimit, // 무료 한도 대비 33% 안전 마진
      tpmLimit: this.config.tpmLimit, // 무료 한도 대비 20% 안전 마진
      testLimit: this.config.testLimit, // 엄격한 테스트 제한
      healthCheckCache: `${this.config.healthCheckCacheHours}시간`, // 24시간 캐시
    });
  }

  private initializeRedis(): void {
    try {
      const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
      const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

      if (!redisUrl || !redisToken) {
        console.log('⚠️ Redis 환경변수 누락 - Mock 모드로 전환');
        this.isMockMode = true;
        this.redis = this.createMockRedis();
        return;
      }

      this.redis = new Redis({ url: redisUrl, token: redisToken });
      console.log('✅ Google AI Quota Manager - Redis 연결 초기화 완료');
    } catch (error) {
      console.error('❌ Redis 초기화 실패 - Mock 모드로 전환:', error);
      this.isMockMode = true;
      this.redis = this.createMockRedis();
    }
  }

  private createMockRedis(): any {
    const mockData = new Map<string, string>();
    const incr = async (key: string, by: number = 1): Promise<number> => {
      const current = parseInt(mockData.get(key) || '0');
      const newValue = current + by;
      mockData.set(key, newValue.toString());
      return newValue;
    };
    return {
      async get(key: string) {
        return mockData.get(key) || null;
      },
      async set(key: string, value: string, options?: { ex?: number }) {
        mockData.set(key, value);
        if (options?.ex)
          setTimeout(() => mockData.delete(key), options.ex * 1000);
        return 'OK';
      },
      async incr(key: string) {
        return incr(key, 1);
      },
      async incrby(key: string, value: number) {
        return incr(key, value);
      },
      async expire(key: string, seconds: number) {
        setTimeout(() => mockData.delete(key), seconds * 1000);
        return 1;
      },
      // 🚀 파이프라인 Mock 구현
      pipeline() {
        const operations: Array<() => Promise<any>> = [];
        return {
          incr: (key: string) => {
            operations.push(() => incr(key, 1));
            return this;
          },
          incrby: (key: string, value: number) => {
            operations.push(() => incr(key, value));
            return this;
          },
          expire: (key: string, seconds: number) => {
            operations.push(async () => {
              setTimeout(() => mockData.delete(key), seconds * 1000);
              return 1;
            });
            return this;
          },
          async exec() {
            const results = await Promise.all(
              operations.map(op =>
                op()
                  .then(result => [null, result])
                  .catch(error => [error, null])
              )
            );
            return results;
          },
        };
      },
    };
  }

  async canPerformHealthCheck(): Promise<{
    allowed: boolean;
    reason?: string;
    cached?: boolean;
  }> {
    try {
      if (
        process.env.NODE_ENV === 'test' ||
        process.env.FORCE_MOCK_GOOGLE_AI === 'true'
      ) {
        return {
          allowed: false,
          reason: '테스트 환경 - 헬스체크 차단',
          cached: true,
        };
      }

      const now = Date.now();
      const cacheKey = `${this.REDIS_PREFIX}health_check`;
      const lastCheck = await this.redis.get(cacheKey);

      if (lastCheck) {
        const timeDiff = now - parseInt(lastCheck as string);
        const cacheValidMs = this.config.healthCheckCacheHours * 3600 * 1000;
        if (timeDiff < cacheValidMs) {
          return { allowed: false, reason: `헬스체크 캐시 유효`, cached: true };
        }
      }

      const isBlocked = await this.isCircuitBreakerOpen();
      if (isBlocked) {
        return { allowed: false, reason: 'Circuit Breaker 활성화' };
      }

      return { allowed: true };
    } catch (error) {
      console.error('헬스체크 권한 확인 실패:', error);
      return { allowed: false, reason: 'Redis 연결 오류' };
    }
  }

  async canPerformTest(): Promise<{
    allowed: boolean;
    reason?: string;
    remaining?: number;
  }> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const testKey = `${this.REDIS_PREFIX}test:${today}`;
      const testCount = parseInt((await this.redis.get(testKey)) || '0');

      if (testCount >= this.config.testLimit) {
        return {
          allowed: false,
          reason: `일일 테스트 제한 초과`,
          remaining: 0,
        };
      }

      const isBlocked = await this.isCircuitBreakerOpen();
      if (isBlocked) {
        return { allowed: false, reason: 'Circuit Breaker 활성화' };
      }

      return { allowed: true, remaining: this.config.testLimit - testCount };
    } catch (error) {
      console.error('테스트 권한 확인 실패:', error);
      return { allowed: false, reason: 'Redis 연결 오류' };
    }
  }

  async canPerformAPICall(): Promise<{ allowed: boolean; reason?: string }> {
    try {
      if (this.isMockMode) return { allowed: true };

      const isBlocked = await this.isCircuitBreakerOpen();
      if (isBlocked) {
        return { allowed: false, reason: 'Circuit Breaker 활성화' };
      }

      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const currentMinute = `${today}:${now.getHours()}:${now.getMinutes()}`;

      const [minuteCount, dailyCount, tpmCount] = await Promise.all([
        this.redis.get(`${this.REDIS_PREFIX}minute:${currentMinute}`),
        this.redis.get(`${this.REDIS_PREFIX}daily:${today}`),
        this.redis.get(`${this.REDIS_PREFIX}tpm:${currentMinute}`),
      ]);

      if (parseInt(String(minuteCount) || '0') >= this.config.minuteLimit) {
        return { allowed: false, reason: `분당 요청 한도(RPM) 초과` };
      }

      if (parseInt(String(tpmCount) || '0') >= this.config.tpmLimit) {
        return { allowed: false, reason: `분당 토큰 한도(TPM) 초과` };
      }

      if (parseInt(String(dailyCount) || '0') >= this.config.dailyLimit) {
        return { allowed: false, reason: `일일 요청 한도(RPD) 초과` };
      }

      return { allowed: true };
    } catch (error) {
      console.error('API 호출 권한 확인 실패:', error);
      return { allowed: false, reason: 'Redis 연결 오류' };
    }
  }

  async recordHealthCheckSuccess(): Promise<void> {
    try {
      const cacheKey = `${this.REDIS_PREFIX}health_check`;
      await this.redis.set(cacheKey, Date.now().toString(), {
        ex: this.config.healthCheckCacheHours * 3600,
      });
      await this.resetCircuitBreaker();
    } catch (error) {
      console.error('헬스체크 성공 기록 실패:', error);
    }
  }

  async recordTestUsage(): Promise<void> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const testKey = `${this.REDIS_PREFIX}test:${today}`;
      const newCount = await this.redis.incr(testKey);
      if (newCount === 1) await this.redis.expire(testKey, 24 * 3600);
    } catch (error) {
      console.error('테스트 사용량 기록 실패:', error);
    }
  }

  async recordAPIUsage(tokens: number): Promise<void> {
    try {
      if (this.isMockMode) return;

      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const currentHour = `${today}:${now.getHours()}`;
      const currentMinute = `${today}:${now.getHours()}:${now.getMinutes()}`;

      const pipeline = this.redis.pipeline();

      const minuteKey = `${this.REDIS_PREFIX}minute:${currentMinute}`;
      pipeline.incr(minuteKey);
      pipeline.expire(minuteKey, 61);

      const tpmKey = `${this.REDIS_PREFIX}tpm:${currentMinute}`;
      pipeline.incrby(tpmKey, tokens);
      pipeline.expire(tpmKey, 61);

      const dailyKey = `${this.REDIS_PREFIX}daily:${today}`;
      pipeline.incr(dailyKey);
      pipeline.expire(dailyKey, 24 * 3600 + 60);

      const hourlyKey = `${this.REDIS_PREFIX}hourly:${currentHour}`;
      pipeline.incr(hourlyKey);
      pipeline.expire(hourlyKey, 3600 + 60);

      // 🚀 파이프라인 실행 및 에러 처리 개선
      const results = await pipeline.exec();

      // 파이프라인 결과 검증
      const failedOperations = results?.filter((result, index) => {
        if (result && Array.isArray(result) && result[0] !== null) {
          console.warn(`Redis 파이프라인 ${index}번째 작업 실패:`, result[0]);
          return true;
        }
        return false;
      });

      if (failedOperations && failedOperations.length > 0) {
        console.warn(
          `⚠️ Redis 파이프라인 ${failedOperations.length}개 작업 실패`
        );
      } else {
        console.log(`✅ API 사용량 기록 완료: 토큰 ${tokens}개`);
      }

      await this.resetCircuitBreaker();
    } catch (error) {
      console.error('API 사용량 기록 실패:', error);
    }
  }

  async recordAPIFailure(): Promise<void> {
    try {
      const key = `${this.REDIS_PREFIX}failures`;
      const failures = await this.redis.incr(key);
      if (failures === 1) await this.redis.expire(key, 30 * 60); // 30분
      if (failures >= this.config.circuitBreakerThreshold) {
        await this.openCircuitBreaker();
      }
    } catch (error) {
      console.error('API 실패 기록 실패:', error);
    }
  }

  private async isCircuitBreakerOpen(): Promise<boolean> {
    try {
      const key = `${this.REDIS_PREFIX}circuit_breaker`;
      const result = await this.redis.get(key);
      return result === 'open';
    } catch (error) {
      console.error('Circuit Breaker 상태 확인 실패:', error);
      return false;
    }
  }

  private async openCircuitBreaker(): Promise<void> {
    try {
      const key = `${this.REDIS_PREFIX}circuit_breaker`;
      await this.redis.set(key, 'open', { ex: 30 * 60 }); // 30분 동안 차단
    } catch (error) {
      console.error('Circuit Breaker 활성화 실패:', error);
    }
  }

  private async resetCircuitBreaker(): Promise<void> {
    try {
      await this.redis.expire(`${this.REDIS_PREFIX}failures`, 0);
    } catch (error) {
      console.error('Circuit Breaker 리셋 실패:', error);
    }
  }

  async getQuotaStatus(): Promise<QuotaStatus> {
    try {
      if (this.isMockMode) return this.getMockQuotaStatus();

      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const currentHour = `${today}:${now.getHours()}`;
      const currentMinute = `${today}:${now.getHours()}:${now.getMinutes()}`;

      const [
        dailyUsed,
        hourlyUsed,
        minuteUsed,
        tpmUsed,
        testUsed,
        lastHealthCheck,
        failures,
      ] = await Promise.all([
        this.redis.get(`${this.REDIS_PREFIX}daily:${today}`),
        this.redis.get(`${this.REDIS_PREFIX}hourly:${currentHour}`),
        this.redis.get(`${this.REDIS_PREFIX}minute:${currentMinute}`),
        this.redis.get(`${this.REDIS_PREFIX}tpm:${currentMinute}`),
        this.redis.get(`${this.REDIS_PREFIX}test:${today}`),
        this.redis.get(`${this.REDIS_PREFIX}health_check`),
        this.redis.get(`${this.REDIS_PREFIX}failures`),
      ]);

      const dailyUsedCount = parseInt(String(dailyUsed) || '0');
      const minuteUsedCount = parseInt(String(minuteUsed) || '0');
      const tpmUsedCount = parseInt(String(tpmUsed) || '0');
      const circuitBreakerCount = parseInt(String(failures) || '0');

      return {
        dailyUsed: dailyUsedCount,
        hourlyUsed: parseInt(String(hourlyUsed) || '0'),
        minuteUsed: minuteUsedCount,
        tpmUsed: tpmUsedCount,
        testUsed: parseInt(String(testUsed) || '0'),
        lastHealthCheck: parseInt(String(lastHealthCheck) || '0'),
        circuitBreakerCount,
        isBlocked: circuitBreakerCount >= this.config.circuitBreakerThreshold,
        model: this.config.model,
        remainingDaily: Math.max(0, this.config.dailyLimit - dailyUsedCount),
        remainingMinute: Math.max(0, this.config.minuteLimit - minuteUsedCount),
        remainingTpm: Math.max(0, this.config.tpmLimit - tpmUsedCount),
      };
    } catch (error) {
      console.error('할당량 상태 가져오기 실패:', error);
      return this.getMockQuotaStatus();
    }
  }

  private getMockQuotaStatus(): QuotaStatus {
    return {
      dailyUsed: 0,
      hourlyUsed: 0,
      minuteUsed: 0,
      tpmUsed: 0,
      testUsed: 0,
      lastHealthCheck: 0,
      circuitBreakerCount: 0,
      isBlocked: false,
      model: this.config.model,
      remainingDaily: this.config.dailyLimit,
      remainingMinute: this.config.minuteLimit,
      remainingTpm: this.config.tpmLimit,
    };
  }
}
