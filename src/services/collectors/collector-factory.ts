// import { PrometheusCollector } from './prometheus-collector'; // 🗑️ 프로메테우스 제거
import { CloudWatchCollector } from './cloudwatch-collector';
import { CustomAPICollector } from './custom-api-collector';
import type { MetricCollector, CollectorConfig } from '@/types/collector';

/**
 * 실제 컬렉터 팩토리 (프로메테우스 제거됨)
 */
export function createCollector(config: CollectorConfig): MetricCollector {
  switch (config.type) {
    // case 'prometheus': // 🗑️ 프로메테우스 제거
    //   return new PrometheusCollector(_config);

    case 'cloudwatch':
      return new CloudWatchCollector(config);

    case 'custom':
      return new CustomAPICollector(config);

    default:
      throw new Error(`지원하지 않는 컬렉터 타입: ${config.type}`);
  }
}

/**
 * 컬렉터 관리자 클래스
 */
export class CollectorManager {
  private collectors: Map<string, MetricCollector> = new Map();
  private isRunning = false;

  /**
   * 컬렉터 추가
   */
  addCollector(id: string, config: CollectorConfig): void {
    if (this.collectors.has(id)) {
      console.warn(`⚠️ 컬렉터 ${id}가 이미 존재합니다`);
      return;
    }

    const collector = createCollector(config);
    this.collectors.set(id, collector);
    console.log(`✅ 컬렉터 추가됨: ${id} (${config.type})`);
  }

  /**
   * 컬렉터 제거
   */
  removeCollector(id: string): boolean {
    const collector = this.collectors.get(id);
    if (collector) {
      collector.stop();
      this.collectors.delete(id);
      console.log(`🗑️ 컬렉터 제거됨: ${id}`);
      return true;
    }
    return false;
  }

  /**
   * 모든 컬렉터 시작
   */
  async startAll(): Promise<void> {
    if (this.isRunning) {
      console.log('⚠️ 컬렉터들이 이미 실행 중입니다');
      return;
    }

    console.log(`🚀 ${this.collectors.size}개 컬렉터 시작...`);

    const startPromises = Array.from(this.collectors.values()).map(
      async collector => {
        try {
          await collector.start();
        } catch (error) {
          console.error(`❌ 컬렉터 시작 실패:`, error);
        }
      }
    );

    await Promise.all(startPromises);
    this.isRunning = true;
    console.log('✅ 모든 컬렉터 시작 완료');
  }

  /**
   * 모든 컬렉터 중지
   */
  stopAll(): void {
    console.log(`🛑 ${this.collectors.size}개 컬렉터 중지...`);

    this.collectors.forEach(collector => {
      try {
        collector.stop();
      } catch (error) {
        console.error(`❌ 컬렉터 중지 실패:`, error);
      }
    });

    this.isRunning = false;
    console.log('✅ 모든 컬렉터 중지 완료');
  }

  /**
   * 컬렉터 상태 조회
   */
  getStatus() {
    const collectors = Array.from(this.collectors.entries()).map(
      ([id, collector]) => ({
        id,
        isRunning: collector.isRunning,
        lastCollection: collector.lastCollection,
        errorCount: collector.errorCount,
      })
    );

    return {
      total: this.collectors.size,
      running: collectors.filter(c => c.isRunning).length,
      collectors,
      managerRunning: this.isRunning,
    };
  }
}

// 전역 컬렉터 관리자 인스턴스
export const collectionManager = new CollectorManager();

// 초기화
if (typeof window === 'undefined') {
  // 서버 환경에서만
  console.log('🔧 실제 컬렉터 관리자 초기화 (프로메테우스 제거됨)');

  // 프로덕션 환경에서만 실제 컬렉터 추가
  if (process.env.NODE_ENV === 'production') {
    // 🗑️ Prometheus 컬렉터 제거됨
    // if (process.env.PROMETHEUS_ENDPOINT) {
    //   collectionManager.addCollector('prometheus', {
    //     id: 'prometheus',
    //     type: 'prometheus',
    //     name: 'Prometheus Collector',
    //     endpoint: process.env.PROMETHEUS_ENDPOINT,
    //     interval: 30000,
    //     timeout: 10000,
    //     retryAttempts: 3,
    //     enabled: true,
    //     tags: ['production', 'prometheus'],
    //     authentication: {
    //       type: 'bearer',
    //       token: process.env.PROMETHEUS_TOKEN
    //     }
    //   });
    // }

    // CloudWatch 컬렉터
    if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
      collectionManager.addCollector('cloudwatch', {
        id: 'cloudwatch',
        type: 'cloudwatch',
        name: 'CloudWatch Collector',
        endpoint: process.env.AWS_CLOUDWATCH_ENDPOINT,
        interval: 60000,
        timeout: 15000,
        retryAttempts: 2,
        enabled: true,
        tags: ['production', 'aws'],
        authentication: {
          type: 'aws',
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
          region: process.env.AWS_REGION || 'us-east-1',
        },
      });
    }
  }
}
