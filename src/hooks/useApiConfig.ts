/**
 * React Hook for API configuration
 *
 * 환경별 API 설정을 React 컴포넌트에서 사용하기 위한 훅
 */

import { useMemo } from 'react';
import { env, isProduction, isDevelopment, isTest } from '@/env';
import { apiCall, apiEndpoint } from '@/lib/api/api-config';

// The logic from getSiteUrl is now replicated here using the centralized env object
function getSiteUrl(): string {
  if (env.NEXT_PUBLIC_VERCEL_URL) {
    return `https://${env.NEXT_PUBLIC_VERCEL_URL}`;
  }
  if (isProduction) {
    return env.NEXT_PUBLIC_PROD_URL || 'https://openmanager-vibe-v5.vercel.app';
  }
  if (isTest) {
    return env.NEXT_PUBLIC_TEST_URL || 'https://openmanager-test.vercel.app';
  }
  return env.NEXT_PUBLIC_DEV_URL || 'http://localhost:3000';
}

export interface UseApiConfigReturn {
  // 환경 정보
  environment: 'development' | 'test' | 'production';
  isProduction: boolean;
  isDevelopment: boolean;
  isTest: boolean;

  // URL 정보
  siteUrl: string;
  apiUrl: string;

  // API 헬퍼
  apiCall: typeof apiCall;
  apiEndpoint: typeof apiEndpoint;

  // 유틸리티 함수
  buildUrl: (path: string) => string;
  buildApiUrl: (path: string) => string;
}

/**
 * API 설정 훅
 */
export function useApiConfig(): UseApiConfigReturn {
  const siteUrl = useMemo(() => getSiteUrl(), []);
  const apiUrl = useMemo(() => `${siteUrl}/api`, [siteUrl]);

  // URL 빌더 함수들
  const buildUrl = useMemo(() => {
    return (path: string) => {
      const cleanPath = path.startsWith('/') ? path : `/${path}`;
      return `${siteUrl}${cleanPath}`;
    };
  }, [siteUrl]);

  const buildApiUrl = useMemo(() => {
    return (path: string) => {
      const cleanPath = path.startsWith('/') ? path : `/${path}`;
      return `${apiUrl}${cleanPath}`;
    };
  }, [apiUrl]);

  return {
    // 환경 정보
    environment: env.NODE_ENV,
    isProduction,
    isDevelopment,
    isTest,

    // URL 정보
    siteUrl,
    apiUrl,

    // API 헬퍼
    apiCall,
    apiEndpoint,

    // 유틸리티 함수
    buildUrl,
    buildApiUrl,
  };
}

/**
 * 환경별 조건부 렌더링을 위한 훅
 */
export function useEnvironment() {
  const { environment, isProduction, isDevelopment, isTest } = useApiConfig();

  return {
    current: environment,
    isProduction,
    isDevelopment,
    isTest,

    // 헬퍼 함수
    when: <T>(
      conditions: Partial<Record<typeof environment, T>>,
      defaultValue: T
    ): T => {
      return conditions[environment] ?? defaultValue;
    },
  };
}

/**
 * API 호출 훅 (예시)
 */
export function useApiCall() {
  const { apiCall, buildApiUrl } = useApiConfig();

  return {
    // GET 요청
    get: <T = unknown>(endpoint: string) => {
      return apiCall<T>(endpoint, { method: 'GET' });
    },

    // POST 요청
    post: <T = unknown>(endpoint: string, data: unknown) => {
      return apiCall<T>(endpoint, {
        method: 'POST',
        body: data,
      });
    },

    // PUT 요청
    put: <T = unknown>(endpoint: string, data: unknown) => {
      return apiCall<T>(endpoint, {
        method: 'PUT',
        body: data,
      });
    },

    // DELETE 요청
    delete: <T = unknown>(endpoint: string) => {
      return apiCall<T>(endpoint, {
        method: 'DELETE',
      });
    },

    // URL 빌더
    buildUrl: buildApiUrl,
  };
}
