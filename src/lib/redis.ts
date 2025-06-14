/**
 * 🔥 Redis 연결 관리자 v4.3 - 하이브리드 전략
 *
 * OpenManager Vibe v5.30.0 - 스마트 하이브리드 시스템
 * - 사용량 많은 작업: Enhanced Mock Redis (빌드, 대량 처리)
 * - 일반 작업: 실제 Upstash Redis (keep-alive, 캐싱)
 * - 자동 전환: 부하 상황에 따른 동적 선택
 */

import { env } from './env';
import { usageMonitor } from './usage-monitor';
import { Redis } from '@upstash/redis';
import { logger } from './logger';

/**
 * 🚀 스마트 Redis 클라이언트
 * Redis 장애 시 완전한 메모리 폴백 + 성능 최적화
 */

// Redis 클라이언트 인터페이스 확장
interface RedisClientInterface {
  get(key: string): Promise<string | null>;
  set(key: string, value: any, options?: { ex?: number }): Promise<'OK'>;
  setex(key: string, seconds: number, value: string): Promise<'OK'>;
  del(key: string): Promise<number>;
  exists(key: string): Promise<number>;
  incr(key: string): Promise<number>;
  ping(): Promise<string>;
  pipeline(): any;
}

// Redis 클라이언트 인스턴스들
let realRedis: RedisClientInterface | null = null;
let mockRedis: EnhancedMockRedis | null = null;
let isInitializing = false;

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
  ],

  // 자동 전환 임계값
  thresholds: {
    maxRequestsPerMinute: 50, // 분당 50회 초과 시 Mock 전환
    maxDataSizeKB: 100, // 100KB 초과 데이터는 Mock 사용
    maxConcurrentOps: 10, // 동시 작업 10개 초과 시 Mock 전환
  },
};

// 🧠 Enhanced Memory-only Redis 구현 (성능 최적화)
class EnhancedMockRedis implements RedisClientInterface {
  private store = new Map<string, { value: any; expiry?: number }>();
  private stats = { hits: 0, misses: 0, sets: 0, deletes: 0, operations: 0 };
  private lastCleanup = Date.now();

  async set(key: string, value: any, options?: { ex?: number }): Promise<any> {
    const expiry = options?.ex ? Date.now() + options.ex * 1000 : undefined;
    this.store.set(key, { value, expiry });
    this.stats.sets++;
    this.stats.operations++;
    this.periodicCleanup();
    return 'OK';
  }

  async get(key: string): Promise<any> {
    this.stats.operations++;
    const item = this.store.get(key);
    if (!item) {
      this.stats.misses++;
      return null;
    }

    if (item.expiry && Date.now() > item.expiry) {
      this.store.delete(key);
      this.stats.misses++;
      return null;
    }

    this.stats.hits++;
    return item.value;
  }

  async del(key: string): Promise<number> {
    this.stats.operations++;
    const hadKey = this.store.has(key);
    this.store.delete(key);
    if (hadKey) this.stats.deletes++;
    return hadKey ? 1 : 0;
  }

  async hset(key: string, field: string, value: any): Promise<number> {
    this.stats.operations++;
    let hash = this.store.get(key)?.value || {};
    if (typeof hash !== 'object') hash = {};
    hash[field] = value;
    this.store.set(key, { value: hash });
    return 1;
  }

  async hget(key: string, field: string): Promise<any> {
    this.stats.operations++;
    const hash = this.store.get(key)?.value || {};
    return hash[field];
  }

  async hgetall(key: string): Promise<any> {
    this.stats.operations++;
    return this.store.get(key)?.value || {};
  }

  async publish(channel: string, message: string): Promise<number> {
    this.stats.operations++;
    return 0; // 구독자 없음
  }

  // RedisClientInterface 필수 메서드 구현
  async setex(key: string, seconds: number, value: any): Promise<any> {
    return this.set(key, value, { ex: seconds });
  }

  async exists(key: string): Promise<number> {
    this.stats.operations++;
    const item = this.store.get(key);
    if (!item) return 0;

    if (item.expiry && Date.now() > item.expiry) {
      this.store.delete(key);
      return 0;
    }

    return 1;
  }

  async incr(key: string): Promise<number> {
    this.stats.operations++;
    const current = await this.get(key);
    const value = (parseInt(current) || 0) + 1;
    await this.set(key, value.toString());
    return value;
  }

  async ping(): Promise<string> {
    this.stats.operations++;
    return 'PONG';
  }

