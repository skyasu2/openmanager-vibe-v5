/**
 * 🏪 Store Modules Export
 *
 * OpenManager Vibe v5 상태 관리 모듈 통합 (Google OAuth 제거됨)
 */

import { useServerDataStore } from '@/components/providers/StoreProvider';
import { useUnifiedAdminStore } from '../useUnifiedAdminStore';

// 기본 스토어들 익스포트
export { useServerDataStore } from '@/components/providers/StoreProvider';
export { useUnifiedAdminStore } from '../useUnifiedAdminStore';

// 특정 기능별 통합 훅
export const useSystemAuth = () => {
  const { isSystemStarted, startSystem, stopSystem, getSystemRemainingTime } =
    useUnifiedAdminStore();
  const { adminMode, authenticateAdmin, logoutAdmin } = useUnifiedAdminStore();

  return {
    // 시스템 상태
    isSystemStarted,
    systemRemainingTime: getSystemRemainingTime(),

    // 관리자 인증 상태
    isAdminAuthenticated: adminMode.isAuthenticated,

    // 통합 액션
    startSystem: () => {
      if (adminMode.isAuthenticated) {
        startSystem();
      } else {
        console.warn('⚠️ 관리자 인증이 필요합니다.');
      }
    },

    stopSystem,
    authenticateAdmin,
    logout: () => {
      if (isSystemStarted) {
        stopSystem();
      }
      logoutAdmin();
    },
  };
};

// 서버 데이터 관련 통합 훅
export const useServerManagement = () => {
  const servers = useServerDataStore(state => state.servers);
  const isLoading = useServerDataStore(state => state.isLoading);
  const error = useServerDataStore(state => state.error);
  const actions = useServerDataStore(state => state.actions);
  const { isSystemStarted } = useUnifiedAdminStore();

  return {
    servers: isSystemStarted ? servers : [],
    isLoading: isSystemStarted ? isLoading : false,
    error: isSystemStarted ? error : null,
    updateServer: actions?.updateServer,
    refreshServers: actions?.refreshServers,
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

    console.log('🔄 모든 스토어 초기화 완료');
  }
};

// 스토어 상태 디버깅 (개발용)
export const debugStores = () => {
  if (process.env.NODE_ENV === 'development') {
    const servers = {}; // useServerDataStore.getState();
    const auth = useUnifiedAdminStore.getState();

    console.group('🔍 Store Debug Info');
    console.log('Servers:', servers);
    console.log('Auth:', auth);
    console.groupEnd();

    return { servers, auth };
  }
  return undefined;
};
