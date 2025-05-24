import { MetricCollector, ServerMetrics, ServiceStatus, CollectorConfig } from '../../types/collector';

/**
 * 더미 데이터 수집기 (임시용 - 실제 수집기로 교체 가능)
 * 
 * 이 클래스는 실제 서버 모니터링 시스템에서 다음과 같이 교체됩니다:
 * - PrometheusCollector
 * - CloudWatchCollector
 * - CustomAPICollector
 */
export class DummyCollector implements MetricCollector {
  private config: CollectorConfig;
  private servers: Map<string, DummyServerConfig> = new Map();
  
  constructor(config: CollectorConfig) {
    this.config = config;
    this.initializeServers();
  }

  /**
   * 특정 서버의 메트릭 수집
   */
  async collectMetrics(serverId: string): Promise<ServerMetrics> {
    const server = this.servers.get(serverId);
    if (!server) {
      throw new Error(`Server ${serverId} not found`);
    }

    // 실제 환경에서는 여기서 API 호출, SSH 연결, Agent 통신 등을 수행
    return this.generateRealisticMetrics(server);
  }

  /**
   * 모든 서버 목록 조회
   */
  async getServerList(): Promise<string[]> {
    return Array.from(this.servers.keys());
  }

  /**
   * 서버 온라인 상태 확인
   */
  async isServerOnline(serverId: string): Promise<boolean> {
    const server = this.servers.get(serverId);
    if (!server) return false;
    
    // 일부 서버를 오프라인으로 시뮬레이션
    return Math.random() > 0.1; // 90% 온라인 확률
  }

  /**
   * 30대 서버 초기화 (K8s + 온프레미스 + AWS 혼합)
   */
  private initializeServers(): void {
    const serverConfigs: DummyServerConfig[] = [
      // Kubernetes 클러스터 (10대)
      ...Array.from({ length: 10 }, (_, i) => ({
        id: `k8s-node-${String(i + 1).padStart(2, '0')}`,
        hostname: `k8s-node-${String(i + 1).padStart(2, '0')}`,
        provider: 'kubernetes' as const,
        location: i < 5 ? 'US East' : 'EU West',
        environment: 'production' as const,
        cluster: 'main-cluster',
        zone: `zone-${String.fromCharCode(97 + (i % 3))}`, // zone-a, zone-b, zone-c
        baseLoad: 20 + (i * 5) // 다양한 기본 부하
      })),
      
      // AWS EC2 인스턴스 (10대)
      ...Array.from({ length: 10 }, (_, i) => ({
        id: `aws-ec2-${String(i + 1).padStart(2, '0')}`,
        hostname: `ip-10-0-${i + 1}-${Math.floor(Math.random() * 255)}`,
        provider: 'aws' as const,
        location: i < 5 ? 'US West' : 'Asia Pacific',
        environment: i < 7 ? 'production' as const : 'staging' as const,
        instanceType: i < 3 ? 't3.large' : i < 7 ? 'm5.xlarge' : 'c5.2xlarge',
        baseLoad: 15 + (i * 3)
      })),
      
      // 온프레미스 서버 (10대)
      ...Array.from({ length: 10 }, (_, i) => ({
        id: `on-prem-${String(i + 1).padStart(2, '0')}`,
        hostname: `server-${String(i + 1).padStart(2, '0')}.company.local`,
        provider: 'onpremise' as const,
        location: i < 5 ? 'Seoul DC' : 'Busan DC',
        environment: 'production' as const,
        baseLoad: 30 + (i * 4)
      }))
    ];

    serverConfigs.forEach(config => {
      this.servers.set(config.id, config);
    });
  }

