/**
 * 🏢 엔터프라이즈 메트릭 생성기 v2.0
 *
 * 25개 핵심 메트릭 기반 실제 모니터링 도구 수준 시뮬레이션
 * Zabbix/Nagios/Prometheus 급 메트릭과 실제 장애 시나리오
 */

import {
  CoreEnterpriseMetrics,
  ENTERPRISE_SERVERS,
  EnterpriseScenario,
  EnterpriseServer,
  MetricDataPoint,
  selectRandomScenario,
} from '@/types/core-enterprise-metrics';

export class EnterpriseMetricsGenerator {
  private static instance: EnterpriseMetricsGenerator | null = null;
  private currentScenarios: Map<string, EnterpriseScenario> = new Map();
  private scenarioStartTimes: Map<string, number> = new Map();
  private historicalData: Map<string, MetricDataPoint[]> = new Map();
  private isEnabled = true;
  private lastUpdate = Date.now();

  private constructor() {
    this.initializeServers();
  }

  public static getInstance(): EnterpriseMetricsGenerator {
    if (!EnterpriseMetricsGenerator.instance) {
      EnterpriseMetricsGenerator.instance = new EnterpriseMetricsGenerator();
    }
    return EnterpriseMetricsGenerator.instance;
  }

  /**
   * 🎯 25개 핵심 메트릭 생성 (메인 함수)
   */
  public async generateAllMetrics(): Promise<MetricDataPoint[]> {
    if (!this.isEnabled) return [];

    const timestamp = new Date().toISOString();
    const allMetrics: MetricDataPoint[] = [];

    for (const server of ENTERPRISE_SERVERS) {
      const scenario = this.getOrUpdateScenario(server.id);
      const metrics = this.generateServerMetrics(server, scenario);

      const dataPoint: MetricDataPoint = {
        timestamp,
        metrics,
        scenario,
        scenarioDuration: this.getScenarioDuration(server.id),
      };

      allMetrics.push(dataPoint);
      this.saveToHistory(server.id, dataPoint);
    }

    this.lastUpdate = Date.now();
    return allMetrics;
  }

  /**
   * 🏗️ 개별 서버의 25개 메트릭 생성
   */
  private generateServerMetrics(
    server: EnterpriseServer,
    scenario: EnterpriseScenario
  ): CoreEnterpriseMetrics {
    const scenarioTime = this.getTimeInScenario(server.id);
    const baseMultiplier = this.getScenarioMultiplier(scenario, scenarioTime);

    return {
      // 🖥️ 시스템 리소스 메트릭 (10개)
      systemResources: {
        cpuUsage: this.generateCPUUsage(server, scenario, baseMultiplier),
        loadAverage: this.generateLoadAverage(server, scenario, baseMultiplier),
        cpuTemperature: this.generateCPUTemperature(server, scenario),
        memoryUsage: this.generateMemoryUsage(server, scenario, baseMultiplier),
        swapUsage: this.generateSwapUsage(server, scenario, baseMultiplier),
        diskUsage: this.generateDiskUsage(server, scenario),
        diskIOPS: this.generateDiskIOPS(server, scenario, baseMultiplier),
        networkInbound: this.generateNetworkInbound(
          server,
          scenario,
          baseMultiplier
        ),
        networkOutbound: this.generateNetworkOutbound(
          server,
          scenario,
          baseMultiplier
        ),
        networkConnections: this.generateNetworkConnections(
          server,
          scenario,
          baseMultiplier
        ),
      },

      // 🚀 애플리케이션 성능 메트릭 (8개)
      applicationPerformance: {
        responseTime: this.generateResponseTime(
          server,
          scenario,
          baseMultiplier
        ),
        requestsPerSecond: this.generateRPS(server, scenario, baseMultiplier),
        errorRate: this.generateErrorRate(server, scenario),
        activeConnections: this.generateActiveConnections(
          server,
          scenario,
          baseMultiplier
        ),
        threadPoolUsage: this.generateThreadPoolUsage(
          server,
          scenario,
          baseMultiplier
        ),
        cacheHitRate: this.generateCacheHitRate(server, scenario),
        dbQueryTime: this.generateDBQueryTime(server, scenario, baseMultiplier),
        sslHandshakeTime: this.generateSSLHandshakeTime(server, scenario),
      },

      // 🛡️ 시스템 상태 메트릭 (7개)
      systemHealth: {
        processCount: this.generateProcessCount(server, scenario),
        fileDescriptorUsage: this.generateFileDescriptorUsage(
          server,
          scenario,
          baseMultiplier
        ),
        uptime: this.generateUptime(server),
        securityEvents: this.generateSecurityEvents(server, scenario),
        logErrors: this.generateLogErrors(server, scenario),
        serviceHealthScore: this.generateServiceHealthScore(server, scenario),
        memoryLeakIndicator: this.generateMemoryLeakIndicator(
          server,
          scenario,
          scenarioTime
        ),
      },
    };
  }

