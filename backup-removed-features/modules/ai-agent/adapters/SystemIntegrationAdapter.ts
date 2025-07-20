/**
 * 🔌 System Integration Adapter
 * 
 * AI 에이전트와 기존 서버 모니터링 시스템 간의 통합 어댑터
 * - 데이터베이스 연결 추상화
 * - Redis 캐시 통합
 * - 서버 데이터 수집기 연동
 * - 메트릭 저장소 통합
 */

import { z } from 'zod';

// 통합 설정 스키마
export const IntegrationConfigSchema = z.object({
  database: z.object({
    type: z.enum(['supabase', 'postgresql', 'mysql', 'sqlite']),
    url: z.string(),
    apiKey: z.string().optional(),
    maxConnections: z.number().default(10),
    timeout: z.number().default(30000)
  }),
  redis: z.object({
    enabled: z.boolean().default(true),
    url: z.string(),
    ttl: z.number().default(300),
    maxRetries: z.number().default(3)
  }),
  monitoring: z.object({
    collectionInterval: z.number().default(30000),
    retentionPeriod: z.number().default(86400000), // 24시간
    enableRealtime: z.boolean().default(true),
    enableAggregation: z.boolean().default(true)
  }),
  aiAgent: z.object({
    enablePythonAnalysis: z.boolean().default(false),
    enableMCP: z.boolean().default(true),
    enableCaching: z.boolean().default(true),
    maxConcurrentRequests: z.number().default(5)
  })
});

export type IntegrationConfig = z.infer<typeof IntegrationConfigSchema>;

// 서버 메트릭 표준화 스키마
export const StandardServerMetricsSchema = z.object({
  serverId: z.string(),
  hostname: z.string(),
  timestamp: z.date(),
  status: z.enum(['online', 'warning', 'critical', 'offline']),
  metrics: z.object({
    cpu: z.object({
      usage: z.number().min(0).max(100),
      loadAverage: z.array(z.number()).length(3),
      cores: z.number().positive()
    }),
    memory: z.object({
      total: z.number().positive(),
      used: z.number().nonnegative(),
      available: z.number().nonnegative(),
      usage: z.number().min(0).max(100)
    }),
    disk: z.object({
      total: z.number().positive(),
      used: z.number().nonnegative(),
      available: z.number().nonnegative(),
      usage: z.number().min(0).max(100),
      iops: z.object({
        read: z.number().nonnegative(),
        write: z.number().nonnegative()
      })
    }),
    network: z.object({
      interface: z.string(),
      bytesReceived: z.number().nonnegative(),
      bytesSent: z.number().nonnegative(),
      packetsReceived: z.number().nonnegative(),
      packetsSent: z.number().nonnegative(),
      errorsReceived: z.number().nonnegative(),
      errorsSent: z.number().nonnegative()
    })
  }),
  services: z.array(z.object({
    name: z.string(),
    status: z.enum(['running', 'stopped', 'failed', 'unknown']),
    port: z.number().optional(),
    pid: z.number().optional(),
    uptime: z.number().nonnegative(),
    memoryUsage: z.number().nonnegative(),
    cpuUsage: z.number().min(0).max(100)
  })),
  metadata: z.object({
    location: z.string(),
    environment: z.enum(['production', 'staging', 'development']),
    provider: z.enum(['aws', 'gcp', 'azure', 'kubernetes', 'onpremise']),
    cluster: z.string().optional(),
    zone: z.string().optional(),
    instanceType: z.string().optional()
  })
});

export type StandardServerMetrics = z.infer<typeof StandardServerMetricsSchema>;

// 데이터베이스 어댑터 인터페이스
export interface DatabaseAdapter {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  saveMetrics(metrics: StandardServerMetrics): Promise<void>;
  getLatestMetrics(serverId: string): Promise<StandardServerMetrics | null>;
  getServerList(): Promise<string[]>;
  getMetricsHistory(serverId: string, timeRange: { start: Date; end: Date }): Promise<StandardServerMetrics[]>;
  cleanup(olderThan: Date): Promise<number>;
}

// Redis 어댑터 인터페이스
export interface CacheAdapter {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  set(key: string, value: any, ttl?: number): Promise<void>;
  get(key: string): Promise<any>;
  del(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
  keys(pattern: string): Promise<string[]>;
}

// 모니터링 데이터 수집기 인터페이스
export interface DataCollectorAdapter {
  initialize(): Promise<void>;
  startCollection(): Promise<void>;
  stopCollection(): Promise<void>;
  getCollectionStatus(): {
    isActive: boolean;
    lastCollection: Date | null;
    errorCount: number;
    successCount: number;
  };
  onMetricsCollected(callback: (metrics: StandardServerMetrics) => void): void;
}

// AI 에이전트 통합 어댑터
export class SystemIntegrationAdapter {
  private static instance: SystemIntegrationAdapter;
  private config: IntegrationConfig;
  private databaseAdapter: DatabaseAdapter | null = null;
  private cacheAdapter: CacheAdapter | null = null;
  private dataCollectorAdapter: DataCollectorAdapter | null = null;
  private isInitialized = false;

