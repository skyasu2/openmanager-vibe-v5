/**
 * 📊 Availability Chart Component (성능 최적화 + 접근성 개선)
 *
 * ✅ 서버 가용성 도넛 차트
 * ✅ 단일 책임: 가용성 데이터 시각화만 담당
 * ✅ SOLID 원칙 적용
 * ⚡ React.memo, useMemo, useCallback 성능 최적화 적용
 * ♿ WCAG 2.1 AA 접근성 준수
 */

import { Activity, Loader2, Shield } from 'lucide-react';
import { memo, useMemo } from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { CHART_COLORS } from '../../constants/chartColors';
import type { ChartDataPoint, CustomTooltipProps } from '../../types/dashboard';

// 📊 가용성 데이터 타입 정의
interface AvailabilityData extends ChartDataPoint {
  percentage?: string;
}

interface AvailabilityChartProps {
  data: AvailabilityData[];
  title?: string;
  height?: number;
  showTitle?: boolean;
  isLoading?: boolean;
  className?: string;
  slaTarget?: number; // SLA 목표 (기본 99.9%)
  isMobile?: boolean; // 📱 모바일 최적화용 prop 추가
}

// 🎪 커스텀 툴팁 컴포넌트 (메모이제이션)
const CustomTooltip = memo<CustomTooltipProps>(({ active, payload }) => {
  if (active && payload && payload.length > 0) {
    const data = payload[0];
    const value = data.value;
    const name = data.name || '';

    const totalValue = payload.reduce(
      (sum, item) => sum + (item.value || 0),
      0
    );
    const percentage =
      totalValue > 0 ? ((value / totalValue) * 100).toFixed(1) : '0.0';

    return (
      <div
        className='bg-white p-3 border border-gray-200 rounded-lg shadow-lg min-w-[120px] sm:min-w-[150px]'
        role='tooltip'
        aria-live='polite'
      >
        <p className='font-medium text-gray-900 flex items-center gap-2 text-sm sm:text-base'>
          <Activity className='w-3 h-3 sm:w-4 sm:h-4' aria-hidden='true' />
          <span aria-label={`서버 상태: ${name}`}>{name}</span>
        </p>
        <p
          className='text-xs sm:text-sm text-gray-600 mt-1'
          aria-label={`서버 수: ${value}개`}
        >
          서버 수: <span className='font-semibold'>{value}개</span>
        </p>
        <p
          className='text-xs sm:text-sm text-gray-500'
          aria-label={`비율: ${percentage}퍼센트`}
        >
          비율: <span className='font-semibold'>{percentage}%</span>
        </p>
      </div>
    );
  }
  return null;
});

CustomTooltip.displayName = 'AvailabilityChartTooltip';

