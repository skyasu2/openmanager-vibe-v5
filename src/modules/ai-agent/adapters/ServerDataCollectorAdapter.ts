/**
 * 📊 Server Data Collector Adapter
 * 
 * 기존 서버 데이터 수집기와 AI 에이전트 통합 어댑터
 * - 기존 수집기 래핑
 * - 표준 메트릭 변환
 * - 실시간 이벤트 처리
 * - 에러 복구 메커니즘
 */

import { DataCollectorAdapter, StandardServerMetrics } from './SystemIntegrationAdapter';

export interface CollectorConfig {
  collectionInterval: number;
  enableRealtime: boolean;
  enableAggregation: boolean;
  maxRetries: number;
  retryDelay: number;
  batchSize: number;
}

export class ServerDataCollectorAdapter implements DataCollectorAdapter {
  private config: CollectorConfig;
  private isActive = false;
  private lastCollection: Date | null = null;
  private errorCount = 0;
  private successCount = 0;
  private collectionTimer: NodeJS.Timeout | null = null;
  private metricsCallbacks: Array<(metrics: StandardServerMetrics) => void> = [];
  
  // 기존 수집기 참조
  private serverDataCollector: any = null;
  private metricsStorage: any = null;

  constructor(config: Partial<CollectorConfig>) {
    this.config = {
      collectionInterval: 30000, // 30초 기본값
      enableRealtime: true,
      enableAggregation: true,
      maxRetries: 3,
      retryDelay: 5000,
      batchSize: 10,
      ...config
    };
  }

  async initialize(): Promise<void> {
    try {
      console.log('📊 Server Data Collector Adapter 초기화 중...');

      // 기존 수집기 모듈 동적 로딩
      await this.loadExistingCollectors();

      // 수집기 초기화
      if (this.serverDataCollector) {
        await this.serverDataCollector.initialize?.();
      }

      console.log('✅ Server Data Collector Adapter 초기화 완료');

    } catch (error) {
      console.error('❌ Server Data Collector Adapter 초기화 실패:', error);
      throw error;
    }
  }

  async startCollection(): Promise<void> {
    if (this.isActive) {
      console.log('⚠️ 데이터 수집이 이미 활성화되어 있습니다');
      return;
    }

    try {
      console.log('🚀 서버 데이터 수집 시작...');
      
      this.isActive = true;
      
      // 즉시 첫 번째 수집 실행
      await this.performCollection();
      
      // 주기적 수집 스케줄링
      if (this.config.enableRealtime) {
        this.scheduleCollection();
      }

      console.log(`✅ 서버 데이터 수집 시작 완료 (간격: ${this.config.collectionInterval}ms)`);

    } catch (error) {
      console.error('❌ 서버 데이터 수집 시작 실패:', error);
      this.isActive = false;
      throw error;
    }
  }

  async stopCollection(): Promise<void> {
    if (!this.isActive) {
      console.log('⚠️ 데이터 수집이 이미 비활성화되어 있습니다');
      return;
    }

    try {
      console.log('🛑 서버 데이터 수집 중지 중...');
      
      this.isActive = false;
      
      // 타이머 정리
      if (this.collectionTimer) {
        clearInterval(this.collectionTimer);
        this.collectionTimer = null;
      }

      console.log('✅ 서버 데이터 수집 중지 완료');

    } catch (error) {
      console.error('❌ 서버 데이터 수집 중지 실패:', error);
    }
  }

  getCollectionStatus() {
    return {
      isActive: this.isActive,
      lastCollection: this.lastCollection,
      errorCount: this.errorCount,
      successCount: this.successCount
    };
  }

  onMetricsCollected(callback: (metrics: StandardServerMetrics) => void): void {
    this.metricsCallbacks.push(callback);
  }

  /**
   * 🔄 기존 수집기 모듈 로딩
   */
  private async loadExistingCollectors(): Promise<void> {
    try {
      // 서버 환경에서만 로딩
      if (typeof window !== 'undefined') {
        console.log('⚠️ 클라이언트 환경에서는 데이터 수집기를 사용할 수 없습니다');
        return;
      }

             // 기존 서버 데이터 수집기 로딩
       try {
         const collectorModule = await import('../../../services/collectors/ServerDataCollector');
         this.serverDataCollector = (collectorModule as any).ServerDataCollector?.getInstance?.() || null;
         console.log('✅ 기존 ServerDataCollector 로딩 완료');
       } catch (error) {
         console.warn('⚠️ ServerDataCollector 로딩 실패, 대체 수집기 사용:', error);
       }

      // 메트릭 저장소 로딩
      try {
        const { MetricsStorageService } = await import('../../../services/storage');
        this.metricsStorage = new MetricsStorageService();
        console.log('✅ MetricsStorageService 로딩 완료');
      } catch (error) {
        console.warn('⚠️ MetricsStorageService 로딩 실패:', error);
      }

    } catch (error) {
      console.error('❌ 기존 수집기 모듈 로딩 실패:', error);
    }
  }

