/**
 * 📊 Enhanced Server Modal Shared Components
 *
 * Reusable components for the server modal system:
 * - RealtimeChart: Real-time data visualization component
 * - Common UI elements and visualizations
 */

import { type FC } from 'react';

// 🎯 Bundle-Safe Inline 매크로 - getSafe 함수들 (압축 방지)
const getSafeArrayLength = (arr: unknown): number => {
  try {
    if (arr === null || arr === undefined) return 0;
    const arrType = typeof arr;
    if (arrType !== 'object') return 0;
    if (arr === null || arr === undefined) return 0;
    const isArrayResult = Array.isArray(arr);
    if (!isArrayResult) return 0;
    if (!arr || !Array.isArray(arr)) return 0;
    if (!Object.prototype.hasOwnProperty.call(arr, 'length')) return 0;

    const lengthValue = (() => {
      try {
        const tempArr = arr as any[];
        if (!tempArr || !Array.isArray(tempArr)) return 0;
        const tempLength = tempArr.length;
        if (typeof tempLength !== 'number') return 0;
        return tempLength;
      } catch {
        return 0;
      }
    })();

    if (isNaN(lengthValue) || lengthValue < 0) return 0;
    return Math.floor(lengthValue);
  } catch (error) {
    console.error('🛡️ getSafeArrayLength Bundle-Safe error:', error);
    return 0;
  }
};

const getSafeLastArrayItem = <T>(arr: unknown, fallback: T): T => {
  try {
    if (!arr || !Array.isArray(arr) || arr.length === 0) {
      return fallback;
    }
    const lastItem = arr[arr.length - 1];
    return lastItem !== undefined && lastItem !== null ? lastItem : fallback;
  } catch (error) {
    console.error('🛡️ getSafeLastArrayItem Bundle-Safe error:', error);
    return fallback;
  }
};

/**
 * 📈 실시간 차트 컴포넌트 Props
 */
interface RealtimeChartProps {
  /** 차트에 표시할 데이터 배열 (0-100 범위 권장) */
  data: number[];
  /** 차트 선 및 영역 색상 (hex 코드) */
  color: string;
  /** 차트 제목/라벨 */
  label: string;
  /** 차트 높이 (픽셀 단위) */
  height?: number;
}

/**
 * 📊 실시간 차트 컴포넌트
 *
 * SVG 기반의 실시간 데이터 시각화 컴포넌트
 * - 시간순 데이터를 선형 그래프로 표시
 * - 그라데이션 영역 효과 적용
 * - 최신 데이터 포인트 강조
 * - 격자 및 Y축 라벨 표시
 *
 * @param props RealtimeChartProps
 * @returns JSX.Element
 */
export const RealtimeChart: FC<RealtimeChartProps> = ({
  data,
  color,
  label,
  height = 100,
}) => {
  // 🛡️ 베르셀 안전 데이터 길이 확인
  const safeDataLength = getSafeArrayLength(data);
  
  // 데이터 포인트를 SVG 좌표로 변환 - 베르셀 안전 방식
  const points = data
    .map((value, index) => {
      const x = (index / Math.max(safeDataLength - 1, 1)) * 100;
      const y = 100 - Math.max(0, Math.min(100, value));
      return `${x},${y}`;
    })
    .join(' ');

  // 🛡️ 베르셀 안전 마지막 값 추출
  const lastValue = getSafeLastArrayItem(data, 0);

  return (
    <div className="rounded-lg border bg-white p-4 shadow-sm">
      {/* 차트 제목 */}
      <h4 className="mb-2 text-sm font-medium text-gray-700">{label}</h4>

      {/* 차트 영역 */}
      <div className="relative" style={{ height }}>
        <svg
          className="h-full w-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          {/* 그라데이션 정의 */}
          <defs>
            <linearGradient
              id={`area-gradient-${label}`}
              x1="0%"
              y1="0%"
              x2="0%"
              y2="100%"
            >
              <stop offset="0%" stopColor={color} stopOpacity="0.4" />
              <stop offset="100%" stopColor={color} stopOpacity="0.1" />
            </linearGradient>
          </defs>

          {/* 배경 격자 */}
          {[20, 40, 60, 80].map((y) => (
            <line
              key={y}
              x1="0"
              y1={y}
              x2="100"
              y2={y}
              stroke="#f3f4f6"
              strokeWidth="0.5"
            />
          ))}

          {/* 데이터 영역 (그라데이션) */}
          <polygon
            fill={`url(#area-gradient-${label})`}
            points={`0,100 ${points} 100,100`}
          />

          {/* 데이터 선 */}
          <polyline
            fill="none"
            stroke={color}
            strokeWidth="3"
            points={points}
            vectorEffect="non-scaling-stroke"
            className="drop-shadow-sm"
          />

          {/* 최신 값 포인트 강조 - 🛡️ 베르셀 완전 안전 수정 */}
          {safeDataLength > 0 && (
            <circle
              cx={((safeDataLength - 1) / Math.max(safeDataLength - 1, 1)) * 100}
              cy={100 - Math.max(0, Math.min(100, lastValue))}
              r="2"
              fill={color}
              className="drop-shadow-sm"
            />
          )}
        </svg>

        {/* Y축 라벨 */}
        <div className="absolute left-0 top-0 flex h-full flex-col justify-between pr-2 text-xs text-gray-400">
          <span>100</span>
          <span>50</span>
          <span>0</span>
        </div>
      </div>

      {/* 현재 값 표시 - 🛡️ 베르셀 완전 안전 수정 */}
      <div className="mt-1 text-right">
        <span className="text-sm font-bold" style={{ color }}>
          {typeof lastValue === 'number' ? lastValue.toFixed(1) : '0'}%
        </span>
      </div>
    </div>
  );
};

