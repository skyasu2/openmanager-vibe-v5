/**
 * 24시간 시계열 데이터 생성기
 * 각 서버별로 2,880개의 데이터 포인트 생성 (30초 간격)
 */

import { mockServers, serverInitialStates } from './mockServerConfig';
import type { ScenarioPoint } from './mockScenarios';
import { generate24HourData, scenarioAlerts } from './mockScenarios';
export type { ScenarioPoint };
import type { Server } from '@/types/server';

export interface TimeSeriesData {
  timestamp: number;
  metrics: ScenarioPoint;
}

export interface ServerTimeSeriesData {
  serverId: string;
  scenario: string;
  data: TimeSeriesData[];
  alerts: string[];
}

export interface MockServerData {
  servers: Server[];
  timeSeries: Record<string, ServerTimeSeriesData>;
  metadata: {
    generatedAt: string;
    totalDataPoints: number;
    scenarios: string[];
  };
}

export interface CompressedDataPoint {
  c: number; // cpu
  m: number; // memory
  d: number; // disk
  n: number; // network
}

/**
 * Server 타입으로 변환
 */
function convertToServerType(
  mockServer: (typeof mockServers)[0],
  currentMetrics: ScenarioPoint
): Server {
  const status =
    mockServer.status === 'critical'
      ? 'critical'
      : mockServer.status === 'warning'
        ? 'warning'
        : 'online';

  return {
    id: mockServer.id,
    name: mockServer.hostname,
    status,
    cpu: Math.round(currentMetrics.cpu),
    memory: Math.round(currentMetrics.memory),
    disk: Math.round(currentMetrics.disk),
    network: Math.round(currentMetrics.network),
    uptime: 99.99, // 목업이므로 고정값
    lastUpdate: new Date(),
    location: mockServer.location,
    type: mockServer.type,
    services: [
      {
        name: mockServer.service,
        status: status === 'online' ? 'running' : 'stopped',
        port: 8080, // 기본 포트
      },
    ],
    alerts:
      status !== 'online'
        ? (scenarioAlerts[
            serverInitialStates[
              mockServer.id as keyof typeof serverInitialStates
            ].scenario as keyof typeof scenarioAlerts
          ] || []).length
        : 0,
  };
}

/**
 * 압축된 시계열 데이터 생성
 * Delta encoding을 사용하여 크기 최적화
 */
function compressTimeSeriesData(data: ScenarioPoint[]): CompressedDataPoint[] {
  if (data.length === 0) return [];

  // 첫 번째 값은 그대로 저장
  const firstData = data[0];
  if (!firstData) return [];

  const compressed: CompressedDataPoint[] = [
    {
      c: Math.round(firstData.cpu),
      m: Math.round(firstData.memory),
      d: Math.round(firstData.disk),
      n: Math.round(firstData.network),
    },
  ];

  // 나머지는 이전 값과의 차이만 저장
  for (let i = 1; i < data.length; i++) {
    const curr = data[i];
    const prev = data[i - 1];
    if (!curr || !prev) continue;

    compressed.push({
      c: Math.round(curr.cpu - prev.cpu),
      m: Math.round(curr.memory - prev.memory),
      d: Math.round(curr.disk - prev.disk),
      n: Math.round(curr.network - prev.network),
    });
  }

  return compressed;
}

/**
 * 압축된 데이터 복원
 */
export function decompressTimeSeriesData(compressed: CompressedDataPoint[]): ScenarioPoint[] {
  if (compressed.length === 0) return [];

  const decompressed: ScenarioPoint[] = [
    {
      cpu: compressed[0].c,
      memory: compressed[0].m,
      disk: compressed[0].d,
      network: compressed[0].n,
    },
  ];

  for (let i = 1; i < compressed.length; i++) {
    const prev = decompressed[i - 1];
    decompressed.push({
      cpu: prev.cpu + compressed[i].c,
      memory: prev.memory + compressed[i].m,
      disk: prev.disk + compressed[i].d,
      network: prev.network + compressed[i].n,
    });
  }

  return decompressed;
}

/**
 * 전체 목업 데이터 생성
 */
