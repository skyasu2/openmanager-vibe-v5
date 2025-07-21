#!/usr/bin/env node

/**
 * 🚀 Redis Mock 서버 데이터 초기화 스크립트
 *
 * Google Cloud VM 대신 Redis에 미리 서버 데이터를 저장하고
 * 실시간처럼 보이게 timestamp만 업데이트하는 방식으로 전환
 */

require('dotenv').config({ path: '.env.local' });
const { Redis } = require('@upstash/redis');

// Mock 서버 데이터 템플릿
const MOCK_SERVERS = [
  {
    id: 'gcp-prod-001',
    name: 'Production Server 01',
    hostname: 'gcp-prod-001.asia-northeast3.c.openmanager',
    type: 'compute-engine',
    zone: 'asia-northeast3-a',
    projectId: 'openmanager-vibe',
    status: 'healthy',
    location: 'Seoul',
    services: ['nginx', 'mysql', 'redis'],
    metrics: {
      cpu: { usage: 35, cores: 4 },
      memory: { usage: 62, total: 16384, available: 6225 },
      disk: { usage: 45, total: 100, io: { read: 120, write: 80 } },
      network: { rx: 1024, tx: 512, connections: 150 },
    },
    uptime: 2592000, // 30 days
    source: 'redis-mock',
  },
  {
    id: 'gcp-prod-002',
    name: 'Production Server 02',
    hostname: 'gcp-prod-002.asia-northeast3.c.openmanager',
    type: 'compute-engine',
    zone: 'asia-northeast3-b',
    projectId: 'openmanager-vibe',
    status: 'healthy',
    location: 'Seoul',
    services: ['apache', 'postgresql', 'memcached'],
    metrics: {
      cpu: { usage: 42, cores: 4 },
      memory: { usage: 55, total: 16384, available: 7372 },
      disk: { usage: 38, total: 100, io: { read: 95, write: 65 } },
      network: { rx: 890, tx: 445, connections: 120 },
    },
    uptime: 1728000, // 20 days
    source: 'redis-mock',
  },
  {
    id: 'gcp-prod-003',
    name: 'Production Server 03',
    hostname: 'gcp-prod-003.asia-northeast3.c.openmanager',
    type: 'cloud-run',
    zone: 'asia-northeast3-c',
    projectId: 'openmanager-vibe',
    status: 'warning',
    location: 'Seoul',
    services: ['node.js', 'mongodb', 'rabbitmq'],
    metrics: {
      cpu: { usage: 78, cores: 8 },
      memory: { usage: 82, total: 32768, available: 5898 },
      disk: { usage: 67, total: 200, io: { read: 180, write: 120 } },
      network: { rx: 2048, tx: 1024, connections: 250 },
    },
    uptime: 864000, // 10 days
    source: 'redis-mock',
  },
  {
    id: 'gcp-prod-004',
    name: 'Production Server 04',
    hostname: 'gcp-prod-004.us-central1.c.openmanager',
    type: 'gke-node',
    zone: 'us-central1-a',
    projectId: 'openmanager-vibe',
    status: 'healthy',
    location: 'Oregon',
    services: ['kubernetes', 'prometheus'],
    metrics: {
      cpu: { usage: 25, cores: 16 },
      memory: { usage: 45, total: 65536, available: 36044 },
      disk: { usage: 30, total: 500, io: { read: 200, write: 150 } },
      network: { rx: 3072, tx: 2048, connections: 400 },
    },
    uptime: 5184000, // 60 days
    source: 'redis-mock',
  },
];

// Redis 연결 설정
function getRedisClient() {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token =
    process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    throw new Error('Redis 환경 변수가 설정되지 않았습니다.');
  }

  return new Redis({
    url,
    token,
    retry: {
      retries: 3,
      backoff: retryCount => Math.min(retryCount * 300, 1000),
    },
  });
}

