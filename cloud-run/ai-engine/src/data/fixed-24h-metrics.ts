/**
 * 🎯 24시간 고정 메트릭 데이터 (JSON 기반 SSOT)
 *
 * **Single Source of Truth**: Vercel과 동일한 JSON 파일 사용
 * - 데이터 소스: `data/hourly-data/hour-XX.json`
 * - 서버 ID: Vercel과 동일 (`web-prd-01`, `api-prd-01` 등)
 *
 * 15개 서버 구성:
 * - Web: 3대 (web-prd-01, web-prd-02, web-stg-01)
 * - API: 3대 (api-prd-01, api-prd-02, api-stg-01)
 * - DB: 3대 (db-prd-01, db-prd-02, db-stg-01)
 * - Cache: 2대 (cache-prd-01, cache-stg-01)
 * - Storage: 2대 (storage-prd-01, storage-stg-01)
 * - LB: 2대 (lb-prd-01, lb-stg-01)
 *
 * @updated 2025-12-28 - JSON 기반 SSOT로 전환
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

// ============================================================================
// Types
// ============================================================================

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
    | 'loadbalancer'
    | 'api'
    | 'lb';
  location: string;
  baseline: {
    cpu: number;
    memory: number;
    disk: number;
    network: number;
  };
  data: Fixed10MinMetric[]; // length 144 (24h × 6 per hour)
}

/**
 * JSON 파일 구조
 */
interface HourlyJsonData {
  hour: number;
  _pattern: string; // JSON 필드명 (외부 노출 방지)
  dataPoints: Array<{
    timestamp: string;
    servers: Record<string, RawServerData>;
  }>;
}

interface RawServerData {
  id: string;
  name: string;
  hostname: string;
  type: string;
  role: string;
  location: string;
  environment: string;
  status: string;
  cpu: number;
  memory: number;
  disk: number;
  network: number;
  responseTime?: number;
  uptime: number;
  ip: string;
  os: string;
  specs: {
    cpu_cores: number;
    memory_gb: number;
    disk_gb: number;
  };
  services?: unknown[];
  processes?: number;
}

// ============================================================================
// JSON Loading
// ============================================================================

let _cachedDatasets: Server24hDataset[] | null = null;

/**
 * JSON 파일 경로 후보들
 */
function getJsonPaths(hour: number): string[] {
  const paddedHour = hour.toString().padStart(2, '0');
  return [
    join(__dirname, '../../data/hourly-data', `hour-${paddedHour}.json`),
    join(process.cwd(), 'data/hourly-data', `hour-${paddedHour}.json`),
    join(process.cwd(), 'cloud-run/ai-engine/data/hourly-data', `hour-${paddedHour}.json`),
  ];
}

/**
 * 단일 시간 JSON 파일 로드
 */
function loadHourlyJson(hour: number): HourlyJsonData | null {
  for (const filePath of getJsonPaths(hour)) {
    if (existsSync(filePath)) {
      try {
        const content = readFileSync(filePath, 'utf-8');
        return JSON.parse(content) as HourlyJsonData;
      } catch {
        // 파싱 오류 무시, 다음 경로 시도
      }
    }
  }
  return null;
}

/**
 * Server type 매핑
 */
function mapServerType(
  type: string
): Server24hDataset['serverType'] {
  const typeMap: Record<string, Server24hDataset['serverType']> = {
    web: 'web',
    api: 'application',
    db: 'database',
    database: 'database',
    cache: 'cache',
    redis: 'cache',
    storage: 'storage',
    lb: 'loadbalancer',
    loadbalancer: 'loadbalancer',
  };
  return typeMap[type.toLowerCase()] || 'application';
}

/**
 * 24개 JSON 파일에서 Server24hDataset[] 빌드
 */