  // 🎭 시나리오별 배수 계산
  private getScenarioMultiplier(
    scenario: EnterpriseScenario,
    timeInScenario: number
  ): number {
    const timeMinutes = timeInScenario / (1000 * 60);

    switch (scenario) {
      case 'normal_operation':
        return 1.0 + Math.sin(timeMinutes / 30) * 0.1;
      case 'peak_load':
        return 1.5 + Math.sin(timeMinutes / 15) * 0.3;
      case 'memory_leak':
        return 1.0 + (timeMinutes / 180) * 0.5;
      case 'disk_saturation':
        return 1.2 + Math.random() * 0.5;
      case 'network_congestion':
        return 1.3 + Math.sin(timeMinutes / 5) * 0.4;
      case 'service_failure':
        return 0.3 + Math.random() * 0.4;
      default:
        return 1.0;
    }
  }

  // 📊 시스템 리소스 메트릭 생성 함수들 (10개)
  private generateCPUUsage(
    server: EnterpriseServer,
    scenario: EnterpriseScenario,
    multiplier: number
  ): number {
    const baseUsage = this.getBaseCPUForServerType(server.type);
    const scenarioAdjustment =
      scenario === 'peak_load' ? 25 : scenario === 'service_failure' ? -20 : 0;

    return Math.max(
      5,
      Math.min(
        100,
        baseUsage * multiplier + scenarioAdjustment + this.getRandomVariation(5)
      )
    );
  }

  private generateLoadAverage(
    server: EnterpriseServer,
    scenario: EnterpriseScenario,
    multiplier: number
  ): number {
    const cores = server.specs.cores;
    const cpuUsage = this.generateCPUUsage(server, scenario, multiplier);

    return Math.max(
      0.1,
      (cpuUsage / 100) * cores * multiplier + this.getRandomVariation(0.3)
    );
  }

  private generateCPUTemperature(
    server: EnterpriseServer,
    scenario: EnterpriseScenario
  ): number {
    const baseTempMap = {
      web: 55,
      database: 60,
      api: 55,
      cache: 50,
      loadbalancer: 45,
      monitoring: 50,
    };
    const baseTemp = baseTempMap[server.type] || 55;
    const adjustment =
      scenario === 'peak_load' ? 15 : scenario === 'service_failure' ? -5 : 0;

    return Math.max(
      35,
      Math.min(85, baseTemp + adjustment + this.getRandomVariation(8))
    );
  }

  private generateMemoryUsage(
    server: EnterpriseServer,
    scenario: EnterpriseScenario,
    multiplier: number
  ): number {
    const baseMemoryMap = {
      web: 45,
      database: 65,
      api: 40,
      cache: 80,
      loadbalancer: 35,
      monitoring: 50,
    };
    const baseMemory = baseMemoryMap[server.type] || 45;
    const scenarioAdjustment =
      scenario === 'memory_leak' ? 20 : scenario === 'peak_load' ? 15 : 0;

    return Math.max(
      15,
      Math.min(
        98,
        baseMemory * multiplier +
          scenarioAdjustment +
          this.getRandomVariation(8)
      )
    );
  }

