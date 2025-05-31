/**
 * Server Data Factory
 * 
 * 🏭 중앙화된 서버 데이터 생성 및 관리
 * - 서버 생성 로직 통합
 * - 일관된 데이터 형식 보장
 * - 중복 코드 제거
 */

export interface BaseServerConfig {
  id: string;
  hostname: string;
  type: string;
  provider?: string;
  location?: string;
  environment?: string;
}

export interface ExtendedServerInfo {
  id: string;
  hostname: string;
  ipAddress: string;
  status: 'online' | 'warning' | 'critical' | 'offline';
  location: string;
  environment: string;
  provider: string;
  instanceType?: string;
  cluster?: string | null;
  zone?: string;
  tags: Record<string, string>;
  metrics: ServerMetrics;
  lastUpdate: Date;
  lastSeen: Date;
  alerts: ServerAlert[];
  services: ServiceInfo[];
}

export interface ServerMetrics {
  cpu: number;
  memory: number;
  disk: number;
  network: {
    bytesIn: number;
    bytesOut: number;
    latency: number;
    connections: number;
  };
  processes: number;
  loadAverage: [number, number, number];
  uptime: number;
  temperature: number;
  powerUsage: number;
}

export interface ServerAlert {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  type: string;
  message: string;
  timestamp: string;
  acknowledged: boolean;
  resolvedAt?: string;
}

export interface ServiceInfo {
  name: string;
  status: 'running' | 'stopped' | 'failed';
  port: number;
  pid: number;
  uptime: number;
  memoryUsage: number;
  cpuUsage: number;
}

export class ServerDataFactory {
  // 🏢 엔터프라이즈급 서버 템플릿 (현실적인 구성)
  private static readonly ENTERPRISE_SERVERS: BaseServerConfig[] = [
    // 프론트엔드 티어 (로드밸런서 + 웹서버)
    { id: 'lb-prod-01', hostname: 'lb-prod-seoul-01', type: 'loadbalancer', provider: 'onpremise', location: 'Seoul-IDC-1', environment: 'production' },
    { id: 'web-prod-01', hostname: 'web-prod-seoul-01', type: 'web', provider: 'onpremise', location: 'Seoul-IDC-1', environment: 'production' },
    { id: 'web-prod-02', hostname: 'web-prod-seoul-02', type: 'web', provider: 'onpremise', location: 'Seoul-IDC-1', environment: 'production' },
    { id: 'web-prod-03', hostname: 'web-prod-busan-01', type: 'web', provider: 'onpremise', location: 'Busan-IDC-1', environment: 'production' },
    
    // API 티어 (백엔드 서비스)
    { id: 'api-prod-01', hostname: 'api-prod-seoul-01', type: 'api', provider: 'aws', location: 'AWS-Seoul-1', environment: 'production' },
    { id: 'api-prod-02', hostname: 'api-prod-seoul-02', type: 'api', provider: 'aws', location: 'AWS-Seoul-1', environment: 'production' },
    { id: 'api-gateway-01', hostname: 'gateway-prod-seoul-01', type: 'gateway', provider: 'aws', location: 'AWS-Seoul-1', environment: 'production' },
    
    // 데이터베이스 티어 (Master-Slave 구성)
    { id: 'db-master-01', hostname: 'db-master-seoul-01', type: 'database', provider: 'onpremise', location: 'Seoul-IDC-1', environment: 'production' },
    { id: 'db-slave-01', hostname: 'db-slave-seoul-01', type: 'database', provider: 'onpremise', location: 'Seoul-IDC-1', environment: 'production' },
    { id: 'db-slave-02', hostname: 'db-slave-busan-01', type: 'database', provider: 'onpremise', location: 'Busan-IDC-1', environment: 'production' },
    
    // 캐시 & 메시지큐 티어
    { id: 'redis-cluster-01', hostname: 'redis-cluster-seoul-01', type: 'cache', provider: 'kubernetes', location: 'K8S-Seoul-1', environment: 'production' },
    { id: 'redis-cluster-02', hostname: 'redis-cluster-seoul-02', type: 'cache', provider: 'kubernetes', location: 'K8S-Seoul-1', environment: 'production' },
    { id: 'mq-prod-01', hostname: 'rabbitmq-prod-seoul-01', type: 'queue', provider: 'kubernetes', location: 'K8S-Seoul-1', environment: 'production' },
    
    // 모니터링 & 로깅 티어
    { id: 'monitor-01', hostname: 'prometheus-seoul-01', type: 'monitoring', provider: 'kubernetes', location: 'K8S-Seoul-1', environment: 'production' },
    { id: 'log-01', hostname: 'elasticsearch-seoul-01', type: 'logging', provider: 'kubernetes', location: 'K8S-Seoul-1', environment: 'production' },
    { id: 'grafana-01', hostname: 'grafana-seoul-01', type: 'dashboard', provider: 'kubernetes', location: 'K8S-Seoul-1', environment: 'production' },
    
    // CI/CD & 개발 환경
    { id: 'jenkins-01', hostname: 'jenkins-seoul-01', type: 'ci-cd', provider: 'aws', location: 'AWS-Seoul-1', environment: 'production' },
    { id: 'dev-api-01', hostname: 'api-dev-seoul-01', type: 'api', provider: 'aws', location: 'AWS-Seoul-1', environment: 'development' },
    { id: 'staging-web-01', hostname: 'web-staging-seoul-01', type: 'web', provider: 'aws', location: 'AWS-Seoul-1', environment: 'staging' },
    
    // 보안 & 백업
    { id: 'vault-01', hostname: 'vault-prod-seoul-01', type: 'security', provider: 'aws', location: 'AWS-Seoul-1', environment: 'production' },
    { id: 'backup-01', hostname: 'backup-storage-seoul-01', type: 'storage', provider: 'onpremise', location: 'Seoul-IDC-1', environment: 'production' }
  ];

