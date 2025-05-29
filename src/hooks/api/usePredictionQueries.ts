/**
 * 🔮 AI Prediction State Management with React Query v5
 * 
 * AI 예측 엔진과의 실시간 연동
 * - 실시간 예측 데이터 업데이트
 * - 백그라운드 예측 생성 및 캐싱
 * - 지능형 에러 처리 및 fallback
 * - 예측 정확도 추적 및 개선
 */

import { 
  useQuery, 
  useMutation, 
  useQueryClient,
  useInfiniteQuery,
  keepPreviousData
} from '@tanstack/react-query';
import { toast } from 'react-hot-toast';

// 🎯 타입 정의
export interface PredictionRequest {
  metric: string;
  horizon: number; // 예측 시간 (분)
  confidence: number; // 신뢰도 (0.8-0.99)
  serverId?: string;
}

export interface PredictionResult {
  id: string;
  metric: string;
  serverId?: string;
  predicted_value: number;
  confidence_interval: [number, number];
  trend: 'increasing' | 'decreasing' | 'stable';
  seasonality: {
    detected: boolean;
    period?: number;
    strength?: number;
  };
  accuracy_score: number;
  recommendations: string[];
  metadata: {
    model_type: string;
    data_points: number;
    prediction_horizon: number;
    computation_time: number;
    created_at: string;
  };
}

export interface PredictionHistory {
  id: string;
  metric: string;
  serverId?: string;
  predicted_value: number;
  actual_value?: number;
  accuracy?: number;
  created_at: string;
  measured_at?: string;
}

export interface PredictionAnalytics {
  totalPredictions: number;
  avgAccuracy: number;
  topMetrics: Array<{
    metric: string;
    count: number;
    avgAccuracy: number;
  }>;
  recentTrends: Array<{
    metric: string;
    trend: 'up' | 'down' | 'stable';
    confidence: number;
  }>;
}

// 🔧 API 함수들
const fetchPredictions = async (filters?: {
  metric?: string;
  serverId?: string;
  timeRange?: string;
}): Promise<PredictionResult[]> => {
  const params = new URLSearchParams();
  if (filters?.metric) params.append('metric', filters.metric);
  if (filters?.serverId) params.append('serverId', filters.serverId);
  if (filters?.timeRange) params.append('timeRange', filters.timeRange);
  
  const response = await fetch(`/api/ai/prediction?${params}`);
  if (!response.ok) {
    throw new Error(`예측 데이터 조회 실패: ${response.status}`);
  }
  return response.json();
};

