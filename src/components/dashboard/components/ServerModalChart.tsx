/**
 * 🎯 Server Modal Chart v1.0
 *
 * 서버 모달용 실시간 차트 컴포넌트
 * SOLID 원칙 적용: 차트 컴포넌트를 별도 모듈로 분리
 */

import { RealtimeChartProps } from '../types/ServerModalTypes';

export const ServerModalChart: React.FC<RealtimeChartProps> = ({
  data,
  color,
  label,
  height = 100,
}) => {
  const points = data
    .map((value, index) => {
      const x = (index / Math.max(data.length - 1, 1)) * 100;
      const y = 100 - Math.max(0, Math.min(100, value));
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <div className='bg-white rounded-lg p-4 shadow-sm border'>
      <h4 className='text-sm font-medium text-gray-700 mb-2'>{label}</h4>
      <div className='relative' style={{ height }}>
        <svg
          className='w-full h-full'
          viewBox='0 0 100 100'
          preserveAspectRatio='none'
        >
          <defs>
            <linearGradient
              id={`area-gradient-${label}`}
              x1='0%'
              y1='0%'
              x2='0%'
              y2='100%'
            >
              <stop offset='0%' stopColor={color} stopOpacity='0.3' />
              <stop offset='100%' stopColor={color} stopOpacity='0.05' />
            </linearGradient>
          </defs>
          {/* 격자 */}
          {[20, 40, 60, 80].map(y => (
            <line
              key={y}
              x1='0'
              y1={y}
              x2='100'
              y2={y}
              stroke='#f3f4f6'
              strokeWidth='0.5'
            />
          ))}
          {/* 영역 */}
          <polygon
            fill={`url(#area-gradient-${label})`}
            points={`0,100 ${points} 100,100`}
          />
          {/* 라인 */}
          <polyline
            fill='none'
            stroke={color}
            strokeWidth='2'
            points={points}
            vectorEffect='non-scaling-stroke'
            className='drop-shadow-sm'
          />
          {/* 최신 값 포인트 */}
          {data.length > 0 && (
            <circle
              cx={((data.length - 1) / Math.max(data.length - 1, 1)) * 100}
              cy={100 - Math.max(0, Math.min(100, data[data.length - 1]))}
              r='2'
              fill={color}
              className='drop-shadow-sm'
            />
          )}
        </svg>
        {/* Y축 라벨 */}
        <div className='absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-400 pr-2'>
          <span>100</span>
          <span>50</span>
          <span>0</span>
        </div>
      </div>
      <div className='text-right mt-1'>
        <span className='text-sm font-bold' style={{ color }}>
          {data[data.length - 1]?.toFixed(1) || '0'}%
        </span>
      </div>
    </div>
  );
};

// 기본 내보내기
export default ServerModalChart;
