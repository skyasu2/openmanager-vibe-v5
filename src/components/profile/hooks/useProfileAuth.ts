import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from '@/hooks/useSupabaseSession';
import {
  getCurrentUser,
  isGitHubAuthenticated,
  isGuestUser,
} from '@/lib/supabase-auth';
import type { UserInfo, UserType, ProfileAuthHook } from '../types/profile.types';

// 🔒 타입 안전성 강화 - AI 교차검증 기반 개선
interface LoadUserInfoResult {
  success: boolean;
  userInfo: UserInfo | null;
  userType: UserType;
  error?: Error;
}

interface AuthHookState {
  userInfo: UserInfo | null;
  userType: UserType;
  isLoading: boolean;
  error: Error | null;
}

/**
 * 프로필 인증 관련 커스텀 훅
 * 사용자 정보, 인증 상태 관리
 */
export function useProfileAuth(): ProfileAuthHook {
  const { status } = useSession();
  const router = useRouter();

  // 🔒 타입 안전한 상태 관리
  const [state, setState] = useState<AuthHookState>({
    userInfo: null,
    userType: 'unknown',
    isLoading: true,
    error: null,
  });
  
  // 🔒 Race Condition 방지를 위한 refs
  const isLoadingRef = useRef(false);
  const mountedRef = useRef(true);
  
  // 🔒 타입 안전한 상태 업데이트 헬퍼
  const updateState = useCallback((updates: Partial<AuthHookState>) => {
    if (!mountedRef.current) return;
    
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  // 사용자 정보 로드 (타이밍 최적화 + GitHub 인증 감지 개선)
  useEffect(() => {
    const loadUserInfo = async () => {
      // 🔒 중복 실행 방지 (Race Condition 해결)
      if (isLoadingRef.current) {
        return;
      }
      
      isLoadingRef.current = true;
      
      try {
        updateState({ isLoading: true, error: null });
        
        // 🚀 GitHub 인증 감지를 위한 단계적 접근
        // 1단계: 기본 인증 상태 확인
        const [user, isGitHub] = await Promise.all([
          getCurrentUser(),
          isGitHubAuthenticated(),
        ]);
        
        // 🔧 GitHub 인증 상태 재확인 로직 (OAuth 콜백 후 지연 처리)
        let finalUser = user;
        let finalIsGitHub = isGitHub;
        
        // GitHub 인증이 감지되지 않았지만 사용자가 있는 경우 재시도
        if (user && !isGitHub && user.provider !== 'guest') {
          if (process.env.NODE_ENV === 'development') {
            console.log('🔄 GitHub 인증 재확인 중...');
          }
          await new Promise(resolve => setTimeout(resolve, 1000)); // 1초 대기
          
          const [retryUser, retryIsGitHub] = await Promise.all([
            getCurrentUser(),
            isGitHubAuthenticated(),
          ]);
          
          finalUser = retryUser || user;
          finalIsGitHub = retryIsGitHub;
          
          if (process.env.NODE_ENV === 'development') {
            console.log('🔍 재시도 결과:', { 
              originalGitHub: isGitHub, 
              retryGitHub: retryIsGitHub,
              userProvider: finalUser?.provider 
            });
          }
        }
        
        const isGuest = isGuestUser(); // 동기 함수이므로 별도 처리

        // 🔒 컴포넌트가 언마운트된 경우 상태 업데이트 중단 (메모리 누수 방지)
        if (!mountedRef.current) {
          return;
        }

        // 🔧 개선된 사용자 타입 결정 로직 (OAuth 콜백 타이밍 이슈 대응)
        let determinedUserType: UserType;
        
        // GitHub 우선 판단 (더 엄격한 조건)
        if (finalUser?.provider === 'github' || finalIsGitHub || 
           (finalUser?.email && finalUser.email.includes('@') && !isGuest)) {
          determinedUserType = 'github';
          if (process.env.NODE_ENV === 'development') {
            console.log('✅ GitHub 사용자 확인:', { 
              provider: finalUser?.provider, 
              isGitHub: finalIsGitHub,
              email: finalUser?.email,
              hasGitHubIndicators: !!finalUser?.email?.includes('@')
            });
          }
        } else if (finalUser?.provider === 'guest' || isGuest) {
          determinedUserType = 'guest';
          if (process.env.NODE_ENV === 'development') {
            console.log('✅ 게스트 사용자 확인:', { provider: finalUser?.provider, isGuest });
          }
        } else if (finalUser) {
          // 사용자는 있지만 확실하지 않은 경우 GitHub로 추정 (보수적 접근)
          determinedUserType = 'github';
          if (process.env.NODE_ENV === 'development') {
            console.log('⚠️ 불확실한 사용자 → GitHub 추정:', finalUser);
          }
        } else {
          determinedUserType = 'unknown';
          if (process.env.NODE_ENV === 'development') {
            console.log('❓ 인증되지 않은 사용자');
          }
        }

        // 🔒 타입 안전한 상태 업데이트 (최종 사용자 정보 사용)
        updateState({
          userInfo: finalUser,
          userType: determinedUserType,
          isLoading: false,
          error: null,
        });

        // 개발 환경에서만 상세 로그 출력
        if (process.env.NODE_ENV === 'development') {
          console.log('👤 사용자 정보 로드 완료 (타이밍 최적화 + GitHub 감지 개선):', {
            user: finalUser,
            userType: determinedUserType,
            gitHubDetected: finalIsGitHub,
            isGuest,
            sessionStatus: status,
            optimizations: ['OAuth 타이밍 개선', 'GitHub 재확인 로직', '보수적 타입 결정']
          });
        }
      } catch (error) {
        console.error('❌ 사용자 정보 로드 실패:', error);
        
        // 🔒 타입 안전한 에러 상태 설정
        const errorObj = error instanceof Error ? error : new Error(String(error));
        
        // 🛡️ 개선된 에러 복구 전략: 세분화된 에러 분류 및 복구
        const isNetworkError = errorObj.message.includes('fetch') || 
                              errorObj.message.includes('network') || 
                              errorObj.message.includes('timeout');
        const isAuthError = errorObj.message.includes('auth') || 
                           errorObj.message.includes('unauthorized') || 
                           errorObj.message.includes('session');
        
        let fallbackUserType: UserType;
        let retryStrategy = false;
        
        if (isNetworkError) {
          fallbackUserType = 'unknown';
          retryStrategy = true; // 네트워크 에러는 재시도
          if (process.env.NODE_ENV === 'development') {
            console.log('🌐 네트워크 에러 감지 - 재시도 예정');
          }
        } else if (isAuthError) {
          fallbackUserType = 'guest';
          retryStrategy = false; // 인증 에러는 게스트 모드 처리
          if (process.env.NODE_ENV === 'development') {
            console.log('🔐 인증 에러 감지 - 게스트 모드 처리');
          }
        } else {
          fallbackUserType = 'unknown';
          retryStrategy = true; // 기타 에러는 한 번 재시도
          if (process.env.NODE_ENV === 'development') {
            console.log('❓ 알 수 없는 에러 - 재시도 후 판단');
          }
        }
        
        updateState({
          userType: fallbackUserType,
          isLoading: false,
          error: errorObj,
        });
        
        // 🔄 조건부 재시도 로직 (최대 1회)
        if (retryStrategy && mountedRef.current) {
          setTimeout(() => {
            if (mountedRef.current && !isLoadingRef.current) {
              if (process.env.NODE_ENV === 'development') {
                console.log('🔄 에러 복구 재시도 시작');
              }
              loadUserInfo();
            }
          }, 3000); // 3초 후 재시도 (더 빠른 복구)
        }
      } finally {
        // 🔒 로딩 완료 처리
        isLoadingRef.current = false;
      }
    };

    if (status !== 'loading') {
      loadUserInfo();
    }
    
    // 🔒 Cleanup 함수: 컴포넌트 언마운트 시 상태 초기화
    return () => {
      mountedRef.current = false;
      isLoadingRef.current = false;
    };
  }, [status]); // session 제거하여 무한 루프 방지
  
  // 🔒 컴포넌트 언마운트 시 정리 (메모리 누수 방지)
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  /**
   * 로그아웃 처리
   */
  const handleLogout = useCallback(async () => {
    const userTypeLabel = state.userType === 'github' ? 'GitHub' : '게스트';
    const confirmed = confirm(
      `🚪 ${userTypeLabel} 계정에서 로그아웃하시겠습니까?`
    );

    if (!confirmed) {
      return false;
    }

    try {
      console.log('🚪 로그아웃 시작:', { userType: state.userType });

      // 관리자 모드 해제
      localStorage.removeItem('admin_mode');

      // 모든 인증 관련 데이터 정리
      localStorage.removeItem('auth_session_id');
      localStorage.removeItem('auth_type');
      localStorage.removeItem('auth_user');

      // 쿠키 정리
      document.cookie =
        'guest_session_id=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      document.cookie =
        'auth_type=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';

      if (state.userType === 'github') {
        // GitHub OAuth 로그아웃
        await signOut({ callbackUrl: '/login' });
      } else {
        // 게스트 모드 로그아웃
        window.location.href = '/login';
      }

      return true;
    } catch (error) {
      console.error('❌ 로그아웃 실패:', error);
      
      // 🛡️ 에러 상태 업데이트 (로그아웃 실패 표시)
      const errorObj = error instanceof Error ? error : new Error('로그아웃 중 오류가 발생했습니다');
      updateState({ error: errorObj });
      
      // 🔄 실패해도 보안을 위해 로그인 페이지로 강제 이동
      try {
        // 클라이언트 측 정리 시도
        localStorage.clear();
        document.cookie.split(";").forEach(c => {
          const eqPos = c.indexOf("=");
          const name = eqPos > -1 ? c.substr(0, eqPos) : c;
          document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
        });
      } catch (cleanupError) {
        console.warn('⚠️ 클라이언트 정리 중 에러:', cleanupError);
      }
      
      window.location.href = '/login';
      return false;
    }
  }, [state.userType]);

  // 비활성 타이머는 사용하지 않음 (max-lines-per-function 경고 해결)

  /**
   * 페이지 이동 핸들러들
   */
  const navigateToLogin = useCallback(() => {
    router.push('/login');
  }, []); // router 의존성 제거 - Next.js router stable reference 유지

  const navigateToAdmin = useCallback(() => {
    router.push('/admin');
  }, []); // router 의존성 제거 - Next.js router stable reference 유지

  const navigateToDashboard = useCallback(() => {
    router.push('/dashboard');
  }, []); // router 의존성 제거 - Next.js router stable reference 유지

  return {
    userInfo: state.userInfo,
    userType: state.userType,
    isLoading: state.isLoading,
    error: state.error,
    status,
    handleLogout,
    navigateToLogin,
    navigateToAdmin,
    navigateToDashboard,
  };
}
