/**
 * 🚀 Server State Management with React Query v5
 * 
 * 실제 API 연동을 위한 고급 React Query 패턴
 * - 자동 폴링 및 백그라운드 업데이트
 * - 지능형 에러 처리 및 재시도 로직
 * - Optimistic Updates 지원
 * - 실시간 WebSocket 통합 준비
 */

import { 
  useQuery, 
  useMutation, 
  useQueryClient,
  useInfiniteQuery,
  keepPreviousData
} from '@tanstack/react-query';
import { toast } from 'react-hot-toast';

// 🎯 타입 정의
export interface Server {
  id: string;
  name: string;
  status: 'online' | 'offline' | 'warning';
  cpu: number;
  memory: number;
  disk: number;
  uptime: number;
  lastUpdate: string;
  location?: string;
  type?: 'web' | 'database' | 'api' | 'cache';
  metrics?: {
    requests_per_second?: number;
    response_time?: number;
    error_rate?: number;
  };
}

export interface ServerDetail extends Server {
  processes: Array<{
    pid: number;
    name: string;
    cpu: number;
    memory: number;
  }>;
  logs: Array<{
    timestamp: string;
    level: 'info' | 'warning' | 'error';
    message: string;
  }>;
  network: {
    incoming: number;
    outgoing: number;
  };
}

export interface ServerMetrics {
  serverId: string;
  timestamp: string;
  cpu: number;
  memory: number;
  disk: number;
  network: {
    incoming: number;
    outgoing: number;
  };
}

// 🔧 API 함수들
const fetchServers = async (): Promise<Server[]> => {
  const response = await fetch('/api/servers');
  if (!response.ok) {
    throw new Error(`서버 목록 조회 실패: ${response.status}`);
  }
  return response.json();
};

const fetchServerDetail = async (serverId: string): Promise<ServerDetail> => {
  const response = await fetch(`/api/servers/${serverId}`);
  if (!response.ok) {
    throw new Error(`서버 상세정보 조회 실패: ${response.status}`);
  }
  return response.json();
};

const fetchServerMetrics = async (
  serverId: string, 
  timeRange: string = '1h'
): Promise<ServerMetrics[]> => {
  const response = await fetch(`/api/servers/${serverId}/metrics?range=${timeRange}`);
  if (!response.ok) {
    throw new Error(`서버 메트릭 조회 실패: ${response.status}`);
  }
  return response.json();
};

const toggleServerStatus = async (serverId: string): Promise<Server> => {
  const response = await fetch(`/api/servers/${serverId}/toggle`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!response.ok) {
    throw new Error(`서버 상태 변경 실패: ${response.status}`);
  }
  return response.json();
};

const restartServer = async (serverId: string): Promise<Server> => {
  const response = await fetch(`/api/servers/${serverId}/restart`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!response.ok) {
    throw new Error(`서버 재시작 실패: ${response.status}`);
  }
  return response.json();
};

// 🎯 Query Keys Factory
export const serverKeys = {
  all: ['servers'] as const,
  lists: () => [...serverKeys.all, 'list'] as const,
  list: (filters: string) => [...serverKeys.lists(), { filters }] as const,
  details: () => [...serverKeys.all, 'detail'] as const,
  detail: (id: string) => [...serverKeys.details(), id] as const,
  metrics: (id: string) => [...serverKeys.detail(id), 'metrics'] as const,
  metricsWithRange: (id: string, range: string) => 
    [...serverKeys.metrics(id), { range }] as const,
};

// 🚀 메인 서버 목록 조회
export const useServers = (options?: {
  refetchInterval?: number;
  enabled?: boolean;
}) => {
  return useQuery({
    queryKey: serverKeys.lists(),
    queryFn: fetchServers,
    refetchInterval: options?.refetchInterval ?? 30000, // 30초 자동 갱신
    staleTime: 10000, // 10초 동안 stale하지 않음
    enabled: options?.enabled ?? true,
    retry: (failureCount, error) => {
      // 404는 재시도하지 않음
      if (error instanceof Error && error.message.includes('404')) {
        return false;
      }
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    placeholderData: keepPreviousData,
    meta: {
      errorMessage: '서버 목록을 불러오는데 실패했습니다.',
    },
  });
};

// 📊 서버 상세정보 조회
export const useServerDetail = (serverId: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: serverKeys.detail(serverId),
    queryFn: () => fetchServerDetail(serverId),
    enabled: !!serverId && enabled,
    staleTime: 5000,
    refetchInterval: 15000, // 15초 간격
    retry: 2,
    placeholderData: keepPreviousData,
    meta: {
      errorMessage: '서버 상세정보를 불러오는데 실패했습니다.',
    },
  });
};

// 📈 서버 메트릭 조회
export const useServerMetrics = (
  serverId: string, 
  timeRange: string = '1h',
  options?: { enabled?: boolean }
) => {
  return useQuery({
    queryKey: serverKeys.metricsWithRange(serverId, timeRange),
    queryFn: () => fetchServerMetrics(serverId, timeRange),
    enabled: !!serverId && (options?.enabled ?? true),
    staleTime: 60000, // 1분
    refetchInterval: 60000, // 1분 간격
    retry: 1,
    placeholderData: keepPreviousData,
    select: (data) => {
      // 데이터 변환 및 정렬
      return data
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
        .map(metric => ({
          ...metric,
          timestamp: new Date(metric.timestamp).toISOString(),
        }));
    },
    meta: {
      errorMessage: '서버 메트릭을 불러오는데 실패했습니다.',
    },
  });
};

