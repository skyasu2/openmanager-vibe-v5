'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface ServerCardLineChartProps {
  label: string;
  value: number;
  type: 'cpu' | 'memory' | 'disk' | 'network';
  serverId?: string;
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
      color: '#ef4444',
      gradient: 'from-red-500 to-red-600',
      bgColor: 'bg-red-50',
      textColor: 'text-red-700',
    },
    memory: {
      color: '#3b82f6',
      gradient: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700',
    },
    disk: {
      color: '#8b5cf6',
      gradient: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-700',
    },
    network: {
      color: '#22c55e',
      gradient: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      textColor: 'text-green-700',
    },
  };

  // 상태에 따른 색상 오버라이드
  if (isCritical) {
    return {
      color: '#ef4444',
      gradient: 'from-red-500 to-red-600',
      bgColor: 'bg-red-50',
      textColor: 'text-red-700',
      status: '위험',
    };
  } else if (isWarning) {
    return {
      color: '#f59e0b',
      gradient: 'from-amber-500 to-amber-600',
      bgColor: 'bg-amber-50',
      textColor: 'text-amber-700',
      status: '주의',
    };
  } else {
    const base = baseColors[type];
    return {
      ...base,
      status: '정상',
    };
  }
};

export default function ServerCardLineChart({
  label,
  value,
  type,
  serverId,
  showRealTimeUpdates = true,
  className = '',
}: ServerCardLineChartProps) {
  // 최근 20개 데이터 포인트를 저장 (라인차트용)
  const [dataPoints, setDataPoints] = useState<
    Array<{ timestamp: string; value: number }>
  >(() =>
    Array.from({ length: 20 }, (_, i) => ({
      timestamp: new Date(Date.now() - (19 - i) * 2000).toISOString(), // 2초 간격
      value: Math.max(0, value + (Math.random() - 0.5) * 10),
    }))
  );

  const config = getMetricConfig(value, type);

  // 실시간 데이터 시뮬레이션 (3초마다 업데이트)
  useEffect(() => {
    if (!showRealTimeUpdates) return;

    const interval = setInterval(() => {
      setDataPoints(prev => {
        const newPoint = {
          timestamp: new Date().toISOString(),
          value: Math.max(0, Math.min(100, value + (Math.random() - 0.5) * 5)),
        };

        // 최신 20개만 유지
        return [...prev.slice(1), newPoint];
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [showRealTimeUpdates, value]);

  // SVG 라인 차트 포인트 생성 - 기존 차트 생성 원칙 유지
  const generateChartPoints = (
    data: Array<{ timestamp: string; value: number }>
  ) => {
    const width = 100;
    const height = 40;
    const values = data.map(d => d.value);
    const maxValue = Math.max(...values, 100);
    const minValue = Math.min(...values, 0);
    const range = maxValue - minValue || 1;

    return values
      .map((value, index) => {
        const x = (index / (values.length - 1)) * width;
        const y = height - ((value - minValue) / range) * height;
        return `${x},${y}`;
      })
      .join(' ');
  };

  // 최근 값과 트렌드 계산 - AI 메트릭 분석 패턴 적용
  const currentPoint = dataPoints[dataPoints.length - 1];
  const previousPoint = dataPoints[dataPoints.length - 2];
  const currentValue = currentPoint?.value || value;
  const previousValue = previousPoint?.value || value;
  const trend =
    currentValue > previousValue + 0.5
      ? 'up'
      : currentValue < previousValue - 0.5
        ? 'down'
        : 'stable';

  // 🔗 연결 상태 시뮬레이션
  const connectionStatus = showRealTimeUpdates ? '🟢' : '🔴';

  return (
    <div
      className={`${config.bgColor} rounded-lg p-3 border border-gray-200 ${className}`}
    >
      {/* 헤더 - 실시간 연결 상태 포함 */}
      <div className='flex items-center justify-between mb-2'>
        <span className='text-xs font-medium text-gray-600 flex items-center gap-1'>
          {label}
          {showRealTimeUpdates && (
            <span
              className='text-xs'
              title={showRealTimeUpdates ? '실시간 연결됨' : '연결 끊김'}
            >
              {connectionStatus}
            </span>
          )}
        </span>
        <div className='flex items-center gap-1'>
          <span className={`text-sm font-bold ${config.textColor}`}>
            {currentValue.toFixed(1)}
            {type === 'network' ? 'MB' : '%'}
          </span>
          {/* 트렌드 인디케이터 */}
          <span className='text-xs'>
            {trend === 'up' && <span className='text-red-500'>↗</span>}
            {trend === 'down' && <span className='text-green-500'>↘</span>}
            {trend === 'stable' && <span className='text-gray-400'>→</span>}
          </span>
        </div>
      </div>

      {/* 라인 차트 - 실시간 데이터 시각화 */}
      <div className='relative h-10 mb-2'>
        <svg
          width='100%'
          height='100%'
          viewBox='0 0 100 40'
          preserveAspectRatio='none'
          className='overflow-visible'
        >
          <defs>
            {/* 그라데이션 정의 */}
            <linearGradient
              id={`line-gradient-${type}-${serverId || 'default'}`}
              x1='0%'
              y1='0%'
              x2='0%'
              y2='100%'
            >
              <stop offset='0%' stopColor={config.color} stopOpacity='0.3' />
              <stop offset='100%' stopColor={config.color} stopOpacity='0.05' />
            </linearGradient>
          </defs>

          {/* 격자 라인 */}
          {[0, 20, 40].map(y => (
            <line
              key={y}
              x1='0'
              y1={y}
              x2='100'
              y2={y}
              stroke='#e5e7eb'
              strokeWidth='0.5'
              opacity='0.5'
            />
          ))}

          {/* 영역 채우기 */}
          <polygon
            fill={`url(#line-gradient-${type}-${serverId || 'default'})`}
            points={`0,40 ${generateChartPoints(dataPoints)} 100,40`}
          />

          {/* 라인 - 실시간 애니메이션 */}
          <motion.polyline
            fill='none'
            stroke={config.color}
            strokeWidth='2'
            points={generateChartPoints(dataPoints)}
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.5, ease: 'easeInOut' }}
            style={{
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
            }}
          />

          {/* 현재 값 포인트 강조 */}
          <motion.circle
            cx='100'
            cy={
              40 -
              ((currentValue - Math.min(...dataPoints.map(d => d.value), 0)) /
                (Math.max(...dataPoints.map(d => d.value), 100) -
                  Math.min(...dataPoints.map(d => d.value), 0) || 1)) *
                40
            }
            r='2'
            fill={config.color}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 1.5, duration: 0.3 }}
          />
        </svg>
      </div>

      {/* 하단 프로그레스 바 - 기존 시스템과 일관성 유지 */}
      <div className='relative h-1 bg-gray-200 rounded-full overflow-hidden'>
        <motion.div
          className={`h-full bg-gradient-to-r ${config.gradient}`}
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(currentValue, 100)}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>

      {/* 상태 텍스트 */}
      <div className='mt-1 text-xs text-gray-500 flex justify-between items-center'>
        <span>{config.status}</span>
        {showRealTimeUpdates && currentPoint && (
          <span className='text-xs text-gray-400'>
            {new Date(currentPoint.timestamp).toLocaleTimeString()} 업데이트
          </span>
        )}
      </div>
    </div>
  );
}
