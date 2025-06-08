/**
 * 📊 메트릭 생성기 - 서버 메트릭 업데이트 전담
 * 
 * 책임:
 * - 실시간 메트릭 계산
 * - 베이스라인 데이터 생성
 * - 시뮬레이션 로직 적용
 * - 건강 상태 평가
 */

import { ServerInstance, ServerCluster, ApplicationMetrics, ServerType, ServerRole } from '../types/ServerTypes';

export interface SimulationConfig {
  baseLoad: number;
  peakHours: number[];
  incidents: {
    probability: number;
    duration: number;
  };
  scaling: {
    enabled: boolean;
    threshold: number;
    cooldown: number;
  };
}

export class MetricsGenerator {
  private simulationConfig: SimulationConfig;
  private serverBaselines = new Map<string, any>();
  private currentStates = new Map<string, any>();
  private patterns = new Map<string, any>();

  constructor(simulationConfig: SimulationConfig) {
    this.simulationConfig = simulationConfig;
  }

  /**
   * 서버 메트릭 업데이트
   */
  updateServerMetrics(
    server: ServerInstance,
    loadMultiplier: number,
    realMetrics?: any
  ): void {
    const baseLoad = this.simulationConfig.baseLoad;
    const currentHour = new Date().getHours();
    const isPeakHour = this.simulationConfig.peakHours.includes(currentHour);
    
    // 시간대별 로드 조정
    const timeMultiplier = isPeakHour ? 1.5 : 1.0;
    const finalLoad = Math.min(baseLoad * loadMultiplier * timeMultiplier, 1.0);

    // CPU 메트릭
    server.metrics.cpu = this.generateCPUMetric(server, finalLoad, realMetrics);
    
    // 메모리 메트릭
    server.metrics.memory = this.generateMemoryMetric(server, finalLoad, realMetrics);
    
    // 디스크 메트릭
    server.metrics.disk = this.generateDiskMetric(server, finalLoad, realMetrics);
    
    // 네트워크 메트릭
    server.metrics.network = this.generateNetworkMetric(server, finalLoad, realMetrics);
    
    // 요청 메트릭
    server.metrics.requests = this.generateRequestMetric(server, finalLoad);
    
    // 에러 메트릭
    server.metrics.errors = this.generateErrorMetric(server, finalLoad);

    // 업타임 업데이트
    server.metrics.uptime += 1/3600; // 1시간씩 증가

    // 사고 시뮬레이션
    this.simulateIncidents(server);
    
    // 건강 상태 계산
    this.calculateServerHealth(server);
  }

  /**
   * CPU 메트릭 생성
   */
  private generateCPUMetric(server: ServerInstance, load: number, realMetrics?: any): number {
    if (realMetrics?.cpu !== undefined) {
      return Math.min(realMetrics.cpu * 1.2, 100); // 실제 메트릭에 약간의 변동성 추가
    }

    const baseline = this.getServerBaseline(server.id, 'cpu');
    const variation = (Math.random() - 0.5) * 0.2; // ±10% 변동
    
    return Math.max(0, Math.min(100, baseline * load + variation * 100));
  }

  /**
   * 메모리 메트릭 생성
   */
  private generateMemoryMetric(server: ServerInstance, load: number, realMetrics?: any): number {
    if (realMetrics?.memory !== undefined) {
      return Math.min(realMetrics.memory * 1.1, 100);
    }

    const baseline = this.getServerBaseline(server.id, 'memory');
    const variation = (Math.random() - 0.5) * 0.15; // ±7.5% 변동
    
    return Math.max(0, Math.min(100, baseline * load + variation * 100));
  }

  /**
   * 디스크 메트릭 생성
   */
  private generateDiskMetric(server: ServerInstance, load: number, realMetrics?: any): number {
    if (realMetrics?.disk !== undefined) {
      return Math.min(realMetrics.disk * 1.05, 100);
    }

    const baseline = this.getServerBaseline(server.id, 'disk');
    const variation = (Math.random() - 0.5) * 0.1; // ±5% 변동
    
    return Math.max(0, Math.min(100, baseline * load + variation * 100));
  }

  /**
   * 네트워크 메트릭 생성
   */
  private generateNetworkMetric(server: ServerInstance, load: number, realMetrics?: any): { in: number; out: number } {
    if (realMetrics?.network) {
      return {
        in: realMetrics.network.in * 1.1,
        out: realMetrics.network.out * 1.1
      };
    }

    const baseline = this.getServerBaseline(server.id, 'network');
    const variation = (Math.random() - 0.5) * 0.3; // ±15% 변동
    
    return {
      in: Math.max(0, baseline.in * load + variation * baseline.in),
      out: Math.max(0, baseline.out * load + variation * baseline.out)
    };
  }

