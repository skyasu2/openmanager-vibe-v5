/**
 * 🚀 Edge Runtime 전용 유틸리티 라이브러리
 * winston, ioredis 등 Node.js 모듈 대체
 */

// Edge Runtime 호환 로거
export class EdgeLogger {
  private static instance: EdgeLogger;
  private logs: Array<{
    timestamp: string;
    level: string;
    message: string;
    meta?: any;
  }> = [];
  private maxLogs = 100;

  static getInstance(): EdgeLogger {
    if (!EdgeLogger.instance) {
      EdgeLogger.instance = new EdgeLogger();
    }
    return EdgeLogger.instance;
  }

  private log(level: string, message: string, meta?: any) {
    const timestamp = new Date().toISOString();
    const logEntry = { timestamp, level, message, meta };

    this.logs.push(logEntry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift(); // 오래된 로그 제거
    }

    // 콘솔 출력
    const logMessage = `[${timestamp}] ${level.toUpperCase()}: ${message}`;
    if (meta) {
      console.log(logMessage, meta);
    } else {
      console.log(logMessage);
    }
  }

  info(message: string, meta?: any) {
    this.log('info', message, meta);
  }

  warn(message: string, meta?: any) {
    this.log('warn', message, meta);
  }

  error(message: string, meta?: any) {
    this.log('error', message, meta);
  }

  debug(message: string, meta?: any) {
    this.log('debug', message, meta);
  }

  getLogs() {
    return [...this.logs];
  }

  clearLogs() {
    this.logs = [];
  }
}

// Edge Runtime 호환 캐시
export class EdgeCache {
  private static instance: EdgeCache;
  private cache = new Map<string, { value: any; expires: number }>();
  private maxSize = 100;

  static getInstance(): EdgeCache {
    if (!EdgeCache.instance) {
      EdgeCache.instance = new EdgeCache();
    }
    return EdgeCache.instance;
  }

  set(key: string, value: any, ttlMs = 300000): void {
    // 기본 5분
    const expires = Date.now() + ttlMs;

    // 캐시 크기 제한
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, { value, expires });
  }

  get(key: string): any | null {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() > item.expires) {
      this.cache.delete(key);
      return null;
    }

    return item.value;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  has(key: string): boolean {
    const item = this.cache.get(key);
    if (!item) return false;

    if (Date.now() > item.expires) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  size(): number {
    // 만료된 항목들 정리
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expires) {
        this.cache.delete(key);
      }
    }
    return this.cache.size;
  }

  getStats() {
    return {
      size: this.size(),
      maxSize: this.maxSize,
      keys: Array.from(this.cache.keys()),
    };
  }
}

// Edge Runtime 호환 HTTP 클라이언트
export class EdgeHTTPClient {
  private static baseConfig = {
    timeout: 15000,
    retries: 3,
    retryDelay: 1000,
  };

  static async fetch(
    url: string,
    options: RequestInit = {},
    config = EdgeHTTPClient.baseConfig
  ) {
    const { timeout, retries, retryDelay } = config;

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return response;
      } catch (error) {
        if (attempt === retries) {
          throw error;
        }

        await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
      }
    }
  }

  static async get(url: string, config?: typeof EdgeHTTPClient.baseConfig) {
    return await EdgeHTTPClient.fetch(url, { method: 'GET' }, config);
  }

  static async post(
    url: string,
    data: any,
    config?: typeof EdgeHTTPClient.baseConfig
  ) {
    return await EdgeHTTPClient.fetch(
      url,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      },
      config
    );
  }
}

// Edge Runtime 호환 상태 관리자
export class EdgeStateManager {
  private static instance: EdgeStateManager;
  private state = new Map<string, any>();

  static getInstance(): EdgeStateManager {
    if (!EdgeStateManager.instance) {
      EdgeStateManager.instance = new EdgeStateManager();
    }
    return EdgeStateManager.instance;
  }

  setState(key: string, value: any): void {
    this.state.set(key, value);
  }

