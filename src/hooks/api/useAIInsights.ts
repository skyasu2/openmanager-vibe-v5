import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useRef } from 'react';

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

// 🛡️ 과도한 갱신 방지를 위한 설정
const AI_INSIGHTS_CONFIG = {
  refetchInterval: 5 * 60 * 1000, // 5분마다 갱신 (30초 → 5분)
  staleTime: 3 * 60 * 1000, // 3분간 데이터 신선도 유지 (20초 → 3분)
  gcTime: 10 * 60 * 1000, // 10분간 가비지 컬렉션 시간 (React Query v4+)
  retry: 2, // 재시도 횟수 감소 (3 → 2)
  retryDelay: 5000, // 고정 재시도 간격 (5초)
};

// 🔧 API 함수 (캐싱 헤더 포함)
const fetchAIInsights = async (): Promise<AIInsight[]> => {
  const response = await fetch('/api/ai/insights', {
    headers: {
      'Cache-Control': 'public, max-age=180, stale-while-revalidate=300', // 3분 캐시
    },
  });
  if (!response.ok) {
    throw new Error(`AI 인사이트 조회 실패: ${response.status}`);
  }
  return response.json();
};

// 🎣 React Query 훅 (과도한 갱신 방지)
export const useAIInsights = () => {
  return useQuery<AIInsight[], Error>({
    queryKey: ['ai-insights'],
    queryFn: fetchAIInsights,
    refetchInterval: AI_INSIGHTS_CONFIG.refetchInterval,
    staleTime: AI_INSIGHTS_CONFIG.staleTime,
    gcTime: AI_INSIGHTS_CONFIG.gcTime,
    retry: AI_INSIGHTS_CONFIG.retry,
    retryDelay: AI_INSIGHTS_CONFIG.retryDelay,
    refetchOnWindowFocus: false, // 창 포커스 시 자동 갱신 비활성화
    refetchOnMount: false, // 마운트 시 자동 갱신 비활성화 (캐시 우선)
    refetchOnReconnect: true, // 네트워크 재연결 시에만 갱신
  });
};

// 🔄 스마트 인사이트 새로고침 훅 (과도한 갱신 방지)
export const useRefreshAIInsights = () => {
  const queryClient = useQueryClient();
  const lastRefreshRef = useRef<number>(0);
  const MIN_REFRESH_INTERVAL = 60 * 1000; // 최소 1분 간격

  return useCallback(() => {
    const now = Date.now();
    const timeSinceLastRefresh = now - lastRefreshRef.current;

    if (timeSinceLastRefresh < MIN_REFRESH_INTERVAL) {
      console.log(
        `⏳ AI 인사이트 갱신 제한: ${Math.ceil((MIN_REFRESH_INTERVAL - timeSinceLastRefresh) / 1000)}초 후 다시 시도`
      );
      return false; // 갱신 거부
    }

    lastRefreshRef.current = now;
    queryClient.invalidateQueries({ queryKey: ['ai-insights'] });
    console.log('🔄 AI 인사이트 수동 갱신 실행');
    return true; // 갱신 성공
  }, [queryClient]);
};

// 📊 인사이트 필터링 유틸리티
export const useFilteredAIInsights = (
  type?: AIInsight['type'],
  severity?: AIInsight['severity']
) => {
  const { data: insights, ...rest } = useAIInsights();

  const filteredInsights = insights?.filter((insight) => {
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
