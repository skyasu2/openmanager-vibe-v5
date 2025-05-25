import { createClient } from '@supabase/supabase-js';
import { Redis } from 'ioredis';
import { ServerMetrics } from '../types/collector';
import { Server } from '../types/server';
import { NETWORK, TIME } from '../config/constants';
import { THRESHOLDS } from '../config/thresholds';

// 환경 변수 (실제 환경에서 설정)
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key';
const REDIS_URL = process.env.REDIS_URL || `redis://localhost:${NETWORK.PORTS.REDIS_DEFAULT}`;

// 클라이언트 초기화
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const redis = new Redis(REDIS_URL, {
  maxRetriesPerRequest: 3,
  lazyConnect: true,
});

export class MetricsStorageService {
  private readonly LATEST_KEY_PREFIX = 'server:';
  private readonly LATEST_KEY_SUFFIX = ':latest';
  private readonly TTL_SECONDS = TIME.TTL.REDIS_DEFAULT;

  /**
   * 메트릭을 Supabase와 Redis에 동시 저장
   */
  async saveMetrics(metrics: ServerMetrics): Promise<void> {
    try {
      // 1. Supabase에 영구 저장 (24시간 보존)
      await this.saveToSupabase(metrics);
      
      // 2. Redis에 최신값 저장 (TTL 5분)
      await this.saveToRedis(metrics);
      
      console.log(`✅ Metrics saved for ${metrics.serverId}`);
    } catch (error) {
      console.error(`❌ Failed to save metrics for ${metrics.serverId}:`, error);
      throw error;
    }
  }

