/**
 * 🗂️ useDataRetention 훅
 *
 * OpenManager v5.44.3 - 데이터 보존 관리 훅 (2025-07-02 18:15 KST)
 * - DataRetentionScheduler 프론트엔드 통합
 * - 실시간 통계 모니터링
 * - 수동 정리 기능
 * - Phase 3 SSE 최적화 통합
 */

import {
  getDataRetentionScheduler,
  type CleanupResult,
  type RetentionPolicy,
  type SchedulerStats,
} from '@/lib/DataRetentionScheduler';
import { useCallback, useEffect, useState } from 'react';

interface UseDataRetentionReturn {
  stats: SchedulerStats | null;
  policies: RetentionPolicy[];
  isLoading: boolean;
  error: string | null;

  // 액션들
  runManualCleanup: (dataType?: string) => Promise<CleanupResult[]>;
  refreshStats: () => void;
  addPolicy: (policy: Omit<RetentionPolicy, 'id'>) => string | null;
  updatePolicy: (id: string, updates: Partial<RetentionPolicy>) => boolean;
  deletePolicy: (id: string) => boolean;
}

export function useDataRetention(): UseDataRetentionReturn {
  const [stats, setStats] = useState<SchedulerStats | null>(null);
  const [policies, setPolicies] = useState<RetentionPolicy[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // DataRetentionScheduler 인스턴스 가져오기
  const getScheduler = useCallback(() => {
    try {
      return getDataRetentionScheduler();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    }
  }, []);

  // 통계 새로고침
  const refreshStats = useCallback(() => {
    const scheduler = getScheduler();
    if (!scheduler) return;

    try {
      setIsLoading(true);
      const newStats = scheduler.getStats();
      const newPolicies = scheduler.getPolicies();

      setStats(newStats);
      setPolicies(newPolicies);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh stats');
    } finally {
      setIsLoading(false);
    }
  }, [getScheduler]);

  // 수동 정리 실행
  const runManualCleanup = useCallback(
    async (dataType?: string): Promise<CleanupResult[]> => {
      const scheduler = getScheduler();
      if (!scheduler) return [];

      try {
        setIsLoading(true);
        const results = await scheduler.manualCleanup(dataType);

        // 정리 후 통계 새로고침
        refreshStats();

        return results;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to run cleanup');
        return [];
      } finally {
        setIsLoading(false);
      }
    },
    [getScheduler, refreshStats]
  );

  // 정책 추가
  const addPolicy = useCallback(
    (policyData: Omit<RetentionPolicy, 'id'>): string | null => {
      const scheduler = getScheduler();
      if (!scheduler) return null;

      try {
        const policyId = scheduler.addPolicy(policyData);
        refreshStats(); // 정책 추가 후 새로고침
        return policyId;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to add policy');
        return null;
      }
    },
    [getScheduler, refreshStats]
  );

  // 정책 업데이트
  const updatePolicy = useCallback(
    (id: string, updates: Partial<RetentionPolicy>): boolean => {
      const scheduler = getScheduler();
      if (!scheduler) return false;

      try {
        const success = scheduler.updatePolicy(id, updates);
        if (success) {
          refreshStats(); // 정책 업데이트 후 새로고침
        }
        return success;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to update policy'
        );
        return false;
      }
    },
    [getScheduler, refreshStats]
  );

  // 정책 삭제
  const deletePolicy = useCallback(
    (id: string): boolean => {
      const scheduler = getScheduler();
      if (!scheduler) return false;

      try {
        const success = scheduler.deletePolicy(id);
        if (success) {
          refreshStats(); // 정책 삭제 후 새로고침
        }
        return success;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to delete policy'
        );
        return false;
      }
    },
    [getScheduler, refreshStats]
  );

  // 초기 로드 및 주기적 업데이트
  useEffect(() => {
    // 초기 통계 로드
    refreshStats();

    // 30초마다 통계 업데이트 (Phase 2 시스템 상태와 동일)
    const interval = setInterval(refreshStats, 30000);

    return () => {
      clearInterval(interval);
    };
  }, [refreshStats]);

  return {
    stats,
    policies,
    isLoading,
    error,
    runManualCleanup,
    refreshStats,
    addPolicy,
    updatePolicy,
    deletePolicy,
  };
}

// 개별 데이터 타입 정리 전용 훅
export function useDataRetentionByType(
  dataType: 'metrics' | 'alerts' | 'connections' | 'logs' | 'cache' | 'sse'
) {
  const { runManualCleanup, stats, policies } = useDataRetention();

  const typeStats = stats
    ? {
        lastCleanup: stats.lastCleanupTime,
        memoryUsage: stats.memoryUsageMB,
        totalItemsRemoved: stats.totalItemsRemoved,
      }
    : null;

  const typePolicy = policies.find(p => p.dataType === dataType);

  const runTypeCleanup = useCallback(() => {
    return runManualCleanup(dataType);
  }, [runManualCleanup, dataType]);

  return {
    stats: typeStats,
    policy: typePolicy,
    runCleanup: runTypeCleanup,
  };
}

// SSE 전용 정리 훅 (Phase 3 특화)
export function useSSEDataRetention() {
  return useDataRetentionByType('sse');
}

export default useDataRetention;
