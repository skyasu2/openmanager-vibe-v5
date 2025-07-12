import { GCPRealDataService } from '@/services/gcp/GCPRealDataService';
/**
 * 🟢 TDD Green - 백그라운드 서버 데이터 스케줄러
 *
 * @description
 * 테스트를 통과하는 최소한의 기능을 구현합니다.
 * 데이터 생성과 수집 주기를 분리하여 성능을 최적화합니다.
 *
 * @features
 * - 싱글톤 패턴
 * - 백그라운드 스케줄링
 * - Redis/메모리 기반 캐싱
 * - 변경사항 추적 (Delta Updates)
 */

import { calculateOptimalUpdateInterval } from '@/config/serverConfig';
import { getRedisClient } from '@/lib/redis';
// RealServerDataGenerator import 제거 - GCPRealDataService로 대체됨

interface StoredServerData {
  servers: any[];
  summary: any;
  timestamp: string;
  version: number;
  changes: {
    added: string[];
    updated: string[];
    removed: string[];
  };
}

interface PerformanceMetrics {
  memoryUsage: {
    used: number;
    total: number;
    percentage: number;
  };
  cacheStats: {
    hits: number;
    misses: number;
    hitRate: number;
  };
  timing: {
    lastGeneration: number;
    averageGeneration: number;
    totalGenerations: number;
  };
}

export class ServerDataScheduler {
  private static instance: ServerDataScheduler;
  private generator: RealServerDataGeneratorType;
  private isRunning_ = false;
  private intervalId: NodeJS.Timeout | null = null;
  private lastVersion = 0;
  private lastData: StoredServerData | null = null;
  private memoryCache = new Map<string, any>();

  // 🎯 최적화 설정
  private readonly GENERATION_INTERVAL: number;
  private readonly REDIS_EXPIRY = 300; // 5분
  private readonly MAX_STORAGE_SIZE = 1000;

  // 성능 메트릭
  private performanceStats = {
    cacheHits: 0,
    cacheMisses: 0,
    generationTimes: [] as number[],
    totalGenerations: 0,
  };

  private constructor() {
    this.generator = GCPRealDataService.getInstance();
    this.GENERATION_INTERVAL = calculateOptimalUpdateInterval();
    this.initializeGenerator();
  }

  /**
   * 🏗️ 싱글톤 인스턴스 반환
   */
  public static getInstance(): ServerDataScheduler {
    if (!ServerDataScheduler.instance) {
      ServerDataScheduler.instance = new ServerDataScheduler();
    }
    return ServerDataScheduler.instance;
  }

  /**
   * 🚀 제너레이터 초기화
   */
  private async initializeGenerator(): Promise<void> {
    try {
      await this.generator.initialize();
      console.log('🚀 ServerDataScheduler: 제너레이터 초기화 완료');
    } catch (error) {
      console.error('❌ ServerDataScheduler: 제너레이터 초기화 실패:', error);
    }
  }

  /**
   * 🚀 스케줄러 시작
   */
  public async start(): Promise<void> {
    // 🚨 응급 조치: 환경변수로 서버 데이터 스케줄러 비활성화
    if (process.env.SERVER_DATA_SCHEDULER_DISABLED === 'true') {
      console.log('🚨 서버 데이터 스케줄러 비활성화됨 (환경변수)');
      return;
    }

    // 🚨 중지 상태 감지 추가
    if (
      typeof global !== 'undefined' &&
      (global as any).IDLE_STATE_SCHEDULERS_DISABLED
    ) {
      console.log('😴 중지 상태에서 서버 데이터 스케줄러 비활성화됨');
      return;
    }

    // 🚨 응급 모드 확인
    if (process.env.EMERGENCY_MODE_ACTIVE === 'true') {
      console.log('🚨 응급 모드에서 서버 데이터 스케줄러 비활성화됨');
      return;
    }

    if (this.isRunning_) {
      console.log('⚠️ 스케줄러가 이미 실행 중입니다.');
      return;
    }

    this.isRunning_ = true;
    console.log('🚀 백그라운드 서버 데이터 스케줄러 시작');

    // 즉시 첫 데이터 생성
    await this.generateAndStore();

    // 🚨 최적화된 간격 적용
    const optimizedInterval = this.getOptimizedInterval();
    console.log(`⏰ 최적화된 간격: ${optimizedInterval / 1000}초`);

    // 정기 업데이트 시작
    this.intervalId = setInterval(async () => {
      try {
        // 🚨 실행 전 상태 재확인
        if (this.shouldSkipExecution()) {
          console.log('⏭️ 중지 상태 감지 - 스케줄러 실행 건너뜀');
          return;
        }

        await this.generateAndStore();
      } catch (error) {
        console.error('❌ 백그라운드 데이터 생성 오류:', error);
      }
    }, optimizedInterval);

    console.log(`📅 스케줄러 활성화: ${optimizedInterval / 1000}초 간격`);
  }

