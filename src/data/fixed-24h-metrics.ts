/**
 * 🎯 24시간 고정 메트릭 데이터 (Fallback 전용)
 *
 * hourly-data JSON 로드 실패 시 사용되는 정적 fallback 데이터
 * 시나리오 없이 baseline 값만 제공
 *
 * 15개 서버 구성:
 * - 웹서버 (Nginx): 3대
 * - API 서버 (WAS): 3대
 * - 데이터베이스 (MySQL): 3대
 * - 캐시 (Redis): 2대
 * - 스토리지 (NFS/S3): 2대
 * - 로드밸런서 (HAProxy): 2대
 */

/**
 * 10분 단위 고정 메트릭
 */
export interface Fixed10MinMetric {
  minuteOfDay: number; // 0, 10, 20, ..., 1430
  cpu: number;
  memory: number;
  disk: number;
  network: number;
  logs: string[];
}

/**
 * 서버 24시간 데이터셋
 */
export interface Server24hDataset {
  serverId: string;
  serverType:
    | 'web'
    | 'database'
    | 'application'
    | 'storage'
    | 'cache'
    | 'loadbalancer';
  location: string;
  baseline: {
    cpu: number;
    memory: number;
    disk: number;
    network: number;
  };
  data: Fixed10MinMetric[]; // length 144
}

/**
 * 정상 상태 로그 템플릿 (서버 타입별)
 */
const NORMAL_LOG_TEMPLATES: Record<string, string[]> = {
  database: [
    '[INFO] InnoDB: Buffer pool(s) load completed',
    '[INFO] mysqld: ready for connections',
    '[INFO] Query OK, 0 rows affected',
  ],
  application: [
    '[INFO] Application health check: OK',
    '[INFO] JVM heap usage normal',
    '[DEBUG] Request completed: GET /api/status (4ms)',
  ],
  web: [
    '[INFO] nginx: worker process started',
    '[INFO] Access log: 200 requests/sec',
    '[DEBUG] Upstream response time: 8ms',
  ],
  cache: [
    '[INFO] Redis: Ready to accept connections',
    '[INFO] Keyspace hits: 99.2%',
    '[DEBUG] PING: PONG (latency: 0.1ms)',
  ],
  storage: [
    '[INFO] NFS: exports file reloaded',
    '[INFO] Storage pool status: healthy',
    '[DEBUG] I/O operations: 1200 IOPS',
  ],
  loadbalancer: [
    '[INFO] haproxy: Proxy started',
    '[INFO] Health checks: all backends healthy',
    '[DEBUG] Request routed successfully',
  ],
};

/**
 * 기본 메트릭에 작은 변동 추가 (±5%)
 */
function addVariation(value: number): number {
  const variation = value * (Math.random() - 0.5) * 0.1;
  return Math.max(0, Math.min(100, value + variation));
}

/**
 * 서버별 24시간 데이터 생성 (단순 baseline + 변동)
 */
function generateServer24hData(
  serverId: string,
  serverType: Server24hDataset['serverType'],
  location: string,
  baseline: { cpu: number; memory: number; disk: number; network: number }
): Server24hDataset {
  const data: Fixed10MinMetric[] = [];
  const normalLogs = NORMAL_LOG_TEMPLATES[serverType] || [
    '[INFO] System healthy',
  ];

  for (let i = 0; i < 144; i++) {
    const minuteOfDay = i * 10;

    // 단순 baseline + 변동 (시나리오 없음)
    const cpu = Math.round(addVariation(baseline.cpu) * 10) / 10;
    const memory = Math.round(addVariation(baseline.memory) * 10) / 10;
    const disk = Math.round(addVariation(baseline.disk) * 10) / 10;
    const network = Math.round(addVariation(baseline.network) * 10) / 10;

    // 랜덤 정상 로그 1개
    const randomLog = normalLogs[Math.floor(Math.random() * normalLogs.length)];

    data.push({
      minuteOfDay,
      cpu,
      memory,
      disk,
      network,
      logs: randomLog ? [randomLog] : [],
    });
  }

  return {
    serverId,
    serverType,
    location,
    baseline,
    data,
  };
}

