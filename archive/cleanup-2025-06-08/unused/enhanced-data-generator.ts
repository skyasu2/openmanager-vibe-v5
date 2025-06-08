/**
 * 🚀 Enhanced Data Generator v2.0
 * 
 * faker.js 기반 현실적 테스트 데이터 생성기
 * - 기존 여러 생성기 통합 (generateDummyData, RealisticDataGenerator 등)
 * - 5가지 시나리오 지원: normal, stress, failure, spike, maintenance
 * - 시간 패턴 및 지역별 특성 반영
 * - 네트워크 토폴로지 생성 지원
 */

import { faker } from '@faker-js/faker';

// 🎯 메인 인터페이스
export interface EnhancedServerMetrics {
  serverId: string;
  serverName: string;
  hostname: string;
  location: string;
  region: string;
  provider: 'aws' | 'azure' | 'gcp' | 'on-premise';
  type: 'web' | 'database' | 'cache' | 'worker' | 'proxy' | 'api';
  environment: 'production' | 'staging' | 'development';
  
  // 시스템 메트릭
  metrics: {
    cpu: number;
    memory: number;
    disk: number;
    swap: number;
    load: {
      load1: number;
      load5: number;
      load15: number;
    };
  };
  
  // 네트워크 메트릭
  network: {
    bytesIn: number;
    bytesOut: number;
    packetsIn: number;
    packetsOut: number;
    latency: number;
    bandwidth: number;
  };
  
  // 애플리케이션 메트릭
  application: {
    responseTime: number;
    throughput: number;
    errorRate: number;
    activeConnections: number;
    queueLength: number;
  };
  
  // 상태 정보
  status: 'healthy' | 'warning' | 'critical' | 'maintenance' | 'offline';
  uptime: number;
  lastHealthCheck: string;
  timestamp: string;
  
  // 시나리오별 추가 정보
  scenario?: {
    type: ScenarioType;
    severity: number;
    duration: number;
    affectedComponents: string[];
  };
}

export interface NetworkNode {
  id: string;
  name: string;
  type: 'server' | 'database' | 'cache' | 'proxy' | 'loadbalancer' | 'firewall';
  location: string;
  coordinates: { x: number; y: number };
  status: 'online' | 'warning' | 'offline';
  connections: string[];
  metrics: {
    throughput: number;
    latency: number;
    packetLoss: number;
  };
}

export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL';
  source: string;
  service: string;
  message: string;
  category: 'system' | 'security' | 'performance' | 'network' | 'application' | 'database';
  severity: number; // 1-10
  metadata: {
    userId?: string;
    sessionId?: string;
    requestId?: string;
    ip?: string;
    userAgent?: string;
    errorCode?: string;
    stackTrace?: string;
    [key: string]: any;
  };
}

export type ScenarioType = 'normal' | 'stress' | 'failure' | 'spike' | 'maintenance' | 'ddos' | 'memory_leak';

export class EnhancedDataGenerator {
  private currentScenario: ScenarioType = 'normal';
  private timePattern: 'peak' | 'normal' | 'low' = 'normal';
  private regionConfig: RegionConfig;
  
  constructor(region: string = 'seoul') {
    this.regionConfig = this.getRegionConfig(region);
    faker.setDefaultRefDate(new Date()); // setLocale 대신 사용
  }
  
  /**
   * 🎭 시나리오 설정
   */
  setScenario(scenario: ScenarioType): void {
    this.currentScenario = scenario;
  }
  
  /**
   * ⏰ 시간 패턴 설정
   */
  setTimePattern(pattern: 'peak' | 'normal' | 'low'): void {
    this.timePattern = pattern;
  }
  
