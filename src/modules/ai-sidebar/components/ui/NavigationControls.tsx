/**
 * 🧭 네비게이션 컨트롤 컴포넌트
 * 
 * Component Composition: UI 요소를 작은 단위로 분리
 * Single Responsibility: 네비게이션 기능만 담당
 */

'use client';

import React from 'react';
import { NavigationControlsProps } from '../types/AIResponseTypes';

export const NavigationControls: React.FC<NavigationControlsProps> = ({
  navigation,
  isTyping,
  onPrev,
  onNext,
}) => {
  return (
    <div className='flex items-center space-x-1'>
      <button
        onClick={onPrev}
        disabled={!navigation.canGoPrev || isTyping}
        className={`p-2 rounded-lg transition-colors ${
          navigation.canGoPrev && !isTyping
            ? 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
            : 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
        }`}
        title={isTyping ? '타이핑 중에는 이동할 수 없습니다' : '이전 질문'}
      >
        <svg
          className='w-4 h-4'
          fill='none'
          stroke='currentColor'
          viewBox='0 0 24 24'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M15 19l-7-7 7-7'
          />
        </svg>
      </button>
      
      <button
        onClick={onNext}
        disabled={!navigation.canGoNext || isTyping}
        className={`p-2 rounded-lg transition-colors ${
          navigation.canGoNext && !isTyping
            ? 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
            : 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
        }`}
        title={isTyping ? '타이핑 중에는 이동할 수 없습니다' : '다음 질문'}
      >
        <svg
          className='w-4 h-4'
          fill='none'
          stroke='currentColor'
          viewBox='0 0 24 24'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M9 5l7 7-7 7'
          />
        </svg>
      </button>
    </div>
  );
}; 