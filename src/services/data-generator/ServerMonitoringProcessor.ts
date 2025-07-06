/**
 * 🎯 서버 모니터링용 데이터 전처리기
 *
 * RealServerDataGenerator + Redis 24시간 데이터를 합쳐서
 * UI용 Server[] 타입으로 변환하는 전문 전처리기
 */

import { transformServerInstanceToServer } from '@/adapters/server-data-adapter';
import { SystemIntegrationAdapter } from '@/modules/ai-agent/adapters/SystemIntegrationAdapter';
import { ServerInstance } from '@/types/data-generator';
import { Server } from '@/types/server';
import { RealServerDataGenerator, type RealServerDataGeneratorType } from './RealServerDataGenerator';

export interface ProcessedServerData {
  servers: Server[];
  stats: {
    total: number;
    healthy: number;
    warning: number;
    critical: number;
    offline: number;
    averageCpu: number;
    averageMemory: number;
    averageDisk: number;
  };
  timestamp: string;
  source: 'server-monitoring-processor';
}

export interface HistoricalMetrics {
  serverId: string;
  metrics: Array<{
    timestamp: string;
    cpu: number;
    memory: number;
    disk: number;
    network: number;
  }>;
}

export class ServerMonitoringProcessor {
  private static instance: ServerMonitoringProcessor | null = null;
  private dataGenerator: RealServerDataGeneratorType;
  private lastProcessTime = 0;
  private readonly CACHE_DURATION = 35000; // 35초 캐시 (30-40초 범위)
  private cachedData: ProcessedServerData | null = null;

  private constructor() {
    this.dataGenerator = RealServerDataGenerator.getInstance();
  }

  public static getInstance(): ServerMonitoringProcessor {
    if (!ServerMonitoringProcessor.instance) {
      ServerMonitoringProcessor.instance = new ServerMonitoringProcessor();
    }
    return ServerMonitoringProcessor.instance;
  }

  /**
   * 🎯 메인 처리 함수: 실시간 + 24시간 데이터 통합
   */
  public async getProcessedServerData(
    options: {
      includeHistorical?: boolean;
      timeRange?: { start: Date; end: Date };
      forceRefresh?: boolean;
    } = {}
  ): Promise<ProcessedServerData> {
    const now = Date.now();

    // 캐시 확인 (강제 새로고침이 아닌 경우)
    if (
      !options.forceRefresh &&
      this.cachedData &&
      now - this.lastProcessTime < this.CACHE_DURATION
    ) {
      console.log('📦 서버 모니터링 데이터 캐시 사용');
      return this.cachedData;
    }

    try {
      console.log('🔄 서버 모니터링 데이터 전처리 시작');

      // 1. 실시간 서버 데이터 가져오기
      const rawServers = await this.getRealTimeServerData();

      // 2. 24시간 히스토리 데이터 가져오기 (옵션)
      let historicalData: HistoricalMetrics[] = [];
      if (options.includeHistorical) {
        historicalData = await this.getHistoricalData(options.timeRange);
      }

      // 3. 데이터 통합 및 변환
      const processedServers = await this.processAndMergeData(
        rawServers,
        historicalData
      );

      // 4. 통계 계산
      const stats = this.calculateStats(processedServers);

      // 5. 최종 데이터 구성
      const result: ProcessedServerData = {
        servers: processedServers,
        stats,
        timestamp: new Date().toISOString(),
        source: 'server-monitoring-processor',
      };

      // 캐시 업데이트
      this.cachedData = result;
      this.lastProcessTime = now;

      console.log(
        `✅ 서버 모니터링 데이터 전처리 완료: ${processedServers.length}개 서버`
      );
      return result;
    } catch (error) {
      console.error('❌ 서버 모니터링 데이터 전처리 실패:', error);

      // 폴백: 캐시된 데이터 또는 기본 데이터 반환
      if (this.cachedData) {
        console.log('🛡️ 캐시된 데이터로 폴백');
        return this.cachedData;
      }

      return this.getEmptyProcessedData();
    }
  }

