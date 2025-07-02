/**
 * 🔴 Redis Service for Real Server Data Generator
 *
 * 목적: RealServerDataGenerator에서 Redis 로직을 분리
 * 시간: 2025-07-02 04:16 KST
 * SOLID 원칙: 단일 책임 원칙 (Redis 연동만 담당)
 */

import { ServerCluster, ServerInstance } from '@/types/data-generator';

// Redis 타입 정의 (동적 import용)
type RedisType = any;

export interface RedisServiceConfig {
  enableRedis: boolean;
  isMockMode: boolean;
  isHealthCheckContext: boolean;
  isTestContext: boolean;
  serverPrefix?: string;
  clustersPrefix?: string;
  appsPrefix?: string;
  ttl?: number;
  minSaveInterval?: number;
  maxSavesPerMinute?: number;
}

export class RedisService {
  private redis: RedisType | null = null;
  private readonly config: RedisServiceConfig;

  // Redis 키 프리픽스
  private readonly REDIS_PREFIX: string;
  private readonly REDIS_CLUSTERS_PREFIX: string;
  private readonly REDIS_APPS_PREFIX: string;

  // 🛡️ 안전 장치: 과도한 갱신 방지
  private lastSaveTime = 0;
  private readonly MIN_SAVE_INTERVAL: number;
  private saveThrottleCount = 0;
  private readonly MAX_SAVES_PER_MINUTE: number;
  private lastMinuteTimestamp = 0;

  constructor(config: RedisServiceConfig) {
    this.config = config;

    // Redis 키 프리픽스 설정
    this.REDIS_PREFIX = config.serverPrefix || 'openmanager:servers:';
    this.REDIS_CLUSTERS_PREFIX =
      config.clustersPrefix || 'openmanager:clusters:';
    this.REDIS_APPS_PREFIX = config.appsPrefix || 'openmanager:apps:';

    // 제한 설정
    this.MIN_SAVE_INTERVAL = config.minSaveInterval || 5000; // 최소 5초 간격
    this.MAX_SAVES_PER_MINUTE = config.maxSavesPerMinute || 10; // 분당 최대 10회 저장

    // Redis 초기화
    this.initializeRedis();
  }

  /**
   * 🔴 Redis 연결 초기화 (목업 모드 지원)
   */
  private async initializeRedis(): Promise<void> {
    // 베르셀 환경에서는 항상 Mock 모드 사용
    if (
      process.env.VERCEL === '1' ||
      typeof window !== 'undefined' ||
      !this.config.enableRedis ||
      this.config.isMockMode
    ) {
      console.log(
        '🎭 목업 Redis 모드로 실행 - 실제 Redis 연결 건너뜀 (베르셀 환경)'
      );
      return;
    }

    try {
      // 서버 환경에서만 Redis 동적 import
      const { default: Redis } = await import('ioredis');

      // 환경변수에서 Redis 설정 가져오기
      const redisUrl = process.env.REDIS_URL || process.env.KV_URL;
      const redisHost =
        process.env.REDIS_HOST || 'charming-condor-46598.upstash.io';
      const redisPort = parseInt(process.env.REDIS_PORT || '6379');
      const redisPassword =
        process.env.REDIS_PASSWORD ||
        process.env.KV_REST_API_TOKEN ||
        'AbYGAAIjcDE5MjNmYjhiZDkwOGQ0MTUyOGFiZjUyMmQ0YTkyMzIwM3AxMA';

      // Redis URL이 있으면 우선 사용
      if (redisUrl) {
        this.redis = new Redis(redisUrl, {
          maxRetriesPerRequest: 2,
          lazyConnect: true,
          connectTimeout: 5000,
          commandTimeout: 3000,
        });
      } else {
        // 개별 설정으로 연결
        this.redis = new Redis({
          host: redisHost,
          port: redisPort,
          password: redisPassword,
          tls: {},
          maxRetriesPerRequest: 2,
          lazyConnect: true,
          connectTimeout: 5000,
          commandTimeout: 3000,
        });
      }

      // 연결 이벤트 핸들러
      this.redis.on('connect', () => {
        console.log('✅ Redis 연결 성공');
      });

      this.redis.on('error', (error: any) => {
        console.warn('⚠️ Redis 연결 오류:', error);
      });

      console.log('🔴 Redis 연결 설정 완료');
    } catch (error) {
      console.warn('⚠️ Redis 초기화 실패:', error);
      this.redis = null;
    }
  }

  /**
   * 🛡️ Redis 저장 가능 여부 체크 (Rate Limiting)
   */
  private canSaveToRedis(): boolean {
    const now = Date.now();

    // 1. 최소 간격 체크
    if (now - this.lastSaveTime < this.MIN_SAVE_INTERVAL) {
      return false;
    }

    // 2. 분당 저장 횟수 체크
    if (now - this.lastMinuteTimestamp > 60000) {
      // 새로운 분 시작
      this.lastMinuteTimestamp = now;
      this.saveThrottleCount = 0;
    }

    if (this.saveThrottleCount >= this.MAX_SAVES_PER_MINUTE) {
      console.warn('⚠️ 분당 최대 저장 횟수 초과 - Redis 저장 건너뜀');
      return false;
    }

    return true;
  }

