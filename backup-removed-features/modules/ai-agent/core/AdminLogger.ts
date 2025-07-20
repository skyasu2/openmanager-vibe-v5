/**
 * AI Agent Admin Logger
 * 
 * 📊 관리자용 로깅 및 모니터링 시스템
 * - 모든 AI 상호작용 로깅
 * - 에러 및 실패 케이스 추적
 * - 성능 메트릭 수집
 * - 관리자 대시보드 데이터 제공
 */

export interface AIInteractionLog {
  id: string;
  timestamp: number;
  sessionId: string;
  userId?: string;
  userAgent?: string;
  ipAddress?: string;
  
  // 요청 정보
  query: string;
  queryType: string;
  mode: 'basic' | 'advanced';
  powerMode: 'active' | 'idle' | 'sleep';
  
  // 응답 정보
  response?: string;
  responseTime: number;
  success: boolean;
  error?: string;
  errorCode?: string;
  
  // AI 처리 정보
  intent: {
    name: string;
    confidence: number;
    entities: Record<string, any>;
  };
  
  // 사고 과정 정보
  thinkingSessionId?: string;
  thinkingSteps?: number;
  thinkingDuration?: number;
  
  // 메타데이터
  metadata: {
    serverData?: any;
    contextLength: number;
    tokensUsed?: number;
    cacheHit?: boolean;
    pluginsUsed: string[];
  };
}

export interface ErrorLog {
  id: string;
  timestamp: number;
  sessionId: string;
  userId?: string;
  
  // 에러 정보
  errorType: 'processing' | 'timeout' | 'validation' | 'system' | 'network';
  errorMessage: string;
  errorStack?: string;
  errorCode?: string;
  
  // 컨텍스트 정보
  query?: string;
  mode?: 'basic' | 'advanced';
  step?: string;
  
  // 시스템 상태
  systemInfo: {
    memoryUsage: number;
    cpuUsage?: number;
    activeSessions: number;
    powerMode: string;
  };
  
  // 복구 정보
  recovered: boolean;
  recoveryAction?: string;
  recoveryTime?: number;
}

export interface PerformanceMetrics {
  timestamp: number;
  period: '1m' | '5m' | '15m' | '1h' | '24h';
  
  // 요청 메트릭
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  
  // 모드별 메트릭
  basicModeRequests: number;
  advancedModeRequests: number;
  
  // 성능 메트릭
  averageThinkingTime: number;
  cacheHitRate: number;
  
  // 시스템 메트릭
  memoryUsage: number;
  activeSessions: number;
  powerModeDistribution: Record<string, number>;
}

export interface AdminStats {
  // 전체 통계
  totalInteractions: number;
  totalErrors: number;
  uptime: number;
  
  // 최근 24시간 통계
  recent24h: {
    interactions: number;
    errors: number;
    averageResponseTime: number;
    successRate: number;
  };
  
  // 모드별 통계
  modeStats: {
    basic: { count: number; avgResponseTime: number; successRate: number };
    advanced: { count: number; avgResponseTime: number; successRate: number };
  };
  
  // 에러 통계
  errorStats: {
    byType: Record<string, number>;
    byHour: number[];
    topErrors: Array<{ message: string; count: number }>;
  };
  
  // 성능 통계
  performanceStats: {
    averageResponseTime: number;
    p95ResponseTime: number;
    cacheHitRate: number;
    memoryUsage: number;
  };
}

export class AdminLogger {
  private interactionLogs: AIInteractionLog[] = [];
  private errorLogs: ErrorLog[] = [];
  private performanceMetrics: PerformanceMetrics[] = [];
  private maxLogSize = 10000; // 최대 로그 보관 개수
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    // 정기적인 메트릭 수집 시작
    this.startMetricsCollection();
    
    // 오래된 로그 정리 스케줄러
    this.startLogCleanup();
    
