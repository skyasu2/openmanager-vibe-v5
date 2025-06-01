/**
 * 🔥 Redis 연결 관리자 v3.1
 * 
 * OpenManager AI v5.21.0 - Redis 연결 완전 안정화
 * - 더미 모드 강화 (시연용)
 * - 환경변수 없어도 안정 동작
 * - 메모리 기반 fallback
 */

// 환경 변수 체크 (더 엄격하게)
const isDevelopment = process.env.NODE_ENV === 'development';
const hasRedisUrl = Boolean(process.env.REDIS_URL || process.env.UPSTASH_REDIS_REST_URL);
const hasRedisTokens = Boolean(process.env.UPSTASH_REDIS_REST_TOKEN);

// 시연 모드: Redis 환경변수가 없으면 더미 모드로 강제 전환
const isFullDummyMode = !hasRedisUrl || !hasRedisTokens;

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

/**
 * 💾 향상된 더미 Redis 클라이언트 (시연용)
 */
class EnhancedDummyRedisClient implements RedisClientInterface {
  private memoryStore = new Map<string, { value: string; expires?: number }>();
  private initialized = false;

  constructor() {
    if (!this.initialized) {
      console.log('💾 [시연모드] 향상된 더미 Redis 클라이언트 초기화');
      
      // 시연용 초기 데이터 설정
      this.memoryStore.set('demo:servers:count', { value: '30' });
      this.memoryStore.set('demo:metrics:enabled', { value: 'true' });
      this.memoryStore.set('demo:ai:status', { value: 'ready' });
      
      this.initialized = true;
    }
  }

  async get(key: string): Promise<string | null> {
    const item = this.memoryStore.get(key);
    if (!item) return null;
    
    // TTL 체크
    if (item.expires && Date.now() > item.expires) {
      this.memoryStore.delete(key);
      return null;
    }
    
    return item.value;
  }

  async set(key: string, value: any, options?: { ex?: number }): Promise<'OK'> {
    const expires = options?.ex ? Date.now() + (options.ex * 1000) : undefined;
    this.memoryStore.set(key, { 
      value: typeof value === 'string' ? value : JSON.stringify(value),
      expires 
    });
    return 'OK';
  }

  async setex(key: string, seconds: number, value: string): Promise<'OK'> {
    return this.set(key, value, { ex: seconds });
  }

  async del(key: string): Promise<number> {
    return this.memoryStore.delete(key) ? 1 : 0;
  }

  async ping(): Promise<'PONG'> {
    return 'PONG';
  }

  pipeline(): any {
    // 더미 파이프라인 (체이닝 지원)
    const operations: Array<() => Promise<any>> = [];
    
    return {
      setex: (key: string, seconds: number, value: string) => {
        operations.push(() => this.setex(key, seconds, value));
        return this;
      },
      set: (key: string, value: any, options?: any) => {
        operations.push(() => this.set(key, value, options));
        return this;
      },
      exec: async () => {
        const results = await Promise.all(operations.map(op => op()));
        return results.map(result => [null, result]); // Redis 파이프라인 형식
      }
    };
  }

  async quit(): Promise<'OK'> {
    this.memoryStore.clear();
    console.log('💾 [시연모드] 더미 Redis 클라이언트 종료');
    return 'OK';
  }

  // 시연용 추가 메서드
  getStats() {
    return {
      keys: this.memoryStore.size,
      mode: 'enhanced-dummy',
      memory: process.memoryUsage().heapUsed
    };
  }
}

// Redis 클라이언트 인스턴스
let redis: RedisClientInterface | null = null;

/**
 * 🔧 Redis 클라이언트 초기화 (시연 안정화)
 */
