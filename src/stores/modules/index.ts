/**
 * 🏪 Store Modules Export
 *
 * OpenManager Vibe v5 상태 관리 모듈 통합 (Google OAuth 제거됨)
 */

import { isGuestFullAccessEnabled } from '@/config/guestMode';
import { useServerQuery } from '@/hooks/useServerQuery';
import { logger } from '@/lib/logging';
import { useUnifiedAdminStore } from '../useUnifiedAdminStore';

// 기본 스토어들 익스포트
export { useUnifiedAdminStore } from '../useUnifiedAdminStore';

// 특정 기능별 통합 훅
export const useSystemAuth = () => {
  const { isSystemStarted, startSystem, stopSystem, getSystemRemainingTime } =
    useUnifiedAdminStore();
  const canControlSystem = isGuestFullAccessEnabled();

  return {
    // 시스템 상태
    isSystemStarted,
    systemRemainingTime: getSystemRemainingTime(),

    // 통합 액션
    startSystem: () => {
      if (canControlSystem) {
        startSystem();
      } else {
        logger.warn('⚠️ 관리자 인증이 필요합니다.');
      }
    },

    stopSystem,
    logout: () => {
      if (isSystemStarted) {
        stopSystem();
      }
    },
  };
};

// 서버 데이터 관련 통합 훅
export const useServerManagement = () => {
  const { data: servers = [], isLoading, error, refetch } = useServerQuery();
  const { isSystemStarted } = useUnifiedAdminStore();

  return {
    servers: isSystemStarted ? servers : [],
    isLoading: isSystemStarted ? isLoading : false,
    error: isSystemStarted ? error?.message || null : null,
    updateServer: undefined, // Removed as we use React Query
    refreshServers: async () => {
      await refetch();
    },
    isSystemActive: isSystemStarted,
  };
};

// 통합 상태 훅
export const useAppState = () => {
  const systemAuth = useSystemAuth();
  const serverManagement = useServerManagement();

  return {
    ...systemAuth,
    ...serverManagement,
  };
};

// 스토어 상태 초기화 (개발용)
export const resetAllStores = () => {
  if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
    // localStorage 클리어
    localStorage.removeItem('system-store');
    localStorage.removeItem('auth-store');
    localStorage.removeItem('ai-store');

    // 스토어 재설정
    window.location.reload();

    logger.info('🔄 모든 스토어 초기화 완료');
  }
};

// 스토어 상태 디버깅 (개발용)
export const debugStores = () => {
  if (process.env.NODE_ENV === 'development') {
    const servers = {}; // React Query Cache isn't easily accessible here without queryClient
    const auth = useUnifiedAdminStore.getState();

    console.group('🔍 Store Debug Info');
    logger.info('Servers:', servers);
    logger.info('Auth:', auth);
    console.groupEnd();

    return { servers, auth };
  }
  return undefined;
};
