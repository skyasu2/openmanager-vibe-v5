'use client';

/**
 * 🎯 MiniLineChart - recharts 기반 미니 라인 차트
 *
 * 서버 카드용 소형 라인 그래프
 * - Sparkline 대체 컴포넌트
 * - recharts LineChart 사용
 * - 히스토리 데이터 시각화
 *
 * @see Sparkline.tsx - 레거시 SVG 기반 컴포넌트
 */

import type React from 'react';
import { useMemo } from 'react';
import { Area, AreaChart, Tooltip, YAxis } from 'recharts';

interface MiniLineChartProps {
  /** 데이터 배열 (숫자 또는 {time, value} 객체) */
  data: number[] | Array<{ time: string; value: number }>;
  /** 차트 너비 (기본: 100) */
  width?: number;
  /** 차트 높이 (기본: 30) */
  height?: number;
  /** 선 색상 (기본: #3b82f6) */
  color?: string;
  /** 선 두께 (기본: 2) */
  strokeWidth?: number;
  /** 영역 채우기 여부 (기본: false) */
  fill?: boolean;
  /** 툴팁 표시 여부 (기본: false) */
  showTooltip?: boolean;
  /** 애니메이션 비활성화 (기본: true - 성능 최적화) */
  disableAnimation?: boolean;
  /** 시작/끝 레이블 표시 여부 (기본: false) */
  showLabels?: boolean;
}

interface ChartDataPoint {
  index: number;
  value: number;
  time?: string;
}

interface TooltipPayloadItem {
  payload: ChartDataPoint;
  value: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
}

/**
 * 커스텀 툴팁 컴포넌트
 */
const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload }) => {
  if (!active || !payload || payload.length === 0) return null;

  const data = payload[0]?.payload;
  if (!data) return null;

  return (
    <div className="rounded-md bg-gray-900 px-2 py-1 text-xs text-white shadow-lg">
      {data.time && <div className="text-gray-400">{data.time}</div>}
      <div className="font-medium">{data.value.toFixed(1)}%</div>
    </div>
  );
};

/**
 * MiniLineChart 컴포넌트
 *
 * @example
 * ```tsx
 * // 숫자 배열 사용
 * <MiniLineChart data={[10, 20, 30, 40]} color="#10b981" fill />
 *
 * // 시간 데이터 사용
 * <MiniLineChart
 *   data={[{ time: '10:00', value: 45 }, { time: '10:01', value: 52 }]}
 *   showTooltip
 * />
 * ```
 */
export const MiniLineChart: React.FC<MiniLineChartProps> = ({
  data,
  width = 100,
  height = 30,
  color = '#3b82f6',
  strokeWidth = 2,
  fill = false,
  showTooltip = false,
  disableAnimation = true,
  showLabels = false,
}) => {
  // 데이터 변환: number[] → ChartDataPoint[]
  const chartData = useMemo((): ChartDataPoint[] => {
    if (!data || data.length === 0) return [];

    // 이미 객체 형태인 경우
    if (typeof data[0] === 'object' && 'value' in data[0]) {
      return (data as Array<{ time: string; value: number }>).map(
        (item, index) => ({
          index,
          value: item.value,
          time: item.time,
        })
      );
    }

    // 숫자 배열인 경우
    return (data as number[]).map((value, index) => ({
      index,
      value,
    }));
  }, [data]);

  // 최소 2개 데이터 포인트 필요
  if (chartData.length < 2) {
    return (
      <div
        style={{ width, height }}
        className="flex items-center justify-center text-xs text-gray-400"
      >
        --
      </div>
    );
  }

  // 시작/끝 값 계산
  const firstValue = chartData[0]?.value ?? 0;
  const lastValue = chartData[chartData.length - 1]?.value ?? 0;

  // ResponsiveContainer 제거 - flex 컨테이너 내 크기 계산 이슈 해결
  // 고정 크기 AreaChart 직접 사용으로 -1 width/height 경고 해결
  return (
    <div className="relative flex items-center gap-1">
      {/* 시작 값 레이블 */}
      {showLabels && (
        <span className="text-2xs font-bold tabular-nums text-gray-500 shrink-0">
          {Math.round(firstValue)}
        </span>
      )}

      <AreaChart
        width={width}
        height={height}
        data={chartData}
        margin={{ top: 2, right: 2, bottom: 2, left: 2 }}
      >
        {/* Y축 고정 도메인 [0, 100] - 퍼센트 값 일관된 시각화 */}
        <YAxis domain={[0, 100]} hide />
        {showTooltip && (
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ stroke: color, strokeWidth: 1, strokeOpacity: 0.3 }}
          />
        )}
        <Area
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={strokeWidth}
          fill={fill ? color : 'transparent'}
          fillOpacity={fill ? 0.15 : 0}
          isAnimationActive={!disableAnimation}
          animationDuration={300}
          dot={false}
          activeDot={
            showTooltip
              ? { r: 3, fill: color, stroke: '#fff', strokeWidth: 1 }
              : false
          }
        />
      </AreaChart>

      {/* 끝 값 레이블 */}
      {showLabels && (
        <span className="text-2xs font-bold tabular-nums text-gray-500 shrink-0">
          {Math.round(lastValue)}
        </span>
      )}
    </div>
  );
};

export default MiniLineChart;
