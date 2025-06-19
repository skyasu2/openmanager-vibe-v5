'use client';

import React from 'react';
import { formatPercentage } from '@/lib/utils';

interface CircularGaugeProps {
  value: number;
  max?: number;
  label: string;
  color: string;
  size?: number;
  showAnimation?: boolean;
}

export default function CircularGauge({
  value,
  max = 100,
  label,
  color,
  size = 150,
  showAnimation = true,
}: CircularGaugeProps) {
  const percentage = Math.min((value / max) * 100, 100);
  const radius = (size - 20) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  // 상태에 따른 색상 결정
  const getStatusColor = (value: number) => {
    if (value >= 90) return '#ef4444'; // 위험 (빨강)
    if (value >= 75) return '#f59e0b'; // 주의 (주황)
    return color; // 정상 (기본 색상)
  };

  const statusColor = getStatusColor(percentage);

  // 상태 텍스트
  const getStatusText = (value: number) => {
    if (value >= 90) return '위험';
    if (value >= 75) return '주의';
    return '정상';
  };

  const statusText = getStatusText(percentage);

  return (
    <div className='flex flex-col items-center'>
      <div className='relative' style={{ width: size, height: size }}>
        {/* 배경 원 */}
        <svg width={size} height={size} className='transform -rotate-90'>
          <defs>
            <filter
              id={`shadow-${label}`}
              x='-50%'
              y='-50%'
              width='200%'
              height='200%'
            >
              <feDropShadow dx='0' dy='2' stdDeviation='3' floodOpacity='0.3' />
            </filter>
            <linearGradient
              id={`gradient-${label}`}
              x1='0%'
              y1='0%'
              x2='100%'
              y2='100%'
            >
              <stop offset='0%' stopColor={statusColor} stopOpacity='0.8' />
              <stop offset='100%' stopColor={statusColor} stopOpacity='1' />
            </linearGradient>
          </defs>

          {/* 배경 원 */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke='#e5e7eb'
            strokeWidth='8'
            fill='none'
          />

          {/* 진행률 원 */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={`url(#gradient-${label})`}
            strokeWidth='8'
            fill='none'
            strokeLinecap='round'
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            filter={`url(#shadow-${label})`}
            className={
              showAnimation ? 'transition-all duration-1000 ease-out' : ''
            }
          />
        </svg>

        {/* 중앙 텍스트 */}
        <div className='absolute inset-0 flex flex-col items-center justify-center'>
          <div className='text-2xl font-bold' style={{ color: statusColor }}>
            {formatPercentage(value).replace('%', '')}
            <span className='text-xl'>%</span>
          </div>
          <div className='text-xs text-gray-500 mt-1'>{statusText}</div>
        </div>

        {/* 애니메이션 효과 */}
        {showAnimation && percentage > 75 && (
          <div className='absolute inset-0 flex items-center justify-center'>
            <div
              className='w-3 h-3 rounded-full animate-pulse'
              style={{
                backgroundColor: statusColor,
                boxShadow: `0 0 10px ${statusColor}50`,
              }}
            />
          </div>
        )}
      </div>

      {/* 라벨 */}
      <div className='mt-2 text-center'>
        <div className='text-sm font-medium text-gray-700'>{label}</div>
        {max !== 100 && (
          <div className='text-xs text-gray-500'>
            {value.toFixed(2)} / {max}
          </div>
        )}
      </div>
    </div>
  );
}
