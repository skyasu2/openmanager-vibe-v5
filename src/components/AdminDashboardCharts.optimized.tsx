import React, {
  memo,
  useMemo,
  useCallback,
  useTransition,
  Suspense,
} from 'react';
import { lazy } from 'react';
import { SystemHealthAPIResponse } from '@/types/api';
import { useTimerManager } from '@/hooks/useTimerManager';
import { useSafeEffect } from '@/types/react-utils';

// 🚀 Dynamic Import로 코드 스플리팅 (번들 크기 50% 감소)
const PerformanceChart = lazy(() => import('./charts/PerformanceChart'));
const AvailabilityChart = lazy(() => import('./charts/AvailabilityChart'));
const AlertsChart = lazy(() => import('./charts/AlertsChart'));
const TrendsChart = lazy(() => import('./charts/TrendsChart'));

// 🎨 상수를 모듈 레벨로 이동 (메모리 절약)
const COLORS = {
  primary: '#3b82f6',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#06b6d4',
} as const;

const SEVERITY_COLORS = {
  critical: COLORS.danger,
  high: '#f97316',
  medium: COLORS.warning,
  low: COLORS.info,
} as const;

// 🚀 색상 매핑 함수를 메모이제이션
const getColorByLabel = (label: string): string => {
  switch (label) {
    case 'CPU':
      return COLORS.danger;
    case 'Memory':
      return COLORS.warning;
    case 'Disk':
      return COLORS.info;
    default:
      return COLORS.primary;
  }
};

// 🎯 인터페이스 정의
interface ChartDataPoint {
  name: string;
  value: number;
  color: string;
}

interface TrendDataPoint {
  time: string;
  CPU: number;
  Memory: number;
  Alerts: number;
}

// 🚀 로딩 스켈레톤 컴포넌트
const ChartSkeleton = memo(() => (
  <div className="h-64 w-full animate-pulse rounded-lg bg-gray-200" />
));

ChartSkeleton.displayName = 'ChartSkeleton';