  private generateSwapUsage(
    server: EnterpriseServer,
    scenario: EnterpriseScenario,
    multiplier: number
  ): number {
    const memoryUsage = this.generateMemoryUsage(server, scenario, multiplier);

    if (memoryUsage < 85) return 0;

    const swapFactor = scenario === 'memory_leak' ? 2.0 : 1.0;
    return Math.max(
      0,
      Math.min(50, (memoryUsage - 85) * swapFactor + this.getRandomVariation(3))
    );
  }

  private generateDiskUsage(
    server: EnterpriseServer,
    scenario: EnterpriseScenario
  ): number {
    const baseDiskMap = {
      web: 65,
      database: 75,
      api: 55,
      cache: 45,
      loadbalancer: 40,
      monitoring: 80,
    };
    const baseDisk = baseDiskMap[server.type] || 55;
    const adjustment = scenario === 'disk_saturation' ? 25 : 0;

    return Math.max(
      20,
      Math.min(98, baseDisk + adjustment + this.getRandomVariation(5))
    );
  }

  private generateDiskIOPS(
    server: EnterpriseServer,
    scenario: EnterpriseScenario,
    multiplier: number
  ): number {
    const baseIOPSMap = {
      web: 1500,
      database: 8000,
      api: 2000,
      cache: 12000,
      loadbalancer: 500,
      monitoring: 3000,
    };
    const baseIOPS = baseIOPSMap[server.type] || 1500;
    const scenarioBoost =
      scenario === 'disk_saturation'
        ? 2.5
        : scenario === 'peak_load'
          ? 1.8
          : 1.0;

    return Math.max(
      100,
      Math.round(
        baseIOPS * multiplier * scenarioBoost + this.getRandomVariation(200)
      )
    );
  }

  private generateNetworkInbound(
    server: EnterpriseServer,
    scenario: EnterpriseScenario,
    multiplier: number
  ): number {
    const baseInboundMap = {
      web: 150,
      database: 80,
      api: 200,
      cache: 100,
      loadbalancer: 500,
      monitoring: 60,
    };
    const baseInbound = baseInboundMap[server.type] || 100;
    const scenarioBoost =
      scenario === 'network_congestion'
        ? 3.0
        : scenario === 'peak_load'
          ? 2.2
          : 1.0;

    return Math.max(
      5,
      Math.round(
        baseInbound * multiplier * scenarioBoost + this.getRandomVariation(20)
      )
    );
  }

  private generateNetworkOutbound(
    server: EnterpriseServer,
    scenario: EnterpriseScenario,
    multiplier: number
  ): number {
    const inbound = this.generateNetworkInbound(server, scenario, multiplier);
    const ratio = 0.6 + Math.random() * 0.3;
    return Math.max(
      3,
      Math.round(inbound * ratio + this.getRandomVariation(15))
    );
  }

  private generateNetworkConnections(
    server: EnterpriseServer,
    scenario: EnterpriseScenario,
    multiplier: number
  ): number {
    const baseConnectionsMap = {
      web: 2500,
      database: 800,
      api: 1500,
      cache: 1200,
      loadbalancer: 5000,
      monitoring: 300,
    };
    const baseConnections = baseConnectionsMap[server.type] || 1000;
    const scenarioBoost =
      scenario === 'peak_load'
        ? 2.0
        : scenario === 'network_congestion'
          ? 1.8
          : 1.0;

    return Math.max(
      50,
      Math.round(
        baseConnections * multiplier * scenarioBoost +
          this.getRandomVariation(200)
      )
    );
  }

  // 🚀 애플리케이션 성능 메트릭 생성 함수들 (8개)
  private generateResponseTime(
    server: EnterpriseServer,
    scenario: EnterpriseScenario,
    multiplier: number
  ): number {
    const baseResponseMap = {
      web: 250,
      database: 50,
      api: 180,
      cache: 15,
      loadbalancer: 5,
      monitoring: 100,
    };
    const baseResponse = baseResponseMap[server.type] || 150;
    const scenarioIncrease =
      scenario === 'peak_load'
        ? 3.0
        : scenario === 'disk_saturation'
          ? 2.5
          : 1.0;

    return Math.max(
      1,
      Math.round(
        baseResponse * multiplier * scenarioIncrease +
          this.getRandomVariation(50)
      )
    );
  }

