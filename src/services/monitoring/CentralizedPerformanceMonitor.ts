/**
 * 📊 중앙 집중식 성능 모니터링 v1.0
 *
 * 모든 성능 모니터링을 통합 관리:
 * - 기존 PerformanceMonitor 통합
 * - AI 엔진 성능 추적
 * - 시스템 리소스 모니터링
 * - 최적화 효과 측정
 * - 실시간 성능 대시보드
 */

import { unifiedNotificationService } from '@/services/notifications/UnifiedNotificationService';
import { aiStateManager } from '@/services/ai/AIStateManager';

// 성능 메트릭 타입들
export interface SystemMetrics {
  timestamp: Date;
  cpu: {
    usage: number; // 백분율
    cores: number;
    loadAverage: number[];
  };
  memory: {
    used: number; // MB
    total: number; // MB
    usage: number; // 백분율
    heapUsed: number; // MB
    heapTotal: number; // MB
  };
  network: {
    bytesIn: number;
    bytesOut: number;
    requestsPerSecond: number;
    activeConnections: number;
  };
  disk: {
    used: number; // MB
    total: number; // MB
    usage: number; // 백분율
    ioOperations: number;
  };
}

export interface ApplicationMetrics {
  timestamp: Date;
  api: {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    averageResponseTime: number;
    slowestEndpoint: string;
    fastestEndpoint: string;
    errorRate: number;
  };
  database: {
    connectionPool: {
      active: number;
      idle: number;
      total: number;
    };
    queryPerformance: {
      averageTime: number;
      slowestQuery: string;
      totalQueries: number;
    };
  };
  cache: {
    redis: {
      hitRate: number;
      missRate: number;
      evictions: number;
      memoryUsage: number;
    };
    application: {
      hitRate: number;
      size: number;
      entries: number;
    };
  };
}

export interface AIMetrics {
  timestamp: Date;
  engines: {
    [engineId: string]: {
      requests: number;
      responses: number;
      averageResponseTime: number;
      errorRate: number;
      throughput: number;
      memoryUsage: number;
      accuracy: number;
    };
  };
  overall: {
    totalRequests: number;
    averageResponseTime: number;
    systemThroughput: number;
    overallAccuracy: number;
    activeEngines: number;
  };
}

export interface PerformanceMetrics {
  id: string;
  timestamp: Date;
  system: SystemMetrics;
  application: ApplicationMetrics;
  ai: AIMetrics;
  custom: Record<string, any>;
}

export interface PerformanceAlert {
  id: string;
  type: 'system' | 'application' | 'ai' | 'custom';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  metrics: any;
  threshold: any;
  timestamp: Date;
  resolved: boolean;
}

export interface OptimizationReport {
  id: string;
  period: {
    start: Date;
    end: Date;
  };
  baseline: PerformanceMetrics;
  current: PerformanceMetrics;
  improvements: {
    category: string;
    metric: string;
    improvement: number; // 백분율
    description: string;
  }[];
  recommendations: string[];
  overallScore: number; // 0-100
}

// 모니터링 설정
export interface MonitoringConfig {
  enabled: boolean;
  intervals: {
    systemMetrics: number; // ms
    applicationMetrics: number; // ms
    aiMetrics: number; // ms
    optimization: number; // ms
  };
  retention: {
    raw: number; // 일
    aggregated: number; // 일
    reports: number; // 일
  };
  alerts: {
    enabled: boolean;
    thresholds: {
      cpu: number;
      memory: number;
      disk: number;
      responseTime: number;
      errorRate: number;
      aiAccuracy: number;
    };
  };
  optimization: {
    enabled: boolean;
    autoOptimize: boolean;
    reportFrequency: number; // 시간
  };
}

/**
 * 📊 중앙 집중식 성능 모니터링
 */
export class CentralizedPerformanceMonitor {
  private static instance: CentralizedPerformanceMonitor;

  // 설정 및 상태
  private config: MonitoringConfig;
  private isMonitoring = false;
  private startTime = Date.now();

  // 데이터 저장소
  private metricsHistory: PerformanceMetrics[] = [];
  private activeAlerts: Map<string, PerformanceAlert> = new Map();
  private optimizationReports: OptimizationReport[] = [];

  // 스케줄러
  private systemMetricsInterval: NodeJS.Timeout | null = null;
  private applicationMetricsInterval: NodeJS.Timeout | null = null;
  private aiMetricsInterval: NodeJS.Timeout | null = null;
  private optimizationInterval: NodeJS.Timeout | null = null;

  // 통계
  private stats = {
    totalMetricsCollected: 0,
    totalAlertsGenerated: 0,
    totalOptimizationReports: 0,
    uptime: Date.now(),
    lastOptimization: null as Date | null,
  };

  private constructor() {
    this.config = this.loadDefaultConfig();
    console.log('📊 중앙 집중식 성능 모니터링 초기화 완료');
  }

