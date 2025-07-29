/**
 * 🔥 Redis 연결 관리자 v4.3 - 하이브리드 전략
 *
 * OpenManager Vibe v5.30.0 - 스마트 하이브리드 시스템
 * - 사용량 많은 작업: Enhanced Mock Redis (빌드, 대량 처리)
 * - 일반 작업: 실제 Upstash Redis (keep-alive, 캐싱)
 * - 자동 전환: 부하 상황에 따른 동적 선택
 */

import { getDecryptedRedisConfig } from '@/lib/config/runtime-env-decryptor';
import { env } from './env';
import { DevMockRedis } from './redis/dev-mock-redis';

// Edge Runtime 호환성을 위해 동적 import 사용
let Redis: any;
try {
  // Node.js 환경에서만 ioredis 로드
  if (
    typeof process !== 'undefined' &&
    process.versions &&
    process.versions.node
  ) {
    Redis = require('ioredis');
  }
} catch {
  // Edge Runtime에서는 무시
  console.warn('⚠️ ioredis를 사용할 수 없는 환경입니다 (Edge Runtime)');
}

/**
 * 🚀 스마트 Redis 클라이언트
 * Redis 장애 시 완전한 메모리 폴백 + 성능 최적화
 */

// Redis 클라이언트 인터페이스 확장
export interface RedisClientInterface {
  get(key: string): Promise<string | null>;
  set(key: string, value: any, options?: { ex?: number }): Promise<'OK'>;
  setex(key: string, seconds: number, value: string): Promise<'OK'>;
  del(key: string): Promise<number>;
  exists(key: string): Promise<number>;
  incr(key: string): Promise<number>;
  ping(): Promise<string>;
  pipeline(): any;
  // Set 관련 메서드 추가
  sadd(key: string, ...members: string[]): Promise<number>;
  srem(key: string, ...members: string[]): Promise<number>;
  scard(key: string): Promise<number>;
  smembers(key: string): Promise<string[]>;
  expire(key: string, seconds: number): Promise<number>;
}

// Redis 클라이언트 인스턴스들 (서버리스 환경에서 재사용)
let realRedis: RedisClientInterface | null = null;
let unifiedMockRedis: UnifiedMockRedis | null = null;
let isInitializing = false;

// 글로벌 Redis 클라이언트 캐시 (서버리스 함수 간 공유)
declare global {
  var __redis_client_cache: RedisClientInterface | undefined;
  var __redis_client_type: 'real' | 'mock' | undefined;
}

// 🎯 하이브리드 전략 설정
const HYBRID_STRATEGY = {
  // Mock Redis 사용 조건 (사용량 많은 작업)
  useMockFor: [
    'build',
    'ci',
    'test',
    'bulk-data',
    'data-generation',
    'server-simulation',
    'ai-training',
    'vector-processing',
  ],

  // Real Redis 사용 조건 (가벼운 작업)
  useRealFor: [
    'keep-alive',
    'simple-cache',
    'user-session',
    'api-response',
    'metrics-cache',
    'status-check',
    'system-control',
    'system-state',
  ],

  // 자동 전환 임계값
  thresholds: {
    maxRequestsPerMinute: 50, // 분당 50회 초과 시 Mock 전환
    maxDataSizeKB: 100, // 100KB 초과 데이터는 Mock 사용
    maxConcurrentOps: 10, // 동시 작업 10개 초과 시 Mock 전환
  },
};

// 🧠 통합 Mock Redis 구현 (Dev Mock Redis 기반)
class UnifiedMockRedis implements RedisClientInterface {
  private devMockRedis: DevMockRedis;

  constructor(options?: {
    enablePersistence?: boolean;
    enableDevTools?: boolean;
  }) {
    this.devMockRedis = new DevMockRedis({
      enablePersistence:
        options?.enablePersistence ?? process.env.NODE_ENV === 'development',
      enableDevTools:
        options?.enableDevTools ?? process.env.NODE_ENV === 'development',
      maxMemoryMB: 100,
      persistPath: '.redis-mock-data',
    });
  }