  /**
   * 서버 목록 조회 (Redis → Supabase fallback)
   */
  async getServerList(): Promise<string[]> {
    try {
      // Redis에서 활성 서버 목록 조회
      const keys = await redis.keys(`${this.LATEST_KEY_PREFIX}*${this.LATEST_KEY_SUFFIX}`);
      const serverIds = keys.map(key => 
        key.replace(this.LATEST_KEY_PREFIX, '').replace(this.LATEST_KEY_SUFFIX, '')
      );
      
      if (serverIds.length > 0) {
        return serverIds;
      }
      
      // Redis에 없으면 Supabase에서 조회
      const { data, error } = await supabase
        .from('server_metrics')
        .select('server_id')
        .gte('timestamp', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('timestamp', { ascending: false });
      
      if (error) throw error;
      
      const uniqueServers = [...new Set(data?.map(row => row.server_id) || [])];
      return uniqueServers;
    } catch (error) {
      console.error('❌ Failed to get server list:', error);
      return [];
    }
  }

  /**
   * 최신 서버 메트릭 조회 (Redis → Supabase fallback)
   */
  async getLatestMetrics(serverId: string): Promise<Server | null> {
    try {
      // 1. Redis에서 최신값 조회
      const redisData = await this.getFromRedis(serverId);
      if (redisData) {
        return this.transformToServerType(redisData);
      }
      
      // 2. Redis에 없으면 Supabase에서 최신 조회
      const supabaseData = await this.getLatestFromSupabase(serverId);
      if (supabaseData) {
        // Redis에 다시 캐싱
        await this.saveToRedis(supabaseData);
        return this.transformToServerType(supabaseData);
      }
      
      return null;
    } catch (error) {
      console.error(`❌ Failed to get metrics for ${serverId}:`, error);
      return null;
    }
  }

  /**
   * 서버 상태 히스토리 조회 (24시간)
   */
  async getMetricsHistory(serverId: string, hours: number = 24): Promise<ServerMetrics[]> {
    try {
      const { data, error } = await supabase
        .from('server_metrics')
        .select('*')
        .eq('server_id', serverId)
        .gte('timestamp', new Date(Date.now() - hours * 60 * 60 * 1000).toISOString())
        .order('timestamp', { ascending: true });
      
      if (error) throw error;
      
      return data?.map(row => this.parseFromSupabase(row)) || [];
    } catch (error) {
      console.error(`❌ Failed to get history for ${serverId}:`, error);
      return [];
    }
  }

  /**
   * 서버 상태 체크 (온라인/오프라인)
   */
  async isServerOnline(serverId: string): Promise<boolean> {
    try {
      const exists = await redis.exists(`${this.LATEST_KEY_PREFIX}${serverId}${this.LATEST_KEY_SUFFIX}`);
      return exists === 1;
    } catch (error) {
      console.error(`❌ Failed to check server status ${serverId}:`, error);
      return false;
    }
  }

  // Private Methods

  private async saveToSupabase(metrics: ServerMetrics): Promise<void> {
    const { error } = await supabase
      .from('server_metrics')
      .insert({
        server_id: metrics.serverId,
        hostname: metrics.hostname,
        timestamp: metrics.timestamp.toISOString(),
        cpu_usage: metrics.cpu.usage,
        cpu_load_avg: metrics.cpu.loadAverage,
        cpu_cores: metrics.cpu.cores,
        memory_total: metrics.memory.total,
        memory_used: metrics.memory.used,
        memory_usage: metrics.memory.usage,
        disk_total: metrics.disk.total,
        disk_used: metrics.disk.used,
        disk_usage: metrics.disk.usage,
        network_interface: metrics.network.interface,
        network_bytes_received: metrics.network.bytesReceived,
        network_bytes_sent: metrics.network.bytesSent,
        network_errors_received: metrics.network.errorsReceived,
        network_errors_sent: metrics.network.errorsSent,
        os: metrics.system.os,
        uptime: metrics.system.uptime,
        processes_total: metrics.system.processes.total,
        processes_zombie: metrics.system.processes.zombie,
        services: JSON.stringify(metrics.services),
        location: metrics.metadata.location,
        environment: metrics.metadata.environment,
        provider: metrics.metadata.provider,
        raw_data: JSON.stringify(metrics)
      });
    
    if (error) throw error;
  }

  private async saveToRedis(metrics: ServerMetrics): Promise<void> {
    const key = `${this.LATEST_KEY_PREFIX}${metrics.serverId}${this.LATEST_KEY_SUFFIX}`;
    await redis.setex(key, this.TTL_SECONDS, JSON.stringify(metrics));
  }

  private async getFromRedis(serverId: string): Promise<ServerMetrics | null> {
    const key = `${this.LATEST_KEY_PREFIX}${serverId}${this.LATEST_KEY_SUFFIX}`;
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  }

  private async getLatestFromSupabase(serverId: string): Promise<ServerMetrics | null> {
    const { data, error } = await supabase
      .from('server_metrics')
      .select('*')
      .eq('server_id', serverId)
      .order('timestamp', { ascending: false })
      .limit(1)
      .single();
    
    if (error || !data) return null;
    return this.parseFromSupabase(data);
  }

  private parseFromSupabase(row: any): ServerMetrics {
    return {
      serverId: row.server_id,
      hostname: row.hostname,
      timestamp: new Date(row.timestamp),
      cpu: {
        usage: row.cpu_usage,
        loadAverage: row.cpu_load_avg,
        cores: row.cpu_cores
      },
      memory: {
        total: row.memory_total,
        used: row.memory_used,
        available: row.memory_total - row.memory_used,
        usage: row.memory_usage
      },
      disk: {
        total: row.disk_total,
        used: row.disk_used,
        available: row.disk_total - row.disk_used,
        usage: row.disk_usage,
        iops: { read: 0, write: 0 }
      },
      network: {
        interface: row.network_interface,
        bytesReceived: row.network_bytes_received,
        bytesSent: row.network_bytes_sent,
        packetsReceived: 0,
        packetsSent: 0,
        errorsReceived: row.network_errors_received,
        errorsSent: row.network_errors_sent
      },
      system: {
        os: row.os,
        platform: 'linux',
        uptime: row.uptime,
        bootTime: new Date(Date.now() - row.uptime * 1000),
        processes: {
          total: row.processes_total,
          running: Math.floor(row.processes_total * 0.1),
          sleeping: Math.floor(row.processes_total * 0.8),
          zombie: row.processes_zombie
        }
      },
      services: JSON.parse(row.services || '[]'),
      metadata: {
        location: row.location,
        environment: row.environment,
        provider: row.provider
      }
    };
  }

  private transformToServerType(metrics: ServerMetrics): Server {
    return {
      id: metrics.serverId,
      name: metrics.hostname,
      status: this.determineStatus(metrics),
      location: metrics.metadata.location,
      cpu: Math.round(metrics.cpu.usage),
      memory: Math.round(metrics.memory.usage),
      disk: Math.round(metrics.disk.usage),
      uptime: this.formatUptime(metrics.system.uptime),
      lastUpdate: metrics.timestamp,
      alerts: this.calculateAlerts(metrics),
      services: metrics.services.map(s => ({
        name: s.name,
        status: s.status === 'running' ? 'running' : 'stopped',
        port: s.port || 0
      })),
      os: metrics.system.os,
      ip: '192.168.1.' + Math.floor(Math.random() * 254 + 1)
    };
  }

  private determineStatus(metrics: ServerMetrics): 'online' | 'warning' | 'offline' {
    // 임계값 기반 상태 판단
    if (metrics.cpu.usage > THRESHOLDS.SERVER.CPU.CRITICAL || 
        metrics.memory.usage > THRESHOLDS.SERVER.MEMORY.CRITICAL || 
        metrics.disk.usage > THRESHOLDS.SERVER.DISK.CRITICAL) {
      return 'offline';
    }
    if (metrics.cpu.usage > THRESHOLDS.SERVER.CPU.WARNING || 
        metrics.memory.usage > THRESHOLDS.SERVER.MEMORY.WARNING || 
        metrics.disk.usage > THRESHOLDS.SERVER.DISK.WARNING) {
      return 'warning';
    }
    return 'online';
  }

  private formatUptime(seconds: number): string {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    return `${days}일 ${hours}시간`;
  }

  private calculateAlerts(metrics: ServerMetrics): number {
    let alerts = 0;
    if (metrics.cpu.usage > THRESHOLDS.SERVER.CPU.WARNING) alerts++;
    if (metrics.memory.usage > THRESHOLDS.SERVER.MEMORY.WARNING) alerts++;
    if (metrics.disk.usage > THRESHOLDS.SERVER.DISK.WARNING) alerts++;
    return alerts;
  }
}

// 싱글톤 인스턴스
export const metricsStorage = new MetricsStorageService(); 