  pipeline(): any {
    return {
      setex: (key: string, seconds: number, value: any) => {
        this.setex(key, seconds, value);
        return this;
      },
      exec: async () => [],
    };
  }

  // 🧹 주기적 정리 (성능 최적화)
  private periodicCleanup(): void {
    const now = Date.now();
    // 5분마다 정리
    if (now - this.lastCleanup > 300000) {
      this.cleanupExpired();
      this.lastCleanup = now;
    }
  }

  private cleanupExpired(): void {
    const now = Date.now();
    let cleaned = 0;
    for (const [key, item] of this.store.entries()) {
      if (item.expiry && now > item.expiry) {
        this.store.delete(key);
        cleaned++;
      }
    }
    if (cleaned > 0) {
      console.log(`🧹 Mock Redis: ${cleaned}개 만료 키 정리`);
    }
  }

  // 📊 통계 정보
  getStats() {
    return {
      ...this.stats,
      size: this.store.size,
      hitRate: this.stats.hits / (this.stats.hits + this.stats.misses) || 0,
      memoryUsageKB: Math.round(
        JSON.stringify([...this.store.entries()]).length / 1024
      ),
    };
  }
}

/**
 * 🎯 하이브리드 전략 결정 함수
 */
function shouldUseMockRedis(context?: string, dataSize?: number): boolean {
  // 1. 빌드/CI 환경은 항상 Mock
  if (
    typeof window === 'undefined' &&
    (process.env.NODE_ENV !== 'development' ||
      process.env.VERCEL_ENV ||
      process.env.CI ||
      process.env.GITHUB_ACTIONS)
  ) {
    return true;
  }

  // 2. 명시적 Mock 모드
  if (process.env.USE_MOCK_REDIS === 'true') {
    return true;
  }

  // 3. 컨텍스트 기반 판단
  if (context) {
    if (HYBRID_STRATEGY.useMockFor.some(pattern => context.includes(pattern))) {
      return true;
    }
    if (HYBRID_STRATEGY.useRealFor.some(pattern => context.includes(pattern))) {
      return false;
    }
  }

  // 4. 데이터 크기 기반 판단
  if (dataSize && dataSize > HYBRID_STRATEGY.thresholds.maxDataSizeKB * 1024) {
    return true;
  }

  // 5. 사용량 모니터링 기반 판단
  if (!usageMonitor.canUseRedis()) {
    return true;
  }

  // 6. 기본값: 실제 Redis 사용
  return false;
}

// 🚀 스마트 하이브리드 Redis 클라이언트
async function getHybridRedisClient(
  context?: string,
  dataSize?: number
): Promise<RedisClientInterface> {
  const useMock = shouldUseMockRedis(context, dataSize);

  if (useMock) {
    // Mock Redis 사용
    if (!mockRedis) {
      mockRedis = new EnhancedMockRedis();
      console.log(`🧠 Mock Redis 활성화 (컨텍스트: ${context || 'unknown'})`);
    }
    return mockRedis;
  } else {
    // 실제 Redis 사용
    if (!realRedis && !isInitializing) {
      try {
        isInitializing = true;
        realRedis = await initializeRedis();
        isInitializing = false;
        console.log(`🌐 Real Redis 활성화 (컨텍스트: ${context || 'unknown'})`);
      } catch (error) {
        isInitializing = false;
        console.log(`⚠️ Real Redis 실패, Mock으로 폴백 (컨텍스트: ${context})`);
        if (!mockRedis) {
          mockRedis = new EnhancedMockRedis();
        }
        return mockRedis;
      }
    }

    return realRedis || (mockRedis = new EnhancedMockRedis());
  }
}

async function initializeRedis(): Promise<RedisClientInterface> {
  // ➡️ 환경 변수 검증
  const redisUrl = env.KV_REST_API_URL;
  const redisToken = env.KV_REST_API_TOKEN;

  if (!redisUrl || !redisToken) {
    console.log('⚠️ Redis 환경변수 누락 → Enhanced Mock Redis로 자동 전환');
    return new EnhancedMockRedis();
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
  } catch (error: any) {
    console.log(`⚠️ Real Redis 연결 실패 → Mock Redis로 전환`);
    return new EnhancedMockRedis();
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
      mockRedis: mockRedis?.getStats() || null,
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

  if (mockRedis) {
    mockRedis = null;
    console.log('✅ Mock Redis 정리됨');
  }
}

// 기존 호환성을 위한 기본 export
export { realRedis };
export default smartRedis;
