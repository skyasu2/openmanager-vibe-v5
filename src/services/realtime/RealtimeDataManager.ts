/**
 * 🎯 Realtime Data Manager v1.0
 *
 * 중앙화된 실시간 데이터 관리 시스템
 * - 모든 컴포넌트의 갱신을 하나의 타이머로 통합
 * - 구독/구독해제 시스템으로 메모리 누수 방지
 * - 가시성 기반 업데이트로 성능 최적화
 * - 환경별 갱신 주기 설정
 */

type DataType = 'server' | 'network' | 'system' | 'metrics';
type UpdateFrequency = 'high' | 'medium' | 'low';

interface SubscriberCallback {
  (data: any): void;
}

interface Subscriber {
  id: string;
  callback: SubscriberCallback;
  dataType: DataType;
  frequency: UpdateFrequency;
  isVisible: boolean;
  lastUpdate: number;
}

interface UpdateConfig {
  high: number; // 30초 - 중요한 메트릭
  medium: number; // 60초 - 일반 데이터
  low: number; // 120초 - 정적 정보
}

class RealtimeDataManager {
  private static instance: RealtimeDataManager;
  private subscribers: Map<string, Subscriber> = new Map();
  private timers: Map<UpdateFrequency, NodeJS.Timeout> = new Map();
  private isRunning = false;
  private updateCount = 0;

  // 환경별 갱신 주기 설정
  private config: UpdateConfig = {
    high: process.env.NODE_ENV === 'development' ? 30000 : 60000, // 30초/60초
    medium: process.env.NODE_ENV === 'development' ? 60000 : 120000, // 60초/120초
    low: process.env.NODE_ENV === 'development' ? 120000 : 300000, // 120초/300초
  };

  private constructor() {
    this.startTimers();
  }

  public static getInstance(): RealtimeDataManager {
    if (!RealtimeDataManager.instance) {
      RealtimeDataManager.instance = new RealtimeDataManager();
    }
    return RealtimeDataManager.instance;
  }

  /**
   * 구독자 등록
   */
  public subscribe(
    id: string,
    callback: SubscriberCallback,
    dataType: DataType,
    frequency: UpdateFrequency = 'medium'
  ): () => void {
    const subscriber: Subscriber = {
      id,
      callback,
      dataType,
      frequency,
      isVisible: true,
      lastUpdate: 0,
    };

    this.subscribers.set(id, subscriber);

    console.log(`📡 구독자 등록: ${id} (${dataType}, ${frequency})`);
    console.log(`📊 총 구독자 수: ${this.subscribers.size}`);

    // 즉시 첫 데이터 전송
    this.updateSubscriber(subscriber);

    // 구독 해제 함수 반환
    return () => this.unsubscribe(id);
  }

  /**
   * 구독 해제
   */
  public unsubscribe(id: string): void {
    if (this.subscribers.delete(id)) {
      console.log(`📡 구독자 해제: ${id}`);
      console.log(`📊 남은 구독자 수: ${this.subscribers.size}`);
    }

    // 구독자가 없으면 타이머 정지
    if (this.subscribers.size === 0) {
      this.stopTimers();
    }
  }

  /**
   * 구독자 가시성 업데이트
   */
  public updateVisibility(id: string, isVisible: boolean): void {
    const subscriber = this.subscribers.get(id);
    if (subscriber) {
      subscriber.isVisible = isVisible;
      console.log(`👁️ 가시성 업데이트: ${id} = ${isVisible}`);
    }
  }

  /**
   * 타이머 시작
   */
  private startTimers(): void {
    if (this.isRunning) return;

    this.isRunning = true;
    console.log('🚀 RealtimeDataManager 타이머 시작');

    // 각 주기별 타이머 설정
    Object.entries(this.config).forEach(([frequency, interval]) => {
      const timer = setInterval(() => {
        this.updateByFrequency(frequency as UpdateFrequency);
      }, interval);

      this.timers.set(frequency as UpdateFrequency, timer);
      console.log(`⏰ ${frequency} 타이머 설정: ${interval}ms`);
    });
  }

  /**
   * 타이머 정지
   */
  private stopTimers(): void {
    if (!this.isRunning) return;

    this.isRunning = false;
    console.log('⏹️ RealtimeDataManager 타이머 정지');

    this.timers.forEach((timer, frequency) => {
      clearInterval(timer);
      console.log(`⏰ ${frequency} 타이머 정지`);
    });

    this.timers.clear();
  }