  /**
   * 🔴 서버 데이터를 Redis에 저장
   */
  public async saveServer(server: ServerInstance): Promise<void> {
    if (this.config.isMockMode) {
      // 목업 모드에서는 메모리에만 저장
      return;
    }

    if (!this.redis || !this.canSaveToRedis()) return;

    try {
      const key = `${this.REDIS_PREFIX}${server.id}`;
      const data = JSON.stringify({
        ...server,
        lastUpdated: new Date().toISOString(),
      });

      await this.redis.setex(key, this.config.ttl || 3600, data); // 기본 1시간 TTL
      await this.redis.sadd(`${this.REDIS_PREFIX}list`, server.id);

      this.lastSaveTime = Date.now();
      this.saveThrottleCount++;
    } catch (error) {
      console.warn(`⚠️ Redis 서버 저장 실패 (${server.id}):`, error);
    }
  }

  /**
   * 🔴 Redis에서 서버 데이터 조회
   */
  public async loadServer(serverId: string): Promise<ServerInstance | null> {
    if (!this.redis) return null;

    try {
      const key = `${this.REDIS_PREFIX}${serverId}`;
      const data = await this.redis.get(key);

      if (data) {
        return JSON.parse(data) as ServerInstance;
      }
    } catch (error) {
      console.warn(`⚠️ Redis 서버 조회 실패 (${serverId}):`, error);
    }

    return null;
  }

  /**
   * 🔴 Redis에서 모든 서버 데이터 조회
   */
  public async loadAllServers(): Promise<ServerInstance[]> {
    if (!this.redis) return [];

    try {
      const serverIds = await this.redis.smembers(`${this.REDIS_PREFIX}list`);
      const servers: ServerInstance[] = [];

      for (const serverId of serverIds) {
        const server = await this.loadServer(serverId);
        if (server) {
          servers.push(server);
        }
      }

      console.log(`📊 Redis에서 ${servers.length}개 서버 데이터 로드됨`);
      return servers;
    } catch (error) {
      console.warn('⚠️ Redis 전체 서버 조회 실패:', error);
      return [];
    }
  }

  /**
   * 🔴 클러스터 데이터를 Redis에 저장
   */
  public async saveCluster(cluster: ServerCluster): Promise<void> {
    if (!this.redis || this.config.isMockMode) return;

    try {
      const key = `${this.REDIS_CLUSTERS_PREFIX}${cluster.id}`;
      const data = JSON.stringify({
        ...cluster,
        lastUpdated: new Date().toISOString(),
      });

      await this.redis.setex(key, this.config.ttl || 3600, data);
      await this.redis.sadd(`${this.REDIS_CLUSTERS_PREFIX}list`, cluster.id);
    } catch (error) {
      console.warn(`⚠️ Redis 클러스터 저장 실패 (${cluster.id}):`, error);
    }
  }

  /**
   * 🔴 여러 서버를 배치로 Redis에 저장 (성능 개선)
   */
  public async batchSaveServers(servers: ServerInstance[]): Promise<void> {
    if (this.config.isMockMode) {
      console.log(`🎭 목업 모드: ${servers.length}개 서버 메모리 저장 완료`);
      return;
    }

    if (!this.redis || !this.canSaveToRedis()) {
      return;
    }

    try {
      const pipeline = this.redis.pipeline();

      for (const server of servers) {
        const key = `${this.REDIS_PREFIX}${server.id}`;
        const data = JSON.stringify({
          ...server,
          lastUpdated: new Date().toISOString(),
        });

        pipeline.setex(key, this.config.ttl || 3600, data);
        pipeline.sadd(`${this.REDIS_PREFIX}list`, server.id);
      }

      await pipeline.exec();

      this.lastSaveTime = Date.now();
      this.saveThrottleCount++;

      console.log(`📊 Redis 배치 저장 완료: ${servers.length}개 서버`);
    } catch (error) {
      console.warn(`⚠️ Redis 배치 저장 실패:`, error);
    }
  }

  /**
   * 🏥 Redis 연결 상태 체크
   */
  public isConnected(): boolean {
    return this.redis !== null && !this.config.isMockMode;
  }

  /**
   * 🧹 Redis 연결 정리
   */
  public async dispose(): Promise<void> {
    if (this.redis) {
      await this.redis.quit();
      this.redis = null;
    }
  }

  /**
   * 📊 Redis 서비스 상태 정보
   */
  public getStatus(): {
    connected: boolean;
    mockMode: boolean;
    lastSaveTime: number;
    saveThrottleCount: number;
    minSaveInterval: number;
    maxSavesPerMinute: number;
  } {
    return {
      connected: this.isConnected(),
      mockMode: this.config.isMockMode,
      lastSaveTime: this.lastSaveTime,
      saveThrottleCount: this.saveThrottleCount,
      minSaveInterval: this.MIN_SAVE_INTERVAL,
      maxSavesPerMinute: this.MAX_SAVES_PER_MINUTE,
    };
  }
}
