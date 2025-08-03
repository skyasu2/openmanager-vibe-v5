/**
 * 🎮 OpenManager Vibe v5 - 시뮬레이션 엔진
 *
 * 서버 메트릭 데이터 시뮬레이션 및 생성
 */

import type {
  EnhancedServerMetrics,
  ServerEnvironment,
  ServerRole,
  ServerStatus,
} from '../types/server';

export interface ServerMetrics {
  cpu: number;
  memory: number;
  disk: number;
  network: number;
  timestamp: string;
}

export interface SimulationConfig {
  serverCount: number;
  interval: number;
  anomalyRate: number;
}

export class SimulationEngine {
  private config: SimulationConfig;
  private isRunning: boolean = false;

  constructor(
    config: SimulationConfig = {
      serverCount: 30,
      interval: 5000,
      anomalyRate: 0.1,
    }
  ) {
    this.config = config;
  }

  /**
   * 📊 메트릭 데이터 생성
   */
  generateMetrics(): ServerMetrics[] {
    const metrics: ServerMetrics[] = [];

    for (let i = 0; i < this.config.serverCount; i++) {
      const hasAnomaly = Math.random() < this.config.anomalyRate;

      metrics.push({
        cpu: hasAnomaly ? Math.random() * 40 + 60 : Math.random() * 50 + 10,
        memory: hasAnomaly ? Math.random() * 30 + 70 : Math.random() * 40 + 20,
        disk: hasAnomaly ? Math.random() * 20 + 80 : Math.random() * 60 + 10,
        network: hasAnomaly
          ? Math.random() * 100 + 100
          : Math.random() * 50 + 5,
        timestamp: new Date().toISOString(),
      });
    }

    return metrics;
  }

  /**
   * ⚙️ 설정 업데이트
   */
  updateConfig(newConfig: Partial<SimulationConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * 🔧 서버 목록 반환
   */
  getServers(): EnhancedServerMetrics[] {
    const metrics = this.generateMetrics();
    return metrics.map((metric, index) => {
      const serverNumber = index + 1;
      const environment: ServerEnvironment = [
        'production',
        'staging',
        'development',
      ][index % 3] as ServerEnvironment;
      const role: ServerRole = ['web', 'api', 'database', 'cache'][
        index % 4
      ] as ServerRole;
      const status: ServerStatus =
        metric.cpu > 80 ? 'critical' : metric.cpu > 60 ? 'warning' : 'healthy';

      return {
        id: `server-${serverNumber}`,
        name: `Server-${String(serverNumber).padStart(2, '0')}`,
        hostname: `server-${String(serverNumber).padStart(2, '0')}.local`,
        environment,
        role,
        status,
        cpu_usage: metric.cpu,
        memory_usage: metric.memory,
        disk_usage: metric.disk,
        network_in: metric.network * 0.6, // 입력 트래픽 (60%)
        network_out: metric.network * 0.4, // 출력 트래픽 (40%)
        response_time: Math.random() * 200 + 50, // 50-250ms 응답시간
        uptime: Math.random() * 720 + 1, // 1-721 시간 가동시간
        last_updated: metric.timestamp,
        alerts: [] as any[],
        // Additional compatibility fields
        network_usage: metric.network,
        timestamp: metric.timestamp,
      };
    });
  }

  /**
   * 🚀 시뮬레이션 시작
   */
  start(): void {
    this.isRunning = true;
    console.log('🚀 시뮬레이션 엔진 시작됨');
  }

  /**
   * ⏹️ 시뮬레이션 중지
   */
  stop(): void {
    this.isRunning = false;
    console.log('⏹️ 시뮬레이션 엔진 중지됨');
  }

  /**
   * 📊 상태 반환 (getState 별칭)
   */
  getState() {
    return { status: this.isRunning ? 'active' : 'stopped' };
  }

  /**
   * 📈 상태 반환
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      config: this.config,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * 🔍 실행 상태 확인
   */
  getIsRunning() {
    return this.isRunning;
  }

  /**
   * 🔍 ID로 서버 조회
   */
  getServerById(serverId: string): EnhancedServerMetrics | undefined {
    const servers = this.getServers();
    return servers.find(server => server.id === serverId);
  }

  /**
   * 📊 Prometheus 메트릭 조회
   */
  getPrometheusMetrics(serverId?: string): unknown[] {
    let servers: EnhancedServerMetrics[];

    if (serverId) {
      const server = this.getServerById(serverId);
      servers = server ? [server] : [];
    } else {
      servers = this.getServers();
    }

    return servers.flatMap(server => [
      {
        name: 'node_cpu_usage_percent',
        type: 'gauge',
        help: 'Current CPU usage percentage',
        labels: { server_id: server.id, hostname: server.hostname },
        value: server.cpu_usage,
        timestamp: Date.now(),
      },
      {
        name: 'node_memory_usage_percent',
        type: 'gauge',
        help: 'Current memory usage percentage',
        labels: { server_id: server.id, hostname: server.hostname },
        value: server.memory_usage,
        timestamp: Date.now(),
      },
      {
        name: 'node_disk_usage_percent',
        type: 'gauge',
        help: 'Current disk usage percentage',
        labels: { server_id: server.id, hostname: server.hostname },
        value: server.disk_usage,
        timestamp: Date.now(),
      },
    ]);
  }

  /**
   * 📊 시뮬레이션 요약 정보 반환
   */
  getSimulationSummary() {
    const servers = this.getServers();
    const totalServers = servers.length;
    const criticalServers = servers.filter(
      (s: unknown) => s.status === 'critical'
    ).length;
    const warningServers = servers.filter(
      (s: unknown) => s.status === 'warning'
    ).length;
    const healthyServers = totalServers - criticalServers - warningServers;

    return {
      totalServers,
      healthyServers,
      warningServers,
      criticalServers,
      healthPercentage: Math.round((healthyServers / totalServers) * 100),
      averageCpu: Math.round(
        servers.reduce((sum: number, s: unknown) => sum + s.cpu_usage, 0) /
          totalServers
      ),
      averageMemory: Math.round(
        servers.reduce((sum: number, s: unknown) => sum + s.memory_usage, 0) /
          totalServers
      ),
      averageResponseTime: Math.round(
        servers.reduce((sum: number, s: unknown) => sum + s.response_time, 0) /
          totalServers
      ),
      timestamp: new Date().toISOString(),
      // 추가 속성들
      patternsEnabled: true,
      currentLoad:
        criticalServers > 0
          ? 'high'
          : warningServers > totalServers * 0.3
            ? 'medium'
            : 'low',
      activeFailures: criticalServers,
    };
  }
}

// 싱글톤 인스턴스
export const simulationEngine = new SimulationEngine();