  // RedisClientInterface 구현 - DevMockRedis 메서드 위임
  async get(key: string): Promise<string | null> {
    return this.devMockRedis.get(key);
  }

  async set(key: string, value: any, options?: { ex?: number }): Promise<'OK'> {
    await this.devMockRedis.set(key, value, options);
    return 'OK';
  }

  async setex(key: string, seconds: number, value: string): Promise<'OK'> {
    await this.devMockRedis.set(key, value, { ex: seconds });
    return 'OK';
  }

  async del(key: string): Promise<number> {
    return this.devMockRedis.del(key);
  }

  async exists(key: string): Promise<number> {
    return this.devMockRedis.exists(key);
  }

  async incr(key: string): Promise<number> {
    return this.devMockRedis.incr(key);
  }

  async ping(): Promise<string> {
    const result = await this.devMockRedis.ping();
    return result;
  }

  async sadd(key: string, ...members: string[]): Promise<number> {
    return this.devMockRedis.sadd(key, ...members);
  }

  async srem(key: string, ...members: string[]): Promise<number> {
    return this.devMockRedis.srem(key, ...members);
  }

  async scard(key: string): Promise<number> {
    const members = await this.devMockRedis.smembers(key);
    return members.length;
  }

  async smembers(key: string): Promise<string[]> {
    return this.devMockRedis.smembers(key);
  }

  async expire(key: string, seconds: number): Promise<number> {
    return this.devMockRedis.expire(key, seconds);
  }

  pipeline(): any {
    // 간단한 파이프라인 구현
    const commands: Array<() => Promise<any>> = [];

    return {
      setex: (key: string, seconds: number, value: any) => {
        commands.push(() => this.setex(key, seconds, value));
        return this;
      },
      set: (key: string, value: any, options?: { ex?: number }) => {
        commands.push(() => this.set(key, value, options));
        return this;
      },
      get: (key: string) => {
        commands.push(() => this.get(key));
        return this;
      },
      exec: async (): Promise<any[]> => {
        const results = await Promise.all(commands.map(cmd => cmd()));
        commands.length = 0; // 명령어 배열 초기화
        return results;
      },
    };
  }

  // 추가 유틸리티 메서드
  async hset(key: string, field: string, value: any): Promise<number> {
    return this.devMockRedis.hset(key, field, value);
  }

  async hget(key: string, field: string): Promise<string | null> {
    return this.devMockRedis.hget(key, field);
  }

  async hgetall(key: string): Promise<Record<string, string>> {
    return this.devMockRedis.hgetall(key);
  }

  // 통계 정보
  getStats() {
    const devStats = this.devMockRedis.getStats();
    return {
      ...devStats,
      type: 'unified-mock-redis',
      persistence: process.env.NODE_ENV === 'development',
    };
  }

  // 개발자 도구
  async dump(): Promise<Record<string, any>> {
    return this.devMockRedis.dump();
  }

  async restore(data: Record<string, any>): Promise<void> {
    return this.devMockRedis.restore(_data);
  }
}

// 🚨 무료 티어 절약: Redis 연결 상태 캐싱
let redisConnectionCache: {
  connected: boolean;
  timestamp: number;
  ttl: number;
} = {
  connected: false,
  timestamp: 0,
  ttl: 300000, // 5분 캐싱
};

/**
 * 🎯 단순화된 Redis 전략 결정 함수
 */
