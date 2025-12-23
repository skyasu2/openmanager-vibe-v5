/**
 * Cache Monitoring Utility
 *
 * Cache 히트율 모니터링 및 통계 수집을 위한 유틸리티
 *
 * 기능:
 * 1. 실시간 히트율 모니터링
 * 2. 타입별 캐시 통계
 * 3. 성능 메트릭 수집
 * 4. 알림 임계값 설정
 */

import { getDataCache, type CacheConfig } from './cache-layer';

// ============================================================================
// 1. Types
// ============================================================================

export interface CacheMetrics {
  timestamp: string;
  hitRate: number;
  hitCount: number;
  missCount: number;
  totalEntries: number;
  entriesByType: {
    metrics: number;
    rag: number;
    analysis: number;
  };
  memoryEstimate: {
    entries: number;
    estimatedBytes: number;
  };
}

export interface CacheHealthStatus {
  status: 'healthy' | 'warning' | 'critical';
  message: string;
  metrics: CacheMetrics;
  alerts: CacheAlert[];
}

export interface CacheAlert {
  type: 'low_hit_rate' | 'high_entry_count' | 'memory_warning';
  severity: 'low' | 'medium' | 'high';
  message: string;
  value: number;
  threshold: number;
}

export interface MonitorConfig {
  thresholds: {
    minHitRate: number;         // 최소 히트율 (기본 0.5 = 50%)
    maxEntryCount: number;      // 최대 엔트리 수 (기본 400)
    warningEntryCount: number;  // 경고 엔트리 수 (기본 300)
  };
  collectInterval: number;       // 수집 간격 (ms)
  historySize: number;           // 히스토리 크기
}

// ============================================================================
// 2. Default Configuration
// ============================================================================

const DEFAULT_MONITOR_CONFIG: MonitorConfig = {
  thresholds: {
    minHitRate: 0.5,
    maxEntryCount: 400,
    warningEntryCount: 300,
  },
  collectInterval: 60_000, // 1분
  historySize: 60,         // 최근 60개 (1시간 분량)
};

// ============================================================================
// 3. Cache Monitor Implementation
// ============================================================================

export class CacheMonitor {
  private config: MonitorConfig;
  private metricsHistory: CacheMetrics[] = [];
  private collectIntervalId: ReturnType<typeof setInterval> | null = null;

  constructor(config: Partial<MonitorConfig> = {}) {
    this.config = {
      thresholds: {
        ...DEFAULT_MONITOR_CONFIG.thresholds,
        ...config.thresholds,
      },
      collectInterval: config.collectInterval ?? DEFAULT_MONITOR_CONFIG.collectInterval,
      historySize: config.historySize ?? DEFAULT_MONITOR_CONFIG.historySize,
    };
  }

  // ============================================================================
  // 3.1 Metrics Collection
  // ============================================================================

  /**
   * 현재 캐시 메트릭 수집
   */
  collectMetrics(): CacheMetrics {
    const cache = getDataCache();
    const stats = cache.getStats();
    const debugInfo = cache.getDebugInfo();

    const metrics: CacheMetrics = {
      timestamp: new Date().toISOString(),
      hitRate: stats.hitRate,
      hitCount: stats.hitCount,
      missCount: stats.missCount,
      totalEntries: stats.totalEntries,
      entriesByType: debugInfo.entriesByType,
      memoryEstimate: {
        entries: stats.totalEntries,
        // 대략적인 메모리 추정 (엔트리당 평균 1KB 가정)
        estimatedBytes: stats.totalEntries * 1024,
      },
    };

    // 히스토리에 추가
    this.metricsHistory.push(metrics);
    if (this.metricsHistory.length > this.config.historySize) {
      this.metricsHistory.shift();
    }

    return metrics;
  }

  /**
   * 최근 메트릭 히스토리 반환
   */
  getMetricsHistory(count?: number): CacheMetrics[] {
    const historyCount = count ?? this.config.historySize;
    return this.metricsHistory.slice(-historyCount);
  }

  /**
   * 평균 히트율 계산 (최근 N개 샘플)
   */
  getAverageHitRate(samples?: number): number {
    const history = this.getMetricsHistory(samples);
    if (history.length === 0) return 0;

    const sum = history.reduce((acc, m) => acc + m.hitRate, 0);
    return sum / history.length;
  }

  // ============================================================================
  // 3.2 Health Check
  // ============================================================================

