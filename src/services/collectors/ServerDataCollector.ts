/**
 * Server Data Collector
 * 
 * 🔄 실제 서버 모니터링 환경 시뮬레이션
 * - 동적 서버 발견 및 등록
 * - 실시간 메트릭 수집
 * - 이중화 데이터 소스 지원
 * - 장애 시나리오 시뮬레이션
 */

export interface ServerMetrics {
  cpu: number;
  memory: number;
  disk: number;
  network: {
    bytesIn: number;
    bytesOut: number;
    packetsIn: number;
    packetsOut: number;
    latency: number;
    connections: number;
  };
  processes: number;
  loadAverage: [number, number, number];
  uptime: number;
  temperature?: number;
  powerUsage?: number;
}

export interface ServerInfo {
  id: string;
  hostname: string;
  ipAddress: string;
  status: 'online' | 'warning' | 'critical' | 'offline' | 'maintenance';
  location: string;
  environment: 'production' | 'staging' | 'development' | 'testing';
  provider: 'aws' | 'azure' | 'gcp' | 'onpremise' | 'kubernetes' | 'docker';
  instanceType?: string;
  cluster?: string;
  zone?: string;
  tags: Record<string, string>;
  metrics: ServerMetrics;
  lastUpdate: Date;
  lastSeen: Date;
  alerts: Alert[];
  services: Service[];
}

export interface Alert {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: 'cpu' | 'memory' | 'disk' | 'network' | 'service' | 'custom';
  message: string;
  timestamp: Date;
  acknowledged: boolean;
  resolvedAt?: Date;
}

export interface Service {
  name: string;
  status: 'running' | 'stopped' | 'failed' | 'starting' | 'stopping';
  port?: number;
  pid?: number;
  uptime?: number;
  memoryUsage?: number;
  cpuUsage?: number;
}

export interface DataCollectionConfig {
  // 수집 설정
  collectionInterval: number;
  retryAttempts: number;
  timeout: number;
  
  // 데이터 소스 설정
  primarySource: 'simulation' | 'api' | 'database';
  fallbackSource: 'cache' | 'static' | 'minimal';
  
  // 서버 발견 설정
  autoDiscovery: boolean;
  discoveryInterval: number;
  maxServers: number;
  
  // 시뮬레이션 설정
  enableRealisticVariation: boolean;
  enableFailureScenarios: boolean;
  enableMaintenanceWindows: boolean;
}

export class ServerDataCollector {
  private servers: Map<string, ServerInfo> = new Map();
  private config: DataCollectionConfig;
  private collectionTimer?: NodeJS.Timeout;
  private discoveryTimer?: NodeJS.Timeout;
  private isCollecting: boolean = false;
  private lastCollectionTime: Date = new Date();
  private collectionErrors: number = 0;
  private maxErrors: number = 5;

  // 실제 환경 시뮬레이션을 위한 데이터
  private readonly PROVIDER_CONFIGS = {
    aws: {
      regions: ['us-east-1', 'us-west-2', 'eu-west-1', 'ap-northeast-2', 'ap-southeast-1'],
      instanceTypes: ['t3.micro', 't3.small', 't3.medium', 'm5.large', 'm5.xlarge', 'c5.large', 'r5.large'],
      zones: ['a', 'b', 'c']
    },
    kubernetes: {
      clusters: ['production', 'staging', 'development'],
      namespaces: ['default', 'kube-system', 'monitoring', 'ingress'],
      nodeTypes: ['master', 'worker', 'etcd']
    },
    onpremise: {
      datacenters: ['Seoul-DC1', 'Seoul-DC2', 'Busan-DC1', 'Gwangju-DC1'],
      racks: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'],
      environments: ['production', 'staging', 'development']
    }
  };