  /**
   * 🏭 싱글톤 인스턴스 획득
   */
  static getInstance(): CentralizedPerformanceMonitor {
    if (!CentralizedPerformanceMonitor.instance) {
      CentralizedPerformanceMonitor.instance =
        new CentralizedPerformanceMonitor();
    }
    return CentralizedPerformanceMonitor.instance;
  }

  /**
   * 🚀 모니터링 시작
   */
  async startMonitoring(): Promise<void> {
    if (this.isMonitoring) {
      console.log('⚠️ 성능 모니터링이 이미 실행 중입니다.');
      return;
    }

    console.log('🚀 성능 모니터링 시작...');
    this.isMonitoring = true;
    this.startTime = Date.now();

    // 초기 메트릭 수집
    await this.collectAllMetrics();

    // 주기적 메트릭 수집 스케줄링
    this.scheduleMetricsCollection();

    // 최적화 리포트 스케줄링
    if (this.config.optimization.enabled) {
      this.scheduleOptimizationReports();
    }

    // 시작 알림
    await unifiedNotificationService.sendSystemAlert(
      '성능 모니터링 시작',
      '시스템 성능 모니터링을 시작했습니다.',
      'info'
    );

    console.log('✅ 성능 모니터링 시작 완료');
  }

  /**
   * 🛑 모니터링 중지
   */
  async stopMonitoring(): Promise<void> {
    if (!this.isMonitoring) {
      console.log('⚠️ 성능 모니터링이 실행 중이 아닙니다.');
      return;
    }

    console.log('🛑 성능 모니터링 중지...');
    this.isMonitoring = false;

    // 모든 스케줄러 정리
    this.clearAllSchedulers();

    // 중지 알림
    await unifiedNotificationService.sendSystemAlert(
      '성능 모니터링 중지',
      '시스템 성능 모니터링을 중지했습니다.',
      'info'
    );

    console.log('✅ 성능 모니터링 중지 완료');
  }

  /**
   * 📊 전체 메트릭 수집
   */
  async collectAllMetrics(): Promise<PerformanceMetrics> {
    const startTime = Date.now();

    try {
      console.log('📊 성능 메트릭 수집 시작...');

      // 병렬로 모든 메트릭 수집
      const [systemMetrics, applicationMetrics, aiMetrics] = await Promise.all([
        this.collectSystemMetrics(),
        this.collectApplicationMetrics(),
        this.collectAIMetrics(),
      ]);

      const metrics: PerformanceMetrics = {
        id: `metrics-${Date.now()}`,
        timestamp: new Date(),
        system: systemMetrics,
        application: applicationMetrics,
        ai: aiMetrics,
        custom: {},
      };

      // 메트릭 저장
      this.metricsHistory.push(metrics);
      this.stats.totalMetricsCollected++;

      // 오래된 메트릭 정리
      this.cleanupOldMetrics();

      // 알림 처리
      await this.processPerformanceAlerts(metrics);

      const duration = Date.now() - startTime;
      console.log(`✅ 성능 메트릭 수집 완료 (${duration}ms)`);

      return metrics;
    } catch (error) {
      console.error('❌ 성능 메트릭 수집 실패:', error);
      throw error;
    }
  }

  /**
   * 🖥️ 시스템 메트릭 수집
   */
  private async collectSystemMetrics(): Promise<SystemMetrics> {
    const memoryUsage = process.memoryUsage();
    const os = require('os');

    // 네트워크 메트릭 수집
    const networkMetrics = await this.collectNetworkMetrics();

    // 디스크 메트릭 수집
    const diskMetrics = await this.collectDiskMetrics();

    return {
      timestamp: new Date(),
      cpu: {
        usage: await this.getCPUUsage(),
        cores: os.cpus().length,
        loadAverage: os.loadavg(),
      },
      memory: {
        used: Math.round(memoryUsage.rss / 1024 / 1024),
        total: Math.round(os.totalmem() / 1024 / 1024),
        usage: Math.round((memoryUsage.rss / os.totalmem()) * 100),
        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
      },
      network: {
        bytesIn: networkMetrics.bytesIn,
        bytesOut: networkMetrics.bytesOut,
        requestsPerSecond: this.calculateRequestsPerSecond(),
        activeConnections: networkMetrics.activeConnections,
      },
      disk: {
        used: diskMetrics.used,
        total: diskMetrics.total,
        usage: diskMetrics.usage,
        ioOperations: diskMetrics.ioOperations,
      },
    };
  }

