/**
 * 🏗️ Real Server Data Generator - Server Types & Constants
 *
 * 목적: 1,801줄 거대 파일을 SOLID 원칙에 따라 분리
 * 시간: 2025-06-30 23:17 KST
 */

// 🏗️ 실제 기업 환경 기반 서버 타입 정의
export interface RealWorldServerType {
  id: string;
  name: string;
  category: 'web' | 'app' | 'database' | 'infrastructure';
  os: string;
  service: string;
  port: number;
  version?: string;
  runtime?: string;
}

// 🎯 실제 기술 스택 기반 서버 타입들
export const REALISTIC_SERVER_TYPES: RealWorldServerType[] = [
  // 웹서버 (25%)
  {
    id: 'nginx',
    name: 'Nginx',
    category: 'web',
    os: 'ubuntu-22.04',
    service: 'web-server',
    port: 80,
    version: '1.22.0',
  },
  {
    id: 'apache',
    name: 'Apache HTTP',
    category: 'web',
    os: 'centos-8',
    service: 'web-server',
    port: 80,
    version: '2.4.54',
  },
  {
    id: 'iis',
    name: 'IIS',
    category: 'web',
    os: 'windows-2022',
    service: 'web-server',
    port: 80,
    version: '10.0',
  },

  // 애플리케이션 서버 (30%)
  {
    id: 'nodejs',
    name: 'Node.js',
    category: 'app',
    os: 'alpine-3.16',
    service: 'app-server',
    port: 3000,
    runtime: 'node-18',
  },
  {
    id: 'springboot',
    name: 'Spring Boot',
    category: 'app',
    os: 'ubuntu-22.04',
    service: 'app-server',
    port: 8080,
    runtime: 'openjdk-17',
  },
  {
    id: 'django',
    name: 'Django',
    category: 'app',
    os: 'ubuntu-20.04',
    service: 'app-server',
    port: 8000,
    runtime: 'python-3.9',
  },
  {
    id: 'dotnet',
    name: '.NET Core',
    category: 'app',
    os: 'windows-2022',
    service: 'app-server',
    port: 5000,
    runtime: 'dotnet-6',
  },
  {
    id: 'php',
    name: 'PHP-FPM',
    category: 'app',
    os: 'debian-11',
    service: 'app-server',
    port: 9000,
    runtime: 'php-8.1',
  },

  // 데이터베이스 (20%)
  {
    id: 'mysql',
    name: 'MySQL',
    category: 'database',
    os: 'ubuntu-20.04',
    service: 'database',
    port: 3306,
    version: '8.0.30',
  },
  {
    id: 'postgresql',
    name: 'PostgreSQL',
    category: 'database',
    os: 'debian-11',
    service: 'database',
    port: 5432,
    version: '14.5',
  },
  {
    id: 'mongodb',
    name: 'MongoDB',
    category: 'database',
    os: 'rhel-8',
    service: 'database',
    port: 27017,
    version: '5.0.12',
  },
  {
    id: 'oracle',
    name: 'Oracle DB',
    category: 'database',
    os: 'oracle-linux-8',
    service: 'database',
    port: 1521,
    version: '19c',
  },
  {
    id: 'mssql',
    name: 'SQL Server',
    category: 'database',
    os: 'windows-2019',
    service: 'database',
    port: 1433,
    version: '2019',
  },

  // 인프라 서비스 (25%)
  {
    id: 'redis',
    name: 'Redis',
    category: 'infrastructure',
    os: 'alpine-3.15',
    service: 'cache',
    port: 6379,
    version: '7.0.5',
  },
  {
    id: 'rabbitmq',
    name: 'RabbitMQ',
    category: 'infrastructure',
    os: 'ubuntu-20.04',
    service: 'message-queue',
    port: 5672,
    version: '3.10.7',
  },
  {
    id: 'elasticsearch',
    name: 'Elasticsearch',
    category: 'infrastructure',
    os: 'centos-7',
    service: 'search',
    port: 9200,
    version: '8.4.3',
  },
  {
    id: 'jenkins',
    name: 'Jenkins',
    category: 'infrastructure',
    os: 'ubuntu-22.04',
    service: 'ci-cd',
    port: 8080,
    version: '2.361.4',
  },
  {
    id: 'prometheus',
    name: 'Prometheus',
    category: 'infrastructure',
    os: 'centos-7',
    service: 'monitoring',
    port: 9090,
    version: '2.38.0',
  },
  {
    id: 'kafka',
    name: 'Apache Kafka',
    category: 'infrastructure',
    os: 'debian-11',
    service: 'message-streaming',
    port: 9092,
    version: '3.2.3',
  },
];