function buildDatasetsFromJson(): Server24hDataset[] {
  const serverDataMap = new Map<
    string,
    {
      serverId: string;
      serverType: Server24hDataset['serverType'];
      location: string;
      dataPoints: Map<number, Fixed10MinMetric>;
    }
  >();

  // 24시간 (0-23) JSON 파일 순회
  for (let hour = 0; hour < 24; hour++) {
    const hourlyData = loadHourlyJson(hour);
    if (!hourlyData) continue;

    // 각 dataPoint (5분 간격, 12개/시간)
    for (let dpIndex = 0; dpIndex < hourlyData.dataPoints.length; dpIndex++) {
      const dataPoint = hourlyData.dataPoints[dpIndex];
      if (!dataPoint?.servers) continue;

      // 분 계산 (5분 → 10분으로 반올림)
      const minuteInHour = dpIndex * 5;
      const minuteOfDay = hour * 60 + minuteInHour;
      const roundedMinute = Math.floor(minuteOfDay / 10) * 10;

      // 각 서버 데이터 처리
      for (const [serverId, serverData] of Object.entries(dataPoint.servers)) {
        // 서버 첫 등장 시 초기화
        if (!serverDataMap.has(serverId)) {
          serverDataMap.set(serverId, {
            serverId,
            serverType: mapServerType(serverData.type),
            location: serverData.location,
            dataPoints: new Map(),
          });
        }

        const serverEntry = serverDataMap.get(serverId)!;

        // 해당 10분 슬롯에 데이터가 없으면 추가
        if (!serverEntry.dataPoints.has(roundedMinute)) {
          serverEntry.dataPoints.set(roundedMinute, {
            minuteOfDay: roundedMinute,
            cpu: serverData.cpu ?? 0,
            memory: serverData.memory ?? 0,
            disk: serverData.disk ?? 0,
            network: serverData.network ?? 0,
            logs: [],
          });
        }
      }
    }
  }

  // Map → Server24hDataset[] 변환
  const datasets: Server24hDataset[] = [];
  for (const entry of serverDataMap.values()) {
    // 144개 데이터 포인트 정렬
    const sortedData = Array.from(entry.dataPoints.values()).sort(
      (a, b) => a.minuteOfDay - b.minuteOfDay
    );

    // 누락된 슬롯 채우기 (0, 10, 20, ..., 1430)
    const fullData: Fixed10MinMetric[] = [];
    for (let minute = 0; minute < 1440; minute += 10) {
      const existing = sortedData.find((d) => d.minuteOfDay === minute);
      if (existing) {
        fullData.push(existing);
      } else {
        // 가장 가까운 이전 데이터 복사 또는 기본값
        const prevData = fullData[fullData.length - 1];
        fullData.push({
          minuteOfDay: minute,
          cpu: prevData?.cpu ?? 30,
          memory: prevData?.memory ?? 40,
          disk: prevData?.disk ?? 25,
          network: prevData?.network ?? 50,
          logs: [],
        });
      }
    }

    // Baseline 계산 (첫 6개 데이터 평균)
    const baselineSlice = fullData.slice(0, 6);
    const baseline = {
      cpu: Math.round(
        baselineSlice.reduce((sum, d) => sum + d.cpu, 0) / baselineSlice.length
      ),
      memory: Math.round(
        baselineSlice.reduce((sum, d) => sum + d.memory, 0) / baselineSlice.length
      ),
      disk: Math.round(
        baselineSlice.reduce((sum, d) => sum + d.disk, 0) / baselineSlice.length
      ),
      network: Math.round(
        baselineSlice.reduce((sum, d) => sum + d.network, 0) / baselineSlice.length
      ),
    };

    datasets.push({
      serverId: entry.serverId,
      serverType: entry.serverType,
      location: entry.location,
      baseline,
      data: fullData,
    });
  }

  console.log(
    `[Fixed24hMetrics] JSON에서 ${datasets.length}개 서버 데이터셋 로드 완료`
  );
  return datasets;
}

// ============================================================================
// Exports (기존 인터페이스 유지)
// ============================================================================

/**
 * 24시간 서버 데이터셋 (Lazy Loading)
 */
export const FIXED_24H_DATASETS: Server24hDataset[] = (() => {
  if (!_cachedDatasets) {
    _cachedDatasets = buildDatasetsFromJson();
  }
  return _cachedDatasets;
})();

/**
 * 서버 ID로 데이터셋 조회
 */
export function getServer24hData(
  serverId: string
): Server24hDataset | undefined {
  return FIXED_24H_DATASETS.find((dataset) => dataset.serverId === serverId);
}

/**
 * 서버 타입으로 데이터셋 필터링
 */
export function getServersByType(
  serverType: Server24hDataset['serverType']
): Server24hDataset[] {
  return FIXED_24H_DATASETS.filter(
    (dataset) => dataset.serverType === serverType
  );
}

/**
 * 위치로 데이터셋 필터링
 */
export function getServersByLocation(location: string): Server24hDataset[] {
  return FIXED_24H_DATASETS.filter((dataset) =>
    dataset.location.includes(location)
  );
}

/**
 * 특정 시각의 메트릭 조회
 * @param dataset 서버 데이터셋
 * @param minuteOfDay 일 중 분 (0-1439)
 */
export function getDataAtMinute(
  dataset: Server24hDataset,
  minuteOfDay: number
): Fixed10MinMetric | undefined {
  const roundedMinute = Math.floor(minuteOfDay / 10) * 10;
  return dataset.data.find((point) => point.minuteOfDay === roundedMinute);
}

/**
 * 최근 N개 데이터 포인트 조회
 * @param dataset 서버 데이터셋
 * @param minuteOfDay 현재 시각 (분)
 * @param count 조회할 개수 (기본: 6)
 */
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

/**
 * 전체 서버 평균 메트릭 계산
 */
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

/**
 * 서버 인프라 요약 정보
 */
export function getInfrastructureSummary(): {
  totalServers: number;
  byZone: Record<string, number>;
  byType: Record<string, number>;
} {
  const byZone: Record<string, number> = {};
  const byType: Record<string, number> = {};

  for (const dataset of FIXED_24H_DATASETS) {
    // Zone 집계 (location 기반)
    const zone = dataset.location.split('-')[0] || 'unknown';
    byZone[zone] = (byZone[zone] || 0) + 1;

    // Type 집계
    byType[dataset.serverType] = (byType[dataset.serverType] || 0) + 1;
  }

  return {
    totalServers: FIXED_24H_DATASETS.length,
    byZone,
    byType,
  };
}

/**
 * 캐시 초기화 (테스트용)
 */
export function clearMetricsCache(): void {
  _cachedDatasets = null;
  console.log('[Fixed24hMetrics] 캐시 초기화됨');
}
