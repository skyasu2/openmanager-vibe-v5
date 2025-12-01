import fs from 'fs/promises';
import path from 'path';
import type { FileCache, HourlyServerData } from '@/types/server-metrics';

/**
 * 파일 캐시 시스템
 *
 * 5분 TTL로 시간별 메트릭 JSON 파일을 캐싱합니다.
 * I/O 성능 최적화를 위해 Map 기반 인메모리 캐시 사용.
 *
 * @description
 * 새로운 JSON 구조 (dataPoints 배열)를 기존 구조 (servers 직접)로 변환합니다.
 * - 입력: { hour, scenario, dataPoints: [{ timestamp, servers }], metadata }
 * - 출력: { servers, scenario, summary }
 */

const fileCache = new Map<string, FileCache>();
const FILE_CACHE_TTL = 300000; // 5분 캐시 TTL (성능 최적화)

/**
 * 새로운 JSON 형식을 기존 형식으로 변환
 * @param rawData - 새로운 형식의 JSON 데이터
 * @param minute - 현재 분 (0-59), 5분 단위로 dataPoint 선택
 * @returns HourlyServerData 형식
 */
function transformNewFormatToLegacy(
  rawData: {
    hour?: number;
    scenario?: string;
    dataPoints?: Array<{ timestamp: string; servers: Record<string, unknown> }>;
    servers?: Record<string, unknown>; // 기존 형식 지원
    metadata?: { serverCount: number; scenarioType: string };
  },
  minute: number
): HourlyServerData {
  // 기존 형식 (servers가 직접 있는 경우) 그대로 반환
  if (rawData.servers && !rawData.dataPoints) {
    return rawData as unknown as HourlyServerData;
  }

  // 새로운 형식 (dataPoints 배열) 변환
  const dataPoints = rawData.dataPoints || [];
  const dataPointCount = dataPoints.length;

  // 5분 단위로 dataPoint 인덱스 계산 (0-11)
  const dataPointIndex = Math.min(
    Math.floor(minute / 5),
    dataPointCount - 1
  );

  const selectedDataPoint = dataPoints[dataPointIndex] || dataPoints[0];
  const servers = selectedDataPoint?.servers || {};

  // 서버 상태 요약 계산
  const serverValues = Object.values(servers) as Array<{ status?: string }>;
  const summary = {
    total: serverValues.length,
    online: serverValues.filter((s) => s.status === 'online').length,
    warning: serverValues.filter((s) => s.status === 'warning').length,
    critical: serverValues.filter((s) => s.status === 'critical').length,
  };

  return {
    servers: servers as HourlyServerData['servers'],
    scenario: rawData.scenario,
    summary,
  };
}

/**
 * 🚀 캐시된 파일 읽기 (I/O 성능 극대화)
 *
 * @param hour - 0-23 시간 (24시간 형식)
 * @returns 시간별 서버 메트릭 데이터 (15개 서버, HourlyServerData 형식)
 */
export async function readCachedHourlyFile(
  hour: number
): Promise<HourlyServerData> {
  const cacheKey = hour.toString().padStart(2, '0');

  // KST 기준 현재 분 계산
  const koreaTime = new Date().toLocaleString('en-US', { timeZone: 'Asia/Seoul' });
  const currentMinute = new Date(koreaTime).getMinutes();

  // 5분 단위 캐시 키 (같은 시간대 내 5분마다 다른 dataPoint)
  const minuteSegment = Math.floor(currentMinute / 5);
  const fullCacheKey = `${cacheKey}-${minuteSegment}`;

  const cached = fileCache.get(fullCacheKey);

  // 캐시 히트 (5분 내)
  if (cached && Date.now() - cached.timestamp < FILE_CACHE_TTL) {
    return cached.data;
  }

  // 캐시 미스: 파일 읽기 (15개 서버 시나리오 데이터)
  const filePath = path.join(
    process.cwd(),
    'public',
    'hourly-data',
    `hour-${cacheKey}.json`
  );

  try {
    // 🚀 병렬 파일 체크 및 읽기 (로그 최적화)
    const [, rawData] = await Promise.all([
      fs.access(filePath), // 파일 존재 확인
      fs.readFile(filePath, 'utf8'), // 파일 읽기
    ]);

    const parsedData = JSON.parse(rawData);

    // 새로운 형식 → 기존 형식 변환
    const hourlyData = transformNewFormatToLegacy(parsedData, currentMinute);

    // 캐시 저장 (5분 단위 캐시 키)
    fileCache.set(fullCacheKey, {
      data: hourlyData,
      timestamp: Date.now(),
      hour,
    });

    return hourlyData;
  } catch {
    console.error(`❌ [FILE-ERROR] 시간별 데이터 파일 없음: ${filePath}`);
    throw new Error(`베르셀 시간별 데이터 파일 누락: ${cacheKey}.json`);
  }
}

/**
 * 캐시 초기화 (테스트용)
 */
export function clearCache(): void {
  fileCache.clear();
}

/**
 * 캐시 크기 확인
 */
export function getCacheSize(): number {
  return fileCache.size;
}

/**
 * 특정 시간 캐시 삭제
 */
export function invalidateHourCache(hour: number): void {
  const cacheKey = hour.toString().padStart(2, '0');
  fileCache.delete(cacheKey);
}