  /**
   * 🏗️ 현실적 서버 메트릭 생성 (메인 메서드)
   */
  generateRealisticServerMetrics(count: number = 1, scenario?: ScenarioType): EnhancedServerMetrics[] {
    const targetScenario = scenario || this.currentScenario;
    
    return Array.from({ length: count }, (_, index) => {
      const serverId = faker.string.uuid();
      const serverType = faker.helpers.arrayElement(['web', 'database', 'cache', 'worker', 'proxy', 'api'] as const);
      const provider = faker.helpers.arrayElement(['aws', 'azure', 'gcp', 'on-premise'] as const);
      const environment = faker.helpers.weightedArrayElement([
        { weight: 60, value: 'production' },
        { weight: 25, value: 'staging' },
        { weight: 15, value: 'development' }
      ] as const);
      
      // 시나리오별 메트릭 생성
      const baseMetrics = this.generateScenarioMetrics(targetScenario, serverType, environment);
      const networkMetrics = this.generateNetworkMetrics(targetScenario, provider);
      const appMetrics = this.generateApplicationMetrics(targetScenario, serverType);
      
      return {
        serverId,
        serverName: this.generateServerName(serverType, provider, index),
        hostname: faker.internet.domainName(),
        location: this.regionConfig.cities[Math.floor(Math.random() * this.regionConfig.cities.length)],
        region: this.regionConfig.name,
        provider,
        type: serverType,
        environment,
        
        metrics: baseMetrics,
        network: networkMetrics,
        application: appMetrics,
        
        status: this.determineServerStatus(baseMetrics, appMetrics),
        uptime: faker.number.int({ min: 3600, max: 31536000 }), // 1시간 ~ 1년
        lastHealthCheck: faker.date.recent({ days: 0.1 }).toISOString(),
        timestamp: new Date().toISOString(),
        
        scenario: targetScenario !== 'normal' ? {
          type: targetScenario,
          severity: faker.number.float({ min: 0.1, max: 1.0 }),
          duration: faker.number.int({ min: 300, max: 7200 }), // 5분 ~ 2시간
          affectedComponents: this.generateAffectedComponents(serverType)
        } : undefined
      };
    });
  }
  
