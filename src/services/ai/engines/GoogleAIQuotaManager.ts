/**
 * 🔒 Google AI API 할당량 관리자 v2025.7
 * OpenManager Vibe v5
 *
 * Google AI API의 할당량을 안전하게 관리하여 과도한 요청을 방지합니다.
 * 헬스체크, 테스트, 실제 서비스 호출에 대한 제한을 적용합니다.
 *
 * 📋 2025년 7월 최신 할당량 (Gemini 2.0 Flash 기준):
 * - 분당 요청: 15회 (RPM)
 * - 분당 토큰: 1,000,000개 (TPM)
 * - 일일 요청: 1,500회 (RPD)
 * - 자동 유료 전환: 없음 (429 에러로 안전하게 차단)
 */

import { Redis } from '@upstash/redis';

interface QuotaConfig {
  dailyLimit: number;
  hourlyLimit: number;
  minuteLimit: number; // 새로 추가: 분당 제한
  testLimit: number;
  healthCheckCacheHours: number;
  circuitBreakerThreshold: number;
  model: 'gemini-2.0-flash' | 'gemini-2.5-flash' | 'gemini-2.5-pro'; // 모델별 차등 적용
}

interface QuotaStatus {
  dailyUsed: number;
  hourlyUsed: number;
  minuteUsed: number; // 새로 추가: 분당 사용량
  testUsed: number;
  lastHealthCheck: number;
  circuitBreakerCount: number;
  isBlocked: boolean;
  model: string;
  remainingDaily: number;
  remainingMinute: number;
}

export class GoogleAIQuotaManager {
  private redis: Redis;
  private config: QuotaConfig;
  private readonly REDIS_PREFIX = 'google_ai_quota:';
  private isMockMode: boolean = false;

  constructor() {
    // 🔧 안전한 Redis 초기화
    this.initializeRedis();

    // 🚀 2025년 7월 최신 할당량 설정 (Gemini 2.0 Flash 기준)
    const selectedModel = (process.env.GOOGLE_AI_MODEL ||
      'gemini-2.0-flash') as QuotaConfig['model'];

    this.config = {
      // 🎯 Gemini 2.0 Flash 기준 관대한 설정 (2025년 업데이트)
      dailyLimit: parseInt(process.env.GOOGLE_AI_DAILY_LIMIT || '1200'), // 1500 → 안전 마진 1200
      hourlyLimit: parseInt(process.env.GOOGLE_AI_HOURLY_LIMIT || '50'), // 시간당 제한 완화
      minuteLimit: parseInt(process.env.GOOGLE_AI_MINUTE_LIMIT || '12'), // 15 → 안전 마진 12
      testLimit: parseInt(process.env.GOOGLE_AI_TEST_LIMIT_PER_DAY || '10'), // 테스트 제한 완화
      healthCheckCacheHours: parseInt(
        process.env.GOOGLE_AI_HEALTH_CHECK_CACHE_HOURS || '12' // 24 → 12시간으로 단축
      ),
      circuitBreakerThreshold: parseInt(
        process.env.GOOGLE_AI_CIRCUIT_BREAKER_THRESHOLD || '5' // 3 → 5로 완화
      ),
      model: selectedModel,
    };

    console.log('📊 Google AI 할당량 설정 (2025년 7월):', {
      model: this.config.model,
      dailyLimit: this.config.dailyLimit,
      minuteLimit: this.config.minuteLimit,
      testLimit: this.config.testLimit,
    });
  }

  /**
   * 🔧 안전한 Redis 초기화
   */
  private initializeRedis(): void {
    try {
      // 🔍 환경 감지
      const isVercel = process.env.VERCEL === '1' || process.env.VERCEL_ENV;
      const isBuild = process.env.BUILD_TIME === 'true';

      console.log('🔍 GoogleAIQuotaManager Redis 초기화:', {
        isVercel,
        isBuild,
        hasRedisUrl: !!process.env.UPSTASH_REDIS_REST_URL,
        hasRedisToken: !!process.env.UPSTASH_REDIS_REST_TOKEN,
        nodeEnv: process.env.NODE_ENV,
      });

      // 🚫 환경변수 검증
      const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
      const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

      if (!redisUrl || !redisToken) {
        console.log('⚠️ Redis 환경변수 누락 - Mock 모드로 전환');
        this.isMockMode = true;
        this.redis = this.createMockRedis();
        return;
      }

      // URL 형식 검증
      if (!redisUrl.startsWith('http')) {
        console.log('⚠️ Redis URL 형식 오류 - Mock 모드로 전환');
        this.isMockMode = true;
        this.redis = this.createMockRedis();
        return;
      }

      // 실제 Redis 클라이언트 생성
      this.redis = new Redis({
        url: redisUrl,
        token: redisToken,
      });

      console.log('✅ Google AI Quota Manager - Redis 연결 초기화 완료');
    } catch (error) {
      console.error('❌ Redis 초기화 실패 - Mock 모드로 전환:', error);
      this.isMockMode = true;
      this.redis = this.createMockRedis();
    }
  }

