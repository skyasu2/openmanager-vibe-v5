'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getCurrentUser, isGitHubAuthenticated } from '@/lib/supabase-auth';
import { User } from '@supabase/supabase-js';

// 초기화 상태 타입 정의
export interface InitialAuthState {
  isLoading: boolean;
  isAuthenticated: boolean;
  user: User | null;
  isGitHubConnected: boolean;
  error: string | null;
  currentStep: 'init' | 'auth-check' | 'user-fetch' | 'github-check' | 'complete';
}

// 초기화 상태 초기값
const initialState: InitialAuthState = {
  isLoading: true,
  isAuthenticated: false,
  user: null,
  isGitHubConnected: false,
  error: null,
  currentStep: 'init',
};

/**
 * 통합 초기화 훅 - 모든 인증 및 사용자 정보를 단일 프로세스로 처리
 * 5-6초 다단계 로딩 화면 문제 해결
 */
export function useInitialAuth() {
  const [state, setState] = useState<InitialAuthState>(initialState);
  const router = useRouter();
  const pathname = usePathname();
  const initRef = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const redirectRef = useRef(false);

  // 상태 업데이트 헬퍼
  const updateState = useCallback((updates: Partial<InitialAuthState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  // 안전한 리다이렉트 헬퍼 (무한 루프 방지)
  const safeRedirect = useCallback((targetPath: string) => {
    // 이미 리다이렉트했거나 현재 경로가 타겟과 같으면 리다이렉트하지 않음
    if (redirectRef.current || pathname === targetPath) {
      console.log(`🚫 리다이렉트 스킵: 현재 경로(${pathname}) === 타겟(${targetPath}) 또는 이미 리다이렉트됨`);
      return;
    }
    
    redirectRef.current = true;
    console.log(`🔄 안전한 리다이렉트: ${pathname} → ${targetPath}`);
    setTimeout(() => router.replace(targetPath), 100);
  }, [pathname, router]);

  // 통합 초기화 프로세스
  const initializeAuth = useCallback(async () => {
    // 중복 실행 방지
    if (initRef.current) return;
    initRef.current = true;

    try {
      // 1단계: 인증 상태 및 사용자 정보 병렬 조회
      updateState({ currentStep: 'auth-check', isLoading: true });
      
      const [user, isGitHub] = await Promise.all([
        getCurrentUser(),
        isGitHubAuthenticated()
      ]);

      // 2단계: 결과 처리 (단일 상태 업데이트)
      updateState({
        currentStep: 'complete',
        isLoading: false,
        isAuthenticated: !!user,
        user,
        isGitHubConnected: isGitHub,
        error: null,
      });

      // 인증되지 않은 경우 로그인 페이지로 리다이렉션 (지연 없이)
      if (!user) {
        safeRedirect('/');
      }

    } catch (error) {
      console.error('Authentication initialization failed:', error);
      
      updateState({
        currentStep: 'complete',
        isLoading: false,
        isAuthenticated: false,
        user: null,
        isGitHubConnected: false,
        error: error instanceof Error ? error.message : 'Authentication failed',
      });

      // 에러 시 로그인 페이지로 리다이렉션
      safeRedirect('/');
    }
  }, [updateState, safeRedirect]);

  // 초기화 실행 - 의존성 배열 제거로 무한 루프 방지
  useEffect(() => {
    const timeoutId = setTimeout(initializeAuth, 50); // 최소 지연으로 브라우저 렌더링 최적화
    
    return () => {
      clearTimeout(timeoutId);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 빈 배열로 한 번만 실행

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      initRef.current = false;
      redirectRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // 재시도 함수
  const retry = useCallback(() => {
    initRef.current = false;
    redirectRef.current = false;
    setState(initialState);
    initializeAuth();
  }, [initializeAuth]);

  // 로딩 메시지 헬퍼 (단일 메시지로 통합)
  const getLoadingMessage = useCallback(() => {
    switch (state.currentStep) {
      case 'init':
        return '초기화 중...';
      case 'auth-check':
      case 'user-fetch':
      case 'github-check':
        return '인증 확인 중...';
      default:
        return '로딩 중...';
    }
  }, [state.currentStep]);

  return {
    ...state,
    retry,
    getLoadingMessage,
    // 편의 함수들
    isReady: state.currentStep === 'complete' && !state.isLoading,
    shouldRedirect: !state.isLoading && !state.isAuthenticated,
  };
}

export default useInitialAuth;