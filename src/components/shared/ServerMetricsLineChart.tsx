'use client';

import { motion } from 'framer-motion';
import React, { useEffect, useState, useRef } from 'react';

export interface ServerMetricsLineChartProps {
  value: number;
  label: string;
  type: 'cpu' | 'memory' | 'disk' | 'network';
  showRealTimeUpdates?: boolean;
  className?: string;
}

// 메트릭 타입별 색상 설정
const getMetricConfig = (
  value: number,
  type: 'cpu' | 'memory' | 'disk' | 'network'
) => {
  const thresholds = {
    cpu: { warning: 70, critical: 85 },
    memory: { warning: 80, critical: 90 },
    disk: { warning: 80, critical: 95 },
    network: { warning: 60, critical: 80 },
  };

  const threshold = thresholds[type];
  const isCritical = value >= threshold.critical;
  const isWarning = value >= threshold.warning;

  // 기본 색상 설정
  const baseColors = {
    cpu: {
      color: '#3b82f6',
      bgColor: 'bg-blue-50',
      lineColor: '#3b82f6',
      textColor: 'text-blue-700',
      gradientFrom: 'from-blue-500',
      gradientTo: 'to-blue-100',
    },
    memory: {
      color: '#8b5cf6',
      bgColor: 'bg-purple-50',
      lineColor: '#8b5cf6',
      textColor: 'text-purple-700',
      gradientFrom: 'from-purple-500',
      gradientTo: 'to-purple-100',
    },
    disk: {
      color: '#06b6d4',
      bgColor: 'bg-cyan-50',
      lineColor: '#06b6d4',
      textColor: 'text-cyan-700',
      gradientFrom: 'from-cyan-500',
      gradientTo: 'to-cyan-100',
    },
    network: {
      color: '#22c55e',
      bgColor: 'bg-green-50',
      lineColor: '#22c55e',
      textColor: 'text-green-700',
      gradientFrom: 'from-green-500',
      gradientTo: 'to-green-100',
    },
  };

  // 상태에 따른 색상 오버라이드
  if (isCritical) {
    return {
      ...baseColors[type],
      lineColor: '#ef4444',
      textColor: 'text-red-700',
      bgColor: 'bg-red-50',
      gradientFrom: 'from-red-500',
      gradientTo: 'to-red-100',
      status: '위험',
    };
  } else if (isWarning) {
    return {
      ...baseColors[type],
      lineColor: '#f59e0b',
      textColor: 'text-amber-700',
      bgColor: 'bg-amber-50',
      gradientFrom: 'from-amber-500',
      gradientTo: 'to-amber-100',
      status: '주의',
    };
  } else {
    return {
      ...baseColors[type],
      status: '정상',
    };
  }
};

// 5분간 데이터 생성 함수 (10초 간격으로 30개 포인트)
const generateHistoricalData = (currentValue: number, type: string) => {
  const data = [];
  const now = Date.now();

  // 5분간 10초 간격으로 30개 데이터 포인트 생성
  for (let i = 29; i >= 0; i--) {
    const timestamp = now - i * 10 * 1000; // 10초 간격
    let value = currentValue;

    // 과거 데이터는 현재값 기준으로 약간의 변동 추가
    if (i > 0) {
      const variation = (Math.random() - 0.5) * 20; // ±10% 변동
      value = Math.max(0, Math.min(100, currentValue + variation));
    }

    data.push({
      timestamp,
      value: Math.round(value),
      x: 29 - i, // x 좌표 (0-29)
    });
  }

  return data;
};

