'use client';

import { ReactNode } from 'react';
import { QueryProvider } from './QueryProvider';

interface ClientProvidersProps {
  children: ReactNode;
}

/**
 * 클라이언트 사이드 Provider들을 관리하는 컴포넌트
 *
 * @description
 * 서버 컴포넌트인 layout.tsx에서 클라이언트 Provider들을 사용하기 위한 래퍼 컴포넌트입니다.
 * 모든 클라이언트 사이드 상태 관리 Provider들을 여기서 통합 관리합니다.
 */
export function ClientProviders({ children }: ClientProvidersProps) {
  return <QueryProvider>{children}</QueryProvider>;
}
