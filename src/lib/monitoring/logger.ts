import { redis } from '@/lib/redis'
import { supabase } from '@/lib/supabase'
import { REDIS_PREFIXES, REDIS_TTL } from '@/config/redis'

// 로그 레벨 정의
export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL'
}

// 로그 레벨별 중요도
const LOG_LEVEL_PRIORITY = {
  [LogLevel.DEBUG]: 0,
  [LogLevel.INFO]: 1,
  [LogLevel.WARN]: 2,
  [LogLevel.ERROR]: 3,
  [LogLevel.CRITICAL]: 4
}

// 로그 엔트리 인터페이스
export interface LogEntry {
  id?: string;
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
  timestamp: string;
  source?: string;
}

// 로그 쿼리 옵션
export interface LogQueryOptions {
  level?: LogLevel;
  source?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

export class Logger {
  private static instance: Logger
  private minLevel: LogLevel = LogLevel.INFO

  // 싱글톤 인스턴스 가져오기
  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger()
    }
    return Logger.instance
  }

  // 최소 로그 레벨 설정
  setMinLevel(level: LogLevel): void {
    this.minLevel = level
  }

  // 로그 키 생성
  private getLogKey(date: string): string {
    return `${REDIS_PREFIXES.STATS}logs:${date}`
  }

  // 로그 엔트리 생성
  private createLogEntry(
    level: LogLevel,
    message: string,
    context?: Record<string, unknown>,
    source?: string
  ): LogEntry {
    return {
      level,
      message,
      context,
      timestamp: new Date().toISOString(),
      source: source || 'app'
    }
  }

  // 로그 저장 (Redis 캐시 + Supabase 하이브리드 구조)
  private async saveLog(entry: LogEntry): Promise<void> {
    try {
      // 현재 날짜 (YYYY-MM-DD)
      const today = new Date().toISOString().split('T')[0]
      const logKey = this.getLogKey(today)

      // 1. Redis에 로그 추가 (최신 로그를 목록 앞에 추가)
      await redis.lpush(logKey, JSON.stringify(entry))
      
      // 최대 1000개 로그 유지 (메모리 관리)
      await redis.ltrim(logKey, 0, 999)
      
      // Redis 키 만료 설정 (7일)
      await redis.expire(logKey, 7 * 86400)

      // 2. Supabase에 영구 저장 (INFO 이상 레벨만)
      if (LOG_LEVEL_PRIORITY[entry.level] >= LOG_LEVEL_PRIORITY[LogLevel.INFO]) {
        await supabase
          .from('system_logs')
          .insert({
            level: entry.level,
            message: entry.message,
            context: entry.context || {},
            source: entry.source,
            created_at: entry.timestamp
          })
      }

      // 3. 중요 로그는 별도 알림 테이블에도 저장
      if (LOG_LEVEL_PRIORITY[entry.level] >= LOG_LEVEL_PRIORITY[LogLevel.ERROR]) {
        await supabase
          .from('alerts')
          .insert({
            type: 'log_alert',
            message: `[${entry.level}] ${entry.message}`,
            data: entry,
            severity: entry.level === LogLevel.CRITICAL ? 'critical' : 'warning',
            created_at: entry.timestamp
          })
      }
    } catch (error) {
      // 로그 저장 실패 시 콘솔에만 출력
      console.error('로그 저장 실패:', error)
      console.log(`[${entry.level}] ${entry.message}`, entry.context || '')
    }
  }

  // 레벨별 로그 메서드들
  async debug(message: string, context?: Record<string, unknown>, source?: string): Promise<void> {
    if (LOG_LEVEL_PRIORITY[this.minLevel] <= LOG_LEVEL_PRIORITY[LogLevel.DEBUG]) {
      const entry = this.createLogEntry(LogLevel.DEBUG, message, context, source)
      console.debug(`[DEBUG] ${message}`, context || '')
      await this.saveLog(entry)
    }
  }

  async info(message: string, context?: Record<string, unknown>, source?: string): Promise<void> {
    if (LOG_LEVEL_PRIORITY[this.minLevel] <= LOG_LEVEL_PRIORITY[LogLevel.INFO]) {
      const entry = this.createLogEntry(LogLevel.INFO, message, context, source)
      console.info(`[INFO] ${message}`, context || '')
      await this.saveLog(entry)
    }
  }

  async warn(message: string, context?: Record<string, unknown>, source?: string): Promise<void> {
    if (LOG_LEVEL_PRIORITY[this.minLevel] <= LOG_LEVEL_PRIORITY[LogLevel.WARN]) {
      const entry = this.createLogEntry(LogLevel.WARN, message, context, source)
      console.warn(`[WARN] ${message}`, context || '')
      await this.saveLog(entry)
    }
  }

  async error(message: string, context?: Record<string, unknown>, source?: string): Promise<void> {
    if (LOG_LEVEL_PRIORITY[this.minLevel] <= LOG_LEVEL_PRIORITY[LogLevel.ERROR]) {
      const entry = this.createLogEntry(LogLevel.ERROR, message, context, source)
      console.error(`[ERROR] ${message}`, context || '')
      await this.saveLog(entry)
    }
  }

  async critical(message: string, context?: Record<string, unknown>, source?: string): Promise<void> {
    if (LOG_LEVEL_PRIORITY[this.minLevel] <= LOG_LEVEL_PRIORITY[LogLevel.CRITICAL]) {
      const entry = this.createLogEntry(LogLevel.CRITICAL, message, context, source)
      console.error(`[CRITICAL] ${message}`, context || '')
      await this.saveLog(entry)
    }
  }

  // 로그 조회 (Redis 캐시 우선, 없으면 Supabase 조회)
  async getLogs(options: LogQueryOptions = {}): Promise<LogEntry[]> {
    try {
      const {
        level,
        source,
        startDate,
        endDate = new Date().toISOString().split('T')[0],
        limit = 100,
        offset = 0
      } = options

      // 최근 날짜 범위 로그는 Redis에서 조회
      const today = new Date().toISOString().split('T')[0]
      
      if (!startDate || startDate === today) {
        // Redis에서 오늘 로그 조회
        const logKey = this.getLogKey(today)
        const logs = await redis.lrange(logKey, offset, offset + limit - 1)
        
        if (logs && logs.length > 0) {
          const parsedLogs = logs.map(log => JSON.parse(log as string) as LogEntry)
          
          // 필터링
          return this.filterLogs(parsedLogs, level, source)
        }
      }

      // Redis에 없거나 과거 로그는 Supabase에서 조회
      let query = supabase
        .from('system_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit)
        .range(offset, offset + limit - 1)
      
      // 필터 조건 추가
      if (level) {
        query = query.eq('level', level)
      }
      
      if (source) {
        query = query.eq('source', source)
      }
      
      if (startDate) {
        query = query.gte('created_at', `${startDate}T00:00:00Z`)
      }
      
      if (endDate) {
        query = query.lte('created_at', `${endDate}T23:59:59Z`)
      }
      
      const { data, error } = await query
      
      if (error) {
        throw error
      }
      
      // Supabase 결과를 LogEntry 형식으로 변환
      return data.map(log => ({
        id: log.id,
        level: log.level as LogLevel,
        message: log.message,
        context: log.context,
        timestamp: log.created_at,
        source: log.source
      }))
    } catch (error) {
      console.error('로그 조회 오류:', error)
      return []
    }
  }

  // 로그 필터링 도우미 함수
  private filterLogs(
    logs: LogEntry[],
    level?: LogLevel,
    source?: string
  ): LogEntry[] {
    return logs.filter(log => {
      // 레벨 필터
      if (level && log.level !== level) {
        return false
      }
      
      // 소스 필터
      if (source && log.source !== source) {
        return false
      }
      
      return true
    })
  }

  // 실시간 로그 스트림 구독 (웹소켓)
  async subscribeToLogs(callback: (log: LogEntry) => void): Promise<{ unsubscribe: () => void }> {
    // Supabase Realtime 구독 설정
    const subscription = supabase
      .channel('system_logs_channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'system_logs'
        },
        (payload) => {
          const log: LogEntry = {
            id: payload.new.id,
            level: payload.new.level as LogLevel,
            message: payload.new.message,
            context: payload.new.context,
            timestamp: payload.new.created_at,
            source: payload.new.source
          }
          
          callback(log)
        }
      )
      .subscribe()
    
    // 구독 해제 함수 반환
    return {
      unsubscribe: () => {
        subscription.unsubscribe()
      }
    }
  }
} 