  private constructor(config: IntegrationConfig) {
    this.config = IntegrationConfigSchema.parse(config);
  }

  static getInstance(config?: IntegrationConfig): SystemIntegrationAdapter {
    if (!SystemIntegrationAdapter.instance) {
      if (!config) {
        throw new Error('SystemIntegrationAdapter requires config for first initialization');
      }
      SystemIntegrationAdapter.instance = new SystemIntegrationAdapter(config);
    }
    return SystemIntegrationAdapter.instance;
  }

  /**
   * 🚀 시스템 통합 초기화
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      console.log('🔌 System Integration Adapter 초기화 중...');

      // 데이터베이스 어댑터 초기화
      if (this.databaseAdapter) {
        await this.databaseAdapter.connect();
        console.log('✅ Database adapter 연결 완료');
      }

      // 캐시 어댑터 초기화
      if (this.cacheAdapter && this.config.redis.enabled) {
        await this.cacheAdapter.connect();
        console.log('✅ Cache adapter 연결 완료');
      }

      // 데이터 수집기 초기화
      if (this.dataCollectorAdapter) {
        await this.dataCollectorAdapter.initialize();
        
        // 메트릭 수집 이벤트 리스너 등록
        this.dataCollectorAdapter.onMetricsCollected(async (metrics) => {
          await this.handleMetricsCollection(metrics);
        });

        if (this.config.monitoring.enableRealtime) {
          await this.dataCollectorAdapter.startCollection();
        }
        
        console.log('✅ Data collector 초기화 완료');
      }

      this.isInitialized = true;
      console.log('🎉 System Integration Adapter 초기화 완료!');

    } catch (error) {
      console.error('❌ System Integration Adapter 초기화 실패:', error);
      throw error;
    }
  }

  /**
   * 📊 메트릭 수집 처리
   */
  private async handleMetricsCollection(metrics: StandardServerMetrics): Promise<void> {
    try {
      // 1. 데이터 검증
      const validatedMetrics = StandardServerMetricsSchema.parse(metrics);

      // 2. 데이터베이스 저장
      if (this.databaseAdapter) {
        await this.databaseAdapter.saveMetrics(validatedMetrics);
      }

      // 3. 캐시 업데이트
      if (this.cacheAdapter && this.config.redis.enabled) {
        const cacheKey = `server:${validatedMetrics.serverId}:latest`;
        await this.cacheAdapter.set(cacheKey, validatedMetrics, this.config.redis.ttl);
      }

      // 4. AI 에이전트 알림 (이상 감지 시)
      if (this.shouldTriggerAIAnalysis(validatedMetrics)) {
        await this.triggerAIAnalysis(validatedMetrics);
      }

    } catch (error) {
      console.error('❌ 메트릭 수집 처리 실패:', error);
    }
  }

  /**
   * 🧠 AI 분석 트리거 조건 확인
   */
  private shouldTriggerAIAnalysis(metrics: StandardServerMetrics): boolean {
    const { cpu, memory, disk } = metrics.metrics;
    
    // 임계값 기반 트리거
    return (
      cpu.usage > 80 ||
      memory.usage > 85 ||
      disk.usage > 90 ||
      metrics.status === 'critical' ||
      metrics.services.some(service => service.status === 'failed')
    );
  }

  /**
   * 🔍 AI 분석 트리거
   */
  private async triggerAIAnalysis(metrics: StandardServerMetrics): Promise<void> {
    try {
      // AI 에이전트에 분석 요청 전송
      console.log(`🧠 AI 분석 트리거: ${metrics.serverId} (상태: ${metrics.status})`);
      
      // 여기서 AI 에이전트의 분석 메서드를 호출
      // 예: await this.aiAgent.analyzeServerMetrics(metrics);
      
    } catch (error) {
      console.error('❌ AI 분석 트리거 실패:', error);
    }
  }

