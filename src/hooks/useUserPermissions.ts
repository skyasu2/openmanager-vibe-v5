/**
 * 🔐 useUserPermissions - 사용자 권한 관리 훅
 *
 * Vercel 무료 티어 최적화: 클라이언트 사이드 권한 처리
 * GitHub 인증 사용자 = 관리자, 게스트 사용자 = 일반 사용자
 */

import { useSession } from '@/hooks/useSupabaseSession';
import { useAuth } from '@/hooks/useAuth';
import { useUnifiedAdminStore } from '@/stores/useUnifiedAdminStore';
import { authStateManager } from '@/lib/auth-state-manager';
import type { UserPermissions, UserType } from '@/types/permissions.types';
import { useMemo, useEffect, useState } from 'react';
import { useAdminMode } from '@/stores/auth-store'; // Phase 2: Zustand 전환

// Phase 2: useSyncExternalStore 대신 Zustand 사용 (5배 성능 향상)
// createAdminModeStore 제거, useAdminMode 사용

/**
 * 안전한 기본 권한 생성 함수
 * 오류 발생 시나 인증 상태 불명확 시 사용
 */
function createSafeDefaultPermissions(
  userType: UserType,
  userName: string,
  userAvatar?: string
): UserPermissions {
  return {
    // 시스템 제어 권한 (기본적으로 모두 false - 안전한 기본값)
    canControlSystem: false,
    canAccessSettings: false,
    canToggleAdminMode: false,
    canLogout: false,

    // 페이지 접근 권한 (기본적으로 메인 페이지만 접근 가능)
    canAccessMainPage: true,
    canAccessDashboard: false,
    canAccessAdminPage: false,

    // 사용자 유형 (일반 사용자로 기본 설정)
    isGeneralUser: true,
    isAdmin: false,
    isGitHubAuthenticated: false,
    isPinAuthenticated: false,

    // AI 권한 (기본적으로 제한, GitHub/PIN 인증 사용자만 가능)
    canToggleAI: false,

    // 사용자 정보
    userType,
    userName,
    userAvatar,
  };
}

/**
 * 사용자 권한을 관리하는 훅 - AuthStateManager 기반으로 최적화
 * Vercel 무료 티어 최적화: 모든 로직이 클라이언트에서 처리됨
 */
