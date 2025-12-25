/**
 * 한국 데이터센터 기반 서버 목업 구성
 * 15개 서버 - 서울(ICN) 메인 + 부산(PUS) DR
 *
 * 서버 존:
 * - ICN: 인천/서울 (메인 데이터센터)
 * - PUS: 부산 (DR 데이터센터)
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
    | 'monitoring'
    | 'loadbalancer';
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
  // ============================================================================
  // 🌐 웹서버 (Nginx) - 3대
  // ============================================================================
  {
    id: 'web-nginx-icn-01',
    hostname: 'web-nginx-icn-01',
    type: 'web',
    os: 'Ubuntu 22.04 LTS',
    service: 'Nginx 1.24.0',
    ip: '10.1.1.10',
    location: 'Seoul-ICN-AZ1',
    cpu: { cores: 8, model: 'Intel Xeon Gold 6330' },
    memory: { total: 16 },
    disk: { total: 500 },
    status: 'online',
    description: '서울 메인 Nginx 웹서버 #1',
  },
  {
    id: 'web-nginx-icn-02',
    hostname: 'web-nginx-icn-02',
    type: 'web',
    os: 'Ubuntu 22.04 LTS',
    service: 'Nginx 1.24.0',
    ip: '10.1.2.10',
    location: 'Seoul-ICN-AZ2',
    cpu: { cores: 8, model: 'Intel Xeon Gold 6330' },
    memory: { total: 16 },
    disk: { total: 500 },
    status: 'online',
    description: '서울 Nginx 웹서버 #2 (AZ2)',
  },
  {
    id: 'web-nginx-pus-01',
    hostname: 'web-nginx-pus-01',
    type: 'web',
    os: 'Ubuntu 22.04 LTS',
    service: 'Nginx 1.24.0',
    ip: '10.2.1.10',
    location: 'Busan-PUS-DR',
    cpu: { cores: 4, model: 'Intel Xeon Silver 4316' },
    memory: { total: 8 },
    disk: { total: 250 },
    status: 'online',
    description: '부산 DR Nginx 웹서버',
  },

  // ============================================================================
  // 📱 API/WAS 서버 (Spring Boot / Node.js) - 3대
  // ============================================================================
  {
    id: 'api-was-icn-01',
    hostname: 'api-was-icn-01',
    type: 'app',
    os: 'Rocky Linux 9.2',
    service: 'Spring Boot 3.2 (JDK 21)',
    ip: '10.1.1.20',
    location: 'Seoul-ICN-AZ1',
    cpu: { cores: 16, model: 'Intel Xeon Gold 6330' },
    memory: { total: 32 },
    disk: { total: 500 },
    status: 'online',
    description: '서울 메인 WAS 서버 #1',
  },
  {
    id: 'api-was-icn-02',
    hostname: 'api-was-icn-02',
    type: 'app',
    os: 'Rocky Linux 9.2',
    service: 'Spring Boot 3.2 (JDK 21)',
    ip: '10.1.2.20',
    location: 'Seoul-ICN-AZ2',
    cpu: { cores: 16, model: 'Intel Xeon Gold 6330' },
    memory: { total: 32 },
    disk: { total: 500 },
    status: 'online',
    description: '서울 WAS 서버 #2 (AZ2)',
  },
  {
    id: 'api-was-pus-01',
    hostname: 'api-was-pus-01',
    type: 'app',
    os: 'Rocky Linux 9.2',
    service: 'Spring Boot 3.2 (JDK 21)',
    ip: '10.2.1.20',
    location: 'Busan-PUS-DR',
    cpu: { cores: 8, model: 'Intel Xeon Silver 4316' },
    memory: { total: 16 },
    disk: { total: 250 },
    status: 'online',
    description: '부산 DR WAS 서버',
  },

  // ============================================================================
  // 🗄️ 데이터베이스 (MySQL) - 3대
  // ============================================================================
  {
    id: 'db-mysql-icn-primary',
    hostname: 'db-mysql-icn-primary',
    type: 'database',
    os: 'Oracle Linux 8.8',
    service: 'MySQL 8.0.35 (Primary)',
    ip: '10.1.1.30',
    location: 'Seoul-ICN-AZ1',
    cpu: { cores: 32, model: 'Intel Xeon Gold 6348' },
    memory: { total: 128 },
    disk: { total: 2000 },
    status: 'online',
    description: '서울 MySQL Primary (Master)',
  },
  {
    id: 'db-mysql-icn-replica',
    hostname: 'db-mysql-icn-replica',
    type: 'database',
    os: 'Oracle Linux 8.8',
    service: 'MySQL 8.0.35 (Replica)',
    ip: '10.1.2.30',
    location: 'Seoul-ICN-AZ2',
    cpu: { cores: 32, model: 'Intel Xeon Gold 6348' },
    memory: { total: 128 },
    disk: { total: 2000 },
    status: 'online',
    description: '서울 MySQL Replica (Slave, AZ2)',
  },
  {
    id: 'db-mysql-pus-dr',
    hostname: 'db-mysql-pus-dr',
    type: 'database',
    os: 'Oracle Linux 8.8',
    service: 'MySQL 8.0.35 (DR)',
    ip: '10.2.1.30',
    location: 'Busan-PUS-DR',
    cpu: { cores: 16, model: 'Intel Xeon Silver 4316' },
    memory: { total: 64 },
    disk: { total: 1000 },
    status: 'online',
    description: '부산 MySQL DR (비동기 복제)',
  },

  // ============================================================================
  // 💾 캐시 (Redis Cluster) - 2대
  // ============================================================================
  {
    id: 'cache-redis-icn-01',
    hostname: 'cache-redis-icn-01',
    type: 'cache',
    os: 'Debian 12',
    service: 'Redis 7.2 Cluster (Master)',
    ip: '10.1.1.40',
    location: 'Seoul-ICN-AZ1',
    cpu: { cores: 8, model: 'Intel Xeon Gold 6330' },
    memory: { total: 64 },
    disk: { total: 200 },
    status: 'online',
    description: '서울 Redis 클러스터 Master #1',
  },
  {
    id: 'cache-redis-icn-02',
    hostname: 'cache-redis-icn-02',
    type: 'cache',
    os: 'Debian 12',
    service: 'Redis 7.2 Cluster (Replica)',
    ip: '10.1.2.40',
    location: 'Seoul-ICN-AZ2',
    cpu: { cores: 8, model: 'Intel Xeon Gold 6330' },
    memory: { total: 64 },
    disk: { total: 200 },
    status: 'online',
    description: '서울 Redis 클러스터 Replica (AZ2)',
  },

  // ============================================================================
  // 📦 스토리지 (NFS / S3 Gateway) - 2대
  // ============================================================================
  {
    id: 'storage-nfs-icn-01',
    hostname: 'storage-nfs-icn-01',
    type: 'storage',
    os: 'Rocky Linux 9.2',
    service: 'NFS Server (NetApp ONTAP)',
    ip: '10.1.1.50',
    location: 'Seoul-ICN-AZ1',
    cpu: { cores: 8, model: 'Intel Xeon Silver 4316' },
    memory: { total: 32 },
    disk: { total: 10000 },
    status: 'online',
    description: '서울 NFS 스토리지 서버',
  },
  {
    id: 'storage-s3gw-pus-01',
    hostname: 'storage-s3gw-pus-01',
    type: 'storage',
    os: 'Rocky Linux 9.2',
    service: 'MinIO S3 Gateway',
    ip: '10.2.1.50',
    location: 'Busan-PUS-DR',
    cpu: { cores: 4, model: 'Intel Xeon Silver 4316' },
    memory: { total: 16 },
    disk: { total: 5000 },
    status: 'online',
    description: '부산 S3 호환 게이트웨이 (DR 백업)',
  },

  // ============================================================================
  // ⚖️ 로드밸런서 (HAProxy) - 2대
  // ============================================================================
  {
    id: 'lb-haproxy-icn-01',
    hostname: 'lb-haproxy-icn-01',
    type: 'loadbalancer',
    os: 'Ubuntu 22.04 LTS',
    service: 'HAProxy 2.8.3',
    ip: '10.1.1.5',
    location: 'Seoul-ICN-AZ1',
    cpu: { cores: 4, model: 'Intel Xeon Gold 6330' },
    memory: { total: 8 },
    disk: { total: 100 },
    status: 'online',
    description: '서울 메인 HAProxy 로드밸런서',
  },
  {
    id: 'lb-haproxy-pus-01',
    hostname: 'lb-haproxy-pus-01',
    type: 'loadbalancer',
    os: 'Ubuntu 22.04 LTS',
    service: 'HAProxy 2.8.3',
    ip: '10.2.1.5',
    location: 'Busan-PUS-DR',
    cpu: { cores: 4, model: 'Intel Xeon Silver 4316' },
    memory: { total: 8 },
    disk: { total: 100 },
    status: 'online',
    description: '부산 DR HAProxy 로드밸런서',
  },
];

/**
 * 서버 ID로 서버 정보 조회
 */
export function getServerById(id: string): MockServerInfo | undefined {
  return mockServers.find((server) => server.id === id);
}

/**
 * 타입별 서버 목록 조회
 */
export function getServersByType(
  type: MockServerInfo['type']
): MockServerInfo[] {
  return mockServers.filter((server) => server.type === type);
}

/**
 * 위치별 서버 목록 조회
 */
export function getServersByLocation(location: string): MockServerInfo[] {
  return mockServers.filter((server) => server.location.includes(location));
}

/**
 * 인프라 요약 정보
 */
export function getInfrastructureSummary(): {
  total: number;
  byZone: Record<string, number>;
  byType: Record<string, number>;
} {
  const byZone: Record<string, number> = {};
  const byType: Record<string, number> = {};

  for (const server of mockServers) {
    const zone = server.location.includes('ICN') ? 'Seoul-ICN' : 'Busan-PUS';
    byZone[zone] = (byZone[zone] || 0) + 1;
    byType[server.type] = (byType[server.type] || 0) + 1;
  }

  return {
    total: mockServers.length,
    byZone,
    byType,
  };
}