  /**
   * 🎭 Mock Redis 클라이언트 생성
   */
  private createMockRedis(): any {
    const mockData = new Map<string, string>();

    return {
      async get(key: string): Promise<string | null> {
        return mockData.get(key) || null;
      },
      async set(
        key: string,
        value: string,
        options?: { ex?: number }
      ): Promise<'OK'> {
        mockData.set(key, value);
        if (options?.ex) {
          setTimeout(() => mockData.delete(key), options.ex * 1000);
        }
        return 'OK';
      },
      async incr(key: string): Promise<number> {
        const current = parseInt(mockData.get(key) || '0');
        const newValue = current + 1;
        mockData.set(key, newValue.toString());
        return newValue;
      },
      async expire(key: string, seconds: number): Promise<number> {
        setTimeout(() => mockData.delete(key), seconds * 1000);
        return 1;
      },
    };
  }

  /**
   * 헬스체크 요청 가능 여부 확인
   */
  async canPerformHealthCheck(): Promise<{
    allowed: boolean;
    reason?: string;
    cached?: boolean;
  }> {
    try {
      // 🚫 테스트 환경에서는 헬스체크 차단
      if (
        process.env.NODE_ENV === 'test' ||
        process.env.TEST_CONTEXT === 'true' ||
        process.env.FORCE_MOCK_GOOGLE_AI === 'true' ||
        process.env.DISABLE_HEALTH_CHECK === 'true'
      ) {
        return {
          allowed: false,
          reason: '테스트 환경 - 헬스체크 차단 (할당량 보호)',
          cached: true,
        };
      }

      // 🛡️ 헬스체크 컨텍스트에서 추가 제한
      if (process.env.HEALTH_CHECK_CONTEXT === 'true') {
        return {
          allowed: false,
          reason: '헬스체크 컨텍스트 - API 호출 제한 (차단 방지)',
          cached: true,
        };
      }

      const now = Date.now();
      const cacheKey = `${this.REDIS_PREFIX}health_check`;
      const lastCheck = await this.redis.get(cacheKey);

      if (lastCheck) {
        const timeDiff = now - parseInt(lastCheck as string);
        const cacheValidHours =
          this.config.healthCheckCacheHours * 60 * 60 * 1000;

        if (timeDiff < cacheValidHours) {
          return {
            allowed: false,
            reason: `헬스체크 캐시 유효 (${Math.round((cacheValidHours - timeDiff) / (60 * 60 * 1000))}시간 남음)`,
            cached: true,
          };
        }
      }

      // Circuit Breaker 확인
      const isBlocked = await this.isCircuitBreakerOpen();
      if (isBlocked) {
        return {
          allowed: false,
          reason: 'Circuit Breaker 활성화 - 연속 실패로 인한 일시 차단',
        };
      }

      return { allowed: true };
    } catch (error) {
      console.error('헬스체크 권한 확인 실패:', error);
      return { allowed: false, reason: 'Redis 연결 오류' };
    }
  }

  /**
   * 테스트 요청 가능 여부 확인
   */
  async canPerformTest(): Promise<{
    allowed: boolean;
    reason?: string;
    remaining?: number;
  }> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const testKey = `${this.REDIS_PREFIX}test:${today}`;
      const testCount = (await this.redis.get(testKey)) || 0;

      if (parseInt(testCount as string) >= this.config.testLimit) {
        return {
          allowed: false,
          reason: `일일 테스트 제한 초과 (${this.config.testLimit}회)`,
          remaining: 0,
        };
      }

      // Circuit Breaker 확인
      const isBlocked = await this.isCircuitBreakerOpen();
      if (isBlocked) {
        return {
          allowed: false,
          reason: 'Circuit Breaker 활성화 - 연속 실패로 인한 일시 차단',
        };
      }

