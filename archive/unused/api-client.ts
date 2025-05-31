interface ApiClientConfig {
  baseUrl?: string;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  retryAfter?: number;
}

export class ApiClient {
  private config: Required<ApiClientConfig>;
  
  constructor(config: ApiClientConfig = {}) {
    this.config = {
      baseUrl: config.baseUrl || '',
      timeout: config.timeout || 10000,
      retries: config.retries || 3,
      retryDelay: config.retryDelay || 1000
    };
  }

  async request<T = any>(
    endpoint: string, 
    options: RequestInit = {},
    customRetries?: number
  ): Promise<ApiResponse<T>> {
    const retries = customRetries ?? this.config.retries;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

        const response = await fetch(`${this.config.baseUrl}${endpoint}`, {
          ...options,
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
            ...options.headers
          }
        });

        clearTimeout(timeoutId);

        // Rate Limiting 처리
        if (response.status === 429) {
          const retryAfter = parseInt(response.headers.get('Retry-After') || '60');
          
          if (attempt < retries) {
            console.warn(`⏳ Rate limited, retrying after ${retryAfter}s (attempt ${attempt + 1}/${retries + 1})`);
            await this.delay(retryAfter * 1000);
            continue;
          }

          const errorData = await response.json().catch(() => ({}));
          return {
            success: false,
            error: 'Rate Limited',
            message: errorData.message || '요청 제한을 초과했습니다',
            retryAfter
          };
        }

        // 성공 응답
        if (response.ok) {
          const data = await response.json();
          return {
            success: true,
            data
          };
        }

        // 4xx, 5xx 에러
        const errorData = await response.json().catch(() => ({}));
        
        // 재시도 가능한 에러 (5xx)
        if (response.status >= 500 && attempt < retries) {
          console.warn(`🔄 Server error, retrying (attempt ${attempt + 1}/${retries + 1})`);
          await this.delay(this.config.retryDelay * Math.pow(2, attempt));
          continue;
        }

        return {
          success: false,
          error: errorData.error || 'Request Failed',
          message: errorData.message || `HTTP ${response.status}`
        };

      } catch (error: any) {
        lastError = error;
        
        // 네트워크 에러나 타임아웃
        if (attempt < retries) {
          console.warn(`🔄 Network error, retrying (attempt ${attempt + 1}/${retries + 1}):`, error.message);
          await this.delay(this.config.retryDelay * Math.pow(2, attempt));
          continue;
        }
      }
    }

    return {
      success: false,
      error: 'Network Error',
      message: lastError?.message || '네트워크 연결 실패'
    };
  }

  async get<T = any>(endpoint: string, params?: Record<string, string>): Promise<ApiResponse<T>> {
    const url = params ? `${endpoint}?${new URLSearchParams(params)}` : endpoint;
    return this.request<T>(url, { method: 'GET' });
  }

  async post<T = any>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined
    });
  }

  async put<T = any>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined
    });
  }

  async delete<T = any>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// 기본 클라이언트 인스턴스
export const apiClient = new ApiClient({
  timeout: 15000,
  retries: 2,
  retryDelay: 1000
});

// 특별한 용도의 클라이언트들
export const aiApiClient = new ApiClient({
  timeout: 30000, // AI 분석은 시간이 오래 걸릴 수 있음
  retries: 1,
  retryDelay: 2000
});

export const monitoringApiClient = new ApiClient({
  timeout: 10000,
  retries: 3,
  retryDelay: 500
});

// 편의 함수들
export async function safeApiCall<T>(
  apiCall: () => Promise<ApiResponse<T>>,
  fallbackValue: T
): Promise<T> {
  try {
    const response = await apiCall();
    return response.success ? response.data! : fallbackValue;
  } catch (error) {
    console.warn('API 호출 실패, fallback 값 사용:', error);
    return fallbackValue;
  }
}

export function isRateLimited(response: ApiResponse): boolean {
  return response.error === 'Rate Limited' || response.retryAfter !== undefined;
} 