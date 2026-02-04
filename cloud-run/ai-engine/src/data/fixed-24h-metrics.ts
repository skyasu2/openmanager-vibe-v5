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
  scrapeConfig: {
    scrapeInterval: string;
    evaluationInterval: string;
    source: string;
  };
  _scenario?: string;
  dataPoints: Array<{
    timestampMs: number;
    targets: Record<string, PrometheusTargetJson>;
  }>;
}

interface PrometheusTargetJson {
  instance: string;
  labels: { server_type: string; hostname: string; datacenter: string };
  metrics: {
    up: 0 | 1;
    node_cpu_usage_percent: number;
    node_memory_usage_percent: number;
    node_filesystem_usage_percent: number;
    node_network_transmit_bytes_rate: number;
  };
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

// ============================================================================
// Log Generation (순수 메트릭 기반)
// ============================================================================

/**
 * 서버 타입별 로그 템플릿 (원인이 아닌 증상만 표시)
 */
const LOG_TEMPLATES: Record<string, { normal: string[]; warning: string[]; critical: string[] }> = {
  web: {
    normal: [
      '[INFO] GET /api/health 200 - 4ms',
      '[INFO] Request processed successfully - avg latency 12ms',
      '[INFO] Static assets served: 1,234 requests/min',
    ],
    warning: [
      '[WARN] Response time exceeded 500ms for /api/dashboard',
      '[WARN] Connection pool utilization at 75%',
      '[WARN] Slow query detected: 2.3s response time',
    ],
    critical: [
      '[ERROR] Request timeout after 30s - /api/metrics',
      '[CRIT] Connection refused from upstream server',
      '[ERROR] 503 Service Unavailable - backend not responding',
    ],
  },
  database: {
    normal: [
      '[INFO] Query executed: SELECT * FROM metrics - 15ms',
      '[INFO] Replication lag: 0.2s',
      '[INFO] Checkpoint completed successfully',
    ],
    warning: [
      '[WARN] Slow query: 5.2s - full table scan detected',
      '[WARN] Disk I/O wait time: 150ms avg',
      '[WARN] Connection count: 180/200',
    ],
    critical: [
      '[CRIT] Query timeout after 60s - deadlock detected',
      '[ERROR] Replication lag exceeded 30s',
      '[CRIT] Disk write failed - no space left on device',
    ],
  },
  cache: {
    normal: [
      '[INFO] Cache hit ratio: 98.5%',
      '[INFO] Memory usage: 2.1GB/4GB',
      '[INFO] Keys: 125,000 active',
    ],
    warning: [
      '[WARN] Cache eviction rate increased: 500 keys/min',
      '[WARN] Memory fragmentation: 15%',
      '[WARN] Client connection queue: 50 pending',
    ],
    critical: [
      '[CRIT] Out of memory - evicting keys',
      '[ERROR] Cluster node unreachable - failover initiated',
      '[CRIT] Persistence save failed - disk full',
    ],
  },
  application: {
    normal: [
      '[INFO] API request completed - 200 OK',
      '[INFO] Background job processed: 45 items',
      '[INFO] Health check passed',
    ],
    warning: [
      '[WARN] High CPU usage detected in worker process',
      '[WARN] GC pause: 850ms - memory pressure',
      '[WARN] Thread pool exhausted - queuing requests',
    ],
    critical: [
      '[CRIT] Process unresponsive - initiating restart',
      '[ERROR] Fatal: Maximum memory limit exceeded',
      '[CRIT] Uncaught exception in main thread',
    ],
  },
  loadbalancer: {
    normal: [
      '[INFO] Backend health check: all 4 servers healthy',
      '[INFO] Request distribution: 25% per backend',
      '[INFO] SSL handshake: avg 8ms',
    ],
    warning: [
      '[WARN] Backend server removed from pool - health check failed',
      '[WARN] Connection queue depth: 100',
      '[WARN] SSL certificate expires in 7 days',
    ],
    critical: [
      '[CRIT] No healthy backends available',
      '[ERROR] Connection limit reached: 10000/10000',
      '[CRIT] Backend pool reduced to 1 server',
    ],
  },
  storage: {
    normal: [
      '[INFO] Object stored: 1.2MB - 45ms',
      '[INFO] Bucket stats: 2.3TB used / 10TB quota',
      '[INFO] Replication completed: 3 copies verified',
    ],
    warning: [
      '[WARN] Storage throughput degraded: 50MB/s vs 100MB/s expected',
      '[WARN] Object retrieval latency: 500ms',
      '[WARN] Quota usage: 85%',
    ],
    critical: [
      '[CRIT] Write operation failed - quota exceeded',
      '[ERROR] Object corruption detected - checksum mismatch',
      '[CRIT] Storage backend unreachable',
    ],
  },
};

/**
 * 메트릭 기반 로그 생성 (시나리오 힌트 없이 순수 증상만)
 */
function generateMetricLogs(
  serverType: Server24hDataset['serverType'],
  cpu: number,
  memory: number,
  disk: number,
  network: number
): string[] {
  const logs: string[] = [];
  const templates = LOG_TEMPLATES[serverType] || LOG_TEMPLATES.application;

  // Critical 상태 (90% 이상)
  if (cpu >= 90 || memory >= 90 || disk >= 95 || network >= 85) {
    const critLogs = templates.critical;
    logs.push(critLogs[Math.floor(Math.random() * critLogs.length)]);

    // 구체적 메트릭 로그 추가
    if (cpu >= 90) {
      logs.push(`[CRIT] CPU usage: ${cpu.toFixed(1)}% - load average: ${(cpu / 10).toFixed(2)}`);
    }
    if (memory >= 90) {
      logs.push(`[CRIT] Memory usage: ${memory.toFixed(1)}% - available: ${((100 - memory) * 0.32).toFixed(1)}GB`);
    }
    if (disk >= 95) {
      logs.push(`[CRIT] Disk usage: ${disk.toFixed(1)}% - free: ${((100 - disk) * 5).toFixed(0)}GB`);
    }
  }
  // Warning 상태 (80% 이상)
  else if (cpu >= 80 || memory >= 80 || disk >= 85 || network >= 70) {
    const warnLogs = templates.warning;
    logs.push(warnLogs[Math.floor(Math.random() * warnLogs.length)]);

    // 구체적 메트릭 로그 추가
    if (cpu >= 80) {
      logs.push(`[WARN] CPU usage: ${cpu.toFixed(1)}% - load average: ${(cpu / 10).toFixed(2)}`);
    }
    if (memory >= 80) {
      logs.push(`[WARN] Memory usage: ${memory.toFixed(1)}%`);
    }
    if (disk >= 85) {
      logs.push(`[WARN] Disk usage: ${disk.toFixed(1)}%`);
    }
  }
  // 정상 상태
  else {
    const normalLogs = templates.normal;
    logs.push(normalLogs[Math.floor(Math.random() * normalLogs.length)]);
  }

  return logs;
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

    // 각 dataPoint (10분 간격, 6개/시간)
    for (let dpIndex = 0; dpIndex < hourlyData.dataPoints.length; dpIndex++) {
      const dataPoint = hourlyData.dataPoints[dpIndex];
      if (!dataPoint?.targets) continue;

      // 분 계산 (10분 간격)
      const minuteInHour = dpIndex * 10;
      const minuteOfDay = hour * 60 + minuteInHour;
      const roundedMinute = Math.floor(minuteOfDay / 10) * 10;

      // Prometheus targets → 서버 데이터 처리
      for (const target of Object.values(dataPoint.targets)) {
        const serverId = target.instance.replace(/:9100$/, '');
        const serverType = target.labels.server_type;
        const location = target.labels.datacenter;

        // 서버 첫 등장 시 초기화
        if (!serverDataMap.has(serverId)) {
          serverDataMap.set(serverId, {
            serverId,
            serverType: mapServerType(serverType),
            location,
            dataPoints: new Map(),
          });
        }

        const serverEntry = serverDataMap.get(serverId)!;

        // 해당 10분 슬롯에 데이터가 없으면 추가
        if (!serverEntry.dataPoints.has(roundedMinute)) {
          const cpu = target.metrics.node_cpu_usage_percent ?? 0;
          const memory = target.metrics.node_memory_usage_percent ?? 0;
          const disk = target.metrics.node_filesystem_usage_percent ?? 0;
          const network = target.metrics.node_network_transmit_bytes_rate ?? 0;

          serverEntry.dataPoints.set(roundedMinute, {
            minuteOfDay: roundedMinute,
            cpu,
            memory,
            disk,
            network,
            logs: generateMetricLogs(serverEntry.serverType, cpu, memory, disk, network),
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
        const cpu = prevData?.cpu ?? 30;
        const memory = prevData?.memory ?? 40;
        const disk = prevData?.disk ?? 25;
        const network = prevData?.network ?? 50;
        fullData.push({
          minuteOfDay: minute,
          cpu,
          memory,
          disk,
          network,
          logs: generateMetricLogs(entry.serverType, cpu, memory, disk, network),
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
 * 서버별 24시간 메트릭 트렌드 요약
 */
export interface ServerTrendSummary {
  serverId: string;
  serverType: Server24hDataset['serverType'];
  cpu: { avg: number; max: number; min: number };
  memory: { avg: number; max: number; min: number };
  disk: { avg: number; max: number; min: number };
  network: { avg: number; max: number; min: number };
}

/**
 * 전체 서버의 24시간 트렌드 요약 생성
 * AI가 "오늘 전체 트렌드" 질문에 정확하게 답변하기 위한 함수
 */
export function get24hTrendSummaries(): ServerTrendSummary[] {
  return FIXED_24H_DATASETS.map((dataset) => {
    const metrics = ['cpu', 'memory', 'disk', 'network'] as const;
    const result: Record<string, { avg: number; max: number; min: number }> = {};

    for (const metric of metrics) {
      const values = dataset.data.map((d) => d[metric]);
      const sum = values.reduce((a, b) => a + b, 0);
      result[metric] = {
        avg: Math.round((sum / values.length) * 10) / 10,
        max: Math.round(Math.max(...values) * 10) / 10,
        min: Math.round(Math.min(...values) * 10) / 10,
      };
    }

    return {
      serverId: dataset.serverId,
      serverType: dataset.serverType,
      cpu: result.cpu,
      memory: result.memory,
      disk: result.disk,
      network: result.network,
    };
  });
}

/**
 * 24시간 트렌드 요약을 LLM 컨텍스트 텍스트로 변환
 */
export function get24hTrendLLMContext(): string {
  const summaries = get24hTrendSummaries();
  let context = '## 24시간 서버 트렌드 요약\n';

  for (const s of summaries) {
    context += `- ${s.serverId} (${s.serverType}): CPU avg ${s.cpu.avg}%/max ${s.cpu.max}%, Mem avg ${s.memory.avg}%/max ${s.memory.max}%, Disk avg ${s.disk.avg}%/max ${s.disk.max}%\n`;
  }

  return context;
}

/**
 * 캐시 초기화 (테스트용)
 */
export function clearMetricsCache(): void {
  _cachedDatasets = null;
  console.log('[Fixed24hMetrics] 캐시 초기화됨');
}
