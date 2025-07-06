/**
 * 🧠 AI 엔진용 데이터 전처리기
 *
 * RealServerDataGenerator + Redis 24시간 데이터를 합쳐서
 * AI용 StandardServerMetrics[] 타입으로 변환하는 전문 전처리기
 */

import {
  StandardServerMetrics,
  SystemIntegrationAdapter,
} from '@/modules/ai-agent/adapters/SystemIntegrationAdapter';
import { ServerInstance } from '@/types/data-generator';
import { RealServerDataGenerator, type RealServerDataGeneratorType } from './RealServerDataGenerator';

export interface ProcessedAIData {
  metrics: StandardServerMetrics[];
  aggregatedStats: {
    totalServers: number;
    avgCpuUsage: number;
    avgMemoryUsage: number;
    avgDiskUsage: number;
    networkThroughput: number;
    healthScore: number;
    anomalyCount: number;
  };
  trends: {
    cpuTrend: 'increasing' | 'decreasing' | 'stable';
    memoryTrend: 'increasing' | 'decreasing' | 'stable';
    diskTrend: 'increasing' | 'decreasing' | 'stable';
    networkTrend: 'increasing' | 'decreasing' | 'stable';
  };
  timestamp: string;
  source: 'ai-engine-processor';
}

export interface AIHistoricalData {
  serverId: string;
  timeSeriesData: Array<{
    timestamp: Date;
    metrics: {
      cpu: { usage: number; loadAverage: number[] };
      memory: { usage: number; available: number };
      disk: { usage: number; iops: { read: number; write: number } };
      network: { bytesReceived: number; bytesSent: number };
    };
    anomalies: Array<{
      type: 'cpu_spike' | 'memory_leak' | 'disk_full' | 'network_congestion';
      severity: 'low' | 'medium' | 'high';
      confidence: number;
    }>;
  }>;
}

export class AIEngineProcessor {
  private static instance: AIEngineProcessor | null = null;
  private dataGenerator: RealServerDataGeneratorType;
  private lastProcessTime = 0;
  private readonly CACHE_DURATION = 45000; // 45초 캐시 (40-50초 범위)
  private cachedData: ProcessedAIData | null = null;

  private constructor() {
    this.dataGenerator = RealServerDataGenerator.getInstance();
  }

  public static getInstance(): AIEngineProcessor {
    if (!AIEngineProcessor.instance) {
      AIEngineProcessor.instance = new AIEngineProcessor();
    }
    return AIEngineProcessor.instance;
  }

  /**
   * 🧠 메인 처리 함수: AI 분석용 데이터 전처리
   */
  public async getProcessedAIData(
    options: {
      includeTimeSeries?: boolean;
      enableAnomalyDetection?: boolean;
      forceRefresh?: boolean;
    } = {}
  ): Promise<ProcessedAIData> {
    const now = Date.now();

    if (
      !options.forceRefresh &&
      this.cachedData &&
      now - this.lastProcessTime < this.CACHE_DURATION
    ) {
      console.log('🧠 AI 엔진 데이터 캐시 사용');
      return this.cachedData;
    }

    try {
      console.log('🔄 AI 엔진 데이터 전처리 시작');

      const rawServers = await this.getRealTimeServerData();
      const aiMetrics = await this.transformToAIMetrics(rawServers);

      if (options.enableAnomalyDetection) {
        await this.detectAnomalies(aiMetrics);
      }

      const aggregatedStats = this.calculateAggregatedStats(aiMetrics);
      const trends = this.analyzeTrends(aiMetrics);

      const result: ProcessedAIData = {
        metrics: aiMetrics,
        aggregatedStats,
        trends,
        timestamp: new Date().toISOString(),
        source: 'ai-engine-processor',
      };

      this.cachedData = result;
      this.lastProcessTime = now;

      console.log(`✅ AI 엔진 데이터 전처리 완료: ${aiMetrics.length}개 서버`);
      return result;
    } catch (error) {
      console.error('❌ AI 엔진 데이터 전처리 실패:', error);

      if (this.cachedData) {
        console.log('🛡️ 캐시된 AI 데이터로 폴백');
        return this.cachedData;
      }

      return this.getEmptyAIData();
    }
  }

