/**
 * 🔍 OpenManager Vibe v5 - AI 엔진 로깅 시스템 고도화
 *
 * 고급 AI 로깅 시스템:
 * - Winston + Pino 하이브리드 로깅
 * - AI 사고 과정 추적
 * - 성능 메트릭 수집
 * - 실시간 스트리밍
 * - 메모리 효율적 버퍼링
 */

import winston from 'winston';
import pino from 'pino';
import chalk from 'chalk';

export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
  VERBOSE = 'verbose',
  AI_THINKING = 'ai_thinking',
  AI_ANALYSIS = 'ai_analysis',
  AI_PERFORMANCE = 'ai_performance',
}

export enum LogCategory {
  AI_ENGINE = 'ai_engine',
  MCP = 'mcp',
  RAG = 'rag',
  GOOGLE_AI = 'google_ai',
  PREDICTION = 'prediction',
  ANOMALY = 'anomaly',
  HYBRID = 'hybrid',
  FALLBACK = 'fallback',
  PERFORMANCE = 'performance',
  SYSTEM = 'system',
}

export interface AILogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  category: LogCategory;
  engine: string;
  message: string;
  data?: any;
  metadata?: {
    query?: string;
    userId?: string;
    sessionId?: string;
    requestId?: string;
    duration?: number;
    memoryUsage?: any;
    cpuUsage?: any;
    thinkingSteps?: number;
    conclusionCount?: number;
    errorType?: string;
    hasStack?: boolean;
    contextKeys?: string[];
    suggestions?: string[];
    analysisType?: string;
    confidence?: number;
    resultKeys?: string[];
    operation?: string;
    [key: string]: any; // 확장 가능한 메타데이터
  };
  thinking?: {
    steps: any[];
    reasoning: string;
    conclusions: string[];
    confidence?: number;
    alternatives?: string[];
  };
  performance?: {
    responseTime: number;
    memoryDelta: number;
    cpuLoad: number;
    cacheHit?: boolean;
    apiCalls?: number;
  };
  context?: any;
  tags?: string[];
  correlationId?: string;
}

export interface LogFilters {
  level?: LogLevel[];
  category?: LogCategory[];
  engine?: string[];
  since?: string;
  until?: string;
  limit?: number;
  search?: string;
  hasError?: boolean;
  hasThinking?: boolean;
  minConfidence?: number;
}

export class AILogger {
  private static instance: AILogger;
  private winstonLogger: winston.Logger;
  private pinoLogger: any;
  private logBuffer: AILogEntry[] = [];
  private readonly bufferSize = 1000;
  private logCounter = 0;
  private performanceMetrics = new Map<string, any>();
  private isProduction = process.env.NODE_ENV === 'production';
  private subscribers = new Set<(log: AILogEntry) => void>();

  private constructor() {
    this.initializeWinston();
    this.initializePino();
    this.startPerformanceMonitoring();
  }

  public static getInstance(): AILogger {
    if (!AILogger.instance) {
      AILogger.instance = new AILogger();
    }
    return AILogger.instance;
  }

