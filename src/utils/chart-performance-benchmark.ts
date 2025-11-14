/**
 * 📊 차트 라이브러리 성능 벤치마크 유틸리티
 * 
 * 실시간 차트 성능 측정 및 분석 도구
 * - 렌더링 성능 측정
 * - 메모리 사용량 추적
 * - FPS 계산
 * - 데이터 처리 성능 분석
 */

// Chrome 전용 Performance API 확장
interface PerformanceMemory {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

interface ExtendedPerformance extends Performance {
  memory?: PerformanceMemory;
}

export interface PerformanceMetrics {
  renderTime: number;
  memoryUsage: number;
  fps: number;
  dataPoints: number;
  domNodes?: number;
  updateCount: number;
}

export interface BenchmarkResult {
  library: string;
  metrics: PerformanceMetrics;
  timestamp: number;
  testDuration: number;
}

export class ChartPerformanceBenchmark {
  private startTime: number = 0;
  private frameCount: number = 0;
  private lastFPSUpdate: number = 0;
  private renderTimes: number[] = [];
  private memoryUsages: number[] = [];
  
  constructor(private library: string) {
    this.startTime = performance.now();
    this.lastFPSUpdate = Date.now();
  }

  /**
   * 렌더링 시작 시점 기록
   */
  startRender(): number {
    return performance.now();
  }

  /**
   * 렌더링 완료 시점 기록 및 성능 메트릭 계산
   */
  endRender(startTime: number): number {
    const renderTime = performance.now() - startTime;
    this.renderTimes.push(renderTime);
    
    // 최근 10개 렌더링 시간만 유지 (메모리 절약)
    if (this.renderTimes.length > 10) {
      this.renderTimes.shift();
    }
    
    return renderTime;
  }

  /**
   * FPS 계산
   */
  updateFPS(): number {
    this.frameCount++;
    const now = Date.now();
    const elapsed = now - this.lastFPSUpdate;
    
    if (elapsed >= 1000) {
      const fps = (this.frameCount * 1000) / elapsed;
      this.frameCount = 0;
      this.lastFPSUpdate = now;
      return fps;
    }
    
    return 0;
  }

  /**
   * 메모리 사용량 측정
   */
  measureMemoryUsage(): number {
    if ('memory' in performance) {
      const memory = (performance as ExtendedPerformance).memory;
      const memoryUsage = memory ? memory.usedJSHeapSize / 1024 / 1024 : 0; // MB
      this.memoryUsages.push(memoryUsage);
      
      // 최근 10개 메모리 사용량만 유지
      if (this.memoryUsages.length > 10) {
        this.memoryUsages.shift();
      }
      
      return memoryUsage;
    }
    return 0;
  }

  /**
   * DOM 노드 수 계산
   */
  countDOMNodes(container?: HTMLElement): number {
    const target = container || document;
    return target.querySelectorAll('*').length;
  }

  /**
   * 평균 렌더링 시간 계산
   */
  getAverageRenderTime(): number {
    if (this.renderTimes.length === 0) return 0;
    return this.renderTimes.reduce((sum, time) => sum + time, 0) / this.renderTimes.length;
  }

  /**
   * 평균 메모리 사용량 계산
   */
  getAverageMemoryUsage(): number {
    if (this.memoryUsages.length === 0) return 0;
    return this.memoryUsages.reduce((sum, usage) => sum + usage, 0) / this.memoryUsages.length;
  }

  /**
   * 현재 성능 메트릭 반환
   */
  getCurrentMetrics(dataPoints: number, updateCount: number, domNodes?: number): PerformanceMetrics {
    return {
      renderTime: this.getAverageRenderTime(),
      memoryUsage: this.getAverageMemoryUsage(),
      fps: this.updateFPS(),
      dataPoints,
      domNodes,
      updateCount,
    };
  }

  /**
   * 벤치마크 결과 생성
   */
  generateBenchmarkResult(dataPoints: number, updateCount: number, domNodes?: number): BenchmarkResult {
    const testDuration = performance.now() - this.startTime;
    
    return {
      library: this.library,
      metrics: this.getCurrentMetrics(dataPoints, updateCount, domNodes),
      timestamp: Date.now(),
      testDuration,
    };
  }

  /**
   * 성능 점수 계산 (0-100)
   */
  calculatePerformanceScore(metrics: PerformanceMetrics): number {
    const weights = {
      renderTime: 0.3,
      memoryEfficiency: 0.25,
      fps: 0.25,
      responsiveness: 0.2,
    };

    // 각 메트릭을 0-100 점수로 정규화
    const renderScore = Math.max(0, 100 - (metrics.renderTime * 2)); // 50ms = 0점
    const memoryScore = Math.max(0, 100 - (metrics.memoryUsage)); // 100MB = 0점
    const fpsScore = Math.min(100, metrics.fps * 1.67); // 60fps = 100점
    const responsivenessScore = Math.min(100, (1000 / metrics.renderTime) * 10); // 응답성

    return (
      renderScore * weights.renderTime +
      memoryScore * weights.memoryEfficiency +
      fpsScore * weights.fps +
      responsivenessScore * weights.responsiveness
    );
  }