  /**
   * 주기별 업데이트 실행
   */
  private updateByFrequency(frequency: UpdateFrequency): void {
    const now = Date.now();
    let updatedCount = 0;

    this.subscribers.forEach(subscriber => {
      if (subscriber.frequency === frequency && subscriber.isVisible) {
        this.updateSubscriber(subscriber);
        subscriber.lastUpdate = now;
        updatedCount++;
      }
    });

    this.updateCount++;
    console.log(
      `🔄 ${frequency} 업데이트 완료: ${updatedCount}개 구독자 (총 ${this.updateCount}회)`
    );
  }

  /**
   * 개별 구독자 업데이트
   */
  private updateSubscriber(subscriber: Subscriber): void {
    try {
      const data = this.generateData(subscriber.dataType);
      subscriber.callback(data);
    } catch (error) {
      console.error(`❌ 구독자 업데이트 실패: ${subscriber.id}`, error);
    }
  }

  /**
   * 데이터 타입별 데이터 생성
   */
  private generateData(dataType: DataType): any {
    const baseVariation = 0.1; // 10% 변동폭으로 축소

    switch (dataType) {
      case 'server':
        return {
          cpu: Math.max(
            0,
            Math.min(100, 45 + (Math.random() - 0.5) * 20 * baseVariation)
          ),
          memory: Math.max(
            0,
            Math.min(100, 60 + (Math.random() - 0.5) * 15 * baseVariation)
          ),
          disk: Math.max(
            0,
            Math.min(100, 35 + (Math.random() - 0.5) * 10 * baseVariation)
          ),
          network: Math.max(
            0,
            Math.min(100, 25 + (Math.random() - 0.5) * 15 * baseVariation)
          ),
          timestamp: Date.now(),
        };

      case 'network':
        return {
          bandwidth: Math.max(
            0,
            Math.min(100, 70 + (Math.random() - 0.5) * 20 * baseVariation)
          ),
          latency: Math.max(
            0,
            Math.min(500, 45 + (Math.random() - 0.5) * 30 * baseVariation)
          ),
          downloadSpeed: Math.max(
            0,
            Math.min(1000, 150 + (Math.random() - 0.5) * 50 * baseVariation)
          ),
          uploadSpeed: Math.max(
            0,
            Math.min(1000, 80 + (Math.random() - 0.5) * 30 * baseVariation)
          ),
          // IP 주소는 고정 (실제로는 자주 바뀌지 않음)
          ip: '192.168.1.100',
          timestamp: Date.now(),
        };

      case 'system':
        return {
          uptime: '99.9%',
          processes: Math.floor(
            120 + (Math.random() - 0.5) * 10 * baseVariation
          ),
          connections: Math.floor(
            45 + (Math.random() - 0.5) * 15 * baseVariation
          ),
          timestamp: Date.now(),
        };

      case 'metrics':
        return {
          responseTime: Math.max(
            0,
            120 + (Math.random() - 0.5) * 40 * baseVariation
          ),
          throughput: Math.max(
            0,
            850 + (Math.random() - 0.5) * 100 * baseVariation
          ),
          errorRate: Math.max(
            0,
            Math.min(5, 0.5 + (Math.random() - 0.5) * 1 * baseVariation)
          ),
          timestamp: Date.now(),
        };

      default:
        return { timestamp: Date.now() };
    }
  }

  /**
   * 성능 통계 조회
   */
  public getStats(): {
    subscriberCount: number;
    updateCount: number;
    isRunning: boolean;
    config: UpdateConfig;
  } {
    return {
      subscriberCount: this.subscribers.size,
      updateCount: this.updateCount,
      isRunning: this.isRunning,
      config: this.config,
    };
  }

  /**
   * 강제 업데이트 (디버깅용)
   */
  public forceUpdate(dataType?: DataType): void {
    console.log(`🔄 강제 업데이트 실행: ${dataType || 'all'}`);

    this.subscribers.forEach(subscriber => {
      if (!dataType || subscriber.dataType === dataType) {
        this.updateSubscriber(subscriber);
      }
    });
  }

  /**
   * 정리 (앱 종료 시)
   */
  public destroy(): void {
    console.log('🧹 RealtimeDataManager 정리');
    this.stopTimers();
    this.subscribers.clear();
    this.updateCount = 0;
  }
}

// 싱글톤 인스턴스 내보내기
export const realtimeDataManager = RealtimeDataManager.getInstance();
export default RealtimeDataManager;