  private initializeWinston(): void {
    const transports: winston.transport[] = [];

    // 개발 환경: 컬러풀한 콘솔 출력
    if (!this.isProduction) {
      transports.push(
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.timestamp(),
            winston.format.printf(({ timestamp, level, message, ...meta }) => {
              const metaStr = Object.keys(meta).length
                ? JSON.stringify(meta, null, 2)
                : '';
              return `${chalk.gray(timestamp)} ${level}: ${message} ${chalk.dim(metaStr)}`;
            })
          ),
        })
      );
    }

    // 프로덕션 환경: 파일 로깅
    if (this.isProduction) {
      transports.push(
        new winston.transports.File({
          filename: 'logs/ai-error.log',
          level: 'error',
        }),
        new winston.transports.File({
          filename: 'logs/ai-combined.log',
        })
      );
    }

    this.winstonLogger = winston.createLogger({
      level: this.isProduction ? 'info' : 'debug',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      transports,
    });
  }

  private mapToWinstonLevel(level: LogLevel): string {
    switch (level) {
      case LogLevel.ERROR:
        return 'error';
      case LogLevel.WARN:
        return 'warn';
      case LogLevel.INFO:
        return 'info';
      case LogLevel.DEBUG:
        return 'debug';
      case LogLevel.VERBOSE:
        return 'verbose';
      case LogLevel.AI_THINKING:
        return 'debug';
      case LogLevel.AI_ANALYSIS:
        return 'info';
      case LogLevel.AI_PERFORMANCE:
        return 'debug';
      default:
        return 'info';
    }
  }

  private mapToPinoLevel(level: LogLevel): string {
    switch (level) {
      case LogLevel.ERROR:
        return 'error';
      case LogLevel.WARN:
        return 'warn';
      case LogLevel.INFO:
        return 'info';
      case LogLevel.DEBUG:
        return 'debug';
      case LogLevel.VERBOSE:
        return 'trace';
      case LogLevel.AI_THINKING:
        return 'debug';
      case LogLevel.AI_ANALYSIS:
        return 'info';
      case LogLevel.AI_PERFORMANCE:
        return 'debug';
      default:
        return 'info';
    }
  }

  private initializePino(): void {
    const pinoConfig: any = {
      level: this.isProduction ? 'info' : 'debug',
      timestamp: pino.stdTimeFunctions.isoTime,
      formatters: {
        level: (label: string) => ({ level: label }),
      },
    };

    // 개발 환경: pretty print
    if (!this.isProduction) {
      pinoConfig.transport = {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'yyyy-mm-dd HH:MM:ss',
          ignore: 'pid,hostname',
        },
      };
    }

    this.pinoLogger = pino(pinoConfig);
  }

  private startPerformanceMonitoring(): void {
    // 5초마다 시스템 성능 메트릭 수집
    setInterval(() => {
      const memUsage = process.memoryUsage();
      const cpuUsage = process.cpuUsage();

      this.performanceMetrics.set('memory', {
        rss: memUsage.rss,
        heapUsed: memUsage.heapUsed,
        heapTotal: memUsage.heapTotal,
        external: memUsage.external,
        timestamp: new Date().toISOString(),
      });

      this.performanceMetrics.set('cpu', {
        user: cpuUsage.user,
        system: cpuUsage.system,
        timestamp: new Date().toISOString(),
      });
    }, 5000);
  }

  /**
   * 🤖 AI 엔진 로그 기록 (메인 메서드)
   */
  public async logAI(entry: Partial<AILogEntry>): Promise<void> {
    const logEntry: AILogEntry = {
      id: `ai-log-${++this.logCounter}-${Date.now()}`,
      timestamp: new Date().toISOString(),
      level: entry.level || LogLevel.INFO,
      category: entry.category || LogCategory.AI_ENGINE,
      engine: entry.engine || 'unknown',
      message: entry.message || '',
      data: entry.data,
      metadata: {
        ...entry.metadata,
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage(),
      },
      thinking: entry.thinking,
      performance: entry.performance,
      context: entry.context,
      tags: entry.tags || [],
      correlationId: entry.correlationId,
    };

    // 버퍼에 추가
    this.addToBuffer(logEntry);

    // Winston 로깅 (레벨 매핑)
    const winstonLevel = this.mapToWinstonLevel(logEntry.level);
    this.winstonLogger[winstonLevel](logEntry.message, logEntry);

    // Pino 로깅 (더 빠른 성능)
    const pinoLevel = this.mapToPinoLevel(logEntry.level);
    this.pinoLogger[pinoLevel](logEntry);

    // 실시간 구독자들에게 알림
    this.notifySubscribers(logEntry);

    // 성능 메트릭 업데이트
    this.updatePerformanceMetrics(logEntry);
  }

  /**
   * 🧠 AI 사고 과정 로깅
   */
  public async logThinking(
    engine: string,
    category: LogCategory,
    query: string,
    steps: any[],
    reasoning: string,
    conclusions: string[],
    confidence?: number,
    alternatives?: string[]
  ): Promise<void> {
    await this.logAI({
      level: LogLevel.AI_THINKING,
      category,
      engine,
      message: `🧠 AI 사고 과정: ${query.slice(0, 100)}${query.length > 100 ? '...' : ''}`,
      thinking: {
        steps,
        reasoning,
        conclusions,
        confidence: confidence || 0.8,
        alternatives: alternatives || [],
      },
      metadata: {
        query,
        thinkingSteps: steps.length,
        conclusionCount: conclusions.length,
      },
      tags: ['thinking', 'reasoning', 'analysis'],
    });
  }

  /**
   * ⚡ AI 성능 메트릭 로깅
   */
  public async logPerformance(
    engine: string,
    category: LogCategory,
    operation: string,
    responseTime: number,
    metadata?: any
  ): Promise<void> {
    const memAfter = process.memoryUsage();

    await this.logAI({
      level: LogLevel.AI_PERFORMANCE,
      category,
      engine,
      message: `⚡ 성능: ${operation} - ${responseTime}ms`,
      performance: {
        responseTime,
        memoryDelta: memAfter.heapUsed,
        cpuLoad: process.cpuUsage().user,
        cacheHit: metadata?.cacheHit || false,
        apiCalls: metadata?.apiCalls || 0,
      },
      metadata: {
        ...metadata,
        operation,
        timestamp: new Date().toISOString(),
      },
      tags: ['performance', 'metrics', operation],
    });
  }

  /**
   * ❌ AI 엔진 오류 로깅
   */
  public async logError(
    engine: string,
    category: LogCategory,
    error: Error | string,
    context?: any,
    correlationId?: string
  ): Promise<void> {
    const errorMessage = error instanceof Error ? error.message : error;
    const errorStack = error instanceof Error ? error.stack : undefined;

    await this.logAI({
      level: LogLevel.ERROR,
      category,
      engine,
      message: `❌ AI 엔진 오류: ${errorMessage}`,
      data: {
        error: errorMessage,
        stack: errorStack,
        context,
        timestamp: new Date().toISOString(),
      },
      metadata: {
        errorType:
          error instanceof Error ? error.constructor.name : 'StringError',
        hasStack: !!errorStack,
        contextKeys: context ? Object.keys(context) : [],
      },
      correlationId,
      tags: ['error', 'exception', category],
    });
  }

  /**
   * ⚠️ AI 엔진 경고 로깅
   */
  public async logWarning(
    engine: string,
    category: LogCategory,
    message: string,
    data?: any,
    suggestions?: string[]
  ): Promise<void> {
    await this.logAI({
      level: LogLevel.WARN,
      category,
      engine,
      message: `⚠️ ${message}`,
      data,
      metadata: {
        suggestions: suggestions || [],
        timestamp: new Date().toISOString(),
      },
      tags: ['warning', 'attention', category],
    });
  }

  /**
   * 📊 AI 분석 결과 로깅
   */
  public async logAnalysis(
    engine: string,
    category: LogCategory,
    analysisType: string,
    results: any,
    confidence: number,
    metadata?: any
  ): Promise<void> {
    await this.logAI({
      level: LogLevel.AI_ANALYSIS,
      category,
      engine,
      message: `📊 AI 분석: ${analysisType} (신뢰도: ${Math.round(confidence * 100)}%)`,
      data: results,
      thinking: {
        steps: [],
        reasoning: `${analysisType} 분석 완료`,
        conclusions: [`분석 결과 ${Object.keys(results).length}개 항목 도출`],
        confidence,
      },
      metadata: {
        ...metadata,
        analysisType,
        confidence,
        resultKeys: Object.keys(results),
        timestamp: new Date().toISOString(),
      },
      tags: ['analysis', analysisType, 'results'],
    });
  }

  // === 버퍼 및 검색 메서드들 ===

  private addToBuffer(entry: AILogEntry): void {
    this.logBuffer.push(entry);
    if (this.logBuffer.length > this.bufferSize) {
      this.logBuffer = this.logBuffer.slice(-this.bufferSize);
    }
  }

  private notifySubscribers(entry: AILogEntry): void {
    this.subscribers.forEach(callback => {
      try {
        callback(entry);
      } catch (error) {
        console.error('구독자 알림 오류:', error);
      }
    });
  }

  private updatePerformanceMetrics(entry: AILogEntry): void {
    const engineKey = `${entry.engine}-${entry.category}`;

    if (!this.performanceMetrics.has(engineKey)) {
      this.performanceMetrics.set(engineKey, {
        totalLogs: 0,
        errorCount: 0,
        avgResponseTime: 0,
        lastActivity: null,
      });
    }

    const metrics = this.performanceMetrics.get(engineKey);
    metrics.totalLogs++;
    metrics.lastActivity = entry.timestamp;

    if (entry.level === LogLevel.ERROR) {
      metrics.errorCount++;
    }

    if (entry.performance?.responseTime) {
      metrics.avgResponseTime =
        (metrics.avgResponseTime + entry.performance.responseTime) / 2;
    }
  }

  // === 로그 조회 및 필터링 메서드들 ===

  public getRecentLogs(limit: number = 100): AILogEntry[] {
    return this.logBuffer.slice(-limit);
  }

  public getLogsByEngine(engine: string, limit: number = 50): AILogEntry[] {
    return this.logBuffer.filter(log => log.engine === engine).slice(-limit);
  }

  public getLogsByCategory(
    category: LogCategory,
    limit: number = 50
  ): AILogEntry[] {
    return this.logBuffer
      .filter(log => log.category === category)
      .slice(-limit);
  }

  public getErrorLogs(limit: number = 50): AILogEntry[] {
    return this.logBuffer
      .filter(log => log.level === LogLevel.ERROR)
      .slice(-limit);
  }

  public getThinkingLogs(limit: number = 20): AILogEntry[] {
    return this.logBuffer
      .filter(log => log.level === LogLevel.AI_THINKING)
      .slice(-limit);
  }

  public getAnalysisLogs(limit: number = 30): AILogEntry[] {
    return this.logBuffer
      .filter(log => log.level === LogLevel.AI_ANALYSIS)
      .slice(-limit);
  }

  public getPerformanceLogs(limit: number = 50): AILogEntry[] {
    return this.logBuffer
      .filter(log => log.level === LogLevel.AI_PERFORMANCE)
      .slice(-limit);
  }

  public getPerformanceMetrics(): Map<string, any> {
    return new Map(this.performanceMetrics);
  }

  public searchLogs(query: string, filters?: LogFilters): AILogEntry[] {
    let filteredLogs = [...this.logBuffer];

    // 텍스트 검색
    if (query) {
      const searchTerm = query.toLowerCase();
      filteredLogs = filteredLogs.filter(
        log =>
          log.message.toLowerCase().includes(searchTerm) ||
          log.engine.toLowerCase().includes(searchTerm) ||
          (log.thinking?.reasoning || '').toLowerCase().includes(searchTerm) ||
          JSON.stringify(log.data || {})
            .toLowerCase()
            .includes(searchTerm)
      );
    }

    // 필터 적용
    if (filters) {
      if (filters.level?.length) {
        filteredLogs = filteredLogs.filter(log =>
          filters.level!.includes(log.level)
        );
      }

      if (filters.category?.length) {
        filteredLogs = filteredLogs.filter(log =>
          filters.category!.includes(log.category)
        );
      }

      if (filters.engine?.length) {
        filteredLogs = filteredLogs.filter(log =>
          filters.engine!.includes(log.engine)
        );
      }

      if (filters.since) {
        const sinceDate = new Date(filters.since);
        filteredLogs = filteredLogs.filter(
          log => new Date(log.timestamp) >= sinceDate
        );
      }

      if (filters.until) {
        const untilDate = new Date(filters.until);
        filteredLogs = filteredLogs.filter(
          log => new Date(log.timestamp) <= untilDate
        );
      }

      if (filters.hasError) {
        filteredLogs = filteredLogs.filter(log => log.level === LogLevel.ERROR);
      }

      if (filters.hasThinking) {
        filteredLogs = filteredLogs.filter(
          log => log.thinking && log.thinking.steps.length > 0
        );
      }

      if (filters.minConfidence !== undefined) {
        filteredLogs = filteredLogs.filter(
          log =>
            log.thinking?.confidence !== undefined &&
            log.thinking.confidence >= filters.minConfidence!
        );
      }
    }

    // 제한 적용
    const limit = filters?.limit || 100;
    return filteredLogs.slice(-limit);
  }

  // === 실시간 스트리밍 지원 ===

  public subscribe(callback: (log: AILogEntry) => void): () => void {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  public getLogStats(): any {
    const stats = {
      totalLogs: this.logBuffer.length,
      byLevel: {} as Record<string, number>,
      byCategory: {} as Record<string, number>,
      byEngine: {} as Record<string, number>,
      recentErrors: this.getErrorLogs(10).length,
      avgResponseTime: 0,
      memoryUsage: process.memoryUsage(),
      uptime: process.uptime(),
    };

    // 통계 계산
    this.logBuffer.forEach(log => {
      stats.byLevel[log.level] = (stats.byLevel[log.level] || 0) + 1;
      stats.byCategory[log.category] =
        (stats.byCategory[log.category] || 0) + 1;
      stats.byEngine[log.engine] = (stats.byEngine[log.engine] || 0) + 1;
    });

    return stats;
  }

  // === 정리 메서드들 ===

  public clearLogs(): void {
    this.logBuffer = [];
    this.logCounter = 0;
  }

  public async flushLogs(): Promise<void> {
    // 프로덕션 환경에서 로그를 파일이나 외부 서비스로 플러시
    if (this.isProduction && this.logBuffer.length > 0) {
      try {
        // 여기서 외부 로그 서비스로 전송할 수 있음
        // 예: Elasticsearch, CloudWatch, etc.
        console.log(`🔄 ${this.logBuffer.length}개 로그 플러시 완료`);
      } catch (error) {
        console.error('로그 플러시 오류:', error);
      }
    }
  }

  public async shutdown(): Promise<void> {
    await this.flushLogs();
    this.subscribers.clear();
    this.performanceMetrics.clear();
  }
}

// 싱글톤 인스턴스 내보내기
export const aiLogger = AILogger.getInstance();
