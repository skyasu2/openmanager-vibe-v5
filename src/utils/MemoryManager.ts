/**
 * 🧠 OpenManager Vibe v5 - 메모리 관리 시스템
 * 
 * 메모리 누수 방지, 객체 풀링, 가비지 컬렉션 최적화
 */

export interface MemoryMetrics {
  heapUsed: number;
  heapTotal: number;
  rss: number;
  external: number;
  arrayBuffers: number;
  timestamp: number;
}

export interface ObjectPoolOptions {
  initialSize: number;
  maxSize: number;
  validateObject?: (obj: any) => boolean;
}

/**
 * 🎯 객체 풀링 시스템
 */
export class ObjectPool<T> {
  private pool: T[] = [];
  private inUse: Set<T> = new Set();
  private createFn: () => T;
  private resetFn: (obj: T) => void;
  private options: ObjectPoolOptions;
  private metrics = {
    created: 0,
    acquired: 0,
    released: 0,
    destroyed: 0
  };

  constructor(
    createFn: () => T, 
    resetFn: (obj: T) => void, 
    options: Partial<ObjectPoolOptions> = {}
  ) {
    this.createFn = createFn;
    this.resetFn = resetFn;
    this.options = {
      initialSize: 5,
      maxSize: 50,
      ...options
    };
    
    this.initialize();
  }

  private initialize(): void {
    for (let i = 0; i < this.options.initialSize; i++) {
      const obj = this.createFn();
      this.pool.push(obj);
      this.metrics.created++;
    }
  }

  /**
   * 🎯 객체 획득
   */
  acquire(): T {
    let obj: T;
    
    if (this.pool.length > 0) {
      obj = this.pool.pop()!;
    } else {
      obj = this.createFn();
      this.metrics.created++;
    }
    
    this.inUse.add(obj);
    this.metrics.acquired++;
    
    return obj;
  }

  /**
   * 🔄 객체 반환
   */
  release(obj: T): void {
    if (!this.inUse.has(obj)) {
      console.warn('⚠️ 풀에 없는 객체를 반환하려고 시도');
      return;
    }
    
    this.inUse.delete(obj);
    
    // 객체 검증
    if (this.options.validateObject && !this.options.validateObject(obj)) {
      this.metrics.destroyed++;
      return;
    }
    
    // 풀 크기 제한
    if (this.pool.length < this.options.maxSize) {
      this.resetFn(obj);
      this.pool.push(obj);
    } else {
      this.metrics.destroyed++;
    }
    
    this.metrics.released++;
  }

  /**
   * 📊 풀 통계
   */
  getStats(): any {
    return {
      poolSize: this.pool.length,
      inUse: this.inUse.size,
      metrics: this.metrics,
      efficiency: this.metrics.acquired > 0 ? 
        Math.round((this.metrics.released / this.metrics.acquired) * 100) : 0
    };
  }

  /**
   * 🧹 풀 정리
   */
  cleanup(): void {
    this.pool.length = 0;
    this.inUse.clear();
  }
}

/**
 * 📊 메모리 모니터링 시스템
 */
export class MemoryMonitor {
  private interval: NodeJS.Timeout | null = null;
  private metrics: MemoryMetrics[] = [];
  private maxMetrics: number = 100; // 최근 100개 기록만 유지
  
  private thresholds = {
    heapWarning: 256 * 1024 * 1024,  // 256MB
    heapCritical: 512 * 1024 * 1024, // 512MB
    rssWarning: 512 * 1024 * 1024,   // 512MB
    rssCritical: 1024 * 1024 * 1024  // 1GB
  };

  private callbacks = {
    onWarning: [] as Array<(metrics: MemoryMetrics) => void>,
    onCritical: [] as Array<(metrics: MemoryMetrics) => void>,
    onRecovery: [] as Array<(metrics: MemoryMetrics) => void>
  };

  private lastState: 'normal' | 'warning' | 'critical' = 'normal';

  /**
   * 🚀 모니터링 시작
   */
  start(intervalMs: number = 10000): void {
    if (this.interval) {
      this.stop();
    }

    this.interval = setInterval(() => {
      this.collectMetrics();
    }, intervalMs);

    console.log(`📊 메모리 모니터링 시작 (${intervalMs}ms 간격)`);
  }

