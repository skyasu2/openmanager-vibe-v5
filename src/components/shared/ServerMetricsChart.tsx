/**
 * 📊 서버 메트릭 차트 컴포넌트
 *
 * 서버의 CPU, 메모리, 디스크, 네트워크 사용률을 시각화하는 재사용 가능한 차트 컴포넌트
 * - 고성능 렌더링 (Canvas 기반)
 * - 반응형 디자인
 * - 실시간 데이터 업데이트
 * - 애니메이션 효과
 * - 접근성 향상
 */

import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import type { ServerStatus } from '../../types/server';

interface ServerMetricsChartProps {
  type: 'cpu' | 'memory' | 'disk' | 'network';
  value: number;
  max?: number;
  status: ServerStatus;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
  animationDuration?: number; // 애니메이션 지속 시간 (ms)
}

// 색상 테마 정의
const colorThemes = {
  critical: {
    primary: '#EF4444', // red-500
    background: 'rgba(239, 68, 68, 0.1)', // red-500/10
  },
  warning: {
    primary: '#F59E0B', // amber-500
    background: 'rgba(245, 158, 11, 0.1)', // amber-500/10
  },
  online: {
    primary: '#10B981', // emerald-500
    background: 'rgba(16, 185, 129, 0.1)', // emerald-500/10
  },
  default: {
    primary: '#6B7280', // gray-500
    background: 'rgba(107, 114, 128, 0.1)', // gray-500/10
  },
} as const;

// 상태와 값에 따라 색상 결정
const getStatusColor = (status: ServerStatus, value: number): string => {
  // 상태와 값에 따라 색상 결정
  if (status === 'critical' || value > 85) return colorThemes.critical.primary;
  if (status === 'warning' || value > 70) return colorThemes.warning.primary;
  if (status === 'online' || value <= 70) return colorThemes.online.primary;

  return colorThemes.default.primary;
};

const getBackgroundColor = (status: ServerStatus): string => {
  if (status === 'critical') return colorThemes.critical.background;
  if (status === 'warning') return colorThemes.warning.background;
  if (status === 'online') return colorThemes.online.background;

  return colorThemes.default.background;
};

export const ServerMetricsChart: React.FC<ServerMetricsChartProps> = memo(
  ({
    type,
    value,
    max = 100,
    status,
    size = 'md',
    showLabel = true,
    className = '',
    animationDuration = 300,
  }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [animationValue, setAnimationValue] = useState(0);
    const animationFrameRef = useRef<number | null>(null);

    const sizeConfig = {
      sm: { width: 40, height: 40 },
      md: { width: 60, height: 60 },
      lg: { width: 80, height: 80 },
    };

    const { width, height } = sizeConfig[size];

    // 애니메이션 효과
    useEffect(() => {
      // 이전 애니메이션 프레임이 있으면 취소
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      const startTime = performance.now();
      const startValue = animationValue;
      const targetValue = value;

      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / animationDuration, 1);
        const currentValue = startValue + (targetValue - startValue) * progress;

        setAnimationValue(currentValue);

        if (progress < 1) {
          animationFrameRef.current = requestAnimationFrame(animate);
        } else {
          setAnimationValue(targetValue);
          animationFrameRef.current = null;
        }
      };

      animationFrameRef.current = requestAnimationFrame(animate);

      return () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }
      };
    }, [value, animationValue, animationDuration]);

    // Canvas에 차트 그리기
    const drawChart = useCallback(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Canvas 크기 설정
      canvas.width = width;
      canvas.height = height;

      // 배경 지우기
      ctx.clearRect(0, 0, width, height);

      // 색상 설정
      const fillColor = getStatusColor(status, animationValue);
      const bgColor = getBackgroundColor(status);

      // 차트 중심
      const centerX = width / 2;
      const centerY = height / 2;
      const radius = Math.min(width, height) * 0.4;

      // 배경 원
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
      ctx.fillStyle = bgColor;
      ctx.fill();

      // 진행률 원 (호)
      const startAngle = -Math.PI / 2; // 12시 방향 시작
      const endAngle = startAngle + (animationValue / max) * 2 * Math.PI;

      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.strokeStyle = fillColor;
      ctx.lineWidth = size === 'sm' ? 4 : size === 'md' ? 5 : 6;
      ctx.lineCap = 'round';
      ctx.stroke();

      // 텍스트 (값)
      if (showLabel) {
        ctx.font = `${size === 'sm' ? 10 : size === 'md' ? 12 : 14}px Arial`;
        ctx.fillStyle = fillColor;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${Math.round(animationValue)}%`, centerX, centerY);
      }
    }, [animationValue, max, status, size, showLabel, width, height]);

    useEffect(() => {
      drawChart();
    }, [drawChart]);

    // 차트 제목 생성
    const chartTitle =
      type === 'cpu'
        ? 'CPU 사용률'
        : type === 'memory'
          ? '메모리 사용률'
          : type === 'disk'
            ? '디스크 사용률'
            : '네트워크 사용률';

    return (
      <div className={`inline-flex flex-col items-center ${className}`}>
        <div
          className="relative"
          role="group"
          aria-label={`${chartTitle} ${Math.round(value)}%`}
        >
          <canvas ref={canvasRef} />
          {/* 텍스트 기반 대체 - 스크린 리더용 */}
          <span className="sr-only">
            {chartTitle}: {Math.round(value)}% ({status})
          </span>
        </div>
        {showLabel && (
          <span
            className={`mt-1 text-xs font-medium ${
              status === 'critical'
                ? 'text-red-600'
                : status === 'warning'
                  ? 'text-amber-600'
                  : status === 'online'
                    ? 'text-emerald-600'
                    : 'text-gray-600'
            } `}
            aria-hidden="true"
          >
            {type === 'cpu'
              ? 'CPU'
              : type === 'memory'
                ? 'MEM'
                : type === 'disk'
                  ? 'DISK'
                  : 'NET'}
          </span>
        )}
      </div>
    );
  }
);

ServerMetricsChart.displayName = 'ServerMetricsChart';

export default ServerMetricsChart;
