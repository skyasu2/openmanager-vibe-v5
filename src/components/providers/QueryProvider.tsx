'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from '@/lib/react-query';
import { ReactNode } from 'react';

interface QueryProviderProps {
  children: ReactNode;
}

/**
 * React Query Provider 컴포넌트
 * 
 * @description
 * 전체 애플리케이션에 React Query를 제공합니다.
 * 개발 환경에서는 DevTools도 함께 제공합니다.
 */
export function QueryProvider({ children }: QueryProviderProps) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* 개발 환경에서만 DevTools 표시 */}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools
          initialIsOpen={false}
        />
      )}
    </QueryClientProvider>
  );
} 