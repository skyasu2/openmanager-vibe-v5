#!/usr/bin/env tsx
/**
 * 🔄 SSOT 데이터 동기화 스크립트
 *
 * 목적: fixed-24h-metrics.ts (SSOT)에서 hourly-data JSON 생성
 * - Dashboard와 AI Engine이 동일한 데이터를 사용하도록 보장
 * - 서버 ID 명명규칙: 한국 DC (web-nginx-icn-01, cache-redis-icn-01 등)
 *
 * 사용법:
 *   npx tsx scripts/data/sync-hourly-data.ts
 *
 * 출력:
 *   - public/hourly-data/hour-XX.json (24개 파일)
 *   - cloud-run/ai-engine/data/hourly-data/hour-XX.json (24개 파일)
 */

import fs from 'fs';
import path from 'path';

// ============================================================================
// Seeded Random (결정론적 랜덤 - 매번 동일한 결과)
// ============================================================================

/**
 * Mulberry32 PRNG - 시드 기반 결정론적 난수 생성기
 * 같은 시드로 실행하면 항상 동일한 난수 시퀀스 생성
 */
function createSeededRandom(seed: number) {
  let state = seed;
  return function (): number {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// 전역 시드 기반 랜덤 함수 (시간/서버별로 재설정)
let seededRandom: () => number = Math.random;

// ============================================================================
// 서버 정의 (fixed-24h-metrics.ts와 동기화)
// ============================================================================

type ServerType =
  | 'web'
  | 'database'
  | 'application'
  | 'storage'
  | 'cache'
  | 'loadbalancer';

type ServerStatus = 'online' | 'warning' | 'critical' | 'offline';

interface ServerConfig {
  id: string;
  name: string;
  type: ServerType;
  location: string;
  hostname: string;
  ip: string;
  specs: {
    cpu_cores: number;
    memory_gb: number;
    disk_gb: number;
  };
  baseline: {
    cpu: number;
    memory: number;
    disk: number;
    network: number;
  };
}

/**
 * 🇰🇷 한국 데이터센터 기반 15개 서버 정의 (SSOT)
 *
 * 서버 존:
 * - ICN: 인천/서울 (메인 데이터센터)
 * - PUS: 부산 (DR 데이터센터)
 */
const KOREAN_DC_SERVERS: ServerConfig[] = [
  // 웹서버 (Nginx): 3대
  {
    id: 'web-nginx-icn-01',
    name: 'Nginx Web Server 01',
    type: 'web',
    location: 'Seoul-ICN-AZ1',
    hostname: 'web-nginx-icn-01.openmanager.kr',
    ip: '10.10.1.11',
    specs: { cpu_cores: 4, memory_gb: 8, disk_gb: 100 },
    baseline: { cpu: 35, memory: 45, disk: 30, network: 60 },
  },
  {
    id: 'web-nginx-icn-02',
    name: 'Nginx Web Server 02',
    type: 'web',
    location: 'Seoul-ICN-AZ2',
    hostname: 'web-nginx-icn-02.openmanager.kr',
    ip: '10.10.1.12',
    specs: { cpu_cores: 4, memory_gb: 8, disk_gb: 100 },
    baseline: { cpu: 32, memory: 42, disk: 28, network: 55 },
  },
  {
    id: 'web-nginx-pus-01',
    name: 'Nginx Web Server DR',
    type: 'web',
    location: 'Busan-PUS-AZ1',
    hostname: 'web-nginx-pus-01.openmanager.kr',
    ip: '10.20.1.11',
    specs: { cpu_cores: 4, memory_gb: 8, disk_gb: 100 },
    baseline: { cpu: 20, memory: 35, disk: 25, network: 40 },
  },

  // API 서버 (WAS): 3대
  {
    id: 'api-was-icn-01',
    name: 'WAS API Server 01',
    type: 'application',
    location: 'Seoul-ICN-AZ1',
    hostname: 'api-was-icn-01.openmanager.kr',
    ip: '10.10.2.11',
    specs: { cpu_cores: 8, memory_gb: 16, disk_gb: 200 },
    baseline: { cpu: 45, memory: 55, disk: 35, network: 50 },
  },
  {
    id: 'api-was-icn-02',
    name: 'WAS API Server 02',
    type: 'application',
    location: 'Seoul-ICN-AZ2',
    hostname: 'api-was-icn-02.openmanager.kr',
    ip: '10.10.2.12',
    specs: { cpu_cores: 8, memory_gb: 16, disk_gb: 200 },
    baseline: { cpu: 42, memory: 52, disk: 33, network: 48 },
  },
  {
    id: 'api-was-pus-01',
    name: 'WAS API Server DR',
    type: 'application',
    location: 'Busan-PUS-AZ1',
    hostname: 'api-was-pus-01.openmanager.kr',
    ip: '10.20.2.11',
    specs: { cpu_cores: 8, memory_gb: 16, disk_gb: 200 },
    baseline: { cpu: 25, memory: 40, disk: 28, network: 35 },
  },

  // 데이터베이스 (MySQL): 3대
  {
    id: 'db-mysql-icn-primary',
    name: 'MySQL Primary',
    type: 'database',
    location: 'Seoul-ICN-AZ1',
    hostname: 'db-mysql-icn-primary.openmanager.kr',
    ip: '10.10.3.11',
    specs: { cpu_cores: 16, memory_gb: 64, disk_gb: 1000 },
    baseline: { cpu: 55, memory: 70, disk: 45, network: 40 },
  },
  {
    id: 'db-mysql-icn-replica',
    name: 'MySQL Replica',
    type: 'database',
    location: 'Seoul-ICN-AZ2',
    hostname: 'db-mysql-icn-replica.openmanager.kr',
    ip: '10.10.3.12',
    specs: { cpu_cores: 16, memory_gb: 64, disk_gb: 1000 },
    baseline: { cpu: 40, memory: 60, disk: 42, network: 35 },
  },
  {
    id: 'db-mysql-pus-dr',
    name: 'MySQL DR Replica',
    type: 'database',
    location: 'Busan-PUS-AZ1',
    hostname: 'db-mysql-pus-dr.openmanager.kr',
    ip: '10.20.3.11',
    specs: { cpu_cores: 16, memory_gb: 64, disk_gb: 1000 },
    baseline: { cpu: 20, memory: 45, disk: 40, network: 25 },
  },

  // 캐시 (Redis): 2대
  {
    id: 'cache-redis-icn-01',
    name: 'Redis Cache 01',
    type: 'cache',
    location: 'Seoul-ICN-AZ1',
    hostname: 'cache-redis-icn-01.openmanager.kr',
    ip: '10.10.4.11',
    specs: { cpu_cores: 4, memory_gb: 32, disk_gb: 50 },
    baseline: { cpu: 25, memory: 75, disk: 20, network: 45 },
  },
  {
    id: 'cache-redis-icn-02',
    name: 'Redis Cache 02',
    type: 'cache',
    location: 'Seoul-ICN-AZ2',
    hostname: 'cache-redis-icn-02.openmanager.kr',
    ip: '10.10.4.12',
    specs: { cpu_cores: 4, memory_gb: 32, disk_gb: 50 },
    baseline: { cpu: 22, memory: 72, disk: 18, network: 42 },
  },

  // 스토리지 (NFS/S3): 2대
  {
    id: 'storage-nfs-icn-01',
    name: 'NFS Storage 01',
    type: 'storage',
    location: 'Seoul-ICN-AZ1',
    hostname: 'storage-nfs-icn-01.openmanager.kr',
    ip: '10.10.5.11',
    specs: { cpu_cores: 4, memory_gb: 16, disk_gb: 5000 },
    baseline: { cpu: 30, memory: 40, disk: 65, network: 50 },
  },
  {
    id: 'storage-s3gw-pus-01',
    name: 'S3 Gateway DR',
    type: 'storage',
    location: 'Busan-PUS-DR',
    hostname: 'storage-s3gw-pus-01.openmanager.kr',
    ip: '10.20.5.11',
    specs: { cpu_cores: 2, memory_gb: 8, disk_gb: 200 },
    baseline: { cpu: 20, memory: 35, disk: 55, network: 60 },
  },

  // 로드밸런서 (HAProxy): 2대
  {
    id: 'lb-haproxy-icn-01',
    name: 'HAProxy LB 01',
    type: 'loadbalancer',
    location: 'Seoul-ICN-AZ1',
    hostname: 'lb-haproxy-icn-01.openmanager.kr',
    ip: '10.10.6.11',
    specs: { cpu_cores: 4, memory_gb: 8, disk_gb: 50 },
    baseline: { cpu: 40, memory: 35, disk: 15, network: 70 },
  },
  {
    id: 'lb-haproxy-pus-01',
    name: 'HAProxy LB DR',
    type: 'loadbalancer',
    location: 'Busan-PUS-DR',
    hostname: 'lb-haproxy-pus-01.openmanager.kr',
    ip: '10.20.6.11',
    specs: { cpu_cores: 4, memory_gb: 8, disk_gb: 50 },
    baseline: { cpu: 38, memory: 33, disk: 14, network: 68 },
  },
];

// ============================================================================
// 장애 시나리오 정의 (24시간 4분할)
// ============================================================================

interface FailureScenario {
  hour: number;
  incident: string;
  affectedServers: {
    id: string;
    status: ServerStatus;
    metricsOverride: Partial<{ cpu: number; memory: number; disk: number; network: number }>;
  }[];
}

const FAILURE_SCENARIOS: FailureScenario[] = [
  // 🔴 0-5시: DB 백업 장애
  {
    hour: 2,
    incident: 'DB 자동 백업 중 디스크 I/O 과부하',
    affectedServers: [
      { id: 'db-mysql-icn-primary', status: 'warning', metricsOverride: { cpu: 85, disk: 88 } },
      { id: 'db-mysql-icn-replica', status: 'warning', metricsOverride: { cpu: 70, disk: 82 } },
    ],
  },
  {
    hour: 3,
    incident: 'DB 슬로우 쿼리 누적 - 성능 저하',
    affectedServers: [
      { id: 'db-mysql-icn-primary', status: 'critical', metricsOverride: { cpu: 95, memory: 92 } },
      { id: 'api-was-icn-01', status: 'warning', metricsOverride: { cpu: 75, memory: 70 } },
    ],
  },

  // 🟡 6-11시: 네트워크/LB 장애
  {
    hour: 7,
    incident: '네트워크 패킷 손실 - LB 과부하',
    affectedServers: [
      { id: 'lb-haproxy-icn-01', status: 'critical', metricsOverride: { cpu: 92, network: 95 } },
      { id: 'web-nginx-icn-01', status: 'warning', metricsOverride: { cpu: 78, network: 88 } },
      { id: 'web-nginx-icn-02', status: 'warning', metricsOverride: { cpu: 75, network: 85 } },
    ],
  },

  // 🔵 12-17시: 메모리 누수 장애
  {
    hour: 12,
    incident: 'Redis 캐시 메모리 누수 - OOM 직전',
    affectedServers: [
      { id: 'cache-redis-icn-01', status: 'critical', metricsOverride: { memory: 95, cpu: 65 } },
      { id: 'cache-redis-icn-02', status: 'warning', metricsOverride: { memory: 89, cpu: 55 } },
      { id: 'api-was-icn-01', status: 'warning', metricsOverride: { memory: 78, cpu: 68 } },
    ],
  },

  // 🟠 18-23시: CPU 피크 장애
  {
    hour: 21,
    incident: 'API 요청 폭증 - CPU 과부하',
    affectedServers: [
      { id: 'api-was-icn-01', status: 'critical', metricsOverride: { cpu: 96, memory: 85 } },
      { id: 'api-was-icn-02', status: 'critical', metricsOverride: { cpu: 94, memory: 82 } },
      { id: 'lb-haproxy-icn-01', status: 'warning', metricsOverride: { cpu: 80, network: 88 } },
    ],
  },
];

// ============================================================================
// 데이터 생성 로직
// ============================================================================

function getScenarioForHour(hour: number): FailureScenario | undefined {
  return FAILURE_SCENARIOS.find((s) => s.hour === hour);
}

function generateServerMetrics(
  server: ServerConfig,
  serverIndex: number,
  hour: number,
  minuteIndex: number,
  scenario?: FailureScenario
): {
  id: string;
  name: string;
  hostname: string;
  type: ServerType;
  location: string;
  environment: string;
  status: ServerStatus;
  cpu: number;
  memory: number;
  disk: number;
  network: number;
  responseTime: number;
  uptime: number;
  ip: string;
  os: string;
  specs: typeof server.specs;
  services: string[];
  processes: number;
} {
  // 결정론적 시드: hour * 10000 + serverIndex * 100 + minuteIndex
  // 같은 조합이면 항상 동일한 값 생성
  const seed = hour * 10000 + serverIndex * 100 + minuteIndex;
  seededRandom = createSeededRandom(seed);

  // 기본 메트릭 (baseline + 결정론적 랜덤 변동)
  let metrics = {
    cpu: server.baseline.cpu + Math.floor((seededRandom() - 0.5) * 10),
    memory: server.baseline.memory + Math.floor((seededRandom() - 0.5) * 8),
    disk: server.baseline.disk + Math.floor((seededRandom() - 0.5) * 5),
    network: server.baseline.network + Math.floor((seededRandom() - 0.5) * 10),
  };

  let status: ServerStatus = 'online';

  // 시나리오 적용
  if (scenario) {
    const affected = scenario.affectedServers.find((s) => s.id === server.id);
    if (affected) {
      metrics = { ...metrics, ...affected.metricsOverride };
      status = affected.status;
    }
  }

  // 범위 보정 (0-100)
  metrics.cpu = Math.max(0, Math.min(100, metrics.cpu));
  metrics.memory = Math.max(0, Math.min(100, metrics.memory));
  metrics.disk = Math.max(0, Math.min(100, metrics.disk));
  metrics.network = Math.max(0, Math.min(100, metrics.network));

  // 응답 시간 계산
  const baseResponseTime = server.type === 'cache' ? 20 : server.type === 'database' ? 50 : 150;
  const responseTimeMultiplier = status === 'critical' ? 20 : status === 'warning' ? 3 : 1;
  const responseTime = Math.round(baseResponseTime * responseTimeMultiplier * (0.8 + seededRandom() * 0.4));

  return {
    id: server.id,
    name: server.name,
    hostname: server.hostname,
    type: server.type,
    location: server.location,
    environment: 'production',
    status,
    cpu: metrics.cpu,
    memory: metrics.memory,
    disk: metrics.disk,
    network: metrics.network,
    responseTime,
    uptime: 2592000 + Math.floor(seededRandom() * 86400), // ~30일
    ip: server.ip,
    os: 'Ubuntu 22.04 LTS',
    specs: server.specs,
    services: [],
    processes: 100 + Math.floor(seededRandom() * 50),
  };
}

function generateHourlyData(hour: number) {
  const scenario = getScenarioForHour(hour);
  const dataPoints = [];

  // 5분 간격 12개 데이터 포인트 (00, 05, 10, ..., 55분)
  for (let minuteIndex = 0; minuteIndex < 12; minuteIndex++) {
    const minute = minuteIndex * 5;
    const timestamp = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    const servers: Record<string, ReturnType<typeof generateServerMetrics>> = {};

    KOREAN_DC_SERVERS.forEach((server, serverIndex) => {
      servers[server.id] = generateServerMetrics(server, serverIndex, hour, minuteIndex, scenario);
    });

    dataPoints.push({ timestamp, servers });
  }

  return {
    hour,
    scenario: scenario?.incident || `${hour}시 정상 운영`,
    dataPoints,
    metadata: {
      generatedAt: new Date().toISOString(),
      totalDataPoints: 12,
      intervalMinutes: 5,
      serverCount: KOREAN_DC_SERVERS.length,
      affectedServers: scenario?.affectedServers.length || 0,
    },
  };
}

// ============================================================================
// 메인 실행
// ============================================================================

function main() {
  try {
    console.log('🔄 SSOT 데이터 동기화 시작...\n');
    console.log('📋 SSOT: fixed-24h-metrics.ts (한국 DC 서버 15개)\n');

    // 출력 디렉토리들
    const outputDirs = [
      path.join(process.cwd(), 'public/hourly-data'),
      path.join(process.cwd(), 'cloud-run/ai-engine/data/hourly-data'),
    ];

    // 디렉토리 생성
    outputDirs.forEach((dir) => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });

    let totalSize = 0;

    // 24시간 데이터 생성
    for (let hour = 0; hour < 24; hour++) {
      const data = generateHourlyData(hour);
      const filename = `hour-${hour.toString().padStart(2, '0')}.json`;
      const jsonContent = JSON.stringify(data, null, 2);

      // 모든 출력 디렉토리에 저장
      outputDirs.forEach((dir) => {
        const filepath = path.join(dir, filename);
        fs.writeFileSync(filepath, jsonContent);
      });

      const fileSize = Buffer.byteLength(jsonContent, 'utf8');
      totalSize += fileSize;

      const scenario = getScenarioForHour(hour);
      const icon = scenario?.affectedServers.some((s) => s.status === 'critical')
        ? '🔴'
        : scenario?.affectedServers.some((s) => s.status === 'warning')
          ? '🟡'
          : '🟢';

      console.log(`${icon} ${filename} - ${data.scenario} (${(fileSize / 1024).toFixed(1)}KB)`);
    }

    console.log(`\n📦 총 크기: ${(totalSize / 1024).toFixed(1)}KB (파일당 평균 ${(totalSize / 24 / 1024).toFixed(1)}KB)`);
    console.log('\n✅ 동기화 완료!\n');

    console.log('📁 출력 위치:');
    outputDirs.forEach((dir) => console.log(`   - ${dir}`));

    console.log('\n📊 통계:');
    console.log(`   - 시간별 파일: 24개`);
    console.log(`   - 서버 수: ${KOREAN_DC_SERVERS.length}개`);
    console.log(`   - 데이터 포인트/파일: 12개 (5분 간격)`);
    console.log(`   - 장애 시나리오: ${FAILURE_SCENARIOS.length}개`);
  } catch (error) {
    console.error('❌ 동기화 실패:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();