  /**
   * 🎲 시나리오별 기본 메트릭 생성
   */
  private generateScenarioMetrics(scenario: ScenarioType, serverType: string, environment: string): {
    cpu: number;
    memory: number;
    disk: number;
    swap: number;
    load: {
      load1: number;
      load5: number;
      load15: number;
    };
  } {
    const baseMultiplier = environment === 'production' ? 1.2 : environment === 'staging' ? 0.8 : 0.5;
    
    switch (scenario) {
      case 'normal':
        return {
          cpu: faker.number.float({ min: 10, max: 40 }) * baseMultiplier,
          memory: faker.number.float({ min: 20, max: 60 }) * baseMultiplier,
          disk: faker.number.float({ min: 15, max: 50 }),
          swap: faker.number.float({ min: 0, max: 10 }),
          load: {
            load1: faker.number.float({ min: 0.5, max: 2.0 }),
            load5: faker.number.float({ min: 0.7, max: 2.5 }),
            load15: faker.number.float({ min: 0.9, max: 3.0 })
          }
        };
        
      case 'stress':
        return {
          cpu: faker.number.float({ min: 70, max: 95 }) * baseMultiplier,
          memory: faker.number.float({ min: 80, max: 95 }) * baseMultiplier,
          disk: faker.number.float({ min: 60, max: 85 }),
          swap: faker.number.float({ min: 10, max: 30 }),
          load: {
            load1: faker.number.float({ min: 4.0, max: 8.0 }),
            load5: faker.number.float({ min: 5.0, max: 10.0 }),
            load15: faker.number.float({ min: 6.0, max: 12.0 })
          }
        };
        
      case 'failure':
        return {
          cpu: faker.number.float({ min: 95, max: 100 }) * baseMultiplier,
          memory: faker.number.float({ min: 95, max: 100 }) * baseMultiplier,
          disk: faker.number.float({ min: 90, max: 100 }),
          swap: faker.number.float({ min: 50, max: 100 }),
          load: {
            load1: faker.number.float({ min: 10.0, max: 20.0 }),
            load5: faker.number.float({ min: 15.0, max: 25.0 }),
            load15: faker.number.float({ min: 20.0, max: 30.0 })
          }
        };
        
      case 'spike':
        const spikeIntensity = faker.number.float({ min: 0.5, max: 1.0 });
        return {
          cpu: faker.number.float({ min: 30, max: 90 }) * (1 + spikeIntensity),
          memory: faker.number.float({ min: 40, max: 80 }) * (1 + spikeIntensity * 0.7),
          disk: faker.number.float({ min: 20, max: 60 }),
          swap: faker.number.float({ min: 5, max: 20 }),
          load: {
            load1: faker.number.float({ min: 2.0, max: 6.0 }) * (1 + spikeIntensity),
            load5: faker.number.float({ min: 3.0, max: 7.0 }) * (1 + spikeIntensity),
            load15: faker.number.float({ min: 4.0, max: 8.0 }) * (1 + spikeIntensity)
          }
        };
        
      case 'maintenance':
        return {
          cpu: faker.number.float({ min: 5, max: 20 }),
          memory: faker.number.float({ min: 10, max: 30 }),
          disk: faker.number.float({ min: 15, max: 40 }),
          swap: faker.number.float({ min: 0, max: 5 }),
          load: {
            load1: faker.number.float({ min: 0.1, max: 0.5 }),
            load5: faker.number.float({ min: 0.2, max: 0.7 }),
            load15: faker.number.float({ min: 0.3, max: 0.9 })
          }
        };
        
      case 'memory_leak':
        const leakProgress = faker.number.float({ min: 0.0, max: 1.0 });
        return {
          cpu: faker.number.float({ min: 40, max: 70 }) * (1 + leakProgress * 0.5),
          memory: faker.number.float({ min: 60, max: 95 }) * (1 + leakProgress),
          disk: faker.number.float({ min: 20, max: 50 }),
          swap: faker.number.float({ min: 20, max: 60 }) * (1 + leakProgress),
          load: {
            load1: faker.number.float({ min: 2.0, max: 5.0 }) * (1 + leakProgress),
            load5: faker.number.float({ min: 3.0, max: 6.0 }) * (1 + leakProgress),
            load15: faker.number.float({ min: 4.0, max: 7.0 }) * (1 + leakProgress)
          }
        };
        
      default:
        return this.generateScenarioMetrics('normal', serverType, environment);
    }
  }
  
  /**
   * 🌐 네트워크 메트릭 생성
   */
  private generateNetworkMetrics(scenario: ScenarioType, provider: string) {
    const providerMultiplier = {
      'aws': 1.2,
      'azure': 1.1,
      'gcp': 1.15,
      'on-premise': 0.8
    }[provider] || 1.0;
    
    const baseLatency = provider === 'on-premise' ? 
      faker.number.float({ min: 1, max: 10 }) : 
      faker.number.float({ min: 5, max: 50 });
    
    let networkMultiplier = 1;
    if (scenario === 'spike' || scenario === 'ddos') {
      networkMultiplier = faker.number.float({ min: 3, max: 10 });
    } else if (scenario === 'failure') {
      networkMultiplier = faker.number.float({ min: 0.1, max: 0.3 });
    }
    
    return {
      bytesIn: faker.number.int({ min: 1000000, max: 100000000 }) * networkMultiplier * providerMultiplier,
      bytesOut: faker.number.int({ min: 500000, max: 50000000 }) * networkMultiplier * providerMultiplier,
      packetsIn: faker.number.int({ min: 1000, max: 100000 }) * networkMultiplier,
      packetsOut: faker.number.int({ min: 800, max: 80000 }) * networkMultiplier,
      latency: baseLatency * (scenario === 'failure' ? faker.number.float({ min: 5, max: 20 }) : 1),
      bandwidth: faker.number.int({ min: 100, max: 10000 }) * providerMultiplier // Mbps
    };
  }
  