export interface GeneratorConfig {
  maxServers?: number;
  updateInterval?: number;
  enableRealtime?: boolean;
  serverArchitecture?:
    | 'single'
    | 'primary-replica'
    | 'load-balanced'
    | 'microservices';
  enableRedis?: boolean;
  /**
   * ⚙️ 시나리오 기반 상태 분포 설정
   *  - criticalCount: 절대 개수(서버 심각)
   *  - warningPercent: 전체 서버 대비 경고 상태 비율 (0~1)
   *  - tolerancePercent: 퍼센트 오차 허용 범위 (0~1)
   */
  scenario?: {
    criticalCount: number;
    warningPercent: number; // e.g. 0.2 → 20%
    tolerancePercent?: number; // e.g. 0.03 → ±3%
  };
}

/**
 * 🎯 서버 분포 계산 유틸리티
 */
export function calculateServerDistribution(
  totalServers: number
): Record<string, number> {
  return {
    web: Math.ceil(totalServers * 0.25), // 25%
    app: Math.ceil(totalServers * 0.3), // 30%
    database: Math.ceil(totalServers * 0.2), // 20%
    infrastructure: Math.ceil(totalServers * 0.25), // 25%
  };
}

export function getServerTypesForCategory(
  category: string
): RealWorldServerType[] {
  return REALISTIC_SERVER_TYPES.filter(type => type.category === category);
}

export function generateHostname(
  serverType: RealWorldServerType,
  environment: string,
  index: number
): string {
  const envPrefix =
    {
      production: 'prod',
      staging: 'stg',
      development: 'dev',
    }[environment] || 'dev';

  return `${envPrefix}-${serverType.id}-${String(index).padStart(3, '0')}`;
}

export function generateSpecializedMetrics(
  serverType: RealWorldServerType
): any {
  const baseMetrics = {
    cpu: 20 + Math.random() * 60, // 20-80%
    memory: 30 + Math.random() * 50, // 30-80%
    disk: 40 + Math.random() * 40, // 40-80%
    network: {
      in: Math.random() * 100,
      out: Math.random() * 50,
    },
    requests: Math.floor(Math.random() * 1000),
    errors: Math.floor(Math.random() * 10),
    uptime: 99.5 + Math.random() * 0.5,
  };

  // 서버 타입별 특화 메트릭
  const customMetrics: any = {};

  switch (serverType.category) {
    case 'web':
      customMetrics.concurrent_connections = Math.floor(Math.random() * 500);
      customMetrics.response_time = 50 + Math.random() * 200;
      if (serverType.id !== 'iis') {
        customMetrics.ssl_handshakes = Math.floor(Math.random() * 100);
      }
      break;

    case 'app':
      customMetrics.thread_pool = Math.floor(Math.random() * 200);
      if (
        serverType.runtime?.includes('java') ||
        serverType.id === 'springboot'
      ) {
        customMetrics.heap_usage = 30 + Math.random() * 40;
        customMetrics.gc_time = Math.random() * 100;
      }
      break;

    case 'database':
      customMetrics.connection_pool = Math.floor(Math.random() * 100);
      customMetrics.query_time = 1 + Math.random() * 50;
      customMetrics.active_connections = Math.floor(Math.random() * 200);
      if (serverType.id === 'mysql' || serverType.id === 'postgresql') {
        customMetrics.replication_lag = Math.random() * 5;
      }
      break;

    case 'infrastructure':
      if (serverType.id === 'redis') {
        customMetrics.cache_hit_ratio = 85 + Math.random() * 15;
        customMetrics.evicted_keys = Math.floor(Math.random() * 1000);
        customMetrics.connected_clients = Math.floor(Math.random() * 100);
      } else if (serverType.id === 'rabbitmq' || serverType.id === 'kafka') {
        customMetrics.queue_depth = Math.floor(Math.random() * 10000);
        customMetrics.message_rate = Math.floor(Math.random() * 1000);
        customMetrics.consumer_count = Math.floor(Math.random() * 50);
      }
      break;
  }

  return {
    ...baseMetrics,
    customMetrics,
  };
}
