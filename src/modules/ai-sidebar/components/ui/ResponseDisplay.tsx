/**
 * 💬 AI 답변 표시 컴포넌트
 *
 * - 타이핑 효과
 * - 답변 포맷팅
 * - 상태 표시
 */

'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

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
  const [displayedText, setDisplayedText] = useState('');
  const [typingIndex, setTypingIndex] = useState(0);

  // 타이핑 효과
  useEffect(() => {
    if (!isTyping || !answer) {
      setDisplayedText(answer);
      return;
    }

    if (typingIndex < answer.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(answer.slice(0, typingIndex + 1));
        setTypingIndex(prev => prev + 1);
      }, 30); // 30ms 간격으로 타이핑

      return () => clearTimeout(timeout);
    } else if (onTypingComplete) {
      onTypingComplete();
    }
  }, [answer, isTyping, typingIndex, onTypingComplete]);

  // answer가 변경되면 타이핑 리셋
  useEffect(() => {
    setTypingIndex(0);
    setDisplayedText('');
  }, [answer]);

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
            {displayedText.split('\n').map((line, index) => (
              <motion.p
                key={index}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.1 }}
                className='leading-relaxed'
              >
                {line}
              </motion.p>
            ))}

            {/* 타이핑 커서 */}
            {isTyping && typingIndex < answer.length && (
              <motion.span
                animate={{ opacity: [0, 1, 0] }}
                transition={{ duration: 0.8, repeat: Infinity }}
                className='inline-block w-0.5 h-4 bg-green-600 dark:bg-green-400 ml-1'
              />
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
