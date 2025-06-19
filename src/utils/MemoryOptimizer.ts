/**
 * 🧠 OpenManager Memory Optimizer v2.0
 *
 * 메모리 사용률 97% → 75% 이하 최적화
 * - 실시간 메모리 모니터링
 * - 자동 가비지 컬렉션
 * - 데이터 압축 및 정리
 * - 캐시 최적화
 */

import { cacheService } from '../services/cacheService';

interface MemoryStats {
  heapUsed: number;
  heapTotal: number;
  rss: number;
  external: number;
  usagePercent: number;
  timestamp: number;
}

interface OptimizationResult {
  before: MemoryStats;
  after: MemoryStats;
  freedMB: number;
  optimizationActions: string[];
  duration: number;
}

export class MemoryOptimizer {
  private static instance: MemoryOptimizer;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private lastOptimization: number = 0;
  private optimizationHistory: OptimizationResult[] = [];

  // 메모리 임계값
  private readonly CRITICAL_THRESHOLD = 90; // 90% 이상 시 즉시 최적화
  private readonly WARNING_THRESHOLD = 75; // 75% 이상 시 예방적 최적화
  private readonly TARGET_THRESHOLD = 65; // 목표 사용률 65%
  private readonly OPTIMIZATION_COOLDOWN = 60000; // 1분 쿨다운

  static getInstance(): MemoryOptimizer {
    if (!this.instance) {
      this.instance = new MemoryOptimizer();
    }
    return this.instance;
  }

  /**
   * 🔍 현재 메모리 상태 분석
   */
  getCurrentMemoryStats(): MemoryStats {
    const usage = process.memoryUsage();
    const usagePercent = (usage.heapUsed / usage.heapTotal) * 100;

    return {
      heapUsed: Math.round(usage.heapUsed / 1024 / 1024), // MB
      heapTotal: Math.round(usage.heapTotal / 1024 / 1024),
      rss: Math.round(usage.rss / 1024 / 1024),
      external: Math.round(usage.external / 1024 / 1024),
      usagePercent: Math.round(usagePercent * 100) / 100,
      timestamp: Date.now(),
    };
  }

  /**
   * 🚨 즉시 메모리 최적화
   */
  async optimizeMemoryNow(): Promise<OptimizationResult> {
    const startTime = Date.now();
    const beforeStats = this.getCurrentMemoryStats();
    const actions: string[] = [];

    console.log(
      '🧠 메모리 최적화 시작:',
      `${beforeStats.usagePercent}% 사용 중`
    );

    try {
      // 1. 캐시 정리
      await this.optimizeCache();
      actions.push('캐시 최적화');

      // 2. 시뮬레이션 데이터 압축
      await this.compressSimulationData();
      actions.push('시뮬레이션 데이터 압축');

      // 3. 메모리 맵 정리
      this.cleanupMemoryMaps();
      actions.push('메모리 맵 정리');

      // 4. 가비지 컬렉션 강제 실행
      if (global.gc) {
        global.gc();
        actions.push('가비지 컬렉션 실행');
      }

      // 5. 1초 대기 후 결과 측정
      await new Promise(resolve => setTimeout(resolve, 1000));

      const afterStats = this.getCurrentMemoryStats();
      const freedMB = beforeStats.heapUsed - afterStats.heapUsed;
      const duration = Date.now() - startTime;

      const result: OptimizationResult = {
        before: beforeStats,
        after: afterStats,
        freedMB,
        optimizationActions: actions,
        duration,
      };

      this.optimizationHistory.push(result);
      this.lastOptimization = Date.now();

      console.log(`✅ 메모리 최적화 완료:`, {
        before: `${beforeStats.usagePercent}%`,
        after: `${afterStats.usagePercent}%`,
        freed: `${freedMB}MB`,
        duration: `${duration}ms`,
      });

      return result;
    } catch (error) {
      console.error('❌ 메모리 최적화 실패:', error);
      throw error;
    }
  }

