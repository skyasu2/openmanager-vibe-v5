// Using mock system for unified data collection
/**
 * 🎯 통합 데이터 브로커
 *
 * 기능:
 * - 단일 진입점으로 모든 데이터 수집 통합
 * - 메모리 캐시 우선, 실시간 폴백 전략
 * - 메모리 기반 캐시 사용
 * - 경연대회 모드 최적화
 */

import {
    competitionConfig,
    getCompetitionConfig,
} from '@/config/competition-config';
import type { ServerInstance } from '@/types/data-generator';

export interface DataBrokerMetrics {
  cacheHitRate: number;
  memoryOperations: number;
  dataFreshness: number; // 초 단위
  activeSubscribers: number;
}

export interface SubscriptionOptions {
  interval: number; // ms
  priority: 'high' | 'medium' | 'low';
  cacheStrategy: 'cache-first' | 'network-first' | 'cache-only';
}

// 메모리 기반 데이터 캐시 클래스
class MemoryDataCache {
  private cache = new Map<string, {
    data: unknown;
    timestamp: Date;
    hits: number;
    expires: number;
  }>();
  private maxSize = 500; // 최대 500개 항목
  private stats = { hits: 0, misses: 0, sets: 0 };

  get(key: string): { data: unknown; timestamp: Date; hits: number } | null {
    const item = this.cache.get(key);
    
    if (!item) {
      this.stats.misses++;
      return null;
    }
    
    if (Date.now() > item.expires) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }
    
    item.hits++;
    this.stats.hits++;
    return {
      data: item.data,
      timestamp: item.timestamp,
      hits: item.hits,
    };
  }

  set(key: string, data: unknown, ttlMinutes: number = 2): void {
    // LRU 방식으로 캐시 크기 관리
    if (this.cache.size >= this.maxSize) {
      this.evictLeastRecentlyUsed();
    }

    this.cache.set(key, {
      data,
      timestamp: new Date(),
      hits: 0,
      expires: Date.now() + ttlMinutes * 60 * 1000,
    });
    
    this.stats.sets++;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }

  getStats() {
    const totalRequests = this.stats.hits + this.stats.misses;
    return {
      ...this.stats,
      size: this.cache.size,
      hitRate: totalRequests > 0 ? (this.stats.hits / totalRequests) * 100 : 0,
    };
  }

  private evictLeastRecentlyUsed(): void {
    let leastUsedKey = '';
    let leastHits = Infinity;
    let oldestTime = Date.now();
    
    for (const [key, item] of this.cache.entries()) {
      if (item.hits < leastHits || (item.hits === leastHits && item.timestamp.getTime() < oldestTime)) {
        leastHits = item.hits;
        oldestTime = item.timestamp.getTime();
        leastUsedKey = key;
      }
    }
    
    if (leastUsedKey) {
      this.cache.delete(leastUsedKey);
    }
  }

  cleanup(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];
    
    for (const [key, item] of this.cache.entries()) {
      if (item.expires <= now) {
        expiredKeys.push(key);
      }
    }
    
    expiredKeys.forEach(key => this.cache.delete(key));
  }
}

/**
 * 📊 통합 데이터 브로커
 */
export class UnifiedDataBroker {
  private subscribers = new Map<
    string,
    {
      callback: (data: unknown) => void;
      options: SubscriptionOptions;
      lastUpdate: Date;
    }
  >();

  // 메모리 캐시 제거 - Supabase 직접 조회로 최적화

  private metrics: DataBrokerMetrics = {
    cacheHitRate: 0,
    memoryOperations: 0,
    dataFreshness: 0,
    activeSubscribers: 0,
  };

