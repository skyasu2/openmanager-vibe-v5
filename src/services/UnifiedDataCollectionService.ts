/**
 * 🔄 Unified Data Collection Service
 * 
 * 통합 데이터 수집 시스템
 * - VirtualServerManager, ServerDataCollector, ServerDataGenerator 통합
 * - 효율적인 메모리 사용 및 성능 최적화
 * - 플러그인 아키텍처로 확장 가능
 * - 실시간 및 배치 처리 지원
 */

import { ILogger, IErrorHandler } from '@/interfaces/services';
import { ServerMetrics, ExtendedServer, ServerStatus, SystemStatus } from '@/types/common';
import { getVirtualServerConfig, getDatabaseConfig } from '@/config';
import { createServiceError, ERROR_CODES } from '@/services/ErrorHandlingService';
import { createClient } from '@supabase/supabase-js';

// 데이터 수집 전략 인터페이스
export interface DataCollectionStrategy {
  name: string;
  priority: number;
  canHandle(serverId: string): boolean;
  collect(serverId: string): Promise<ServerMetrics>;
  initialize?(): Promise<void>;
  cleanup?(): Promise<void>;
}

// 데이터 소스 타입
export type DataSourceType = 'virtual' | 'real' | 'hybrid' | 'mock';

// 수집 옵션
export interface CollectionOptions {
  strategy?: DataSourceType;
  batchSize?: number;
  interval?: number;
  enableCaching?: boolean;
  enableCompression?: boolean;
  retryAttempts?: number;
}

// 성능 메트릭
export interface PerformanceMetrics {
  collectionsPerSecond: number;
  averageCollectionTime: number;
  cacheHitRate: number;
  memoryUsage: number;
  errorRate: number;
  lastCollectionTime: Date;
}

export class UnifiedDataCollectionService {
  private strategies = new Map<DataSourceType, DataCollectionStrategy>();
  private servers: ExtendedServer[] = [];
  private metricsCache = new Map<string, { metrics: ServerMetrics; timestamp: Date }>();
  private isCollecting = false;
  private collectionInterval?: NodeJS.Timeout;
  private performanceMetrics: PerformanceMetrics;
  private supabase: any;
  
  private readonly config = getVirtualServerConfig();
  private readonly dbConfig = getDatabaseConfig();
  private readonly cacheTimeout = 30000; // 30초
  private readonly maxCacheSize = 1000;

  constructor(
    private logger: ILogger,
    private errorHandler: IErrorHandler
  ) {
    this.performanceMetrics = {
      collectionsPerSecond: 0,
      averageCollectionTime: 0,
      cacheHitRate: 0,
      memoryUsage: 0,
      errorRate: 0,
      lastCollectionTime: new Date()
    };

    this.initializeDatabase();
    this.setupStrategies();
  }

  /**
   * 데이터베이스 초기화
   */
  private initializeDatabase(): void {
    const supabaseUrl = this.dbConfig.url || 'https://dummy-project.supabase.co';
    const supabaseKey = this.dbConfig.key || 'dummy_anon_key';
    
    if (this.dbConfig.enableMockMode || supabaseUrl.includes('dummy')) {
      this.logger.info('UnifiedDataCollectionService: Using mock database mode');
      this.supabase = null;
    } else {
      this.supabase = createClient(supabaseUrl, supabaseKey);
      this.logger.info('UnifiedDataCollectionService: Connected to Supabase');
    }
  }

  /**
   * 데이터 수집 전략 설정
   */
  private setupStrategies(): void {
    // 가상 서버 전략
    this.registerStrategy('virtual', new VirtualServerStrategy(this.logger));
    
    // 실제 서버 전략 (향후 구현)
    this.registerStrategy('real', new RealServerStrategy(this.logger));
    
    // 하이브리드 전략
    this.registerStrategy('hybrid', new HybridStrategy(this.logger));
    
    // 목 데이터 전략
    this.registerStrategy('mock', new MockDataStrategy(this.logger));

    this.logger.info('Data collection strategies initialized', {
      strategies: Array.from(this.strategies.keys())
    });
  }

