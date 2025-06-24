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
    <div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50'>
      <div className='max-w-md mx-auto text-center'>
        <div className='mb-8'>
          <h1 className='text-6xl font-bold text-gray-900 mb-4'>404</h1>
          <h2 className='text-2xl font-semibold text-gray-700 mb-2'>
            페이지를 찾을 수 없습니다
          </h2>
          <p className='text-gray-600'>
            요청하신 페이지가 존재하지 않거나 이동되었을 수 있습니다.
          </p>
        </div>

        <div className='space-y-4'>
          <Link
            href='/'
            className='inline-block px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors'
          >
            홈으로 돌아가기
          </Link>

          <div className='text-sm text-gray-500'>
            <p>또는</p>
            <Link
              href='/dashboard'
              className='text-blue-600 hover:text-blue-800 underline'
            >
              대시보드로 이동
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