  private isActive = false;
  private cleanupTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.setupCompetitionListeners();
    this.startOptimizationLoop();
    this.startCleanupTimer();
  }

  /**
   * 🧹 주기적 정리 시작
   */
  private startCleanupTimer(): void {
    // 캐시 제거로 정리 타이머 불필요
    console.log('🧹 캐시 제거됨 - 메모리 최적화');
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
   * 🚫 최적화 루프 비활성화 (서버리스 호환)
   */
  private startOptimizationLoop(): void {
    console.warn('⚠️ 최적화 루프 무시됨 - 서버리스에서는 요청별 처리');
    console.warn('📊 Vercel이 자동으로 최적화를 수행합니다.');

    // 🚫 setInterval 생성하지 않음
    // this.optimizationTimer = setInterval(() => { ... }, 30000);
  }

  /**
   * ⚡ 성능 최적화 (요청별 실행)
   */
  private optimizePerformance(): void {
    console.warn(
      '⚠️ 성능 최적화 무시됨 - 서버리스 환경에서는 Vercel이 자동 관리'
    );

    // 캐시 제거됨 - 메모리 최적화
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
      callback: data => callback((data as any)?.servers || []),
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
    callback: (metrics: unknown) => void,
    options: SubscriptionOptions = {
      interval: 8000,
      priority: 'low',
      cacheStrategy: 'cache-first',
    }
  ): () => void {
    this.subscribers.set(`${subscriberId}-metrics`, {
      callback: data => callback((data as any)?.metrics || {}),
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

    // 🚫 다음 업데이트 스케줄링 비활성화 (서버리스 호환)
    console.warn('⚠️ 자동 데이터 플로우 무시됨 - 서버리스에서는 요청별 처리');
    // setTimeout(() => { this.startDataFlow(subscriberId); }, options.interval);
  }

  /**
   * 📥 데이터 가져오기
   */
  private async fetchData(
    key: string,
    strategy: SubscriptionOptions['cacheStrategy']
  ): Promise<unknown> {
    const config = getCompetitionConfig();

    try {
      // 캐시 제거 - Supabase 직접 조회로 최적화
      const freshData = await this.generateFreshData(key);
      if (freshData) {
        this.metrics.memoryOperations++;
        return freshData;
      }

      return null;
    } catch (error) {
      console.error('데이터 가져오기 실패:', error);
      return null;
    }
  }

  /**
   * 🆕 새로운 데이터 생성
   */
  private async generateFreshData(key: string): Promise<unknown> {
    try {
      if (key.includes('metrics')) {
        // 서버 메트릭 데이터 집계
        // 메모리 기반 Mock 데이터 생성
        const mockServers = [
          {
            id: 'server-1',
            metrics: { cpu: 45, memory: 60, disk: 30, network: 25 },
            status: 'healthy'
          },
          {
            id: 'server-2', 
            metrics: { cpu: 30, memory: 40, disk: 50, network: 35 },
            status: 'healthy'
          }
        ];

        return {
          metrics: {
            serverMetrics: mockServers.map(s => ({
              id: s.id,
              cpu: s.metrics.cpu,
              memory: s.metrics.memory,
              disk: s.metrics.disk,
              status: s.status,
            })),
            summary: 'Available',
            health: 'Healthy',
          },
          timestamp: new Date(),
        };
      } else {
        // 서버 목록 데이터
        return {
          servers: [
            {
              id: 'server-1',
              name: 'Production Server 1',
              status: 'healthy',
              cpu: 45,
              memory: 60,
              disk: 30
            },
            {
              id: 'server-2',
              name: 'Production Server 2', 
              status: 'healthy',
              cpu: 30,
              memory: 40,
              disk: 50
            }
          ],
          clusters: [],
          applications: [],
          summary: { summary: 'Available' },
          timestamp: new Date(),
        };
      }
    } catch (error) {
      console.error('데이터 생성 실패:', error);
      return null;
    }
  }

  /**
   * 💾 캐시 데이터 조회 (제거됨)
   */
  private getCachedData(key: string) {
    return null; // 캐시 제거 - 메모리 최적화
  }

  /**
   * 💾 캐시 데이터 저장 (제거됨)
   */
  private setCachedData(key: string, data: unknown): void {
    // 캐시 제거 - 메모리 최적화
  }

  /**
   * 📊 브로커 메트릭 조회
   */
  getMetrics(): DataBrokerMetrics {
    const cacheStats = { size: 0, hits: 0, misses: 0, hitRate: 0 }; // 캐시 제거
    
    return {
      cacheHitRate: cacheStats.hitRate,
      memoryOperations: this.metrics.memoryOperations,
      activeSubscribers: this.subscribers.size,
      dataFreshness: this.calculateDataFreshness(),
    };
  }

  /**
   * ⏱️ 데이터 신선도 계산
   */
  private calculateDataFreshness(): number {
    const cacheSize = 0; // 캐시 제거
    if (cacheSize === 0) return 0;

    // 평균 데이터 나이 추정 (실제 계산은 캐시 내부 접근 필요)
    return 60; // 1분 추정치
  }

  /**
   * 🛑 시스템 종료
   */
  shutdown(): void {
    this.isActive = false;
    this.subscribers.clear();
    // 캐시 제거됨 - 메모리 최적화
    
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }

    console.log('🏁 통합 데이터 브로커 종료');
  }
}

// 글로벌 인스턴스
export const unifiedDataBroker = new UnifiedDataBroker();