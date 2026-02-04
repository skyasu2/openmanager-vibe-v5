import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import type { EnhancedServerMetrics } from '../../types/server-metrics';
import { determineServerStatus } from '../../config/status-thresholds';
import { logger } from '../../lib/logger';

/**
 * JSON 데이터 구조 타입 정의
 * Vercel의 `public/hourly-data/hour-XX.json`과 동일한 구조
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

// 캐시: 한 번 읽은 JSON 파일을 메모리에 유지
const jsonCache: Map<number, HourlyJsonData> = new Map();

/**
 * JSON 파일에서 시간별 데이터 로드
 * Cloud Run 환경에서는 로컬 파일 시스템 사용
 */
function loadHourlyJsonFile(hour: number): HourlyJsonData | null {
  // 캐시 확인
  if (jsonCache.has(hour)) {
    return jsonCache.get(hour)!;
  }

  // 파일 경로 (Cloud Run 배포 시 data/ 폴더)
  const paddedHour = hour.toString().padStart(2, '0');
  const possiblePaths = [
    join(__dirname, '../../../data/hourly-data', `hour-${paddedHour}.json`),
    join(process.cwd(), 'data/hourly-data', `hour-${paddedHour}.json`),
    join(process.cwd(), 'cloud-run/ai-engine/data/hourly-data', `hour-${paddedHour}.json`),
  ];

  for (const filePath of possiblePaths) {
    if (existsSync(filePath)) {
      try {
        const content = readFileSync(filePath, 'utf-8');
        const data = JSON.parse(content) as HourlyJsonData;
        jsonCache.set(hour, data);
        logger.info(`[ScenarioLoader] JSON 로드 성공: hour-${paddedHour}.json`);
        return data;
      } catch (error) {
        logger.error(`[ScenarioLoader] JSON 파싱 오류: ${filePath}`, error);
      }
    }
  }

  logger.warn(`[ScenarioLoader] JSON 파일 없음: hour-${paddedHour}.json`);
  return null;
}

/**
 * 🎯 Load Server Data from JSON Files (SSOT)
 *
 * **Single Source of Truth**: Vercel과 동일한 JSON 파일 사용
 * - 데이터 소스: `data/hourly-data/hour-XX.json`
 * - 서버 ID: `web-prd-01`, `api-prd-01` 등 (Vercel과 동일)
 * - 15개 서버, 24시간 5분 간격 데이터
 */
export async function loadHourlyScenarioData(): Promise<EnhancedServerMetrics[]> {
  try {
    // KST (Asia/Seoul) 기준 현재 시간
    const koreaTime = new Date().toLocaleString('en-US', {
      timeZone: 'Asia/Seoul',
    });
    const koreaDate = new Date(koreaTime);
    const currentHour = koreaDate.getHours(); // 0-23
    const currentMinute = koreaDate.getMinutes(); // 0-59

    // JSON 파일 로드
    const hourlyData = loadHourlyJsonFile(currentHour);
    if (!hourlyData) {
      logger.error(`[ScenarioLoader] hour-${currentHour} 데이터 없음, 빈 배열 반환`);
      return [];
    }

    // 10분 간격 dataPoint 선택 (0-5 인덱스)
    const dataPointIndex = Math.floor(currentMinute / 10);
    const clampedIndex = Math.min(dataPointIndex, hourlyData.dataPoints.length - 1);
    const dataPoint = hourlyData.dataPoints[clampedIndex];

    if (!dataPoint || !dataPoint.targets) {
      logger.error(`[ScenarioLoader] dataPoint[${clampedIndex}] 없음`);
      return [];
    }

    // PrometheusTarget → EnhancedServerMetrics 변환
    return Object.values(dataPoint.targets).map((target) => {
      const cpu = target.metrics.node_cpu_usage_percent ?? 0;
      const memory = target.metrics.node_memory_usage_percent ?? 0;
      const disk = target.metrics.node_filesystem_usage_percent ?? 0;
      const network = target.metrics.node_network_transmit_bytes_rate ?? 0;
      const serverId = target.instance.replace(/:9100$/, '');

      // 상태 결정 (Dashboard와 동일한 로직)
      const status = target.metrics.up === 0
        ? 'offline'
        : determineServerStatus({ cpu, memory, disk, network });

      return {
        id: serverId,
        name: target.labels.hostname.replace('.openmanager.kr', ''),
        hostname: target.labels.hostname,
        status,
        cpu,
        cpu_usage: cpu,
        memory,
        memory_usage: memory,
        disk,
        disk_usage: disk,
        network,
        network_in: network * 0.6,
        network_out: network * 0.4,
        uptime: Math.round(Date.now() / 1000 - target.metrics.node_boot_time_seconds),
        responseTime: target.metrics.node_http_request_duration_milliseconds,
        last_updated: new Date().toISOString(),
        location: target.labels.datacenter,
        alerts: [],
        ip: '',
        os: `${target.labels.os} ${target.labels.os_version}`,
        type: target.labels.server_type,
        role: target.labels.server_type,
        environment: target.labels.environment,
        provider: 'JSON-SSOT',
        specs: {
          cpu_cores: target.nodeInfo.cpu_cores,
          memory_gb: Math.round(target.nodeInfo.memory_total_bytes / (1024 * 1024 * 1024)),
          disk_gb: Math.round(target.nodeInfo.disk_total_bytes / (1024 * 1024 * 1024)),
          network_speed: '1Gbps',
        },
        services: [],
        systemInfo: {
          os: `${target.labels.os} ${target.labels.os_version}`,
          uptime: `${Math.floor((Date.now() / 1000 - target.metrics.node_boot_time_seconds) / 3600)}h`,
          processes: target.metrics.node_procs_running,
          loadAverage: `${target.metrics.node_load1.toFixed(2)}`,
          lastUpdate: new Date().toISOString(),
        },
        networkInfo: {
          interface: 'eth0',
          receivedBytes: `${(network * 0.6).toFixed(1)} MB`,
          sentBytes: `${(network * 0.4).toFixed(1)} MB`,
          status: 'online',
        },
      } as EnhancedServerMetrics;
    });
  } catch (error) {
    logger.error('[ScenarioLoader] 데이터 로드 오류:', error);
    return [];
  }
}