const createPrediction = async (request: PredictionRequest): Promise<PredictionResult> => {
  const response = await fetch('/api/ai/prediction', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  
  if (!response.ok) {
    throw new Error(`예측 생성 실패: ${response.status}`);
  }
  return response.json();
};

const fetchPredictionHistory = async (
  metric: string,
  limit: number = 50
): Promise<PredictionHistory[]> => {
  const response = await fetch(`/api/ai/prediction/history?metric=${metric}&limit=${limit}`);
  if (!response.ok) {
    throw new Error(`예측 히스토리 조회 실패: ${response.status}`);
  }
  return response.json();
};

const fetchPredictionAnalytics = async (timeRange: string = '7d'): Promise<PredictionAnalytics> => {
  const response = await fetch(`/api/ai/prediction/analytics?range=${timeRange}`);
  if (!response.ok) {
    throw new Error(`예측 분석 데이터 조회 실패: ${response.status}`);
  }
  return response.json();
};

const generateDemoPredictions = async (): Promise<PredictionResult[]> => {
  const response = await fetch('/api/ai/prediction?demo=true');
  if (!response.ok) {
    throw new Error(`데모 예측 생성 실패: ${response.status}`);
  }
  return response.json();
};

// 🎯 Query Keys Factory
export const predictionKeys = {
  all: ['predictions'] as const,
  lists: () => [...predictionKeys.all, 'list'] as const,
  list: (filters: string) => [...predictionKeys.lists(), { filters }] as const,
  details: () => [...predictionKeys.all, 'detail'] as const,
  detail: (id: string) => [...predictionKeys.details(), id] as const,
  history: (metric: string) => [...predictionKeys.all, 'history', metric] as const,
  analytics: (timeRange: string) => [...predictionKeys.all, 'analytics', timeRange] as const,
  demo: () => [...predictionKeys.all, 'demo'] as const,
};

// 🔮 메인 예측 데이터 조회
export const usePredictions = (filters?: {
  metric?: string;
  serverId?: string;
  timeRange?: string;
  refetchInterval?: number;
  enabled?: boolean;
}) => {
  return useQuery({
    queryKey: predictionKeys.list(JSON.stringify(filters || {})),
    queryFn: () => fetchPredictions(filters),
    refetchInterval: filters?.refetchInterval ?? 60000, // 1분 자동 갱신
    staleTime: 30000, // 30초 동안 stale하지 않음
    enabled: filters?.enabled ?? true,
    retry: (failureCount, error) => {
      // 500 이상 서버 에러는 재시도
      if (error instanceof Error && error.message.includes('50')) {
        return failureCount < 2;
      }
      return false;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    placeholderData: keepPreviousData,
    select: (data) => {
      // 데이터 정렬 및 변환
      return data
        .sort((a, b) => new Date(b.metadata.created_at).getTime() - new Date(a.metadata.created_at).getTime())
        .map(prediction => ({
          ...prediction,
          formatted_value: `${prediction.predicted_value.toFixed(2)}%`,
          trend_emoji: prediction.trend === 'increasing' ? '📈' : 
                      prediction.trend === 'decreasing' ? '📉' : '➡️',
          accuracy_color: prediction.accuracy_score >= 0.8 ? 'green' : 
                         prediction.accuracy_score >= 0.6 ? 'yellow' : 'red',
        }));
    },
    meta: {
      errorMessage: 'AI 예측 데이터를 불러오는데 실패했습니다.',
    },
  });
};

// 🎯 예측 생성 Mutation
export const usePredictionMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createPrediction,
    
    onMutate: async (request) => {
      // 로딩 토스트 표시
      toast.loading(`${request.metric} 예측 생성 중...`, { 
        id: `prediction-${request.metric}` 
      });
      
      // 진행 중인 쿼리 취소
      await queryClient.cancelQueries({ queryKey: predictionKeys.lists() });
    },
    
    onSuccess: (newPrediction, request) => {
      // 성공 토스트
      toast.success(
        `${request.metric} 예측 완료: ${newPrediction.predicted_value.toFixed(2)}%`, 
        { id: `prediction-${request.metric}` }
      );
      
      // 예측 목록에 새 데이터 추가
      queryClient.setQueryData(
        predictionKeys.list('{}'),
        (old: PredictionResult[] | undefined) => {
          if (!old) return [newPrediction];
          return [newPrediction, ...old];
        }
      );
      
      // 관련 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: predictionKeys.analytics('7d') });
      queryClient.invalidateQueries({ 
        queryKey: predictionKeys.history(request.metric) 
      });
    },
    
    onError: (error, request) => {
      toast.error(`${request.metric} 예측 실패: ${error.message}`, { 
        id: `prediction-${request.metric}` 
      });
    },
  });
};

// 📊 예측 히스토리 조회
export const usePredictionHistory = (metric: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: predictionKeys.history(metric),
    queryFn: () => fetchPredictionHistory(metric),
    enabled: !!metric && enabled,
    staleTime: 2 * 60 * 1000, // 2분
    refetchInterval: 5 * 60 * 1000, // 5분 간격
    retry: 1,
    select: (data) => {
      // 정확도 계산 및 통계 추가
      const withAccuracy = data.map(item => ({
        ...item,
        accuracy: item.actual_value && item.predicted_value 
          ? 1 - Math.abs(item.actual_value - item.predicted_value) / item.actual_value
          : undefined,
      }));
      
      const avgAccuracy = withAccuracy
        .filter(item => item.accuracy !== undefined)
        .reduce((acc, item) => acc + (item.accuracy || 0), 0) / 
        withAccuracy.filter(item => item.accuracy !== undefined).length || 0;
      
      return {
        history: withAccuracy,
        stats: {
          total: withAccuracy.length,
          avgAccuracy,
          recentAccuracy: withAccuracy.slice(0, 10)
            .filter(item => item.accuracy !== undefined)
            .reduce((acc, item) => acc + (item.accuracy || 0), 0) / 10 || 0,
        },
      };
    },
    meta: {
      errorMessage: '예측 히스토리를 불러오는데 실패했습니다.',
    },
  });
};

// 📈 예측 분석 데이터
export const usePredictionAnalytics = (timeRange: string = '7d') => {
  return useQuery({
    queryKey: predictionKeys.analytics(timeRange),
    queryFn: () => fetchPredictionAnalytics(timeRange),
    staleTime: 5 * 60 * 1000, // 5분
    refetchInterval: 10 * 60 * 1000, // 10분 간격
    retry: 2,
    select: (data) => ({
      ...data,
      performanceGrade: data.avgAccuracy >= 0.9 ? 'A' : 
                       data.avgAccuracy >= 0.8 ? 'B' : 
                       data.avgAccuracy >= 0.7 ? 'C' : 'D',
      recommendedActions: data.avgAccuracy < 0.7 ? [
        '데이터 품질 개선 필요',
        '모델 재훈련 권장',
        '예측 파라미터 조정 검토'
      ] : data.avgAccuracy < 0.9 ? [
        '모델 성능 개선 여지 있음',
        '추가 데이터 수집 권장'
      ] : [
        '우수한 예측 성능',
        '현재 설정 유지 권장'
      ],
    }),
    meta: {
      errorMessage: '예측 분석 데이터를 불러오는데 실패했습니다.',
    },
  });
};

