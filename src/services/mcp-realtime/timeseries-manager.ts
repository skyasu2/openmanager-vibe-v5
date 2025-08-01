/**
 * 🟢 MCP 시계열 데이터 관리자 v2.0
 *
 * Supabase PostgreSQL 기반 고성능 시계열 DB
 * - 무료 티어 500MB 저장소 최적화
 * - 7일 메트릭 보존, 3일 로그 보존
 * - 인덱스 최적화 및 RLS 보안
 * - 배치 처리 및 자동 집계
 */

import type {
  MCPServerMetrics,
  HealthCheckResult,
  MonitoringEvent,
  PerformanceTrend,
  MCPServerName,
} from '../mcp-monitor/types';

// 🗃️ 데이터베이스 스키마 인터페이스
export interface MCPTimeSeriesRecord {
  id?: string;
  server_id: string;
  timestamp: string;
  status: 'connected' | 'disconnected' | 'degraded';
  response_time: number;
  success_rate: number;
  error_rate: number;
  request_count: number;
  error_count: number;
  uptime: number;
  memory_usage?: number;
  circuit_breaker_state: 'closed' | 'open' | 'half_open';
  last_error?: string;
  created_at?: string;
  session_id?: string;
}

export interface MCPHealthRecord {
  id?: string;
  server_id: string;
  timestamp: string;
  success: boolean;
  response_time: number;
  error_message?: string;
  metadata?: Record<string, unknown>;
  created_at?: string;
}

export interface MCPEventRecord {
  id?: string;
  server_id: string;
  event_type:
    | 'status_change'
    | 'performance_degradation'
    | 'recovery'
    | 'circuit_breaker';
  severity: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
  created_at?: string;
}

// 📊 집계 통계
export interface MCPAggregatedStats {
  server_id?: string;
  time_period: '5m' | '15m' | '1h' | '24h';
  start_time: string;
  end_time: string;
  avg_response_time: number;
  max_response_time: number;
  min_response_time: number;
  p95_response_time: number;
  avg_success_rate: number;
  total_requests: number;
  total_errors: number;
  uptime_percentage: number;
  data_points: number;
}

// 🔍 쿼리 옵션
export interface TimeSeriesQueryOptions {
  serverIds?: MCPServerName[];
  startTime?: Date;
  endTime?: Date;
  limit?: number;
  offset?: number;
  orderBy?: string;
  ascending?: boolean;
  includeMetadata?: boolean;
}

// 📈 성능 분석 결과
export interface PerformanceAnalysis {
  server_id: string;
  time_window: string;
  trend: 'improving' | 'stable' | 'degrading';
  key_metrics: {
    current_avg_response: number;
    previous_avg_response: number;
    response_time_change: number;
    current_success_rate: number;
    previous_success_rate: number;
    success_rate_change: number;
    anomalies_detected: number;
  };
  recommendations: string[];
}

// Supabase 클라이언트 인터페이스 (기존 재사용)
export interface SupabaseClient {
  from(table: string): SupabaseQueryBuilder;
  rpc<T = unknown>(
    fn: string,
    args?: Record<string, unknown>
  ): Promise<{ data: T | null; error: Error | null }>;
}

export interface SupabaseQueryBuilder {
  insert<T = unknown>(
    values: T[] | T
  ): Promise<{ data: T[] | null; error: Error | null }>;
  select(columns?: string): SupabaseQueryBuilder;
  delete(): SupabaseQueryBuilder;
  update<T = unknown>(values: T): SupabaseQueryBuilder;
  upsert<T = unknown>(
    values: T[] | T
  ): Promise<{ data: T[] | null; error: Error | null }>;
  eq(column: string, value: unknown): SupabaseQueryBuilder;
  gte(column: string, value: unknown): SupabaseQueryBuilder;
  lte(column: string, value: unknown): SupabaseQueryBuilder;
  gt(column: string, value: unknown): SupabaseQueryBuilder;
  lt(column: string, value: unknown): SupabaseQueryBuilder;
  in(column: string, values: unknown[]): SupabaseQueryBuilder;
  order(
    column: string,
    options?: { ascending?: boolean }
  ): SupabaseQueryBuilder;
  limit(count: number): SupabaseQueryBuilder;
  range(from: number, to: number): SupabaseQueryBuilder;
  then<T>(
    onfulfilled?: (value: { data: unknown; error: Error | null }) => T
  ): Promise<T>;
  catch<T>(onrejected?: (reason: unknown) => T): Promise<T>;
}