// 동적 메트릭 생성 (실시간처럼 보이게)
function generateDynamicMetrics(baseMetrics) {
  const variance = 0.1; // 10% 변동

  return {
    cpu: {
      ...baseMetrics.cpu,
      usage: Math.min(
        100,
        Math.max(
          0,
          baseMetrics.cpu.usage +
            (Math.random() - 0.5) * baseMetrics.cpu.usage * variance
        )
      ),
    },
    memory: {
      ...baseMetrics.memory,
      usage: Math.min(
        100,
        Math.max(
          0,
          baseMetrics.memory.usage +
            (Math.random() - 0.5) * baseMetrics.memory.usage * variance
        )
      ),
    },
    disk: {
      ...baseMetrics.disk,
      usage: Math.min(
        100,
        Math.max(
          0,
          baseMetrics.disk.usage + (Math.random() - 0.5) * 5 // 디스크는 천천히 변화
        )
      ),
    },
    network: {
      rx: Math.max(
        0,
        baseMetrics.network.rx +
          (Math.random() - 0.5) * baseMetrics.network.rx * variance
      ),
      tx: Math.max(
        0,
        baseMetrics.network.tx +
          (Math.random() - 0.5) * baseMetrics.network.tx * variance
      ),
      connections: Math.max(
        0,
        Math.floor(
          baseMetrics.network.connections +
            (Math.random() - 0.5) * baseMetrics.network.connections * variance
        )
      ),
    },
  };
}

// 메인 실행 함수
async function setupMockServers() {
  console.log('🚀 Redis Mock 서버 데이터 초기화 시작...\n');

  try {
    const redis = getRedisClient();

    // Redis 연결 테스트
    console.log('🔗 Redis 연결 테스트...');
    await redis.ping();
    console.log('✅ Redis 연결 성공!\n');

    // 기존 서버 데이터 삭제
    console.log('🧹 기존 서버 데이터 정리 중...');
    const existingKeys = await redis.keys('openmanager:gcp:servers:*');
    if (existingKeys.length > 0) {
      for (const key of existingKeys) {
        await redis.del(key);
      }
      console.log(`✅ ${existingKeys.length}개의 기존 서버 데이터 삭제 완료\n`);
    }

    // Mock 서버 데이터 저장
    console.log('📝 새로운 Mock 서버 데이터 저장 중...');
    let savedCount = 0;

    for (const server of MOCK_SERVERS) {
      const key = `openmanager:gcp:servers:${server.id}`;

      // 동적 메트릭 생성
      const dynamicServer = {
        ...server,
        metrics: generateDynamicMetrics(server.metrics),
        lastUpdated: new Date().toISOString(),
        _isMockData: true,
        _mockVersion: '2.0',
      };

      // Redis에 저장 (30일 TTL)
      await redis.set(key, JSON.stringify(dynamicServer), {
        ex: 30 * 24 * 60 * 60,
      });
      savedCount++;

      console.log(`✅ ${server.name} (${server.id}) 저장 완료`);
    }

    console.log(`\n✅ 총 ${savedCount}개의 Mock 서버 데이터 저장 완료!`);

    // 저장된 데이터 확인
    console.log('\n📊 저장된 서버 데이터 확인:');
    const allKeys = await redis.keys('openmanager:gcp:servers:*');
    console.log(`   총 서버 수: ${allKeys.length}`);

    for (const key of allKeys) {
      const data = await redis.get(key);
      if (data) {
        const server = JSON.parse(data);
        console.log(
          `   - ${server.name}: ${server.status} (CPU: ${server.metrics.cpu.usage.toFixed(1)}%)`
        );
      }
    }

    console.log('\n🎉 Redis Mock 서버 데이터 초기화 완료!');
    console.log('💡 이제 VM에서 서버 데이터 생성 기능을 제거할 수 있습니다.');
  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
    process.exit(1);
  }
}

// 스크립트 실행
if (require.main === module) {
  setupMockServers();
}

module.exports = { setupMockServers, MOCK_SERVERS };
