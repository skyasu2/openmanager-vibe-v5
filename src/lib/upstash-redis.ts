/**
 * 🚀 Upstash Redis 클라이언트 팩토리 v1.0
 *
 * Edge Runtime 및 서버리스 환경에 최적화된 Redis 클라이언트
 * - 자동 연결 관리
 * - 글로벌 클라이언트 재사용
 * - 환경별 최적화
 */

import { Redis } from '@upstash/redis';
import { env } from './env';

// 글로벌 클라이언트 캐시 (서버리스 함수 간 공유)
declare global {
  var __upstash_redis_client: Redis | undefined;
  var __upstash_redis_initialized: boolean | undefined;
}

// Upstash Redis 설정
const UPSTASH_CONFIG = {
  // 연결 설정
  retry: {
    retries: 3, // 재시도 횟수
    backoff: (retryCount: number) => Math.min(retryCount * 100, 1000), // 지수 백오프
  },

  // 성능 설정
  automaticDeserialization: true, // 자동 역직렬화

  // 타임아웃 설정 (Upstash Redis SDK에서 지원하는 필드만)
  commandTimeout: 1000, // 명령 타임아웃 1초
} as const;

// 환경별 설정
const getEnvironmentConfig = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  const isEdgeRuntime = process.env.NEXT_RUNTIME === 'edge';
  const isServerless = !!(process.env.VERCEL || process.env.NETLIFY);

  return {
    // Edge Runtime에서는 더 짧은 타임아웃
    commandTimeout: isEdgeRuntime ? 500 : 1000,

    // 프로덕션에서는 더 많은 재시도
    retry: {
      retries: isProduction ? 5 : 3,
      backoff: (retryCount: number) => {
        const baseDelay = isEdgeRuntime ? 50 : 100;
        return Math.min(retryCount * baseDelay, 1000);
      },
    },

    // 서버리스에서는 연결 재사용 중요
    keepAlive: isServerless,
  };
};

/**
 * Upstash Redis 클라이언트 생성/재사용
 */
export function getUpstashRedis(): Redis {
  // 이미 초기화된 클라이언트가 있으면 재사용
  if (
    globalThis.__upstash_redis_client &&
    globalThis.__upstash_redis_initialized
  ) {
    return globalThis.__upstash_redis_client;
  }

  // 환경 변수 검증
  const url = env.UPSTASH_REDIS_REST_URL || env.KV_REST_API_URL;
  const token = env.UPSTASH_REDIS_REST_TOKEN || env.KV_REST_API_TOKEN;

  if (!url || !token) {
    throw new Error(
      'Upstash Redis credentials not found in environment variables'
    );
  }

  // 환경별 설정 병합
  const envConfig = getEnvironmentConfig();
  const config = {
    ...UPSTASH_CONFIG,
    ...envConfig,
    url,
    token,
  };

  // 새 클라이언트 생성
  const redis = new Redis(config);

  // 글로벌 캐시에 저장
  globalThis.__upstash_redis_client = redis;
  globalThis.__upstash_redis_initialized = true;

  console.log('✅ Upstash Redis client initialized', {
    environment: process.env.NODE_ENV,
    runtime: process.env.NEXT_RUNTIME,
    serverless: !!process.env.VERCEL || !!process.env.NETLIFY,
  });

  return redis;
}

/**
 * Redis 연결 테스트
 */
export async function testUpstashConnection(): Promise<boolean> {
  try {
    const redis = getUpstashRedis();
    const result = await redis.ping();
    console.log('✅ Upstash Redis connection test:', result);
    return result === 'PONG';
  } catch (error) {
    console.error('❌ Upstash Redis connection test failed:', error);
    return false;
  }
}

/**
 * Redis 상태 조회
 */
export async function getUpstashRedisInfo(): Promise<{
  connected: boolean;
  url: string;
  runtime: string;
  cached: boolean;
}> {
  try {
    const redis = getUpstashRedis();
    await redis.ping();

    return {
      connected: true,
      url: env.UPSTASH_REDIS_REST_URL || env.KV_REST_API_URL || 'unknown',
      runtime: process.env.NEXT_RUNTIME || 'node',
      cached: !!globalThis.__upstash_redis_client,
    };
  } catch (error) {
    return {
      connected: false,
      url: 'error',
      runtime: process.env.NEXT_RUNTIME || 'node',
      cached: false,
    };
  }
}

/**
 * 메모리 사용량 추정 (Upstash는 INFO 명령 미지원)
 */
export async function estimateMemoryUsage(): Promise<{
  estimatedMB: number;
  maxMB: number;
  usagePercent: number;
}> {
  try {
    // Upstash는 직접적인 메모리 조회 불가
    // 대신 저장된 키 수와 평균 크기로 추정
    const redis = getUpstashRedis();

    // 샘플링으로 평균 크기 추정
    const sampleKeys = ['servers:list', 'servers:summary'];
    let totalSize = 0;
    let keyCount = 0;

    for (const key of sampleKeys) {
      const value = await redis.get(key);
      if (value) {
        totalSize += JSON.stringify(value).length;
        keyCount++;
      }
    }

    const avgSizeBytes = keyCount > 0 ? totalSize / keyCount : 1024; // 기본 1KB
    const estimatedKeys = 1000; // 추정 키 수 (실제로는 DBSIZE 필요)
    const estimatedBytes = avgSizeBytes * estimatedKeys;
    const estimatedMB = estimatedBytes / (1024 * 1024);
    const maxMB = 256; // Upstash 무료 티어

    return {
      estimatedMB: Math.round(estimatedMB * 100) / 100,
      maxMB,
      usagePercent: Math.round((estimatedMB / maxMB) * 100),
    };
  } catch (error) {
    console.error('❌ Memory estimation failed:', error);
    return {
      estimatedMB: 0,
      maxMB: 256,
      usagePercent: 0,
    };
  }
}

/**
 * 배치 작업을 위한 파이프라인 헬퍼
 */
export function createPipeline() {
  const redis = getUpstashRedis();
  return redis.pipeline();
}

/**
 * 안전한 Redis 작업 래퍼
 */
export async function safeRedisOperation<T>(
  operation: () => Promise<T>,
  fallback?: T
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    console.error('❌ Redis operation failed:', error);
    if (fallback !== undefined) {
      return fallback;
    }
    throw error;
  }
}

// 타입 정의 export
export type { Redis } from '@upstash/redis';
// Pipeline은 Upstash Redis에서 제거됨 - 대신 transaction 사용
// export { Pipeline } from '@upstash/redis';
