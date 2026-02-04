import { logger } from '@/lib/logging';
import type { FileCache, HourlyServerData } from '@/types/server-metrics';

/**
 * 파일 캐시 시스템 (브라우저/서버 호환)
 *
 * ⚠️ DEPRECATED (v5.84.0): scenario-loader.ts가 SSOT를 직접 import하므로
 * 이 파일은 더 이상 주요 데이터 로드 경로에서 사용되지 않습니다.
 *
 * 용도:
 * - 브라우저에서 직접 hourly-data JSON 접근 시 (폴백)
 * - 레거시 코드 호환성 유지
 *
 * @see src/services/scenario/scenario-loader.ts - 새로운 SSOT 직접 import 방식
 * @see src/data/fixed-24h-metrics.ts - SSOT 데이터 소스
 */

const fileCache = new Map<string, FileCache>();
const FILE_CACHE_TTL = 300000; // 5분 캐시 TTL (성능 최적화)

// 브라우저/서버 환경 감지
const isServer = typeof window === 'undefined';

/**
 * 프로덕션 URL (하드코딩 - Vercel 서버리스 폴백용)
 * VERCEL_URL 환경 변수가 서버리스 런타임에서 사용 불가할 경우 사용
 */
const PRODUCTION_URL = 'https://openmanager-vibe-v5.vercel.app';

/**
 * 서버 베이스 URL 구성 (정적 파일 접근용)
 *
 * @description
 * ⚠️ 중요: Vercel 프리뷰 URL은 인증이 필요하므로 정적 파일 접근 불가!
 * 정적 파일(public/)은 항상 프로덕션 URL에서만 인증 없이 접근 가능.
 *
 * 우선순위:
 * 1. Vercel 환경: 항상 프로덕션 URL 사용 (프리뷰 URL 인증 문제 회피)
 * 2. NEXT_PUBLIC_APP_URL (사용자 정의)
 * 3. localhost (로컬 개발)
 */
function getServerBaseUrl(): string {
  // 🔴 Vercel 환경: 항상 프로덕션 URL 사용
  // - VERCEL_URL은 프리뷰 URL을 반환할 수 있음 (인증 필요)
  // - 정적 파일은 프로덕션 도메인에서만 인증 없이 접근 가능
  if (process.env.VERCEL === '1' || process.env.VERCEL_URL) {
    return PRODUCTION_URL;
  }
  // 사용자 정의 앱 URL (로컬/커스텀 환경)
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }
  // 로컬 개발 환경
  return 'http://localhost:3000';
}

/**
 * 파일 경로에서 데이터 읽기 (Vercel 서버리스 호환)
 *
 * @description
 * v5.80.0 수정: Vercel 서버리스 환경에서 fs 모듈 대신 fetch API 사용
 * - Vercel 서버리스 함수에서 process.cwd()가 public/ 디렉토리를 찾지 못함
 * - 해결: 서버 사이드에서도 자체 URL로 fetch 요청
 */