  /**
   * 요청 메트릭 생성
   */
  private generateRequestMetric(server: ServerInstance, load: number): number {
    const baseline = this.getServerBaseline(server.id, 'requests');
    const variation = (Math.random() - 0.5) * 0.4; // ±20% 변동
    
    return Math.max(0, baseline * load + variation * baseline);
  }

  /**
   * 에러 메트릭 생성
   */
  private generateErrorMetric(server: ServerInstance, load: number): number {
    const baseErrorRate = 0.01; // 1% 기본 에러율
    const stressMultiplier = load > 0.8 ? (load - 0.8) * 5 : 0; // 80% 이상에서 에러율 증가
    
    return server.metrics.requests * (baseErrorRate + stressMultiplier);
  }

  /**
   * 사고 시뮬레이션
   */
  private simulateIncidents(server: ServerInstance): void {
    if (Math.random() < this.simulationConfig.incidents.probability) {
      const incident = this.generateRandomIncident();
      server.health.issues.push(incident.message);
      server.health.score = Math.max(0, server.health.score - incident.severity);
      
      // 메트릭에 영향
      if (incident.type === 'cpu') {
        server.metrics.cpu = Math.min(100, server.metrics.cpu * 1.5);
      } else if (incident.type === 'memory') {
        server.metrics.memory = Math.min(100, server.metrics.memory * 1.3);
      } else if (incident.type === 'network') {
        server.metrics.network.in *= 0.5;
        server.metrics.network.out *= 0.5;
      }
    }
  }

  /**
   * 랜덤 사고 생성
   */
  private generateRandomIncident() {
    const incidents = [
      { type: 'cpu', message: 'High CPU usage detected', severity: 15 },
      { type: 'memory', message: 'Memory leak detected', severity: 20 },
      { type: 'network', message: 'Network latency spike', severity: 10 },
      { type: 'disk', message: 'Disk I/O bottleneck', severity: 12 },
      { type: 'security', message: 'Security scan alert', severity: 8 }
    ];
    
    return incidents[Math.floor(Math.random() * incidents.length)];
  }

  /**
   * 건강 상태 계산
   */
  private calculateServerHealth(server: ServerInstance): void {
    let healthScore = 100;
    
    // CPU 기반 점수 감소
    if (server.metrics.cpu > 90) healthScore -= 20;
    else if (server.metrics.cpu > 80) healthScore -= 10;
    else if (server.metrics.cpu > 70) healthScore -= 5;
    
    // 메모리 기반 점수 감소
    if (server.metrics.memory > 95) healthScore -= 25;
    else if (server.metrics.memory > 85) healthScore -= 15;
    else if (server.metrics.memory > 75) healthScore -= 5;
    
    // 디스크 기반 점수 감소
    if (server.metrics.disk > 90) healthScore -= 15;
    else if (server.metrics.disk > 80) healthScore -= 8;
    
    // 에러율 기반 점수 감소
    const errorRate = server.metrics.errors / Math.max(1, server.metrics.requests);
    if (errorRate > 0.05) healthScore -= 20; // 5% 이상
    else if (errorRate > 0.02) healthScore -= 10; // 2% 이상
    
    // 문제 개수 기반 점수 감소
    healthScore -= server.health.issues.length * 5;
    
    server.health.score = Math.max(0, Math.min(100, healthScore));
    server.health.lastCheck = new Date().toISOString();
    
    // 상태 업데이트
    if (server.health.score < 30) {
      server.status = 'error';
    } else if (server.health.score < 60) {
      server.status = 'warning';
    } else {
      server.status = 'running';
    }
  }

  /**
   * 클러스터 메트릭 업데이트
   */
  updateClusterMetrics(cluster: ServerCluster): void {
    const activeServers = cluster.servers.filter(s => s.status === 'running');
    
    // 로드밸런서 메트릭 계산
    const totalRequests = activeServers.reduce((sum, server) => sum + server.metrics.requests, 0);
    cluster.loadBalancer.totalRequests = totalRequests;
    cluster.loadBalancer.activeConnections = Math.floor(totalRequests * 0.1); // 10% 활성 연결
    
    // 스케일링 정보 업데이트
    cluster.scaling.current = activeServers.length;
    
    // 오토스케일링 시뮬레이션
    this.simulateAutoScaling(cluster);
  }

  /**
   * 오토스케일링 시뮬레이션
   */
  private simulateAutoScaling(cluster: ServerCluster): void {
    if (!this.simulationConfig.scaling.enabled) return;
    
    const activeServers = cluster.servers.filter(s => s.status === 'running');
    const avgLoad = activeServers.reduce((sum, server) => sum + server.metrics.cpu, 0) / activeServers.length;
    
    if (avgLoad > this.simulationConfig.scaling.threshold * 100 && cluster.scaling.current < cluster.scaling.max) {
      cluster.scaling.target = Math.min(cluster.scaling.max, cluster.scaling.current + 1);
    } else if (avgLoad < (this.simulationConfig.scaling.threshold * 100 * 0.6) && cluster.scaling.current > cluster.scaling.min) {
      cluster.scaling.target = Math.max(cluster.scaling.min, cluster.scaling.current - 1);
    }
  }

