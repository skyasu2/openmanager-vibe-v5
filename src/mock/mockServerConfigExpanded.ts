/**
 * 🏢 확장된 온프레미스 서버 목업 구성 (15대)
 * SSOT: cloud-run/ai-engine/data/hourly-data/*.json
 * 현실적인 엔터프라이즈 환경 시뮬레이션
 *
 * 동기화: 2025-12-29
 */

export interface MockServerInfo {
  id: string;
  hostname: string;
  type:
    | 'web'
    | 'api'
    | 'database'
    | 'storage'
    | 'backup'
    | 'load-balancer'
    | 'cache'
    | 'monitor'
    | 'security';
  os: string;
  service: string;
  applications: {
    name: string;
    version: string;
    port?: number;
    status: 'running' | 'stopped';
  }[];
  ip: string;
  location: string;
  environment: 'production' | 'staging';
  cpu: {
    cores: number;
    model: string;
  };
  memory: {
    total: number; // GB
  };
  disk: {
    total: number; // GB
  };
  status: 'online' | 'warning' | 'critical';
  description: string;
  dependencies?: string[]; // 의존 서버 ID
}

export const mockServersExpanded: MockServerInfo[] = [
  // ============================================================================
  // 로드밸런서 (1대)
  // ============================================================================
  {
    id: 'lb-main-01',
    hostname: 'lb-main-01.example.com',
    type: 'load-balancer',
    os: 'Debian 12 (Bookworm)',
    service: 'HAProxy 2.8.3',
    applications: [
      { name: 'HAProxy', version: '2.8.3', port: 80, status: 'running' },
      { name: 'HAProxy SSL', version: '2.8.3', port: 443, status: 'running' },
      {
        name: 'HAProxy Stats',
        version: '2.8.3',
        port: 8404,
        status: 'running',
      },
      { name: 'Keepalived', version: '2.2.8', status: 'running' },
    ],
    ip: '192.168.1.111',
    location: 'us-east-1',
    environment: 'production',
    cpu: { cores: 4, model: 'Intel Xeon E5-2680' },
    memory: { total: 8 },
    disk: { total: 100 },
    status: 'online',
    description: '메인 로드밸런서 - 트래픽 분산',
    dependencies: [],
  },

  // ============================================================================
  // 웹 서버 (3대)
  // ============================================================================
  {
    id: 'web-prd-01',
    hostname: 'web-prd-01.example.com',
    type: 'web',
    os: 'Ubuntu 22.04.3 LTS',
    service: 'Nginx 1.24.0 + Node.js 20.10.0',
    applications: [
      { name: 'Nginx', version: '1.24.0', port: 80, status: 'running' },
      { name: 'Nginx SSL', version: '1.24.0', port: 443, status: 'running' },
      { name: 'Node.js', version: '20.10.0', port: 3000, status: 'running' },
    ],
    ip: '192.168.1.100',
    location: 'us-east-1a',
    environment: 'production',
    cpu: { cores: 4, model: 'Intel Xeon E5-2680' },
    memory: { total: 8 },
    disk: { total: 200 },
    status: 'online',
    description: '프로덕션 웹 서버 #1',
    dependencies: ['lb-main-01'],
  },
  {
    id: 'web-prd-02',
    hostname: 'web-prd-02.example.com',
    type: 'web',
    os: 'Ubuntu 22.04.3 LTS',
    service: 'Nginx 1.24.0 + Node.js 20.10.0',
    applications: [
      { name: 'Nginx', version: '1.24.0', port: 80, status: 'running' },
      { name: 'Nginx SSL', version: '1.24.0', port: 443, status: 'running' },
      { name: 'Node.js', version: '20.10.0', port: 3000, status: 'running' },
    ],
    ip: '192.168.1.101',
    location: 'us-east-1b',
    environment: 'production',
    cpu: { cores: 4, model: 'Intel Xeon E5-2680' },
    memory: { total: 8 },
    disk: { total: 200 },
    status: 'online',
    description: '프로덕션 웹 서버 #2',
    dependencies: ['lb-main-01'],
  },
  {
    id: 'web-stg-01',
    hostname: 'web-stg-01.example.com',
    type: 'web',
    os: 'Ubuntu 22.04.3 LTS',
    service: 'Nginx 1.24.0 + Node.js 20.10.0',
    applications: [
      { name: 'Nginx', version: '1.24.0', port: 80, status: 'running' },
      { name: 'Node.js', version: '20.10.0', port: 3000, status: 'running' },
    ],
    ip: '192.168.1.102',
    location: 'us-west-1a',
    environment: 'staging',
    cpu: { cores: 2, model: 'Intel Xeon E5-2680' },
    memory: { total: 4 },
    disk: { total: 100 },
    status: 'online',
    description: '스테이징 웹 서버',
    dependencies: [],
  },

  // ============================================================================
  // API 서버 (2대)
  // ============================================================================
  {
    id: 'api-prd-01',
    hostname: 'api-prd-01.example.com',
    type: 'api',
    os: 'Ubuntu 22.04.3 LTS',
    service: 'Node.js 20.10.0 + PM2 5.3.0',
    applications: [
      { name: 'Node.js', version: '20.10.0', port: 4000, status: 'running' },
      { name: 'PM2', version: '5.3.0', status: 'running' },
      { name: 'Express.js', version: '4.18.2', port: 4000, status: 'running' },
    ],
    ip: '192.168.1.103',
    location: 'us-east-1a',
    environment: 'production',
    cpu: { cores: 6, model: 'Intel Xeon Gold 6130' },
    memory: { total: 16 },
    disk: { total: 300 },
    status: 'online',
    description: 'REST API 서버 #1',
    dependencies: ['web-prd-01', 'web-prd-02'],
  },
  {
    id: 'api-prd-02',
    hostname: 'api-prd-02.example.com',
    type: 'api',
    os: 'Ubuntu 22.04.3 LTS',
    service: 'Node.js 20.10.0 + PM2 5.3.0',
    applications: [
      { name: 'Node.js', version: '20.10.0', port: 4000, status: 'running' },
      { name: 'PM2', version: '5.3.0', status: 'running' },
      { name: 'Express.js', version: '4.18.2', port: 4000, status: 'running' },
    ],
    ip: '192.168.1.104',
    location: 'us-east-1b',
    environment: 'production',
    cpu: { cores: 6, model: 'Intel Xeon Gold 6130' },
    memory: { total: 16 },
    disk: { total: 300 },
    status: 'online',
    description: 'REST API 서버 #2',
    dependencies: ['web-prd-01', 'web-prd-02'],
  },

  // ============================================================================
  // 데이터베이스 서버 (2대)
  // ============================================================================
  {
    id: 'db-main-01',
    hostname: 'db-main-01.example.com',
    type: 'database',
    os: 'Rocky Linux 9.3',
    service: 'PostgreSQL 15.4 + pgBouncer 1.21.0',
    applications: [
      { name: 'PostgreSQL', version: '15.4', port: 5432, status: 'running' },
      { name: 'pgBouncer', version: '1.21.0', port: 6432, status: 'running' },
    ],
    ip: '192.168.1.105',
    location: 'us-east-1a',
    environment: 'production',
    cpu: { cores: 8, model: 'AMD EPYC 7543' },
    memory: { total: 32 },
    disk: { total: 500 },
    status: 'online',
    description: '메인 PostgreSQL 데이터베이스 (Primary)',
    dependencies: ['cache-redis-01'],
  },
  {
    id: 'db-repl-01',
    hostname: 'db-repl-01.example.com',
    type: 'database',
    os: 'Rocky Linux 9.3',
    service: 'PostgreSQL 15.4 (Streaming Replica)',
    applications: [
      { name: 'PostgreSQL', version: '15.4', port: 5432, status: 'running' },
      { name: 'PostgreSQL Replica', version: '15.4', status: 'running' },
    ],
    ip: '192.168.1.106',
    location: 'us-east-1b',
    environment: 'production',
    cpu: { cores: 8, model: 'AMD EPYC 7543' },
    memory: { total: 32 },
    disk: { total: 500 },
    status: 'online',
    description: '읽기 전용 복제 데이터베이스 (Replica)',
    dependencies: ['db-main-01'],
  },

  // ============================================================================
  // 캐시 서버 (2대)
  // ============================================================================
  {
    id: 'cache-redis-01',
    hostname: 'cache-redis-01.example.com',
    type: 'cache',
    os: 'Debian 12 (Bookworm)',
    service: 'Redis 7.2.3 + Sentinel',
    applications: [
      { name: 'Redis', version: '7.2.3', port: 6379, status: 'running' },
      {
        name: 'Redis Sentinel',
        version: '7.2.3',
        port: 26379,
        status: 'running',
      },
    ],
    ip: '192.168.1.107',
    location: 'us-east-1a',
    environment: 'production',
    cpu: { cores: 4, model: 'Intel Xeon Silver 4214' },
    memory: { total: 16 },
    disk: { total: 100 },
    status: 'online',
    description: 'Redis 캐시 서버 (Primary)',
    dependencies: ['api-prd-01', 'api-prd-02'],
  },
  {
    id: 'cache-redis-02',
    hostname: 'cache-redis-02.example.com',
    type: 'cache',
    os: 'Debian 12 (Bookworm)',
    service: 'Redis 7.2.3 + Sentinel',
    applications: [
      { name: 'Redis', version: '7.2.3', port: 6379, status: 'running' },
      {
        name: 'Redis Sentinel',
        version: '7.2.3',
        port: 26379,
        status: 'running',
      },
    ],
    ip: '192.168.1.108',
    location: 'us-east-1b',
    environment: 'production',
    cpu: { cores: 4, model: 'Intel Xeon Silver 4214' },
    memory: { total: 16 },
    disk: { total: 100 },
    status: 'online',
    description: 'Redis 캐시 서버 (Replica/Failover)',
    dependencies: ['cache-redis-01'],
  },

  // ============================================================================
  // 스토리지 서버 (2대)
  // ============================================================================
  {
    id: 'storage-nas-01',
    hostname: 'storage-nas-01.example.com',
    type: 'storage',
    os: 'TrueNAS SCALE 23.10',
    service: 'NFS Server 4.2 + Samba 4.18.0',
    applications: [
      { name: 'NFS Server', version: '4.2', port: 2049, status: 'running' },
      { name: 'Samba', version: '4.18.0', port: 445, status: 'running' },
    ],
    ip: '192.168.1.109',
    location: 'us-east-1a',
    environment: 'production',
    cpu: { cores: 4, model: 'Intel Xeon Silver 4214' },
    memory: { total: 8 },
    disk: { total: 2000 },
    status: 'online',
    description: 'NAS 파일 스토리지',
    dependencies: ['db-main-01', 'db-repl-01'],
  },
  {
    id: 'storage-s3-gateway',
    hostname: 'storage-s3.example.com',
    type: 'storage',
    os: 'Ubuntu 22.04.3 LTS',
    service: 'MinIO 2024.01.01',
    applications: [
      { name: 'MinIO', version: '2024.01.01', port: 9000, status: 'running' },
      {
        name: 'MinIO Console',
        version: '2024.01.01',
        port: 9001,
        status: 'running',
      },
    ],
    ip: '192.168.1.110',
    location: 'us-east-1a',
    environment: 'production',
    cpu: { cores: 2, model: 'Intel Xeon Silver 4214' },
    memory: { total: 4 },
    disk: { total: 1000 },
    status: 'online',
    description: 'S3 호환 오브젝트 스토리지 게이트웨이',
    dependencies: [],
  },

  // ============================================================================
  // 모니터링 서버 (1대)
  // ============================================================================
  {
    id: 'monitor-01',
    hostname: 'monitor-01.example.com',
    type: 'monitor',
    os: 'Ubuntu 22.04.3 LTS',
    service: 'Prometheus + Grafana + Alertmanager',
    applications: [
      { name: 'Prometheus', version: '2.48.0', port: 9090, status: 'running' },
      { name: 'Grafana', version: '10.2.0', port: 3000, status: 'running' },
      {
        name: 'Alertmanager',
        version: '0.26.0',
        port: 9093,
        status: 'running',
      },
      {
        name: 'Node Exporter',
        version: '1.7.0',
        port: 9100,
        status: 'running',
      },
    ],
    ip: '192.168.1.112',
    location: 'us-east-1a',
    environment: 'production',
    cpu: { cores: 4, model: 'Intel Xeon Gold 5220' },
    memory: { total: 16 },
    disk: { total: 500 },
    status: 'online',
    description: '중앙 모니터링 서버',
    dependencies: [],
  },

  // ============================================================================
  // 백업 서버 (1대)
  // ============================================================================
  {
    id: 'backup-server-01',
    hostname: 'backup-server-01.example.com',
    type: 'backup',
    os: 'Rocky Linux 9.3',
    service: 'Borgbackup + rsync + Cron',
    applications: [
      { name: 'rsync', version: '3.2.7', status: 'running' },
      { name: 'Cron', version: '3.0', status: 'running' },
      { name: 'Borgbackup', version: '1.2.6', status: 'running' },
    ],
    ip: '192.168.1.113',
    location: 'us-east-1a',
    environment: 'production',
    cpu: { cores: 4, model: 'Intel Xeon Silver 4214' },
    memory: { total: 8 },
    disk: { total: 4000 },
    status: 'online',
    description: '백업 및 아카이빙 서버',
    dependencies: ['db-main-01', 'storage-nas-01'],
  },

  // ============================================================================
  // 보안 게이트웨이 (1대)
  // ============================================================================
  {
    id: 'security-gateway-01',
    hostname: 'security-gateway-01.example.com',
    type: 'security',
    os: 'Debian 12 (Bookworm)',
    service: 'ModSecurity WAF + Fail2ban + OpenVPN',
    applications: [
      {
        name: 'ModSecurity WAF',
        version: '3.0.10',
        port: 80,
        status: 'running',
      },
      { name: 'Fail2ban', version: '1.0.2', status: 'running' },
      { name: 'OpenVPN', version: '2.6.0', port: 1194, status: 'running' },
      { name: 'ClamAV', version: '1.2.0', status: 'running' },
    ],
    ip: '192.168.1.114',
    location: 'us-east-1',
    environment: 'production',
    cpu: { cores: 4, model: 'Intel Xeon E5-2680' },
    memory: { total: 8 },
    disk: { total: 200 },
    status: 'online',
    description: '보안 게이트웨이 (WAF, VPN, IDS)',
    dependencies: [],
  },
];

