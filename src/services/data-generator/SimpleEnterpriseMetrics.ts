/**
 * 🏢 간단한 엔터프라이즈 메트릭 생성기
 * 25개 핵심 메트릭으로 Vercel 리소스 절약
 */

import { CoreEnterpriseMetrics } from '@/types/core-enterprise-metrics';

export interface SimpleEnterpriseServer {
  id: string;
  name: string;
  type: 'web' | 'database' | 'api' | 'cache' | 'loadbalancer' | 'monitoring';
  specs: { cores: number; ram: number };
}

export type SimpleScenario =
  | 'normal'
  | 'peak'
  | 'memory_leak'
  | 'disk_issue'
  | 'network_slow'
  | 'service_down';

// 🔧 API 응답용 확장된 메트릭 타입
export interface EnterpriseMetricsResponse extends CoreEnterpriseMetrics {
  serverId: string;
  serverName: string;
  serverType: string;
  timestamp: string;
  scenario: SimpleScenario;
}

export class SimpleEnterpriseMetrics {
  private static instance: SimpleEnterpriseMetrics | null = null;
  private scenarios: Map<string, SimpleScenario> = new Map();
  private enabled = true;

  private servers: SimpleEnterpriseServer[] = [
    { id: 'web-01', name: 'WEB-01', type: 'web', specs: { cores: 8, ram: 16 } },
    {
      id: 'db-01',
      name: 'DB-01',
      type: 'database',
      specs: { cores: 16, ram: 64 },
    },
    { id: 'api-01', name: 'API-01', type: 'api', specs: { cores: 4, ram: 8 } },
    {
      id: 'cache-01',
      name: 'CACHE-01',
      type: 'cache',
      specs: { cores: 4, ram: 16 },
    },
  ];

  public static getInstance(): SimpleEnterpriseMetrics {
    if (!SimpleEnterpriseMetrics.instance) {
      SimpleEnterpriseMetrics.instance = new SimpleEnterpriseMetrics();
    }
    return SimpleEnterpriseMetrics.instance;
  }

  /**
   * 🎯 25개 핵심 메트릭 생성
   */
  public generateMetrics(): EnterpriseMetricsResponse[] {
    if (!this.enabled) return [];

    return this.servers.map(server => {
      const scenario = this.getScenario(server.id);
      const multiplier = this.getMultiplier(scenario);

      return {
        serverId: server.id,
        serverName: server.name,
        serverType: server.type,
        timestamp: new Date().toISOString(),
        scenario,

        // 🖥️ 시스템 리소스 메트릭 (10개)
        systemResources: {
          cpuUsage: this.generateCPU(server, scenario, multiplier),
          loadAverage: this.generateLoad(server, multiplier),
          cpuTemperature: this.generateTemp(server, scenario),
          memoryUsage: this.generateMemory(server, scenario, multiplier),
          swapUsage: this.generateSwap(server, scenario),
          diskUsage: this.generateDisk(server, scenario),
          diskIOPS: this.generateIOPS(server, scenario, multiplier),
          networkInbound: this.generateNetIn(server, scenario, multiplier),
          networkOutbound: this.generateNetOut(server, scenario, multiplier),
          networkConnections: this.generateConnections(
            server,
            scenario,
            multiplier
          ),
        },

        // 🚀 애플리케이션 성능 메트릭 (8개)
        applicationPerformance: {
          responseTime: this.generateResponse(server, scenario, multiplier),
          requestsPerSecond: this.generateRPS(server, scenario, multiplier),
          errorRate: this.generateErrors(server, scenario),
          activeConnections: this.generateActiveConns(
            server,
            scenario,
            multiplier
          ),
          threadPoolUsage: this.generateThreads(server, scenario, multiplier),
          cacheHitRate: this.generateCacheHit(server, scenario),
          dbQueryTime: this.generateQueryTime(server, scenario, multiplier),
          sslHandshakeTime: this.generateSSL(server, scenario),
        },

        // 🛡️ 시스템 상태 메트릭 (7개)
        systemHealth: {
          processCount: this.generateProcesses(server, scenario),
          fileDescriptorUsage: this.generateFileDesc(
            server,
            scenario,
            multiplier
          ),
          uptime: this.generateUptime(),
          securityEvents: this.generateSecurity(server, scenario),
          logErrors: this.generateLogErrors(server, scenario),
          serviceHealthScore: this.generateHealthScore(server, scenario),
          memoryLeakIndicator: this.generateMemoryLeak(scenario),
        },
      };
    });
  }