  // 기존 호환성을 위한 기본 서버 (단순한 구성)
  private static readonly DEFAULT_SERVERS: BaseServerConfig[] = [
    { id: 'web-01', hostname: 'web-server-01', type: 'web' },
    { id: 'web-02', hostname: 'web-server-02', type: 'web' },
    { id: 'api-01', hostname: 'api-server-01', type: 'api' },
    { id: 'api-02', hostname: 'api-server-02', type: 'api' },
    { id: 'db-01', hostname: 'db-server-01', type: 'database' },
    { id: 'db-02', hostname: 'db-server-02', type: 'database' },
    { id: 'cache-01', hostname: 'redis-01', type: 'cache' },
    { id: 'queue-01', hostname: 'rabbitmq-01', type: 'queue' },
    { id: 'monitor-01', hostname: 'prometheus-01', type: 'monitoring' },
    { id: 'lb-01', hostname: 'nginx-lb-01', type: 'loadbalancer' }
  ];

  // 🌍 지역별 데이터센터 정보
  private static readonly DATACENTER_INFO = {
    'Seoul-IDC-1': { region: 'ap-northeast-2', zone: 'a', provider: 'onpremise', cost: 'high' },
    'Seoul-IDC-2': { region: 'ap-northeast-2', zone: 'b', provider: 'onpremise', cost: 'high' },
    'Busan-IDC-1': { region: 'ap-northeast-3', zone: 'a', provider: 'onpremise', cost: 'medium' },
    'AWS-Seoul-1': { region: 'ap-northeast-2', zone: 'auto', provider: 'aws', cost: 'variable' },
    'K8S-Seoul-1': { region: 'ap-northeast-2', zone: 'multi', provider: 'kubernetes', cost: 'optimized' }
  };