  /**
   * 리셋
   */
  reset(): void {
    this.startTime = performance.now();
    this.frameCount = 0;
    this.lastFPSUpdate = Date.now();
    this.renderTimes = [];
    this.memoryUsages = [];
  }
}

/**
 * 여러 차트 라이브러리 성능 비교
 */
export class ChartLibraryComparator {
  private benchmarks: Map<string, ChartPerformanceBenchmark> = new Map();
  private results: BenchmarkResult[] = [];

  /**
   * 새로운 라이브러리 벤치마크 추가
   */
  addLibrary(library: string): ChartPerformanceBenchmark {
    const benchmark = new ChartPerformanceBenchmark(library);
    this.benchmarks.set(library, benchmark);
    return benchmark;
  }

  /**
   * 특정 라이브러리 벤치마크 가져오기
   */
  getBenchmark(library: string): ChartPerformanceBenchmark | undefined {
    return this.benchmarks.get(library);
  }

  /**
   * 모든 라이브러리 성능 비교 결과 생성
   */
  generateComparisonReport(): {
    results: BenchmarkResult[];
    winner: string;
    summary: Record<string, unknown>;
  } {
    const results: BenchmarkResult[] = [];
    
    this.benchmarks.forEach((benchmark, library) => {
      const result = benchmark.generateBenchmarkResult(0, 0);
      results.push(result);
    });

    // 성능 점수 기준으로 우승자 결정
    const scores = results.map(result => ({
      library: result.library,
      score: new ChartPerformanceBenchmark(result.library).calculatePerformanceScore(result.metrics),
    }));

    const winner = scores.reduce((prev, current) => 
      prev.score > current.score ? prev : current
    ).library;

    const summary = {
      totalLibraries: results.length,
      bestPerformance: winner,
      averageRenderTime: results.reduce((sum, r) => sum + r.metrics.renderTime, 0) / results.length,
      averageMemoryUsage: results.reduce((sum, r) => sum + r.metrics.memoryUsage, 0) / results.length,
      averageFPS: results.reduce((sum, r) => sum + r.metrics.fps, 0) / results.length,
    };

    return { results, winner, summary };
  }

  /**
   * 실시간 성능 모니터링 시작
   */
  startMonitoring(interval: number = 1000): () => void {
    const intervalId = setInterval(() => {
      this.benchmarks.forEach((benchmark, library) => {
        const metrics = benchmark.getCurrentMetrics(0, 0);
        console.log(`[${library}] Render: ${metrics.renderTime.toFixed(2)}ms, Memory: ${metrics.memoryUsage.toFixed(1)}MB, FPS: ${metrics.fps.toFixed(1)}`);
      });
    }, interval);

    return () => clearInterval(intervalId);
  }

  /**
   * 벤치마크 리셋
   */
  resetAll(): void {
    this.benchmarks.forEach(benchmark => benchmark.reset());
    this.results = [];
  }
}

/**
 * 실시간 데이터 생성기 (테스트용)
 */
export function generateRealtimeTestData(count: number = 100): Array<{
  timestamp: number;
  cpu: number;
  memory: number;
  network: number;
}> {
  return Array.from({ length: count }, (_, index) => ({
    timestamp: Date.now() - (count - index) * 1000,
    cpu: Math.random() * 100,
    memory: 40 + Math.random() * 40,
    network: Math.random() * 1000,
  }));
}

/**
 * 스트레스 테스트 데이터 생성기
 */
export function generateStressTestData(
  dataPoints: number = 1000,
  updateFrequency: number = 16 // 60fps
): Array<{
  timestamp: number;
  values: number[];
}> {
  return Array.from({ length: dataPoints }, (_, index) => ({
    timestamp: Date.now() - (dataPoints - index) * updateFrequency,
    values: Array.from({ length: 10 }, () => Math.random() * 100),
  }));
}

/**
 * 메모리 누수 감지
 */
export function detectMemoryLeaks(
  initialMemory: number,
  threshold: number = 50 // MB
): boolean {
  if ('memory' in performance) {
    const memory = (performance as ExtendedPerformance).memory;
    const currentMemory = memory ? memory.usedJSHeapSize / 1024 / 1024 : 0;
    return (currentMemory - initialMemory) > threshold;
  }
  return false;
}

/**
 * 성능 프로파일링 데코레이터
 */
export function profilePerformance(library: string) {
  const benchmark = new ChartPerformanceBenchmark(library);
  
  return function <T extends (...args: unknown[]) => unknown>(
    target: unknown,
    propertyName: string,
    descriptor: TypedPropertyDescriptor<T>
  ) {
    const method = descriptor.value;
    if (!method) {
      return descriptor;
    }
    
    descriptor.value = (function (this: unknown, ...args: unknown[]) {
      const startTime = benchmark.startRender();
      const result = method.apply(this, args);
      benchmark.endRender(startTime);
      benchmark.measureMemoryUsage();
      
      return result;
    }) as T;

    return descriptor;
  };
}
