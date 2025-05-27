import { createClient } from '@supabase/supabase-js';
import { ServerMetrics } from '../types/collector';
import { Server } from '../types/server';
import { NETWORK, TIME } from '../config/constants';
import { THRESHOLDS } from '../config/thresholds';

// 환경 변수 (실제 환경에서 설정)
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key';
const REDIS_URL = process.env.REDIS_URL || `redis://localhost:${NETWORK.PORTS.REDIS_DEFAULT}`;

// Supabase 클라이언트 초기화 (개발 환경 체크)
const supabase = SUPABASE_URL.includes('your-project') ? null : createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Redis 클라이언트 (서버 사이드에서만 초기화)
let redis: any = null;

async function getRedisClient() {
  if (typeof window !== 'undefined') {
    // 클라이언트 사이드에서는 Redis 사용 안 함
    return null;
  }
  
  if (!redis) {
    try {
      const { Redis } = await import('ioredis');
      redis = new Redis(REDIS_URL, {
        maxRetriesPerRequest: 3,
        lazyConnect: true,
      });
    } catch (error) {
      console.warn('Redis not available, using Supabase only');
      return null;
    }
  }
  
  return redis;
}

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
      
      // 2. Redis에 최신값 저장 (TTL 5분) - 서버 사이드에서만
      const redisClient = await getRedisClient();
      if (redisClient) {
        await this.saveToRedis(metrics, redisClient);
      }
      
      console.log(`✅ Metrics saved for ${metrics.serverId}`);
    } catch (error) {
      console.error(`❌ Failed to save metrics for ${metrics.serverId}:`, error);
      throw error;
    }
  }

  /**
   * 서버 목록 조회 (Redis → Supabase fallback) - Vercel 최적화
   */
  async getServerList(): Promise<string[]> {
    // 개발 환경에서는 즉시 기본 서버 목록 반환
    if (process.env.NODE_ENV === 'development' || 
        !process.env.NEXT_PUBLIC_SUPABASE_URL || 
        process.env.NEXT_PUBLIC_SUPABASE_URL.includes('your-project')) {
      console.log('🔄 개발 환경: 기본 서버 목록 사용 (20개)');
      return this.getDefaultServerList();
    }

    try {
      console.log('📋 서버 목록 조회 시작...');
      
      // Redis에서 활성 서버 목록 조회 (서버 사이드에서만)
      try {
        const redisClient = await getRedisClient();
        if (redisClient) {
          console.log('🔍 Redis에서 서버 목록 조회 중...');
          const keys = await redisClient.keys(`${this.LATEST_KEY_PREFIX}*${this.LATEST_KEY_SUFFIX}`);
          const serverIds = keys.map((key: string) => 
            key.replace(this.LATEST_KEY_PREFIX, '').replace(this.LATEST_KEY_SUFFIX, '')
          );
          
          if (serverIds.length > 0) {
            console.log(`✅ Redis에서 ${serverIds.length}개 서버 발견`);
            return serverIds;
          }
        }
      } catch (redisError) {
        // Redis 오류는 조용히 처리 (일반적으로 사용 불가)
      }
      
      // Supabase 클라이언트가 없으면 기본 목록 사용
      if (!supabase) {
        console.log('ℹ️ Supabase 클라이언트 없음, 기본 서버 목록 사용');
        return this.getDefaultServerList();
      }

      // Supabase에서 서버 목록 조회 (짧은 타임아웃)
      try {
        const { data, error } = await Promise.race([
          supabase
            .from('server_metrics')
            .select('server_id')
            .gte('timestamp', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
            .order('timestamp', { ascending: false })
            .limit(100), // 성능 최적화
          new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error('Supabase timeout')), 3000) // 타임아웃 단축
          )
        ]);
        
        if (error) {
          throw error; // catch 블록에서 처리
        }
        
        const uniqueServers = [...new Set(data?.map(row => row.server_id) || [])];
        
        if (uniqueServers.length > 0) {
          console.log(`✅ Supabase에서 ${uniqueServers.length}개 서버 발견`);
          return uniqueServers;
        }
        
      } catch (supabaseError) {
        // Supabase 오류는 조용히 fallback
      }
      
      // 모든 방법이 실패하면 기본 목록 사용
      console.log('ℹ️ 데이터베이스에 서버 정보 없음, 기본 목록 사용');
      return this.getDefaultServerList();
      
    } catch (error) {
      // 최종 fallback
      return this.getDefaultServerList();
    }
  }

  /**
   * 기본 서버 목록 (Fallback용) - 20개 서버
   */
  private getDefaultServerList(): string[] {
    console.log('🔄 기본 서버 목록 사용 (20개)');
    return [
      // 온프레미스 서버 (7개)
      'web-prod-01',
      'db-master-01',
      'cache-redis-01',
      'backup-storage-01',
      'mail-server-01',
      'file-server-nfs',
      'proxy-nginx-01',
      
      // 쿠버네티스 클러스터 (6개)
      'k8s-master-01',
      'k8s-worker-01',
      'k8s-worker-02',
      'k8s-ingress-01',
      'k8s-logging-01',
      'k8s-monitoring-01',
      
      // AWS EC2 인스턴스 (7개)
      'api-gateway-prod',
      'analytics-worker',
      'monitoring-elk',
      'jenkins-ci-cd',
      'grafana-metrics',
      'vault-secrets',
      'staging-web-01'
    ];
  }

  /**
   * Mock 서버 데이터 생성 (개발 환경용)
   */
  private generateMockServerData(serverId: string): Server {
    return {
      id: serverId,
      name: `Mock ${serverId}`,
      status: Math.random() > 0.1 ? 'online' : 'warning',
      cpu: Math.floor(Math.random() * 30) + 20, // 20-50%
      memory: Math.floor(Math.random() * 40) + 30, // 30-70%
      disk: Math.floor(Math.random() * 30) + 10, // 10-40%
      uptime: `${Math.floor(Math.random() * 30)}일 ${Math.floor(Math.random() * 24)}시간`,
      location: 'Seoul',
      alerts: Math.floor(Math.random() * 3),
      ip: `192.168.1.${Math.floor(Math.random() * 254) + 1}`,
      lastUpdate: new Date(),
      services: [
        {
          name: 'nginx',
          status: 'running',
          port: 80
        },
        {
          name: 'nodejs',
          status: 'running',
          port: 3000
        }
      ]
    };
  }

  /**
   * 최신 서버 메트릭 조회 (Redis → Supabase fallback)
   */
  async getLatestMetrics(serverId: string): Promise<Server | null> {
    try {
      // 1. Redis에서 최신값 조회 (서버 사이드에서만)
      const redisClient = await getRedisClient();
      if (redisClient) {
        const redisData = await this.getFromRedis(serverId, redisClient);
        if (redisData) {
          return this.transformToServerType(redisData);
        }
      }
      
      // 2. 개발 환경이나 Supabase 설정이 없으면 mock 데이터 반환
      if (process.env.NODE_ENV === 'development' || 
          !process.env.NEXT_PUBLIC_SUPABASE_URL || 
          process.env.NEXT_PUBLIC_SUPABASE_URL.includes('your-project') ||
          !supabase) {
        return this.generateMockServerData(serverId);
      }
      
      // 3. Supabase에서 최신 조회 (프로덕션 환경만)
      const supabaseData = await this.getLatestFromSupabase(serverId);
      if (supabaseData) {
        // Redis에 다시 캐싱 (서버 사이드에서만)
        if (redisClient) {
          await this.saveToRedis(supabaseData, redisClient);
        }
        return this.transformToServerType(supabaseData);
      }
      
      // 4. 모든 방법이 실패하면 mock 데이터 반환
      return this.generateMockServerData(serverId);
    } catch (error) {
      // 조용히 mock 데이터 반환
      return this.generateMockServerData(serverId);
    }
  }

  /**
   * 서버 상태 히스토리 조회 (24시간)
   */
  async getMetricsHistory(serverId: string, hours: number = 24): Promise<ServerMetrics[]> {
    try {
      if (!supabase) {
        console.warn('⚠️ Supabase 클라이언트가 초기화되지 않음');
        return [];
      }

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
      const redisClient = await getRedisClient();
      if (redisClient) {
        const exists = await redisClient.exists(`${this.LATEST_KEY_PREFIX}${serverId}${this.LATEST_KEY_SUFFIX}`);
        return exists === 1;
      }
      
      // Redis가 없으면 Supabase에서 최근 데이터 확인
      if (!supabase) {
        console.warn('⚠️ Supabase 클라이언트가 초기화되지 않음');
        return false;
      }

      const { data, error } = await supabase
        .from('server_metrics')
        .select('server_id')
        .eq('server_id', serverId)
        .gte('timestamp', new Date(Date.now() - 5 * 60 * 1000).toISOString()) // 5분 이내
        .limit(1);
      
      return !error && data && data.length > 0;
    } catch (error) {
      console.error(`❌ Failed to check server status ${serverId}:`, error);
      return false;
    }
  }

  // Private Methods

  private async saveToSupabase(metrics: ServerMetrics): Promise<void> {
    if (!supabase) {
      console.warn('⚠️ Supabase 클라이언트가 초기화되지 않음');
      return;
    }

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

  private async saveToRedis(metrics: ServerMetrics, redisClient: any): Promise<void> {
    const key = `${this.LATEST_KEY_PREFIX}${metrics.serverId}${this.LATEST_KEY_SUFFIX}`;
    await redisClient.setex(key, this.TTL_SECONDS, JSON.stringify(metrics));
  }

  private async getFromRedis(serverId: string, redisClient: any): Promise<ServerMetrics | null> {
    const key = `${this.LATEST_KEY_PREFIX}${serverId}${this.LATEST_KEY_SUFFIX}`;
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  }

  private async getLatestFromSupabase(serverId: string): Promise<ServerMetrics | null> {
    if (!supabase) {
      console.warn('⚠️ Supabase 클라이언트가 초기화되지 않음');
      return null;
    }

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