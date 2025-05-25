/**
 * AI Agent Adapters
 * 
 * 🔌 환경별 어댑터 시스템
 * - 스토리지 어댑터 (메모리, localStorage, IndexedDB, 파일)
 * - 로깅 어댑터 (콘솔, 파일, 원격)
 * - 네트워크 어댑터 (REST, WebSocket, Mock)
 * - 메트릭 어댑터 (콘솔, Prometheus, 커스텀)
 */

// Storage Adapters
export interface StorageAdapter {
  get(key: string): Promise<any>;
  set(key: string, value: any, ttl?: number): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
  keys(): Promise<string[]>;
}

export class MemoryStorageAdapter implements StorageAdapter {
  private storage = new Map<string, { value: any; expires?: number }>();

  async get(key: string): Promise<any> {
    const item = this.storage.get(key);
    if (!item) return null;
    
    if (item.expires && Date.now() > item.expires) {
      this.storage.delete(key);
      return null;
    }
    
    return item.value;
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    const expires = ttl ? Date.now() + ttl : undefined;
    this.storage.set(key, { value, expires });
  }

  async delete(key: string): Promise<void> {
    this.storage.delete(key);
  }

  async clear(): Promise<void> {
    this.storage.clear();
  }

  async keys(): Promise<string[]> {
    return Array.from(this.storage.keys());
  }
}

export class LocalStorageAdapter implements StorageAdapter {
  private prefix: string;

  constructor(prefix = 'ai-agent') {
    this.prefix = prefix;
  }

  async get(key: string): Promise<any> {
    if (typeof window === 'undefined') return null;
    
    try {
      const item = localStorage.getItem(`${this.prefix}:${key}`);
      if (!item) return null;
      
      const parsed = JSON.parse(item);
      if (parsed.expires && Date.now() > parsed.expires) {
        localStorage.removeItem(`${this.prefix}:${key}`);
        return null;
      }
      
      return parsed.value;
    } catch {
      return null;
    }
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    if (typeof window === 'undefined') return;
    
    const expires = ttl ? Date.now() + ttl : undefined;
    const item = { value, expires };
    localStorage.setItem(`${this.prefix}:${key}`, JSON.stringify(item));
  }

  async delete(key: string): Promise<void> {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(`${this.prefix}:${key}`);
  }

  async clear(): Promise<void> {
    if (typeof window === 'undefined') return;
    
    const keys = Object.keys(localStorage);
    for (const key of keys) {
      if (key.startsWith(`${this.prefix}:`)) {
        localStorage.removeItem(key);
      }
    }
  }

  async keys(): Promise<string[]> {
    if (typeof window === 'undefined') return [];
    
    const keys = Object.keys(localStorage);
    return keys
      .filter(key => key.startsWith(`${this.prefix}:`))
      .map(key => key.replace(`${this.prefix}:`, ''));
  }
}

// Logging Adapters
export interface LoggingAdapter {
  debug(message: string, ...args: any[]): void;
  info(message: string, ...args: any[]): void;
  warn(message: string, ...args: any[]): void;
  error(message: string, ...args: any[]): void;
}

export class ConsoleLoggingAdapter implements LoggingAdapter {
  private enabledLevels: Set<string>;

  constructor(level: 'debug' | 'info' | 'warn' | 'error' = 'info') {
    const levels = ['debug', 'info', 'warn', 'error'];
    const startIndex = levels.indexOf(level);
    this.enabledLevels = new Set(levels.slice(startIndex));
  }

  debug(message: string, ...args: any[]): void {
    if (this.enabledLevels.has('debug')) {
      console.debug(`🔍 [AI-Agent] ${message}`, ...args);
    }
  }

  info(message: string, ...args: any[]): void {
    if (this.enabledLevels.has('info')) {
      console.info(`ℹ️ [AI-Agent] ${message}`, ...args);
    }
  }

  warn(message: string, ...args: any[]): void {
    if (this.enabledLevels.has('warn')) {
      console.warn(`⚠️ [AI-Agent] ${message}`, ...args);
    }
  }

  error(message: string, ...args: any[]): void {
    if (this.enabledLevels.has('error')) {
      console.error(`❌ [AI-Agent] ${message}`, ...args);
    }
  }
}

export class SilentLoggingAdapter implements LoggingAdapter {
  debug(): void {}
  info(): void {}
  warn(): void {}
  error(): void {}
}

// Network Adapters
export interface NetworkAdapter {
  get(url: string, options?: any): Promise<any>;
  post(url: string, data: any, options?: any): Promise<any>;
  put(url: string, data: any, options?: any): Promise<any>;
  delete(url: string, options?: any): Promise<any>;
}

