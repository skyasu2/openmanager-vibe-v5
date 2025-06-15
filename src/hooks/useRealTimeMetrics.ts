import { useState, useEffect } from 'react';
import { timerManager } from '../utils/TimerManager';

export interface RealTimeMetrics {
  processes: number;
  loadAverage: string;
  temperature: number;
  networkThroughput: {
    in: number;
    out: number;
  };
}

export function useRealTimeMetrics(serverId: string | null) {
  const [realTimeMetrics, setRealTimeMetrics] =
    useState<RealTimeMetrics | null>(null);

  useEffect(() => {
    if (!serverId) return;

    const updateRealTimeMetrics = () => {
      setRealTimeMetrics({
        processes: Math.floor(Math.random() * 200) + 150,
        loadAverage: (Math.random() * 2).toFixed(2),
        temperature: Math.floor(Math.random() * 20) + 45,
        networkThroughput: {
          in: Math.floor(Math.random() * 1000) + 500,
          out: Math.floor(Math.random() * 800) + 300,
        },
      });
    };

    updateRealTimeMetrics();

    // TimerManager를 사용한 실시간 메트릭 업데이트
    timerManager.register({
      id: `server-detail-metrics-${serverId}`,
      callback: updateRealTimeMetrics,
      interval: 3000,
      priority: 'medium',
      enabled: true,
    });

    return () => {
      timerManager.unregister(`server-detail-metrics-${serverId}`);
    };
  }, [serverId]);

  return realTimeMetrics;
}
