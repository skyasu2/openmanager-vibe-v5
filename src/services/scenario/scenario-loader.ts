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
import { logger } from '@/lib/logging';
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
  scrapeConfig: {
    scrapeInterval: string;
    evaluationInterval: string;
    source: string;
  };
  _scenario?: string;
  dataPoints: Array<{
    timestampMs: number;
    targets: Record<string, PrometheusTargetData>;
  }>;
  metadata: {
    version: string;
    format: string;
    totalDataPoints: number;
    intervalMinutes: number;
    serverCount: number;
    affectedServers: number;
  };
}

interface PrometheusTargetData {
  job: string;
  instance: string;
  labels: {
    hostname: string;
    datacenter: string;
    environment: string;
    server_type: string;
    os: string;
    os_version: string;
  };
  metrics: {
    up: 0 | 1;
    node_cpu_usage_percent: number;
    node_memory_usage_percent: number;
    node_filesystem_usage_percent: number;
    node_network_transmit_bytes_rate: number;
    node_load1: number;
    node_load5: number;
    node_boot_time_seconds: number;
    node_procs_running: number;
    node_http_request_duration_milliseconds: number;
  };
  nodeInfo: {
    cpu_cores: number;
    memory_total_bytes: number;
    disk_total_bytes: number;
  };
  logs: string[];
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

/**
 * PrometheusTargetData → RawServerData 변환
 */
function targetToRawServerData(target: PrometheusTargetData): RawServerData {
  const serverId = target.instance.replace(/:9100$/, '');
  const cpu = target.metrics.node_cpu_usage_percent;
  const memory = target.metrics.node_memory_usage_percent;
  const disk = target.metrics.node_filesystem_usage_percent;
  const network = target.metrics.node_network_transmit_bytes_rate;

  let status: RawServerData['status'] = 'online';
  if (target.metrics.up === 0) {
    status = 'offline';
  } else if (cpu >= 90 || memory >= 90 || disk >= 90 || network >= 85) {
    status = 'critical';
  } else if (cpu >= 80 || memory >= 80 || disk >= 80 || network >= 70) {
    status = 'warning';
  }

  return {
    id: serverId,
    name: target.labels.hostname.replace('.openmanager.kr', ''),
    hostname: target.labels.hostname,
    type: target.labels.server_type,
    location: target.labels.datacenter,
    environment: target.labels.environment,
    status,
    cpu,
    memory,
    disk,
    network,
    responseTime: target.metrics.node_http_request_duration_milliseconds,
    uptime: Math.round(
      Date.now() / 1000 - target.metrics.node_boot_time_seconds
    ),
    ip: '',
    os: `${target.labels.os} ${target.labels.os_version}`,
    specs: {
      cpu_cores: target.nodeInfo.cpu_cores,
      memory_gb: Math.round(
        target.nodeInfo.memory_total_bytes / (1024 * 1024 * 1024)
      ),
      disk_gb: Math.round(
        target.nodeInfo.disk_total_bytes / (1024 * 1024 * 1024)
      ),
    },
    services: [],
    processes: target.metrics.node_procs_running,
  };
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
      logger.error(`[ScenarioLoader] JSON 로드 실패: ${response.status}`);
      return null;
    }

    const data = (await response.json()) as HourlyJsonData;

    // 캐시 저장
    jsonCache.set(hour, { data, timestamp: Date.now() });

    return data;
  } catch (error) {
    logger.error('[ScenarioLoader] JSON 파싱 오류:', error);
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
      logger.error(`[ScenarioLoader] hour-${currentHour} 데이터 없음`);
      return [];
    }

    // 10분 간격 dataPoint 선택 (0-5 인덱스)
    const dataPointIndex = Math.floor(currentMinute / 10);
    const clampedIndex = Math.min(
      dataPointIndex,
      hourlyData.dataPoints.length - 1
    );
    const dataPoint = hourlyData.dataPoints[clampedIndex];

    if (!dataPoint?.targets) {
      logger.error(`[ScenarioLoader] dataPoint[${clampedIndex}] 없음`);
      return [];
    }

    // PrometheusTarget → RawServerData → EnhancedServerMetrics 변환
    return Object.values(dataPoint.targets).map((target) =>
      convertToEnhancedMetrics(targetToRawServerData(target), currentHour)
    );
  } catch (error) {
    logger.error('[ScenarioLoader] 데이터 로드 오류:', error);
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
      scenario: hourlyData._scenario || '', // _scenario에서 읽어서 내부 scenario로 매핑
      hour: currentHour,
    };
  } catch {
    return null;
  }
}