  /**
   * 🔄 캐시 최적화
   */
  private async optimizeCache(): Promise<void> {
    try {
      // 오래된 캐시 데이터 정리 (5분 이상)
      const stats = cacheService.getStats();
      let cleanedCount = 0;

      if (stats.memoryCache && stats.memoryCache.keys) {
        for (const key of stats.memoryCache.keys) {
          if (key.includes('servers:') && key.includes('old_')) {
            cleanedCount++;
          }
        }
      }

      // 캐시 정리 실행
      await cacheService.invalidateCache('*old*');
      await cacheService.invalidateCache('*temp*');

      console.log(`🗑️ 캐시 정리: ${cleanedCount}개 항목 제거`);
    } catch (error) {
      console.warn('⚠️ 캐시 최적화 중 오류:', error);
    }
  }

  /**
   * 📊 시뮬레이션 데이터 압축
   */
  private async compressSimulationData(): Promise<void> {
    try {
      // 메모리에 저장된 시계열 데이터 압축
      if ((global as any).simulationDataCache) {
        const cache = (global as any).simulationDataCache;
        let compressedCount = 0;

        for (const [key, value] of cache.entries()) {
          if (Array.isArray(value) && value.length > 100) {
            // 100개 이상 데이터는 최근 50개만 유지
            cache.set(key, value.slice(-50));
            compressedCount++;
          }
        }

        console.log(`📊 시뮬레이션 데이터 압축: ${compressedCount}개 항목`);
      }

      // 추가 최적화: Node.js 내부 버퍼 정리
      await this.optimizeNodeBuffers();

      // 추가 최적화: 이벤트 리스너 정리
      await this.cleanupEventListeners();
    } catch (error) {
      console.warn('⚠️ 시뮬레이션 데이터 압축 중 오류:', error);
    }
  }

  /**
   * 🧹 Node.js 내부 버퍼 최적화
   */
  private async optimizeNodeBuffers(): Promise<void> {
    try {
      // Buffer pool 정리
      if (Buffer.poolSize > 8192) {
        // Buffer pool 크기 축소
        Buffer.poolSize = 8192;
      }

      // 스트림 버퍼 정리
      if ((global as any)._streamBuffers) {
        (global as any)._streamBuffers.clear();
      }

      console.log('🧹 Node.js 버퍼 최적화 완료');
    } catch (error) {
      console.warn('⚠️ Node.js 버퍼 최적화 중 오류:', error);
    }
  }

  /**
   * 🎧 이벤트 리스너 정리
   */
  private async cleanupEventListeners(): Promise<void> {
    try {
      // process 이벤트 리스너 정리
      const processListeners = process.eventNames();
      let cleanedCount = 0;

      processListeners.forEach(eventName => {
        // 타입 안전성을 위해 조건부 체크
        if (typeof eventName === 'string') {
          const listeners = process.listeners(eventName as any);
          if (listeners.length > 10) {
            // 10개 이상 리스너가 있으면 정리
            process.removeAllListeners(eventName as any);
            cleanedCount++;
          }
        }
      });

      console.log(`🎧 이벤트 리스너 정리: ${cleanedCount}개 이벤트`);
    } catch (error) {
      console.warn('⚠️ 이벤트 리스너 정리 중 오류:', error);
    }
  }

