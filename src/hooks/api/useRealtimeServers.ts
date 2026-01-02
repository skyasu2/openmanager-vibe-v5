/**
 * 🚀 Vercel 최적화 실시간 서버 데이터 관리 훅
 *
 * Vercel 무료 티어 최적화:
 * - API 배칭으로 동시 요청 수 최소화
 * - 메모리 효율적 상태 관리
 * - Edge Runtime 호환성
 * - 콜드 스타트 지연 최소화
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'react-hot-toast';
import type { APIRequest } from '@/lib/api/api-batcher';
import { getAPIBatcher } from '@/lib/api/api-batcher';
// 🎯 SSOT: 중앙집중식 서버 설정에서 Fallback 데이터 import
import { getFallbackServers } from '@/mock/mockServerConfig';
import type { Server } from '@/types/server';

// 타입 정의
interface UseRealtimeServersOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
  enableToast?: boolean;
}

interface UseRealtimeServersReturn {
  servers: Server[];
  isLoading: boolean;
  error: string | null;
  lastUpdate: Date | null;
  refreshServers: () => Promise<void>;
  clearError: () => void;
}

// 타입 안전 상태 매핑 함수
const mapStatus = (
  rawStatus: string | undefined
): 'online' | 'warning' | 'offline' => {
  if (!rawStatus) return 'offline';

  const s = rawStatus.toLowerCase();
  if (s === 'online' || s === 'running' || s === 'healthy') return 'online';
  if (s === 'warning' || s === 'degraded' || s === 'unhealthy')
    return 'warning';
  return 'offline';
};

export function useRealtimeServers(
  options: UseRealtimeServersOptions = {}
): UseRealtimeServersReturn {
  const {
    autoRefresh = true,
    refreshInterval = 30000,
    enableToast = true,
  } = options;

  const [servers, setServers] = useState<Server[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);

  // Vercel 최적화 서버 데이터 패치 함수
  const fetchServers = useCallback(async (): Promise<Server[]> => {
    const batcher = getAPIBatcher();

    try {
      // API 배칭을 통한 최적화된 요청
      // 🎯 servers-unified API 사용 (인증 불필요, GuestMode 지원)
      const batchedRequests: APIRequest[] = [
        {
          id: 'servers-unified',
          endpoint: '/api/servers-unified?limit=50',
          priority: 'high', // 서버 목록은 고우선순위
          options: {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Cache-Control': 'no-cache',
            },
          },
        },
        {
          id: 'servers-status',
          endpoint: '/api/system/status',
          priority: 'normal',
          options: {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          },
        },
      ];

      // 배칭된 요청 실행
      const [serversResponse, statusResponse] = await Promise.all([
        batchedRequests[0]
          ? batcher.request(batchedRequests[0])
          : Promise.resolve({
              id: 'servers-all',
              data: null,
              status: 400,
              timing: { queued: 0, executed: Date.now(), duration: 0 },
            }),
        batchedRequests[1]
          ? batcher.request(batchedRequests[1])
          : Promise.resolve({
              id: 'servers-status',
              data: null,
              status: 400,
              timing: { queued: 0, executed: Date.now(), duration: 0 },
            }),
      ]);

      // 서버 데이터 처리
      if (serversResponse.status === 200 && serversResponse.data) {
        const responseData = serversResponse.data as Record<string, unknown>;

        // 🎯 servers-unified API 응답 구조 처리
        // 새 API: { success: true, data: [...servers...] }
        // 구 API: { servers: [...] }
        const serversArray = responseData?.data ?? responseData?.servers;

        // 데이터 구조 검증 및 변환
        if (serversArray && Array.isArray(serversArray)) {
          const transformedServers = (
            serversArray as Array<{ status?: string; [key: string]: unknown }>
          ).map((s: { status?: string; [key: string]: unknown }) => {
            if (typeof s === 'object' && s !== null) {
              return {
                ...s,
                status: mapStatus(s.status),
                lastUpdate: new Date(), // 실시간 타임스탬프
              };
            }
            return s;
          });

          // 시스템 상태 정보와 결합 (선택적)
          if (statusResponse.status === 200 && statusResponse.data) {
            console.log('🔄 시스템 상태 동기화:', statusResponse.data);
          }

          return transformedServers as Server[];
        }
      }

      // API 응답이 실패했거나 데이터가 없으면 SSOT 기반 Fallback 데이터 반환
      console.warn('🔄 API 응답 실패, SSOT Fallback 데이터 사용');
      return getFallbackServers();
    } catch (fetchError) {
      console.warn('🚨 API 배칭 실패, SSOT Fallback 데이터 사용:', fetchError);

      // 🎯 SSOT 기반 Fallback 데이터 반환 (이미 랜덤 값 포함)
      return getFallbackServers();
    }
  }, []);

  // 서버 목록 새로고침
  const refreshServers = useCallback(async () => {
    if (!mountedRef.current) return;

    setIsLoading(true);
    setError(null);

    try {
      const serverData = await fetchServers();

      if (mountedRef.current) {
        setServers(serverData);
        setLastUpdate(new Date());

        if (enableToast) {
          const onlineCount = serverData.filter(
            (s) => s.status === 'online'
          ).length;
          const totalCount = serverData.length;
          toast.success(
            `서버 목록 업데이트 완료 (${onlineCount}/${totalCount} 온라인)`
          );
        }
      }
    } catch (err) {
      if (mountedRef.current) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : '알 수 없는 오류가 발생했습니다.';
        setError(errorMessage);

        if (enableToast) {
          toast.error(`서버 데이터 로딩 실패: ${errorMessage}`);
        }
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [fetchServers, enableToast]);

  // 에러 클리어
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // 자동 새로고침 설정
  useEffect(() => {
    if (autoRefresh && refreshInterval > 0) {
      intervalRef.current = setInterval(() => {
        void refreshServers();
      }, refreshInterval);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [autoRefresh, refreshInterval, refreshServers]); // refreshServers 함수 의존성 복구

  // 초기 데이터 로드
  useEffect(() => {
    void refreshServers();
  }, [refreshServers]); // refreshServers 함수 의존성 복구

  // Vercel 최적화: 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      // API 배처 정리 (메모리 누수 방지)
      // 전역 배처는 정리하지 않고, 개별 요청만 취소
      // getAPIBatcher().cleanup(); // 전역이므로 정리하지 않음
    };
  }, []);

  return {
    servers,
    isLoading,
    error,
    lastUpdate,
    refreshServers,
    clearError,
  };
}