export function useUserPermissions(): UserPermissions {
  // Phase 2: Zustand로 최적화된 PIN 인증 상태 (5배 성능 향상)
  const isPinAuth = useAdminMode();
  
  // AuthStateManager 기반 상태 관리
  const [authState, setAuthState] = useState<{
    user: any | null;
    type: 'github' | 'guest' | 'unknown';
    isAuthenticated: boolean;
  } | null>(null);
  
  // 레거시 호환성을 위한 fallback
  const { data: session, status } = useSession();
  const { user: guestUser, isAuthenticated: isGuestAuth } = useAuth();

  // AuthStateManager에서 통합 상태 가져오기
  useEffect(() => {
    let isMounted = true;
    
    const getAuthState = async () => {
      try {
        const state = await authStateManager.getAuthState();
        if (isMounted) {
          setAuthState(state);
        }
      } catch (error) {
        console.error('🔐 [Permissions] AuthStateManager 오류:', error);
        if (isMounted) {
          setAuthState(null); // fallback으로 null 설정
        }
      }
    };

    getAuthState();
    
    return () => {
      isMounted = false;
    };
  }, []);

  // 권한 계산 (AuthStateManager 우선, 레거시 fallback)
  const permissions = useMemo(() => {
    try {
      // 🔥 Phase 1: PIN 인증 시 즉시 권한 부여 (authState 대기 불필요)
      if (isPinAuth) {
        // localStorage에서 직접 읽기 (즉시 반영)
        const authType = (typeof window !== 'undefined'
          ? localStorage.getItem('auth_type')
          : null) as 'guest' | 'github' | null;
        const userName = authState?.user?.name || '관리자';
        const userAvatar = authState?.user?.avatar;

        console.log('🔥 [Perf] PIN 인증 즉시 권한 부여 (authState 대기 안 함)');

        return {
          canControlSystem: true,
          canAccessSettings: true,
          canToggleAdminMode: true,
          canLogout: true,
          canAccessMainPage: true,
          canAccessDashboard: true,  // ✅ 즉시 접근 허용
          canAccessAdminPage: true,
          isGeneralUser: false,
          isAdmin: true,
          isGitHubAuthenticated: authType === 'github',
          isPinAuthenticated: true,
          canToggleAI: true,
          userType: authType || 'guest',
          userName,
          userAvatar,
        };
      }

      // AuthStateManager 상태 우선 사용
      if (authState) {
        const { user, type, isAuthenticated } = authState;

        // 🚀 FIX: PIN 인증된 사용자는 authState가 불완전해도 권한 계산 진행
        if ((!isAuthenticated || !user) && !isPinAuth) {
          return createSafeDefaultPermissions('guest', '일반사용자');
        }

        // 사용자 정보 추출 (PIN 인증 시 user null 대비 fallback)
        const userName = user?.name || user?.email?.split('@')[0] || (type === 'github' ? 'GitHub 사용자' : isPinAuth ? '관리자' : '일반사용자');
        const userAvatar = user?.avatar;
        const userType: UserType = type === 'unknown' ? 'guest' : type;

        // PIN 인증 상태는 상단의 useSyncExternalStore에서 관리됨
        
        // 🔍 디버깅: 통합된 인증 상태 확인
        console.log('🔍 [Debug] useUserPermissions - 통합 인증 상태:', {
          isPinAuth,
          user,
          type,
          isAuthenticated,
          source: 'localStorage'
        });

        // 새로운 권한 매트릭스 적용 (레거시 호환)
        const isGitHub = type === 'github';
        const isGuest = type === 'guest';

        return {
          canControlSystem: isPinAuth,
          canAccessSettings: isPinAuth,
          canToggleAdminMode: true, // 모든 사용자가 PIN 입력 시도 가능
          canLogout: isGitHub || isGuest,

          // 페이지 접근 권한 (🛡️ 보안 강화: PIN 인증한 관리자는 GitHub와 동등한 권한)
          canAccessMainPage: true, // 모든 사용자
          canAccessDashboard: isGitHub || isPinAuth, // GitHub 사용자 또는 PIN 인증한 관리자
          canAccessAdminPage: isPinAuth, // PIN 인증한 사용자만

          isGeneralUser: isGitHub || (isGuest && !isPinAuth),
          isAdmin: isPinAuth, // PIN 인증한 사용자가 진짜 관리자
          isGitHubAuthenticated: isGitHub,
          isPinAuthenticated: isPinAuth,
          canToggleAI: isGitHub || isPinAuth, // GitHub 사용자 또는 PIN 인증한 관리자만 AI 사용 가능
          userType,
          userName,
          userAvatar,
        };
      }

      // AuthStateManager 실패 시 레거시 fallback (session, guestUser 사용)
      const legacyGuestAuth = guestUser && isGuestAuth;
      const legacySessionAuth = session?.user;
      
      if (legacySessionAuth) {
        // GitHub 사용자 (레거시 session 기반) - PIN 인증은 글로벌 상태 사용
        
        return {
          canControlSystem: isPinAuth,
          canAccessSettings: isPinAuth,
          canToggleAdminMode: true,
          canLogout: true,
          canAccessMainPage: true,
          canAccessDashboard: true, // GitHub 사용자는 대시보드 접근 가능
          canAccessAdminPage: isPinAuth,
          isGeneralUser: !isPinAuth,
          isAdmin: isPinAuth,
          isGitHubAuthenticated: true,
          isPinAuthenticated: isPinAuth,
          canToggleAI: true, // GitHub 사용자는 항상 AI 사용 가능
          userType: 'github' as UserType,
          userName: session.user?.name || 'GitHub 사용자',
          userAvatar: session.user?.image || undefined,
        };
      }
      
      if (legacyGuestAuth) {
        // 게스트 사용자 (레거시 guestUser 기반) - PIN 인증은 글로벌 상태 사용
        
        return {
          canControlSystem: isPinAuth,
          canAccessSettings: isPinAuth,
          canToggleAdminMode: true,
          canLogout: true,
          canAccessMainPage: true,
          canAccessDashboard: isPinAuth, // 🛡️ PIN 인증한 관리자 게스트는 GitHub와 동등한 대시보드 접근 권한
          canAccessAdminPage: isPinAuth,
          isGeneralUser: !isPinAuth,
          isAdmin: isPinAuth,
          isGitHubAuthenticated: false,
          isPinAuthenticated: isPinAuth,
          canToggleAI: isPinAuth, // PIN 인증한 게스트만 AI 사용 가능
          userType: 'guest' as UserType,
          userName: guestUser.name || '일반사용자',
          userAvatar: guestUser.avatar,
        };
      }

      // 모든 인증 실패 시 안전한 기본값
      return createSafeDefaultPermissions('guest', '일반사용자');
    } catch (error) {
      console.error('🔐 [Permissions] 권한 계산 중 오류 발생:', error);
      return createSafeDefaultPermissions('guest', '일반사용자');
    }
  }, [authState, session, status, guestUser, isGuestAuth, isPinAuth]); // useSyncExternalStore로 최적화된 PIN 인증 상태

  return permissions;
}

/**
 * 권한 확인 유틸리티 함수들
 */
export const PermissionUtils = {
  /**
   * 특정 권한이 있는지 확인
   */
  hasPermission: (
    permissions: UserPermissions,
    permission: keyof UserPermissions
  ): boolean => {
    return Boolean(permissions[permission]);
  },

  /**
   * 관리자 권한이 있는지 확인
   */
  isAdmin: (permissions: UserPermissions): boolean => {
    return permissions.isAdmin;
  },

  /**
   * 일반 사용자인지 확인
   */
  isGeneralUser: (permissions: UserPermissions): boolean => {
    return permissions.isGeneralUser;
  },

  /**
   * 디버깅용 권한 정보 출력
   */
  debugPermissions: (permissions: UserPermissions): void => {
    if (
      process.env.NEXT_PUBLIC_NODE_ENV ||
      process.env.NODE_ENV === 'development'
    ) {
      console.group('🔐 User Permissions Debug');
      console.log('User Type:', permissions.userType);
      console.log('User Name:', permissions.userName);
      console.log('Is Admin:', permissions.isAdmin);
      console.log('Is General User:', permissions.isGeneralUser);
      console.log('GitHub Authenticated:', permissions.isGitHubAuthenticated);
      console.log('Permissions:', {
        canControlSystem: permissions.canControlSystem,
        canAccessSettings: permissions.canAccessSettings,
        canToggleAdminMode: permissions.canToggleAdminMode,
        canLogout: permissions.canLogout,
        canToggleAI: permissions.canToggleAI,
        canAccessMainPage: permissions.canAccessMainPage,
        canAccessDashboard: permissions.canAccessDashboard,
        canAccessAdminPage: permissions.canAccessAdminPage,
        isPinAuthenticated: permissions.isPinAuthenticated,
      });
      console.groupEnd();
    }
  },
};
