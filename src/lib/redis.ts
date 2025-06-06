/**
 * 🔥 Redis 연결 관리자 v4.0
 * 
 * OpenManager Vibe v5.30.0 - 실제 Redis만 사용
 * - 더미 모드 완전 제거
 * - 환경변수 필수 요구
 * - 프로덕션 전용 설정
 */

import { env } from './env';

// Redis 클라이언트 타입 정의
interface RedisClientInterface {
  get(key: string): Promise<string | null>;
  set(key: string, value: any, options?: { ex?: number }): Promise<'OK'>;
  setex(key: string, seconds: number, value: string): Promise<'OK'>;
  del(key: string): Promise<number>;
  ping(): Promise<'PONG'>;
  pipeline(): any;
  quit(): Promise<'OK'>;
}

// Redis 클라이언트 인스턴스
let redis: RedisClientInterface | null = null;

/**
 * 🔧 실제 Redis 클라이언트 초기화
 */
async function initializeRedis(): Promise<RedisClientInterface> {
  // 이미 초기화된 경우
  if (redis) {
    return redis;
  }

  try {
    // 브라우저 환경 체크
    if (typeof window !== 'undefined') {
      throw new Error('Redis는 서버 환경에서만 사용할 수 있습니다');
    }

    // Redis 라이브러리 동적 import
    const { Redis } = await import('ioredis');
    
    console.log('🔧 실제 Redis 연결 시도...');
    
    const redisClient = new Redis(env.UPSTASH_REDIS_REST_URL, {
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      connectTimeout: 10000,
      commandTimeout: 5000,
      enableOfflineQueue: false,
    });

    // 연결 테스트
    await redisClient.ping();
    console.log('✅ Redis 연결 성공');
    
    redis = redisClient as any;
    return redis as RedisClientInterface;

  } catch (error) {
    console.error('❌ Redis 연결 실패:', error);
    throw new Error(`Redis 연결 실패: ${error instanceof Error ? error.message : error}`);
  }
}

/**
 * 🔍 Redis 연결 상태 체크
 */
export async function checkRedisConnection() {
  try {
    if (!redis) {
      await initializeRedis();
    }

    if (!redis) {
      throw new Error('Redis 초기화 실패');
    }

    const response = await redis.ping();
    return { 
      status: 'connected' as const, 
      message: `Redis 연결됨: ${response}`,
      url: env.UPSTASH_REDIS_REST_URL
    };

  } catch (error) {
    console.error('❌ Redis 연결 상태 체크 실패:', error);
    throw error;
  }
}

/**
 * 📡 Redis 클라이언트 인스턴스 가져오기
 */
export async function getRedisClient(): Promise<RedisClientInterface> {
  if (!redis) {
    await initializeRedis();
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
      await redis.quit();
      redis = null;
      console.log('✅ Redis 연결 종료됨');
    } catch (error) {
      console.error('❌ Redis 연결 종료 실패:', error);
      throw error;
    }
  }
}

export { redis }; 