/**
 * 🔥 Redis 연결 관리자 v2.0
 * 
 * OpenManager AI v5.12.0 - 고성능 Redis 연결 풀
 * - 연결 풀 관리
 * - 자동 장애 복구
 * - 성능 모니터링
 * - 클러스터 지원
 */

import { getRedisConfig, getRedisUrl, getRedisClusterConfig, validateRedisConfig } from '../config/redis.config';

// Redis 클라이언트 타입 (동적 import)
let Redis: any = null;
let Cluster: any = null;

interface ConnectionStats {
  totalConnections: number;
  activeConnections: number;
  failedConnections: number;
  lastConnectionTime: number;
  averageResponseTime: number;
  totalCommands: number;
}

interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime: number;
  memoryUsage?: number;
  connectedClients?: number;
  lastError?: string;
}

export class RedisConnectionManager {
  private static instance: RedisConnectionManager;
  private redisClient: any = null;
  private isConnected: boolean = false;
  private connectionAttempts: number = 0;
  private lastHealthCheck: number = 0;
  private stats: ConnectionStats = {
    totalConnections: 0,
    activeConnections: 0,
    failedConnections: 0,
    lastConnectionTime: 0,
    averageResponseTime: 0,
    totalCommands: 0
  };

  static getInstance(): RedisConnectionManager {
    if (!this.instance) {
      this.instance = new RedisConnectionManager();
    }
    return this.instance;
  }

  /**
   * 🚀 Redis 연결 초기화
   */
  async initialize(): Promise<boolean> {
    try {
      // 클라이언트 사이드에서는 Redis 사용 안 함
      if (typeof window !== 'undefined') {
        console.log('🌐 클라이언트 환경: Redis 연결 건너뛰기');
        return false;
      }

      console.log('🔄 Redis 연결 초기화 시작...');

      // Redis 라이브러리 동적 로드
      const ioredis = await import('ioredis');
      Redis = ioredis.Redis;
      Cluster = ioredis.Cluster;

      // 클러스터 모드 확인
      const clusterConfig = getRedisClusterConfig();
      if (clusterConfig) {
        console.log('🔗 Redis 클러스터 모드 감지');
        return await this.initializeCluster(clusterConfig);
      }

      // 단일 인스턴스 모드
      return await this.initializeSingleInstance();

    } catch (error) {
      console.error('❌ Redis 초기화 실패:', error);
      this.stats.failedConnections++;
      return false;
    }
  }

  /**
   * 🔧 단일 인스턴스 연결
   */
  private async initializeSingleInstance(): Promise<boolean> {
    try {
      const config = getRedisConfig();
      const validation = validateRedisConfig(config);

      if (!validation.valid) {
        console.error('❌ Redis 설정 오류:', validation.errors);
        return false;
      }

      console.log(`🔧 Redis 연결 설정: ${config.host}:${config.port}`);

      this.redisClient = new Redis({
        ...config,
        retryDelayOnFailover: config.retryDelayOnFailover,
        enableOfflineQueue: false,
        
        // 이벤트 핸들러
        onFailover: () => {
          console.log('🔄 Redis 장애복구 중...');
        }
      });

      // 연결 이벤트 핸들러
      this.setupEventHandlers();

      // 연결 대기
      await this.waitForConnection();
      
      console.log('✅ Redis 단일 인스턴스 연결 성공');
      this.stats.totalConnections++;
      this.stats.activeConnections = 1;
      this.stats.lastConnectionTime = Date.now();
      this.isConnected = true;

      return true;

    } catch (error) {
      console.error('❌ Redis 단일 인스턴스 연결 실패:', error);
      this.stats.failedConnections++;
      return false;
    }
  }

  /**
   * 🔗 클러스터 연결
   */
  private async initializeCluster(clusterConfig: any): Promise<boolean> {
    try {
      console.log(`🔗 Redis 클러스터 연결: ${clusterConfig.nodes.length}개 노드`);

      this.redisClient = new Cluster(clusterConfig.nodes, clusterConfig.options);

      this.setupEventHandlers();
      await this.waitForConnection();

      console.log('✅ Redis 클러스터 연결 성공');
      this.stats.totalConnections++;
      this.stats.activeConnections = clusterConfig.nodes.length;
      this.stats.lastConnectionTime = Date.now();
      this.isConnected = true;

      return true;

    } catch (error) {
      console.error('❌ Redis 클러스터 연결 실패:', error);
      this.stats.failedConnections++;
      return false;
    }
  }

