import { useState, useEffect, useCallback, useRef } from 'react';
import { ServerData } from '@/types/server';

interface UseRealtimeServersOptions {
    refreshInterval?: number;
    maxRetries?: number;
    enableAutoRefresh?: boolean;
}

interface UseRealtimeServersReturn {
    servers: ServerData[];
    loading: boolean;
    error: string | null;
    lastUpdated: Date | null;
    refreshServers: () => Promise<void>;
    getServerById: (id: string) => ServerData | undefined;
    isConnected: boolean;
    retryCount: number;
}

/**
 * 실시간 서버 데이터 관리 훅
 * 
 * @param options 설정 옵션
 * @returns 서버 데이터와 관련 상태/함수들
 */
export function useRealtimeServers(
    options: UseRealtimeServersOptions = {}
): UseRealtimeServersReturn {
    const {
        refreshInterval = 5000, // 5초마다 갱신
        maxRetries = 3,
        enableAutoRefresh = true
    } = options;

    const [servers, setServers] = useState<ServerData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [retryCount, setRetryCount] = useState(0);

    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);

    // 서버 데이터 가져오기
    const fetchServers = useCallback(async (isRetry = false) => {
        try {
            // 이전 요청 취소
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }

            abortControllerRef.current = new AbortController();

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
                return; // 요청이 취소된 경우 무시
            }

            const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류';
            console.error('서버 데이터 조회 오류:', errorMessage);

            setError(errorMessage);
            setIsConnected(false);

            // 재시도 로직
            if (retryCount < maxRetries) {
                setRetryCount(prev => prev + 1);
                setTimeout(() => {
                    fetchServers(true);
                }, Math.pow(2, retryCount) * 1000); // 지수 백오프
            }

        } finally {
            setLoading(false);
        }
    }, [maxRetries, retryCount]);

    // 수동 새로고침
    const refreshServers = useCallback(async () => {
        setRetryCount(0);
        await fetchServers();
    }, [fetchServers]);

    // ID로 서버 찾기
    const getServerById = useCallback((id: string): ServerData | undefined => {
        return servers.find(server => server.id === id);
    }, [servers]);

    // 자동 새로고침 설정
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
    }, [enableAutoRefresh, refreshInterval, fetchServers]);

    // 초기 데이터 로드
    useEffect(() => {
        fetchServers();

        return () => {
            // 컴포넌트 언마운트 시 정리
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
        retryCount
    };
} 