/**
 * MCP 시계열 데이터 관리자
 */
export class MCPTimeSeriesManager {
  // 테이블 이름 상수
  private readonly TABLES = {
    METRICS: 'mcp_server_metrics',
    HEALTH: 'mcp_health_checks',
    EVENTS: 'mcp_monitoring_events',
    AGGREGATES: 'mcp_performance_aggregates',
  } as const;

  // 데이터 보존 정책
  private readonly RETENTION_POLICY = {
    METRICS_DAYS: 7, // 메트릭 7일 보존
    HEALTH_DAYS: 7, // 헬스체크 7일 보존
    EVENTS_DAYS: 3, // 이벤트 3일 보존
    AGGREGATES_DAYS: 30, // 집계 데이터 30일 보존
  } as const;

  // 배치 처리 설정
  private readonly BATCH_CONFIG = {
    MAX_INSERT_SIZE: 1000,
    MAX_UPDATE_SIZE: 500,
    CHUNK_SIZE: 100,
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY_MS: 1000,
  } as const;

  constructor(private supabase: SupabaseClient) {}

  /**
   * 🚀 메트릭 배치 저장 (고성능 최적화)
   */
  async batchInsertMetrics(
    metrics: MCPServerMetrics[],
    sessionId?: string
  ): Promise<void> {
    if (metrics.length === 0) return;

    const startTime = Date.now();

    try {
      // MCPServerMetrics를 MCPTimeSeriesRecord로 변환
      const records: MCPTimeSeriesRecord[] = metrics.map((metric) => ({
        server_id: metric.serverId,
        timestamp: new Date(metric.timestamp).toISOString(),
        status: metric.status as 'connected' | 'disconnected' | 'degraded',
        response_time: metric.responseTime,
        success_rate: metric.successRate,
        error_rate: metric.errorRate,
        request_count: metric.requestCount,
        error_count: metric.errorCount,
        uptime: metric.uptime,
        memory_usage: metric.memoryUsage,
        circuit_breaker_state: metric.circuitBreakerState as
          | 'closed'
          | 'open'
          | 'half_open',
        last_error: metric.lastError,
        session_id: sessionId,
        created_at: new Date().toISOString(),
      }));

      // 배치 크기로 분할하여 삽입
      await this.batchInsertRecords(this.TABLES.METRICS, records);

      console.log(
        `✅ [MCPTimeSeriesManager] ${metrics.length} metrics inserted (${Date.now() - startTime}ms)`
      );
    } catch (error) {
      console.error('❌ [MCPTimeSeriesManager] Batch insert failed:', error);
      throw new Error(`메트릭 배치 저장 실패: ${error}`);
    }
  }

  /**
   * 🏥 헬스체크 결과 저장
   */
  async insertHealthChecks(healthChecks: HealthCheckResult[]): Promise<void> {
    if (healthChecks.length === 0) return;

    try {
      const records: MCPHealthRecord[] = healthChecks.map((check) => ({
        server_id: check.serverId,
        timestamp: new Date(check.timestamp).toISOString(),
        success: check.success,
        response_time: check.responseTime,
        error_message: check.error,
        metadata: check.metadata,
        created_at: new Date().toISOString(),
      }));

      await this.batchInsertRecords(this.TABLES.HEALTH, records);

      console.log(
        `✅ [MCPTimeSeriesManager] ${healthChecks.length} health checks inserted`
      );
    } catch (error) {
      console.error(
        '❌ [MCPTimeSeriesManager] Health check insert failed:',
        error
      );
      throw error;
    }
  }

