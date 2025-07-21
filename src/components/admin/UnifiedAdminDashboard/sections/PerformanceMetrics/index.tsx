/**
 * 🎯 성능 메트릭 섹션
 *
 * 시스템 성능 차트 및 통계 표시
 */

import { motion } from 'framer-motion';
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
      <div className='bg-white dark:bg-gray-800 rounded-lg shadow-md p-6'>
        <div className='animate-pulse'>
          <div className='h-4 bg-gray-200 rounded w-1/4 mb-4'></div>
          <div className='h-64 bg-gray-200 rounded'></div>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* 성능 요약 */}
      <div className='bg-white dark:bg-gray-800 rounded-lg shadow-md p-6'>
        <div className='flex items-center justify-between mb-6'>
          <h3 className='text-lg font-semibold'>성능 메트릭</h3>
          <div className='flex gap-2'>
            <button
              onClick={() => onExport('csv')}
              className='flex items-center gap-2 px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors'
            >
              <Download className='w-4 h-4' />
              CSV
            </button>
            <button
              onClick={() => onExport('json')}
              className='flex items-center gap-2 px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors'
            >
              <Download className='w-4 h-4' />
              JSON
            </button>
          </div>
        </div>

        {/* 메트릭 카드 */}
        <div className='grid grid-cols-1 md:grid-cols-4 gap-4 mb-6'>
          <MetricCard
            label='평균 응답 시간'
            value={`${performanceData.metrics.avgResponseTime}ms`}
            trend={
              performanceData.metrics.avgResponseTime < 200 ? 'up' : 'down'
            }
            icon={<Activity className='w-4 h-4' />}
          />
          <MetricCard
            label='성공률'
            value={`${performanceData.metrics.successRate}%`}
            trend={performanceData.metrics.successRate > 95 ? 'up' : 'down'}
            icon={<TrendingUp className='w-4 h-4' />}
          />
          <MetricCard
            label='에러율'
            value={`${performanceData.metrics.errorRate}%`}
            trend={performanceData.metrics.errorRate < 5 ? 'up' : 'down'}
            icon={<TrendingDown className='w-4 h-4' />}
          />
          <MetricCard
            label='폴백율'
            value={`${performanceData.metrics.fallbackRate}%`}
            trend={performanceData.metrics.fallbackRate < 10 ? 'up' : 'down'}
            icon={<Activity className='w-4 h-4' />}
          />
        </div>

        {/* 차트 플레이스홀더 */}
        <div className='h-64 bg-gray-50 dark:bg-gray-700 rounded-lg flex items-center justify-center'>
          <p className='text-gray-500 dark:text-gray-400'>
            차트 컴포넌트는 별도로 구현 필요
          </p>
        </div>
      </div>

      {/* 성능 점수 */}
      <div className='bg-white dark:bg-gray-800 rounded-lg shadow-md p-6'>
        <h3 className='text-lg font-semibold mb-4'>성능 점수</h3>
        <div className='relative h-20 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden'>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${performanceData.score}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className={`absolute h-full ${
              performanceData.score >= 90
                ? 'bg-green-500'
                : performanceData.score >= 70
                  ? 'bg-yellow-500'
                  : 'bg-red-500'
            }`}
          />
          <div className='absolute inset-0 flex items-center justify-center'>
            <span className='text-2xl font-bold text-gray-900 dark:text-white'>
              {performanceData.score}%
            </span>
          </div>
        </div>
        <p className='text-sm text-gray-600 dark:text-gray-400 mt-2'>
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
  icon: React.ReactNode;
}

function MetricCard({ label, value, trend, icon }: MetricCardProps) {
  return (
    <div className='bg-gray-50 dark:bg-gray-700 p-4 rounded-lg'>
      <div className='flex items-center justify-between mb-2'>
        <div className='text-gray-600 dark:text-gray-400'>{icon}</div>
        <div className={trend === 'up' ? 'text-green-500' : 'text-red-500'}>
          {trend === 'up' ? '↑' : '↓'}
        </div>
      </div>
      <p className='text-sm text-gray-600 dark:text-gray-400'>{label}</p>
      <p className='text-xl font-semibold text-gray-900 dark:text-white'>
        {value}
      </p>
    </div>
  );
}
