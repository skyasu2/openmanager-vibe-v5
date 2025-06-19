'use client';

import { useState, useEffect } from 'react';

// src/types/system.ts 또는 유사한 파일에 정의되어 있다고 가정
export interface SystemAlert {
  id: string;
  level: 'critical' | 'error' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  timestamp: string; // ISO 8601 형식
}

export function useSystemAlerts() {
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAlerts = async () => {
    try {
      // 실제 API 엔드포인트는 /api/alerts 또는 유사한 경로로 가정
      const response = await fetch('/api/alerts');
      if (!response.ok) {
        throw new Error(`Failed to fetch alerts: ${response.statusText}`);
      }
      const data: SystemAlert[] = await response.json();

      // 최신순으로 정렬
      const sortedAlerts = data.sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      setAlerts(sortedAlerts);
      setError(null);
    } catch (e) {
      if (e instanceof Error) {
        setError(e.message);
      } else {
        setError('An unknown error occurred');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts(); // 초기 로드

    const intervalId = setInterval(fetchAlerts, 10000); // 10초마다 데이터 폴링

    return () => clearInterval(intervalId); // 컴포넌트 언마운트 시 인터벌 정리
  }, []);

  return { alerts, isLoading, error };
}
