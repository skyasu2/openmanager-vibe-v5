/**
 * 🧠 AI 캐싱 시스템
 * 
 * Redis 대신 인메모리 캐시로 구현 (개발/데모용)
 * 추후 Redis로 쉽게 전환 가능한 인터페이스
 */

export interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl: number;
  hits: number;
  key: string;
}

export interface CacheStats {
  totalEntries: number;
  totalHits: number;
  totalMisses: number;
  hitRate: number;
  memoryUsage: string;
  oldestEntry: string | null;
  newestEntry: string | null;
}

export interface CacheConfig {
  maxSize: number;
  defaultTTL: number;
  cleanupInterval: number;
}

export class AICache {
  private cache = new Map<string, CacheEntry>();
  private hits = 0;
  private misses = 0;
  private cleanupTimer: NodeJS.Timeout | null = null;
  
  private config: CacheConfig = {
    maxSize: 1000,
    defaultTTL: 5 * 60 * 1000, // 5분
    cleanupInterval: 60 * 1000  // 1분마다 정리
  };

  // 🎯 TTL 상수들
  public static readonly TTL = {
    COMMON_QUERIES: 5 * 60 * 1000,     // 일반 쿼리: 5분
    METRICS_DATA: 1 * 60 * 1000,       // 메트릭: 1분
    PREDICTIONS: 5 * 60 * 1000,        // 예측: 5분
    MONITORING: 30 * 1000,             // 모니터링: 30초
    SESSION_DATA: 30 * 60 * 1000,      // 세션: 30분
    HEALTH_CHECK: 2 * 60 * 1000        // 헬스체크: 2분
  };

  constructor(config?: Partial<CacheConfig>) {
    if (config) {
      this.config = { ...this.config, ...config };
    }
    
    this.startCleanupTimer();
    console.log('🧠 AICache 초기화 완료:', this.config);
  }

  /**
   * 🔥 캐시에서 데이터 가져오기
   */
  public get<T = any>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.misses++;
      return null;
    }

    // TTL 체크
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      this.misses++;
      return null;
    }

    // 히트 카운트 증가
    entry.hits++;
    this.hits++;
    
    return entry.data as T;
  }

  /**
   * 💾 캐시에 데이터 저장
   */
  public set<T = any>(key: string, data: T, ttl?: number): void {
    const actualTTL = ttl || this.config.defaultTTL;
    
    // 캐시 크기 제한
    if (this.cache.size >= this.config.maxSize) {
      this.evictOldest();
    }

    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: actualTTL,
      hits: 0,
      key
    };

    this.cache.set(key, entry);
  }

  /**
   * 🗑️ 캐시에서 데이터 삭제
   */
  public delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * 🧹 전체 캐시 클리어
   */
  public clear(): void {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * 📊 캐시 통계
   */
  public getStats(): CacheStats {
    const entries = Array.from(this.cache.values());
    const totalRequests = this.hits + this.misses;
    
    return {
      totalEntries: this.cache.size,
      totalHits: this.hits,
      totalMisses: this.misses,
      hitRate: totalRequests > 0 ? (this.hits / totalRequests) * 100 : 0,
      memoryUsage: this.estimateMemoryUsage(),
      oldestEntry: this.getOldestEntry()?.key || null,
      newestEntry: this.getNewestEntry()?.key || null
    };
  }

  /**
   * 🔍 특정 패턴의 키들 검색
   */
  public getKeys(pattern?: string): string[] {
    const keys = Array.from(this.cache.keys());
    
    if (!pattern) return keys;
    
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    return keys.filter(key => regex.test(key));
  }

  /**
   * ⏰ 만료된 항목들 정리
   */
  public cleanup(): number {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
        cleanedCount++;
      }
    }

    return cleanedCount;
  }

  /**
   * 🔄 가장 오래된 항목 제거 (LRU)
   */
  private evictOldest(): void {
    const oldest = this.getOldestEntry();
    if (oldest) {
      this.cache.delete(oldest.key);
    }
  }

  /**
   * 📅 가장 오래된 항목 찾기
   */
  private getOldestEntry(): CacheEntry | null {
    let oldest: CacheEntry | null = null;
    
    for (const entry of this.cache.values()) {
      if (!oldest || entry.timestamp < oldest.timestamp) {
        oldest = entry;
      }
    }
    
    return oldest;
  }

  /**
   * 🆕 가장 새로운 항목 찾기
   */
  private getNewestEntry(): CacheEntry | null {
    let newest: CacheEntry | null = null;
    
    for (const entry of this.cache.values()) {
      if (!newest || entry.timestamp > newest.timestamp) {
        newest = entry;
      }
    }
    
    return newest;
  }

  /**
   * 📏 메모리 사용량 추정
   */
  private estimateMemoryUsage(): string {
    const jsonString = JSON.stringify(Array.from(this.cache.entries()));
    const bytes = new Blob([jsonString]).size;
    
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  }

  /**
   * ⏲️ 정리 타이머 시작
   */
  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      const cleaned = this.cleanup();
      if (cleaned > 0) {
        console.log(`🧹 AICache 정리: ${cleaned}개 만료 항목 제거`);
      }
    }, this.config.cleanupInterval);
  }

  /**
   * 🛑 정리 타이머 중지
   */
  public destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    this.clear();
  }
}

