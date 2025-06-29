/**
 * 🏪 Store Modules Export
 * 모든 Zustand 스토어 모듈 중앙 관리
 */

// 개별 스토어 import
import { useSystemStore, type SystemState } from './system.store';
import { useAuthStore, type AuthState } from './auth.store';
import { useAIStore, type AIState, type AIAgentState } from './ai.store';

// 개별 스토어 export
export { useSystemStore, type SystemState } from './system.store';
export { useAuthStore, type AuthState } from './auth.store';
export { useAIStore, type AIState, type AIAgentState } from './ai.store';

// 통합 상태 타입
export interface GlobalState {
  system: SystemState;
  auth: AuthState;
  ai: AIState;
}

// 통합 훅 (모든 스토어에 접근)
export const useGlobalState = () => {
  const system = useSystemStore();
  const auth = useAuthStore();
  const ai = useAIStore();

  return {
    system,
    auth,
    ai,
  };
};

// 특정 기능별 통합 훅
export const useSystemAuth = () => {
  const { isStarted, start, stop, getRemainingTime } = useSystemStore();
  const { isAuthenticated, authenticate, logout } = useAuthStore();

  return {
    // 시스템 상태
    isSystemStarted: isStarted,
    systemRemainingTime: getRemainingTime(),

    // 인증 상태
    isAuthenticated,

    // 통합 액션
    startSystem: () => {
      if (isAuthenticated) {
        start();
      } else {
        console.warn('⚠️ 인증이 필요합니다.');
      }
    },

    stopSystem: stop,
    authenticate,
    logout: () => {
      if (isStarted) {
        stop();
      }
      logout();
    },
  };
};

export const useAISystem = () => {
  const { isStarted } = useSystemStore();
  const { isAuthenticated } = useAuthStore();
  const { isEnabled, enable, disable, state, metrics } = useAIStore();

  return {
    // AI 상태
    isAIEnabled: isEnabled,
    aiState: state,
    aiMetrics: metrics,

    // 조건부 AI 제어
    enableAI: () => {
      if (isStarted && isAuthenticated) {
        enable();
      } else {
        console.warn('⚠️ 시스템 시작 및 인증이 필요합니다.');
      }
    },

    disableAI: disable,

    // 상태 체크
    canUseAI: isStarted && isAuthenticated,
  };
};

// 스토어 상태 초기화 (개발용)
export const resetAllStores = () => {
  if (process.env.NODE_ENV === 'development') {
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
    const system = useSystemStore.getState();
    const auth = useAuthStore.getState();
    const ai = useAIStore.getState();

    console.group('🔍 Store Debug Info');
    console.log('System:', system);
    console.log('Auth:', auth);
    console.log('AI:', ai);
    console.groupEnd();

    return { system, auth, ai };
  }
};