    this.isInitialized = true;
    console.log('📊 Admin Logger initialized');
  }

  /**
   * AI 상호작용 로깅
   */
  logInteraction(interaction: Omit<AIInteractionLog, 'id' | 'timestamp'>): string {
    const log: AIInteractionLog = {
      id: this.generateLogId(),
      timestamp: Date.now(),
      ...interaction
    };

    this.interactionLogs.push(log);
    this.trimLogs();
    
    return log.id;
  }

  /**
   * 에러 로깅
   */
  logError(error: Omit<ErrorLog, 'id' | 'timestamp'>): string {
    const log: ErrorLog = {
      id: this.generateLogId(),
      timestamp: Date.now(),
      ...error
    };

    this.errorLogs.push(log);
    this.trimLogs();
    
    console.error('🚨 AI Agent Error:', log);
    return log.id;
  }

  /**
   * 성능 메트릭 기록
   */
  recordPerformanceMetrics(metrics: Omit<PerformanceMetrics, 'timestamp'>): void {
    const metric: PerformanceMetrics = {
      timestamp: Date.now(),
      ...metrics
    };

    this.performanceMetrics.push(metric);
    
    // 메트릭은 더 오래 보관 (최대 1000개)
    if (this.performanceMetrics.length > 1000) {
      this.performanceMetrics = this.performanceMetrics.slice(-1000);
    }
  }

  /**
   * 관리자 통계 조회
   */
  getAdminStats(): AdminStats {
    const now = Date.now();
    const last24h = now - (24 * 60 * 60 * 1000);
    
    // 최근 24시간 로그 필터링
    const recent24hLogs = this.interactionLogs.filter(log => log.timestamp > last24h);
    const recent24hErrors = this.errorLogs.filter(log => log.timestamp > last24h);
    
    // 성공률 계산
    const successfulRecent = recent24hLogs.filter(log => log.success).length;
    const successRate = recent24hLogs.length > 0 ? (successfulRecent / recent24hLogs.length) * 100 : 0;
    
    // 평균 응답 시간 계산
    const avgResponseTime = recent24hLogs.length > 0
      ? recent24hLogs.reduce((sum, log) => sum + log.responseTime, 0) / recent24hLogs.length
      : 0;
    
    // 모드별 통계
    const basicLogs = this.interactionLogs.filter(log => log.mode === 'basic');
    const advancedLogs = this.interactionLogs.filter(log => log.mode === 'advanced');
    
    // 에러 통계
    const errorsByType: Record<string, number> = {};
    this.errorLogs.forEach(error => {
      errorsByType[error.errorType] = (errorsByType[error.errorType] || 0) + 1;
    });
    
    // 시간별 에러 분포 (최근 24시간)
    const errorsByHour = new Array(24).fill(0);
    recent24hErrors.forEach(error => {
      const hour = new Date(error.timestamp).getHours();
      errorsByHour[hour]++;
    });
    
    // 상위 에러 메시지
    const errorMessages: Record<string, number> = {};
    this.errorLogs.forEach(error => {
      errorMessages[error.errorMessage] = (errorMessages[error.errorMessage] || 0) + 1;
    });
    const topErrors = Object.entries(errorMessages)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([message, count]) => ({ message, count }));
    
    // 성능 통계
    const responseTimes = this.interactionLogs.map(log => log.responseTime).sort((a, b) => a - b);
    const p95Index = Math.floor(responseTimes.length * 0.95);
    const p95ResponseTime = responseTimes[p95Index] || 0;
    
    const cacheHits = this.interactionLogs.filter(log => log.metadata.cacheHit).length;
    const cacheHitRate = this.interactionLogs.length > 0 ? (cacheHits / this.interactionLogs.length) * 100 : 0;

    return {
      totalInteractions: this.interactionLogs.length,
      totalErrors: this.errorLogs.length,
      uptime:
        typeof process !== 'undefined' && typeof process.uptime === 'function'
          ? process.uptime() * 1000
          : 0,
      
      recent24h: {
        interactions: recent24hLogs.length,
        errors: recent24hErrors.length,
        averageResponseTime: Math.round(avgResponseTime),
        successRate: Math.round(successRate * 100) / 100
      },
      
      modeStats: {
        basic: {
          count: basicLogs.length,
          avgResponseTime: Math.round(basicLogs.reduce((sum, log) => sum + log.responseTime, 0) / (basicLogs.length || 1)),
          successRate: Math.round((basicLogs.filter(log => log.success).length / (basicLogs.length || 1)) * 10000) / 100
        },
        advanced: {
          count: advancedLogs.length,
          avgResponseTime: Math.round(advancedLogs.reduce((sum, log) => sum + log.responseTime, 0) / (advancedLogs.length || 1)),
          successRate: Math.round((advancedLogs.filter(log => log.success).length / (advancedLogs.length || 1)) * 10000) / 100
        }
      },
      
      errorStats: {
        byType: errorsByType,
        byHour: errorsByHour,
        topErrors
      },
      
      performanceStats: {
        averageResponseTime: Math.round(avgResponseTime),
        p95ResponseTime: Math.round(p95ResponseTime),
        cacheHitRate: Math.round(cacheHitRate * 100) / 100,
        memoryUsage:
          typeof process !== 'undefined' && typeof process.memoryUsage === 'function'
            ? process.memoryUsage().heapUsed / 1024 / 1024
            : 0
      }
    };
  }

  /**
   * 상호작용 로그 조회
   */
  getInteractionLogs(options: {
    limit?: number;
    offset?: number;
    userId?: string;
    mode?: 'basic' | 'advanced';
    success?: boolean;
    startTime?: number;
    endTime?: number;
  } = {}): { logs: AIInteractionLog[]; total: number } {
    let filteredLogs = [...this.interactionLogs];
    
    // 필터링
    if (options.userId) {
      filteredLogs = filteredLogs.filter(log => log.userId === options.userId);
    }
    
    if (options.mode) {
      filteredLogs = filteredLogs.filter(log => log.mode === options.mode);
    }
    
    if (options.success !== undefined) {
      filteredLogs = filteredLogs.filter(log => log.success === options.success);
    }
    
    if (options.startTime) {
      filteredLogs = filteredLogs.filter(log => log.timestamp >= options.startTime!);
    }
    
    if (options.endTime) {
      filteredLogs = filteredLogs.filter(log => log.timestamp <= options.endTime!);
    }
    
    // 정렬 (최신순)
    filteredLogs.sort((a, b) => b.timestamp - a.timestamp);
    
    // 페이징
    const offset = options.offset || 0;
    const limit = options.limit || 100;
    const paginatedLogs = filteredLogs.slice(offset, offset + limit);
    
    return {
      logs: paginatedLogs,
      total: filteredLogs.length
    };
  }

  /**
   * 에러 로그 조회
   */
  getErrorLogs(options: {
    limit?: number;
    offset?: number;
    errorType?: string;
    recovered?: boolean;
    startTime?: number;
    endTime?: number;
  } = {}): { logs: ErrorLog[]; total: number } {
    let filteredLogs = [...this.errorLogs];
    
    // 필터링
    if (options.errorType) {
      filteredLogs = filteredLogs.filter(log => log.errorType === options.errorType);
    }
    
    if (options.recovered !== undefined) {
      filteredLogs = filteredLogs.filter(log => log.recovered === options.recovered);
    }
    
    if (options.startTime) {
      filteredLogs = filteredLogs.filter(log => log.timestamp >= options.startTime!);
    }
    
    if (options.endTime) {
      filteredLogs = filteredLogs.filter(log => log.timestamp <= options.endTime!);
    }
    
    // 정렬 (최신순)
    filteredLogs.sort((a, b) => b.timestamp - a.timestamp);
    
    // 페이징
    const offset = options.offset || 0;
    const limit = options.limit || 100;
    const paginatedLogs = filteredLogs.slice(offset, offset + limit);
    
    return {
      logs: paginatedLogs,
      total: filteredLogs.length
    };
  }

  /**
   * 성능 메트릭 조회
   */
  getPerformanceMetrics(period: '1h' | '24h' | '7d' = '24h'): PerformanceMetrics[] {
    const now = Date.now();
    let startTime: number;
    
    switch (period) {
      case '1h':
        startTime = now - (60 * 60 * 1000);
        break;
      case '24h':
        startTime = now - (24 * 60 * 60 * 1000);
        break;
      case '7d':
        startTime = now - (7 * 24 * 60 * 60 * 1000);
        break;
    }
    
    return this.performanceMetrics
      .filter(metric => metric.timestamp >= startTime)
      .sort((a, b) => a.timestamp - b.timestamp);
  }

  /**
   * 로그 내보내기 (CSV 형식)
   */
  exportLogs(type: 'interactions' | 'errors', format: 'json' | 'csv' = 'json'): string {
    if (type === 'interactions') {
      if (format === 'csv') {
        const headers = ['timestamp', 'sessionId', 'userId', 'query', 'mode', 'success', 'responseTime', 'error'];
        const rows = this.interactionLogs.map(log => [
          new Date(log.timestamp).toISOString(),
          log.sessionId,
          log.userId || '',
          log.query.replace(/"/g, '""'),
          log.mode,
          log.success,
          log.responseTime,
          log.error || ''
        ]);
        
        return [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
      } else {
        return JSON.stringify(this.interactionLogs, null, 2);
      }
    } else {
      if (format === 'csv') {
        const headers = ['timestamp', 'sessionId', 'errorType', 'errorMessage', 'recovered'];
        const rows = this.errorLogs.map(log => [
          new Date(log.timestamp).toISOString(),
          log.sessionId,
          log.errorType,
          log.errorMessage.replace(/"/g, '""'),
          log.recovered
        ]);
        
        return [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
      } else {
        return JSON.stringify(this.errorLogs, null, 2);
      }
    }
  }

  private generateLogId(): string {
    return `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private trimLogs(): void {
    // 원자적 로그 트림 (동시성 안전)
    if (this.interactionLogs.length > this.maxLogSize) {
      const newInteractionLogs = [...this.interactionLogs.slice(-this.maxLogSize)];
      this.interactionLogs = newInteractionLogs;
    }
    
    if (this.errorLogs.length > this.maxLogSize) {
      const newErrorLogs = [...this.errorLogs.slice(-this.maxLogSize)];
      this.errorLogs = newErrorLogs;
    }
  }

  private startMetricsCollection(): void {
    // 1분마다 메트릭 수집
    setInterval(() => {
      this.collectCurrentMetrics();
    }, 60 * 1000);
  }

  private collectCurrentMetrics(): void {
    const now = Date.now();
    const last1m = now - (60 * 1000);
    
    const recentLogs = this.interactionLogs.filter(log => log.timestamp > last1m);
    const successfulLogs = recentLogs.filter(log => log.success);
    
    const basicLogs = recentLogs.filter(log => log.mode === 'basic');
    const advancedLogs = recentLogs.filter(log => log.mode === 'advanced');
    
    const avgResponseTime = recentLogs.length > 0
      ? recentLogs.reduce((sum, log) => sum + log.responseTime, 0) / recentLogs.length
      : 0;
    
    const avgThinkingTime = recentLogs.length > 0
      ? recentLogs.reduce((sum, log) => sum + (log.thinkingDuration || 0), 0) / recentLogs.length
      : 0;
    
    const cacheHits = recentLogs.filter(log => log.metadata.cacheHit).length;
    const cacheHitRate = recentLogs.length > 0 ? (cacheHits / recentLogs.length) * 100 : 0;
    
    this.recordPerformanceMetrics({
      period: '1m',
      totalRequests: recentLogs.length,
      successfulRequests: successfulLogs.length,
      failedRequests: recentLogs.length - successfulLogs.length,
      averageResponseTime: Math.round(avgResponseTime),
      basicModeRequests: basicLogs.length,
      advancedModeRequests: advancedLogs.length,
      averageThinkingTime: Math.round(avgThinkingTime),
      cacheHitRate: Math.round(cacheHitRate * 100) / 100,
      memoryUsage:
        typeof process !== 'undefined' && typeof process.memoryUsage === 'function'
          ? process.memoryUsage().heapUsed / 1024 / 1024
          : 0,
      activeSessions: 0, // 실제 세션 수로 업데이트 필요
      powerModeDistribution: {} // 실제 전원 모드 분포로 업데이트 필요
    });
  }

  private startLogCleanup(): void {
    // 30분마다 오래된 로그 정리
    setInterval(() => {
      this.cleanupOldLogs();
    }, 30 * 60 * 1000); // 30분마다 정리 (성능 최적화)
  }

  /**
   * 정리 작업
   */
  async cleanup(): Promise<void> {
    this.interactionLogs = [];
    this.errorLogs = [];
    this.performanceMetrics = [];
    console.log('🧹 Admin Logger cleanup completed');
  }

  private cleanupOldLogs(): void {
    const now = Date.now();
    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7일
    
    const oldInteractionCount = this.interactionLogs.length;
    const oldErrorCount = this.errorLogs.length;
    
    this.interactionLogs = this.interactionLogs.filter(log => (now - log.timestamp) < maxAge);
    this.errorLogs = this.errorLogs.filter(log => (now - log.timestamp) < maxAge);
    
    const cleanedInteractions = oldInteractionCount - this.interactionLogs.length;
    const cleanedErrors = oldErrorCount - this.errorLogs.length;
    
    if (cleanedInteractions > 0 || cleanedErrors > 0) {
      console.log(`🧹 Cleaned up ${cleanedInteractions} interaction logs and ${cleanedErrors} error logs`);
    }
  }
} 