  /**
   * 🌐 네트워크 메트릭 수집
   */
  private async collectNetworkMetrics(): Promise<{
    bytesIn: number;
    bytesOut: number;
    activeConnections: number;
  }> {
    try {
      const os = require('os');
      const networkInterfaces = os.networkInterfaces();

      let totalBytesIn = 0;
      let totalBytesOut = 0;
      let activeConnections = 0;

      // 네트워크 인터페이스별 통계 수집
      for (const [interfaceName, interfaces] of Object.entries(
        networkInterfaces
      )) {
        if (interfaces && Array.isArray(interfaces)) {
          for (const iface of interfaces) {
            if (!iface.internal) {
              // 실제 네트워크 트래픽 추정 (프로덕션에서는 더 정확한 방법 필요)
              totalBytesIn += Math.floor(Math.random() * 1000000); // 임시 값
              totalBytesOut += Math.floor(Math.random() * 500000); // 임시 값
            }
          }
        }
      }

      // 활성 연결 수 추정 (Node.js 프로세스 기준)
      activeConnections =
        process.listenerCount('connection') ||
        Math.floor(Math.random() * 50) + 10;

      return {
        bytesIn: totalBytesIn,
        bytesOut: totalBytesOut,
        activeConnections,
      };
    } catch (error) {
      console.warn('⚠️ 네트워크 메트릭 수집 실패:', error);
      return {
        bytesIn: 0,
        bytesOut: 0,
        activeConnections: 0,
      };
    }
  }

  /**
   * 💾 디스크 메트릭 수집
   */
  private async collectDiskMetrics(): Promise<{
    used: number;
    total: number;
    usage: number;
    ioOperations: number;
  }> {
    try {
      const fs = require('fs');
      const path = require('path');

      // 현재 작업 디렉토리의 디스크 사용량 확인
      const stats = await this.getDiskUsage(process.cwd());

      // I/O 작업 수 추정 (실제로는 시스템 모니터링 도구 필요)
      const ioOperations = Math.floor(Math.random() * 1000) + 100;

      return {
        used: Math.round(stats.used / 1024 / 1024), // MB
        total: Math.round(stats.total / 1024 / 1024), // MB
        usage: Math.round((stats.used / stats.total) * 100),
        ioOperations,
      };
    } catch (error) {
      console.warn('⚠️ 디스크 메트릭 수집 실패:', error);
      return {
        used: 0,
        total: 0,
        usage: 0,
        ioOperations: 0,
      };
    }
  }

  /**
   * 📁 디스크 사용량 계산
   */
  private async getDiskUsage(
    dirPath: string
  ): Promise<{ used: number; total: number }> {
    try {
      const fs = require('fs').promises;
      const path = require('path');

      // 재귀적으로 디렉토리 크기 계산
      const calculateDirSize = async (dir: string): Promise<number> => {
        let size = 0;
        try {
          const items = await fs.readdir(dir);
          for (const item of items) {
            const itemPath = path.join(dir, item);
            try {
              const stat = await fs.stat(itemPath);
              if (stat.isDirectory()) {
                // node_modules 등 큰 디렉토리는 건너뛰기
                if (!item.includes('node_modules') && !item.includes('.git')) {
                  size += await calculateDirSize(itemPath);
                }
              } else {
                size += stat.size;
              }
            } catch (err) {
              // 권한 오류 등 무시
            }
          }
        } catch (err) {
          // 디렉토리 읽기 오류 무시
        }
        return size;
      };

      const used = await calculateDirSize(dirPath);

      // 전체 디스크 크기 추정 (실제로는 statvfs 등 시스템 호출 필요)
      const os = require('os');
      const total = os.totalmem() * 10; // 메모리의 10배로 추정

      return { used, total };
    } catch (error) {
      console.warn('⚠️ 디스크 사용량 계산 실패:', error);
      return { used: 0, total: 1 };
    }
  }

  /**
   * 🔧 애플리케이션 메트릭 수집
   */
  private async collectApplicationMetrics(): Promise<ApplicationMetrics> {
    // 기존 메트릭에서 계산
    const recentMetrics = this.metricsHistory.slice(-10);
    const apiMetrics = this.calculateAPIMetrics(recentMetrics);

    // 데이터베이스 메트릭 수집
    const databaseMetrics = await this.collectDatabaseMetrics();

    // 캐시 메트릭 수집
    const cacheMetrics = await this.collectCacheMetrics();

    return {
      timestamp: new Date(),
      api: apiMetrics,
      database: {
        connectionPool: {
          active: databaseMetrics.connectionPool.active,
          idle: databaseMetrics.connectionPool.idle,
          total: databaseMetrics.connectionPool.total,
        },
        queryPerformance: {
          averageTime: databaseMetrics.queryPerformance.averageTime,
          slowestQuery: databaseMetrics.queryPerformance.slowestQuery,
          totalQueries: databaseMetrics.queryPerformance.totalQueries,
        },
      },
      cache: {
        redis: {
          hitRate: cacheMetrics.redis.hitRate,
          missRate: cacheMetrics.redis.missRate,
          evictions: cacheMetrics.redis.evictions,
          memoryUsage: cacheMetrics.redis.memoryUsage,
        },
        application: {
          hitRate: cacheMetrics.application.hitRate,
          size: cacheMetrics.application.size,
          entries: cacheMetrics.application.entries,
        },
      },
    };
  }

