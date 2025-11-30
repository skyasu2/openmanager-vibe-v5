import { useCallback, useEffect, useRef } from 'react';

/**
 * 🚀 클라이언트 사이드 메트릭 수집 훅
 *
 * Vercel Edge Middleware 대신 클라이언트에서 성능 메트릭을 수집
 */

export interface ClientMetrics {
  pageLoadTime: number;
  apiCallCount: number;
  averageApiResponseTime: number;
  errorCount: number;
}

export function useClientMetrics() {
  const metricsRef = useRef<ClientMetrics>({
    pageLoadTime: 0,
    apiCallCount: 0,
    averageApiResponseTime: 0,
    errorCount: 0,
  });

  const apiCallTimes = useRef<number[]>([]);

  // 페이지 로드 시간 측정
  useEffect(() => {
    if (typeof window !== 'undefined' && window.performance) {
      const loadTime =
        window.performance.timing.loadEventEnd -
        window.performance.timing.navigationStart;
      metricsRef.current.pageLoadTime = loadTime;
    }
  }, []);

  // API 호출 추적
  const trackAPICall = useCallback(
    (responseTime: number, isError: boolean = false) => {
      metricsRef.current.apiCallCount += 1;

      if (isError) {
        metricsRef.current.errorCount += 1;
      } else {
        apiCallTimes.current.push(responseTime);
        const average =
          apiCallTimes.current.reduce((a, b) => a + b, 0) /
          apiCallTimes.current.length;
        metricsRef.current.averageApiResponseTime = average;
      }
    },
    []
  );

  // 메트릭 가져오기
  const getMetrics = useCallback((): ClientMetrics => {
    return { ...metricsRef.current };
  }, []);

  // 메트릭 초기화
  const resetMetrics = useCallback(() => {
    metricsRef.current = {
      pageLoadTime: 0,
      apiCallCount: 0,
      averageApiResponseTime: 0,
      errorCount: 0,
    };
    apiCallTimes.current = [];
  }, []);

  // 개발 환경에서 메트릭 로그 출력
  const logMetrics = useCallback(() => {
    if (
      process.env.NEXT_PUBLIC_NODE_ENV ||
      process.env.NODE_ENV === 'development'
    ) {
      console.log('[Client Metrics]', getMetrics());
    }
  }, [getMetrics]);

  return {
    trackAPICall,
    getMetrics,
    resetMetrics,
    logMetrics,
  };
}

/**
 * API 호출을 래핑하여 자동으로 메트릭을 수집하는 함수
 */
export function createAPIWrapper(
  trackAPICall: (responseTime: number, isError?: boolean) => void
) {
  return async function wrappedFetch(
    input: RequestInfo | URL,
    init?: RequestInit
  ) {
    const startTime = Date.now();

    try {
      const response = await fetch(input, init);
      const responseTime = Date.now() - startTime;

      trackAPICall(responseTime, !response.ok);
      return response;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      trackAPICall(responseTime, true);
      throw error;
    }
  };
}