async function initializeRedis(): Promise<RedisClientInterface> {
  // 이미 초기화된 경우
  if (redis) {
    return redis;
  }

  // 시연 모드 또는 환경변수 부족
  if (isFullDummyMode) {
    console.log('🎯 [시연모드] 더미 Redis 클라이언트 사용 - 환경변수 없음');
    const dummyClient = new EnhancedDummyRedisClient();
    redis = dummyClient;
    return dummyClient;
  }

  try {
    // 서버 환경에서만 실제 Redis 연결
    if (typeof window !== 'undefined') {
      console.log('🌐 브라우저 환경 - 더미 클라이언트 사용');
      const dummyClient = new EnhancedDummyRedisClient();
      redis = dummyClient;
      return dummyClient;
    }

    // Redis 라이브러리 동적 import
    const { Redis } = await import('ioredis');
    
    // Redis URL 설정
    const redisUrl = process.env.REDIS_URL || process.env.UPSTASH_REDIS_REST_URL;
    
    console.log('🔧 실제 Redis 연결 시도...');
    
    const redisClient = new Redis(redisUrl!, {
      maxRetriesPerRequest: 2,
      lazyConnect: true,
      connectTimeout: 8000,
      commandTimeout: 4000,
      enableOfflineQueue: false
    });

    // 연결 테스트 (타임아웃 포함)
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Redis 연결 타임아웃')), 5000)
    );
    
    await Promise.race([redisClient.ping(), timeoutPromise]);
    console.log('✅ 실제 Redis 연결 성공');
    
    redis = redisClient as any;
    return redis as RedisClientInterface;

  } catch (error) {
    console.warn('⚠️ 실제 Redis 연결 실패, 시연용 더미 클라이언트로 전환:', error instanceof Error ? error.message : error);
    const fallbackClient = new EnhancedDummyRedisClient();
    redis = fallbackClient;
    return fallbackClient;
  }
}

/**
 * 🔍 Redis 연결 상태 체크 (시연 안정화)
 */
export async function checkRedisConnection() {
  try {
    if (!redis) {
      await initializeRedis();
    }

    if (!redis) {
      throw new Error('Redis 초기화 실패');
    }

    if (redis instanceof EnhancedDummyRedisClient) {
      return { 
        status: 'connected' as const, 
        message: '더미 Redis 연결됨 (시연 모드)',
        isDummy: true,
        mode: 'demo',
        stats: redis.getStats()
      };
    }

    await redis.ping();
    return { 
      status: 'connected' as const, 
      message: '실제 Redis 연결됨',
      isDummy: false,
      mode: 'production'
    };
    
  } catch (error) {
    console.warn('Redis 연결 확인 실패, 더미 모드로 전환:', error);
    
    // 강제로 더미 클라이언트로 전환
    const dummyClient = new EnhancedDummyRedisClient();
    redis = dummyClient;
    
    return {
      status: 'connected' as const,
      message: '더미 Redis로 복구됨 (시연 모드)',
      isDummy: true,
      mode: 'fallback'
    };
  }
}

/**
 * 🔧 Redis 클라이언트 가져오기 (시연 안정화)
 */
export async function getRedisClient(): Promise<RedisClientInterface> {
  if (!redis) {
    redis = await initializeRedis();
  }
  
  if (!redis) {
    // 최후의 수단: 새 더미 클라이언트 생성
    console.log('🆘 최후의 수단: 새 더미 Redis 클라이언트 생성');
    redis = new EnhancedDummyRedisClient();
  }
  
  return redis;
}

/**
 * 🎯 시연용 Redis 상태 리포트
 */
export async function getDemoRedisReport() {
  try {
    const client = await getRedisClient();
    const connectionStatus = await checkRedisConnection();
    
    if (client instanceof EnhancedDummyRedisClient) {
      return {
        type: 'demo',
        status: 'stable',
        message: '시연용 더미 Redis 정상 동작',
        stats: client.getStats(),
        features: ['메모리 캐싱', 'TTL 지원', '파이프라인', '안정성 보장']
      };
    }
    
    return {
      type: 'production',
      status: 'connected',
      message: '실제 Redis 연결됨',
      features: ['실시간 캐싱', '분산 저장', '고성능']
    };
    
  } catch (error) {
    return {
      type: 'error',
      status: 'failed',
      message: error instanceof Error ? error.message : '알 수 없는 오류',
      fallback: '더미 모드로 동작'
    };
  }
}

// 기본 export
export { redis, isDevelopment, isFullDummyMode }; 