  constructor(config: Partial<DataCollectionConfig> = {}) {
    this.config = {
      collectionInterval: 30000, // 30초
      retryAttempts: 3,
      timeout: 5000,
      primarySource: 'simulation',
      fallbackSource: 'cache',
      autoDiscovery: true,
      discoveryInterval: 300000, // 5분
      maxServers: 50,
      enableRealisticVariation: true,
      enableFailureScenarios: true,
      enableMaintenanceWindows: true,
      ...config
    };
  }

  /**
   * 데이터 수집 시작
   */
  async startCollection(): Promise<void> {
    if (this.isCollecting) {
      console.warn('Data collection already running');
      return;
    }

    console.log('🔄 Starting server data collection...');
    this.isCollecting = true;
    this.collectionErrors = 0;

    // 초기 서버 발견
    await this.discoverServers();

    // 정기적인 데이터 수집
    this.collectionTimer = setInterval(async () => {
      try {
        await this.collectMetrics();
        this.collectionErrors = 0;
      } catch (error) {
        this.collectionErrors++;
        console.error(`Data collection error (${this.collectionErrors}/${this.maxErrors}):`, error);
        
        if (this.collectionErrors >= this.maxErrors) {
          console.error('Max collection errors reached, switching to fallback mode');
          await this.switchToFallbackMode();
        }
      }
    }, this.config.collectionInterval);

    // 정기적인 서버 발견
    if (this.config.autoDiscovery) {
      this.discoveryTimer = setInterval(async () => {
        await this.discoverServers();
      }, this.config.discoveryInterval);
    }

    console.log(`✅ Data collection started (interval: ${this.config.collectionInterval}ms)`);
  }

  /**
   * 데이터 수집 중지
   */
  async stopCollection(): Promise<void> {
    console.log('🛑 Stopping server data collection...');
    this.isCollecting = false;

    if (this.collectionTimer) {
      clearInterval(this.collectionTimer);
      this.collectionTimer = undefined;
    }

    if (this.discoveryTimer) {
      clearInterval(this.discoveryTimer);
      this.discoveryTimer = undefined;
    }

    console.log('✅ Data collection stopped');
  }

  /**
   * 서버 발견 (실제 환경에서는 네트워크 스캔, API 호출 등)
   */
  private async discoverServers(): Promise<void> {
    console.log('🔍 Discovering servers...');

    try {
      // Plan A: 실제 API/데이터베이스에서 서버 목록 조회
      const discoveredServers = await this.discoverFromPrimarySource();
      
      // Plan B: 캐시된 서버 목록 사용
      if (discoveredServers.length === 0) {
        console.warn('Primary discovery failed, using fallback discovery');
        await this.discoverFromFallbackSource();
      } else {
        await this.registerDiscoveredServers(discoveredServers);
      }

    } catch (error) {
      console.error('Server discovery failed:', error);
      await this.discoverFromFallbackSource();
    }
  }

  /**
   * 주 데이터 소스에서 서버 발견
   */
  private async discoverFromPrimarySource(): Promise<Partial<ServerInfo>[]> {
    switch (this.config.primarySource) {
      case 'api':
        return await this.discoverFromAPI();
      case 'database':
        return await this.discoverFromDatabase();
      case 'simulation':
      default:
        return await this.discoverFromSimulation();
    }
  }

  /**
   * API에서 서버 발견 (실제 환경)
   */
  private async discoverFromAPI(): Promise<Partial<ServerInfo>[]> {
    // 실제 환경에서는 여기서 실제 API 호출
    // 예: AWS EC2 describe-instances, Kubernetes API, 등
    console.log('📡 Discovering servers from API...');
    
    // 시뮬레이션: 실제 API 응답과 유사한 구조
    return [];
  }

  /**
   * 데이터베이스에서 서버 발견 (실제 환경)
   */
  private async discoverFromDatabase(): Promise<Partial<ServerInfo>[]> {
    // 실제 환경에서는 CMDB, 인벤토리 DB 등에서 조회
    console.log('🗄️ Discovering servers from database...');
    
    return [];
  }