  // 🎭 시나리오 & 승수 관리
  private getScenario(serverId: string): SimpleScenario {
    if (!this.scenarios.has(serverId) || Math.random() < 0.1) {
      const scenarios: SimpleScenario[] = [
        'normal',
        'peak',
        'memory_leak',
        'disk_issue',
        'network_slow',
        'service_down',
      ];
      const weights = [0.7, 0.15, 0.05, 0.03, 0.04, 0.03];

      const rand = Math.random();
      let sum = 0;
      for (let i = 0; i < scenarios.length; i++) {
        sum += weights[i];
        if (rand <= sum) {
          this.scenarios.set(serverId, scenarios[i]);
          break;
        }
      }
    }
    return this.scenarios.get(serverId) || 'normal';
  }

  private getMultiplier(scenario: SimpleScenario): number {
    const multipliers = {
      normal: 1.0,
      peak: 1.8,
      memory_leak: 1.3,
      disk_issue: 1.5,
      network_slow: 1.6,
      service_down: 0.4,
    };
    return multipliers[scenario];
  }

  private rand(center: number, variation: number): number {
    return center + (Math.random() - 0.5) * variation;
  }

  // 📊 시스템 리소스 메트릭 (10개)
  private generateCPU(
    server: SimpleEnterpriseServer,
    scenario: SimpleScenario,
    multiplier: number
  ): number {
    const base =
      {
        web: 35,
        database: 45,
        api: 30,
        cache: 25,
        loadbalancer: 15,
        monitoring: 40,
      }[server.type] || 30;
    const adj =
      scenario === 'peak' ? 25 : scenario === 'service_down' ? -20 : 0;
    return Math.max(
      5,
      Math.min(100, base * multiplier + adj + this.rand(0, 10))
    );
  }

  private generateLoad(
    server: SimpleEnterpriseServer,
    multiplier: number
  ): number {
    return Math.max(0.1, Math.random() * server.specs.cores * multiplier);
  }

  private generateTemp(
    server: SimpleEnterpriseServer,
    scenario: SimpleScenario
  ): number {
    const base =
      {
        web: 55,
        database: 60,
        api: 55,
        cache: 50,
        loadbalancer: 45,
        monitoring: 50,
      }[server.type] || 55;
    const adj = scenario === 'peak' ? 15 : scenario === 'service_down' ? -5 : 0;
    return Math.max(35, Math.min(85, base + adj + this.rand(0, 16)));
  }

  private generateMemory(
    server: SimpleEnterpriseServer,
    scenario: SimpleScenario,
    multiplier: number
  ): number {
    const base =
      {
        web: 45,
        database: 65,
        api: 40,
        cache: 80,
        loadbalancer: 35,
        monitoring: 50,
      }[server.type] || 45;
    const adj = scenario === 'memory_leak' ? 20 : scenario === 'peak' ? 15 : 0;
    return Math.max(
      15,
      Math.min(98, base * multiplier + adj + this.rand(0, 16))
    );
  }

  private generateSwap(
    server: SimpleEnterpriseServer,
    scenario: SimpleScenario
  ): number {
    return scenario === 'memory_leak' ? this.rand(15, 10) : this.rand(2, 4);
  }

  private generateDisk(
    server: SimpleEnterpriseServer,
    scenario: SimpleScenario
  ): number {
    const base =
      {
        web: 65,
        database: 75,
        api: 55,
        cache: 45,
        loadbalancer: 40,
        monitoring: 80,
      }[server.type] || 55;
    const adj = scenario === 'disk_issue' ? 25 : 0;
    return Math.max(20, Math.min(98, base + adj + this.rand(0, 10)));
  }

  private generateIOPS(
    server: SimpleEnterpriseServer,
    scenario: SimpleScenario,
    multiplier: number
  ): number {
    const base =
      {
        web: 1500,
        database: 8000,
        api: 2000,
        cache: 12000,
        loadbalancer: 500,
        monitoring: 3000,
      }[server.type] || 1500;
    const boost =
      scenario === 'disk_issue' ? 2.5 : scenario === 'peak' ? 1.8 : 1.0;
    return Math.max(
      100,
      Math.round(base * multiplier * boost + this.rand(0, 400))
    );
  }

