/**
 * 🌐 GCP Redis Service for Real Server Data Generator
 *
 * 목업 모드 완전 제거, 실제 GCP Redis 연결만 사용
 * 시간: 2025-07-02 04:16 KST
 * SOLID 원칙: 단일 책임 원칙 (Redis 연동만 담당)
 */

import { ServerCluster, ServerInstance } from '@/types/data-generator';

// Redis 타입 정의 (동적 import용)
type RedisType = any;

export interface GCPRedisServiceConfig {
  enableRedis: boolean;
  isHealthCheckContext: boolean;
  isTestContext: boolean;
  serverPrefix?: string;
  clustersPrefix?: string;
  appsPrefix?: string;
  ttl?: number;
  minSaveInterval?: number;
  maxSavesPerMinute?: number;
  gcpRedisHost?: string;
  gcpRedisPort?: number;
  gcpRedisPassword?: string;
}

export class GCPRedisService {
  private redis: RedisType | null = null;
  private readonly config: GCPRedisServiceConfig;

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

  constructor(config: GCPRedisServiceConfig) {
    this.config = config;

    // Redis 키 프리픽스 설정
    this.REDIS_PREFIX = config.serverPrefix || 'openmanager:gcp:servers:';
    this.REDIS_CLUSTERS_PREFIX =
      config.clustersPrefix || 'openmanager:gcp:clusters:';
    this.REDIS_APPS_PREFIX = config.appsPrefix || 'openmanager:gcp:apps:';

    // 제한 설정
    this.MIN_SAVE_INTERVAL = config.minSaveInterval || 5000; // 최소 5초 간격
    this.MAX_SAVES_PER_MINUTE = config.maxSavesPerMinute || 10; // 분당 최대 10회 저장

    // GCP Redis 초기화
    this.initializeGCPRedis();
  }

  /**
   * 🌐 GCP Redis 연결 초기화
   */
  private async initializeGCPRedis(): Promise<void> {
    if (!this.config.enableRedis) {
      console.log('🚫 Redis 비활성화됨 - GCP Redis 연결 건너뜀');
      return;
    }

    try {
      // 서버 환경에서만 Redis 동적 import
      const { default: Redis } = await import('ioredis');

      // GCP Redis 설정 (환경변수 또는 기본값)
      const gcpRedisHost = this.config.gcpRedisHost ||
        process.env.GCP_REDIS_HOST ||
        'charming-condor-46598.upstash.io';
      const gcpRedisPort = this.config.gcpRedisPort ||
        parseInt(process.env.GCP_REDIS_PORT || '6379');
      const gcpRedisPassword = this.config.gcpRedisPassword ||
        process.env.GCP_REDIS_PASSWORD ||
        'AbYGAAIjcDE5MjNmYjhiZDkwOGQ0MTUyOGFiZjUyMmQ0YTkyMzIwM3AxMA';

      // GCP Redis 연결 설정
      this.redis = new Redis({
        host: gcpRedisHost,
        port: gcpRedisPort,
        password: gcpRedisPassword,
        tls: {}, // GCP Redis는 TLS 필수
        maxRetriesPerRequest: 3,
        lazyConnect: true,
        connectTimeout: 10000,
        commandTimeout: 5000,
        enableReadyCheck: false,
      });

      // 연결 이벤트 핸들러
      this.redis.on('connect', () => {
        console.log('✅ GCP Redis 연결 성공');
      });

      this.redis.on('error', (error: any) => {
        console.error('❌ GCP Redis 연결 오류:', error);
        throw new Error(`GCP Redis 연결 실패: ${error.message}`);
      });

      this.redis.on('close', () => {
        console.warn('⚠️ GCP Redis 연결 종료');
      });

      console.log('🌐 GCP Redis 연결 설정 완료');
    } catch (error) {
      console.error('❌ GCP Redis 초기화 실패:', error);
      throw new Error(`GCP Redis 초기화 실패: ${error instanceof Error ? error.message : String(error)}`);
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
      console.warn('⚠️ 분당 최대 저장 횟수 초과 - GCP Redis 저장 건너뜀');
      return false;
    }

    return true;
  }