  /**
   * 캐시 상태 진단
   */
  checkHealth(): CacheHealthStatus {
    const metrics = this.collectMetrics();
    const alerts: CacheAlert[] = [];

    // 1. 히트율 체크
    if (metrics.hitRate < this.config.thresholds.minHitRate && metrics.hitCount + metrics.missCount > 10) {
      alerts.push({
        type: 'low_hit_rate',
        severity: metrics.hitRate < 0.3 ? 'high' : 'medium',
        message: `Cache hit rate (${(metrics.hitRate * 100).toFixed(1)}%) is below threshold (${(this.config.thresholds.minHitRate * 100).toFixed(1)}%)`,
        value: metrics.hitRate,
        threshold: this.config.thresholds.minHitRate,
      });
    }

    // 2. 엔트리 수 체크
    if (metrics.totalEntries >= this.config.thresholds.maxEntryCount) {
      alerts.push({
        type: 'high_entry_count',
        severity: 'high',
        message: `Cache entry count (${metrics.totalEntries}) has reached maximum (${this.config.thresholds.maxEntryCount})`,
        value: metrics.totalEntries,
        threshold: this.config.thresholds.maxEntryCount,
      });
    } else if (metrics.totalEntries >= this.config.thresholds.warningEntryCount) {
      alerts.push({
        type: 'high_entry_count',
        severity: 'medium',
        message: `Cache entry count (${metrics.totalEntries}) approaching maximum (${this.config.thresholds.maxEntryCount})`,
        value: metrics.totalEntries,
        threshold: this.config.thresholds.warningEntryCount,
      });
    }

    // 3. 메모리 추정 체크 (10MB 이상 경고)
    if (metrics.memoryEstimate.estimatedBytes > 10 * 1024 * 1024) {
      alerts.push({
        type: 'memory_warning',
        severity: 'medium',
        message: `Estimated cache memory (${(metrics.memoryEstimate.estimatedBytes / 1024 / 1024).toFixed(2)}MB) is high`,
        value: metrics.memoryEstimate.estimatedBytes,
        threshold: 10 * 1024 * 1024,
      });
    }

    // 상태 결정
    let status: 'healthy' | 'warning' | 'critical' = 'healthy';
    let message = 'Cache is operating normally';

    if (alerts.some((a) => a.severity === 'high')) {
      status = 'critical';
      message = 'Cache has critical issues that require attention';
    } else if (alerts.some((a) => a.severity === 'medium')) {
      status = 'warning';
      message = 'Cache has warnings that should be monitored';
    }

    return { status, message, metrics, alerts };
  }

  // ============================================================================
  // 3.3 Auto-Collection
  // ============================================================================

  /**
   * 자동 메트릭 수집 시작
   */
  startAutoCollection(): void {
    if (this.collectIntervalId) {
      return; // Already running
    }

    console.log(`📊 [CacheMonitor] Starting auto-collection every ${this.config.collectInterval / 1000}s`);

    this.collectIntervalId = setInterval(() => {
      const metrics = this.collectMetrics();
      console.log(
        `📊 [CacheMonitor] Hit Rate: ${(metrics.hitRate * 100).toFixed(1)}%, ` +
        `Entries: ${metrics.totalEntries} (M:${metrics.entriesByType.metrics}/R:${metrics.entriesByType.rag}/A:${metrics.entriesByType.analysis})`
      );
    }, this.config.collectInterval);
  }

  /**
   * 자동 메트릭 수집 중지
   */
  stopAutoCollection(): void {
    if (this.collectIntervalId) {
      clearInterval(this.collectIntervalId);
      this.collectIntervalId = null;
      console.log('📊 [CacheMonitor] Auto-collection stopped');
    }
  }

  // ============================================================================
  // 3.4 Reporting
  // ============================================================================

