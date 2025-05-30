import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys, api } from '@/lib/react-query';

/**
 * 시스템 상태 조회 훅
 */
export function useSystemStatus() {
  return useQuery({
    queryKey: queryKeys.systemStatus,
    queryFn: () => api.system.getStatus(),
    staleTime: 1000 * 30, // 30초
    refetchInterval: 5000, // 5초마다 새로고침
    meta: {
      errorMessage: '시스템 상태를 불러오는 데 실패했습니다.',
    },
  });
}

/**
 * 시스템 헬스 조회 훅
 */
export function useSystemHealth() {
  return useQuery({
    queryKey: queryKeys.systemHealth,
    queryFn: () => api.system.getHealth(),
    staleTime: 1000 * 60, // 1분
    refetchInterval: 15000, // 15초마다 새로고침
    select: (data) => {
      // 헬스 데이터 변환 및 정규화
      if (data?.success) {
        return {
          overall: data.status === 'healthy' ? 'healthy' : 'unhealthy',
          components: data.components || {},
          metrics: data.metrics || {},
          alerts: data.alerts || [],
          lastCheck: new Date(),
        };
      }
      return null;
    },
    meta: {
      errorMessage: '시스템 헬스 정보를 불러오는 데 실패했습니다.',
    },
  });
}

/**
 * AI 엔진 상태 조회 훅
 */
export function useAIEngineStatus() {
  return useQuery({
    queryKey: queryKeys.aiEngineStatus,
    queryFn: () => api.ai.getEngineStatus(),
    staleTime: 1000 * 60 * 2, // 2분
    refetchInterval: 10000, // 10초마다 새로고침
    retry: 2, // AI 엔진은 가끔 불안정할 수 있으므로 재시도 횟수 줄임
    meta: {
      errorMessage: 'AI 엔진 상태를 불러오는 데 실패했습니다.',
    },
  });
}

/**
 * MCP 상태 조회 훅
 */
export function useMCPStatus() {
  return useQuery({
    queryKey: queryKeys.mcpStatus,
    queryFn: () => api.mcp.getStatus(),
    staleTime: 1000 * 60, // 1분
    refetchInterval: 30000, // 30초마다 새로고침
    meta: {
      errorMessage: 'MCP 상태를 불러오는 데 실패했습니다.',
    },
  });
}

/**
 * MCP 헬스 체크 훅
 */
export function useMCPHealth() {
  return useQuery({
    queryKey: queryKeys.mcpHealth,
    queryFn: () => api.mcp.getHealth(),
    staleTime: 1000 * 30, // 30초
    refetchInterval: 15000, // 15초마다 새로고침
    meta: {
      errorMessage: 'MCP 헬스 체크에 실패했습니다.',
    },
  });
}

/**
 * 데이터 생성기 상태 조회 훅
 */
export function useDataGeneratorStatus() {
  return useQuery({
    queryKey: queryKeys.dataGeneratorStatus,
    queryFn: () => api.dataGenerator.getStatus(),
    staleTime: 1000 * 30, // 30초로 변경
    refetchInterval: 30000, // 30초마다 새로고침 (2초 → 30초로 성능 최적화)
    select: (data) => {
      if (data?.success && data?.data?.generation) {
        return data.data.generation;
      }
      return {
        isGenerating: false,
        remainingTime: 0,
        currentPattern: null,
        patterns: []
      };
    },
    meta: {
      errorMessage: '데이터 생성기 상태를 불러오는 데 실패했습니다.',
    },
  });
}

/**
 * 데이터 생성기 시작 mutation
 */
export function useStartDataGenerator() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (pattern?: string) => api.dataGenerator.start(pattern),
    onSuccess: () => {
      // 데이터 생성기 상태 즉시 새로고침
      queryClient.invalidateQueries({ queryKey: queryKeys.dataGeneratorStatus });
      console.log('✅ 데이터 생성기 시작됨');
    },
    onError: (error) => {
      console.error('❌ 데이터 생성기 시작 실패:', error);
    },
  });
}

/**
 * AI 분석 mutation
 */
export function useAIAnalysis() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (request: any) => api.ai.getAnalysis(request),
    onSuccess: () => {
      // AI 관련 쿼리들 새로고침
      queryClient.invalidateQueries({ queryKey: queryKeys.aiAnalysis });
      queryClient.invalidateQueries({ queryKey: queryKeys.aiEngineStatus });
    },
    onError: (error) => {
      console.error('❌ AI 분석 실패:', error);
    },
  });
}

/**
 * AI 예측 조회 훅
 */
export function useAIPrediction(type: string, interval = '30min') {
  return useQuery({
    queryKey: queryKeys.aiPrediction(type, interval),
    queryFn: () => api.ai.getPrediction(type, interval),
    enabled: !!type, // type이 있을 때만 실행
    staleTime: 1000 * 60 * 5, // 5분 - 예측은 상대적으로 오래 유지
    refetchInterval: 60000, // 1분마다 새로고침
    meta: {
      errorMessage: 'AI 예측을 불러오는 데 실패했습니다.',
    },
  });
}

/**
 * 통합 시스템 상태 훅
 * 
 * @description
 * 여러 시스템 상태를 한 번에 조회하는 훅입니다.
 * 대시보드 헤더나 상태 표시에 유용합니다.
 */
export function useIntegratedSystemStatus() {
  const systemStatus = useSystemStatus();
  const systemHealth = useSystemHealth();
  const aiEngineStatus = useAIEngineStatus();
  const mcpStatus = useMCPStatus();
  const dataGenStatus = useDataGeneratorStatus();
  
  const isLoading = 
    systemStatus.isLoading || 
    systemHealth.isLoading || 
    aiEngineStatus.isLoading || 
    mcpStatus.isLoading || 
    dataGenStatus.isLoading;
  
  const hasError = 
    systemStatus.isError || 
    systemHealth.isError || 
    aiEngineStatus.isError || 
    mcpStatus.isError || 
    dataGenStatus.isError;
  
  // 통합 상태 계산
  const overallStatus = (() => {
    if (hasError) return 'critical';
    
    const healthStatus = systemHealth.data?.overall;
    const aiStatus = aiEngineStatus.data?.success ? 'healthy' : 'warning';
    const mcpHealthy = mcpStatus.data?.success ? 'healthy' : 'warning';
    
    if (healthStatus === 'unhealthy' || aiStatus === 'warning' || mcpHealthy === 'warning') {
      return 'warning';
    }
    
    return 'healthy';
  })();
  
  return {
    systemStatus: systemStatus.data,
    systemHealth: systemHealth.data,
    aiEngineStatus: aiEngineStatus.data,
    mcpStatus: mcpStatus.data,
    dataGenStatus: dataGenStatus.data,
    overallStatus,
    isLoading,
    hasError,
    // 개별 상태 새로고침 함수들
    refetchAll: () => {
      systemStatus.refetch();
      systemHealth.refetch();
      aiEngineStatus.refetch();
      mcpStatus.refetch();
      dataGenStatus.refetch();
    },
  };
} 