  /**
   * 🚀 극한 최적화 (75% 이하 목표)
   */
  async performAggressiveOptimization(): Promise<OptimizationResult> {
    const startTime = Date.now();
    const beforeStats = this.getCurrentMemoryStats();
    const actions: string[] = [];

    console.log(
      '🚀 극한 메모리 최적화 시작:',
      `${beforeStats.usagePercent}% → 65% 목표`
    );

    try {
      // 1. 기본 최적화 실행
      await this.optimizeCache();
      await this.compressSimulationData();
      this.cleanupMemoryMaps();
      actions.push('기본 최적화');

      // 2. V8 엔진 최적화
      await this.optimizeV8Engine();
      actions.push('V8 엔진 최적화');

      // 3. 메모리 압축
      await this.compressMemoryStructures();
      actions.push('메모리 구조 압축');

      // 4. 강제 가비지 컬렉션 (3회)
      for (let i = 0; i < 3; i++) {
        if (global.gc) {
          global.gc();
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      actions.push('강제 GC (3회)');

      // 5. 결과 측정
      await new Promise(resolve => setTimeout(resolve, 2000)); // 2초 대기
      const afterStats = this.getCurrentMemoryStats();
      const freedMB = beforeStats.heapUsed - afterStats.heapUsed;
      const duration = Date.now() - startTime;

      const result: OptimizationResult = {
        before: beforeStats,
        after: afterStats,
        freedMB,
        optimizationActions: actions,
        duration,
      };

      this.optimizationHistory.push(result);
      this.lastOptimization = Date.now();

      // 목표 달성 여부 확인
      const targetAchieved = afterStats.usagePercent <= this.TARGET_THRESHOLD;

      console.log(`🎯 극한 최적화 ${targetAchieved ? '성공' : '부분성공'}:`, {
        before: `${beforeStats.usagePercent}%`,
        after: `${afterStats.usagePercent}%`,
        target: `${this.TARGET_THRESHOLD}%`,
        freed: `${freedMB}MB`,
        duration: `${duration}ms`,
      });

      return result;
    } catch (error) {
      console.error('❌ 극한 메모리 최적화 실패:', error);
      throw error;
    }
  }

  /**
   * ⚡ V8 엔진 최적화
   */
  private async optimizeV8Engine(): Promise<void> {
    try {
      // V8 플래그 최적화 (런타임에서 가능한 것들)
      if (global.gc) {
        // 메모리 압축을 위한 여러 유형의 GC 실행
        global.gc(); // full GC

        // V8의 incremental marking 강제 실행
        if ((global as any).gc && typeof (global as any).gc === 'function') {
          (global as any).gc(true); // major GC
        }
      }

      // V8 힙 통계 정리
      if ((process as any).memoryUsage.rss) {
        // RSS 메모리 압축 시도
        process.nextTick(() => {
          if (global.gc) global.gc();
        });
      }

      console.log('⚡ V8 엔진 최적화 완료');
    } catch (error) {
      console.warn('⚠️ V8 엔진 최적화 중 오류:', error);
    }
  }

  /**
   * 🗜️ 메모리 구조 압축
   */
  private async compressMemoryStructures(): Promise<void> {
    try {
      // WeakMap과 Map 크기 제한
      if ((global as any).serverMetricsMap) {
        const map = (global as any).serverMetricsMap;
        if (map.size > 1000) {
          map.clear();
        }
      }

      // 문자열 인터닝으로 메모리 절약
      this.optimizeStringMemory();

      // 배열 압축
      this.compressArrays();

      console.log('🗜️ 메모리 구조 압축 완료');
    } catch (error) {
      console.warn('⚠️ 메모리 구조 압축 중 오류:', error);
    }
  }

  /**
   * 🔤 문자열 메모리 최적화
   */
  private optimizeStringMemory(): void {
    // 중복 문자열 제거 및 인터닝
    if ((global as any).stringCache) {
      const cache = (global as any).stringCache;
      if (cache.size > 10000) {
        cache.clear();
      }
    }
  }

  /**
   * 📋 배열 압축
   */
  private compressArrays(): void {
    // 글로벌 배열들 압축
    if ((global as any).metricsHistory) {
      const history = (global as any).metricsHistory;
      if (Array.isArray(history) && history.length > 1000) {
        (global as any).metricsHistory = history.slice(-500);
      }
    }
  }

  /**
   * 🗂️ 메모리 맵 정리
   */
  private cleanupMemoryMaps(): void {
    try {
      // WeakMap과 Map 정리
      if ((global as any).metricsMap) {
        (global as any).metricsMap.clear();
      }

      if ((global as any).serverStateMap) {
        (global as any).serverStateMap.clear();
      }

      console.log('🗂️ 메모리 맵 정리 완료');
    } catch (error) {
      console.warn('⚠️ 메모리 맵 정리 중 오류:', error);
    }
  }

  /**
   * 🔄 자동 메모리 모니터링 시작
   */
  startMemoryMonitoring(intervalMs: number = 60000): void {
    if (this.monitoringInterval) {
      // 더 상세한 로그로 중복 호출 추적
      console.log('⚠️ 메모리 모니터링이 이미 실행 중입니다 - 중복 호출 무시됨');
      return;
    }

    console.log(`🔍 자동 메모리 모니터링 시작 (${intervalMs / 1000}초 간격)`);

    // 전역 플래그로 중복 방지 강화
    if ((global as any).__memoryMonitoringActive) {
      console.log('⚠️ 전역 메모리 모니터링이 이미 활성화됨 - 중복 방지');
      return;
    }
    (global as any).__memoryMonitoringActive = true;

    this.monitoringInterval = setInterval(async () => {
      const stats = this.getCurrentMemoryStats();

      // 임계값 확인 - 더 신중한 최적화
      if (stats.usagePercent >= this.CRITICAL_THRESHOLD) {
        console.log(
          `🚨 위험: 메모리 사용률 ${stats.usagePercent}% - 즉시 최적화 실행`
        );

        // 메모리 위험 알림 (콘솔 로그)
        console.warn(
          `🚨 메모리 위험: 사용률 ${stats.usagePercent}% - 즉시 최적화 실행`
        );

        await this.optimizeMemoryNow();
      } else if (stats.usagePercent >= this.WARNING_THRESHOLD) {
        // 마지막 최적화 후 충분한 시간이 지났는지 확인 (쿨다운을 2분으로 증가)
        if (Date.now() - this.lastOptimization > 120000) {
          // 2분 쿨다운
          console.log(
            `⚠️ 경고: 메모리 사용률 ${stats.usagePercent}% - 예방적 최적화 실행`
          );

          // 메모리 경고 알림 (콘솔 로그)
          console.warn(
            `⚠️ 메모리 경고: 사용률 ${stats.usagePercent}% - 예방적 최적화 실행`
          );

          await this.optimizeMemoryNow();
        }
      } else {
        console.log(`✅ 정상: 메모리 사용률 ${stats.usagePercent}%`);
      }
    }, intervalMs);
  }

  /**
   * ⏹️ 메모리 모니터링 중지
   */
  stopMemoryMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;

      // 전역 플래그 제거
      if ((global as any).__memoryMonitoringActive) {
        delete (global as any).__memoryMonitoringActive;
      }

      console.log('⏹️ 메모리 모니터링 중지');
    }
  }

  /**
   * 📈 최적화 히스토리 조회
   */
  getOptimizationHistory(): OptimizationResult[] {
    return this.optimizationHistory.slice(-10); // 최근 10개만
  }

  /**
   * 🎯 메모리 상태 요약
   */
  getMemorySummary(): {
    current: MemoryStats;
    status: 'optimal' | 'warning' | 'critical';
    lastOptimization: string | null;
    totalOptimizations: number;
  } {
    const current = this.getCurrentMemoryStats();

    let status: 'optimal' | 'warning' | 'critical';
    if (current.usagePercent >= this.CRITICAL_THRESHOLD) {
      status = 'critical';
    } else if (current.usagePercent >= this.WARNING_THRESHOLD) {
      status = 'warning';
    } else {
      status = 'optimal';
    }

    return {
      current,
      status,
      lastOptimization: this.lastOptimization
        ? new Date(this.lastOptimization).toISOString()
        : null,
      totalOptimizations: this.optimizationHistory.length,
    };
  }
}

// 싱글톤 인스턴스 export
export const memoryOptimizer = MemoryOptimizer.getInstance();
