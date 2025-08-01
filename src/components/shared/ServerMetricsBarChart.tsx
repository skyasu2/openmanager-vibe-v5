'use client';

import { motion } from 'framer-motion';
import React, { useEffect, useState } from 'react';

export interface ServerMetricsBarChartProps {
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
      barColor: 'bg-blue-500',
      textColor: 'text-blue-700',
    },
    memory: {
      color: '#8b5cf6',
      bgColor: 'bg-purple-50',
      barColor: 'bg-purple-500',
      textColor: 'text-purple-700',
    },
    disk: {
      color: '#06b6d4',
      bgColor: 'bg-cyan-50',
      barColor: 'bg-cyan-500',
      textColor: 'text-cyan-700',
    },
    network: {
      color: '#22c55e',
      bgColor: 'bg-green-50',
      barColor: 'bg-green-500',
      textColor: 'text-green-700',
    },
  };

  // 상태에 따른 색상 오버라이드
  if (isCritical) {
    return {
      ...baseColors[type],
      barColor: 'bg-red-500',
      textColor: 'text-red-700',
      bgColor: 'bg-red-50',
      status: '위험',
    };
  } else if (isWarning) {
    return {
      ...baseColors[type],
      barColor: 'bg-amber-500',
      textColor: 'text-amber-700',
      bgColor: 'bg-amber-50',
      status: '주의',
    };
  } else {
    return {
      ...baseColors[type],
      status: '정상',
    };
  }
};

// 5분간 데이터 생성 함수
const generateHistoricalData = (currentValue: number, type: string) => {
  const data = [];
  const now = Date.now();

  // 5분간 1분 간격으로 5개 데이터 포인트 생성
  for (let i = 4; i >= 0; i--) {
    const timestamp = now - i * 60 * 1000; // 1분 간격
    let value = currentValue;

    // 과거 데이터는 현재값 기준으로 약간의 변동 추가
    if (i > 0) {
      const variation = (Math.random() - 0.5) * 20; // ±10% 변동
      value = Math.max(0, Math.min(100, currentValue + variation));
    }

    data.push({
      timestamp,
      value: Math.round(value),
      label: i === 0 ? '현재' : `${i}분 전`,
    });
  }

  return data;
};

