/**
 * ♾️ 무한 스크롤 데이터 관리: Infinite Queries
 * 
 * Phase 7.3: 실시간 데이터 통합
 * - 로그 무한 스크롤
 * - 히스토리 데이터 무한 로딩
 * - 성능 최적화된 가상화
 * - 실시간 업데이트 통합
 */

import { useInfiniteQuery, useQueryClient, InfiniteData } from '@tanstack/react-query';
import { useCallback, useMemo, useEffect } from 'react';

// 📄 페이지네이션 응답 타입
interface PaginatedResponse<T> {
  data: T[];
  nextCursor?: string | number;
  hasNextPage: boolean;
  totalCount?: number;
  pageSize: number;
}

// 📋 로그 엔트리 타입
interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warning' | 'error' | 'debug';
  message: string;
  source: string;
  metadata?: Record<string, any>;
  serverId?: string;
}

// 📊 메트릭 히스토리 타입
interface MetricHistoryEntry {
  id: string;
  timestamp: string;
  serverId: string;
  metric: string;
  value: number;
  tags?: Record<string, string>;
}

// 🔮 예측 히스토리 타입
interface PredictionHistoryEntry {
  id: string;
  timestamp: string;
  metric: string;
  predicted_value: number;
  actual_value?: number;
  accuracy?: number;
  model_version: string;
  serverId?: string;
}

// 🎯 Query Keys for Infinite Queries
export const infiniteKeys = {
  logs: (filters: string) => ['infinite', 'logs', { filters }] as const,
  metrics: (serverId: string, metric: string) => ['infinite', 'metrics', serverId, metric] as const,
  predictions: (filters: string) => ['infinite', 'predictions', { filters }] as const,
  alerts: (filters: string) => ['infinite', 'alerts', { filters }] as const,
};

// 📋 무한 로그 스크롤
export const useInfiniteLogs = (filters: {
  level?: LogEntry['level'];
  source?: string;
  serverId?: string;
  timeRange?: string;
  search?: string;
} = {}) => {
  const queryClient = useQueryClient();

  const fetchLogs = async ({ pageParam }: { pageParam: string | number }): Promise<PaginatedResponse<LogEntry>> => {
    const params = new URLSearchParams({
      cursor: pageParam.toString(),
      limit: '50',
      ...Object.fromEntries(
        Object.entries(filters).filter(([_, value]) => value !== undefined)
      ),
    });

    const response = await fetch(`/api/logs?${params}`);
    if (!response.ok) {
      throw new Error(`로그 조회 실패: ${response.status}`);
    }
    return response.json();
  };

  const query = useInfiniteQuery({
    queryKey: infiniteKeys.logs(JSON.stringify(filters)),
    queryFn: fetchLogs,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: 0,
    staleTime: 30000, // 30초
    refetchInterval: 60000, // 1분 자동 갱신
    select: (data: InfiniteData<PaginatedResponse<LogEntry>>) => ({
      pages: data.pages,
      pageParams: data.pageParams,
      // 모든 로그를 평면 배열로 변환
      allLogs: data.pages.flatMap(page => page.data),
      totalCount: data.pages[0]?.totalCount || 0,
      hasNextPage: data.pages[data.pages.length - 1]?.hasNextPage || false,
    }),
  });

  // 🔄 새로운 로그 실시간 추가
  const addNewLog = useCallback((newLog: LogEntry) => {
    queryClient.setQueryData(
      infiniteKeys.logs(JSON.stringify(filters)),
      (old: InfiniteData<PaginatedResponse<LogEntry>> | undefined) => {
        if (!old) return old;
        
        const updatedPages = [...old.pages];
        if (updatedPages[0]) {
          updatedPages[0] = {
            ...updatedPages[0],
            data: [newLog, ...updatedPages[0].data],
          };
        }
        
        return {
          ...old,
          pages: updatedPages,
        };
      }
    );
  }, [queryClient, filters]);

  // 📊 로그 통계
  const stats = useMemo(() => {
    const allLogs = query.data?.allLogs || [];
    return {
      total: allLogs.length,
      byLevel: {
        info: allLogs.filter((log: LogEntry) => log.level === 'info').length,
        warning: allLogs.filter((log: LogEntry) => log.level === 'warning').length,
        error: allLogs.filter((log: LogEntry) => log.level === 'error').length,
        debug: allLogs.filter((log: LogEntry) => log.level === 'debug').length,
      },
      recentErrors: allLogs
        .filter((log: LogEntry) => log.level === 'error')
        .slice(0, 5),
    };
  }, [query.data]);

  return {
    ...query,
    addNewLog,
    stats,
    logs: query.data?.allLogs || [],
  };
};