async function readFileContent(filePath: string): Promise<string> {
  if (isServer) {
    // 🚀 Vercel 서버리스 환경: fetch API 사용 (fs 대신)
    const baseUrl = getServerBaseUrl();
    // public/hourly-data/hour-XX.json → /hourly-data/hour-XX.json
    const urlPath = filePath.startsWith('public/')
      ? filePath.replace('public/', '/')
      : filePath.startsWith('/')
        ? filePath
        : `/${filePath}`;
    const fullUrl = `${baseUrl}${urlPath}`;

    const response = await fetch(fullUrl, {
      // 캐시 방지 (항상 최신 데이터)
      cache: 'no-store',
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(
        `Server fetch failed: ${response.status} ${response.statusText} (${fullUrl})`
      );
    }
    return response.text();
  } else {
    // 브라우저: fetch API 사용
    const response = await fetch(filePath);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return response.text();
  }
}

/**
 * 새로운 JSON 형식을 기존 형식으로 변환
 * @param rawData - 새로운 형식의 JSON 데이터
 * @param minute - 현재 분 (0-59), 5분 단위로 dataPoint 선택
 * @returns HourlyServerData 형식
 */
function transformNewFormatToLegacy(
  rawData: {
    hour?: number;
    _scenario?: string;
    dataPoints?: Array<{
      timestampMs?: number;
      targets?: Record<
        string,
        {
          instance?: string;
          metrics?: {
            up?: number;
            node_cpu_usage_percent?: number;
            node_memory_usage_percent?: number;
            node_filesystem_usage_percent?: number;
            node_network_transmit_bytes_rate?: number;
          };
          labels?: { server_type?: string };
        }
      >;
      servers?: Record<string, unknown>;
    }>;
    servers?: Record<string, unknown>;
    metadata?: { serverCount: number; scenarioType: string };
  },
  minute: number
): HourlyServerData {
  // 기존 형식 (servers가 직접 있는 경우) 그대로 반환
  if (rawData.servers && !rawData.dataPoints) {
    return rawData as unknown as HourlyServerData;
  }

  // dataPoints 배열 변환
  const dataPoints = rawData.dataPoints || [];
  const dataPointCount = dataPoints.length;

  // 10분 단위로 dataPoint 인덱스 계산 (0-5)
  const dataPointIndex = Math.min(Math.floor(minute / 10), dataPointCount - 1);

  const selectedDataPoint = dataPoints[dataPointIndex] || dataPoints[0];

  // Prometheus 포맷: targets → servers 변환
  let servers: Record<string, unknown> = {};
  if (selectedDataPoint?.targets) {
    for (const target of Object.values(selectedDataPoint.targets)) {
      const serverId = target.instance?.replace(/:9100$/, '') || '';
      const cpu = target.metrics?.node_cpu_usage_percent || 0;
      const memory = target.metrics?.node_memory_usage_percent || 0;
      const disk = target.metrics?.node_filesystem_usage_percent || 0;
      const network = target.metrics?.node_network_transmit_bytes_rate || 0;
      let status = 'online';
      if (target.metrics?.up === 0) status = 'offline';
      else if (cpu >= 90 || memory >= 90 || disk >= 90 || network >= 85)
        status = 'critical';
      else if (cpu >= 80 || memory >= 80 || disk >= 80 || network >= 70)
        status = 'warning';

      servers[serverId] = {
        id: serverId,
        status,
        cpu,
        memory,
        disk,
        network,
        type: target.labels?.server_type,
      };
    }
  } else if (selectedDataPoint?.servers) {
    servers = selectedDataPoint.servers;
  }

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
    scenario: rawData._scenario,
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
  const koreaTime = new Date().toLocaleString('en-US', {
    timeZone: 'Asia/Seoul',
  });
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
  // 서버: public/hourly-data/hour-XX.json (절대 경로)
  // 브라우저: /hourly-data/hour-XX.json (URL 경로)
  const filePath = isServer
    ? `public/hourly-data/hour-${cacheKey}.json`
    : `/hourly-data/hour-${cacheKey}.json`;

  try {
    // 🚀 환경별 파일 읽기 (브라우저/서버 호환)
    const rawData = await readFileContent(filePath);

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
  } catch (error) {
    const baseUrl = getServerBaseUrl();
    const errorMsg = error instanceof Error ? error.message : String(error);
    logger.error(`❌ [FILE-ERROR] 시간별 데이터 파일 로드 실패:`);
    logger.error(`  - 파일경로: ${filePath}`);
    logger.error(`  - 베이스URL: ${baseUrl}`);
    logger.error(`  - VERCEL_URL: ${process.env.VERCEL_URL || 'undefined'}`);
    logger.error(`  - VERCEL: ${process.env.VERCEL || 'undefined'}`);
    logger.error(`  - 오류: ${errorMsg}`);
    throw new Error(
      `베르셀 시간별 데이터 파일 누락: ${cacheKey}.json (baseUrl: ${baseUrl})`
    );
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