function shouldUseMockRedis(
  context?: string,
  dataSize?: number
): 'mock' | 'real' {
  // 🚫 최우선: FORCE_MOCK_REDIS 환경변수 체크
  if (process.env.FORCE_MOCK_REDIS === 'true') {
    console.log('🎭 FORCE_MOCK_REDIS=true - Redis 연결 완전 차단');
    return 'mock';
  }

  // 🧪 개발/테스트/빌드 환경 - 통합 Mock Redis 사용
  if (
    process.env.NODE_ENV === 'development' ||
    process.env.NODE_ENV === 'test' ||
    process.env.STORYBOOK === 'true' ||
    process.env.NEXT_PHASE === 'phase-production-build' ||
    process.env.CI ||
    process.env.GITHUB_ACTIONS
  ) {
    if (!process.env.USE_REAL_REDIS) {
      console.log('🧠 개발/테스트 환경 - 통합 Mock Redis 사용 (영속성 지원)');
      return 'mock';
    }
  }

  // 명시적 Mock 모드
  if (process.env.USE_MOCK_REDIS === 'true') {
    return 'mock';
  }

  // 컨텍스트 기반 판단 (대량 작업은 Mock 사용)
  if (context) {
    // 시스템 상태 관리는 항상 실제 Redis 사용 (Vercel 환경에서 상태 유지 필요)
    if (
      context.includes('system-control') ||
      context.includes('system-state')
    ) {
      return 'real';
    }

    if (HYBRID_STRATEGY.useMockFor.some(pattern => context.includes(pattern))) {
      return 'mock';
    }
  }

  // 데이터 크기 기반 판단
  if (dataSize && dataSize > HYBRID_STRATEGY.thresholds.maxDataSizeKB * 1024) {
    return 'mock';
  }

  // 기본값: 실제 Redis 사용
  return 'real';
}

// 🚀 단순화된 하이브리드 Redis 클라이언트 (서버리스 최적화)
async function getHybridRedisClient(
  context?: string,
  dataSize?: number
): Promise<RedisClientInterface> {
  const redisType = shouldUseMockRedis(context, dataSize);

  // 글로벌 캐시에서 기존 클라이언트 확인
  if (
    globalThis.__redis_client_cache &&
    globalThis.__redis_client_type === redisType
  ) {
    return globalThis.__redis_client_cache;
  }

  switch (redisType) {
    case 'mock':
      // 통합 Mock Redis 사용
      if (!unifiedMockRedis) {
        unifiedMockRedis = new UnifiedMockRedis({
          enablePersistence: process.env.NODE_ENV === 'development',
          enableDevTools: process.env.NODE_ENV === 'development',
        });
        console.log(
          `🧠 통합 Mock Redis 활성화 (컨텍스트: ${context || 'unknown'})`
        );
      }

      // 글로벌 캐시에 저장
      globalThis.__redis_client_cache = unifiedMockRedis;
      globalThis.__redis_client_type = 'mock';
      return unifiedMockRedis;

    case 'real': {
      // 실제 Redis 사용
      if (!realRedis && !isInitializing) {
        try {
          isInitializing = true;
          realRedis = await _initializeRedis();
          isInitializing = false;
          console.log(
            `🌐 Real Redis 활성화 (컨텍스트: ${context || 'unknown'})`
          );

          // 글로벌 캐시에 저장
          globalThis.__redis_client_cache = realRedis;
          globalThis.__redis_client_type = 'real';
        } catch {
          isInitializing = false;
          console.log(
            `⚠️ Real Redis 실패, Mock으로 폴백 (컨텍스트: ${context})`
          );
          if (!unifiedMockRedis) {
            unifiedMockRedis = new UnifiedMockRedis();
          }

          // 글로벌 캐시에 Mock 저장
          globalThis.__redis_client_cache = unifiedMockRedis;
          globalThis.__redis_client_type = 'mock';
          return unifiedMockRedis;
        }
      }

      const client = realRedis || (unifiedMockRedis = new UnifiedMockRedis());

      // 글로벌 캐시에 저장
      globalThis.__redis_client_cache = client;
      globalThis.__redis_client_type = realRedis ? 'real' : 'mock';

      return client;
    }
  }
}

