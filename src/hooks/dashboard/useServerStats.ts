import { useState, useEffect, useMemo } from 'react';
import { useWorkerStats } from '../useWorkerStats';
import {
  EnhancedServerData,
  ServerStats,
} from '@/types/dashboard/server-dashboard.types';
import {
  calculateServerStats,
  adaptWorkerStatsToLegacy,
} from '@/utils/dashboard/server-utils';

export function useServerStats(actualServers: EnhancedServerData[]) {
  // 🚀 Web Worker 통계 계산 Hook
  const { calculateStats: calculateStatsWorker, isWorkerReady } =
    useWorkerStats();

  // 🚀 Web Worker 기반 비동기 통계 계산 상태
  const [workerStats, setWorkerStats] = useState<ServerStats | null>(null);
  const [isCalculatingStats, setIsCalculatingStats] = useState(false);

  // 🛡️ 안전한 Web Worker 계산 관리
  useEffect(() => {
    if (!actualServers || actualServers.length === 0) {
      setWorkerStats(null);
      return;
    }

    // Web Worker 사용 조건: 준비 완료 + 10개 이상 서버
    if (isWorkerReady() && actualServers.length >= 10) {
      if (!isCalculatingStats) {
        setIsCalculatingStats(true);

        calculateStatsWorker(actualServers)
          .then((workerResult) => {
            const adaptedStats = adaptWorkerStatsToLegacy(workerResult);
            setWorkerStats(adaptedStats);
            setIsCalculatingStats(false);
          })
          .catch((error) => {
            console.error('❌ Web Worker 계산 실패, Fallback으로 대체:', error);
            const fallbackStats = calculateServerStats(actualServers);
            setWorkerStats(fallbackStats);
            setIsCalculatingStats(false);
          });
      }
    } else {
      // 조건 미충족 시 동기 계산 결과 저장
      const syncStats = calculateServerStats(actualServers);
      setWorkerStats(syncStats);
    }
  }, [actualServers, isWorkerReady, calculateStatsWorker, isCalculatingStats]);

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
