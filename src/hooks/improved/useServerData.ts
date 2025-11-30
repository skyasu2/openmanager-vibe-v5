import { useCallback, useEffect, useRef, useState } from 'react';

interface ServerData {
  id: string;
  name: string;
  status: 'normal' | 'warning' | 'critical';
  cpu: number;
  memory: number;
  lastUpdated: string;
}

interface UseServerDataState {
  data: ServerData | null;
  loading: boolean;
  error: Error | null;
  lastUpdated: Date | null;
  connectionStatus: 'connected' | 'reconnecting' | 'offline';
}

interface UseServerDataOptions {
  enabled?: boolean;
  pollingInterval?: number;
  retryCount?: number;
  cacheTime?: number;
}

// 글로벌 캐시 (여러 컴포넌트 간 공유)
type CacheEntry = {
  data: ServerData;
  timestamp: number;
  subscribers: Set<() => void>;
};

const serverDataCache = new Map<string, CacheEntry>();

// 진행 중인 요청 중복 제거
const ongoingRequests = new Map<string, Promise<ServerData>>();

const DEFAULT_OPTIONS: Required<UseServerDataOptions> = {
  enabled: true,
  pollingInterval: 3000,
  retryCount: 3,
  cacheTime: 30000, // 30초
};

/**
 * 서버 데이터를 실시간으로 가져오는 Hook
 * 메모리 누수 방지, 성능 최적화, UX 개선이 적용된 버전
 */