  /**
   * 전략 등록
   */
  registerStrategy(type: DataSourceType, strategy: DataCollectionStrategy): void {
    this.strategies.set(type, strategy);
    this.logger.debug(`Registered data collection strategy: ${type}`);
  }

  /**
   * 서비스 초기화
   */
  async initialize(): Promise<void> {
    try {
      this.logger.info('Initializing Unified Data Collection Service...');

      // 서버 목록 생성/로드
      await this.initializeServers();

      // 전략 초기화
      for (const [type, strategy] of this.strategies) {
        if (strategy.initialize) {
          await strategy.initialize();
          this.logger.debug(`Strategy ${type} initialized`);
        }
      }

      // 히스토리 데이터 생성 (필요한 경우)
      if (this.config.enableHistoryGeneration) {
        await this.generateHistoryData();
      }

      this.logger.info('Unified Data Collection Service initialized successfully', {
        serversCount: this.servers.length,
        strategiesCount: this.strategies.size
      });

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const serviceError = createServiceError(
        ERROR_CODES.SYSTEM_FAILURE,
        'Failed to initialize Unified Data Collection Service',
        'UnifiedDataCollectionService',
        { error: errorMessage },
        error instanceof Error ? error : new Error(errorMessage)
      );
      this.errorHandler.handle(serviceError);
      throw error;
    }
  }

  /**
   * 서버 목록 초기화
   */
  private async initializeServers(): Promise<void> {
    try {
      // 기존 서버 확인
      const existingServers = await this.loadExistingServers();
      
      if (existingServers.length >= 5) {
        this.servers = existingServers;
        this.logger.info(`Loaded ${existingServers.length} existing servers`);
      } else {
        this.servers = this.generateVirtualServers();
        await this.saveServersToDatabase();
        this.logger.info(`Generated ${this.servers.length} new virtual servers`);
      }
    } catch (error: unknown) {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      this.logger.error('Failed to initialize servers', errorObj);
      throw error;
    }
  }

  /**
   * 가상 서버 생성
   */
  private generateVirtualServers(): ExtendedServer[] {
    const serverTemplates = [
      {
        hostname: 'web-prod-01',
        name: 'Production Web Server',
        type: 'web' as const,
        environment: 'production' as const,
        location: 'Seoul, Korea',
        provider: 'aws' as const,
        specs: { cpu_cores: 8, memory_gb: 32, disk_gb: 500 }
      },
      {
        hostname: 'db-master-01',
        name: 'Database Master Server',
        type: 'database' as const,
        environment: 'production' as const,
        location: 'Tokyo, Japan',
        provider: 'gcp' as const,
        specs: { cpu_cores: 16, memory_gb: 64, disk_gb: 2000 }
      },
      {
        hostname: 'api-gateway-01',
        name: 'API Gateway Server',
        type: 'api' as const,
        environment: 'production' as const,
        location: 'Singapore',
        provider: 'azure' as const,
        specs: { cpu_cores: 4, memory_gb: 16, disk_gb: 200 }
      },
      {
        hostname: 'cache-redis-01',
        name: 'Redis Cache Server',
        type: 'cache' as const,
        environment: 'production' as const,
        location: 'Seoul, Korea',
        provider: 'onpremise' as const,
        specs: { cpu_cores: 8, memory_gb: 128, disk_gb: 1000 }
      },
      {
        hostname: 'storage-nfs-01',
        name: 'NFS Storage Server',
        type: 'storage' as const,
        environment: 'production' as const,
        location: 'Busan, Korea',
        provider: 'onpremise' as const,
        specs: { cpu_cores: 4, memory_gb: 32, disk_gb: 10000 }
      }
    ];

    return serverTemplates.map((template, index) => ({
      id: `unified-server-${index + 1}`,
      ...template,
      status: 'healthy' as ServerStatus,
      created_at: new Date(),
      tags: [`tier-${index + 1}`, 'production', 'monitored'],
      metadata: {
        collectionStrategy: 'virtual',
        priority: index + 1,
        lastUpdate: new Date().toISOString()
      }
    }));
  }