  // 🚨 최적화된 간격 계산
  private getOptimizedInterval(): number {
    // 응급 모드에서는 매우 긴 간격 사용
    if (process.env.EMERGENCY_MODE_ACTIVE === 'true') {
      return 30 * 60 * 1000; // 30분
    }

    // 중지 상태에서는 긴 간격 사용
    if (
      typeof global !== 'undefined' &&
      (global as any).OPTIMIZED_POLLING_INTERVAL
    ) {
      return Math.max(
        (global as any).OPTIMIZED_POLLING_INTERVAL,
        5 * 60 * 1000
      ); // 최소 5분
    }

    // 환경변수에서 설정된 간격 사용
    if (process.env.SYSTEM_POLLING_INTERVAL) {
      return parseInt(process.env.SYSTEM_POLLING_INTERVAL, 10);
    }

    // 기본 간격 (현재보다 증가)
    return Math.max(this.GENERATION_INTERVAL, 2 * 60 * 1000); // 최소 2분
  }

  // 🚨 실행 건너뛰기 조건 확인
  private shouldSkipExecution(): boolean {
    // 환경변수 재확인
    if (process.env.SERVER_DATA_SCHEDULER_DISABLED === 'true') {
      return true;
    }

    // 중지 상태 확인
    if (
      typeof global !== 'undefined' &&
      (global as any).IDLE_STATE_SCHEDULERS_DISABLED
    ) {
      return true;
    }

    // 응급 모드 확인
    if (process.env.EMERGENCY_MODE_ACTIVE === 'true') {
      return true;
    }

    return false;
  }

  /**
   * 🛑 스케줄러 중지
   */
  public stop(): void {
    if (!this.isRunning_) {
      return;
    }

    this.isRunning_ = false;

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    console.log('🛑 백그라운드 서버 데이터 스케줄러 중지');
  }

  /**
   * 🔄 실행 상태 확인
   */
  public isRunning(): boolean {
    return this.isRunning_;
  }

  /**
   * 📊 데이터 생성 및 저장
   */
  public async generateAndStore(): Promise<void> {
    const startTime = Date.now();

    try {
      // 데이터 생성 (getDashboardSummary 사용)
      const dashboardData = this.generator.getRealServerMetrics().then(r => ({ summary: 'Available' }));

      // 새 데이터 구조 생성
      const newData = {
        servers: Array.isArray(dashboardData)
          ? dashboardData
          : (dashboardData as any)?.servers?.data ||
            (dashboardData as any)?.data ||
            [],
        summary:
          (dashboardData as any)?.summary ||
          (dashboardData as any)?.servers ||
          {},
        timestamp: new Date().toISOString(),
      };

      // 버전 증가
      this.lastVersion += 1;

      // 변경사항 계산
      const changes = this.calculateChanges(newData);

      // 저장할 데이터 구성
      const storedData: StoredServerData = {
        servers: newData.servers || [],
        summary: newData.summary || {},
        timestamp: new Date().toISOString(),
        version: this.lastVersion,
        changes,
      };

      // 메모리 캐시에 저장
      this.memoryCache.set('stored_data', storedData);
      this.memoryCache.set('changes', changes);

      // Redis에도 저장 시도 (optional)
      try {
        const redis = await getRedisClient();
        if (redis) {
          await redis.set(
            'server_data_scheduler:stored_data',
            JSON.stringify(storedData),
            { ex: this.REDIS_EXPIRY }
          );
        }
      } catch (redisError) {
        console.warn('⚠️ Redis 저장 실패, 메모리 캐시만 사용:', redisError);
      }

      this.lastData = storedData;

      // 성능 메트릭 업데이트
      const duration = Date.now() - startTime;
      this.performanceStats.generationTimes.push(duration);
      this.performanceStats.totalGenerations += 1;

      // 최근 10개 기록만 유지
      if (this.performanceStats.generationTimes.length > 10) {
        this.performanceStats.generationTimes.shift();
      }

      console.log(`📊 데이터 생성 완료: v${this.lastVersion} (${duration}ms)`);
    } catch (error) {
      console.error('❌ 데이터 생성 및 저장 실패:', error);
      throw error;
    }
  }