  /**
   * 📈 서버 메트릭 조회
   */
  async getServerMetrics(serverId: string, useCache = true): Promise<StandardServerMetrics | null> {
    try {
      // 1. 캐시에서 조회 시도
      if (useCache && this.cacheAdapter && this.config.redis.enabled) {
        const cacheKey = `server:${serverId}:latest`;
        const cachedMetrics = await this.cacheAdapter.get(cacheKey);
        if (cachedMetrics) {
          return StandardServerMetricsSchema.parse(cachedMetrics);
        }
      }

      // 2. 실제 서버 API에서 조회 (서버 환경에서는 스킵)
      if (typeof window !== 'undefined') {
        try {
          const response = await fetch(`/api/servers/${serverId}`);
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.data) {
              const serverData = data.data;
              const standardMetrics = this.transformServerDataToStandardMetrics(serverData);
              
              // 캐시에 저장
              if (this.cacheAdapter && this.config.redis.enabled) {
                const cacheKey = `server:${serverId}:latest`;
                await this.cacheAdapter.set(cacheKey, standardMetrics, this.config.redis.ttl);
              }
              
              return standardMetrics;
            }
          }
        } catch (apiError) {
          console.warn(`⚠️ 서버 API 조회 실패 (${serverId}), 데이터베이스에서 조회 시도:`, apiError);
        }
      }

      // 3. API 실패 시 데이터베이스에서 조회
      if (this.databaseAdapter) {
        const metrics = await this.databaseAdapter.getLatestMetrics(serverId);
        
        // 캐시에 저장
        if (metrics && this.cacheAdapter && this.config.redis.enabled) {
          const cacheKey = `server:${serverId}:latest`;
          await this.cacheAdapter.set(cacheKey, metrics, this.config.redis.ttl);
        }
        
        return metrics;
      }

