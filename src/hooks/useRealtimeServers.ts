import { useState, useEffect, useCallback, useRef } from 'react';
import { Server } from '@/types/server';

interface UseRealtimeServersOptions {
  refreshInterval?: number;
  maxRetries?: number;
  enableAutoRefresh?: boolean;
}

interface UseRealtimeServersReturn {
  servers: Server[];
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  refreshServers: () => Promise<void>;
  getServerById: (id: string) => Server | undefined;
  isConnected: boolean;
  retryCount: number;
}

export function useRealtimeServers(
  options: UseRealtimeServersOptions = {}
): UseRealtimeServersReturn {
  // 기본 새로고침 주기: 20초 (서버 데이터생성기와 동기화)
  const {
    refreshInterval = 20_000,
    maxRetries = 3,
    enableAutoRefresh = true,
  } = options;

  const [servers, setServers] = useState<Server[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchServers = useCallback(
    async (isRetry = false) => {
      try {
        // 중복 요청 방지
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
        abortControllerRef.current = new AbortController();

        // 첫 시도일 때만 로딩 표시
        if (!isRetry) {
          setLoading(true);
        }
        setError(null);

        const response = await fetch('/api/servers/realtime', {
          signal: abortControllerRef.current.signal,
          headers: {
            'Cache-Control': 'no-cache',
          },
        });

        if (!response.ok) {
          throw new Error(`서버 데이터 조회 실패: ${response.status}`);
        }

        const data = await response.json();
        if (data.success && Array.isArray(data.servers)) {
          setServers(data.servers);
          setLastUpdated(new Date());
          setIsConnected(true);
          setRetryCount(0);
        } else {
          throw new Error(data.error || '서버 데이터 형식 오류');
        }
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          return; // 요청 중단 시 재시도하지 않음
        }
        const errorMessage =
          err instanceof Error ? err.message : '알 수 없는 오류';
        console.error('서버 데이터 조회 오류:', errorMessage);

        setError(errorMessage);
        setIsConnected(false);

        // 지수 백오프 재시도
        if (retryCount < maxRetries) {
          setRetryCount(prev => prev + 1);
          setTimeout(
            () => {
              fetchServers(true);
            },
            Math.pow(2, retryCount) * 1000
          );
        }
      } finally {
        setLoading(false);
      }
    },
    [maxRetries, retryCount]
  );

  const refreshServers = useCallback(async () => {
    setRetryCount(0);
    await fetchServers();
  }, [fetchServers]);

  const getServerById = useCallback(
    (id: string): Server | undefined => {
      return servers.find(server => server.id === id);
    },
    [servers]
  );

  // 주기적 자동 새로고침
  useEffect(() => {
    if (enableAutoRefresh && refreshInterval > 0) {
      intervalRef.current = setInterval(() => {
        fetchServers(true);
      }, refreshInterval);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }

    return undefined;
  }, [enableAutoRefresh, refreshInterval, fetchServers]);

  // 초기 데이터 로드 및 클린업
  useEffect(() => {
    fetchServers();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    servers,
    loading,
    error,
    lastUpdated,
    refreshServers,
    getServerById,
    isConnected,
    retryCount,
  };
}