  // 🏷️ 서버 타입별 메타데이터
  private static readonly SERVER_METADATA = {
    web: { 
      category: 'frontend', 
      criticality: 'high', 
      scalable: true,
      defaultPorts: [80, 443],
      requiredServices: ['nginx', 'ssl-cert'],
      alertThresholds: { cpu: 80, memory: 85, disk: 90 }
    },
    api: { 
      category: 'backend', 
      criticality: 'high', 
      scalable: true,
      defaultPorts: [8080, 8443],
      requiredServices: ['app-server', 'health-check'],
      alertThresholds: { cpu: 75, memory: 80, disk: 85 }
    },
    database: { 
      category: 'data', 
      criticality: 'critical', 
      scalable: false,
      defaultPorts: [5432, 3306],
      requiredServices: ['postgres', 'backup-agent'],
      alertThresholds: { cpu: 70, memory: 85, disk: 80 }
    },
    cache: { 
      category: 'performance', 
      criticality: 'medium', 
      scalable: true,
      defaultPorts: [6379],
      requiredServices: ['redis', 'cluster-manager'],
      alertThresholds: { cpu: 85, memory: 90, disk: 95 }
    },
    loadbalancer: { 
      category: 'network', 
      criticality: 'critical', 
      scalable: false,
      defaultPorts: [80, 443, 8080],
      requiredServices: ['nginx', 'health-check', 'ssl-termination'],
      alertThresholds: { cpu: 80, memory: 85, disk: 90 }
    },
    monitoring: { 
      category: 'ops', 
      criticality: 'medium', 
      scalable: true,
      defaultPorts: [9090, 3000],
      requiredServices: ['prometheus', 'grafana', 'alertmanager'],
      alertThresholds: { cpu: 85, memory: 90, disk: 85 }
    },
    queue: { 
      category: 'messaging', 
      criticality: 'high', 
      scalable: true,
      defaultPorts: [5672, 15672],
      requiredServices: ['rabbitmq', 'cluster-coordinator'],
      alertThresholds: { cpu: 80, memory: 85, disk: 90 }
    },
    security: { 
      category: 'security', 
      criticality: 'critical', 
      scalable: false,
      defaultPorts: [8200],
      requiredServices: ['vault', 'audit-log'],
      alertThresholds: { cpu: 70, memory: 80, disk: 85 }
    },
    storage: { 
      category: 'storage', 
      criticality: 'high', 
      scalable: true,
      defaultPorts: [2049, 445],
      requiredServices: ['nfs', 'backup-scheduler'],
      alertThresholds: { cpu: 75, memory: 80, disk: 70 }
    },
    'ci-cd': { 
      category: 'development', 
      criticality: 'medium', 
      scalable: false,
      defaultPorts: [8080, 50000],
      requiredServices: ['jenkins', 'build-agent'],
      alertThresholds: { cpu: 85, memory: 90, disk: 80 }
    }
  };

  /**
   * 기본 서버 목록 생성 (DataGenerator용) - 기존 호환성
   */
  static generateBaseServerList(): BaseServerConfig[] {
    return [...this.DEFAULT_SERVERS];
  }

  /**
   * 🏢 엔터프라이즈급 서버 목록 생성 (현실적인 구성)
   */
  static generateEnterpriseServerList(): BaseServerConfig[] {
    console.log(`🏢 Generating ${this.ENTERPRISE_SERVERS.length} enterprise servers...`);
    return [...this.ENTERPRISE_SERVERS];
  }

  /**
   * 🌍 지역별 서버 생성
   */
  static generateServersByRegion(location: string, count: number = 5): ExtendedServerInfo[] {
    console.log(`🌍 Generating ${count} servers for location: ${location}`);
    
    const regionServers = this.ENTERPRISE_SERVERS.filter(server => 
      server.location === location
    ).slice(0, count);
    
    return regionServers.map(server => this.extendServerInfoWithMetadata(server));
  }

  /**
   * 🏷️ 서버 타입별 생성
   */
  static generateServersByType(type: string, count: number = 3): ExtendedServerInfo[] {
    console.log(`🏷️ Generating ${count} servers of type: ${type}`);
    
    const typeServers = this.ENTERPRISE_SERVERS
      .filter(server => server.type === type)
      .slice(0, count);
    
    // 부족한 경우 추가 생성
    const additionalServers = Array.from(
      { length: Math.max(0, count - typeServers.length) }, 
      (_, i) => ({
        id: `${type}-additional-${i + 1}`,
        hostname: `${type}-server-${String(i + typeServers.length + 1).padStart(2, '0')}`,
        type,
        provider: 'aws',
        location: 'AWS-Seoul-1',
        environment: 'production'
      })
    );
    
    return [...typeServers, ...additionalServers].map(server => 
      this.extendServerInfoWithMetadata(server)
    );
  }

