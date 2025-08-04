import { useState, useEffect, useCallback } from 'react';
import { realtimeDataManager } from '@/services/realtime/RealtimeDataManager';

const MAX_HISTORY_LENGTH = 30; // 30개 데이터 포인트 유지

export interface ServerMetricsHistory {
  cpu: number[];
  memory: number[];
  disk: number[];
  network: number[];
}

export function useServerMetricsHistory(serverId: string) {
  const [metricsHistory, setMetricsHistory] = useState<ServerMetricsHistory>({
    cpu: [],
    memory: [],
    disk: [],
    network: [],
  });
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const handleDataUpdate = useCallback(
    (data: unknown) => {
      const newData = data as {
        cpu: number;
        memory: number;
        disk: number;
        network: number;
      };
      setMetricsHistory(prevHistory => ({
        cpu: [...prevHistory.cpu.slice(-MAX_HISTORY_LENGTH + 1), newData.cpu],
        memory: [
          ...prevHistory.memory.slice(-MAX_HISTORY_LENGTH + 1),
          newData.memory,
        ],
        disk: [
          ...prevHistory.disk.slice(-MAX_HISTORY_LENGTH + 1),
          newData.disk,
        ],
        network: [
          ...prevHistory.network.slice(-MAX_HISTORY_LENGTH + 1),
          newData.network,
        ],
      }));
      setLastUpdated(new Date());
    },
    []
  );

  useEffect(() => {
    const subscriberId = `server-metrics-history-${serverId}`;

    const unsubscribe = realtimeDataManager.subscribe(
      subscriberId,
      handleDataUpdate,
      'server',
      'high'
    );

    return () => {
      unsubscribe();
    };
  }, [serverId, handleDataUpdate]);

  return { metricsHistory, lastUpdated };
}
