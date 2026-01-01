import {
  FIXED_24H_DATASETS,
  getDataAtMinute,
  type Server24hDataset,
} from '@/data/fixed-24h-metrics';
import { FAILURE_SCENARIOS } from '@/data/scenarios';
import {
  safeServerEnvironment,
  safeServerRole,
} from '@/lib/utils/type-converters';
import { RealisticVariationGenerator } from '@/services/metrics/variation-generator';

// Enhanced Server Metrics 인터페이스 (route.ts와 동기화 필요)
export interface EnhancedServerMetrics {
  id: string;
  name: string;
  hostname: string;
  status:
    | 'online'
    | 'offline'
    | 'warning'
    | 'critical'
    | 'maintenance'
    | 'unknown';
  cpu: number;
  cpu_usage: number;
  memory: number;
  memory_usage: number;
  disk: number;
  disk_usage: number;
  network: number;
  network_in: number;
  network_out: number;
  uptime: number;
  responseTime: number;
  last_updated: string;
  location: string;
  alerts: never[]; // 항상 빈 배열
  ip: string;
  os: string;
  type: string;
  role: string;
  environment: string;
  provider: string;
  specs: {
    cpu_cores: number;
    memory_gb: number;
    disk_gb: number;
    network_speed: string;
  };
  lastUpdate: string;
  services: unknown[]; // 외부 데이터, 런타임에서 검증됨
  systemInfo: {
    os: string;
    uptime: string;
    processes: number;
    zombieProcesses: number;
    loadAverage: string;
    lastUpdate: string;
  };
  networkInfo: {
    interface: string;
    receivedBytes: string;
    sentBytes: string;
    receivedErrors: number;
    sentErrors: number;
    status:
      | 'online'
      | 'offline'
      | 'warning'
      | 'critical'
      | 'maintenance'
      | 'unknown';
  };
}

/**
 * 🎯 **Single Source of Truth** - 24시간 시나리오 데이터 로더
 *
 * **v5.84.0 개선**: Self-fetch 제거, SSOT 직접 import
 * - ✅ `fixed-24h-metrics.ts` 직접 import (번들 포함)
 * - ✅ 런타임 fetch 제거 (~1GB/월 Bandwidth 절약)
 * - ✅ 결정론적 데이터 보장
 *
 * @returns {Promise<EnhancedServerMetrics[]>} 15개 서버 메트릭스 (연쇄 장애 시나리오)
 *
 * @description
 * KST(한국 시간) 기반으로 24시간 데이터를 자동 회전시킵니다.
 * - 시간대: 0-23시 (KST)
 * - 회전 주기: 10분 단위 (SSOT 데이터 기준)
 * - 서버 수: 15개 (Web 3, API 3, DB 3, Cache 2, Storage 2, LB 2)
 * - 데이터 소스: `src/data/fixed-24h-metrics.ts` (SSOT)
 *
 * @example
 * const servers = await loadHourlyScenarioData();
 * console.log(servers.length); // 15
 *
 * @see {@link docs/reference/architecture/data/data-architecture.md} 데이터 아키텍처 가이드
 */
export async function loadHourlyScenarioData(): Promise<
  EnhancedServerMetrics[]
> {
  // 🇰🇷 KST (Asia/Seoul) 기준 시간 사용
  const koreaTime = new Date().toLocaleString('en-US', {
    timeZone: 'Asia/Seoul',
  });
  const koreaDate = new Date(koreaTime);

  const currentHour = koreaDate.getHours(); // 0-23
  const currentMinute = koreaDate.getMinutes(); // 0-59

  // 분 단위 (0-1439)
  const minuteOfDay = currentHour * 60 + currentMinute;

  // 🎯 SSOT에서 직접 데이터 로드 (Self-fetch 제거!)
  return convertFromSSOT(FIXED_24H_DATASETS, minuteOfDay, currentHour);
}

/**
 * 🎯 SSOT 데이터를 EnhancedServerMetrics로 변환
 *
 * @param datasets - SSOT 서버 데이터셋 (15개)
 * @param minuteOfDay - 하루 중 분 (0-1439)
 * @param currentHour - 현재 시간 (0-23)
 */