  /**
   * 🎯 시나리오 기반 서버 생성 (부하 패턴별)
   */
  static generateScenarioServers(scenario: 'normal' | 'high-load' | 'maintenance' | 'disaster'): ExtendedServerInfo[] {
    console.log(`🎯 Generating servers for scenario: ${scenario}`);
    
    const baseServers = this.ENTERPRISE_SERVERS.map(server => 
      this.extendServerInfoWithMetadata(server)
    );
    
    // 시나리오별 상태 및 메트릭 조정
    return baseServers.map(server => {
      switch (scenario) {
        case 'high-load':
          return {
            ...server,
            status: Math.random() > 0.3 ? 'warning' : 'online',
            metrics: {
              ...server.metrics,
              cpu: 70 + Math.random() * 25, // 70-95%
              memory: 75 + Math.random() * 20, // 75-95%
              network: {
                ...server.metrics.network,
                latency: server.metrics.network.latency * (1.5 + Math.random()),
                connections: Math.floor(server.metrics.network.connections * (2 + Math.random()))
              }
            },
            alerts: this.generateAlertsForHighLoad(server)
          };
          
        case 'maintenance':
          return {
            ...server,
            status: Math.random() > 0.5 ? 'offline' : 'warning',
            metrics: {
              ...server.metrics,
              cpu: Math.random() * 30, // 0-30%
              memory: 20 + Math.random() * 40 // 20-60%
            },
            alerts: this.generateMaintenanceAlerts(server)
          };
          
        case 'disaster':
          return {
            ...server,
            status: Math.random() > 0.7 ? 'critical' : 'offline',
            metrics: {
              ...server.metrics,
              cpu: Math.random() > 0.5 ? 0 : 95 + Math.random() * 5,
              memory: Math.random() > 0.5 ? 0 : 90 + Math.random() * 10
            },
            alerts: this.generateDisasterAlerts(server)
          };
          
        default: // normal
          return server;
      }
    });
  }

  /**
   * Fallback 서버 생성 (API 응답용)
   */
  static generateFallbackServers(count: number = 10): ExtendedServerInfo[] {
    console.log(`🔄 Generating ${count} emergency fallback servers...`);
    
    return Array.from({ length: count }, (_, i) => {
      const baseServer = this.DEFAULT_SERVERS[i % this.DEFAULT_SERVERS.length];
      const serverId = `fallback-${baseServer.id}-${i + 1}`;
      
      return {
        id: serverId,
        hostname: `${baseServer.hostname.replace('-01', '')}-${String(i + 1).padStart(2, '0')}`,
        ipAddress: this.generateIPAddress(serverId),
        status: ['online', 'warning', 'critical'][i % 3] as any,
        location: ['Seoul DC1', 'Seoul DC2', 'Busan DC1'][i % 3],
        environment: 'production',
        provider: 'onpremise',
        instanceType: 'm5.large',
        cluster: null,
        zone: `zone-${String.fromCharCode(97 + (i % 3))}`,
        tags: {
          environment: 'production',
          tier: 'backend',
          type: baseServer.type
        },
        metrics: this.generateMetrics(),
        lastUpdate: new Date(),
        lastSeen: new Date(),
        alerts: [],
        services: this.generateServices(baseServer.type)
      };
    });
  }

  /**
   * 서버 정보 확장 (DataGenerator → Collector 등록용) - 기존 호환성
   */
  static extendServerInfo(baseServer: BaseServerConfig): ExtendedServerInfo {
    return {
      id: baseServer.id,
      hostname: baseServer.hostname,
      ipAddress: this.generateIPAddress(baseServer.id),
      status: 'online',
      location: baseServer.location || 'Seoul-DC1',
      environment: baseServer.environment || 'production',
      provider: baseServer.provider || 'onpremise',
      tags: {
        type: baseServer.type,
        team: 'devops',
        project: 'openmanager-ai'
      },
      metrics: this.generateMetrics(),
      lastUpdate: new Date(),
      lastSeen: new Date(),
      alerts: [],
      services: this.generateServices(baseServer.type)
    };
  }

