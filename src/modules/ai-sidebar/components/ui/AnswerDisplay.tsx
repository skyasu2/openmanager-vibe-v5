/**
 * 💬 답변 표시 컴포넌트
 * 
 * Component Composition: 답변 표시 기능을 독립적인 컴포넌트로 분리
 * Single Responsibility: 답변 렌더링과 타이핑 효과만 담당
 */

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { AnswerDisplayProps } from '../types/AIResponseTypes';

export const AnswerDisplay: React.FC<AnswerDisplayProps> = ({
  answer,
  isProcessing,
  typingText,
}) => {
  const formatAnswer = (text: string) => {
    if (!text) return '';
    
    return text.split('\n').map((line, index) => {
      if (line.startsWith('**') && line.endsWith('**')) {
        return (
          <p key={index} className='font-semibold text-gray-900 dark:text-white mb-2'>
            {line.replace(/\*\*/g, '')}
          </p>
        );
      }
      
      if (line.match(/^\d+\./)) {
        return (
          <p key={index} className='text-gray-700 dark:text-gray-300 mb-1 ml-4'>
            {line}
          </p>
        );
      }
      
      return (
        <p key={index} className='text-gray-700 dark:text-gray-300 mb-2'>
          {line}
        </p>
      );
    });
  };

  return (
    <div className='p-4'>
      <div className='flex items-start gap-3'>
        <div className='w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0'>
          <span className='text-white text-sm font-medium'>A</span>
        </div>
        <div className='flex-1'>
          <div className='flex items-center gap-2 mb-2'>
            <p className='text-green-900 dark:text-green-100 font-medium'>AI 응답</p>
            {isProcessing && (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className='w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full'
              />
            )}
          </div>
          
          <div className='bg-green-50 dark:bg-green-900/20 rounded-lg p-4'>
            {isProcessing ? (
              <div className='flex items-center space-x-2'>
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className='w-2 h-2 bg-green-500 rounded-full'
                />
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                  className='w-2 h-2 bg-green-500 rounded-full'
                />
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
                  className='w-2 h-2 bg-green-500 rounded-full'
                />
                <span className='text-green-700 dark:text-green-300 text-sm ml-2'>
                  AI가 답변을 생성하고 있습니다...
                </span>
              </div>
            ) : typingText ? (
              <div className='text-green-800 dark:text-green-200 text-sm whitespace-pre-wrap'>
                {formatAnswer(typingText)}
                <motion.span
                  animate={{ opacity: [1, 0] }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                  className='inline-block w-2 h-4 bg-green-600 ml-1'
                />
              </div>
            ) : answer ? (
              <div className='text-green-800 dark:text-green-200 text-sm whitespace-pre-wrap'>
                {formatAnswer(answer)}
              </div>
            ) : (
              <p className='text-green-700 dark:text-green-300 text-sm italic'>
                답변 대기 중...
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}; 