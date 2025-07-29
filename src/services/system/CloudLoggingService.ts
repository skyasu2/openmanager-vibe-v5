/**
 * 🌐 Cloud-based Logging Service (Production Simplified)
 *
 * LoggingService 대체: Vercel 로그 보완용 핵심 기능만
 *
 * 기능:
 * - 프로덕션: ERROR/CRITICAL 레벨만 실시간 알림
 * - 개발환경: 전체 로그 Redis Stream 처리
 * - Vercel 자체 로깅과 중복 기능 제거
 * - 핵심 장애 감지 및 알림에 집중
 */

import { getRedis } from '@/lib/redis';

interface SystemLogEntry {
  id: string;
  level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL';
  message: string;
  module: string;
  timestamp: string;
  sessionId?: string;
  userId?: string;
  metadata?: Record<string, any>;
  stackTrace?: string;
}

interface LoggingConfig {
  enableRedisStream: boolean;
  enableFirestore: boolean;
  enableRealTimeNotifications: boolean;
  redisStreamKey: string;
  batchSize: number;
  batchInterval: number;
  maxStreamLength: number;
  logRetentionDays: number;
  isProduction: boolean; // 새로 추가
  productionLogLevels: string[]; // 새로 추가
}

export class CloudLoggingService {
  private static instance: CloudLoggingService;
  private config: LoggingConfig;
  private redis: any;
  private logBuffer: SystemLogEntry[] = [];
  private batchTimer: NodeJS.Timeout | null = null;
  private isProcessing = false;

  constructor(config?: Partial<LoggingConfig>) {
    const isProduction = process.env.NODE_ENV === 'production';

    this.config = {
      enableRedisStream: !isProduction, // 개발환경에서만 Redis Stream 사용
      enableFirestore: false, // 전면 비활성화 (Vercel 로그 활용)
      enableRealTimeNotifications: true, // 핵심 알림은 유지
      redisStreamKey: 'openmanager:system:logs',
      batchSize: 50,
      batchInterval: 10000, // 10초
      maxStreamLength: isProduction ? 100 : 1000, // 프로덕션에서는 최소화
      logRetentionDays: isProduction ? 3 : 30, // 프로덕션 3일, 개발 30일
      isProduction,
      productionLogLevels: ['ERROR', 'CRITICAL'], // 프로덕션에서는 중요 로그만
      ...config,
    };

    // Redis 연결 (개발환경에서만 Redis Stream 사용)
    if (
      typeof window === 'undefined' &&
      this.config.enableRedisStream &&
      !isProduction
    ) {
      this.redis = getRedis();
      this.startBatchProcessor();
    }

    console.log(
      `🌐 CloudLoggingService 초기화 완료 (${isProduction ? 'Production' : 'Development'} 모드)`
    );
    if (isProduction) {
      console.log(
        `⚠️ 프로덕션 모드: ${this.config.productionLogLevels.join(', ')} 레벨만 처리`
      );
    }
  }

  static getInstance(config?: Partial<LoggingConfig>): CloudLoggingService {
    if (!CloudLoggingService.instance) {
      CloudLoggingService.instance = new CloudLoggingService(config);
    }
    return CloudLoggingService.instance;
  }

  /**
   * 📝 시스템 로그 기록 (Redis Stream + Firestore 배치)
   */
  async log(
    level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL',
    message: string,
    module: string,
    metadata?: Record<string, any>,
    sessionId?: string,
    userId?: string,
    stackTrace?: string
  ): Promise<boolean> {
    try {
      const logEntry: SystemLogEntry = {
        id: this.generateLogId(),
        level,
        message,
        module,
        timestamp: new Date().toISOString(),
        sessionId,
        userId,
        metadata,
        stackTrace,
      };

      // 1. Redis Stream에 실시간 기록
      if (this.config.enableRedisStream && this.redis) {
        await this.addToRedisStream(logEntry);
      }

      // 2. 배치 버퍼에 추가 (Firestore 저장용)
      if (this.config.enableFirestore) {
        this.addToBatch(logEntry);
      }

      // 3. 실시간 알림 (CRITICAL/ERROR 레벨)
      if (
        this.config.enableRealTimeNotifications &&
        (level === 'CRITICAL' || level === 'ERROR')
      ) {
        await this.sendRealTimeNotification(logEntry);
      }

      return true;
    } catch (error) {
      console.error('❌ CloudLoggingService: 로그 기록 실패:', error);
      return false;
    }
  }