async function _initializeRedis(): Promise<RedisClientInterface> {
  // ➡️ 환경 변수 검증
  let redisUrl = env.KV_REST_API_URL;
  let redisToken = env.KV_REST_API_TOKEN;

  // 환경변수가 없으면 런타임 복호화 시도
  if (!redisUrl || !redisToken) {
    console.log('🔓 환경변수 누락 - 런타임 복호화 시도 중...');
    const decryptedConfig = getDecryptedRedisConfig();
    if (decryptedConfig) {
      redisUrl = decryptedConfig.url;
      redisToken = decryptedConfig.token;
      console.log('✅ Redis 환경변수 런타임 복호화 성공');
    }
  }

  if (!redisUrl || !redisToken) {
    console.log('⚠️ Redis 환경변수 누락 → 통합 Mock Redis로 자동 전환');
    return new UnifiedMockRedis();
  }

  // ➡️ 실제 Redis 연결 시도 (빠른 폴백)
  try {
    const { Redis } = await import('@upstash/redis');

    const redisClient = new Redis({
      url: redisUrl,
      token: redisToken,
      retry: {
        retries: 2,
        backoff: retryCount => Math.min(retryCount * 300, 800),
      },
      automaticDeserialization: true,
      enableAutoPipelining: false,
    });

    // 빠른 연결 테스트
    await redisClient.ping();
    console.log('✅ Real Redis 연결 성공');
    return redisClient;
  } catch {
    console.log(`⚠️ Real Redis 연결 실패 → 통합 Mock Redis로 전환`);
    return new UnifiedMockRedis();
  }
}

/**
 * 🔥 스마트 Redis 클라이언트 (하이브리드 전략)
 * 컨텍스트와 데이터 크기에 따라 자동으로 Mock/Real Redis 선택
 */
const smartRedis = {
  // 컨텍스트 기반 클라이언트 가져오기
  async getClient(
    context?: string,
    dataSize?: number
  ): Promise<RedisClientInterface> {
    return getHybridRedisClient(context, dataSize);
  },

  // 간편 메서드들 (자동 컨텍스트 감지)
  async get(key: string, context?: string): Promise<string | null> {
    const client = await getHybridRedisClient(context);
    return client.get(key);
  },

  async set(
    key: string,
    value: any,
    options?: { ex?: number },
    context?: string
  ): Promise<'OK'> {
    const dataSize = JSON.stringify(value).length;
    const client = await getHybridRedisClient(context, dataSize);
    return client.set(key, value, options);
  },

  async del(key: string, context?: string): Promise<number> {
    const client = await getHybridRedisClient(context);
    return client.del(key);
  },

  async ping(context?: string): Promise<string> {
    const client = await getHybridRedisClient(context);
    return client.ping();
  },

  // 통계 정보
  async getStats(): Promise<any> {
    const stats = {
      unifiedMockRedis: unifiedMockRedis?.getStats() || null,
      realRedis: realRedis
        ? { status: 'connected' }
        : { status: 'disconnected' },
      strategy: HYBRID_STRATEGY,
    };
    return stats;
  },
};

/**
 * 🔄 기존 호환성을 위한 getRedisClient 함수
 */
export async function getRedisClient(
  context?: string
): Promise<RedisClientInterface | null> {
  try {
    return await getHybridRedisClient(context);
  } catch (error) {
    console.log('❌ Redis 클라이언트 가져오기 실패:', error);
    return null;
  }
}

/**
 * ✅ Redis 연결 테스트
 */
export async function testRedisConnection(): Promise<boolean> {
  try {
    const client = await getHybridRedisClient('status-check');
    const result = await client.ping();
    console.log('🔔 Redis Ping:', result);
    return true;
  } catch (error) {
    console.log('❌ Redis 연결 테스트 실패:', error);
    return false;
  }
}

/**
 * 🧹 Redis 연결 종료
 */
export async function closeRedisConnection() {
  if (realRedis) {
    try {
      realRedis = null;
      isInitializing = false;
      console.log('✅ Real Redis 연결 종료됨');
    } catch (error) {
      console.log('⚠️ Real Redis 종료 중 오류:', error);
    }
  }

  if (unifiedMockRedis) {
    unifiedMockRedis = null;
    console.log('✅ 통합 Mock Redis 정리됨');
  }
}

