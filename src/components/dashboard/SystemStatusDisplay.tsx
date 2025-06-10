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
      <div className='hidden lg:flex items-center gap-3 px-3 py-1 bg-yellow-50 rounded-lg border border-yellow-200'>
        <div className='flex items-center gap-2'>
          <div className='w-2 h-2 bg-yellow-500 rounded-full'></div>
          <span className='text-sm font-medium text-yellow-700'>
            시스템 일시정지
          </span>
        </div>
        <div className='text-xs text-yellow-600'>{pauseReason}</div>
        <button
          onClick={onSystemResume}
          className='text-xs text-green-600 hover:text-green-800 hover:bg-green-100 px-2 py-1 rounded transition-colors'
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
      <div className='hidden lg:flex items-center gap-3 px-3 py-1 bg-green-50 rounded-lg border border-green-200'>
        <div className='flex items-center gap-2'>
          <div className='w-2 h-2 bg-green-500 rounded-full animate-pulse'></div>
          <span className='text-sm font-medium text-green-700'>
            {sessionType} 실행 중
          </span>
        </div>
        <div className='text-xs text-green-600'>{formattedTime}</div>
        <div className='flex gap-1'>
          {isUserSession && (
            <button
              onClick={onSystemPause}
              className='text-xs text-yellow-600 hover:text-yellow-800 hover:bg-yellow-100 px-2 py-1 rounded transition-colors'
              title='시스템 일시정지'
            >
              일시정지
            </button>
          )}
          <button
            onClick={onSystemStop}
            className='text-xs text-red-600 hover:text-red-800 hover:bg-red-100 px-2 py-1 rounded transition-colors'
            title='시스템 중지'
          >
            중지
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className='hidden lg:flex items-center gap-3 px-3 py-1 bg-gray-50 rounded-lg border border-gray-200'>
      <div className='flex items-center gap-2'>
        <div className='w-2 h-2 bg-gray-400 rounded-full'></div>
        <span className='text-sm font-medium text-gray-600'>시스템 중지됨</span>
      </div>
      <button
        onClick={() => (window.location.href = '/')}
        className='text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-100 px-2 py-1 rounded transition-colors'
        title='랜딩페이지에서 시스템 시작'
      >
        시작하기
      </button>
    </div>
  );
});

export default SystemStatusDisplay;
