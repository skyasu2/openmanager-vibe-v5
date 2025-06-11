'use client';

import { memo } from 'react';

interface SystemStatusDisplayProps {
  isSystemActive: boolean;
  isSystemPaused: boolean;
  isUserSession: boolean;
  formattedTime: string;
  pauseReason: string;
  onSystemStop: () => void;
  onSystemPause: () => void;
  onSystemResume: () => void;
}

const SystemStatusDisplay = memo(function SystemStatusDisplay({
  isSystemActive,
  isSystemPaused,
  isUserSession,
  formattedTime,
  pauseReason,
  onSystemStop,
  onSystemPause,
  onSystemResume,
}: SystemStatusDisplayProps) {
  if (isSystemPaused && pauseReason && pauseReason.trim() !== '') {
    return (
      <div className='hidden lg:flex items-center gap-4'>
        {/* 상태 카드 */}
        <div className='flex items-center gap-3 px-4 py-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border-l-4 border-yellow-500 shadow-md'>
          <div className='flex items-center gap-2'>
            <div className='w-3 h-3 bg-yellow-500 rounded-full animate-pulse'></div>
            <span className='text-sm font-semibold text-yellow-800 dark:text-yellow-200'>
              시스템 일시정지
            </span>
          </div>
          <div className='text-xs text-yellow-700 dark:text-yellow-300 font-medium bg-yellow-100 dark:bg-yellow-800/30 px-2 py-1 rounded'>
            {pauseReason}
          </div>
        </div>

        {/* 제어 버튼 */}
        <button
          onClick={onSystemResume}
          className='px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-all duration-200 hover:scale-105 transform shadow-md hover:shadow-lg'
          title='시스템 재개'
        >
          재개
        </button>
      </div>
    );
  }

  if (isSystemActive && !isSystemPaused) {
    const sessionType = isUserSession ? '사용자 세션' : 'AI 세션';

    return (
      <div className='hidden lg:flex items-center gap-4'>
        {/* 상태 카드 */}
        <div className='flex items-center gap-3 px-4 py-2 bg-green-50 dark:bg-green-900/20 rounded-lg border-l-4 border-green-500 shadow-md'>
          <div className='flex items-center gap-2'>
            <div className='w-3 h-3 bg-green-500 rounded-full animate-pulse'></div>
            <span className='text-sm font-semibold text-green-800 dark:text-green-200'>
              {sessionType} 실행 중
            </span>
          </div>
          <div className='text-xs text-green-700 dark:text-green-300 font-medium bg-green-100 dark:bg-green-800/30 px-2 py-1 rounded'>
            {formattedTime}
          </div>
        </div>

        {/* 제어 버튼들 */}
        <div className='flex gap-2'>
          {isUserSession && (
            <button
              onClick={onSystemPause}
              className='px-3 py-2 bg-yellow-500 hover:bg-yellow-600 text-white text-sm font-medium rounded-lg transition-all duration-200 hover:scale-105 transform shadow-md hover:shadow-lg'
              title='시스템 일시정지'
            >
              일시정지
            </button>
          )}
          <button
            onClick={onSystemStop}
            className='px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-all duration-200 hover:scale-105 transform shadow-md hover:shadow-lg'
            title='시스템 중지'
          >
            중지
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className='hidden lg:flex items-center gap-4'>
      {/* 상태 카드 */}
      <div className='flex items-center gap-3 px-4 py-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg border-l-4 border-gray-400 shadow-md'>
        <div className='flex items-center gap-2'>
          <div className='w-3 h-3 bg-gray-400 rounded-full'></div>
          <span className='text-sm font-semibold text-gray-700 dark:text-gray-300'>
            시스템 중지됨
          </span>
        </div>
      </div>

      {/* 시작 버튼 */}
      <button
        onClick={() => (window.location.href = '/')}
        className='px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-all duration-200 hover:scale-105 transform shadow-md hover:shadow-lg'
        title='랜딩페이지에서 시스템 시작'
      >
        시작하기
      </button>
    </div>
  );
});

export default SystemStatusDisplay;
