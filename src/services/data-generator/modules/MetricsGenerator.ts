/**
 * 🎯 실시간 서버 메트릭 생성기
 */

import { ApplicationMetrics, ServerInstance } from '@/types/data-generator';
import { generateSpecializedMetrics } from './config';
import { DashboardSummary, RealWorldServerType } from './types';

/**
 * 🎲 고급 메트릭 생성 클래스
 */
export class MetricsGenerator {
  private lastMetrics: Map<string, any> = new Map();
  private trendData: Map<string, number[]> = new Map();

  /**
   * 🎯 서버별 특화 메트릭 생성
   */
  generateServerMetrics(
    serverId: string,
    serverType: RealWorldServerType,
    status: 'running' | 'warning' | 'error' = 'running'
  ): any {
    const baseMetrics = generateSpecializedMetrics(serverType);

    // 상태에 따른 메트릭 조정
    const adjustedMetrics = this.adjustMetricsByStatus(baseMetrics, status);

    // 트렌드 데이터 누적
    this.updateTrendData(serverId, adjustedMetrics.cpu);

    // 이전 메트릭과의 부드러운 전환
    const smoothedMetrics = this.smoothMetricsTransition(
      serverId,
      adjustedMetrics
    );

    this.lastMetrics.set(serverId, smoothedMetrics);
    return smoothedMetrics;
  }

  /**
   * 🏥 상태에 따른 메트릭 조정
   */
  private adjustMetricsByStatus(metrics: any, status: string): any {
    switch (status) {
      case 'error':
        return {
          ...metrics,
          cpu: Math.min(95, metrics.cpu + 40),
          memory: Math.min(98, metrics.memory + 30),
          disk: Math.min(95, metrics.disk + 20),
          responseTime: metrics.responseTime
            ? metrics.responseTime * 3
            : undefined,
        };

      case 'warning':
        return {
          ...metrics,
          cpu: Math.min(85, metrics.cpu + 20),
          memory: Math.min(88, metrics.memory + 15),
          disk: Math.min(85, metrics.disk + 10),
          responseTime: metrics.responseTime
            ? metrics.responseTime * 1.5
            : undefined,
        };

      default:
        return metrics;
    }
  }

  /**
   * 📈 트렌드 데이터 업데이트
   */
  private updateTrendData(serverId: string, cpuValue: number): void {
    if (!this.trendData.has(serverId)) {
      this.trendData.set(serverId, []);
    }

    const trends = this.trendData.get(serverId)!;
    trends.push(cpuValue);

    // 최대 100개 포인트만 유지
    if (trends.length > 100) {
      trends.shift();
    }
  }

  /**
   * 🎨 부드러운 메트릭 전환
   */
  private smoothMetricsTransition(serverId: string, newMetrics: any): any {
    const lastMetrics = this.lastMetrics.get(serverId);
    if (!lastMetrics) return newMetrics;

    const smoothingFactor = 0.3; // 30% 이전 값, 70% 새 값

    return {
      ...newMetrics,
      cpu: this.smoothValue(lastMetrics.cpu, newMetrics.cpu, smoothingFactor),
      memory: this.smoothValue(
        lastMetrics.memory,
        newMetrics.memory,
        smoothingFactor
      ),
      disk: this.smoothValue(
        lastMetrics.disk,
        newMetrics.disk,
        smoothingFactor
      ),
    };
  }

  /**
   * 🎚️ 값 스무딩 함수
   */
  private smoothValue(
    oldValue: number,
    newValue: number,
    factor: number
  ): number {
    return parseFloat((oldValue * factor + newValue * (1 - factor)).toFixed(2));
  }

  /**
   * 📊 대시보드 요약 메트릭 생성
   */
  generateDashboardSummary(
    servers: Map<string, ServerInstance>,
    applications: Map<string, ApplicationMetrics>
  ): DashboardSummary {
    const serverArray = Array.from(servers.values());
    const appArray = Array.from(applications.values());

    // 서버 통계 계산
    const serverStats = this.calculateServerStats(serverArray);

    // 애플리케이션 통계 계산
    const appStats = this.calculateApplicationStats(appArray);

    // 클러스터 통계 (임시)
    const clusterStats = this.calculateClusterStats(serverArray);

    return {
      servers: serverStats,
      clusters: clusterStats,
      applications: appStats,
      timestamp: Date.now(),
    };
  }

  /**
   * 🖥️ 서버 통계 계산
   */
  private calculateServerStats(servers: ServerInstance[]) {
    const total = servers.length;
    const running = servers.filter(s => s.status === 'running').length;
    const warning = servers.filter(s => s.status === 'warning').length;
    const error = servers.filter(s => s.status === 'error').length;

    // 평균 메트릭 계산
    const avgCpu =
      total > 0
        ? parseFloat(
            (
              servers.reduce((sum, s) => sum + (s.metrics?.cpu || 0), 0) / total
            ).toFixed(2)
          )
        : 0;

    const avgMemory =
      total > 0
        ? parseFloat(
            (
              servers.reduce((sum, s) => sum + (s.metrics?.memory || 0), 0) /
              total
            ).toFixed(2)
          )
        : 0;

    const avgDisk =
      total > 0
        ? parseFloat(
            (
              servers.reduce((sum, s) => sum + (s.metrics?.disk || 0), 0) /
              total
            ).toFixed(2)
          )
        : 0;

    return {
      total,
      running,
      warning,
      error,
      avgCpu,
      avgMemory,
      avgDisk,
    };
  }