  /**
   * 현실적인 메트릭 데이터 생성
   */
  private generateRealisticMetrics(server: DummyServerConfig): ServerMetrics {
    const now = new Date();
    const timeVariation = Math.sin(Date.now() / 300000) * 0.3; // 5분 주기
    const randomNoise = (Math.random() - 0.5) * 0.2;
    
    // 기본 부하에 시간 변동과 노이즈 추가
    const loadFactor = Math.max(0.1, Math.min(0.95, 
      (server.baseLoad / 100) + timeVariation + randomNoise
    ));

    const cpuUsage = Math.round(loadFactor * 100);
    const memoryUsage = Math.round((loadFactor * 0.8 + 0.2) * 100);
    const diskUsage = Math.round((loadFactor * 0.3 + 0.1) * 100);

    return {
      serverId: server.id,
      hostname: server.hostname,
      timestamp: now,
      
      cpu: {
        usage: cpuUsage,
        loadAverage: [
          Number((loadFactor * 4).toFixed(2)),
          Number((loadFactor * 3.5).toFixed(2)),
          Number((loadFactor * 3).toFixed(2))
        ],
        cores: server.provider === 'kubernetes' ? 4 : 
               server.provider === 'aws' ? 8 : 16
      },
      
      memory: {
        total: server.provider === 'kubernetes' ? 8 * 1024 * 1024 * 1024 :
               server.provider === 'aws' ? 16 * 1024 * 1024 * 1024 :
               32 * 1024 * 1024 * 1024,
        used: 0, // 계산됨
        available: 0, // 계산됨
        usage: memoryUsage
      },
      
      disk: {
        total: server.provider === 'kubernetes' ? 100 * 1024 * 1024 * 1024 :
               server.provider === 'aws' ? 500 * 1024 * 1024 * 1024 :
               2 * 1024 * 1024 * 1024 * 1024,
        used: 0, // 계산됨
        available: 0, // 계산됨
        usage: diskUsage,
        iops: {
          read: Math.round(Math.random() * 1000),
          write: Math.round(Math.random() * 500)
        }
      },
      
      network: {
        interface: 'eth0',
        bytesReceived: Math.round(Math.random() * 1000000000),
        bytesSent: Math.round(Math.random() * 500000000),
        packetsReceived: Math.round(Math.random() * 1000000),
        packetsSent: Math.round(Math.random() * 800000),
        errorsReceived: Math.round(Math.random() * 10),
        errorsSent: Math.round(Math.random() * 5)
      },
      
      system: {
        os: this.getOSForProvider(server.provider),
        platform: 'linux',
        uptime: Math.round(Math.random() * 30 * 24 * 3600), // 최대 30일
        bootTime: new Date(now.getTime() - Math.random() * 30 * 24 * 3600 * 1000),
        processes: {
          total: Math.round(100 + Math.random() * 200),
          running: Math.round(10 + Math.random() * 30),
          sleeping: Math.round(80 + Math.random() * 150),
          zombie: Math.round(Math.random() * 3)
        }
      },
      
      services: this.generateServicesForProvider(server.provider),
      
      metadata: {
        location: server.location,
        environment: server.environment,
        cluster: server.cluster,
        zone: server.zone,
        instanceType: server.instanceType,
        provider: server.provider
      }
    };
  }

  private getOSForProvider(provider: string): string {
    switch (provider) {
      case 'kubernetes': return 'Ubuntu 22.04 LTS';
      case 'aws': return 'Amazon Linux 2';
      case 'onpremise': return 'CentOS 7';
      default: return 'Linux';
    }
  }

  private generateServicesForProvider(provider: string): ServiceStatus[] {
    const baseServices: ServiceStatus[] = [
      { name: 'sshd', status: 'running', port: 22, pid: 1234 },
      { name: 'systemd', status: 'running', port: 0, pid: 1 }
    ];

    switch (provider) {
      case 'kubernetes':
        return [
          ...baseServices,
          { name: 'kubelet', status: 'running', port: 10250, pid: 5678 },
          { name: 'kube-proxy', status: 'running', port: 10256, pid: 5679 },
          { name: 'containerd', status: 'running', port: 0, pid: 5680 },
          { name: 'calico-node', status: Math.random() > 0.1 ? 'running' : 'stopped', port: 0, pid: 5681 }
        ];
      
      case 'aws':
        return [
          ...baseServices,
          { name: 'amazon-cloudwatch-agent', status: 'running', port: 0, pid: 3456 },
          { name: 'awslogs', status: 'running', port: 0, pid: 3457 },
          { name: 'nginx', status: Math.random() > 0.15 ? 'running' : 'stopped', port: 80, pid: 3458 },
          { name: 'docker', status: 'running', port: 0, pid: 3459 }
        ];
      
      case 'onpremise':
        return [
          ...baseServices,
          { name: 'httpd', status: Math.random() > 0.1 ? 'running' : 'stopped', port: 80, pid: 7890 },
          { name: 'mysqld', status: 'running', port: 3306, pid: 7891 },
          { name: 'postfix', status: 'running', port: 25, pid: 7892 },
          { name: 'crond', status: 'running', port: 0, pid: 7893 }
        ];
      
      default:
        return baseServices;
    }
  }
}

interface DummyServerConfig {
  id: string;
  hostname: string;
  provider: 'kubernetes' | 'aws' | 'onpremise';
  location: string;
  environment: 'production' | 'staging' | 'development';
  cluster?: string;
  zone?: string;
  instanceType?: string;
  baseLoad: number; // 기본 부하율 (0-100)
} 