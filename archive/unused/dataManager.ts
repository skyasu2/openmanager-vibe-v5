import { ServerMetrics, DataStorage } from '../types/server';

class DataManager {
  private storage: DataStorage = {
    realtime_metrics: [],
    daily_metrics: [],
    last_cleanup: new Date().toISOString()
  };

  private readonly REALTIME_MAX_SIZE = 240; // 20분 * 12회/분 = 240개
  private readonly DAILY_MAX_SIZE = 17280; // 24시간 * 12회/분 = 17,280개

  /**
   * 실시간 메트릭 저장
   */
  public storeRealtimeMetrics(servers: ServerMetrics[]): void {
    // 새 데이터 추가
    this.storage.realtime_metrics.push(...servers);

    // 크기 제한 적용 (FIFO)
    if (this.storage.realtime_metrics.length > this.REALTIME_MAX_SIZE) {
      const excess = this.storage.realtime_metrics.length - this.REALTIME_MAX_SIZE;
      this.storage.realtime_metrics.splice(0, excess);
    }

    console.log(`📊 실시간 데이터 저장: ${servers.length}개 서버, 총 ${this.storage.realtime_metrics.length}개 레코드`);
  }

  /**
   * 일일 메트릭으로 마이그레이션
   */
  public migrateToDaily(): void {
    if (this.storage.realtime_metrics.length === 0) return;

    console.log('📦 실시간 데이터를 일일 저장소로 마이그레이션...');

    // 실시간 데이터를 일일 저장소로 이동
    this.storage.daily_metrics.push(...this.storage.realtime_metrics);

    // 일일 저장소 크기 제한
    if (this.storage.daily_metrics.length > this.DAILY_MAX_SIZE) {
      const excess = this.storage.daily_metrics.length - this.DAILY_MAX_SIZE;
      this.storage.daily_metrics.splice(0, excess);
    }

    // 실시간 저장소 클리어
    this.storage.realtime_metrics = [];
    this.storage.last_cleanup = new Date().toISOString();

    console.log(`✅ 마이그레이션 완료: 일일 저장소 ${this.storage.daily_metrics.length}개 레코드`);
  }

  /**
   * 실시간 메트릭 조회
   */
  public getRealtimeMetrics(): ServerMetrics[] {
    return [...this.storage.realtime_metrics];
  }

  /**
   * 일일 메트릭 조회
   */
  public getDailyMetrics(): ServerMetrics[] {
    return [...this.storage.daily_metrics];
  }

  /**
   * 최신 서버 상태 조회
   */
  public getLatestServerStates(): ServerMetrics[] {
    if (this.storage.realtime_metrics.length === 0) return [];

    // 서버별 최신 상태만 추출
    const latestStates = new Map<string, ServerMetrics>();
    
    // 역순으로 순회하여 각 서버의 최신 상태 수집
    for (let i = this.storage.realtime_metrics.length - 1; i >= 0; i--) {
      const metric = this.storage.realtime_metrics[i];
      if (!latestStates.has(metric.id)) {
        latestStates.set(metric.id, metric);
      }
    }

    return Array.from(latestStates.values()).sort((a, b) => a.hostname.localeCompare(b.hostname));
  }

  /**
   * 특정 서버의 시계열 데이터 조회
   */
  public getServerTimeSeries(serverId: string, timeRange: 'realtime' | 'daily' = 'realtime'): ServerMetrics[] {
    const source = timeRange === 'realtime' ? this.storage.realtime_metrics : this.storage.daily_metrics;
    return source.filter(metric => metric.id === serverId).sort((a, b) => 
      new Date(a.last_updated).getTime() - new Date(b.last_updated).getTime()
    );
  }