  /**
   * 📊 데이터 수집 실행
   */
  private async performCollection(): Promise<void> {
    try {
      const startTime = Date.now();
      
      // 서버 목록 조회
      const serverList = await this.getServerList();
      
      if (serverList.length === 0) {
        console.log('⚠️ 수집할 서버가 없습니다');
        return;
      }

      console.log(`📊 ${serverList.length}개 서버 메트릭 수집 시작...`);

      // 배치 단위로 수집
      const batches = this.createBatches(serverList, this.config.batchSize);
      
      for (const batch of batches) {
        await this.collectBatch(batch);
      }

      this.lastCollection = new Date();
      this.successCount++;
      
      const duration = Date.now() - startTime;
      console.log(`✅ 메트릭 수집 완료 (${duration}ms, ${serverList.length}개 서버)`);

    } catch (error) {
      console.error('❌ 메트릭 수집 실패:', error);
      this.errorCount++;
      
      // 재시도 로직
      if (this.errorCount < this.config.maxRetries) {
        console.log(`🔄 ${this.config.retryDelay}ms 후 재시도... (${this.errorCount}/${this.config.maxRetries})`);
        setTimeout(() => this.performCollection(), this.config.retryDelay);
      }
    }
  }

  /**
   * 📋 서버 목록 조회
   */
  private async getServerList(): Promise<string[]> {
    try {
      // 기존 메트릭 저장소에서 서버 목록 조회
      if (this.metricsStorage) {
        return await this.metricsStorage.getServerList();
      }

      // 기존 서버 데이터 수집기에서 조회
      if (this.serverDataCollector) {
        const servers = await this.serverDataCollector.getActiveServers?.() || [];
        return servers.map((server: any) => server.id);
      }

      // 기본 서버 목록 (테스트용)
      return this.getDefaultServerList();

    } catch (error) {
      console.error('❌ 서버 목록 조회 실패:', error);
      return this.getDefaultServerList();
    }
  }

  /**
   * 🔄 배치 수집
   */
  private async collectBatch(serverIds: string[]): Promise<void> {
    const promises = serverIds.map(serverId => this.collectServerMetrics(serverId));
    
    try {
      await Promise.allSettled(promises);
    } catch (error) {
      console.error('❌ 배치 수집 실패:', error);
    }
  }

  /**
   * 📊 개별 서버 메트릭 수집
   */
  private async collectServerMetrics(serverId: string): Promise<void> {
    try {
      // 기존 메트릭 저장소에서 최신 메트릭 조회
      let rawMetrics = null;
      
      if (this.metricsStorage) {
        rawMetrics = await this.metricsStorage.getLatestMetrics(serverId);
      }

      // 메트릭이 없으면 기본 메트릭 생성
      if (!rawMetrics) {
        rawMetrics = this.generateMockMetrics(serverId);
      }

      // 표준 메트릭으로 변환
      const standardMetrics = this.transformToStandardMetrics(rawMetrics);

      // 콜백 호출 (AI 에이전트에 전달)
      this.notifyMetricsCollected(standardMetrics);

    } catch (error) {
      console.error(`❌ 서버 메트릭 수집 실패 (${serverId}):`, error);
    }
  }

