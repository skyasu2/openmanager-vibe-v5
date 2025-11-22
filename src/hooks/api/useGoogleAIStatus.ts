import { createTimeoutSignal } from '@/utils/createTimeoutSignal';
import { useQuery, useQueryClient } from '@tanstack/react-query';

// 🤖 Google AI 상태 타입 정의
export interface GoogleAIStatus {
  isEnabled: boolean;
  isConnected: boolean; // Overall connection status

  apiKeyStatus: {
    primary: 'valid' | 'invalid' | 'missing' | 'expired';
    secondary: 'valid' | 'invalid' | 'missing' | 'expired';
  };
  primaryKeyId?: string; // e.g., AIza...Kjk
  secondaryKeyId?: string; // e.g., AIza...xyz

  primaryKeyConnected: boolean; // Is primary key successfully making calls?
  secondaryKeyConnected: boolean; // Is secondary key successfully making calls?

  quotaStatus: {
    // This would represent the active key's quota
    daily: {
      used: number;
      limit: number;
      remaining: number;
    };
    perMinute: {
      used: number;
      limit: number;
      remaining: number;
    };
  };
  lastHealthCheck: string;
  healthCheckStatus: 'healthy' | 'degraded' | 'unhealthy';
  model: string;
  features: {
    chat: boolean;
    embedding: boolean;
    vision: boolean;
  };
  performance: {
    averageResponseTime: number;
    successRate: number;
    errorRate: number;
  };
  // Optional field to indicate which key is currently active
  activeKeySource?: 'primary' | 'secondary' | 'none';
}

// 🔧 API 함수
const _fetchGoogleAIStatus = async (): Promise<GoogleAIStatus> => {
  try {
    const response = await fetch('/api/ai/google-ai/status', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // 타임아웃 설정 (5초)
      signal: createTimeoutSignal(5000),
    });

    if (!response.ok) {
      // HTTP 오류 시 기본값 반환
      console.warn(`Google AI 상태 API HTTP 오류: ${response.status}`);
      return getDefaultGoogleAIStatus();
    }

    const data = await response.json();

    // 응답 데이터 검증
    if (!data || typeof data !== 'object') {
      console.warn('Google AI 상태 API 응답 데이터 형식 오류');
      return getDefaultGoogleAIStatus();
    }

    return data;
  } catch (error) {
    console.warn('Google AI 상태 API 호출 실패:', error);
    // 네트워크 오류나 타임아웃 시 기본값 반환
    return getDefaultGoogleAIStatus();
  }
};

// 🛡️ 기본 Google AI 상태 (fallback)
const getDefaultGoogleAIStatus = (): GoogleAIStatus => ({
  isEnabled: false,
  isConnected: false,
  apiKeyStatus: { primary: 'missing', secondary: 'missing' }, // Updated
  primaryKeyConnected: false, // Added
  secondaryKeyConnected: false, // Added
  quotaStatus: {
    daily: {
      used: 0,
      limit: 1000,
      remaining: 1000,
    },
    perMinute: {
      used: 0,
      limit: 60,
      remaining: 60,
    },
  },
  lastHealthCheck: new Date().toISOString(),
  healthCheckStatus: 'unhealthy',
  model: 'gemini-1.5-flash',
  features: {
    chat: false,
    embedding: false,
    vision: false,
  },
  performance: {
    averageResponseTime: 0,
    successRate: 0,
    errorRate: 0,
  },
});

// 🎣 React Query 훅
export const useGoogleAIStatus = () => {
  return useQuery({
    queryKey: ['google-ai-status'],
    queryFn: async () => {
      // 🎯 세션 캐시 확인 (브라우저 세션 동안 한 번만 체크)
      const sessionKey = 'google-ai-status-cache';
      const cachedStatus = sessionStorage.getItem(sessionKey);

      if (cachedStatus) {
        try {
          const cached = JSON.parse(cachedStatus);
          const cacheAge = Date.now() - cached.timestamp;

          // 세션 캐시가 30분 이내면 재사용
          if (cacheAge < 30 * 60 * 1000) {
            console.log('📦 Google AI 상태 캐시 사용 (세션 동안 유효)');
            return cached.data;
          }
        } catch {
          console.warn('⚠️ Google AI 상태 캐시 파싱 실패, 새로 조회');
        }
      }

      const response = await fetch('/api/ai/google-ai/status');
      if (!response.ok) {
        throw new Error('Google AI 상태 조회 실패');
      }

      const data = await response.json();

      // 세션 캐시에 저장
      try {
        sessionStorage.setItem(
          sessionKey,
          JSON.stringify({
            data,
            timestamp: Date.now(),
          })
        );
        console.log('💾 Google AI 상태 세션 캐시에 저장');
      } catch (error) {
        console.warn('⚠️ Google AI 상태 캐시 저장 실패:', error);
      }

      return data;
    },
    refetchInterval: false, // 자동 갱신 비활성화 (세션 동안 한 번만)
    staleTime: 30 * 60 * 1000, // 30분 동안 신선한 데이터로 간주
    retry: 1, // 재시도 횟수 감소
    refetchOnWindowFocus: false, // 윈도우 포커스 시 재조회 비활성화
    refetchOnMount: false, // 마운트 시 재조회 비활성화 (캐시 우선)
  });
};

// 🔄 Google AI 상태 새로고침
export const useRefreshGoogleAIStatus = () => {
  const queryClient = useQueryClient();

  return () => {
    void queryClient.invalidateQueries({ queryKey: ['google-ai-status'] });
  };
};

// 🚦 상태별 색상 유틸리티
export const getHealthColor = (status: GoogleAIStatus['healthCheckStatus']) => {
  switch (status) {
    case 'healthy':
      return 'text-green-600 bg-green-50 border-green-200';
    case 'degraded':
      return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    case 'unhealthy':
      return 'text-red-600 bg-red-50 border-red-200';
    default:
      return 'text-gray-600 bg-gray-50 border-gray-200';
  }
};

// 🔑 API 키 상태 색상
export const getApiKeyColor = (
  status: 'valid' | 'invalid' | 'missing' | 'expired'
) => {
  switch (status) {
    case 'valid':
      return 'text-green-600 bg-green-50';
    case 'invalid':
    case 'expired':
      return 'text-red-600 bg-red-50';
    case 'missing':
      return 'text-yellow-600 bg-yellow-50';
    default:
      return 'text-gray-600 bg-gray-50';
  }
};

// 📊 할당량 사용률 계산
export const getQuotaUsagePercentage = (used: number, limit: number) => {
  if (limit === 0) return 0;
  return Math.round((used / limit) * 100);
};

// 🎨 할당량 사용률별 색상
export const getQuotaColor = (percentage: number) => {
  if (percentage >= 90) return 'bg-red-500';
  if (percentage >= 70) return 'bg-yellow-500';
  return 'bg-green-500';
};
