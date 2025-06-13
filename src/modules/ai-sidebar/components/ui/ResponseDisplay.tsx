/**
 * 💬 AI 답변 표시 컴포넌트
 *
 * - CSS 기반 타이핑 효과 (안전함)
 * - 답변 포맷팅
 * - 상태 표시
 */

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import SafeCSSTypingEffect from '../../../../components/ui/SafeCSSTypingEffect';

interface ResponseDisplayProps {
  answer: string;
  isProcessing?: boolean;
  isTyping?: boolean;
  onTypingComplete?: () => void;
  className?: string;
}

export const ResponseDisplay: React.FC<ResponseDisplayProps> = ({
  answer,
  isProcessing = false,
  isTyping = false,
  onTypingComplete,
  className = '',
}) => {
  if (isProcessing && !answer) {
    return (
      <div
        className={`bg-gray-50 dark:bg-gray-800 p-4 rounded-lg ${className}`}
      >
        <div className='flex items-start gap-3'>
          <div className='w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0'>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className='text-white text-sm font-medium'
            >
              🤖
            </motion.div>
          </div>
          <div className='flex-1'>
            <p className='text-green-900 dark:text-green-100 font-medium mb-1'>
              AI 답변
            </p>
            <div className='flex items-center space-x-2 text-green-700 dark:text-green-300 text-sm'>
              <motion.div
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className='flex space-x-1'
              >
                <div className='w-2 h-2 bg-green-500 rounded-full'></div>
                <div className='w-2 h-2 bg-green-500 rounded-full'></div>
                <div className='w-2 h-2 bg-green-500 rounded-full'></div>
              </motion.div>
              <span>AI가 답변을 생성하고 있습니다...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!answer) {
    return null;
  }

  return (
    <div className={`bg-gray-50 dark:bg-gray-800 p-4 rounded-lg ${className}`}>
      <div className='flex items-start gap-3'>
        <div className='w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0'>
          <span className='text-white text-sm font-medium'>A</span>
        </div>
        <div className='flex-1'>
          <p className='text-green-900 dark:text-green-100 font-medium mb-2'>
            AI 답변
          </p>
          <div className='text-green-700 dark:text-green-300 text-sm space-y-2'>
            {isTyping ? (
              // 🎨 안전한 CSS 기반 타이핑 효과 사용
              <SafeCSSTypingEffect
                text={answer}
                speed={3}
                showCursor={true}
                onComplete={onTypingComplete}
                className='leading-relaxed'
              />
            ) : (
              // 타이핑 완료 후 전체 텍스트 표시
              answer.split('\n').map((line, index) => (
                <motion.p
                  key={index}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className='leading-relaxed'
                >
                  {line}
                </motion.p>
              ))
            )}
          </div>

          {/* 답변 완료 시간 */}
          {!isTyping && !isProcessing && (
            <div className='mt-3 text-xs text-gray-500 dark:text-gray-400'>
              답변 완료 • {new Date().toLocaleTimeString('ko-KR')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
