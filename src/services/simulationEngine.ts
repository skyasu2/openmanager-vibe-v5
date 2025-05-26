import { 
  ServerMetrics, 
  ServerAlert, 
  FailureScenario, 
  FailureStep,
  ServerEnvironment,
  ServerRole,
  ServerStatus,
  SimulationState 
} from '../types/server';

class SimulationEngine {
  private state: SimulationState = {
    isRunning: false,
    startTime: null,
    servers: [],
    activeScenarios: [],
    dataCount: 0,
    intervalId: null
  };

  private failureScenarios: FailureScenario[] = [
    {
      id: 'disk-full-cascade',
      name: '디스크 용량 부족 연쇄 장애',
      servers: ['db-primary-01', 'db-replica-01'],
      probability: 0.15,
      steps: [
        { delay: 0, server_id: 'db-primary-01', metric: 'disk_usage', value: 95, 
          alert: { type: 'disk', severity: 'critical', message: '디스크 용량 95% 초과', resolved: false }},
        { delay: 2000, server_id: 'db-primary-01', metric: 'response_time', value: 5000,
          alert: { type: 'response_time', severity: 'warning', message: 'DB 응답 지연 발생', resolved: false }},
        { delay: 5000, server_id: 'web-server-01', metric: 'response_time', value: 8000,
          alert: { type: 'response_time', severity: 'critical', message: '웹 서비스 응답 지연', resolved: false }}
      ]
    },
    {
      id: 'memory-leak',
      name: '메모리 누수 장애',
      servers: ['api-gateway-01', 'cache-redis-01'],
      probability: 0.12,
      steps: [
        { delay: 0, server_id: 'api-gateway-01', metric: 'memory_usage', value: 88,
          alert: { type: 'memory', severity: 'warning', message: '메모리 사용량 증가', resolved: false }},
        { delay: 3000, server_id: 'api-gateway-01', metric: 'cpu_usage', value: 85,
          alert: { type: 'cpu', severity: 'warning', message: 'CPU 사용량 급증', resolved: false }},
        { delay: 6000, server_id: 'cache-redis-01', metric: 'memory_usage', value: 92,
          alert: { type: 'memory', severity: 'critical', message: 'Redis 메모리 임계치 초과', resolved: false }}
      ]
    },
    {
      id: 'network-congestion',
      name: '네트워크 병목 장애',
      servers: ['storage-nfs-01', 'backup-server-01'],
      probability: 0.08,
      steps: [
        { delay: 0, server_id: 'storage-nfs-01', metric: 'network_in', value: 950,
          alert: { type: 'network', severity: 'warning', message: '네트워크 I/O 포화', resolved: false }},
        { delay: 2000, server_id: 'backup-server-01', metric: 'response_time', value: 12000,
          alert: { type: 'response_time', severity: 'critical', message: '백업 서비스 타임아웃', resolved: false }}
      ]
    }
  ];

