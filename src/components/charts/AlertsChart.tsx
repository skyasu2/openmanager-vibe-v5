/**
 * 🚨 Alerts Chart Component (성능 최적화 적용)
 *
 * ✅ 시스템 알림 및 이벤트 차트
 * ✅ 단일 책임: 알림 데이터 시각화만 담당
 * ✅ SOLID 원칙 적용
 * ⚡ React.memo, useMemo, useCallback 성능 최적화 적용
 */

import {
  AlertTriangle,
  Bell,
  CheckCircle,
  Clock,
  Info,
  TrendingDown,
  TrendingUp,
  XCircle,
} from 'lucide-react';
import { memo, useCallback, useMemo } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { SEVERITY_COLORS } from '../../constants/chartColors';
import type { ChartDataPoint, CustomTooltipProps } from '../../types/dashboard';

interface AlertsChartProps {
  data: ChartDataPoint[];
  title?: string;
  height?: number;
  showTitle?: boolean;
  isLoading?: boolean;
  className?: string;
  chartType?: 'line' | 'area';
  alertThreshold?: number; // 알림 임계치 (기본 10)
  showThreshold?: boolean;
  isMobile?: boolean; // 📱 모바일 최적화용 prop 추가
}

// 🎪 커스텀 툴팁 컴포넌트 (메모이제이션)
const CustomTooltip = memo<CustomTooltipProps>(({ active, payload, label }) => {
  if (active && payload && payload.length > 0) {
    const data = payload[0];
    const alertCount = data.value;

    // 심각도 판정
    const getSeverityInfo = (count: number) => {
      if (count >= 20)
        return {
          severity: 'critical',
          icon: XCircle,
          text: '심각',
          color: 'text-red-600',
        };
      if (count >= 10)
        return {
          severity: 'high',
          icon: AlertTriangle,
          text: '높음',
          color: 'text-orange-600',
        };
      if (count >= 5)
        return {
          severity: 'medium',
          icon: Bell,
          text: '보통',
          color: 'text-yellow-600',
        };
      if (count > 0)
        return {
          severity: 'low',
          icon: Info,
          text: '낮음',
          color: 'text-blue-600',
        };
      return {
        severity: 'none',
        icon: CheckCircle,
        text: '정상',
        color: 'text-green-600',
      };
    };

    const severityInfo = getSeverityInfo(alertCount);
    const SeverityIcon = severityInfo.icon;

    return (
      <div className='bg-white p-3 border border-gray-200 rounded-lg shadow-lg min-w-[120px] sm:min-w-[150px]'>
        <p className='font-medium text-gray-900 flex items-center gap-2 text-sm sm:text-base'>
          <Clock className='w-3 h-3 sm:w-4 sm:h-4' />
          {label}
        </p>
        <p className='text-xs sm:text-sm mt-1'>
          <span className='text-gray-600'>알림 수: </span>
          <span className='font-semibold'>{alertCount}개</span>
        </p>
        <div
          className={`mt-1 text-xs flex items-center gap-1 ${severityInfo.color}`}
        >
          <SeverityIcon className='w-3 h-3' />
          <span>심각도: {severityInfo.text}</span>
        </div>
      </div>
    );
  }
  return null;
});
CustomTooltip.displayName = 'CustomTooltip';

// 📊 로딩 스켈레톤 컴포넌트 (메모이제이션)
const LoadingSkeleton = memo<{ height: number }>(({ height }) => (
  <div className='animate-pulse' style={{ height }}>
    <div className='h-4 bg-gray-200 rounded w-1/3 mb-4'></div>
    <div className='space-y-3'>
      <div className='h-8 bg-gray-200 rounded'></div>
      <div className='h-12 bg-gray-300 rounded'></div>
      <div className='h-16 bg-gray-200 rounded'></div>
      <div className='h-10 bg-gray-300 rounded'></div>
    </div>
  </div>
));
LoadingSkeleton.displayName = 'LoadingSkeleton';

