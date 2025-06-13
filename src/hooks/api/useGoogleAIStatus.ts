import { useQuery, useQueryClient } from '@tanstack/react-query';

// 🤖 Google AI 상태 타입 정의
export interface GoogleAIStatus {
    isEnabled: boolean;
    isConnected: boolean;
    apiKeyStatus: 'valid' | 'invalid' | 'missing' | 'expired';
    quotaStatus: {
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
}

// 🔧 API 함수
const fetchGoogleAIStatus = async (): Promise<GoogleAIStatus> => {
    const response = await fetch('/api/ai/google-ai/status');
    if (!response.ok) {
        throw new Error(`Google AI 상태 조회 실패: ${response.status}`);
    }
    return response.json();
};

// 🎣 React Query 훅
export const useGoogleAIStatus = () => {
    return useQuery({
        queryKey: ['google-ai-status'],
        queryFn: fetchGoogleAIStatus,
        refetchInterval: 60000, // 1분마다 자동 갱신
        staleTime: 30000, // 30초간 데이터 신선도 유지
        retry: 2,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    });
};

// 🔄 Google AI 상태 새로고침
export const useRefreshGoogleAIStatus = () => {
    const queryClient = useQueryClient();

    return () => {
        queryClient.invalidateQueries({ queryKey: ['google-ai-status'] });
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
export const getApiKeyColor = (status: GoogleAIStatus['apiKeyStatus']) => {
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