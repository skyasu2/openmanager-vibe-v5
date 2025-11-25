/**
 * 🌐 Cloud-based Logging Service
 *
 * LoggingService 대체: 메모리 버퍼 + Supabase
 *
 * 기능:
 * - 프로덕션: ERROR/CRITICAL 레벨만 실시간 알림
 * - 개발환경: 전체 로그 메모리 스트림 처리
 * - Vercel 자체 로깅과 중복 기능 제거
 * - 핵심 장애 감지 및 알림에 집중
 * - 메모리 기반 로그 스트림 사용
 *
 * ✅ 리팩토링: 중복 코드 제거 - 통합 팩토리 사용
 */

import type { SupabaseClient } from '@supabase/supabase-js';


interface SystemLogEntry {
  id: string;
  level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL';
  message: string;
  module: string;
  timestamp: string;
  sessionId?: string;
  userId?: string;
  metadata?: Record<string, unknown>;
  stackTrace?: string;
}

interface LoggingConfig {
  enableMemoryStream: boolean;
  enableSupabase: boolean;
  enableRealTimeNotifications: boolean;
  memoryStreamKey: string;
  batchSize: number;
  batchInterval: number;
  maxStreamLength: number;
  logRetentionDays: number;
  isProduction: boolean;
  productionLogLevels: string[];
}

// 메모리 기반 로그 스트림 구현
class MemoryLogStream {
  private logs: Array<{
    id: string;
    entry: SystemLogEntry;
    timestamp: number;
  }> = [];
  private maxLength: number;
  private counters = new Map<string, number>();

  constructor(maxLength: number = 1000) {
    this.maxLength = maxLength;
  }

  add(entry: SystemLogEntry): void {
    const logItem = {
      id: this.generateStreamId(),
      entry,
      timestamp: Date.now(),
    };

    // 스트림 길이 제한
    if (this.logs.length >= this.maxLength) {
      const removed = this.logs.shift();
      if (removed) {
        const levelKey = removed.entry.level.toLowerCase();
        const count = this.counters.get(levelKey) || 0;
        if (count > 0) {
          this.counters.set(levelKey, count - 1);
        }
      }
    }

    this.logs.push(logItem);

    // 레벨별 카운터 증가
    const levelKey = entry.level.toLowerCase();
    this.counters.set(levelKey, (this.counters.get(levelKey) || 0) + 1);
  }

  getRecent(count: number = 50, level?: string): SystemLogEntry[] {
    let filteredLogs = this.logs;

    if (level) {
      filteredLogs = this.logs.filter(
        (log) => log.entry.level.toLowerCase() === level.toLowerCase()
      );
    }

    return filteredLogs
      .slice(-count)
      .reverse()
      .map((log) => log.entry);
  }

  getCount(level?: string): number {
    if (level) {
      return this.counters.get(level.toLowerCase()) || 0;
    }
    return this.logs.length;
  }

  getInfo(): {
    length: number;
    oldestTimestamp: number;
    newestTimestamp: number;
  } {
    if (this.logs.length === 0) {
      return { length: 0, oldestTimestamp: 0, newestTimestamp: 0 };
    }

    return {
      length: this.logs.length,
      oldestTimestamp: this.logs[0]?.timestamp ?? Date.now(),
      newestTimestamp: this.logs[this.logs.length - 1]?.timestamp ?? Date.now(),
    };
  }

  clear(): void {
    this.logs = [];
    this.counters.clear();
  }

  private generateStreamId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }
}

export class CloudLoggingService {
  private supabase: SupabaseClient | null = null;
  private supabaseInitialized = false;
  private static instance: CloudLoggingService;
  private config: LoggingConfig;
  private memoryStream: MemoryLogStream;
  private logBuffer: SystemLogEntry[] = [];
  private batchTimer: NodeJS.Timeout | null = null;
  private isProcessing = false;

