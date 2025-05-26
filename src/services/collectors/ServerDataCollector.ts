/**
 * Server Data Collector
 * 
 * 🔄 실제 서버 모니터링 환경 시뮬레이션
 * - 동적 서버 발견 및 등록
 * - 실시간 메트릭 수집
 * - 이중화 데이터 소스 지원
 * - 장애 시나리오 시뮬레이션
 */

// import { metricsStorage } from '../storage'; // 조건부 로딩으로 변경
import { useSystemStore } from '../../stores/systemStore';

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
  primarySource: 'simulation' | 'api' | 'database' | 'ssh' | 'snmp' | 'agent';
  fallbackSource: 'cache' | 'static' | 'minimal';
  
  // 서버 발견 설정
  autoDiscovery: boolean;
  discoveryInterval: number;
  maxServers: number;
  
  // 시뮬레이션 설정
  enableRealisticVariation: boolean;
  enableFailureScenarios: boolean;
  enableMaintenanceWindows: boolean;
  
  // 실제 환경 설정
  environment: 'production' | 'development' | 'demo';
  realServerConfig?: {
    sshConfig?: {
      username: string;
      privateKeyPath?: string;
      password?: string;
      port: number;
    };
    snmpConfig?: {
      community: string;
      version: '1' | '2c' | '3';
      port: number;
    };
    agentConfig?: {
      apiEndpoint: string;
      apiKey?: string;
      timeout: number;
    };
  };
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
  private powerMode: 'sleep' | 'active' | 'monitoring' | 'emergency' = 'active';
  
  // AI 모니터링 관련
  private aiMonitoringTimer?: NodeJS.Timeout;
  private isAIMonitoring: boolean = false;
  private lastDataChangeTime: Date = new Date();
  private aiInactivityTimeout: number = 30 * 60 * 1000; // 30분 비활성 시 AI도 종료
  private aiInactivityTimer?: NodeJS.Timeout;

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
    // 환경 자동 감지
    const detectedEnvironment = this.detectEnvironment();
    
    this.config = {
      collectionInterval: 30000, // 30초
      retryAttempts: 3,
      timeout: 5000,
      primarySource: detectedEnvironment === 'production' ? 'api' : 'simulation',
      fallbackSource: 'cache',
      autoDiscovery: true,
      discoveryInterval: 300000, // 5분
      maxServers: 50,
      enableRealisticVariation: detectedEnvironment !== 'production',
      enableFailureScenarios: detectedEnvironment !== 'production',
      enableMaintenanceWindows: true,
      environment: detectedEnvironment,
      realServerConfig: {
        sshConfig: {
          username: process.env.SSH_USERNAME || 'admin',
          privateKeyPath: process.env.SSH_PRIVATE_KEY_PATH,
          password: process.env.SSH_PASSWORD,
          port: parseInt(process.env.SSH_PORT || '22')
        },
        snmpConfig: {
          community: process.env.SNMP_COMMUNITY || 'public',
          version: (process.env.SNMP_VERSION as '1' | '2c' | '3') || '2c',
          port: parseInt(process.env.SNMP_PORT || '161')
        },
        agentConfig: {
          apiEndpoint: process.env.AGENT_API_ENDPOINT || 'http://localhost:8080/api',
          apiKey: process.env.AGENT_API_KEY,
          timeout: parseInt(process.env.AGENT_TIMEOUT || '5000')
        }
      },
      ...config
    };
  }

  /**
   * 데이터 수집 시작 (시스템 상태 확인)
   */
  async startCollection(): Promise<void> {
    if (this.isCollecting) {
      console.warn('Data collection already running');
      return;
    }

    // 시스템 상태 확인
    const systemStore = useSystemStore.getState();
    if (!systemStore.canStartDataCollection()) {
      console.log('🔋 System is in stopped mode, starting AI monitoring only...');
      await this.startAIMonitoring();
      return;
    }

    console.log('🔄 Starting full server data collection...');
    this.isCollecting = true;
    this.collectionErrors = 0;

    // 초기 서버 발견
    await this.discoverServers();

    // 정기적인 데이터 수집 (시스템 상태 체크 포함)
    this.collectionTimer = setInterval(async () => {
      try {
        // 시스템 상태 재확인
        const currentSystemState = useSystemStore.getState();
        if (!currentSystemState.canStartDataCollection()) {
          console.log('🔋 System stopped during collection, switching to AI monitoring...');
          await this.pauseCollection();
          await this.startAIMonitoring();
          return;
        }

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

    // 정기적인 서버 발견 (시스템이 활성화된 경우에만)
    if (this.config.autoDiscovery && systemStore.state === 'active') {
      this.discoveryTimer = setInterval(async () => {
        const currentSystemState = useSystemStore.getState();
        if (currentSystemState.canStartDataCollection()) {
          await this.discoverServers();
        }
      }, this.config.discoveryInterval);
    }

    console.log(`✅ Full data collection started (interval: ${this.config.collectionInterval}ms)`);
    
    // 시스템 이벤트 리스너 등록
    this.setupSystemEventListeners();
  }

  /**
   * AI 전용 모니터링 시작 (절전 모드)
   */
  private async startAIMonitoring(): Promise<void> {
    if (this.isAIMonitoring) {
      console.log('🤖 AI monitoring already running');
      return;
    }

    console.log('🤖 Starting AI monitoring mode (minimal resource usage)...');
    this.isAIMonitoring = true;
    this.lastDataChangeTime = new Date();

    // 최소한의 서버 정보만 유지 (기존 서버가 없으면 최소 세트 생성)
    if (this.servers.size === 0) {
      const minimalServers = this.generateMinimalServerSet();
      await this.registerDiscoveredServers(minimalServers);
    }

    // AI 모니터링 타이머 (5분 간격으로 헬스체크)
    this.aiMonitoringTimer = setInterval(async () => {
      try {
        await this.performAIHealthCheck();
      } catch (error) {
        console.error('AI monitoring error:', error);
      }
    }, 5 * 60 * 1000); // 5분 간격

    // AI 비활성 타이머 설정
    this.resetAIInactivityTimer();

    console.log('✅ AI monitoring started (5min interval, 30min auto-shutdown)');
  }

  /**
   * AI 헬스체크 (최소한의 리소스로 변화 감지)
   */
  private async performAIHealthCheck(): Promise<void> {
    console.log('🔍 AI health check...');
    
    const servers = Array.from(this.servers.values());
    let hasDataActivity = false;

    for (const server of servers) {
      // 기존 메트릭 저장
      const oldMetrics = { ...server.metrics };
      
      // 최소한의 메트릭만 시뮬레이션 (실제 환경에서는 ping, 기본 상태만 체크)
      const newMetrics = await this.generateMinimalMetrics(server);
      
      // 중요한 변화 감지
      const changeDetection = this.detectCriticalChanges(oldMetrics, newMetrics);
      if (changeDetection.trigger) {
        console.log(`🚨 AI detected critical change: ${changeDetection.reason}`);
        
        // 시스템 자동 활성화
        const systemStore = useSystemStore.getState();
        systemStore.aiTriggeredActivation(changeDetection.reason);
        
        // 전체 데이터 수집 모드로 전환
        await this.stopAIMonitoring();
        await this.startCollection();
        return;
      }

      // 데이터 활동 감지 (작은 변화라도)
      const hasChange = Math.abs(newMetrics.cpu - oldMetrics.cpu) > 1 ||
                       Math.abs(newMetrics.memory - oldMetrics.memory) > 1 ||
                       Math.abs(newMetrics.disk - oldMetrics.disk) > 0.5;
      
      if (hasChange) {
        hasDataActivity = true;
        server.metrics = newMetrics;
        server.lastUpdate = new Date();
      }

      // significantChanges 변수는 사용하지 않으므로 제거
    }

    // 데이터 활동이 있으면 비활성 타이머 리셋
    if (hasDataActivity) {
      this.lastDataChangeTime = new Date();
      this.resetAIInactivityTimer();
      console.log('📊 Data activity detected, AI monitoring continues...');
    } else {
      console.log('😴 No significant data changes detected');
    }
  }

  /**
   * 최소한의 메트릭 생성 (AI 모니터링용)
   */
  private async generateMinimalMetrics(server: ServerInfo): Promise<ServerMetrics> {
    // 현재 메트릭에서 최소한의 변화만 시뮬레이션
    const current = server.metrics;
    
    return {
      cpu: Math.max(0, Math.min(100, current.cpu + (Math.random() * 4 - 2))), // ±2% 변화
      memory: Math.max(0, Math.min(100, current.memory + (Math.random() * 2 - 1))), // ±1% 변화
      disk: Math.max(0, Math.min(100, current.disk + (Math.random() * 0.5 - 0.25))), // ±0.25% 변화
      network: current.network, // 네트워크는 변화 없음
      processes: current.processes,
      loadAverage: current.loadAverage,
      uptime: current.uptime + 300, // 5분 증가
      temperature: current.temperature,
      powerUsage: current.powerUsage
    };
  }

  /**
   * AI 비활성 타이머 리셋
   */
  private resetAIInactivityTimer(): void {
    if (this.aiInactivityTimer) {
      clearTimeout(this.aiInactivityTimer);
    }

    this.aiInactivityTimer = setTimeout(() => {
      console.log('😴 AI monitoring auto-shutdown due to inactivity (30min)');
      this.stopAIMonitoring();
    }, this.aiInactivityTimeout);
  }

  /**
   * AI 모니터링 중지
   */
  private async stopAIMonitoring(): Promise<void> {
    if (!this.isAIMonitoring) {
      return;
    }

    console.log('🛑 Stopping AI monitoring...');
    this.isAIMonitoring = false;

    if (this.aiMonitoringTimer) {
      clearInterval(this.aiMonitoringTimer);
      this.aiMonitoringTimer = undefined;
    }

    if (this.aiInactivityTimer) {
      clearTimeout(this.aiInactivityTimer);
      this.aiInactivityTimer = undefined;
    }

    console.log('✅ AI monitoring stopped - system fully idle');
  }

  /**
   * 환경 자동 감지
   */
  private detectEnvironment(): 'production' | 'development' | 'demo' {
    // 환경변수 우선 확인
    const envMode = process.env.NODE_ENV;
    const deployMode = process.env.DEPLOY_MODE;
    
    if (deployMode === 'production' || envMode === 'production') {
      return 'production';
    }
    
    if (deployMode === 'demo' || process.env.DEMO_MODE === 'true') {
      return 'demo';
    }
    
    // 실제 서버 환경 감지 시도
    try {
      // 브라우저 환경이 아닌 경우 (Node.js 서버 환경)
      if (typeof window === 'undefined') {
        // 실제 서버 환경일 가능성이 높음
        return 'production';
      }
      
      // 브라우저 환경에서는 데모/개발 모드
      return 'demo';
    } catch (error) {
      // 기본값은 개발 모드
      return 'development';
    }
  }

  /**
   * 시스템 이벤트 리스너 설정 (브라우저 환경에서만)
   */
  private setupSystemEventListeners(): void {
    // 브라우저 환경이 아니면 이벤트 리스너 설정 안 함
    if (typeof window === 'undefined') {
      console.log('🔧 Running in Node.js environment, skipping browser event listeners');
      return;
    }

    // 시스템 정지 이벤트
    window.addEventListener('system-stopped', () => {
      console.log('🔋 System stopped event received, switching to AI monitoring');
      this.pauseCollection();
      this.startAIMonitoring();
    });

    // 시스템 활성화 이벤트
    window.addEventListener('system-activated', () => {
      console.log('🚀 System activated event received, resuming full collection');
      this.stopAIMonitoring();
      this.resumeCollection();
    });

    // AI 활성화 이벤트 (데이터 변동 감지)
    window.addEventListener('ai-activation', (event: any) => {
      console.log('🤖 AI activation event received:', event.detail.reason);
      this.stopAIMonitoring();
      this.resumeCollection();
    });
  }

  /**
   * 데이터 수집 일시 정지
   */
  private async pauseCollection(): Promise<void> {
    if (this.collectionTimer) {
      clearInterval(this.collectionTimer);
      this.collectionTimer = undefined;
    }
    
    if (this.discoveryTimer) {
      clearInterval(this.discoveryTimer);
      this.discoveryTimer = undefined;
    }
    
    console.log('⏸️ Data collection paused');
  }

  /**
   * 데이터 수집 재개
   */
  private async resumeCollection(): Promise<void> {
    if (this.isCollecting && !this.collectionTimer) {
      // 수집 타이머 재시작
      this.collectionTimer = setInterval(async () => {
        try {
          const systemState = useSystemStore.getState();
          if (!systemState.canStartDataCollection()) {
            await this.pauseCollection();
            return;
          }

          await this.collectMetrics();
          this.collectionErrors = 0;
        } catch (error) {
          this.collectionErrors++;
          console.error(`Data collection error (${this.collectionErrors}/${this.maxErrors}):`, error);
        }
      }, this.config.collectionInterval);

      console.log('▶️ Data collection resumed');
    }
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

    // AI 모니터링도 완전 중지
    await this.stopAIMonitoring();

    console.log('✅ Data collection and AI monitoring stopped');
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
    console.log('📡 Discovering servers from API...');
    
    try {
      // 실제 환경에서는 여기서 실제 API 호출
      if (this.config.environment === 'production') {
        return await this.discoverFromRealAPI();
      }
      
      // 개발/데모 환경에서는 시뮬레이션
      return await this.discoverFromSimulation();
    } catch (error) {
      console.error('API discovery failed:', error);
      return [];
    }
  }

  /**
   * 실제 API에서 서버 발견
   */
  private async discoverFromRealAPI(): Promise<Partial<ServerInfo>[]> {
    const servers: Partial<ServerInfo>[] = [];
    
    try {
      // AWS EC2 인스턴스 조회 (예시)
      if (process.env.AWS_ACCESS_KEY_ID) {
        const awsServers = await this.discoverAWSInstances();
        servers.push(...awsServers);
      }
      
      // Kubernetes 노드 조회 (예시)
      if (process.env.KUBECONFIG || process.env.K8S_API_SERVER) {
        const k8sServers = await this.discoverKubernetesNodes();
        servers.push(...k8sServers);
      }
      
      // 네트워크 스캔 (예시)
      if (process.env.NETWORK_SCAN_RANGE) {
        const networkServers = await this.discoverNetworkServers();
        servers.push(...networkServers);
      }
      
      console.log(`✅ Discovered ${servers.length} real servers`);
      return servers;
    } catch (error) {
      console.error('Real API discovery failed:', error);
      return [];
    }
  }

  /**
   * AWS 인스턴스 발견 (실제 구현 예시)
   */
  private async discoverAWSInstances(): Promise<Partial<ServerInfo>[]> {
    // 실제 환경에서는 AWS SDK 사용
    console.log('🔍 Discovering AWS EC2 instances...');
    
    // 실제 구현 시:
    // const ec2 = new AWS.EC2();
    // const instances = await ec2.describeInstances().promise();
    // return instances.Reservations.flatMap(r => r.Instances.map(i => ({ ... })));
    
    return [];
  }

  /**
   * Kubernetes 노드 발견 (실제 구현 예시)
   */
  private async discoverKubernetesNodes(): Promise<Partial<ServerInfo>[]> {
    console.log('🔍 Discovering Kubernetes nodes...');
    
    // 실제 구현 시:
    // const k8sApi = kc.makeApiClient(k8s.CoreV1Api);
    // const nodes = await k8sApi.listNode();
    // return nodes.body.items.map(node => ({ ... }));
    
    return [];
  }

  /**
   * 네트워크 서버 발견 (실제 구현 예시)
   */
  private async discoverNetworkServers(): Promise<Partial<ServerInfo>[]> {
    console.log('🔍 Scanning network for servers...');
    
    // 실제 구현 시:
    // const range = process.env.NETWORK_SCAN_RANGE; // "192.168.1.0/24"
    // const servers = await networkScan(range);
    // return servers.map(server => ({ ... }));
    
    return [];
  }

  /**
   * 데이터베이스에서 서버 발견 (실제 환경)
   */
  private async discoverFromDatabase(): Promise<Partial<ServerInfo>[]> {
    console.log('🗄️ Discovering servers from database...');
    
    try {
      if (this.config.environment === 'production') {
        // 실제 CMDB나 인벤토리 DB에서 조회
        return await this.queryInventoryDatabase();
      }
      
             // 개발/데모 환경에서는 로컬 DB에서 복원 시도
       await this.restoreServersFromDatabase();
       return Array.from(this.servers.values()).map(server => ({
         id: server.id,
         hostname: server.hostname,
         ipAddress: server.ipAddress,
         provider: server.provider,
         location: server.location,
         environment: server.environment
       }));
    } catch (error) {
      console.error('Database discovery failed:', error);
      return [];
    }
  }

  /**
   * 인벤토리 데이터베이스 조회 (실제 구현 예시)
   */
  private async queryInventoryDatabase(): Promise<Partial<ServerInfo>[]> {
    // 실제 구현 시:
    // const query = `
    //   SELECT hostname, ip_address, location, environment, provider
    //   FROM server_inventory 
    //   WHERE status = 'active'
    // `;
    // const result = await db.query(query);
    // return result.rows.map(row => ({ ... }));
    
    console.log('📊 Querying inventory database...');
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
   * 개별 서버 메트릭 수집 (데이터베이스 통합 + AI 감지)
   */
  private async collectServerMetrics(server: ServerInfo): Promise<ServerMetrics> {
    // 기존 메트릭 수집 로직
    const newMetrics = await this.collectServerMetricsOriginal(server);
    
    // 시스템 상태 확인
    const systemState = useSystemStore.getState();
    
    // AI 자동 감지 (시스템이 정지 상태일 때)
          if (systemState.state === 'inactive') {
      const shouldTriggerAI = this.detectCriticalChanges(server.metrics, newMetrics);
      if (shouldTriggerAI.trigger) {
        console.log(`🚨 Critical change detected: ${shouldTriggerAI.reason}`);
        systemState.aiTriggeredActivation(shouldTriggerAI.reason);
      }
    }
    
    // 시스템이 활성화된 경우에만 데이터베이스 저장
    if (systemState.canStartDataCollection()) {
      server.metrics = newMetrics;
      await this.saveMetricsToDatabase(server);
    }
    
    return newMetrics;
  }

  /**
   * 중요한 변화 감지 (AI 자동 활성화 트리거)
   */
  private detectCriticalChanges(oldMetrics: ServerMetrics, newMetrics: ServerMetrics): { trigger: boolean; reason: string } {
    const thresholds = {
      cpu: 20,      // CPU 20% 이상 급변
      memory: 15,   // Memory 15% 이상 급변
      disk: 10,     // Disk 10% 이상 급변
      critical: {
        cpu: 90,    // CPU 90% 이상
        memory: 95, // Memory 95% 이상
        disk: 95    // Disk 95% 이상
      }
    };

    // 급격한 변화 감지
    const cpuChange = Math.abs(newMetrics.cpu - oldMetrics.cpu);
    const memoryChange = Math.abs(newMetrics.memory - oldMetrics.memory);
    const diskChange = Math.abs(newMetrics.disk - oldMetrics.disk);

    if (cpuChange >= thresholds.cpu) {
      return { trigger: true, reason: `CPU 급변 감지: ${oldMetrics.cpu}% → ${newMetrics.cpu}%` };
    }

    if (memoryChange >= thresholds.memory) {
      return { trigger: true, reason: `Memory 급변 감지: ${oldMetrics.memory}% → ${newMetrics.memory}%` };
    }

    if (diskChange >= thresholds.disk) {
      return { trigger: true, reason: `Disk 급변 감지: ${oldMetrics.disk}% → ${newMetrics.disk}%` };
    }

    // 임계값 초과 감지
    if (newMetrics.cpu >= thresholds.critical.cpu) {
      return { trigger: true, reason: `CPU 임계값 초과: ${newMetrics.cpu}%` };
    }

    if (newMetrics.memory >= thresholds.critical.memory) {
      return { trigger: true, reason: `Memory 임계값 초과: ${newMetrics.memory}%` };
    }

    if (newMetrics.disk >= thresholds.critical.disk) {
      return { trigger: true, reason: `Disk 임계값 초과: ${newMetrics.disk}%` };
    }

    // 네트워크 이상 감지
    if (newMetrics.network && oldMetrics.network) {
      const latencyIncrease = newMetrics.network.latency - oldMetrics.network.latency;
      if (latencyIncrease > 100) { // 100ms 이상 증가
        return { trigger: true, reason: `네트워크 지연 급증: +${latencyIncrease.toFixed(1)}ms` };
      }
    }

    return { trigger: false, reason: '' };
  }

  /**
   * 기존 메트릭 수집 로직 (환경별 분기)
   */
  private async collectServerMetricsOriginal(server: ServerInfo): Promise<ServerMetrics> {
    // 실제 환경에서는 실제 메트릭 수집
    if (this.config.environment === 'production') {
      return await this.collectRealMetrics(server);
    }
    
    // 개발/데모 환경에서는 시뮬레이션
    return await this.collectSimulatedMetrics(server);
  }

  /**
   * 실제 메트릭 수집 (프로덕션 환경)
   */
  private async collectRealMetrics(server: ServerInfo): Promise<ServerMetrics> {
    try {
      // 설정된 수집 방법에 따라 분기
      switch (this.config.primarySource) {
        case 'ssh':
          return await this.collectMetricsViaSSH(server);
        case 'snmp':
          return await this.collectMetricsViaSNMP(server);
        case 'agent':
          return await this.collectMetricsViaAgent(server);
        default:
          // API 또는 기타 방법
          return await this.collectMetricsViaAPI(server);
      }
    } catch (error) {
      console.error(`Failed to collect real metrics for ${server.hostname}:`, error);
      // 실패 시 기존 메트릭 유지하고 오프라인 상태로 표시
      return {
        ...server.metrics,
        uptime: server.metrics.uptime + (this.config.collectionInterval / 1000)
      };
    }
  }

  /**
   * SSH를 통한 메트릭 수집
   */
  private async collectMetricsViaSSH(server: ServerInfo): Promise<ServerMetrics> {
    console.log(`🔐 Collecting metrics via SSH from ${server.hostname}`);
    
    // 실제 구현 시:
    // const ssh = new NodeSSH();
    // await ssh.connect({
    //   host: server.ipAddress,
    //   username: this.config.realServerConfig?.sshConfig?.username,
    //   privateKey: this.config.realServerConfig?.sshConfig?.privateKeyPath
    // });
    
    // const cpuResult = await ssh.execCommand('top -bn1 | grep "Cpu(s)" | awk \'{print $2}\' | awk -F\'%\' \'{print $1}\'');
    // const memResult = await ssh.execCommand('free | grep Mem | awk \'{printf "%.2f", $3/$2 * 100.0}\'');
    // const diskResult = await ssh.execCommand('df -h / | awk \'NR==2{printf "%s", $5}\' | sed \'s/%//\'');
    
    // ssh.dispose();
    
    // 현재는 시뮬레이션으로 대체
    return await this.collectSimulatedMetrics(server);
  }

  /**
   * SNMP를 통한 메트릭 수집
   */
  private async collectMetricsViaSNMP(server: ServerInfo): Promise<ServerMetrics> {
    console.log(`📊 Collecting metrics via SNMP from ${server.hostname}`);
    
    // 실제 구현 시:
    // const snmp = require('net-snmp');
    // const session = snmp.createSession(server.ipAddress, this.config.realServerConfig?.snmpConfig?.community);
    
    // const oids = [
    //   '1.3.6.1.4.1.2021.11.9.0',  // CPU usage
    //   '1.3.6.1.4.1.2021.4.5.0',   // Memory usage
    //   '1.3.6.1.4.1.2021.9.1.9.1'  // Disk usage
    // ];
    
    // const result = await new Promise((resolve, reject) => {
    //   session.get(oids, (error, varbinds) => {
    //     if (error) reject(error);
    //     else resolve(varbinds);
    //   });
    // });
    
    // 현재는 시뮬레이션으로 대체
    return await this.collectSimulatedMetrics(server);
  }

  /**
   * 에이전트 API를 통한 메트릭 수집
   */
  private async collectMetricsViaAgent(server: ServerInfo): Promise<ServerMetrics> {
    console.log(`🤖 Collecting metrics via Agent API from ${server.hostname}`);
    
    try {
      // 실제 구현 시:
      // const response = await fetch(`${this.config.realServerConfig?.agentConfig?.apiEndpoint}/metrics/${server.id}`, {
      //   headers: {
      //     'Authorization': `Bearer ${this.config.realServerConfig?.agentConfig?.apiKey}`,
      //     'Content-Type': 'application/json'
      //   },
      //   timeout: this.config.realServerConfig?.agentConfig?.timeout
      // });
      
      // if (!response.ok) {
      //   throw new Error(`Agent API returned ${response.status}`);
      // }
      
      // const data = await response.json();
      // return this.parseAgentMetrics(data);
      
      // 현재는 시뮬레이션으로 대체
      return await this.collectSimulatedMetrics(server);
    } catch (error) {
      console.error(`Agent API failed for ${server.hostname}:`, error);
      throw error;
    }
  }

  /**
   * API를 통한 메트릭 수집
   */
  private async collectMetricsViaAPI(server: ServerInfo): Promise<ServerMetrics> {
    console.log(`📡 Collecting metrics via API from ${server.hostname}`);
    
    // 실제 구현 시 클라우드 프로바이더 API 호출
    // AWS CloudWatch, Azure Monitor, GCP Monitoring 등
    
    // 현재는 시뮬레이션으로 대체
    return await this.collectSimulatedMetrics(server);
  }

  /**
   * 시뮬레이션 메트릭 수집 (개발/데모 환경)
   */
  private async collectSimulatedMetrics(server: ServerInfo): Promise<ServerMetrics> {
    // 기존 시뮬레이션 로직
    const currentMetrics = server.metrics;
    const variation = this.config.enableRealisticVariation ? this.generateRealisticVariation(server) : { cpu: 0, memory: 0, disk: 0 };
    
    const newMetrics: ServerMetrics = {
      cpu: Math.max(0, Math.min(100, currentMetrics.cpu + variation.cpu)),
      memory: Math.max(0, Math.min(100, currentMetrics.memory + variation.memory)),
      disk: Math.max(0, Math.min(100, currentMetrics.disk + variation.disk)),
      network: this.updateNetworkMetrics(currentMetrics.network),
      processes: currentMetrics.processes + Math.floor(Math.random() * 10 - 5),
      loadAverage: this.updateLoadAverage(currentMetrics.loadAverage),
      uptime: currentMetrics.uptime + (this.config.collectionInterval / 1000), // 수집 간격만큼 증가
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

  /**
   * 절전 모드 설정
   */
  setPowerMode(mode: 'sleep' | 'active' | 'monitoring' | 'emergency'): void {
    this.powerMode = mode;
    
    switch (mode) {
      case 'sleep':
        this.config.collectionInterval = 300000; // 5분
        this.config.enableRealisticVariation = false;
        this.config.enableFailureScenarios = false;
        break;
      case 'monitoring':
        this.config.collectionInterval = 120000; // 2분
        this.config.enableRealisticVariation = true;
        this.config.enableFailureScenarios = false;
        break;
      case 'active':
        this.config.collectionInterval = 30000; // 30초
        this.config.enableRealisticVariation = true;
        this.config.enableFailureScenarios = true;
        break;
      case 'emergency':
        this.config.collectionInterval = 600000; // 10분
        this.config.enableRealisticVariation = false;
        this.config.enableFailureScenarios = false;
        break;
    }
    
    console.log(`🔋 Power mode changed to: ${mode} (interval: ${this.config.collectionInterval}ms)`);
  }

  /**
   * 데이터베이스 통합 메트릭 저장
   */
  private async saveMetricsToDatabase(server: ServerInfo): Promise<void> {
    // 클라이언트 사이드에서는 스킵
    if (typeof window !== 'undefined') {
      return;
    }

    try {
      // Dynamic import for server-side only
      const { metricsStorage } = await import('../storage');
      
      const metrics: any = {
        serverId: server.id,
        hostname: server.hostname,
        timestamp: new Date(),
        cpu: {
          usage: server.metrics.cpu,
          loadAverage: server.metrics.loadAverage[0],
          cores: 4
        },
        memory: {
          total: 8 * 1024 * 1024 * 1024, // 8GB
          used: Math.round((server.metrics.memory / 100) * 8 * 1024 * 1024 * 1024),
          usage: server.metrics.memory
        },
        disk: {
          total: 500 * 1024 * 1024 * 1024, // 500GB
          used: Math.round((server.metrics.disk / 100) * 500 * 1024 * 1024 * 1024),
          usage: server.metrics.disk
        },
        network: {
          interface: 'eth0',
          bytesReceived: server.metrics.network.bytesIn,
          bytesSent: server.metrics.network.bytesOut,
          packetsReceived: server.metrics.network.packetsIn,
          packetsSent: server.metrics.network.packetsOut,
          errorsReceived: 0,
          errorsSent: 0,
          dropReceived: 0,
          dropSent: 0
        },
        uptime: server.metrics.uptime,
        processes: server.metrics.processes,
        loadAverage: server.metrics.loadAverage,
        temperature: server.metrics.temperature,
        powerUsage: server.metrics.powerUsage,
        status: server.status,
        location: server.location,
        services: server.services.map(service => ({
          name: service.name,
          status: service.status,
          port: service.port,
          pid: service.pid,
          uptime: service.uptime || 0,
          memoryUsage: service.memoryUsage || 0,
          cpuUsage: service.cpuUsage || 0,
          restartCount: 0
        })),
        metadata: {
          location: server.location,
          environment: (server.environment === 'testing' ? 'development' : server.environment) as 'production' | 'staging' | 'development',
          provider: server.provider,
          cluster: server.cluster,
          zone: server.zone,
          instanceType: server.instanceType
        }
      };

      await metricsStorage.saveMetrics(metrics);
      console.log(`💾 Metrics saved to database for ${server.id}`);
    } catch (error) {
      console.error(`❌ Failed to save metrics to database for ${server.id}:`, error);
    }
  }

  /**
   * 데이터베이스에서 서버 목록 복원
   */
  async restoreServersFromDatabase(): Promise<void> {
    // 클라이언트 사이드에서는 스킵
    if (typeof window !== 'undefined') {
      console.log('Client-side: using simulated server data');
      return;
    }

    try {
      console.log('🔄 Restoring servers from database...');
      
      // Dynamic import for server-side only
      const { metricsStorage } = await import('../storage');
      const serverIds = await metricsStorage.getServerList();
      let restoredCount = 0;
      
      for (const serverId of serverIds) {
        const serverData = await metricsStorage.getLatestMetrics(serverId);
        if (serverData) {
          // Server 타입을 ServerInfo 타입으로 변환
          const serverInfo: ServerInfo = {
            id: serverData.id,
            hostname: serverData.name,
            ipAddress: this.generateIPAddress(serverId),
            status: serverData.status === 'online' ? 'online' : 
                   serverData.status === 'warning' ? 'warning' : 'critical',
            location: serverData.location,
            environment: 'production', // 기본값
            provider: 'onpremise', // 기본값
            tags: {},
            metrics: {
              cpu: serverData.cpu,
              memory: serverData.memory,
              disk: serverData.disk,
              network: {
                bytesIn: 0,
                bytesOut: 0,
                packetsIn: 0,
                packetsOut: 0,
                latency: 10,
                connections: 100
              },
              processes: 150,
              loadAverage: [1.0, 1.0, 1.0],
              uptime: 86400,
              temperature: 45,
              powerUsage: 200
            },
            lastUpdate: serverData.lastUpdate,
            lastSeen: serverData.lastUpdate,
            alerts: [],
            services: serverData.services || []
          };
          
          this.servers.set(serverId, serverInfo);
          restoredCount++;
        }
      }
      
      console.log(`✅ Restored ${restoredCount} servers from database`);
    } catch (error) {
      console.error('❌ Failed to restore servers from database:', error);
    }
  }

  /**
   * IP 주소 생성 (서버 ID 기반)
   */
  private generateIPAddress(serverId: string): string {
    const hash = serverId.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    const octet3 = Math.abs(hash) % 256;
    const octet4 = Math.abs(hash >> 8) % 256;
    
    return `10.0.${octet3}.${octet4}`;
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
      isAIMonitoring: this.isAIMonitoring,
      lastCollectionTime: this.lastCollectionTime,
      lastDataChangeTime: this.lastDataChangeTime,
      collectionErrors: this.collectionErrors,
      config: this.config,
      systemMode: this.isCollecting ? 'active' : this.isAIMonitoring ? 'ai-monitoring' : 'stopped'
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