/**
 * 온프레미스 서버 목업 구성
 * 8개의 실제 엔터프라이즈 환경을 시뮬레이션
 */

export interface MockServerInfo {
  id: string;
  hostname: string;
  type:
    | 'web'
    | 'app'
    | 'database'
    | 'storage'
    | 'backup'
    | 'cache'
    | 'monitoring';
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
}

export const mockServers: MockServerInfo[] = [
  // 로드 밸런서 (1대) - NEW
  {
    id: 'lb-prod-01',
    hostname: 'LB-PROD-01',
    type: 'web',
    os: 'Ubuntu 22.04 LTS',
    service: 'HAProxy 2.8',
    ip: '192.168.1.5',
    location: 'Rack A-00',
    cpu: { cores: 8, model: 'Intel Xeon E5-2680' },
    memory: { total: 16 },
    disk: { total: 250 },
    status: 'online',
    description: '메인 로드밸런서 - 트래픽 분산',
  },

  // 웹 서버 (3대)
  {
    id: 'web-prod-01',
    hostname: 'WEB-PROD-01',
    type: 'web',
    os: 'Ubuntu 22.04 LTS',
    service: 'Nginx 1.22.0',
    ip: '192.168.1.10',
    location: 'Rack A-01',
    cpu: { cores: 8, model: 'Intel Xeon E5-2680' },
    memory: { total: 16 },
    disk: { total: 500 },
    status: 'online',
    description: '프로덕션 웹 서버 #1 - 로드밸런서 Primary',
  },
  {
    id: 'web-prod-02',
    hostname: 'WEB-PROD-02',
    type: 'web',
    os: 'CentOS 8.5',
    service: 'Apache 2.4.51',
    ip: '192.168.1.11',
    location: 'Rack A-02',
    cpu: { cores: 8, model: 'Intel Xeon E5-2680' },
    memory: { total: 16 },
    disk: { total: 500 },
    status: 'warning',
    description: '프로덕션 웹 서버 #2 - 로드밸런서 Secondary (CPU 높음)',
  },
  {
    id: 'web-prod-03',
    hostname: 'WEB-PROD-03',
    type: 'web',
    os: 'Ubuntu 22.04 LTS',
    service: 'Nginx 1.22.0',
    ip: '192.168.1.12',
    location: 'Rack A-03',
    cpu: { cores: 8, model: 'Intel Xeon E5-2680' },
    memory: { total: 16 },
    disk: { total: 500 },
    status: 'online',
    description: '프로덕션 웹 서버 #3 - 로드밸런서 Backup',
  },

  // API 서버 (2대) - NEW
  {
    id: 'api-prod-01',
    hostname: 'API-PROD-01',
    type: 'app',
    os: 'Ubuntu 20.04 LTS',
    service: 'Node.js 20.x (Express)',
    ip: '192.168.1.15',
    location: 'Rack A-04',
    cpu: { cores: 12, model: 'Intel Xeon Gold 6130' },
    memory: { total: 24 },
    disk: { total: 750 },
    status: 'online',
    description: 'RESTful API 서버 #1 - GraphQL Gateway',
  },
  {
    id: 'api-prod-02',
    hostname: 'API-PROD-02',
    type: 'app',
    os: 'Ubuntu 20.04 LTS',
    service: 'Node.js 20.x (Express)',
    ip: '192.168.1.16',
    location: 'Rack A-05',
    cpu: { cores: 12, model: 'Intel Xeon Gold 6130' },
    memory: { total: 24 },
    disk: { total: 750 },
    status: 'online',
    description: 'RESTful API 서버 #2 - GraphQL Gateway',
  },

  // 애플리케이션 서버 (3대)
  {
    id: 'app-prod-01',
    hostname: 'APP-PROD-01',
    type: 'app',
    os: 'Red Hat Enterprise Linux 8.7',
    service: 'Apache Tomcat 9.0.71',
    ip: '192.168.1.20',
    location: 'Rack B-01',
    cpu: { cores: 16, model: 'Intel Xeon Gold 6130' },
    memory: { total: 32 },
    disk: { total: 1000 },
    status: 'critical',
    description: 'Java 애플리케이션 서버 #1 - 메모리 누수 발생',
  },

  // 캐시 서버 (1대) - NEW
  {
    id: 'cache-prod-01',
    hostname: 'CACHE-PROD-01',
    type: 'cache',
    os: 'Ubuntu 22.04 LTS',
    service: 'Redis 7.2.3 Cluster',
    ip: '192.168.1.25',
    location: 'Rack B-04',
    cpu: { cores: 8, model: 'Intel Xeon Silver 4214' },
    memory: { total: 64 },
    disk: { total: 500 },
    status: 'online',
    description: 'Redis 캐시 클러스터 - 세션 및 데이터 캐싱',
  },
  {
    id: 'cache-prod-02',
    hostname: 'CACHE-PROD-02',
    type: 'cache',
    os: 'Ubuntu 22.04 LTS',
    service: 'Redis 7.2.3 Cluster (Replica)',
    ip: '192.168.1.26',
    location: 'Rack B-05',
    cpu: { cores: 8, model: 'Intel Xeon Silver 4214' },
    memory: { total: 64 },
    disk: { total: 500 },
    status: 'online',
    description: 'Redis 캐시 클러스터 복제본 - HA 구성',
  },

  // 데이터베이스 서버 (3대)
  {
    id: 'db-prod-01',
    hostname: 'DB-PROD-01',
    type: 'database',
    os: 'Ubuntu 20.04 LTS',
    service: 'PostgreSQL 14.9',
    ip: '192.168.1.30',
    location: 'Rack C-01',
    cpu: { cores: 32, model: 'AMD EPYC 7543' },
    memory: { total: 128 },
    disk: { total: 4000 },
    status: 'critical',
    description: '메인 데이터베이스 서버 - 디스크 용량 95% 초과',
  },
  {
    id: 'db-prod-02',
    hostname: 'DB-PROD-02',
    type: 'database',
    os: 'Ubuntu 20.04 LTS',
    service: 'PostgreSQL 14.9 (Replica)',
    ip: '192.168.1.31',
    location: 'Rack C-02',
    cpu: { cores: 32, model: 'AMD EPYC 7543' },
    memory: { total: 128 },
    disk: { total: 4000 },
    status: 'online',
    description: '읽기 전용 복제 데이터베이스 서버',
  },

  // 파일/스토리지 서버 - RENAMED from file-nas-01
  {
    id: 'storage-prod-01',
    hostname: 'STORAGE-PROD-01',
    type: 'storage',
    os: 'Windows Server 2019 Standard',
    service: 'SMB/CIFS File Server',
    ip: '192.168.1.40',
    location: 'Rack D-01',
    cpu: { cores: 12, model: 'Intel Xeon Silver 4214' },
    memory: { total: 64 },
    disk: { total: 20000 }, // 20TB
    status: 'warning',
    description: 'NAS 파일 서버 - 백업 작업 지연 중',
  },

  // 모니터링 서버 (1대) - NEW
  {
    id: 'monitoring-prod-01',
    hostname: 'MONITORING-PROD-01',
    type: 'monitoring',
    os: 'Ubuntu 22.04 LTS',
    service: 'Prometheus + Grafana',
    ip: '192.168.1.45',
    location: 'Rack D-02',
    cpu: { cores: 16, model: 'Intel Xeon Gold 5220' },
    memory: { total: 64 },
    disk: { total: 2000 },
    status: 'online',
    description: '통합 모니터링 서버 - 메트릭 수집 및 시각화',
  },

  // 보안 서버 (1대) - NEW
  {
    id: 'security-prod-01',
    hostname: 'SECURITY-PROD-01',
    type: 'monitoring',
    os: 'Ubuntu 22.04 LTS',
    service: 'Security Monitoring System',
    ip: '192.168.1.55',
    location: 'Rack E-02',
    cpu: { cores: 8, model: 'Intel Xeon Silver 4214' },
    memory: { total: 32 },
    disk: { total: 1000 },
    status: 'online',
    description: '보안 모니터링 서버 - 침입 탐지 및 로그 분석',
  },

  // 메시지 큐 서버 (1대) - NEW
  {
    id: 'queue-prod-01',
    hostname: 'QUEUE-PROD-01',
    type: 'app',
    os: 'Ubuntu 22.04 LTS',
    service: 'RabbitMQ 3.12',
    ip: '192.168.1.60',
    location: 'Rack E-03',
    cpu: { cores: 12, model: 'Intel Xeon Gold 5220' },
    memory: { total: 48 },
    disk: { total: 1500 },
    status: 'online',
    description: '메시지 큐 서버 - 비동기 작업 처리',
  },

  // 장애 복구 서버 (1대) - NEW
  {
    id: 'fallback-prod-01',
    hostname: 'FALLBACK-PROD-01',
    type: 'backup',
    os: 'Ubuntu 22.04 LTS',
    service: 'Disaster Recovery System',
    ip: '192.168.1.65',
    location: 'Rack E-04',
    cpu: { cores: 16, model: 'Intel Xeon Gold 5220' },
    memory: { total: 64 },
    disk: { total: 2000 },
    status: 'online',
    description: '장애 복구 서버 - DR 및 페일오버',
  },

  // 백업 서버 (1대) - Keep as 16th server
  {
    id: 'backup-prod-01',
    hostname: 'BACKUP-PROD-01',
    type: 'backup',
    os: 'Debian 11 (Bullseye)',
    service: 'Bacula 9.6.7',
    ip: '192.168.1.50',
    location: 'Rack E-01',
    cpu: { cores: 24, model: 'Intel Xeon Gold 5220' },
    memory: { total: 96 },
    disk: { total: 50000 }, // 50TB
    status: 'warning',
    description: '중앙 백업 서버 - 스토리지 용량 85% 경고',
  },
];

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

