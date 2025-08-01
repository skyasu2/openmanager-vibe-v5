'use client';

import React from 'react';

interface ErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

function ErrorFallback({ error, resetErrorBoundary }: ErrorFallbackProps) {
  // 🎯 오류 타입 분석
  const isDataError =
    error.message.includes('filter') ||
    error.message.includes('배열') ||
    error.message.includes('서버 데이터');
  const isNetworkError =
    error.message.includes('fetch') ||
    error.message.includes('network') ||
    error.message.includes('HTTP');

  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-50'>
      <div className='max-w-md w-full mx-4'>
        <div className='bg-white rounded-lg shadow-lg p-6 border border-red-200'>
          <div className='flex items-center mb-4'>
            <div className='flex-shrink-0'>
              <svg
                className='h-8 w-8 text-red-500'
                fill='none'
                viewBox='0 0 24 24'
                stroke='currentColor'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z'
                />
              </svg>
            </div>
            <div className='ml-3'>
              <h3 className='text-lg font-medium text-red-800'>
                {isDataError
                  ? '서버 데이터 오류'
                  : isNetworkError
                    ? '네트워크 연결 오류'
                    : '대시보드 로딩 오류'}
              </h3>
            </div>
          </div>

          <div className='mb-4'>
            <p className='text-sm text-red-600 mb-2'>
              {isDataError
                ? '서버 데이터 형식 문제로 인한 일시적 오류입니다. 데이터가 안전하게 복구됩니다.'
                : isNetworkError
                  ? '네트워크 연결 문제가 발생했습니다. 잠시 후 다시 시도해주세요.'
                  : 'Redis 연결 문제로 인한 일시적 오류입니다.'}
            </p>
            <details className='text-xs text-gray-600'>
              <summary className='cursor-pointer hover:text-gray-800'>
                기술적 상세정보
              </summary>
              <pre className='mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto max-h-32'>
                {error.message}
              </pre>
            </details>
          </div>

          <div className='flex space-x-3'>
            <button
              onClick={resetErrorBoundary}
              className='flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors'
            >
              다시 시도
            </button>
            <button
              onClick={() => (window.location.href = '/main')}
              className='flex-1 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors'
            >
              홈으로 이동
            </button>
          </div>

          {isDataError && (
            <div className='mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md'>
              <p className='text-xs text-blue-700'>
                💡 <strong>자동 복구:</strong> 시스템이 안전한 기본 데이터로
                자동 전환됩니다.
              </p>
            </div>
          )}

          <div className='mt-4 text-xs text-gray-500 text-center'>
            문제가 지속되면 개발팀에 문의해주세요.
          </div>
        </div>
      </div>
    </div>
  );
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<ErrorFallbackProps>;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // 에러 리포팅 서비스에 전송 (선택사항)
    if (typeof window !== 'undefined') {
      try {
        // 에러 로깅
        localStorage.setItem(
          'lastError',
          JSON.stringify({
            error: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href,
          })
        );
      } catch (e) {
        console.warn('Failed to log error to localStorage:', e);
      }
    }
  }

  resetErrorBoundary = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      const FallbackComponent = this.props.fallback || ErrorFallback;
      return (
        <FallbackComponent
          error={this.state.error}
          resetErrorBoundary={this.resetErrorBoundary}
        />
      );
    }

    return this.props.children;
  }
}

// Hook 기반 에러 바운더리 (함수형 컴포넌트용)
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallbackComponent?: React.ComponentType<ErrorFallbackProps>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary fallback={fallbackComponent}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
}
