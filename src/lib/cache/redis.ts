// Redis 클라이언트 타입 정의 (동적 import용)
type RedisType = any;

// 목업 Redis 클라이언트
class MockRedis {
  private data: Map<string, { value: string; expiry?: number }> = new Map();

  async ping() {
    return 'PONG';
  }

  async setex(key: string, ttl: number, value: string) {
    this.data.set(key, {
      value,
      expiry: Date.now() + ttl * 1000,
    });
    return 'OK';
  }

  async get(key: string) {
    const item = this.data.get(key);
    if (!item) return null;
    if (item.expiry && Date.now() > item.expiry) {
      this.data.delete(key);
      return null;
    }
    return item.value;
  }

  async keys(pattern: string) {
    const regex = new RegExp(pattern.replace('*', '.*'));
    return Array.from(this.data.keys()).filter(key => regex.test(key));
  }

  async del(...keys: string[]) {
    let deleted = 0;
    keys.forEach(key => {
      if (this.data.delete(key)) deleted++;
    });
    return deleted;
  }

  async mget(...keys: string[]) {
    return keys.map(key => {
      const item = this.data.get(key);
      if (!item) return null;
      if (item.expiry && Date.now() > item.expiry) {
        this.data.delete(key);
        return null;
      }
      return item.value;
    });
  }

  disconnect() {
    this.data.clear();
  }

  get status() {
    return 'ready';
  }

  on() {
    // Mock event listener
  }
}

// Redis 클라이언트 인스턴스
let redis: RedisType | null = null;
let isConnecting = false;
let connectionAttempts = 0;
const MAX_CONNECTION_ATTEMPTS = 3;
const RECONNECT_DELAY = 10000; // 10초

// 목업 모드 확인
const isForceRedis = process.env.FORCE_MOCK_REDIS === 'true';
const isDevEnvironment = process.env.NODE_ENV === 'development';
const shouldUseMockRedis = isForceRedis || isDevEnvironment;

// Redis 연결 설정
const getRedisClient = async (): Promise<RedisType> => {
  // 클라이언트 사이드에서는 Redis 사용 불가
  if (typeof window !== 'undefined') {
    throw new Error('Redis는 서버 환경에서만 사용 가능합니다');
  }

  // 목업 모드 사용
  if (shouldUseMockRedis) {
    if (!redis) {
      console.log('🎭 목업 Redis 모드 활성화 (개발 환경)');
      redis = new MockRedis();
    }
    return redis;
  }

  if (redis && redis.status === 'ready') {
    return redis;
  }

  if (isConnecting) {
    // 연결 중이면 기존 인스턴스 반환 (null일 수 있음)
    return redis || (await createRedisInstance());
  }

  if (connectionAttempts >= MAX_CONNECTION_ATTEMPTS) {
    console.log('⚠️ Redis 최대 연결 시도 초과, 목업 모드로 폴백');
    redis = new MockRedis();
    return redis;
  }

  return await createRedisInstance();
};

const createRedisInstance = async (): Promise<RedisType> => {
  if (isConnecting) {
    // 동적 import로 Redis 클래스 로드
    const { default: Redis } = await import('ioredis');
    return redis || new Redis(); // 임시 인스턴스 반환
  }

  isConnecting = true;
  connectionAttempts++;

  console.log(
    `🔄 Redis 연결 시도 ${connectionAttempts}/${MAX_CONNECTION_ATTEMPTS}`
  );

  try {
    // 동적 import로 Redis 클래스 로드
    const { default: Redis } = await import('ioredis');

    redis = new Redis({
      host: 'charming-condor-46598.upstash.io',
      port: 6379,
      password: 'AbYGAAIjcDE5MjNmYjhiZDkwOGQ0MTUyOGFiZjUyMmQ0YTkyMzIwM3AxMA',
      tls: {},
      maxRetriesPerRequest: 2, // 3에서 2로 감소
      lazyConnect: true,
      connectTimeout: 3000, // 10초에서 3초로 단축
      commandTimeout: 2000, // 5초에서 2초로 단축
      retryStrategy: (times: number) => {
        if (times > 2) return null; // 2회 시도 후 포기
        return Math.min(times * 200, 1000);
      },
      reconnectOnError: (err: Error) => {
        const targetError = 'READONLY';
        return err.message.includes(targetError);
      },
    });

    redis.on('error', err => {
      console.error('❌ Redis 연결 오류:', err.message);

      // 연결 오류 시 즉시 목업 모드로 전환
      if (
        err.message.includes('ECONNREFUSED') ||
        err.message.includes('connect')
      ) {
        console.log('🎭 Redis 연결 실패, 목업 모드로 전환');
        redis = new MockRedis();
        isConnecting = false;
        return;
      }

      // 특정 오류에 대해서만 재연결 시도
      if (
        err.message.includes('ECONNRESET') ||
        err.message.includes('MaxRetriesPerRequestError')
      ) {
        console.log('🔄 Redis 재연결 예약...');

        // 즉시 재연결하지 않고 지연 후 시도
        setTimeout(() => {
          if (redis) {
            redis.disconnect();
            redis = null;
          }
          isConnecting = false;

          // 최대 시도 횟수 초과 시 목업 모드로 전환
          if (connectionAttempts >= MAX_CONNECTION_ATTEMPTS) {
            console.log('🎭 최대 재시도 초과, 목업 모드로 전환');
            redis = new MockRedis();
          }
        }, RECONNECT_DELAY);
      }
    });

    redis.on('connect', () => {
      console.log(
        '✅ Redis 연결 성공: https://charming-condor-46598.upstash.io'
      );
      connectionAttempts = 0; // 성공 시 카운터 리셋
      isConnecting = false;
    });

    redis.on('ready', () => {
      console.log('✅ Redis 명령 준비 완료');
      isConnecting = false;
    });

    redis.on('close', () => {
      console.log('⚠️ Redis 연결 종료');
      isConnecting = false;
    });

    return redis;
  } catch (error) {
    console.error('❌ Redis 인스턴스 생성 실패:', error);
    console.log('🎭 목업 Redis로 폴백');
    redis = new MockRedis();
    isConnecting = false;
    return redis;
  }
};