  private generateNetIn(
    server: SimpleEnterpriseServer,
    scenario: SimpleScenario,
    multiplier: number
  ): number {
    const base =
      {
        web: 150,
        database: 80,
        api: 200,
        cache: 100,
        loadbalancer: 500,
        monitoring: 60,
      }[server.type] || 100;
    const boost =
      scenario === 'network_slow' ? 0.5 : scenario === 'peak' ? 2.2 : 1.0;
    return Math.max(
      5,
      Math.round(base * multiplier * boost + this.rand(0, 40))
    );
  }

  private generateNetOut(
    server: SimpleEnterpriseServer,
    scenario: SimpleScenario,
    multiplier: number
  ): number {
    const inbound = this.generateNetIn(server, scenario, multiplier);
    return Math.max(3, Math.round(inbound * (0.6 + Math.random() * 0.3)));
  }

  private generateConnections(
    server: SimpleEnterpriseServer,
    scenario: SimpleScenario,
    multiplier: number
  ): number {
    const base =
      {
        web: 2500,
        database: 800,
        api: 1500,
        cache: 1200,
        loadbalancer: 5000,
        monitoring: 300,
      }[server.type] || 1000;
    const boost =
      scenario === 'peak' ? 2.0 : scenario === 'network_slow' ? 0.6 : 1.0;
    return Math.max(
      50,
      Math.round(base * multiplier * boost + this.rand(0, 400))
    );
  }

  // 🚀 애플리케이션 성능 메트릭 (8개)
  private generateResponse(
    server: SimpleEnterpriseServer,
    scenario: SimpleScenario,
    multiplier: number
  ): number {
    const base =
      {
        web: 250,
        database: 50,
        api: 180,
        cache: 15,
        loadbalancer: 5,
        monitoring: 100,
      }[server.type] || 150;
    const increase =
      scenario === 'peak'
        ? 3.0
        : scenario === 'disk_issue'
          ? 2.5
          : scenario === 'network_slow'
            ? 2.0
            : 1.0;
    return Math.max(
      1,
      Math.round(base * multiplier * increase + this.rand(0, 100))
    );
  }

  private generateRPS(
    server: SimpleEnterpriseServer,
    scenario: SimpleScenario,
    multiplier: number
  ): number {
    const base =
      {
        web: 850,
        database: 1200,
        api: 600,
        cache: 2000,
        loadbalancer: 2500,
        monitoring: 150,
      }[server.type] || 500;
    const boost =
      scenario === 'peak' ? 3.5 : scenario === 'service_down' ? 0.2 : 1.0;
    return Math.max(
      10,
      Math.round(base * multiplier * boost + this.rand(0, 200))
    );
  }

  private generateErrors(
    server: SimpleEnterpriseServer,
    scenario: SimpleScenario
  ): number {
    const base =
      {
        web: 0.8,
        database: 0.3,
        api: 1.2,
        cache: 0.1,
        loadbalancer: 0.5,
        monitoring: 0.2,
      }[server.type] || 0.5;
    const increase =
      scenario === 'service_down' ? 15 : scenario === 'peak' ? 3 : 1;
    return Math.max(0, Math.min(25, base * increase + this.rand(0, 1)));
  }

  private generateActiveConns(
    server: SimpleEnterpriseServer,
    scenario: SimpleScenario,
    multiplier: number
  ): number {
    const networkConns = this.generateConnections(server, scenario, multiplier);
    return Math.max(
      20,
      Math.round(networkConns * (0.6 + Math.random() * 0.25))
    );
  }

  private generateThreads(
    server: SimpleEnterpriseServer,
    scenario: SimpleScenario,
    multiplier: number
  ): number {
    const base =
      {
        web: 60,
        database: 70,
        api: 55,
        cache: 40,
        loadbalancer: 30,
        monitoring: 45,
      }[server.type] || 50;
    const adj =
      scenario === 'peak' ? 25 : scenario === 'service_down' ? -20 : 0;
    return Math.max(
      10,
      Math.min(100, base * multiplier + adj + this.rand(0, 20))
    );
  }

  private generateCacheHit(
    server: SimpleEnterpriseServer,
    scenario: SimpleScenario
  ): number {
    const base = server.type === 'cache' ? 92 : 85;
    const decrease =
      scenario === 'peak' ? 15 : scenario === 'memory_leak' ? 10 : 0;
    return Math.max(50, Math.min(99, base - decrease + this.rand(0, 10)));
  }