// 기존 호환성을 위한 기본 export
export { realRedis, smartRedis };
export default smartRedis;

// =============================================================================
// 🔄 삭제된 캐시 함수들 복원 (호환성 유지)
// =============================================================================

/**
 * 📊 메트릭 데이터 조회
 */
export async function getMetrics(
  serverId: string,
  timestamp?: number
): Promise<any> {
  const client = await getHybridRedisClient('metrics-cache');
  const key = timestamp
    ? `metrics:${serverId}:${timestamp}`
    : `metrics:${serverId}:latest`;
  const data = await client.get(key);
  return data ? JSON.parse(_data) : null;
}

/**
 * 📊 메트릭 데이터 저장
 */
export async function setMetrics(
  serverId: string,
  data: any,
  timestamp?: number
): Promise<void> {
  const client = await getHybridRedisClient('metrics-cache');
  const key = timestamp
    ? `metrics:${serverId}:${timestamp}`
    : `metrics:${serverId}:latest`;
  await client.set(key, JSON.stringify(_data), { ex: 3600 }); // 1시간 만료
}

/**
 * 🔄 실시간 데이터 조회
 */
export async function getRealtime(key: string): Promise<any> {
  const client = await getHybridRedisClient('realtime-cache');
  const data = await client.get(`realtime:${key}`);
  return data ? JSON.parse(_data) : null;
}

/**
 * 🔄 실시간 데이터 저장
 */
export async function setRealtime(
  key: string,
  data: any,
  ttl = 300
): Promise<void> {
  const client = await getHybridRedisClient('realtime-cache');
  await client.set(`realtime:${key}`, JSON.stringify(_data), { ex: ttl });
}

/**
 * 🔄 모든 실시간 데이터 조회
 */
export async function getAllRealtime(): Promise<any[]> {
  const client = await getHybridRedisClient('realtime-cache');

  // Mock Redis인 경우 직접 접근
  if (client instanceof UnifiedMockRedis) {
    const allData: any[] = [];
    // Mock Redis의 dump에서 realtime: 접두사로 시작하는 모든 키 조회
    const dump = await client.dump();
    for (const [key, item] of Object.entries(dump)) {
      if (key.startsWith('realtime:')) {
        allData.push(
          typeof item.value === 'string' ? JSON.parse(item.value) : item.value
        );
      }
    }
    return allData;
  }

  // 실제 Redis인 경우는 스캔 기능 사용 (간단한 구현)
  return [];
}

/**
 * 📦 배치 데이터 저장
 */
export async function setBatch(
  key: string,
  data: any[],
  ttl = 1800
): Promise<void> {
  const client = await getHybridRedisClient('bulk-data');
  await client.set(`batch:${key}`, JSON.stringify(_data), { ex: ttl });
}

/**
 * 🚨 무료 티어 최적화: Redis 연결 상태 확인 (5분 캐싱)
 */
export async function isRedisConnected(): Promise<boolean> {
  const now = Date.now();

  // 캐시된 결과가 유효한 경우 반환
  if (now - redisConnectionCache.timestamp < redisConnectionCache.ttl) {
    console.log(
      `🔄 Redis 연결 상태 캐시 사용: ${redisConnectionCache.connected}`
    );
    return redisConnectionCache.connected;
  }

  try {
    if (!realRedis) {
      console.log('❌ Redis 클라이언트가 초기화되지 않음');
      redisConnectionCache = { connected: false, timestamp: now, ttl: 300000 };
      return false;
    }

    await realRedis.ping();
    console.log('✅ Redis 연결 확인됨 (새로 체크)');
    redisConnectionCache = { connected: true, timestamp: now, ttl: 300000 };
    return true;
  } catch (error) {
    console.error('❌ Redis 연결 실패:', error);
    redisConnectionCache = { connected: false, timestamp: now, ttl: 300000 };
    return false;
  }
}

/**
 * 📈 Redis 통계 정보
 */
