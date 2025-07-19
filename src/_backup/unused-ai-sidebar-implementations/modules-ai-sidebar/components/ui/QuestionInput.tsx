/**
 * 🎯 AI 질문 입력 컴포넌트
 *
 * - 질문 입력 필드
 * - 제출 버튼
 * - 입력 상태 관리
 */

'use client';

import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';

interface QuestionInputProps {
  onSubmit: (question: string) => void;
  isProcessing?: boolean;
  placeholder?: string;
  className?: string;
}

export const QuestionInput: React.FC<QuestionInputProps> = ({
  onSubmit,
  isProcessing = false,
  placeholder = 'AI에게 질문해보세요...',
  className = '',
}) => {
  const [question, setQuestion] = useState('');

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (question.trim() && !isProcessing) {
        onSubmit(question.trim());
        setQuestion('');
      }
    },
    [question, isProcessing, onSubmit]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit(e);
      }
    },
    [handleSubmit]
  );

  return (
    <form onSubmit={handleSubmit} className={`w-full ${className}`}>
      <div className='relative'>
        <textarea
          value={question}
          onChange={e => setQuestion(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={isProcessing}
          rows={3}
          className={`
            w-full resize-none rounded-lg border border-gray-300 dark:border-gray-600
            bg-white dark:bg-gray-800 
            px-4 py-3 pr-12
            text-sm text-gray-900 dark:text-white
            placeholder:text-gray-500 dark:placeholder:text-gray-400
            focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20
            transition-all duration-200
            ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        />

        <motion.button
          type='submit'
          disabled={!question.trim() || isProcessing}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`
            absolute bottom-2 right-2
            w-8 h-8 rounded-md
            flex items-center justify-center
            transition-all duration-200
            ${
              question.trim() && !isProcessing
                ? 'bg-blue-500 hover:bg-blue-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
            }
          `}
        >
          {isProcessing ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className='w-4 h-4 border-2 border-white border-t-transparent rounded-full'
            />
          ) : (
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
                d='M12 19l9 2-9-18-9 18 9-2zm0 0v-8'
              />
            </svg>
          )}
        </motion.button>
      </div>

      <div className='mt-2 text-xs text-gray-500 dark:text-gray-400'>
        Enter로 전송, Shift+Enter로 줄바꿈
      </div>
    </form>
  );
};