function convertFromSSOT(
  datasets: Server24hDataset[],
  minuteOfDay: number,
  currentHour: number
): EnhancedServerMetrics[] {
  // 현재 시간대의 활성 시나리오 찾기
  const activeScenarios = FAILURE_SCENARIOS.filter(
    (scenario) =>
      minuteOfDay >= scenario.timeRange[0] &&
      minuteOfDay < scenario.timeRange[1]
  );

  // 서버별 상태 맵 생성
  const serverStatusMap = new Map<string, 'online' | 'warning' | 'critical'>();
  for (const scenario of activeScenarios) {
    serverStatusMap.set(
      scenario.serverId,
      scenario.severity === 'critical'
        ? 'critical'
        : scenario.severity === 'warning'
          ? 'warning'
          : 'online'
    );
  }

  return datasets.map((dataset, index) => {
    // SSOT에서 현재 시간대 데이터 가져오기 (폴백: baseline 값)
    const dataPoint = getDataAtMinute(dataset, minuteOfDay) ?? {
      minuteOfDay,
      cpu: dataset.baseline.cpu,
      memory: dataset.baseline.memory,
      disk: dataset.baseline.disk,
      network: dataset.baseline.network,
      logs: [],
    };

    // 서버 상태 결정 (시나리오 기반)
    const status = serverStatusMap.get(dataset.serverId) || 'online';

    // 서버별 고정 오프셋 (결정론적)
    const serverOffset = (index * 3.7) % 10;
    const deterministicNoise =
      RealisticVariationGenerator.generateNaturalVariance(
        0,
        `server-${index}-noise`
      ) * 0.05;
    const fixedVariation = 1 + (serverOffset + deterministicNoise) / 100;

    // 서버 타입 매핑
    const typeMapping: Record<string, string> = {
      web: 'web',
      application: 'api',
      database: 'database',
      cache: 'cache',
      storage: 'storage',
      loadbalancer: 'loadbalancer',
    };

    const enhanced: EnhancedServerMetrics = {
      id: dataset.serverId,
      name: getServerName(dataset.serverId, dataset.serverType),
      hostname: `${dataset.serverId}.openmanager.kr`,
      status,
      cpu: Math.round(dataPoint.cpu * fixedVariation),
      cpu_usage: Math.round(dataPoint.cpu * fixedVariation),
      memory: Math.round(dataPoint.memory * fixedVariation),
      memory_usage: Math.round(dataPoint.memory * fixedVariation),
      disk: Math.round(dataPoint.disk * fixedVariation),
      disk_usage: Math.round(dataPoint.disk * fixedVariation),
      network: Math.round(dataPoint.network * fixedVariation),
      network_in: Math.round(dataPoint.network * 0.6 * fixedVariation),
      network_out: Math.round(dataPoint.network * 0.4 * fixedVariation),
      uptime: 2592000 + index * 86400, // 30일 + 서버별 오프셋
      responseTime: Math.round((150 + index * 10) * fixedVariation),
      last_updated: new Date().toISOString(),
      location: dataset.location,
      alerts: [],
      ip: `10.10.${Math.floor(index / 5) + 1}.${(index % 5) + 11}`,
      os: 'Ubuntu 22.04 LTS',
      type: typeMapping[dataset.serverType] || dataset.serverType,
      role: safeServerRole(dataset.serverType),
      environment: safeServerEnvironment('production'),
      provider: `DataCenter-${currentHour.toString().padStart(2, '0')}`,
      specs: {
        cpu_cores: dataset.serverType === 'database' ? 16 : 8,
        memory_gb: dataset.serverType === 'database' ? 32 : 16,
        disk_gb: dataset.serverType === 'storage' ? 1000 : 200,
        network_speed: '1Gbps',
      },
      lastUpdate: new Date().toISOString(),
      services: [],
      systemInfo: {
        os: 'Ubuntu 22.04 LTS',
        uptime: `${Math.floor((2592000 + index * 86400) / 3600)}h`,
        processes: 120 + Math.floor(serverOffset),
        zombieProcesses:
          status === 'critical' ? 3 : status === 'warning' ? 1 : 0,
        loadAverage: `${(dataPoint.cpu / 20).toFixed(2)}, ${((dataPoint.cpu - 5) / 20).toFixed(2)}, ${((dataPoint.cpu - 10) / 20).toFixed(2)}`,
        lastUpdate: new Date().toISOString(),
      },
      networkInfo: {
        interface: 'eth0',
        receivedBytes: `${(dataPoint.network * 0.6 * fixedVariation).toFixed(1)} MB`,
        sentBytes: `${(dataPoint.network * 0.4 * fixedVariation).toFixed(1)} MB`,
        receivedErrors:
          status === 'critical' ? Math.floor(serverOffset % 5) + 1 : 0,
        sentErrors:
          status === 'critical' ? Math.floor(serverOffset % 3) + 1 : 0,
        status,
      },
    };

    return enhanced;
  });
}

/**
 * 서버 ID에서 표시 이름 생성
 */
function getServerName(serverId: string, serverType: string): string {
  const typeNames: Record<string, string> = {
    web: 'Nginx Web Server',
    application: 'WAS API Server',
    database: 'MySQL Database',
    cache: 'Redis Cache',
    storage: 'Storage Server',
    loadbalancer: 'HAProxy LB',
  };

  const baseName = typeNames[serverType] || 'Server';

  // serverId에서 번호 추출
  const match = serverId.match(/(\d+)$/);
  const number = match ? match[1] : '';

  // 위치 추출
  if (serverId.includes('primary')) return `${baseName} Primary`;
  if (serverId.includes('replica')) return `${baseName} Replica`;
  if (serverId.includes('dr') || serverId.includes('pus'))
    return `${baseName} DR`;

  return number ? `${baseName} ${number.padStart(2, '0')}` : baseName;
}

// 🗑️ Legacy code removed (v5.84.0)
// - convertFixedRotationData: Replaced by convertFromSSOT
// - readCachedHourlyFile: Replaced by direct SSOT import
// See: https://github.com/skyasu2/openmanager-vibe-v5/commit/XXX