// 📈 빈 데이터 상태 컴포넌트 (메모이제이션)
const EmptyState = memo<{ height: number }>(({ height }) => (
  <div
    className='flex items-center justify-center text-gray-500'
    style={{ height }}
  >
    <div className='text-center'>
      <Bell className='w-12 h-12 mx-auto mb-2 text-gray-300' />
      <p className='text-sm'>알림 데이터가 없습니다</p>
    </div>
  </div>
));
EmptyState.displayName = 'EmptyState';

// 🎯 상태별 아이콘 컴포넌트 (메모이제이션)
const StatusIcon = memo<{ status: string; className?: string }>(
  ({ status, className = 'w-4 h-4' }) => {
    const iconMap = {
      critical: XCircle,
      high: AlertTriangle,
      medium: Bell,
      low: Info,
      stable: CheckCircle,
      increasing: TrendingUp,
      decreasing: TrendingDown,
    };

    const Icon = iconMap[status as keyof typeof iconMap] || Bell;
    return <Icon className={className} />;
  }
);
StatusIcon.displayName = 'StatusIcon';

export const AlertsChart = memo<AlertsChartProps>(
  ({
    data,
    title = '시스템 알림',
    height,
    showTitle = true,
    isLoading = false,
    className = '',
    chartType = 'area',
    alertThreshold = 10,
    showThreshold = true,
    isMobile = false,
  }) => {
    // 📱 반응형 높이 설정 (메모이제이션)
    const responsiveHeight = useMemo(() => {
      if (height) return height;
      return isMobile ? 200 : 264; // 모바일에서는 더 작은 높이
    }, [height, isMobile]);

    // 🔍 데이터 유효성 검증 (메모이제이션)
    const hasValidData = useMemo(() => data && data.length > 0, [data]);

    // 📊 알림 분석 (메모이제이션)
    const alertAnalysis = useMemo(() => {
      if (!hasValidData) return null;

      const totalAlerts = data.reduce((sum, item) => sum + item.value, 0);
      const avgAlerts = totalAlerts / data.length;
      const maxAlerts = Math.max(...data.map(item => item.value));
      const minAlerts = Math.min(...data.map(item => item.value));

      // 추이 분석 (마지막 3개 데이터 포인트 기준)
      const recentData = data.slice(-3);
      const trend =
        recentData.length >= 2
          ? recentData[recentData.length - 1].value > recentData[0].value
            ? 'increasing'
            : recentData[recentData.length - 1].value < recentData[0].value
              ? 'decreasing'
              : 'stable'
          : 'stable';

      // 위험 구간 감지 (임계치 초과)
      const dangerousPoints = data.filter(item => item.value >= alertThreshold);

      // 상태 결정
      let status: string;
      let statusMessage: string;
      if (maxAlerts >= 20) {
        status = 'critical';
        statusMessage = '심각한 알림 급증';
      } else if (maxAlerts >= alertThreshold) {
        status = 'high';
        statusMessage = '주의 필요한 상태';
      } else if (avgAlerts >= 5) {
        status = 'medium';
        statusMessage = '보통 수준의 알림';
      } else {
        status = 'low';
        statusMessage = '안정적인 상태';
      }

      return {
        total: totalAlerts,
        average: avgAlerts,
        maximum: maxAlerts,
        minimum: minAlerts,
        trend,
        status,
        statusMessage,
        dangerousPointsCount: dangerousPoints.length,
        exceedsThreshold: maxAlerts >= alertThreshold,
      };
    }, [data, hasValidData, alertThreshold]);

    // 🎨 반응형 차트 마진 설정 (메모이제이션)
    const chartMargin = useMemo(
      () => ({
        top: 20,
        right: isMobile ? 10 : 30,
        left: isMobile ? 10 : 20,
        bottom: 5,
      }),
      [isMobile]
    );

    // 🎯 Y축 도메인 설정 (메모이제이션)
    const yAxisDomain = useMemo(() => {
      if (!hasValidData) return [0, 50];
      const maxValue = Math.max(...data.map(item => item.value));
      return [0, Math.max(maxValue * 1.2, alertThreshold * 1.5)];
    }, [data, hasValidData, alertThreshold]);

    // 🎯 임계치 라인 데이터 (메모이제이션)
    const thresholdLineData = useMemo(() => {
      if (!hasValidData || !showThreshold) return [];
      return data.map(item => ({ ...item, threshold: alertThreshold }));
    }, [data, hasValidData, showThreshold, alertThreshold]);

    // 📱 반응형 텍스트 크기 (메모이제이션)
    const textSizes = useMemo(
      () => ({
        tick: isMobile ? 10 : 12,
        title: isMobile ? 'text-base' : 'text-lg',
        subtitle: isMobile ? 'text-xs' : 'text-sm',
      }),
      [isMobile]
    );

    // 🎯 차트 렌더링 콜백 (메모이제이션)
    const renderChart = useCallback(() => {
      const commonProps = {
        data,
        margin: chartMargin,
      };

      if (chartType === 'area') {
        return (
          <AreaChart {...commonProps}>
            <CartesianGrid strokeDasharray='3 3' stroke='#f0f0f0' />
            <XAxis
              dataKey='name'
              tick={{ fontSize: textSizes.tick }}
              axisLine={{ stroke: '#e0e0e0' }}
              interval={isMobile ? 'preserveStartEnd' : 0} // 📱 모바일에서 라벨 간소화
            />
            <YAxis
              domain={yAxisDomain}
              tick={{ fontSize: textSizes.tick }}
              axisLine={{ stroke: '#e0e0e0' }}
              width={isMobile ? 30 : 40} // 📱 모바일에서 Y축 너비 줄임
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
              allowEscapeViewBox={{ x: false, y: false }} // 📱 터치 친화적 툴팁
            />
            <Area
              type='monotone'
              dataKey='value'
              stroke={SEVERITY_COLORS.medium}
              fill={SEVERITY_COLORS.medium}
              fillOpacity={0.6}
              strokeWidth={2}
            />
            {/* 임계치 라인 */}
            {showThreshold && thresholdLineData.length > 0 && (
              <Line
                type='monotone'
                dataKey='threshold'
                stroke={SEVERITY_COLORS.critical}
                strokeWidth={2}
                strokeDasharray='5 5'
                dot={false}
              />
            )}
          </AreaChart>
        );
      } else {
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray='3 3' stroke='#f0f0f0' />
            <XAxis
              dataKey='name'
              tick={{ fontSize: textSizes.tick }}
              axisLine={{ stroke: '#e0e0e0' }}
              interval={isMobile ? 'preserveStartEnd' : 0} // 📱 모바일에서 라벨 간소화
            />
            <YAxis
              domain={yAxisDomain}
              tick={{ fontSize: textSizes.tick }}
              axisLine={{ stroke: '#e0e0e0' }}
              width={isMobile ? 30 : 40} // 📱 모바일에서 Y축 너비 줄임
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ stroke: 'rgba(59, 130, 246, 0.5)', strokeWidth: 2 }}
              allowEscapeViewBox={{ x: false, y: false }} // 📱 터치 친화적 툴팁
            />
            <Line
              type='monotone'
              dataKey='value'
              stroke={SEVERITY_COLORS.medium}
              strokeWidth={2}
              dot={{ fill: SEVERITY_COLORS.medium, strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, fill: SEVERITY_COLORS.medium }}
            />
            {/* 임계치 라인 */}
            {showThreshold && thresholdLineData.length > 0 && (
              <Line
                type='monotone'
                dataKey='threshold'
                stroke={SEVERITY_COLORS.critical}
                strokeWidth={2}
                strokeDasharray='5 5'
                dot={false}
              />
            )}
          </LineChart>
        );
      }
    }, [
      data,
      chartMargin,
      yAxisDomain,
      textSizes,
      isMobile,
      chartType,
      showThreshold,
      thresholdLineData,
    ]);

    return (
      <div
        className={`bg-white p-3 sm:p-6 rounded-lg shadow-sm border ${className}`}
      >
        {/* 헤더 */}
        {showTitle && (
          <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 space-y-2 sm:space-y-0'>
            <h3
              className={`${textSizes.title} font-semibold text-gray-900 flex items-center gap-2`}
            >
              <Bell className='w-4 h-4 sm:w-5 sm:h-5 text-blue-600' />
              <span className='truncate'>{title}</span>
              {chartType === 'area' && (
                <span className='text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded'>
                  Area
                </span>
              )}
              {chartType === 'line' && (
                <span className='text-xs bg-green-100 text-green-800 px-2 py-1 rounded'>
                  Line
                </span>
              )}
            </h3>

            {/* 상태 및 추이 표시 */}
            {alertAnalysis && (
              <div className='flex items-center gap-2 sm:gap-3'>
                <StatusIcon
                  status={alertAnalysis.status}
                  className='w-3 h-3 sm:w-4 sm:h-4'
                />
                <span className={`${textSizes.subtitle} text-gray-600`}>
                  {alertAnalysis.statusMessage}
                </span>
                <StatusIcon
                  status={alertAnalysis.trend}
                  className='w-3 h-3 sm:w-4 sm:h-4'
                />
              </div>
            )}
          </div>
        )}

        {/* 차트 영역 */}
        <div
          style={{ height: responsiveHeight }}
          className='touch-pan-x touch-pan-y'
        >
          {isLoading ? (
            <LoadingSkeleton height={responsiveHeight} />
          ) : !hasValidData ? (
            <EmptyState height={responsiveHeight} />
          ) : (
            <ResponsiveContainer width='100%' height='100%'>
              {renderChart()}
            </ResponsiveContainer>
          )}
        </div>

        {/* 하단 분석 정보 */}
        {alertAnalysis && hasValidData && (
          <div className='mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-100'>
            <div className='grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 text-center'>
              <div>
                <p className='text-xs text-gray-500'>총 알림</p>
                <p className='text-sm font-semibold text-gray-900'>
                  {alertAnalysis.total}개
                </p>
              </div>
              <div>
                <p className='text-xs text-gray-500'>평균</p>
                <p className='text-sm font-semibold text-blue-600'>
                  {alertAnalysis.average.toFixed(1)}개
                </p>
              </div>
              <div className='col-span-2 sm:col-span-1'>
                <p className='text-xs text-gray-500'>최대</p>
                <p className='text-sm font-semibold text-red-600'>
                  {alertAnalysis.maximum}개
                </p>
              </div>
              <div className='col-span-2 sm:col-span-1'>
                <p className='text-xs text-gray-500'>위험 구간</p>
                <p className='text-sm font-semibold text-yellow-600'>
                  {alertAnalysis.dangerousPointsCount}개
                </p>
              </div>
            </div>

            {/* 상태 메시지 및 임계치 정보 */}
            <div className='mt-2 sm:mt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2'>
              <span
                className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                  alertAnalysis.status === 'critical'
                    ? 'bg-red-100 text-red-800'
                    : alertAnalysis.status === 'high'
                      ? 'bg-orange-100 text-orange-800'
                      : alertAnalysis.status === 'medium'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-green-100 text-green-800'
                }`}
              >
                <StatusIcon status={alertAnalysis.status} className='w-3 h-3' />
                {alertAnalysis.statusMessage}
              </span>

              {showThreshold && (
                <span className='text-xs text-gray-600'>
                  임계치: {alertThreshold}개
                  {alertAnalysis.exceedsThreshold && (
                    <span className='text-red-600 ml-1'>⚠️ 초과</span>
                  )}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }
);

AlertsChart.displayName = 'AlertsChart';

export default AlertsChart;
