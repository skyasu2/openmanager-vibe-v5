/**
 * 🔴 Upstash Redis TLS 연결 테스트
 * OpenManager Vibe v5 - Redis 연결 상태 확인 및 테스트
 */

import { logger } from '@/utils/enhanced-logging';

// Redis 타입 정의
type RedisType = any;

/**
 * 기본 Redis 연결 테스트
 */
export async function testRedisConnection(): Promise<boolean> {
  try {
    // 🚫 최우선: 환경변수 체크
    if (process.env.FORCE_MOCK_REDIS === 'true') {
      console.log('🎭 FORCE_MOCK_REDIS=true - Redis 연결 테스트 건너뜀');
      return true; // 목업 모드에서는 성공으로 간주
    }

    // 🧪 개발 도구 환경 체크
    if (process.env.STORYBOOK === 'true' || process.env.NODE_ENV === 'test') {
      console.log('🧪 개발 도구 환경 - Redis 연결 테스트 건너뜀');
      return true; // 개발 환경에서는 성공으로 간주
    }

    // 클라이언트 사이드에서는 테스트 불가
    if (typeof window !== 'undefined') {
      console.log('⚠️ 클라이언트 환경에서는 Redis 테스트를 수행할 수 없습니다');
      return false;
    }

    const startTime = Date.now();

    // 동적 import로 Redis 클래스 로드
    const { default: Redis } = await import('ioredis');

    // Upstash Redis 연결 설정
    const redis = new Redis({
      host: 'charming-condor-46598.upstash.io',
      port: 6379,
      password: 'AbYGAAIjcDE5MjNmYjhiZDkwOGQ0MTUyOGFiZjUyMmQ0YTkyMzIwM3AxMA',
      tls: {}, // TLS 활성화 (Upstash 필수)
      enableReadyCheck: false,
      maxRetriesPerRequest: 2,
      lazyConnect: true,
      connectTimeout: 5000,
      commandTimeout: 3000,
      retryStrategy: (times: number) => {
        if (times > 2) return null;
        return Math.min(times * 50, 2000);
      },
    });

    // 기본 연결 테스트
    await redis.ping();
    const responseTime = Date.now() - startTime;

    // 연결 정보 확인
    const info = await redis.info();
    console.log(`✅ Redis 연결 성공 (${responseTime}ms)`);
    console.log(`📊 Redis 정보: ${info.split('\n')[0]}`);

    await redis.disconnect();
    return true;
  } catch (error) {
    console.error('❌ Redis 연결 실패:', error);
    logger.error('Redis connection test failed', { error });
    return false;
  }
}

/**
 * Redis 읽기/쓰기 테스트
 */
export async function testRedisReadWrite(): Promise<boolean> {
  try {
    // 🚫 최우선: 환경변수 체크
    if (process.env.FORCE_MOCK_REDIS === 'true') {
      console.log('🎭 FORCE_MOCK_REDIS=true - Redis 읽기/쓰기 테스트 건너뜀');
      return true; // 목업 모드에서는 성공으로 간주
    }

    // 🧪 개발 도구 환경 체크
    if (process.env.STORYBOOK === 'true' || process.env.NODE_ENV === 'test') {
      console.log('🧪 개발 도구 환경 - Redis 읽기/쓰기 테스트 건너뜀');
      return true; // 개발 환경에서는 성공으로 간주
    }

    // 클라이언트 사이드에서는 테스트 불가
    if (typeof window !== 'undefined') {
      console.log('⚠️ 클라이언트 환경에서는 Redis 테스트를 수행할 수 없습니다');
      return false;
    }

    // 동적 import로 Redis 클래스 로드
    const { default: Redis } = await import('ioredis');

    const redis = new Redis({
      host: 'charming-condor-46598.upstash.io',
      port: 6379,
      password: 'AbYGAAIjcDE5MjNmYjhiZDkwOGQ0MTUyOGFiZjUyMmQ0YTkyMzIwM3AxMA',
      tls: {},
      maxRetriesPerRequest: 2,
      lazyConnect: true,
    });

    const testKey = 'test:connection:' + Date.now();
    const testValue = {
      message: 'Redis connection test',
      timestamp: Date.now(),
    };

    // 쓰기 테스트
    await redis.set(testKey, JSON.stringify(testValue), 'EX', 60); // 60초 TTL
    console.log('✅ Redis 쓰기 테스트 성공');

    // 읽기 테스트
    const retrieved = await redis.get(testKey);
    if (!retrieved || JSON.parse(retrieved).message !== testValue.message) {
      throw new Error('데이터 검증 실패');
    }
    console.log('✅ Redis 읽기 테스트 성공');

    // 정리
    await redis.del(testKey);
    await redis.disconnect();

    return true;
  } catch (error) {
    console.error('❌ Redis 읽기/쓰기 테스트 실패:', error);
    return false;
  }
}

/**
 * Redis 성능 테스트
 */
export async function testRedisPerformance(): Promise<{
  latency: number;
  throughput: number;
}> {
  try {
    // 클라이언트 사이드에서는 테스트 불가
    if (typeof window !== 'undefined') {
      return { latency: 0, throughput: 0 };
    }

    // 동적 import로 Redis 클래스 로드
    const { default: Redis } = await import('ioredis');

    const redis = new Redis({
      host: 'charming-condor-46598.upstash.io',
      port: 6379,
      password: 'AbYGAAIjcDE5MjNmYjhiZDkwOGQ0MTUyOGFiZjUyMmQ0YTkyMzIwM3AxMA',
      tls: {},
      maxRetriesPerRequest: 2,
      lazyConnect: true,
    });

    // 지연시간 테스트
    const latencyStart = Date.now();
    await redis.ping();
    const latency = Date.now() - latencyStart;

    // 처리량 테스트 (간단한 set/get 반복)
    const throughputStart = Date.now();
    const operations = 10;

    for (let i = 0; i < operations; i++) {
      await redis.set('perf:test', 'performance-test');
    }

    for (let i = 0; i < operations; i++) {
      await redis.get('perf:test');
    }

    await redis.del('perf:test');

    const throughputTime = Date.now() - throughputStart;
    const throughput = Math.round((operations * 2 * 1000) / throughputTime); // ops/sec

    await redis.disconnect();

    console.log(
      `📊 Redis 성능: 지연시간 ${latency}ms, 처리량 ${throughput} ops/sec`
    );

    return { latency, throughput };
  } catch (error) {
    console.error('❌ Redis 성능 테스트 실패:', error);
    return { latency: -1, throughput: -1 };
  }
}

/**
 * 종합 Redis 테스트 실행
 */
export async function runFullRedisTest(): Promise<{
  connection: boolean;
  readWrite: boolean;
  performance: { latency: number; throughput: number };
}> {
  console.log('🔴 Redis 종합 테스트 시작...');

  const results = {
    connection: await testRedisConnection(),
    readWrite: await testRedisReadWrite(),
    performance: await testRedisPerformance(),
  };

  console.log('🔴 Redis 테스트 완료:', results);

  return results;
}

// Redis 인스턴스는 더 이상 export하지 않음 (동적 import 사용)
