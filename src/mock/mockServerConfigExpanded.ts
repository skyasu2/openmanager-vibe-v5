/**
 * 🏢 확장된 온프레미스 서버 목업 구성 (15대)
 * 현실적인 엔터프라이즈 환경 시뮬레이션
 */

export interface MockServerInfo {
  id: string;
  hostname: string;
  type: 'web' | 'app' | 'database' | 'storage' | 'backup' | 'load-balancer' | 'cache' | 'api' | 'monitoring';
  os: string;
  service: string;
  ip: string;
  location: string;
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
  // 로드밸런서 (1대)
  {
    id: 'lb-main-01',
    hostname: 'LB-MAIN-01',
    type: 'load-balancer',
    os: 'Ubuntu 22.04 LTS',
    service: 'HAProxy 2.8',
    ip: '192.168.1.5',
    location: 'Rack A-00',
    cpu: { cores: 8, model: 'Intel Xeon E5-2620' },
    memory: { total: 16 },
    disk: { total: 200 },
    status: 'critical',
    description: '메인 로드밸런서 - 트래픽 분산 실패',
    dependencies: []
  },

  // 웹 서버 (3대)
  {
    id: 'web-prd-01',
    hostname: 'WEB-PRD-01',
    type: 'web',
    os: 'Ubuntu 22.04 LTS',
    service: 'Nginx 1.22.0',
    ip: '192.168.1.10',
    location: 'Rack A-01',
    cpu: { cores: 8, model: 'Intel Xeon E5-2680' },
    memory: { total: 16 },
    disk: { total: 500 },
    status: 'warning',
    description: '프로덕션 웹 서버 #1 - 응답 지연',
    dependencies: ['lb-main-01']
  },
  {
    id: 'web-prd-02',
    hostname: 'WEB-PRD-02',
    type: 'web',
    os: 'CentOS 8.5',
    service: 'Apache 2.4.51',
    ip: '192.168.1.11',
    location: 'Rack A-02',
    cpu: { cores: 8, model: 'Intel Xeon E5-2680' },
    memory: { total: 16 },
    disk: { total: 500 },
    status: 'online',
    description: '프로덕션 웹 서버 #2',
    dependencies: ['lb-main-01']
  },
  {
    id: 'web-prd-03',
    hostname: 'WEB-PRD-03',
    type: 'web',
    os: 'Rocky Linux 9',
    service: 'Nginx 1.22.0',
    ip: '192.168.1.12',
    location: 'Rack A-03',
    cpu: { cores: 8, model: 'Intel Xeon E5-2680' },
    memory: { total: 16 },
    disk: { total: 500 },
    status: 'online',
    description: '프로덕션 웹 서버 #3',
    dependencies: ['lb-main-01']
  },

  // API 서버 (2대)
  {
    id: 'api-prd-01',
    hostname: 'API-PRD-01',
    type: 'api',
    os: 'Ubuntu 20.04 LTS',
    service: 'Node.js 20.10 (Express)',
    ip: '192.168.1.15',
    location: 'Rack B-00',
    cpu: { cores: 12, model: 'Intel Xeon Gold 6130' },
    memory: { total: 24 },
    disk: { total: 750 },
    status: 'warning',
    description: 'REST API 서버 #1 - 높은 지연시간',
    dependencies: ['web-prd-01', 'web-prd-02', 'web-prd-03']
  },
  {
    id: 'api-prd-02',
    hostname: 'API-PRD-02',
    type: 'api',
    os: 'Ubuntu 20.04 LTS',
    service: 'Node.js 20.10 (GraphQL)',
    ip: '192.168.1.16',
    location: 'Rack B-01',
    cpu: { cores: 12, model: 'Intel Xeon Gold 6130' },
    memory: { total: 24 },
    disk: { total: 750 },
    status: 'online',
    description: 'GraphQL API 서버 #2',
    dependencies: ['web-prd-01', 'web-prd-02', 'web-prd-03']
  },

  // 애플리케이션 서버 (3대)
  {
    id: 'app-prd-01',
    hostname: 'APP-PRD-01',
    type: 'app',
    os: 'Red Hat Enterprise Linux 8.7',
    service: 'Apache Tomcat 9.0.71',
    ip: '192.168.1.20',
    location: 'Rack B-02',
    cpu: { cores: 16, model: 'Intel Xeon Gold 6130' },
    memory: { total: 32 },
    disk: { total: 1000 },
    status: 'critical',
    description: 'Java 애플리케이션 서버 #1 - 메모리 누수 심각',
    dependencies: ['api-prd-01', 'api-prd-02']
  },
  {
    id: 'app-prd-02',
    hostname: 'APP-PRD-02',
    type: 'app',
    os: 'Ubuntu 20.04 LTS',
    service: 'Python 3.11 (Django)',
    ip: '192.168.1.21',
    location: 'Rack B-03',
    cpu: { cores: 16, model: 'Intel Xeon Gold 6130' },
    memory: { total: 32 },
    disk: { total: 1000 },
    status: 'warning',
    description: 'Python 애플리케이션 서버 #2 - CPU 높음',
    dependencies: ['api-prd-01', 'api-prd-02']
  },
  {
    id: 'app-prd-03',
    hostname: 'APP-PRD-03',
    type: 'app',
    os: 'Windows Server 2019',
    service: '.NET Core 7.0 (IIS)',
    ip: '192.168.1.22',
    location: 'Rack B-04',
    cpu: { cores: 16, model: 'Intel Xeon Gold 6130' },
    memory: { total: 32 },
    disk: { total: 1000 },
    status: 'online',
    description: '.NET 애플리케이션 서버 #3',
    dependencies: ['api-prd-01', 'api-prd-02']
  },

