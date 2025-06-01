/**
 * 🔥 Redis 연결 관리자 v3.0
 * 
 * OpenManager AI v5.20.0 - Redis 연결 안정화
 * - URL 오류 수정
 * - 더미 모드 강화
 * - 환경별 연결 최적화
 */

// 환경 변수 체크
const isDevelopment = process.env.NODE_ENV === 'development';
const isDummyRedis = !process.env.REDIS_URL && !process.env.UPSTASH_REDIS_REST_URL;

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

// 더미 Redis 클라이언트
class DummyRedisClient implements RedisClientInterface {
  private cache = new Map<string, { value: string; expires: number }>();

  async get(key: string): Promise<string | null> {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (item.expires > 0 && Date.now() > item.expires) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value;
  }

  async set(key: string, value: any, options?: { ex?: number }): Promise<'OK'> {
    const expires = options?.ex ? Date.now() + (options.ex * 1000) : 0;
    this.cache.set(key, { 
      value: typeof value === 'string' ? value : JSON.stringify(value), 
      expires 
    });
    return 'OK';
  }

  async setex(key: string, seconds: number, value: string): Promise<'OK'> {
    const expires = Date.now() + (seconds * 1000);
    this.cache.set(key, { value, expires });
    return 'OK';
  }

  async del(key: string): Promise<number> {
    return this.cache.delete(key) ? 1 : 0;
  }

  async ping(): Promise<'PONG'> {
    return 'PONG';
  }

  pipeline() {
    return {
      setex: (key: string, seconds: number, value: string) => this,
      exec: async () => []
    };
  }

  async quit(): Promise<'OK'> {
    this.cache.clear();
    return 'OK';
  }

  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Redis 클라이언트 인스턴스
let redis: RedisClientInterface | null = null;

/**
 * 🔧 Redis 클라이언트 초기화
 */
async function initializeRedis(): Promise<RedisClientInterface> {
  // 이미 초기화된 경우
  if (redis) {
    return redis;
  }

  // 더미 모드 또는 개발 환경
  if (isDummyRedis || isDevelopment) {
    console.log('💾 더미 Redis 클라이언트 사용 (개발 환경)');
    const dummyClient = new DummyRedisClient();
    redis = dummyClient;
    return dummyClient;
  }

  try {
    // 서버 환경에서만 실제 Redis 연결
    if (typeof window !== 'undefined') {
      throw new Error('클라이언트 환경에서는 Redis를 사용할 수 없습니다');
    }

    // Redis 라이브러리 동적 import
    const { Redis } = await import('ioredis');
    
    // Redis URL 설정
    const redisUrl = process.env.REDIS_URL || process.env.UPSTASH_REDIS_REST_URL;
    
    if (!redisUrl) {
      throw new Error('Redis URL이 설정되지 않았습니다');
    }

    console.log('🔧 실제 Redis 연결 시작...');
    
    const redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      connectTimeout: 10000,
      commandTimeout: 5000,
      enableOfflineQueue: false
    });

    // 연결 테스트
    await redisClient.ping();
    console.log('✅ Redis 연결 성공');
    
    redis = redisClient as any; // 타입 호환성을 위한 캐스팅
    return redis as RedisClientInterface;

  } catch (error) {
    console.warn('⚠️ Redis 연결 실패, 더미 클라이언트로 전환:', error);
    const fallbackClient = new DummyRedisClient();
    redis = fallbackClient;
    return fallbackClient;
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

    if (redis instanceof DummyRedisClient) {
      return { 
        status: 'connected' as const, 
        message: 'Redis connected successfully (development/dummy mode)',
        isDummy: true
      };
    }

    await redis.ping();
    return { 
      status: 'connected' as const, 
      message: 'Redis connected successfully',
      isDummy: false
    };
    
  } catch (error) {
    return {
      status: 'error' as const,
      message: error instanceof Error ? error.message : 'Redis connection failed',
      isDummy: true
    };
  }
}

/**
 * 🔧 Redis 클라이언트 가져오기
 */
export async function getRedisClient(): Promise<RedisClientInterface> {
  if (!redis) {
    redis = await initializeRedis();
  }
  
  if (!redis) {
    throw new Error('Redis 클라이언트 초기화 실패');
  }
  
  return redis;
}

/**
 * 🧹 Redis 연결 종료
 */
export async function disconnectRedis(): Promise<void> {
  if (redis && !(redis instanceof DummyRedisClient)) {
    try {
      await redis.quit();
      console.log('👋 Redis 연결 정상 종료');
    } catch (error) {
      console.error('❌ Redis 연결 종료 중 오류:', error);
    }
  }
  redis = null;
}

/**
 * 📊 Redis 상태 조회
 */
export function getRedisStatus() {
  return {
    isConnected: redis !== null,
    isDummy: redis instanceof DummyRedisClient,
    clientType: redis ? (redis instanceof DummyRedisClient ? 'dummy' : 'real') : 'none'
  };
}

// 기본 export
export { redis, isDevelopment, isDummyRedis }; 