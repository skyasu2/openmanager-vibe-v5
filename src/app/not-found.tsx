/**
 * 🚫 App Router 전용 404 페이지
 * Pages Router의 _document, _error 등을 대체
 */

'use client';

// 🔧 RSC 프리렌더링 오류 방지: 동적 렌더링 강제
export const dynamic = 'force-dynamic';

import Link from 'next/link';

export default function NotFound() {
  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8'>
      <div className='max-w-md w-full space-y-8'>
        <div className='text-center'>
          <h1 className='text-6xl font-bold text-gray-900'>404</h1>
          <h2 className='mt-6 text-3xl font-extrabold text-gray-900'>
            페이지를 찾을 수 없습니다
          </h2>
          <p className='mt-2 text-sm text-gray-600'>
            요청하신 페이지가 존재하지 않거나 이동되었습니다.
          </p>
        </div>

        <div className='mt-8 space-y-4'>
          <Link
            href='/dashboard'
            className='group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
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
