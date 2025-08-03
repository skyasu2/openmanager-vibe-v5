/**
 * 🌐 API 클라이언트 - 환경별 URL 처리 + 타입 안전성
 *
 * Vercel 환경에서 발생하는 API URL 문제를 해결하기 위한 통합 클라이언트
 * Zod 스키마 기반 런타임 검증 및 TypeScript 타입 안전성 제공
 */

import { z } from 'zod';
import { 
  ApiResponse, 
  isApiResponse, 
  getErrorMessage 
} from '@/types/api-responses';

/**
 * 환경별 기본 URL 가져오기
 */
function getBaseUrl(): string {
  // 클라이언트 사이드에서는 현재 origin 사용
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }

  // 서버 사이드에서는 환경변수 사용
  return (
    process.env.NEXT_PUBLIC_SITE_URL || 'https://openmanager-vibe-v5.vercel.app'
  );
}

/**
 * API URL 생성
 */
export function createApiUrl(endpoint: string): string {
  const baseUrl = getBaseUrl();
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const fullUrl = `${baseUrl}${cleanEndpoint}`;

  console.log(`🔗 API URL 생성: ${endpoint} → ${fullUrl}`);
  return fullUrl;
}

/**
 * 향상된 fetch 함수
 */
export async function apiFetch(
  endpoint: string,
  options?: RequestInit
): Promise<Response> {
  const url = createApiUrl(endpoint);

  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  };

  console.log(`🚀 API 요청: ${options?.method || 'GET'} ${url}`);

  try {
    const response = await fetch(url, defaultOptions);

    if (!response.ok) {
      console.error(
        `❌ API 요청 실패: ${response.status} ${response.statusText} - ${url}`
      );
    } else {
      console.log(`✅ API 요청 성공: ${response.status} - ${url}`);
    }

    return response;
  } catch (error) {
    console.error(`❌ API 요청 오류: ${error} - ${url}`);
    throw error;
  }
}

/**
 * JSON 응답을 위한 편의 함수
 */
export async function apiRequest<T = any>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const response = await apiFetch(endpoint, options);

  if (!response.ok) {
    throw new Error(`API 요청 실패: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

/**
 * GET 요청
 */
export async function apiGet<T = any>(endpoint: string): Promise<T> {
  return apiRequest<T>(endpoint, { method: 'GET' });
}

/**
 * POST 요청
 */
export async function apiPost<T = any>(
  endpoint: string,
  data?: unknown
): Promise<T> {
  return apiRequest<T>(endpoint, {
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  });
}

/**
 * PUT 요청
 */
export async function apiPut<T = any>(
  endpoint: string,
  data?: unknown
): Promise<T> {
  return apiRequest<T>(endpoint, {
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined,
  });
}

/**
 * DELETE 요청
 */
export async function apiDelete<T = any>(endpoint: string): Promise<T> {
  return apiRequest<T>(endpoint, { method: 'DELETE' });
}

/**
 * 🎯 타입 안전한 API 호출 함수 (Zod 스키마 기반)
 * 
 * 런타임 타입 검증과 TypeScript 타입 안전성을 동시에 제공
 * 600+ TypeScript 에러 해결을 위한 핵심 함수
 */
export async function safeApiCall<T>(
  endpoint: string,
  responseSchema: z.ZodSchema<T>,
  options?: RequestInit
): Promise<T> {
  try {
    const response = await apiFetch(endpoint, options);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API 요청 실패: ${response.status} ${response.statusText} - ${errorText}`);
    }
    
    const rawData = await response.json();
    
    // Zod 스키마로 런타임 검증 + TypeScript 타입 안전성 확보
    const validatedData = responseSchema.parse(rawData);
    
    console.log(`✅ 타입 안전한 API 호출 성공: ${endpoint}`);
    return validatedData;
    
  } catch (error) {
    console.error(`❌ 타입 안전한 API 호출 실패: ${endpoint}`, error);
    
    if (error instanceof z.ZodError) {
      console.error('스키마 검증 실패:', error.errors);
      throw new Error(`응답 데이터 형식 오류: ${error.errors.map(e => e.message).join(', ')}`);
    }
    
    throw error;
  }
}

/**
 * 🎯 ApiResponse 래퍼 타입에 대한 안전한 API 호출
 */
export async function safeApiCallWithResponse<T>(
  endpoint: string,
  dataSchema: z.ZodSchema<T>,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  try {
    const response = await apiFetch(endpoint, options);
    const rawData = await response.json();
    
    // ApiResponse 형식인지 확인
    if (!isApiResponse(rawData)) {
      throw new Error('응답이 표준 ApiResponse 형식이 아닙니다');
    }
    
    // 데이터 부분만 스키마로 검증
    const validatedData = dataSchema.parse(rawData.data);
    
    return {
      ...rawData,
      data: validatedData,
    } as ApiResponse<T>;
    
  } catch (error) {
    console.error(`❌ ApiResponse 안전한 호출 실패: ${endpoint}`, error);
    throw error;
  }
}

/**
 * 🎯 타입 안전한 GET 요청
 */
export async function safeApiGet<T>(
  endpoint: string,
  schema: z.ZodSchema<T>
): Promise<T> {
  return safeApiCall(endpoint, schema, { method: 'GET' });
}

/**
 * 🎯 타입 안전한 POST 요청
 */
export async function safeApiPost<TRequest, TResponse>(
  endpoint: string,
  data: TRequest,
  responseSchema: z.ZodSchema<TResponse>,
  requestSchema?: z.ZodSchema<TRequest>
): Promise<TResponse> {
  // 요청 데이터 검증 (선택사항)
  if (requestSchema) {
    try {
      requestSchema.parse(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error(`요청 데이터 형식 오류: ${error.errors.map(e => e.message).join(', ')}`);
      }
      throw error;
    }
  }
  
  return safeApiCall(endpoint, responseSchema, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * 기존 fetch 호출을 대체하기 위한 래퍼
 */
export const enhancedFetch = apiFetch;

export default {
  // 기존 함수들 (하위 호환성)
  get: apiGet,
  post: apiPost,
  put: apiPut,
  delete: apiDelete,
  fetch: apiFetch,
  createUrl: createApiUrl,
  
  // 새로운 타입 안전한 함수들
  safeCall: safeApiCall,
  safeCallWithResponse: safeApiCallWithResponse,
  safeGet: safeApiGet,
  safePost: safeApiPost,
};