  /**
   * 🗄️ 데이터베이스 메트릭 수집
   */
  private async collectDatabaseMetrics(): Promise<{
    connectionPool: {
      active: number;
      idle: number;
      total: number;
    };
    queryPerformance: {
      averageTime: number;
      slowestQuery: string;
      totalQueries: number;
    };
  }> {
    try {
      // Supabase/PostgreSQL 연결 풀 상태 시뮬레이션
      const poolSize = 20; // 기본 풀 크기
      const activeConnections = Math.floor(Math.random() * 15) + 2; // 2-16개 활성 연결
      const idleConnections = poolSize - activeConnections;

      // 쿼리 성능 메트릭 시뮬레이션
      const queryMetrics = this.simulateQueryPerformance();

      return {
        connectionPool: {
          active: activeConnections,
          idle: idleConnections,
          total: poolSize,
        },
        queryPerformance: {
          averageTime: queryMetrics.averageTime,
          slowestQuery: queryMetrics.slowestQuery,
          totalQueries: queryMetrics.totalQueries,
        },
      };
    } catch (error) {
      console.warn('⚠️ 데이터베이스 메트릭 수집 실패:', error);
      return {
        connectionPool: { active: 0, idle: 0, total: 0 },
        queryPerformance: { averageTime: 0, slowestQuery: '', totalQueries: 0 },
      };
    }
  }

  /**
   * 🏃‍♂️ 쿼리 성능 시뮬레이션
   */
  private simulateQueryPerformance(): {
    averageTime: number;
    slowestQuery: string;
    totalQueries: number;
  } {
    const queries = [
      'SELECT * FROM servers WHERE status = ?',
      'SELECT COUNT(*) FROM metrics WHERE timestamp > ?',
      'INSERT INTO logs (level, message, timestamp) VALUES (?, ?, ?)',
      'UPDATE servers SET last_seen = ? WHERE id = ?',
      'SELECT * FROM ai_engines WHERE active = true',
      'DELETE FROM old_metrics WHERE timestamp < ?',
    ];

    const queryTimes = Array.from(
      { length: 50 },
      () => Math.random() * 200 + 10
    ); // 10-210ms
    const averageTime = Math.round(
      queryTimes.reduce((a, b) => a + b, 0) / queryTimes.length
    );
    const slowestTime = Math.max(...queryTimes);
    const slowestQuery = queries[Math.floor(Math.random() * queries.length)];

    return {
      averageTime,
      slowestQuery: `${slowestQuery} (${Math.round(slowestTime)}ms)`,
      totalQueries: queryTimes.length + Math.floor(Math.random() * 100),
    };
  }

  /**
   * 💾 캐시 메트릭 수집
   */
  private async collectCacheMetrics(): Promise<{
    redis: {
      hitRate: number;
      missRate: number;
      evictions: number;
      memoryUsage: number;
    };
    application: {
      hitRate: number;
      size: number;
      entries: number;
    };
  }> {
    try {
      // Redis 메트릭 시뮬레이션
      const redisMetrics = await this.collectRedisMetrics();

      // 애플리케이션 캐시 메트릭 시뮬레이션
      const appCacheMetrics = this.collectApplicationCacheMetrics();

      return {
        redis: redisMetrics,
        application: appCacheMetrics,
      };
    } catch (error) {
      console.warn('⚠️ 캐시 메트릭 수집 실패:', error);
      return {
        redis: { hitRate: 0, missRate: 0, evictions: 0, memoryUsage: 0 },
        application: { hitRate: 0, size: 0, entries: 0 },
      };
    }
  }

  /**
   * 🔴 Redis 메트릭 수집
   */
  private async collectRedisMetrics(): Promise<{
    hitRate: number;
    missRate: number;
    evictions: number;
    memoryUsage: number;
  }> {
    try {
      // Mock Redis 또는 실제 Redis 상태에 따라 메트릭 생성
      const isMockRedis = process.env.USE_MOCK_REDIS === 'true';

      if (isMockRedis) {
        // Mock Redis 메트릭
        const hitRate = 0.85 + Math.random() * 0.1; // 85-95%
        const missRate = 1 - hitRate;
        const evictions = Math.floor(Math.random() * 10); // 0-9개
        const memoryUsage = Math.floor(Math.random() * 50) + 10; // 10-60MB

        return {
          hitRate: Math.round(hitRate * 100) / 100,
          missRate: Math.round(missRate * 100) / 100,
          evictions,
          memoryUsage,
        };
      } else {
        // 실제 Redis 메트릭 (향후 구현)
        return {
          hitRate: 0.9,
          missRate: 0.1,
          evictions: 2,
          memoryUsage: 25,
        };
      }
    } catch (error) {
      console.warn('⚠️ Redis 메트릭 수집 실패:', error);
      return {
        hitRate: 0,
        missRate: 0,
        evictions: 0,
        memoryUsage: 0,
      };
    }
  }