  getState(key: string): any {
    return this.state.get(key);
  }

  removeState(key: string): void {
    this.state.delete(key);
  }

  clearState(): void {
    this.state.clear();
  }

  getAllState(): Record<string, any> {
    return Object.fromEntries(this.state);
  }
}

// Edge Runtime 환경 감지
export function isEdgeRuntime(): boolean {
  // Vercel Edge Runtime 환경 감지
  return (
    typeof globalThis !== 'undefined' &&
    (globalThis as any).EdgeRuntime === 'vercel'
  );
}

// Edge Runtime 호환 검사
export function checkEdgeCompatibility() {
  const incompatibleModules: string[] = [];

  // Node.js 고유 모듈들 검사
  const nodeModules = ['fs', 'path', 'os', 'crypto', 'stream', 'net', 'dns'];

  nodeModules.forEach(module => {
    try {
      // Edge Runtime에서는 require/import가 실패해야 함
      if (typeof require !== 'undefined') {
        require(module);
        incompatibleModules.push(module);
      }
    } catch {
      // Edge Runtime에서는 정상적으로 실패해야 함
    }
  });

  return {
    isEdge: isEdgeRuntime(),
    incompatibleModules,
    compatible: incompatibleModules.length === 0,
  };
}

// Edge Runtime 성능 모니터링
export class EdgePerformanceMonitor {
  private static instance: EdgePerformanceMonitor;
  private metrics = new Map<string, number[]>();

  static getInstance(): EdgePerformanceMonitor {
    if (!EdgePerformanceMonitor.instance) {
      EdgePerformanceMonitor.instance = new EdgePerformanceMonitor();
    }
    return EdgePerformanceMonitor.instance;
  }

  startTimer(name: string): () => number {
    const startTime = performance.now();

    return () => {
      const duration = performance.now() - startTime;
      this.recordMetric(name, duration);
      return duration;
    };
  }

  recordMetric(name: string, value: number): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }

    const values = this.metrics.get(name)!;
    values.push(value);

    // 최대 100개의 측정값만 유지
    if (values.length > 100) {
      values.shift();
    }
  }

  getMetrics(name: string) {
    const values = this.metrics.get(name) || [];
    if (values.length === 0) return null;

    const sorted = [...values].sort((a, b) => a - b);
    const sum = values.reduce((a, b) => a + b, 0);

    return {
      count: values.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      avg: sum / values.length,
      median: sorted[Math.floor(sorted.length / 2)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)],
    };
  }

  getAllMetrics() {
    const result: Record<string, any> = {};
    for (const [name] of this.metrics) {
      result[name] = this.getMetrics(name);
    }
    return result;
  }

  clearMetrics(): void {
    this.metrics.clear();
  }
}

// 통합 Edge Runtime 서비스
export class EdgeRuntimeService {
  public logger = EdgeLogger.getInstance();
  public cache = EdgeCache.getInstance();
  public state = EdgeStateManager.getInstance();
  public performance = EdgePerformanceMonitor.getInstance();
  public http = EdgeHTTPClient;

  constructor() {
    this.logger.info('Edge Runtime Service 초기화됨');
  }

  // 호환성 체크
  checkCompatibility() {
    return checkEdgeCompatibility();
  }

  // 시스템 상태
  getSystemStatus() {
    return {
      runtime: isEdgeRuntime() ? 'edge' : 'node',
      compatibility: this.checkCompatibility(),
      cache: this.cache.getStats(),
      metrics: this.performance.getAllMetrics(),
      timestamp: new Date().toISOString(),
    };
  }

  // 정리 작업
  cleanup() {
    this.cache.clear();
    this.state.clearState();
    this.performance.clearMetrics();
    this.logger.clearLogs();
    this.logger.info('Edge Runtime Service 정리 완료');
  }
}

// 싱글톤 인스턴스 내보내기
export const edgeRuntimeService = new EdgeRuntimeService();