export function generateMockServerData(): MockServerData {
  const servers: Server[] = [];
  const timeSeries: Record<string, ServerTimeSeriesData> = {};
  const scenarios = new Set<string>();

  // 각 서버별로 데이터 생성
  mockServers.forEach((mockServer) => {
    const scenarioId =
      serverInitialStates[mockServer.id as keyof typeof serverInitialStates]
        .scenario;
    scenarios.add(scenarioId);

    // 24시간 데이터 생성
    const fullData = generate24HourData(scenarioId);

    // 현재 시점의 메트릭 (랜덤 시작점)
    const currentIndex = Math.floor(Math.random() * fullData.length);
    const currentMetrics = fullData[currentIndex];

    // Server 객체 생성
    servers.push(convertToServerType(mockServer, currentMetrics));

    // 압축된 시계열 데이터 저장
    const compressedData = compressTimeSeriesData(fullData);

    timeSeries[mockServer.id] = {
      serverId: mockServer.id,
      scenario: scenarioId,
      data: compressedData as any, // Note: In practice, this would be the compressed format for storage
      alerts:
        mockServer.status !== 'online'
          ? scenarioAlerts[scenarioId as keyof typeof scenarioAlerts]?.slice(
              0,
              3
            ) || []
          : [],
    };
  });

  return {
    servers,
    timeSeries,
    metadata: {
      generatedAt: new Date().toISOString(),
      totalDataPoints: 2880 * mockServers.length,
      scenarios: Array.from(scenarios),
    },
  };
}

/**
 * 시작 시 랜덤 시나리오 선택
 */
export function selectRandomScenario(): {
  scenario: string;
  startHour: number;
  description: string;
} {
  const scenarioGroups = [
    {
      name: 'morning_crisis',
      startHour: 6,
      description: '아침 출근 시간 장애 상황',
      servers: {
        'app-prd-01': 'memory_leak',
        'db-main-01': 'disk_full',
        'web-prd-02': 'cpu_spike',
      },
    },
    {
      name: 'midnight_maintenance',
      startHour: 0,
      description: '심야 유지보수 중 이슈 발생',
      servers: {
        'backup-01': 'storage_warning',
        'file-nas-01': 'backup_delay',
        'db-main-01': 'disk_full',
      },
    },
    {
      name: 'peak_load',
      startHour: 12,
      description: '피크 시간대 부하 집중',
      servers: {
        'web-prd-02': 'cpu_spike',
        'app-prd-01': 'memory_leak',
        'file-nas-01': 'backup_delay',
      },
    },
  ];

  const selected =
    scenarioGroups[Math.floor(Math.random() * scenarioGroups.length)];

  // 선택된 시나리오 적용
  Object.entries(selected.servers).forEach(([serverId, scenario]) => {
    if (serverInitialStates[serverId as keyof typeof serverInitialStates]) {
      serverInitialStates[
        serverId as keyof typeof serverInitialStates
      ].scenario = scenario;
    }
  });

  return {
    scenario: selected.name,
    startHour: selected.startHour,
    description: selected.description,
  };
}

/**
 * 데이터 크기 계산 (디버깅용)
 */
export function calculateDataSize(data: MockServerData): {
  original: number;
  compressed: number;
  ratio: number;
} {
  const originalSize = JSON.stringify(data).length;

  // 압축 시뮬레이션 - TimeSeriesData에서 ScenarioPoint로 변환 후 압축
  const compressedData = {
    ...data,
    timeSeries: Object.entries(data.timeSeries).reduce(
      (acc, [key, value]) => {
        // TimeSeriesData[]에서 ScenarioPoint[]로 변환
        const scenarioPoints: ScenarioPoint[] = (value.data as TimeSeriesData[]).map(item => item.metrics);
        const compressed = compressTimeSeriesData(scenarioPoints);
        
        acc[key] = {
          ...value,
          data: compressed as any, // 압축된 데이터는 실제로는 다른 형태로 저장됨
        };
        return acc;
      },
      {} as Record<string, ServerTimeSeriesData>
    ),
  };

  const compressedSize = JSON.stringify(compressedData).length;

  return {
    original: originalSize,
    compressed: compressedSize,
    ratio: (1 - compressedSize / originalSize) * 100,
  };
}