  private generateInitialServers(): ServerMetrics[] {
    const servers: ServerMetrics[] = [];
    
    // 온프레미스 서버 4대
    const onpremiseServers = [
      { hostname: 'web-server-01', role: 'web' as ServerRole },
      { hostname: 'db-primary-01', role: 'database' as ServerRole },
      { hostname: 'storage-nfs-01', role: 'storage' as ServerRole },
      { hostname: 'monitor-sys-01', role: 'monitoring' as ServerRole }
    ];

    // 쿠버네티스 서버 3대
    const k8sServers = [
      { hostname: 'k8s-worker-01', role: 'worker' as ServerRole },
      { hostname: 'k8s-api-01', role: 'api' as ServerRole },
      { hostname: 'k8s-ingress-01', role: 'gateway' as ServerRole }
    ];

    // AWS 서버 3대
    const awsServers = [
      { hostname: 'aws-web-lb-01', role: 'gateway' as ServerRole },
      { hostname: 'aws-db-rds-01', role: 'database' as ServerRole },
      { hostname: 'aws-cache-elasticache-01', role: 'cache' as ServerRole }
    ];

    // 나머지 10대 (무작위 구성)
    const otherServers = [
      { hostname: 'gcp-compute-01', role: 'web', env: 'gcp' },
      { hostname: 'azure-vm-01', role: 'api', env: 'azure' },
      { hostname: 'idc-storage-01', role: 'storage', env: 'idc' },
      { hostname: 'vdi-desktop-01', role: 'worker', env: 'vdi' },
      { hostname: 'db-replica-01', role: 'database', env: 'onpremise' },
      { hostname: 'api-gateway-01', role: 'gateway', env: 'kubernetes' },
      { hostname: 'cache-redis-01', role: 'cache', env: 'onpremise' },
      { hostname: 'backup-server-01', role: 'storage', env: 'idc' },
      { hostname: 'worker-queue-01', role: 'worker', env: 'aws' },
      { hostname: 'monitoring-elk-01', role: 'monitoring', env: 'gcp' }
    ];

    let serverId = 1;

    // 온프레미스 서버 생성
    onpremiseServers.forEach(server => {
      servers.push(this.createServer(
        serverId++,
        server.hostname,
        'onpremise',
        server.role
      ));
    });

    // 쿠버네티스 서버 생성
    k8sServers.forEach(server => {
      servers.push(this.createServer(
        serverId++,
        server.hostname,
        'kubernetes',
        server.role
      ));
    });

    // AWS 서버 생성
    awsServers.forEach(server => {
      servers.push(this.createServer(
        serverId++,
        server.hostname,
        'aws',
        server.role
      ));
    });

    // 기타 서버 생성
    otherServers.forEach(server => {
      servers.push(this.createServer(
        serverId++,
        server.hostname,
        (server.env as ServerEnvironment) || this.getRandomEnvironment(),
        server.role as ServerRole
      ));
    });

    return servers;
  }

  private createServer(
    id: number,
    hostname: string,
    environment: ServerEnvironment,
    role: ServerRole
  ): ServerMetrics {
    return {
      id: `server-${id.toString().padStart(2, '0')}`,
      hostname,
      environment,
      role,
      status: 'healthy',
      cpu_usage: this.randomBetween(10, 30),
      memory_usage: this.randomBetween(20, 40),
      disk_usage: this.randomBetween(15, 35),
      network_in: this.randomBetween(50, 200),
      network_out: this.randomBetween(30, 150),
      response_time: this.randomBetween(50, 200),
      uptime: Date.now() - this.randomBetween(86400000, 2592000000), // 1-30일
      last_updated: new Date().toISOString(),
      alerts: []
    };
  }

  private getRandomEnvironment(): ServerEnvironment {
    const envs: ServerEnvironment[] = ['gcp', 'azure', 'idc', 'vdi'];
    return envs[Math.floor(Math.random() * envs.length)];
  }