  /**
   * 🏷️ 메타데이터를 포함한 서버 정보 확장 (엔터프라이즈용)
   */
  private static extendServerInfoWithMetadata(baseServer: BaseServerConfig): ExtendedServerInfo {
    const metadata = this.SERVER_METADATA[baseServer.type as keyof typeof this.SERVER_METADATA] || this.SERVER_METADATA.web;
    const dcInfo = this.DATACENTER_INFO[baseServer.location as keyof typeof this.DATACENTER_INFO];
    
    return {
      id: baseServer.id,
      hostname: baseServer.hostname,
      ipAddress: this.generateEnterpriseIPAddress(baseServer.provider || 'onpremise', baseServer.location || 'Seoul-IDC-1'),
      status: this.generateRealisticStatus(metadata.criticality),
      location: baseServer.location || 'Seoul-IDC-1',
      environment: baseServer.environment || 'production',
      provider: baseServer.provider || 'onpremise',
      instanceType: this.getInstanceTypeForProvider(baseServer.provider || 'onpremise', metadata.category),
      cluster: baseServer.provider === 'kubernetes' ? 'prod-cluster' : null,
      zone: dcInfo?.zone || 'a',
      tags: {
        type: baseServer.type,
        category: metadata.category,
        criticality: metadata.criticality,
        scalable: metadata.scalable.toString(),
        team: this.getTeamByCategory(metadata.category),
        project: 'openmanager-ai-v5',
        cost_center: baseServer.environment === 'production' ? 'engineering' : 'development',
        backup: metadata.criticality === 'critical' ? 'daily' : 'weekly',
        monitoring: 'enabled',
        region: dcInfo?.region || 'ap-northeast-2',
        cost_optimization: dcInfo?.cost || 'standard'
      },
      metrics: this.generateRealisticMetrics(baseServer.type, metadata),
      lastUpdate: new Date(),
      lastSeen: new Date(),
      alerts: this.generateRealisticAlerts(baseServer.type, metadata),
      services: this.generateEnhancedServices(baseServer.type, metadata)
    };
  }

  /**
   * Store용 간단한 서버 생성 (기존 호환성)
   */
  static generateStoreServers(count: number = 10) {
    return Array.from({ length: count }, (_, i) => ({
      id: `store-server-${i + 1}`,
      name: `서버-${String(i + 1).padStart(2, '0')}`,
      status: ['healthy', 'warning', 'critical'][Math.floor(Math.random() * 3)] as any,
      location: ['서울', '부산', '대구', '인천'][Math.floor(Math.random() * 4)],
      type: ['WEB', 'DB', 'API', 'CACHE'][Math.floor(Math.random() * 4)],
      metrics: {
        cpu: Math.floor(Math.random() * 100),
        memory: Math.floor(Math.random() * 100),
        disk: Math.floor(Math.random() * 100),
        network: Math.floor(Math.random() * 100)
      },
      uptime: Math.floor(Math.random() * 365),
      lastUpdate: new Date()
    }));
  }

  /**
   * IP 주소 생성 (결정적 해시)
   */
  private static generateIPAddress(serverId: string): string {
    const hash = serverId.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    const octet3 = Math.abs(hash) % 256;
    const octet4 = Math.abs(hash >> 8) % 256;
    
    return `192.168.${octet3}.${octet4}`;
  }

