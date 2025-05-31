import { MetricCollector, CollectorConfig, CollectorFactory } from '../../types/collector';
import { DummyCollector } from './dummy-collector';
// 실제 수집기들
import { PrometheusCollector } from './prometheus-collector';
import { CloudWatchCollector } from './cloudwatch-collector';
import { CustomAPICollector } from './custom-api-collector';

/**
 * 수집기 팩토리 - 설정에 따라 적절한 수집기 생성
 */
export class MetricCollectorFactory implements CollectorFactory {
  createCollector(config: CollectorConfig): MetricCollector {
    switch (config.type) {
      case 'dummy':
        return new DummyCollector(config);
      
      case 'prometheus':
        return new PrometheusCollector(config);
      
      case 'cloudwatch':
        return new CloudWatchCollector(config);
      
      case 'custom':
        return new CustomAPICollector(config);
      
      default:
        throw new Error(`지원하지 않는 수집기 타입: ${config.type}`);
    }
  }
}

/**
 * 수집 관리자 - 여러 수집기를 관리하고 스케줄링
 */
export class MetricCollectionManager {
  private collectors: Map<string, MetricCollector> = new Map();
  private schedules: Map<string, NodeJS.Timeout> = new Map();
  private factory: CollectorFactory;

  constructor() {
    this.factory = new MetricCollectorFactory();
  }

  /**
   * 수집기 추가
   */
  addCollector(name: string, config: CollectorConfig): void {
    try {
      const collector = this.factory.createCollector(config);
      this.collectors.set(name, collector);
      
      // 자동 스케줄링 시작
      this.startSchedule(name, config.interval);
      
      console.log(`✅ Collector '${name}' added and scheduled every ${config.interval}s`);
    } catch (error) {
      console.error(`❌ Failed to add collector '${name}':`, error);
      throw error;
    }
  }

  /**
   * 수집기 제거
   */
  removeCollector(name: string): void {
    this.stopSchedule(name);
    this.collectors.delete(name);
    console.log(`🗑️ Collector '${name}' removed`);
  }

  /**
   * 특정 수집기로 메트릭 수집
   */
  async collectFromCollector(collectorName: string, serverId: string) {
    const collector = this.collectors.get(collectorName);
    if (!collector) {
      throw new Error(`Collector '${collectorName}' not found`);
    }

    return await collector.collectMetrics(serverId);
  }

  /**
   * 모든 수집기에서 모든 서버 메트릭 수집
   */
  async collectAllMetrics(): Promise<void> {
    const promises: Promise<void>[] = [];

    for (const [name, collector] of this.collectors) {
      promises.push(this.collectFromSingleCollector(name, collector));
    }

    await Promise.allSettled(promises);
  }

  /**
   * 단일 수집기에서 모든 서버 수집
   */
  private async collectFromSingleCollector(name: string, collector: MetricCollector): Promise<void> {
    try {
      const serverList = await collector.getServerList();
      
      const collectPromises = serverList.map(async (serverId) => {
        try {
          const metrics = await collector.collectMetrics(serverId);
          // TODO: 메트릭 저장 로직 구현 필요 (storage 모듈 제거됨)
          console.log(`📊 Collected metrics for ${serverId}:`, metrics);
        } catch (error) {
          console.error(`❌ Failed to collect metrics for ${serverId}:`, error);
        }
      });

      await Promise.allSettled(collectPromises);
      console.log(`✅ Collected metrics from ${serverList.length} servers via '${name}'`);
    } catch (error) {
      console.error(`❌ Failed to collect from collector '${name}':`, error);
    }
  }

  /**
   * 스케줄 시작
   */
  private startSchedule(collectorName: string, intervalSeconds: number): void {
    this.stopSchedule(collectorName); // 기존 스케줄 정리

    const interval = setInterval(async () => {
      const collector = this.collectors.get(collectorName);
      if (collector) {
        await this.collectFromSingleCollector(collectorName, collector);
      }
    }, intervalSeconds * 1000);

    this.schedules.set(collectorName, interval);
  }

  /**
   * 스케줄 중지
   */
  private stopSchedule(collectorName: string): void {
    const existingInterval = this.schedules.get(collectorName);
    if (existingInterval) {
      clearInterval(existingInterval);
      this.schedules.delete(collectorName);
    }
  }

  /**
   * 모든 스케줄 중지
   */
  stopAllSchedules(): void {
    for (const [name] of this.schedules) {
      this.stopSchedule(name);
    }
    console.log('🛑 All collection schedules stopped');
  }

  /**
   * 현재 활성 수집기 목록
   */
  getActiveCollectors(): string[] {
    return Array.from(this.collectors.keys());
  }

  /**
   * 수집기 상태 확인
   */
  async getCollectorStatus(): Promise<CollectorStatus[]> {
    const statuses: CollectorStatus[] = [];

    for (const [name, collector] of this.collectors) {
      try {
        const serverList = await collector.getServerList();
        const onlineServers = await Promise.all(
          serverList.map(id => collector.isServerOnline(id))
        );
        const onlineCount = onlineServers.filter(Boolean).length;

        statuses.push({
          name,
          totalServers: serverList.length,
          onlineServers: onlineCount,
          offlineServers: serverList.length - onlineCount,
          isScheduled: this.schedules.has(name),
          lastCollection: new Date()
        });
      } catch (error) {
        statuses.push({
          name,
          totalServers: 0,
          onlineServers: 0,
          offlineServers: 0,
          isScheduled: this.schedules.has(name),
          lastCollection: new Date(),
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return statuses;
  }
}

export interface CollectorStatus {
  name: string;
  totalServers: number;
  onlineServers: number;
  offlineServers: number;
  isScheduled: boolean;
  lastCollection: Date;
  error?: string;
}

// 싱글톤 인스턴스
export const collectionManager = new MetricCollectionManager();

// 기본 더미 수집기 자동 설정 (개발 환경용)
if (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) {
  collectionManager.addCollector('dummy', {
    type: 'dummy',
    interval: 30, // 30초마다 수집
    timeout: 10   // 10초 타임아웃
  });
} 