  /**
   * 📱 애플리케이션 캐시 메트릭 수집
   */
  private collectApplicationCacheMetrics(): {
    hitRate: number;
    size: number;
    entries: number;
  } {
    try {
      // Node.js 메모리 기반 캐시 시뮬레이션
      const memoryUsage = process.memoryUsage();
      const cacheSize = Math.floor(memoryUsage.heapUsed * 0.1); // 힙의 10%를 캐시로 가정
      const entries = Math.floor(Math.random() * 1000) + 100; // 100-1099개 엔트리
      const hitRate = 0.92 + Math.random() * 0.06; // 92-98%

      return {
        hitRate: Math.round(hitRate * 100) / 100,
        size: Math.round(cacheSize / 1024 / 1024), // MB
        entries,
      };
    } catch (error) {
      console.warn('⚠️ 애플리케이션 캐시 메트릭 수집 실패:', error);
      return {
        hitRate: 0,
        size: 0,
        entries: 0,
      };
    }
  }

  /**
   * 🤖 AI 메트릭 수집
   */
  private async collectAIMetrics(): Promise<AIMetrics> {
    const aiSystemState = aiStateManager.getSystemState();
    const engines: { [engineId: string]: any } = {};

    // 각 엔진 메트릭 수집
    for (const engine of aiSystemState.engines) {
      engines[engine.id] = {
        requests: engine.performance.totalRequests,
        responses: engine.performance.successfulRequests,
        averageResponseTime: engine.performance.averageResponseTime,
        errorRate: engine.health.errorRate,
        throughput: engine.performance.throughput,
        memoryUsage: engine.performance.memoryUsage || 0,
        accuracy: this.calculateEngineAccuracy(engine.id),
      };
    }

    return {
      timestamp: new Date(),
      engines,
      overall: {
        totalRequests: aiSystemState.performance.systemThroughput,
        averageResponseTime: aiSystemState.performance.averageResponseTime,
        systemThroughput: aiSystemState.performance.systemThroughput,
        overallAccuracy: this.calculateOverallAccuracy(engines),
        activeEngines: aiSystemState.overall.activeEngines,
      },
    };
  }

  /**
   * 🚨 성능 알림 처리
   */
  private async processPerformanceAlerts(
    metrics: PerformanceMetrics
  ): Promise<void> {
    const alerts: PerformanceAlert[] = [];

    // CPU 사용량 알림
    if (metrics.system.cpu.usage > this.config.alerts.thresholds.cpu) {
      alerts.push({
        id: `cpu-${Date.now()}`,
        type: 'system',
        severity: 'warning',
        title: 'CPU 사용량 초과',
        message: `CPU 사용량이 ${metrics.system.cpu.usage.toFixed(1)}%입니다.`,
        metrics: metrics.system.cpu,
        threshold: this.config.alerts.thresholds.cpu,
        timestamp: new Date(),
        resolved: false,
      });
    }

    // 메모리 사용량 알림
    if (metrics.system.memory.usage > this.config.alerts.thresholds.memory) {
      alerts.push({
        id: `memory-${Date.now()}`,
        type: 'system',
        severity: 'warning',
        title: '메모리 사용량 초과',
        message: `메모리 사용량이 ${metrics.system.memory.usage}%입니다.`,
        metrics: metrics.system.memory,
        threshold: this.config.alerts.thresholds.memory,
        timestamp: new Date(),
        resolved: false,
      });
    }

    // 응답 시간 알림
    if (
      metrics.application.api.averageResponseTime >
      this.config.alerts.thresholds.responseTime
    ) {
      alerts.push({
        id: `response-time-${Date.now()}`,
        type: 'application',
        severity: 'warning',
        title: 'API 응답 시간 초과',
        message: `평균 응답 시간이 ${metrics.application.api.averageResponseTime.toFixed(0)}ms입니다.`,
        metrics: metrics.application.api,
        threshold: this.config.alerts.thresholds.responseTime,
        timestamp: new Date(),
        resolved: false,
      });
    }

    // AI 정확도 알림
    if (
      metrics.ai.overall.overallAccuracy <
      this.config.alerts.thresholds.aiAccuracy
    ) {
      alerts.push({
        id: `ai-accuracy-${Date.now()}`,
        type: 'ai',
        severity: 'warning',
        title: 'AI 정확도 저하',
        message: `AI 전체 정확도가 ${(metrics.ai.overall.overallAccuracy * 100).toFixed(1)}%입니다.`,
        metrics: metrics.ai.overall,
        threshold: this.config.alerts.thresholds.aiAccuracy,
        timestamp: new Date(),
        resolved: false,
      });
    }

    // 알림 전송
    for (const alert of alerts) {
      this.activeAlerts.set(alert.id, alert);
      this.stats.totalAlertsGenerated++;

      await unifiedNotificationService.sendNotification({
        id: alert.id,
        type: 'performance',
        severity: alert.severity,
        title: alert.title,
        message: alert.message,
        data: { metrics: alert.metrics, threshold: alert.threshold },
        deduplicationKey: `performance-${alert.type}-${alert.severity}`,
        cooldownMs: 300000, // 5분
      });
    }
  }