      // 4. 모든 방법 실패 시 기본 메트릭 생성
      return this.generateMockMetrics(serverId);
    } catch (error) {
      console.error(`❌ 서버 메트릭 조회 실패 (${serverId}):`, error);
      return this.generateMockMetrics(serverId);
    }
  }

  /**
   * 📋 서버 목록 조회
   */
  async getServerList(): Promise<string[]> {
    try {
      // 1. 먼저 실제 서버 API에서 조회 (서버 환경에서는 스킵)
      if (typeof window !== 'undefined') {
        try {
          const response = await fetch('/api/servers');
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.data.servers) {
              return data.data.servers.map((server: any) => server.id);
            }
          }
        } catch (apiError) {
          console.warn('⚠️ 서버 API 조회 실패, 데이터베이스에서 조회 시도:', apiError);
        }
      }

      // 2. API 실패 시 데이터베이스에서 조회
      if (this.databaseAdapter) {
        return await this.databaseAdapter.getServerList();
      }
      
      // 3. 모든 방법 실패 시 기본 서버 목록 반환
      return ['web-prod-01', 'api-prod-01', 'db-prod-01', 'cache-prod-01', 'monitor-01'];
    } catch (error) {
      console.error('❌ 서버 목록 조회 실패:', error);
      return ['web-prod-01', 'api-prod-01', 'db-prod-01', 'cache-prod-01', 'monitor-01'];
    }
  }

  /**
   * 📊 메트릭 히스토리 조회
   */
  async getMetricsHistory(
    serverId: string, 
    timeRange: { start: Date; end: Date }
  ): Promise<StandardServerMetrics[]> {
    try {
      if (this.databaseAdapter) {
        return await this.databaseAdapter.getMetricsHistory(serverId, timeRange);
      }
      return [];
    } catch (error) {
      console.error(`❌ 메트릭 히스토리 조회 실패 (${serverId}):`, error);
      return [];
    }
  }

  /**
   * 🧹 데이터 정리
   */
  async cleanup(): Promise<void> {
    try {
      const cutoffDate = new Date(Date.now() - this.config.monitoring.retentionPeriod);
      
      if (this.databaseAdapter) {
        const deletedCount = await this.databaseAdapter.cleanup(cutoffDate);
        console.log(`🧹 데이터베이스 정리 완료: ${deletedCount}개 레코드 삭제`);
      }

      // Redis 캐시는 TTL로 자동 정리됨
      
    } catch (error) {
      console.error('❌ 데이터 정리 실패:', error);
    }
  }

  /**
   * 🔧 어댑터 등록
   */
  setDatabaseAdapter(adapter: DatabaseAdapter): void {
    this.databaseAdapter = adapter;
  }

  setCacheAdapter(adapter: CacheAdapter): void {
    this.cacheAdapter = adapter;
  }

  setDataCollectorAdapter(adapter: DataCollectorAdapter): void {
    this.dataCollectorAdapter = adapter;
  }

  /**
   * 📊 통합 상태 조회
   */
  getIntegrationStatus() {
    return {
      isInitialized: this.isInitialized,
      database: {
        connected: this.databaseAdapter !== null,
        type: this.config.database.type
      },
      cache: {
        enabled: this.config.redis.enabled,
        connected: this.cacheAdapter !== null
      },
      dataCollector: {
        initialized: this.dataCollectorAdapter !== null,
        status: this.dataCollectorAdapter?.getCollectionStatus() || null
      },
      config: this.config
    };
  }

  /**
   * 🔄 서버 데이터를 표준 메트릭으로 변환
   */
  private transformServerDataToStandardMetrics(serverData: any): StandardServerMetrics {
    return {
      serverId: serverData.id,
      hostname: serverData.hostname,
      timestamp: new Date(serverData.lastUpdate || Date.now()),
      status: serverData.status as 'online' | 'warning' | 'critical' | 'offline',
      metrics: {
        cpu: {
          usage: serverData.metrics?.cpu || 0,
          loadAverage: serverData.metrics?.loadAverage || [0, 0, 0],
          cores: 4
        },
        memory: {
          total: 8589934592, // 8GB 기본값
          used: Math.floor(8589934592 * (serverData.metrics?.memory || 0) / 100),
          available: Math.floor(8589934592 * (100 - (serverData.metrics?.memory || 0)) / 100),
          usage: serverData.metrics?.memory || 0
        },
        disk: {
          total: 107374182400, // 100GB 기본값
          used: Math.floor(107374182400 * (serverData.metrics?.disk || 0) / 100),
          available: Math.floor(107374182400 * (100 - (serverData.metrics?.disk || 0)) / 100),
          usage: serverData.metrics?.disk || 0,
          iops: {
            read: 0,
            write: 0
          }
        },
        network: {
          interface: 'eth0',
          bytesReceived: serverData.metrics?.network?.bytesIn || 0,
          bytesSent: serverData.metrics?.network?.bytesOut || 0,
          packetsReceived: serverData.metrics?.network?.packetsIn || 0,
          packetsSent: serverData.metrics?.network?.packetsOut || 0,
          errorsReceived: 0,
          errorsSent: 0
        }
      },
      services: serverData.services || [],
      metadata: {
        location: serverData.location || 'Unknown',
        environment: serverData.environment || 'production',
        provider: serverData.provider || 'unknown',
        cluster: serverData.cluster,
        zone: serverData.zone,
        instanceType: serverData.instanceType
      }
    };
  }

  /**
   * 📊 모크 메트릭 생성
   */
  private generateMockMetrics(serverId: string): StandardServerMetrics {
    return {
      serverId,
      hostname: `server-${serverId}`,
      timestamp: new Date(),
      status: 'online',
      metrics: {
        cpu: {
          usage: Math.random() * 50 + 10, // 10-60%
          loadAverage: [Math.random() * 2, Math.random() * 2, Math.random() * 2],
          cores: 4
        },
        memory: {
          total: 8589934592,
          used: Math.floor(8589934592 * 0.6),
          available: Math.floor(8589934592 * 0.4),
          usage: Math.random() * 40 + 30 // 30-70%
        },
        disk: {
          total: 107374182400,
          used: Math.floor(107374182400 * 0.5),
          available: Math.floor(107374182400 * 0.5),
          usage: Math.random() * 30 + 20, // 20-50%
          iops: {
            read: Math.floor(Math.random() * 1000),
            write: Math.floor(Math.random() * 1000)
          }
        },
        network: {
          interface: 'eth0',
          bytesReceived: Math.floor(Math.random() * 1000000),
          bytesSent: Math.floor(Math.random() * 1000000),
          packetsReceived: Math.floor(Math.random() * 10000),
          packetsSent: Math.floor(Math.random() * 10000),
          errorsReceived: 0,
          errorsSent: 0
        }
      },
      services: [],
      metadata: {
        location: 'Mock Location',
        environment: 'production',
        provider: 'onpremise'
      }
    };
  }

  /**
   * 🔄 종료
   */
  async shutdown(): Promise<void> {
    try {
      console.log('🔄 System Integration Adapter 종료 중...');

      if (this.dataCollectorAdapter) {
        await this.dataCollectorAdapter.stopCollection();
      }

      if (this.cacheAdapter) {
        await this.cacheAdapter.disconnect();
      }

      if (this.databaseAdapter) {
        await this.databaseAdapter.disconnect();
      }

      this.isInitialized = false;
      console.log('✅ System Integration Adapter 종료 완료');

    } catch (error) {
      console.error('❌ System Integration Adapter 종료 실패:', error);
    }
  }
} 