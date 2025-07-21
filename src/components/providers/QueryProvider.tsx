'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from '@/lib/react-query';
import type { ReactNode, ErrorInfo } from 'react';
import { Component } from 'react';

interface QueryProviderProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

/**
 * React Query 에러 바운더리
 */
class QueryErrorBoundary extends Component<
  { children: ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('QueryProvider Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className='flex items-center justify-center min-h-screen bg-red-50'>
          <div className='text-center p-8'>
            <h2 className='text-2xl font-bold text-red-600 mb-4'>
              데이터 로딩 오류
            </h2>
            <p className='text-gray-600 mb-4'>
              애플리케이션 초기화 중 오류가 발생했습니다.
            </p>
            <button
              onClick={() => window.location.reload()}
              className='px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700'
            >
              새로고침
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * React Query Provider 컴포넌트
 *
 * @description
 * 전체 애플리케이션에 React Query를 제공합니다.
 * 개발 환경에서는 DevTools도 함께 제공합니다.
 * 에러 바운더리로 안정성을 보장합니다.
 */
export function QueryProvider({ children }: QueryProviderProps) {
  return (
    <QueryErrorBoundary>
      <QueryClientProvider client={queryClient}>
        {children}
        {/* 개발 환경에서만 DevTools 표시 */}
        {process.env.NODE_ENV === 'development' && (
          <ReactQueryDevtools initialIsOpen={false} />
        )}
      </QueryClientProvider>
    </QueryErrorBoundary>
  );
}

export default QueryProvider;