  /**
   * 🔄 Redis Stream에 로그 추가
   */
  private async addToRedisStream(logEntry: SystemLogEntry): Promise<void> {
    if (!this.redis) return;

    try {
      // Redis Stream에 로그 추가
      await this.redis.xadd(
        this.config.redisStreamKey,
        'MAXLEN',
        '~',
        this.config.maxStreamLength, // 스트림 길이 제한
        '*', // 자동 ID 생성
        'id',
        logEntry.id,
        'level',
        logEntry.level,
        'message',
        logEntry.message,
        'module',
        logEntry.module,
        'timestamp',
        logEntry.timestamp,
        'data',
        JSON.stringify({
          sessionId: logEntry.sessionId,
          userId: logEntry.userId,
          metadata: logEntry.metadata,
          stackTrace: logEntry.stackTrace,
        })
      );

      // 로그 레벨별 카운터 증가
      await this.redis.incr(
        `openmanager:log:count:${logEntry.level.toLowerCase()}`
      );
      await this.redis.expire(
        `openmanager:log:count:${logEntry.level.toLowerCase()}`,
        86400
      ); // 24시간 TTL

      console.log(
        `✅ Redis Stream 로그 추가: ${logEntry.id} [${logEntry.level}]`
      );
    } catch (error) {
      console.error('❌ Redis Stream 로그 추가 실패:', error);
      throw error;
    }
  }

  /**
   * 📦 배치 버퍼 관리
   */
  private addToBatch(logEntry: SystemLogEntry): void {
    this.logBuffer.push(logEntry);

    // 배치 크기 도달 시 즉시 처리
    if (this.logBuffer.length >= this.config.batchSize) {
      this.processBatch();
    }
  }

  /**
   * ⏰ 배치 처리기 시작
   */
  private startBatchProcessor(): void {
    if (this.batchTimer) {
      clearInterval(this.batchTimer);
    }

    this.batchTimer = setInterval(() => {
      if (this.logBuffer.length > 0 && !this.isProcessing) {
        this.processBatch();
      }
    }, this.config.batchInterval);

    console.log('⏰ 로그 배치 처리기 시작');
  }

