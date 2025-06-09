/**
 * 🚀 Real Server Data Generator - Complete Implementation
 *
 * 완전한 기능을 갖춘 서버 데이터 생성기
 */

import {
  ServerInstance,
  ServerCluster,
  ApplicationMetrics,
} from '@/types/data-generator';

export interface GeneratorConfig {
  maxServers?: number;
  updateInterval?: number;
  enableRealtime?: boolean;
  serverArchitecture?:
    | 'single'
    | 'master-slave'
    | 'load-balanced'
    | 'microservices';
}

export class RealServerDataGenerator {
  private static instance: RealServerDataGenerator | null = null;
  private servers: Map<string, ServerInstance> = new Map();
  private clusters: Map<string, ServerCluster> = new Map();
  private applications: Map<string, ApplicationMetrics> = new Map();
  private config: GeneratorConfig;
  private intervalId?: NodeJS.Timeout;
  private isInitialized = false;
  private isGenerating = false;

  constructor(config: GeneratorConfig = {}) {
    this.config = {
      maxServers: 30,
      updateInterval: 3000,
      enableRealtime: true,
      serverArchitecture: 'load-balanced',
      ...config,
    };
  }

  public static getInstance(): RealServerDataGenerator {
    if (!RealServerDataGenerator.instance) {
      RealServerDataGenerator.instance = new RealServerDataGenerator();
    }
    return RealServerDataGenerator.instance;
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

    console.log('🚀 RealServerDataGenerator 초기화 시작...');

    this.initializeServers();
    this.createClusters();
    this.createApplications();

    this.isInitialized = true;
    console.log('✅ RealServerDataGenerator 초기화 완료');
  }

  private initializeServers(): void {
    this.servers.clear();

    const serverTypes: (
      | 'web'
      | 'api'
      | 'database'
      | 'cache'
      | 'queue'
      | 'cdn'
      | 'gpu'
      | 'storage'
    )[] = ['web', 'api', 'database', 'cache', 'queue'];
    const roles: (
      | 'master'
      | 'slave'
      | 'primary'
      | 'replica'
      | 'worker'
      | 'standalone'
    )[] = ['primary', 'replica', 'worker', 'standalone'];
    const environments: ('production' | 'staging' | 'development' | 'test')[] =
      ['production', 'staging', 'development'];
    const locations = ['us-east-1', 'us-west-2', 'eu-west-1', 'ap-southeast-1'];

    for (let i = 1; i <= (this.config.maxServers || 30); i++) {
      const serverType =
        serverTypes[Math.floor(Math.random() * serverTypes.length)];
      const role = roles[Math.floor(Math.random() * roles.length)];
      const environment =
        environments[Math.floor(Math.random() * environments.length)];
      const location = locations[Math.floor(Math.random() * locations.length)];

      const server: ServerInstance = {
        id: `server-${i}`,
        name: `${serverType}-${i}`,
        type: serverType,
        role,
        environment,
        location,
        status:
          Math.random() > 0.1
            ? 'running'
            : Math.random() > 0.5
              ? 'warning'
              : 'error',
        specs: {
          cpu: {
            cores: Math.floor(Math.random() * 16) + 4,
            model: 'Intel Xeon',
            architecture: Math.random() > 0.7 ? 'arm64' : 'x86_64',
          },
          memory: {
            total: Math.pow(2, Math.floor(Math.random() * 4) + 3) * 1024,
            type: 'DDR4',
            speed: 3200,
          },
          disk: {
            total: Math.pow(2, Math.floor(Math.random() * 3) + 8) * 1024,
            type: 'SSD',
            iops: 3000,
          },
          network: {
            bandwidth: 1000,
            latency: Math.random() * 10 + 1,
          },
        },
        metrics: {
          cpu: Math.random() * 80 + 10,
          memory: Math.random() * 70 + 20,
          disk: Math.random() * 60 + 30,
          network: { in: Math.random() * 100, out: Math.random() * 100 },
          requests: Math.random() * 1000 + 100,
          errors: Math.random() * 10,
          uptime: Math.random() * 8760 * 3600, // 최대 1년
          customMetrics: {},
        },
        health: {
          score: Math.random() * 40 + 60, // 60-100점
          lastCheck: new Date().toISOString(),
          issues: [],
        },
      };

      // 건강 상태에 따른 이슈 생성
      if (server.health.score < 80) {
        server.health.issues = ['High CPU usage', 'Memory leak detected'];
      }

      this.servers.set(server.id, server);
    }
  }

