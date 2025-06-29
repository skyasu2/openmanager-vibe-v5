/**
 * 🪝 useSystemHealth Hook
 *
 * ✅ 시스템 헬스 API 상태 관리 전용 훅
 * ✅ 단일 책임: API 호출 및 상태 관리만 담당
 * ✅ SOLID 원칙 적용
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type { ApiState, SystemHealthAPIResponse } from '../types/dashboard';
import { timerManager } from '../utils/TimerManager';

interface UseSystemHealthOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
  enableLogging?: boolean;
  retryAttempts?: number;
  retryDelay?: number;
}

interface UseSystemHealthReturn extends ApiState<SystemHealthAPIResponse> {
  autoRefresh: boolean;
  setAutoRefresh: (enabled: boolean) => void;
  refresh: () => Promise<void>;
  isRefreshing: boolean;
  retryCount: number;
  connectionStatus: 'connected' | 'disconnected' | 'error';
}

export const useSystemHealth = (
  options: UseSystemHealthOptions = {}
): UseSystemHealthReturn => {
  const {
    autoRefresh: defaultAutoRefresh = true,
    refreshInterval = 30000, // 30초
    enableLogging = true,
    retryAttempts = 3,
    retryDelay = 1000,
  } = options;

  // 🔄 상태 관리
  const [data, setData] = useState<SystemHealthAPIResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(defaultAutoRefresh);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState<
    'connected' | 'disconnected' | 'error'
  >('disconnected');

  // 🔗 참조값 관리
  const abortControllerRef = useRef<AbortController | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 📡 API 데이터 가져오기 함수
  const fetchHealthData = useCallback(
    async (isRetry: boolean = false): Promise<void> => {
      try {
        // 이전 요청 취소
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }

        // 새로운 AbortController 생성
        abortControllerRef.current = new AbortController();

        setLoading(!isRetry);
        setIsRefreshing(isRetry);
        setError(null);

        if (enableLogging) {
          console.log(
            `🔄 시스템 헬스 데이터 ${isRetry ? '재시도' : '로드'} 시작...`
          );
        }

        const response = await fetch('/api/system/health', {
          signal: abortControllerRef.current.signal,
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(
            `API 응답 오류: ${response.status} ${response.statusText}`
          );
        }

        const healthData: SystemHealthAPIResponse = await response.json();

        // 데이터 유효성 검증
        if (!healthData || typeof healthData !== 'object') {
          throw new Error('잘못된 API 응답 형식');
        }

        setData(healthData);
        setLastUpdate(new Date());
        setConnectionStatus('connected');
        setRetryCount(0);

        if (enableLogging) {
          console.log('✅ 시스템 헬스 데이터 업데이트 완료', {
            healthScore: healthData.summary?.healthScore,
            serverCount: healthData.summary?.serverCount,
            dataSource: healthData.summary?.dataSource,
          });
        }
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          // 요청이 취소된 경우 (정상적인 상황)
          return;
        }

        const errorMessage =
          err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다';
        setError(errorMessage);
        setConnectionStatus('error');

        if (enableLogging) {
          console.error('❌ 시스템 헬스 데이터 로드 실패:', err);
        }

        // 재시도 로직
        if (!isRetry && retryCount < retryAttempts) {
          const nextRetryCount = retryCount + 1;
          setRetryCount(nextRetryCount);

          if (enableLogging) {
            console.log(
              `🔄 ${retryDelay}ms 후 재시도 (${nextRetryCount}/${retryAttempts})`
            );
          }

          retryTimeoutRef.current = setTimeout(() => {
            fetchHealthData(true);
          }, retryDelay * nextRetryCount);
        } else {
          setConnectionStatus('disconnected');
        }
      } finally {
        setLoading(false);
        setIsRefreshing(false);
      }
    },
    [enableLogging, retryAttempts, retryDelay, retryCount]
  );

  // 🔄 수동 새로고침 함수
  const refresh = useCallback(async (): Promise<void> => {
    setRetryCount(0);
    await fetchHealthData();
  }, [fetchHealthData]);

  // ⏱️ 자동 새로고침 효과
  useEffect(() => {
    // 초기 로드
    fetchHealthData();

    if (autoRefresh) {
      // TimerManager를 사용한 자동 새로고침
      timerManager.register({
        id: 'system-health-refresh',
        callback: () => fetchHealthData(false),
        interval: refreshInterval,
        priority: 'medium',
        enabled: true,
      });
    } else {
      timerManager.unregister('system-health-refresh');
    }

    return () => {
      timerManager.unregister('system-health-refresh');

      // 재시도 타이머 정리
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }

      // 진행 중인 요청 취소
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [autoRefresh, refreshInterval, fetchHealthData]);

  // 🎛️ 자동 새로고침 토글 함수
  const handleSetAutoRefresh = useCallback(
    (enabled: boolean) => {
      setAutoRefresh(enabled);

      if (enableLogging) {
        console.log(`🔄 자동 새로고침 ${enabled ? '활성화' : '비활성화'}`);
      }
    },
    [enableLogging]
  );

  // 🧹 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      timerManager.unregister('system-health-refresh');

      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    data,
    loading,
    error,
    lastUpdate,
    autoRefresh,
    setAutoRefresh: handleSetAutoRefresh,
    refresh,
    isRefreshing,
    retryCount,
    connectionStatus,
  };
};

// 🔧 헬퍼 훅들

// 📊 차트 데이터 전용 훅
export const useSystemHealthCharts = (options?: UseSystemHealthOptions) => {
  const healthData = useSystemHealth(options);

  return {
    ...healthData,
    hasChartData: !!healthData.data?.charts,
    hasPerformanceData: !!healthData.data?.charts.performanceChart,
    hasAvailabilityData: !!healthData.data?.charts.availabilityChart,
    hasAlertsData: !!healthData.data?.charts.alertsChart,
    hasTrendsData: !!healthData.data?.charts.trendsChart,
  };
};

// 🚨 알림 전용 훅
export const useSystemHealthAlerts = (options?: UseSystemHealthOptions) => {
  const healthData = useSystemHealth(options);

  return {
    ...healthData,
    anomalies: healthData.data?.anomalies || [],
    recommendations: healthData.data?.recommendations || [],
    hasAnomalies: (healthData.data?.anomalies?.length || 0) > 0,
    hasRecommendations: (healthData.data?.recommendations?.length || 0) > 0,
    criticalAnomalies:
      healthData.data?.anomalies?.filter(a => a.severity === 'critical') || [],
    highPriorityAnomalies:
      healthData.data?.anomalies?.filter(
        a => a.severity === 'critical' || a.severity === 'high'
      ) || [],
  };
};

// 📈 요약 정보 전용 훅
export const useSystemHealthSummary = (options?: UseSystemHealthOptions) => {
  const healthData = useSystemHealth(options);

  return {
    ...healthData,
    summary: healthData.data?.summary || null,
    healthScore: healthData.data?.summary?.healthScore || 0,
    overallStatus: healthData.data?.summary?.overallStatus || 'critical',
    serverCount: healthData.data?.summary?.serverCount || 0,
    criticalIssues: healthData.data?.summary?.criticalIssues || 0,
    warnings: healthData.data?.summary?.warnings || 0,
    dataSource: healthData.data?.summary?.dataSource || 'none',
  };
};
