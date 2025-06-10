/**
 * 🧠 AI 생각 과정 표시 컴포넌트
 *
 * - 실시간 로그 표시
 * - 접기/펼치기 기능
 * - 로그 레벨별 스타일링
 */

'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface RealTimeLogEntry {
  id: string;
  timestamp: string;
  level:
    | 'INFO'
    | 'DEBUG'
    | 'PROCESSING'
    | 'SUCCESS'
    | 'ERROR'
    | 'WARNING'
    | 'ANALYSIS'
    | 'WARN';
  module: string;
  message: string;
  details?: string;
  metadata?: Record<string, any>;
}

interface ThinkingProcessProps {
  logs: RealTimeLogEntry[];
  isExpanded?: boolean;
  isProcessing?: boolean;
  onToggle?: () => void;
  className?: string;
}

export const ThinkingProcess: React.FC<ThinkingProcessProps> = ({
  logs,
  isExpanded = true,
  isProcessing = false,
  onToggle,
  className = '',
}) => {
  const [showLibraries, setShowLibraries] = useState(false);

  const getLogLevelStyle = (level: string) => {
    switch (level) {
      case 'ERROR':
        return 'text-red-400 bg-red-900/20';
      case 'WARN':
      case 'WARNING':
        return 'text-yellow-400 bg-yellow-900/20';
      case 'SUCCESS':
        return 'text-green-400 bg-green-900/20';
      case 'DEBUG':
        return 'text-gray-400 bg-gray-900/20';
      case 'PROCESSING':
        return 'text-purple-400 bg-purple-900/20';
      case 'ANALYSIS':
        return 'text-cyan-400 bg-cyan-900/20';
      default:
        return 'text-blue-400 bg-blue-900/20';
    }
  };

  if (logs.length === 0 && !isProcessing) {
    return null;
  }

  return (
    <div className={`border-b dark:border-gray-700 ${className}`}>
      <button
        onClick={onToggle}
        className='w-full flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors'
      >
        <div className='flex items-center space-x-2'>
          <motion.div
            animate={
              isProcessing
                ? {
                    rotate: [0, 360],
                    scale: [1, 1.1, 1],
                  }
                : {}
            }
            transition={{
              duration: 2,
              repeat: isProcessing ? Infinity : 0,
            }}
            className='w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-white text-xs'
          >
            🧠
          </motion.div>
          <span className='text-sm font-medium text-purple-700 dark:text-purple-300'>
            사고 과정 {isProcessing ? '(진행 중)' : '(완료)'}
          </span>
          {logs.length > 0 && (
            <span className='text-xs text-gray-500 dark:text-gray-400'>
              ({logs.length}개 단계)
            </span>
          )}
        </div>
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <svg
            className='w-4 h-4 text-gray-400'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M19 9l-7 7-7-7'
            />
          </svg>
        </motion.div>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className='overflow-hidden'
          >
            <div className='px-4 pb-3'>
              {/* 로그 콘솔 헤더 */}
              <div className='bg-gray-900 dark:bg-black rounded-t-lg p-2 mb-2'>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center space-x-2'>
                    <div className='flex space-x-1'>
                      <div className='w-3 h-3 bg-red-500 rounded-full'></div>
                      <div className='w-3 h-3 bg-yellow-500 rounded-full'></div>
                      <div className='w-3 h-3 bg-green-500 rounded-full'></div>
                    </div>
                    <span className='text-gray-400 text-xs font-mono'>
                      AI Engine Console - Real-time Logs
                    </span>
                  </div>
                  <button
                    onClick={() => setShowLibraries(!showLibraries)}
                    className='text-green-400 text-xs hover:text-green-300 transition-colors'
                    title='사용 중인 오픈소스 라이브러리 보기'
                  >
                    📚 Libraries
                  </button>
                </div>

                {/* 오픈소스 라이브러리 정보 */}
                {showLibraries && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className='mt-2 p-2 bg-gray-800 rounded text-xs font-mono overflow-hidden'
                  >
                    <div className='text-green-400 mb-1'>
                      📊 Active Open Source Stack:
                    </div>
                    <div className='space-y-0.5 text-gray-300'>
                      <div>
                        • <span className='text-blue-400'>Next.js v15.3.2</span>{' '}
                        - React Framework
                      </div>
                      <div>
                        • <span className='text-blue-400'>Node.js v18+</span> -
                        Runtime
                      </div>
                      <div>
                        • <span className='text-blue-400'>compromise.js</span> -
                        NLP Processing
                      </div>
                      <div>
                        • <span className='text-blue-400'>Framer Motion</span> -
                        Animations
                      </div>
                      <div>
                        • <span className='text-blue-400'>Tailwind CSS</span> -
                        Styling
                      </div>
                      <div>
                        • <span className='text-blue-400'>Zustand</span> - State
                        Management
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* 로그 내용 */}
              <div className='bg-gray-900 dark:bg-black rounded-b-lg p-3 max-h-64 overflow-y-auto'>
                <div className='space-y-1.5 font-mono text-xs'>
                  {logs.map((log, index) => (
                    <motion.div
                      key={log.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className='group'
                    >
                      <div className='flex items-start gap-2'>
                        <span className='text-gray-500 flex-shrink-0'>
                          {new Date(log.timestamp).toLocaleTimeString('ko-KR', {
                            hour12: false,
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })}
                        </span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-xs font-bold flex-shrink-0 ${getLogLevelStyle(log.level)}`}
                        >
                          {log.level}
                        </span>
                        <span className='text-cyan-400 flex-shrink-0'>
                          [{log.module}]
                        </span>
                        <span className='text-gray-300 flex-1'>
                          {log.message}
                        </span>
                      </div>
                      {log.details && (
                        <div className='ml-16 text-gray-400 text-xs mt-0.5'>
                          {log.details}
                        </div>
                      )}
                    </motion.div>
                  ))}

                  {isProcessing && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className='flex items-center gap-2 text-gray-400'
                    >
                      <motion.div
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className='flex space-x-1'
                      >
                        <div className='w-1 h-1 bg-gray-400 rounded-full'></div>
                        <div className='w-1 h-1 bg-gray-400 rounded-full'></div>
                        <div className='w-1 h-1 bg-gray-400 rounded-full'></div>
                      </motion.div>
                      <span className='text-xs'>AI가 생각하고 있습니다...</span>
                    </motion.div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