  /**
   * 📄 저장된 데이터 조회
   */
  public async getStoredData(): Promise<StoredServerData | null> {
    // 메모리 캐시 먼저 확인
    const cachedData = this.memoryCache.get('stored_data');
    if (cachedData) {
      this.performanceStats.cacheHits += 1;
      return cachedData;
    }

    // Redis에서 조회 시도
    try {
      const redis = await getRedisClient();
      if (redis) {
        const redisData = await redis.get('server_data_scheduler:stored_data');
        if (redisData) {
          const parsedData = JSON.parse(redisData as string);
          this.memoryCache.set('stored_data', parsedData); // 캐시 업데이트
          this.performanceStats.cacheHits += 1;
          return parsedData;
        }
      }
    } catch (error) {
      console.warn('⚠️ Redis 조회 실패:', error);
    }

    this.performanceStats.cacheMisses += 1;
    return this.lastData;
  }

  /**
   * 🔄 변경사항 조회
   */
  public async getChanges(): Promise<{
    added: string[];
    updated: string[];
    removed: string[];
  } | null> {
    const cachedChanges = this.memoryCache.get('changes');
    return cachedChanges || { added: [], updated: [], removed: [] };
  }

  /**
   * 📊 스케줄러 상태 조회
   */
  public getStatus() {
    return {
      isRunning: this.isRunning_,
      interval: this.GENERATION_INTERVAL,
      lastVersion: this.lastVersion,
      lastUpdate: this.lastData?.timestamp,
      optimization: {
        separatedGeneration: true,
        deltaUpdates: true,
        functionDurationOptimized: true,
        storageBackends: ['Memory', 'Redis'],
      },
    };
  }

  /**
   * 📊 성능 메트릭 조회
   */
  public getPerformanceMetrics(): PerformanceMetrics {
    const totalHits =
      this.performanceStats.cacheHits + this.performanceStats.cacheMisses;
    const hitRate =
      totalHits > 0 ? this.performanceStats.cacheHits / totalHits : 0;

    const avgGeneration =
      this.performanceStats.generationTimes.length > 0
        ? this.performanceStats.generationTimes.reduce((a, b) => a + b, 0) /
          this.performanceStats.generationTimes.length
        : 0;

    // 메모리 사용량 계산 (근사치)
    const memUsed = process.memoryUsage();

    return {
      memoryUsage: {
        used: memUsed.heapUsed,
        total: memUsed.heapTotal,
        percentage: (memUsed.heapUsed / memUsed.heapTotal) * 100,
      },
      cacheStats: {
        hits: this.performanceStats.cacheHits,
        misses: this.performanceStats.cacheMisses,
        hitRate: hitRate * 100,
      },
      timing: {
        lastGeneration:
          this.performanceStats.generationTimes[
            this.performanceStats.generationTimes.length - 1
          ] || 0,
        averageGeneration: avgGeneration,
        totalGenerations: this.performanceStats.totalGenerations,
      },
    };
  }

  /**
   * 🧹 캐시 클리어
   */
  public async clearCache(): Promise<void> {
    this.memoryCache.clear();
    this.lastData = null;

    try {
      const redis = await getRedisClient();
      if (redis) {
        await redis.del('server_data_scheduler:stored_data');
      }
    } catch (error) {
      console.warn('⚠️ Redis 캐시 클리어 실패:', error);
    }

    console.log('🧹 캐시 클리어 완료');
  }

  /**
   * 🔍 변경사항 계산 (Delta Updates)
   */
  private calculateChanges(newData: any): {
    added: string[];
    updated: string[];
    removed: string[];
  } {
    const changes = {
      added: [] as string[],
      updated: [] as string[],
      removed: [] as string[],
    };

    if (!this.lastData) {
      // 첫 데이터인 경우 모든 서버가 추가됨
      changes.added = (newData.servers || []).map((server: any) => server.id);
      return changes;
    }

    const oldServers = new Map(
      this.lastData.servers.map((s: any) => [s.id, s])
    );
    const newServers = new Map(
      (newData.servers || []).map((s: any) => [s.id, s])
    );

    // 추가된 서버 찾기
    for (const [id] of newServers) {
      if (!oldServers.has(id)) {
        changes.added.push(String(id));
      }
    }

    // 제거된 서버 찾기
    for (const [id] of oldServers) {
      if (!newServers.has(id)) {
        changes.removed.push(id);
      }
    }

    // 업데이트된 서버 찾기 (간단한 비교)
    for (const [id, newServer] of newServers) {
      const oldServer = oldServers.get(id);
      if (
        oldServer &&
        JSON.stringify(oldServer) !== JSON.stringify(newServer)
      ) {
        changes.updated.push(String(id));
      }
    }

    return changes;
  }
}

// 싱글톤 인스턴스 export
export const serverDataScheduler = ServerDataScheduler.getInstance();
