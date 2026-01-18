/**
 * 🎯 MetricsProvider - 단일 데이터 소스 (Single Source of Truth)
 *
 * 역할:
 * - 현재 한국 시간(KST) 기준으로 hourly-data JSON 파일에서 메트릭 제공
 * - Cloud Run AI와 동일한 데이터 소스 사용 (데이터 일관성 보장)
 * - 모든 API와 컴포넌트가 이 서비스를 통해 일관된 데이터 접근
 *
 * @updated 2026-01-04 - hourly-data 통합 (AI와 데이터 동기화)
 */

import { getServerStatus as getRulesServerStatus } from '@/config/rules/loader';
import {
  calculateAverageMetrics,
  FIXED_24H_DATASETS,
  type Fixed10MinMetric,
  getDataAtMinute,
} from '@/data/fixed-24h-metrics';
import { logger } from '@/lib/logging';
import { isServer, requireServerModule } from '@/lib/runtime/environment';

// ============================================================================
// Hourly Data Types (Cloud Run과 동일)
// ============================================================================

interface HourlyDataServer {
  id: string;
  name: string;
  type: string;
  location: string;
  cpu: number;
  memory: number;
  disk: number;
  network: number;
}

interface HourlyDataPoint {
  minute: number;
  timestamp: string;
  servers: Record<string, HourlyDataServer>;
}

interface HourlyData {
  hour: number;
  scenario: string;
  dataPoints: HourlyDataPoint[];
}

// ============================================================================
// Hourly Data Cache & Loader
// ============================================================================

let cachedHourlyData: { hour: number; data: HourlyData } | null = null;

/**
 * hourly-data JSON 파일 로드 (캐싱 적용)
 * @description 서버에서만 fs 사용, 클라이언트에서는 null 반환 (fallback 사용)
 */