// 📊 무한 메트릭 히스토리
export const useInfiniteMetrics = (serverId: string, metric: string, timeRange: string = '24h') => {
  const fetchMetrics = async ({ pageParam }: { pageParam: string | number }): Promise<PaginatedResponse<MetricHistoryEntry>> => {
    const params = new URLSearchParams({
      cursor: pageParam.toString(),
      limit: '100',
      timeRange,
    });

    const response = await fetch(`/api/servers/${serverId}/metrics/${metric}/history?${params}`);
    if (!response.ok) {
      throw new Error(`메트릭 히스토리 조회 실패: ${response.status}`);
    }
    return response.json();
  };

  return useInfiniteQuery({
    queryKey: infiniteKeys.metrics(serverId, metric),
    queryFn: fetchMetrics,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: 0,
    enabled: !!serverId && !!metric,
    staleTime: 60000, // 1분
    select: (data: InfiniteData<PaginatedResponse<MetricHistoryEntry>>) => ({
      pages: data.pages,
      pageParams: data.pageParams,
      allMetrics: data.pages.flatMap(page => page.data),
      // 차트 데이터 형태로 변환
      chartData: data.pages.flatMap(page => 
        page.data.map(entry => ({
          timestamp: entry.timestamp,
          value: entry.value,
        }))
      ),
    }),
  });
};

// 🔮 무한 예측 히스토리
export const useInfinitePredictionHistory = (filters: {
  metric?: string;
  serverId?: string;
  accuracy?: { min?: number; max?: number };
} = {}) => {
  const fetchPredictions = async ({ pageParam }: { pageParam: string | number }): Promise<PaginatedResponse<PredictionHistoryEntry>> => {
    const params = new URLSearchParams({
      cursor: pageParam.toString(),
      limit: '25',
      ...Object.fromEntries(
        Object.entries(filters).filter(([_, value]) => value !== undefined)
      ),
    });

    const response = await fetch(`/api/ai/prediction/history?${params}`);
    if (!response.ok) {
      throw new Error(`예측 히스토리 조회 실패: ${response.status}`);
    }
    return response.json();
  };

  const query = useInfiniteQuery({
    queryKey: infiniteKeys.predictions(JSON.stringify(filters)),
    queryFn: fetchPredictions,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: 0,
    staleTime: 120000, // 2분
    select: (data: InfiniteData<PaginatedResponse<PredictionHistoryEntry>>) => ({
      pages: data.pages,
      pageParams: data.pageParams,
      allPredictions: data.pages.flatMap(page => page.data),
      accuracyStats: calculateAccuracyStats(data.pages.flatMap(page => page.data)),
    }),
  });

  return query;
};

