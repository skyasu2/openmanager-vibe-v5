/**
 * 🔐 useUserPermissions - 사용자 권한 관리 훅
 *
 * Vercel 무료 티어 최적화: 클라이언트 사이드 권한 처리
 * GitHub 인증 사용자 = 관리자, 게스트 사용자 = 일반 사용자
 */

import { useSession } from '@/hooks/useSupabaseSession';
import { useAuth } from '@/hooks/useAuth';
import { useUnifiedAdminStore } from '@/stores/useUnifiedAdminStore';
import type { UserPermissions, UserType } from '@/types/permissions.types';
import { useMemo } from 'react';

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

    // 사용자 유형 (일반 사용자로 기본 설정)
    isGeneralUser: true,
    isAdmin: false,
    isGitHubAuthenticated: false,

    // AI 권한 (모든 사용자가 사용 가능)
    canToggleAI: true,

    // 사용자 정보
    userType,
    userName,
    userAvatar,
  };
}

/**
 * 사용자 권한을 관리하는 훅
 * Vercel 무료 티어 최적화: 모든 로직이 클라이언트에서 처리됨
 */
export function useUserPermissions(): UserPermissions {
  // 기존 인증 훅들 사용 (오류 처리 포함)
  const { data: session, status } = useSession();
  const { user: guestUser, isAuthenticated: isGuestAuth } = useAuth();
  const adminStore = useUnifiedAdminStore();

  // 권한 계산 (메모이제이션으로 성능 최적화)
  const permissions = useMemo(() => {
    try {
      // 로딩 중인 경우 - 안전한 기본값 반환
      if (status === 'loading') {
        return createSafeDefaultPermissions('loading', '로딩 중...');
      }

      // GitHub 인증 사용자 확인 (안전한 체크)
      const isGitHubUser = Boolean(session?.user && status === 'authenticated');
      const isGuestUser = Boolean(!isGitHubUser && isGuestAuth && guestUser);

      // 사용자 정보 추출 (안전한 기본값 포함)
      let userName = '사용자';
      let userAvatar: string | undefined;
      let userType: UserType = 'loading';

      if (isGitHubUser && session?.user) {
        // GitHub 사용자 - 안전한 정보 추출
        userName =
          session.user.name ||
          session.user.email?.split('@')[0] ||
          'GitHub 사용자';
        userAvatar = session.user.image || undefined;
        userType = 'github';
      } else if (isGuestUser && guestUser) {
        // 게스트 사용자 - 안전한 정보 추출
        userName = guestUser.name || '일반사용자';
        userAvatar = guestUser.picture;
        userType = 'guest';
      } else {
        // 인증 상태를 확인할 수 없는 경우 - 일반 사용자로 폴백
        console.warn(
          '🔐 [Permissions] 사용자 인증 상태 불명확 - 일반 사용자 권한으로 폴백'
        );
        return createSafeDefaultPermissions('guest', '일반사용자');
      }

      // 권한 매트릭스 적용
      const isAdmin = isGitHubUser; // GitHub 인증 사용자 = 관리자
      const isGeneral = !isAdmin; // 게스트 사용자 = 일반 사용자

      return {
        // 시스템 제어 권한 (관리자만)
        canControlSystem: isAdmin,
        canAccessSettings: isAdmin,
        canToggleAdminMode: isAdmin,
        canLogout: isAdmin,

        // 사용자 유형
        isGeneralUser: isGeneral,
        isAdmin: isAdmin,
        isGitHubAuthenticated: isGitHubUser,

        // AI 권한 (모든 사용자)
        canToggleAI: true,

        // 사용자 정보
        userType,
        userName,
        userAvatar,
      };
    } catch (error) {
      // 권한 계산 중 오류 발생 시 안전한 폴백
      console.error('🔐 [Permissions] 권한 계산 중 오류 발생:', error);
      console.warn('🔐 [Permissions] 일반 사용자 권한으로 폴백');

      return createSafeDefaultPermissions('guest', '일반사용자');
    }
  }, [session, status, guestUser, isGuestAuth]);

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
    if (process.env.NODE_ENV === 'development') {
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
      });
      console.groupEnd();
    }
  },
};
