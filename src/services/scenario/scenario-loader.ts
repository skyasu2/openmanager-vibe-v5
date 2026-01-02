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

/**
 * 🎯 현재 시나리오 정보 가져오기
 *
 * @returns {Promise<{scenario: string, hour: number} | null>}
 */
export async function getCurrentScenario(): Promise<{
  scenario: string;
  hour: number;
} | null> {
  try {
    const koreaTime = new Date().toLocaleString('en-US', {
      timeZone: 'Asia/Seoul',
    });
    const koreaDate = new Date(koreaTime);
    const currentHour = koreaDate.getHours();

    const hourlyData = await loadHourlyJsonFile(currentHour);
    if (!hourlyData) return null;

    return {
      scenario: hourlyData.scenario,
      hour: currentHour,
    };
  } catch {
    return null;
  }
}

/**
 * 📋 시나리오 기반 로그 생성
 *
 * 시나리오와 서버 메트릭에 맞는 로그를 동적으로 생성합니다.
 * DB 호출 없이 클라이언트에서 생성하여 비용 절감.
 *
 * @param scenario - 현재 시나리오 설명
 * @param serverMetrics - 서버 메트릭 (cpu, memory, disk, network)
 * @param serverId - 서버 ID
 * @returns 로그 배열
 */
export function generateScenarioLogs(
  scenario: string,
  serverMetrics: { cpu: number; memory: number; disk: number; network: number },
  serverId: string
): Array<{
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  message: string;
  source: string;
}> {
  const logs: Array<{
    timestamp: string;
    level: 'info' | 'warn' | 'error';
    message: string;
    source: string;
  }> = [];

  const now = new Date();
  const { cpu, memory, disk, network } = serverMetrics;

  // 시나리오 키워드 매칭
  const scenarioLower = scenario.toLowerCase();

  // 1. 정상 운영 시나리오
  if (scenarioLower.includes('정상')) {
    logs.push({
      timestamp: new Date(now.getTime() - 60000).toISOString(),
      level: 'info',
      message: '시스템 헬스체크 통과 - 모든 서비스 정상',
      source: 'health-monitor',
    });
    logs.push({
      timestamp: new Date(now.getTime() - 120000).toISOString(),
      level: 'info',
      message: `현재 리소스 상태: CPU ${cpu.toFixed(1)}%, Memory ${memory.toFixed(1)}%`,
      source: 'metrics-collector',
    });
  }

  // 2. CPU 과부하 시나리오
  if (scenarioLower.includes('cpu') || scenarioLower.includes('과부하')) {
    if (cpu > 80) {
      logs.push({
        timestamp: new Date(now.getTime() - 30000).toISOString(),
        level: 'error',
        message: `CPU 사용률 임계치 초과: ${cpu.toFixed(1)}% (임계값: 80%)`,
        source: 'alert-manager',
      });
    }
    logs.push({
      timestamp: new Date(now.getTime() - 90000).toISOString(),
      level: 'warn',
      message: 'API 요청 처리 지연 감지 - 큐 대기열 증가',
      source: 'api-gateway',
    });
    logs.push({
      timestamp: new Date(now.getTime() - 180000).toISOString(),
      level: 'info',
      message: '요청 폭증 감지 - 오토스케일링 검토 필요',
      source: 'load-balancer',
    });
  }

  // 3. 메모리 누수 시나리오
  if (
    scenarioLower.includes('메모리') ||
    scenarioLower.includes('memory') ||
    scenarioLower.includes('oom')
  ) {
    if (memory > 85) {
      logs.push({
        timestamp: new Date(now.getTime() - 30000).toISOString(),
        level: 'error',
        message: `메모리 사용률 위험: ${memory.toFixed(1)}% - OOM 위험`,
        source: 'memory-monitor',
      });
    }
    logs.push({
      timestamp: new Date(now.getTime() - 120000).toISOString(),
      level: 'warn',
      message: '메모리 증가 추세 감지 - 누수 의심',
      source: 'memory-monitor',
    });
    logs.push({
      timestamp: new Date(now.getTime() - 300000).toISOString(),
      level: 'info',
      message: 'GC 실행 완료 - 해제된 메모리: 256MB',
      source: 'jvm-monitor',
    });
  }

  // 4. 디스크 I/O 시나리오
  if (
    scenarioLower.includes('디스크') ||
    scenarioLower.includes('disk') ||
    scenarioLower.includes('백업')
  ) {
    if (disk > 80) {
      logs.push({
        timestamp: new Date(now.getTime() - 60000).toISOString(),
        level: 'error',
        message: `디스크 사용률 경고: ${disk.toFixed(1)}%`,
        source: 'disk-monitor',
      });
    }
    logs.push({
      timestamp: new Date(now.getTime() - 120000).toISOString(),
      level: 'warn',
      message: '디스크 I/O 대기열 증가 - 백업 작업 진행 중',
      source: 'io-scheduler',
    });
    logs.push({
      timestamp: new Date(now.getTime() - 180000).toISOString(),
      level: 'info',
      message: '자동 백업 시작 - 예상 소요시간: 15분',
      source: 'backup-service',
    });
  }

  // 5. 네트워크 문제 시나리오
  if (
    scenarioLower.includes('네트워크') ||
    scenarioLower.includes('network') ||
    scenarioLower.includes('패킷')
  ) {
    logs.push({
      timestamp: new Date(now.getTime() - 45000).toISOString(),
      level: 'error',
      message: '패킷 손실률 증가 감지: 2.3%',
      source: 'network-monitor',
    });
    logs.push({
      timestamp: new Date(now.getTime() - 150000).toISOString(),
      level: 'warn',
      message: '로드밸런서 응답 지연: 평균 350ms',
      source: 'load-balancer',
    });
    logs.push({
      timestamp: new Date(now.getTime() - 240000).toISOString(),
      level: 'info',
      message: `현재 네트워크 사용률: ${network.toFixed(1)}%`,
      source: 'network-monitor',
    });
  }

  // 6. Redis/캐시 문제 시나리오
  if (
    scenarioLower.includes('redis') ||
    scenarioLower.includes('캐시') ||
    scenarioLower.includes('cache')
  ) {
    logs.push({
      timestamp: new Date(now.getTime() - 60000).toISOString(),
      level: 'error',
      message: 'Redis 메모리 사용량 임계치 도달 - eviction 발생',
      source: 'redis-monitor',
    });
    logs.push({
      timestamp: new Date(now.getTime() - 180000).toISOString(),
      level: 'warn',
      message: '캐시 히트율 저하: 78% → 65%',
      source: 'cache-manager',
    });
    logs.push({
      timestamp: new Date(now.getTime() - 300000).toISOString(),
      level: 'info',
      message: 'Redis 연결 풀 상태: 45/50 활성',
      source: 'redis-monitor',
    });
  }

  // 기본 로그 (시나리오 매칭 없는 경우)
  if (logs.length === 0) {
    logs.push({
      timestamp: new Date(now.getTime() - 60000).toISOString(),
      level: 'info',
      message: `서버 상태 정상 - ${serverId}`,
      source: 'system',
    });
  }

  // 시간순 정렬 (최신 먼저)
  return logs.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}
