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
      <div className="hidden items-center gap-4 lg:flex">
        {/* 상태 카드 */}
        <div className="flex items-center gap-3 rounded-lg border-l-4 border-yellow-500 bg-yellow-50 px-4 py-2 shadow-md dark:bg-yellow-900/20">
          <div className="flex items-center gap-2">
            <div className="animate-pulse h-3 w-3 rounded-full bg-yellow-500"></div>
            <span className="text-sm font-semibold text-yellow-800 dark:text-yellow-200">
              시스템 일시정지
            </span>
          </div>
          <div className="rounded bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-700 dark:bg-yellow-800/30 dark:text-yellow-300">
            {pauseReason}
          </div>
        </div>

        {/* 제어 버튼 */}
        <button
          onClick={onSystemResume}
          className="transform rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white shadow-md transition-all duration-200 hover:scale-105 hover:bg-green-700 hover:shadow-lg"
          title="시스템 재개"
        >
          재개
        </button>
      </div>
    );
  }

  if (isSystemActive && !isSystemPaused) {
    const sessionType = isUserSession ? '사용자 세션' : 'AI 세션';

    return (
      <div className="hidden items-center gap-4 lg:flex">
        {/* 상태 카드 */}
        <div className="flex items-center gap-3 rounded-lg border-l-4 border-green-500 bg-green-50 px-4 py-2 shadow-md dark:bg-green-900/20">
          <div className="flex items-center gap-2">
            <div className="animate-pulse h-3 w-3 rounded-full bg-green-500"></div>
            <span className="text-sm font-semibold text-green-800 dark:text-green-200">
              {sessionType} 실행 중
            </span>
          </div>
          <div className="rounded bg-green-100 px-2 py-1 text-xs font-medium text-green-700 dark:bg-green-800/30 dark:text-green-300">
            {formattedTime}
          </div>
        </div>

        {/* 제어 버튼들 */}
        <div className="flex gap-2">
          {isUserSession && (
            <button
              onClick={onSystemPause}
              className="transform rounded-lg bg-yellow-500 px-3 py-2 text-sm font-medium text-white shadow-md transition-all duration-200 hover:scale-105 hover:bg-yellow-600 hover:shadow-lg"
              title="시스템 일시정지"
            >
              일시정지
            </button>
          )}
          <button
            onClick={onSystemStop}
            className="transform rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white shadow-md transition-all duration-200 hover:scale-105 hover:bg-red-700 hover:shadow-lg"
            title="시스템 중지"
          >
            중지
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="hidden items-center gap-4 lg:flex">
      {/* 상태 카드 */}
      <div className="flex items-center gap-3 rounded-lg border-l-4 border-gray-400 bg-gray-50 px-4 py-2 shadow-md dark:bg-gray-800/50">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-gray-400"></div>
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            시스템 중지됨
          </span>
        </div>
      </div>

      {/* 시작 버튼 */}
      <button
        onClick={() => (window.location.href = '/main')}
        className="transform rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white shadow-md transition-all duration-200 hover:scale-105 hover:bg-blue-700 hover:shadow-lg"
        title="랜딩페이지에서 시스템 시작"
      >
        시작하기
      </button>
    </div>
  );
});

export default SystemStatusDisplay;