  private generateRPS(
    server: EnterpriseServer,
    scenario: EnterpriseScenario,
    multiplier: number
  ): number {
    const baseRPSMap = {
      web: 850,
      database: 1200,
      api: 600,
      cache: 2000,
      loadbalancer: 2500,
      monitoring: 150,
    };
    const baseRPS = baseRPSMap[server.type] || 500;
    const scenarioBoost =
      scenario === 'peak_load'
        ? 3.5
        : scenario === 'service_failure'
          ? 0.2
          : 1.0;

    return Math.max(
      10,
      Math.round(
        baseRPS * multiplier * scenarioBoost + this.getRandomVariation(100)
      )
    );
  }

  private generateErrorRate(
    server: EnterpriseServer,
    scenario: EnterpriseScenario
  ): number {
    const baseErrorMap = {
      web: 0.8,
      database: 0.3,
      api: 1.2,
      cache: 0.1,
      loadbalancer: 0.5,
      monitoring: 0.2,
    };
    const baseError = baseErrorMap[server.type] || 0.5;
    const scenarioIncrease =
      scenario === 'service_failure' ? 15 : scenario === 'peak_load' ? 3 : 1;

    return Math.max(
      0,
      Math.min(25, baseError * scenarioIncrease + this.getRandomVariation(0.5))
    );
  }

  private generateActiveConnections(
    server: EnterpriseServer,
    scenario: EnterpriseScenario,
    multiplier: number
  ): number {
    const networkConnections = this.generateNetworkConnections(
      server,
      scenario,
      multiplier
    );
    const ratio = 0.6 + Math.random() * 0.25;
    return Math.max(20, Math.round(networkConnections * ratio));
  }

  private generateThreadPoolUsage(
    server: EnterpriseServer,
    scenario: EnterpriseScenario,
    multiplier: number
  ): number {
    const baseThreadMap = {
      web: 60,
      database: 70,
      api: 55,
      cache: 40,
      loadbalancer: 30,
      monitoring: 45,
    };
    const baseThread = baseThreadMap[server.type] || 50;
    const scenarioIncrease =
      scenario === 'peak_load' ? 25 : scenario === 'service_failure' ? -20 : 0;

    return Math.max(
      10,
      Math.min(
        100,
        baseThread * multiplier + scenarioIncrease + this.getRandomVariation(10)
      )
    );
  }

  private generateCacheHitRate(
    server: EnterpriseServer,
    scenario: EnterpriseScenario
  ): number {
    if (server.type !== 'cache' && server.type !== 'database') {
      return Math.max(75, Math.min(95, 85 + this.getRandomVariation(8)));
    }

    const baseCacheRate = server.type === 'cache' ? 92 : 78;
    const scenarioDecrease =
      scenario === 'peak_load' ? 15 : scenario === 'memory_leak' ? 10 : 0;

    return Math.max(
      50,
      Math.min(
        99,
        baseCacheRate - scenarioDecrease + this.getRandomVariation(5)
      )
    );
  }

  private generateDBQueryTime(
    server: EnterpriseServer,
    scenario: EnterpriseScenario,
    multiplier: number
  ): number {
    const baseQueryMap = {
      web: 25,
      database: 8,
      api: 35,
      cache: 2,
      loadbalancer: 1,
      monitoring: 45,
    };
    const baseQuery = baseQueryMap[server.type] || 20;
    const scenarioIncrease =
      scenario === 'disk_saturation'
        ? 5.0
        : scenario === 'peak_load'
          ? 3.0
          : 1.0;

    return Math.max(
      0.5,
      Math.round(
        baseQuery * multiplier * scenarioIncrease + this.getRandomVariation(5)
      )
    );
  }

