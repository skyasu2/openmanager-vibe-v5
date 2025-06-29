/**
 * 🌐 Network Tracking Utilities
 *
 * 네트워크 요청 추적 및 모니터링 유틸리티
 *
 * @created 2025-06-09
 * @author AI Assistant
 */

import { safeErrorLog } from '../lib/error-handler';
import type { NetworkRequestInfo } from '../types/system-checklist';

/**
 * 네트워크 요청 추적을 위한 래퍼 함수
 */
export const fetchWithTracking = async (
  url: string,
  options: RequestInit = {}
): Promise<{ response: Response; networkInfo: any }> => {
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
      headers: Object.fromEntries(response.headers.entries()),
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

    throw { originalError: error, networkInfo };
  }
};

/**
 * 전역 네트워크 요청 기록
 */
export const recordNetworkRequest = (
  networkInfo: any,
  success: boolean,
  component: string
): void => {
  if (typeof window !== 'undefined') {
    (window as any).__networkRequests = (window as any).__networkRequests || [];
    (window as any).__networkRequests.push({
      ...networkInfo,
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
    return (window as any).__networkRequests || [];
  }
  return [];
};

/**
 * 네트워크 요청 기록 초기화
 */
export const clearNetworkRequests = (): void => {
  if (typeof window !== 'undefined') {
    (window as any).__networkRequests = [];
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
  const stats: Record<string, any> = {};

  requests.forEach(request => {
    if (!stats[request.component]) {
      stats[request.component] = {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        totalResponseTime: 0,
      };
    }

    stats[request.component].totalRequests++;
    if (request.success) {
      stats[request.component].successfulRequests++;
    } else {
      stats[request.component].failedRequests++;
    }
    stats[request.component].totalResponseTime += request.responseTime;
  });

  // 평균 응답 시간 계산
  Object.keys(stats).forEach(component => {
    const componentStats = stats[component];
    componentStats.averageResponseTime =
      componentStats.totalResponseTime / componentStats.totalRequests;
    delete componentStats.totalResponseTime;
  });

  return stats;
};
