/**
 * AISidebar Component
 * 
 * 🎨 메인 AI 사이드바 컴포넌트
 */

'use client';

import React from 'react';
import { AISidebarConfig } from '../types';
import { ChatInterface } from './ChatInterface';
import { StatusIndicator } from './StatusIndicator';
import { usePowerStore } from '../../../stores/powerStore';

interface AISidebarProps {
  config: AISidebarConfig;
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

export const AISidebar: React.FC<AISidebarProps> = ({
  config,
  isOpen,
  onClose,
  className = ''
}) => {
  const { mode, getSystemStatus } = usePowerStore();
  const systemStatus = getSystemStatus();
  const isSystemActive = mode === 'active' || mode === 'monitoring';
  const sidebarClasses = `
    fixed top-0 ${config.position === 'right' ? 'right-0' : 'left-0'} 
    h-full bg-white dark:bg-gray-900 
    border-l dark:border-gray-700 shadow-xl
    transform transition-transform duration-300 ease-in-out
    ${isOpen ? 'translate-x-0' : config.position === 'right' ? 'translate-x-full' : '-translate-x-full'}
    z-50 flex flex-col
    ${className}
  `.trim();

  return (
    <>
      {/* 오버레이 */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={onClose}
        />
      )}

      {/* 사이드바 */}
      <div
        className={sidebarClasses}
        style={{ width: `${config.width}px` }}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              isSystemActive ? 'bg-green-500' : 'bg-gray-500'
            }`}>
              <span className="text-white text-sm font-bold">
                {isSystemActive ? 'AI' : '💤'}
              </span>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {config.title}
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {isSystemActive ? '활성화됨' : '절전 모드'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <StatusIndicator />
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              aria-label="사이드바 닫기"
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* 채팅 인터페이스 */}
        <div className="flex-1 overflow-hidden">
          <ChatInterface
            config={config}
            welcomeMessage={config.welcomeMessage}
          />
        </div>
      </div>
    </>
  );
}; 