export default function ServerMetricsBarChart({
  value,
  label,
  type,
  showRealTimeUpdates = false,
  className = '',
}: ServerMetricsBarChartProps) {
  const [historicalData, setHistoricalData] = useState(() =>
    generateHistoricalData(value, type)
  );

  const config = getMetricConfig(value, type);

  // 실시간 업데이트 시뮬레이션
  useEffect(() => {
    if (!showRealTimeUpdates) return;

    const interval = setInterval(() => {
      setHistoricalData((prev) => {
        // 기존 데이터를 한 칸씩 뒤로 밀고 새 데이터 추가
        const newData = [...prev.slice(1)];
        const lastDataPoint = prev[prev.length - 1];
        const lastValue = lastDataPoint?.value ?? 50;

        // 새로운 현재값 생성 (기존값 기준 ±5% 변동)
        const variation = (Math.random() - 0.5) * 10;
        const newValue = Math.max(0, Math.min(100, lastValue + variation));

        newData.push({
          timestamp: Date.now(),
          value: Math.round(newValue),
          label: '현재',
        });

        // 라벨 업데이트
        return newData.map((item, index) => ({
          ...item,
          label: index === 4 ? '현재' : `${4 - index}분 전`,
        }));
      });
    }, 30000); // 30초마다 업데이트

    return () => clearInterval(interval);
  }, [showRealTimeUpdates]);

  // 최대값 계산 (차트 스케일링용)
  const maxValue = Math.max(...historicalData.map((d) => d.value), 100);

  return (
    <div className={`${className}`}>
      {/* 라벨과 현재값 */}
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-medium text-gray-600">{label}</span>
        <span className={`text-sm font-bold ${config.textColor}`}>
          {Math.round(value)}%
        </span>
      </div>

      {/* 막대 그래프 */}
      <div className="space-y-1">
        <div className="flex h-20 items-end justify-between gap-1 px-1">
          {historicalData.map((dataPoint, index) => {
            const height = Math.max(8, (dataPoint.value / 100) * 100);
            const isCurrentValue = index === historicalData.length - 1;

            return (
              <div
                key={index}
                className="flex max-w-[20px] flex-1 flex-col items-center"
              >
                {/* 막대 */}
                <motion.div
                  className="relative w-full"
                  style={{ height: '80px' }}
                  initial={{ height: 0 }}
                  animate={{ height: '80px' }}
                  transition={{ delay: index * 0.05, duration: 0.3 }}
                >
                  {/* 배경 막대 */}
                  <div className="absolute bottom-0 h-full w-full rounded-sm bg-gray-100 opacity-30" />

                  {/* 실제 데이터 막대 */}
                  <motion.div
                    className={`relative w-full overflow-hidden rounded-sm shadow-sm ${config.barColor} ${isCurrentValue ? 'opacity-100 shadow-md' : 'opacity-80'} `}
                    style={{
                      height: `${height}%`,
                      position: 'absolute',
                      bottom: 0,
                    }}
                    initial={{ height: 0 }}
                    animate={{ height: `${height}%` }}
                    transition={{
                      delay: index * 0.05,
                      duration: 0.6,
                      type: 'spring',
                      stiffness: 120,
                      damping: 15,
                    }}
                  >
                    {/* 그라데이션 효과 */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-white/20" />

                    {/* 현재값 강조 효과 */}
                    {isCurrentValue && showRealTimeUpdates && (
                      <motion.div
                        className="absolute inset-0 bg-white/40"
                        animate={{
                          opacity: [0, 0.6, 0],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: 'easeInOut',
                        }}
                      />
                    )}
                  </motion.div>

                  {/* 값 표시 (현재값과 최고값만) */}
                  {(isCurrentValue ||
                    dataPoint.value ===
                      Math.max(...historicalData.map((d) => d.value))) && (
                    <motion.div
                      className={`absolute -top-7 left-1/2 -translate-x-1/2 transform rounded-full px-1.5 py-0.5 text-xs font-bold ${config.bgColor} ${config.textColor} whitespace-nowrap shadow-sm`}
                      initial={{ opacity: 0, y: 10, scale: 0.8 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ delay: 0.3 + index * 0.05 }}
                    >
                      {dataPoint.value}%
                    </motion.div>
                  )}
                </motion.div>
              </div>
            );
          })}
        </div>

        {/* 시간 라벨 */}
        <div className="mt-2 flex justify-between px-1 text-xs text-gray-400">
          {historicalData.map((dataPoint, index) => (
            <span
              key={index}
              className={`flex-1 text-center font-medium ${
                index === historicalData.length - 1 ? 'text-gray-600' : ''
              }`}
            >
              {index === 0
                ? '-4분'
                : index === 1
                  ? '-3분'
                  : index === 2
                    ? '-2분'
                    : index === 3
                      ? '-1분'
                      : '현재'}
            </span>
          ))}
        </div>
      </div>

      {/* 상태 표시 */}
      <div className="mt-2 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <div
            className={`h-2 w-2 rounded-full ${
              config.status === '위험'
                ? 'bg-red-500'
                : config.status === '주의'
                  ? 'bg-amber-500'
                  : config.barColor.replace('bg-', 'bg-')
            }`}
          />
          <span className="text-xs text-gray-500">{config.status}</span>
        </div>

        {showRealTimeUpdates && (
          <motion.div
            className="text-xs text-gray-400"
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
export const ServerCardBarChart = (
  props: Omit<ServerMetricsBarChartProps, 'variant'>
) => <ServerMetricsBarChart {...props} />;
