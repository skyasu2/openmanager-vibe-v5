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
  
  // 🔥 localStorage 변경 감지를 위한 강제 리렌더링 상태
  const [storageUpdateTrigger, setStorageUpdateTrigger] = useState(0);

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
  
  // 🔥 localStorage 변경 감지 시스템 (AI 교차검증 해결책)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'admin_mode') {
        console.log('🔄 PIN 인증 상태 변경 감지:', e.newValue);
        // AuthStateManager 캐시 무효화
        authStateManager.invalidateCache?.();
        // 강제 리렌더링 트리거
        setStorageUpdateTrigger(prev => prev + 1);
      }
    };
    
    // 수동 storage 이벤트도 감지 (동일 탭 내 변경)
    const handleManualStorageChange = () => {
      const adminMode = localStorage.getItem('admin_mode');
      console.log('🔄 localStorage 수동 변경 감지:', adminMode);
      authStateManager.invalidateCache?.();
      setStorageUpdateTrigger(prev => prev + 1);
    };
    
    // 이벤트 리스너 등록
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('local-storage-changed', handleManualStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('local-storage-changed', handleManualStorageChange);
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

        // PIN 인증 상태 확인 (localStorage 우선, adminStore fallback)
        const localStorageAuth = typeof window !== 'undefined' ? localStorage.getItem('admin_mode') === 'true' : false;
        const adminStoreAuth = adminStore?.adminMode?.isAuthenticated || false;
        const isPinAuth = localStorageAuth || adminStoreAuth; // localStorage 우선
        
        // 🔍 디버깅: 모든 인증 상태 확인
        console.log('🔍 [Debug] useUserPermissions - 전체 인증 상태:', {
          adminStore: !!adminStore,
          adminStoreAuth,
          localStorageAuth,
          isPinAuth,
          user,
          type,
          isAuthenticated
        });

        // 새로운 권한 매트릭스 적용 (레거시 호환)
        const isGitHub = type === 'github';
        const isGuest = type === 'guest';

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
      }

      // AuthStateManager 실패 시 레거시 fallback (session, guestUser 사용)
      const legacyGuestAuth = guestUser && isGuestAuth;
      const legacySessionAuth = session?.user;
      
      if (legacySessionAuth) {
        // GitHub 사용자 (레거시 session 기반)
        const localStorageAuth = typeof window !== 'undefined' ? localStorage.getItem('admin_mode') === 'true' : false;
        const adminStoreAuth = adminStore?.adminMode?.isAuthenticated || false;
        const isPinAuth = localStorageAuth || adminStoreAuth; // localStorage 우선
        
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
          canToggleAI: true,
          userType: 'github' as UserType,
          userName: session.user.name || 'GitHub 사용자',
          userAvatar: session.user.image,
        };
      }
      
      if (legacyGuestAuth) {
        // 게스트 사용자 (레거시 guestUser 기반)  
        const localStorageAuth = typeof window !== 'undefined' ? localStorage.getItem('admin_mode') === 'true' : false;
        const adminStoreAuth = adminStore?.adminMode?.isAuthenticated || false;
        const isPinAuth = localStorageAuth || adminStoreAuth; // localStorage 우선
        
        return {
          canControlSystem: isPinAuth,
          canAccessSettings: isPinAuth,
          canToggleAdminMode: true,
          canLogout: true,
          canAccessMainPage: true,
          canAccessDashboard: isPinAuth, // 게스트는 PIN 인증해야 대시보드 접근
          canAccessAdminPage: isPinAuth,
          isGeneralUser: !isPinAuth,
          isAdmin: isPinAuth,
          isGitHubAuthenticated: false,
          isPinAuthenticated: isPinAuth,
          canToggleAI: true,
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
  }, [authState, session, status, guestUser, isGuestAuth, adminStore?.adminMode?.isAuthenticated, storageUpdateTrigger]); // storageUpdateTrigger 추가로 localStorage 변경 감지

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