  /**
   * 📦 Firestore 배치 처리
   */
  private async processBatch(): Promise<void> {
    if (this.isProcessing || this.logBuffer.length === 0) return;

    this.isProcessing = true;
    const batch = [...this.logBuffer];
    this.logBuffer = [];

    try {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || '';
      // Firestore 배치 저장
      const response = await fetch(
        `${appUrl}/api/firestore/system-logs/batch`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            logs: batch,
            count: batch.length,
            timestamp: new Date().toISOString(),
          }),
        }
      );

      if (response.ok) {
        console.log(`📦 Firestore 로그 배치 저장 완료: ${batch.length}개`);
      } else {
        console.error('❌ Firestore 배치 저장 실패:', response.status);
        // 실패한 로그들 다시 버퍼에 추가
        this.logBuffer.unshift(...batch);
      }
    } catch (error) {
      console.error('❌ 로그 배치 처리 실패:', error);
      // 실패한 로그들 다시 버퍼에 추가
      this.logBuffer.unshift(...batch);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * 🚨 실시간 알림 전송
   */
  private async sendRealTimeNotification(
    logEntry: SystemLogEntry
  ): Promise<void> {
    try {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || '';
      await fetch(`${appUrl}/api/notifications/log-alert`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          level: logEntry.level,
          message: logEntry.message,
          module: logEntry.module,
          timestamp: logEntry.timestamp,
          logId: logEntry.id,
        }),
      });

      console.log(
        `🚨 실시간 알림 전송: ${logEntry.level} - ${logEntry.message}`
      );
    } catch (error) {
      console.error('❌ 실시간 알림 전송 실패:', error);
    }
  }

  /**
   * 🔍 실시간 로그 스트림 조회
   */
  async getRealtimeLogs(
    count: number = 50,
    level?: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL'
  ): Promise<SystemLogEntry[]> {
    if (!this.redis) return [];

    try {
      // Redis Stream에서 최신 로그 조회
      const result = await this.redis.xrevrange(
        this.config.redisStreamKey,
        '+',
        '-',
        'COUNT',
        count
      );

      const logs: SystemLogEntry[] = [];

      for (const [streamId, fields] of result) {
        const fieldMap = new Map();
        for (let i = 0; i < fields.length; i += 2) {
          fieldMap.set(fields[i], fields[i + 1]);
        }

        const data = JSON.parse(fieldMap.get('data') || '{}');
        const logEntry: SystemLogEntry = {
          id: fieldMap.get('id'),
          level: fieldMap.get('level') as any,
          message: fieldMap.get('message'),
          module: fieldMap.get('module'),
          timestamp: fieldMap.get('timestamp'),
          sessionId: data.sessionId,
          userId: data.userId,
          metadata: data.metadata,
          stackTrace: data.stackTrace,
        };

        // 레벨 필터링
        if (!level || logEntry.level === level) {
          logs.push(logEntry);
        }
      }

      return logs;
    } catch (error) {
      console.error('❌ 실시간 로그 조회 실패:', error);
      return [];
    }
  }

  /**
   * 📊 로그 통계 조회
   */
  async getLogStats(date?: string): Promise<{
    totalLogs: number;
    logLevels: Record<string, number>;
    topModules: Array<{ module: string; count: number }>;
    errorRate: number;
    realtimeCount: number;
  }> {
    try {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || '';
      const queryParams = new URLSearchParams();
      if (date) queryParams.set('date', date);

      const query = queryParams.toString() ? `?${queryParams.toString()}` : '';

      const response = await fetch(`${appUrl}/api/system-logs/stats${query}`);

      if (response.ok) {
        const stats = await response.json();

        // Redis에서 실시간 카운트 추가
        let realtimeCount = 0;
        if (this.redis) {
          try {
            const streamInfo = await this.redis.xinfo(
              'STREAM',
              this.config.redisStreamKey
            );
            realtimeCount = parseInt(streamInfo[1] || '0'); // length 정보
          } catch (error) {
            console.warn('Redis 스트림 정보 조회 실패:', error);
          }
        }

        return {
          ...stats,
          realtimeCount,
        };
      }

      return {
        totalLogs: 0,
        logLevels: {},
        topModules: [],
        errorRate: 0,
        realtimeCount: 0,
      };
    } catch (error) {
      console.error('❌ 로그 통계 조회 실패:', error);
      return {
        totalLogs: 0,
        logLevels: {},
        topModules: [],
        errorRate: 0,
        realtimeCount: 0,
      };
    }
  }

  /**
   * 🔍 로그 검색 (Firestore)
   */
  async searchLogs(
    query: string,
    level?: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL',
    module?: string,
    startDate?: string,
    endDate?: string,
    limit: number = 100
  ): Promise<SystemLogEntry[]> {
    try {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || '';
      const params = new URLSearchParams({
        query,
        limit: limit.toString(),
      });

      if (level) params.append('level', level);
      if (module) params.append('module', module);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await fetch(
        `${appUrl}/api/system-logs/search?${params}`
      );

      if (response.ok) {
        return await response.json();
      }

      return [];
    } catch (error) {
      console.error('❌ 로그 검색 실패:', error);
      return [];
    }
  }

  /**
   * 🧹 오래된 로그 정리
   */
  async cleanupOldLogs(): Promise<{
    deletedCount: number;
    oldestDate: string;
    success: boolean;
  }> {
    try {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || '';
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.config.logRetentionDays);

      const response = await fetch(`${appUrl}/api/system-logs/cleanup`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cutoffDate: cutoffDate.toISOString(),
          retentionDays: this.config.logRetentionDays,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`🧹 오래된 로그 정리 완료: ${result.deletedCount}개 삭제`);
        return result;
      }

      return {
        deletedCount: 0,
        oldestDate: '',
        success: false,
      };
    } catch (error) {
      console.error('❌ 로그 정리 실패:', error);
      return {
        deletedCount: 0,
        oldestDate: '',
        success: false,
      };
    }
  }

  /**
   * 🔧 편의 메서드들
   */
  debug(
    message: string,
    module: string,
    metadata?: Record<string, any>,
    sessionId?: string
  ): Promise<boolean> {
    return this.log('DEBUG', message, module, metadata, sessionId);
  }

  info(
    message: string,
    module: string,
    metadata?: Record<string, any>,
    sessionId?: string
  ): Promise<boolean> {
    return this.log('INFO', message, module, metadata, sessionId);
  }

  warn(
    message: string,
    module: string,
    metadata?: Record<string, any>,
    sessionId?: string
  ): Promise<boolean> {
    return this.log('WARN', message, module, metadata, sessionId);
  }

  error(
    message: string,
    module: string,
    error?: Error,
    metadata?: Record<string, any>,
    sessionId?: string
  ): Promise<boolean> {
    return this.log(
      'ERROR',
      message,
      module,
      metadata,
      sessionId,
      undefined,
      error?.stack
    );
  }

  critical(
    message: string,
    module: string,
    error?: Error,
    metadata?: Record<string, any>,
    sessionId?: string
  ): Promise<boolean> {
    return this.log(
      'CRITICAL',
      message,
      module,
      metadata,
      sessionId,
      undefined,
      error?.stack
    );
  }

  /**
   * 🔑 로그 ID 생성
   */
  private generateLogId(): string {
    return `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 🧹 서비스 종료 시 정리
   */
  async shutdown(): Promise<void> {
    console.log('🧹 CloudLoggingService 종료 시작...');

    // 배치 타이머 정지
    if (this.batchTimer) {
      clearInterval(this.batchTimer);
      this.batchTimer = null;
    }

    // 남은 로그 배치 처리
    if (this.logBuffer.length > 0) {
      console.log(`📦 종료 시 남은 로그 처리: ${this.logBuffer.length}개`);
      await this.processBatch();
    }

    console.log('🧹 CloudLoggingService 종료 완료');
  }
}
