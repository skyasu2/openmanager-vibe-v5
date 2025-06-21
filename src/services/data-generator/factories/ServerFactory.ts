/**
 * 🏭 서버 팩토리 - 서버 인스턴스 생성 전담
 *
 * 책임:
 * - 다양한 유형의 서버 인스턴스 생성
 * - 서버 스펙 정의
 * - 역할별 서버 설정
 */

import {
  CustomEnvironmentConfig,
  ServerInstance,
  ServerRole,
  ServerType,
} from '../types/ServerTypes';

export class ServerFactory {
  private config: CustomEnvironmentConfig;

  constructor(config: CustomEnvironmentConfig) {
    this.config = config;
  }

  /**
   * 서버 인스턴스 생성
   */
  createServer(
    id: string,
    name: string,
    type: ServerType,
    location: string,
    role: ServerRole = 'standalone',
    environment: ServerInstance['environment'] = 'production'
  ): ServerInstance {
    const specs = this.generateServerSpecs(type);
    const customMetrics = this.generateCustomMetrics(type, role);

    return {
      id,
      name,
      type,
      role,
      location,
      status: 'running',
      environment,
      specs,
      metrics: {
        cpu: 0,
        memory: 0,
        disk: 0,
        network: { in: 0, out: 0 },
        requests: 0,
        errors: 0,
        uptime: Math.random() * 8760, // 0-1년
        customMetrics,
      },
      health: {
        score: 90 + Math.random() * 10,
        issues: [],
        lastCheck: new Date().toISOString(),
      },
      security: {
        level: this.config.securityLevel,
        lastSecurityScan: new Date().toISOString(),
        vulnerabilities: Math.floor(Math.random() * 3),
        patchLevel: `${new Date().getFullYear()}.${String(new Date().getMonth() + 1).padStart(2, '0')}`,
      },
    };
  }

  /**
   * 서버 타입별 스펙 생성
   */
  private generateServerSpecs(type: ServerType) {
    const baseSpecs: Record<ServerType, any> = {
      web: {
        cpu: {
          cores: 4,
          model: 'Intel Xeon E5-2686 v4',
          architecture: 'x86_64',
        },
        memory: { total: 8192, type: 'DDR4', speed: 2400 },
        disk: { total: 100, type: 'SSD', iops: 3000 },
        network: { bandwidth: 1000, latency: 5 },
      },
      api: {
        cpu: {
          cores: 8,
          model: 'Intel Xeon Platinum 8175M',
          architecture: 'x86_64',
        },
        memory: { total: 16384, type: 'DDR4', speed: 2666 },
        disk: { total: 200, type: 'NVMe', iops: 10000 },
        network: { bandwidth: 2500, latency: 3 },
      },
      database: {
        cpu: { cores: 16, model: 'AMD EPYC 7571', architecture: 'x86_64' },
        memory: { total: 65536, type: 'DDR4', speed: 3200 },
        disk: { total: 2000, type: 'NVMe', iops: 25000 },
        network: { bandwidth: 10000, latency: 1 },
      },
      cache: {
        cpu: {
          cores: 8,
          model: 'Intel Xeon Gold 6248',
          architecture: 'x86_64',
        },
        memory: { total: 32768, type: 'DDR4', speed: 2933 },
        disk: { total: 500, type: 'NVMe', iops: 15000 },
        network: { bandwidth: 5000, latency: 2 },
      },
      queue: {
        cpu: {
          cores: 4,
          model: 'Intel Xeon E5-2676 v3',
          architecture: 'x86_64',
        },
        memory: { total: 8192, type: 'DDR4', speed: 2133 },
        disk: { total: 200, type: 'SSD', iops: 5000 },
        network: { bandwidth: 1000, latency: 4 },
      },
      cdn: {
        cpu: {
          cores: 2,
          model: 'Intel Xeon E5-2666 v3',
          architecture: 'x86_64',
        },
        memory: { total: 4096, type: 'DDR4', speed: 2133 },
        disk: { total: 1000, type: 'SSD', iops: 8000 },
        network: { bandwidth: 20000, latency: 10 },
      },
      gpu: {
        cpu: { cores: 32, model: 'AMD EPYC 7742', architecture: 'x86_64' },
        memory: { total: 131072, type: 'DDR4', speed: 3200 },
        disk: { total: 1000, type: 'NVMe', iops: 30000 },
        network: { bandwidth: 25000, latency: 1 },
        gpu: { count: 8, model: 'NVIDIA V100', memory: 32768 },
      },
      storage: {
        cpu: {
          cores: 8,
          model: 'Intel Xeon Gold 5218',
          architecture: 'x86_64',
        },
        memory: { total: 32768, type: 'DDR4', speed: 2666 },
        disk: { total: 50000, type: 'HDD', iops: 500 },
        network: { bandwidth: 10000, latency: 2 },
      },
    };

    return baseSpecs[type] || baseSpecs.web;
  }

