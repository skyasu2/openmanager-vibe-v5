/**
 * 🌐 API 클라이언트 - 환경별 URL 처리
 *
 * Vercel 환경에서 발생하는 API URL 문제를 해결하기 위한 통합 클라이언트
 */

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
  data?: any
): Promise<T> {
  return apiRequest<T>(endpoint, {
    method: 'POST',
    body: data ? JSON.stringify(_data) : undefined,
  });
}

/**
 * PUT 요청
 */
export async function apiPut<T = any>(
  endpoint: string,
  data?: any
): Promise<T> {
  return apiRequest<T>(endpoint, {
    method: 'PUT',
    body: data ? JSON.stringify(_data) : undefined,
  });
}

/**
 * DELETE 요청
 */
export async function apiDelete<T = any>(endpoint: string): Promise<T> {
  return apiRequest<T>(endpoint, { method: 'DELETE' });
}

/**
 * 기존 fetch 호출을 대체하기 위한 래퍼
 */
export const enhancedFetch = apiFetch;

export default {
  get: apiGet,
  post: apiPost,
  put: apiPut,
  delete: apiDelete,
  fetch: apiFetch,
  createUrl: createApiUrl,
};
