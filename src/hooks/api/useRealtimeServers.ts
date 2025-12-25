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

/**
 * 🎯 SSOT 기반 Fallback 서버 목록 (API 실패 시 사용)
 *
 * 한국 데이터센터 기반 15개 서버:
 * - ICN: 인천/서울 (메인 데이터센터)
 * - PUS: 부산 (DR 데이터센터)
 *
 * @see src/mock/mockServerConfig.ts (SSOT)
 */
const mockServers: Server[] = [
  // 웹서버 (Nginx) - 3대
  {
    id: 'web-nginx-icn-01',
    name: '서울 메인 Nginx #1',
    status: 'online',
    hostname: 'web-nginx-icn-01.internal',
    cpu: 30,
    memory: 45,
    disk: 25,
    network: 50,
    uptime: '99.9%',
    location: 'Seoul-ICN-AZ1',
    lastUpdate: new Date(),
  },
  {
    id: 'web-nginx-icn-02',
    name: '서울 Nginx #2 (AZ2)',
    status: 'online',
    hostname: 'web-nginx-icn-02.internal',
    cpu: 35,
    memory: 50,
    disk: 30,
    network: 55,
    uptime: '99.9%',
    location: 'Seoul-ICN-AZ2',
    lastUpdate: new Date(),
  },
  {
    id: 'web-nginx-pus-01',
    name: '부산 DR Nginx',
    status: 'online',
    hostname: 'web-nginx-pus-01.internal',
    cpu: 25,
    memory: 40,
    disk: 28,
    network: 45,
    uptime: '99.9%',
    location: 'Busan-PUS-DR',
    lastUpdate: new Date(),
  },
  // API/WAS 서버 - 3대
  {
    id: 'api-was-icn-01',
    name: '서울 메인 WAS #1',
    status: 'online',
    hostname: 'api-was-icn-01.internal',
    cpu: 45,
    memory: 60,
    disk: 40,
    network: 50,
    uptime: '99.9%',
    location: 'Seoul-ICN-AZ1',
    lastUpdate: new Date(),
  },
  {
    id: 'api-was-icn-02',
    name: '서울 WAS #2 (AZ2)',
    status: 'online',
    hostname: 'api-was-icn-02.internal',
    cpu: 50,
    memory: 70,
    disk: 45,
    network: 55,
    uptime: '99.9%',
    location: 'Seoul-ICN-AZ2',
    lastUpdate: new Date(),
  },
  {
    id: 'api-was-pus-01',
    name: '부산 DR WAS',
    status: 'online',
    hostname: 'api-was-pus-01.internal',
    cpu: 35,
    memory: 55,
    disk: 38,
    network: 40,
    uptime: '99.9%',
    location: 'Busan-PUS-DR',
    lastUpdate: new Date(),
  },
  // 데이터베이스 (MySQL) - 3대
  {
    id: 'db-mysql-icn-primary',
    name: '서울 MySQL Primary',
    status: 'online',
    hostname: 'db-mysql-icn-primary.internal',
    cpu: 50,
    memory: 70,
    disk: 50,
    network: 45,
    uptime: '99.99%',
    location: 'Seoul-ICN-AZ1',
    lastUpdate: new Date(),
  },
  {
    id: 'db-mysql-icn-replica',
    name: '서울 MySQL Replica',
    status: 'online',
    hostname: 'db-mysql-icn-replica.internal',
    cpu: 40,
    memory: 65,
    disk: 48,
    network: 40,
    uptime: '99.99%',
    location: 'Seoul-ICN-AZ2',
    lastUpdate: new Date(),
  },
  {
    id: 'db-mysql-pus-dr',
    name: '부산 MySQL DR',
    status: 'online',
    hostname: 'db-mysql-pus-dr.internal',
    cpu: 25,
    memory: 50,
    disk: 45,
    network: 30,
    uptime: '99.99%',
    location: 'Busan-PUS-DR',
    lastUpdate: new Date(),
  },
  // 캐시 (Redis) - 2대
  {
    id: 'cache-redis-icn-01',
    name: '서울 Redis Master',
    status: 'online',
    hostname: 'cache-redis-icn-01.internal',
    cpu: 35,
    memory: 80,
    disk: 20,
    network: 60,
    uptime: '99.9%',
    location: 'Seoul-ICN-AZ1',
    lastUpdate: new Date(),
  },
  {
    id: 'cache-redis-icn-02',
    name: '서울 Redis Replica',
    status: 'online',
    hostname: 'cache-redis-icn-02.internal',
    cpu: 40,
    memory: 85,
    disk: 25,
    network: 65,
    uptime: '99.9%',
    location: 'Seoul-ICN-AZ2',
    lastUpdate: new Date(),
  },
  // 스토리지 - 2대
  {
    id: 'storage-nfs-icn-01',
    name: '서울 NFS 스토리지',
    status: 'online',
    hostname: 'storage-nfs-icn-01.internal',
    cpu: 20,
    memory: 40,
    disk: 75,
    network: 35,
    uptime: '99.9%',
    location: 'Seoul-ICN-AZ1',
    lastUpdate: new Date(),
  },
  {
    id: 'storage-s3gw-pus-01',
    name: '부산 S3 Gateway',
    status: 'online',
    hostname: 'storage-s3gw-pus-01.internal',
    cpu: 15,
    memory: 35,
    disk: 60,
    network: 40,
    uptime: '99.9%',
    location: 'Busan-PUS-DR',
    lastUpdate: new Date(),
  },
  // 로드밸런서 (HAProxy) - 2대
  {
    id: 'lb-haproxy-icn-01',
    name: '서울 HAProxy LB',
    status: 'online',
    hostname: 'lb-haproxy-icn-01.internal',
    cpu: 30,
    memory: 50,
    disk: 15,
    network: 70,
    uptime: '99.99%',
    location: 'Seoul-ICN-AZ1',
    lastUpdate: new Date(),
  },
  {
    id: 'lb-haproxy-pus-01',
    name: '부산 HAProxy LB',
    status: 'online',
    hostname: 'lb-haproxy-pus-01.internal',
    cpu: 25,
    memory: 45,
    disk: 12,
    network: 65,
    uptime: '99.99%',
    location: 'Busan-PUS-DR',
    lastUpdate: new Date(),
  },
];

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

      // API 응답이 실패했거나 데이터가 없으면 목업 데이터 반환
      console.warn('🔄 API 응답 실패, 목업 데이터 사용');
      return mockServers;
    } catch (fetchError) {
      console.warn('🚨 API 배칭 실패, 목업 데이터 사용:', fetchError);

      // 목업 데이터에 랜덤 업데이트 적용
      return mockServers.map((server) => {
        if (!server.metrics) {
          return server;
        }

        const updatedCpuUsage = Math.max(
          0,
          Math.min(100, server.metrics.cpu.usage + (Math.random() - 0.5) * 10)
        );
        const updatedMemoryUsage = Math.max(
          0,
          Math.min(
            100,
            server.metrics.memory.usage + (Math.random() - 0.5) * 10
          )
        );
        const updatedDiskUsage = Math.max(
          0,
          Math.min(100, server.metrics.disk.usage + (Math.random() - 0.5) * 5)
        );
        const updatedNetworkIn = Math.max(
          0,
          server.metrics.network.bytesIn + Math.random() * 100000
        );
        const updatedNetworkOut = Math.max(
          0,
          server.metrics.network.bytesOut + Math.random() * 50000
        );

        return {
          ...server,
          cpu: updatedCpuUsage,
          memory: updatedMemoryUsage,
          disk: updatedDiskUsage,
          metrics: {
            ...server.metrics,
            cpu: {
              ...server.metrics.cpu,
              usage: updatedCpuUsage,
            },
            memory: {
              ...server.metrics.memory,
              usage: updatedMemoryUsage,
            },
            disk: {
              ...server.metrics.disk,
              usage: updatedDiskUsage,
            },
            network: {
              ...server.metrics.network,
              bytesIn: updatedNetworkIn,
              bytesOut: updatedNetworkOut,
            },
            timestamp: new Date().toISOString(),
          },
          lastUpdate: new Date(),
        };
      });
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