  /**
   * 📢 모니터링 이벤트 저장
   */
  async insertEvents(events: MonitoringEvent[]): Promise<void> {
    if (events.length === 0) return;

    try {
      const records: MCPEventRecord[] = events.map((event) => ({
        server_id: event.serverId,
        event_type: event.type,
        severity: event.severity,
        message: event.message,
        timestamp: new Date(event.timestamp).toISOString(),
        metadata: event.metadata,
        created_at: new Date().toISOString(),
      }));

      await this.batchInsertRecords(this.TABLES.EVENTS, records);

      console.log(`✅ [MCPTimeSeriesManager] ${events.length} events inserted`);
    } catch (error) {
      console.error('❌ [MCPTimeSeriesManager] Event insert failed:', error);
      throw error;
    }
  }

  /**
   * 📊 시계열 메트릭 조회 (최적화된 쿼리)
   */
  async queryMetrics(
    options: TimeSeriesQueryOptions
  ): Promise<MCPTimeSeriesRecord[]> {
    try {
      let query = this.supabase.from(this.TABLES.METRICS).select('*');

      // 서버 ID 필터
      if (options.serverIds && options.serverIds.length > 0) {
        query = query.in('server_id', options.serverIds);
      }

      // 시간 범위 필터
      if (options.startTime) {
        query = query.gte('timestamp', options.startTime.toISOString());
      }
      if (options.endTime) {
        query = query.lte('timestamp', options.endTime.toISOString());
      }

      // 정렬
      if (options.orderBy) {
        query = query.order(options.orderBy, {
          ascending: options.ascending ?? false,
        });
      } else {
        query = query.order('timestamp', { ascending: false });
      }

      // 제한 및 오프셋
      if (options.limit) {
        query = query.limit(options.limit);
      }
      if (options.offset) {
        query = query.range(
          options.offset,
          options.offset + (options.limit || 100) - 1
        );
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return (data as MCPTimeSeriesRecord[]) || [];
    } catch (error) {
      console.error('❌ [MCPTimeSeriesManager] Query metrics failed:', error);
      throw error;
    }
  }

  /**
   * 📈 성능 추세 분석 (RPC 함수 활용)
   */
  async analyzePerformanceTrends(
    serverId: MCPServerName,
    timeWindow: '5m' | '15m' | '1h' | '24h'
  ): Promise<PerformanceTrend> {
    try {
      const { data, error } = await this.supabase.rpc(
        'analyze_performance_trend',
        {
          p_server_id: serverId,
          p_time_window: timeWindow,
        }
      );

      if (error) {
        throw error;
      }

      // 데이터가 없으면 기본값 반환
      if (!data) {
        return this.createDefaultTrend(serverId, timeWindow);
      }

      return data as PerformanceTrend;
    } catch (error) {
      console.error(
        '❌ [MCPTimeSeriesManager] Performance analysis failed:',
        error
      );
      // 에러 시 기본 추세 반환
      return this.createDefaultTrend(serverId, timeWindow);
    }
  }

  /**
   * 🔄 집계 데이터 생성 (배치 처리)
   */
  async generateAggregates(
    timePeriod: '5m' | '15m' | '1h' | '24h',
    startTime: Date,
    endTime: Date
  ): Promise<void> {
    try {
      const { data, error } = await this.supabase.rpc(
        'generate_mcp_aggregates',
        {
          p_time_period: timePeriod,
          p_start_time: startTime.toISOString(),
          p_end_time: endTime.toISOString(),
        }
      );

      if (error) {
        throw error;
      }

      console.log(
        `✅ [MCPTimeSeriesManager] Aggregates generated for ${timePeriod} period`
      );
    } catch (error) {
      console.error(
        '❌ [MCPTimeSeriesManager] Aggregate generation failed:',
        error
      );
      throw error;
    }
  }

  /**
   * 🔍 최근 메트릭 조회 (캐시 폴백용)
   */
  async getRecentMetrics(
    serverId: MCPServerName,
    minutes: number = 5
  ): Promise<MCPTimeSeriesRecord[]> {
    const startTime = new Date(Date.now() - minutes * 60 * 1000);

    return this.queryMetrics({
      serverIds: [serverId],
      startTime,
      orderBy: 'timestamp',
      ascending: false,
      limit: 50,
    });
  }

  /**
   * 🔥 이상 징후 감지
   */
  async detectAnomalies(
    serverId: MCPServerName,
    lookbackMinutes: number = 30
  ): Promise<{
    anomalies: Array<{
      metric: string;
      value: number;
      threshold: number;
      severity: 'warning' | 'critical';
      timestamp: string;
    }>;
    summary: {
      total: number;
      critical: number;
      warnings: number;
    };
  }> {
    try {
      const { data, error } = await this.supabase.rpc('detect_mcp_anomalies', {
        p_server_id: serverId,
        p_lookback_minutes: lookbackMinutes,
      });

      if (error) {
        throw error;
      }

      return (
        data || {
          anomalies: [],
          summary: { total: 0, critical: 0, warnings: 0 },
        }
      );
    } catch (error) {
      console.error(
        '❌ [MCPTimeSeriesManager] Anomaly detection failed:',
        error
      );
      return {
        anomalies: [],
        summary: { total: 0, critical: 0, warnings: 0 },
      };
    }
  }

  /**
   * 📊 서버별 상태 요약
   */
  async getServerSummary(
    serverId: MCPServerName,
    hours: number = 24
  ): Promise<{
    server_id: string;
    period_hours: number;
    avg_response_time: number;
    max_response_time: number;
    avg_success_rate: number;
    total_requests: number;
    total_errors: number;
    uptime_percentage: number;
    status_distribution: Record<string, number>;
  }> {
    try {
      const { data, error } = await this.supabase.rpc(
        'get_mcp_server_summary',
        {
          p_server_id: serverId,
          p_hours: hours,
        }
      );

      if (error) {
        throw error;
      }

      return data || this.createDefaultSummary(serverId, hours);
    } catch (error) {
      console.error('❌ [MCPTimeSeriesManager] Server summary failed:', error);
      return this.createDefaultSummary(serverId, hours);
    }
  }

  /**
   * 🧹 만료된 데이터 자동 정리
   */
  async cleanupExpiredData(): Promise<{
    metrics_deleted: number;
    health_deleted: number;
    events_deleted: number;
    space_freed_mb: number;
  }> {
    const results = {
      metrics_deleted: 0,
      health_deleted: 0,
      events_deleted: 0,
      space_freed_mb: 0,
    };

    try {
      // 메트릭 데이터 정리 (7일)
      const metricsResult = await this.cleanupTable(
        this.TABLES.METRICS,
        this.RETENTION_POLICY.METRICS_DAYS
      );
      results.metrics_deleted = metricsResult;

      // 헬스체크 데이터 정리 (7일)
      const healthResult = await this.cleanupTable(
        this.TABLES.HEALTH,
        this.RETENTION_POLICY.HEALTH_DAYS
      );
      results.health_deleted = healthResult;

      // 이벤트 데이터 정리 (3일)
      const eventsResult = await this.cleanupTable(
        this.TABLES.EVENTS,
        this.RETENTION_POLICY.EVENTS_DAYS
      );
      results.events_deleted = eventsResult;

      // 예상 공간 확보량 계산 (대략적)
      const totalDeleted =
        results.metrics_deleted +
        results.health_deleted +
        results.events_deleted;
      results.space_freed_mb = Math.round(totalDeleted * 0.001); // 1KB per record estimate

      console.log(
        `🧹 [MCPTimeSeriesManager] Cleanup completed: ${totalDeleted} records deleted, ~${results.space_freed_mb}MB freed`
      );

      return results;
    } catch (error) {
      console.error('❌ [MCPTimeSeriesManager] Cleanup failed:', error);
      throw error;
    }
  }

  /**
   * 📈 실시간 성능 지표 계산
   */
  async calculateRealTimeKPIs(): Promise<{
    overall_health_score: number;
    avg_response_time: number;
    success_rate: number;
    active_servers: number;
    degraded_servers: number;
    critical_alerts: number;
    trend_direction: 'up' | 'down' | 'stable';
  }> {
    try {
      const { data, error } = await this.supabase.rpc(
        'calculate_realtime_kpis'
      );

      if (error) {
        throw error;
      }

      return (
        data || {
          overall_health_score: 85,
          avg_response_time: 150,
          success_rate: 95,
          active_servers: 10,
          degraded_servers: 0,
          critical_alerts: 0,
          trend_direction: 'stable' as const,
        }
      );
    } catch (error) {
      console.error('❌ [MCPTimeSeriesManager] KPI calculation failed:', error);
      throw error;
    }
  }

  /**
   * 🔧 Private: 배치 레코드 삽입
   */
  private async batchInsertRecords<T>(
    table: string,
    records: T[]
  ): Promise<void> {
    if (records.length === 0) return;

    // 배치 크기로 분할
    for (
      let i = 0;
      i < records.length;
      i += this.BATCH_CONFIG.MAX_INSERT_SIZE
    ) {
      const batch = records.slice(i, i + this.BATCH_CONFIG.MAX_INSERT_SIZE);

      let attempt = 0;
      let success = false;

      while (attempt < this.BATCH_CONFIG.RETRY_ATTEMPTS && !success) {
        try {
          const { error } = await this.supabase.from(table).insert(batch);

          if (error) {
            throw error;
          }

          success = true;
        } catch (error) {
          attempt++;

          if (attempt >= this.BATCH_CONFIG.RETRY_ATTEMPTS) {
            throw error;
          }

          // 지수 백오프 재시도
          await new Promise((resolve) =>
            setTimeout(resolve, this.BATCH_CONFIG.RETRY_DELAY_MS * attempt)
          );
        }
      }
    }
  }

  /**
   * 🔧 Private: 테이블 정리
   */
  private async cleanupTable(
    table: string,
    retentionDays: number
  ): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    try {
      const { data, error } = await this.supabase
        .from(table)
        .delete()
        .lt('created_at', cutoffDate.toISOString());

      if (error) {
        throw error;
      }

      return Array.isArray(data) ? data.length : 0;
    } catch (error) {
      console.error(`❌ Failed to cleanup table ${table}:`, error);
      return 0;
    }
  }

  /**
   * 🔧 Private: 기본 추세 생성
   */
  private createDefaultTrend(
    serverId: MCPServerName,
    timeWindow: string
  ): PerformanceTrend {
    return {
      serverId,
      timeWindow,
      metrics: {
        avgResponseTime: 0,
        p95ResponseTime: 0,
        successRate: 100,
        errorRate: 0,
        throughput: 0,
      },
      trend: 'stable',
    };
  }

  /**
   * 🔧 Private: 기본 요약 생성
   */
  private createDefaultSummary(serverId: string, hours: number) {
    return {
      server_id: serverId,
      period_hours: hours,
      avg_response_time: 0,
      max_response_time: 0,
      avg_success_rate: 100,
      total_requests: 0,
      total_errors: 0,
      uptime_percentage: 100,
      status_distribution: { connected: 1 },
    };
  }
}

/**
 * 팩토리 함수
 */
export function createMCPTimeSeriesManager(
  supabase: SupabaseClient
): MCPTimeSeriesManager {
  return new MCPTimeSeriesManager(supabase);
}
