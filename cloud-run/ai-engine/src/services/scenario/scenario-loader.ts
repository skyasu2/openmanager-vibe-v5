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
  _pattern: string; // JSON 필드명 (외부 노출 방지)
  dataPoints: Array<{
    timestamp: string; // "00:00", "00:05", ...
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
        console.log(`[ScenarioLoader] JSON 로드 성공: hour-${paddedHour}.json`);
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

    if (!dataPoint || !dataPoint.servers) {
      logger.error(`[ScenarioLoader] dataPoint[${clampedIndex}] 없음`);
      return [];
    }

    // RawServerData → EnhancedServerMetrics 변환
    return Object.values(dataPoint.servers).map((serverData) => {
      const cpu = serverData.cpu ?? 0;
      const memory = serverData.memory ?? 0;
      const disk = serverData.disk ?? 0;
      const network = serverData.network ?? 0;

      // 상태 결정 (Dashboard와 동일한 로직)
      const status = determineServerStatus({ cpu, memory, disk, network });

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
        network_in: network * 0.6,
        network_out: network * 0.4,
        uptime: serverData.uptime ?? 86400 * 30,
        responseTime: serverData.responseTime ?? 50 + cpu * 2,
        last_updated: new Date().toISOString(),
        location: serverData.location,
        alerts: [],
        ip: serverData.ip,
        os: serverData.os,
        type: serverData.type,
        role: serverData.role,
        environment: serverData.environment,
        provider: 'JSON-SSOT',
        specs: {
          cpu_cores: serverData.specs?.cpu_cores ?? 8,
          memory_gb: serverData.specs?.memory_gb ?? 32,
          disk_gb: serverData.specs?.disk_gb ?? 512,
          network_speed: '1Gbps',
        },
        services: serverData.services ?? [],
        systemInfo: {
          os: serverData.os,
          uptime: `${Math.floor((serverData.uptime ?? 0) / 3600)}h`,
          processes: serverData.processes ?? 120 + Math.floor(cpu),
          loadAverage: `${(cpu / 20).toFixed(2)}`,
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

      if (!dataPoint?.servers) continue;

      // 서버 데이터 찾기
      const serverData = dataPoint.servers[serverId];
      if (serverData) {
        history.push({
          timestamp: targetTime.getTime(),
          cpu: serverData.cpu ?? 0,
          memory: serverData.memory ?? 0,
          disk: serverData.disk ?? 0,
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
  console.log('[ScenarioLoader] JSON 캐시 초기화됨');
}
