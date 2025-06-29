/**
 * AISidebarMobile Component
 *
 * 📱 모바일용 AI 사이드바 컴포넌트
 */

'use client';

import React from 'react';
import { AISidebarConfig } from '../types';
import { ChatInterface } from './ChatInterface';
import { StatusIndicator } from './StatusIndicator';

interface AISidebarMobileProps {
  config: AISidebarConfig;
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

export const AISidebarMobile: React.FC<AISidebarMobileProps> = ({
  config,
  isOpen,
  onClose,
  className = '',
}) => {
  return (
    <>
      {/* 오버레이 */}
      {isOpen && (
        <div
          className='fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden'
          onClick={onClose}
        />
      )}

      {/* 모바일 사이드바 */}
      <div
        className={`
          fixed inset-x-0 bottom-0 top-16 bg-white dark:bg-gray-900 
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-y-0' : 'translate-y-full'}
          z-50 flex flex-col md:hidden
          ${className}
        `.trim()}
      >
        {/* 헤더 */}
        <div className='flex items-center justify-between p-4 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-800'>
          <div className='flex items-center space-x-2'>
            <div className='w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center'>
              <span className='text-white text-sm font-bold'>AI</span>
            </div>
            <h2 className='text-lg font-semibold text-gray-900 dark:text-white'>
              {config.title}
            </h2>
          </div>

          <div className='flex items-center space-x-2'>
            <StatusIndicator />
            <button
              onClick={onClose}
              className='p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors'
              aria-label='사이드바 닫기'
            >
              <svg
                className='w-6 h-6 text-gray-500'
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
            </button>
          </div>
        </div>

        {/* 채팅 인터페이스 */}
        <div className='flex-1 overflow-hidden'>
          <ChatInterface
            config={config}
            welcomeMessage={config.welcomeMessage}
          />
        </div>
      </div>
    </>
  );
};
