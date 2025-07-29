/**
 * 🚀 Cached Servers Hook
 *
 * 캐시된 서버 데이터를 효율적으로 사용하는 React 훅
 * - 자동 페이지네이션
 * - 실시간 업데이트 구독
 * - 필터링 및 정렬 지원
 * - 성능 최적화
 */

import { ACTIVE_SERVER_CONFIG } from '@/config/serverConfig';
import type { ServerInstance } from '@/types/data-generator';
import { useCallback, useEffect, useRef, useState } from 'react';

interface CachedServerData {
  servers: ServerInstance[];
  summary: {
    total: number;
    online: number;
    warning: number;
    offline: number;
    avgCpu: number;
    avgMemory: number;
  };
  pagination: {
    page: number;
    pageSize: number;
    totalPages: number;
    totalItems: number;
  };
  filters?: {
    status?: string;
    search?: string;
    location?: string;
    sortBy?: string;
  };
  cache: {
    version: number;
    lastUpdated: number;
    isUpdating: boolean;
    paginatedCacheSize?: number;
  };
}

interface UseCachedServersOptions {
  page?: number;
  pageSize?: number;
  status?: string;
  search?: string;
  location?: string;
  sortBy?: string;
  includeAll?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface UseCachedServersReturn {
  // 데이터
  servers: ServerInstance[];
  summary: CachedServerData['summary'];
  pagination: CachedServerData['pagination'];

  // 상태
  isLoading: boolean;
  isError: boolean;
  error: string | null;
  isUpdating: boolean;

  // 캐시 정보
  cacheVersion: number;
  lastUpdated: number;

  // 액션
  refresh: () => Promise<void>;
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  setFilters: (filters: Partial<UseCachedServersOptions>) => void;

  // 유틸리티
  hasNextPage: boolean;
  hasPrevPage: boolean;
  totalServers: number;
}

export function useCachedServers(
  options: UseCachedServersOptions = {}
): UseCachedServersReturn {
  const {
    page: _initialPage = 1,
    pageSize: _initialPageSize = ACTIVE_SERVER_CONFIG.pagination
      .defaultPageSize,
    status = 'all',
    search = '',
    location = 'all',
    sortBy = 'priority',
    includeAll = false,
    autoRefresh = true,
    refreshInterval = ACTIVE_SERVER_CONFIG.cache.updateInterval,
  } = options;

  // 상태 관리
  const [data, setData] = useState<CachedServerData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 필터 상태
  const [currentPage, setCurrentPage] = useState(_initialPage);
  const [currentPageSize, setCurrentPageSize] = useState(_initialPageSize);
  const [currentFilters, setCurrentFilters] = useState({
    status,
    search,
    location,
    sortBy,
  });

  // 자동 새로고침 관리
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * 🔄 서버 데이터 가져오기
   */
  const fetchData = useCallback(
    async (showLoading = true): Promise<void> => {
      try {
        // 이전 요청 취소
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }

        abortControllerRef.current = new AbortController();

        if (showLoading) {
          setIsLoading(true);
        }
        setIsError(false);
        setError(null);

        // API 요청 URL 구성
        const params = new URLSearchParams({
          page: currentPage.toString(),
          pageSize: currentPageSize.toString(),
          status: currentFilters.status,
          search: currentFilters.search,
          location: currentFilters.location,
          sortBy: currentFilters.sortBy,
          includeAll: includeAll.toString(),
        });

        const response = await fetch(`/api/servers/cached?${params}`, {
          signal: abortControllerRef.current.signal,
          headers: {
            'Cache-Control': 'no-cache',
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || `HTTP ${response.status}`);
        }

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.message || 'API 요청 실패');
        }

        setData(result.data);
        console.log(
          `✅ 캐시된 서버 데이터 로드: ${result.data.servers.length}개 서버 (v${result.data.cache.version})`
        );
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          console.log('🚫 요청이 취소되었습니다.');
          return; // Explicit return
        }

        console.error('❌ 캐시된 서버 데이터 로드 실패:', error);
        setIsError(true);
        setError(error instanceof Error ? error.message : '알 수 없는 오류');
      } finally {
        setIsLoading(false);
      }
    },
    [currentPage, currentPageSize, currentFilters, includeAll]
  );

  /**
   * 🔄 수동 새로고침
   */
  const refresh = useCallback(async () => {
    console.log('🔄 수동 새로고침 요청');

    try {
      // 캐시 새로고침 API 호출
      const response = await fetch('/api/servers/cached?action=refresh', {
        method: 'POST',
      });

      if (response.ok) {
        // 새로고침 후 데이터 다시 가져오기
        await fetchData(false);
      }
    } catch (error) {
      console.error('❌ 수동 새로고침 실패:', error);
    }
  }, [fetchData]);

  /**
   * 📄 페이지 변경
   */
  const setPage = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  /**
   * 📏 페이지 크기 변경
   */
  const setPageSize = useCallback((pageSize: number) => {
    setCurrentPageSize(pageSize);
    setCurrentPage(1); // 페이지 크기 변경 시 첫 페이지로 이동
  }, []);

  /**
   * 🔍 필터 변경
   */
  const setFilters = useCallback(
    (filters: Partial<UseCachedServersOptions>) => {
      setCurrentFilters(prev => ({
        ...prev,
        status: filters.status ?? prev.status,
        search: filters.search ?? prev.search,
        location: filters.location ?? prev.location,
        sortBy: filters.sortBy ?? prev.sortBy,
      }));
      setCurrentPage(1); // 필터 변경 시 첫 페이지로 이동
    },
    []
  );

  /**
   * 🔄 자동 새로고침 설정
   */
  useEffect(() => {
    if (autoRefresh && refreshInterval > 0) {
      refreshIntervalRef.current = setInterval(() => {
        fetchData(false); // 백그라운드 업데이트는 로딩 표시 안함
      }, refreshInterval);

      return () => {
        if (refreshIntervalRef.current) {
          clearInterval(refreshIntervalRef.current);
        }
      };
    }
    return undefined;
  }, [autoRefresh, refreshInterval, fetchData]);

  /**
   * 📊 초기 데이터 로드 및 의존성 변경 시 업데이트
   */
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /**
   * 🧹 컴포넌트 언마운트 시 정리
   */
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, []);

  // 계산된 값들
  const servers = data?.servers || [];
  const summary = data?.summary || {
    total: 0,
    online: 0,
    warning: 0,
    offline: 0,
    avgCpu: 0,
    avgMemory: 0,
  };
  const pagination = data?.pagination || {
    page: 1,
    pageSize: 8,
    totalPages: 1,
    totalItems: 0,
  };

  const hasNextPage = pagination.page < pagination.totalPages;
  const hasPrevPage = pagination.page > 1;
  const totalServers = summary.total;
  const isUpdating = data?.cache.isUpdating || false;
  const cacheVersion = data?.cache.version || 0;
  const lastUpdated = data?.cache.lastUpdated || 0;

  return {
    // 데이터
    servers,
    summary,
    pagination,

    // 상태
    isLoading,
    isError,
    error,
    isUpdating,

    // 캐시 정보
    cacheVersion,
    lastUpdated,

    // 액션
    refresh,
    setPage,
    setPageSize,
    setFilters,

    // 유틸리티
    hasNextPage,
    hasPrevPage,
    totalServers,
  };
}
