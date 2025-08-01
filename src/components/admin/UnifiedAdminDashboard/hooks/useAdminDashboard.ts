/**
 * 🎯 관리자 대시보드 메인 훅
 *
 * 대시보드의 전반적인 상태 관리 및 데이터 페칭
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type {
  DashboardData,
  DashboardTab,
} from '../UnifiedAdminDashboard.types';
import { REFRESH_INTERVALS } from '../UnifiedAdminDashboard.types';

interface UseAdminDashboardOptions {
  _initialTab?: DashboardTab;
  autoRefreshInterval?: number;
}

export function useAdminDashboard(options: UseAdminDashboardOptions = {}) {
  const {
    _initialTab = 'overview',
    autoRefreshInterval = REFRESH_INTERVALS.normal,
  } = options;

  // 상태 관리
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<DashboardTab>(_initialTab);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [unreadAlerts, setUnreadAlerts] = useState(0);

  // 참조 관리
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // 📡 시스템 데이터 가져오기
  const fetchSystemData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // 🚨 시스템 상태 먼저 확인 후 조건부로 다른 API 호출 (Vercel 절약)
      const systemRes = await fetch('/api/system/status');
      const systemData = await systemRes.json();

      // 시스템이 시작되지 않은 상태에서는 최소한의 데이터만 로드
      if (!systemData.isRunning) {
        console.log('⏸️ 시스템 미시작 상태 - 관리자 대시보드 최소 로드');
        setData(createMinimalData());
        return;
      }

      // 병렬로 여러 API 호출
      const [performanceRes, loggingRes, alertsRes] = await Promise.all([
        fetch('/api/admin/performance'),
        fetch('/api/admin/logging/stats'),
        fetch('/api/system/alerts'),
      ]);

      const [performanceData, loggingData, alertsData] = await Promise.all([
        performanceRes.json(),
        loggingRes.json(),
        alertsRes.json(),
      ]);

      // 데이터 조합
      const dashboardData: DashboardData = {
        status: {
          overall: calculateOverallStatus(performanceData, loggingData),
          performance:
            performanceData.performance || createDefaultPerformance(),
          logging: loggingData.stats || createDefaultLogging(),
          engines: performanceData.engines || createDefaultEngines(),
          infrastructure:
            systemData.infrastructure || createDefaultInfrastructure(),
        },
        alerts: alertsData.alerts || [],
        quickStats: {
          totalRequests: performanceData.totalRequests || 0,
          activeUsers: systemData.activeUsers || 0,
          systemUptime: systemData.uptime || 0,
          lastUpdate: new Date().toISOString(),
        },
      };

      setData(dashboardData);
      setLastUpdate(new Date());

      // 읽지 않은 알림 개수 업데이트
      const unread = dashboardData.alerts.filter(
        (alert) => !alert.acknowledged
      ).length;
      setUnreadAlerts(unread);
    } catch (err) {
      console.error('📡 대시보드 데이터 로드 실패:', err);
      setError(
        err instanceof Error ? err.message : '데이터를 불러올 수 없습니다'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // 자동 새로고침 설정
  useEffect(() => {
    if (autoRefresh) {
      refreshIntervalRef.current = setInterval(
        fetchSystemData,
        autoRefreshInterval
      );
    }

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [autoRefresh, autoRefreshInterval, fetchSystemData]);

  // 초기 데이터 로드
  useEffect(() => {
    fetchSystemData();
  }, [fetchSystemData]);

  // 알림 확인 처리
  const acknowledgeAlert = useCallback(async (alertId: string) => {
    try {
      await fetch(`/api/system/alerts/${alertId}/acknowledge`, {
        method: 'POST',
      });

      setData((prev) => {
        if (!prev) return prev;

        return {
          ...prev,
          alerts: prev.alerts.map((alert) =>
            alert.id === alertId ? { ...alert, acknowledged: true } : alert
          ),
        };
      });

      setUnreadAlerts((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('알림 확인 실패:', err);
    }
  }, []);

  return {
    // 상태
    data,
    loading,
    error,
    selectedTab,
    autoRefresh,
    lastUpdate,
    unreadAlerts,

    // 액션
    setSelectedTab,
    setAutoRefresh,
    refreshData: fetchSystemData,
    acknowledgeAlert,
  };
}

// ============================================================================
// 헬퍼 함수들
// ============================================================================

function createMinimalData(): DashboardData {
  return {
    status: {
      overall: 'inactive',
      performance: createDefaultPerformance(),
      logging: createDefaultLogging(),
      engines: createDefaultEngines(),
      infrastructure: createDefaultInfrastructure(),
    },
    alerts: [],
    quickStats: {
      totalRequests: 0,
      activeUsers: 0,
      systemUptime: 0,
      lastUpdate: new Date().toISOString(),
    },
  };
}

function createDefaultPerformance() {
  return {
    score: 0,
    status: 'inactive' as const,
    metrics: {
      avgResponseTime: 0,
      successRate: 0,
      errorRate: 0,
      fallbackRate: 0,
    },
  };
}

function createDefaultLogging() {
  return {
    status: 'inactive' as const,
    totalLogs: 0,
    errorRate: 0,
  };
}

function createDefaultEngines() {
  return {
    active: 0,
    total: 0,
    engines: [],
  };
}

function createDefaultInfrastructure() {
  return {
    environment: 'standby',
    uptime: 0,
    memoryUsage: 0,
    connections: 0,
  };
}

interface PerformanceDataInput {
  performance?: {
    score?: number;
  };
}

interface LoggingDataInput {
  stats?: {
    errorRate?: number;
  };
}

function calculateOverallStatus(
  performanceData: PerformanceDataInput,
  loggingData: LoggingDataInput
): DashboardData['status']['overall'] {
  const perfScore = performanceData?.performance?.score || 0;
  const errorRate = loggingData?.stats?.errorRate || 0;

  if (perfScore === 0) return 'inactive';
  if (perfScore >= 90 && errorRate < 5) return 'healthy';
  if (perfScore >= 70 && errorRate < 10) return 'warning';
  return 'critical';
}
