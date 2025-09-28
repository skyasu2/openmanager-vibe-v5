/**
 * 🔄 공통 데이터 로딩 훅
 *
 * - 모든 패널의 데이터 로딩 로직 통합
 * - 자동 새로고침 및 에러 처리
 * - 로딩 상태 관리
 */

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export interface DataLoaderOptions<T> {
  // 데이터 로더 함수
  loadData: () => Promise<T>;

  // 자동 새로고침 간격 (ms)
  refreshInterval?: number;

  // 초기 로드 여부
  autoLoad?: boolean;

  // 에러 처리 함수
  onError?: (error: Error) => void;

  // 성공 처리 함수
  onSuccess?: (data: T) => void;
}

export interface DataLoaderResult<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
  reload: () => Promise<void>;
  lastUpdated: Date | null;
}

export function useDataLoader<T>({
  loadData,
  refreshInterval,
  autoLoad = true,
  onError,
  onSuccess,
}: DataLoaderOptions<T>): DataLoaderResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const reload = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await loadData();

      setData(result);
      setLastUpdated(new Date());
      onSuccess?.(result);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('데이터 로드 실패');
      setError(error);
      onError?.(error);
      console.error('데이터 로딩 오류:', error);
    } finally {
      setIsLoading(false);
    }
  }, [loadData, onError, onSuccess]);

  useEffect(() => {
    if (autoLoad) {
      reload();
    }
  }, [autoLoad, reload]);

  useEffect(() => {
    if (refreshInterval && refreshInterval > 0) {
      intervalRef.current = setInterval(reload, refreshInterval);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
    return undefined;
  }, [refreshInterval, reload]);

  // 컴포넌트 언마운트 시 인터벌 정리
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    data,
    isLoading,
    error,
    reload,
    lastUpdated,
  };
}

// 특정 타입별 데이터 로더들
export const useMockDataLoader = <T,>(
  mockDataGenerator: () => T,
  delay: number = 1000,
  refreshInterval?: number
): DataLoaderResult<T> => {
  return useDataLoader({
    loadData: async () => {
      await new Promise((resolve) => setTimeout(resolve, delay));
      return mockDataGenerator();
    },
    refreshInterval,
    onError: (error) => console.error('Mock data loading error:', error),
  });
};
