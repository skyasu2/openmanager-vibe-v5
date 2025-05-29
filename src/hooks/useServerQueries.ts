import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys, api } from '@/lib/react-query';

/**
 * 서버 목록 조회 훅
 * 
 * @description
 * 서버 목록을 React Query로 관리합니다.
 * 캐싱, 자동 새로고침, 에러 처리를 제공합니다.
 */
export function useServers(filters?: { status?: string; search?: string }) {
  return useQuery({
    queryKey: queryKeys.serverList(filters),
    queryFn: () => api.servers.getList(),
    staleTime: 1000 * 60 * 2, // 2분 - 서버 데이터는 자주 변할 수 있음
    refetchInterval: 10000, // 10초마다 자동 새로고침
    select: (data) => {
      // 응답 데이터를 변환
      if (data?.success && data?.data?.servers) {
        let servers = data.data.servers;
        
        // 필터링 적용
        if (filters?.status && filters.status !== 'all') {
          servers = servers.filter((server: any) => server.status === filters.status);
        }
        
        if (filters?.search) {
          const searchLower = filters.search.toLowerCase();
          servers = servers.filter((server: any) => 
            server.name?.toLowerCase().includes(searchLower) ||
            server.hostname?.toLowerCase().includes(searchLower)
          );
        }
        
        // 표준 형식으로 변환
        return servers.map((server: any) => ({
          id: server.id,
          name: server.hostname || server.name,
          status: server.status === 'healthy' ? 'healthy' : 
                  server.status === 'warning' ? 'warning' : 'critical',
          location: server.environment || 'Unknown',
          type: server.role?.toUpperCase() || 'UNKNOWN',
          metrics: {
            cpu: server.cpu_usage || 0,
            memory: server.memory_usage || 0,
            disk: server.disk_usage || 0,
            network: server.response_time || 0
          },
          uptime: Math.floor((server.uptime || 0) / 86400000),
          lastUpdate: new Date(server.last_updated || Date.now())
        }));
      }
      
      return [];
    },
    meta: {
      errorMessage: '서버 목록을 불러오는 데 실패했습니다.',
    },
  });
}

/**
 * 서버 상세 정보 조회 훅
 */
export function useServerDetail(serverId: string) {
  return useQuery({
    queryKey: queryKeys.serverDetail(serverId),
    queryFn: () => api.servers.getDetail(serverId),
    enabled: !!serverId, // serverId가 있을 때만 실행
    staleTime: 1000 * 60 * 1, // 1분
    refetchInterval: 5000, // 5초마다 새로고침
    meta: {
      errorMessage: '서버 상세 정보를 불러오는 데 실패했습니다.',
    },
  });
}

/**
 * 서버 목록 새로고침 mutation
 */
export function useRefreshServers() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      // 서버 목록 캐시 무효화
      await queryClient.invalidateQueries({ queryKey: queryKeys.servers });
      // 새로운 데이터 가져오기
      return api.servers.getList();
    },
    onSuccess: () => {
      console.log('✅ 서버 목록 새로고침 완료');
    },
    onError: (error) => {
      console.error('❌ 서버 목록 새로고침 실패:', error);
    },
  });
}

/**
 * 서버 목록 통계 계산 훅
 */
export function useServerStats(filters?: { status?: string; search?: string }) {
  const { data: servers = [], isLoading, error } = useServers(filters);
  
  const stats = {
    total: servers.length,
    online: servers.filter((s: any) => s.status === 'healthy').length,
    warning: servers.filter((s: any) => s.status === 'warning').length,
    offline: servers.filter((s: any) => s.status === 'critical').length,
  };
  
  return {
    stats,
    servers,
    isLoading,
    error,
  };
}

/**
 * 서버 데이터 프리페치 훅
 * 
 * @description
 * 서버 상세 페이지로 이동하기 전에 미리 데이터를 로드합니다.
 */
export function usePrefetchServer() {
  const queryClient = useQueryClient();
  
  const prefetchServer = (serverId: string) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.serverDetail(serverId),
      queryFn: () => api.servers.getDetail(serverId),
      staleTime: 1000 * 60 * 5, // 5분간 신선함 유지
    });
  };
  
  return { prefetchServer };
} 