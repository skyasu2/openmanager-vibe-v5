/**
 * 🔥 Redis 연결 설정 v2.0
 * 
 * OpenManager AI v5.12.0 - Redis 통합 설정
 * - 환경별 연결 설정
 * - 연결 풀 관리
 * - 장애 복구 전략
 * - 성능 최적화
 */

export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db: number;
  maxRetriesPerRequest: number;
  retryDelayOnFailover: number;
  lazyConnect: boolean;
  keepAlive: number;
  family: 4 | 6;
  keyPrefix?: string;
  connectionName?: string;
}

/**
 * 🌍 환경별 Redis 설정
 */
export const redisConfigs = {
  development: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB || '0'),
    maxRetriesPerRequest: 3,
    retryDelayOnFailover: 100,
    lazyConnect: true,
    keepAlive: 30000,
    family: 4 as const,
    keyPrefix: 'openmanager:dev:',
    connectionName: 'openmanager-dev'
  },
  
  production: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB || '0'),
    maxRetriesPerRequest: 5,
    retryDelayOnFailover: 200,
    lazyConnect: true,
    keepAlive: 60000,
    family: 4 as const,
    keyPrefix: 'openmanager:prod:',
    connectionName: 'openmanager-prod',
    // 프로덕션 전용 설정
    connectTimeout: 10000,
    commandTimeout: 5000,
    enableOfflineQueue: false
  },

  test: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6380'), // 테스트용 포트
    password: process.env.REDIS_PASSWORD,
    db: 15, // 테스트 전용 DB
    maxRetriesPerRequest: 1,
    retryDelayOnFailover: 50,
    lazyConnect: true,
    keepAlive: 10000,
    family: 4 as const,
    keyPrefix: 'openmanager:test:',
    connectionName: 'openmanager-test'
  }
} as const;

/**
 * 🔧 현재 환경의 Redis 설정 가져오기
 */
export function getRedisConfig(): RedisConfig {
  const env = process.env.NODE_ENV || 'development';
  const config = redisConfigs[env as keyof typeof redisConfigs] || redisConfigs.development;
  
  console.log(`🔧 Redis 설정 로드: ${env} 환경`);
  return config;
}

/**
 * 🔗 Redis URL 생성 (Docker/Cloud 환경용)
 */
export function getRedisUrl(): string {
  // REDIS_URL 환경변수가 있으면 우선 사용 (Heroku, Railway 등)
  if (process.env.REDIS_URL) {
    return process.env.REDIS_URL;
  }
  
  const config = getRedisConfig();
  const auth = config.password ? `:${config.password}@` : '';
  return `redis://${auth}${config.host}:${config.port}/${config.db}`;
}

/**
 * 🔍 Redis 연결 상태 체크
 */
export function validateRedisConfig(config: RedisConfig): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!config.host) {
    errors.push('Redis 호스트가 설정되지 않았습니다');
  }
  
  if (!config.port || config.port < 1 || config.port > 65535) {
    errors.push('올바르지 않은 Redis 포트입니다');
  }
  
  if (config.db < 0 || config.db > 15) {
    errors.push('Redis DB 번호는 0-15 사이여야 합니다');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * 📊 Redis 클러스터 설정 (확장성을 위한)
 */
export interface RedisClusterConfig {
  nodes: Array<{ host: string; port: number }>;
  options: {
    password?: string;
    maxRetriesPerRequest: number;
    retryDelayOnFailover: number;
    enableOfflineQueue: boolean;
    redisOptions: {
      password?: string;
      db?: number;
    };
  };
}

export function getRedisClusterConfig(): RedisClusterConfig | null {
  const clusterNodes = process.env.REDIS_CLUSTER_NODES;
  
  if (!clusterNodes) {
    return null; // 클러스터 모드 아님
  }
  
  const nodes = clusterNodes.split(',').map(node => {
    const [host, port] = node.trim().split(':');
    return { host, port: parseInt(port) };
  });
  
  return {
    nodes,
    options: {
      password: process.env.REDIS_PASSWORD,
      maxRetriesPerRequest: 3,
      retryDelayOnFailover: 100,
      enableOfflineQueue: false,
      redisOptions: {
        password: process.env.REDIS_PASSWORD,
        db: parseInt(process.env.REDIS_DB || '0')
      }
    }
  };
}

/**
 * 🔥 고성능 Redis 설정 (트래픽이 많은 경우)
 */
export function getHighPerformanceRedisConfig(): RedisConfig {
  const baseConfig = getRedisConfig();
  
  return {
    ...baseConfig,
    maxRetriesPerRequest: 1, // 빠른 장애 감지
    retryDelayOnFailover: 50,
    connectTimeout: 5000,
    commandTimeout: 3000,
    lazyConnect: false, // 즉시 연결
    keepAlive: 120000, // 2분
    enableOfflineQueue: false, // 오프라인 큐 비활성화
    maxmemoryPolicy: 'allkeys-lru' // LRU 정책
  } as RedisConfig & { enableOfflineQueue: boolean; maxmemoryPolicy: string };
} 