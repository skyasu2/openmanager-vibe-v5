/**
 * 🎯 MetricsProvider - 단일 데이터 소스 (Single Source of Truth)
 *
 * 역할:
 * - 현재 한국 시간(KST) 기준으로 hourly-data JSON 파일에서 메트릭 제공
 * - Cloud Run AI와 동일한 데이터 소스 사용 (데이터 일관성 보장)
 * - 모든 API와 컴포넌트가 이 서비스를 통해 일관된 데이터 접근
 *
 * @updated 2026-01-19 - Vercel 호환성: 번들 기반 loader로 변경 (fs 제거)
 * @updated 2026-01-04 - hourly-data 통합 (AI와 데이터 동기화)
 */

import { getServerStatus as getRulesServerStatus } from '@/config/rules/loader';
import {
  calculateAverageMetrics,
  FIXED_24H_DATASETS,
  type Fixed10MinMetric,
  getDataAtMinute,
} from '@/data/fixed-24h-metrics';
import {
  getHourlyData as getBundledHourlyData,
  type HourlyData,
} from '@/data/hourly-data';
import { logger } from '@/lib/logging';

// ============================================================================
// Hourly Data Cache & Loader (번들 기반 - Vercel 호환)
// ============================================================================

let cachedHourlyData: { hour: number; data: HourlyData } | null = null;

/**
 * hourly-data 로드 (번들 기반)
 * @description fs 대신 빌드 시 번들에 포함된 데이터 사용 - Vercel Serverless 호환
 */
function loadHourlyData(hour: number): HourlyData | null {
  // 캐시 히트
  if (cachedHourlyData?.hour === hour) {
    return cachedHourlyData.data;
  }

  // 번들에서 로드 (fs 불필요)
  const data = getBundledHourlyData(hour);
  if (data) {
    cachedHourlyData = { hour, data };
    logger.info(
      `[MetricsProvider] hourly-data 로드: hour-${hour.toString().padStart(2, '0')} (${Object.keys(data.dataPoints[0]?.servers || {}).length}개 서버)`
    );
    return data;
  }

  logger.warn(`[MetricsProvider] hourly-data 없음: hour-${hour}`);
  return null;
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

// ============================================================================
// Date/Time Calculation (24시간 순환 + 실제 날짜)
// ============================================================================

/**
 * 현재 KST 날짜/시간 정보 반환
 */
export function getKSTDateTime(): {
  date: string;
  time: string;
  slotIndex: number;
  minuteOfDay: number;
} {
  const now = new Date();
  const kstOffset = 9 * 60 * 60 * 1000; // 9시간 (ms)
  const kstDate = new Date(now.getTime() + kstOffset);

  const year = kstDate.getUTCFullYear();
  const month = String(kstDate.getUTCMonth() + 1).padStart(2, '0');
  const day = String(kstDate.getUTCDate()).padStart(2, '0');
  const hours = String(kstDate.getUTCHours()).padStart(2, '0');
  const minutes = String(
    Math.floor(kstDate.getUTCMinutes() / 10) * 10
  ).padStart(2, '0');

  const minuteOfDay =
    kstDate.getUTCHours() * 60 + Math.floor(kstDate.getUTCMinutes() / 10) * 10;
  const slotIndex = Math.floor(minuteOfDay / 10);

  return {
    date: `${year}-${month}-${day}`,
    time: `${hours}:${minutes}`,
    slotIndex,
    minuteOfDay,
  };
}

/**
 * 상대 시간(분) 기준으로 실제 날짜/시간 계산
 * @param minutesAgo 몇 분 전 (양수 = 과거, 음수 = 미래)
 */
export function calculateRelativeDateTime(minutesAgo: number): {
  date: string;
  time: string;
  slotIndex: number;
  timestamp: string;
  isYesterday: boolean;
} {
  const now = new Date();
  const kstOffset = 9 * 60 * 60 * 1000;
  const targetTime = new Date(
    now.getTime() + kstOffset - minutesAgo * 60 * 1000
  );
  const currentKST = new Date(now.getTime() + kstOffset);

  const year = targetTime.getUTCFullYear();
  const month = String(targetTime.getUTCMonth() + 1).padStart(2, '0');
  const day = String(targetTime.getUTCDate()).padStart(2, '0');
  const hours = String(targetTime.getUTCHours()).padStart(2, '0');
  const mins = Math.floor(targetTime.getUTCMinutes() / 10) * 10;
  const minutes = String(mins).padStart(2, '0');

  const minuteOfDay = targetTime.getUTCHours() * 60 + mins;
  const slotIndex = Math.floor(minuteOfDay / 10);

  // 오늘/어제 판별
  const currentDay = String(currentKST.getUTCDate()).padStart(2, '0');
  const isYesterday = day !== currentDay;

  return {
    date: `${year}-${month}-${day}`,
    time: `${hours}:${minutes}`,
    slotIndex,
    timestamp: `${year}-${month}-${day}T${hours}:${minutes}:00+09:00`,
    isYesterday,
  };
}

/**
 * 🎯 상대 시간 기준 메트릭 조회 (날짜 포함)
 * @param serverId 서버 ID
 * @param minutesAgo 몇 분 전 (0 = 현재)
 */
export function getMetricsAtRelativeTime(
  serverId: string,
  minutesAgo: number = 0
): (ServerMetrics & { dateLabel: string; isYesterday: boolean }) | null {
  const { date, slotIndex, timestamp, isYesterday } =
    calculateRelativeDateTime(minutesAgo);
  const minuteOfDay = slotIndex * 10;

  // fixed-24h-metrics에서 조회
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
    dateLabel: isYesterday ? `${date} (어제)` : date,
    isYesterday,
  };
}

/**
 * 🎯 시간 비교 결과 (현재 vs N분 전)
 */
export interface TimeComparisonResult {
  current: {
    timestamp: string;
    date: string;
    metrics: ServerMetrics;
  };
  past: {
    timestamp: string;
    date: string;
    metrics: ServerMetrics;
  };
  delta: {
    cpu: number;
    memory: number;
    disk: number;
    network: number;
  };
}

/**
 * 🎯 서버 메트릭 시간 비교
 */
export function compareServerMetrics(
  serverId: string,
  minutesAgo: number
): TimeComparisonResult | null {
  const current = getMetricsAtRelativeTime(serverId, 0);
  const past = getMetricsAtRelativeTime(serverId, minutesAgo);

  if (!current || !past) return null;

  return {
    current: {
      timestamp: current.timestamp,
      date: current.dateLabel,
      metrics: current,
    },
    past: {
      timestamp: past.timestamp,
      date: past.dateLabel,
      metrics: past,
    },
    delta: {
      cpu: Math.round((current.cpu - past.cpu) * 10) / 10,
      memory: Math.round((current.memory - past.memory) * 10) / 10,
      disk: Math.round((current.disk - past.disk) * 10) / 10,
      network: Math.round((current.network - past.network) * 10) / 10,
    },
  };
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
          // JSON의 status 필드 우선 사용 (SSOT 보장)
          // fallback: 메트릭 기반 재계산 (system-rules.json 임계값)
          status:
            server.status ||
            determineStatus(
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
          // JSON의 status 필드 우선 사용 (SSOT 보장)
          status:
            server.status ||
            determineStatus(
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