  /**
   * 📱 애플리케이션 메트릭 생성
   */
  private generateApplicationMetrics(scenario: ScenarioType, serverType: string) {
    const typeConfig = {
      'web': { responseTime: [50, 200], throughput: [100, 1000], connections: [50, 500] },
      'database': { responseTime: [10, 100], throughput: [500, 5000], connections: [10, 100] },
      'cache': { responseTime: [1, 10], throughput: [1000, 10000], connections: [100, 1000] },
      'api': { responseTime: [30, 150], throughput: [200, 2000], connections: [50, 500] },
      'worker': { responseTime: [100, 500], throughput: [50, 500], connections: [5, 50] },
      'proxy': { responseTime: [20, 80], throughput: [500, 5000], connections: [100, 1000] }
    }[serverType] || { responseTime: [50, 200], throughput: [100, 1000], connections: [50, 500] };
    
    let multiplier = 1;
    let errorMultiplier = 1;
    
    switch (scenario) {
      case 'stress':
        multiplier = faker.number.float({ min: 2, max: 5 });
        errorMultiplier = faker.number.float({ min: 3, max: 8 });
        break;
      case 'failure':
        multiplier = faker.number.float({ min: 10, max: 50 });
        errorMultiplier = faker.number.float({ min: 20, max: 100 });
        break;
      case 'spike':
        multiplier = faker.number.float({ min: 1.5, max: 3 });
        errorMultiplier = faker.number.float({ min: 2, max: 5 });
        break;
      case 'maintenance':
        multiplier = faker.number.float({ min: 0.1, max: 0.3 });
        errorMultiplier = faker.number.float({ min: 0.1, max: 0.5 });
        break;
    }
    
    return {
      responseTime: faker.number.float({ 
        min: typeConfig.responseTime[0], 
        max: typeConfig.responseTime[1] 
      }) * multiplier,
      throughput: faker.number.float({ 
        min: typeConfig.throughput[0], 
        max: typeConfig.throughput[1] 
      }) * (2 - multiplier), // 응답시간이 길수록 처리량 감소
      errorRate: faker.number.float({ min: 0.01, max: 0.5 }) * errorMultiplier,
      activeConnections: faker.number.int({ 
        min: typeConfig.connections[0], 
        max: typeConfig.connections[1] 
      }) * Math.sqrt(multiplier),
      queueLength: faker.number.int({ min: 0, max: 100 }) * multiplier
    };
  }
  
  /**
   * 🎯 서버 이름 생성
   */
  private generateServerName(type: string, provider: string, index: number): string {
    const prefixes = {
      'web': ['웹서버', 'Frontend', 'Nginx', 'Apache'],
      'database': ['DB서버', 'MySQL', 'PostgreSQL', 'MongoDB'],
      'cache': ['Redis', 'Memcached', '캐시서버'],
      'api': ['API서버', 'Gateway', 'Backend'],
      'worker': ['워커', 'Job', 'Queue'],
      'proxy': ['프록시', 'LB', 'HAProxy']
    };
    
    const prefix = faker.helpers.arrayElement(prefixes[type as keyof typeof prefixes] || ['서버']);
    const suffix = String(index + 1).padStart(2, '0');
    const providerSuffix = provider.toUpperCase();
    
    return `${prefix}-${suffix}-${providerSuffix}`;
  }
  
  /**
   * 🚦 서버 상태 결정
   */
  private determineServerStatus(metrics: any, appMetrics: any): 'healthy' | 'warning' | 'critical' | 'maintenance' | 'offline' {
    if (this.currentScenario === 'maintenance') return 'maintenance';
    if (this.currentScenario === 'failure') return Math.random() > 0.3 ? 'critical' : 'offline';
    
    const score = (
      (metrics.cpu > 90 ? 3 : metrics.cpu > 70 ? 2 : metrics.cpu > 50 ? 1 : 0) +
      (metrics.memory > 90 ? 3 : metrics.memory > 80 ? 2 : metrics.memory > 60 ? 1 : 0) +
      (appMetrics.errorRate > 5 ? 3 : appMetrics.errorRate > 1 ? 2 : appMetrics.errorRate > 0.1 ? 1 : 0) +
      (appMetrics.responseTime > 1000 ? 3 : appMetrics.responseTime > 500 ? 2 : appMetrics.responseTime > 200 ? 1 : 0)
    );
    
    if (score >= 8) return 'critical';
    if (score >= 4) return 'warning';
    return 'healthy';
  }
  