  /**
   * 타입/역할별 커스텀 메트릭 생성
   */
  private generateCustomMetrics(type: ServerType, role: ServerRole) {
    const customMetrics: any = {};

    switch (type) {
      case 'database':
        customMetrics.replication_lag =
          role === 'replica' ? Math.random() * 100 : 0;
        customMetrics.connection_pool = Math.floor(Math.random() * 200) + 50;
        break;
      case 'cache':
        customMetrics.cache_hit_ratio = 0.8 + Math.random() * 0.15;
        break;
      case 'gpu':
        customMetrics.gpu_utilization = Math.random() * 100;
        break;
      case 'storage':
        customMetrics.storage_iops = Math.floor(Math.random() * 1000) + 100;
        break;
    }

    if (this.config.specialWorkload === 'container') {
      customMetrics.container_count = Math.floor(Math.random() * 50) + 5;
    }

    return Object.keys(customMetrics).length > 0 ? customMetrics : undefined;
  }

  /**
   * 환경별 단일 서버 생성
   */
  createSingleServerEnvironment(): ServerInstance[] {
    return [
      this.createServer(
        'server-1',
        'Primary Server',
        'web',
        'Seoul-DC-1',
        'primary'
      ),
    ];
  }

  /**
   * 프라이머리-레플리카 환경 생성
   */
  createPrimaryReplicaEnvironment(): ServerInstance[] {
    const servers: ServerInstance[] = [];

    // 프라이머리 서버들
    servers.push(
      this.createServer(
        'web-primary',
        'Web Primary',
        'web',
        'Seoul-DC-1',
        'primary'
      ),
      this.createServer(
        'api-primary',
        'API Primary',
        'api',
        'Seoul-DC-1',
        'primary'
      ),
      this.createServer(
        'db-primary',
        'DB Primary',
        'database',
        'Seoul-DC-1',
        'primary'
      )
    );

    // 레플리카 서버들
    servers.push(
      this.createServer(
        'web-replica-1',
        'Web Replica 1',
        'web',
        'Busan-DC-1',
        'replica'
      ),
      this.createServer(
        'web-replica-2',
        'Web Replica 2',
        'web',
        'Daegu-DC-1',
        'replica'
      ),
      this.createServer(
        'api-replica-1',
        'API Replica 1',
        'api',
        'Busan-DC-1',
        'replica'
      ),
      this.createServer(
        'db-replica-1',
        'DB Replica 1',
        'database',
        'Busan-DC-1',
        'replica'
      ),
      this.createServer(
        'db-replica-2',
        'DB Replica 2',
        'database',
        'Daegu-DC-1',
        'replica'
      )
    );

    return servers;
  }

