/**
 * 🔴 Upstash Redis TLS 연결 테스트
 * OpenManager Vibe v5 - Redis 연결 상태 확인 및 테스트
 */

import { Redis } from 'ioredis';
import { logger } from '@/utils/enhanced-logging';

// Upstash Redis 연결 설정
const redis = new Redis({
  host: 'charming-condor-46598.upstash.io',
  port: 6379,
  password: 'AbYGAAIjcDE5MjNmYjhiZDkwOGQ0MTUyOGFiZjUyMmQ0YTkyMzIwM3AxMA',
  tls: {}, // TLS 활성화 (Upstash 필수)
  enableReadyCheck: false,
  maxRetriesPerRequest: 3,
  lazyConnect: true, // 지연 연결
  connectTimeout: 10000, // 10초 타임아웃
  commandTimeout: 5000, // 5초 명령어 타임아웃
});

/**
 * 기본 Redis 연결 테스트
 */
export async function testRedisConnection(): Promise<boolean> {
  try {
    const startTime = Date.now();

    // 1. 기본 PING 테스트
    const result = await redis.ping();
    const responseTime = Date.now() - startTime;

    logger.info(`✅ Redis 연결 성공: ${result} (${responseTime}ms)`);

    return true;
  } catch (error) {
    logger.error('❌ Redis 연결 실패:', error);
    return false;
  }
}

/**
 * Redis 상세 정보 조회
 */
export async function getRedisInfo(): Promise<{
  server: any;
  memory: any;
  keyspace: any;
  stats: any;
} | null> {
  try {
    const info = await redis.info();
    const sections = info.split('\r\n\r\n');

    const parseSection = (sectionName: string) => {
      const section = sections.find(s => s.startsWith(`# ${sectionName}`));
      if (!section) return {};

      const lines = section.split('\r\n').slice(1);
      const result: Record<string, string> = {};

      lines.forEach(line => {
        if (line && line.includes(':')) {
          const [key, value] = line.split(':');
          result[key] = value;
        }
      });

      return result;
    };

    return {
      server: parseSection('Server'),
      memory: parseSection('Memory'),
      keyspace: parseSection('Keyspace'),
      stats: parseSection('Stats'),
    };
  } catch (error) {
    logger.error('❌ Redis 정보 조회 실패:', error);
    return null;
  }
}

/**
 * Redis 읽기/쓰기 테스트
 */
export async function testRedisReadWrite(): Promise<boolean> {
  try {
    const testKey = 'openmanager:test:connection';
    const testValue = {
      timestamp: new Date().toISOString(),
      server: 'vibe-v5',
      test: true,
    };

    // 쓰기 테스트
    await redis.set(testKey, JSON.stringify(testValue), 'EX', 60); // 60초 TTL
    logger.info('📝 Redis 쓰기 성공');

    // 읽기 테스트
    const retrieved = await redis.get(testKey);
    if (retrieved) {
      const parsed = JSON.parse(retrieved);
      logger.info('📖 Redis 읽기 성공:', parsed);
    }

    // 삭제 테스트
    await redis.del(testKey);
    logger.info('🗑️ Redis 삭제 성공');

    return true;
  } catch (error) {
    logger.error('❌ Redis 읽기/쓰기 테스트 실패:', error);
    return false;
  }
}

/**
 * Redis 성능 측정
 */
export async function measureRedisPerformance(): Promise<{
  pingLatency: number;
  writeLatency: number;
  readLatency: number;
} | null> {
  try {
    // PING 지연시간
    const pingStart = Date.now();
    await redis.ping();
    const pingLatency = Date.now() - pingStart;

    // 쓰기 지연시간
    const writeStart = Date.now();
    await redis.set('perf:test', 'performance-test');
    const writeLatency = Date.now() - writeStart;

    // 읽기 지연시간
    const readStart = Date.now();
    await redis.get('perf:test');
    const readLatency = Date.now() - readStart;

    // 정리
    await redis.del('perf:test');

    const performance = {
      pingLatency,
      writeLatency,
      readLatency,
    };

    logger.info('⚡ Redis 성능 측정 완료:', performance);
    return performance;
  } catch (error) {
    logger.error('❌ Redis 성능 측정 실패:', error);
    return null;
  }
}

/**
 * 종합 Redis 상태 체크
 */
export async function comprehensiveRedisCheck(): Promise<{
  connected: boolean;
  info: any;
  performance: any;
}> {
  logger.info('🔴 Redis 종합 상태 체크 시작...');

  const results = {
    connected: false,
    info: null,
    performance: null,
  };

  try {
    // 1. 연결 테스트
    results.connected = await testRedisConnection();

    if (results.connected) {
      // 2. 읽기/쓰기 테스트
      await testRedisReadWrite();

      // 3. 상세 정보 조회
      results.info = await getRedisInfo();

      // 4. 성능 측정
      results.performance = await measureRedisPerformance();
    }

    logger.info('🎉 Redis 종합 상태 체크 완료!');
    return results;
  } catch (error) {
    logger.error('❌ Redis 종합 상태 체크 실패:', error);
    return results;
  }
}

// 기본 내보내기
export { redis };
