'use client';

import { calculateOptimalCollectionInterval } from '@/config/serverConfig';
import { useEffect, useState } from 'react';

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
      const result = await response.json();

      // API 응답 구조 확인 및 데이터 추출
      let alertsData: SystemAlert[] = [];
      if (result.success && result.data && Array.isArray(result.data.alerts)) {
        alertsData = result.data.alerts;
      } else if (Array.isArray(result)) {
        alertsData = result;
      } else {
        console.warn('🚨 예상하지 못한 API 응답 구조:', result);
        alertsData = [];
      }

      // 최신순으로 정렬 (배열인 경우에만)
      const sortedAlerts = alertsData.sort(
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

    // 🎯 데이터 수집 간격과 동기화
    const intervalId = setInterval(fetchAlerts, calculateOptimalCollectionInterval());

    return () => clearInterval(intervalId); // 컴포넌트 언마운트 시 인터벌 정리
  }, []);

  return { alerts, isLoading, error };
}
