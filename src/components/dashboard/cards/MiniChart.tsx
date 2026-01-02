/**
 * 📊 MiniChart - 실시간 미니 차트 컴포넌트
 *
 * EnhancedServerCard에서 분리된 재사용 가능한 차트 컴포넌트
 * - 실시간 데이터 시각화
 * - Compact/Default 모드 지원
 * - 전체 서버 상태 기반 통합 색상 (상위에서 전달)
 *
 * @refactored 2025-12-30 - EnhancedServerCard.tsx에서 분리
 * @updated 2026-01-02 - 전체 메트릭 기반 통합 색상 적용
 */

import { motion } from 'framer-motion';
import type React from 'react';

export interface MiniChartProps {
  data: number[];
  /** 전체 서버 상태 기반 통합 색상 (상위 컴포넌트에서 계산) */
  color: string;
  label: string;
  icon: React.ReactNode;
  serverId: string;
  index: number;
  isCompact?: boolean;
  chartSize?: string;
}

/**
 * 개별 값에 따른 배지 스타일 반환 (차트 색상과 별개)
 */
const getValueBadgeStyle = (value: number): string => {
  if (value >= 90) return 'bg-red-100/80 text-red-700';
  if (value >= 70) return 'bg-yellow-100/80 text-yellow-700';
  return 'bg-gray-100/80 text-gray-700';
};

/**
 * SVG ID에 사용할 수 있도록 특수문자 제거
 */
const sanitizeId = (str: string): string =>
  str.replace(/[^a-zA-Z0-9-_:.]/g, '_');

