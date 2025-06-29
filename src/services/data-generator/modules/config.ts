/**
 * 🎯 실제 기업 환경 기반 서버 타입 설정 및 상수
 */

import { RealWorldServerType } from './types';

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
    os: 'alpine-3.17',
    service: 'monitoring',
    port: 9090,
    version: '2.38.0',
  },
  {
    id: 'grafana',
    name: 'Grafana',
    category: 'infrastructure',
    os: 'ubuntu-20.04',
    service: 'visualization',
    port: 3000,
    version: '9.1.7',
  },
];

// 📊 서버 분포 계산 함수
export function calculateServerDistribution(
  totalServers: number
): Record<string, number> {
  return {
    web: Math.floor(totalServers * 0.25), // 25%
    app: Math.floor(totalServers * 0.3), // 30%
    database: Math.floor(totalServers * 0.2), // 20%
    infrastructure: Math.floor(totalServers * 0.25), // 25%
  };
}

// 🏷️ 카테고리별 서버 타입 가져오기
export function getServerTypesForCategory(
  category: string
): RealWorldServerType[] {
  return REALISTIC_SERVER_TYPES.filter(type => type.category === category);
}

// 🏷️ 호스트명 생성 함수
export function generateHostname(
  serverType: RealWorldServerType,
  environment: string,
  index: number
): string {
  const envPrefix =
    environment === 'production'
      ? 'prod'
      : environment === 'staging'
        ? 'stg'
        : 'dev';
  const typeShort = serverType.id.substring(0, 3);
  const indexPadded = index.toString().padStart(2, '0');

  return `${envPrefix}-${typeShort}-${indexPadded}`;
}

// 🎯 특화된 메트릭 생성 함수
export function generateSpecializedMetrics(
  serverType: RealWorldServerType
): any {
  const baseMetrics = {
    cpu: parseFloat((Math.random() * 80 + 10).toFixed(2)),
    memory: parseFloat((Math.random() * 70 + 20).toFixed(2)),
    disk: parseFloat((Math.random() * 60 + 30).toFixed(2)),
  };

  // 서버 타입별 특화 메트릭
  switch (serverType.category) {
    case 'web':
      return {
        ...baseMetrics,
        requests: Math.random() * 1000 + 100,
        activeConnections: Math.floor(Math.random() * 500 + 50),
        responseTime: Math.random() * 500 + 50,
      };

    case 'app':
      return {
        ...baseMetrics,
        threadCount: Math.floor(Math.random() * 200 + 50),
        heapUsage: parseFloat((Math.random() * 60 + 20).toFixed(2)),
        gcFrequency: Math.random() * 10 + 1,
      };

    case 'database':
      return {
        ...baseMetrics,
        connections: Math.floor(Math.random() * 100 + 10),
        queriesPerSecond: Math.random() * 500 + 50,
        lockWaitTime: Math.random() * 100,
      };

    case 'infrastructure':
      return {
        ...baseMetrics,
        networkIn: Math.random() * 100,
        networkOut: Math.random() * 100,
        processes: Math.floor(Math.random() * 50 + 10),
      };

    default:
      return baseMetrics;
  }
}

// 🔧 기본 설정 상수 - 데이터 생성과 수집 분리 전략
export const DEFAULT_CONFIG = {
  maxServers: 30,
  updateInterval: 32000, // 32초 (데이터 생성 기본값, 30-35초 범위)
  enableRealtime: true,
  serverArchitecture: 'load-balanced' as const,
  enableRedis: true,
  scenario: {
    criticalCount: 1,
    warningPercent: 0.13,
    tolerancePercent: 0.03,
  },
};

// 🔧 Redis 관련 상수
export const REDIS_CONFIG = {
  PREFIX: 'openmanager:servers:',
  CLUSTERS_PREFIX: 'openmanager:clusters:',
  APPS_PREFIX: 'openmanager:apps:',
  MIN_SAVE_INTERVAL: 5000, // 최소 5초 간격
  MAX_SAVES_PER_MINUTE: 10, // 분당 최대 10회 저장
};

// 🎭 환경별 설정
export const ENVIRONMENT_CONFIGS = {
  development: {
    logLevel: 'debug',
    enableMocking: true,
    redisConnection: 'optional',
  },
  staging: {
    logLevel: 'info',
    enableMocking: false,
    redisConnection: 'required',
  },
  production: {
    logLevel: 'warn',
    enableMocking: false,
    redisConnection: 'required',
  },
};