  // 캐시 서버 (1대)
  {
    id: 'cache-prd-01',
    hostname: 'CACHE-PRD-01',
    type: 'cache',
    os: 'Alpine Linux 3.18',
    service: 'Redis 7.2',
    ip: '192.168.1.25',
    location: 'Rack C-00',
    cpu: { cores: 8, model: 'Intel Xeon Silver 4214' },
    memory: { total: 64 },
    disk: { total: 200 },
    status: 'online',
    description: '인메모리 캐시 서버',
    dependencies: ['app-prd-01', 'app-prd-02', 'app-prd-03']
  },

  // 데이터베이스 서버 (3대)
  {
    id: 'db-main-01',
    hostname: 'DB-MAIN-01',
    type: 'database',
    os: 'Ubuntu 20.04 LTS',
    service: 'PostgreSQL 15.4',
    ip: '192.168.1.30',
    location: 'Rack C-01',
    cpu: { cores: 32, model: 'AMD EPYC 7543' },
    memory: { total: 128 },
    disk: { total: 4000 },
    status: 'critical',
    description: '메인 데이터베이스 서버 - 디스크 96% 사용',
    dependencies: ['cache-prd-01']
  },
  {
    id: 'db-repl-01',
    hostname: 'DB-REPL-01',
    type: 'database',
    os: 'Ubuntu 20.04 LTS',
    service: 'PostgreSQL 15.4 (Replica)',
    ip: '192.168.1.31',
    location: 'Rack C-02',
    cpu: { cores: 32, model: 'AMD EPYC 7543' },
    memory: { total: 128 },
    disk: { total: 4000 },
    status: 'warning',
    description: '읽기 전용 복제 DB - 동기화 지연',
    dependencies: ['db-main-01']
  },
  {
    id: 'db-arch-01',
    hostname: 'DB-ARCH-01',
    type: 'database',
    os: 'Ubuntu 20.04 LTS',
    service: 'PostgreSQL 15.4 (Archive)',
    ip: '192.168.1.32',
    location: 'Rack C-03',
    cpu: { cores: 24, model: 'Intel Xeon Gold 5220' },
    memory: { total: 96 },
    disk: { total: 8000 },
    status: 'online',
    description: '아카이브 데이터베이스',
    dependencies: ['db-main-01']
  },

  // 스토리지 서버 (1대)
  {
    id: 'storage-nas-01',
    hostname: 'STORAGE-NAS-01',
    type: 'storage',
    os: 'TrueNAS Core 13.0',
    service: 'ZFS Storage Pool',
    ip: '192.168.1.40',
    location: 'Rack D-01',
    cpu: { cores: 12, model: 'Intel Xeon Silver 4214' },
    memory: { total: 96 },
    disk: { total: 50000 }, // 50TB
    status: 'warning',
    description: 'NAS 스토리지 - 백업 큐 지연',
    dependencies: ['db-main-01', 'db-repl-01', 'db-arch-01']
  },

  // 모니터링 서버 (1대)
  {
    id: 'mon-prd-01',
    hostname: 'MON-PRD-01',
    type: 'monitoring',
    os: 'Ubuntu 22.04 LTS',
    service: 'Prometheus + Grafana',
    ip: '192.168.1.50',
    location: 'Rack E-01',
    cpu: { cores: 16, model: 'Intel Xeon Gold 5220' },
    memory: { total: 32 },
    disk: { total: 2000 },
    status: 'online',
    description: '중앙 모니터링 서버',
    dependencies: [] // 모든 서버를 모니터링하지만 의존성은 없음
  }
];

// 서버별 초기 시나리오 정의 (15개 서버)
export const serverInitialStatesExpanded = {
  'lb-main-01': { scenario: 'load_balancer_failure' },
  'web-prd-01': { scenario: 'response_time_degradation' },
  'web-prd-02': { scenario: 'normal' },
  'web-prd-03': { scenario: 'normal' },
  'api-prd-01': { scenario: 'high_latency' },
  'api-prd-02': { scenario: 'normal' },
  'app-prd-01': { scenario: 'memory_leak' },
  'app-prd-02': { scenario: 'cpu_spike' },
  'app-prd-03': { scenario: 'normal' },
  'cache-prd-01': { scenario: 'normal' },
  'db-main-01': { scenario: 'disk_full' },
  'db-repl-01': { scenario: 'replication_lag' },
  'db-arch-01': { scenario: 'normal' },
  'storage-nas-01': { scenario: 'backup_delay' },
  'mon-prd-01': { scenario: 'normal' }
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
  app: '⚙️',
  cache: '⚡',
  database: '🗄️',
  storage: '💾',
  monitoring: '📊',
  backup: '📦',
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
    critical: 90,
  },
  network: {
    warning: 80,
    critical: 95,
  },
};