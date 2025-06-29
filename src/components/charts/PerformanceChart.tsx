/**
 * 📊 Performance Chart Component (성능 최적화 + 접근성 개선)
 *
 * ✅ 실시간 시스템 자원 사용률 차트
 * ✅ 단일 책임: 성능 데이터 시각화만 담당
 * ✅ SOLID 원칙 적용
 * ⚡ React.memo, useMemo, useCallback 성능 최적화 적용
 * ♿ WCAG 2.1 AA 접근성 준수
 */

import { TrendingUp } from 'lucide-react';
import { memo, useCallback, useMemo } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { COLORS } from '../../constants/chartColors';
import type { ChartDataPoint, CustomTooltipProps } from '../../types/dashboard';

interface PerformanceChartProps {
  data: ChartDataPoint[];
  title?: string;
  height?: number;
  showTitle?: boolean;
  isLoading?: boolean;
  className?: string;
  isMobile?: boolean; // 📱 모바일 최적화용 prop 추가
}

// 🎪 커스텀 툴팁 컴포넌트 (메모이제이션)
const CustomTooltip = memo<CustomTooltipProps>(({ active, payload, label }) => {
  if (active && payload && payload.length > 0) {
    const data = payload[0];
    return (
      <div
        className='bg-white p-3 border border-gray-200 rounded-lg shadow-lg min-w-[120px] sm:min-w-[150px]'
        role='tooltip'
        aria-live='polite'
      >
        <p
          className='font-medium text-gray-900 text-sm sm:text-base'
          aria-label={`시간: ${label}`}
        >
          {label}
        </p>
        <p
          className='text-xs sm:text-sm'
          style={{ color: data.color }}
          aria-label={`사용률: ${data.value}%`}
        >
          사용률: <span className='font-semibold'>{data.value}%</span>
        </p>
        <div className='mt-1 text-xs text-gray-500' aria-label='사용률 상태'>
          {data.value >= 80
            ? '⚠️ 높음'
            : data.value >= 50
              ? '📊 보통'
              : '✅ 낮음'}
        </div>
      </div>
    );
  }
  return null;
});

CustomTooltip.displayName = 'PerformanceChartTooltip';

