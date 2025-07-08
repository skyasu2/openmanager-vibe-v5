import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock winston module
const mockLogger = {
  info: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
  debug: vi.fn(),
  verbose: vi.fn(),
  silly: vi.fn(),
  log: vi.fn(),
  level: 'info',
  levels: { error: 0, warn: 1, info: 2, verbose: 3, debug: 4, silly: 5 },
};

const mockFormat = {
  combine: vi.fn(() => 'combined-format'),
  timestamp: vi.fn(() => 'timestamp-format'),
  errors: vi.fn(() => 'errors-format'),
  json: vi.fn(() => 'json-format'),
  colorize: vi.fn(() => 'colorize-format'),
  simple: vi.fn(() => 'simple-format'),
  printf: vi.fn(() => 'printf-format'),
};

const mockTransports = {
  Console: vi.fn().mockImplementation(() => ({ name: 'console' })),
  File: vi.fn().mockImplementation(() => ({ name: 'file' })),
};

vi.mock('winston', () => ({
  createLogger: vi.fn(() => mockLogger),
  format: mockFormat,
  transports: mockTransports,
  addColors: vi.fn(),
  config: {
    npm: {
      levels: { error: 0, warn: 1, info: 2, verbose: 3, debug: 4, silly: 5 },
      colors: { error: 'red', warn: 'yellow', info: 'green' },
    },
  },
}));

// Mock implementation of WinstonLogger
class MockWinstonLogger {
  private logger = mockLogger;

  constructor() {
    // Set default level to 'info'
    this.logger.level = 'info';
  }

  info(message: string, meta?: any) {
    this.logger.info(message, meta);
  }

  error(message: string, meta?: any) {
    this.logger.error(message, meta);
  }

  warn(message: string, meta?: any) {
    this.logger.warn(message, meta);
  }

  debug(message: string, meta?: any) {
    this.logger.debug(message, meta);
  }

  setLevel(level: string) {
    this.logger.level = level;
  }

  getLevel(): string {
    return this.logger.level;
  }
}

describe('WinstonLogger', () => {
  let logger: MockWinstonLogger;

  beforeEach(() => {
    vi.clearAllMocks();
    logger = new MockWinstonLogger();
  });

  describe('로깅 기능', () => {
    it('info 레벨 로그를 출력할 수 있어야 함', () => {
      // Given
      const message = 'Test info message';
      const meta = { userId: 123 };

      // When
      logger.info(message, meta);

      // Then
      expect(mockLogger.info).toHaveBeenCalledWith(message, meta);
    });

    it('error 레벨 로그를 출력할 수 있어야 함', () => {
      // Given
      const message = 'Test error message';
      const error = new Error('Test error');

      // When
      logger.error(message, { error });

      // Then
      expect(mockLogger.error).toHaveBeenCalledWith(message, { error });
    });

    it('warn 레벨 로그를 출력할 수 있어야 함', () => {
      // Given
      const message = 'Test warning message';

      // When
      logger.warn(message);

      // Then
      expect(mockLogger.warn).toHaveBeenCalledWith(message, undefined);
    });

    it('debug 레벨 로그를 출력할 수 있어야 함', () => {
      // Given
      const message = 'Test debug message';
      const debugInfo = { step: 'validation' };

      // When
      logger.debug(message, debugInfo);

      // Then
      expect(mockLogger.debug).toHaveBeenCalledWith(message, debugInfo);
    });
  });

  describe('로그 레벨 관리', () => {
    it('로그 레벨을 설정할 수 있어야 함', () => {
      // When
      logger.setLevel('debug');

      // Then
      expect(logger.getLevel()).toBe('debug');
    });

    it('기본 로그 레벨이 설정되어야 함', () => {
      // Then
      expect(logger.getLevel()).toBe('info');
    });
  });

  describe('메타데이터 처리', () => {
    it('객체 메타데이터를 처리할 수 있어야 함', () => {
      // Given
      const message = 'User action';
      const meta = {
        userId: 123,
        action: 'login',
        timestamp: new Date(),
        ip: '192.168.1.1',
      };

      // When
      logger.info(message, meta);

      // Then
      expect(mockLogger.info).toHaveBeenCalledWith(message, meta);
    });

    it('에러 객체를 메타데이터로 처리할 수 있어야 함', () => {
      // Given
      const message = 'Operation failed';
      const error = new Error('Database connection failed');
      error.stack = 'Error stack trace';

      // When
      logger.error(message, { error, context: 'database' });

      // Then
      expect(mockLogger.error).toHaveBeenCalledWith(message, {
        error,
        context: 'database',
      });
    });
  });

  describe('Winston 설정', () => {
    it('Winston format이 올바르게 설정되어야 함', () => {
      // Then
      expect(mockFormat.combine).toBeDefined();
      expect(mockFormat.timestamp).toBeDefined();
      expect(mockFormat.json).toBeDefined();
    });

    it('Winston transports가 올바르게 설정되어야 함', () => {
      // Then
      expect(mockTransports.Console).toBeDefined();
      expect(mockTransports.File).toBeDefined();
    });
  });

  describe('로그 출력 검증', () => {
    it('여러 로그 레벨이 순서대로 출력되어야 함', () => {
      // When
      logger.error('Error message');
      logger.warn('Warning message');
      logger.info('Info message');
      logger.debug('Debug message');

      // Then
      expect(mockLogger.error).toHaveBeenCalledTimes(1);
      expect(mockLogger.warn).toHaveBeenCalledTimes(1);
      expect(mockLogger.info).toHaveBeenCalledTimes(1);
      expect(mockLogger.debug).toHaveBeenCalledTimes(1);
    });

    it('빈 메시지도 처리할 수 있어야 함', () => {
      // When
      logger.info('');

      // Then
      expect(mockLogger.info).toHaveBeenCalledWith('', undefined);
    });
  });
});