  /**
   * 메트릭 생성
   */
  private static generateMetrics(): ServerMetrics {
    return {
      cpu: Math.round((20 + Math.random() * 40) * 100) / 100,
      memory: Math.round((30 + Math.random() * 30) * 100) / 100,
      disk: Math.round((40 + Math.random() * 20) * 100) / 100,
      network: {
        bytesIn: Math.floor(Math.random() * 1000000) + 100000,
        bytesOut: Math.floor(Math.random() * 800000) + 80000,
        latency: Math.round((Math.random() * 50 + 10) * 100) / 100,
        connections: Math.floor(Math.random() * 200) + 50
      },
      processes: Math.floor(Math.random() * 100) + 100,
      loadAverage: [
        Math.round((Math.random() * 2) * 100) / 100,
        Math.round((Math.random() * 1.5) * 100) / 100,
        Math.round((Math.random() * 1) * 100) / 100
      ] as [number, number, number],
      uptime: Math.floor(Math.random() * 86400),
      temperature: 40 + Math.random() * 20,
      powerUsage: 150 + Math.random() * 100
    };
  }

  /**
   * 서비스 정보 생성
   */
  private static generateServices(serverType: string): ServiceInfo[] {
    const commonService = {
      name: 'nginx',
      status: 'running' as const,
      port: 80,
      pid: Math.floor(Math.random() * 30000) + 1000,
      uptime: Math.floor(Math.random() * 86400),
      memoryUsage: Math.random() * 500,
      cpuUsage: Math.random() * 10
    };

    const typeSpecificService = {
      name: serverType,
      status: 'running' as const,
      port: this.getPortForType(serverType),
      pid: Math.floor(Math.random() * 30000) + 1000,
      uptime: Math.floor(Math.random() * 86400),
      memoryUsage: 100 + Math.floor(Math.random() * 100),
      cpuUsage: 5 + Math.floor(Math.random() * 15)
    };

    return [commonService, typeSpecificService];
  }

  /**
   * 서버 타입별 포트 매핑
   */
  private static getPortForType(type: string): number {
    const portMap: Record<string, number> = {
      database: 5432,
      cache: 6379,
      api: 8080,
      web: 80,
      monitoring: 9090,
      queue: 5672,
      loadbalancer: 80,
      gateway: 8080,
      logging: 9200,
      dashboard: 3000,
      'ci-cd': 8080,
      security: 8200,
      storage: 2049
    };
    return portMap[type] || 3000;
  }

  // 🏢 엔터프라이즈급 헬퍼 메서드들

  /**
   * 엔터프라이즈급 IP 주소 생성
   */
  private static generateEnterpriseIPAddress(provider: string, location: string): string {
    const locationHash = location.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    switch (provider) {
      case 'onpremise':
        const octet3 = Math.abs(locationHash) % 10 + 1; // 192.168.1-10.x
        const octet4 = Math.abs(locationHash >> 8) % 254 + 1;
        return `192.168.${octet3}.${octet4}`;
      
      case 'aws':
        const awsOctet2 = Math.abs(locationHash) % 256;
        const awsOctet3 = Math.abs(locationHash >> 8) % 256;
        const awsOctet4 = Math.abs(locationHash >> 16) % 254 + 1;
        return `10.${awsOctet2}.${awsOctet3}.${awsOctet4}`;
      
      case 'kubernetes':
        const k8sOctet3 = Math.abs(locationHash) % 256;
        const k8sOctet4 = Math.abs(locationHash >> 8) % 254 + 1;
        return `172.16.${k8sOctet3}.${k8sOctet4}`;
      
      default:
        return this.generateIPAddress(location);
    }
  }

  /**
   * 현실적인 서버 상태 생성
   */
  private static generateRealisticStatus(criticality: string): 'online' | 'warning' | 'critical' | 'offline' {
    const rand = Math.random();
    
    switch (criticality) {
      case 'critical':
        return rand > 0.95 ? 'critical' : rand > 0.85 ? 'warning' : 'online';
      case 'high':
        return rand > 0.90 ? 'warning' : rand > 0.98 ? 'critical' : 'online';
      case 'medium':
        return rand > 0.85 ? 'warning' : rand > 0.97 ? 'critical' : 'online';
      default:
        return rand > 0.80 ? 'warning' : 'online';
    }
  }