  private randomBetween(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  private updateServerMetrics(server: ServerMetrics): ServerMetrics {
    const now = new Date().toISOString();
    const baseVariation = 0.1; // 10% 기본 변동
    
    // 기본 메트릭 업데이트 (점진적 변화)
    const updatedServer: ServerMetrics = {
      ...server,
      cpu_usage: this.constrainValue(
        server.cpu_usage + this.randomBetween(-5, 5),
        0, 100
      ),
      memory_usage: this.constrainValue(
        server.memory_usage + this.randomBetween(-3, 3),
        0, 100
      ),
      disk_usage: this.constrainValue(
        server.disk_usage + this.randomBetween(-1, 2),
        0, 100
      ),
      network_in: this.constrainValue(
        server.network_in + this.randomBetween(-20, 20),
        0, 1000
      ),
      network_out: this.constrainValue(
        server.network_out + this.randomBetween(-15, 15),
        0, 1000
      ),
      response_time: this.constrainValue(
        server.response_time + this.randomBetween(-50, 50),
        10, 15000
      ),
      last_updated: now,
      alerts: server.alerts.filter(alert => !alert.resolved)
    };

    // 상태 결정
    updatedServer.status = this.determineServerStatus(updatedServer);

    return updatedServer;
  }

  private constrainValue(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
  }

  private determineServerStatus(server: ServerMetrics): ServerStatus {
    const criticalThresholds = {
      cpu_usage: 90,
      memory_usage: 90,
      disk_usage: 90,
      response_time: 10000
    };

    const warningThresholds = {
      cpu_usage: 80,
      memory_usage: 80,
      disk_usage: 80,
      response_time: 5000
    };

    // Critical 상태 체크
    if (server.cpu_usage >= criticalThresholds.cpu_usage ||
        server.memory_usage >= criticalThresholds.memory_usage ||
        server.disk_usage >= criticalThresholds.disk_usage ||
        server.response_time >= criticalThresholds.response_time) {
      return 'critical';
    }

    // Warning 상태 체크
    if (server.cpu_usage >= warningThresholds.cpu_usage ||
        server.memory_usage >= warningThresholds.memory_usage ||
        server.disk_usage >= warningThresholds.disk_usage ||
        server.response_time >= warningThresholds.response_time) {
      return 'warning';
    }

    return 'healthy';
  }

  private executeFailureScenario(scenario: FailureScenario): void {
    console.log(`🔥 실행 중인 장애 시나리오: ${scenario.name}`);
    
    scenario.steps.forEach((step, index) => {
      setTimeout(() => {
        const server = this.state.servers.find(s => s.hostname === step.server_id);
        if (!server) return;

        // 메트릭 업데이트
        (server as any)[step.metric] = step.value;

        // 알림 추가
        if (step.alert) {
          const alert: ServerAlert = {
            id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            server_id: server.id,
            timestamp: new Date().toISOString(),
            ...step.alert
          };
          server.alerts.push(alert);
        }

        // 서버 상태 재평가
        server.status = this.determineServerStatus(server);
        
        console.log(`⚡ ${step.server_id}: ${step.metric} = ${step.value}`);
      }, step.delay);
    });

    // 시나리오 추가
    this.state.activeScenarios.push(scenario.id);
    
    // 시나리오 완료 후 제거
    const totalDuration = Math.max(...scenario.steps.map(s => s.delay)) + 10000;
    setTimeout(() => {
      this.state.activeScenarios = this.state.activeScenarios.filter(id => id !== scenario.id);
      console.log(`✅ 장애 시나리오 완료: ${scenario.name}`);
    }, totalDuration);
  }

  public start(): void {
    if (this.state.isRunning) {
      console.warn('시뮬레이션이 이미 실행 중입니다.');
      return;
    }

    console.log('🚀 시뮬레이션 엔진 시작...');
    
    // 초기 서버 생성
    this.state.servers = this.generateInitialServers();
    this.state.isRunning = true;
    this.state.startTime = Date.now();
    this.state.dataCount = 0;

    // 5초마다 데이터 업데이트
    this.state.intervalId = setInterval(() => {
      this.updateSimulation();
    }, 5000);

    console.log(`✅ ${this.state.servers.length}대 서버 시뮬레이션 시작`);
  }

  public stop(): void {
    if (!this.state.isRunning) {
      console.warn('시뮬레이션이 실행 중이 아닙니다.');
      return;
    }

    console.log('🛑 시뮬레이션 엔진 중지...');

    if (this.state.intervalId) {
      clearInterval(this.state.intervalId);
      this.state.intervalId = null;
    }

    this.state.isRunning = false;
    this.state.startTime = null;
    this.state.activeScenarios = [];
    
    console.log(`✅ 시뮬레이션 중지 (총 ${this.state.dataCount}회 업데이트)`);
  }

  private updateSimulation(): void {
    // 모든 서버 메트릭 업데이트
    this.state.servers = this.state.servers.map(server => 
      this.updateServerMetrics(server)
    );

    // 장애 시나리오 실행 (확률 기반)
    this.failureScenarios.forEach(scenario => {
      if (Math.random() < scenario.probability / 100 && 
          !this.state.activeScenarios.includes(scenario.id)) {
        this.executeFailureScenario(scenario);
      }
    });

    this.state.dataCount++;
    
    console.log(`📊 시뮬레이션 업데이트 #${this.state.dataCount} (활성 시나리오: ${this.state.activeScenarios.length}개)`);
  }

  public getState(): SimulationState {
    return { ...this.state };
  }

  public getServers(): ServerMetrics[] {
    return [...this.state.servers];
  }

  public getServerByHostname(hostname: string): ServerMetrics | undefined {
    return this.state.servers.find(s => s.hostname === hostname);
  }

  public isRunning(): boolean {
    return this.state.isRunning;
  }
}

export const simulationEngine = new SimulationEngine(); 