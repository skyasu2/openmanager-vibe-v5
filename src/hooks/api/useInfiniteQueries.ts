/**
 * 무한 스크롤 쿼리 훅
 *
 * @description
 * 로그, 메트릭, 예측 등의 대용량 데이터를
 * 무한 스크롤로 효율적으로 로드하는 훅들
 */

import type { InfiniteData } from '@tanstack/react-query';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect } from 'react';

// 타입 정의
interface PaginatedResponse<T> {
  data: T[];
  nextCursor?: string | number;
  hasNextPage: boolean;
  totalCount?: number;
  pageSize: number;
}

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warning' | 'error' | 'debug';
  message: string;
  source: string;
  metadata?: Record<string, any>;
  serverId?: string;
}

interface MetricHistoryEntry {
  id: string;
  timestamp: string;
  serverId: string;
  metric: string;
  value: number;
  tags?: Record<string, string>;
}

// 페이지 매개변수 타입 정의
interface PageParam {
  pageParam: string | number;
}
// 쿼리 키 팩토리
export const infiniteKeys = {
  logs: (filters: string) => ['infinite', 'logs', filters] as const,
  metrics: (serverId: string, metric: string, timeRange: string) =>
    ['infinite', 'metrics', serverId, metric, timeRange] as const,
  predictions: (filters: string) =>
    ['infinite', 'predictions', filters] as const,
  alerts: (filters: string) => ['infinite', 'alerts', filters] as const,
} as const;

// 🚨 무한 로그 스크롤
export const useInfiniteLogs = (
  filters: {
    level?: LogEntry['level'];
    source?: string;
    serverId?: string;
    timeRange?: string;
    search?: string;
  } = {}
) => {
  const fetchLogs = async ({
    pageParam = 0,
  }: {
    pageParam?: string | number;
  }): Promise<PaginatedResponse<LogEntry>> => {
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

  return useInfiniteQuery({
    queryKey: infiniteKeys.logs(JSON.stringify(filters)),
    queryFn: fetchLogs,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: 0,
    staleTime: 30 * 1000, // 30초
    refetchInterval: 2 * 60 * 1000, // 2분
    select: (data: InfiniteData<PaginatedResponse<LogEntry>>) => ({
      pages: data.pages,
      pageParams: data.pageParams,
      allLogs: data.pages.flatMap((page) => page.data),
      errorCount: data.pages
        .flatMap((page) => page.data)
        .filter((log) => log.level === 'error').length,
      warningCount: data.pages
        .flatMap((page) => page.data)
        .filter((log) => log.level === 'warning').length,
    }),
  });
};

// 📊 무한 메트릭 히스토리
export const useInfiniteMetrics = (
  serverId: string,
  metric: string,
  timeRange: string = '24h'
) => {
  const fetchMetrics = async ({
    pageParam = 0,
  }: {
    pageParam?: string | number;
  }): Promise<PaginatedResponse<MetricHistoryEntry>> => {
    const params = new URLSearchParams({
      cursor: pageParam.toString(),
      limit: '100',
      serverId,
      metric,
      timeRange,
    });

    const response = await fetch(`/api/metrics/history?${params}`);
    if (!response.ok) {
      throw new Error(`메트릭 히스토리 조회 실패: ${response.status}`);
    }
    return response.json();
  };

  return useInfiniteQuery({
    queryKey: infiniteKeys.metrics(serverId, metric, timeRange),
    queryFn: fetchMetrics,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: 0,
    staleTime: 60 * 1000, // 1분
    refetchInterval: 5 * 60 * 1000, // 5분
    enabled: !!serverId && !!metric,
    select: (data: InfiniteData<PaginatedResponse<MetricHistoryEntry>>) => {
      const allMetrics = data.pages.flatMap((page) => page.data);
      const values = allMetrics.map((m) => m.value);

      return {
        pages: data.pages,
        pageParams: data.pageParams,
        allMetrics,
        stats: {
          count: values.length,
          min: Math.min(...values),
          max: Math.max(...values),
          avg: values.reduce((sum, val) => sum + val, 0) / values.length,
          latest: values[0] || 0,
        },
      };
    },
  });
};

// 🎯 통합 무한 스크롤 관리
export const useInfiniteScrollManager = () => {
  const queryClient = useQueryClient();

  // 📊 모든 무한 쿼리 상태
  const getAllInfiniteQueries = useCallback(() => {
    return queryClient
      .getQueryCache()
      .getAll()
      .filter((query) => query.queryKey[0] === 'infinite')
      .map((query) => ({
        key: query.queryKey,
        status: query.state.status,
        dataUpdatedAt: query.state.dataUpdatedAt,
        isFetching: query.state.fetchStatus === 'fetching',
      }));
  }, [queryClient]);

  // 🔄 특정 타입의 무한 쿼리 새로고침
  const refreshInfiniteQueries = useCallback(
    (type: 'logs' | 'metrics' | 'predictions' | 'alerts') => {
      queryClient.invalidateQueries({
        predicate: (query) =>
          query.queryKey[0] === 'infinite' && query.queryKey[1] === type,
      });
    },
    [queryClient]
  );

  // 🧹 메모리 최적화: 오래된 페이지 제거
  const optimizeMemory = useCallback(() => {
    const infiniteQueries = queryClient
      .getQueryCache()
      .getAll()
      .filter((query) => query.queryKey[0] === 'infinite');

    infiniteQueries.forEach((query) => {
      const data = query.state.data as InfiniteData<unknown>;
      if (data?.pages && data.pages.length > 10) {
        // 처음 5페이지와 마지막 5페이지만 유지
        const optimizedData = {
          ...data,
          pages: [...data.pages.slice(0, 5), ...data.pages.slice(-5)],
          pageParams: [
            ...data.pageParams.slice(0, 5),
            ...data.pageParams.slice(-5),
          ],
        };

        queryClient.setQueryData(query.queryKey, optimizedData);
      }
    });
  }, [queryClient]);

  // ⏰ 자동 메모리 최적화 (10분마다)
  useEffect(() => {
    const interval = setInterval(optimizeMemory, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, []); // optimizeMemory 함수 의존성 제거하여 Vercel Edge Runtime 호환성 확보

  return {
    getAllInfiniteQueries,
    refreshInfiniteQueries,
    optimizeMemory,
  };
};
