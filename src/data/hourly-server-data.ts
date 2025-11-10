/**
 * 🎯 Vercel JSON 24시간 서버 데이터 로더
 *
 * /public/data/servers/hourly/hour-XX.json 파일에서 데이터 로드
 * 10분 간격 실제 데이터 + 1분 선형 보간
 */

import type { ServerStatus } from '@/types/server';

/**
 * 10분 간격 서버 메트릭 (JSON 파일 구조)
 */
export interface HourlyServerMetric {
  cpu: number;
  memory: number;
  disk: number;
  network: number;
  status: ServerStatus;
  responseTime: number;
  uptime: number;
  scenario?: string;
}

/**
 * 시간별 데이터 포인트 (10분 간격 × 6 = 1시간)
 */
export interface HourlyDataPoint {
  timestamp: string; // "HH:MM"
  servers: Record<string, HourlyServerMetric>;
}

/**
 * 시간별 JSON 파일 구조
 */
export interface HourlyServerData {
  hour: number; // 0-23
  generatedAt: string;
  dataPoints: HourlyDataPoint[];
}

/**
 * 보간된 1분 단위 메트릭
 */
export interface InterpolatedMetric {
  cpu: number;
  memory: number;
  disk: number;
  network: number;
  status: ServerStatus;
  responseTime: number;
  uptime: number;
  timestamp: string; // "HH:MM"
  isInterpolated: boolean; // true면 보간값, false면 실제값
}

/**
 * 메모리 캐시 (성능 최적화)
 */
const hourlyDataCache = new Map<number, HourlyServerData>();

/**
 * 시간별 JSON 파일 로드 (캐싱 포함)
 *
 * @param hour 0-23
 * @returns 시간별 데이터 또는 null
 */
export async function loadHourlyData(hour: number): Promise<HourlyServerData | null> {
  // 캐시 확인
  if (hourlyDataCache.has(hour)) {
    return hourlyDataCache.get(hour)!;
  }

  try {
    const paddedHour = hour.toString().padStart(2, '0');
    const filePath = `/data/servers/hourly/hour-${paddedHour}.json`;

    // 🔧 서버/클라이언트 환경 구분 처리
    let data: HourlyServerData;

    if (typeof window === 'undefined') {
      // 🖥️ 서버 사이드: fs 모듈 사용
      const fs = await import('fs');
      const path = await import('path');
      const fullPath = path.join(process.cwd(), 'public', filePath);

      const fileContent = fs.readFileSync(fullPath, 'utf-8');
      data = JSON.parse(fileContent);
    } else {
      // 🌐 클라이언트 사이드: fetch 사용
      const response = await fetch(filePath);

      if (!response.ok) {
        console.error(`Failed to load hour-${paddedHour}.json: ${response.statusText}`);
        return null;
      }

      data = await response.json();
    }

    // 캐시 저장
    hourlyDataCache.set(hour, data);

    return data;
  } catch (error) {
    console.error(`Error loading hourly data for hour ${hour}:`, error);
    return null;
  }
}

/**
 * 두 메트릭 사이 선형 보간
 *
 * @param start 시작 메트릭
 * @param end 종료 메트릭
 * @param progress 진행률 (0.0 ~ 1.0)
 * @returns 보간된 메트릭
 */
function interpolateMetric(
  start: HourlyServerMetric,
  end: HourlyServerMetric,
  progress: number
): HourlyServerMetric {
  return {
    cpu: start.cpu + (end.cpu - start.cpu) * progress,
    memory: start.memory + (end.memory - start.memory) * progress,
    disk: start.disk + (end.disk - start.disk) * progress,
    network: start.network + (end.network - start.network) * progress,
    // 상태는 보간하지 않고 시작값 유지 (discrete value)
    status: start.status,
    // 응답 시간은 선형 보간
    responseTime: Math.round(
      start.responseTime + (end.responseTime - start.responseTime) * progress
    ),
    // uptime은 선형 보간
    uptime: Math.round(start.uptime + (end.uptime - start.uptime) * progress),
    // 시나리오는 시작값 유지
    ...(start.scenario && { scenario: start.scenario }),
  };
}

/**
 * 특정 시간(HH:MM)의 서버 메트릭 가져오기 (선형 보간 포함)
 *
 * @param serverId 서버 ID (예: "web-prod-01")
 * @param hour 시간 (0-23)
 * @param minute 분 (0-59)
 * @returns 보간된 메트릭 또는 null
 */
