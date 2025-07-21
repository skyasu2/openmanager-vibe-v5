/**
 * 온프레미스 서버 목업 구성
 * 8개의 실제 엔터프라이즈 환경을 시뮬레이션
 */

export interface MockServerInfo {
  id: string;
  hostname: string;
  type: 'web' | 'app' | 'database' | 'storage' | 'backup';
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
  // 웹 서버 (2대)
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
    status: 'online',
    description: '프로덕션 웹 서버 #1 - 로드밸런서 Primary',
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
    status: 'warning',
    description: '프로덕션 웹 서버 #2 - 로드밸런서 Secondary (CPU 높음)',
  },

  // 애플리케이션 서버 (2대)
  {
    id: 'app-prd-01',
    hostname: 'APP-PRD-01',
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
  {
    id: 'app-prd-02',
    hostname: 'APP-PRD-02',
    type: 'app',
    os: 'Ubuntu 20.04 LTS',
    service: 'Node.js 18.17.1 (PM2)',
    ip: '192.168.1.21',
    location: 'Rack B-02',
    cpu: { cores: 16, model: 'Intel Xeon Gold 6130' },
    memory: { total: 32 },
    disk: { total: 1000 },
    status: 'online',
    description: 'Node.js 애플리케이션 서버 #2 - API 서비스',
  },

  // 데이터베이스 서버 (2대)
  {
    id: 'db-main-01',
    hostname: 'DB-MAIN-01',
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
    id: 'db-repl-01',
    hostname: 'DB-REPL-01',
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

  // 파일/스토리지 서버
  {
    id: 'file-nas-01',
    hostname: 'FILE-NAS-01',
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

  // 백업 서버
  {
    id: 'backup-01',
    hostname: 'BACKUP-01',
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

// 서버별 초기 상태 정의
export const serverInitialStates = {
  'web-prd-01': { scenario: 'normal' },
  'web-prd-02': { scenario: 'cpu_spike' },
  'app-prd-01': { scenario: 'memory_leak' },
  'app-prd-02': { scenario: 'normal' },
  'db-main-01': { scenario: 'disk_full' },
  'db-repl-01': { scenario: 'normal' },
  'file-nas-01': { scenario: 'backup_delay' },
  'backup-01': { scenario: 'storage_warning' },
};
