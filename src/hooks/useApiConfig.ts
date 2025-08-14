/**
 * React Hook for API configuration
 * 
 * 환경별 API 설정을 React 컴포넌트에서 사용하기 위한 훅
 */

import { useMemo } from 'react';
import { getPublicEnvConfig } from '@/lib/env-config';
import { apiCall, apiEndpoint } from '@/lib/api-config';

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
  const config = useMemo(() => getPublicEnvConfig(), []);
  
  // URL 빌더 함수들
  const buildUrl = useMemo(() => {
    return (path: string) => {
      const cleanPath = path.startsWith('/') ? path : `/${path}`;
      return `${config.siteUrl}${cleanPath}`;
    };
  }, [config.siteUrl]);
  
  const buildApiUrl = useMemo(() => {
    return (path: string) => {
      const cleanPath = path.startsWith('/') ? path : `/${path}`;
      return `${config.apiUrl}${cleanPath}`;
    };
  }, [config.apiUrl]);
  
  return {
    // 환경 정보
    environment: config.environment,
    isProduction: config.isProduction,
    isDevelopment: config.isDevelopment,
    isTest: config.isTest,
    
    // URL 정보
    siteUrl: config.siteUrl,
    apiUrl: config.apiUrl,
    
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
    when: <T,>(
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