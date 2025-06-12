/**
 * 🔥 Redis 연결 관리자 v4.1 - Next.js 15 호환
 *
 * OpenManager Vibe v5.30.0 - 동적 import로 SSG 문제 해결
 * - 빌드 타임에 Redis 초기화 방지
 * - 런타임에만 연결
 * - 클라이언트/서버 분리
 */

import { env } from './env';
import { usageMonitor } from './usage-monitor';
import { Redis } from '@upstash/redis';
import { logger } from './logger';

/**
 * 🚀 스마트 Redis 클라이언트
 * 무료 티어 사용량 모니터링 + 폴백 캐시 포함
 */

// Redis 클라이언트 인터페이스 확장
interface RedisClientInterface {
  get(key: string): Promise<string | null>;
  set(key: string, value: any, options?: { ex?: number }): Promise<'OK'>;
  setex(key: string, seconds: number, value: string): Promise<'OK'>;
  del(key: string): Promise<number>;
  exists(key: string): Promise<number>;
  incr(key: string): Promise<number>;
  ping(): Promise<'PONG'>;
  pipeline(): any;
}

// Redis 클라이언트 인스턴스 (지연 초기화)
let redis: RedisClientInterface | null = null;
let isInitializing = false;

// Memory-only mock Redis 구현
class MockRedis implements RedisClientInterface {
  private store = new Map<string, any>();

  async set(key: string, value: any): Promise<any> {
    this.store.set(key, value);
    return 'OK';
  }

  async get(key: string): Promise<any> {
    return this.store.get(key);
  }

  async del(key: string): Promise<number> {
    const hadKey = this.store.has(key);
    this.store.delete(key);
    return hadKey ? 1 : 0;
  }

  async hset(key: string, field: string, value: any): Promise<number> {
    let hash = this.store.get(key) || {};
    if (typeof hash !== 'object') hash = {};
    hash[field] = value;
    this.store.set(key, hash);
    return 1;
  }

  async hget(key: string, field: string): Promise<any> {
    const hash = this.store.get(key) || {};
    return hash[field];
  }

  async hgetall(key: string): Promise<any> {
    return this.store.get(key) || {};
  }

  async publish(channel: string, message: string): Promise<number> {
    return 0; // 구독자 없음
  }

  // RedisClientInterface 필수 메서드 구현
  async setex(key: string, seconds: number, value: any): Promise<any> {
    this.store.set(key, value);
    return 'OK';
  }

  async exists(key: string): Promise<number> {
    return this.store.has(key) ? 1 : 0;
  }

  async incr(key: string): Promise<number> {
    const value = (this.store.get(key) || 0) + 1;
    this.store.set(key, value);
    return value;
  }

  async ping(): Promise<'PONG'> {
    return 'PONG';
  }

  pipeline(): any {
    return {
      setex: () => this,
      exec: async () => [],
    };
  }
}

/**
 * 🔧 Redis 클라이언트 동적 초기화
 */
async function initializeRedis(): Promise<RedisClientInterface> {
  // 빌드 타임이나 SSG 중에는 Redis 초기화 건너뛰기
  if (typeof window === 'undefined' && process.env.NODE_ENV !== 'production') {
    // 개발 환경에서만 서버 사이드 초기화 허용
  } else if (typeof window === 'undefined' && process.env.VERCEL_ENV) {
    // Vercel 빌드 중에는 초기화 건너뛰기
    console.log('⏭️ Skipping Redis initialization during build');
    throw new Error('Redis not available during build');
  }

  // ➡️ 1단계: MOCK 모드 우선 처리 (환경 변수 검증 이전)
  if (process.env.USE_MOCK_REDIS === 'true') {
    console.log(
      '✅ 모의 Redis 클라이언트 사용 (메모리 전용 - 서버 재시작 시 데이터 손실)'
    );
    return new MockRedis();
  }

  // 2단계: 실제 Redis 사용 시 필수 환경 변수 검증 (다중 소스 지원)
  const redisUrl =
    process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const redisToken =
    process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!redisUrl || !redisToken) {
    console.error('❌ Redis 환경변수 누락:');
    console.error('- KV_REST_API_URL 또는 UPSTASH_REDIS_REST_URL 필요');
    console.error('- KV_REST_API_TOKEN 또는 UPSTASH_REDIS_REST_TOKEN 필요');
    throw new Error('Redis 환경변수가 설정되지 않았습니다');
  }

  try {
    // 동적 import로 Redis 클라이언트 로드
    const { Redis } = await import('@upstash/redis');

    const redisClient = new Redis({
      url: redisUrl,
      token: redisToken,
    });

    // 연결 테스트
    await redisClient.ping();

    console.log('✅ Redis 연결 성공:', redisUrl);

    return redisClient as RedisClientInterface;
  } catch (error) {
    console.error('❌ Redis 연결 실패:', error);
    throw error;
  }
}