  /**
   * 알림 통계 조회
   */
  public getAlertStatistics(): {
    total: number;
    critical: number;
    warning: number;
    resolved: number;
    byType: Record<string, number>;
  } {
    const allAlerts = this.storage.realtime_metrics.flatMap(server => server.alerts);
    
    const stats = {
      total: allAlerts.length,
      critical: allAlerts.filter(alert => alert.severity === 'critical').length,
      warning: allAlerts.filter(alert => alert.severity === 'warning').length,
      resolved: allAlerts.filter(alert => alert.resolved).length,
      byType: {} as Record<string, number>
    };

    // 타입별 통계
    allAlerts.forEach(alert => {
      stats.byType[alert.type] = (stats.byType[alert.type] || 0) + 1;
    });

    return stats;
  }

  /**
   * 서버 상태 분포 조회
   */
  public getServerStatusDistribution(): Record<string, number> {
    const latest = this.getLatestServerStates();
    const distribution: Record<string, number> = {
      healthy: 0,
      warning: 0,
      critical: 0,
      offline: 0
    };

    latest.forEach(server => {
      distribution[server.status]++;
    });

    return distribution;
  }

  /**
   * 환경별 서버 분포 조회
   */
  public getEnvironmentDistribution(): Record<string, number> {
    const latest = this.getLatestServerStates();
    const distribution: Record<string, number> = {};

    latest.forEach(server => {
      distribution[server.environment] = (distribution[server.environment] || 0) + 1;
    });

    return distribution;
  }

  /**
   * 성능 메트릭 평균 조회
   */
  public getAverageMetrics(): {
    cpu_usage: number;
    memory_usage: number;
    disk_usage: number;
    response_time: number;
    network_in: number;
    network_out: number;
  } {
    const latest = this.getLatestServerStates();
    
    if (latest.length === 0) {
      return {
        cpu_usage: 0,
        memory_usage: 0,
        disk_usage: 0,
        response_time: 0,
        network_in: 0,
        network_out: 0
      };
    }

    const totals = latest.reduce((acc, server) => ({
      cpu_usage: acc.cpu_usage + server.cpu_usage,
      memory_usage: acc.memory_usage + server.memory_usage,
      disk_usage: acc.disk_usage + server.disk_usage,
      response_time: acc.response_time + server.response_time,
      network_in: acc.network_in + server.network_in,
      network_out: acc.network_out + server.network_out
    }), {
      cpu_usage: 0,
      memory_usage: 0,
      disk_usage: 0,
      response_time: 0,
      network_in: 0,
      network_out: 0
    });

    const count = latest.length;
    return {
      cpu_usage: Math.round(totals.cpu_usage / count),
      memory_usage: Math.round(totals.memory_usage / count),
      disk_usage: Math.round(totals.disk_usage / count),
      response_time: Math.round(totals.response_time / count),
      network_in: Math.round(totals.network_in / count),
      network_out: Math.round(totals.network_out / count)
    };
  }

  /**
   * 데이터 저장소 클리어
   */
  public clearAll(): void {
    console.log('🗑️ 모든 데이터 저장소 클리어...');
    this.storage.realtime_metrics = [];
    this.storage.daily_metrics = [];
    this.storage.last_cleanup = new Date().toISOString();
    console.log('✅ 데이터 저장소 클리어 완료');
  }

  /**
   * 실시간 데이터만 클리어
   */
  public clearRealtimeData(): void {
    console.log('🗑️ 실시간 데이터 클리어...');
    this.storage.realtime_metrics = [];
    this.storage.last_cleanup = new Date().toISOString();
    console.log('✅ 실시간 데이터 클리어 완료');
  }

  /**
   * 저장소 상태 조회
   */
  public getStorageInfo(): {
    realtime_count: number;
    daily_count: number;
    total_size_mb: number;
    last_cleanup: string;
  } {
    const realtimeSize = JSON.stringify(this.storage.realtime_metrics).length;
    const dailySize = JSON.stringify(this.storage.daily_metrics).length;
    const totalSizeMB = (realtimeSize + dailySize) / 1024 / 1024;

    return {
      realtime_count: this.storage.realtime_metrics.length,
      daily_count: this.storage.daily_metrics.length,
      total_size_mb: Math.round(totalSizeMB * 100) / 100,
      last_cleanup: this.storage.last_cleanup
    };
  }
}

export const dataManager = new DataManager(); 