  /**
   * 실시간 데이터 수집 시작
   */
  async startCollection(options: CollectionOptions = {}): Promise<void> {
    if (this.isCollecting) {
      this.logger.warn('Data collection already in progress');
      return;
    }

    const {
      strategy = 'virtual',
      interval = this.config.generationInterval,
      batchSize = 5
    } = options;

    this.logger.info('Starting unified data collection', {
      strategy,
      interval,
      batchSize,
      serversCount: this.servers.length
    });

    this.isCollecting = true;
    this.performanceMetrics.lastCollectionTime = new Date();

    // 첫 번째 수집 즉시 실행
    await this.collectBatch(strategy, batchSize);

    // 주기적 수집 시작
    this.collectionInterval = setInterval(async () => {
      try {
        await this.collectBatch(strategy, batchSize);
        this.updatePerformanceMetrics();
      } catch (error: unknown) {
        const errorObj = error instanceof Error ? error : new Error(String(error));
        this.logger.error('Collection interval error', errorObj);
        this.handleCollectionError(error);
      }
    }, interval);

    this.logger.info('Unified data collection started successfully');
  }

  /**
   * 배치 데이터 수집
   */
  private async collectBatch(strategy: DataSourceType, batchSize: number): Promise<void> {
    const startTime = Date.now();
    const collectionStrategy = this.strategies.get(strategy);
    
    if (!collectionStrategy) {
      throw new Error(`Unknown collection strategy: ${strategy}`);
    }

    const batches = this.chunkArray(this.servers, batchSize);
    const allMetrics: ServerMetrics[] = [];

    for (const batch of batches) {
      const batchPromises = batch.map(async (server) => {
        try {
          // 캐시 확인
          const cached = this.getCachedMetrics(server.id);
          if (cached) {
            return cached;
          }

          // 새 데이터 수집
          const metrics = await collectionStrategy.collect(server.id);
          
          // 캐시에 저장
          this.setCachedMetrics(server.id, metrics);
          
          return metrics;
        } catch (error: unknown) {
          const errorObj = error instanceof Error ? error : new Error(String(error));
          this.logger.error(`Failed to collect metrics for server ${server.id}`, errorObj);
          return null;
        }
      });

      const batchResults = await Promise.allSettled(batchPromises);
      const successfulMetrics = batchResults
        .filter((result): result is PromiseFulfilledResult<ServerMetrics> => 
          result.status === 'fulfilled' && result.value !== null
        )
        .map(result => result.value);

      allMetrics.push(...successfulMetrics);
    }

    // 데이터베이스에 저장
    await this.saveMetricsBatch(allMetrics);

    const duration = Date.now() - startTime;
    this.logger.debug('Batch collection completed', {
      strategy,
      serversProcessed: allMetrics.length,
      duration: `${duration}ms`,
      averagePerServer: `${Math.round(duration / this.servers.length)}ms`
    });
  }

  /**
   * 데이터 수집 중지
   */
  stopCollection(): void {
    if (this.collectionInterval) {
      clearInterval(this.collectionInterval);
      this.collectionInterval = undefined;
    }
    
    this.isCollecting = false;
    this.logger.info('Unified data collection stopped');
  }

  /**
   * 캐시된 메트릭 조회
   */
  private getCachedMetrics(serverId: string): ServerMetrics | null {
    const cached = this.metricsCache.get(serverId);
    if (!cached) return null;

    const age = Date.now() - cached.timestamp.getTime();
    if (age > this.cacheTimeout) {
      this.metricsCache.delete(serverId);
      return null;
    }

    return cached.metrics;
  }

