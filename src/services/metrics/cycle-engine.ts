/**
 * Cycle Engine Service
 *
 * metrics/current route에서 추출된 6개 시간대별 장애-해소 사이클 로직
 * - SERVER_PROFILES: 서버 타입별 메트릭 범위
 * - FNV-1a 해시 기반 보간
 * - Incident cycle 시스템
 */

import type { AlertSeverity, ServerAlert, ServerRole } from '@/types/server';

// ============================================================================
// Types
// ============================================================================

export interface CycleScenario {
  name: string;
  description: string;
  primaryMetric: string;
  affectedServers: string[];
}

export interface CycleInfo {
  timeSlot: number;
  scenario?: CycleScenario;
  phase: string;
  intensity: number;
  progress: number;
  description: string;
  expectedResolution: Date | null;
}

// ============================================================================
// Server Profiles (metric ranges per server type)
// ============================================================================

export const SERVER_PROFILES = {
  web: { cpu: [20, 60], memory: [30, 70], disk: [10, 40], network: [15, 45] },
  api: { cpu: [30, 75], memory: [40, 80], disk: [5, 25], network: [20, 60] },
  database: {
    cpu: [10, 50],
    memory: [40, 85],
    disk: [20, 70],
    network: [10, 30],
  },
  cache: { cpu: [5, 30], memory: [60, 90], disk: [5, 15], network: [25, 55] },
  monitoring: {
    cpu: [15, 45],
    memory: [25, 60],
    disk: [10, 35],
    network: [15, 40],
  },
  security: {
    cpu: [20, 55],
    memory: [30, 65],
    disk: [15, 45],
    network: [20, 50],
  },
  backup: { cpu: [5, 25], memory: [20, 50], disk: [30, 80], network: [10, 35] },
  load_balancer: {
    cpu: [25, 65],
    memory: [35, 70],
    disk: [5, 20],
    network: [40, 80],
  },
  file: { cpu: [10, 40], memory: [25, 60], disk: [40, 85], network: [30, 70] },
  mail: { cpu: [15, 45], memory: [30, 65], disk: [20, 50], network: [25, 60] },
} as const;

// ============================================================================
// Time Normalization Utilities
// ============================================================================

const MINUTE_MS = 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const TEN_MIN_MS = 10 * 60 * 1000;
const FOUR_HOURS_MS = 4 * 60 * 60 * 1000;

/** 1분 단위로 timestamp 정규화 */
export function normalizeTimestamp(timestamp: number): number {
  return Math.floor(timestamp / MINUTE_MS) * MINUTE_MS;
}

/** 24시간 순환 시스템 (86,400초 = 24시간) */
export function get24HourCycle(timestamp: number): number {
  return timestamp % DAY_MS;
}

/** 10분 기준점 계산 (144개 슬롯: 0-143) */
export function getBaseline10MinSlot(cycleTime: number): number {
  return Math.floor(cycleTime / TEN_MIN_MS);
}

// ============================================================================
// FNV-1a Hash
// ============================================================================

export function fnv1aHash(seed: number | string): number {
  let hash = 0x811c9dc5;
  const str = typeof seed === 'number' ? seed.toString() : seed;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = (hash * 0x01000193) >>> 0;
  }
  return hash / 0xffffffff;
}

// ============================================================================
// Incident Cycle System (6 time slots)
// ============================================================================

const CYCLE_SCENARIOS: CycleScenario[] = [
  {
    name: 'backup_cycle',
    description: '야간 백업 및 정리',
    primaryMetric: 'disk',
    affectedServers: ['backup-01', 'database-01', 'file-01'],
  },
  {
    name: 'maintenance_cycle',
    description: '새벽 패치 및 재시작',
    primaryMetric: 'cpu',
    affectedServers: ['web-01', 'api-01', 'security-01'],
  },
  {
    name: 'traffic_cycle',
    description: '출근시간 트래픽 폭증',
    primaryMetric: 'network',
    affectedServers: ['web-01', 'web-02', 'load_balancer-01'],
  },
  {
    name: 'database_cycle',
    description: '점심시간 주문 폭증',
    primaryMetric: 'memory',
    affectedServers: ['database-01', 'api-01', 'cache-01'],
  },
  {
    name: 'network_cycle',
    description: '퇴근시간 파일 다운로드',
    primaryMetric: 'network',
    affectedServers: ['file-01', 'web-03', 'load_balancer-01'],
  },
  {
    name: 'batch_cycle',
    description: '저녁 데이터 처리',
    primaryMetric: 'memory',
    affectedServers: ['api-02', 'database-02', 'monitoring-01'],
  },
];

const INCIDENT_EFFECTS: Record<string, Record<string, number>> = {
  backup_cycle: { disk: 40, cpu: 15, memory: 10, network: 5 },
  maintenance_cycle: { cpu: 45, memory: 10, disk: 10, network: 5 },
  traffic_cycle: { network: 50, cpu: 20, memory: 15, disk: 5 },
  database_cycle: { memory: 60, cpu: 30, disk: 20, network: 10 },
  network_cycle: { network: 55, disk: 25, cpu: 10, memory: 5 },
  batch_cycle: { memory: 50, cpu: 35, disk: 15, network: 5 },
};

