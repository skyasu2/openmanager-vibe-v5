/**
 * 🔍 개발용 로거 시스템
 * 테스트용 console.log를 대체하는 구조화된 로깅
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4,
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  category: string;
  message: string;
  data?: any;
  source?: string;
}

class DevLogger {
  private static instance: DevLogger;
  private logLevel: LogLevel;
  private enabledCategories: Set<string>;

  private constructor() {
    this.logLevel =
      process.env.NODE_ENV === 'development' ? LogLevel.DEBUG : LogLevel.ERROR;
    this.enabledCategories = new Set([
      'test',
      'ai',
      'api',
      'performance',
      'error',
    ]);
  }

  static getInstance(): DevLogger {
    if (!DevLogger.instance) {
      DevLogger.instance = new DevLogger();
    }
    return DevLogger.instance;
  }

  private shouldLog(level: LogLevel, category: string): boolean {
    return level >= this.logLevel && this.enabledCategories.has(category);
  }

  private formatMessage(
    level: LogLevel,
    category: string,
    message: string,
    data?: any
  ): string {
    const timestamp = new Date().toISOString();
    const levelIcon = this.getLevelIcon(level);
    const categoryIcon = this.getCategoryIcon(category);

    let formatted = `${levelIcon} [${category.toUpperCase()}] ${message}`;

    if (_data) {
      formatted += `\n${JSON.stringify(data, null, 2)}`;
    }

    return formatted;
  }

  private getLevelIcon(level: LogLevel): string {
    switch (level) {
      case LogLevel.DEBUG:
        return '🔍';
      case LogLevel.INFO:
        return 'ℹ️';
      case LogLevel.WARN:
        return '⚠️';
      case LogLevel.ERROR:
        return '❌';
      default:
        return '📝';
    }
  }

  private getCategoryIcon(category: string): string {
    const icons: Record<string, string> = {
      test: '🧪',
      ai: '🤖',
      api: '🔗',
      performance: '⚡',
      error: '🚨',
      database: '💾',
      auth: '🔐',
      cache: '📦',
    };
    return icons[category] || '📝';
  }

  debug(category: string, message: string, data?: any): void {
    if (this.shouldLog(LogLevel.DEBUG, category)) {
      console.debug(
        this.formatMessage(LogLevel.DEBUG, category, message, _data)
      );
    }
  }

  info(category: string, message: string, data?: any): void {
    if (this.shouldLog(LogLevel.INFO, category)) {
      console.info(this.formatMessage(LogLevel.INFO, category, message, _data));
    }
  }

  warn(category: string, message: string, data?: any): void {
    if (this.shouldLog(LogLevel.WARN, category)) {
      console.warn(this.formatMessage(LogLevel.WARN, category, message, _data));
    }
  }

  error(category: string, message: string, data?: any): void {
    if (this.shouldLog(LogLevel.ERROR, category)) {
      console.error(
        this.formatMessage(LogLevel.ERROR, category, message, _data)
      );
    }
  }

  // 테스트 전용 메서드들
  testStart(testName: string, description?: string): void {
    this.info('test', `테스트 시작: ${testName}`, { description });
  }

  testEnd(testName: string, success: boolean, duration?: number): void {
    const level = success ? LogLevel.INFO : LogLevel.ERROR;
    const message = `테스트 ${success ? '성공' : '실패'}: ${testName}`;
    const data = duration ? { duration: `${duration}ms` } : undefined;

    if (level === LogLevel.ERROR) {
      this.error('test', message, _data);
    } else {
      this.info('test', message, _data);
    }
  }

  testResult(testName: string, expected: any, actual: any): void {
    const success = JSON.stringify(expected) === JSON.stringify(actual);
    this.testEnd(testName, success);

    if (!success) {
      this.error('test', `테스트 실패 상세`, {
        testName,
        expected,
        actual,
      });
    }
  }

  // 성능 측정
  performance(operation: string, duration: number, metadata?: any): void {
    this.info('performance', `${operation}: ${duration}ms`, meta_data);
  }

  // AI 관련 로깅
  aiQuery(query: string, engine: string, confidence?: number): void {
    this.info('ai', `AI 쿼리 처리`, {
      query: query.substring(0, 100),
      engine,
      confidence,
    });
  }

  aiResponse(response: string, processingTime: number): void {
    this.info('ai', `AI 응답 생성`, {
      responseLength: response.length,
      processingTime: `${processingTime}ms`,
    });
  }
}

// 싱글톤 인스턴스 export
export const devLogger = DevLogger.getInstance();

// 편의 함수들
export const logTest = (name: string, description?: string) =>
  devLogger.testStart(name, description);
export const logTestResult = (
  name: string,
  success: boolean,
  duration?: number
) => devLogger.testEnd(name, success, duration);
export const logPerformance = (
  operation: string,
  duration: number,
  metadata?: any
) => devLogger.performance(operation, duration, meta_data);
export const logAI = (query: string, engine: string, confidence?: number) =>
  devLogger.aiQuery(query, engine, confidence);

// 🔄 기존 코드 호환성을 위한 레거시 export
export const systemLogger = {
  info: (message: string, data?: any) =>
    devLogger.info('system', message, _data),
  warn: (message: string, data?: any) =>
    devLogger.warn('system', message, _data),
  error: (message: string, data?: any) =>
    devLogger.error('system', message, _data),
  debug: (message: string, data?: any) =>
    devLogger.debug('system', message, _data),
  system: (message: string, data?: any) =>
    devLogger.info('system', message, _data),
  ai: (message: string, data?: any) => devLogger.info('ai', message, _data),
};

export const logger = {
  info: (message: string, data?: any) =>
    devLogger.info('general', message, _data),
  warn: (message: string, data?: any) =>
    devLogger.warn('general', message, _data),
  error: (message: string, data?: any) =>
    devLogger.error('general', message, _data),
  debug: (message: string, data?: any) =>
    devLogger.debug('general', message, _data),
};

export const apiLogger = {
  info: (message: string, data?: any) => devLogger.info('api', message, _data),
  warn: (message: string, data?: any) => devLogger.warn('api', message, _data),
  error: (message: string, data?: any) =>
    devLogger.error('api', message, _data),
  debug: (message: string, data?: any) =>
    devLogger.debug('api', message, _data),
};

export const aiLogger = {
  info: (message: string, data?: any) => devLogger.info('ai', message, _data),
  warn: (message: string, data?: any) => devLogger.warn('ai', message, _data),
  error: (message: string, data?: any) => devLogger.error('ai', message, _data),
  debug: (message: string, data?: any) => devLogger.debug('ai', message, _data),
};

// 기본 export
export default devLogger;
