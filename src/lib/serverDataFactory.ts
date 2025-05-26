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
  // 기본 서버 템플릿
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

  /**
   * 기본 서버 목록 생성 (DataGenerator용)
   */
  static generateBaseServerList(): BaseServerConfig[] {
    return [...this.DEFAULT_SERVERS];
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
   * 서버 정보 확장 (DataGenerator → Collector 등록용)
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
      loadbalancer: 80
    };
    return portMap[type] || 3000;
  }
}

// 싱글톤 exports
export const serverDataFactory = ServerDataFactory; 