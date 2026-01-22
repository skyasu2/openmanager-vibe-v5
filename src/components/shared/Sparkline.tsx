import type React from 'react';
import { useMemo } from 'react';

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  strokeWidth?: number;
  fill?: boolean;
}

export const Sparkline: React.FC<SparklineProps> = ({
  data,
  width = 100,
  height = 30,
  color = '#3b82f6',
  strokeWidth = 2,
  fill = false,
}) => {
  const points = useMemo(() => {
    if (!data || data.length === 0) return '';

    const max = Math.max(...data, 100); // 최소 100을 기준으로 정규화
    const min = 0;
    const range = max - min;

    const stepX = width / (data.length - 1);

    return data
      .map((val, i) => {
        const x = i * stepX;
        const y = height - ((val - min) / range) * height;
        return `${x},${y}`;
      })
      .join(' ');
  }, [data, width, height]);

  const fillPath = useMemo(() => {
    if (!points || !fill) return '';
    return `${points} ${width},${height} 0,${height}`;
  }, [points, width, height, fill]);

  if (!data || data.length < 2) return null;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="overflow-visible"
      aria-hidden="true"
    >
      {fill && <polygon points={fillPath} fill={color} fillOpacity={0.1} />}
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
