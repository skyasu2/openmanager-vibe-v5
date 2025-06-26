/**
 * 🎯 통합 데이터 브로커
 *
 * 기능:
 * - 단일 진입점으로 모든 데이터 수집 통합
 * - 캐시 우선, 실시간 폴백 전략
 * - Redis 명령어 최소화
 * - 경연대회 모드 최적화
 */

import {
  competitionConfig,
  getCompetitionConfig,
} from '@/config/competition-config';
import { smartRedis } from '@/lib/redis';
import type { ServerInstance } from '@/types/data-generator';
import { realServerDataGenerator } from '../data-generator/RealServerDataGenerator';

export interface DataBrokerMetrics {
  cacheHitRate: number;
  redisCommands: number;
  dataFreshness: number; // 초 단위
  activeSubscribers: number;
}

export interface SubscriptionOptions {
  interval: number; // ms
  priority: 'high' | 'medium' | 'low';
  cacheStrategy: 'cache-first' | 'network-first' | 'cache-only';
}

/**
 * 📊 통합 데이터 브로커
 */
export class UnifiedDataBroker {
  private subscribers = new Map<
    string,
    {
      callback: (data: any) => void;
      options: SubscriptionOptions;
      lastUpdate: Date;
    }
  >();

  private cache = new Map<
    string,
    {
      data: any;
      timestamp: Date;
      hits: number;
    }
  >();

  private metrics: DataBrokerMetrics = {
    cacheHitRate: 0,
    redisCommands: 0,
    dataFreshness: 0,
    activeSubscribers: 0,
  };