export const MiniChart: React.FC<MiniChartProps> = ({
  data,
  color,
  label,
  icon,
  serverId,
  index,
  isCompact = false,
  chartSize = 'w-20 h-16',
}) => {
  // 데이터 길이 방어: 최소 2개의 포인트 보장
  const normalizedData = data.length >= 2 ? data : [data[0] ?? 0, data[0] ?? 0];
  const denom = normalizedData.length - 1;

  const points = normalizedData
    .map((value, idx) => {
      const x = (idx / denom) * 100;
      const y = 100 - Math.max(0, Math.min(100, value));
      return `${x},${y}`;
    })
    .join(' ');

  const currentValue = normalizedData[normalizedData.length - 1] || 0;

  // SVG ID 안전화: 특수문자 제거
  const safeId = sanitizeId(`${serverId}-${label}-${index}`);
  const gradientId = `gradient-${safeId}`;
  const glowId = `glow-${safeId}`;

  // 전달받은 통합 색상 사용 (전체 서버 상태 기반)
  const chartColor = color;

  // Compact 모드: 가로 배치 + 미니 차트
  if (isCompact) {
    return (
      <motion.div
        className="flex items-center gap-2 bg-white/90 rounded-lg px-2 py-1.5 group hover:bg-white/95 transition-all duration-200 shadow-sm border border-white/20"
        whileHover={{ scale: 1.02 }}
      >
        {/* 아이콘 + 라벨 */}
        <div className="flex items-center gap-1 shrink-0" title={label}>
          <div className="text-gray-600 p-0.5" aria-hidden="true">
            {icon}
          </div>
        </div>

        {/* 미니 인라인 차트 - 높이 증가 (32px → 40px) */}
        <div className="flex-1 h-10 min-w-[60px]">
          <svg
            className="w-full h-full"
            viewBox="0 0 100 40"
            preserveAspectRatio="none"
            role="img"
            aria-label={`${label} 사용률 ${currentValue.toFixed(0)}% 추이 차트`}
          >
            <title>{`${label}: ${currentValue.toFixed(0)}%`}</title>
            <defs>
              <linearGradient
                id={`compact-${gradientId}`}
                x1="0%"
                y1="0%"
                x2="0%"
                y2="100%"
              >
                <stop offset="0%" stopColor={chartColor} stopOpacity="0.5" />
                <stop offset="100%" stopColor={chartColor} stopOpacity="0.05" />
              </linearGradient>
            </defs>
            {/* 영역 채우기 */}
            <polygon
              fill={`url(#compact-${gradientId})`}
              points={`0,40 ${normalizedData.map((v, i) => `${(i / denom) * 100},${40 - (v / 100) * 40}`).join(' ')} 100,40`}
            />
            {/* 라인 */}
            <polyline
              fill="none"
              stroke={chartColor}
              strokeWidth="2"
              points={normalizedData
                .map((v, i) => `${(i / denom) * 100},${40 - (v / 100) * 40}`)
                .join(' ')}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        {/* 수치 - 개별 값 기준 배지 스타일 */}
        <motion.span
          className={`text-xs font-bold px-1.5 py-0.5 rounded shrink-0 ${getValueBadgeStyle(currentValue)}`}
          animate={{
            scale: currentValue >= 90 ? [1, 1.05, 1] : 1,
          }}
          transition={{
            duration: 2,
            repeat: currentValue >= 90 ? Infinity : 0,
          }}
        >
          {currentValue.toFixed(0)}%
        </motion.span>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="flex flex-col bg-white/90 rounded-xl p-3 group hover:bg-white/95 transition-all duration-300 shadow-sm hover:shadow-md backdrop-blur-sm border border-white/20"
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      {/* 라벨과 아이콘 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <motion.div
            className="text-gray-600 group-hover:scale-110 transition-transform p-1 rounded-lg bg-gray-50/80"
            whileHover={{ rotate: 5 }}
          >
            {icon}
          </motion.div>
          <span className="text-xs font-semibold text-gray-700 tracking-wide whitespace-nowrap">
            {label}
          </span>
        </div>
        {/* 수치 표시 - 개별 값 기준 배지 스타일 */}
        <motion.span
          className={`text-sm font-bold px-2 py-1 rounded-lg ${getValueBadgeStyle(currentValue)}`}
          animate={{
            scale: currentValue >= 90 ? [1, 1.05, 1] : 1,
          }}
          transition={{
            duration: 2,
            repeat: currentValue >= 90 ? Infinity : 0,
          }}
        >
          {currentValue.toFixed(0)}%
        </motion.span>
      </div>

      {/* 차트 - 전체 서버 상태 기반 통합 색상 */}
      <div
        className={`${chartSize} relative bg-linear-to-br from-white/60 to-gray-50/40 rounded-xl p-3 shadow-inner border border-gray-100/50`}
      >
        <svg
          className="w-full h-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          role="img"
          aria-label={`${label} 사용률 ${currentValue.toFixed(0)}% 추이 차트`}
        >
          <title>{`${label}: ${currentValue.toFixed(0)}%`}</title>
          <defs>
            {/* 투명한 그라데이션 - 전체 상태 기반 색상 */}
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={chartColor} stopOpacity="0.6" />
              <stop offset="40%" stopColor={chartColor} stopOpacity="0.3" />
              <stop offset="100%" stopColor={chartColor} stopOpacity="0.05" />
            </linearGradient>

            {/* 개선된 글로우 효과 */}
            <filter id={glowId}>
              <feGaussianBlur stdDeviation="1.5" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* 미세한 격자 패턴 */}
            <pattern
              id={`grid-${safeId}`}
              width="8"
              height="8"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 8 0 L 0 0 0 8"
                fill="none"
                stroke="#e2e8f0"
                strokeWidth="0.2"
                opacity="0.4"
              />
            </pattern>
          </defs>

          {/* 배경 격자 */}
          <rect
            width="100"
            height="100"
            fill={`url(#grid-${safeId})`}
            opacity="0.3"
          />

          {/* 영역 채우기 - 투명한 그라데이션 */}
          <polygon
            fill={`url(#${gradientId})`}
            points={`0,100 ${points} 100,100`}
            className="transition-all duration-500"
          />

          {/* 라인 - 전체 상태 기반 색상 */}
          <polyline
            fill="none"
            stroke={chartColor}
            strokeWidth="2.5"
            points={points}
            vectorEffect="non-scaling-stroke"
            filter={`url(#${glowId})`}
            className="transition-all duration-500"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* 현재 값 포인트 */}
          <circle
            cx="100"
            cy={100 - Math.max(0, Math.min(100, currentValue))}
            r="3"
            fill={chartColor}
            stroke="white"
            strokeWidth="2"
            filter={`url(#${glowId})`}
            className="drop-shadow-sm"
          />
        </svg>

        {/* 위험 상태 표시 - 개별 값 90% 이상일 때 */}
        {currentValue >= 90 && (
          <motion.div
            className="absolute top-1 right-1 bg-red-500/90 text-white text-xs px-1.5 py-0.5 rounded-full shadow-lg"
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.8, 1, 0.8],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
            }}
          >
            ⚠️
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default MiniChart;