function loadHourlyData(hour: number): HourlyData | null {
  // 클라이언트 환경에서는 fs 사용 불가 - fallback 데이터 사용
  if (!isServer) {
    return null;
  }

  // 캐시 히트
  if (cachedHourlyData?.hour === hour) {
    return cachedHourlyData.data;
  }

  // 서버에서만 동적으로 fs/path 로드
  const fs = requireServerModule<typeof import('fs')>('fs');
  const path = requireServerModule<typeof import('path')>('path');

  if (!fs || !path) {
    logger.warn('[MetricsProvider] fs/path 모듈 로드 실패');
    return null;
  }

  try {
    const paddedHour = hour.toString().padStart(2, '0');
    const filePath = path.join(
      process.cwd(),
      'public/hourly-data',
      `hour-${paddedHour}.json`
    );

    if (!fs.existsSync(filePath)) {
      logger.warn(`[MetricsProvider] hourly-data 파일 없음: ${filePath}`);
      return null;
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(content) as HourlyData;
    cachedHourlyData = { hour, data };
    logger.info(
      `[MetricsProvider] hourly-data 로드: hour-${paddedHour}.json (${Object.keys(data.dataPoints[0]?.servers || {}).length}개 서버)`
    );
    return data;
  } catch (error) {
    logger.error(`[MetricsProvider] hourly-data 파싱 실패:`, error);
    return null;
  }
}

/**
 * 서버 메트릭 (API 응답용)
 */
export interface ServerMetrics {
  serverId: string;
  serverType: string;
  location: string;
  timestamp: string; // ISO 8601
  minuteOfDay: number;
  cpu: number;
  memory: number;
  disk: number;
  network: number;
  logs: string[];
  status: 'online' | 'warning' | 'critical' | 'offline';
}

/**
 * 전체 시스템 요약
 */
export interface SystemSummary {
  timestamp: string;
  minuteOfDay: number;
  totalServers: number;
  onlineServers: number;
  warningServers: number;
  criticalServers: number;
  averageCpu: number;
  averageMemory: number;
  averageDisk: number;
  averageNetwork: number;
}

/**
 * 한국 시간(KST) 기준 현재 minuteOfDay 계산
 */
export function getKSTMinuteOfDay(): number {
  const now = new Date();
  // UTC + 9시간 = KST
  const kstOffset = 9 * 60; // 분 단위
  const utcMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();
  const kstMinutes = (utcMinutes + kstOffset) % 1440; // 1440 = 24시간

  // 10분 단위로 반올림
  return Math.floor(kstMinutes / 10) * 10;
}

/**
 * 현재 KST 타임스탬프 생성
 */
export function getKSTTimestamp(): string {
  const now = new Date();
  // KST 시간 계산
  const kstTime = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return kstTime.toISOString().replace('Z', '+09:00');
}

/**
 * 메트릭 값 기반 서버 상태 판별
 * @see /src/config/rules/system-rules.json (Single Source of Truth)
 * @see /src/config/rules/loader.ts (rulesLoader.getServerStatus)
 *
 * 임계값은 system-rules.json에서 관리됨:
 * - CPU/Memory: warning 80%, critical 90%
 * - Disk: warning 80%, critical 90%
 * - Network: warning 70%, critical 85%
 */
function determineStatus(
  cpu: number,
  memory: number,
  disk: number,
  network: number
): 'online' | 'warning' | 'critical' | 'offline' {
  // rulesLoader.getServerStatus() 사용 - Single Source of Truth
  return getRulesServerStatus({ cpu, memory, disk, network });
}

/**
 * 🎯 MetricsProvider 클래스
 * Singleton 패턴으로 구현하여 일관된 데이터 제공
 */
export class MetricsProvider {
  private static instance: MetricsProvider;

  private constructor() {}

  public static getInstance(): MetricsProvider {
    if (!MetricsProvider.instance) {
      MetricsProvider.instance = new MetricsProvider();
    }
    return MetricsProvider.instance;
  }

  /**
   * 현재 시간 기준 단일 서버 메트릭 조회
   * @description hourly-data JSON에서 로드 (Cloud Run AI와 동일 소스)
   */
  public getServerMetrics(serverId: string): ServerMetrics | null {
    const minuteOfDay = getKSTMinuteOfDay();
    const timestamp = getKSTTimestamp();
    const hour = Math.floor(minuteOfDay / 60);
    const minute = minuteOfDay % 60;

    // hourly-data에서 찾기 시도
    const hourlyData = loadHourlyData(hour);
    if (hourlyData) {
      const slotIndex = Math.floor(minute / 10);
      const dataPoint =
        hourlyData.dataPoints[slotIndex] || hourlyData.dataPoints[0];

      if (dataPoint?.servers?.[serverId]) {
        const server = dataPoint.servers[serverId];
        return {
          serverId: server.id,
          serverType: server.type,
          location: server.location,
          timestamp,
          minuteOfDay,
          cpu: server.cpu,
          memory: server.memory,
          disk: server.disk,
          network: server.network,
          logs: [],
          status: determineStatus(
            server.cpu,
            server.memory,
            server.disk,
            server.network
          ),
        };
      }
    }

    // fallback: fixed data에서 찾기
    const dataset = FIXED_24H_DATASETS.find((d) => d.serverId === serverId);
    if (!dataset) return null;

    const dataPoint = getDataAtMinute(dataset, minuteOfDay);
    if (!dataPoint) return null;

    return {
      serverId: dataset.serverId,
      serverType: dataset.serverType,
      location: dataset.location,
      timestamp,
      minuteOfDay,
      cpu: dataPoint.cpu,
      memory: dataPoint.memory,
      disk: dataPoint.disk,
      network: dataPoint.network,
      logs: dataPoint.logs,
      status: determineStatus(
        dataPoint.cpu,
        dataPoint.memory,
        dataPoint.disk,
        dataPoint.network
      ),
    };
  }

  /**
   * 현재 시간 기준 모든 서버 메트릭 조회
   * @description hourly-data JSON에서 로드 (Cloud Run AI와 동일 소스)
   */
  public getAllServerMetrics(): ServerMetrics[] {
    const minuteOfDay = getKSTMinuteOfDay();
    const timestamp = getKSTTimestamp();
    const hour = Math.floor(minuteOfDay / 60);
    const minute = minuteOfDay % 60;

    // hourly-data 로드 시도
    const hourlyData = loadHourlyData(hour);
    if (hourlyData) {
      // 10분 단위로 가장 가까운 dataPoint 찾기
      const slotIndex = Math.floor(minute / 10);
      const dataPoint =
        hourlyData.dataPoints[slotIndex] || hourlyData.dataPoints[0];

      if (dataPoint?.servers) {
        return Object.values(dataPoint.servers).map((server) => ({
          serverId: server.id,
          serverType: server.type,
          location: server.location,
          timestamp,
          minuteOfDay,
          cpu: server.cpu,
          memory: server.memory,
          disk: server.disk,
          network: server.network,
          logs: [], // hourly-data에는 logs 없음
          status: determineStatus(
            server.cpu,
            server.memory,
            server.disk,
            server.network
          ),
        }));
      }
    }

    // fallback: 기존 fixed-24h-metrics 사용
    logger.warn(
      '[MetricsProvider] hourly-data 로드 실패, fallback to fixed data'
    );
    return FIXED_24H_DATASETS.map((dataset) => {
      const dataPoint = getDataAtMinute(dataset, minuteOfDay);
      if (!dataPoint) {
        return {
          serverId: dataset.serverId,
          serverType: dataset.serverType,
          location: dataset.location,
          timestamp,
          minuteOfDay,
          cpu: dataset.baseline.cpu,
          memory: dataset.baseline.memory,
          disk: dataset.baseline.disk,
          network: dataset.baseline.network,
          logs: [],
          status: 'online' as const,
        };
      }

      return {
        serverId: dataset.serverId,
        serverType: dataset.serverType,
        location: dataset.location,
        timestamp,
        minuteOfDay,
        cpu: dataPoint.cpu,
        memory: dataPoint.memory,
        disk: dataPoint.disk,
        network: dataPoint.network,
        logs: dataPoint.logs,
        status: determineStatus(
          dataPoint.cpu,
          dataPoint.memory,
          dataPoint.disk,
          dataPoint.network
        ),
      };
    });
  }

  /**
   * 시스템 전체 요약 정보
   */
  public getSystemSummary(): SystemSummary {
    const minuteOfDay = getKSTMinuteOfDay();
    const averages = calculateAverageMetrics(minuteOfDay);
    const allMetrics = this.getAllServerMetrics();

    const statusCounts = allMetrics.reduce(
      (acc, m) => {
        acc[m.status]++;
        return acc;
      },
      { online: 0, warning: 0, critical: 0, offline: 0 }
    );

    return {
      timestamp: getKSTTimestamp(),
      minuteOfDay,
      totalServers: allMetrics.length,
      onlineServers: statusCounts.online,
      warningServers: statusCounts.warning,
      criticalServers: statusCounts.critical,
      averageCpu: averages.avgCpu,
      averageMemory: averages.avgMemory,
      averageDisk: averages.avgDisk,
      averageNetwork: averages.avgNetwork,
    };
  }

  /**
   * 특정 시간대 메트릭 조회 (히스토리용)
   */
  public getMetricsAtTime(
    serverId: string,
    minuteOfDay: number
  ): Fixed10MinMetric | null {
    const dataset = FIXED_24H_DATASETS.find((d) => d.serverId === serverId);
    if (!dataset) return null;

    return getDataAtMinute(dataset, minuteOfDay) || null;
  }

  /**
   * 서버 목록 조회
   */
  public getServerList(): Array<{
    serverId: string;
    serverType: string;
    location: string;
  }> {
    return FIXED_24H_DATASETS.map((d) => ({
      serverId: d.serverId,
      serverType: d.serverType,
      location: d.location,
    }));
  }

  /**
   * 디버그용: 현재 시간 정보
   */
  public getTimeInfo(): {
    kstTime: string;
    minuteOfDay: number;
    slotIndex: number;
    humanReadable: string;
  } {
    const minuteOfDay = getKSTMinuteOfDay();
    const hours = Math.floor(minuteOfDay / 60);
    const minutes = minuteOfDay % 60;

    return {
      kstTime: getKSTTimestamp(),
      minuteOfDay,
      slotIndex: minuteOfDay / 10,
      humanReadable: `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} KST`,
    };
  }
}

// 편의를 위한 싱글톤 인스턴스 export
export const metricsProvider = MetricsProvider.getInstance();
