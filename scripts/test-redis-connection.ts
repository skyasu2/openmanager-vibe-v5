#!/usr/bin/env node
/**
 * 🔍 Redis 연결 테스트 스크립트
 *
 * 현재 환경에서 어떤 Redis가 사용되는지 확인하고
 * 실제 연결 테스트를 수행합니다.
 */

import { config } from 'dotenv';
import {
  getRedisClient,
  testRedisConnection,
  getRedisStats,
} from '../src/lib/redis';
import { getCurrentEnvironment } from '../src/config/environment';

// 환경변수 로드
config({ path: '.env.local' });

async function main() {
  console.log('🔍 Redis 연결 테스트 시작...\n');

  // 1. 환경 정보 출력
  const env = getCurrentEnvironment();
  console.log('📋 환경 정보:');
  console.log(`  - NODE_ENV: ${process.env.NODE_ENV}`);
  console.log(`  - Platform: ${env.platform}`);
  console.log(`  - Redis 활성화: ${env.database.redis.enabled}`);
  console.log(`  - Redis 상태: ${env.database.redis.connectionStatus}`);
  console.log(
    `  - FORCE_MOCK_REDIS: ${process.env.FORCE_MOCK_REDIS || 'false'}`
  );
  console.log(`  - USE_REAL_REDIS: ${process.env.USE_REAL_REDIS || 'false'}`);
  console.log();

  // 2. Redis 환경변수 확인
  console.log('🔑 Redis 환경변수:');
  const redisEnvVars = {
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL
      ? '✅ 설정됨'
      : '❌ 없음',
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN
      ? '✅ 설정됨'
      : '❌ 없음',
    KV_REST_API_URL: process.env.KV_REST_API_URL ? '✅ 설정됨' : '❌ 없음',
    KV_REST_API_TOKEN: process.env.KV_REST_API_TOKEN ? '✅ 설정됨' : '❌ 없음',
  };

  Object.entries(redisEnvVars).forEach(([key, value]) => {
    console.log(`  - ${key}: ${value}`);
  });
  console.log();

  // 3. Redis 연결 테스트
  console.log('🔌 Redis 연결 테스트:');
  try {
    const isConnected = await testRedisConnection();
    console.log(`  - 연결 상태: ${isConnected ? '✅ 성공' : '❌ 실패'}`);
  } catch (error) {
    console.log(`  - 연결 상태: ❌ 오류 발생`);
    console.error(`  - 오류: ${error}`);
  }
  console.log();

  // 4. Redis 클라이언트 정보
  console.log('📊 Redis 클라이언트 정보:');
  try {
    const client = await getRedisClient();
    if (client) {
      // 테스트 키-값 설정
      await client.set('test-key', 'test-value', { ex: 60 });
      const value = await client.get('test-key');
      console.log(
        `  - 테스트 쓰기/읽기: ${value === 'test-value' ? '✅ 성공' : '❌ 실패'}`
      );

      // 삭제
      await client.del('test-key');
      console.log(`  - 테스트 삭제: ✅ 완료`);
    } else {
      console.log(`  - 클라이언트: ❌ 생성 실패`);
    }
  } catch (error) {
    console.log(`  - 클라이언트: ❌ 오류 발생`);
    console.error(`  - 오류: ${error}`);
  }
  console.log();

  // 5. Redis 통계 정보
  console.log('📈 Redis 통계:');
  try {
    const stats = await getRedisStats();
    console.log(`  - Redis 연결: ${stats.connected ? '✅' : '❌'}`);

    if (stats.mockRedis) {
      console.log('  - Mock Redis 통계:');
      console.log(`    - 저장된 키: ${stats.mockRedis.size}개`);
      console.log(
        `    - 히트율: ${(stats.mockRedis.hitRate * 100).toFixed(1)}%`
      );
      console.log(`    - 메모리 사용: ${stats.mockRedis.memoryUsageKB}KB`);
    }

    if (stats.realRedis) {
      console.log('  - Real Redis 상태:', stats.realRedis.status);
    }
  } catch (error) {
    console.log(`  - 통계: ❌ 조회 실패`);
    console.error(`  - 오류: ${error}`);
  }
  console.log();

  // 6. 권장사항
  console.log('💡 권장사항:');

  if (!env.database.redis.enabled) {
    console.log('  - Redis가 비활성화되어 있습니다. 환경변수를 설정하세요.');
  }

  if (process.env.NODE_ENV === 'development' && !process.env.USE_REAL_REDIS) {
    console.log('  - 개발 환경에서 Dev Mock Redis를 사용 중입니다.');
    console.log(
      '  - 실제 Redis를 사용하려면 USE_REAL_REDIS=true를 설정하세요.'
    );
  }

  if (
    process.env.NODE_ENV === 'production' &&
    process.env.FORCE_MOCK_REDIS === 'true'
  ) {
    console.log('  - ⚠️ 프로덕션에서 FORCE_MOCK_REDIS가 활성화되어 있습니다!');
    console.log('  - 실제 Redis를 사용하려면 FORCE_MOCK_REDIS를 제거하세요.');
  }

  console.log('\n✅ Redis 연결 테스트 완료');
}

// 실행
main().catch(error => {
  console.error('❌ 테스트 실행 중 오류:', error);
  process.exit(1);
});
