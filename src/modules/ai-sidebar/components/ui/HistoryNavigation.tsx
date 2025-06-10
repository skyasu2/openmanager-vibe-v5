/**
 * 📚 AI 답변 히스토리 네비게이션 컴포넌트
 *
 * - 좌우 네비게이션
 * - 페이지 인디케이터
 * - 히스토리 요약
 */

'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface QAItem {
  id: string;
  question: string;
  answer: string;
  isProcessing: boolean;
  thinkingLogs: any[];
  timestamp: number;
  sessionId: string;
  category: 'monitoring' | 'analysis' | 'prediction' | 'incident' | 'general';
}

interface HistoryNavigationProps {
  qaItems: QAItem[];
  currentIndex: number;
  onNavigate: (index: number) => void;
  isTyping?: boolean;
  className?: string;
}

export const HistoryNavigation: React.FC<HistoryNavigationProps> = ({
  qaItems,
  currentIndex,
  onNavigate,
  isTyping = false,
  className = '',
}) => {
  const canGoPrev = currentIndex > 0;
  const canGoNext = currentIndex < qaItems.length - 1;

  const goToPrev = () => {
    if (canGoPrev && !isTyping) {
      onNavigate(currentIndex - 1);
    }
  };

  const goToNext = () => {
    if (canGoNext && !isTyping) {
      onNavigate(currentIndex + 1);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'monitoring':
        return '👁️';
      case 'analysis':
        return '📈';
      case 'prediction':
        return '🔮';
      case 'incident':
        return '🚨';
      default:
        return '❓';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'monitoring':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200';
      case 'analysis':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200';
      case 'prediction':
        return 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200';
      case 'incident':
        return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200';
      default:
        return 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-200';
    }
  };

  if (qaItems.length === 0) {
    return null;
  }

  const currentItem = qaItems[currentIndex];

  return (
    <div className={`space-y-3 ${className}`}>
      {/* 헤더 - 현재 위치 및 네비게이션 */}
      <div className='flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700'>
        <div className='flex items-center space-x-3'>
          {/* 카테고리 배지 */}
          {currentItem && (
            <div
              className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(currentItem.category)}`}
            >
              <span>{getCategoryIcon(currentItem.category)}</span>
              <span>{currentItem.category}</span>
            </div>
          )}

          <span className='text-sm font-medium text-gray-900 dark:text-white'>
            {qaItems.length > 0
              ? `질문 ${Math.min(currentIndex + 1, qaItems.length)} / ${qaItems.length}`
              : '질문 대기 중...'}
          </span>
        </div>

        {/* 좌우 네비게이션 버튼 */}
        <div className='flex items-center space-x-1'>
          <motion.button
            onClick={goToPrev}
            disabled={!canGoPrev || isTyping}
            whileHover={canGoPrev && !isTyping ? { scale: 1.05 } : {}}
            whileTap={canGoPrev && !isTyping ? { scale: 0.95 } : {}}
            className={`p-2 rounded-lg transition-colors ${
              canGoPrev && !isTyping
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
          </motion.button>

          <motion.button
            onClick={goToNext}
            disabled={!canGoNext || isTyping}
            whileHover={canGoNext && !isTyping ? { scale: 1.05 } : {}}
            whileTap={canGoNext && !isTyping ? { scale: 0.95 } : {}}
            className={`p-2 rounded-lg transition-colors ${
              canGoNext && !isTyping
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
          </motion.button>
        </div>
      </div>

      {/* 페이지 인디케이터 */}
      {qaItems.length > 1 && (
        <div className='flex justify-center space-x-1 py-2'>
          {qaItems.map((_, index) => (
            <motion.button
              key={index}
              onClick={() => !isTyping && onNavigate(index)}
              disabled={isTyping}
              whileHover={!isTyping ? { scale: 1.2 } : {}}
              className={`w-2 h-2 rounded-full transition-all duration-200 ${
                index === currentIndex
                  ? 'bg-blue-500 w-4'
                  : isTyping
                    ? 'bg-gray-200 dark:bg-gray-700 cursor-not-allowed'
                    : 'bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 cursor-pointer'
              }`}
            />
          ))}
        </div>
      )}

      {/* 히스토리 요약 (3개 이상일 때) */}
      {qaItems.length >= 3 && (
        <div className='bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg'>
          <div className='text-xs text-gray-600 dark:text-gray-400 mb-2 font-medium'>
            📚 최근 질문 히스토리
          </div>
          <div className='space-y-1'>
            {qaItems.slice(-3).map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className='flex items-center space-x-2 text-xs'
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                    item.category === 'incident'
                      ? 'bg-red-500'
                      : item.category === 'prediction'
                        ? 'bg-orange-500'
                        : item.category === 'analysis'
                          ? 'bg-blue-500'
                          : 'bg-gray-500'
                  }`}
                ></span>
                <span className='text-gray-600 dark:text-gray-400 truncate'>
                  {item.question.length > 25
                    ? item.question.slice(0, 25) + '...'
                    : item.question}
                </span>
                <span className='text-gray-400 dark:text-gray-500'>
                  {new Date(item.timestamp).toLocaleTimeString('ko-KR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