// 📊 메인 컴포넌트
const PerformanceChart = memo<PerformanceChartProps>(
  ({
    data,
    title = '시스템 성능',
    height = 300,
    showTitle = true,
    isLoading = false,
    className = '',
    isMobile = false,
  }) => {
    // 🎯 성능 분석 (메모이제이션)
    const performanceAnalysis = useMemo(() => {
      if (!data || data.length === 0) {
        return { avg: 0, max: 0, riskyItems: 0 };
      }

      const values = data.map(item => item.value || 0);
      const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
      const max = Math.max(...values);
      const riskyItems = values.filter(val => val >= 80).length;

      return { avg, max, riskyItems };
    }, [data]);

    // 🎨 셀 색상 결정 함수 (메모이제이션)
    const getCellColor = useCallback((value: number) => {
      if (value >= 80) return COLORS.danger;
      if (value >= 50) return COLORS.warning;
      return COLORS.success;
    }, []);

    // 🔄 로딩 스켈레톤
    if (isLoading) {
      return (
        <div
          className={`bg-white rounded-lg shadow p-4 ${className}`}
          aria-busy='true'
          aria-label='성능 차트 로딩 중'
        >
          {showTitle && (
            <div className='flex items-center gap-2 mb-4'>
              <div className='w-5 h-5 bg-gray-200 rounded animate-pulse' />
              <div className='h-6 bg-gray-200 rounded w-32 animate-pulse' />
            </div>
          )}
          <div className='h-64 bg-gray-100 rounded animate-pulse flex items-center justify-center'>
            <div className='text-gray-400 text-sm'>데이터 로딩 중...</div>
          </div>
        </div>
      );
    }

    // 📊 빈 데이터 상태
    if (!data || data.length === 0) {
      return (
        <div
          className={`bg-white rounded-lg shadow p-4 ${className}`}
          role='img'
          aria-label='성능 데이터가 없습니다'
        >
          {showTitle && (
            <div className='flex items-center gap-2 mb-4'>
              <TrendingUp
                className='w-5 h-5 text-blue-500'
                aria-hidden='true'
              />
              <h3 className='text-lg font-semibold text-gray-900'>{title}</h3>
            </div>
          )}
          <div className='h-64 flex items-center justify-center text-gray-500'>
            <div className='text-center'>
              <div className='text-4xl mb-2' aria-hidden='true'>
                📊
              </div>
              <p>표시할 성능 데이터가 없습니다</p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div
        className={`bg-white rounded-lg shadow p-4 ${className}`}
        role='img'
        aria-label={`시스템 성능 차트. 평균 사용률: ${performanceAnalysis.avg.toFixed(1)}%, 최대 사용률: ${performanceAnalysis.max}%`}
      >
        {showTitle && (
          <div className='flex items-center gap-2 mb-4'>
            <TrendingUp className='w-5 h-5 text-blue-500' aria-hidden='true' />
            <h3
              className='text-lg font-semibold text-gray-900'
              id='performance-chart-title'
            >
              {title}
            </h3>
          </div>
        )}

        <div
          className={`${isMobile ? 'h-48' : 'h-64'} touch-pan-x touch-pan-y`}
          style={{ height: isMobile ? 200 : height }}
          role='presentation'
          aria-labelledby='performance-chart-title'
        >
          <ResponsiveContainer width='100%' height='100%'>
            <BarChart
              data={data}
              margin={{
                top: 5,
                right: isMobile ? 5 : 30,
                left: isMobile ? 5 : 20,
                bottom: 5,
              }}
              accessibilityLayer={true}
            >
              <CartesianGrid strokeDasharray='3 3' opacity={0.3} />
              <XAxis
                dataKey='name'
                tick={{ fontSize: isMobile ? 10 : 12 }}
                aria-label='시간'
              />
              <YAxis
                tick={{ fontSize: isMobile ? 10 : 12 }}
                width={isMobile ? 30 : 40}
                aria-label='사용률 퍼센트'
              />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
                allowEscapeViewBox={{ x: false, y: false }} // 📱 터치 친화적 툴팁 설정
              />
              <Bar dataKey='value' radius={[2, 2, 0, 0]}>
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={getCellColor(entry.value || 0)}
                    aria-label={`${entry.name}: ${entry.value}%`}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 📈 성능 요약 정보 (접근성 개선) */}
        <div
          className={`mt-4 grid ${isMobile ? 'grid-cols-1 gap-2' : 'grid-cols-3 gap-4'} text-sm`}
          role='group'
          aria-label='성능 요약 정보'
        >
          <div className='text-center' role='status' aria-live='polite'>
            <p className='text-gray-500'>평균 사용률</p>
            <p
              className='font-bold text-lg text-blue-600'
              aria-label={`평균 사용률 ${performanceAnalysis.avg.toFixed(1)}퍼센트`}
            >
              {performanceAnalysis.avg.toFixed(1)}%
            </p>
          </div>
          <div className='text-center' role='status' aria-live='polite'>
            <p className='text-gray-500'>최대 사용률</p>
            <p
              className='font-bold text-lg text-orange-600'
              aria-label={`최대 사용률 ${performanceAnalysis.max}퍼센트`}
            >
              {performanceAnalysis.max}%
            </p>
          </div>
          <div className='text-center' role='status' aria-live='polite'>
            <p className='text-gray-500'>위험 항목</p>
            <p
              className='font-bold text-lg text-red-600'
              aria-label={`위험 항목 ${performanceAnalysis.riskyItems}개`}
            >
              {performanceAnalysis.riskyItems}개
            </p>
          </div>
        </div>
      </div>
    );
  }
);

PerformanceChart.displayName = 'PerformanceChart';

export default PerformanceChart;