  /**
   * 🌐 서버 데이터를 GCP Redis에 저장
   */
  public async saveServer(server: ServerInstance): Promise<void> {
    if (!this.redis || !this.canSaveToRedis()) {
      throw new Error('GCP Redis 연결이 없거나 저장 제한에 걸렸습니다');
    }

    try {
      const key = `${this.REDIS_PREFIX}${server.id}`;
      const data = JSON.stringify({
        ...server,
        lastUpdated: new Date().toISOString(),
        source: 'gcp',
      });

      await this.redis.setex(key, this.config.ttl || 3600, data); // 기본 1시간 TTL
      await this.redis.sadd(`${this.REDIS_PREFIX}list`, server.id);

      this.lastSaveTime = Date.now();
      this.saveThrottleCount++;

      console.log(`✅ GCP Redis에 서버 데이터 저장 완료: ${server.id}`);
    } catch (error) {
      console.error(`❌ GCP Redis 서버 저장 실패 (${server.id}):`, error);
      throw new Error(`GCP Redis 저장 실패: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 🌐 GCP Redis에서 서버 데이터 조회
   */
  public async loadServer(serverId: string): Promise<ServerInstance | null> {
    if (!this.redis) {
      throw new Error('GCP Redis 연결이 없습니다');
    }

    try {
      const key = `${this.REDIS_PREFIX}${serverId}`;
      const data = await this.redis.get(key);

      if (data) {
        const server = JSON.parse(data) as ServerInstance;
        console.log(`✅ GCP Redis에서 서버 데이터 조회 완료: ${serverId}`);
        return server;
      }

      console.log(`⚠️ GCP Redis에서 서버 데이터를 찾을 수 없음: ${serverId}`);
      return null;
    } catch (error) {
      console.error(`❌ GCP Redis 서버 조회 실패 (${serverId}):`, error);
      throw new Error(`GCP Redis 조회 실패: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 🌐 GCP Redis에서 모든 서버 데이터 조회
   */
  public async loadAllServers(): Promise<ServerInstance[]> {
    if (!this.redis) {
      throw new Error('GCP Redis 연결이 없습니다');
    }

    try {
      const serverIds = await this.redis.smembers(`${this.REDIS_PREFIX}list`);
      const servers: ServerInstance[] = [];

      for (const serverId of serverIds) {
        const server = await this.loadServer(serverId);
        if (server) {
          servers.push(server);
        }
      }

      console.log(`✅ GCP Redis에서 ${servers.length}개 서버 데이터 조회 완료`);
      return servers;
    } catch (error) {
      console.error('❌ GCP Redis 모든 서버 조회 실패:', error);
      throw new Error(`GCP Redis 전체 조회 실패: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 🌐 클러스터 데이터를 GCP Redis에 저장
   */
  public async saveCluster(cluster: ServerCluster): Promise<void> {
    if (!this.redis || !this.canSaveToRedis()) {
      throw new Error('GCP Redis 연결이 없거나 저장 제한에 걸렸습니다');
    }

    try {
      const key = `${this.REDIS_CLUSTERS_PREFIX}${cluster.id}`;
      const data = JSON.stringify({
        ...cluster,
        lastUpdated: new Date().toISOString(),
        source: 'gcp',
      });

      await this.redis.setex(key, this.config.ttl || 3600, data);
      console.log(`✅ GCP Redis에 클러스터 데이터 저장 완료: ${cluster.id}`);
    } catch (error) {
      console.error(`❌ GCP Redis 클러스터 저장 실패 (${cluster.id}):`, error);
      throw new Error(`GCP Redis 클러스터 저장 실패: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 🌐 여러 서버를 GCP Redis에 배치 저장
   */
  public async batchSaveServers(servers: ServerInstance[]): Promise<void> {
    if (!this.redis) {
      throw new Error('GCP Redis 연결이 없습니다');
    }

    try {
      const pipeline = this.redis.pipeline();

      for (const server of servers) {
        const key = `${this.REDIS_PREFIX}${server.id}`;
        const data = JSON.stringify({
          ...server,
          lastUpdated: new Date().toISOString(),
          source: 'gcp',
        });

        pipeline.setex(key, this.config.ttl || 3600, data);
        pipeline.sadd(`${this.REDIS_PREFIX}list`, server.id);
      }

      await pipeline.exec();
      console.log(`✅ GCP Redis에 ${servers.length}개 서버 배치 저장 완료`);
    } catch (error) {
      console.error('❌ GCP Redis 배치 저장 실패:', error);
      throw new Error(`GCP Redis 배치 저장 실패: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 🌐 GCP Redis 연결 상태 확인
   */
  public isConnected(): boolean {
    return this.redis !== null && this.redis.status === 'ready';
  }

  /**
   * 🌐 GCP Redis 연결 종료
   */
  public async dispose(): Promise<void> {
    if (this.redis) {
      await this.redis.quit();
      this.redis = null;
      console.log('🌐 GCP Redis 연결 종료 완료');
    }
  }

  /**
   * 🌐 GCP Redis 서비스 상태 조회
   */
  public getStatus(): {
    connected: boolean;
    lastSaveTime: number;
    saveThrottleCount: number;
    minSaveInterval: number;
    maxSavesPerMinute: number;
    gcpIntegration: boolean;
  } {
    return {
      connected: this.isConnected(),
      lastSaveTime: this.lastSaveTime,
      saveThrottleCount: this.saveThrottleCount,
      minSaveInterval: this.MIN_SAVE_INTERVAL,
      maxSavesPerMinute: this.MAX_SAVES_PER_MINUTE,
      gcpIntegration: true,
    };
  }
}

// 🔧 GCP Redis 서비스 팩토리 함수
export function createGCPRedisService(config: GCPRedisServiceConfig): GCPRedisService {
  return new GCPRedisService(config);
}

// 🚫 레거시 호환성 (사용 금지)
export const RedisService = GCPRedisService;
