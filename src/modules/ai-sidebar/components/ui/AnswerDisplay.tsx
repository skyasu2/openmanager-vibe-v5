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
          <p
            key={index}
            className='font-semibold text-gray-900 dark:text-white mb-2'
          >
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
            <p className='text-green-900 dark:text-green-100 font-medium'>
              AI 응답
            </p>
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
                <div className='css-typing-container'>
                  <span
                    className='css-typing-text'
                    style={
                      {
                        '--typing-duration': '3s',
                        '--text-length': typingText.length,
                      } as React.CSSProperties
                    }
                  >
                    {formatAnswer(typingText)}
                  </span>
                  <span className='css-typing-cursor' />
                </div>
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

      <style jsx>{`
        .css-typing-container {
          display: inline-block;
          position: relative;
        }

        .css-typing-text {
          overflow: hidden;
          border-right: 2px solid;
          white-space: nowrap;
          animation: typing var(--typing-duration)
            steps(var(--text-length), end);
          width: 0;
          animation-fill-mode: forwards;
          display: inline-block;
        }

        .css-typing-cursor {
          display: inline-block;
          width: 2px;
          height: 1.2em;
          background-color: #059669;
          margin-left: 2px;
          animation: blink 1s infinite;
          vertical-align: text-bottom;
        }

        @keyframes typing {
          from {
            width: 0;
          }
          to {
            width: 100%;
          }
        }

        @keyframes blink {
          0%,
          50% {
            opacity: 1;
          }
          51%,
          100% {
            opacity: 0;
          }
        }

        /* 접근성: 애니메이션 비활성화 설정 시 */
        @media (prefers-reduced-motion: reduce) {
          .css-typing-text {
            animation: none;
            width: 100%;
          }

          .css-typing-cursor {
            animation: none;
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};
