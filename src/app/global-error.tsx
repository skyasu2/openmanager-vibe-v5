'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Global Error:', error);
  }, [error]);

  return (
    <html lang='ko'>
      <body>
        <div className='flex items-center justify-center min-h-screen bg-red-50'>
          <div className='text-center p-8'>
            <h2 className='text-2xl font-bold text-red-600 mb-4'>
              시스템 오류
            </h2>
            <p className='text-gray-600 mb-4'>
              예상치 못한 오류가 발생했습니다.
            </p>
            <button
              onClick={reset}
              className='px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 mr-2'
            >
              다시 시도
            </button>
            <button
              onClick={() => (window.location.href = '/')}
              className='px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700'
            >
              홈으로
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