  /**
   * 📈 최적화 리포트 생성
   */
  async generateOptimizationReport(): Promise<OptimizationReport> {
    console.log('📈 최적화 리포트 생성 중...');

    const now = new Date();
    const period = {
      start: new Date(
        now.getTime() -
          this.config.optimization.reportFrequency * 60 * 60 * 1000
      ),
      end: now,
    };

    // 기준점과 현재 메트릭 계산
    const baselineMetrics = this.getBaselineMetrics(period.start);
    const currentMetrics = this.metricsHistory[this.metricsHistory.length - 1];

    if (!baselineMetrics || !currentMetrics) {
      throw new Error('충분한 메트릭 데이터가 없습니다.');
    }

    // 개선사항 계산
    const improvements = this.calculateImprovements(
      baselineMetrics,
      currentMetrics
    );

    // 추천사항 생성
    const recommendations = this.generateRecommendations(currentMetrics);

    // 전체 점수 계산
    const overallScore = this.calculateOverallScore(improvements);

    const report: OptimizationReport = {
      id: `optimization-${Date.now()}`,
      period,
      baseline: baselineMetrics,
      current: currentMetrics,
      improvements,
      recommendations,
      overallScore,
    };

    // 리포트 저장
    this.optimizationReports.push(report);
    this.stats.totalOptimizationReports++;
    this.stats.lastOptimization = now;

    // 오래된 리포트 정리
    if (this.optimizationReports.length > 100) {
      this.optimizationReports = this.optimizationReports.slice(-100);
    }

    // 리포트 알림
    await unifiedNotificationService.sendSystemAlert(
      '최적화 리포트 생성',
      `성능 점수: ${overallScore.toFixed(1)}/100, ${improvements.length}개 개선사항 발견`,
      'info'
    );

    console.log(
      `✅ 최적화 리포트 생성 완료 (점수: ${overallScore.toFixed(1)}/100)`
    );
    return report;
  }

  /**
   * 🔄 스케줄링 메서드들
   */
  private scheduleMetricsCollection(): void {
    // 시스템 메트릭
    this.systemMetricsInterval = setInterval(async () => {
      try {
        await this.collectAllMetrics();
      } catch (error) {
        console.error('❌ 시스템 메트릭 수집 실패:', error);
      }
    }, this.config.intervals.systemMetrics);

    console.log(
      `⏰ 메트릭 수집 스케줄링 완료 (${this.config.intervals.systemMetrics}ms 간격)`
    );
  }

  private scheduleOptimizationReports(): void {
    this.optimizationInterval = setInterval(
      async () => {
        try {
          await this.generateOptimizationReport();
        } catch (error) {
          console.error('❌ 최적화 리포트 생성 실패:', error);
        }
      },
      this.config.optimization.reportFrequency * 60 * 60 * 1000
    );

    console.log(
      `⏰ 최적화 리포트 스케줄링 완료 (${this.config.optimization.reportFrequency}시간 간격)`
    );
  }

  private clearAllSchedulers(): void {
    if (this.systemMetricsInterval) clearInterval(this.systemMetricsInterval);
    if (this.applicationMetricsInterval)
      clearInterval(this.applicationMetricsInterval);
    if (this.aiMetricsInterval) clearInterval(this.aiMetricsInterval);
    if (this.optimizationInterval) clearInterval(this.optimizationInterval);

    this.systemMetricsInterval = null;
    this.applicationMetricsInterval = null;
    this.aiMetricsInterval = null;
    this.optimizationInterval = null;
  }

  /**
   * 🔧 유틸리티 메서드들
   */
  private async getCPUUsage(): Promise<number> {
    // 간단한 CPU 사용량 계산 (실제 구현에서는 더 정확한 방법 사용)
    const startUsage = process.cpuUsage();
    await new Promise(resolve => setTimeout(resolve, 100));
    const endUsage = process.cpuUsage(startUsage);

    const totalTime = (endUsage.user + endUsage.system) / 1000;
    return Math.min(totalTime / 100, 100); // 백분율로 변환
  }

  private calculateRequestsPerSecond(): number {
    const recentMetrics = this.metricsHistory.slice(-60); // 최근 1분
    if (recentMetrics.length < 2) return 0;

    const totalRequests = recentMetrics.reduce(
      (sum, m) => sum + m.application.api.totalRequests,
      0
    );
    const timeSpan = (Date.now() - recentMetrics[0].timestamp.getTime()) / 1000;

    return timeSpan > 0 ? totalRequests / timeSpan : 0;
  }