      return {
        allowed: true,
        remaining: this.config.testLimit - parseInt(testCount as string),
      };
    } catch (error) {
      console.error('테스트 권한 확인 실패:', error);
      return { allowed: false, reason: 'Redis 연결 오류' };
    }
  }

  /**
   * 일반 API 요청 가능 여부 확인 (2025년 업데이트: 분당 제한 추가)
   */
  async canPerformAPICall(): Promise<{ allowed: boolean; reason?: string }> {
    try {
      // 개발 환경에서는 제한 완화
      if (
        process.env.NODE_ENV === 'development' &&
        process.env.GOOGLE_AI_QUOTA_PROTECTION !== 'true'
      ) {
        return { allowed: true };
      }

      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const currentHour = `${today}:${now.getHours()}`;
      const currentMinute = `${today}:${now.getHours()}:${now.getMinutes()}`;

      // 🚀 분당 제한 확인 (2025년 추가: Gemini 2.0 Flash 15 RPM)
      const minuteKey = `${this.REDIS_PREFIX}minute:${currentMinute}`;
      const minuteCount = (await this.redis.get(minuteKey)) || 0;

      if (parseInt(minuteCount as string) >= this.config.minuteLimit) {
        return {
          allowed: false,
          reason: `분당 할당량 초과 (${this.config.minuteLimit}회/분, Gemini 2.0 Flash 기준)`,
        };
      }

      // 일일 제한 확인
      const dailyKey = `${this.REDIS_PREFIX}daily:${today}`;
      const dailyCount = (await this.redis.get(dailyKey)) || 0;

      if (parseInt(dailyCount as string) >= this.config.dailyLimit) {
        return {
          allowed: false,
          reason: `일일 할당량 초과 (${this.config.dailyLimit}회/일, 2025년 업데이트)`,
        };
      }

      // 시간당 제한 확인
      const hourlyKey = `${this.REDIS_PREFIX}hourly:${currentHour}`;
      const hourlyCount = (await this.redis.get(hourlyKey)) || 0;

      if (parseInt(hourlyCount as string) >= this.config.hourlyLimit) {
        return {
          allowed: false,
          reason: `시간당 할당량 초과 (${this.config.hourlyLimit}회/시)`,
        };
      }

      // Circuit Breaker 확인
      const isBlocked = await this.isCircuitBreakerOpen();
      if (isBlocked) {
        return {
          allowed: false,
          reason: 'Circuit Breaker 활성화 - 연속 실패로 인한 일시 차단',
        };
      }

      return { allowed: true };
    } catch (error) {
      console.error('API 호출 권한 확인 실패:', error);
      return { allowed: false, reason: 'Redis 연결 오류' };
    }
  }

  /**
   * 헬스체크 성공 기록
   */
  async recordHealthCheckSuccess(): Promise<void> {
    try {
      const now = Date.now();
      const cacheKey = `${this.REDIS_PREFIX}health_check`;
      await this.redis.set(cacheKey, now.toString(), {
        ex: this.config.healthCheckCacheHours * 60 * 60,
      });

      // Circuit Breaker 리셋
      await this.resetCircuitBreaker();
    } catch (error) {
      console.error('헬스체크 성공 기록 실패:', error);
    }
  }

  /**
   * 테스트 사용량 기록
   */
  async recordTestUsage(): Promise<void> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const testKey = `${this.REDIS_PREFIX}test:${today}`;
      await this.redis.incr(testKey);
      await this.redis.expire(testKey, 24 * 60 * 60); // 24시간 후 만료
    } catch (error) {
      console.error('테스트 사용량 기록 실패:', error);
    }
  }

  /**
   * API 호출 사용량 기록 (2025년 업데이트: 분당 카운터 추가)
   */
  async recordAPIUsage(): Promise<void> {
    try {
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const currentHour = `${today}:${now.getHours()}`;
      const currentMinute = `${today}:${now.getHours()}:${now.getMinutes()}`;

      // 🚀 분당 카운터 증가 (2025년 추가: Gemini 2.0 Flash 15 RPM 추적)
      const minuteKey = `${this.REDIS_PREFIX}minute:${currentMinute}`;
      await this.redis.incr(minuteKey);
      await this.redis.expire(minuteKey, 60); // 1분 후 만료

      // 일일 카운터 증가
      const dailyKey = `${this.REDIS_PREFIX}daily:${today}`;
      await this.redis.incr(dailyKey);
      await this.redis.expire(dailyKey, 24 * 60 * 60);

      // 시간당 카운터 증가
      const hourlyKey = `${this.REDIS_PREFIX}hourly:${currentHour}`;
      await this.redis.incr(hourlyKey);
      await this.redis.expire(hourlyKey, 60 * 60);

      // Circuit Breaker 리셋
      await this.resetCircuitBreaker();

      console.log(
        `📊 Google AI 사용량 기록: ${this.config.model} (분/시/일: ${minuteKey})`
      );
    } catch (error) {
      console.error('API 사용량 기록 실패:', error);
    }
  }

  /**
   * API 호출 실패 기록 (Circuit Breaker용)
   */
  async recordAPIFailure(): Promise<void> {
    try {
      const failureKey = `${this.REDIS_PREFIX}failures`;
      const count = await this.redis.incr(failureKey);
      await this.redis.expire(failureKey, 60 * 60); // 1시간 후 만료

      if (count >= this.config.circuitBreakerThreshold) {
        await this.openCircuitBreaker();
      }
    } catch (error) {
      console.error('API 실패 기록 실패:', error);
    }
  }

  /**
   * Circuit Breaker 상태 확인
   */
  private async isCircuitBreakerOpen(): Promise<boolean> {
    try {
      const blockedKey = `${this.REDIS_PREFIX}circuit_breaker`;
      const blocked = await this.redis.get(blockedKey);
      return !!blocked;
    } catch (error) {
      console.error('Circuit Breaker 상태 확인 실패:', error);
      return false;
    }
  }

  /**
   * Circuit Breaker 활성화
   */
  private async openCircuitBreaker(): Promise<void> {
    try {
      const blockedKey = `${this.REDIS_PREFIX}circuit_breaker`;
      await this.redis.set(blockedKey, 'true', { ex: 30 * 60 }); // 30분 차단
      console.warn(
        '🚨 Google AI Circuit Breaker 활성화 - 30분간 API 호출 차단'
      );
    } catch (error) {
      console.error('Circuit Breaker 활성화 실패:', error);
    }
  }

  /**
   * Circuit Breaker 리셋
   */
  private async resetCircuitBreaker(): Promise<void> {
    try {
      const failureKey = `${this.REDIS_PREFIX}failures`;
      const blockedKey = `${this.REDIS_PREFIX}circuit_breaker`;
      await this.redis.del(failureKey);
      await this.redis.del(blockedKey);
    } catch (error) {
      console.error('Circuit Breaker 리셋 실패:', error);
    }
  }

  /**
   * 현재 할당량 상태 조회 (2025년 업데이트: 분당 사용량 추가)
   */
  async getQuotaStatus(): Promise<QuotaStatus> {
    try {
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const currentHour = `${today}:${now.getHours()}`;
      const currentMinute = `${today}:${now.getHours()}:${now.getMinutes()}`;

      const [
        dailyUsed,
        hourlyUsed,
        minuteUsed,
        testUsed,
        lastHealthCheck,
        circuitBreakerCount,
        isBlocked,
      ] = await Promise.all([
        this.redis.get(`${this.REDIS_PREFIX}daily:${today}`),
        this.redis.get(`${this.REDIS_PREFIX}hourly:${currentHour}`),
        this.redis.get(`${this.REDIS_PREFIX}minute:${currentMinute}`),
        this.redis.get(`${this.REDIS_PREFIX}test:${today}`),
        this.redis.get(`${this.REDIS_PREFIX}health_check`),
        this.redis.get(`${this.REDIS_PREFIX}failures`),
        this.isCircuitBreakerOpen(),
      ]);

      const dailyUsedCount = parseInt(dailyUsed as string) || 0;
      const minuteUsedCount = parseInt(minuteUsed as string) || 0;

      return {
        dailyUsed: dailyUsedCount,
        hourlyUsed: parseInt(hourlyUsed as string) || 0,
        minuteUsed: minuteUsedCount,
        testUsed: parseInt(testUsed as string) || 0,
        lastHealthCheck: parseInt(lastHealthCheck as string) || 0,
        circuitBreakerCount: parseInt(circuitBreakerCount as string) || 0,
        isBlocked,
        model: this.config.model,
        remainingDaily: Math.max(0, this.config.dailyLimit - dailyUsedCount),
        remainingMinute: Math.max(0, this.config.minuteLimit - minuteUsedCount),
      };
    } catch (error) {
      console.error('할당량 상태 조회 실패:', error);
      return {
        dailyUsed: 0,
        hourlyUsed: 0,
        minuteUsed: 0,
        testUsed: 0,
        lastHealthCheck: 0,
        circuitBreakerCount: 0,
        isBlocked: false,
        model: this.config.model || 'gemini-2.0-flash',
        remainingDaily: this.config.dailyLimit,
        remainingMinute: this.config.minuteLimit,
      };
    }
  }

  /**
   * 강제 Mock 모드 여부 확인
   */
  shouldUseMockMode(): boolean {
    return (
      process.env.FORCE_MOCK_GOOGLE_AI === 'true' ||
      process.env.NODE_ENV === 'test' ||
      (process.env.NODE_ENV === 'development' &&
        process.env.GOOGLE_AI_QUOTA_PROTECTION === 'strict')
    );
  }
}