export const useServerData = (
  serverId: string,
  options: UseServerDataOptions = {}
): UseServerDataState & {
  refetch: () => Promise<void>;
  invalidateCache: () => void;
} => {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  const [state, setState] = useState<UseServerDataState>({
    data: null,
    loading: true,
    error: null,
    lastUpdated: null,
    connectionStatus: 'connected',
  });

  // 언마운트 상태 추적 (메모리 누수 방지)
  const isMountedRef = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 현재 재시도 횟수
  const retryCountRef = useRef(0);

  // 안전한 setState (언마운트 후 호출 방지)
  const safeSetState = useCallback((updater: Partial<UseServerDataState>) => {
    if (isMountedRef.current) {
      setState((prev) => ({ ...prev, ...updater }));
    }
  }, []);

  // 캐시에서 데이터 가져오기
  const getCachedData = useCallback(
    (id: string): ServerData | null => {
      const cached = serverDataCache.get(id);
      if (cached && Date.now() - cached.timestamp < opts.cacheTime) {
        return cached.data;
      }
      return null;
    },
    [opts.cacheTime]
  );

  // 캐시 업데이트 및 구독자 알림
  const updateCache = useCallback((id: string, data: ServerData) => {
    const cached = serverDataCache.get(id);
    const newCached = {
      data,
      timestamp: Date.now(),
      subscribers: cached?.subscribers || new Set(),
    };

    serverDataCache.set(id, newCached);

    // 구독자들에게 업데이트 알림
    newCached.subscribers.forEach((callback) => {
      try {
        callback();
      } catch (error) {
        console.error('Cache subscriber callback error:', error);
      }
    });
  }, []);

  // 적응형 polling 간격 계산
  const getAdaptiveInterval = useCallback(
    (data: ServerData | null): number => {
      if (!data) return opts.pollingInterval;

      switch (data.status) {
        case 'critical':
          return Math.min(opts.pollingInterval * 0.3, 500);
        case 'warning':
          return Math.min(opts.pollingInterval * 0.7, 2000);
        case 'normal':
          return Math.max(opts.pollingInterval * 1.5, 5000);
        default:
          return opts.pollingInterval;
      }
    },
    [opts.pollingInterval]
  );

  // 서버 데이터 페치 함수
  const fetchServerData = useCallback(
    async (id: string, signal?: AbortSignal): Promise<ServerData> => {
      // 진행 중인 요청이 있다면 재사용
      const existingRequest = ongoingRequests.get(id);
      if (existingRequest !== undefined) {
        return existingRequest;
      }

      const fetchPromise = (async (): Promise<ServerData> => {
        try {
          const response = await fetch(`/api/servers/${id}`, {
            signal,
            headers: {
              'Cache-Control': 'no-cache',
              'Content-Type': 'application/json',
            },
          });

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const data = await response.json();

          // 데이터 검증
          if (!data || typeof data !== 'object' || !data.id) {
            throw new Error('Invalid server data received');
          }

          return data as ServerData;
        } catch (error) {
          if (signal?.aborted) {
            throw new Error('Request aborted');
          }
          throw error;
        }
      })();

      ongoingRequests.set(id, fetchPromise);

      try {
        const result = await fetchPromise;
        updateCache(id, result);
        return result;
      } finally {
        ongoingRequests.delete(id);
      }
    },
    [updateCache]
  );

  // 데이터 새로고침
  const refetch = useCallback(async (): Promise<void> => {
    if (!opts.enabled || !isMountedRef.current) return;

    // 이전 요청 취소
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    safeSetState({ loading: true, error: null });

    try {
      const data = await fetchServerData(
        serverId,
        abortControllerRef.current.signal
      );

      safeSetState({
        data,
        loading: false,
        error: null,
        lastUpdated: new Date(),
        connectionStatus: 'connected',
      });

      retryCountRef.current = 0; // 성공 시 재시도 카운트 리셋
    } catch (error) {
      if (!abortControllerRef.current?.signal.aborted && isMountedRef.current) {
        const errorObj =
          error instanceof Error ? error : new Error('Unknown error');

        // 재시도 로직
        if (retryCountRef.current < opts.retryCount) {
          retryCountRef.current++;
          safeSetState({
            connectionStatus: 'reconnecting',
            error: errorObj,
          });

          // 지수 백오프로 재시도
          const retryDelay = Math.min(
            1000 * 2 ** (retryCountRef.current - 1),
            10000
          );
          retryTimeoutRef.current = setTimeout(() => {
            void refetch();
          }, retryDelay);
        } else {
          safeSetState({
            loading: false,
            error: errorObj,
            connectionStatus: 'offline',
          });
        }
      }
    }
  }, [serverId, opts.enabled, opts.retryCount, safeSetState, fetchServerData]);

  // 캐시 무효화
  const invalidateCache = useCallback(() => {
    serverDataCache.delete(serverId);
    void refetch();
  }, [serverId, refetch]);

  // 초기 데이터 로드 및 polling 설정
  useEffect(() => {
    if (!opts.enabled) return;

    // 캐시된 데이터가 있으면 먼저 표시
    const cachedData = getCachedData(serverId);
    if (cachedData) {
      safeSetState({
        data: cachedData,
        loading: false,
        lastUpdated: new Date(),
        connectionStatus: 'connected',
      });
    }

    // 캐시 구독 설정
    const cached = serverDataCache.get(serverId);
    const onCacheUpdate = () => {
      const updatedData = getCachedData(serverId);
      if (updatedData && isMountedRef.current) {
        safeSetState({
          data: updatedData,
          lastUpdated: new Date(),
        });
      }
    };

    if (cached) {
      cached.subscribers.add(onCacheUpdate);
    }

    // 초기 데이터 로드
    void refetch();

    // adaptive polling 설정
    const setupPolling = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      const currentInterval = getAdaptiveInterval(state.data);
      intervalRef.current = setInterval(() => {
        if (isMountedRef.current && opts.enabled && !document.hidden) {
          void refetch();
        }
      }, currentInterval);
    };

    setupPolling();

    // 탭 가시성 변경 감지
    const handleVisibilityChange = () => {
      if (!document.hidden && isMountedRef.current) {
        void refetch(); // 탭 활성화 시 즉시 새로고침
        setupPolling(); // polling 재설정
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // 정리 함수
    return () => {
      if (cached) {
        cached.subscribers.delete(onCacheUpdate);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [
    serverId,
    opts.enabled,
    getCachedData,
    safeSetState,
    refetch,
    getAdaptiveInterval,
    state.data,
  ]);

  // 언마운트 시 정리
  useEffect(() => {
    return () => {
      isMountedRef.current = false;

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  return {
    ...state,
    refetch,
    invalidateCache,
  };
};

// 캐시 관리 유틸리티
export const ServerDataCacheManager = {
  clear: () => serverDataCache.clear(),

  clearExpired: (maxAge = 300000) => {
    // 5분
    const now = Date.now();
    for (const [key, value] of serverDataCache.entries()) {
      if (now - value.timestamp > maxAge) {
        serverDataCache.delete(key);
      }
    }
  },

  getStats: () => ({
    size: serverDataCache.size,
    keys: Array.from(serverDataCache.keys()),
  }),

  preload: async (serverIds: string[]) => {
    const promises = serverIds.map(async (id) => {
      try {
        const response = await fetch(`/api/servers/${id}`);
        const data = await response.json();
        serverDataCache.set(id, {
          data,
          timestamp: Date.now(),
          subscribers: new Set(),
        });
      } catch (error) {
        console.error(`Failed to preload server ${id}:`, error);
      }
    });

    await Promise.allSettled(promises);
  },
};