  /**
   * 메트릭 캐시에 저장
   */
  private setCachedMetrics(serverId: string, metrics: ServerMetrics): void {
    // 캐시 크기 제한
    if (this.metricsCache.size >= this.maxCacheSize) {
      const oldestKey = this.metricsCache.keys().next().value;
      if (oldestKey) {
        this.metricsCache.delete(oldestKey);
      }
    }

    this.metricsCache.set(serverId, {
      metrics,
      timestamp: new Date()
    });
  }

  /**
   * 배열을 청크로 분할
   */
  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  /**
   * 성능 메트릭 업데이트
   */
  private updatePerformanceMetrics(): void {
    const now = new Date();
    const timeSinceLastCollection = now.getTime() - this.performanceMetrics.lastCollectionTime.getTime();
    
    this.performanceMetrics.collectionsPerSecond = 1000 / timeSinceLastCollection;
    this.performanceMetrics.cacheHitRate = this.calculateCacheHitRate();
    this.performanceMetrics.memoryUsage = this.calculateMemoryUsage();
    this.performanceMetrics.lastCollectionTime = now;
  }

  /**
   * 캐시 히트율 계산
   */
  private calculateCacheHitRate(): number {
    // 간단한 캐시 히트율 계산 (실제로는 더 정교한 추적 필요)
    return this.metricsCache.size / this.servers.length;
  }

  /**
   * 메모리 사용량 계산
   */
  private calculateMemoryUsage(): number {
    // 캐시 크기 기반 메모리 사용량 추정
    return this.metricsCache.size * 1024; // KB 단위
  }

  /**
   * 수집 에러 처리
   */
  private handleCollectionError(error: unknown): void {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const serviceError = createServiceError(
      ERROR_CODES.EXTERNAL_SERVICE_ERROR,
      'Data collection error occurred',
      'UnifiedDataCollectionService',
      { error: errorMessage },
      error instanceof Error ? error : new Error(errorMessage)
    );
    
    this.errorHandler.handle(serviceError);
    this.performanceMetrics.errorRate++;
  }

  /**
   * 기존 서버 로드
   */
  private async loadExistingServers(): Promise<ExtendedServer[]> {
    if (!this.supabase) {
      const stored = localStorage.getItem('unified_servers');
      return stored ? JSON.parse(stored) : [];
    }

    try {
      const { data, error } = await this.supabase
        .from('servers')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error: unknown) {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      this.logger.error('Failed to load existing servers', errorObj);
      return [];
    }
  }

  /**
   * 서버 정보 저장
   */
  private async saveServersToDatabase(): Promise<void> {
    if (!this.supabase) {
      localStorage.setItem('unified_servers', JSON.stringify(this.servers));
      return;
    }

    try {
      const { error } = await this.supabase
        .from('servers')
        .insert(this.servers);

      if (error) throw error;
      this.logger.info('Servers saved to database successfully');
    } catch (error: unknown) {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      this.logger.error('Failed to save servers to database', errorObj);
      throw error;
    }
  }

  /**
   * 메트릭 배치 저장
   */
  private async saveMetricsBatch(metrics: ServerMetrics[]): Promise<void> {
    if (metrics.length === 0) return;

    if (!this.supabase) {
      const existing = JSON.parse(localStorage.getItem('unified_metrics') || '[]');
      existing.push(...metrics);
      
      // 최근 1000개만 유지
      if (existing.length > 1000) {
        existing.splice(0, existing.length - 1000);
      }
      
      localStorage.setItem('unified_metrics', JSON.stringify(existing));
      return;
    }

    try {
      const { error } = await this.supabase
        .from('server_metrics')
        .insert(metrics);

      if (error) throw error;
    } catch (error: unknown) {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      this.logger.error('Failed to save metrics batch', errorObj);
      throw error;
    }
  }

  /**
   * 히스토리 데이터 생성
   */
  private async generateHistoryData(): Promise<void> {
    this.logger.info('Generating history data...');
    
    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - this.config.historyDuration);
    const interval = 5 * 60 * 1000; // 5분 간격
    
    const allMetrics: ServerMetrics[] = [];
    const strategy = this.strategies.get('virtual');
    