  /**
   * 시뮬레이션 환경에서 서버 발견
   */
  private async discoverFromSimulation(): Promise<Partial<ServerInfo>[]> {
    console.log('🎭 Discovering servers from simulation...');
    
    const servers: Partial<ServerInfo>[] = [];
    const currentTime = new Date();
    
    // 동적으로 서버 생성 (실제 환경처럼)
    const serverCount = Math.floor(Math.random() * 20) + 30; // 30-50대
    
    for (let i = 0; i < serverCount; i++) {
      const provider = this.getRandomProvider();
      const serverInfo = this.generateServerInfo(i, provider, currentTime);
      servers.push(serverInfo);
    }

    return servers;
  }

  /**
   * 백업 소스에서 서버 발견
   */
  private async discoverFromFallbackSource(): Promise<void> {
    console.log('🔄 Using fallback server discovery...');
    
    // 최소한의 서버 세트 생성
    const fallbackServers = this.generateMinimalServerSet();
    await this.registerDiscoveredServers(fallbackServers);
  }

  /**
   * 발견된 서버들 등록
   */
  private async registerDiscoveredServers(servers: Partial<ServerInfo>[]): Promise<void> {
    let newServers = 0;
    let updatedServers = 0;

    for (const serverData of servers) {
      if (!serverData.id) continue;

      const existingServer = this.servers.get(serverData.id);
      
      if (existingServer) {
        // 기존 서버 업데이트
        const updatedServer: ServerInfo = {
          ...existingServer,
          ...serverData,
          lastSeen: new Date()
        } as ServerInfo;
        
        this.servers.set(serverData.id, updatedServer);
        updatedServers++;
      } else {
        // 새 서버 등록
        const newServer = this.createCompleteServerInfo(serverData);
        this.servers.set(serverData.id, newServer);
        newServers++;
      }
    }

    console.log(`📊 Server discovery complete: ${newServers} new, ${updatedServers} updated, ${this.servers.size} total`);
  }

