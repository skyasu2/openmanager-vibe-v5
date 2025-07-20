/**
 * 🚀 Redis Cache Adapter
 *
 * Redis를 위한 캐시 어댑터 구현
 * - 고성능 메트릭 캐싱
 * - TTL 기반 자동 만료
 * - 연결 풀 관리
 * - Fallback 처리
 */

import { CacheAdapter } from './SystemIntegrationAdapter';

export interface RedisConfig {
  url: string;
  ttl?: number;
  maxRetries?: number;
  retryDelayOnFailover?: number;
  enableOfflineQueue?: boolean;
  maxRetriesPerRequest?: number;
}

export class RedisCacheAdapter implements CacheAdapter {
  private client: any = null;
  private config: RedisConfig;
  private isConnected = false;
  private connectionAttempts = 0;
  private maxConnectionAttempts = 3;

  constructor(config: RedisConfig) {
    this.config = {
      ttl: 300, // 5분 기본 TTL
      maxRetries: 3,
      retryDelayOnFailover: 100,
      enableOfflineQueue: false,
      maxRetriesPerRequest: 3,
      ...config,
    };
  }

  async connect(): Promise<void> {
    try {
      // 🚫 최우선: 환경변수 체크
      if (process.env.FORCE_MOCK_REDIS === 'true') {
        console.log('🎭 FORCE_MOCK_REDIS=true - RedisCacheAdapter 연결 건너뜀');
        return;
      }

      // 🧪 개발 도구 환경 체크
      if (process.env.STORYBOOK === 'true' || process.env.NODE_ENV === 'test') {
        console.log('🧪 개발 도구 환경 - RedisCacheAdapter 연결 건너뜀');
        return;
      }

      // 서버 환경에서만 Redis 연결
      if (typeof window !== 'undefined') {
        console.log('⚠️ 클라이언트 환경에서는 Redis를 사용할 수 없습니다');
        return;
      }

      const { Redis } = await import('ioredis');

      this.client = new Redis(this.config.url, {
        maxRetriesPerRequest: this.config.maxRetriesPerRequest,
        enableOfflineQueue: this.config.enableOfflineQueue,
        lazyConnect: true,
      });

      // 연결 이벤트 리스너
      this.client.on('connect', () => {
        console.log('✅ Redis 연결 성공');
        this.isConnected = true;
        this.connectionAttempts = 0;
      });

      this.client.on('error', (error: Error) => {
        console.error('❌ Redis 연결 오류:', error.message);
        this.isConnected = false;
      });

      this.client.on('close', () => {
        console.log('🔄 Redis 연결 종료');
        this.isConnected = false;
      });

      this.client.on('reconnecting', () => {
        this.connectionAttempts++;
        console.log(
          `🔄 Redis 재연결 시도 중... (${this.connectionAttempts}/${this.maxConnectionAttempts})`
        );

        if (this.connectionAttempts >= this.maxConnectionAttempts) {
          console.error('❌ Redis 최대 재연결 시도 횟수 초과');
          this.client.disconnect();
        }
      });

      // 실제 연결 시도
      await this.client.connect();

      // 연결 테스트
      await this.client.ping();

      console.log('✅ Redis 캐시 어댑터 연결 완료');
    } catch (error) {
      console.error('❌ Redis 연결 실패:', error);

      // Redis 연결 실패 시 graceful degradation
      this.client = null;
      this.isConnected = false;

      // 연결 실패를 에러로 던지지 않고 경고만 출력
      console.warn('⚠️ Redis 없이 계속 진행합니다 (캐시 기능 비활성화)');
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      try {
        await this.client.quit();
        console.log('✅ Redis 연결 해제 완료');
      } catch (error) {
        console.error('❌ Redis 연결 해제 실패:', error);
      } finally {
        this.client = null;
        this.isConnected = false;
      }
    }
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    if (!this.isAvailable()) {
      return; // Redis 없이 계속 진행
    }

    try {
      const serializedValue = JSON.stringify(value);
      const effectiveTtl = ttl || this.config.ttl || 300;

      await this.client.setex(key, effectiveTtl, serializedValue);
    } catch (error) {
      console.error(`❌ Redis SET 실패 (${key}):`, error);
      // 에러를 던지지 않고 계속 진행
    }
  }

  async get(key: string): Promise<any> {
    if (!this.isAvailable()) {
      return null; // Redis 없이 계속 진행
    }

    try {
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error(`❌ Redis GET 실패 (${key}):`, error);
      return null;
    }
  }

  async del(key: string): Promise<void> {
    if (!this.isAvailable()) {
      return; // Redis 없이 계속 진행
    }

    try {
      await this.client.del(key);
    } catch (error) {
      console.error(`❌ Redis DEL 실패 (${key}):`, error);
      // 에러를 던지지 않고 계속 진행
    }
  }

