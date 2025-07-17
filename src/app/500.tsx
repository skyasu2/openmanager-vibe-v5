'use client';

import Link from 'next/link';

export default function Custom500() {
  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-100'>
      <div className='max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center'>
        <div className='mb-6'>
          <h1 className='text-6xl font-bold text-red-500 mb-2'>500</h1>
          <h2 className='text-2xl font-semibold text-gray-800 mb-4'>
            서버 오류가 발생했습니다
          </h2>
          <p className='text-gray-600 mb-6'>
            잠시 후 다시 시도해주세요. 문제가 계속되면 관리자에게 문의하세요.
          </p>
        </div>

        <div className='space-y-3'>
          <button
            onClick={() => window.location.reload()}
            className='w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded transition-colors'
          >
            페이지 새로고침
          </button>

          <button
            onClick={() => window.history.back()}
            className='w-full bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded transition-colors'
          >
            이전 페이지로
          </button>

          <Link
            href='/main'
            className='block w-full bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded transition-colors'
          >
            홈으로 이동
          </Link>
        </div>

        <div className='mt-6 text-sm text-gray-500'>
          <p>OpenManager</p>
          <p>오류 시간: {new Date().toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
}
