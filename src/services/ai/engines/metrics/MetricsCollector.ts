/**
 * 📊 메트릭 수집기
 * 
 * Single Responsibility: 시스템 메트릭 수집과 관리
 * Service Layer Pattern: 메트릭 관련 서비스 로직 캡슐화
 */

import { SystemMetrics, MetricsCollectionOptions } from '../ai-types/AITypes';

export class MetricsCollector {
  private cache = new Map<string, SystemMetrics>();
  private cacheExpiry = 30000; // 30초 캐시

  /**
   * 시스템 메트릭 수집
   */
  async collectSystemMetrics(options: MetricsCollectionOptions = {}): Promise<SystemMetrics> {
    const cacheKey = this.generateCacheKey(options);
    
    // 캐시 확인
    const cached = this.cache.get(cacheKey);
    if (cached && this.isCacheValid(cached)) {
      console.log('📊 메트릭 캐시에서 반환');
      return cached;
    }

    try {
      console.log('📊 실시간 시스템 메트릭 수집 중...');
      
      const metrics: SystemMetrics = {
        servers: await this.collectServerMetrics(options.serverIds),
        global_stats: options.includeGlobalStats ? await this.collectGlobalStats() : {},
        alerts: options.includeAlerts ? await this.collectActiveAlerts() : [],
        timestamp: new Date().toISOString(),
      };

      // 캐시 저장
      this.cache.set(cacheKey, metrics);
      
      console.log(`✅ 메트릭 수집 완료: 서버 ${Object.keys(metrics.servers).length}개`);
      return metrics;
    } catch (error: any) {
      console.warn('⚠️ 메트릭 수집 실패:', error);
      return this.createEmptyMetrics();
    }
  }

  /**
   * 서버별 메트릭 수집
   */
  private async collectServerMetrics(serverIds?: string[]): Promise<Record<string, Record<string, number[]>>> {
    try {
      // 실제 메트릭 API 호출 시뮬레이션
      const servers: Record<string, Record<string, number[]>> = {};
      
      const targetServers = serverIds || ['server-1', 'server-2', 'server-3'];
      
      for (const serverId of targetServers) {
        servers[serverId] = {
          cpu_usage: this.generateMetricHistory(20, 80),
          memory_usage: this.generateMetricHistory(30, 70),
          disk_usage: this.generateMetricHistory(10, 90),
          network_io: this.generateMetricHistory(100, 1000),
          response_time: this.generateMetricHistory(50, 500),
        };
      }

      return servers;
    } catch (error) {
      console.warn('⚠️ 서버 메트릭 수집 실패:', error);
      return {};
    }
  }

  /**
   * 글로벌 통계 수집
   */
  private async collectGlobalStats(): Promise<any> {
    try {
      return {
        total_servers: 10,
        active_servers: 8,
        cpu_avg: 45.2,
        memory_avg: 62.1,
        disk_avg: 71.5,
        network_avg: 450.8,
        uptime_avg: 99.2,
        last_updated: new Date().toISOString(),
      };
    } catch (error) {
      console.warn('⚠️ 글로벌 통계 수집 실패:', error);
      return {};
    }
  }

  /**
   * 활성 알림 수집
   */
  private async collectActiveAlerts(): Promise<any[]> {
    try {
      // 실제 알림 시스템 API 호출 시뮬레이션
      return [
        {
          id: 'alert-1',
          severity: 'warning',
          message: 'High CPU usage on server-1',
          timestamp: new Date().toISOString(),
          server_id: 'server-1',
        },
        {
          id: 'alert-2',
          severity: 'info',
          message: 'Disk cleanup completed on server-2',
          timestamp: new Date().toISOString(),
          server_id: 'server-2',
        },
      ];
    } catch (error) {
      console.warn('⚠️ 알림 수집 실패:', error);
      return [];
    }
  }

  /**
   * 메트릭 히스토리 생성 (시뮬레이션)
   */
  private generateMetricHistory(min: number, max: number, points: number = 50): number[] {
    const history = [];
    for (let i = 0; i < points; i++) {
      const value = min + Math.random() * (max - min);
      history.push(Math.round(value * 100) / 100);
    }
    return history;
  }

  /**
   * 캐시 키 생성
   */
  private generateCacheKey(options: MetricsCollectionOptions): string {
    const serverIds = options.serverIds?.sort().join(',') || 'all';
    const includeGlobal = options.includeGlobalStats ? 'global' : 'no-global';
    const includeAlerts = options.includeAlerts ? 'alerts' : 'no-alerts';
    
    return `metrics_${serverIds}_${includeGlobal}_${includeAlerts}`;
  }

  /**
   * 캐시 유효성 검사
   */
  private isCacheValid(metrics: SystemMetrics): boolean {
    const now = new Date().getTime();
    const metricsTime = new Date(metrics.timestamp).getTime();
    return (now - metricsTime) < this.cacheExpiry;
  }

  /**
   * 빈 메트릭 객체 생성
   */
  private createEmptyMetrics(): SystemMetrics {
    return {
      servers: {},
      global_stats: {},
      alerts: [],
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * 캐시 클리어
   */
  clearCache(): void {
    this.cache.clear();
    console.log('📊 메트릭 캐시 클리어 완료');
  }

  /**
   * 캐시 통계
   */
  getCacheStats(): { size: number; entries: string[] } {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys()),
    };
  }
} 