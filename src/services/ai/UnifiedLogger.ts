/**
 * 📝 통합 로깅 시스템 v1.0
 *
 * ✅ 표준화된 로그 형식
 * ✅ 레벨별 로그 관리
 * ✅ 성능 로깅 통합
 * ✅ 구조화된 로그 데이터
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'critical';
export type LogCategory =
  | 'ai-engine'
  | 'fallback'
  | 'performance'
  | 'mcp'
  | 'google-ai'
  | 'rag'
  | 'system'
  | 'user'
  | 'security';

export interface LogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  category: LogCategory;
  source: string;
  message: string;
  data?: any;
  metadata?: {
    userId?: string;
    sessionId?: string;
    requestId?: string;
    engine?: string;
    mode?: string;
    responseTime?: number;
    success?: boolean;
    action?: string;
    securitySeverity?: string;
  };
  tags?: string[];
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

export interface LogQuery {
  level?: LogLevel[];
  category?: LogCategory[];
  source?: string;
  timeRange?: {
    start: string;
    end: string;
  };
  limit?: number;
  tags?: string[];
  searchText?: string;
}

export interface LogStats {
  totalLogs: number;
  levelBreakdown: Record<LogLevel, number>;
  categoryBreakdown: Record<LogCategory, number>;
  errorRate: number;
  recentErrors: LogEntry[];
  timeRange: {
    oldest: string;
    newest: string;
  };
}

/**
 * 🎯 통합 로깅 매니저
 */
export class UnifiedLogger {
  private static instance: UnifiedLogger | null = null;

  // 로그 저장소 (메모리 기반 - 간단한 구현)
  private logs: LogEntry[] = [];
  private maxLogs = 50000; // 최대 50,000개 로그 보관

  // 설정
  private config = {
    enabledLevels: ['info', 'warn', 'error', 'critical'] as LogLevel[],
    enabledCategories: [
      'ai-engine',
      'fallback',
      'performance',
      'mcp',
      'google-ai',
      'rag',
      'system',
      'user',
      'security',
    ] as LogCategory[],
    maxLogSize: 10 * 1024, // 10KB per log entry
    enableConsoleOutput: true,
    enablePerformanceLogging: true,
    enableDebugMode: false,
  };