function getIncidentPhase(progress: number) {
  if (progress < 0.2)
    return { phase: 'normal', intensity: 0.0, description: '정상 운영' };
  if (progress < 0.5)
    return { phase: 'incident', intensity: 0.7, description: '장애 발생' };
  if (progress < 0.8)
    return { phase: 'peak', intensity: 1.0, description: '장애 심화' };
  if (progress < 0.95)
    return { phase: 'resolving', intensity: 0.3, description: '해결 중' };
  return { phase: 'resolved', intensity: 0.0, description: '해결 완료' };
}

/** 6개 시간대별 장애-해소 사이클 정보 */
export function getIncidentCycleInfo(hour: number, minute: number): CycleInfo {
  const timeSlot = Math.floor(hour / 4);
  const progressInSlot = ((hour % 4) * 60 + minute) / 240;

  const scenario = CYCLE_SCENARIOS[timeSlot];
  const phaseInfo = getIncidentPhase(progressInSlot);

  return {
    timeSlot,
    scenario,
    phase: phaseInfo.phase,
    intensity: phaseInfo.intensity,
    progress: progressInSlot,
    description: `${scenario?.description || 'Unknown scenario'} - ${phaseInfo.description}`,
    expectedResolution:
      phaseInfo.phase === 'resolved'
        ? null
        : new Date(Date.now() + (1 - progressInSlot) * FOUR_HOURS_MS),
  };
}

// ============================================================================
// Metric Generation
// ============================================================================

/** 1분 단위 자연스러운 변동 추가 */
export function interpolate1MinVariation(
  baseline: number,
  timestamp: number,
  serverId: string,
  metricType: string
): number {
  const seed = fnv1aHash(`${timestamp}-${serverId}-${metricType}`);
  const variationPercent = (seed - 0.5) * 0.1;
  const variation = baseline * variationPercent;
  return Math.max(0, Math.min(100, baseline + variation));
}

/** 사이클 기반 메트릭 생성 */
export function generateCycleBasedMetric(
  serverId: string,
  metricType: string,
  slot: number,
  cycleInfo: CycleInfo
): number {
  const serverType = serverId.split('-')[0] as keyof typeof SERVER_PROFILES;
  const profile = SERVER_PROFILES[serverType] || SERVER_PROFILES.web;
  const metricProfile = profile[metricType as keyof typeof profile] || [20, 60];

  const baseHash = fnv1aHash(
    serverId.charCodeAt(0) + slot * 1000 + metricType.charCodeAt(0)
  );
  const [min, max] = metricProfile;
  const baseValue = min + (max - min) * baseHash;

  let cycleEffect = 0;
  const isAffectedServer =
    cycleInfo.scenario?.affectedServers.includes(serverId) ?? false;

  if (isAffectedServer && cycleInfo.intensity > 0) {
    const cycleName = cycleInfo.scenario?.name;
    const effects = cycleName ? INCIDENT_EFFECTS[cycleName] : null;
    if (effects?.[metricType]) {
      cycleEffect = effects[metricType] * cycleInfo.intensity;
    }
  }

  return Math.round(Math.max(0, Math.min(100, baseValue + cycleEffect)));
}

/** 사이클 기반 시나리오를 ServerAlert 형식으로 변환 */
export function generateCycleScenarios(
  cycleInfo: CycleInfo,
  serverId: string,
  _serverRole: ServerRole,
  normalizedTimestamp: number
): ServerAlert[] {
  if (!cycleInfo.scenario) {
    return [];
  }

  const severity: AlertSeverity =
    cycleInfo.intensity > 0.7
      ? 'critical'
      : cycleInfo.intensity > 0.4
        ? 'warning'
        : 'info';

  const alertType: ServerAlert['type'] = cycleInfo.scenario.name.includes('CPU')
    ? 'cpu'
    : cycleInfo.scenario.name.includes('Memory') ||
        cycleInfo.scenario.name.includes('메모리')
      ? 'memory'
      : cycleInfo.scenario.name.includes('Network') ||
          cycleInfo.scenario.name.includes('네트워크')
        ? 'network'
        : cycleInfo.scenario.name.includes('Disk') ||
            cycleInfo.scenario.name.includes('디스크')
          ? 'disk'
          : 'custom';

  return [
    {
      id: `alert-${serverId}-${cycleInfo.scenario.name.replace(/\s+/g, '-')}-${normalizedTimestamp}`,
      server_id: serverId,
      type: alertType,
      message: `${cycleInfo.scenario.name}: ${cycleInfo.scenario.description} (${cycleInfo.phase}, ${Math.round(cycleInfo.progress * 100)}%)`,
      severity,
      timestamp: new Date().toISOString(),
      resolved: cycleInfo.phase === '해소' || cycleInfo.phase === 'recovery',
    },
  ];
}