  /**
   * 🛑 모니터링 중지
   */
  stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
      console.log('📊 메모리 모니터링 중지');
    }
  }

  /**
   * 📈 메트릭 수집
   */
  private collectMetrics(): void {
    const usage = process.memoryUsage();
    const metric: MemoryMetrics = {
      heapUsed: usage.heapUsed,
      heapTotal: usage.heapTotal,
      rss: usage.rss,
      external: usage.external,
      arrayBuffers: usage.arrayBuffers,
      timestamp: Date.now()
    };

    this.metrics.push(metric);
    
    // 메트릭 수 제한
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift();
    }

    this.checkThresholds(metric);
    this.logMetrics(metric);
  }

  /**
   * ⚠️ 임계값 확인
   */
  private checkThresholds(metric: MemoryMetrics): void {
    let currentState: 'normal' | 'warning' | 'critical' = 'normal';

    // Critical 상태 확인
    if (metric.heapUsed > this.thresholds.heapCritical || 
        metric.rss > this.thresholds.rssCritical) {
      currentState = 'critical';
    }
    // Warning 상태 확인
    else if (metric.heapUsed > this.thresholds.heapWarning || 
             metric.rss > this.thresholds.rssWarning) {
      currentState = 'warning';
    }

    // 상태 변화 감지
    if (currentState !== this.lastState) {
      this.handleStateChange(currentState, metric);
      this.lastState = currentState;
    }
  }

  /**
   * 🔄 상태 변화 처리
   */
  private handleStateChange(newState: 'normal' | 'warning' | 'critical', metric: MemoryMetrics): void {
    switch (newState) {
      case 'warning':
        console.warn('⚠️ 메모리 사용량 경고!', this.formatMetrics(metric));
        this.callbacks.onWarning.forEach(cb => cb(metric));
        break;
        
      case 'critical':
        console.error('🚨 메모리 사용량 위험!', this.formatMetrics(metric));
        this.callbacks.onCritical.forEach(cb => cb(metric));
        this.triggerGarbageCollection();
        break;
        
      case 'normal':
        if (this.lastState !== 'normal') {
          console.log('✅ 메모리 사용량 정상화', this.formatMetrics(metric));
          this.callbacks.onRecovery.forEach(cb => cb(metric));
        }
        break;
    }
  }

  /**
   * 🗑️ 가비지 컬렉션 실행
   */
  private triggerGarbageCollection(): void {
    if (global.gc) {
      console.log('🗑️ 수동 가비지 컬렉션 실행...');
      global.gc();
      
      // GC 후 메트릭 다시 수집
      setTimeout(() => {
        const usage = process.memoryUsage();
        console.log('✅ GC 완료:', this.formatMemoryUsage(usage));
      }, 1000);
    } else {
      console.warn('⚠️ 가비지 컬렉션 사용 불가 (--expose-gc 플래그 필요)');
    }
  }

  /**
   * 📝 메트릭 로깅
   */
  private logMetrics(metric: MemoryMetrics): void {
    if (this.metrics.length % 6 === 0) { // 1분마다 로그 (10초 간격 × 6)
      console.log('📊 메모리 상태:', this.formatMetrics(metric));
    }
  }

  /**
   * 📊 메트릭 포맷팅
   */
  private formatMetrics(metric: MemoryMetrics): string {
    return `Heap: ${this.formatBytes(metric.heapUsed)}/${this.formatBytes(metric.heapTotal)}, RSS: ${this.formatBytes(metric.rss)}, External: ${this.formatBytes(metric.external)}`;
  }

  private formatMemoryUsage(usage: NodeJS.MemoryUsage): string {
    return Object.entries(usage)
      .map(([key, value]) => `${key}: ${this.formatBytes(value)}`)
      .join(', ');
  }

  private formatBytes(bytes: number): string {
    const mb = bytes / 1024 / 1024;
    return `${Math.round(mb * 10) / 10}MB`;
  }

  /**
   * 📊 메트릭 통계
   */
  getStatistics(): any {
    if (this.metrics.length === 0) {
      return { error: 'No metrics available' };
    }

    const recent = this.metrics.slice(-10); // 최근 10개
    
    const heapUsed = recent.map(m => m.heapUsed);
    const rss = recent.map(m => m.rss);

    return {
      current: this.formatMetrics(this.metrics[this.metrics.length - 1]),
      trend: {
        heapUsed: this.calculateTrend(heapUsed),
        rss: this.calculateTrend(rss)
      },
      thresholds: {
        heapWarning: this.formatBytes(this.thresholds.heapWarning),
        heapCritical: this.formatBytes(this.thresholds.heapCritical),
        rssWarning: this.formatBytes(this.thresholds.rssWarning),
        rssCritical: this.formatBytes(this.thresholds.rssCritical)
      },
      samples: this.metrics.length,
      state: this.lastState
    };
  }

  /**
   * 📈 트렌드 계산
   */
  private calculateTrend(values: number[]): 'increasing' | 'decreasing' | 'stable' {
    if (values.length < 2) return 'stable';
    
    const first = values[0];
    const last = values[values.length - 1];
    const change = (last - first) / first;

    if (change > 0.1) return 'increasing';
    if (change < -0.1) return 'decreasing';
    return 'stable';
  }

  /**
   * 🔔 콜백 등록
   */
  onWarning(callback: (metrics: MemoryMetrics) => void): void {
    this.callbacks.onWarning.push(callback);
  }

  onCritical(callback: (metrics: MemoryMetrics) => void): void {
    this.callbacks.onCritical.push(callback);
  }

  onRecovery(callback: (metrics: MemoryMetrics) => void): void {
    this.callbacks.onRecovery.push(callback);
  }
}

