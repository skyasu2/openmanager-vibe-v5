'use client';

// framer-motion 제거 - CSS 애니메이션 사용
import React, { useEffect, useState, useRef } from 'react';

export interface ServerMetricsLineChartProps {
  value: number;
  label: string;
  type: 'cpu' | 'memory' | 'disk' | 'network';
  showRealTimeUpdates?: boolean;
  className?: string;
  serverStatus?: 'online' | 'offline' | 'warning' | 'critical' | string;
}

// 메트릭 타입별 색상 설정
const getMetricConfig = (
  value: number,
  type: 'cpu' | 'memory' | 'disk' | 'network',
  serverStatus?: string
) => {
  // 서버 상태 우선 확인
  if (serverStatus) {
    const normalizedStatus = serverStatus.toLowerCase();

    // 서버 상태별 색상 정의
    if (
      normalizedStatus === 'offline' ||
      normalizedStatus === 'critical' ||
      normalizedStatus === 'error'
    ) {
      // 심각 상황 - 빨간색 계열
      return {
        lineColor: '#dc2626', // red-600
        textColor: 'text-red-700',
        bgColor: 'bg-red-50',
        gradientFrom: 'from-red-600',
        gradientTo: 'to-red-100',
        status: '오프라인',
        fillColor: 'rgba(220, 38, 38, 0.1)', // 빨간색 투명도
      };
    } else if (
      normalizedStatus === 'warning' ||
      normalizedStatus === 'degraded'
    ) {
      // 경고 상황 - 노랑/주황 계열
      return {
        lineColor: '#f59e0b', // amber-500
        textColor: 'text-amber-700',
        bgColor: 'bg-amber-50',
        gradientFrom: 'from-amber-500',
        gradientTo: 'to-amber-100',
        status: '경고',
        fillColor: 'rgba(245, 158, 11, 0.1)', // 주황색 투명도
      };
    } else if (
      normalizedStatus === 'online' ||
      normalizedStatus === 'healthy' ||
      normalizedStatus === 'running'
    ) {
      // 정상 상황 - 녹색 계열
      return {
        lineColor: '#10b981', // emerald-500
        textColor: 'text-emerald-700',
        bgColor: 'bg-emerald-50',
        gradientFrom: 'from-emerald-500',
        gradientTo: 'to-emerald-100',
        status: '정상',
        fillColor: 'rgba(16, 185, 129, 0.1)', // 녹색 투명도
      };
    }
  }

  // 서버 상태가 없으면 메트릭 값 기반으로 판단
  const thresholds = {
    cpu: { warning: 70, critical: 85 },
    memory: { warning: 80, critical: 90 },
    disk: { warning: 80, critical: 95 },
    network: { warning: 60, critical: 80 },
  };

  const threshold = thresholds[type];
  const isCritical = value >= threshold.critical;
  const isWarning = value >= threshold.warning;

  // 메트릭 값에 따른 색상
  if (isCritical) {
    return {
      lineColor: '#dc2626', // red-600
      textColor: 'text-red-700',
      bgColor: 'bg-red-50',
      gradientFrom: 'from-red-600',
      gradientTo: 'to-red-100',
      status: '위험',
      fillColor: 'rgba(220, 38, 38, 0.1)',
    };
  } else if (isWarning) {
    return {
      lineColor: '#f59e0b', // amber-500
      textColor: 'text-amber-700',
      bgColor: 'bg-amber-50',
      gradientFrom: 'from-amber-500',
      gradientTo: 'to-amber-100',
      status: '주의',
      fillColor: 'rgba(245, 158, 11, 0.1)',
    };
  } else {
    // 정상 상태 - 녹색
    return {
      lineColor: '#10b981', // emerald-500
      textColor: 'text-emerald-700',
      bgColor: 'bg-emerald-50',
      gradientFrom: 'from-emerald-500',
      gradientTo: 'to-emerald-100',
      status: '정상',
      fillColor: 'rgba(16, 185, 129, 0.1)',
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
  serverStatus,
}: ServerMetricsLineChartProps) {
  const [historicalData, setHistoricalData] = useState(() =>
    generateHistoricalData(value, type)
  );
  const svgRef = useRef<SVGSVGElement>(null);

  const config = getMetricConfig(value, type, serverStatus);

  // 실시간 업데이트 시뮬레이션
  useEffect(() => {
    if (!showRealTimeUpdates) return;

    const interval = setInterval(() => {
      setHistoricalData((prev) => {
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
    const yScale = (y: number) =>
      height - (y / 100) * (height - 2 * padding) - padding;

    const points = historicalData.map((d) => ({
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
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-medium text-gray-600">{label}</span>
        <span className={`text-sm font-bold ${config.textColor}`}>
          {Math.round(value)}%
        </span>
      </div>

      {/* 라인 차트 */}
      <div className="relative">
        <svg
          ref={svgRef}
          width="100%"
          height="80"
          viewBox="0 0 180 80"
          className="w-full"
          style={{ maxWidth: '180px' }}
        >
          {/* 그리드 라인 */}
          <g className="opacity-20">
            {[0, 25, 50, 75, 100].map((val) => {
              const y = 80 - (val / 100) * 60 - 10;
              return (
                <line
                  key={val}
                  x1="10"
                  x2="170"
                  y1={y}
                  y2={y}
                  stroke="#e5e7eb"
                  strokeWidth="1"
                />
              );
            })}
          </g>

          {/* 그라데이션 정의 */}
          <defs>
            <linearGradient id={`gradient-${type}`} x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="0%"
                stopColor={config.lineColor}
                stopOpacity="0.5"
              />
              <stop
                offset="100%"
                stopColor={config.lineColor}
                stopOpacity="0.05"
              />
            </linearGradient>
          </defs>

          {/* 영역 채우기 */}
          <path
            d={`${path} L ${points[points.length - 1].x} 70 L ${points[0].x} 70 Z`}
            fill={`url(#gradient-${type})`}
          />

          {/* 라인 */}
          <path
            d={path}
            fill="none"
            stroke={config.lineColor}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* 데이터 포인트 */}
          {points.map((point, index) => {
            const isLast = index === points.length - 1;
            const dataValue = historicalData[index].value;

            return (
              <g key={index}>
                {/* 포인트 */}
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={isLast ? '4' : '3'}
                  fill={config.lineColor}
                  className={isLast ? 'drop-shadow-md filter' : ''}
                />

                {/* 현재값 표시 */}
                {isLast && (
                  <g
                  >
                    <rect
                      x={point.x - 15}
                      y={point.y - 25}
                      width="30"
                      height="18"
                      rx="3"
                      fill={config.lineColor}
                      className="drop-shadow-sm filter"
                    />
                    <text
                      x={point.x}
                      y={point.y - 12}
                      textAnchor="middle"
                      className="fill-white text-xs font-bold"
                    >
                      {dataValue}%
                    </text>
                  </g>
                )}

                {/* 최고값 표시 */}
                {dataValue ===
                  Math.max(...historicalData.map((d) => d.value)) &&
                  !isLast && (
                    <text
                      x={point.x}
                      y={point.y - 8}
                      textAnchor="middle"
                      className="text-xs font-medium"
                      fill={config.lineColor}
                    >
                      {dataValue}
                    </text>
                  )}
              </g>
            );
          })}

          {/* 현재값 펄스 효과 */}
          {showRealTimeUpdates && (
            <circle
              cx={points[points.length - 1].x}
              cy={points[points.length - 1].y}
              r="6"
              fill="none"
              stroke={config.lineColor}
              strokeWidth="2"
            />
          )}
        </svg>

        {/* 시간 라벨 */}
        <div className="mt-1 flex justify-between px-2 text-xs text-gray-400">
          <span>-5분</span>
          <span>-2.5분</span>
          <span className="font-medium text-gray-600">현재</span>
        </div>
      </div>

      {/* 상태 표시 */}
      <div className="mt-2 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <div
            className={`h-2 w-2 rounded-full`}
            style={{ backgroundColor: config.lineColor }}
          />
          <span className="text-xs text-gray-500">{config.status}</span>
        </div>

        {showRealTimeUpdates && (
          <div className="text-xs text-gray-400">
            실시간
          </div>
        )}
      </div>
    </div>
  );
}

// 편의를 위한 사전 정의된 변형들
export const ServerCardLineChart = (
  props: Omit<ServerMetricsLineChartProps, 'variant'>
) => <ServerMetricsLineChart {...props} />;