// OS별 아이콘 매핑
export const osIcons: Record<string, string> = {
  Ubuntu: '🐧',
  CentOS: '🎩',
  'Red Hat': '🎩',
  'Windows Server': '🪟',
  Debian: '🐧',
};

// 서버 타입별 아이콘 매핑
export const serverTypeIcons = {
  web: '🌐',
  app: '⚙️',
  database: '🗄️',
  storage: '💾',
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

// 서버별 초기 상태 정의 (17개 서버)
export const serverInitialStates = {
  'lb-prod-01': { scenario: 'normal' },
  'web-prod-01': { scenario: 'normal' },
  'web-prod-02': { scenario: 'cpu_spike' },
  'web-prod-03': { scenario: 'normal' },
  'api-prod-01': { scenario: 'normal' },
  'api-prod-02': { scenario: 'normal' },
  'app-prod-01': { scenario: 'memory_leak' },
  'cache-prod-01': { scenario: 'normal' },
  'cache-prod-02': { scenario: 'normal' },
  'db-prod-01': { scenario: 'disk_full' },
  'db-prod-02': { scenario: 'normal' },
  'storage-prod-01': { scenario: 'backup_delay' },
  'monitoring-prod-01': { scenario: 'normal' },
  'security-prod-01': { scenario: 'normal' },
  'queue-prod-01': { scenario: 'normal' },
  'fallback-prod-01': { scenario: 'normal' },
  'backup-prod-01': { scenario: 'storage_warning' },
};