  /**
   * 프로바이더별 인스턴스 타입 매핑
   */
  private static getInstanceTypeForProvider(provider: string, category: string): string {
    const instanceMap: Record<string, Record<string, string>> = {
      aws: {
        frontend: 't3.large',
        backend: 'c5.xlarge',
        data: 'r5.2xlarge',
        performance: 'r5.large',
        network: 'm5.xlarge',
        ops: 't3.medium',
        messaging: 'c5.large',
        security: 't3.small',
        storage: 'i3.large',
        development: 't3.micro'
      },
      kubernetes: {
        frontend: 'worker-node',
        backend: 'worker-node',
        data: 'data-node',
        performance: 'memory-optimized',
        network: 'network-node',
        ops: 'monitoring-node',
        messaging: 'messaging-node',
        security: 'secure-node',
        storage: 'storage-node',
        development: 'dev-node'
      },
      onpremise: {
        frontend: 'HP-DL380-G10',
        backend: 'DELL-R740',
        data: 'HP-DL580-G10',
        performance: 'DELL-R640',
        network: 'Cisco-UCS',
        ops: 'HP-DL360-G10',
        messaging: 'DELL-R440',
        security: 'HP-DL20-G10',
        storage: 'DELL-R740xd',
        development: 'VM-Standard'
      }
    };
    
    return instanceMap[provider]?.[category] || 'standard';
  }

  /**
   * 카테고리별 팀 매핑
   */
  private static getTeamByCategory(category: string): string {
    const teamMap: Record<string, string> = {
      frontend: 'frontend-team',
      backend: 'backend-team',
      data: 'data-team',
      performance: 'platform-team',
      network: 'infra-team',
      ops: 'devops-team',
      messaging: 'platform-team',
      security: 'security-team',
      storage: 'infra-team',
      development: 'dev-team'
    };
    
    return teamMap[category] || 'platform-team';
  }

  /**
   * 현실적인 메트릭 생성 (타입별 최적화)
   */
  private static generateRealisticMetrics(serverType: string, metadata: any): ServerMetrics {
    const baseMetrics = this.generateMetrics();
    const thresholds = metadata.alertThresholds;
    
    // 타입별 메트릭 조정
    switch (serverType) {
      case 'database':
        return {
          ...baseMetrics,
          cpu: Math.random() * (thresholds.cpu - 20) + 20, // 데이터베이스는 CPU 안정적
          memory: Math.random() * (thresholds.memory - 30) + 30, // 메모리 사용량 높음
          disk: Math.random() * (thresholds.disk - 40) + 40 // 디스크 사용량 높음
        };
      
      case 'web':
      case 'api':
        return {
          ...baseMetrics,
          cpu: Math.random() * (thresholds.cpu - 10) + 10, // 변동성 있음
          network: {
            ...baseMetrics.network,
            connections: Math.floor(Math.random() * 500) + 100, // 연결 수 많음
            latency: Math.random() * 100 + 10 // 응답성 중요
          }
        };
      
      case 'cache':
        return {
          ...baseMetrics,
          memory: Math.random() * (thresholds.memory - 10) + 10, // 메모리 집약적
          network: {
            ...baseMetrics.network,
            bytesIn: Math.floor(Math.random() * 5000000) + 1000000,
            bytesOut: Math.floor(Math.random() * 5000000) + 1000000
          }
        };
      
      default:
        return baseMetrics;
    }
  }