/**
 * 💡 상태 표시 LED 컴포넌트
 */
interface StatusLEDProps {
  /** 상태 ('running' | 'stopped' | 'warning' | 'error') */
  status: 'running' | 'stopped' | 'warning' | 'error';
  /** LED 크기 (픽셀 단위) */
  size?: number;
  /** 애니메이션 활성화 여부 */
  animated?: boolean;
}

export const StatusLED: FC<StatusLEDProps> = ({
  status,
  size = 8,
  animated = true,
}) => {
  const getStatusColor = () => {
    switch (status) {
      case 'running':
        return 'bg-green-500 shadow-green-200';
      case 'stopped':
        return 'bg-red-500 shadow-red-200';
      case 'warning':
        return 'bg-yellow-500 shadow-yellow-200';
      case 'error':
        return 'bg-red-600 shadow-red-300';
      default:
        return 'bg-gray-400 shadow-gray-200';
    }
  };

  return (
    <div
      className={`rounded-full shadow-sm ${getStatusColor()} ${
        animated ? 'animate-pulse' : ''
      }`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
      }}
    />
  );
};

/**
 * 📊 미니 진행률 바 컴포넌트
 */
interface MiniProgressBarProps {
  /** 진행률 (0-100) */
  value: number;
  /** 바 색상 */
  color?: string;
  /** 높이 (픽셀 단위) */
  height?: number;
  /** 배경색 */
  background?: string;
}

export const MiniProgressBar: FC<MiniProgressBarProps> = ({
  value,
  color = '#3b82f6',
  height = 8,
  background = '#e5e7eb',
}) => {
  const clampedValue = Math.max(0, Math.min(100, value));

  return (
    <div
      className="relative overflow-hidden rounded-full"
      style={{ height: `${height}px`, backgroundColor: background }}
    >
      <div
        className="h-full rounded-full transition-all duration-300 ease-out"
        style={{
          width: `${clampedValue}%`,
          backgroundColor: color,
        }}
      />
    </div>
  );
};

/**
 * 🏷️ 상태 배지 컴포넌트
 */
interface StatusBadgeProps {
  /** 상태 텍스트 */
  status: string;
  /** 배지 색상 타입 */
  variant?: 'success' | 'warning' | 'error' | 'info';
  /** 크기 */
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: FC<StatusBadgeProps> = ({
  status,
  variant = 'info',
  size = 'sm',
}) => {
  const getVariantClasses = () => {
    const variants = {
      success: 'bg-gradient-to-r from-green-100 to-green-200 text-green-800',
      warning: 'bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800',
      error: 'bg-gradient-to-r from-red-100 to-red-200 text-red-800',
      info: 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800',
    };
    return variants[variant];
  };

  const getSizeClasses = () => {
    const sizes = {
      sm: 'px-2 py-1 text-xs',
      md: 'px-3 py-1.5 text-sm',
      lg: 'px-4 py-2 text-base',
    };
    return sizes[size];
  };

  return (
    <span
      className={`inline-flex items-center rounded-full font-bold shadow-sm ${getVariantClasses()} ${getSizeClasses()} `}
    >
      {status}
    </span>
  );
};
