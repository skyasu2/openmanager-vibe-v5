/**
 * 🔥 Redis 연결 관리자 v4.0
 *
 * OpenManager Vibe v5.30.0 - 실제 Redis만 사용
 * - 더미 모드 완전 제거
 * - 환경변수 필수 요구
 * - 프로덕션 전용 설정
 */

import { env } from './env';
import { Redis } from '@upstash/redis';
import { usageMonitor } from './usage-monitor';

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

// Redis 클라이언트 인스턴스
let redis: RedisClientInterface | null = null;

/**
 * 🔧 Redis 클라이언트 초기화
 */
async function initializeRedis(): Promise<RedisClientInterface> {
  if (
    !process.env.UPSTASH_REDIS_REST_URL ||
    !process.env.UPSTASH_REDIS_REST_TOKEN
  ) {
    throw new Error('Redis 환경변수가 설정되지 않았습니다');
  }

  try {
    const redisClient = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });

    // 연결 테스트
    await redisClient.ping();

    console.log('✅ Redis 연결 성공:', process.env.UPSTASH_REDIS_REST_URL);

    return redisClient as RedisClientInterface;
  } catch (error) {
    console.error('❌ Redis 연결 실패:', error);
    throw error;
  }
}

/**
 * 🔍 Redis 연결 상태 확인
 */
export async function checkRedisConnection() {
  try {
    if (!redis) {
      redis = await initializeRedis();
    }

    const result = await redis.ping();
    console.log('🔔 Redis Ping:', result);
    return true;
  } catch (error) {
    console.warn('⚠️ Redis 연결 확인 실패:', error);
    return false;
  }
}

/**
 * 🚀 Redis 클라이언트 가져오기 (자동 초기화)
 */
export async function getRedisClient(): Promise<RedisClientInterface> {
  if (!redis) {
    redis = await initializeRedis();
  }

  if (!redis) {
    throw new Error('Redis 클라이언트를 초기화할 수 없습니다');
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