export class FetchNetworkAdapter implements NetworkAdapter {
  private baseURL: string;
  private defaultHeaders: Record<string, string>;

  constructor(baseURL = '', defaultHeaders: Record<string, string> = {}) {
    this.baseURL = baseURL;
    this.defaultHeaders = defaultHeaders;
  }

  async get(url: string, options: any = {}): Promise<any> {
    return this.request('GET', url, undefined, options);
  }

  async post(url: string, data: any, options: any = {}): Promise<any> {
    return this.request('POST', url, data, options);
  }

  async put(url: string, data: any, options: any = {}): Promise<any> {
    return this.request('PUT', url, data, options);
  }

  async delete(url: string, options: any = {}): Promise<any> {
    return this.request('DELETE', url, undefined, options);
  }

  private async request(method: string, url: string, data?: any, options: any = {}): Promise<any> {
    const fullURL = url.startsWith('http') ? url : `${this.baseURL}${url}`;
    
    const config: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...this.defaultHeaders,
        ...options.headers
      },
      ...options
    };

    if (data) {
      config.body = JSON.stringify(data);
    }

    const response = await fetch(fullURL, config);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }
}

export class MockNetworkAdapter implements NetworkAdapter {
  private responses: Map<string, any> = new Map();

  setMockResponse(url: string, response: any): void {
    this.responses.set(url, response);
  }

  async get(url: string): Promise<any> {
    return this.getMockResponse(url);
  }

  async post(url: string, data: any): Promise<any> {
    return this.getMockResponse(url, data);
  }

  async put(url: string, data: any): Promise<any> {
    return this.getMockResponse(url, data);
  }

  async delete(url: string): Promise<any> {
    return this.getMockResponse(url);
  }

  private getMockResponse(url: string, data?: any): any {
    const response = this.responses.get(url);
    if (response) {
      return typeof response === 'function' ? response(data) : response;
    }
    
    // 기본 모의 응답
    return {
      success: true,
      data: { message: `Mock response for ${url}` },
      timestamp: new Date().toISOString()
    };
  }
}

// Metrics Adapters
export interface MetricsAdapter {
  increment(metric: string, value?: number, tags?: Record<string, string>): void;
  gauge(metric: string, value: number, tags?: Record<string, string>): void;
  histogram(metric: string, value: number, tags?: Record<string, string>): void;
  timing(metric: string, duration: number, tags?: Record<string, string>): void;
}

export class ConsoleMetricsAdapter implements MetricsAdapter {
  increment(metric: string, value = 1, tags?: Record<string, string>): void {
    console.log(`📊 [Metrics] ${metric} +${value}`, tags);
  }

  gauge(metric: string, value: number, tags?: Record<string, string>): void {
    console.log(`📊 [Metrics] ${metric} = ${value}`, tags);
  }

  histogram(metric: string, value: number, tags?: Record<string, string>): void {
    console.log(`📊 [Metrics] ${metric} histogram: ${value}`, tags);
  }

  timing(metric: string, duration: number, tags?: Record<string, string>): void {
    console.log(`📊 [Metrics] ${metric} timing: ${duration}ms`, tags);
  }
}

export class NoOpMetricsAdapter implements MetricsAdapter {
  increment(): void {}
  gauge(): void {}
  histogram(): void {}
  timing(): void {}
}

// Adapter Factory
export class AdapterFactory {
  static createStorageAdapter(type: string, config?: any): StorageAdapter {
    switch (type) {
      case 'memory':
        return new MemoryStorageAdapter();
      case 'localStorage':
        return new LocalStorageAdapter(config?.prefix);
      default:
        return new MemoryStorageAdapter();
    }
  }

  static createLoggingAdapter(type: string, config?: any): LoggingAdapter {
    switch (type) {
      case 'console':
        return new ConsoleLoggingAdapter(config?.level);
      case 'silent':
        return new SilentLoggingAdapter();
      default:
        return new ConsoleLoggingAdapter();
    }
  }

  static createNetworkAdapter(type: string, config?: any): NetworkAdapter {
    switch (type) {
      case 'fetch':
        return new FetchNetworkAdapter(config?.baseURL, config?.headers);
      case 'mock':
        const adapter = new MockNetworkAdapter();
        if (config?.responses) {
          for (const [url, response] of Object.entries(config.responses)) {
            adapter.setMockResponse(url, response);
          }
        }
        return adapter;
      default:
        return new FetchNetworkAdapter();
    }
  }

  static createMetricsAdapter(type: string, config?: any): MetricsAdapter {
    switch (type) {
      case 'console':
        return new ConsoleMetricsAdapter();
      case 'none':
        return new NoOpMetricsAdapter();
      default:
        return new NoOpMetricsAdapter();
    }
  }
} 