/**
 * 🔍 Redis 연결 상태 확인 (안전한 방식)
 */
export async function checkRedisConnection(): Promise<boolean> {
  // 빌드 타임에는 체크 건너뛰기
  if (typeof window === 'undefined' && process.env.VERCEL_ENV) {
    console.log('⏭️ Skipping Redis check during build');
    return false;
  }

  try {
    if (!redis && !isInitializing) {
      isInitializing = true;
      redis = await initializeRedis();
      isInitializing = false;
    }

    if (!redis) {
      return false;
    }

    const result = await redis.ping();
    console.log('🔔 Redis Ping:', result);
    return true;
  } catch (error) {
    console.warn('⚠️ Redis 연결 확인 실패:', error);
    isInitializing = false;
    return false;
  }
}

/**
 * 🚀 Redis 클라이언트 가져오기 (안전한 자동 초기화)
 */
export async function getRedisClient(): Promise<RedisClientInterface | null> {
  // 빌드 타임에는 null 반환
  if (typeof window === 'undefined' && process.env.VERCEL_ENV) {
    console.log('⏭️ Redis not available during build');
    return null;
  }

  if (!redis && !isInitializing) {
    try {
      isInitializing = true;
      redis = await initializeRedis();
      isInitializing = false;
    } catch (error) {
      console.warn('Redis initialization failed:', error);
      isInitializing = false;
      return null;
    }
  }

  return redis;
}

/**
 * 🔧 Redis 연결 종료
 */
export async function closeRedisConnection() {
  if (redis) {
    try {
      // Upstash Redis는 quit이 필요하지 않음
      redis = null;
      isInitializing = false;
      console.log('✅ Redis 연결 종료됨');
    } catch (error) {
      console.error('❌ Redis 연결 종료 실패:', error);
      throw error;
    }
  }
}

// 스마트 Redis 클라이언트 래퍼
class SmartRedisClient {
  private fallbackCache = new Map<string, { value: any; expiry: number }>();

  // GET 작업 (사용량 체크 포함)
  async get<T = string>(key: string): Promise<T | null> {
    // 무료 티어 체크
    if (!usageMonitor.canUseRedis()) {
      console.warn('🔄 Redis disabled, using fallback cache');
      return this.getFallback<T>(key);
    }

    try {
      const redisClient = await getRedisClient();

      // Redis가 사용 불가능하면 fallback 사용
      if (!redisClient) {
        return this.getFallback<T>(key);
      }

      usageMonitor.recordRedisUsage(1);
      const result = await redisClient.get(key);

      // 성공시 fallback에도 저장 (백업용)
      if (result !== null) {
        this.setFallback(key, result, Date.now() + 300000); // 5분 TTL
      }

      return result as T | null;
    } catch (error) {
      console.warn('Redis GET error, using fallback:', error);
      return this.getFallback<T>(key);
    }
  }

