import { browserNotificationService } from '@/services/notifications/BrowserNotificationService';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { SYSTEM_AUTO_SHUTDOWN_TIME } from '@/config/system-constants';

interface UnifiedAdminState {
  // 시스템 상태
  isSystemStarted: boolean;
  systemStartTime: number | null;
  systemShutdownTimer: NodeJS.Timeout | null;

  // AI 에이전트 상태 (기본 활성화)
  aiAgent: {
    isEnabled: boolean; // 기본 true - 누구나 사용 가능
    state: 'disabled' | 'enabled' | 'processing' | 'idle';
  };

  // UI 상태
  ui: {
    isSettingsPanelOpen: boolean; // 설정 패널 열림 상태
  };

  // 액션 메소드
  startSystem: () => void;
  stopSystem: () => void;
  getSystemRemainingTime: () => number;
  logout: () => void;
  setSettingsPanelOpen: (isOpen: boolean) => void;
}

export const useUnifiedAdminStore = create<UnifiedAdminState>()(
  persist(
    (set, get) => ({
      // 초기 상태
      isSystemStarted: false,
      systemStartTime: null,
      systemShutdownTimer: null,

      // AI 에이전트 기본 활성화 (인증 불필요)
      aiAgent: {
        isEnabled: true, // 기본 활성화 - 누구나 사용 가능
        state: 'enabled',
      },

      // UI 상태
      ui: {
        isSettingsPanelOpen: false,
      },

      // 시스템 시작
      startSystem: () => {
        try {
          const now = Date.now();

          // 기존 타이머가 있다면 정리
          const currentTimer = get().systemShutdownTimer;
          if (currentTimer) {
            clearTimeout(currentTimer);
          }

          // 30분 후 자동 종료 타이머 설정
          const shutdownTimer = setTimeout(() => {
            console.log('⏰ [System] 30분 자동 종료 타이머 실행');

            // 🔔 30분 자동 종료 알림 발송
            browserNotificationService.sendSystemShutdownNotification(
              '30분 자동 종료'
            );

            get().stopSystem();
          }, SYSTEM_AUTO_SHUTDOWN_TIME);

          set((state) => ({
            ...state,
            isSystemStarted: true,
            systemStartTime: now,
            systemShutdownTimer: shutdownTimer,
          }));

          console.log('🚀 [System] 시스템 시작 완료');
          console.log('🤖 [AI] AI 에이전트는 항상 활성화 상태 유지');
        } catch (error) {
          console.error('❌ [System] 시스템 시작 실패:', error);
        }
      },

      stopSystem: () => {
        try {
          // 자동 종료 타이머 정리
          const currentTimer = get().systemShutdownTimer;
          if (currentTimer) {
            clearTimeout(currentTimer);
          }

          // 상태 초기화 (AI 에이전트는 계속 활성화 유지)
          set((state) => ({
            ...state,
            isSystemStarted: false,
            systemStartTime: null,
            systemShutdownTimer: null,
            // AI 에이전트는 항상 활성화 상태 유지
            // 관리자 모드는 선택적으로 유지
          }));

          console.log(
            '⏹️ [System] 시스템 정지됨 - AI 에이전트는 계속 활성화 상태'
          );
        } catch (error) {
          console.error('❌ [System] 시스템 정지 실패:', error);
        }
      },

      // 시스템 남은 시간
      getSystemRemainingTime: () => {
        const { systemStartTime } = get();
        if (systemStartTime) {
          const elapsed = Date.now() - systemStartTime;
          return Math.max(0, SYSTEM_AUTO_SHUTDOWN_TIME - elapsed);
        }
        return 0;
      },

      // 전체 로그아웃 (시스템 + 관리자)
      logout: () => {
        try {
          get().stopSystem();
          console.log('🔐 [System] 전체 로그아웃 완료');
        } catch (error) {
          console.error('❌ [System] 전체 로그아웃 실패:', error);
        }
      },

      // AI 에이전트 토글
      toggleAI: () => {
        try {
          set((state) => ({
            ...state,
            aiAgent: {
              ...state.aiAgent,
              isEnabled: !state.aiAgent.isEnabled,
              state: !state.aiAgent.isEnabled ? 'enabled' : 'disabled',
            },
          }));

          const newState = get().aiAgent.isEnabled;
          console.log(
            `🤖 [AI] AI 에이전트 ${newState ? '활성화' : '비활성화'}`
          );
        } catch (error) {
          console.error('❌ [AI] AI 토글 실패:', error);
        }
      },

      // 설정 패널 상태 관리
      setSettingsPanelOpen: (isOpen: boolean) => {
        set((state) => ({
          ...state,
          ui: {
            ...state.ui,
            isSettingsPanelOpen: isOpen,
          },
        }));
      },
    }),
    {
      name: 'unified-admin-storage',
      partialize: (_state) => ({
        // AI 에이전트는 항상 활성화 상태이므로 저장하지 않음
      }),
      // SSR 안전성을 위한 skipHydration 추가
      skipHydration: true,
    }
  )
);