/**
 * 🎯 특화된 AI 캐시 클래스들
 */

export class QueryCache extends AICache {
  constructor() {
    super({
      maxSize: 500,
      defaultTTL: AICache.TTL.COMMON_QUERIES,
      cleanupInterval: 30 * 1000
    });
  }

  /**
   * 🔑 쿼리 기반 캐시 키 생성
   */
  public generateQueryKey(query: string, context?: any): string {
    const normalized = query.toLowerCase().trim();
    const contextHash = context ? this.hashObject(context) : 'no-context';
    return `query:${this.hashString(normalized)}:${contextHash}`;
  }

  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 32bit int 변환
    }
    return Math.abs(hash).toString(36);
  }

  private hashObject(obj: any): string {
    return this.hashString(JSON.stringify(obj));
  }
}

export class MetricsCache extends AICache {
  constructor() {
    super({
      maxSize: 200,
      defaultTTL: AICache.TTL.METRICS_DATA,
      cleanupInterval: 15 * 1000
    });
  }

  /**
   * 📊 메트릭 기반 캐시 키 생성
   */
  public generateMetricsKey(
    metricsData: any[], 
    analysisType: string = 'default'
  ): string {
    const latest = metricsData[metricsData.length - 1];
    const summary = latest ? `${latest.cpu}-${latest.memory}-${latest.disk}` : 'empty';
    const count = metricsData.length;
    const minute = Math.floor(Date.now() / (60 * 1000)); // 1분 단위
    
    return `metrics:${analysisType}:${summary}:${count}:${minute}`;
  }
}

export class MonitoringCache extends AICache {
  constructor() {
    super({
      maxSize: 100,
      defaultTTL: AICache.TTL.MONITORING,
      cleanupInterval: 10 * 1000
    });
  }

  /**
   * 🖥️ 모니터링 기반 캐시 키 생성
   */
  public generateMonitorKey(
    serverName: string,
    currentStatus: any,
    checkType: string = 'health'
  ): string {
    const statusHash = `${currentStatus.cpu}-${currentStatus.memory}-${currentStatus.disk}`;
    const time30s = Math.floor(Date.now() / (30 * 1000)); // 30초 단위
    
    return `monitor:${serverName}:${checkType}:${statusHash}:${time30s}`;
  }
}

// 🌍 글로벌 캐시 인스턴스들
export const globalQueryCache = new QueryCache();
export const globalMetricsCache = new MetricsCache();
export const globalMonitoringCache = new MonitoringCache();

// 프로세스 종료시 정리
process.on('beforeExit', () => {
  globalQueryCache.destroy();
  globalMetricsCache.destroy();
  globalMonitoringCache.destroy();
});

export default AICache; 