  private calculateAPIMetrics(recentMetrics: PerformanceMetrics[]) {
    if (recentMetrics.length === 0) {
      return {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        averageResponseTime: 0,
        slowestEndpoint: '',
        fastestEndpoint: '',
        errorRate: 0,
      };
    }

    // 기존 메트릭에서 평균 계산
    const totalRequests = recentMetrics.reduce(
      (sum, m) => sum + m.application.api.totalRequests,
      0
    );
    const successfulRequests = Math.round(totalRequests * 0.95); // 95% 성공률 가정
    const failedRequests = totalRequests - successfulRequests;
    const averageResponseTime =
      recentMetrics.reduce(
        (sum, m) => sum + m.application.api.averageResponseTime,
        0
      ) / recentMetrics.length;

    return {
      totalRequests,
      successfulRequests,
      failedRequests,
      averageResponseTime,
      slowestEndpoint: '/api/ai/unified',
      fastestEndpoint: '/api/health',
      errorRate: failedRequests / totalRequests,
    };
  }

  private calculateEngineAccuracy(engineId: string): number {
    // AI 엔진별 정확도 계산 (임시 구현)
    const accuracyMap: { [key: string]: number } = {
      master: 0.85,
      unified: 0.9,
      opensource: 0.8,
    };
    return accuracyMap[engineId] || 0.75;
  }

  private calculateOverallAccuracy(engines: {
    [engineId: string]: any;
  }): number {
    const accuracies = Object.values(engines).map((e: any) => e.accuracy);
    return accuracies.length > 0
      ? accuracies.reduce((sum, acc) => sum + acc, 0) / accuracies.length
      : 0;
  }

  private getBaselineMetrics(startTime: Date): PerformanceMetrics | null {
    const baseline = this.metricsHistory.find(m => m.timestamp >= startTime);
    return baseline || null;
  }

  private calculateImprovements(
    baseline: PerformanceMetrics,
    current: PerformanceMetrics
  ) {
    const improvements: OptimizationReport['improvements'] = [];

    // CPU 개선
    const cpuImprovement =
      ((baseline.system.cpu.usage - current.system.cpu.usage) /
        baseline.system.cpu.usage) *
      100;
    if (cpuImprovement > 0) {
      improvements.push({
        category: 'system',
        metric: 'cpu',
        improvement: cpuImprovement,
        description: `CPU 사용량이 ${cpuImprovement.toFixed(1)}% 개선되었습니다.`,
      });
    }

    // 메모리 개선
    const memoryImprovement =
      ((baseline.system.memory.usage - current.system.memory.usage) /
        baseline.system.memory.usage) *
      100;
    if (memoryImprovement > 0) {
      improvements.push({
        category: 'system',
        metric: 'memory',
        improvement: memoryImprovement,
        description: `메모리 사용량이 ${memoryImprovement.toFixed(1)}% 개선되었습니다.`,
      });
    }

    // 응답 시간 개선
    const responseTimeImprovement =
      ((baseline.application.api.averageResponseTime -
        current.application.api.averageResponseTime) /
        baseline.application.api.averageResponseTime) *
      100;
    if (responseTimeImprovement > 0) {
      improvements.push({
        category: 'application',
        metric: 'responseTime',
        improvement: responseTimeImprovement,
        description: `API 응답 시간이 ${responseTimeImprovement.toFixed(1)}% 개선되었습니다.`,
      });
    }

    // AI 정확도 개선
    const accuracyImprovement =
      ((current.ai.overall.overallAccuracy -
        baseline.ai.overall.overallAccuracy) /
        baseline.ai.overall.overallAccuracy) *
      100;
    if (accuracyImprovement > 0) {
      improvements.push({
        category: 'ai',
        metric: 'accuracy',
        improvement: accuracyImprovement,
        description: `AI 정확도가 ${accuracyImprovement.toFixed(1)}% 개선되었습니다.`,
      });
    }

    return improvements;
  }

  private generateRecommendations(metrics: PerformanceMetrics): string[] {
    const recommendations: string[] = [];

    if (metrics.system.cpu.usage > 70) {
      recommendations.push(
        'CPU 사용량이 높습니다. 캐싱을 늘리거나 부하 분산을 고려하세요.'
      );
    }

    if (metrics.system.memory.usage > 80) {
      recommendations.push(
        '메모리 사용량이 높습니다. 메모리 최적화나 가비지 컬렉션 튜닝을 고려하세요.'
      );
    }

    if (metrics.application.api.averageResponseTime > 1000) {
      recommendations.push(
        'API 응답 시간이 느립니다. 데이터베이스 최적화나 캐싱 전략을 검토하세요.'
      );
    }

    if (metrics.ai.overall.overallAccuracy < 0.8) {
      recommendations.push(
        'AI 정확도가 낮습니다. 모델 재학습이나 파라미터 튜닝을 고려하세요.'
      );
    }

    if (recommendations.length === 0) {
      recommendations.push(
        '현재 시스템 성능이 양호합니다. 계속해서 모니터링하세요.'
      );
    }

    return recommendations;
  }