  /**
   * 🔗 네트워크 토폴로지 생성
   */
  generateNetworkTopology(nodeCount: number = 10): { nodes: NetworkNode[], connections: any[] } {
    const nodes: NetworkNode[] = Array.from({ length: nodeCount }, (_, i) => ({
      id: faker.string.uuid(),
      name: faker.internet.domainName(),
      type: faker.helpers.arrayElement(['server', 'database', 'cache', 'proxy', 'loadbalancer', 'firewall']),
      location: this.regionConfig.cities[Math.floor(Math.random() * this.regionConfig.cities.length)],
      coordinates: {
        x: faker.number.float({ min: 0, max: 800 }),
        y: faker.number.float({ min: 0, max: 600 })
      },
      status: faker.helpers.weightedArrayElement([
        { weight: 70, value: 'online' },
        { weight: 20, value: 'warning' },
        { weight: 10, value: 'offline' }
      ]) as 'online' | 'warning' | 'offline',
      connections: [],
      metrics: {
        throughput: faker.number.float({ min: 100, max: 10000 }),
        latency: faker.number.float({ min: 1, max: 100 }),
        packetLoss: faker.number.float({ min: 0, max: 5 })
      }
    }));
    
    // 연결 관계 생성
    const connections = this.generateConnections(nodes);
    
    // 노드에 연결 정보 추가
    connections.forEach(conn => {
      const sourceNode = nodes.find(n => n.id === conn.source);
      const targetNode = nodes.find(n => n.id === conn.target);
      if (sourceNode && targetNode) {
        sourceNode.connections.push(targetNode.id);
        targetNode.connections.push(sourceNode.id);
      }
    });
    
    return { nodes, connections };
  }
  
  /**
   * 🔗 노드 간 연결 생성
   */
  private generateConnections(nodes: NetworkNode[]) {
    const connections = [];
    const connectionsPerNode = faker.number.int({ min: 2, max: 5 });
    
    for (let i = 0; i < nodes.length; i++) {
      const connectionCount = Math.min(connectionsPerNode, nodes.length - 1);
      const connectedIndices = new Set<number>();
      connectedIndices.add(i); // 자기 자신 제외
      
      for (let j = 0; j < connectionCount; j++) {
        let targetIndex;
        do {
          targetIndex = faker.number.int({ min: 0, max: nodes.length - 1 });
        } while (connectedIndices.has(targetIndex));
        
        connectedIndices.add(targetIndex);
        
        connections.push({
          id: faker.string.uuid(),
          source: nodes[i].id,
          target: nodes[targetIndex].id,
          bandwidth: faker.number.int({ min: 100, max: 10000 }),
          latency: faker.number.float({ min: 1, max: 50 }),
          status: faker.helpers.arrayElement(['active', 'degraded', 'down']),
          traffic: faker.number.float({ min: 0.1, max: 1.0 }) // 0.1 = 10% 사용률
        });
      }
    }
    
    return connections;
  }
  
