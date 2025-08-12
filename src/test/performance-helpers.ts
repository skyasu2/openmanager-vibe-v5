/**
 * 🚀 테스트 성능 도구 및 헬퍼
 * 
 * Vitest 테스트 성능 최적화를 위한 유틸리티 함수들
 */

import { vi } from 'vitest';

/**
 * 비동기 작업을 위한 성능 최적화 헬퍼
 */
export const performanceHelpers = {
  /**
   * setImmediate를 사용한 빠른 비동기 처리
   * setTimeout(0)보다 빠르게 실행됨
   */
  async fastAsync(): Promise<void> {
    return new Promise(resolve => setImmediate(resolve));
  },

  /**
   * 여러 비동기 작업을 병렬로 처리
   */
  async parallel<T>(promises: Promise<T>[]): Promise<T[]> {
    return Promise.all(promises);
  },

  /**
   * 타임아웃이 있는 Promise 래퍼
   */
  async withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number,
    errorMessage = 'Operation timed out'
  ): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
      ),
    ]);
  },

  /**
   * 재시도 로직이 있는 비동기 작업
   */
  async retry<T>(
    fn: () => Promise<T>,
    retries = 3,
    delay = 100
  ): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      if (retries === 0) {
        throw error;
      }
      await new Promise(resolve => setTimeout(resolve, delay));
      return this.retry(fn, retries - 1, delay * 2);
    }
  },

  /**
   * 메모리 사용량 측정
   */
  measureMemory(): { used: number; total: number; percentage: number } {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      const usage = process.memoryUsage();
      const used = Math.round(usage.heapUsed / 1024 / 1024);
      const total = Math.round(usage.heapTotal / 1024 / 1024);
      const percentage = Math.round((used / total) * 100);
      return { used, total, percentage };
    }
    return { used: 0, total: 0, percentage: 0 };
  },

  /**
   * 테스트 실행 시간 측정
   */
  async measureTime<T>(
    name: string,
    fn: () => Promise<T>
  ): Promise<{ result: T; time: number }> {
    const start = performance.now();
    const result = await fn();
    const time = performance.now() - start;
    console.log(`⏱️ ${name}: ${time.toFixed(2)}ms`);
    return { result, time };
  },

  /**
   * Mock 응답을 위한 빠른 Promise 생성
   */
  createMockPromise<T>(value: T, delayMs = 0): Promise<T> {
    if (delayMs === 0) {
      return Promise.resolve(value);
    }
    return new Promise(resolve => 
      setImmediate(() => resolve(value))
    );
  },

  /**
   * 테스트용 가짜 타이머 설정 (안전한 버전)
   */
  setupSafeTimers() {
    // Fake timers 사용 시 주의사항:
    // 1. async/await와 함께 사용 시 문제 발생 가능
    // 2. 실제 타이머 사용 권장
    console.warn('⚠️ Fake timers는 async 테스트에서 문제를 일으킬 수 있습니다.');
    return {
      advance: (ms: number) => {
        // 실제로는 타이머를 진행시키지 않음
        console.log(`⏳ 시간 진행 시뮬레이션: ${ms}ms`);
      },
      reset: () => {
        console.log('⏳ 타이머 리셋');
      },
    };
  },

  /**
   * 테스트 격리를 위한 환경 정리
   */
  async cleanup(): Promise<void> {
    vi.clearAllMocks();
    vi.clearAllTimers();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    
    // 메모리 정리를 위한 가비지 컬렉션 힌트
    if (global.gc) {
      global.gc();
    }
    
    // 다음 이벤트 루프까지 대기
    await this.fastAsync();
  },

  /**
   * 병렬 테스트 실행을 위한 워커 시뮬레이션
   */
  async runInWorker<T>(fn: () => T): Promise<T> {
    // 실제 워커가 아닌 비동기 실행 시뮬레이션
    await this.fastAsync();
    return fn();
  },

  /**
   * 테스트 데이터 생성 헬퍼
   */
  generateTestData(count: number, template: Record<string, unknown>) {
    return Array.from({ length: count }, (_, i) => ({
      ...template,
      id: `test-${i}`,
      index: i,
    }));
  },

  /**
   * 캐시 워밍업
   */
  async warmupCache(fn: () => Promise<unknown>, iterations = 3): Promise<void> {
    for (let i = 0; i < iterations; i++) {
      await fn();
      await this.fastAsync();
    }
  },

  /**
   * 조건부 대기
   */
  async waitUntil(
    condition: () => boolean,
    maxWaitMs = 5000,
    checkInterval = 100
  ): Promise<void> {
    const startTime = Date.now();
    
    while (!condition()) {
      if (Date.now() - startTime > maxWaitMs) {
        throw new Error(`Condition not met within ${maxWaitMs}ms`);
      }
      await new Promise(resolve => setTimeout(resolve, checkInterval));
    }
  },

  /**
   * 스냅샷 비교를 위한 정규화
   */
  normalizeForSnapshot(obj: unknown): unknown {
    const normalized = JSON.stringify(obj, (key, value) => {
      // 타임스탬프 정규화
      if (typeof value === 'string' && /\d{4}-\d{2}-\d{2}/.test(value)) {
        return '2024-01-01T00:00:00.000Z';
      }
      // 랜덤 ID 정규화
      if (typeof value === 'string' && value.includes('test-')) {
        return 'test-id';
      }
      // 숫자 반올림
      if (typeof value === 'number' && !Number.isInteger(value)) {
        return Math.round(value * 100) / 100;
      }
      return value;
    });
    return JSON.parse(normalized);
  },
};