  async exists(key: string): Promise<boolean> {
    if (!this.isAvailable()) {
      return false; // Redis 없이 계속 진행
    }

    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      console.error(`❌ Redis EXISTS 실패 (${key}):`, error);
      return false;
    }
  }

  async keys(pattern: string): Promise<string[]> {
    if (!this.isAvailable()) {
      return []; // Redis 없이 계속 진행
    }

    try {
      return await this.client.keys(pattern);
    } catch (error) {
      console.error(`❌ Redis KEYS 실패 (${pattern}):`, error);
      return [];
    }
  }

  /**
   * 🔄 배치 설정 (파이프라인 사용)
   */
  async setBatch(
    items: Array<{ key: string; value: any; ttl?: number }>
  ): Promise<void> {
    if (!this.isAvailable()) {
      return; // Redis 없이 계속 진행
    }

    try {
      const pipeline = this.client.pipeline();

      for (const item of items) {
        const serializedValue = JSON.stringify(item.value);
        const effectiveTtl = item.ttl || this.config.ttl || 300;
        pipeline.setex(item.key, effectiveTtl, serializedValue);
      }

      await pipeline.exec();
      console.log(`✅ Redis 배치 설정 완료: ${items.length}개 항목`);
    } catch (error) {
      console.error('❌ Redis 배치 설정 실패:', error);
      // 에러를 던지지 않고 계속 진행
    }
  }

  /**
   * 🔍 배치 조회 (파이프라인 사용)
   */
  async getBatch(keys: string[]): Promise<Record<string, any>> {
    if (!this.isAvailable()) {
      return {}; // Redis 없이 계속 진행
    }

    try {
      const pipeline = this.client.pipeline();

      for (const key of keys) {
        pipeline.get(key);
      }

      const results = await pipeline.exec();
      const data: Record<string, any> = {};

      results?.forEach((result: any, index: number) => {
        const [error, value] = result;
        if (!error && value) {
          try {
            data[keys[index]] = JSON.parse(value);
          } catch (parseError) {
            console.error(`❌ JSON 파싱 실패 (${keys[index]}):`, parseError);
          }
        }
      });

      return data;
    } catch (error) {
      console.error('❌ Redis 배치 조회 실패:', error);
      return {};
    }
  }

  /**
   * 📊 캐시 통계 조회
   */
  async getStats(): Promise<{
    connected: boolean;
    keyCount: number;
    memoryUsage: string;
    uptime: number;
  }> {
    if (!this.isAvailable()) {
      return {
        connected: false,
        keyCount: 0,
        memoryUsage: '0B',
        uptime: 0,
      };
    }

    try {
      const info = await this.client.info('memory');
      const keyCount = await this.client.dbsize();
      const uptime = await this.client.info('server');

      // 메모리 사용량 파싱
      const memoryMatch = info.match(/used_memory_human:(.+)/);
      const memoryUsage = memoryMatch ? memoryMatch[1].trim() : '0B';

      // 업타임 파싱
      const uptimeMatch = uptime.match(/uptime_in_seconds:(\d+)/);
      const uptimeSeconds = uptimeMatch ? parseInt(uptimeMatch[1]) : 0;

      return {
        connected: this.isConnected,
        keyCount,
        memoryUsage,
        uptime: uptimeSeconds,
      };
    } catch (error) {
      console.error('❌ Redis 통계 조회 실패:', error);
      return {
        connected: false,
        keyCount: 0,
        memoryUsage: '0B',
        uptime: 0,
      };
    }
  }

  /**
   * 🧹 패턴 기반 키 삭제
   */
  async deleteByPattern(pattern: string): Promise<number> {
    if (!this.isAvailable()) {
      return 0; // Redis 없이 계속 진행
    }

    try {
      const keys = await this.client.keys(pattern);

      if (keys.length === 0) {
        return 0;
      }

      const deletedCount = await this.client.del(...keys);
      console.log(`🧹 Redis 패턴 삭제 완료: ${deletedCount}개 키 (${pattern})`);
      return deletedCount;
    } catch (error) {
      console.error(`❌ Redis 패턴 삭제 실패 (${pattern}):`, error);
      return 0;
    }
  }

  /**
   * ⏰ TTL 설정
   */
  async setTTL(key: string, ttl: number): Promise<void> {
    if (!this.isAvailable()) {
      return; // Redis 없이 계속 진행
    }

    try {
      await this.client.expire(key, ttl);
    } catch (error) {
      console.error(`❌ Redis TTL 설정 실패 (${key}):`, error);
      // 에러를 던지지 않고 계속 진행
    }
  }

  /**
   * ⏰ TTL 조회
   */
  async getTTL(key: string): Promise<number> {
    if (!this.isAvailable()) {
      return -1; // Redis 없이 계속 진행
    }

    try {
      return await this.client.ttl(key);
    } catch (error) {
      console.error(`❌ Redis TTL 조회 실패 (${key}):`, error);
      return -1;
    }
  }

  /**
   * 🔍 Redis 사용 가능 여부 확인
   */
  private isAvailable(): boolean {
    return this.client !== null && this.isConnected;
  }

  /**
   * 📊 연결 상태 조회
   */
  getConnectionStatus(): {
    connected: boolean;
    client: boolean;
    attempts: number;
  } {
    return {
      connected: this.isConnected,
      client: this.client !== null,
      attempts: this.connectionAttempts,
    };
  }

  /**
   * 🔄 수동 재연결
   */
  async reconnect(): Promise<void> {
    if (this.client) {
      try {
        await this.client.connect();
      } catch (error) {
        console.error('❌ Redis 수동 재연결 실패:', error);
      }
    }
  }

  /**
   * 🧪 연결 테스트
   */
  async ping(): Promise<boolean> {
    if (!this.isAvailable()) {
      return false;
    }

    try {
      const result = await this.client.ping();
      return result === 'PONG';
    } catch (error) {
      console.error('❌ Redis PING 실패:', error);
      return false;
    }
  }
}
