/**
 * 📝 Logging Service
 *
 * 표준화된 로깅 시스템
 * - 레벨별 로그 관리
 * - 구조화된 로그 포맷
 * - 파일 및 콘솔 출력
 * - 로그 회전 및 보관
 */

import { ILogger, LogEntry } from '@/interfaces/services';
import { getLoggingConfig } from '@/config';

export class LoggingService implements ILogger {
  private logs: LogEntry[] = [];
  private level: 'debug' | 'info' | 'warn' | 'error' = 'info';
  private config = getLoggingConfig();
  private readonly maxLogs = 1000;
  private readonly levelPriority = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
  };

  constructor() {
    this.level = this.config.level;
  }

  /**
   * 디버그 로그
   */
  debug(message: string, data?: Record<string, any>): void {
    this.log('debug', message, data);
  }

  /**
   * 정보 로그
   */
  info(message: string, data?: Record<string, any>): void {
    this.log('info', message, data);
  }

  /**
   * 경고 로그
   */
  warn(message: string, data?: Record<string, any>): void {
    this.log('warn', message, data);
  }

  /**
   * 에러 로그
   */
  error(message: string, error?: Error, data?: Record<string, any>): void {
    this.log('error', message, data, error);
  }

  /**
   * 로그 레벨 설정
   */
  setLevel(level: 'debug' | 'info' | 'warn' | 'error'): void {
    this.level = level;
  }

  /**
   * 현재 로그 레벨 조회
   */
  getLevel(): string {
    return this.level;
  }

  /**
   * 로그 목록 조회
   */
  getLogs(limit?: number): LogEntry[] {
    const logs = [...this.logs].reverse(); // 최신 순으로 정렬
    return limit ? logs.slice(0, limit) : logs;
  }

  /**
   * 로그 초기화
   */
  clearLogs(): void {
    this.logs = [];
  }

  /**
   * 내부 로그 처리
   */
  private log(
    level: 'debug' | 'info' | 'warn' | 'error',
    message: string,
    data?: Record<string, any>,
    error?: Error
  ): void {
    // 레벨 필터링
    if (this.levelPriority[level] < this.levelPriority[this.level]) {
      return;
    }

    const logEntry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      module: this.getCallerModule(),
      data,
      error,
    };

    // 메모리에 저장
    this.logs.push(logEntry);

    // 최대 로그 수 제한
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // 콘솔 출력
    if (this.config.enableConsole) {
      this.outputToConsole(logEntry);
    }

    // 파일 출력 (실제 환경에서는 파일 시스템 사용)
    if (this.config.enableFile) {
      this.outputToFile(logEntry);
    }
  }

  /**
   * 호출자 모듈 추적
   */
  private getCallerModule(): string {
    const stack = new Error().stack;
    if (!stack) return 'unknown';

    const lines = stack.split('\n');
    // 스택에서 실제 호출자 찾기 (LoggingService 내부 호출 제외)
    for (let i = 3; i < lines.length; i++) {
      const line = lines[i];
      if (line && !line.includes('LoggingService')) {
        const match = line.match(/at\s+(.+?)\s+\(/);
        if (match) {
          return match[1];
        }
        // 파일 경로에서 모듈명 추출
        const fileMatch = line.match(/\/([^\/]+)\.ts:/);
        if (fileMatch) {
          return fileMatch[1];
        }
      }
    }
    return 'unknown';
  }

  /**
   * 콘솔 출력
   */
  private outputToConsole(entry: LogEntry): void {
    const timestamp = new Date(entry.timestamp).toLocaleTimeString();
    const prefix = `[${timestamp}] [${entry.level.toUpperCase()}] [${entry.module}]`;

    let output = `${prefix} ${entry.message}`;

    if (entry.data) {
      output += `\n  Data: ${JSON.stringify(entry.data, null, 2)}`;
    }

    if (entry.error) {
      output += `\n  Error: ${entry.error.message}`;
      if (entry.error.stack) {
        output += `\n  Stack: ${entry.error.stack}`;
      }
    }

    switch (entry.level) {
      case 'debug':
        console.debug(output);
        break;
      case 'info':
        console.info(output);
        break;
      case 'warn':
        console.warn(output);
        break;
      case 'error':
        console.error(output);
        break;
    }
  }

  /**
   * 파일 출력 (시뮬레이션)
   */
  private outputToFile(entry: LogEntry): void {
    // 실제 환경에서는 파일 시스템에 저장
    // 여기서는 localStorage를 사용하여 시뮬레이션
    try {
      const fileKey = `logs_${new Date().toISOString().split('T')[0]}`;
      const existingLogs = localStorage.getItem(fileKey);
      const logs = existingLogs ? JSON.parse(existingLogs) : [];

      logs.push(entry);

      // 파일 크기 제한 (시뮬레이션)
      if (logs.length > 500) {
        logs.splice(0, logs.length - 500);
      }

      localStorage.setItem(fileKey, JSON.stringify(logs));
    } catch (error) {
      console.error('Failed to write log to file:', error);
    }
  }

  /**
   * 로그 통계
   */
  getLogStats(): {
    total: number;
    byLevel: Record<string, number>;
    byModule: Record<string, number>;
    recentErrors: LogEntry[];
  } {
    const stats = {
      total: this.logs.length,
      byLevel: { debug: 0, info: 0, warn: 0, error: 0 },
      byModule: {} as Record<string, number>,
      recentErrors: this.logs.filter(log => log.level === 'error').slice(-10),
    };

    this.logs.forEach(log => {
      stats.byLevel[log.level]++;
      stats.byModule[log.module] = (stats.byModule[log.module] || 0) + 1;
    });

    return stats;
  }

  /**
   * 로그 검색
   */
  searchLogs(query: {
    level?: 'debug' | 'info' | 'warn' | 'error';
    module?: string;
    message?: string;
    startTime?: Date;
    endTime?: Date;
  }): LogEntry[] {
    return this.logs.filter(log => {
      if (query.level && log.level !== query.level) return false;
      if (query.module && log.module !== query.module) return false;
      if (
        query.message &&
        !log.message.toLowerCase().includes(query.message.toLowerCase())
      )
        return false;

      const logTime = new Date(log.timestamp);
      if (query.startTime && logTime < query.startTime) return false;
      if (query.endTime && logTime > query.endTime) return false;

      return true;
    });
  }

  /**
   * 로그 내보내기
   */
  exportLogs(format: 'json' | 'csv' = 'json'): string {
    if (format === 'csv') {
      const headers = [
        'timestamp',
        'level',
        'module',
        'message',
        'data',
        'error',
      ];
      const rows = this.logs.map(log => [
        log.timestamp,
        log.level,
        log.module,
        log.message,
        log.data ? JSON.stringify(log.data) : '',
        log.error ? log.error.message : '',
      ]);

      return [headers, ...rows].map(row => row.join(',')).join('\n');
    }

    return JSON.stringify(this.logs, null, 2);
  }

  /**
   * 성능 로깅 헬퍼
   */
  time(label: string): void {
    this.debug(`Timer started: ${label}`, { type: 'timer_start', label });
  }

  timeEnd(label: string): void {
    this.debug(`Timer ended: ${label}`, { type: 'timer_end', label });
  }

  /**
   * 구조화된 로깅 헬퍼
   */
  logEvent(event: {
    type: string;
    action: string;
    resource?: string;
    userId?: string;
    metadata?: Record<string, any>;
  }): void {
    this.info(`Event: ${event.type}.${event.action}`, {
      event_type: event.type,
      action: event.action,
      resource: event.resource,
      user_id: event.userId,
      ...event.metadata,
    });
  }

  /**
   * API 요청 로깅
   */
  logApiRequest(request: {
    method: string;
    url: string;
    statusCode?: number;
    duration?: number;
    userId?: string;
    userAgent?: string;
  }): void {
    const level =
      request.statusCode && request.statusCode >= 400 ? 'warn' : 'info';
    this.log(level, `API ${request.method} ${request.url}`, {
      type: 'api_request',
      method: request.method,
      url: request.url,
      status_code: request.statusCode,
      duration_ms: request.duration,
      user_id: request.userId,
      user_agent: request.userAgent,
    });
  }

  /**
   * 데이터베이스 쿼리 로깅
   */
  logDbQuery(query: {
    operation: string;
    table?: string;
    duration?: number;
    rowCount?: number;
    error?: Error;
  }): void {
    const level = query.error ? 'error' : 'debug';
    this.log(
      level,
      `DB ${query.operation}${query.table ? ` on ${query.table}` : ''}`,
      {
        type: 'db_query',
        operation: query.operation,
        table: query.table,
        duration_ms: query.duration,
        row_count: query.rowCount,
      },
      query.error
    );
  }
}