// Redis 연결 상태 확인
export const isRedisConnected = async (): Promise<boolean> => {
  try {
    const client = await getRedisClient();
    await client.ping();
    return true;
  } catch (error) {
    console.error('Redis ping failed:', error);
    return false;
  }
};

// 메트릭 데이터 저장 (TTL: 10분 - 경연대회 최적화)
export const setMetrics = async (
  serverId: string,
  data: any
): Promise<void> => {
  try {
    const client = await getRedisClient();
    const key = `metrics:${serverId}:${Date.now()}`;
    await client.setex(key, 600, JSON.stringify(data)); // 10분 TTL (무료 티어 최적화)
  } catch (error) {
    console.error('Error setting metrics:', error);
    // 목업 모드에서는 에러를 던지지 않음
    if (!shouldUseMockRedis && !(redis instanceof MockRedis)) {
      throw error;
    }
  }
};

// 로그 데이터 저장 (TTL: 30분)
export const setLogs = async (serverId: string, data: any): Promise<void> => {
  try {
    const client = await getRedisClient();
    const key = `logs:${serverId}:${Date.now()}`;
    await client.setex(key, 1800, JSON.stringify(data)); // 30분 TTL
  } catch (error) {
    console.error('Error setting logs:', error);
    // 목업 모드에서는 에러를 던지지 않음
    if (!shouldUseMockRedis && !(redis instanceof MockRedis)) {
      throw error;
    }
  }
};

// 트레이스 데이터 저장 (TTL: 1시간)
export const setTraces = async (
  serverId: string,
  traceId: string,
  data: any
): Promise<void> => {
  try {
    const client = await getRedisClient();
    const key = `traces:${serverId}:${traceId}`;
    await client.setex(key, 3600, JSON.stringify(data)); // 1시간 TTL
  } catch (error) {
    console.error('Error setting traces:', error);
    // 목업 모드에서는 에러를 던지지 않음
    if (!shouldUseMockRedis && !(redis instanceof MockRedis)) {
      throw error;
    }
  }
};

// 실시간 데이터 저장 (TTL: 2분 - 경연대회 최적화)
export const setRealtime = async (
  serverId: string,
  data: any
): Promise<void> => {
  try {
    const client = await getRedisClient();
    const key = `realtime:${serverId}`;
    await client.setex(key, 120, JSON.stringify(data)); // 2분 TTL (무료 티어 최적화)
  } catch (error) {
    console.error('Error setting realtime data:', error);
    // 목업 모드에서는 에러를 던지지 않음
    if (!shouldUseMockRedis && !(redis instanceof MockRedis)) {
      throw error;
    }
  }
};

// 메트릭 데이터 조회
export const getMetrics = async (
  serverId: string,
  fromTime?: number
): Promise<any[]> => {
  try {
    const client = await getRedisClient();
    const pattern = `metrics:${serverId}:*`;
    const keys = await client.keys(pattern);

    if (fromTime) {
      const filteredKeys = keys.filter(key => {
        const timestamp = parseInt(key.split(':')[2]);
        return timestamp >= fromTime;
      });

      if (filteredKeys.length === 0) return [];

      const values = await client.mget(...filteredKeys);
      return values
        .filter(value => value !== null)
        .map(value => JSON.parse(value as string));
    }

    if (keys.length === 0) return [];

    const values = await client.mget(...keys);
    return values
      .filter(value => value !== null)
      .map(value => JSON.parse(value as string));
  } catch (error) {
    console.error('Error getting metrics:', error);
    return [];
  }
};

// 로그 데이터 조회
export const getLogs = async (
  serverId: string,
  fromTime?: number
): Promise<any[]> => {
  try {
    const client = await getRedisClient();
    const pattern = `logs:${serverId}:*`;
    const keys = await client.keys(pattern);

    if (fromTime) {
      const filteredKeys = keys.filter(key => {
        const timestamp = parseInt(key.split(':')[2]);
        return timestamp >= fromTime;
      });

      if (filteredKeys.length === 0) return [];

      const values = await client.mget(...filteredKeys);
      return values
        .filter(value => value !== null)
        .map(value => JSON.parse(value as string));
    }

    if (keys.length === 0) return [];

    const values = await client.mget(...keys);
    return values
      .filter(value => value !== null)
      .map(value => JSON.parse(value as string));
  } catch (error) {
    console.error('Error getting logs:', error);
    return [];
  }
};