  /**
   * 🔄 실시간 서버 데이터 가져오기
   */
  private async getRealTimeServerData(): Promise<ServerInstance[]> {
    try {
      // 데이터 생성기 초기화 확인
      if (this.dataGenerator.getAllServers().length === 0) {
        await this.dataGenerator.initialize();
        this.dataGenerator.startAutoGeneration();

        // 초기화 후 잠시 대기 (데이터 생성 시간 확보)
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      const servers = this.dataGenerator.getAllServers();
      console.log(`📊 실시간 서버 데이터 수집: ${servers.length}개`);

      return servers;
    } catch (error) {
      console.error('❌ 실시간 서버 데이터 수집 실패:', error);
      return [];
    }
  }

  /**
   * 📈 24시간 히스토리 데이터 가져오기
   */
  private async getHistoricalData(timeRange?: {
    start: Date;
    end: Date;
  }): Promise<HistoricalMetrics[]> {
    try {
      // 기본 시간 범위: 지난 24시간
      const defaultTimeRange = {
        start: new Date(Date.now() - 24 * 60 * 60 * 1000),
        end: new Date(),
      };

      const range = timeRange || defaultTimeRange;

      // 🔄 SystemIntegrationAdapter를 활용하여 히스토리 데이터 조회
      const historicalData = await this.fetchHistoricalFromSystemAdapter(range);

      console.log(`📈 히스토리 데이터 수집: ${historicalData.length}개 서버`);
      return historicalData;
    } catch (error) {
      console.error('❌ 히스토리 데이터 수집 실패:', error);
      return [];
    }
  }

  /**
   * 🔄 SystemIntegrationAdapter를 통한 히스토리 데이터 조회
   */
  private async fetchHistoricalFromSystemAdapter(timeRange: {
    start: Date;
    end: Date;
  }): Promise<HistoricalMetrics[]> {
    try {
      // SystemIntegrationAdapter 인스턴스 가져오기
      const systemAdapter = SystemIntegrationAdapter.getInstance();

      // 현재 서버 목록 가져오기
      const currentServers = this.dataGenerator.getAllServers();
      const historicalMetrics: HistoricalMetrics[] = [];

      // 각 서버별로 히스토리 데이터 조회
      for (const server of currentServers) {
        try {
          const serverHistory = await systemAdapter.getMetricsHistory(
            server.id,
            timeRange
          );

          if (serverHistory.length > 0) {
            const metrics = serverHistory.map(metric => ({
              timestamp: metric.timestamp.toISOString(),
              cpu: metric.metrics.cpu.usage,
              memory: metric.metrics.memory.usage,
              disk: metric.metrics.disk.usage,
              network:
                metric.metrics.network.bytesReceived +
                metric.metrics.network.bytesSent,
            }));

            historicalMetrics.push({
              serverId: server.id,
              metrics,
            });
          }
        } catch (serverError) {
          console.warn(`⚠️ 서버 ${server.id} 히스토리 조회 실패:`, serverError);
        }
      }

      return historicalMetrics;
    } catch (error) {
      console.error('❌ SystemIntegrationAdapter 히스토리 조회 실패:', error);
      return [];
    }
  }

  /**
   * 🎯 데이터 통합 및 변환
   */
  private async processAndMergeData(
    rawServers: ServerInstance[],
    historicalData: HistoricalMetrics[]
  ): Promise<Server[]> {
    const processedServers: Server[] = [];

    for (const serverInstance of rawServers) {
      try {
        // 1. 기본 변환 (server-data-adapter 사용)
        const baseServer = transformServerInstanceToServer(serverInstance);

        // 2. 히스토리 데이터 통합
        const serverHistory = historicalData.find(
          h => h.serverId === serverInstance.id
        );

        // 3. 추가 처리 (트렌드, 예측 등)
        const enhancedServer = await this.enhanceServerWithHistory(
          baseServer,
          serverHistory
        );

        processedServers.push(enhancedServer);
      } catch (error) {
        console.error(`❌ 서버 ${serverInstance.id} 처리 실패:`, error);

        // 폴백: 기본 변환만 적용
        try {
          const fallbackServer =
            transformServerInstanceToServer(serverInstance);
          processedServers.push(fallbackServer);
        } catch (fallbackError) {
          console.error(
            `❌ 서버 ${serverInstance.id} 폴백 처리도 실패:`,
            fallbackError
          );
        }
      }
    }

    return processedServers;
  }

  /**
   * 📈 히스토리 데이터로 서버 정보 강화
   */
  private async enhanceServerWithHistory(
    server: Server,
    history?: HistoricalMetrics
  ): Promise<Server> {
    if (!history || !history.metrics.length) {
      return server;
    }

    try {
      // 트렌드 계산
      const recentMetrics = history.metrics.slice(-10); // 최근 10개 데이터 포인트
      const cpuTrend = this.calculateTrend(recentMetrics.map(m => m.cpu));
      const memoryTrend = this.calculateTrend(recentMetrics.map(m => m.memory));

      // 서버 정보에 트렌드 정보 추가 (기존 구조 유지)
      return {
        ...server,
        // 기존 Server 타입에 없는 필드는 추가하지 않음
        // 필요시 Server 타입 확장 고려
      };
    } catch (error) {
      console.error('❌ 서버 히스토리 강화 실패:', error);
      return server;
    }
  }

  /**
   * 📊 트렌드 계산 (단순 선형 회귀)
   */
  private calculateTrend(
    values: number[]
  ): 'increasing' | 'decreasing' | 'stable' {
    if (values.length < 3) return 'stable';

    const first =
      values
        .slice(0, Math.floor(values.length / 3))
        .reduce((a, b) => a + b, 0) / Math.floor(values.length / 3);
    const last =
      values.slice(-Math.floor(values.length / 3)).reduce((a, b) => a + b, 0) /
      Math.floor(values.length / 3);

    const diff = last - first;
    const threshold = 5; // 5% 변화 임계값

    if (diff > threshold) return 'increasing';
    if (diff < -threshold) return 'decreasing';
    return 'stable';
  }

  /**
   * 📊 통계 계산
   */
  private calculateStats(servers: Server[]): ProcessedServerData['stats'] {
    const total = servers.length;

    if (total === 0) {
      return {
        total: 0,
        healthy: 0,
        warning: 0,
        critical: 0,
        offline: 0,
        averageCpu: 0,
        averageMemory: 0,
        averageDisk: 0,
      };
    }

    const healthy = servers.filter(
      s => s.status === 'online' || s.status === 'healthy'
    ).length;
    const warning = servers.filter(s => s.status === 'warning').length;
    const critical = servers.filter(s => s.status === 'critical').length;
    const offline = servers.filter(s => s.status === 'offline').length;

    const averageCpu =
      servers.reduce((sum, s) => sum + (s.cpu || 0), 0) / total;
    const averageMemory =
      servers.reduce((sum, s) => sum + (s.memory || 0), 0) / total;
    const averageDisk =
      servers.reduce((sum, s) => sum + (s.disk || 0), 0) / total;

    return {
      total,
      healthy,
      warning,
      critical,
      offline,
      averageCpu: Math.round(averageCpu * 10) / 10,
      averageMemory: Math.round(averageMemory * 10) / 10,
      averageDisk: Math.round(averageDisk * 10) / 10,
    };
  }

  /**
   * 🛡️ 빈 데이터 반환 (폴백용)
   */
  private getEmptyProcessedData(): ProcessedServerData {
    return {
      servers: [],
      stats: {
        total: 0,
        healthy: 0,
        warning: 0,
        critical: 0,
        offline: 0,
        averageCpu: 0,
        averageMemory: 0,
        averageDisk: 0,
      },
      timestamp: new Date().toISOString(),
      source: 'server-monitoring-processor',
    };
  }

  /**
   * 🔄 캐시 초기화
   */
  public clearCache(): void {
    this.cachedData = null;
    this.lastProcessTime = 0;
    console.log('🗑️ 서버 모니터링 프로세서 캐시 초기화');
  }

  /**
   * 📊 프로세서 상태 조회
   */
  public getStatus() {
    return {
      isInitialized: true,
      hasCachedData: !!this.cachedData,
      lastProcessTime: this.lastProcessTime,
      cacheAge: this.lastProcessTime ? Date.now() - this.lastProcessTime : null,
      dataGeneratorStatus: this.dataGenerator.getStatus(),
    };
  }
}
