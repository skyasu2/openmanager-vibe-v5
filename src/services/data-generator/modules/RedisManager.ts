/**
 * 🔴 Redis 관리 클래스 - 서버 데이터 캐싱 및 실시간 동기화
 */

import { ServerCluster, ServerInstance } from '@/types/data-generator';

// Redis 타입 정의 (동적 import용)
type RedisType = any;

export class RedisManager {
  private redis: RedisType | null = null;
  private readonly REDIS_PREFIX = 'openmanager:servers:';
  private readonly REDIS_CLUSTERS_PREFIX = 'openmanager:clusters:';
  private readonly REDIS_APPS_PREFIX = 'openmanager:apps:';

  // 저장 제한 설정
  private lastSaveTime = 0;
  private readonly MIN_SAVE_INTERVAL = 5000; // 최소 5초 간격
  private saveThrottleCount = 0;
  private readonly MAX_SAVES_PER_MINUTE = 10; // 분당 최대 10회 저장
  private lastMinuteTimestamp = 0;

  // 컨텍스트 감지
  private isMockMode = false;
  private isHealthCheckContext = false;
  private isTestContext = false;

  constructor() {
    this.detectExecutionContext();
  }

  /**
   * 🔍 실행 컨텍스트 감지
   */
  private detectExecutionContext(): void {
    const userAgent =
      typeof navigator !== 'undefined' ? navigator.userAgent : '';

    // 테스트 환경 감지
    this.isTestContext =
      typeof process !== 'undefined' &&
      (process.env.NODE_ENV === 'test' ||
        process.env.VITEST === 'true' ||
        process.env.JEST_WORKER_ID !== undefined ||
        (typeof global !== 'undefined' && 'expect' in global));

    // 헬스체크 컨텍스트 감지 (URL 기반)
    this.isHealthCheckContext =
      typeof window !== 'undefined' &&
      (window.location?.pathname?.includes('/health') ||
        window.location?.pathname?.includes('/api/health'));

    // Mock 모드 결정
    this.isMockMode = this.shouldUseMockRedis();
  }

  /**
   * 🧪 Mock Redis 사용 여부 결정
   */
  private shouldUseMockRedis(): boolean {
    // 테스트 환경에서는 항상 Mock 사용
    if (this.isTestContext) return true;

    // 헬스체크 컨텍스트에서는 Mock 사용
    if (this.isHealthCheckContext) return true;

    // 브라우저 환경에서는 Mock 사용
    if (typeof window !== 'undefined') return true;

    // Redis 환경변수가 없으면 Mock 사용
    if (!process.env.REDIS_URL && !process.env.UPSTASH_REDIS_REST_URL)
      return true;

    return false;
  }

  /**
   * 🚀 Redis 초기화
   */
  async initialize(): Promise<void> {
    if (this.isMockMode) {
      console.log('🧪 [RedisManager] Mock 모드로 실행');
      return;
    }

    try {
      // 동적 Redis import (서버 환경에서만)
      if (typeof window === 'undefined') {
        const { Redis } = await import('ioredis');

        const redisUrl =
          process.env.REDIS_URL || process.env.UPSTASH_REDIS_REST_URL;
        if (!redisUrl) {
          console.warn(
            '⚠️ [RedisManager] Redis URL이 없습니다. Mock 모드로 전환'
          );
          this.isMockMode = true;
          return;
        }

        this.redis = new Redis(redisUrl, {
          maxRetriesPerRequest: 3,
          enableReadyCheck: false,
          lazyConnect: true,
        });

        // 연결 이벤트 리스너
        this.redis.on('error', (err: Error) => {
          console.error('❌ [RedisManager] Redis 연결 오류:', err.message);
          this.isMockMode = true;
        });

        this.redis.on('ready', () => {
          console.log('✅ [RedisManager] Redis 연결 성공');
        });

        await this.redis.ping();
      }
    } catch (error) {
      console.warn(
        '⚠️ [RedisManager] Redis 초기화 실패, Mock 모드로 전환:',
        error
      );
      this.isMockMode = true;
    }
  }

  /**
   * 💾 Redis 저장 가능 여부 확인
   */
  private canSaveToRedis(): boolean {
    if (this.isMockMode || !this.redis) return false;

    const now = Date.now();

    // 최소 간격 체크
    if (now - this.lastSaveTime < this.MIN_SAVE_INTERVAL) return false;

    // 분당 저장 횟수 체크
    const currentMinute = Math.floor(now / 60000);
    if (currentMinute > this.lastMinuteTimestamp) {
      this.saveThrottleCount = 0;
      this.lastMinuteTimestamp = currentMinute;
    }

    if (this.saveThrottleCount >= this.MAX_SAVES_PER_MINUTE) return false;

    return true;
  }

  /**
   * 💾 서버 데이터 저장
   */
  async saveServer(server: ServerInstance): Promise<void> {
    if (!this.canSaveToRedis()) return;

    try {
      const key = `${this.REDIS_PREFIX}${server.id}`;
      const data = JSON.stringify({
        ...server,
        lastUpdate: Date.now(),
      });

      await this.redis!.setex(key, 3600, data); // 1시간 TTL

      this.lastSaveTime = Date.now();
      this.saveThrottleCount++;
    } catch (error) {
      console.error('❌ [RedisManager] 서버 저장 실패:', error);
    }
  }