  /**
   * 메트릭 수집
   */
  private async collectMetrics(): Promise<void> {
    const startTime = Date.now();
    const servers = Array.from(this.servers.values());
    
    console.log(`📊 Collecting metrics from ${servers.length} servers...`);

    // 병렬로 메트릭 수집
    const collectionPromises = servers.map(server => this.collectServerMetrics(server));
    const results = await Promise.allSettled(collectionPromises);

    let successCount = 0;
    let failureCount = 0;

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        successCount++;
        // 수집된 메트릭으로 서버 정보 업데이트
        const server = servers[index];
        server.metrics = result.value;
        server.lastUpdate = new Date();
        this.updateServerStatus(server);
      } else {
        failureCount++;
        console.warn(`Failed to collect metrics for server ${servers[index].id}:`, result.reason);
      }
    });

    this.lastCollectionTime = new Date();
    const duration = Date.now() - startTime;
    
    console.log(`✅ Metrics collection complete: ${successCount} success, ${failureCount} failed (${duration}ms)`);
  }

  /**
   * 개별 서버 메트릭 수집
   */
  private async collectServerMetrics(server: ServerInfo): Promise<ServerMetrics> {
    // 실제 환경에서는 여기서 실제 메트릭 수집
    // 예: SSH 연결, SNMP, 에이전트 API 호출 등
    
    // 시뮬레이션: 현실적인 메트릭 변화
    const currentMetrics = server.metrics;
    const variation = this.config.enableRealisticVariation ? this.generateRealisticVariation(server) : { cpu: 0, memory: 0, disk: 0 };
    
    const newMetrics: ServerMetrics = {
      cpu: Math.max(0, Math.min(100, currentMetrics.cpu + variation.cpu)),
      memory: Math.max(0, Math.min(100, currentMetrics.memory + variation.memory)),
      disk: Math.max(0, Math.min(100, currentMetrics.disk + variation.disk)),
      network: this.updateNetworkMetrics(currentMetrics.network),
      processes: currentMetrics.processes + Math.floor(Math.random() * 10 - 5),
      loadAverage: this.updateLoadAverage(currentMetrics.loadAverage),
      uptime: currentMetrics.uptime + 30, // 30초 증가
      temperature: this.generateTemperature(currentMetrics.cpu),
      powerUsage: this.generatePowerUsage(currentMetrics.cpu, currentMetrics.memory)
    };

    // 장애 시나리오 시뮬레이션
    if (this.config.enableFailureScenarios) {
      this.simulateFailureScenarios(server, newMetrics);
    }

    return newMetrics;
  }

  /**
   * 서버 상태 업데이트
   */
  private updateServerStatus(server: ServerInfo): void {
    const metrics = server.metrics;
    let newStatus: ServerInfo['status'] = 'online';
    
    // 상태 결정 로직
    if (metrics.cpu > 90 || metrics.memory > 95 || metrics.disk > 95) {
      newStatus = 'critical';
    } else if (metrics.cpu > 80 || metrics.memory > 85 || metrics.disk > 85) {
      newStatus = 'warning';
    } else if (Date.now() - server.lastSeen.getTime() > 300000) { // 5분 이상 미응답
      newStatus = 'offline';
    }

    // 상태 변경 시 알림 생성
    if (server.status !== newStatus) {
      this.generateAlert(server, server.status, newStatus);
      server.status = newStatus;
    }
  }

  /**
   * 알림 생성
   */
  private generateAlert(server: ServerInfo, oldStatus: string, newStatus: string): void {
    const alert: Alert = {
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      severity: newStatus === 'critical' ? 'critical' : newStatus === 'warning' ? 'medium' : 'low',
      type: 'custom',
      message: `Server ${server.hostname} status changed from ${oldStatus} to ${newStatus}`,
      timestamp: new Date(),
      acknowledged: false
    };

    server.alerts.unshift(alert);
    
    // 최대 10개 알림만 유지
    if (server.alerts.length > 10) {
      server.alerts = server.alerts.slice(0, 10);
    }
  }

  /**
   * 현실적인 메트릭 변화 생성
   */
  private generateRealisticVariation(server: ServerInfo): { cpu: number; memory: number; disk: number } {
    const timeOfDay = new Date().getHours();
    const isBusinessHours = timeOfDay >= 9 && timeOfDay <= 18;
    const isWeekend = new Date().getDay() === 0 || new Date().getDay() === 6;
    
    // 비즈니스 시간과 주말에 따른 부하 패턴
    const loadMultiplier = isBusinessHours && !isWeekend ? 1.5 : 0.7;
    
    return {
      cpu: (Math.random() * 10 - 5) * loadMultiplier,
      memory: (Math.random() * 5 - 2.5) * loadMultiplier,
      disk: Math.random() * 2 - 1 // 디스크는 천천히 증가
    };
  }

  /**
   * 네트워크 메트릭 업데이트
   */
  private updateNetworkMetrics(current: ServerMetrics['network']): ServerMetrics['network'] {
    return {
      bytesIn: current.bytesIn + Math.floor(Math.random() * 1000000),
      bytesOut: current.bytesOut + Math.floor(Math.random() * 800000),
      packetsIn: current.packetsIn + Math.floor(Math.random() * 1000),
      packetsOut: current.packetsOut + Math.floor(Math.random() * 800),
      latency: Math.max(1, current.latency + Math.random() * 10 - 5),
      connections: Math.max(0, current.connections + Math.floor(Math.random() * 20 - 10))
    };
  }

  /**
   * 로드 평균 업데이트
   */
  private updateLoadAverage(current: [number, number, number]): [number, number, number] {
    return [
      Math.max(0, current[0] + (Math.random() * 0.4 - 0.2)),
      Math.max(0, current[1] + (Math.random() * 0.2 - 0.1)),
      Math.max(0, current[2] + (Math.random() * 0.1 - 0.05))
    ];
  }

  /**
   * 온도 생성
   */
  private generateTemperature(cpuUsage: number): number {
    const baseTemp = 35;
    const cpuHeat = (cpuUsage / 100) * 30;
    const ambient = Math.random() * 5;
    return Math.round(baseTemp + cpuHeat + ambient);
  }

  /**
   * 전력 사용량 생성
   */
  private generatePowerUsage(cpuUsage: number, memoryUsage: number): number {
    const basePower = 150; // 기본 150W
    const cpuPower = (cpuUsage / 100) * 100;
    const memoryPower = (memoryUsage / 100) * 50;
    return Math.round(basePower + cpuPower + memoryPower);
  }

  /**
   * 장애 시나리오 시뮬레이션
   */
  private simulateFailureScenarios(server: ServerInfo, metrics: ServerMetrics): void {
    // 1% 확률로 장애 발생
    if (Math.random() < 0.01) {
      const scenarios = ['cpu_spike', 'memory_leak', 'disk_full', 'network_issue'];
      const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];
      
      switch (scenario) {
        case 'cpu_spike':
          metrics.cpu = Math.min(100, metrics.cpu + 30);
          break;
        case 'memory_leak':
          metrics.memory = Math.min(100, metrics.memory + 20);
          break;
        case 'disk_full':
          metrics.disk = Math.min(100, metrics.disk + 15);
          break;
        case 'network_issue':
          metrics.network.latency += 50;
          break;
      }
    }
  }

  /**
   * 백업 모드로 전환
   */
  private async switchToFallbackMode(): Promise<void> {
    console.log('🔄 Switching to fallback data collection mode...');
    this.config.primarySource = 'simulation';
    this.config.collectionInterval = 60000; // 1분으로 증가
    this.collectionErrors = 0;
  }

  /**
   * 랜덤 프로바이더 선택
   */
  private getRandomProvider(): keyof typeof this.PROVIDER_CONFIGS {
    const providers = Object.keys(this.PROVIDER_CONFIGS) as (keyof typeof this.PROVIDER_CONFIGS)[];
    return providers[Math.floor(Math.random() * providers.length)];
  }

  /**
   * 서버 정보 생성
   */
  private generateServerInfo(index: number, provider: keyof typeof this.PROVIDER_CONFIGS, currentTime: Date): Partial<ServerInfo> {
    const id = `${provider}-${String(index + 1).padStart(3, '0')}`;
    
    switch (provider) {
      case 'aws':
        return this.generateAWSServer(id, index);
      case 'kubernetes':
        return this.generateKubernetesServer(id, index);
      case 'onpremise':
        return this.generateOnPremiseServer(id, index);
      default:
        return this.generateGenericServer(id, index);
    }
  }

  /**
   * AWS 서버 생성
   */
  private generateAWSServer(id: string, index: number): Partial<ServerInfo> {
    const config = this.PROVIDER_CONFIGS.aws;
    const region = config.regions[index % config.regions.length];
    const instanceType = config.instanceTypes[index % config.instanceTypes.length];
    const zone = config.zones[index % config.zones.length];
    
    return {
      id,
      hostname: `ip-10-0-${Math.floor(index / 10)}-${index % 10}`,
      ipAddress: `10.0.${Math.floor(index / 10)}.${index % 10}`,
      provider: 'aws',
      location: `${region}${zone}`,
      environment: index < 20 ? 'production' : index < 30 ? 'staging' : 'development',
      instanceType,
      tags: {
        Environment: index < 20 ? 'production' : 'staging',
        Team: ['backend', 'frontend', 'data', 'devops'][index % 4],
        Project: ['web-app', 'api-service', 'data-pipeline'][index % 3]
      }
    };
  }

  /**
   * Kubernetes 서버 생성
   */
  private generateKubernetesServer(id: string, index: number): Partial<ServerInfo> {
    const config = this.PROVIDER_CONFIGS.kubernetes;
    const cluster = config.clusters[index % config.clusters.length];
    const nodeType = config.nodeTypes[index % config.nodeTypes.length];
    
    return {
      id,
      hostname: `${nodeType}-node-${String(index + 1).padStart(2, '0')}`,
      ipAddress: `192.168.1.${index + 10}`,
      provider: 'kubernetes',
      location: 'Kubernetes Cluster',
      environment: cluster as any,
      cluster,
      zone: `zone-${String.fromCharCode(97 + (index % 3))}`,
      tags: {
        'kubernetes.io/role': nodeType,
        'node.kubernetes.io/instance-type': nodeType === 'master' ? 'm5.large' : 'm5.xlarge',
        cluster
      }
    };
  }

  /**
   * 온프레미스 서버 생성
   */
  private generateOnPremiseServer(id: string, index: number): Partial<ServerInfo> {
    const config = this.PROVIDER_CONFIGS.onpremise;
    const datacenter = config.datacenters[index % config.datacenters.length];
    const rack = config.racks[index % config.racks.length];
    const environment = config.environments[index % config.environments.length];
    
    return {
      id,
      hostname: `server-${String(index + 1).padStart(3, '0')}.corp.local`,
      ipAddress: `172.16.${Math.floor(index / 254)}.${(index % 254) + 1}`,
      provider: 'onpremise',
      location: `${datacenter} Rack-${rack}`,
      environment: environment as any,
      tags: {
        datacenter,
        rack,
        environment,
        owner: ['IT', 'Development', 'Operations'][index % 3]
      }
    };
  }

  /**
   * 일반 서버 생성
   */
  private generateGenericServer(id: string, index: number): Partial<ServerInfo> {
    return {
      id,
      hostname: `server-${String(index + 1).padStart(3, '0')}`,
      ipAddress: `10.0.0.${index + 1}`,
      provider: 'onpremise',
      location: 'Unknown',
      environment: 'production',
      tags: {}
    };
  }

  /**
   * 완전한 서버 정보 생성
   */
  private createCompleteServerInfo(partial: Partial<ServerInfo>): ServerInfo {
    const now = new Date();
    
    return {
      id: partial.id || `server-${Date.now()}`,
      hostname: partial.hostname || 'unknown',
      ipAddress: partial.ipAddress || '0.0.0.0',
      status: 'online',
      location: partial.location || 'Unknown',
      environment: partial.environment || 'production',
      provider: partial.provider || 'onpremise',
      instanceType: partial.instanceType,
      cluster: partial.cluster,
      zone: partial.zone,
      tags: partial.tags || {},
      metrics: this.generateInitialMetrics(),
      lastUpdate: now,
      lastSeen: now,
      alerts: [],
      services: this.generateServices()
    };
  }

  /**
   * 초기 메트릭 생성
   */
  private generateInitialMetrics(): ServerMetrics {
    return {
      cpu: Math.random() * 60 + 10, // 10-70%
      memory: Math.random() * 50 + 30, // 30-80%
      disk: Math.random() * 40 + 20, // 20-60%
      network: {
        bytesIn: Math.floor(Math.random() * 100000000),
        bytesOut: Math.floor(Math.random() * 80000000),
        packetsIn: Math.floor(Math.random() * 10000),
        packetsOut: Math.floor(Math.random() * 8000),
        latency: Math.random() * 50 + 5,
        connections: Math.floor(Math.random() * 1000)
      },
      processes: Math.floor(Math.random() * 200) + 50,
      loadAverage: [
        Math.random() * 2,
        Math.random() * 1.5,
        Math.random() * 1
      ],
      uptime: Math.floor(Math.random() * 8640000), // 0-100일
      temperature: Math.floor(Math.random() * 30) + 35, // 35-65도
      powerUsage: Math.floor(Math.random() * 200) + 100 // 100-300W
    };
  }

  /**
   * 서비스 생성
   */
  private generateServices(): Service[] {
    const commonServices = ['nginx', 'apache', 'nodejs', 'python', 'java', 'docker', 'systemd'];
    const serviceCount = Math.floor(Math.random() * 5) + 2; // 2-6개 서비스
    
    return Array.from({ length: serviceCount }, (_, i) => ({
      name: commonServices[i % commonServices.length],
      status: Math.random() > 0.1 ? 'running' : 'stopped',
      port: 8000 + i,
      pid: Math.floor(Math.random() * 30000) + 1000,
      uptime: Math.floor(Math.random() * 86400),
      memoryUsage: Math.random() * 500,
      cpuUsage: Math.random() * 10
    }));
  }

  /**
   * 최소 서버 세트 생성 (백업용)
   */
  private generateMinimalServerSet(): Partial<ServerInfo>[] {
    return [
      {
        id: 'fallback-web-01',
        hostname: 'web-server-01',
        ipAddress: '10.0.1.1',
        provider: 'onpremise',
        location: 'Primary DC',
        environment: 'production'
      },
      {
        id: 'fallback-db-01',
        hostname: 'db-server-01',
        ipAddress: '10.0.1.2',
        provider: 'onpremise',
        location: 'Primary DC',
        environment: 'production'
      },
      {
        id: 'fallback-api-01',
        hostname: 'api-server-01',
        ipAddress: '10.0.1.3',
        provider: 'onpremise',
        location: 'Primary DC',
        environment: 'production'
      }
    ];
  }

  // Public API Methods

  /**
   * 모든 서버 조회
   */
  getAllServers(): ServerInfo[] {
    return Array.from(this.servers.values());
  }

  /**
   * 서버 ID로 조회
   */
  getServerById(id: string): ServerInfo | undefined {
    return this.servers.get(id);
  }

  /**
   * 조건으로 서버 필터링
   */
  getServersByCondition(condition: (server: ServerInfo) => boolean): ServerInfo[] {
    return this.getAllServers().filter(condition);
  }

  /**
   * 상태별 서버 조회
   */
  getServersByStatus(status: ServerInfo['status']): ServerInfo[] {
    return this.getServersByCondition(server => server.status === status);
  }

  /**
   * 프로바이더별 서버 조회
   */
  getServersByProvider(provider: ServerInfo['provider']): ServerInfo[] {
    return this.getServersByCondition(server => server.provider === provider);
  }

  /**
   * 환경별 서버 조회
   */
  getServersByEnvironment(environment: ServerInfo['environment']): ServerInfo[] {
    return this.getServersByCondition(server => server.environment === environment);
  }

  /**
   * 수집 통계 조회
   */
  getCollectionStats() {
    return {
      totalServers: this.servers.size,
      isCollecting: this.isCollecting,
      lastCollectionTime: this.lastCollectionTime,
      collectionErrors: this.collectionErrors,
      config: this.config
    };
  }

  /**
   * 서버 통계 조회
   */
  getServerStats() {
    const servers = this.getAllServers();
    const statusCounts = servers.reduce((acc, server) => {
      acc[server.status] = (acc[server.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const providerCounts = servers.reduce((acc, server) => {
      acc[server.provider] = (acc[server.provider] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const avgMetrics = servers.reduce((acc, server) => {
      acc.cpu += server.metrics.cpu;
      acc.memory += server.metrics.memory;
      acc.disk += server.metrics.disk;
      return acc;
    }, { cpu: 0, memory: 0, disk: 0 });

    const serverCount = servers.length;
    if (serverCount > 0) {
      avgMetrics.cpu /= serverCount;
      avgMetrics.memory /= serverCount;
      avgMetrics.disk /= serverCount;
    }

    return {
      total: serverCount,
      byStatus: statusCounts,
      byProvider: providerCounts,
      averageMetrics: avgMetrics,
      totalAlerts: servers.reduce((sum, server) => sum + server.alerts.length, 0)
    };
  }
}

// 싱글톤 인스턴스
export const serverDataCollector = new ServerDataCollector({
  collectionInterval: 30000, // 30초
  autoDiscovery: true,
  enableRealisticVariation: true,
  enableFailureScenarios: true,
  maxServers: 50
}); 