  // SET 작업 (사용량 체크 포함)
  async set(
    key: string,
    value: any,
    options?: { ex?: number; px?: number }
  ): Promise<string | null> {
    // fallback cache에 먼저 저장
    const expiry = options?.ex
      ? Date.now() + options.ex * 1000
      : options?.px
        ? Date.now() + options.px
        : Date.now() + 3600000; // 기본 1시간

    this.setFallback(key, value, expiry);

    // 무료 티어 체크
    if (!usageMonitor.canUseRedis()) {
      console.warn('🔄 Redis disabled, data saved to fallback only');
      return 'OK';
    }

    try {
      const redisClient = await getRedisClient();

      // Redis가 사용 불가능하면 fallback만 사용
      if (!redisClient) {
        console.warn('🔄 Redis not available, data saved to fallback only');
        return 'OK';
      }

      usageMonitor.recordRedisUsage(1);
      return await redisClient.set(key, value, options);
    } catch (error) {
      console.warn('Redis SET error, data saved to fallback:', error);
      return 'OK';
    }
  }

  // DEL 작업
  async del(key: string): Promise<number> {
    this.fallbackCache.delete(key);

    if (!usageMonitor.canUseRedis()) {
      return 1; // fallback에서만 삭제
    }

    try {
      const redisClient = await getRedisClient();

      if (!redisClient) {
        return 1; // fallback에서만 삭제됨
      }

      usageMonitor.recordRedisUsage(1);
      return await redisClient.del(key);
    } catch (error) {
      console.warn('Redis DEL error:', error);
      return 1;
    }
  }

  // EXISTS 작업
  async exists(key: string): Promise<number> {
    // fallback 먼저 체크
    if (this.fallbackCache.has(key)) {
      const item = this.fallbackCache.get(key)!;
      if (Date.now() < item.expiry) {
        return 1;
      } else {
        this.fallbackCache.delete(key);
      }
    }

    if (!usageMonitor.canUseRedis()) {
      return 0;
    }

    try {
      const redisClient = await getRedisClient();

      if (!redisClient) {
        return 0;
      }

      usageMonitor.recordRedisUsage(1);
      return await redisClient.exists(key);
    } catch (error) {
      console.warn('Redis EXISTS error:', error);
      return 0;
    }
  }

  // INCR 작업
  async incr(key: string): Promise<number> {
    // fallback에서 증가
    const fallbackKey = `incr_${key}`;
    let fallbackValue = this.getFallback<number>(fallbackKey) || 0;
    fallbackValue += 1;
    this.setFallback(fallbackKey, fallbackValue, Date.now() + 3600000);

    if (!usageMonitor.canUseRedis()) {
      return fallbackValue;
    }

    try {
      const redisClient = await getRedisClient();

      if (!redisClient) {
        return fallbackValue;
      }

      usageMonitor.recordRedisUsage(1);
      return await redisClient.incr(key);
    } catch (error) {
      console.warn('Redis INCR error:', error);
      return fallbackValue;
    }
  }

  // Fallback 캐시 메서드들
  private getFallback<T>(key: string): T | null {
    const item = this.fallbackCache.get(key);
    if (!item) return null;

    if (Date.now() > item.expiry) {
      this.fallbackCache.delete(key);
      return null;
    }

    return item.value as T;
  }

  private setFallback(key: string, value: any, expiry: number): void {
    this.fallbackCache.set(key, { value, expiry });
  }

  // 사용량 상태 확인
  getUsageStatus() {
    return usageMonitor.getUsageStatus().redis;
  }

  // 수동 제어
  enable() {
    usageMonitor.forceEnable('redis');
  }

  disable() {
    usageMonitor.disable('redis');
  }

  // 캐시 정리
  clearFallbackCache() {
    this.fallbackCache.clear();
    console.log('🧹 Redis fallback cache cleared');
  }

  // 만료된 캐시 정리
  cleanupExpiredCache() {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, item] of this.fallbackCache.entries()) {
      if (now > item.expiry) {
        this.fallbackCache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`🧹 Cleaned ${cleaned} expired cache entries`);
    }
  }
}

// 스마트 Redis 클라이언트 인스턴스
export const smartRedis = new SmartRedisClient();

// 기존 호환성을 위한 기본 export
export { redis };
export default smartRedis;