export async function getServerMetricAt(
  serverId: string,
  hour: number,
  minute: number
): Promise<InterpolatedMetric | null> {
  const hourlyData = await loadHourlyData(hour);
  if (!hourlyData || !hourlyData.dataPoints) return null;

  // 현재 분에 해당하는 10분 슬롯 찾기
  const currentSlot = Math.floor(minute / 10) * 10; // 0, 10, 20, 30, 40, 50
  const nextSlot = (currentSlot + 10) % 60;

  // 현재 슬롯의 데이터 포인트 찾기
  const currentPoint = hourlyData.dataPoints.find((point) => {
    const [, pointMinute] = point.timestamp.split(':').map(Number);
    return pointMinute === currentSlot;
  });

  if (!currentPoint || !currentPoint.servers[serverId]) {
    return null;
  }

  const currentMetric = currentPoint.servers[serverId];

  // 10분 단위 정확한 시간이면 보간 없이 실제값 반환
  if (minute % 10 === 0) {
    return {
      ...currentMetric,
      timestamp: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
      isInterpolated: false,
    };
  }

  // 다음 슬롯 데이터 찾기 (시간 경계 넘어갈 경우 처리)
  let nextPoint: HourlyDataPoint | undefined;
  let nextHourData: HourlyServerData | null = hourlyData;

  if (nextSlot === 0) {
    // 시간 경계를 넘어가는 경우 (50분 → 00분)
    const nextHour = (hour + 1) % 24;
    nextHourData = await loadHourlyData(nextHour);
    nextPoint = nextHourData?.dataPoints.find((point) => {
      const [, pointMinute] = point.timestamp.split(':').map(Number);
      return pointMinute === 0;
    });
  } else {
    // 같은 시간 내에서 다음 슬롯
    nextPoint = hourlyData.dataPoints.find((point) => {
      const [, pointMinute] = point.timestamp.split(':').map(Number);
      return pointMinute === nextSlot;
    });
  }

  if (!nextPoint || !nextPoint.servers[serverId]) {
    // 다음 포인트가 없으면 현재값 유지
    return {
      ...currentMetric,
      timestamp: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
      isInterpolated: false,
    };
  }

  const nextMetric = nextPoint.servers[serverId];

  // 진행률 계산 (0.0 ~ 1.0)
  const minuteInSlot = minute % 10; // 0-9
  const progress = minuteInSlot / 10;

  // 선형 보간
  const interpolated = interpolateMetric(currentMetric, nextMetric, progress);

  return {
    ...interpolated,
    timestamp: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
    isInterpolated: true,
  };
}

/**
 * 서버의 최근 N분 데이터 가져오기 (차트용)
 *
 * @param serverId 서버 ID
 * @param currentHour 현재 시간 (0-23)
 * @param currentMinute 현재 분 (0-59)
 * @param lookbackMinutes 조회할 과거 시간 (분, 기본 60분)
 * @returns 시간순 메트릭 배열
 */
export async function getRecentMetrics(
  serverId: string,
  currentHour: number,
  currentMinute: number,
  lookbackMinutes: number = 60
): Promise<InterpolatedMetric[]> {
  const metrics: InterpolatedMetric[] = [];

  // 시간을 분 단위로 변환
  const currentTotalMinutes = currentHour * 60 + currentMinute;
  const startTotalMinutes = currentTotalMinutes - lookbackMinutes;

  // 10분 간격으로만 데이터 포인트 가져오기 (성능 최적화)
  for (let totalMinutes = startTotalMinutes; totalMinutes <= currentTotalMinutes; totalMinutes += 10) {
    // 음수 처리 (전날로 넘어가는 경우)
    const adjustedMinutes = ((totalMinutes % 1440) + 1440) % 1440;
    const hour = Math.floor(adjustedMinutes / 60);
    const minute = adjustedMinutes % 60;

    const metric = await getServerMetricAt(serverId, hour, minute);
    if (metric) {
      metrics.push(metric);
    }
  }

  return metrics;
}

/**
 * 여러 서버의 현재 메트릭 한 번에 가져오기 (대시보드용)
 *
 * @param serverIds 서버 ID 배열
 * @param hour 현재 시간 (0-23)
 * @param minute 현재 분 (0-59)
 * @returns 서버별 메트릭 맵
 */
export async function getMultipleServerMetrics(
  serverIds: string[],
  hour: number,
  minute: number
): Promise<Map<string, InterpolatedMetric>> {
  const metricsMap = new Map<string, InterpolatedMetric>();

  // 모든 서버 메트릭 병렬로 가져오기
  const promises = serverIds.map((serverId) => getServerMetricAt(serverId, hour, minute));

  const results = await Promise.all(promises);

  // 타입 안전성을 위해 for 루프 사용
  for (let i = 0; i < results.length; i++) {
    const metric = results[i];
    const serverId = serverIds[i];
    if (metric && serverId) {
      metricsMap.set(serverId, metric);
    }
  }

  return metricsMap;
}

/**
 * 캐시 클리어 (메모리 절약용)
 */
export function clearCache() {
  hourlyDataCache.clear();
}

/**
 * 특정 시간대 캐시만 제거 (오래된 데이터 정리)
 *
 * @param hours 제거할 시간 배열
 */
export function clearCacheForHours(hours: number[]) {
  hours.forEach((hour) => hourlyDataCache.delete(hour));
}