/**
 * 📋 시나리오 기반 로그 생성 (실제 syslog 형식)
 *
 * 상용 로그 수집 프로그램과 유사한 형태의 로그를 생성합니다.
 * - syslog 형식: hostname process[pid]: message
 * - 다양한 소스: nginx, docker, kernel, systemd, mysqld, redis 등
 * - 실제 에러 코드 포함
 *
 * @param scenario - 현재 시나리오 설명
 * @param serverMetrics - 서버 메트릭 (cpu, memory, disk, network)
 * @param serverId - 서버 ID (hostname으로 사용)
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
  const hostname = serverId.split('.')[0] || serverId;

  // 랜덤 PID 생성 헬퍼
  const pid = (base: number) => base + Math.floor(Math.random() * 1000);

  // 시나리오 키워드 매칭
  const scenarioLower = scenario.toLowerCase();

  // 1. 정상 운영 시나리오
  if (scenarioLower.includes('정상')) {
    logs.push({
      timestamp: new Date(now.getTime() - 30000).toISOString(),
      level: 'info',
      message: `${hostname} systemd[1]: Started Daily apt download activities.`,
      source: 'systemd',
    });
    logs.push({
      timestamp: new Date(now.getTime() - 45000).toISOString(),
      level: 'info',
      message: `${hostname} CRON[${pid(20000)}]: (root) CMD (/usr/lib/apt/apt.systemd.daily install)`,
      source: 'cron',
    });
    logs.push({
      timestamp: new Date(now.getTime() - 60000).toISOString(),
      level: 'info',
      message: `${hostname} nginx[${pid(1000)}]: 10.0.0.1 - - "GET /health HTTP/1.1" 200 15 "-" "kube-probe/1.28"`,
      source: 'nginx',
    });
    logs.push({
      timestamp: new Date(now.getTime() - 90000).toISOString(),
      level: 'info',
      message: `${hostname} dockerd[${pid(800)}]: time="2026-01-03T10:00:00.000000000Z" level=info msg="Container health status: healthy"`,
      source: 'docker',
    });
  }

  // 2. CPU 과부하 시나리오
  if (
    scenarioLower.includes('cpu') ||
    scenarioLower.includes('과부하') ||
    scenarioLower.includes('api')
  ) {
    logs.push({
      timestamp: new Date(now.getTime() - 15000).toISOString(),
      level: 'error',
      message: `${hostname} kernel: [${pid(50000)}.${pid(100)}] CPU${Math.floor(Math.random() * 8)}: Package temperature above threshold, cpu clock throttled`,
      source: 'kernel',
    });
    logs.push({
      timestamp: new Date(now.getTime() - 30000).toISOString(),
      level: 'error',
      message: `${hostname} nginx[${pid(1000)}]: upstream timed out (110: Connection timed out) while reading response header from upstream`,
      source: 'nginx',
    });
    logs.push({
      timestamp: new Date(now.getTime() - 45000).toISOString(),
      level: 'warn',
      message: `${hostname} java[${pid(5000)}]: GC overhead limit exceeded - heap usage at ${cpu.toFixed(0)}%`,
      source: 'java',
    });
    logs.push({
      timestamp: new Date(now.getTime() - 60000).toISOString(),
      level: 'warn',
      message: `${hostname} haproxy[${pid(2000)}]: backend api_servers has no server available! (qcur=${Math.floor(cpu * 2)})`,
      source: 'haproxy',
    });
    logs.push({
      timestamp: new Date(now.getTime() - 90000).toISOString(),
      level: 'info',
      message: `${hostname} systemd[1]: node-exporter.service: Watchdog timeout (limit 30s)!`,
      source: 'systemd',
    });
  }

  // 3. 메모리 누수 시나리오
  if (
    scenarioLower.includes('메모리') ||
    scenarioLower.includes('memory') ||
    scenarioLower.includes('oom') ||
    scenarioLower.includes('redis') ||
    scenarioLower.includes('캐시')
  ) {
    logs.push({
      timestamp: new Date(now.getTime() - 10000).toISOString(),
      level: 'error',
      message: `${hostname} kernel: Out of memory: Killed process ${pid(10000)} (java) total-vm:${Math.floor(memory * 100)}kB, anon-rss:${Math.floor(memory * 80)}kB`,
      source: 'kernel',
    });
    logs.push({
      timestamp: new Date(now.getTime() - 25000).toISOString(),
      level: 'error',
      message: `${hostname} redis-server[${pid(3000)}]: # WARNING: Memory usage ${memory.toFixed(0)}% of max. Consider increasing maxmemory.`,
      source: 'redis',
    });
    logs.push({
      timestamp: new Date(now.getTime() - 40000).toISOString(),
      level: 'warn',
      message: `${hostname} dockerd[${pid(800)}]: container ${serverId.substring(0, 12)} OOMKilled=true (memory limit: 2GiB)`,
      source: 'docker',
    });
    logs.push({
      timestamp: new Date(now.getTime() - 55000).toISOString(),
      level: 'warn',
      message: `${hostname} java[${pid(5000)}]: java.lang.OutOfMemoryError: GC overhead limit exceeded`,
      source: 'java',
    });
    logs.push({
      timestamp: new Date(now.getTime() - 80000).toISOString(),
      level: 'info',
      message: `${hostname} java[${pid(5000)}]: [GC (Allocation Failure) ${Math.floor(memory * 50)}K->${Math.floor(memory * 30)}K(${Math.floor(memory * 100)}K), 0.${pid(100)} secs]`,
      source: 'java',
    });
  }

  // 4. 디스크 I/O 시나리오
  if (
    scenarioLower.includes('디스크') ||
    scenarioLower.includes('disk') ||
    scenarioLower.includes('백업') ||
    scenarioLower.includes('i/o')
  ) {
    logs.push({
      timestamp: new Date(now.getTime() - 20000).toISOString(),
      level: 'error',
      message: `${hostname} kernel: [${pid(80000)}.${pid(100)}] EXT4-fs warning (device sda1): ext4_dx_add_entry:2461: Directory (ino: ${pid(100000)}) index full, reach max htree level :2`,
      source: 'kernel',
    });
    logs.push({
      timestamp: new Date(now.getTime() - 35000).toISOString(),
      level: 'error',
      message: `${hostname} mysqld[${pid(4000)}]: [ERROR] InnoDB: Write to file ./ib_logfile0 failed at offset ${pid(1000000)}. ${disk.toFixed(0)}% disk used.`,
      source: 'mysql',
    });
    logs.push({
      timestamp: new Date(now.getTime() - 50000).toISOString(),
      level: 'warn',
      message: `${hostname} rsync[${pid(15000)}]: rsync: write failed on "/backup/db-${hostname}.sql": No space left on device (28)`,
      source: 'rsync',
    });
    logs.push({
      timestamp: new Date(now.getTime() - 70000).toISOString(),
      level: 'info',
      message: `${hostname} systemd[1]: Starting Daily Backup Service...`,
      source: 'systemd',
    });
    logs.push({
      timestamp: new Date(now.getTime() - 120000).toISOString(),
      level: 'info',
      message: `${hostname} pg_dump[${pid(18000)}]: pg_dump: archiving data for table "public.logs" (${Math.floor(disk * 10)}MB)`,
      source: 'postgres',
    });
  }

  // 5. 네트워크 문제 시나리오
  if (
    scenarioLower.includes('네트워크') ||
    scenarioLower.includes('network') ||
    scenarioLower.includes('패킷') ||
    scenarioLower.includes('lb') ||
    scenarioLower.includes('로드밸런서')
  ) {
    logs.push({
      timestamp: new Date(now.getTime() - 12000).toISOString(),
      level: 'error',
      message: `${hostname} kernel: [${pid(90000)}.${pid(100)}] nf_conntrack: nf_conntrack: table full, dropping packet`,
      source: 'kernel',
    });
    logs.push({
      timestamp: new Date(now.getTime() - 28000).toISOString(),
      level: 'error',
      message: `${hostname} nginx[${pid(1000)}]: connect() failed (111: Connection refused) while connecting to upstream`,
      source: 'nginx',
    });
    logs.push({
      timestamp: new Date(now.getTime() - 42000).toISOString(),
      level: 'warn',
      message: `${hostname} haproxy[${pid(2000)}]: Server api_backend/server1 is DOWN, reason: Layer4 timeout, check duration: 5001ms`,
      source: 'haproxy',
    });
    logs.push({
      timestamp: new Date(now.getTime() - 65000).toISOString(),
      level: 'warn',
      message: `${hostname} kernel: [${pid(90000)}.${pid(100)}] TCP: request_sock_TCP: Possible SYN flooding on port 80. Sending cookies.`,
      source: 'kernel',
    });
    logs.push({
      timestamp: new Date(now.getTime() - 95000).toISOString(),
      level: 'info',
      message: `${hostname} sshd[${pid(22000)}]: Received disconnect from 10.0.0.${Math.floor(network / 10)} port ${pid(40000)}: 11: disconnected by user`,
      source: 'sshd',
    });
  }

  // 기본 로그 (시나리오 매칭 없는 경우)
  if (logs.length === 0) {
    logs.push({
      timestamp: new Date(now.getTime() - 30000).toISOString(),
      level: 'info',
      message: `${hostname} systemd[1]: Started Session ${pid(100)} of user root.`,
      source: 'systemd',
    });
    logs.push({
      timestamp: new Date(now.getTime() - 60000).toISOString(),
      level: 'info',
      message: `${hostname} nginx[${pid(1000)}]: 10.0.0.1 - - "GET / HTTP/1.1" 200 612 "-" "curl/7.68.0"`,
      source: 'nginx',
    });
  }

  // 시간순 정렬 (최신 먼저)
  return logs.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}