// 🎮 데모 예측 데이터
export const useDemoPredictions = () => {
  return useQuery({
    queryKey: predictionKeys.demo(),
    queryFn: generateDemoPredictions,
    staleTime: 10 * 60 * 1000, // 10분
    refetchInterval: false, // 수동 갱신만
    retry: 1,
    select: (data) => ({
      predictions: data,
      summary: {
        total: data.length,
        metrics: [...new Set(data.map(p => p.metric))],
        avgAccuracy: data.reduce((acc, p) => acc + p.accuracy_score, 0) / data.length,
        trends: {
          increasing: data.filter(p => p.trend === 'increasing').length,
          decreasing: data.filter(p => p.trend === 'decreasing').length,
          stable: data.filter(p => p.trend === 'stable').length,
        },
      },
    }),
    meta: {
      errorMessage: '데모 예측 데이터 생성에 실패했습니다.',
    },
  });
};

// 🔄 예측 새로고침
export const usePredictionRefresh = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      // 모든 예측 관련 쿼리 무효화
      await queryClient.invalidateQueries({ queryKey: predictionKeys.all });
      return true;
    },
    onSuccess: () => {
      toast.success('예측 데이터가 새로고침되었습니다.');
    },
    onError: () => {
      toast.error('예측 데이터 새로고침에 실패했습니다.');
    },
  });
};

// 🎯 실시간 예측 (특정 메트릭)
export const useRealtimePrediction = (
  metric: string, 
  horizon: number = 30,
  enabled: boolean = true
) => {
  const predictionMutation = usePredictionMutation();
  
  return useQuery({
    queryKey: ['realtime-prediction', metric, horizon],
    queryFn: () => createPrediction({ 
      metric, 
      horizon, 
      confidence: 0.95 
    }),
    enabled: !!metric && enabled,
    refetchInterval: 2 * 60 * 1000, // 2분 간격
    staleTime: 60 * 1000, // 1분
    retry: 2,
    select: (data) => ({
      ...data,
      isRealtime: true,
      nextUpdate: Date.now() + (2 * 60 * 1000), // 다음 업데이트 시간
      confidence_level: data.accuracy_score >= 0.9 ? 'high' : 
                       data.accuracy_score >= 0.7 ? 'medium' : 'low',
    }),
    meta: {
      errorMessage: '실시간 예측 데이터를 불러오는데 실패했습니다.',
    },
  });
};

// 📊 메트릭별 예측 요약
export const usePredictionSummary = () => {
  const { data: predictions, isLoading } = usePredictions();
  
  const summary = predictions ? {
    total: predictions.length,
    byMetric: predictions.reduce((acc, pred) => {
      const metric = pred.metric;
      if (!acc[metric]) {
        acc[metric] = {
          count: 0,
          avgAccuracy: 0,
          latestTrend: 'stable' as const,
          predictions: [],
        };
      }
      acc[metric].count++;
      acc[metric].predictions.push(pred);
      acc[metric].avgAccuracy = acc[metric].predictions
        .reduce((sum, p) => sum + p.accuracy_score, 0) / acc[metric].count;
      acc[metric].latestTrend = acc[metric].predictions[0]?.trend || 'stable';
      return acc;
    }, {} as Record<string, any>),
    trends: {
      increasing: predictions.filter(p => p.trend === 'increasing').length,
      decreasing: predictions.filter(p => p.trend === 'decreasing').length,
      stable: predictions.filter(p => p.trend === 'stable').length,
    },
    avgAccuracy: predictions.reduce((acc, p) => acc + p.accuracy_score, 0) / predictions.length,
  } : undefined;
  
  return { data: summary, isLoading };
};

// 🔧 예측 쿼리 상태 관리
export const usePredictionQueryStatus = () => {
  const queryClient = useQueryClient();
  
  const queries = queryClient.getQueryCache().getAll()
    .filter(query => query.queryKey[0] === 'predictions');
  
  return {
    totalQueries: queries.length,
    loadingQueries: queries.filter(q => q.state.status === 'pending').length,
    errorQueries: queries.filter(q => q.state.status === 'error').length,
    staleQueries: queries.filter(q => q.isStale()).length,
    lastUpdate: Math.max(...queries.map(q => q.state.dataUpdatedAt)),
  };
}; 