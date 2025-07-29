/**
 * 💀 스켈레톤 로더 컴포넌트
 *
 * 데이터 로딩 중 표시되는 스켈레톤 UI
 * - 서버 카드 스켈레톤
 * - 차트 스켈레톤
 * - 테이블 스켈레톤
 * - 커스텀 스켈레톤
 */

import React from 'react';
import { motion } from 'framer-motion';

interface SkeletonProps {
  /** 스켈레톤 높이 */
  height?: string | number;
  /** 스켈레톤 너비 */
  width?: string | number;
  /** 둥근 모서리 */
  rounded?: boolean;
  /** 애니메이션 여부 */
  _animate?: boolean;
  /** 추가 CSS 클래스 */
  className?: string;
}

// 기본 스켈레톤 컴포넌트
export const Skeleton: React.FC<SkeletonProps> = ({
  height = '1rem',
  width = '100%',
  rounded = false,
  _animate = true,
  className = '',
}) => {
  const style = {
    height: typeof height === 'number' ? `${height}px` : height,
    width: typeof width === 'number' ? `${width}px` : width,
  };

  return (
    <div
      className={`bg-gray-200 dark:bg-gray-700 ${rounded ? 'rounded-full' : 'rounded'} ${
        _animate ? '_animate-pulse' : ''
      } ${className}`}
      style={style}
      role='status'
      aria-label='로딩 중'
    />
  );
};

// 서버 카드 스켈레톤
export const ServerCardSkeleton: React.FC = () => (
  <div className='bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-4'>
    {/* 헤더 */}
    <div className='flex items-center justify-between'>
      <div className='flex items-center space-x-3'>
        <Skeleton width={40} height={40} rounded />
        <div className='space-y-2'>
          <Skeleton width={120} height={16} />
          <Skeleton width={80} height={12} />
        </div>
      </div>
      <Skeleton width={60} height={24} rounded />
    </div>

    {/* 메트릭스 */}
    <div className='grid grid-cols-2 gap-4'>
      {[1, 2, 3, 4].map(i => (
        <div key={i} className='text-center space-y-2'>
          <Skeleton width={40} height={12} className='mx-auto' />
          <Skeleton width={60} height={20} className='mx-auto' />
        </div>
      ))}
    </div>

    {/* 버튼 */}
    <Skeleton width='100%' height={36} />
  </div>
);

// 차트 스켈레톤
export const ChartSkeleton: React.FC<{ height?: number }> = ({
  height = 200,
}) => (
  <div className='space-y-4'>
    {/* 차트 제목 */}
    <div className='flex items-center justify-between'>
      <Skeleton width={150} height={20} />
      <Skeleton width={80} height={16} />
    </div>

    {/* 차트 영역 */}
    <div className='relative'>
      <Skeleton width='100%' height={height} />

      {/* 차트 내부 요소들 */}
      <div className='absolute inset-4 space-y-2'>
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className='flex items-end space-x-2'
            style={{ height: `${20 + i * 10}%` }}
          >
            {[...Array(7)].map((_, j) => (
              <Skeleton
                key={j}
                width={`${100 / 7 - 2}%`}
                height={`${Math.random() * 80 + 20}%`}
                className='opacity-30'
              />
            ))}
          </div>
        ))}
      </div>
    </div>

    {/* 범례 */}
    <div className='flex justify-center space-x-4'>
      {[1, 2, 3].map(i => (
        <div key={i} className='flex items-center space-x-2'>
          <Skeleton width={12} height={12} rounded />
          <Skeleton width={60} height={12} />
        </div>
      ))}
    </div>
  </div>
);

// 테이블 스켈레톤
export const TableSkeleton: React.FC<{ rows?: number; columns?: number }> = ({
  rows = 5,
  columns = 4,
}) => (
  <div className='space-y-4'>
    {/* 테이블 헤더 */}
    <div
      className='grid gap-4'
      style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
    >
      {[...Array(columns)].map((_, i) => (
        <Skeleton key={i} width='80%' height={16} />
      ))}
    </div>

    {/* 테이블 행들 */}
    <div className='space-y-3'>
      {[...Array(rows)].map((_, rowIndex) => (
        <div
          key={rowIndex}
          className='grid gap-4'
          style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
        >
          {[...Array(columns)].map((_, colIndex) => (
            <Skeleton
              key={colIndex}
              width={colIndex === 0 ? '90%' : '70%'}
              height={14}
            />
          ))}
        </div>
      ))}
    </div>
  </div>
);

// 대시보드 전체 스켈레톤
export const DashboardSkeleton: React.FC = () => (
  <div className='space-y-6 p-6'>
    {/* 헤더 */}
    <div className='flex items-center justify-between'>
      <div className='space-y-2'>
        <Skeleton width={200} height={24} />
        <Skeleton width={150} height={16} />
      </div>
      <div className='flex space-x-2'>
        <Skeleton width={80} height={36} />
        <Skeleton width={100} height={36} />
      </div>
    </div>

    {/* 통계 카드들 */}
    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
      {[1, 2, 3, 4].map(i => (
        <div
          key={i}
          className='bg-white dark:bg-gray-800 rounded-lg border p-4 space-y-3'
        >
          <div className='flex items-center justify-between'>
            <Skeleton width={80} height={14} />
            <Skeleton width={24} height={24} rounded />
          </div>
          <Skeleton width={100} height={28} />
          <Skeleton width={120} height={12} />
        </div>
      ))}
    </div>

    {/* 메인 차트 */}
    <div className='bg-white dark:bg-gray-800 rounded-lg border p-6'>
      <ChartSkeleton height={300} />
    </div>

    {/* 서버 카드 그리드 */}
    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'>
      {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
        <ServerCardSkeleton key={i} />
      ))}
    </div>
  </div>
);

// 리스트 스켈레톤
export const ListSkeleton: React.FC<{ items?: number }> = ({ items = 5 }) => (
  <div className='space-y-3'>
    {[...Array(items)].map((_, i) => (
      <div
        key={i}
        className='flex items-center space-x-3 p-3 border rounded-lg'
      >
        <Skeleton width={40} height={40} rounded />
        <div className='flex-1 space-y-2'>
          <Skeleton width='60%' height={16} />
          <Skeleton width='40%' height={12} />
        </div>
        <Skeleton width={80} height={32} />
      </div>
    ))}
  </div>
);

// 애니메이션이 있는 스켈레톤
export const AnimatedSkeleton: React.FC<SkeletonProps> = props => (
  <motion.div
    initial={{ opacity: 0.6 }}
    animate={{ opacity: [0.6, 1, 0.6] }}
    transition={{ duration: 1.5, repeat: Infinity }}
  >
    <Skeleton {...props} _animate={false} />
  </motion.div>
);

// 기본 내보내기
export default Skeleton;
