'use client';

/**
 * 🚨 Global Error Handler for Next.js 15 App Router
 * 최상위 레벨 에러 처리 (500, unhandled errors)
 */

import { useEffect } from 'react';
import Link from 'next/link';
import { envManager } from '@/lib/environment/EnvironmentManager';

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    // 환경별 에러 리포팅
    if (envManager.shouldReportErrors()) {
      envManager.log('error', 'Global Error Caught', {
        message: error.message,
        digest: error.digest,
        stack: error.stack,
        timestamp: new Date().toISOString(),
        userAgent:
          typeof window !== 'undefined' ? window.navigator.userAgent : 'SSR',
        url: typeof window !== 'undefined' ? window.location.href : 'Unknown',
      });

      // 프로덕션에서는 외부 에러 리포팅 서비스로 전송
      if (envManager.isProduction) {
        // 추후 Sentry 등 에러 리포팅 서비스 연동
        console.error('[GLOBAL_ERROR]', {
          error: error.message,
          digest: error.digest,
          environment: envManager.environment,
          platform: envManager.platform,
        });
      }
    }
  }, [error]);

  return (
    <html>
      <body>
        <div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-red-900 via-gray-900 to-red-900'>
          <div className='text-center space-y-6 p-8 max-w-md mx-auto'>
            {/* 에러 아이콘 */}
            <div className='flex justify-center'>
              <div className='w-20 h-20 rounded-full bg-red-600/20 flex items-center justify-center'>
                <svg
                  className='w-10 h-10 text-red-400'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 19c-.77.833.192 2.5 1.732 2.5z'
                  />
                </svg>
              </div>
            </div>

            {/* 에러 정보 */}
            <div className='space-y-2'>
              <h1 className='text-4xl font-bold text-white'>500</h1>
              <h2 className='text-xl font-semibold text-red-300'>
                서버 오류 발생
              </h2>
              <p className='text-gray-400 text-sm'>
                예상치 못한 오류가 발생했습니다. 문제가 자동으로 보고되었습니다.
              </p>
            </div>

            {/* 에러 세부사항 (개발 환경에서만) */}
            {envManager.isDevelopment && (
              <div className='bg-gray-800/50 rounded-lg p-4 text-left'>
                <h3 className='text-sm font-semibold text-red-400 mb-2'>
                  개발 모드 에러 정보:
                </h3>
                <div className='text-xs text-gray-300 space-y-1'>
                  <p>
                    <span className='text-red-400'>메시지:</span>{' '}
                    {error.message}
                  </p>
                  {error.digest && (
                    <p>
                      <span className='text-red-400'>Digest:</span>{' '}
                      {error.digest}
                    </p>
                  )}
                  <p>
                    <span className='text-red-400'>환경:</span>{' '}
                    {envManager.environment}
                  </p>
                  <p>
                    <span className='text-red-400'>플랫폼:</span>{' '}
                    {envManager.platform}
                  </p>
                </div>
              </div>
            )}

            {/* 액션 버튼들 */}
            <div className='space-y-3'>
              <div className='flex flex-col sm:flex-row gap-3 justify-center'>
                <button
                  onClick={reset}
                  className='px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium'
                >
                  다시 시도
                </button>
                <Link
                  href='/main'
                  className='px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium inline-block text-center'
                >
                  홈으로 돌아가기
                </Link>
              </div>

              <Link
                href='/main'
                className='text-sm text-blue-400 hover:text-blue-300 transition-colors'
              >
                메인으로 이동 →
              </Link>
            </div>

            {/* 추가 도움말 */}
            <div className='text-xs text-gray-500 space-y-1'>
              <p>문제가 지속되면 브라우저를 새로고침하거나</p>
              <p>잠시 후 다시 시도해주세요.</p>
              {envManager.isProduction && (
                <p className='text-gray-600'>
                  에러 ID: {error.digest || 'N/A'}
                </p>
              )}
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
