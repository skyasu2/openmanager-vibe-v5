/**
 * ⚡ Optimistic Updates: 즉시 UI 반영
 * 
 * Phase 7.4: 고급 패턴 구현
 * - 서버 응답 전 UI 즉시 업데이트
 * - 에러 시 자동 롤백
 * - AI 피드백, 로그, 설정 변경에 적용
 * - 사용자 경험 극대화
 */

import { useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { serverKeys } from './useServerQueries';
import { predictionKeys } from './usePredictionQueries';
import { infiniteKeys } from './useInfiniteQueries';

// 📝 로그 엔트리 타입
interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warning' | 'error' | 'debug';
  message: string;
  source: string;
  metadata?: Record<string, any>;
  serverId?: string;
}

// 🔮 AI 피드백 타입
interface AIFeedback {
  id: string;
  prediction_id: string;
  rating: number; // 1-5
  comment?: string;
  timestamp: string;
  user_id?: string;
}

// ⚙️ 서버 설정 타입
interface ServerConfig {
  id: string;
  name: string;
  enabled: boolean;
  monitoring_interval: number;
  alert_thresholds: {
    cpu: number;
    memory: number;
    disk: number;
  };
}

// 🚀 서버 상태 Optimistic Toggle
export const useOptimisticServerToggle = (serverId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newStatus: 'running' | 'stopped') => {
      // 실제 API 호출
      const response = await fetch(`/api/servers/${serverId}/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      
      if (!response.ok) {
        throw new Error(`서버 ${newStatus === 'running' ? '시작' : '중지'} 실패`);
      }
      
      return response.json();
    },

    // ⚡ Optimistic Update
    onMutate: async (newStatus) => {
      // 🔄 진행 중인 쿼리 취소
      await queryClient.cancelQueries({ queryKey: serverKeys.lists() });
      await queryClient.cancelQueries({ queryKey: serverKeys.detail(serverId) });

      // 📸 이전 상태 스냅샷
      const previousServers = queryClient.getQueryData(serverKeys.lists());
      const previousServer = queryClient.getQueryData(serverKeys.detail(serverId));

      // ✨ 즉시 UI 업데이트
      queryClient.setQueryData(serverKeys.lists(), (old: any[]) => {
        if (!old) return old;
        return old.map(server => 
          server.id === serverId 
            ? { ...server, status: newStatus, lastUpdate: new Date().toISOString() }
            : server
        );
      });

      queryClient.setQueryData(serverKeys.detail(serverId), (old: any) => {
        if (!old) return old;
        return { 
          ...old, 
          status: newStatus, 
          lastUpdate: new Date().toISOString() 
        };
      });

      // 🎯 즉시 피드백
      toast.loading(
        `서버 ${newStatus === 'running' ? '시작' : '중지'} 중...`,
        { id: `server-toggle-${serverId}` }
      );

      return { previousServers, previousServer };
    },

    // ✅ 성공 시
    onSuccess: (data, newStatus) => {
      toast.success(
        `✅ 서버가 성공적으로 ${newStatus === 'running' ? '시작' : '중지'}되었습니다`,
        { id: `server-toggle-${serverId}` }
      );
    },

    // ❌ 실패 시 롤백
    onError: (error, newStatus, context) => {
      if (context?.previousServers) {
        queryClient.setQueryData(serverKeys.lists(), context.previousServers);
      }
      if (context?.previousServer) {
        queryClient.setQueryData(serverKeys.detail(serverId), context.previousServer);
      }

      toast.error(
        `❌ 서버 ${newStatus === 'running' ? '시작' : '중지'} 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
        { id: `server-toggle-${serverId}` }
      );
    },

    // 🔄 완료 후 최신 데이터 갱신
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: serverKeys.lists() });
      queryClient.invalidateQueries({ queryKey: serverKeys.detail(serverId) });
    },
  });
};

