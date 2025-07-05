'use client';

// 🔧 RSC 프리렌더링 오류 방지: 동적 렌더링 강제
export const dynamic = 'force-dynamic';

/**
 * 🚨 App Router 전용 에러 페이지
 * Pages Router의 _error.js를 완전 대체
 */

import Link from 'next/link';
import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // 에러 로깅
    console.error('App Router Error:', error);
  }, [error]);

  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8'>
      <div className='max-w-md w-full space-y-8'>
        <div className='text-center'>
          <h1 className='text-6xl font-bold text-red-600'>500</h1>
          <h2 className='mt-6 text-3xl font-extrabold text-gray-900'>
            시스템 오류가 발생했습니다
          </h2>
          <p className='mt-2 text-sm text-gray-600'>
            죄송합니다. 예상치 못한 오류가 발생했습니다.
          </p>
          {error.digest && (
            <p className='mt-2 text-xs text-gray-400'>
              오류 ID: {error.digest}
            </p>
          )}
        </div>

        <div className='mt-8 space-y-4'>
          <button
            onClick={reset}
            className='group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500'
          >
            다시 시도
          </button>

          <Link
            href='/dashboard'
            className='group relative w-full flex justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
          >
            대시보드로 이동
          </Link>

          <Link
            href='/'
            className='group relative w-full flex justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
          >
            홈으로 이동
          </Link>
        </div>
      </div>
    </div>
  );
}