  constructor(config?: Partial<LoggingConfig>) {
    const isProduction = process.env.NODE_ENV === 'production';

    this.config = {
      enableMemoryStream: true, // 항상 활성화
      enableSupabase: !!process.env.NEXT_PUBLIC_SUPABASE_URL, // Supabase 설정 시만
      enableRealTimeNotifications: true, // 핵심 알림은 유지
      memoryStreamKey: 'openmanager:system:logs',
      batchSize: 50,
      batchInterval: 10000, // 10초
      maxStreamLength: isProduction ? 100 : 1000, // 프로덕션에서는 최소화
      logRetentionDays: isProduction ? 3 : 30, // 프로덕션 3일, 개발 30일
      isProduction,
      productionLogLevels: ['ERROR', 'CRITICAL'], // 프로덕션에서는 중요 로그만
      ...config,
    };

    // 메모리 스트림 초기화
    this.memoryStream = new MemoryLogStream(this.config.maxStreamLength);

    // Supabase 연결 (환경변수 있을 때만) - 팩토리 사용
    if (
      this.config.enableSupabase &&
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ) {
      this.supabase = this.supabase!;
      this.startBatchProcessor();
    }

    console.log(
      `🌐 CloudLoggingService 초기화 완료 (${isProduction ? 'Production' : 'Development'} 모드)`
    );
    console.log(
      `📦 스토리지: Memory${this.supabase ? ' + Supabase' : ' Only'}`
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
   * 📝 시스템 로그 기록 (Memory Stream + Supabase 배치)
   */
  async log(
    level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL',
    message: string,
    module: string,
    metadata?: Record<string, unknown>,
    sessionId?: string,
    userId?: string,
    stackTrace?: string
  ): Promise<boolean> {
    try {
      // 프로덕션에서는 중요 로그만 처리
      if (
        this.config.isProduction &&
        !this.config.productionLogLevels.includes(level)
      ) {
        return true; // 조용히 무시
      }

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

      // 1. 메모리 스트림에 실시간 기록
      if (this.config.enableMemoryStream) {
        this.addToMemoryStream(logEntry);
      }

      // 2. 배치 버퍼에 추가 (Supabase 저장용)
      if (this.config.enableSupabase) {
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
   * 🔄 메모리 스트림에 로그 추가
   */
  private addToMemoryStream(logEntry: SystemLogEntry): void {
    try {
      this.memoryStream.add(logEntry);
      console.log(
        `✅ Memory Stream 로그 추가: ${logEntry.id} [${logEntry.level}]`
      );
    } catch (error) {
      console.error('❌ Memory Stream 로그 추가 실패:', error);
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
      void this.processBatch();
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
        void this.processBatch();
      }
    }, this.config.batchInterval);

    console.log('⏰ 로그 배치 처리기 시작');
  }

  /**
   * 📦 Supabase 배치 처리
   */
  private async processBatch(): Promise<void> {
    if (this.isProcessing || this.logBuffer.length === 0 || !this.supabase)
      return;

    this.isProcessing = true;
    const batch = [...this.logBuffer];
    this.logBuffer = [];

    try {
      // Supabase 배치 저장
      const { error } = await this.supabase.from('system_logs').insert(
        batch.map((log) => ({
          id: log.id,
          level: log.level,
          message: log.message,
          module: log.module,
          timestamp: log.timestamp,
          session_id: log.sessionId,
          user_id: log.userId,
          metadata: log.metadata,
          stack_trace: log.stackTrace,
        }))
      );

      if (error) throw error;

      console.log(`📦 Supabase 로그 배치 저장 완료: ${batch.length}개`);
    } catch (error) {
      console.error('❌ Supabase 배치 저장 실패:', error);
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
      // Webhook이나 외부 알림 서비스로 전송
      const webhookUrl = process.env.NEXT_PUBLIC_LOG_WEBHOOK_URL;
      if (webhookUrl) {
        await fetch(webhookUrl, {
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
      }

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
    try {
      return this.memoryStream.getRecent(count, level);
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
      // 메모리 스트림에서 실시간 카운트
      const streamInfo = this.memoryStream.getInfo();
      const realtimeCount = streamInfo.length;

      // Supabase에서 히스토리 통계 (날짜별)
      const supabaseStats = {
        totalLogs: 0,
        logLevels: {} as Record<string, number>,
        topModules: [] as Array<{ module: string; count: number }>,
        errorRate: 0,
      };

      if (this.supabase) {
        const query = this.supabase.from('system_logs').select('level, module');

        if (date) {
          const startDate = new Date(date);
          const endDate = new Date(startDate);
          endDate.setDate(endDate.getDate() + 1);

          query
            .gte('timestamp', startDate.toISOString())
            .lt('timestamp', endDate.toISOString());
        }

        const { data, error } = await query;

        if (!error && data) {
          supabaseStats.totalLogs = data.length;

          // 로그 레벨별 집계
          const levelCounts: Record<string, number> = {};
          const moduleCounts: Record<string, number> = {};

          data.forEach((log) => {
            const level = String(log.level);
            const moduleName = String(log.module);
            levelCounts[level] = (levelCounts[level] || 0) + 1;
            moduleCounts[moduleName] = (moduleCounts[moduleName] || 0) + 1;
          });

          supabaseStats.logLevels = levelCounts;
          supabaseStats.topModules = Object.entries(moduleCounts)
            .map(([module, count]) => ({ module, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);

          // 에러율 계산
          const errorCount =
            (levelCounts['ERROR'] || 0) + (levelCounts['CRITICAL'] || 0);
          supabaseStats.errorRate =
            data.length > 0 ? (errorCount / data.length) * 100 : 0;
        }
      }

      return {
        ...supabaseStats,
        realtimeCount,
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
   * 🔍 로그 검색 (Supabase)
   */
  async searchLogs(
    query: string,
    level?: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL',
    moduleName?: string,
    startDate?: string,
    endDate?: string,
    limit: number = 100
  ): Promise<SystemLogEntry[]> {
    if (!this.supabase) return [];

    try {
      let dbQuery = this.supabase
        .from('system_logs')
        .select('*')
        .ilike('message', `%${query}%`)
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (level) {
        dbQuery = dbQuery.eq('level', level);
      }

      if (moduleName) {
        dbQuery = dbQuery.eq('module', moduleName);
      }

      if (startDate) {
        dbQuery = dbQuery.gte('timestamp', startDate);
      }

      if (endDate) {
        dbQuery = dbQuery.lte('timestamp', endDate);
      }

      const { data, error } = await dbQuery;

      if (error) throw error;
      if (!data) return [];

      return data.map((log) => ({
        id: String(log.id),
        level: String(log.level) as
          | 'DEBUG'
          | 'INFO'
          | 'WARN'
          | 'ERROR'
          | 'CRITICAL',
        message: String(log.message),
        module: String(log.module),
        timestamp: String(log.timestamp),
        sessionId: String(log.session_id),
        userId: String(log.user_id),
        metadata: log.metadata as Record<string, unknown> | undefined,
        stackTrace: String(log.stack_trace),
      }));
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
    if (!this.supabase) {
      return {
        deletedCount: 0,
        oldestDate: '',
        success: false,
      };
    }

    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.config.logRetentionDays);

      const { data, error } = await this.supabase
        .from('system_logs')
        .delete()
        .lt('timestamp', cutoffDate.toISOString())
        .select('count');

      if (error) throw error;

      const deletedCount = Array.isArray(data) ? data.length : 0;
      console.log(`🧹 오래된 로그 정리 완료: ${deletedCount}개 삭제`);

      return {
        deletedCount,
        oldestDate: cutoffDate.toISOString(),
        success: true,
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
    metadata?: Record<string, unknown>,
    sessionId?: string
  ): Promise<boolean> {
    return this.log('DEBUG', message, module, metadata, sessionId);
  }

  info(
    message: string,
    module: string,
    metadata?: Record<string, unknown>,
    sessionId?: string
  ): Promise<boolean> {
    return this.log('INFO', message, module, metadata, sessionId);
  }

  warn(
    message: string,
    module: string,
    metadata?: Record<string, unknown>,
    sessionId?: string
  ): Promise<boolean> {
    return this.log('WARN', message, module, metadata, sessionId);
  }

  error(
    message: string,
    module: string,
    error?: Error,
    metadata?: Record<string, unknown>,
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
    metadata?: Record<string, unknown>,
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

    // 메모리 스트림 정리
    this.memoryStream.clear();

    console.log('🧹 CloudLoggingService 종료 완료');
  }
}
