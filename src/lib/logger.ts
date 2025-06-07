/**
 * 환경별 로깅 시스템
 *
 * 🔧 개발/프로덕션 환경에 맞는 로깅 제공
 * - 개발: 상세한 디버그 정보
 * - 프로덕션: 필요한 정보만 간결하게
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LoggerConfig {
  enableConsole: boolean;
  enableFile: boolean;
  minLevel: LogLevel;
  prefix: string;
}

class Logger {
  private config: LoggerConfig;
  private isDevelopment: boolean;

  constructor(config: Partial<LoggerConfig> = {}) {
    this.isDevelopment = process.env.NODE_ENV === 'development';

    this.config = {
      enableConsole: true,
      enableFile: false,
      minLevel: this.isDevelopment ? 'debug' : 'info',
      prefix: '[OpenManager]',
      ...config,
    };
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: Record<LogLevel, number> = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3,
    };

    return levels[level] >= levels[this.config.minLevel];
  }

  private formatMessage(level: LogLevel, message: string, data?: any): string {
    const timestamp = new Date().toISOString();
    const emoji = {
      debug: '🔍',
      info: 'ℹ️',
      warn: '⚠️',
      error: '❌',
    }[level];

    if (this.isDevelopment) {
      return `${emoji} ${this.config.prefix} [${level.toUpperCase()}] ${message}`;
    } else {
      return `${timestamp} ${this.config.prefix} ${level}: ${message}`;
    }
  }

  debug(message: string, data?: any): void {
    if (!this.shouldLog('debug') || !this.config.enableConsole) return;

    const formattedMessage = this.formatMessage('debug', message, data);

    if (this.isDevelopment && data !== undefined) {
      console.debug(formattedMessage, data);
    } else {
      console.debug(formattedMessage);
    }
  }

  info(message: string, data?: any): void {
    if (!this.shouldLog('info') || !this.config.enableConsole) return;

    const formattedMessage = this.formatMessage('info', message, data);

    if (this.isDevelopment && data !== undefined) {
      console.info(formattedMessage, data);
    } else {
      console.info(formattedMessage);
    }
  }

  warn(message: string, data?: any): void {
    if (!this.shouldLog('warn') || !this.config.enableConsole) return;

    const formattedMessage = this.formatMessage('warn', message, data);

    if (this.isDevelopment && data !== undefined) {
      console.warn(formattedMessage, data);
    } else {
      console.warn(formattedMessage);
    }
  }

  error(message: string, error?: Error | any): void {
    if (!this.shouldLog('error') || !this.config.enableConsole) return;

    const formattedMessage = this.formatMessage('error', message, error);

    if (this.isDevelopment && error !== undefined) {
      console.error(formattedMessage, error);
    } else {
      console.error(formattedMessage);
    }
  }

  // 특수 로깅 메서드들
  system(message: string, data?: any): void {
    if (this.isDevelopment) {
      console.log(`🚀 ${this.config.prefix} SYSTEM: ${message}`, data || '');
    }
  }

  api(message: string, data?: any): void {
    if (this.isDevelopment) {
      console.log(`📡 ${this.config.prefix} API: ${message}`, data || '');
    }
  }

  ai(message: string, data?: any): void {
    if (this.isDevelopment) {
      console.log(`🤖 ${this.config.prefix} AI: ${message}`, data || '');
    }
  }

  performance(message: string, duration?: number): void {
    if (this.isDevelopment) {
      const durationText = duration ? ` (${duration}ms)` : '';
      console.log(`⚡ ${this.config.prefix} PERF: ${message}${durationText}`);
    }
  }
}

// 기본 로거 인스턴스들
export const logger = new Logger();

export const apiLogger = new Logger({
  prefix: '[API]',
  minLevel: process.env.NODE_ENV === 'development' ? 'debug' : 'warn',
});

export const aiLogger = new Logger({
  prefix: '[AI-Agent]',
  minLevel: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
});

export const systemLogger = new Logger({
  prefix: '[System]',
  minLevel: 'info',
});

// 🚀 Production-Safe 로깅 함수들
export const safeConsole = {
  log: (message: string, ...args: any[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(message, ...args);
    }
  },
  warn: (message: string, ...args: any[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.warn(message, ...args);
    }
  },
  error: (message: string, ...args: any[]) => {
    // 에러는 프로덕션에서도 기록 (중요)
    console.error(message, ...args);
  },
  info: (message: string, ...args: any[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.info(message, ...args);
    }
  },
};

// 기존 devLog 함수 개선
export const devLog = (message: string, data?: any) => {
  if (process.env.NODE_ENV === 'development') {
    const timestamp = new Date().toISOString();
    if (data) {
      console.log(`[DEV ${timestamp}] ${message}`, data);
    } else {
      console.log(`[DEV ${timestamp}] ${message}`);
    }
  }
};

// 시스템 로그 (항상 기록)
export const systemLog = (message: string, data?: any) => {
  const timestamp = new Date().toISOString();
  if (data) {
    console.log(`[SYSTEM ${timestamp}] ${message}`, data);
  } else {
    console.log(`[SYSTEM ${timestamp}] ${message}`);
  }
};

export default logger;
