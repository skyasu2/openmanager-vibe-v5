/**
 * 🎯 Hourly Data Loader - Vercel 번들 포함용
 *
 * 동적 import 대신 정적 import로 빌드 시 번들에 포함
 * - fs 접근 없이 모든 환경에서 작동
 * - Vercel Serverless Functions에서 추가 비용 없음
 *
 * @updated 2026-01-19 - Vercel 호환성 수정
 */

// 24개 시간대 JSON 정적 import
import hour00 from './hour-00.json';
import hour01 from './hour-01.json';
import hour02 from './hour-02.json';
import hour03 from './hour-03.json';
import hour04 from './hour-04.json';
import hour05 from './hour-05.json';
import hour06 from './hour-06.json';
import hour07 from './hour-07.json';
import hour08 from './hour-08.json';
import hour09 from './hour-09.json';
import hour10 from './hour-10.json';
import hour11 from './hour-11.json';
import hour12 from './hour-12.json';
import hour13 from './hour-13.json';
import hour14 from './hour-14.json';
import hour15 from './hour-15.json';
import hour16 from './hour-16.json';
import hour17 from './hour-17.json';
import hour18 from './hour-18.json';
import hour19 from './hour-19.json';
import hour20 from './hour-20.json';
import hour21 from './hour-21.json';
import hour22 from './hour-22.json';
import hour23 from './hour-23.json';

// ============================================================================
// Types
// ============================================================================

export interface HourlyDataServer {
  id: string;
  name: string;
  type: string;
  location: string;
  status: 'online' | 'warning' | 'critical' | 'offline';
  cpu: number;
  memory: number;
  disk: number;
  network: number;
  responseTime?: number;
  uptime?: number;
  ip?: string;
  os?: string;
  services?: Array<{
    name: string;
    status: string;
    health: string;
    message?: string;
  }>;
  logs?: Array<{
    timestamp: string;
    level: string;
    message: string;
  }>;
}

export interface HourlyDataPoint {
  minute: number;
  timestamp: string;
  servers: Record<string, HourlyDataServer>;
}

export interface HourlyData {
  hour: number;
  _pattern: string;
  dataPoints: HourlyDataPoint[];
}

// ============================================================================
// Hourly Data Map (0-23시)
// ============================================================================

const HOURLY_DATA_MAP: Record<number, HourlyData> = {
  0: hour00 as unknown as HourlyData,
  1: hour01 as unknown as HourlyData,
  2: hour02 as unknown as HourlyData,
  3: hour03 as unknown as HourlyData,
  4: hour04 as unknown as HourlyData,
  5: hour05 as unknown as HourlyData,
  6: hour06 as unknown as HourlyData,
  7: hour07 as unknown as HourlyData,
  8: hour08 as unknown as HourlyData,
  9: hour09 as unknown as HourlyData,
  10: hour10 as unknown as HourlyData,
  11: hour11 as unknown as HourlyData,
  12: hour12 as unknown as HourlyData,
  13: hour13 as unknown as HourlyData,
  14: hour14 as unknown as HourlyData,
  15: hour15 as unknown as HourlyData,
  16: hour16 as unknown as HourlyData,
  17: hour17 as unknown as HourlyData,
  18: hour18 as unknown as HourlyData,
  19: hour19 as unknown as HourlyData,
  20: hour20 as unknown as HourlyData,
  21: hour21 as unknown as HourlyData,
  22: hour22 as unknown as HourlyData,
  23: hour23 as unknown as HourlyData,
};

// ============================================================================
// Public API
// ============================================================================

/**
 * 특정 시간대 데이터 조회 (O(1))
 * @param hour 0-23
 */
export function getHourlyData(hour: number): HourlyData | null {
  const normalizedHour = ((hour % 24) + 24) % 24;
  return HOURLY_DATA_MAP[normalizedHour] || null;
}

/**
 * 특정 시간/분의 서버 데이터 조회
 * @param hour 0-23
 * @param minute 0-59 (10분 단위로 정규화됨)
 */
export function getServersAtTime(
  hour: number,
  minute: number
): Record<string, HourlyDataServer> | null {
  const hourlyData = getHourlyData(hour);
  if (!hourlyData) return null;

  // 10분 단위 슬롯 인덱스 (0-5)
  const slotIndex = Math.floor(minute / 10);
  const dataPoint =
    hourlyData.dataPoints[slotIndex] || hourlyData.dataPoints[0];

  return dataPoint?.servers || null;
}

/**
 * 현재 시간대의 시나리오 패턴명 조회
 */
export function getPatternName(hour: number): string {
  const hourlyData = getHourlyData(hour);
  return hourlyData?._pattern || 'unknown';
}

/**
 * 전체 서버 ID 목록 조회
 */
export function getAllServerIds(): string[] {
  const hourlyData = getHourlyData(0);
  if (!hourlyData?.dataPoints?.[0]?.servers) return [];
  return Object.keys(hourlyData.dataPoints[0].servers);
}

/**
 * 로드된 시간대 수 확인 (디버깅용)
 */
export function getLoadedHoursCount(): number {
  return Object.keys(HOURLY_DATA_MAP).length;
}
