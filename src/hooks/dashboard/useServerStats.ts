import { useEffect, useMemo, useRef, useState } from 'react';
import { logger } from '@/lib/logging';
import type {
  EnhancedServerData,
  ServerStats,
} from '@/types/dashboard/server-dashboard.types';
import {
  adaptWorkerStatsToLegacy,
  calculateServerStats,
} from '@/utils/dashboard/server-utils';
import { useWorkerStats } from '../useWorkerStats';

export function useServerStats(actualServers: EnhancedServerData[]) {
  // 🚀 Web Worker 통계 계산 Hook
  const { calculateStats: calculateStatsWorker, isWorkerReady } =
    useWorkerStats();

  // 🚀 Web Worker 기반 비동기 통계 계산 상태
  const [workerStats, setWorkerStats] = useState<ServerStats | null>(null);
  const [isCalculatingStats, setIsCalculatingStats] = useState(false);

  // 🔧 Race Condition 방지: useRef로 최신 계산 상태 추적
  const isCalculatingRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // 🛡️ 안전한 Web Worker 계산 관리
  useEffect(() => {
    if (!actualServers || actualServers.length === 0) {
      setWorkerStats(null);
      return;
    }

    // Web Worker 사용 조건: 준비 완료 + 10개 이상 서버
    if (isWorkerReady() && actualServers.length >= 10) {
      // 🔧 useRef로 최신 상태 확인 (stale closure 방지)
      if (!isCalculatingRef.current) {
        isCalculatingRef.current = true;
        setIsCalculatingStats(true);

        // 이전 요청 취소
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
        abortControllerRef.current = new AbortController();

        calculateStatsWorker(actualServers)
          .then((workerResult) => {
            const adaptedStats = adaptWorkerStatsToLegacy(workerResult);
            setWorkerStats(adaptedStats);
          })
          .catch((error) => {
            if (error?.name !== 'AbortError') {
              logger.error(
                '❌ Web Worker 계산 실패, Fallback으로 대체:',
                error
              );
              const fallbackStats = calculateServerStats(actualServers);
              setWorkerStats(fallbackStats);
            }
          })
          .finally(() => {
            isCalculatingRef.current = false;
            setIsCalculatingStats(false);
          });
      }
    } else {
      // 조건 미충족 시 동기 계산 결과 저장
      const syncStats = calculateServerStats(actualServers);
      setWorkerStats(syncStats);
    }

    // Cleanup: 컴포넌트 언마운트 시 진행 중인 계산 취소
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [actualServers, isWorkerReady, calculateStatsWorker]);

  // 🏗️ Clean Architecture: 순수 동기 stats 반환 (useMemo)
  const stats = useMemo(() => {
    if (!actualServers || actualServers.length === 0) {
      return {
        total: 0,
        online: 0,
        unknown: 0,
        warning: 0,
        critical: 0,
        avgCpu: 0,
        avgMemory: 0,
        avgDisk: 0,
      };
    }

    // Web Worker 결과 우선, 없으면 즉시 동기 계산
    return workerStats || calculateServerStats(actualServers);
  }, [actualServers, workerStats]);

  return { stats, isCalculatingStats };
}
