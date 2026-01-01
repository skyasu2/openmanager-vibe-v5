/**
 * 🎯 **Single Source of Truth** - 24시간 시나리오 데이터 로더
 *
 * **v5.85.0 개선**: Dashboard/AI Engine 데이터 동기화
 * - ✅ JSON 파일 기반 (10분 간격)
 * - ✅ Dashboard와 AI Engine 동일 데이터 사용
 * - ✅ 변형은 sync 스크립트에서 미리 적용
 *
 * @see scripts/data/sync-hourly-data.ts - JSON 생성 스크립트
 * @see docs/reference/architecture/data/data-architecture.md - 아키텍처 문서
 */

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
 * JSON 파일 데이터 구조 (sync 스크립트와 동기화)
 */
interface HourlyJsonData {
  hour: number;
  scenario: string;
  dataPoints: Array<{
    timestamp: string; // "00:00", "00:10", ...
    servers: Record<string, RawServerData>;
  }>;
  metadata: {
    version: string;
    totalDataPoints: number;
    intervalMinutes: number;
    serverCount: number;
    affectedServers: number;
  };
}

interface RawServerData {
  id: string;
  name: string;
  hostname: string;
  type: string;
  location: string;
  environment: string;
  status: 'online' | 'warning' | 'critical' | 'offline';
  cpu: number;
  memory: number;
  disk: number;
  network: number;
  responseTime: number;
  uptime: number;
  ip: string;
  os: string;
  specs: {
    cpu_cores: number;
    memory_gb: number;
    disk_gb: number;
  };
  services: string[];
  processes: number;
}

// JSON 캐시 (메모리 최적화)
const jsonCache: Map<number, { data: HourlyJsonData; timestamp: number }> =
  new Map();
const CACHE_TTL = 60000; // 1분 캐시

/**
 * JSON 파일 로드 (브라우저/서버 호환)
 */
async function loadHourlyJsonFile(
  hour: number
): Promise<HourlyJsonData | null> {
  const paddedHour = hour.toString().padStart(2, '0');

  // 캐시 확인
  const cached = jsonCache.get(hour);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  try {
    // 브라우저/서버 모두 fetch 사용
    const response = await fetch(`/hourly-data/hour-${paddedHour}.json`);
    if (!response.ok) {
      console.error(`[ScenarioLoader] JSON 로드 실패: ${response.status}`);
      return null;
    }

    const data = (await response.json()) as HourlyJsonData;

    // 캐시 저장
    jsonCache.set(hour, { data, timestamp: Date.now() });

    return data;
  } catch (error) {
    console.error('[ScenarioLoader] JSON 파싱 오류:', error);
    return null;
  }
}

/**
 * 🎯 Load Server Data from JSON Files (SSOT)
 *
 * Dashboard와 AI Engine이 동일한 데이터를 사용합니다.
 * - 데이터 소스: `/hourly-data/hour-XX.json`
 * - 간격: 10분 (6개 dataPoints/시간)
 * - 변형: sync 스크립트에서 미리 적용됨
 *
 * @returns {Promise<EnhancedServerMetrics[]>} 15개 서버 메트릭스
 */
export async function loadHourlyScenarioData(): Promise<
  EnhancedServerMetrics[]
> {
  try {
    // 🇰🇷 KST (Asia/Seoul) 기준 시간 사용
    const koreaTime = new Date().toLocaleString('en-US', {
      timeZone: 'Asia/Seoul',
    });
    const koreaDate = new Date(koreaTime);

    const currentHour = koreaDate.getHours(); // 0-23
    const currentMinute = koreaDate.getMinutes(); // 0-59

    // JSON 파일 로드
    const hourlyData = await loadHourlyJsonFile(currentHour);
    if (!hourlyData) {
      console.error(`[ScenarioLoader] hour-${currentHour} 데이터 없음`);
      return [];
    }

    // 10분 간격 dataPoint 선택 (0-5 인덱스)
    const dataPointIndex = Math.floor(currentMinute / 10);
    const clampedIndex = Math.min(
      dataPointIndex,
      hourlyData.dataPoints.length - 1
    );
    const dataPoint = hourlyData.dataPoints[clampedIndex];

    if (!dataPoint?.servers) {
      console.error(`[ScenarioLoader] dataPoint[${clampedIndex}] 없음`);
      return [];
    }

    // RawServerData → EnhancedServerMetrics 변환
    return Object.values(dataPoint.servers).map((serverData) =>
      convertToEnhancedMetrics(serverData, currentHour)
    );
  } catch (error) {
    console.error('[ScenarioLoader] 데이터 로드 오류:', error);
    return [];
  }
}

/**
 * RawServerData → EnhancedServerMetrics 변환
 */
function convertToEnhancedMetrics(
  serverData: RawServerData,
  currentHour: number
): EnhancedServerMetrics {
  const cpu = serverData.cpu ?? 0;
  const memory = serverData.memory ?? 0;
  const disk = serverData.disk ?? 0;
  const network = serverData.network ?? 0;
  const status = serverData.status ?? 'online';

  return {
    id: serverData.id,
    name: serverData.name,
    hostname: serverData.hostname,
    status,
    cpu,
    cpu_usage: cpu,
    memory,
    memory_usage: memory,
    disk,
    disk_usage: disk,
    network,
    network_in: Math.round(network * 0.6),
    network_out: Math.round(network * 0.4),
    uptime: serverData.uptime ?? 2592000,
    responseTime: serverData.responseTime ?? 150,
    last_updated: new Date().toISOString(),
    location: serverData.location,
    alerts: [],
    ip: serverData.ip,
    os: serverData.os,
    type: serverData.type,
    role: mapTypeToRole(serverData.type),
    environment: serverData.environment,
    provider: `DataCenter-${currentHour.toString().padStart(2, '0')}`,
    specs: {
      cpu_cores: serverData.specs?.cpu_cores ?? 8,
      memory_gb: serverData.specs?.memory_gb ?? 16,
      disk_gb: serverData.specs?.disk_gb ?? 200,
      network_speed: '1Gbps',
    },
    lastUpdate: new Date().toISOString(),
    services: serverData.services ?? [],
    systemInfo: {
      os: serverData.os,
      uptime: `${Math.floor((serverData.uptime ?? 2592000) / 3600)}h`,
      processes: serverData.processes ?? 120,
      zombieProcesses: status === 'critical' ? 3 : status === 'warning' ? 1 : 0,
      loadAverage: `${(cpu / 20).toFixed(2)}, ${((cpu - 5) / 20).toFixed(2)}, ${((cpu - 10) / 20).toFixed(2)}`,
      lastUpdate: new Date().toISOString(),
    },
    networkInfo: {
      interface: 'eth0',
      receivedBytes: `${(network * 0.6).toFixed(1)} MB`,
      sentBytes: `${(network * 0.4).toFixed(1)} MB`,
      receivedErrors: status === 'critical' ? 2 : 0,
      sentErrors: status === 'critical' ? 1 : 0,
      status,
    },
  };
}

/**
 * 서버 타입 → 역할 매핑
 */
function mapTypeToRole(type: string): string {
  const roleMap: Record<string, string> = {
    web: 'web',
    application: 'api',
    database: 'database',
    cache: 'cache',
    storage: 'storage',
    loadbalancer: 'loadbalancer',
  };
  return roleMap[type] || type;
}

/**
 * 캐시 초기화 (테스트/디버깅용)
 */
export function clearJsonCache(): void {
  jsonCache.clear();
}