    if (!strategy) return;

    for (const server of this.servers) {
      let currentTime = new Date(startTime);
      
      while (currentTime <= endTime) {
        try {
          const metrics = await strategy.collect(server.id);
          metrics.timestamp = currentTime;
          allMetrics.push(metrics);
        } catch (error: unknown) {
          const errorObj = error instanceof Error ? error : new Error(String(error));
          this.logger.warn(`Failed to generate history for server ${server.id}`, errorObj);
        }
        
        currentTime = new Date(currentTime.getTime() + interval);
      }
    }
    
    await this.saveMetricsBatch(allMetrics);
    this.logger.info(`Generated ${allMetrics.length} history data points`);
  }

  /**
   * 시스템 상태 조회
   */
  async getSystemStatus(): Promise<SystemStatus> {
    const latestMetrics = await Promise.all(
      this.servers.map(server => this.getLatestMetrics(server.id))
    );

    const validMetrics = latestMetrics.filter(m => m !== null) as ServerMetrics[];
    
    const statusCounts = {
      healthy: validMetrics.filter(m => m.status === 'healthy').length,
      warning: validMetrics.filter(m => m.status === 'warning').length,
      critical: validMetrics.filter(m => m.status === 'critical').length,
      offline: validMetrics.filter(m => m.status === 'offline').length
    };

    const averageCpu = validMetrics.length > 0 
      ? validMetrics.reduce((sum, m) => sum + m.cpu_usage, 0) / validMetrics.length 
      : 0;
    
    const averageMemory = validMetrics.length > 0 
      ? validMetrics.reduce((sum, m) => sum + m.memory_usage, 0) / validMetrics.length 
      : 0;

    return {
      totalServers: this.servers.length,
      healthyServers: statusCounts.healthy,
      warningServers: statusCounts.warning,
      criticalServers: statusCounts.critical,
      offlineServers: statusCounts.offline,
      averageCpu: Math.round(averageCpu * 10) / 10,
      averageMemory: Math.round(averageMemory * 10) / 10,
      isGenerating: this.isCollecting
    };
  }

  /**
   * 최신 메트릭 조회
   */
  async getLatestMetrics(serverId: string): Promise<ServerMetrics | null> {
    // 캐시 우선 확인
    const cached = this.getCachedMetrics(serverId);
    if (cached) return cached;

    // 데이터베이스에서 조회
    if (!this.supabase) {
      const metrics = JSON.parse(localStorage.getItem('unified_metrics') || '[]');
      const serverMetrics = metrics.filter((m: ServerMetrics) => m.server_id === serverId);
      return serverMetrics.length > 0 ? serverMetrics[serverMetrics.length - 1] : null;
    }

    try {
      const { data, error } = await this.supabase
        .from('server_metrics')
        .select('*')
        .eq('server_id', serverId)
        .order('timestamp', { ascending: false })
        .limit(1)
        .single();

      if (error) return null;
      return data;
    } catch (error: unknown) {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      this.logger.error('Failed to get latest metrics', errorObj);
      return null;
    }
  }

  /**
   * 성능 메트릭 조회
   */
  getPerformanceMetrics(): PerformanceMetrics {
    return { ...this.performanceMetrics };
  }

  /**
   * 서버 목록 조회
   */
  getServers(): ExtendedServer[] {
    return [...this.servers];
  }

  /**
   * 수집 상태 조회
   */
  getCollectionStatus() {
    return {
      isCollecting: this.isCollecting,
      serversCount: this.servers.length,
      strategiesCount: this.strategies.size,
      cacheSize: this.metricsCache.size,
      performance: this.performanceMetrics
    };
  }

  /**
   * 정리
   */
  async cleanup(): Promise<void> {
    this.stopCollection();
    
    // 전략 정리
    for (const [type, strategy] of this.strategies) {
      if (strategy.cleanup) {
        await strategy.cleanup();
        this.logger.debug(`Strategy ${type} cleaned up`);
      }
    }

    this.metricsCache.clear();
    this.logger.info('Unified Data Collection Service cleaned up');
  }
}