// 🚨 무한 알림 히스토리
export const useInfiniteAlerts = (filters: {
  level?: 'info' | 'warning' | 'error' | 'critical';
  resolved?: boolean;
  serverId?: string;
} = {}) => {
  const fetchAlerts = async ({ pageParam }: { pageParam: string | number }): Promise<PaginatedResponse<any>> => {
    const params = new URLSearchParams({
      cursor: pageParam.toString(),
      limit: '20',
      ...Object.fromEntries(
        Object.entries(filters).filter(([_, value]) => value !== undefined)
      ),
    });

    const response = await fetch(`/api/alerts/history?${params}`);
    if (!response.ok) {
      throw new Error(`알림 히스토리 조회 실패: ${response.status}`);
    }
    return response.json();
  };

  return useInfiniteQuery({
    queryKey: infiniteKeys.alerts(JSON.stringify(filters)),
    queryFn: fetchAlerts,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: 0,
    staleTime: 30000, // 30초
    refetchInterval: 120000, // 2분
    select: (data: InfiniteData<PaginatedResponse<any>>) => ({
      pages: data.pages,
      pageParams: data.pageParams,
      allAlerts: data.pages.flatMap(page => page.data),
      unresolvedCount: data.pages.flatMap(page => page.data)
        .filter(alert => !alert.resolved).length,
    }),
  });
};

// 🎯 통합 무한 스크롤 관리
export const useInfiniteScrollManager = () => {
  const queryClient = useQueryClient();

  // 📊 모든 무한 쿼리 상태
  const getAllInfiniteQueries = useCallback(() => {
    return queryClient.getQueryCache().getAll()
      .filter(query => query.queryKey[0] === 'infinite')
      .map(query => ({
        key: query.queryKey,
        status: query.state.status,
        dataUpdatedAt: query.state.dataUpdatedAt,
        isFetching: query.state.fetchStatus === 'fetching',
      }));
  }, [queryClient]);

  // 🔄 특정 타입의 무한 쿼리 새로고침
  const refreshInfiniteQueries = useCallback((type: 'logs' | 'metrics' | 'predictions' | 'alerts') => {
    queryClient.invalidateQueries({
      predicate: (query) => 
        query.queryKey[0] === 'infinite' && query.queryKey[1] === type,
    });
  }, [queryClient]);

  // 🧹 메모리 최적화: 오래된 페이지 제거
  const optimizeMemory = useCallback(() => {
    const infiniteQueries = queryClient.getQueryCache().getAll()
      .filter(query => query.queryKey[0] === 'infinite');

    infiniteQueries.forEach(query => {
      const data = query.state.data as InfiniteData<any>;
      if (data?.pages && data.pages.length > 10) {
        // 처음 5페이지와 마지막 5페이지만 유지
        const optimizedData = {
          ...data,
          pages: [
            ...data.pages.slice(0, 5),
            ...data.pages.slice(-5),
          ],
          pageParams: [
            ...data.pageParams.slice(0, 5),
            ...data.pageParams.slice(-5),
          ],
        };
        
        queryClient.setQueryData(query.queryKey, optimizedData);
      }
    });
  }, [queryClient]);

  // ⏰ 자동 메모리 최적화 (5분마다)
  useEffect(() => {
    const interval = setInterval(optimizeMemory, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [optimizeMemory]);

  return {
    getAllInfiniteQueries,
    refreshInfiniteQueries,
    optimizeMemory,
  };
};

// 🔢 정확도 통계 계산 유틸리티
function calculateAccuracyStats(predictions: PredictionHistoryEntry[]) {
  const withAccuracy = predictions.filter(p => p.accuracy !== undefined);
  
  if (withAccuracy.length === 0) {
    return {
      average: 0,
      min: 0,
      max: 0,
      count: 0,
      distribution: { excellent: 0, good: 0, fair: 0, poor: 0 },
    };
  }

  const accuracies = withAccuracy.map(p => p.accuracy!);
  const average = accuracies.reduce((sum, acc) => sum + acc, 0) / accuracies.length;
  const min = Math.min(...accuracies);
  const max = Math.max(...accuracies);

  return {
    average,
    min,
    max,
    count: withAccuracy.length,
    distribution: {
      excellent: accuracies.filter(acc => acc >= 0.9).length,
      good: accuracies.filter(acc => acc >= 0.7 && acc < 0.9).length,
      fair: accuracies.filter(acc => acc >= 0.5 && acc < 0.7).length,
      poor: accuracies.filter(acc => acc < 0.5).length,
    },
  };
} 