  /**
   * 🎧 이벤트 핸들러 설정
   */
  private setupEventHandlers(): void {
    if (!this.redisClient) return;

    this.redisClient.on('connect', () => {
      console.log('🔗 Redis 연결됨');
      this.isConnected = true;
      this.connectionAttempts = 0;
    });

    this.redisClient.on('ready', () => {
      console.log('✅ Redis 준비 완료');
    });

    this.redisClient.on('error', (error: Error) => {
      console.error('❌ Redis 오류:', error.message);
      this.isConnected = false;
      this.stats.failedConnections++;
    });

    this.redisClient.on('close', () => {
      console.log('🔌 Redis 연결 닫힘');
      this.isConnected = false;
    });

    this.redisClient.on('reconnecting', () => {
      console.log('🔄 Redis 재연결 중...');
      this.connectionAttempts++;
    });

    this.redisClient.on('end', () => {
      console.log('🔚 Redis 연결 종료');
      this.isConnected = false;
      this.stats.activeConnections = 0;
    });
  }

  /**
   * ⏳ 연결 대기
   */
  private async waitForConnection(timeout: number = 10000): Promise<void> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error('Redis 연결 타임아웃'));
      }, timeout);

      if (this.redisClient.status === 'ready') {
        clearTimeout(timer);
        resolve();
      } else {
        this.redisClient.once('ready', () => {
          clearTimeout(timer);
          resolve();
        });

        this.redisClient.once('error', (error: Error) => {
          clearTimeout(timer);
          reject(error);
        });
      }
    });
  }

  /**
   * 🔍 연결 상태 확인
   */
  isRedisConnected(): boolean {
    return this.isConnected && this.redisClient && this.redisClient.status === 'ready';
  }

  /**
   * 🏥 건강 상태 검사
   */
  async performHealthCheck(): Promise<HealthCheckResult> {
    const startTime = Date.now();

    try {
      if (!this.isRedisConnected()) {
        return {
          status: 'unhealthy',
          responseTime: 0,
          lastError: 'Redis 연결되지 않음'
        };
      }

      // 핑 테스트
      const pingStart = Date.now();
      await this.redisClient.ping();
      const responseTime = Date.now() - pingStart;

      // Redis 정보 수집
      const info = await this.redisClient.info();
      const memoryInfo = this.parseRedisInfo(info, 'memory');
      const clientInfo = this.parseRedisInfo(info, 'clients');

      this.lastHealthCheck = Date.now();

      // 응답시간 업데이트
      this.updateAverageResponseTime(responseTime);

      // 상태 판정
      let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
      if (responseTime > 1000) {
        status = 'degraded';
      } else if (responseTime > 5000) {
        status = 'unhealthy';
      }

      return {
        status,
        responseTime,
        memoryUsage: memoryInfo?.used_memory ? parseInt(memoryInfo.used_memory) : undefined,
        connectedClients: clientInfo?.connected_clients ? parseInt(clientInfo.connected_clients) : undefined
      };

    } catch (error) {
      return {
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        lastError: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * 📊 Redis 정보 파싱
   */
  private parseRedisInfo(info: string, section: string): Record<string, string> | null {
    const lines = info.split('\n');
    const sectionStart = lines.findIndex(line => line.includes(`# ${section.charAt(0).toUpperCase() + section.slice(1)}`));
    
    if (sectionStart === -1) return null;

    const result: Record<string, string> = {};
    for (let i = sectionStart + 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith('#') || line === '') break;
      
      const [key, value] = line.split(':');
      if (key && value) {
        result[key] = value;
      }
    }

    return result;
  }

  /**
   * 📈 평균 응답시간 업데이트
   */
  private updateAverageResponseTime(responseTime: number): void {
    const { averageResponseTime, totalCommands } = this.stats;
    this.stats.averageResponseTime = ((averageResponseTime * totalCommands) + responseTime) / (totalCommands + 1);
    this.stats.totalCommands++;
  }

  /**
   * 🔧 Redis 클라이언트 가져오기
   */
  getClient(): any {
    if (!this.isRedisConnected()) {
      console.warn('⚠️ Redis가 연결되지 않음');
      return null;
    }
    return this.redisClient;
  }

  /**
   * 📊 연결 통계 조회
   */
  getConnectionStats(): ConnectionStats & { 
    isConnected: boolean; 
    lastHealthCheck: string | null;
    connectionAttempts: number;
  } {
    return {
      ...this.stats,
      isConnected: this.isConnected,
      lastHealthCheck: this.lastHealthCheck ? new Date(this.lastHealthCheck).toISOString() : null,
      connectionAttempts: this.connectionAttempts
    };
  }

  /**
   * 🔌 연결 종료
   */
  async disconnect(): Promise<void> {
    if (this.redisClient) {
      try {
        await this.redisClient.quit();
        console.log('👋 Redis 연결 정상 종료');
      } catch (error) {
        console.error('❌ Redis 연결 종료 중 오류:', error);
      } finally {
        this.redisClient = null;
        this.isConnected = false;
        this.stats.activeConnections = 0;
      }
    }
  }

  /**
   * 🔄 연결 재시도
   */
  async reconnect(): Promise<boolean> {
    console.log('🔄 Redis 연결 재시도...');
    
    await this.disconnect();
    
    // 잠시 대기 후 재연결
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return await this.initialize();
  }
}

// 싱글톤 인스턴스 export
export const redisConnectionManager = RedisConnectionManager.getInstance(); 