/**
 * API 환경별 설정 및 라우팅 관리
 * 
 * 각 환경(development, test, production)에 맞는 API 설정 제공
 */

import { getEnvConfig } from './env-config';

/**
 * API 엔드포인트 설정
 */
export interface ApiEndpointConfig {
  // 기본 API 경로
  base: string;
  
  // 외부 서비스 URL
  supabase: string;
  gcpFunctions: string;
  vmApi: string;
  
  // Rate Limiting
  rateLimit: {
    maxRequests: number;
    windowMs: number;
  };
  
  // 타임아웃 설정
  timeout: {
    default: number;
    long: number;
    stream: number;
  };
  
  // 캐시 설정
  cache: {
    enabled: boolean;
    ttl: number;
  };
}

/**
 * 환경별 API 설정
 */
const API_CONFIGS: Record<string, Partial<ApiEndpointConfig>> = {
  development: {
    rateLimit: {
      maxRequests: 100,
      windowMs: 60000, // 1분
    },
    timeout: {
      default: 30000,  // 30초
      long: 120000,    // 2분
      stream: 300000,  // 5분
    },
    cache: {
      enabled: false,  // 개발 환경에서는 캐시 비활성화
      ttl: 0,
    },
  },
  
  test: {
    rateLimit: {
      maxRequests: 60,
      windowMs: 60000,
    },
    timeout: {
      default: 15000,  // 15초
      long: 60000,     // 1분
      stream: 180000,  // 3분
    },
    cache: {
      enabled: true,
      ttl: 300,  // 5분
    },
  },
  
  production: {
    rateLimit: {
      maxRequests: 60,
      windowMs: 60000,
    },
    timeout: {
      default: 10000,  // 10초
      long: 30000,     // 30초
      stream: 120000,  // 2분
    },
    cache: {
      enabled: true,
      ttl: 600,  // 10분
    },
  },
};

/**
 * 현재 환경에 맞는 API 설정 가져오기
 */
export function getApiConfig(): ApiEndpointConfig {
  const envConfig = getEnvConfig();
  const environment = envConfig.environment;
  
  // 기본 설정
  const baseConfig: ApiEndpointConfig = {
    base: envConfig.apiUrl,
    supabase: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    gcpFunctions: process.env.GCP_FUNCTIONS_URL || '',
    vmApi: envConfig.vmApiUrl,
    rateLimit: {
      maxRequests: 60,
      windowMs: 60000,
    },
    timeout: {
      default: 10000,
      long: 30000,
      stream: 120000,
    },
    cache: {
      enabled: true,
      ttl: 300,
    },
  };
  
  // 환경별 설정 오버라이드
  const envSpecificConfig = API_CONFIGS[environment] || {};
  
  return {
    ...baseConfig,
    ...envSpecificConfig,
    rateLimit: {
      ...baseConfig.rateLimit,
      ...envSpecificConfig.rateLimit,
    },
    timeout: {
      ...baseConfig.timeout,
      ...envSpecificConfig.timeout,
    },
    cache: {
      ...baseConfig.cache,
      ...envSpecificConfig.cache,
    },
  };
}

/**
 * API 엔드포인트 빌더
 */
export class ApiEndpointBuilder {
  private config: ApiEndpointConfig;
  
  constructor() {
    this.config = getApiConfig();
  }
  
  /**
   * 내부 API 엔드포인트 생성
   */
  internal(path: string): string {
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${this.config.base}${cleanPath}`;
  }
  
  /**
   * Supabase 엔드포인트 생성
   */
  supabase(path: string): string {
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${this.config.supabase}${cleanPath}`;
  }
  
  /**
   * GCP Functions 엔드포인트 생성
   */
  gcpFunction(functionName: string): string {
    return `${this.config.gcpFunctions}/${functionName}`;
  }
  
  /**
   * VM API 엔드포인트 생성
   */
  vmApi(path: string): string {
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${this.config.vmApi}${cleanPath}`;
  }
  
  /**
   * 전체 설정 가져오기
   */
  getConfig(): ApiEndpointConfig {
    return this.config;
  }
}

/**
 * API 헬퍼 함수들
 */

/**
 * API 요청 헤더 생성
 */
export function createApiHeaders(options: {
  auth?: string;
  contentType?: string;
  cache?: boolean;
} = {}): HeadersInit {
  const headers: HeadersInit = {};
  
  // Content-Type
  headers['Content-Type'] = options.contentType || 'application/json';
  
  // Authorization
  if (options.auth) {
    headers['Authorization'] = `Bearer ${options.auth}`;
  }
  
  // Cache Control
  const config = getApiConfig();
  if (config.cache.enabled && options.cache !== false) {
    headers['Cache-Control'] = `max-age=${config.cache.ttl}`;
  } else {
    headers['Cache-Control'] = 'no-cache';
  }
  
  return headers;
}

/**
 * API 요청 옵션 생성
 */
export function createApiRequestOptions(options: {
  method?: string;
  body?: unknown;
  auth?: string;
  cache?: boolean;
  timeout?: number;
} = {}): RequestInit {
  const config = getApiConfig();
  const headers = createApiHeaders({
    auth: options.auth,
    cache: options.cache,
  });
  
  const requestOptions: RequestInit = {
    method: options.method || 'GET',
    headers,
  };
  
  // Body 처리
  if (options.body) {
    requestOptions.body = typeof options.body === 'string' 
      ? options.body 
      : JSON.stringify(options.body);
  }
  
  // Cache 설정
  if (!config.cache.enabled || options.cache === false) {
    requestOptions.cache = 'no-store';
  }
  
  // AbortController for timeout
  if (options.timeout || config.timeout.default) {
    const controller = new AbortController();
    const timeoutMs = options.timeout || config.timeout.default;
    
    setTimeout(() => controller.abort(), timeoutMs);
    requestOptions.signal = controller.signal;
  }
  
  return requestOptions;
}

/**
 * 환경별 API 호출 래퍼
 */
export async function apiCall<T = unknown>(
  endpoint: string,
  options: Parameters<typeof createApiRequestOptions>[0] = {}
): Promise<T> {
  const builder = new ApiEndpointBuilder();
  const url = endpoint.startsWith('http') 
    ? endpoint 
    : builder.internal(endpoint);
  
  const requestOptions = createApiRequestOptions(options);
  
  try {
    const response = await fetch(url, requestOptions);
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }
    
    return await response.json() as T;
  } catch (error) {
    // 환경별 에러 처리
    const envConfig = getEnvConfig();
    
    if (envConfig.isDevelopment) {
      console.error('API Call Error:', {
        endpoint,
        error,
        options,
      });
    }
    
    throw error;
  }
}

/**
 * 싱글톤 인스턴스
 */
export const apiEndpoint = new ApiEndpointBuilder();

// 기본 export
export default {
  getApiConfig,
  ApiEndpointBuilder,
  createApiHeaders,
  createApiRequestOptions,
  apiCall,
  apiEndpoint,
};