  private createClusters(): void {
    this.clusters.clear();

    const serverGroups = this.groupServersByType();

    Object.entries(serverGroups).forEach(([type, servers], index) => {
      if (servers.length > 1) {
        const cluster: ServerCluster = {
          id: `cluster-${type}-${index + 1}`,
          name: `${type.charAt(0).toUpperCase() + type.slice(1)} Cluster`,
          servers: servers, // ServerInstance[] 배열을 직접 사용
          loadBalancer: {
            algorithm: 'round-robin',
            activeConnections: Math.floor(Math.random() * 100),
            totalRequests: Math.floor(Math.random() * 10000),
          },
          scaling: {
            current: servers.length,
            min: 1,
            max: servers.length * 2,
            target: servers.length,
            policy: 'cpu',
          },
        };

        this.clusters.set(cluster.id, cluster);
      }
    });
  }

  private createApplications(): void {
    this.applications.clear();

    const apps = [
      { name: 'Frontend App', type: 'web' },
      { name: 'API Gateway', type: 'api' },
      { name: 'User Service', type: 'api' },
      { name: 'Database Service', type: 'database' },
      { name: 'Cache Service', type: 'cache' },
    ];

    apps.forEach((app, index) => {
      const relatedServers = Array.from(this.servers.values())
        .filter(s => s.type === app.type)
        .slice(0, 3);

      const application: ApplicationMetrics = {
        name: app.name,
        version: `v${Math.floor(Math.random() * 5) + 1}.${Math.floor(Math.random() * 10)}.0`,
        deployments: {
          production: { servers: relatedServers.length, health: 90 },
          staging: {
            servers: Math.floor(relatedServers.length / 2),
            health: 85,
          },
          development: { servers: 1, health: 80 },
        },
        performance: {
          responseTime: Math.random() * 200 + 50,
          throughput: Math.random() * 1000 + 100,
          errorRate: Math.random() * 5,
          availability: Math.random() * 10 + 90,
        },
        resources: {
          totalCpu: relatedServers.reduce(
            (sum, s) => sum + s.specs.cpu.cores,
            0
          ),
          totalMemory: relatedServers.reduce(
            (sum, s) => sum + s.specs.memory.total,
            0
          ),
          totalDisk: relatedServers.reduce(
            (sum, s) => sum + s.specs.disk.total,
            0
          ),
          cost: Math.random() * 5000 + 1000,
        },
      };

      this.applications.set(`app-${index + 1}`, application);
    });
  }

  public startAutoGeneration(): void {
    if (this.isGenerating) return;

    this.isGenerating = true;
    this.intervalId = setInterval(() => {
      this.generateRealtimeData();
    }, this.config.updateInterval);

    console.log('🔄 실시간 데이터 생성 시작');
  }

  public stopAutoGeneration(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
    this.isGenerating = false;
    console.log('⏹️ 실시간 데이터 생성 중지');
  }

  private generateRealtimeData(): void {
    this.servers.forEach(server => {
      // 메트릭 업데이트
      server.metrics.cpu = Math.max(
        0,
        Math.min(100, server.metrics.cpu + (Math.random() - 0.5) * 10)
      );
      server.metrics.memory = Math.max(
        0,
        Math.min(100, server.metrics.memory + (Math.random() - 0.5) * 8)
      );
      server.metrics.disk = Math.max(
        0,
        Math.min(100, server.metrics.disk + (Math.random() - 0.5) * 5)
      );
      server.metrics.network.in = Math.random() * 100;
      server.metrics.network.out = Math.random() * 100;
      server.metrics.requests = Math.random() * 1000 + 100;
      server.metrics.errors = Math.random() * 10;
      server.metrics.uptime = Math.random() * 8760 * 3600;
      server.health.score = Math.max(
        0,
        Math.min(100, server.health.score + (Math.random() - 0.5) * 10)
      );
      server.health.lastCheck = new Date().toISOString();

      // 가끔 상태 변경
      if (Math.random() < 0.02) {
        const statuses: ('running' | 'warning' | 'error')[] = [
          'running',
          'warning',
          'error',
        ];
        server.status = statuses[Math.floor(Math.random() * statuses.length)];
      }
    });

    // 클러스터 메트릭 업데이트 (필요시)
    // this.updateClusterMetrics();
  }

  private updateClusterMetrics(): void {
    // ServerCluster 타입에는 metrics가 없으므로 제거하거나 다른 방식으로 처리
    // 현재는 주석 처리
  }

  // 필수 메서드들
  public getAllServers(): ServerInstance[] {
    return Array.from(this.servers.values());
  }

  public getServerById(id: string): ServerInstance | undefined {
    return this.servers.get(id);
  }

  public getAllClusters(): ServerCluster[] {
    return Array.from(this.clusters.values());
  }

  public getClusterById(id: string): ServerCluster | undefined {
    return this.clusters.get(id);
  }

  public getAllApplications(): ApplicationMetrics[] {
    return Array.from(this.applications.values());
  }

  public getApplicationByName(name: string): ApplicationMetrics | undefined {
    return Array.from(this.applications.values()).find(
      app => app.name === name
    );
  }