  /**
   * 🔄 표준 메트릭으로 변환
   */
  private transformToStandardMetrics(rawMetrics: any): StandardServerMetrics {
    // 기존 메트릭 구조를 표준 구조로 변환
    return {
      serverId: rawMetrics.serverId || rawMetrics.id,
      hostname: rawMetrics.hostname || rawMetrics.name,
      timestamp: rawMetrics.timestamp ? new Date(rawMetrics.timestamp) : new Date(),
      status: this.determineServerStatus(rawMetrics),
      metrics: {
        cpu: {
          usage: rawMetrics.cpu?.usage || rawMetrics.metrics?.cpu || 0,
          loadAverage: rawMetrics.cpu?.loadAverage || [0, 0, 0],
          cores: rawMetrics.cpu?.cores || 4
        },
        memory: {
          total: rawMetrics.memory?.total || 8589934592, // 8GB 기본값
          used: rawMetrics.memory?.used || 0,
          available: rawMetrics.memory?.available || 8589934592,
          usage: rawMetrics.memory?.usage || rawMetrics.metrics?.memory || 0
        },
        disk: {
          total: rawMetrics.disk?.total || 107374182400, // 100GB 기본값
          used: rawMetrics.disk?.used || 0,
          available: rawMetrics.disk?.available || 107374182400,
          usage: rawMetrics.disk?.usage || rawMetrics.metrics?.disk || 0,
          iops: {
            read: rawMetrics.disk?.iops?.read || 0,
            write: rawMetrics.disk?.iops?.write || 0
          }
        },
        network: {
          interface: rawMetrics.network?.interface || 'eth0',
          bytesReceived: rawMetrics.network?.bytesReceived || 0,
          bytesSent: rawMetrics.network?.bytesSent || 0,
          packetsReceived: rawMetrics.network?.packetsReceived || 0,
          packetsSent: rawMetrics.network?.packetsSent || 0,
          errorsReceived: rawMetrics.network?.errorsReceived || 0,
          errorsSent: rawMetrics.network?.errorsSent || 0
        }
      },
      services: rawMetrics.services || [],
      metadata: {
        location: rawMetrics.metadata?.location || rawMetrics.location || 'Unknown',
        environment: rawMetrics.metadata?.environment || rawMetrics.environment || 'production',
        provider: rawMetrics.metadata?.provider || rawMetrics.provider || 'unknown',
        cluster: rawMetrics.metadata?.cluster,
        zone: rawMetrics.metadata?.zone,
        instanceType: rawMetrics.metadata?.instanceType
      }
    };
  }

  /**
   * 🚦 서버 상태 결정
   */
  private determineServerStatus(rawMetrics: any): 'online' | 'warning' | 'critical' | 'offline' {
    if (rawMetrics.status) {
      // 기존 상태가 있으면 매핑
      const statusMap: Record<string, 'online' | 'warning' | 'critical' | 'offline'> = {
        'healthy': 'online',
        'online': 'online',
        'warning': 'warning',
        'critical': 'critical',
        'offline': 'offline',
        'down': 'offline'
      };
      return statusMap[rawMetrics.status] || 'online';
    }

    // 메트릭 기반 상태 결정
    const cpu = rawMetrics.cpu?.usage || rawMetrics.metrics?.cpu || 0;
    const memory = rawMetrics.memory?.usage || rawMetrics.metrics?.memory || 0;
    const disk = rawMetrics.disk?.usage || rawMetrics.metrics?.disk || 0;

    if (cpu > 90 || memory > 95 || disk > 95) {
      return 'critical';
    } else if (cpu > 80 || memory > 85 || disk > 90) {
      return 'warning';
    } else {
      return 'online';
    }
  }

  /**
   * 📊 모크 메트릭 생성 (테스트용)
   */
  private generateMockMetrics(serverId: string): any {
    const now = new Date();
    return {
      serverId,
      hostname: `server-${serverId}`,
      timestamp: now,
      metrics: {
        cpu: Math.random() * 100,
        memory: Math.random() * 100,
        disk: Math.random() * 100
      },
      services: [],
      location: 'Mock Location',
      environment: 'production',
      provider: 'mock'
    };
  }

  /**
   * 📋 기본 서버 목록 (테스트용)
   */
  private getDefaultServerList(): string[] {
    return [
      'web-prod-01',
      'api-prod-01',
      'db-prod-01',
      'cache-prod-01',
      'monitor-01'
    ];
  }

  /**
   * 🔄 배치 생성
   */
  private createBatches<T>(items: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  }

  /**
   * 📢 메트릭 수집 알림
   */
  private notifyMetricsCollected(metrics: StandardServerMetrics): void {
    this.metricsCallbacks.forEach(callback => {
      try {
        callback(metrics);
      } catch (error) {
        console.error('❌ 메트릭 콜백 실행 실패:', error);
      }
    });
  }

  /**
   * ⏰ 주기적 수집 스케줄링
   */
  private scheduleCollection(): void {
    this.collectionTimer = setInterval(() => {
      if (this.isActive) {
        this.performCollection();
      }
    }, this.config.collectionInterval);
  }

  /**
   * 📊 수집 통계 조회
   */
  getCollectionStats() {
    return {
      isActive: this.isActive,
      lastCollection: this.lastCollection,
      errorCount: this.errorCount,
      successCount: this.successCount,
      successRate: this.successCount + this.errorCount > 0 
        ? (this.successCount / (this.successCount + this.errorCount)) * 100 
        : 100,
      config: this.config
    };
  }

  /**
   * 🔧 설정 업데이트
   */
  updateConfig(newConfig: Partial<CollectorConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // 수집 간격이 변경되면 타이머 재설정
    if (newConfig.collectionInterval && this.isActive && this.collectionTimer) {
      clearInterval(this.collectionTimer);
      this.scheduleCollection();
    }
    
    console.log('⚙️ 데이터 수집기 설정 업데이트 완료:', this.config);
  }
} 