  private generateSSLHandshakeTime(
    server: EnterpriseServer,
    scenario: EnterpriseScenario
  ): number {
    const baseSSLMap = {
      web: 45,
      database: 25,
      api: 35,
      cache: 15,
      loadbalancer: 30,
      monitoring: 40,
    };
    const baseSSL = baseSSLMap[server.type] || 35;
    const scenarioIncrease =
      scenario === 'network_congestion'
        ? 2.5
        : scenario === 'peak_load'
          ? 1.8
          : 1.0;

    return Math.max(
      5,
      Math.round(baseSSL * scenarioIncrease + this.getRandomVariation(10))
    );
  }

  // 🛡️ 시스템 상태 메트릭 생성 함수들 (7개)
  private generateProcessCount(
    server: EnterpriseServer,
    scenario: EnterpriseScenario
  ): number {
    const baseProcessMap = {
      web: 180,
      database: 120,
      api: 150,
      cache: 80,
      loadbalancer: 90,
      monitoring: 200,
    };
    const baseProcess = baseProcessMap[server.type] || 120;
    const scenarioChange =
      scenario === 'service_failure' ? 50 : scenario === 'peak_load' ? 30 : 0;

    return Math.max(
      50,
      baseProcess + scenarioChange + this.getRandomVariation(20)
    );
  }

  private generateFileDescriptorUsage(
    server: EnterpriseServer,
    scenario: EnterpriseScenario,
    multiplier: number
  ): number {
    const baseFDMap = {
      web: 55,
      database: 70,
      api: 60,
      cache: 45,
      loadbalancer: 80,
      monitoring: 50,
    };
    const baseFD = baseFDMap[server.type] || 55;
    const scenarioIncrease =
      scenario === 'peak_load'
        ? 20
        : scenario === 'network_congestion'
          ? 15
          : 0;

    return Math.max(
      20,
      Math.min(
        98,
        baseFD * multiplier + scenarioIncrease + this.getRandomVariation(8)
      )
    );
  }

  private generateUptime(server: EnterpriseServer): number {
    const baseDays = 15 + Math.random() * 60;
    return Math.round(baseDays * 24 * 3600);
  }

  private generateSecurityEvents(
    server: EnterpriseServer,
    scenario: EnterpriseScenario
  ): number {
    const baseSecurityMap = {
      web: 3,
      database: 1,
      api: 5,
      cache: 0,
      loadbalancer: 8,
      monitoring: 2,
    };
    const baseSecurity = baseSecurityMap[server.type] || 2;
    const scenarioIncrease = scenario === 'service_failure' ? 10 : 0;

    return Math.max(
      0,
      baseSecurity + scenarioIncrease + Math.floor(Math.random() * 5)
    );
  }

  private generateLogErrors(
    server: EnterpriseServer,
    scenario: EnterpriseScenario
  ): number {
    const baseErrorMap = {
      web: 8,
      database: 3,
      api: 12,
      cache: 1,
      loadbalancer: 15,
      monitoring: 5,
    };
    const baseError = baseErrorMap[server.type] || 5;
    const scenarioIncrease =
      scenario === 'service_failure' ? 25 : scenario === 'peak_load' ? 10 : 0;

    return Math.max(
      0,
      baseError + scenarioIncrease + Math.floor(Math.random() * 8)
    );
  }

  private generateServiceHealthScore(
    server: EnterpriseServer,
    scenario: EnterpriseScenario
  ): number {
    const baseHealthMap = {
      web: 92,
      database: 95,
      api: 88,
      cache: 96,
      loadbalancer: 90,
      monitoring: 93,
    };
    const baseHealth = baseHealthMap[server.type] || 90;
    const scenarioDecrease =
      scenario === 'service_failure' ? 40 : scenario === 'peak_load' ? 15 : 0;

    return Math.max(
      30,
      Math.min(100, baseHealth - scenarioDecrease + this.getRandomVariation(5))
    );
  }

  private generateMemoryLeakIndicator(
    server: EnterpriseServer,
    scenario: EnterpriseScenario,
    timeInScenario: number
  ): number {
    if (scenario !== 'memory_leak') {
      return Math.max(0, this.getRandomVariation(2));
    }

    const timeHours = timeInScenario / (1000 * 60 * 60);
    return Math.max(0, timeHours * 15 + this.getRandomVariation(5));
  }