/**
 * 🏭 메모리 관리 팩토리
 */
export class MemoryManagerFactory {
  private static pools: Map<string, ObjectPool<any>> = new Map();
  private static monitor: MemoryMonitor | null = null;

  /**
   * 🎯 서버 메트릭 객체 풀 생성
   */
  static createServerMetricsPool(): ObjectPool<any> {
    const poolName = 'serverMetrics';
    
    if (!this.pools.has(poolName)) {
      const pool = new ObjectPool(
        () => ({
          id: '',
          hostname: '',
          cpu: 0,
          memory: 0,
          disk: 0,
          network: { in: 0, out: 0 },
          processes: [],
          timestamp: ''
        }),
        (obj) => {
          obj.id = '';
          obj.hostname = '';
          obj.cpu = 0;
          obj.memory = 0;
          obj.disk = 0;
          obj.network = { in: 0, out: 0 };
          obj.processes = [];
          obj.timestamp = '';
        },
        { initialSize: 10, maxSize: 100 }
      );
      
      this.pools.set(poolName, pool);
    }
    
    return this.pools.get(poolName)!;
  }

  /**
   * 📊 AI 분석 결과 객체 풀 생성
   */
  static createAnalysisResultPool(): ObjectPool<any> {
    const poolName = 'analysisResult';
    
    if (!this.pools.has(poolName)) {
      const pool = new ObjectPool(
        () => ({
          success: false,
          data: null,
          confidence: 0,
          processingTime: 0,
          tools: [],
          context: {},
          cached: false
        }),
        (obj) => {
          obj.success = false;
          obj.data = null;
          obj.confidence = 0;
          obj.processingTime = 0;
          obj.tools = [];
          obj.context = {};
          obj.cached = false;
        },
        { initialSize: 5, maxSize: 50 }
      );
      
      this.pools.set(poolName, pool);
    }
    
    return this.pools.get(poolName)!;
  }

  /**
   * 📊 메모리 모니터 시작
   */
  static startMemoryMonitoring(): MemoryMonitor {
    if (!this.monitor) {
      this.monitor = new MemoryMonitor();
      
      // 경고 시 객체 풀 정리
      this.monitor.onWarning(() => {
        console.log('🧹 메모리 경고로 인한 객체 풀 정리 시작...');
        this.cleanupPools();
      });
      
      // 위험 시 강제 정리
      this.monitor.onCritical(() => {
        console.log('🚨 메모리 위험으로 인한 강제 정리 시작...');
        this.emergencyCleanup();
      });
      
      this.monitor.start(10000); // 10초 간격
    }
    
    return this.monitor;
  }

  /**
   * 🧹 객체 풀 정리
   */
  static cleanupPools(): void {
    let cleaned = 0;
    
    for (const [name, pool] of this.pools.entries()) {
      const statsBefore = pool.getStats();
      pool.cleanup();
      cleaned += statsBefore.poolSize;
      console.log(`🧹 ${name} 풀 정리: ${statsBefore.poolSize}개 객체 해제`);
    }
    
    console.log(`✅ 총 ${cleaned}개 객체 정리 완료`);
  }

  /**
   * 🚨 응급 메모리 정리
   */
  static emergencyCleanup(): void {
    console.log('🚨 응급 메모리 정리 시작...');
    
    // 모든 풀 정리
    this.cleanupPools();
    
    // 가비지 컬렉션 강제 실행
    if (global.gc) {
      global.gc();
      console.log('🗑️ 응급 가비지 컬렉션 완료');
    }
  }

  /**
   * 📊 전체 메모리 상태
   */
  static getOverallStatus(): any {
    const poolStats = Array.from(this.pools.entries()).map(([name, pool]) => ({
      name,
      stats: pool.getStats()
    }));

    return {
      pools: poolStats,
      monitor: this.monitor?.getStatistics() || null,
      system: process.memoryUsage()
    };
  }
}

// 전역 메모리 매니저 인스턴스
export const memoryManager = {
  serverMetricsPool: MemoryManagerFactory.createServerMetricsPool(),
  analysisResultPool: MemoryManagerFactory.createAnalysisResultPool(),
  monitor: MemoryManagerFactory.startMemoryMonitoring(),
  getStatus: () => MemoryManagerFactory.getOverallStatus(),
  cleanup: () => MemoryManagerFactory.cleanupPools(),
  emergencyCleanup: () => MemoryManagerFactory.emergencyCleanup()
}; 