/**
 * 🎯 Load Historical Context for a Server (Past N hours)
 *
 * Analyst Agent에서 트렌드 분석에 사용
 * JSON 파일에서 과거 N시간 데이터 로드
 *
 * @param serverId - 서버 ID (예: "web-prd-01")
 * @param hours - 조회할 시간 수 (기본: 6시간)
 * @returns 10분 간격 데이터 포인트 배열
 */
export async function loadHistoricalContext(
  serverId: string,
  hours: number = 6
): Promise<Array<{ timestamp: number; cpu: number; memory: number; disk: number }>> {
  try {
    const history: Array<{
      timestamp: number;
      cpu: number;
      memory: number;
      disk: number;
    }> = [];

    // KST 현재 시간
    const koreaTime = new Date().toLocaleString('en-US', {
      timeZone: 'Asia/Seoul',
    });
    const now = new Date(koreaTime);
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    // 과거 hours 시간 동안의 데이터 수집 (10분 간격)
    const totalPoints = hours * 6; // 6 points per hour (10-min intervals)

    for (let i = 0; i < totalPoints; i++) {
      // i * 10분 전의 시간 계산
      const targetTime = new Date(now.getTime() - i * 10 * 60 * 1000);
      const targetHour = targetTime.getHours();
      const targetMinute = targetTime.getMinutes();

      // 해당 시간의 JSON 파일 로드
      const hourlyData = loadHourlyJsonFile(targetHour);
      if (!hourlyData) continue;

      // 해당 분의 dataPoint 찾기 (10분 간격)
      const dataPointIndex = Math.floor(targetMinute / 10);
      const clampedIndex = Math.min(dataPointIndex, hourlyData.dataPoints.length - 1);
      const dataPoint = hourlyData.dataPoints[clampedIndex];

      if (!dataPoint?.targets) continue;

      // Prometheus targets에서 서버 데이터 찾기 (instance = "serverId:9100")
      const instanceKey = `${serverId}:9100`;
      const target = dataPoint.targets[instanceKey];
      if (target) {
        history.push({
          timestamp: targetTime.getTime(),
          cpu: target.metrics.node_cpu_usage_percent ?? 0,
          memory: target.metrics.node_memory_usage_percent ?? 0,
          disk: target.metrics.node_filesystem_usage_percent ?? 0,
        });
      }
    }

    // 시간순 정렬 (과거 → 현재)
    return history.sort((a, b) => a.timestamp - b.timestamp);
  } catch (error) {
    logger.error('[ScenarioLoader] 히스토리 로드 오류:', error);
    return [];
  }
}

/**
 * 특정 서버의 현재 상태 조회
 */
export async function getServerById(serverId: string): Promise<EnhancedServerMetrics | null> {
  const servers = await loadHourlyScenarioData();
  return servers.find((s) => s.id === serverId) ?? null;
}

/**
 * 전체 서버 ID 목록 조회
 */
export async function getServerIds(): Promise<string[]> {
  const servers = await loadHourlyScenarioData();
  return servers.map((s) => s.id);
}

/**
 * 캐시 초기화 (테스트/디버깅용)
 */
export function clearJsonCache(): void {
  jsonCache.clear();
  logger.info('[ScenarioLoader] JSON 캐시 초기화됨');
}
