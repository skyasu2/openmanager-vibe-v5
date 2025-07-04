'use client';

/**
 * 🌍 App Router 전용 글로벌 에러 페이지
 * root layout 에러 처리 및 Pages Router 완전 대체
 */

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div className='min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8'>
          <div className='max-w-md w-full space-y-8'>
            <div className='text-center'>
              <h1 className='text-6xl font-bold text-red-600'>💥</h1>
              <h2 className='mt-6 text-3xl font-extrabold text-gray-900'>
                전역 시스템 오류
              </h2>
              <p className='mt-2 text-sm text-gray-600'>
                치명적인 오류가 발생했습니다. 시스템을 재시작해주세요.
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
                시스템 재시작
              </button>

              <button
                onClick={() => (window.location.href = '/')}
                className='group relative w-full flex justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
              >
                홈으로 이동
              </button>
            </div>

            <div className='mt-6 text-center text-xs text-gray-400'>
              OpenManager Vibe v5 - App Router 전용 모드
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
