/**
 * 🌐 Network Tracking Utilities
 *
 * 네트워크 요청 추적 및 모니터링 유틸리티
 *
 * @created 2025-06-09
 * @author AI Assistant
 */

import type { NetworkRequestInfo } from '../types/system-checklist';

/**
 * 네트워크 요청 추적을 위한 래퍼 함수
 */
interface NetworkInfo {
  url: string;
  method: string;
  responseTime: number;
  statusCode?: number;
  headers?: Record<string, string>;
  error?: string;
}

export const fetchWithTracking = async (
  url: string,
  options: RequestInit = {}
): Promise<{ response: Response; networkInfo: NetworkInfo }> => {
  const startTime = Date.now();
  const method = options.method || 'GET';

  console.log(`🌐 API 요청 시작: ${method} ${url}`);

  try {
    const response = await fetch(url, {
      ...options,
      // 타임아웃 설정을 정확히 적용
      signal: AbortSignal.timeout(5000),
    });

    const responseTime = Date.now() - startTime;
    const networkInfo = {
      url,
      method,
      responseTime,
      statusCode: response.status,
      headers: {} as Record<string, string>, // Headers를 객체로 변환 시 타입 이슈로 인해 임시로 빈 객체 사용
    };

    console.log(
      `📊 API 응답: ${method} ${url} - ${response.status} (${responseTime}ms)`
    );

    return { response, networkInfo };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    const networkInfo = {
      url,
      method,
      responseTime,
      statusCode: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };

    console.error(
      `❌ API 에러: ${method} ${url} - ${error} (${responseTime}ms)`
    );

    const errorToThrow = new Error(
      error instanceof Error ? error.message : 'Unknown fetch error'
    ) as Error & { networkInfo?: NetworkInfo };
    errorToThrow.networkInfo = networkInfo;
    throw errorToThrow;
  }
};

/**
 * 전역 네트워크 요청 기록
 */
export const recordNetworkRequest = (
  networkInfo: unknown,
  success: boolean,
  component: string
): void => {
  if (typeof window !== 'undefined') {
    const windowWithRequests = window as Window & {
      __networkRequests?: NetworkRequestInfo[];
    };
    windowWithRequests.__networkRequests =
      windowWithRequests.__networkRequests || [];
    windowWithRequests.__networkRequests.push({
      ...(networkInfo as Record<string, unknown>),
      timestamp: new Date().toISOString(),
      success,
      component,
    } as NetworkRequestInfo);
  }
};

/**
 * 네트워크 요청 기록 조회
 */
export const getNetworkRequests = (): NetworkRequestInfo[] => {
  if (typeof window !== 'undefined') {
    const windowWithRequests = window as Window & {
      __networkRequests?: NetworkRequestInfo[];
    };
    return windowWithRequests.__networkRequests || [];
  }
  return [];
};

/**
 * 네트워크 요청 기록 초기화
 */
export const clearNetworkRequests = (): void => {
  if (typeof window !== 'undefined') {
    const windowWithRequests = window as Window & {
      __networkRequests?: NetworkRequestInfo[];
    };
    windowWithRequests.__networkRequests = [];
  }
};

/**
 * 컴포넌트별 네트워크 통계
 */
export const getNetworkStatsByComponent = (): Record<
  string,
  {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    averageResponseTime: number;
  }
> => {
  const requests = getNetworkRequests();
  const stats: Record<
    string,
    {
      totalRequests: number;
      successfulRequests: number;
      failedRequests: number;
      totalResponseTime: number;
    }
  > = {};

  requests.forEach((request) => {
    if (!stats[request.component]) {
      stats[request.component] = {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        totalResponseTime: 0,
      };
    }

    const componentStat = stats[request.component];
    if (componentStat) {
      componentStat.totalRequests++;
      if (request.success) {
        componentStat.successfulRequests++;
      } else {
        componentStat.failedRequests++;
      }
      componentStat.totalResponseTime += request.responseTime;
    }
  });

  // 평균 응답 시간 계산
  const result: Record<
    string,
    {
      totalRequests: number;
      successfulRequests: number;
      failedRequests: number;
      averageResponseTime: number;
    }
  > = {};

  Object.keys(stats).forEach((component) => {
    const componentStats = stats[component];
    if (componentStats) {
      result[component] = {
        totalRequests: componentStats.totalRequests,
        successfulRequests: componentStats.successfulRequests,
        failedRequests: componentStats.failedRequests,
        averageResponseTime:
          componentStats.totalRequests > 0
            ? componentStats.totalResponseTime / componentStats.totalRequests
            : 0,
      };
    }
  });

  return result;
};

/**
 * 네트워크 에러 타입 가드
 */
export const isNetworkError = (
  error: unknown
): error is {
  originalError?: Error;
  networkInfo?: NetworkInfo;
} => {
  return (
    typeof error === 'object' &&
    error !== null &&
    ('originalError' in error || 'networkInfo' in error)
  );
};

/**
 * 원본 에러 존재 여부 타입 가드
 */
export const hasOriginalError = (
  error: unknown
): error is {
  originalError: Error;
} => {
  return (
    typeof error === 'object' &&
    error !== null &&
    'originalError' in error &&
    error.originalError instanceof Error
  );
};
