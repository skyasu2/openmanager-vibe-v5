import Redis from 'ioredis';

// Redis 클라이언트 인스턴스
let redis: Redis | null = null;
let isConnecting = false;
let connectionAttempts = 0;
const MAX_CONNECTION_ATTEMPTS = 3;
const RECONNECT_DELAY = 10000; // 10초

// Redis 연결 설정
const getRedisClient = (): Redis => {
  if (redis && redis.status === 'ready') {
    return redis;
  }

  if (isConnecting) {
    // 연결 중이면 기존 인스턴스 반환 (null일 수 있음)
    return redis || createRedisInstance();
  }

  if (connectionAttempts >= MAX_CONNECTION_ATTEMPTS) {
    console.log('⚠️ Redis 최대 연결 시도 초과, 메모리 모드로 폴백');
    throw new Error('Redis connection failed after maximum attempts');
  }

  return createRedisInstance();
};

const createRedisInstance = (): Redis => {
  if (isConnecting) {
    return redis || new Redis(); // 임시 인스턴스 반환
  }

  isConnecting = true;
  connectionAttempts++;

  console.log(
    `🔄 Redis 연결 시도 ${connectionAttempts}/${MAX_CONNECTION_ATTEMPTS}`
  );

  redis = new Redis({
    host: 'charming-condor-46598.upstash.io',
    port: 6379,
    password: 'AbYGAAIjcDE5MjNmYjhiZDkwOGQ0MTUyOGFiZjUyMmQ0YTkyMzIwM3AxMA',
    tls: {},
    maxRetriesPerRequest: 2, // 3에서 2로 감소
    lazyConnect: true,
    connectTimeout: 10000,
    commandTimeout: 5000,
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

        // 최대 시도 횟수 초과 시 더 이상 시도하지 않음
        if (connectionAttempts < MAX_CONNECTION_ATTEMPTS) {
          console.log('🔄 Redis 재연결 시도 중...');
        }
      }, RECONNECT_DELAY);
    }
  });

  redis.on('connect', () => {
    console.log('✅ Redis 연결 성공: https://charming-condor-46598.upstash.io');
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
};

// Redis 연결 상태 확인
export const isRedisConnected = async (): Promise<boolean> => {
  try {
    const client = getRedisClient();
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
    const client = getRedisClient();
    const key = `metrics:${serverId}:${Date.now()}`;
    await client.setex(key, 600, JSON.stringify(data)); // 10분 TTL (무료 티어 최적화)
  } catch (error) {
    console.error('Error setting metrics:', error);
    throw error;
  }
};

// 로그 데이터 저장 (TTL: 30분)
export const setLogs = async (serverId: string, data: any): Promise<void> => {
  try {
    const client = getRedisClient();
    const key = `logs:${serverId}:${Date.now()}`;
    await client.setex(key, 1800, JSON.stringify(data)); // 30분 TTL
  } catch (error) {
    console.error('Error setting logs:', error);
    throw error;
  }
};

// 트레이스 데이터 저장 (TTL: 1시간)
export const setTraces = async (
  serverId: string,
  traceId: string,
  data: any
): Promise<void> => {
  try {
    const client = getRedisClient();
    const key = `traces:${serverId}:${traceId}`;
    await client.setex(key, 3600, JSON.stringify(data)); // 1시간 TTL
  } catch (error) {
    console.error('Error setting traces:', error);
    throw error;
  }
};

// 실시간 데이터 저장 (TTL: 2분 - 경연대회 최적화)
export const setRealtime = async (
  serverId: string,
  data: any
): Promise<void> => {
  try {
    const client = getRedisClient();
    const key = `realtime:${serverId}`;
    await client.setex(key, 120, JSON.stringify(data)); // 2분 TTL (무료 티어 최적화)
  } catch (error) {
    console.error('Error setting realtime data:', error);
    throw error;
  }
};

// 메트릭 데이터 조회
export const getMetrics = async (
  serverId: string,
  fromTime?: number
): Promise<any[]> => {
  try {
    const client = getRedisClient();
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
    const client = getRedisClient();
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
    const client = getRedisClient();
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
    const client = getRedisClient();
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
    const client = getRedisClient();
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
    const client = getRedisClient();
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
    const client = getRedisClient();
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
    const client = getRedisClient();
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