/**
 * 15개 서버의 24시간 고정 데이터 (Fallback)
 */
export const FIXED_24H_DATASETS: Server24hDataset[] = [
  // 웹서버 (Nginx) - 3대
  generateServer24hData('web-nginx-icn-01', 'web', 'Seoul-ICN-AZ1', {
    cpu: 30,
    memory: 45,
    disk: 25,
    network: 50,
  }),
  generateServer24hData('web-nginx-icn-02', 'web', 'Seoul-ICN-AZ2', {
    cpu: 35,
    memory: 50,
    disk: 30,
    network: 55,
  }),
  generateServer24hData('web-nginx-pus-01', 'web', 'Busan-PUS-DR', {
    cpu: 25,
    memory: 40,
    disk: 28,
    network: 45,
  }),

  // API/WAS 서버 - 3대
  generateServer24hData('api-was-icn-01', 'application', 'Seoul-ICN-AZ1', {
    cpu: 45,
    memory: 60,
    disk: 40,
    network: 50,
  }),
  generateServer24hData('api-was-icn-02', 'application', 'Seoul-ICN-AZ2', {
    cpu: 50,
    memory: 70,
    disk: 45,
    network: 55,
  }),
  generateServer24hData('api-was-pus-01', 'application', 'Busan-PUS-DR', {
    cpu: 35,
    memory: 55,
    disk: 38,
    network: 40,
  }),

  // 데이터베이스 (MySQL) - 3대
  generateServer24hData('db-mysql-icn-primary', 'database', 'Seoul-ICN-AZ1', {
    cpu: 50,
    memory: 70,
    disk: 50,
    network: 45,
  }),
  generateServer24hData('db-mysql-icn-replica', 'database', 'Seoul-ICN-AZ2', {
    cpu: 40,
    memory: 65,
    disk: 48,
    network: 40,
  }),
  generateServer24hData('db-mysql-pus-dr', 'database', 'Busan-PUS-DR', {
    cpu: 25,
    memory: 50,
    disk: 45,
    network: 30,
  }),

  // 캐시 (Redis) - 2대
  generateServer24hData('cache-redis-icn-01', 'cache', 'Seoul-ICN-AZ1', {
    cpu: 35,
    memory: 80,
    disk: 20,
    network: 60,
  }),
  generateServer24hData('cache-redis-icn-02', 'cache', 'Seoul-ICN-AZ2', {
    cpu: 40,
    memory: 85,
    disk: 25,
    network: 65,
  }),

  // 스토리지 (NFS/S3) - 2대
  generateServer24hData('storage-nfs-icn-01', 'storage', 'Seoul-ICN-AZ1', {
    cpu: 20,
    memory: 40,
    disk: 75,
    network: 35,
  }),
  generateServer24hData('storage-s3gw-pus-01', 'storage', 'Busan-PUS-DR', {
    cpu: 15,
    memory: 35,
    disk: 60,
    network: 40,
  }),

  // 로드밸런서 (HAProxy) - 2대
  generateServer24hData('lb-haproxy-icn-01', 'loadbalancer', 'Seoul-ICN-AZ1', {
    cpu: 30,
    memory: 50,
    disk: 15,
    network: 70,
  }),
  generateServer24hData('lb-haproxy-pus-01', 'loadbalancer', 'Busan-PUS-DR', {
    cpu: 25,
    memory: 45,
    disk: 12,
    network: 65,
  }),
];

// Helper functions (사용 중인 함수만 유지)

/**
 * 특정 시간대의 메트릭 조회
 * @used MetricsProvider.ts, useFixed24hMetrics.ts
 */
export function getDataAtMinute(
  dataset: Server24hDataset,
  minuteOfDay: number
): Fixed10MinMetric | undefined {
  const roundedMinute = Math.floor(minuteOfDay / 10) * 10;
  return dataset.data.find((point) => point.minuteOfDay === roundedMinute);
}