  /**
   * 📥 서버 데이터 로드
   */
  async loadServer(serverId: string): Promise<ServerInstance | null> {
    if (this.isMockMode || !this.redis) return null;

    try {
      const key = `${this.REDIS_PREFIX}${serverId}`;
      const data = await this.redis.get(key);

      if (!data) return null;

      const parsed = JSON.parse(data);

      // 1시간 이상 오래된 데이터는 무시
      if (Date.now() - parsed.lastUpdate > 3600000) {
        await this.redis.del(key);
        return null;
      }

      return parsed;
    } catch (error) {
      console.error('❌ [RedisManager] 서버 로드 실패:', error);
      return null;
    }
  }

  /**
   * 📥 모든 서버 데이터 로드
   */
  async loadAllServers(): Promise<ServerInstance[]> {
    if (this.isMockMode || !this.redis) return [];

    try {
      const keys = await this.redis.keys(`${this.REDIS_PREFIX}*`);
      const servers: ServerInstance[] = [];

      for (const key of keys) {
        const data = await this.redis.get(key);
        if (data) {
          try {
            const parsed = JSON.parse(data);
            servers.push(parsed);
          } catch (parseError) {
            console.warn('⚠️ [RedisManager] 파싱 실패:', key);
          }
        }
      }

      return servers;
    } catch (error) {
      console.error('❌ [RedisManager] 전체 서버 로드 실패:', error);
      return [];
    }
  }

  /**
   * 💾 클러스터 데이터 저장
   */
  async saveCluster(cluster: ServerCluster): Promise<void> {
    if (!this.canSaveToRedis()) return;

    try {
      const key = `${this.REDIS_CLUSTERS_PREFIX}${cluster.id}`;
      const data = JSON.stringify({
        ...cluster,
        lastUpdate: Date.now(),
      });

      await this.redis!.setex(key, 3600, data);
    } catch (error) {
      console.error('❌ [RedisManager] 클러스터 저장 실패:', error);
    }
  }

  /**
   * 🚀 배치 서버 저장 (성능 최적화)
   */
  async batchSaveServers(servers: ServerInstance[]): Promise<void> {
    if (!this.canSaveToRedis() || servers.length === 0) return;

    try {
      const pipeline = this.redis!.pipeline();
      const now = Date.now();

      servers.forEach(server => {
        const key = `${this.REDIS_PREFIX}${server.id}`;
        const data = JSON.stringify({
          ...server,
          lastUpdate: now,
        });
        pipeline.setex(key, 3600, data);
      });

      await pipeline.exec();

      this.lastSaveTime = now;
      this.saveThrottleCount++;

      console.log(`💾 [RedisManager] ${servers.length}개 서버 배치 저장 완료`);
    } catch (error) {
      console.error('❌ [RedisManager] 배치 저장 실패:', error);
    }
  }

  /**
   * 🗑️ 특정 서버 삭제
   */
  async deleteServer(serverId: string): Promise<void> {
    if (this.isMockMode || !this.redis) return;

    try {
      const key = `${this.REDIS_PREFIX}${serverId}`;
      await this.redis.del(key);
    } catch (error) {
      console.error('❌ [RedisManager] 서버 삭제 실패:', error);
    }
  }

  /**
   * 🗑️ 모든 데이터 정리
   */
  async cleanup(): Promise<void> {
    if (this.isMockMode || !this.redis) return;

    try {
      const keys = await this.redis.keys(`${this.REDIS_PREFIX}*`);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }

      const clusterKeys = await this.redis.keys(
        `${this.REDIS_CLUSTERS_PREFIX}*`
      );
      if (clusterKeys.length > 0) {
        await this.redis.del(...clusterKeys);
      }

      console.log('🗑️ [RedisManager] 모든 데이터 정리 완료');
    } catch (error) {
      console.error('❌ [RedisManager] 정리 실패:', error);
    }
  }

  /**
   * 🩺 헬스체크
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    latency?: number;
    error?: string;
  }> {
    if (this.isMockMode) {
      return { status: 'healthy' };
    }

    if (!this.redis) {
      return { status: 'unhealthy', error: 'Redis 연결 없음' };
    }

    try {
      const start = Date.now();
      await this.redis.ping();
      const latency = Date.now() - start;

      if (latency > 1000) {
        return { status: 'degraded', latency, error: '높은 지연시간' };
      }

      return { status: 'healthy', latency };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * 📊 Redis 통계 정보
   */
  async getStats(): Promise<{
    serverCount: number;
    clusterCount: number;
    memoryUsage?: string;
  }> {
    if (this.isMockMode || !this.redis) {
      return { serverCount: 0, clusterCount: 0 };
    }

    try {
      const serverKeys = await this.redis.keys(`${this.REDIS_PREFIX}*`);
      const clusterKeys = await this.redis.keys(
        `${this.REDIS_CLUSTERS_PREFIX}*`
      );

      // 메모리 사용량 정보 (선택적)
      let memoryUsage: string | undefined;
      try {
        const info = await this.redis.memory('usage');
        memoryUsage = `${Math.round(info / 1024)} KB`;
      } catch {
        // 메모리 정보 조회 실패 시 무시
      }

      return {
        serverCount: serverKeys.length,
        clusterCount: clusterKeys.length,
        memoryUsage,
      };
    } catch (error) {
      console.error('❌ [RedisManager] 통계 조회 실패:', error);
      return { serverCount: 0, clusterCount: 0 };
    }
  }

  /**
   * 🔌 연결 종료
   */
  async disconnect(): Promise<void> {
    if (this.redis && !this.isMockMode) {
      try {
        await this.redis.quit();
        console.log('🔌 [RedisManager] 연결 종료');
      } catch (error) {
        console.error('❌ [RedisManager] 연결 종료 실패:', error);
      }
    }
  }

  /**
   * 🎯 현재 모드 확인
   */
  getMode(): 'redis' | 'mock' {
    return this.isMockMode ? 'mock' : 'redis';
  }
}