  private isActive = false;
  private optimizationTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.setupCompetitionListeners();
    this.startOptimizationLoop();
  }

  /**
   * 🏆 경연대회 이벤트 리스너 설정
   */
  private setupCompetitionListeners(): void {
    // 브라우저 환경
    if (typeof window !== 'undefined') {
      window.addEventListener('competition-shutdown', () => {
        this.shutdown();
      });

      window.addEventListener('focus', () => {
        this.setActive(true);
      });

      window.addEventListener('blur', () => {
        this.setActive(false);
      });
    }

    // 서버 환경
    if (typeof process !== 'undefined') {
      process.on('SIGTERM', () => {
        this.shutdown();
      });
    }
  }

  /**
   * 🔄 최적화 루프 시작
   */
  private startOptimizationLoop(): void {
    this.optimizationTimer = setInterval(() => {
      this.optimizePerformance();
    }, 30000); // 30초마다 최적화
  }

  /**
   * ⚡ 성능 최적화
   */
  private optimizePerformance(): void {
    const config = getCompetitionConfig();

    // 캐시 정리 (5분 이상 된 데이터)
    const now = new Date();
    for (const [key, entry] of this.cache.entries()) {
      const age = now.getTime() - entry.timestamp.getTime();
      if (age > 5 * 60 * 1000) {
        // 5분
        this.cache.delete(key);
      }
    }

    // 구독자 없으면 절전 모드
    if (this.subscribers.size === 0) {
      this.setActive(false);
    }

    // 실시간 최적화 적용
    if (config.features.realTimeOptimization) {
      competitionConfig.optimizeForUsage({
        activeUsers: this.subscribers.size,
        redisCommandsUsed: this.metrics.redisCommands,
        memoryUsage: this.calculateMemoryUsage(),
      });
    }

    // 캐시 히트율 계산
    const totalRequests = Array.from(this.cache.values()).reduce(
      (sum, entry) => sum + entry.hits,
      0
    );
    const cacheHits = Array.from(this.cache.values()).filter(
      entry => entry.hits > 0
    ).length;
    this.metrics.cacheHitRate =
      totalRequests > 0 ? (cacheHits / totalRequests) * 100 : 0;
  }

  /**
   * 💾 메모리 사용량 계산
   */
  private calculateMemoryUsage(): number {
    let totalSize = 0;
    for (const entry of this.cache.values()) {
      totalSize += JSON.stringify(entry.data).length;
    }
    return totalSize / 1024 / 1024; // MB 단위
  }

  /**
   * 🎮 활성 상태 설정
   */
  setActive(active: boolean): void {
    this.isActive = active;
    competitionConfig.toggleActive(active);

    if (active) {
      console.log('🔥 데이터 브로커 활성화');
    } else {
      console.log('😴 데이터 브로커 절전 모드');
    }
  }

  /**
   * 📡 서버 데이터 구독
   */
  subscribeToServers(
    subscriberId: string,
    callback: (servers: ServerInstance[]) => void,
    options: SubscriptionOptions = {
      interval: 5000,
      priority: 'medium',
      cacheStrategy: 'cache-first',
    }
  ): () => void {
    this.subscribers.set(subscriberId, {
      callback: data => callback(data.servers || []),
      options,
      lastUpdate: new Date(),
    });

    this.setActive(true);
    this.startDataFlow(subscriberId);

    // 구독 해제 함수 반환
    return () => {
      this.subscribers.delete(subscriberId);
      if (this.subscribers.size === 0) {
        this.setActive(false);
      }
    };
  }

  /**
   * 📊 메트릭 데이터 구독
   */
  subscribeToMetrics(
    subscriberId: string,
    callback: (metrics: any) => void,
    options: SubscriptionOptions = {
      interval: 8000,
      priority: 'low',
      cacheStrategy: 'cache-first',
    }
  ): () => void {
    this.subscribers.set(`${subscriberId}-metrics`, {
      callback: data => callback(data.metrics || {}),
      options,
      lastUpdate: new Date(),
    });

    this.setActive(true);
    this.startDataFlow(`${subscriberId}-metrics`);

    return () => {
      this.subscribers.delete(`${subscriberId}-metrics`);
    };
  }

  /**
   * 🌊 데이터 플로우 시작
   */
  private async startDataFlow(subscriberId: string): Promise<void> {
    const subscriber = this.subscribers.get(subscriberId);
    if (!subscriber || !this.isActive) return;

    const { options } = subscriber;
    const data = await this.fetchData(subscriberId, options.cacheStrategy);

    if (data) {
      subscriber.callback(data);
      subscriber.lastUpdate = new Date();
    }

    // 다음 업데이트 스케줄링
    setTimeout(() => {
      this.startDataFlow(subscriberId);
    }, options.interval);
  }

  /**
   * 📥 데이터 가져오기
   */
  private async fetchData(
    key: string,
    strategy: SubscriptionOptions['cacheStrategy']
  ): Promise<any> {
    const config = getCompetitionConfig();

    try {
      // 1. 캐시 우선 전략
      if (strategy === 'cache-first' || strategy === 'cache-only') {
        const cached = this.getCachedData(key);
        if (cached) {
          cached.hits++;
          return cached.data;
        }

        if (strategy === 'cache-only') {
          return null;
        }
      }

      // 2. Redis 조회 (무료 티어 고려)
      let redisData: any = null;
      if (
        config.environment.redisTier === 'free' &&
        this.metrics.redisCommands < config.limits.redisCommands
      ) {
        try {
          redisData = await smartRedis.get(key);
          this.metrics.redisCommands++;
        } catch (error) {
          console.warn('Redis 조회 실패:', error);
        }
      }

      if (redisData) {
        this.setCachedData(key, redisData);
        return redisData;
      }

      // 3. 실시간 데이터 생성기 폴백
      const freshData = await this.generateFreshData(key);
      if (freshData) {
        this.setCachedData(key, freshData);

        // Redis에 저장 (명령어 한도 내에서)
        if (this.metrics.redisCommands < config.limits.redisCommands) {
          try {
            await smartRedis.set(key, freshData);
            this.metrics.redisCommands++;
          } catch (error) {
            console.warn('Redis 저장 실패:', error);
          }
        }

        return freshData;
      }

      return null;
    } catch (error) {
      console.error('데이터 가져오기 실패:', error);
      return this.getCachedData(key)?.data || null;
    }
  }

  /**
   * 🆕 새로운 데이터 생성
   */
  private async generateFreshData(key: string): Promise<any> {
    try {
      if (key.includes('metrics')) {
        // 서버 메트릭 데이터 집계
        const servers = realServerDataGenerator.getAllServers();
        const summary = realServerDataGenerator.getDashboardSummary();

        return {
          metrics: {
            serverMetrics: servers.map(s => ({
              id: s.id,
              cpu: s.metrics.cpu,
              memory: s.metrics.memory,
              disk: s.metrics.disk,
              status: s.status,
            })),
            summary: summary.servers,
            health: summary.clusters,
          },
          timestamp: new Date(),
        };
      } else {
        return {
          servers: realServerDataGenerator.getAllServers(),
          clusters: realServerDataGenerator.getAllClusters(),
          applications: realServerDataGenerator.getAllApplications(),
          summary: realServerDataGenerator.getDashboardSummary(),
          timestamp: new Date(),
        };
      }
    } catch (error) {
      console.error('데이터 생성 실패:', error);
      return null;
    }
  }

  /**
   * 💾 캐시 데이터 조회
   */
  private getCachedData(key: string) {
    const cached = this.cache.get(key);
    if (!cached) return null;

    // 데이터 신선도 확인 (2분 이내)
    const age = Date.now() - cached.timestamp.getTime();
    if (age > 2 * 60 * 1000) {
      this.cache.delete(key);
      return null;
    }

    return cached;
  }

  /**
   * 💾 캐시 데이터 저장
   */
  private setCachedData(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: new Date(),
      hits: 0,
    });
  }

  /**
   * 📊 브로커 메트릭 조회
   */
  getMetrics(): DataBrokerMetrics {
    return {
      ...this.metrics,
      activeSubscribers: this.subscribers.size,
      dataFreshness: this.calculateDataFreshness(),
    };
  }

  /**
   * ⏱️ 데이터 신선도 계산
   */
  private calculateDataFreshness(): number {
    if (this.cache.size === 0) return 0;

    const now = Date.now();
    const ages = Array.from(this.cache.values()).map(
      entry => (now - entry.timestamp.getTime()) / 1000
    );

    return ages.reduce((sum, age) => sum + age, 0) / ages.length;
  }

  /**
   * 🛑 시스템 종료
   */
  shutdown(): void {
    this.isActive = false;
    this.subscribers.clear();
    this.cache.clear();

    if (this.optimizationTimer) {
      clearInterval(this.optimizationTimer);
      this.optimizationTimer = null;
    }

    console.log('🏁 통합 데이터 브로커 종료');
  }
}

// 글로벌 인스턴스
export const unifiedDataBroker = new UnifiedDataBroker();