  /**
   * 애플리케이션 메트릭 업데이트
   */
  updateApplicationMetrics(app: ApplicationMetrics, servers: ServerInstance[]): void {
    const appServers = servers.filter(s => s.environment === 'production');
    
    // 배포 정보 업데이트
    app.deployments.production.servers = appServers.length;
    app.deployments.production.health = appServers.reduce((sum, s) => sum + s.health.score, 0) / appServers.length;
    
    // 성능 메트릭 계산
    const totalRequests = appServers.reduce((sum, s) => sum + s.metrics.requests, 0);
    const totalErrors = appServers.reduce((sum, s) => sum + s.metrics.errors, 0);
    
    app.performance.responseTime = this.calculateResponseTime(appServers);
    app.performance.throughput = totalRequests;
    app.performance.errorRate = totalErrors / Math.max(1, totalRequests);
    app.performance.availability = (appServers.filter(s => s.status === 'running').length / appServers.length) * 100;
    
    // 리소스 사용량 계산
    app.resources.totalCpu = appServers.reduce((sum, s) => sum + (s.metrics.cpu * s.specs.cpu.cores / 100), 0);
    app.resources.totalMemory = appServers.reduce((sum, s) => sum + (s.metrics.memory * s.specs.memory.total / 100), 0);
    app.resources.totalDisk = appServers.reduce((sum, s) => sum + (s.metrics.disk * s.specs.disk.total / 100), 0);
    app.resources.cost = this.calculateCost(appServers);
  }

  /**
   * 응답 시간 계산
   */
  private calculateResponseTime(servers: ServerInstance[]): number {
    const avgCpu = servers.reduce((sum, s) => sum + s.metrics.cpu, 0) / servers.length;
    const avgMemory = servers.reduce((sum, s) => sum + s.metrics.memory, 0) / servers.length;
    
    // CPU와 메모리 사용률에 따른 응답 시간 계산
    const baseResponseTime = 50; // 50ms 기본
    const cpuPenalty = avgCpu > 80 ? (avgCpu - 80) * 2 : 0;
    const memoryPenalty = avgMemory > 85 ? (avgMemory - 85) * 3 : 0;
    
    return baseResponseTime + cpuPenalty + memoryPenalty;
  }

  /**
   * 비용 계산
   */
  private calculateCost(servers: ServerInstance[]): number {
    return servers.reduce((sum, server) => {
      const cpuCost = server.specs.cpu.cores * 10; // 코어당 $10
      const memoryCost = (server.specs.memory.total / 1024) * 5; // GB당 $5
      const diskCost = server.specs.disk.total * 0.1; // GB당 $0.1
      return sum + cpuCost + memoryCost + diskCost;
    }, 0);
  }

  /**
   * 서버 베이스라인 가져오기
   */
  private getServerBaseline(serverId: string, metric: string): any {
    if (!this.serverBaselines.has(serverId)) {
      this.initializeServerBaseline(serverId);
    }
    
    const baseline = this.serverBaselines.get(serverId);
    return baseline?.[metric] || this.getDefaultBaseline(metric);
  }

  /**
   * 서버 베이스라인 초기화
   */
  private initializeServerBaseline(serverId: string): void {
    const baseline = {
      cpu: 0.2 + Math.random() * 0.3, // 20-50% 기본 CPU
      memory: 0.3 + Math.random() * 0.2, // 30-50% 기본 메모리
      disk: 0.1 + Math.random() * 0.2, // 10-30% 기본 디스크
      network: {
        in: 100 + Math.random() * 500, // 100-600 Mbps
        out: 50 + Math.random() * 200 // 50-250 Mbps
      },
      requests: 100 + Math.random() * 900 // 100-1000 RPS
    };
    
    this.serverBaselines.set(serverId, baseline);
  }

  /**
   * 기본 베이스라인 가져오기
   */
  private getDefaultBaseline(metric: string): any {
    const defaults: Record<string, any> = {
      cpu: 0.3,
      memory: 0.4,
      disk: 0.2,
      network: { in: 300, out: 150 },
      requests: 500
    };
    
    return defaults[metric] || 0;
  }

  /**
   * 베이스라인 재설정
   */
  resetBaselines(): void {
    this.serverBaselines.clear();
    this.currentStates.clear();
    this.patterns.clear();
  }

  /**
   * 시뮬레이션 설정 업데이트
   */
  updateSimulationConfig(config: Partial<SimulationConfig>): void {
    this.simulationConfig = { ...this.simulationConfig, ...config };
  }
} 