  private calculateOverallScore(
    improvements: OptimizationReport['improvements']
  ): number {
    if (improvements.length === 0) return 75; // 기본 점수

    const totalImprovement = improvements.reduce(
      (sum, imp) => sum + imp.improvement,
      0
    );
    const avgImprovement = totalImprovement / improvements.length;

    // 75점 기본 + 개선사항에 따른 추가 점수
    return Math.min(75 + avgImprovement, 100);
  }

  private cleanupOldMetrics(): void {
    const retentionPeriod = this.config.retention.raw * 24 * 60 * 60 * 1000; // 일 -> ms
    const cutoffTime = Date.now() - retentionPeriod;

    this.metricsHistory = this.metricsHistory.filter(
      m => m.timestamp.getTime() > cutoffTime
    );
  }

  private loadDefaultConfig(): MonitoringConfig {
    return {
      enabled: true,
      intervals: {
        systemMetrics: 30000, // 30초
        applicationMetrics: 60000, // 1분
        aiMetrics: 60000, // 1분
        optimization: 300000, // 5분
      },
      retention: {
        raw: 7, // 7일
        aggregated: 30, // 30일
        reports: 90, // 90일
      },
      alerts: {
        enabled: true,
        thresholds: {
          cpu: 80, // 80%
          memory: 85, // 85%
          disk: 90, // 90%
          responseTime: 2000, // 2초
          errorRate: 0.05, // 5%
          aiAccuracy: 0.7, // 70%
        },
      },
      optimization: {
        enabled: true,
        autoOptimize: false,
        reportFrequency: 24, // 24시간
      },
    };
  }

  /**
   * 📊 공개 API 메서드들
   */

  /**
   * 📈 현재 성능 상태 조회
   */
  getCurrentMetrics(): PerformanceMetrics | null {
    return this.metricsHistory[this.metricsHistory.length - 1] || null;
  }

  /**
   * 📊 성능 히스토리 조회
   */
  getMetricsHistory(hours = 24): PerformanceMetrics[] {
    const cutoffTime = Date.now() - hours * 60 * 60 * 1000;
    return this.metricsHistory.filter(m => m.timestamp.getTime() > cutoffTime);
  }

  /**
   * 🚨 활성 알림 조회
   */
  getActiveAlerts(): PerformanceAlert[] {
    return Array.from(this.activeAlerts.values()).filter(
      alert => !alert.resolved
    );
  }

  /**
   * 📈 최적화 리포트 조회
   */
  getOptimizationReports(limit = 10): OptimizationReport[] {
    return this.optimizationReports.slice(-limit);
  }

  /**
   * 📈 최신 최적화 리포트 조회
   */
  getLatestOptimizationReport(): OptimizationReport | null {
    return (
      this.optimizationReports[this.optimizationReports.length - 1] || null
    );
  }

  /**
   * ⚙️ 설정 업데이트
   */
  updateConfig(newConfig: Partial<MonitoringConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('⚙️ 성능 모니터링 설정 업데이트:', newConfig);

    // 모니터링 중이면 재시작
    if (this.isMonitoring) {
      this.clearAllSchedulers();
      this.scheduleMetricsCollection();

      if (this.config.optimization.enabled) {
        this.scheduleOptimizationReports();
      }
    }
  }

  /**
   * 📈 통계 조회
   */
  getStats() {
    return {
      ...this.stats,
      isMonitoring: this.isMonitoring,
      config: this.config,
      metricsCount: this.metricsHistory.length,
      activeAlertsCount: this.getActiveAlerts().length,
      systemUptime: Date.now() - this.stats.uptime,
      monitoringUptime: this.isMonitoring ? Date.now() - this.startTime : 0,
    };
  }

  /**
   * 🔄 전체 시스템 재시작
   */
  async restart(): Promise<void> {
    console.log('🔄 성능 모니터링 재시작...');

    await this.stopMonitoring();
    await this.startMonitoring();

    console.log('✅ 성능 모니터링 재시작 완료');
  }

  /**
   * 🧹 정리 및 종료
   */
  async shutdown(): Promise<void> {
    console.log('🛑 성능 모니터링 종료 중...');

    await this.stopMonitoring();
    this.metricsHistory = [];
    this.activeAlerts.clear();
    this.optimizationReports = [];

    console.log('✅성능 모니터링 종료 완료');
  }
}

// 싱글톤 인스턴스 export
export const centralizedPerformanceMonitor =
  CentralizedPerformanceMonitor.getInstance();

// 기본 export
export default centralizedPerformanceMonitor;
