/**
 * 🗄️ Supabase Database Adapter
 *
 * Supabase를 위한 데이터베이스 어댑터 구현
 * - 서버 메트릭 저장/조회
 * - 자동 스키마 검증
 * - 배치 처리 최적화
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  DatabaseAdapter,
  StandardServerMetrics,
} from './SystemIntegrationAdapter';

export interface SupabaseConfig {
  url: string;
  apiKey: string;
  maxConnections?: number;
  timeout?: number;
}

export class SupabaseDatabaseAdapter implements DatabaseAdapter {
  private client: SupabaseClient | null = null;
  private config: SupabaseConfig;
  private isConnected = false;

  constructor(config: SupabaseConfig) {
    this.config = config;
  }

  async connect(): Promise<void> {
    try {
      this.client = createClient(this.config.url, this.config.apiKey, {
        auth: {
          persistSession: false,
        },
        db: {
          schema: 'public',
        },
      });

      // 연결 테스트
      const { error } = await this.client
        .from('server_metrics')
        .select('count')
        .limit(1);
      if (
        error &&
        !error.message.includes('relation "server_metrics" does not exist')
      ) {
        throw error;
      }

      this.isConnected = true;
      console.log('✅ Supabase 데이터베이스 연결 완료');
    } catch (error) {
      console.error('❌ Supabase 연결 실패:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      // Supabase 클라이언트는 명시적 연결 해제가 필요 없음
      this.client = null;
      this.isConnected = false;
      console.log('✅ Supabase 연결 해제 완료');
    }
  }

  async saveMetrics(metrics: StandardServerMetrics): Promise<void> {
    if (!this.client || !this.isConnected) {
      throw new Error('Supabase 클라이언트가 연결되지 않았습니다');
    }

    try {
      const dbRecord = this.transformToDbRecord(metrics);

      const { error } = await this.client
        .from('server_metrics')
        .insert(dbRecord);

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error(`❌ 메트릭 저장 실패 (${metrics.serverId}):`, error);
      throw error;
    }
  }

  async getLatestMetrics(
    serverId: string
  ): Promise<StandardServerMetrics | null> {
    if (!this.client || !this.isConnected) {
      throw new Error('Supabase 클라이언트가 연결되지 않았습니다');
    }

    try {
      const { data, error } = await this.client
        .from('server_metrics')
        .select('*')
        .eq('server_id', serverId)
        .order('timestamp', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows found
          return null;
        }
        throw error;
      }

      return this.transformFromDbRecord(data);
    } catch (error) {
      console.error(`❌ 최신 메트릭 조회 실패 (${serverId}):`, error);
      return null;
    }
  }

  async getServerList(): Promise<string[]> {
    if (!this.client || !this.isConnected) {
      throw new Error('Supabase 클라이언트가 연결되지 않았습니다');
    }

    try {
      const { data, error } = await this.client
        .from('server_metrics')
        .select('server_id')
        .gte(
          'timestamp',
          new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
        )
        .order('timestamp', { ascending: false });

      if (error) {
        throw error;
      }

      // 중복 제거
      const uniqueServers = [...new Set(data?.map(row => row.server_id) || [])];
      return uniqueServers;
    } catch (error) {
      console.error('❌ 서버 목록 조회 실패:', error);
      return [];
    }
  }

  async getMetricsHistory(
    serverId: string,
    timeRange: { start: Date; end: Date }
  ): Promise<StandardServerMetrics[]> {
    if (!this.client || !this.isConnected) {
      throw new Error('Supabase 클라이언트가 연결되지 않았습니다');
    }

    try {
      const { data, error } = await this.client
        .from('server_metrics')
        .select('*')
        .eq('server_id', serverId)
        .gte('timestamp', timeRange.start.toISOString())
        .lte('timestamp', timeRange.end.toISOString())
        .order('timestamp', { ascending: true });

      if (error) {
        throw error;
      }

      return data?.map(record => this.transformFromDbRecord(record)) || [];
    } catch (error) {
      console.error(`❌ 메트릭 히스토리 조회 실패 (${serverId}):`, error);
      return [];
    }
  }

  async cleanup(olderThan: Date): Promise<number> {
    if (!this.client || !this.isConnected) {
      throw new Error('Supabase 클라이언트가 연결되지 않았습니다');
    }

    try {
      const { data, error } = await this.client
        .from('server_metrics')
        .delete()
        .lt('timestamp', olderThan.toISOString())
        .select('id');

      if (error) {
        throw error;
      }

      const deletedCount = data?.length || 0;
      console.log(`🧹 Supabase 정리 완료: ${deletedCount}개 레코드 삭제`);
      return deletedCount;
    } catch (error) {
      console.error('❌ Supabase 정리 실패:', error);
      return 0;
    }
  }

  /**
   * 표준 메트릭을 DB 레코드로 변환
   */
  private transformToDbRecord(metrics: StandardServerMetrics): any {
    return {
      server_id: metrics.serverId,
      hostname: metrics.hostname,
      timestamp: metrics.timestamp.toISOString(),

      // CPU 메트릭
      cpu_usage: metrics.metrics.cpu.usage,
      cpu_load_avg: metrics.metrics.cpu.loadAverage,
      cpu_cores: metrics.metrics.cpu.cores,

      // 메모리 메트릭
      memory_total: metrics.metrics.memory.total,
      memory_used: metrics.metrics.memory.used,
      memory_usage: metrics.metrics.memory.usage,

      // 디스크 메트릭
      disk_total: metrics.metrics.disk.total,
      disk_used: metrics.metrics.disk.used,
      disk_usage: metrics.metrics.disk.usage,

      // 네트워크 메트릭
      network_interface: metrics.metrics.network.interface,
      network_bytes_received: metrics.metrics.network.bytesReceived,
      network_bytes_sent: metrics.metrics.network.bytesSent,
      network_errors_received: metrics.metrics.network.errorsReceived,
      network_errors_sent: metrics.metrics.network.errorsSent,

      // 시스템 정보
      os: 'linux', // 기본값
      uptime: Math.floor((Date.now() - metrics.timestamp.getTime()) / 1000),
      processes_total: 100, // 기본값
      processes_zombie: 0,

      // 서비스 상태 (JSON)
      services: JSON.stringify(metrics.services),

      // 메타데이터
      location: metrics.metadata.location,
      environment: metrics.metadata.environment,
      provider: metrics.metadata.provider,

      // 원시 데이터
      raw_data: JSON.stringify(metrics),

      created_at: new Date().toISOString(),
    };
  }

  /**
   * DB 레코드를 표준 메트릭으로 변환
   */
  private transformFromDbRecord(record: any): StandardServerMetrics {
    return {
      serverId: record.server_id,
      hostname: record.hostname,
      timestamp: new Date(record.timestamp),
      status: this.determineStatus(record),
      metrics: {
        cpu: {
          usage: record.cpu_usage,
          loadAverage: record.cpu_load_avg || [0, 0, 0],
          cores: record.cpu_cores,
        },
        memory: {
          total: record.memory_total,
          used: record.memory_used,
          available: record.memory_total - record.memory_used,
          usage: record.memory_usage,
        },
        disk: {
          total: record.disk_total,
          used: record.disk_used,
          available: record.disk_total - record.disk_used,
          usage: record.disk_usage,
          iops: {
            read: 0, // 기본값
            write: 0,
          },
        },
        network: {
          interface: record.network_interface,
          bytesReceived: record.network_bytes_received,
          bytesSent: record.network_bytes_sent,
          packetsReceived: 0, // 기본값
          packetsSent: 0,
          errorsReceived: record.network_errors_received,
          errorsSent: record.network_errors_sent,
        },
      },
      services: JSON.parse(record.services || '[]'),
      metadata: {
        location: record.location,
        environment: record.environment,
        provider: record.provider,
        cluster: record.cluster,
        zone: record.zone,
        instanceType: record.instance_type,
      },
    };
  }

  /**
   * 메트릭 기반 서버 상태 결정
   */
  private determineStatus(
    record: any
  ): 'online' | 'warning' | 'critical' | 'offline' {
    const cpu = record.cpu_usage;
    const memory = record.memory_usage;
    const disk = record.disk_usage;

    // 임계값 기반 상태 결정
    if (cpu > 90 || memory > 95 || disk > 95) {
      return 'critical';
    } else if (cpu > 80 || memory > 85 || disk > 90) {
      return 'warning';
    } else {
      return 'online';
    }
  }

  /**
   * 배치 저장 (성능 최적화)
   */
  async saveMetricsBatch(metricsList: StandardServerMetrics[]): Promise<void> {
    if (!this.client || !this.isConnected) {
      throw new Error('Supabase 클라이언트가 연결되지 않았습니다');
    }

    try {
      const dbRecords = metricsList.map(metrics =>
        this.transformToDbRecord(metrics)
      );

      const { error } = await this.client
        .from('server_metrics')
        .insert(dbRecords);

      if (error) {
        throw error;
      }

      console.log(`✅ 배치 저장 완료: ${metricsList.length}개 메트릭`);
    } catch (error) {
      console.error('❌ 배치 저장 실패:', error);
      throw error;
    }
  }

  /**
   * 연결 상태 확인
   */
  isConnectedToDatabase(): boolean {
    return this.isConnected && this.client !== null;
  }
}