export default function ServerMetricsLineChart({
  value,
  label,
  type,
  showRealTimeUpdates = false,
  className = '',
}: ServerMetricsLineChartProps) {
  const [historicalData, setHistoricalData] = useState(() =>
    generateHistoricalData(value, type)
  );
  const svgRef = useRef<SVGSVGElement>(null);

  const config = getMetricConfig(value, type);

  // 실시간 업데이트 시뮬레이션
  useEffect(() => {
    if (!showRealTimeUpdates) return;

    const interval = setInterval(() => {
      setHistoricalData(prev => {
        // 기존 데이터를 한 칸씩 앞으로 밀고 새 데이터 추가
        const newData = prev.slice(1).map((item, index) => ({
          ...item,
          x: index,
        }));

        const lastValue = prev[prev.length - 1]?.value ?? 50;

        // 새로운 현재값 생성 (기존값 기준 ±5% 변동)
        const variation = (Math.random() - 0.5) * 10;
        const newValue = Math.max(0, Math.min(100, lastValue + variation));

        newData.push({
          timestamp: Date.now(),
          value: Math.round(newValue),
          x: 29,
        });

        return newData;
      });
    }, 10000); // 10초마다 업데이트

    return () => clearInterval(interval);
  }, [showRealTimeUpdates]);

  // SVG 경로 생성
  const createPath = () => {
    const width = 180;
    const height = 80;
    const padding = 10;

    const xScale = (x: number) => (x / 29) * (width - 2 * padding) + padding;
    const yScale = (y: number) => height - (y / 100) * (height - 2 * padding) - padding;

    const points = historicalData.map(d => ({
      x: xScale(d.x),
      y: yScale(d.value),
    }));

    // Create smooth path using cubic bezier curves
    let path = `M ${points[0].x} ${points[0].y}`;
    
    for (let i = 1; i < points.length; i++) {
      const cp1x = (points[i - 1].x + points[i].x) / 2;
      const cp1y = points[i - 1].y;
      const cp2x = cp1x;
      const cp2y = points[i].y;
      
      path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${points[i].x} ${points[i].y}`;
    }

    return { path, points };
  };

  const { path, points } = createPath();

  return (
    <div className={`${className}`}>
      {/* 라벨과 현재값 */}
      <div className='flex items-center justify-between mb-2'>
        <span className='text-xs font-medium text-gray-600'>{label}</span>
        <span className={`text-sm font-bold ${config.textColor}`}>
          {Math.round(value)}%
        </span>
      </div>

      {/* 라인 차트 */}
      <div className='relative'>
        <svg
          ref={svgRef}
          width='100%'
          height='80'
          viewBox='0 0 180 80'
          className='w-full'
          style={{ maxWidth: '180px' }}
        >
          {/* 그리드 라인 */}
          <g className='opacity-20'>
            {[0, 25, 50, 75, 100].map((val) => {
              const y = 80 - (val / 100) * 60 - 10;
              return (
                <line
                  key={val}
                  x1='10'
                  x2='170'
                  y1={y}
                  y2={y}
                  stroke='#e5e7eb'
                  strokeWidth='1'
                />
              );
            })}
          </g>

          {/* 그라데이션 정의 */}
          <defs>
            <linearGradient id={`gradient-${type}`} x1='0' y1='0' x2='0' y2='1'>
              <stop offset='0%' stopColor={config.lineColor} stopOpacity='0.3' />
              <stop offset='100%' stopColor={config.lineColor} stopOpacity='0' />
            </linearGradient>
          </defs>

          {/* 영역 채우기 */}
          <motion.path
            d={`${path} L ${points[points.length - 1].x} 70 L ${points[0].x} 70 Z`}
            fill={`url(#gradient-${type})`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          />

          {/* 라인 */}
          <motion.path
            d={path}
            fill='none'
            stroke={config.lineColor}
            strokeWidth='2.5'
            strokeLinecap='round'
            strokeLinejoin='round'
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1, ease: 'easeInOut' }}
          />

          {/* 데이터 포인트 */}
          {points.map((point, index) => {
            const isLast = index === points.length - 1;
            const dataValue = historicalData[index].value;
            
            return (
              <g key={index}>
                {/* 포인트 */}
                <motion.circle
                  cx={point.x}
                  cy={point.y}
                  r={isLast ? '4' : '3'}
                  fill={config.lineColor}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: index * 0.02, duration: 0.3 }}
                  className={isLast ? 'filter drop-shadow-md' : ''}
                />
                
                {/* 현재값 표시 */}
                {isLast && (
                  <motion.g
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    <rect
                      x={point.x - 15}
                      y={point.y - 25}
                      width='30'
                      height='18'
                      rx='3'
                      fill={config.lineColor}
                      className='filter drop-shadow-sm'
                    />
                    <text
                      x={point.x}
                      y={point.y - 12}
                      textAnchor='middle'
                      className='text-xs font-bold fill-white'
                    >
                      {dataValue}%
                    </text>
                  </motion.g>
                )}

                {/* 최고값 표시 */}
                {dataValue === Math.max(...historicalData.map(d => d.value)) && !isLast && (
                  <motion.text
                    x={point.x}
                    y={point.y - 8}
                    textAnchor='middle'
                    className='text-xs font-medium'
                    fill={config.lineColor}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    {dataValue}
                  </motion.text>
                )}
              </g>
            );
          })}

          {/* 현재값 펄스 효과 */}
          {showRealTimeUpdates && (
            <motion.circle
              cx={points[points.length - 1].x}
              cy={points[points.length - 1].y}
              r='6'
              fill='none'
              stroke={config.lineColor}
              strokeWidth='2'
              animate={{
                r: [6, 12, 6],
                opacity: [1, 0, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          )}
        </svg>

        {/* 시간 라벨 */}
        <div className='flex justify-between text-xs text-gray-400 mt-1 px-2'>
          <span>-5분</span>
          <span>-2.5분</span>
          <span className='font-medium text-gray-600'>현재</span>
        </div>
      </div>

      {/* 상태 표시 */}
      <div className='flex items-center justify-between mt-2'>
        <div className='flex items-center gap-1'>
          <motion.div
            className={`w-2 h-2 rounded-full`}
            style={{ backgroundColor: config.lineColor }}
            animate={{
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
          <span className='text-xs text-gray-500'>{config.status}</span>
        </div>

        {showRealTimeUpdates && (
          <motion.div
            className='text-xs text-gray-400'
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            실시간
          </motion.div>
        )}
      </div>
    </div>
  );
}

// 편의를 위한 사전 정의된 변형들
export const ServerCardLineChart = (
  props: Omit<ServerMetricsLineChartProps, 'variant'>
) => <ServerMetricsLineChart {...props} />;