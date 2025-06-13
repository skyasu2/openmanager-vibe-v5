import { useQuery, useQueryClient } from '@tanstack/react-query';

// 🎯 AI 인사이트 타입 정의
export interface AIInsight {
    id: string;
    type: 'prediction' | 'anomaly' | 'recommendation';
    title: string;
    description: string;
    confidence: number;
    severity: 'low' | 'medium' | 'high';
    createdAt: string;
}

// 🔧 API 함수
const fetchAIInsights = async (): Promise<AIInsight[]> => {
    const response = await fetch('/api/ai/insights');
    if (!response.ok) {
        throw new Error(`AI 인사이트 조회 실패: ${response.status}`);
    }
    return response.json();
};

// 🎣 React Query 훅
export const useAIInsights = () => {
    return useQuery({
        queryKey: ['ai-insights'],
        queryFn: fetchAIInsights,
        refetchInterval: 30000, // 30초마다 자동 갱신
        staleTime: 20000, // 20초간 데이터 신선도 유지
        retry: 3,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    });
};

// 🔄 인사이트 새로고침 훅
export const useRefreshAIInsights = () => {
    const queryClient = useQueryClient();

    return () => {
        queryClient.invalidateQueries({ queryKey: ['ai-insights'] });
    };
};

// 📊 인사이트 필터링 유틸리티
export const useFilteredAIInsights = (
    type?: AIInsight['type'],
    severity?: AIInsight['severity']
) => {
    const { data: insights, ...rest } = useAIInsights();

    const filteredInsights = insights?.filter(insight => {
        if (type && insight.type !== type) return false;
        if (severity && insight.severity !== severity) return false;
        return true;
    });

    return {
        data: filteredInsights,
        ...rest,
    };
};

// 🎨 심각도별 색상 유틸리티
export const getSeverityColor = (severity: AIInsight['severity']) => {
    switch (severity) {
        case 'high':
            return 'text-red-600 bg-red-50 border-red-200';
        case 'medium':
            return 'text-yellow-600 bg-yellow-50 border-yellow-200';
        case 'low':
            return 'text-green-600 bg-green-50 border-green-200';
        default:
            return 'text-gray-600 bg-gray-50 border-gray-200';
    }
};

// 🔖 타입별 아이콘 유틸리티
export const getTypeIcon = (type: AIInsight['type']) => {
    switch (type) {
        case 'prediction':
            return '🔮';
        case 'anomaly':
            return '⚠️';
        case 'recommendation':
            return '💡';
        default:
            return '📊';
    }
}; 