// 📊 메인 컴포넌트
const AvailabilityChart = memo<AvailabilityChartProps>(
  ({
    data,
    title = '서버 가용성',
    height = 300,
    showTitle = true,
    isLoading = false,
    className = '',
    slaTarget = 99.9,
    isMobile = false,
  }) => {
    // 🎨 가용성 상태 메시지 (메모이제이션)
    const getAvailabilityStatus = useMemo(() => {
      return (rate: number) => {
        if (rate >= 99.5)
          return { text: '우수', color: 'text-green-600', icon: '🟢' };
        if (rate >= 95)
          return { text: '양호', color: 'text-blue-600', icon: '🔵' };
        if (rate >= 90)
          return { text: '주의', color: 'text-yellow-600', icon: '🟡' };
        return { text: '위험', color: 'text-red-600', icon: '🔴' };
      };
    }, []);

    // 📊 가용성 분석 (메모이제이션)
    const availabilityAnalysis = useMemo(() => {
      if (!data || data.length === 0) {
        return { total: 0, online: 0, rate: 0, slaStatus: 'unknown' };
      }

      const online = data.find(item => item.name === '온라인')?.value || 0;
      const total = data.reduce((sum, item) => sum + (item.value || 0), 0);
      const rate = total > 0 ? (online / total) * 100 : 0;
      const slaStatus =
        rate >= slaTarget
          ? 'excellent'
          : rate >= 95
            ? 'good'
            : rate >= 90
              ? 'warning'
              : 'critical';

      return { total, online, rate, slaStatus };
    }, [data, slaTarget]);

    // 🔄 로딩 스켈레톤
    if (isLoading) {
      return (
        <div
          className={`bg-white rounded-lg shadow p-4 ${className}`}
          aria-busy='true'
          aria-label='가용성 차트 로딩 중'
        >
          {showTitle && (
            <div className='flex items-center gap-2 mb-4'>
              <Loader2
                className='w-5 h-5 animate-spin text-blue-500'
                aria-hidden='true'
              />
              <div className='h-6 bg-gray-200 rounded w-32 animate-pulse' />
            </div>
          )}
          <div className='h-64 bg-gray-100 rounded animate-pulse flex items-center justify-center'>
            <div className='text-gray-400 text-sm'>
              가용성 데이터 로딩 중...
            </div>
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
          aria-label='가용성 데이터가 없습니다'
        >
          {showTitle && (
            <div className='flex items-center gap-2 mb-4'>
              <Shield className='w-5 h-5 text-blue-500' aria-hidden='true' />
              <h3 className='text-lg font-semibold text-gray-900'>{title}</h3>
            </div>
          )}
          <div className='h-64 flex items-center justify-center text-gray-500'>
            <div className='text-center'>
              <div className='text-4xl mb-2' aria-hidden='true'>
                🛡️
              </div>
              <p>표시할 가용성 데이터가 없습니다</p>
            </div>
          </div>
        </div>
      );
    }

    const statusInfo = getAvailabilityStatus(availabilityAnalysis.rate);

    return (
      <div
        className={`bg-white rounded-lg shadow p-4 ${className}`}
        role='img'
        aria-label={`서버 가용성 차트. 가용률: ${availabilityAnalysis.rate.toFixed(1)}%, 온라인 서버: ${availabilityAnalysis.online}개, 총 서버: ${availabilityAnalysis.total}개`}
      >
        {showTitle && (
          <div className='flex items-center gap-2 mb-4'>
            <Shield className='w-5 h-5 text-blue-500' aria-hidden='true' />
            <h3
              className='text-lg font-semibold text-gray-900'
              id='availability-chart-title'
            >
              {title}
            </h3>
          </div>
        )}

        <div
          className={`relative ${isMobile ? 'h-48' : 'h-64'} touch-pan-x touch-pan-y`}
          style={{ height: isMobile ? 200 : height }}
          role='presentation'
          aria-labelledby='availability-chart-title'
        >
          <ResponsiveContainer width='100%' height='100%'>
            <PieChart accessibilityLayer={true}>
              <Pie
                data={data}
                cx='50%'
                cy='50%'
                innerRadius={isMobile ? 40 : 60}
                outerRadius={isMobile ? 70 : 100}
                paddingAngle={2}
                dataKey='value'
              >
                {data.map((entry, index) => {
                  const englishKey =
                    entry.name === '온라인'
                      ? 'online'
                      : entry.name === '오프라인'
                        ? 'offline'
                        : 'unknown';

                  return (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        CHART_COLORS.availability[
                          englishKey as keyof typeof CHART_COLORS.availability
                        ]
                      }
                      aria-label={`${entry.name}: ${entry.value}개 서버`}
                    />
                  );
                })}
              </Pie>
              <Tooltip
                content={<CustomTooltip />}
                allowEscapeViewBox={{ x: false, y: false }}
              />
            </PieChart>
          </ResponsiveContainer>

          {/* 중앙 정보 표시 (접근성 개선) */}
          <div
            className='absolute inset-0 flex items-center justify-center pointer-events-none'
            aria-live='polite'
            role='status'
          >
            <div className='text-center'>
              <div
                className={`text-2xl sm:text-3xl font-bold ${statusInfo.color}`}
                aria-label={`가용률 ${availabilityAnalysis.rate.toFixed(1)}퍼센트`}
              >
                {availabilityAnalysis.rate.toFixed(1)}%
              </div>
              <div
                className='text-xs sm:text-sm text-gray-500 mt-1'
                aria-label={`상태: ${statusInfo.text}`}
              >
                <span aria-hidden='true'>{statusInfo.icon}</span>{' '}
                {statusInfo.text}
              </div>
              <div
                className='text-xs text-gray-400 mt-1'
                aria-label={`목표: ${slaTarget}퍼센트 SLA`}
              >
                목표: {slaTarget}% SLA
              </div>
            </div>
          </div>
        </div>

        {/* 📊 상세 정보 (접근성 개선) */}
        <div
          className={`mt-4 grid ${isMobile ? 'grid-cols-1 gap-2' : 'grid-cols-2 gap-4'} text-sm`}
          role='group'
          aria-label='가용성 상세 정보'
        >
          <div className='text-center' role='status' aria-live='polite'>
            <p className='text-gray-500'>온라인 서버</p>
            <p
              className='font-bold text-lg text-green-600'
              aria-label={`온라인 서버 ${availabilityAnalysis.online}개`}
            >
              {availabilityAnalysis.online}개
            </p>
          </div>
          <div className='text-center' role='status' aria-live='polite'>
            <p className='text-gray-500'>총 서버</p>
            <p
              className='font-bold text-lg text-blue-600'
              aria-label={`총 서버 ${availabilityAnalysis.total}개`}
            >
              {availabilityAnalysis.total}개
            </p>
          </div>
        </div>
      </div>
    );
  }
);

AvailabilityChart.displayName = 'AvailabilityChart';

export default AvailabilityChart;