// 서버별 초기 시나리오 정의 (15개 서버)
export const serverInitialStatesExpanded = {
  // Load Balancer
  'lb-main-01': { scenario: 'normal' },

  // Web Servers
  'web-prd-01': { scenario: 'normal' },
  'web-prd-02': { scenario: 'normal' },
  'web-stg-01': { scenario: 'normal' },

  // API Servers
  'api-prd-01': { scenario: 'normal' },
  'api-prd-02': { scenario: 'normal' },

  // Database Servers
  'db-main-01': { scenario: 'normal' },
  'db-repl-01': { scenario: 'normal' },

  // Cache Servers
  'cache-redis-01': { scenario: 'normal' },
  'cache-redis-02': { scenario: 'normal' },

  // Storage Servers
  'storage-nas-01': { scenario: 'normal' },
  'storage-s3-gateway': { scenario: 'normal' },

  // Infrastructure Servers
  'monitor-01': { scenario: 'normal' },
  'backup-server-01': { scenario: 'normal' },
  'security-gateway-01': { scenario: 'normal' },
};

// 서버 상태별 색상 및 아이콘 매핑
export const serverStatusConfig = {
  online: {
    color: 'text-green-700',
    bgColor: 'bg-green-100',
    borderColor: 'border-green-400',
    icon: '✓',
    label: '정상',
  },
  warning: {
    color: 'text-amber-700',
    bgColor: 'bg-amber-100',
    borderColor: 'border-amber-400',
    icon: '⚠',
    label: '경고',
  },
  critical: {
    color: 'text-red-700',
    bgColor: 'bg-red-100',
    borderColor: 'border-red-400',
    icon: '✕',
    label: '심각',
  },
};

// 서버 타입별 아이콘 매핑
export const serverTypeIcons = {
  'load-balancer': '⚖️',
  web: '🌐',
  api: '🔌',
  cache: '⚡',
  database: '🗄️',
  storage: '💾',
  monitor: '📊',
  backup: '📦',
  security: '🔒',
};

// 서버 타입별 메트릭 임계값
export const metricThresholds = {
  cpu: {
    warning: 70,
    critical: 85,
  },
  memory: {
    warning: 75,
    critical: 90,
  },
  disk: {
    warning: 80,
    critical: 95,
  },
  network: {
    warning: 70,
    critical: 90,
  },
};

// 서버 ID로 서버 정보 조회
export function getServerById(id: string): MockServerInfo | undefined {
  return mockServersExpanded.find((server) => server.id === id);
}

// 서버 타입별 그룹화
export function getServersByType(
  type: MockServerInfo['type']
): MockServerInfo[] {
  return mockServersExpanded.filter((server) => server.type === type);
}

// 환경별 서버 그룹화
export function getServersByEnvironment(
  env: 'production' | 'staging'
): MockServerInfo[] {
  return mockServersExpanded.filter((server) => server.environment === env);
}