  /**
   * 현실적인 알림 생성
   */
  private static generateRealisticAlerts(serverType: string, metadata: any): ServerAlert[] {
    const alerts: ServerAlert[] = [];
    const rand = Math.random();
    
    // 크리티컬한 서버일수록 알림 확률 낮음 (잘 관리됨)
    const alertProbability = metadata.criticality === 'critical' ? 0.1 : 
                            metadata.criticality === 'high' ? 0.2 : 0.3;
    
    if (rand < alertProbability) {
      const alertTypes = {
        database: ['High CPU Usage', 'Slow Query Detected', 'Connection Pool Full'],
        web: ['Response Time High', 'SSL Certificate Expiring', 'High Traffic Load'],
        api: ['API Rate Limit Reached', 'Service Unavailable', 'Authentication Failures'],
        cache: ['Memory Usage Critical', 'Cache Miss Rate High', 'Eviction Rate High'],
        loadbalancer: ['Backend Server Down', 'SSL Handshake Failures', 'Traffic Spike'],
        monitoring: ['Metric Collection Failed', 'Storage Space Low', 'Alert Rule Misconfigured']
      };
      
      const typeAlerts = alertTypes[serverType as keyof typeof alertTypes] || ['System Warning'];
      const alertMessage = typeAlerts[Math.floor(Math.random() * typeAlerts.length)];
      
      alerts.push({
        id: `alert-${Date.now()}`,
        severity: Math.random() > 0.7 ? 'critical' : 'warning',
        type: serverType,
        message: alertMessage,
        timestamp: new Date().toISOString(),
        acknowledged: Math.random() > 0.5
      });
    }
    
    return alerts;
  }

  /**
   * 향상된 서비스 정보 생성
   */
  private static generateEnhancedServices(serverType: string, metadata: any): ServiceInfo[] {
    const services: ServiceInfo[] = [];
    
    // 기본 시스템 서비스
    services.push({
      name: 'systemd',
      status: 'running',
      port: 0,
      pid: 1,
      uptime: Math.floor(Math.random() * 86400 * 30), // 최대 30일
      memoryUsage: Math.random() * 50 + 10,
      cpuUsage: Math.random() * 5
    });
    
    // 타입별 필수 서비스
    metadata.requiredServices.forEach((serviceName: string, index: number) => {
      const port = metadata.defaultPorts[index] || this.getPortForType(serverType);
      
      services.push({
        name: serviceName,
        status: Math.random() > 0.05 ? 'running' : 'failed', // 95% 정상
        port,
        pid: Math.floor(Math.random() * 30000) + 1000,
        uptime: Math.floor(Math.random() * 86400 * 7), // 최대 7일
        memoryUsage: Math.random() * 500 + 100,
        cpuUsage: Math.random() * 20 + 5
      });
    });
    
    return services;
  }

  // 시나리오별 알림 생성 메서드들

  /**
   * 고부하 상황 알림 생성
   */
  private static generateAlertsForHighLoad(server: ExtendedServerInfo): ServerAlert[] {
    return [
      {
        id: `alert-cpu-${Date.now()}`,
        severity: 'warning',
        type: 'performance',
        message: `High CPU usage detected: ${server.metrics.cpu.toFixed(1)}%`,
        timestamp: new Date().toISOString(),
        acknowledged: false
      },
      {
        id: `alert-memory-${Date.now()}`,
        severity: 'warning', 
        type: 'performance',
        message: `Memory usage critical: ${server.metrics.memory.toFixed(1)}%`,
        timestamp: new Date().toISOString(),
        acknowledged: false
      }
    ];
  }

  /**
   * 유지보수 상황 알림 생성
   */
  private static generateMaintenanceAlerts(server: ExtendedServerInfo): ServerAlert[] {
    return [
      {
        id: `alert-maintenance-${Date.now()}`,
        severity: 'info',
        type: 'maintenance',
        message: `Scheduled maintenance in progress for ${server.hostname}`,
        timestamp: new Date().toISOString(),
        acknowledged: true
      }
    ];
  }

  /**
   * 재해 상황 알림 생성
   */
  private static generateDisasterAlerts(server: ExtendedServerInfo): ServerAlert[] {
    return [
      {
        id: `alert-disaster-${Date.now()}`,
        severity: 'critical',
        type: 'connectivity',
        message: `Server ${server.hostname} is unreachable - possible network failure`,
        timestamp: new Date().toISOString(),
        acknowledged: false
      },
      {
        id: `alert-system-${Date.now()}`,
        severity: 'critical',
        type: 'system',
        message: `System failure detected on ${server.hostname}`,
        timestamp: new Date().toISOString(),
        acknowledged: false
      }
    ];
  }
}

// 싱글톤 exports
export const serverDataFactory = ServerDataFactory; 