  /**
   * 로드밸런스 환경 생성
   */
  createLoadBalancedEnvironment(): ServerInstance[] {
    const servers: ServerInstance[] = [];

    // 로드밸런서
    servers.push(
      this.createServer(
        'lb-primary',
        'Load Balancer Primary',
        'web',
        'Seoul-DC-1',
        'primary'
      ),
      this.createServer(
        'lb-secondary',
        'Load Balancer Secondary',
        'web',
        'Busan-DC-1',
        'primary'
      )
    );

    // 웹 서버 클러스터
    for (let i = 1; i <= 6; i++) {
      const location = i <= 3 ? 'Seoul-DC-1' : 'Busan-DC-1';
      servers.push(
        this.createServer(
          `web-${i}`,
          `Web Server ${i}`,
          'web',
          location,
          'worker'
        )
      );
    }

    // API 서버 클러스터
    for (let i = 1; i <= 4; i++) {
      const location = i <= 2 ? 'Seoul-DC-1' : 'Busan-DC-1';
      servers.push(
        this.createServer(
          `api-${i}`,
          `API Server ${i}`,
          'api',
          location,
          'worker'
        )
      );
    }

    // 공유 서비스
    servers.push(
      this.createServer(
        'cache-cluster',
        'Redis Cluster',
        'cache',
        'Seoul-DC-1',
        'primary'
      ),
      this.createServer(
        'queue-primary',
        'Message Queue',
        'queue',
        'Seoul-DC-1',
        'primary'
      ),
      this.createServer(
        'db-primary',
        'Database Primary',
        'database',
        'Seoul-DC-1',
        'primary'
      ),
      this.createServer(
        'db-replica-1',
        'Database Replica 1',
        'database',
        'Busan-DC-1',
        'replica'
      ),
      this.createServer(
        'db-replica-2',
        'Database Replica 2',
        'database',
        'Daegu-DC-1',
        'replica'
      )
    );

    return servers;
  }

  /**
   * 마이크로서비스 환경 생성
   */
  createMicroservicesEnvironment(): ServerInstance[] {
    const servers: ServerInstance[] = [];

    // 게이트웨이 및 로드밸런서
    servers.push(
      this.createServer(
        'api-gateway-1',
        'API Gateway 1',
        'web',
        'Seoul-DC-1',
        'primary'
      ),
      this.createServer(
        'api-gateway-2',
        'API Gateway 2',
        'web',
        'Busan-DC-1',
        'primary'
      )
    );

    // 마이크로서비스들
    const services = [
      'user-service',
      'order-service',
      'payment-service',
      'inventory-service',
      'notification-service',
      'analytics-service',
      'auth-service',
      'search-service',
    ];

    services.forEach((service, index) => {
      const location = index % 2 === 0 ? 'Seoul-DC-1' : 'Busan-DC-1';
      servers.push(
        this.createServer(
          `${service}-1`,
          `${service.replace('-', ' ').toUpperCase()} 1`,
          'api',
          location,
          'worker'
        ),
        this.createServer(
          `${service}-2`,
          `${service.replace('-', ' ').toUpperCase()} 2`,
          'api',
          location,
          'worker'
        )
      );
    });

    // 데이터 레이어
    servers.push(
      this.createServer(
        'user-db',
        'User Database',
        'database',
        'Seoul-DC-1',
        'primary'
      ),
      this.createServer(
        'order-db',
        'Order Database',
        'database',
        'Seoul-DC-1',
        'primary'
      ),
      this.createServer(
        'inventory-db',
        'Inventory Database',
        'database',
        'Busan-DC-1',
        'primary'
      ),
      this.createServer(
        'analytics-db',
        'Analytics Database',
        'database',
        'Busan-DC-1',
        'primary'
      )
    );

    // 공유 인프라
    servers.push(
      this.createServer(
        'redis-cluster-1',
        'Redis Cluster 1',
        'cache',
        'Seoul-DC-1',
        'primary'
      ),
      this.createServer(
        'redis-cluster-2',
        'Redis Cluster 2',
        'cache',
        'Busan-DC-1',
        'primary'
      ),
      this.createServer(
        'message-broker',
        'Message Broker',
        'queue',
        'Seoul-DC-1',
        'primary'
      ),
      this.createServer(
        'cdn-edge-1',
        'CDN Edge 1',
        'cdn',
        'Seoul-DC-1',
        'worker'
      ),
      this.createServer(
        'cdn-edge-2',
        'CDN Edge 2',
        'cdn',
        'Busan-DC-1',
        'worker'
      )
    );

    return servers;
  }
}