// 🔄 서버 상태 토글 (Optimistic Update)
export const useServerToggle = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: toggleServerStatus,
    
    // Optimistic Update
    onMutate: async (serverId) => {
      // 진행 중인 쿼리 취소
      await queryClient.cancelQueries({ queryKey: serverKeys.lists() });
      await queryClient.cancelQueries({ queryKey: serverKeys.detail(serverId) });
      
      // 이전 데이터 백업
      const previousServers = queryClient.getQueryData(serverKeys.lists());
      const previousServer = queryClient.getQueryData(serverKeys.detail(serverId));
      
      // Optimistic Update 적용
      queryClient.setQueryData(serverKeys.lists(), (old: Server[] | undefined) => {
        if (!old) return old;
        return old.map(server => 
          server.id === serverId 
            ? { 
                ...server, 
                status: server.status === 'online' ? 'offline' : 'online',
                lastUpdate: new Date().toISOString()
              }
            : server
        );
      });
      
      return { previousServers, previousServer };
    },
    
    // 성공 시
    onSuccess: (updatedServer, serverId) => {
      // 성공 토스트
      toast.success(`서버 ${updatedServer.name}이(가) ${updatedServer.status === 'online' ? '시작' : '중지'}되었습니다.`);
      
      // 관련 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: serverKeys.detail(serverId) });
      queryClient.invalidateQueries({ queryKey: serverKeys.metrics(serverId) });
    },
    
    // 에러 시 롤백
    onError: (error, serverId, context) => {
      if (context?.previousServers) {
        queryClient.setQueryData(serverKeys.lists(), context.previousServers);
      }
      if (context?.previousServer) {
        queryClient.setQueryData(serverKeys.detail(serverId), context.previousServer);
      }
      
      toast.error(`서버 상태 변경에 실패했습니다: ${error.message}`);
    },
    
    // 완료 후 정리
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: serverKeys.lists() });
    },
  });
};

// 🔄 서버 재시작
export const useServerRestart = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: restartServer,
    
    onMutate: async (serverId) => {
      // 재시작 중 상태로 임시 변경
      queryClient.setQueryData(serverKeys.lists(), (old: Server[] | undefined) => {
        if (!old) return old;
        return old.map(server => 
          server.id === serverId 
            ? { ...server, status: 'warning' as const, lastUpdate: new Date().toISOString() }
            : server
        );
      });
      
      toast.loading(`서버 ${serverId} 재시작 중...`, { id: `restart-${serverId}` });
    },
    
    onSuccess: (updatedServer, serverId) => {
      toast.success(`서버 ${updatedServer.name}이(가) 재시작되었습니다.`, { 
        id: `restart-${serverId}` 
      });
      
      // 모든 관련 데이터 새로고침
      queryClient.invalidateQueries({ queryKey: serverKeys.all });
    },
    
    onError: (error, serverId) => {
      toast.error(`서버 재시작에 실패했습니다: ${error.message}`, { 
        id: `restart-${serverId}` 
      });
      
      // 원래 상태로 복구를 위해 데이터 무효화
      queryClient.invalidateQueries({ queryKey: serverKeys.lists() });
    },
  });
};

// 📊 서버 통계 요약
export const useServerStats = () => {
  const { data: servers, isLoading } = useServers();
  
  return {
    data: servers ? {
      total: servers.length,
      online: servers.filter(s => s.status === 'online').length,
      offline: servers.filter(s => s.status === 'offline').length,
      warning: servers.filter(s => s.status === 'warning').length,
      avgCpu: servers.reduce((acc, s) => acc + s.cpu, 0) / servers.length || 0,
      avgMemory: servers.reduce((acc, s) => acc + s.memory, 0) / servers.length || 0,
      avgDisk: servers.reduce((acc, s) => acc + s.disk, 0) / servers.length || 0,
    } : undefined,
    isLoading,
  };
};

// 🔍 서버 검색 및 필터링
export const useServerSearch = (searchTerm: string, filters?: {
  status?: Server['status'];
  type?: Server['type'];
}) => {
  const { data: servers, ...query } = useServers();
  
  const filteredServers = servers?.filter(server => {
    const matchesSearch = !searchTerm || 
      server.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      server.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = !filters?.status || server.status === filters.status;
    const matchesType = !filters?.type || server.type === filters.type;
    
    return matchesSearch && matchesStatus && matchesType;
  });
  
  return {
    ...query,
    data: filteredServers,
    isEmpty: filteredServers?.length === 0,
    hasSearch: !!searchTerm || !!filters?.status || !!filters?.type,
  };
};

// 🌐 실시간 연결 상태 (WebSocket 연동 준비)
export const useServerConnection = () => {
  const queryClient = useQueryClient();
  
  // TODO: WebSocket 연결 로직 구현
  // useEffect(() => {
  //   const socket = io('/servers');
  //   
  //   socket.on('server:update', (data: Server) => {
  //     queryClient.setQueryData(serverKeys.lists(), (old: Server[] | undefined) => {
  //       if (!old) return old;
  //       return old.map(server => server.id === data.id ? data : server);
  //     });
  //   });
  //   
  //   return () => socket.disconnect();
  // }, [queryClient]);
  
  return {
    isConnected: true, // 임시값
    connectionStatus: 'connected' as const,
  };
};

// 🎯 쿼리 상태 유틸리티
export const useServerQueryStatus = () => {
  const queryClient = useQueryClient();
  
  const queries = queryClient.getQueryCache().getAll()
    .filter(query => query.queryKey[0] === 'servers');
  
  return {
    totalQueries: queries.length,
    loadingQueries: queries.filter(q => q.state.status === 'pending').length,
    errorQueries: queries.filter(q => q.state.status === 'error').length,
    staleQueries: queries.filter(q => q.isStale()).length,
  };
}; 