import { useEffect, useState } from 'react';
import { timerManager } from '../utils/TimerManager';

export interface RealTimeMetrics {
  processes: number;
  loadAverage: string;
  temperature: number;
  activeConnections: number;
  latency: number;
  packetIO: {
    in: number;
    out: number;
  };
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
        activeConnections: Math.floor(Math.random() * 100) + 50,
        latency: Math.floor(Math.random() * 100) + 10,
        packetIO: {
          in: Math.floor(Math.random() * 1000) + 500,
          out: Math.floor(Math.random() * 800) + 300,
        },
        networkThroughput: {
          in: Math.floor(Math.random() * 1000) + 500,
          out: Math.floor(Math.random() * 800) + 300,
        },
      });
    };

    updateRealTimeMetrics();

    // TimerManager를 사용한 실시간 메트릭 업데이트 - 🎯 데이터 생성기와 동기화 (3초 → 20초)
    timerManager.register({
      id: `server-detail-metrics-${serverId}`,
      callback: updateRealTimeMetrics,
      interval: 20000, // 20초 (데이터 생성기와 동기화)
      priority: 'medium',
      enabled: true,
    });

    return () => {
      timerManager.unregister(`server-detail-metrics-${serverId}`);
    };
  }, [serverId]);

  return realTimeMetrics;
}
