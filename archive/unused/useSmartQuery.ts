'use client';

import { useState, useEffect, useCallback } from 'react';
import { smartCache, CacheOptions } from '../utils/smart-cache';

/**
 * 🎣 React Hook for Smart Cache
 * 
 * 클라이언트 환경에서만 사용 가능한 스마트 캐시 훅
 */
export function useSmartQuery<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: CacheOptions = {}
) {
  const [data, setData] = useState<T | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | undefined>(undefined);

  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      if (!mounted) return;
      
      setIsLoading(true);
      setError(undefined);

      try {
        const result = await smartCache.query(key, fetcher, options);
        if (mounted) {
          setData(result);
        }
      } catch (err) {
        if (mounted) {
          setError(err as Error);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    fetchData();

    // 구독 설정
    const unsubscribe = smartCache.subscribe(key, (newData: T) => {
      if (mounted) {
        setData(newData);
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [key, fetcher, options]);

  const mutate = useCallback(async (newData?: T) => {
    if (newData) {
      setData(newData);
    }
    await smartCache.invalidateQueries(key);
  }, [key]);

  return {
    data,
    isLoading,
    error,
    mutate
  };
} 