  private generateQueryTime(
    server: SimpleEnterpriseServer,
    scenario: SimpleScenario,
    multiplier: number
  ): number {
    const base =
      {
        web: 25,
        database: 8,
        api: 35,
        cache: 2,
        loadbalancer: 1,
        monitoring: 45,
      }[server.type] || 20;
    const increase =
      scenario === 'disk_issue' ? 5.0 : scenario === 'peak' ? 3.0 : 1.0;
    return Math.max(
      0.5,
      Math.round(base * multiplier * increase + this.rand(0, 10))
    );
  }

  private generateSSL(
    server: SimpleEnterpriseServer,
    scenario: SimpleScenario
  ): number {
    const base =
      {
        web: 45,
        database: 25,
        api: 35,
        cache: 15,
        loadbalancer: 30,
        monitoring: 40,
      }[server.type] || 35;
    const increase =
      scenario === 'network_slow' ? 2.5 : scenario === 'peak' ? 1.8 : 1.0;
    return Math.max(5, Math.round(base * increase + this.rand(0, 20)));
  }

  // 🛡️ 시스템 상태 메트릭 (7개)
  private generateProcesses(
    server: SimpleEnterpriseServer,
    scenario: SimpleScenario
  ): number {
    const base =
      {
        web: 180,
        database: 120,
        api: 150,
        cache: 80,
        loadbalancer: 90,
        monitoring: 200,
      }[server.type] || 120;
    const change =
      scenario === 'service_down' ? 50 : scenario === 'peak' ? 30 : 0;
    return Math.max(50, base + change + this.rand(0, 40));
  }

  private generateFileDesc(
    server: SimpleEnterpriseServer,
    scenario: SimpleScenario,
    multiplier: number
  ): number {
    const base =
      {
        web: 55,
        database: 70,
        api: 60,
        cache: 45,
        loadbalancer: 80,
        monitoring: 50,
      }[server.type] || 55;
    const increase =
      scenario === 'peak' ? 20 : scenario === 'network_slow' ? 15 : 0;
    return Math.max(
      20,
      Math.min(98, base * multiplier + increase + this.rand(0, 16))
    );
  }

  private generateUptime(): number {
    return Math.round((15 + Math.random() * 60) * 24 * 3600); // 15-75일
  }

  private generateSecurity(
    server: SimpleEnterpriseServer,
    scenario: SimpleScenario
  ): number {
    const base =
      { web: 3, database: 1, api: 5, cache: 0, loadbalancer: 8, monitoring: 2 }[
        server.type
      ] || 2;
    const increase = scenario === 'service_down' ? 10 : 0;
    return Math.max(0, base + increase + Math.floor(Math.random() * 5));
  }

  private generateLogErrors(
    server: SimpleEnterpriseServer,
    scenario: SimpleScenario
  ): number {
    const base =
      {
        web: 8,
        database: 3,
        api: 12,
        cache: 1,
        loadbalancer: 15,
        monitoring: 5,
      }[server.type] || 5;
    const increase =
      scenario === 'service_down' ? 25 : scenario === 'peak' ? 10 : 0;
    return Math.max(0, base + increase + Math.floor(Math.random() * 8));
  }

  private generateHealthScore(
    server: SimpleEnterpriseServer,
    scenario: SimpleScenario
  ): number {
    const base =
      {
        web: 92,
        database: 95,
        api: 88,
        cache: 96,
        loadbalancer: 90,
        monitoring: 93,
      }[server.type] || 90;
    const decrease =
      scenario === 'service_down' ? 40 : scenario === 'peak' ? 15 : 0;
    return Math.max(30, Math.min(100, base - decrease + this.rand(0, 10)));
  }

  private generateMemoryLeak(scenario: SimpleScenario): number {
    return scenario === 'memory_leak' ? this.rand(25, 15) : this.rand(2, 3);
  }

  // 🔍 공개 API
  public getAllServers(): SimpleEnterpriseServer[] {
    return [...this.servers];
  }

  public getCurrentScenario(serverId: string): SimpleScenario {
    return this.scenarios.get(serverId) || 'normal';
  }

  public enable(): void {
    this.enabled = true;
  }
  public disable(): void {
    this.enabled = false;
  }
  public isActive(): boolean {
    return this.enabled;
  }

  public getStatus() {
    return {
      enabled: this.enabled,
      serverCount: this.servers.length,
      activeScenarios: Object.fromEntries(this.scenarios),
    };
  }
}