  /**
   * 상세 리포트 생성
   */
  generateReport(): string {
    const health = this.checkHealth();
    const avgHitRate = this.getAverageHitRate(10);

    const lines = [
      '═══════════════════════════════════════════════════════════════',
      '                    CACHE MONITORING REPORT                     ',
      '═══════════════════════════════════════════════════════════════',
      '',
      `📅 Timestamp: ${health.metrics.timestamp}`,
      `🔔 Status: ${health.status.toUpperCase()}`,
      `📝 Message: ${health.message}`,
      '',
      '───────────────────────────────────────────────────────────────',
      '                       CURRENT METRICS                          ',
      '───────────────────────────────────────────────────────────────',
      `  Hit Rate (Current):  ${(health.metrics.hitRate * 100).toFixed(1)}%`,
      `  Hit Rate (Avg 10):   ${(avgHitRate * 100).toFixed(1)}%`,
      `  Total Hits:          ${health.metrics.hitCount}`,
      `  Total Misses:        ${health.metrics.missCount}`,
      `  Total Entries:       ${health.metrics.totalEntries}`,
      '',
      '───────────────────────────────────────────────────────────────',
      '                      ENTRIES BY TYPE                           ',
      '───────────────────────────────────────────────────────────────',
      `  Metrics (TTL 1m):    ${health.metrics.entriesByType.metrics}`,
      `  RAG (TTL 5m):        ${health.metrics.entriesByType.rag}`,
      `  Analysis (TTL 10m):  ${health.metrics.entriesByType.analysis}`,
      '',
      '───────────────────────────────────────────────────────────────',
      '                      MEMORY ESTIMATE                           ',
      '───────────────────────────────────────────────────────────────',
      `  Estimated Size:      ${(health.metrics.memoryEstimate.estimatedBytes / 1024).toFixed(2)} KB`,
    ];

    if (health.alerts.length > 0) {
      lines.push('');
      lines.push('───────────────────────────────────────────────────────────────');
      lines.push('                          ALERTS                               ');
      lines.push('───────────────────────────────────────────────────────────────');
      for (const alert of health.alerts) {
        const icon = alert.severity === 'high' ? '🔴' : alert.severity === 'medium' ? '🟡' : '🔵';
        lines.push(`  ${icon} [${alert.severity.toUpperCase()}] ${alert.message}`);
      }
    }

    lines.push('');
    lines.push('═══════════════════════════════════════════════════════════════');

    return lines.join('\n');
  }

  /**
   * JSON 형식 리포트
   */
  toJSON(): {
    health: CacheHealthStatus;
    averageHitRate: number;
    historySize: number;
    config: MonitorConfig;
  } {
    return {
      health: this.checkHealth(),
      averageHitRate: this.getAverageHitRate(10),
      historySize: this.metricsHistory.length,
      config: this.config,
    };
  }
}

// ============================================================================
// 4. Singleton Instance
// ============================================================================

let monitorInstance: CacheMonitor | null = null;

/**
 * 글로벌 캐시 모니터 인스턴스 반환
 */
export function getCacheMonitor(config?: Partial<MonitorConfig>): CacheMonitor {
  if (!monitorInstance) {
    monitorInstance = new CacheMonitor(config);
    console.log('📊 [CacheMonitor] Initialized');
  }
  return monitorInstance;
}

/**
 * 캐시 모니터 인스턴스 리셋 (테스트용)
 */
export function resetCacheMonitor(): void {
  if (monitorInstance) {
    monitorInstance.stopAutoCollection();
    monitorInstance = null;
    console.log('📊 [CacheMonitor] Reset');
  }
}

// ============================================================================
// 5. Utility Functions
// ============================================================================

/**
 * 간단한 캐시 상태 확인 (API 엔드포인트용)
 */
export function getCacheStatus(): {
  status: 'healthy' | 'warning' | 'critical';
  hitRate: number;
  entryCount: number;
  alertCount: number;
} {
  const monitor = getCacheMonitor();
  const health = monitor.checkHealth();

  return {
    status: health.status,
    hitRate: health.metrics.hitRate,
    entryCount: health.metrics.totalEntries,
    alertCount: health.alerts.length,
  };
}

/**
 * 캐시 메트릭을 Prometheus 형식으로 출력
 */
export function getCacheMetricsPrometheus(): string {
  const monitor = getCacheMonitor();
  const metrics = monitor.collectMetrics();

  return [
    '# HELP ai_engine_cache_hit_rate Cache hit rate',
    '# TYPE ai_engine_cache_hit_rate gauge',
    `ai_engine_cache_hit_rate ${metrics.hitRate}`,
    '',
    '# HELP ai_engine_cache_entries Total cache entries',
    '# TYPE ai_engine_cache_entries gauge',
    `ai_engine_cache_entries{type="metrics"} ${metrics.entriesByType.metrics}`,
    `ai_engine_cache_entries{type="rag"} ${metrics.entriesByType.rag}`,
    `ai_engine_cache_entries{type="analysis"} ${metrics.entriesByType.analysis}`,
    '',
    '# HELP ai_engine_cache_hits_total Total cache hits',
    '# TYPE ai_engine_cache_hits_total counter',
    `ai_engine_cache_hits_total ${metrics.hitCount}`,
    '',
    '# HELP ai_engine_cache_misses_total Total cache misses',
    '# TYPE ai_engine_cache_misses_total counter',
    `ai_engine_cache_misses_total ${metrics.missCount}`,
  ].join('\n');
}