// 가상 서버 전략 구현
class VirtualServerStrategy implements DataCollectionStrategy {
  name = 'Virtual Server Strategy';
  priority = 1;

  constructor(private logger: ILogger) {}

  canHandle(serverId: string): boolean {
    return serverId.startsWith('unified-server-') || serverId.startsWith('virtual-server-');
  }

  async collect(serverId: string): Promise<ServerMetrics> {
    // 가상 메트릭 생성 로직 (기존 VirtualServerManager 로직 활용)
    const now = new Date();
    const hour = now.getHours();
    
    // 기본 메트릭
    let cpu = 30 + Math.random() * 40;
    let memory = 40 + Math.random() * 30;
    let disk = 20 + Math.random() * 20;
    
    // 비즈니스 시간 패턴
    if (hour >= 9 && hour <= 18) {
      cpu += 15;
      memory += 10;
    }
    
    // 랜덤 변동
    cpu += (Math.random() - 0.5) * 20;
    memory += (Math.random() - 0.5) * 15;
    disk += (Math.random() - 0.5) * 10;
    
    // 범위 제한
    cpu = Math.max(0, Math.min(100, cpu));
    memory = Math.max(0, Math.min(100, memory));
    disk = Math.max(0, Math.min(100, disk));
    
    // 상태 결정
    let status: ServerStatus = 'healthy';
    const alerts: string[] = [];
    
    if (cpu > 90 || memory > 95) {
      status = 'critical';
      alerts.push('High resource usage detected');
    } else if (cpu > 80 || memory > 85) {
      status = 'warning';
      alerts.push('Resource usage above threshold');
    }

    return {
      server_id: serverId,
      timestamp: now,
      cpu_usage: Math.round(cpu * 10) / 10,
      memory_usage: Math.round(memory * 10) / 10,
      disk_usage: Math.round(disk * 10) / 10,
      network_in: Math.floor(Math.random() * 1000000) + 100000,
      network_out: Math.floor(Math.random() * 800000) + 80000,
      response_time: Math.round((Math.random() * 200 + 50) * 10) / 10,
      active_connections: Math.floor(Math.random() * 500) + 50,
      status,
      alerts
    };
  }
}

// 실제 서버 전략 (향후 구현)
class RealServerStrategy implements DataCollectionStrategy {
  name = 'Real Server Strategy';
  priority = 2;

  constructor(private logger: ILogger) {}

  canHandle(serverId: string): boolean {
    return serverId.startsWith('real-server-');
  }

  async collect(serverId: string): Promise<ServerMetrics> {
    // 실제 서버 메트릭 수집 로직 (향후 구현)
    throw new Error('Real server collection not implemented yet');
  }
}

// 하이브리드 전략
class HybridStrategy implements DataCollectionStrategy {
  name = 'Hybrid Strategy';
  priority = 3;

  constructor(private logger: ILogger) {}

  canHandle(serverId: string): boolean {
    return serverId.startsWith('hybrid-');
  }

  async collect(serverId: string): Promise<ServerMetrics> {
    // 가상과 실제 데이터를 조합하는 로직
    throw new Error('Hybrid collection not implemented yet');
  }
}

// 목 데이터 전략
class MockDataStrategy implements DataCollectionStrategy {
  name = 'Mock Data Strategy';
  priority = 0;

  constructor(private logger: ILogger) {}

  canHandle(serverId: string): boolean {
    return true; // 모든 서버에 대해 목 데이터 제공 가능
  }

  async collect(serverId: string): Promise<ServerMetrics> {
    return {
      server_id: serverId,
      timestamp: new Date(),
      cpu_usage: 50,
      memory_usage: 60,
      disk_usage: 30,
      network_in: 500000,
      network_out: 400000,
      response_time: 100,
      active_connections: 100,
      status: 'healthy',
      alerts: []
    };
  }
} 