// 🔮 AI 피드백 Optimistic 제출
export const useOptimisticAIFeedback = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (feedback: Omit<AIFeedback, 'id' | 'timestamp'>) => {
      const response = await fetch('/api/ai/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(feedback),
      });

      if (!response.ok) {
        throw new Error('피드백 제출 실패');
      }

      return response.json();
    },

    onMutate: async (newFeedback) => {
      // 임시 ID 생성
      const optimisticFeedback: AIFeedback = {
        ...newFeedback,
        id: `temp-${Date.now()}`,
        timestamp: new Date().toISOString(),
      };

      // 예측 데이터에 피드백 즉시 반영
      await queryClient.cancelQueries({ 
        queryKey: predictionKeys.list('{}') 
      });

      const previousPredictions = queryClient.getQueryData(predictionKeys.list('{}'));

      queryClient.setQueryData(predictionKeys.list('{}'), (old: any[]) => {
        if (!old) return old;
        return old.map(prediction => 
          prediction.id === newFeedback.prediction_id
            ? { 
                ...prediction, 
                feedback: optimisticFeedback,
                user_rating: newFeedback.rating 
              }
            : prediction
        );
      });

      // 🎯 즉시 피드백
      toast.success('✨ 피드백이 반영되었습니다', { duration: 2000 });

      return { previousPredictions, optimisticFeedback };
    },

    onError: (error, variables, context) => {
      if (context?.previousPredictions) {
        queryClient.setQueryData(predictionKeys.list('{}'), context.previousPredictions);
      }
      toast.error(`❌ 피드백 제출 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: predictionKeys.list('{}') });
    },
  });
};

// 📝 로그 필터 Optimistic 업데이트
export const useOptimisticLogFilter = () => {
  const queryClient = useQueryClient();

  return useCallback((filters: {
    level?: string;
    source?: string;
    search?: string;
  }) => {
    // 🔄 현재 로그 데이터 가져오기
    const currentFilters = JSON.stringify(filters);
    const currentLogs = queryClient.getQueryData(infiniteKeys.logs(currentFilters));

    // ⚡ 즉시 필터링 결과 표시 (클라이언트 사이드)
    if (currentLogs) {
      // 필터 적용된 임시 결과 생성
      const filteredLogs = applyClientSideFilter(currentLogs, filters);
      
      // 임시 쿼리 키로 즉시 결과 표시
      queryClient.setQueryData(
        ['filtered_logs', currentFilters], 
        filteredLogs
      );

      // 🎯 즉시 피드백
      toast.success(`📋 ${filteredLogs.totalCount || 0}개 로그 필터링 완료`, { 
        duration: 1500 
      });
    }

    // 백그라운드에서 실제 서버 필터링 수행
    setTimeout(() => {
      queryClient.invalidateQueries({ 
        queryKey: infiniteKeys.logs(currentFilters) 
      });
    }, 100);
  }, [queryClient]);
};

// ⚙️ 서버 설정 Optimistic 업데이트
export const useOptimisticServerConfig = (serverId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (config: Partial<ServerConfig>) => {
      const response = await fetch(`/api/servers/${serverId}/config`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      if (!response.ok) {
        throw new Error('서버 설정 업데이트 실패');
      }

      return response.json();
    },

    onMutate: async (newConfig) => {
      await queryClient.cancelQueries({ 
        queryKey: serverKeys.detail(serverId) 
      });

      const previousServer = queryClient.getQueryData(serverKeys.detail(serverId));

      // ✨ 즉시 설정 반영
      queryClient.setQueryData(serverKeys.detail(serverId), (old: any) => {
        if (!old) return old;
        return { 
          ...old, 
          config: { ...old.config, ...newConfig },
          lastConfigUpdate: new Date().toISOString()
        };
      });

      // 🎯 즉시 피드백
      toast.success('⚙️ 설정이 적용되었습니다', { duration: 2000 });

      return { previousServer };
    },

    onError: (error, variables, context) => {
      if (context?.previousServer) {
        queryClient.setQueryData(serverKeys.detail(serverId), context.previousServer);
      }
      toast.error(`❌ 설정 적용 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    },

    onSuccess: () => {
      toast.success('✅ 서버 설정이 성공적으로 저장되었습니다');
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: serverKeys.detail(serverId) });
    },
  });
};

// 🎯 통합 Optimistic Updates 관리
export const useOptimisticManager = () => {
  const queryClient = useQueryClient();

  // 📊 진행 중인 Optimistic 업데이트 상태
  const getPendingUpdates = useCallback(() => {
    const mutationCache = queryClient.getMutationCache();
    const pendingMutations = mutationCache.getAll()
      .filter(mutation => mutation.state.status === 'pending');

    return {
      total: pendingMutations.length,
      types: pendingMutations.map(m => m.options.mutationKey?.[0] || 'unknown'),
      isUpdating: pendingMutations.length > 0,
    };
  }, [queryClient]);

  // 🔄 모든 Optimistic 업데이트 취소
  const cancelAllOptimistic = useCallback(() => {
    queryClient.getMutationCache().getAll()
      .filter(mutation => mutation.state.status === 'pending')
      .forEach(mutation => {
        mutation.destroy();
      });
    
    toast('🔄 모든 진행 중인 업데이트가 취소되었습니다');
  }, [queryClient]);

  return {
    getPendingUpdates,
    cancelAllOptimistic,
  };
};

// 🛠️ 클라이언트 사이드 로그 필터링 유틸리티
function applyClientSideFilter(data: any, filters: {
  level?: string;
  source?: string;
  search?: string;
}) {
  if (!data?.allLogs) return data;

  let filteredLogs = [...data.allLogs];

  if (filters.level) {
    filteredLogs = filteredLogs.filter(log => log.level === filters.level);
  }

  if (filters.source) {
    filteredLogs = filteredLogs.filter(log => 
      log.source.toLowerCase().includes(filters.source!.toLowerCase())
    );
  }

  if (filters.search) {
    filteredLogs = filteredLogs.filter(log => 
      log.message.toLowerCase().includes(filters.search!.toLowerCase())
    );
  }

  return {
    ...data,
    allLogs: filteredLogs,
    totalCount: filteredLogs.length,
  };
} 