  public getDashboardSummary() {
    const servers = this.getAllServers();
    const clusters = this.getAllClusters();
    const applications = this.getAllApplications();

    return {
      servers: {
        total: servers.length,
        running: servers.filter(s => s.status === 'running').length,
        warning: servers.filter(s => s.status === 'warning').length,
        error: servers.filter(s => s.status === 'error').length,
        avgCpu:
          servers.length > 0
            ? servers.reduce((sum, s) => sum + s.metrics.cpu, 0) /
              servers.length
            : 0,
        avgMemory:
          servers.length > 0
            ? servers.reduce((sum, s) => sum + s.metrics.memory, 0) /
              servers.length
            : 0,
      },
      clusters: {
        total: clusters.length,
        healthy: clusters.filter(
          c =>
            c.servers.filter(s => s.status === 'running').length >=
            c.servers.length * 0.8
        ).length,
        warning: clusters.filter(c => {
          const healthyRatio =
            c.servers.filter(s => s.status === 'running').length /
            c.servers.length;
          return healthyRatio >= 0.5 && healthyRatio < 0.8;
        }).length,
        critical: clusters.filter(
          c =>
            c.servers.filter(s => s.status === 'running').length <
            c.servers.length * 0.5
        ).length,
      },
      applications: {
        total: applications.length,
        healthy: applications.filter(a => a.performance.availability >= 95)
          .length,
        warning: applications.filter(
          a =>
            a.performance.availability >= 90 && a.performance.availability < 95
        ).length,
        critical: applications.filter(a => a.performance.availability < 90)
          .length,
        avgResponseTime:
          applications.length > 0
            ? applications.reduce(
                (sum, a) => sum + a.performance.responseTime,
                0
              ) / applications.length
            : 0,
      },
      timestamp: Date.now(),
    };
  }

  public getEnvironmentConfig() {
    return {
      serverArchitecture: this.config.serverArchitecture,
      maxServers: this.config.maxServers,
      updateInterval: this.config.updateInterval,
      enableRealtime: this.config.enableRealtime,
    };
  }

  public getAdvancedFeaturesStatus() {
    return {
      networkTopology: { enabled: false, nodes: 0, connections: 0 },
      baselineOptimizer: { enabled: false, dataPoints: 0 },
      demoScenarios: { enabled: false, currentScenario: 'normal' },
    };
  }

  public async healthCheck() {
    return {
      status: 'healthy',
      timestamp: Date.now(),
      generator: {
        isInitialized: this.isInitialized,
        isGenerating: this.isGenerating,
        serverCount: this.servers.size,
        clusterCount: this.clusters.size,
        applicationCount: this.applications.size,
      },
      metrics: {
        avgCpu:
          this.getAllServers().reduce((sum, s) => sum + s.metrics.cpu, 0) /
          this.servers.size,
        avgMemory:
          this.getAllServers().reduce((sum, s) => sum + s.metrics.memory, 0) /
          this.servers.size,
        healthyServers: this.getAllServers().filter(s => s.status === 'running')
          .length,
      },
    };
  }

  // 헬퍼 메서드들
  private groupServersByType(): { [key: string]: ServerInstance[] } {
    const groups: { [key: string]: ServerInstance[] } = {};

    this.servers.forEach(server => {
      const type = server.type || 'unknown';
      if (!groups[type]) groups[type] = [];
      groups[type].push(server);
    });

    return groups;
  }

  private calculateClusterHealth(
    servers: ServerInstance[]
  ): 'healthy' | 'warning' | 'critical' {
    const healthyCount = servers.filter(s => s.status === 'running').length;
    const healthPercentage = healthyCount / servers.length;

    if (healthPercentage >= 0.8) return 'healthy';
    if (healthPercentage >= 0.5) return 'warning';
    return 'critical';
  }

  private calculateApplicationHealth(
    servers: ServerInstance[]
  ): 'healthy' | 'warning' | 'critical' {
    if (servers.length === 0) return 'critical';

    const healthyCount = servers.filter(s => s.status === 'running').length;
    const healthPercentage = healthyCount / servers.length;

    if (healthPercentage >= 0.7) return 'healthy';
    if (healthPercentage >= 0.4) return 'warning';
    return 'critical';
  }

  public getStatus() {
    return {
      isInitialized: this.isInitialized,
      isRunning: this.isGenerating,
      serverCount: this.servers.size,
      clusterCount: this.clusters.size,
      applicationCount: this.applications.size,
      config: this.config,
    };
  }

  public dispose(): void {
    this.stopAutoGeneration();
    this.servers.clear();
    this.clusters.clear();
    this.applications.clear();
    this.isInitialized = false;
  }
}

// 싱글톤 인스턴스
export const realServerDataGenerator = RealServerDataGenerator.getInstance();
