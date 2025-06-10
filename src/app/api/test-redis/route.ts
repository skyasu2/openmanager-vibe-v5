import { NextRequest, NextResponse } from 'next/server';
import { Redis } from 'ioredis';
import { logger } from '@/utils/enhanced-logging';

/**
 * 🔴 Redis 연결 테스트 API
 * GET /api/test-redis
 */
export async function GET(request: NextRequest) {
  try {
    // Upstash Redis 연결 설정
    const redis = new Redis({
      host: 'charming-condor-46598.upstash.io',
      port: 6379,
      password: 'AbYGAAIjcDE5MjNmYjhiZDkwOGQ0MTUyOGFiZjUyMmQ0YTkyMzIwM3AxMA',
      tls: {}, // TLS 활성화 (Upstash 필수)
      enableReadyCheck: false,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      connectTimeout: 10000,
      commandTimeout: 5000,
    });

    // 테스트 시작
    const startTime = Date.now();

    // 1. PING 테스트
    const pingResult = await redis.ping();
    const pingTime = Date.now() - startTime;

    // 2. 읽기/쓰기 테스트
    const testKey = 'openmanager:api-test';
    const testValue = {
      timestamp: new Date().toISOString(),
      test: 'api-endpoint',
    };

    await redis.set(testKey, JSON.stringify(testValue), 'EX', 60);
    const retrieved = await redis.get(testKey);
    await redis.del(testKey);

    // 3. 메모리 정보
    const info = await redis.info('memory');
    const memoryMatch = info.match(/used_memory_human:(.+)/);
    const memoryUsage = memoryMatch ? memoryMatch[1].trim() : 'Unknown';

    // 4. 키 개수
    const keyCount = await redis.dbsize();

    // 연결 정리
    await redis.quit();

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      redisTest: {
        ping: {
          result: pingResult,
          responseTime: pingTime + 'ms',
        },
        readWrite: {
          success: retrieved !== null,
          dataMatches: retrieved === JSON.stringify(testValue),
        },
        info: {
          memoryUsage,
          totalKeys: keyCount,
        },
      },
      message: '✅ Redis TLS 연결 및 테스트 성공!',
    });
  } catch (error) {
    logger.error('Redis 테스트 API 에러:', error);

    return NextResponse.json(
      {
        success: false,
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
        message: '❌ Redis TLS 연결 테스트 실패',
      },
      { status: 500 }
    );
  }
}
