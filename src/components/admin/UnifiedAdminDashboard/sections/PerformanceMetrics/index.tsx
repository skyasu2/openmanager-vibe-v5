/**
 * 🎯 성능 메트릭 섹션
 *
 * 시스템 성능 차트 및 통계 표시
 */

// framer-motion 제거 - CSS 애니메이션 사용
import { Download, TrendingUp, TrendingDown, Activity } from 'lucide-react';
import type {
  SystemStatus,
  PerformanceChartData,
} from '../../UnifiedAdminDashboard.types';

interface PerformanceMetricsProps {
  performanceData: SystemStatus['performance'];
  chartData: PerformanceChartData;
  onExport: (format: 'csv' | 'json') => void;
  isLoading?: boolean;
}

export default function PerformanceMetrics({
  performanceData,
  chartData: _chartData,
  onExport,
  isLoading = false,
}: PerformanceMetricsProps) {
  if (isLoading) {
    return (
      <div className="rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
        <div className="_animate-pulse">
          <div className="mb-4 h-4 w-1/4 rounded bg-gray-200"></div>
          <div className="h-64 rounded bg-gray-200"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 성능 요약 */}
      <div className="rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-lg font-semibold">성능 메트릭</h3>
          <div className="flex gap-2">
            <button
              onClick={() => onExport('csv')}
              className="flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-1 text-sm transition-colors hover:bg-gray-200"
            >
              <Download className="h-4 w-4" />
              CSV
            </button>
            <button
              onClick={() => onExport('json')}
              className="flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-1 text-sm transition-colors hover:bg-gray-200"
            >
              <Download className="h-4 w-4" />
              JSON
            </button>
          </div>
        </div>

        {/* 메트릭 카드 */}
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
          <MetricCard
            label="평균 응답 시간"
            value={`${performanceData.metrics.avgResponseTime}ms`}
            trend={
              performanceData.metrics.avgResponseTime < 200 ? 'up' : 'down'
            }
            icon={<Activity className="h-4 w-4" />}
          />
          <MetricCard
            label="성공률"
            value={`${performanceData.metrics.successRate}%`}
            trend={performanceData.metrics.successRate > 95 ? 'up' : 'down'}
            icon={<TrendingUp className="h-4 w-4" />}
          />
          <MetricCard
            label="에러율"
            value={`${performanceData.metrics.errorRate}%`}
            trend={performanceData.metrics.errorRate < 5 ? 'up' : 'down'}
            icon={<TrendingDown className="h-4 w-4" />}
          />
          <MetricCard
            label="폴백율"
            value={`${performanceData.metrics.fallbackRate}%`}
            trend={performanceData.metrics.fallbackRate < 10 ? 'up' : 'down'}
            icon={<Activity className="h-4 w-4" />}
          />
        </div>

        {/* 차트 플레이스홀더 */}
        <div className="flex h-64 items-center justify-center rounded-lg bg-gray-50 dark:bg-gray-700">
          <p className="text-gray-500 dark:text-gray-400">
            차트 컴포넌트는 별도로 구현 필요
          </p>
        </div>
      </div>

      {/* 성능 점수 */}
      <div className="rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
        <h3 className="mb-4 text-lg font-semibold">성능 점수</h3>
        <div className="relative h-20 overflow-hidden rounded-lg bg-gray-200 dark:bg-gray-700">
          <div
            className={`absolute h-full ${
              performanceData.score >= 90
                ? 'bg-green-500'
                : performanceData.score >= 70
                  ? 'bg-yellow-500'
                  : 'bg-red-500'
            }`}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              {performanceData.score}%
            </span>
          </div>
        </div>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          {performanceData.score >= 90
            ? '성능이 매우 우수합니다'
            : performanceData.score >= 70
              ? '성능이 양호합니다'
              : '성능 개선이 필요합니다'}
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// 메트릭 카드 컴포넌트
// ============================================================================

interface MetricCardProps {
  label: string;
  value: string;
  trend: 'up' | 'down';
  icon: ReactNode;
}

function MetricCard({ label, value, trend, icon }: MetricCardProps) {
  return (
    <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-700">
      <div className="mb-2 flex items-center justify-between">
        <div className="text-gray-600 dark:text-gray-400">{icon}</div>
        <div className={trend === 'up' ? 'text-green-500' : 'text-red-500'}>
          {trend === 'up' ? '↑' : '↓'}
        </div>
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400">{label}</p>
      <p className="text-xl font-semibold text-gray-900 dark:text-white">
        {value}
      </p>
    </div>
  );
}