  /**
   * 📋 현실적 로그 엔트리 생성
   */
  generateLogEntries(count: number = 50, scenario?: ScenarioType): LogEntry[] {
    const targetScenario = scenario || this.currentScenario;
    
    return Array.from({ length: count }, () => {
      const level = this.getLogLevel(targetScenario);
      const category = faker.helpers.arrayElement(['system', 'security', 'performance', 'network', 'application', 'database']);
      
      return {
        id: faker.string.uuid(),
        timestamp: faker.date.recent({ days: 1 }).toISOString(),
        level,
        source: faker.internet.domainName(),
        service: faker.helpers.arrayElement(['nginx', 'mysql', 'redis', 'api-gateway', 'auth-service', 'payment-service']),
        message: this.generateLogMessage(level, category, targetScenario),
        category,
        severity: this.calculateLogSeverity(level, category),
        metadata: this.generateLogMetadata(level, category)
      };
    }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }
  
  /**
   * 📈 시계열 메트릭 데이터 생성
   */
  generateTimeSeriesMetrics(
    serverId: string, 
    hours: number = 24, 
    intervalMinutes: number = 5
  ): Array<EnhancedServerMetrics & { timestamp: string }> {
    const dataPoints = (hours * 60) / intervalMinutes;
    const baseMetrics = this.generateRealisticServerMetrics(1)[0];
    const timeSeries = [];
    
    for (let i = 0; i < dataPoints; i++) {
      const timestamp = new Date(Date.now() - (dataPoints - i) * intervalMinutes * 60000);
      
      // 시간대별 패턴 적용
      const timePattern = this.getTimePattern(timestamp);
      const variance = this.generateTimeVariance(i, dataPoints);
      
      const adjustedMetrics = {
        ...baseMetrics,
        serverId,
        timestamp: timestamp.toISOString(),
        metrics: {
          cpu: Math.max(0, Math.min(100, baseMetrics.metrics.cpu * timePattern.cpu * variance.cpu)),
          memory: Math.max(0, Math.min(100, baseMetrics.metrics.memory * timePattern.memory * variance.memory)),
          disk: Math.max(0, Math.min(100, baseMetrics.metrics.disk * timePattern.disk * variance.disk)),
          swap: Math.max(0, Math.min(100, baseMetrics.metrics.swap * timePattern.memory * variance.memory)),
          load: {
            load1: Math.max(0, baseMetrics.metrics.load.load1 * timePattern.cpu * variance.cpu),
            load5: Math.max(0, baseMetrics.metrics.load.load5 * timePattern.cpu * variance.cpu),
            load15: Math.max(0, baseMetrics.metrics.load.load15 * timePattern.cpu * variance.cpu)
          }
        },
        network: {
          ...baseMetrics.network,
          bytesIn: Math.max(0, baseMetrics.network.bytesIn * timePattern.network * variance.network),
          bytesOut: Math.max(0, baseMetrics.network.bytesOut * timePattern.network * variance.network)
        },
        application: {
          ...baseMetrics.application,
          responseTime: Math.max(10, baseMetrics.application.responseTime * timePattern.response * variance.response),
          throughput: Math.max(1, baseMetrics.application.throughput * timePattern.network * variance.network),
          activeConnections: Math.max(0, baseMetrics.application.activeConnections * timePattern.network * variance.network)
        }
      };
      
      timeSeries.push(adjustedMetrics);
    }
    
    return timeSeries;
  }
  
  // === 헬퍼 메서드들 ===
  
  private getRegionConfig(region: string): RegionConfig {
    const configs: Record<string, RegionConfig> = {
      'seoul': {
        name: '서울',
        cities: ['강남구', '서초구', '송파구', '마포구', '용산구', '중구'],
        timezone: 'Asia/Seoul',
        latency: { min: 1, max: 10 }
      },
      'tokyo': {
        name: '도쿄',
        cities: ['시부야', '신주쿠', '하라주쿠', '긴자', '아키하바라', '우에노'],
        timezone: 'Asia/Tokyo',
        latency: { min: 20, max: 40 }
      },
      'singapore': {
        name: '싱가포르',
        cities: ['Marina Bay', 'Orchard', 'Chinatown', 'Little India', 'Clarke Quay'],
        timezone: 'Asia/Singapore',
        latency: { min: 50, max: 80 }
      }
    };
    
    return configs[region] || configs['seoul'];
  }
  
  private generateAffectedComponents(serverType: string): string[] {
    const components: Record<string, string[]> = {
      'web': ['nginx', 'apache', 'ssl-cert', 'static-files'],
      'database': ['mysql', 'postgresql', 'backup', 'replication'],
      'cache': ['redis', 'memcached', 'session-store'],
      'api': ['gateway', 'auth', 'rate-limiter', 'load-balancer'],
      'worker': ['job-queue', 'background-tasks', 'scheduler'],
      'proxy': ['load-balancer', 'ssl-termination', 'reverse-proxy']
    };
    
    const available = components[serverType] || ['system', 'network'];
    const count = faker.number.int({ min: 1, max: Math.min(3, available.length) });
    
    return faker.helpers.arrayElements(available, count);
  }
  
  private getLogLevel(scenario: ScenarioType): LogEntry['level'] {
    const weights: Record<ScenarioType, Array<{ weight: number; value: LogEntry['level'] }>> = {
      'normal': [
        { weight: 50, value: 'INFO' },
        { weight: 30, value: 'DEBUG' },
        { weight: 15, value: 'WARN' },
        { weight: 4, value: 'ERROR' },
        { weight: 1, value: 'CRITICAL' }
      ],
      'stress': [
        { weight: 20, value: 'INFO' },
        { weight: 15, value: 'DEBUG' },
        { weight: 40, value: 'WARN' },
        { weight: 20, value: 'ERROR' },
        { weight: 5, value: 'CRITICAL' }
      ],
      'failure': [
        { weight: 5, value: 'INFO' },
        { weight: 5, value: 'DEBUG' },
        { weight: 20, value: 'WARN' },
        { weight: 40, value: 'ERROR' },
        { weight: 30, value: 'CRITICAL' }
      ],
      'spike': [
        { weight: 25, value: 'INFO' },
        { weight: 20, value: 'DEBUG' },
        { weight: 35, value: 'WARN' },
        { weight: 15, value: 'ERROR' },
        { weight: 5, value: 'CRITICAL' }
      ],
      'maintenance': [
        { weight: 70, value: 'INFO' },
        { weight: 20, value: 'DEBUG' },
        { weight: 8, value: 'WARN' },
        { weight: 2, value: 'ERROR' },
        { weight: 0, value: 'CRITICAL' }
      ],
      'ddos': [
        { weight: 10, value: 'INFO' },
        { weight: 5, value: 'DEBUG' },
        { weight: 30, value: 'WARN' },
        { weight: 35, value: 'ERROR' },
        { weight: 20, value: 'CRITICAL' }
      ],
      'memory_leak': [
        { weight: 20, value: 'INFO' },
        { weight: 10, value: 'DEBUG' },
        { weight: 40, value: 'WARN' },
        { weight: 25, value: 'ERROR' },
        { weight: 5, value: 'CRITICAL' }
      ]
    };
    
    return faker.helpers.weightedArrayElement(weights[scenario]);
  }
  
  private generateLogMessage(level: LogEntry['level'], category: string, scenario: ScenarioType): string {
    const templates: Record<string, Record<string, string[]>> = {
      'normal': {
        'system': [
          '시스템 정상 작동 중',
          '정기 헬스체크 완료',
          '백업 작업 성공적으로 완료',
          '디스크 정리 작업 완료'
        ],
        'performance': [
          '응답시간 정상 범위 내',
          '메모리 사용률 안정적',
          'CPU 사용률 정상'
        ]
      },
      'failure': {
        'system': [
          '시스템 오류 발생',
          '서비스 연결 실패',
          '데이터베이스 연결 끊어짐',
          '메모리 부족 오류'
        ],
        'network': [
          '네트워크 연결 시간 초과',
          'DNS 해석 실패',
          '패킷 손실 발생'
        ]
      }
    };
    
    const scenarioTemplates = templates[scenario] || templates['normal'];
    const categoryTemplates = scenarioTemplates[category] || scenarioTemplates['system'] || ['일반 로그 메시지'];
    
    return faker.helpers.arrayElement(categoryTemplates);
  }
  
  private calculateLogSeverity(level: LogEntry['level'], category: string): number {
    const baseSeverity = {
      'DEBUG': 1,
      'INFO': 2,
      'WARN': 5,
      'ERROR': 7,
      'CRITICAL': 9
    }[level];
    
    const categoryMultiplier = {
      'security': 1.5,
      'system': 1.3,
      'database': 1.2,
      'performance': 1.1,
      'network': 1.0,
      'application': 0.9
    }[category] || 1.0;
    
    return Math.min(10, Math.round(baseSeverity * categoryMultiplier));
  }
  
  private generateLogMetadata(level: LogEntry['level'], category: string): LogEntry['metadata'] {
    const metadata: LogEntry['metadata'] = {
      requestId: `req_${Date.now()}_${faker.string.alphanumeric(8)}`,
      sessionId: faker.string.uuid(),
      threadId: faker.number.int({ min: 1, max: 100 })
    };
    
    if (category === 'security') {
      metadata.ip = faker.internet.ip();
      metadata.userAgent = faker.internet.userAgent();
    }
    
    if (level === 'ERROR' || level === 'CRITICAL') {
      metadata.errorCode = `E${faker.number.int({ min: 1000, max: 9999 })}`;
      metadata.stackTrace = `at ${faker.hacker.noun()}.${faker.hacker.verb()}(${faker.system.fileName()}.java:${faker.number.int({ min: 1, max: 500 })})`;
    }
    
    if (category === 'performance') {
      metadata.responseTime = faker.number.int({ min: 50, max: 2000 });
      metadata.memoryUsage = faker.number.int({ min: 100, max: 2000 });
    }
    
    return metadata;
  }
  
  private getTimePattern(timestamp: Date) {
    const hour = timestamp.getHours();
    
    // 피크 시간 (09-18시), 일반 시간, 저사용 시간 (02-06시)
    if (hour >= 9 && hour <= 18) {
      return { cpu: 1.3, memory: 1.2, network: 1.5, response: 1.4, disk: 1.1 };
    } else if (hour >= 2 && hour <= 6) {
      return { cpu: 0.4, memory: 0.6, network: 0.3, response: 0.7, disk: 0.8 };
    } else {
      return { cpu: 0.8, memory: 0.9, network: 0.7, response: 0.9, disk: 0.9 };
    }
  }
  
  private generateTimeVariance(index: number, total: number) {
    const progress = index / total;
    const noise = faker.number.float({ min: 0.8, max: 1.2 });
    
    // 시간에 따른 자연스러운 변화
    const trend = 1 + Math.sin(progress * Math.PI * 4) * 0.2; // 주기적 변화
    
    return {
      cpu: noise * trend,
      memory: noise * trend * 0.8,
      network: noise * trend * 1.2,
      response: noise * (2 - trend), // CPU 높을 때 응답시간도 높아짐
      disk: noise * 0.5 + 0.5 // 디스크는 상대적으로 안정적
    };
  }
}

// 타입 정의
interface RegionConfig {
  name: string;
  cities: string[];
  timezone: string;
  latency: { min: number; max: number };
}

// 팩토리 함수
export function createEnhancedDataGenerator(region?: string): EnhancedDataGenerator {
  return new EnhancedDataGenerator(region);
}

// 기본 인스턴스 (즉시 사용 가능)
export const enhancedDataGenerator = new EnhancedDataGenerator();

// 기존 호환성을 위한 래퍼 함수들
export function generateRealisticServerMetrics(
  count: number = 10, 
  scenario: ScenarioType = 'normal'
): EnhancedServerMetrics[] {
  enhancedDataGenerator.setScenario(scenario);
  return enhancedDataGenerator.generateRealisticServerMetrics(count);
}

export function generateNetworkTopology(nodeCount: number = 10) {
  return enhancedDataGenerator.generateNetworkTopology(nodeCount);
}

export function generateLogEntries(count: number = 50, scenario: ScenarioType = 'normal') {
  return enhancedDataGenerator.generateLogEntries(count, scenario);
}

export function generateTimeSeriesMetrics(
  serverId: string, 
  hours: number = 24, 
  intervalMinutes: number = 5
) {
  return enhancedDataGenerator.generateTimeSeriesMetrics(serverId, hours, intervalMinutes);
} 