export async function getRedisStats(): Promise<any> {
  const stats = await smartRedis.getStats();
  return {
    connected: await isRedisConnected(),
    unifiedMockRedis: stats.unifiedMockRedis,
    realRedis: stats.realRedis,
    strategy: stats.strategy,
  };
}

/**
 * 🌐 Redis 연결 풀링 라이브러리
 *
 * 싱글톤 패턴으로 Redis 연결을 관리하여 성능 최적화
 */

interface RedisStatus {
  status: 'connected' | 'disconnected' | 'reconnecting' | 'error' | 'ready';
  connectedAt: number | null;
  lastError: string | null;
  uptime?: number;
  timestamp?: string;
}

let redis: any | null = null;
let redisStatus: RedisStatus = {
  status: 'disconnected',
  connectedAt: null,
  lastError: null,
};

export function getRedis(): RedisClientInterface {
  // 🚫 테스트 환경에서 FORCE_MOCK_REDIS 체크
  if (process.env.FORCE_MOCK_REDIS === 'true') {
    console.log('🎭 FORCE_MOCK_REDIS=true - 통합 Mock Redis 사용');
    if (!unifiedMockRedis) {
      unifiedMockRedis = new UnifiedMockRedis();
    }
    return unifiedMockRedis;
  }

  // 🚀 개발 환경에서 통합 Mock Redis 사용
  if (process.env.NODE_ENV === 'development' && !process.env.USE_REAL_REDIS) {
    console.log('🚀 개발 환경 - 통합 Mock Redis 사용');
    if (!unifiedMockRedis) {
      unifiedMockRedis = new UnifiedMockRedis({
        enablePersistence: true,
        enableDevTools: true,
      });
    }
    return unifiedMockRedis;
  }

  // Edge Runtime이나 Redis 클래스가 없는 경우 Mock 사용
  if (!Redis) {
    console.log('⚠️ ioredis가 사용 불가능한 환경 - Mock Redis 사용');
    if (!unifiedMockRedis) {
      unifiedMockRedis = new UnifiedMockRedis();
    }
    return unifiedMockRedis;
  }

  if (!redis) {
    redis = new Redis({
      lazyConnect: true,
      enableReadyCheck: true,
      keepAlive: 30000,
      family: 4,
      host:
        process.env.GCP_REDIS_HOST ||
        process.env.REDIS_HOST ||
        process.env.UPSTASH_REDIS_HOST,
      port: parseInt(
        process.env.GCP_REDIS_PORT || process.env.REDIS_PORT || '6379'
      ),
      password:
        process.env.GCP_REDIS_PASSWORD ||
        process.env.REDIS_PASSWORD ||
        process.env.UPSTASH_REDIS_REST_TOKEN,
      maxRetriesPerRequest: 3,
      connectTimeout: 10000,
      commandTimeout: 5000,
    } as any);

    // 연결 이벤트 핸들러
    redis.on('connect', () => {
      console.log('✅ Redis 연결됨');
      redisStatus.status = 'connected';
      redisStatus.connectedAt = Date.now();
    });

    redis.on('ready', () => {
      console.log('✅ Redis 준비됨');
      redisStatus.status = 'ready';
    });

    redis.on('error', (error: Error) => {
      console.error('❌ Redis 오류:', error);
      redisStatus.status = 'error';
      redisStatus.lastError = error.message;
    });

    redis.on('close', () => {
      console.log('🔌 Redis 연결 종료됨');
      redisStatus.status = 'disconnected';
    });

    redis.on('reconnecting', () => {
      console.log('🔄 Redis 재연결 중...');
      redisStatus.status = 'reconnecting';
    });
  }

  return redis;
}

export function getRedisStatus(): RedisStatus {
  return {
    status: redisStatus.status,
    connectedAt: redisStatus.connectedAt,
    uptime: redisStatus.connectedAt ? Date.now() - redisStatus.connectedAt : 0,
    lastError: redisStatus.lastError,
    timestamp: new Date().toISOString(),
  };
}
