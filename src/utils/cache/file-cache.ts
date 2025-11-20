import fs from 'fs/promises';
import path from 'path';
import type { FileCache } from '@/types/server-metrics';

/**
 * 파일 캐시 시스템
 * 
 * 5분 TTL로 시간별 메트릭 JSON 파일을 캐싱합니다.
 * I/O 성능 최적화를 위해 Map 기반 인메모리 캐시 사용.
 */

const fileCache = new Map<string, FileCache>();
const FILE_CACHE_TTL = 300000; // 5분 캐시 TTL (성능 최적화)

/**
 * 🚀 캐시된 파일 읽기 (I/O 성능 극대화)
 * 
 * @param hour - 0-23 시간 (24시간 형식)
 * @returns 시간별 서버 메트릭 데이터
 */
export async function readCachedHourlyFile(hour: number): Promise<FileCache['data']> {
  const cacheKey = hour.toString().padStart(2, '0');
  const cached = fileCache.get(cacheKey);
  
  // 캐시 히트 (5분 내)
  if (cached && Date.now() - cached.timestamp < FILE_CACHE_TTL) {
    // 프로덕션 성능 최적화: 캐시 히트 로그 간소화
    return cached.data;
  }
  
  // 캐시 미스: 파일 읽기
  const filePath = path.join(
    process.cwd(), 
    'public', 
    'server-scenarios', 
    'hourly-metrics', 
    `${cacheKey}.json`
  );
  
  try {
    // 🚀 병렬 파일 체크 및 읽기 (로그 최적화)
    const [, rawData] = await Promise.all([
      fs.access(filePath), // 파일 존재 확인
      fs.readFile(filePath, 'utf8') // 파일 읽기
    ]);

    const hourlyData = JSON.parse(rawData);

    // 캐시 저장
    fileCache.set(cacheKey, {
      data: hourlyData,
      timestamp: Date.now(),
      hour
    });

    return hourlyData;
    
  } catch (_accessError) {
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
