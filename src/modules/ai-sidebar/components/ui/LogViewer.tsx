/**
 * 📋 로그 뷰어 컴포넌트
 * 
 * Component Composition: 로그 표시 기능을 독립적인 컴포넌트로 분리
 * Single Responsibility: 로그 표시와 검증 기능만 담당
 */

'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogViewerProps, LogLevel } from '../types/AIResponseTypes';

export const LogViewer: React.FC<LogViewerProps> = ({
  logs,
  isExpanded,
  onToggle,
  onVerifyLog,
}) => {
  const getLogLevelStyle = (level: LogLevel): string => {
    switch (level) {
      case 'INFO':
        return 'bg-blue-500 text-white';
      case 'DEBUG':
        return 'bg-yellow-500 text-black';
      case 'PROCESSING':
        return 'bg-green-500 text-white';
      case 'SUCCESS':
        return 'bg-green-500 text-white';
      case 'ANALYSIS':
        return 'bg-purple-500 text-white';
      case 'WARNING':
        return 'bg-orange-500 text-white';
      case 'ERROR':
        return 'bg-red-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const isProcessing = logs.some(log => log.level === 'PROCESSING');

  return (
    <div className='border-b dark:border-gray-700'>
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
              ease: 'linear',
            }}
            className='w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center'
          >
            <motion.div
              className='w-2 h-2 bg-white rounded-full'
              animate={
                isProcessing
                  ? {
                      scale: [1, 0.8, 1],
                      opacity: [1, 0.6, 1],
                    }
                  : {}
              }
              transition={{
                duration: 1,
                repeat: isProcessing ? Infinity : 0,
              }}
            />
          </motion.div>
          <span className='text-sm font-medium text-gray-900 dark:text-white'>
            AI 생각과정 {logs.length > 0 && `(${logs.length})`}
            {isProcessing && (
              <span className='ml-2 text-blue-600 dark:text-blue-400'>
                처리 중...
              </span>
            )}
          </span>
        </div>
        <motion.svg
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className='w-4 h-4 text-gray-500'
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
        </motion.svg>
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
            <div className='p-3 bg-gray-50 dark:bg-gray-800 max-h-96 overflow-y-auto'>
              {logs.length === 0 ? (
                <div className='text-center py-8 text-gray-500 dark:text-gray-400'>
                  <div className='w-12 h-12 mx-auto mb-3 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center'>
                    <svg
                      className='w-6 h-6'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z'
                      />
                    </svg>
                  </div>
                  <p className='text-sm'>AI가 생각하고 있습니다...</p>
                </div>
              ) : (
                <div className='space-y-2'>
                  {logs.map((log, index) => (
                    <motion.div
                      key={`${log.id}-${index}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className='bg-white dark:bg-gray-900 rounded-lg p-3 shadow-sm border dark:border-gray-700'
                    >
                      <div className='flex items-start justify-between'>
                        <div className='flex-1 min-w-0'>
                          <div className='flex items-center space-x-2 mb-1'>
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${getLogLevelStyle(
                                log.level as LogLevel
                              )}`}
                            >
                              {log.level}
                            </span>
                            <span className='text-xs font-medium text-gray-600 dark:text-gray-300'>
                              {log.module}
                            </span>
                            <span className='text-xs text-gray-400'>
                              {new Date(log.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                          <p className='text-sm text-gray-900 dark:text-white mb-1'>
                            {log.message}
                          </p>
                          {log.details && (
                            <p className='text-xs text-gray-600 dark:text-gray-400'>
                              {log.details}
                            </p>
                          )}
                          {log.metadata && Object.keys(log.metadata).length > 0 && (
                            <div className='mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs'>
                              <div className='grid grid-cols-2 gap-1'>
                                {Object.entries(log.metadata).map(([key, value]) => (
                                  <div key={key} className='flex justify-between'>
                                    <span className='text-gray-600 dark:text-gray-400'>
                                      {key}:
                                    </span>
                                    <span className='text-gray-900 dark:text-white font-mono'>
                                      {String(value)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => onVerifyLog(log)}
                          className='ml-2 px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors'
                          title='로그 검증'
                        >
                          검증
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}; 