  /**
   * 📱 애플리케이션 통계 계산
   */
  private calculateApplicationStats(applications: ApplicationMetrics[]) {
    const total = applications.length;

    // ApplicationMetrics의 실제 구조에 맞게 수정
    const healthy = applications.filter(
      app => app.performance.availability >= 0.9
    ).length;
    const warning = applications.filter(
      app =>
        app.performance.availability >= 0.7 &&
        app.performance.availability < 0.9
    ).length;
    const critical = applications.filter(
      app => app.performance.availability < 0.7
    ).length;

    const avgResponseTime =
      total > 0
        ? parseFloat(
            (
              applications.reduce(
                (sum, app) => sum + (app.performance.responseTime || 0),
                0
              ) / total
            ).toFixed(2)
          )
        : 0;

    return {
      total,
      healthy,
      warning,
      critical,
      avgResponseTime,
    };
  }

  /**
   * 🗂️ 클러스터 통계 계산 (임시)
   */
  private calculateClusterStats(servers: ServerInstance[]) {
    // 서버를 그룹별로 클러스터링
    const clusters = new Map<string, ServerInstance[]>();

    servers.forEach(server => {
      const clusterKey = this.getClusterKey(server);
      if (!clusters.has(clusterKey)) {
        clusters.set(clusterKey, []);
      }
      clusters.get(clusterKey)!.push(server);
    });

    const total = clusters.size;
    let healthy = 0;
    let warning = 0;
    let critical = 0;

    clusters.forEach(clusterServers => {
      const runningCount = clusterServers.filter(
        s => s.status === 'running'
      ).length;
      const healthyRatio = runningCount / clusterServers.length;

      if (healthyRatio >= 0.8) healthy++;
      else if (healthyRatio >= 0.5) warning++;
      else critical++;
    });

    return {
      total,
      healthy,
      warning,
      critical,
    };
  }

  /**
   * 🗝️ 클러스터 키 생성
   */
  private getClusterKey(server: ServerInstance): string {
    const namePrefix = server.name.split('-')[0];
    const typePrefix = server.name.split('-')[1] || server.type;
    return `${namePrefix}-${typePrefix}`;
  }

  /**
   * 📈 트렌드 데이터 가져오기
   */
  getTrendData(serverId: string): number[] {
    return this.trendData.get(serverId) || [];
  }

  /**
   * 🧹 메트릭 데이터 정리
   */
  cleanup(): void {
    this.lastMetrics.clear();
    this.trendData.clear();
  }

  /**
   * 📊 메트릭 통계 정보
   */
  getMetricsStats(): {
    trackedServers: number;
    totalDataPoints: number;
    memoryUsage: string;
  } {
    const totalDataPoints = Array.from(this.trendData.values()).reduce(
      (sum, trends) => sum + trends.length,
      0
    );

    const memoryUsageBytes = this.lastMetrics.size * 1000 + totalDataPoints * 8;
    const memoryUsageKB = (memoryUsageBytes / 1024).toFixed(2);

    return {
      trackedServers: this.lastMetrics.size,
      totalDataPoints,
      memoryUsage: `${memoryUsageKB}KB`,
    };
  }

  /**
   * 📊 다중 서버 메트릭 생성 (API용)
   */
  async generateMetrics(count: number = 20): Promise<any[]> {
    const serverCategories = [
      'web',
      'app',
      'database',
      'infrastructure',
    ] as const;
    const metrics: any[] = [];

    for (let i = 0; i < count; i++) {
      const serverId = `server-${i + 1}`;
      const category = serverCategories[i % serverCategories.length];

      // RealWorldServerType 인터페이스에 맞는 객체 생성
      const serverType: RealWorldServerType = {
        id: serverId,
        name: `${category}-server-${i + 1}`,
        category,
        os: 'Ubuntu 22.04',
        service:
          category === 'database'
            ? 'postgresql'
            : category === 'web'
              ? 'nginx'
              : 'app-service',
        port: category === 'database' ? 5432 : category === 'web' ? 80 : 8080,
        version: '1.0.0',
      };

      const status =
        Math.random() > 0.8
          ? 'warning'
          : Math.random() > 0.95
            ? 'error'
            : 'running';

      const metric = this.generateServerMetrics(serverId, serverType, status);
      metrics.push({
        server_id: serverId,
        server_type: category,
        status,
        timestamp: new Date().toISOString(),
        ...metric,
      });
    }

    return metrics;
  }
}
