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

    // AI 권한 (모든 사용자가 사용 가능)
    canToggleAI: true,

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
  // AuthStateManager 기반 상태 관리
  const [authState, setAuthState] = useState<{
    user: any | null;
    type: 'github' | 'guest' | 'unknown';
    isAuthenticated: boolean;
  } | null>(null);
  
  // 레거시 호환성을 위한 fallback
  const { data: session, status } = useSession();
  const { user: guestUser, isAuthenticated: isGuestAuth } = useAuth();
  const adminStore = useUnifiedAdminStore();

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
      // AuthStateManager 상태 우선 사용
      if (authState) {
        const { user, type, isAuthenticated } = authState;
        
        if (!isAuthenticated || !user) {
          return createSafeDefaultPermissions('guest', '일반사용자');
        }

        // 사용자 정보 추출
        const userName = user.name || user.email?.split('@')[0] || (type === 'github' ? 'GitHub 사용자' : '일반사용자');
        const userAvatar = user.avatar;
        const userType: UserType = type === 'unknown' ? 'guest' : type;

        // PIN 인증 상태 확인 (adminStore에서 가져옴)
        const isPinAuth = adminStore?.adminMode?.isAuthenticated || false;

        // 새로운 권한 매트릭스 적용
        // GitHub 사용자 = 일반 사용자 (관리자 페이지 제외)
        // Guest + PIN = 최고 권한 (관리자 페이지 포함)
        const isGitHub = type === 'github';
        const isGuest = type === 'guest';
        const isGuestWithPin = isGuest && isPinAuth;

        return {
          // 시스템 제어 권한 (PIN 인증 시에만)
          canControlSystem: isPinAuth,
          canAccessSettings: isPinAuth,
          canToggleAdminMode: true, // 모든 사용자가 PIN 입력 시도 가능
          canLogout: true, // 인증된 사용자는 모두 로그아웃 가능

          // 페이지 접근 권한 (새로운 3단계 시스템)
          canAccessMainPage: true, // 모든 사용자
          canAccessDashboard: isGitHub || isPinAuth, // GitHub 사용자 또는 PIN 인증
          canAccessAdminPage: isPinAuth, // PIN 인증한 사용자만

          // 사용자 유형
          isGeneralUser: isGitHub || (isGuest && !isPinAuth),
          isAdmin: isPinAuth, // PIN 인증한 사용자가 진짜 관리자
          isGitHubAuthenticated: isGitHub,
          isPinAuthenticated: isPinAuth,

          // AI 권한 (모든 사용자)
          canToggleAI: true,

          // 사용자 정보
          userType,
          userName,
          userAvatar,
        };
      }

      // 레거시 fallback 로직
      if (status === 'loading') {
        return createSafeDefaultPermissions('loading', '로딩 중...');
      }

      const isGitHubUser = Boolean(session?.user && status === 'authenticated');
      const isGuestUser = Boolean(!isGitHubUser && isGuestAuth && guestUser);

      if (!isGitHubUser && !isGuestUser) {
        return createSafeDefaultPermissions('guest', '일반사용자');
      }

      // 사용자 정보 추출
      let userName = '사용자';
      let userAvatar: string | undefined;
      let userType: UserType = 'loading';

      if (isGitHubUser && session?.user) {
        userName = session.user.name || session.user.email?.split('@')[0] || 'GitHub 사용자';
        userAvatar = session.user.image || undefined;
        userType = 'github';
      } else if (isGuestUser && guestUser) {
        userName = guestUser.name || '일반사용자';
        userAvatar = guestUser.picture;
        userType = 'guest';
      }

      // PIN 인증 상태 확인 (레거시 fallback)
      const isPinAuth = adminStore?.adminMode?.isAuthenticated || false;

      // 새로운 권한 매트릭스 적용 (레거시 호환)
      const isGitHub = isGitHubUser;
      const isGuest = isGuestUser;

      return {
        canControlSystem: isPinAuth,
        canAccessSettings: isPinAuth,
        canToggleAdminMode: true, // 모든 사용자가 PIN 입력 시도 가능
        canLogout: isGitHub || isGuest,

        // 페이지 접근 권한 (새로운 3단계 시스템)
        canAccessMainPage: true, // 모든 사용자
        canAccessDashboard: isGitHub || isPinAuth, // GitHub 사용자 또는 PIN 인증
        canAccessAdminPage: isPinAuth, // PIN 인증한 사용자만

        isGeneralUser: isGitHub || (isGuest && !isPinAuth),
        isAdmin: isPinAuth, // PIN 인증한 사용자가 진짜 관리자
        isGitHubAuthenticated: isGitHub,
        isPinAuthenticated: isPinAuth,
        canToggleAI: true,
        userType,
        userName,
        userAvatar,
      };
    } catch (error) {
      console.error('🔐 [Permissions] 권한 계산 중 오류 발생:', error);
      return createSafeDefaultPermissions('guest', '일반사용자');
    }
  }, [authState, session, status, guestUser, isGuestAuth, adminStore?.adminMode?.isAuthenticated]);

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