  // 상태 관리
  private enabled = true;
  private cleanupInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.startCleanupTimer();
  }

  public static getInstance(): UnifiedLogger {
    if (!UnifiedLogger.instance) {
      UnifiedLogger.instance = new UnifiedLogger();
    }
    return UnifiedLogger.instance;
  }

  /**
   * 📝 로그 기록 (메인 메서드)
   */
  public log(
    level: LogLevel,
    category: LogCategory,
    source: string,
    message: string,
    data?: any,
    metadata?: LogEntry['metadata'],
    tags?: string[]
  ): void {
    if (!this.enabled) return;
    if (!this.config.enabledLevels.includes(level)) return;
    if (!this.config.enabledCategories.includes(category)) return;

    const logEntry: LogEntry = {
      id: this.generateLogId(),
      timestamp: new Date().toISOString(),
      level,
      category,
      source,
      message,
      data: this.sanitizeData(data),
      metadata,
      tags,
    };

    // 로그 크기 제한
    if (JSON.stringify(logEntry).length > this.config.maxLogSize) {
      logEntry.data = '[Data too large - truncated]';
    }

    this.logs.push(logEntry);

    // 로그 제한 관리
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // 콘솔 출력
    if (this.config.enableConsoleOutput) {
      this.outputToConsole(logEntry);
    }
  }

  /**
   * 📝 레벨별 편의 메서드들
   */
  public debug(
    category: LogCategory,
    source: string,
    message: string,
    data?: any,
    metadata?: LogEntry['metadata']
  ): void {
    this.log('debug', category, source, message, data, metadata, ['debug']);
  }

  public info(
    category: LogCategory,
    source: string,
    message: string,
    data?: any,
    metadata?: LogEntry['metadata']
  ): void {
    this.log('info', category, source, message, data, metadata, ['info']);
  }

  public warn(
    category: LogCategory,
    source: string,
    message: string,
    data?: any,
    metadata?: LogEntry['metadata']
  ): void {
    this.log('warn', category, source, message, data, metadata, ['warning']);
  }

  public error(
    category: LogCategory,
    source: string,
    message: string,
    error?: Error,
    metadata?: LogEntry['metadata']
  ): void {
    const logEntry: LogEntry = {
      id: this.generateLogId(),
      timestamp: new Date().toISOString(),
      level: 'error',
      category,
      source,
      message,
      metadata,
      tags: ['error'],
      error: error
        ? {
            name: error.name,
            message: error.message,
            stack: error.stack,
          }
        : undefined,
    };

    this.logs.push(logEntry);

    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    if (this.config.enableConsoleOutput) {
      this.outputToConsole(logEntry);
    }
  }

  public critical(
    category: LogCategory,
    source: string,
    message: string,
    error?: Error,
    metadata?: LogEntry['metadata']
  ): void {
    const logEntry: LogEntry = {
      id: this.generateLogId(),
      timestamp: new Date().toISOString(),
      level: 'critical',
      category,
      source,
      message,
      metadata,
      tags: ['critical', 'urgent'],
      error: error
        ? {
            name: error.name,
            message: error.message,
            stack: error.stack,
          }
        : undefined,
    };

    this.logs.push(logEntry);

    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    if (this.config.enableConsoleOutput) {
      this.outputToConsole(logEntry);
    }
  }

  /**
   * 📊 성능 로깅 (성능 모니터링과 연동)
   */
  public logPerformance(
    source: string,
    operation: string,
    responseTime: number,
    success: boolean,
    metadata?: LogEntry['metadata']
  ): void {
    if (!this.config.enablePerformanceLogging) return;

    const level: LogLevel =
      responseTime > 10000 ? 'warn' : responseTime > 5000 ? 'info' : 'debug';

    this.log(
      level,
      'performance',
      source,
      `${operation} completed in ${responseTime}ms`,
      {
        operation,
        responseTime,
        success,
        performanceCategory:
          responseTime > 10000
            ? 'slow'
            : responseTime > 5000
              ? 'moderate'
              : 'fast',
      },
      {
        ...metadata,
        responseTime,
        success,
      },
      ['performance', success ? 'success' : 'failure']
    );
  }

  /**
   * 🔍 AI 엔진 로깅 (AI 작업 전용)
   */
  public logAIOperation(
    engine: string,
    mode: string,
    operation: string,
    query: string,
    success: boolean,
    responseTime: number,
    confidence?: number,
    fallbacksUsed?: number,
    metadata?: any
  ): void {
    const level: LogLevel = success ? 'info' : 'warn';

    this.log(
      level,
      'ai-engine',
      engine,
      `${operation}: "${query.substring(0, 100)}${query.length > 100 ? '...' : ''}"`,
      {
        operation,
        query: query.substring(0, 500), // 쿼리 길이 제한
        mode,
        confidence,
        fallbacksUsed,
        ...metadata,
      },
      {
        engine,
        mode,
        responseTime,
        success,
      },
      [
        'ai-operation',
        engine.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        mode.toLowerCase(),
        success ? 'success' : 'failure',
      ]
    );
  }

  /**
   * 🔄 폴백 로깅
   */
  public logFallback(
    originalEngine: string,
    fallbackEngine: string,
    reason: string,
    success: boolean,
    metadata?: LogEntry['metadata']
  ): void {
    this.log(
      success ? 'info' : 'warn',
      'fallback',
      'FallbackManager',
      `Fallback: ${originalEngine} → ${fallbackEngine} (${reason})`,
      {
        originalEngine,
        fallbackEngine,
        reason,
        fallbackSuccess: success,
      },
      metadata,
      ['fallback', success ? 'success' : 'failure']
    );
  }

  /**
   * 👤 사용자 활동 로깅
   */
  public logUserActivity(
    userId: string,
    action: string,
    details?: any,
    sessionId?: string
  ): void {
    this.log(
      'info',
      'user',
      'UserActivity',
      `User action: ${action}`,
      details,
      {
        userId,
        sessionId,
        action,
      },
      ['user-activity', action.toLowerCase().replace(/[^a-z0-9]/g, '-')]
    );
  }

  /**
   * 🔒 보안 로깅
   */
  public logSecurity(
    event: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    details?: any,
    userId?: string
  ): void {
    const level: LogLevel =
      severity === 'critical'
        ? 'critical'
        : severity === 'high'
          ? 'error'
          : severity === 'medium'
            ? 'warn'
            : 'info';

    this.log(
      level,
      'security',
      'SecurityMonitor',
      `Security event: ${event}`,
      details,
      {
        userId,
        securitySeverity: severity,
      },
      ['security', severity, event.toLowerCase().replace(/[^a-z0-9]/g, '-')]
    );
  }

  /**
   * 🔍 로그 조회
   */
  public queryLogs(query: LogQuery): LogEntry[] {
    let filtered = [...this.logs];

    // 레벨 필터
    if (query.level && query.level.length > 0) {
      filtered = filtered.filter(log => query.level!.includes(log.level));
    }

    // 카테고리 필터
    if (query.category && query.category.length > 0) {
      filtered = filtered.filter(log => query.category!.includes(log.category));
    }

    // 소스 필터
    if (query.source) {
      filtered = filtered.filter(log =>
        log.source.toLowerCase().includes(query.source!.toLowerCase())
      );
    }

    // 시간 범위 필터
    if (query.timeRange) {
      const start = new Date(query.timeRange.start).getTime();
      const end = new Date(query.timeRange.end).getTime();

      filtered = filtered.filter(log => {
        const logTime = new Date(log.timestamp).getTime();
        return logTime >= start && logTime <= end;
      });
    }

    // 태그 필터
    if (query.tags && query.tags.length > 0) {
      filtered = filtered.filter(
        log => log.tags && query.tags!.some(tag => log.tags!.includes(tag))
      );
    }

    // 텍스트 검색
    if (query.searchText) {
      const searchLower = query.searchText.toLowerCase();
      filtered = filtered.filter(
        log =>
          log.message.toLowerCase().includes(searchLower) ||
          log.source.toLowerCase().includes(searchLower) ||
          (log.data &&
            JSON.stringify(log.data).toLowerCase().includes(searchLower))
      );
    }

    // 정렬 (최신순)
    filtered.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    // 제한
    if (query.limit && query.limit > 0) {
      filtered = filtered.slice(0, query.limit);
    }

    return filtered;
  }

  /**
   * 📊 로그 통계
   */
  public getLogStats(): LogStats {
    if (this.logs.length === 0) {
      return {
        totalLogs: 0,
        levelBreakdown: { debug: 0, info: 0, warn: 0, error: 0, critical: 0 },
        categoryBreakdown: {
          'ai-engine': 0,
          fallback: 0,
          performance: 0,
          mcp: 0,
          'google-ai': 0,
          rag: 0,
          system: 0,
          user: 0,
          security: 0,
        },
        errorRate: 0,
        recentErrors: [],
        timeRange: { oldest: '', newest: '' },
      };
    }

    // 레벨별 집계
    const levelBreakdown: Record<LogLevel, number> = {
      debug: 0,
      info: 0,
      warn: 0,
      error: 0,
      critical: 0,
    };

    // 카테고리별 집계
    const categoryBreakdown: Record<LogCategory, number> = {
      'ai-engine': 0,
      fallback: 0,
      performance: 0,
      mcp: 0,
      'google-ai': 0,
      rag: 0,
      system: 0,
      user: 0,
      security: 0,
    };

    this.logs.forEach(log => {
      levelBreakdown[log.level]++;
      categoryBreakdown[log.category]++;
    });

    // 에러율 계산
    const errorCount = levelBreakdown.error + levelBreakdown.critical;
    const errorRate = errorCount / this.logs.length;

    // 최근 에러들
    const recentErrors = this.logs
      .filter(log => log.level === 'error' || log.level === 'critical')
      .slice(-10)
      .reverse();

    // 시간 범위
    const timestamps = this.logs.map(log => new Date(log.timestamp).getTime());
    const oldest = new Date(Math.min(...timestamps)).toISOString();
    const newest = new Date(Math.max(...timestamps)).toISOString();

    return {
      totalLogs: this.logs.length,
      levelBreakdown,
      categoryBreakdown,
      errorRate,
      recentErrors,
      timeRange: { oldest, newest },
    };
  }

  /**
   * 🔧 설정 관리
   */
  public updateConfig(newConfig: Partial<typeof this.config>): void {
    this.config = { ...this.config, ...newConfig };
  }

  public enable(): void {
    this.enabled = true;
  }

  public disable(): void {
    this.enabled = false;
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * 🔄 로그 리셋
   */
  public clearLogs(): void {
    this.logs = [];
    console.log('📝 로그 기록 모두 삭제 완료');
  }

  /**
   * 📤 로그 내보내기
   */
  public exportLogs(query?: LogQuery): string {
    const logsToExport = query ? this.queryLogs(query) : this.logs;
    return JSON.stringify(logsToExport, null, 2);
  }

  /**
   * 🧹 오래된 로그 정리
   */
  private startCleanupTimer(): void {
    this.cleanupInterval = setInterval(
      () => {
        const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

        const originalCount = this.logs.length;
        this.logs = this.logs.filter(
          log => new Date(log.timestamp).getTime() > sevenDaysAgo
        );

        const removedCount = originalCount - this.logs.length;
        if (removedCount > 0) {
          console.log(
            `🧹 로그 정리 완료: ${removedCount}개 로그 삭제, ${this.logs.length}개 로그 보관`
          );
        }
      },
      6 * 60 * 60 * 1000
    ); // 6시간마다 실행
  }

  /**
   * 🔨 헬퍼 메서드들
   */
  private generateLogId(): string {
    return `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private sanitizeData(data: any): any {
    if (!data) return data;

    // 민감한 정보 마스킹
    const sensitiveKeys = ['password', 'apiKey', 'token', 'secret', 'key'];

    if (typeof data === 'object') {
      const sanitized = { ...data };

      Object.keys(sanitized).forEach(key => {
        if (
          sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))
        ) {
          sanitized[key] = '[REDACTED]';
        }
      });

      return sanitized;
    }

    return data;
  }

  private outputToConsole(logEntry: LogEntry): void {
    const emoji = this.getLevelEmoji(logEntry.level);
    const timestamp = new Date(logEntry.timestamp).toLocaleTimeString();
    const message = `${emoji} [${timestamp}] [${logEntry.level.toUpperCase()}] [${logEntry.category}] ${logEntry.source}: ${logEntry.message}`;

    switch (logEntry.level) {
      case 'debug':
        if (this.config.enableDebugMode) {
          console.debug(message, logEntry.data);
        }
        break;
      case 'info':
        console.info(message);
        break;
      case 'warn':
        console.warn(message, logEntry.data);
        break;
      case 'error':
        console.error(message, logEntry.error, logEntry.data);
        break;
      case 'critical':
        console.error(`🚨 ${message}`, logEntry.error, logEntry.data);
        break;
    }
  }

  private getLevelEmoji(level: LogLevel): string {
    const emojis: Record<LogLevel, string> = {
      debug: '🔍',
      info: 'ℹ️',
      warn: '⚠️',
      error: '❌',
      critical: '🚨',
    };
    return emojis[level];
  }

  /**
   * 🛑 정리
   */
  public destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.clearLogs();
  }

  /**
   * 📊 현재 상태 요약
   */
  public getStatus(): {
    enabled: boolean;
    logCount: number;
    lastLogTime?: string;
    config: typeof this.config;
  } {
    const lastLog = this.logs[this.logs.length - 1];

    return {
      enabled: this.enabled,
      logCount: this.logs.length,
      lastLogTime: lastLog?.timestamp,
      config: { ...this.config },
    };
  }
}

// 전역 인스턴스 내보내기 (편의성)
export const logger = UnifiedLogger.getInstance();
