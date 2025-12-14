'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { isVercel } from '@/env';
import {
  type AuthUser,
  getAuthState,
  isGitHubAuthenticated,
} from '@/lib/auth/auth-state-manager';

// This logic is now inlined from the old vercel-env.ts
const _authRetryDelay = isVercel ? 5000 : 3000;
const initDelay = isVercel ? 300 : 100;
const debugWithEnv = (message: string) =>
  `[${isVercel ? 'Vercel' : 'Local'}] ${message}`;

// 초기화 상태 타입 정의
export interface InitialAuthState {
  isLoading: boolean;
  isAuthenticated: boolean;
  user: AuthUser | null;
  isGitHubConnected: boolean;
  error: string | null;
  currentStep:
    | 'init'
    | 'auth-check'
    | 'user-fetch'
    | 'github-check'
    | 'complete';
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
    setState((prev) => ({ ...prev, ...updates }));
  }, []);

  // 안전한 리다이렉트 헬퍼 (안정된 환경 감지)
  const safeRedirect = useCallback(
    (targetPath: string) => {
      if (redirectRef.current || pathname === targetPath) {
        console.log(
          debugWithEnv(
            `🚫 리다이렉트 스킵: 현재 경로(${pathname}) === 타겟(${targetPath}) 또는 이미 리다이렉트됨`
          )
        );
        return;
      }

      redirectRef.current = true;
      console.log(
        debugWithEnv(`🔄 안전한 리다이렉트: ${pathname} → ${targetPath}`)
      );

      setTimeout(() => {
        try {
          router.replace(targetPath);
        } catch (error) {
          console.error(debugWithEnv('❌ 리다이렉트 실패'), error);
          redirectRef.current = false;
        }
      }, initDelay);
    },
    [pathname, router]
  );

  // 통합 초기화 프로세스
  const initializeAuth = useCallback(async () => {
    if (initRef.current) return;
    initRef.current = true;

    try {
      updateState({ currentStep: 'auth-check', isLoading: true });
      console.log(debugWithEnv('🔄 인증 상태 확인 중...'));

      const [authState, isGitHub] = await Promise.all([
        getAuthState(),
        isGitHubAuthenticated(),
      ]);
      const user = authState.user;

      console.log(debugWithEnv('📊 인증 결과'), {
        hasUser: !!user,
        userType: user?.provider,
        userName: user?.name,
        userEmail: user?.email,
        userId: user?.id,
        isGitHub,
        currentPath: pathname,
      });

      const isActuallyGitHubUser = isGitHub || user?.provider === 'github';

      updateState({
        currentStep: 'complete',
        isLoading: false,
        isAuthenticated: !!user,
        user,
        isGitHubConnected: isActuallyGitHubUser,
        error: null,
      });

      console.log(debugWithEnv('🔧 GitHub 인증 상태 개선:'), {
        isGitHubFromSession: isGitHub,
        userProvider: user?.provider,
        finalGitHubStatus: isActuallyGitHubUser,
      });

      if (!user) {
        console.log(debugWithEnv('🚫 인증되지 않음 - 로그인 페이지로 이동'));
        safeRedirect('/login');
      } else {
        console.log(
          debugWithEnv('✅ 인증 성공'),
          user.name,
          `(${user.provider})`
        );
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
      safeRedirect('/login');
    }
  }, [pathname, safeRedirect, updateState]);

  useEffect(() => {
    console.log(debugWithEnv('🔄 useInitialAuth 초기화 시작'));

    const timeoutId = setTimeout(() => {
      if (initRef.current) {
        console.log(
          debugWithEnv('🚫 useInitialAuth: 이미 초기화 중이므로 스킵')
        );
        return;
      }
      void initializeAuth();
    }, initDelay);

    return () => {
      clearTimeout(timeoutId);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      console.log(debugWithEnv('🧹 useInitialAuth 타이머 정리 완료'));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initializeAuth]);

  useEffect(() => {
    return () => {
      initRef.current = false;
      redirectRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const retry = useCallback(() => {
    initRef.current = false;
    redirectRef.current = false;
    setState(initialState);
    void initializeAuth();
  }, [initializeAuth]);

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
    isReady: state.currentStep === 'complete' && !state.isLoading,
    shouldRedirect: !state.isLoading && !state.isAuthenticated,
  };
}

export default useInitialAuth;