/**
 * 테스트 성능 벤치마크
 */
export class TestBenchmark {
  private results: Map<string, number[]> = new Map();

  async run(name: string, fn: () => Promise<void>, iterations = 10): Promise<void> {
    const times: number[] = [];
    
    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      await fn();
      const time = performance.now() - start;
      times.push(time);
    }
    
    this.results.set(name, times);
  }

  getStats(name: string) {
    const times = this.results.get(name) || [];
    if (times.length === 0) {
      return null;
    }
    
    const sorted = [...times].sort((a, b) => a - b);
    const avg = times.reduce((sum, time) => sum + time, 0) / times.length;
    const median = sorted[Math.floor(sorted.length / 2)];
    const min = sorted[0];
    const max = sorted[sorted.length - 1];
    const p95 = sorted[Math.floor(sorted.length * 0.95)];
    
    return {
      avg: Math.round(avg * 100) / 100,
      median: Math.round(median * 100) / 100,
      min: Math.round(min * 100) / 100,
      max: Math.round(max * 100) / 100,
      p95: Math.round(p95 * 100) / 100,
      iterations: times.length,
    };
  }

  printReport(): void {
    console.log('\n📊 테스트 성능 벤치마크 결과\n');
    console.log('Name                  | Avg(ms) | Med(ms) | Min(ms) | Max(ms) | P95(ms) | Runs');
    console.log('---------------------|---------|---------|---------|---------|---------|------');
    
    for (const [name, _] of this.results) {
      const stats = this.getStats(name);
      if (stats) {
        console.log(
          `${name.padEnd(20)} | ${stats.avg.toString().padStart(7)} | ` +
          `${stats.median.toString().padStart(7)} | ${stats.min.toString().padStart(7)} | ` +
          `${stats.max.toString().padStart(7)} | ${stats.p95.toString().padStart(7)} | ` +
          `${stats.iterations.toString().padStart(5)}`
        );
      }
    }
    console.log('');
  }
}

/**
 * 메모리 리크 감지기
 */
export class MemoryLeakDetector {
  private snapshots: Array<{ name: string; memory: number; timestamp: number }> = [];

  takeSnapshot(name: string): void {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      const memory = process.memoryUsage().heapUsed;
      this.snapshots.push({
        name,
        memory,
        timestamp: Date.now(),
      });
    }
  }

  analyze(threshold = 10): { leaks: string[]; safe: string[] } {
    const grouped = new Map<string, number[]>();
    
    for (const snapshot of this.snapshots) {
      if (!grouped.has(snapshot.name)) {
        grouped.set(snapshot.name, []);
      }
      grouped.get(snapshot.name).push(snapshot.memory);
    }
    
    const leaks: string[] = [];
    const safe: string[] = [];
    
    for (const [name, memories] of grouped) {
      if (memories.length >= 2) {
        const growth = memories[memories.length - 1] - memories[0];
        const growthMB = growth / 1024 / 1024;
        
        if (growthMB > threshold) {
          leaks.push(`${name}: +${growthMB.toFixed(2)}MB`);
        } else {
          safe.push(name);
        }
      }
    }
    
    return { leaks, safe };
  }

  reset(): void {
    this.snapshots = [];
  }
}

// Export convenience functions
export const fastAsync = performanceHelpers.fastAsync.bind(performanceHelpers);
export const measureTime = performanceHelpers.measureTime.bind(performanceHelpers);
export const cleanup = performanceHelpers.cleanup.bind(performanceHelpers);
export const waitUntil = performanceHelpers.waitUntil.bind(performanceHelpers);