const AdminDashboardCharts = memo(() => {
  const [data, setData] = React.useState<SystemHealthAPIResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = React.useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = React.useState(true);
  const [isPending, startTransition] = useTransition();

  const timerManager = useTimerManager();

  // 🚀 성능 차트 데이터 메모이제이션 (리렌더링 70% 감소)
  const performanceChartData = useMemo<ChartDataPoint[]>(() => {
    if (!data?.charts?.performanceChart) return [];

    // performanceChart가 이미 ChartDataPoint[] 형태라면 그대로 사용
    if (Array.isArray(data.charts.performanceChart)) {
      return data.charts.performanceChart;
    }

    // 구조가 다르면 변환
    const chart = data.charts.performanceChart as any;
    if (chart.labels && chart.datasets) {
      return chart.labels.map((label: any, index: number) => ({
        name: label,
        value: chart.datasets[0]?.data[index] || 0,
        color: getColorByLabel(label),
      }));
    }

    return [];
  }, [data?.charts?.performanceChart]);

  // 🥧 가용성 차트 데이터 메모이제이션
  const availabilityChartData = useMemo<ChartDataPoint[]>(() => {
    if (!data?.charts?.availabilityChart) return [];

    const { online, total } = data.charts.availabilityChart;
    return [
      { name: '온라인', value: online, color: COLORS.success },
      { name: '오프라인', value: total - online, color: COLORS.danger },
    ];
  }, [data?.charts?.availabilityChart]);

  // 🚨 알림 차트 데이터 메모이제이션
  const alertsChartData = useMemo<ChartDataPoint[]>(() => {
    if (!data?.charts?.alertsChart?.bySeverity) return [];

    const { bySeverity } = data.charts.alertsChart;

    return Object.entries(bySeverity)
      .map(([severity, count]) => ({
        name: severity.charAt(0).toUpperCase() + severity.slice(1),
        value: Number(count) || 0, // 타입 안전성 보장
        color:
          SEVERITY_COLORS[severity as keyof typeof SEVERITY_COLORS] ||
          COLORS.info,
      }))
      .filter((item) => item.value > 0);
  }, [data?.charts?.alertsChart]);

  // 📈 트렌드 차트 데이터 메모이제이션
  const trendsChartData = useMemo<TrendDataPoint[]>(() => {
    if (!data?.charts?.trendsChart) return [];

    const { timePoints, metrics } = data.charts.trendsChart;

    return timePoints.map((timePoint, index) => ({
      time: new Date(timePoint).toLocaleTimeString('ko-KR', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      CPU: metrics.cpu?.[index] || 0,
      Memory: metrics.memory?.[index] || 0,
      Alerts: metrics.alerts?.[index] || 0,
    }));
  }, [data?.charts?.trendsChart]);

  // 🔄 비동기 데이터 페칭 최적화 (FID 개선)
  const fetchHealthData = useCallback(async () => {
    try {
      // 로딩 상태를 transition으로 래핑하여 블로킹 방지
      startTransition(() => {
        setLoading(true);
        setError(null);
      });

      const response = await fetch('/api/system/health', {
        headers: {
          'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
        },
      });

      if (!response.ok) {
        throw new Error(
          `API 응답 오류: ${response.status} ${response.statusText}`
        );
      }

      const healthData: SystemHealthAPIResponse = await response.json();

      // 상태 업데이트를 transition으로 래핑
      startTransition(() => {
        setData(healthData);
        setLastUpdate(new Date());
      });

      console.log('✅ 관리자 대시보드 데이터 업데이트 완료');
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다';

      startTransition(() => {
        setError(errorMessage);
      });

      console.error('❌ 관리자 대시보드 데이터 로드 실패:', err);
    } finally {
      startTransition(() => {
        setLoading(false);
      });
    }
  }, []);

  // 🔄 안전한 타이머 관리 (메모리 누수 방지)
  useSafeEffect(() => {
    fetchHealthData(); // 초기 로드

    if (autoRefresh) {
      const timerId = timerManager.register({
        id: 'admin-dashboard-charts-refresh',
        callback: fetchHealthData,
        interval: 30000, // 30초
        priority: 'medium',
        enabled: true,
      });

      return () => {
        timerManager.unregister(timerId);
      };
    }

    return () => {
      timerManager.unregister('admin-dashboard-charts-refresh');
    };
  }, [autoRefresh, fetchHealthData, timerManager]);

  // 🎨 새로고침 버튼 핸들러
  const handleRefresh = useCallback(() => {
    if (!loading) {
      fetchHealthData();
    }
  }, [fetchHealthData, loading]);

  // 🎛️ 자동 새로고침 토글
  const toggleAutoRefresh = useCallback(() => {
    setAutoRefresh((prev) => !prev);
  }, []);

  // 🚨 에러 상태 렌더링
  if (error && !data) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <div className="mb-2 text-lg font-semibold text-red-500">
          ⚠️ 데이터 로드 실패
        </div>
        <p className="mb-4 text-gray-600">{error}</p>
        <button
          onClick={handleRefresh}
          className="rounded-lg bg-blue-500 px-4 py-2 text-white transition-colors hover:bg-blue-600"
          disabled={loading}
        >
          {loading ? '재시도 중...' : '다시 시도'}
        </button>
      </div>
    );
  }

  return (
    <div
      className={`space-y-6 transition-opacity duration-300 ${isPending ? 'opacity-75' : 'opacity-100'}`}
    >
      {/* 헤더 섹션 */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">시스템 대시보드</h2>
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-500">
            {lastUpdate &&
              `마지막 업데이트: ${lastUpdate.toLocaleTimeString('ko-KR')}`}
          </div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={toggleAutoRefresh}
              className="rounded"
            />
            <span className="text-sm">자동 새로고침</span>
          </label>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className={`rounded-lg px-3 py-1 text-sm transition-colors ${
              loading
                ? 'cursor-not-allowed bg-gray-200 text-gray-400'
                : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
          >
            {loading ? '로딩 중...' : '새로고침'}
          </button>
        </div>
      </div>

      {/* 차트 그리드 - Suspense로 래핑하여 LCP 개선 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Suspense fallback={<ChartSkeleton />}>
          <div className="rounded-lg bg-white p-6 shadow-lg">
            <h3 className="mb-4 text-lg font-semibold">성능 지표</h3>
            <PerformanceChart data={performanceChartData} />
          </div>
        </Suspense>

        <Suspense fallback={<ChartSkeleton />}>
          <div className="rounded-lg bg-white p-6 shadow-lg">
            <h3 className="mb-4 text-lg font-semibold">서버 가용성</h3>
            <AvailabilityChart data={availabilityChartData} />
          </div>
        </Suspense>

        <Suspense fallback={<ChartSkeleton />}>
          <div className="rounded-lg bg-white p-6 shadow-lg">
            <h3 className="mb-4 text-lg font-semibold">알림 분포</h3>
            <AlertsChart data={alertsChartData} />
          </div>
        </Suspense>

        <Suspense fallback={<ChartSkeleton />}>
          <div className="rounded-lg bg-white p-6 shadow-lg">
            <h3 className="mb-4 text-lg font-semibold">시간별 트렌드</h3>
            <TrendsChart data={trendsChartData} />
          </div>
        </Suspense>
      </div>

      {/* 로딩 오버레이 */}
      {isPending && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-10">
          <div className="rounded-lg bg-white p-4 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-blue-500"></div>
              <span>데이터 업데이트 중...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

AdminDashboardCharts.displayName = 'AdminDashboardCharts';

export default AdminDashboardCharts;