// 실시간 데이터 조회
export const getRealtime = async (serverId: string): Promise<any | null> => {
  try {
    const client = await getRedisClient();
    const key = `realtime:${serverId}`;
    const value = await client.get(key);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    console.error('Error getting realtime data:', error);
    return null;
  }
};

// 모든 서버의 실시간 데이터 조회
export const getAllRealtime = async (): Promise<Record<string, any>> => {
  try {
    const client = await getRedisClient();
    const keys = await client.keys('realtime:*');

    if (keys.length === 0) return {};

    const values = await client.mget(...keys);
    const result: Record<string, any> = {};

    keys.forEach((key, index) => {
      const serverId = key.split(':')[1];
      const value = values[index];
      if (value) {
        result[serverId] = JSON.parse(value);
      }
    });

    return result;
  } catch (error) {
    console.error('Error getting all realtime data:', error);
    return {};
  }
};

// 서버 데이터 삭제
export const deleteServerData = async (serverId: string): Promise<void> => {
  try {
    const client = await getRedisClient();
    const patterns = [
      `metrics:${serverId}:*`,
      `logs:${serverId}:*`,
      `traces:${serverId}:*`,
      `realtime:${serverId}`,
    ];

    for (const pattern of patterns) {
      const keys = await client.keys(pattern);
      if (keys.length > 0) {
        await client.del(...keys);
      }
    }
  } catch (error) {
    console.error('Error deleting server data:', error);
    throw error;
  }
};

// 배치 저장 (경연대회 최적화 - Redis 명령어 그룹핑)
export const setBatch = async (
  items: Array<{
    key: string;
    value: any;
    ttl: number;
  }>
): Promise<void> => {
  try {
    const client = await getRedisClient();
    const pipeline = client.pipeline();

    // 무료 티어 최적화: 최대 10개씩 배치 처리
    const BATCH_SIZE = 10;

    for (let i = 0; i < items.length; i += BATCH_SIZE) {
      const batch = items.slice(i, i + BATCH_SIZE);
      batch.forEach(({ key, value, ttl }) => {
        pipeline.setex(key, ttl, JSON.stringify(value));
      });
    }

    await pipeline.exec();
  } catch (error) {
    console.error('Error in batch set:', error);
    throw error;
  }
};

// Redis 메모리 사용량 조회
export const getMemoryUsage = async (): Promise<{
  used: string;
  peak: string;
  fragmentation: string;
}> => {
  try {
    const client = await getRedisClient();
    const memoryInfo = await client.info('memory');

    const lines = memoryInfo.split('\r\n');
    const usedMemory =
      lines
        .find(line => line.startsWith('used_memory_human:'))
        ?.split(':')[1] || 'N/A';
    const peakMemory =
      lines
        .find(line => line.startsWith('used_memory_peak_human:'))
        ?.split(':')[1] || 'N/A';
    const fragmentation =
      lines
        .find(line => line.startsWith('mem_fragmentation_ratio:'))
        ?.split(':')[1] || 'N/A';

    return {
      used: usedMemory,
      peak: peakMemory,
      fragmentation: fragmentation,
    };
  } catch (error) {
    console.error('Error getting memory usage:', error);
    return {
      used: 'Error',
      peak: 'Error',
      fragmentation: 'Error',
    };
  }
};

// Redis 통계 조회
export const getRedisStats = async (): Promise<{
  connected: boolean;
  keyCount: number;
  memoryUsage: any;
  uptime: string;
}> => {
  try {
    const client = await getRedisClient();
    const connected = await isRedisConnected();

    if (!connected) {
      return {
        connected: false,
        keyCount: 0,
        memoryUsage: null,
        uptime: 'N/A',
      };
    }

    const keyCount = await client.dbsize();
    const memoryUsage = await getMemoryUsage();
    const info = await client.info('server');
    const uptimeLine = info
      .split('\r\n')
      .find(line => line.startsWith('uptime_in_seconds:'));
    const uptimeSeconds = uptimeLine ? parseInt(uptimeLine.split(':')[1]) : 0;
    const uptime = `${Math.floor(uptimeSeconds / 3600)}h ${Math.floor((uptimeSeconds % 3600) / 60)}m`;

    return {
      connected: true,
      keyCount,
      memoryUsage,
      uptime,
    };
  } catch (error) {
    console.error('Error getting Redis stats:', error);
    return {
      connected: false,
      keyCount: 0,
      memoryUsage: null,
      uptime: 'Error',
    };
  }
};

// Redis 연결 종료
export const closeRedis = async (): Promise<void> => {
  if (redis) {
    await redis.quit();
    redis = null;
  }
};

export default getRedisClient;