  // 🔧 유틸리티 함수들
  private getBaseCPUForServerType(serverType: string): number {
    const cpuMap = {
      web: 35,
      database: 45,
      api: 30,
      cache: 25,
      loadbalancer: 15,
      monitoring: 40,
    };
    return cpuMap[serverType] || 30;
  }

  private getRandomVariation(maxVariation: number): number {
    return (Math.random() - 0.5) * 2 * maxVariation;
  }

  // 📈 시나리오 관리
  private getOrUpdateScenario(serverId: string): EnterpriseScenario {
    const currentScenario = this.currentScenarios.get(serverId);

    if (!currentScenario || this.shouldChangeScenario(serverId)) {
      const newScenario = selectRandomScenario();
      this.currentScenarios.set(serverId, newScenario);
      this.scenarioStartTimes.set(serverId, Date.now());
      return newScenario;
    }

    return currentScenario;
  }

  private shouldChangeScenario(serverId: string): boolean {
    const startTime = this.scenarioStartTimes.get(serverId);
    if (!startTime) return true;

    const elapsed = Date.now() - startTime;
    const scenario = this.currentScenarios.get(serverId);

    const maxDurations = {
      normal_operation: 240,
      peak_load: 120,
      memory_leak: 180,
      disk_saturation: 45,
      network_congestion: 30,
      service_failure: 15,
    };

    const maxDuration =
      maxDurations[scenario || 'normal_operation'] * 60 * 1000;
    return elapsed > maxDuration;
  }

  private getTimeInScenario(serverId: string): number {
    const startTime = this.scenarioStartTimes.get(serverId);
    return startTime ? Date.now() - startTime : 0;
  }

  private getScenarioDuration(serverId: string): number {
    return Math.round(this.getTimeInScenario(serverId) / (1000 * 60));
  }

  // 📊 히스토리 관리
  private saveToHistory(serverId: string, dataPoint: MetricDataPoint): void {
    if (!this.historicalData.has(serverId)) {
      this.historicalData.set(serverId, []);
    }

    const history = this.historicalData.get(serverId)!;
    history.push(dataPoint);

    const maxPoints = 144; // 24시간, 10분 간격
    if (history.length > maxPoints) {
      history.splice(0, history.length - maxPoints);
    }
  }

  private initializeServers(): void {
    for (const server of ENTERPRISE_SERVERS) {
      this.currentScenarios.set(server.id, 'normal_operation');
      this.scenarioStartTimes.set(server.id, Date.now());
      this.historicalData.set(server.id, []);
    }
  }

  // 🔍 공개 API
  public getServerById(serverId: string): EnterpriseServer | undefined {
    return ENTERPRISE_SERVERS.find(s => s.id === serverId);
  }

  public getHistoricalData(
    serverId: string,
    hours: number = 24
  ): MetricDataPoint[] {
    const history = this.historicalData.get(serverId) || [];
    const cutoffTime = Date.now() - hours * 60 * 60 * 1000;

    return history.filter(
      point => new Date(point.timestamp).getTime() >= cutoffTime
    );
  }

  public getCurrentScenario(serverId: string): EnterpriseScenario {
    return this.currentScenarios.get(serverId) || 'normal_operation';
  }

  public getAllServers(): EnterpriseServer[] {
    return [...ENTERPRISE_SERVERS];
  }

  public getServersByType(type: string): EnterpriseServer[] {
    return ENTERPRISE_SERVERS.filter(server => server.type === type);
  }

  public enable(): void {
    this.isEnabled = true;
  }

  public disable(): void {
    this.isEnabled = false;
  }

  public isActive(): boolean {
    return this.isEnabled;
  }

  public getStatus() {
    return {
      enabled: this.isEnabled,
      serverCount: ENTERPRISE_SERVERS.length,
      lastUpdate: new Date(this.lastUpdate).toISOString(),
      activeScenarios: Object.fromEntries(this.currentScenarios),
      historySizeKB: Math.round(
        JSON.stringify([...this.historicalData.values()]).length / 1024
      ),
    };
  }
}
