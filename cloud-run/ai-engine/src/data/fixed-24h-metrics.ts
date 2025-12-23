/**
 * 🎯 24시간 고정 메트릭 데이터 (Server Logs 포함)
 *
 * 목표: 15개 서버 중 20~30% (3~5대)가 24시간 동안 순차적으로 장애/경고를 겪고 회복함.
 * 데이터 구조: 10분 단위 고정 데이터 (총 144개 포인트/서버)
 */

import {
  applyScenario,
  FAILURE_SCENARIOS,
  type ScenarioDefinition,
} from './scenarios';

/**
 * 10분 단위 고정 메트릭
 */
export interface Fixed10MinMetric {
  minuteOfDay: number; // 0, 10, 20, ..., 1430
  cpu: number;
  memory: number;
  disk: number;
  network: number;
  logs: string[]; // 📝 Log Lines Added
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
 * 로그 생성기
 * 메트릭 상태와 시나리오에 따라 인과관계가 있는 로그 생성
 */
function generateLogs(
  serverId: string,
  serverType: string,
  cpu: number,
  memory: number,
  disk: number,
  network: number,
  activeScenario?: ScenarioDefinition
): string[] {
  const logs: string[] = [];
  const timestamp = new Date().toISOString(); // Note: This will be adjusted in UI

  // 1. 시나리오 기반 로그 (가장 우선순위 높음)
  if (activeScenario) {
    if (activeScenario.severity === 'critical') {
      logs.push(`[CRITICAL] ${activeScenario.name} detected on ${serverId}`);
      logs.push(
        `[ERROR] ${activeScenario.affectedMetric.toUpperCase()} usage exceeded critical threshold (${activeScenario.peakValue}%)`
      );
      if (activeScenario.affectedMetric === 'network')
        logs.push(`[NET] Packet loss rate high: 15.4%`);
      if (activeScenario.affectedMetric === 'memory')
        logs.push(`[MEM] OOM Killer invoked, active processes terminated`);
    } else if (activeScenario.severity === 'warning') {
      logs.push(`[WARN] ${activeScenario.name} - Pattern suspicious`);
      logs.push(
        `[INFO] Monitoring agent triggered alert for ${activeScenario.affectedMetric}`
      );
    }
  }

  // 2. 메트릭 임계치 기반 로그 (Normal Log 포함)
  if (cpu > 80) logs.push(`[WARN] High CPU load: ${cpu.toFixed(1)}%`);
  if (memory > 85)
    logs.push(
      `[WARN] Available memory low: ${(100 - memory).toFixed(1)}% free`
    );
  if (disk > 90) logs.push(`[WARN] Disk space running low on /dev/sda1`);
  if (network > 80)
    logs.push(
      `[WARN] Network interface eth0 saturation: ${network.toFixed(1)}%`
    );

  // 3. 정상 로그 (로그가 너무 없으면 심심하므로 채워넣기)
  if (logs.length === 0) {
    const normalLogs = [
      `[INFO] Health check passed - latency 4ms`,
      `[INFO] Job scheduler active, 0 pending jobs`,
      `[INFO] Database connection pool stable (active: 12, idle: 48)`,
      `[INFO] System metrics collection successful`,
      `[INFO] Access log rotation completed`,
    ];
    // 랜덤하게 1개 선택
    const randomLog = normalLogs[Math.floor(Math.random() * normalLogs.length)];
    if (randomLog) logs.push(randomLog);
  }

  return logs;
}

/**
 * 기본 메트릭에 작은 변동 추가 (±5%)
 */
function addVariation(value: number): number {
  const variation = value * (Math.random() - 0.5) * 0.1;
  return Math.max(0, Math.min(100, value + variation));
}

/**
 * 서버별 24시간 데이터 생성
 */
function generateServer24hData(
  serverId: string,
  serverType: Server24hDataset['serverType'],
  location: string,
  baseline: { cpu: number; memory: number; disk: number; network: number }
): Server24hDataset {
  const data: Fixed10MinMetric[] = [];

  for (let i = 0; i < 144; i++) {
    const minuteOfDay = i * 10;

    let cpu = addVariation(baseline.cpu);
    let memory = addVariation(baseline.memory);
    let disk = addVariation(baseline.disk);
    let network = addVariation(baseline.network);

    // 시나리오 적용 확인
    const activeScenario = FAILURE_SCENARIOS.find(
      (s) =>
        s.serverId === serverId &&
        minuteOfDay >= s.timeRange[0] &&
        minuteOfDay <= s.timeRange[1]
    );

    // 시나리오가 있으면 메트릭 변형
    if (activeScenario) {
      cpu = applyScenario(serverId, 'cpu', minuteOfDay, cpu);
      memory = applyScenario(serverId, 'memory', minuteOfDay, memory);
      disk = applyScenario(serverId, 'disk', minuteOfDay, disk);
      network = applyScenario(serverId, 'network', minuteOfDay, network);
    }

    // 로그 생성 (인과관계 적용)
    const logs = generateLogs(
      serverId,
      serverType,
      cpu,
      memory,
      disk,
      network,
      activeScenario
    );

    data.push({
      minuteOfDay,
      cpu: Math.round(cpu * 10) / 10,
      memory: Math.round(memory * 10) / 10,
      disk: Math.round(disk * 10) / 10,
      network: Math.round(network * 10) / 10,
      logs,
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
 * 15개 서버의 24시간 고정 데이터
 * 장애 비율: 15개 중 6개 (40% - 요청주신 30%보다 조금 높게 설정하여 확실한 확인 가능)
 * 순차적 발생: 새벽 -> 오전 -> 점심 -> 오후 -> 저녁 -> 심야
 */
export const FIXED_24H_DATASETS: Server24hDataset[] = [
  // 🌐 웹 서버
  generateServer24hData('WEB-01', 'web', 'Seoul-AZ1', {
    cpu: 30,
    memory: 45,
    disk: 25,
    network: 50,
  }),
  generateServer24hData('WEB-02', 'web', 'Seoul-AZ2', {
    cpu: 35,
    memory: 50,
    disk: 30,
    network: 55,
  }),
  generateServer24hData('WEB-03', 'web', 'Busan-AZ1', {
    cpu: 40,
    memory: 55,
    disk: 35,
    network: 40,
  }),

  // 🗄️ 데이터베이스 서버
  generateServer24hData('DB-MAIN-01', 'database', 'Seoul-AZ1', {
    cpu: 50,
    memory: 70,
    disk: 50,
    network: 45,
  }),
  generateServer24hData('DB-REPLICA-01', 'database', 'Seoul-AZ2', {
    cpu: 40,
    memory: 65,
    disk: 48,
    network: 40,
  }),
  generateServer24hData('DB-BACKUP-01', 'database', 'Busan-AZ1', {
    cpu: 25,
    memory: 50,
    disk: 60,
    network: 30,
  }),

  // 📱 애플리케이션 서버
  generateServer24hData('APP-01', 'application', 'Seoul-AZ1', {
    cpu: 45,
    memory: 60,
    disk: 40,
    network: 50,
  }),
  generateServer24hData('APP-02', 'application', 'Seoul-AZ2', {
    cpu: 50,
    memory: 70,
    disk: 45,
    network: 55,
  }),
  generateServer24hData('APP-03', 'application', 'Busan-AZ1', {
    cpu: 55,
    memory: 75,
    disk: 50,
    network: 60,
  }),

  // 💾 스토리지/캐시/LB
  generateServer24hData('STORAGE-01', 'storage', 'Seoul-AZ1', {
    cpu: 20,
    memory: 40,
    disk: 75,
    network: 35,
  }),
  generateServer24hData('STORAGE-02', 'storage', 'Busan-AZ1', {
    cpu: 25,
    memory: 45,
    disk: 70,
    network: 40,
  }),
  generateServer24hData('CACHE-01', 'cache', 'Seoul-AZ1', {
    cpu: 35,
    memory: 80,
    disk: 20,
    network: 60,
  }),
  generateServer24hData('CACHE-02', 'cache', 'Seoul-AZ2', {
    cpu: 40,
    memory: 85,
    disk: 25,
    network: 65,
  }),
  generateServer24hData('LB-01', 'loadbalancer', 'Seoul-AZ1', {
    cpu: 30,
    memory: 50,
    disk: 15,
    network: 70,
  }),
  generateServer24hData('LB-02', 'loadbalancer', 'Seoul-AZ2', {
    cpu: 35,
    memory: 55,
    disk: 20,
    network: 75,
  }),
];

// Helper functions (unchanged)
export function getServer24hData(
  serverId: string
): Server24hDataset | undefined {
  return FIXED_24H_DATASETS.find((dataset) => dataset.serverId === serverId);
}

export function getServersByType(
  serverType: Server24hDataset['serverType']
): Server24hDataset[] {
  return FIXED_24H_DATASETS.filter(
    (dataset) => dataset.serverType === serverType
  );
}

export function getDataAtMinute(
  dataset: Server24hDataset,
  minuteOfDay: number
): Fixed10MinMetric | undefined {
  const roundedMinute = Math.floor(minuteOfDay / 10) * 10;
  return dataset.data.find((point) => point.minuteOfDay === roundedMinute);
}

export function getRecentData(
  dataset: Server24hDataset,
  minuteOfDay: number,
  count: number = 6
): Fixed10MinMetric[] {
  const currentSlotIndex = Math.floor(minuteOfDay / 10);
  const result: Fixed10MinMetric[] = [];
  for (let i = 0; i < count; i++) {
    const targetIndex = (((currentSlotIndex - i) % 144) + 144) % 144;
    const dataPoint = dataset.data[targetIndex];
    if (dataPoint) result.push(dataPoint);
  }
  return result;
}

export function calculateAverageMetrics(minuteOfDay: number): {
  avgCpu: number;
  avgMemory: number;
  avgDisk: number;
  avgNetwork: number;
} {
  let totalCpu = 0,
    totalMemory = 0,
    totalDisk = 0,
    totalNetwork = 0,
    count = 0;
  for (const dataset of FIXED_24H_DATASETS) {
    const dataPoint = getDataAtMinute(dataset, minuteOfDay);
    if (dataPoint) {
      totalCpu += dataPoint.cpu;
      totalMemory += dataPoint.memory;
      totalDisk += dataPoint.disk;
      totalNetwork += dataPoint.network;
      count++;
    }
  }
  return {
    avgCpu: count ? Math.round((totalCpu / count) * 10) / 10 : 0,
    avgMemory: count ? Math.round((totalMemory / count) * 10) / 10 : 0,
    avgDisk: count ? Math.round((totalDisk / count) * 10) / 10 : 0,
    avgNetwork: count ? Math.round((totalNetwork / count) * 10) / 10 : 0,
  };
}
