'use client';

import { AlertTriangle, Clock, RotateCcw } from 'lucide-react';

/**
 * 자동 로그아웃 경고 컴포넌트 v1.0
 * OpenManager Vibe v5 - 베르셀 사용량 최적화
 */

interface AutoLogoutWarningProps {
  remainingTime: number;
  isWarning: boolean;
  onExtendSession: () => void;
  onLogoutNow: () => void;
}

export function AutoLogoutWarning({
  remainingTime,
  isWarning,
  onExtendSession,
  onLogoutNow,
}: AutoLogoutWarningProps) {
  if (!isWarning) return null;

  const minutes = Math.floor(remainingTime / 60);
  const seconds = remainingTime % 60;

  return (
    <div className='fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4'>
      <div className='bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6 _animate-in zoom-in-95 duration-300'>
        {/* 헤더 */}
        <div className='flex items-center gap-3 mb-4'>
          <div className='p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg'>
            <AlertTriangle className='w-6 h-6 text-amber-600 dark:text-amber-400' />
          </div>
          <div>
            <h3 className='text-lg font-semibold text-gray-900 dark:text-white'>
              자동 로그아웃 경고
            </h3>
            <p className='text-sm text-gray-500 dark:text-gray-400'>
              베르셀 사용량 최적화를 위한 자동 로그아웃
            </p>
          </div>
        </div>

        {/* 시간 표시 */}
        <div className='bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4 mb-6'>
          <div className='flex items-center justify-center gap-2 mb-2'>
            <Clock className='w-5 h-5 text-amber-600 dark:text-amber-400' />
            <span className='text-lg font-mono font-bold text-amber-700 dark:text-amber-300'>
              {minutes}:{seconds.toString().padStart(2, '0')}
            </span>
          </div>
          <p className='text-center text-sm text-amber-700 dark:text-amber-300'>
            위 시간 후 자동으로 로그아웃됩니다
          </p>
        </div>

        {/* 설명 */}
        <div className='mb-6 space-y-2'>
          <p className='text-sm text-gray-600 dark:text-gray-300'>
            <strong>사용자 비활성 상태가 감지되었습니다.</strong>
          </p>
          <p className='text-xs text-gray-500 dark:text-gray-400'>
            베르셀 서버리스 사용량을 줄이기 위해 비활성 상태에서는 자동으로
            로그아웃됩니다. 계속 사용하시려면 &quot;세션 연장&quot;을 클릭하거나
            화면을 클릭하세요.
          </p>
        </div>

        {/* 버튼들 */}
        <div className='flex gap-3'>
          <button
            onClick={onExtendSession}
            className='flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors'
          >
            <RotateCcw className='w-4 h-4' />
            세션 연장
          </button>
          <button
            onClick={onLogoutNow}
            className='px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg font-medium transition-colors'
          >
            지금 로그아웃
          </button>
        </div>

        {/* 추가 정보 */}
        <div className='mt-4 pt-4 border-t border-gray-200 dark:border-gray-700'>
          <p className='text-xs text-gray-400 dark:text-gray-500 text-center'>
            💡 베르셀 무료티어 보호를 위한 자동 시스템입니다
          </p>
        </div>
      </div>
    </div>
  );
}
