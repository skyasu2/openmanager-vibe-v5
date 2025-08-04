'use client';

import { useEffect, useState } from 'react';

interface Alert {
  id: string;
  type: 'info' | 'warning' | 'error';
  message: string;
  timestamp: string;
  serverId?: string;
}

export function useSystemAlerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      setError(null);

      // 🔄 대시보드 API에서 서버 상태를 가져와서 알림 생성
      const response = await fetch('/api/dashboard');

      if (!response.ok) {
        throw new Error(`API 요청 실패: ${response.status}`);
      }

      const dashboardData = await response.json();

      // 서버 상태에서 알림 추출
      const extractedAlerts: Alert[] = [];

      if (dashboardData.servers) {
        dashboardData.servers.forEach((server: unknown) => {
          const s = server as any;
          if (s.status === 'critical') {
            extractedAlerts.push({
              id: `${s.id}-critical`,
              type: 'error',
              message: `서버 ${s.name}에 심각한 문제가 발생했습니다`,
              timestamp: new Date().toISOString(),
              serverId: s.id,
            });
          } else if (s.status === 'warning') {
            extractedAlerts.push({
              id: `${s.id}-warning`,
              type: 'warning',
              message: `서버 ${s.name}에 주의가 필요합니다`,
              timestamp: new Date().toISOString(),
              serverId: s.id,
            });
          }
        });
      }

      setAlerts(extractedAlerts);
    } catch (err) {
      console.error('시스템 알림 조회 실패:', err);
      setError(err instanceof Error ? err.message : '알 수 없는 오류');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();

    // 30초마다 알림 업데이트
    const interval = setInterval(fetchAlerts, 30000);

    return () => clearInterval(interval);
  }, []);

  return {
    alerts,
    loading,
    error,
    refetch: fetchAlerts,
  };
}
