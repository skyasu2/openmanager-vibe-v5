/**
 * 🚫 404 Not Found 페이지
 * Next.js 15 App Router 규격
 */

import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: '404 - 페이지를 찾을 수 없습니다',
  description: '요청하신 페이지가 존재하지 않습니다.',
};

export default function NotFound() {
  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900'>
      <div className='max-w-md w-full space-y-8 p-8'>
        <div className='text-center'>
          <h1 className='text-6xl font-bold text-gray-900 dark:text-white'>
            404
          </h1>
          <h2 className='mt-6 text-3xl font-extrabold text-gray-900 dark:text-white'>
            페이지를 찾을 수 없습니다
          </h2>
          <p className='mt-2 text-sm text-gray-600 dark:text-gray-400'>
            요청하신 페이지가 존재하지 않거나 이동되었습니다.
          </p>
          <div className='mt-6'>
            <Link
              href='/'
              className='w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
            >
              홈으로 돌아가기
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