  private async getRealTimeServerData(): Promise<ServerInstance[]> {
    try {
      if (this.dataGenerator.getAllServers().length === 0) {
        await this.dataGenerator.initialize();
        this.dataGenerator.startAutoGeneration();
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      const servers = this.dataGenerator.getAllServers();
      console.log(`🧠 AI용 실시간 서버 데이터 수집: ${servers.length}개`);
      return servers;
    } catch (error) {
      console.error('❌ AI용 실시간 서버 데이터 수집 실패:', error);
      return [];
    }
  }

  private async transformToAIMetrics(
    rawServers: ServerInstance[]
  ): Promise<StandardServerMetrics[]> {
    const processedMetrics: StandardServerMetrics[] = [];

    // 🔄 SystemIntegrationAdapter 인스턴스 가져오기
    const systemAdapter = SystemIntegrationAdapter.getInstance();

    for (const serverInstance of rawServers) {
      try {
        // 🎯 SystemIntegrationAdapter의 변환 함수 재사용
        const baseMetrics = await systemAdapter.getServerMetrics(
          serverInstance.id,
          false
        );

        if (baseMetrics) {
          // 기존 메트릭이 있으면 사용
          processedMetrics.push(baseMetrics);
        } else {
          // 없으면 현재 데이터로 새로 생성
          const newMetrics =
            this.createStandardMetricsFromServerInstance(serverInstance);
          processedMetrics.push(newMetrics);
        }

        // 히스토리 데이터와 통합 (이상 감지 등)
        // const serverHistory = await this.getHistoricalData(serverInstance.id);
        // if (serverHistory) {
        //     await this.enhanceMetricsWithHistory(processedMetrics[processedMetrics.length - 1], serverHistory);
        // }
      } catch (error) {
        console.error(`❌ 서버 ${serverInstance.id} AI 처리 실패:`, error);

        // 폴백: 기본 변환 적용
        try {
          const fallbackMetrics =
            this.createStandardMetricsFromServerInstance(serverInstance);
          processedMetrics.push(fallbackMetrics);
        } catch (fallbackError) {
          console.error(
            `❌ 서버 ${serverInstance.id} 폴백 처리도 실패:`,
            fallbackError
          );
        }
      }
    }

    return processedMetrics;
  }

  /**
   * 🎯 ServerInstance를 StandardServerMetrics로 변환 (폴백용)
   */
  private createStandardMetricsFromServerInstance(
    serverInstance: ServerInstance
  ): StandardServerMetrics {
    return {
      serverId: serverInstance.id,
      hostname: serverInstance.name,
      timestamp: new Date(),
      status: this.mapServerStatus(serverInstance.status),
      metrics: {
        cpu: {
          usage: serverInstance.metrics?.cpu || 0,
          loadAverage: [0, 0, 0],
          cores: serverInstance.specs?.cpu?.cores || 4,
        },
        memory: {
          total:
            (serverInstance.specs?.memory?.total || 8) * 1024 * 1024 * 1024,
          used: Math.floor(
            ((serverInstance.specs?.memory?.total || 8) *
              1024 *
              1024 *
              1024 *
              (serverInstance.metrics?.memory || 0)) /
            100
          ),
          available: Math.floor(
            ((serverInstance.specs?.memory?.total || 8) *
              1024 *
              1024 *
              1024 *
              (100 - (serverInstance.metrics?.memory || 0))) /
            100
          ),
          usage: serverInstance.metrics?.memory || 0,
        },
        disk: {
          total:
            (serverInstance.specs?.disk?.total || 100) * 1024 * 1024 * 1024,
          used: Math.floor(
            ((serverInstance.specs?.disk?.total || 100) *
              1024 *
              1024 *
              1024 *
              (serverInstance.metrics?.disk || 0)) /
            100
          ),
          available: Math.floor(
            ((serverInstance.specs?.disk?.total || 100) *
              1024 *
              1024 *
              1024 *
              (100 - (serverInstance.metrics?.disk || 0))) /
            100
          ),
          usage: serverInstance.metrics?.disk || 0,
          iops: {
            read: 0,
            write: 0,
          },
        },
        network: {
          interface: 'eth0',
          bytesReceived: serverInstance.metrics?.network?.in || 0,
          bytesSent: serverInstance.metrics?.network?.out || 0,
          packetsReceived: 0,
          packetsSent: 0,
          errorsReceived: 0,
          errorsSent: 0,
        },
      },
      services: [],
      metadata: {
        location: serverInstance.location || 'Unknown',
        environment:
          ((serverInstance.environment === 'development'
            ? 'development'
            : serverInstance.environment) as
            | 'production'
            | 'staging'
            | 'development') || 'production',
        provider: 'onpremise',
      },
    };
  }

  /**
   * 🎯 서버 상태 매핑
   */
  private mapServerStatus(
    status: string
  ): 'online' | 'warning' | 'critical' | 'offline' {
    switch (status) {
      case 'running':
        return 'online';
      case 'warning':
        return 'warning';
      case 'error':
      case 'critical':
        return 'critical';
      case 'stopped':
      case 'maintenance':
        return 'offline';
      default:
        return 'offline';
    }
  }

  private async detectAnomalies(
    metrics: StandardServerMetrics[]
  ): Promise<void> {
    try {
      for (const metric of metrics) {
        const anomalies: any[] = [];

        if (metric.metrics.cpu.usage > 90) {
          anomalies.push({
            type: 'cpu_spike',
            severity: 'high',
            confidence: 0.9,
          });
        }

        if (metric.metrics.memory.usage > 95) {
          anomalies.push({
            type: 'memory_leak',
            severity: 'high',
            confidence: 0.85,
          });
        }

        if (anomalies.length > 0) {
          console.log(`🚨 서버 ${metric.serverId} 이상 감지:`, anomalies);
        }
      }
    } catch (error) {
      console.error('❌ 이상 감지 실패:', error);
    }
  }

  private calculateAggregatedStats(
    metrics: StandardServerMetrics[]
  ): ProcessedAIData['aggregatedStats'] {
    if (metrics.length === 0) {
      return {
        totalServers: 0,
        avgCpuUsage: 0,
        avgMemoryUsage: 0,
        avgDiskUsage: 0,
        networkThroughput: 0,
        healthScore: 0,
        anomalyCount: 0,
      };
    }

    const totalServers = metrics.length;
    const avgCpuUsage =
      metrics.reduce((sum, m) => sum + m.metrics.cpu.usage, 0) / totalServers;
    const avgMemoryUsage =
      metrics.reduce((sum, m) => sum + m.metrics.memory.usage, 0) /
      totalServers;
    const avgDiskUsage =
      metrics.reduce((sum, m) => sum + m.metrics.disk.usage, 0) / totalServers;
    const networkThroughput = metrics.reduce(
      (sum, m) =>
        sum + m.metrics.network.bytesReceived + m.metrics.network.bytesSent,
      0
    );

    const healthScore = Math.max(
      0,
      100 - (avgCpuUsage + avgMemoryUsage + avgDiskUsage) / 3
    );
    const anomalyCount = metrics.filter(
      m =>
        m.metrics.cpu.usage > 85 ||
        m.metrics.memory.usage > 85 ||
        m.metrics.disk.usage > 85
    ).length;

    return {
      totalServers,
      avgCpuUsage: Math.round(avgCpuUsage * 10) / 10,
      avgMemoryUsage: Math.round(avgMemoryUsage * 10) / 10,
      avgDiskUsage: Math.round(avgDiskUsage * 10) / 10,
      networkThroughput: Math.round(networkThroughput / 1024 / 1024),
      healthScore: Math.round(healthScore * 10) / 10,
      anomalyCount,
    };
  }

  private analyzeTrends(
    metrics: StandardServerMetrics[]
  ): ProcessedAIData['trends'] {
    return {
      cpuTrend: 'stable',
      memoryTrend: 'stable',
      diskTrend: 'stable',
      networkTrend: 'stable',
    };
  }

  private getEmptyAIData(): ProcessedAIData {
    return {
      metrics: [],
      aggregatedStats: {
        totalServers: 0,
        avgCpuUsage: 0,
        avgMemoryUsage: 0,
        avgDiskUsage: 0,
        networkThroughput: 0,
        healthScore: 0,
        anomalyCount: 0,
      },
      trends: {
        cpuTrend: 'stable',
        memoryTrend: 'stable',
        diskTrend: 'stable',
        networkTrend: 'stable',
      },
      timestamp: new Date().toISOString(),
      source: 'ai-engine-processor',
    };
  }

  public clearCache(): void {
    this.cachedData = null;
    this.lastProcessTime = 0;
    console.log('🗑️ AI 엔진 프로세서 캐시 초기화');
  }

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
