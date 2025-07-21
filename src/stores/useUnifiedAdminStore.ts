import { browserNotificationService } from '@/services/notifications/BrowserNotificationService';
// // 🚫 ModeTimerManager 제거됨 - Vercel 플랫폼 모니터링 사용
// import { modeTimerManager } from '@/utils/ModeTimerManager';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const ADMIN_PASSWORD = '4231';
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 10000; // 10초 (UI에서는 10분이라고 표시)
const SYSTEM_AUTO_SHUTDOWN_TIME = 30 * 60 * 1000; // 30분

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

  // 관리자 모드 상태 (관리자 기능 접근용)
  adminMode: {
    isAuthenticated: boolean; // PIN 인증 상태
    lastLoginTime: number | null;
  };

  // UI 상태
  ui: {
    isSettingsPanelOpen: boolean; // 설정 패널 열림 상태
  };

  // 인증 및 보안 (관리자 모드용)
  attempts: number;
  isLocked: boolean;
  lockoutEndTime: number | null;

  // 액션 메소드
  startSystem: () => void;
  stopSystem: () => void;
  authenticateAdmin: (
    password: string
  ) => Promise<{ success: boolean; message: string; remainingTime?: number }>;
  logoutAdmin: () => void;
  checkLockStatus: () => boolean;
  getRemainingLockTime: () => number;
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

      // 관리자 모드 (인증 필요)
      adminMode: {
        isAuthenticated: false, // 기본값을 false로 복구 - 관리자 인증 필요
        lastLoginTime: null,
      },

      // UI 상태
      ui: {
        isSettingsPanelOpen: false,
      },

      // 인증 상태 (관리자 모드용)
      attempts: 0,
      isLocked: false,
      lockoutEndTime: null,

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

          set(state => ({
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
          set(state => ({
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

      // 잠금 상태 확인
      checkLockStatus: () => {
        const { isLocked, lockoutEndTime } = get();
        if (isLocked && lockoutEndTime) {
          if (Date.now() >= lockoutEndTime) {
            // 잠금 해제
            set(state => ({
              ...state,
              isLocked: false,
              lockoutEndTime: null,
              attempts: 0,
            }));
            console.log('🔓 [Auth] 잠금 자동 해제');
            return true;
          }
          return false;
        }
        return true;
      },

      // 남은 잠금 시간
      getRemainingLockTime: () => {
        const { lockoutEndTime } = get();
        if (lockoutEndTime) {
          return Math.max(0, lockoutEndTime - Date.now());
        }
        return 0;
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

      // 관리자 인증 (관리자 기능 접근용)
      authenticateAdmin: async (password: string) => {
        try {
          const state = get();
          if (!state) {
            console.error('❌ [Auth] 스토어 상태가 없음 - 인증 중단');
            return {
              success: false,
              message: '스토어 상태를 읽을 수 없습니다.',
            };
          }

          const { attempts, checkLockStatus } = state;

          // 잠금 상태 확인
          if (!checkLockStatus()) {
            const remainingTime = get()?.getRemainingLockTime() || 0;
            console.warn('🔒 [Auth] 계정 잠금 상태 - 인증 시도 차단');
            return {
              success: false,
              message: `5번 틀려서 잠겼습니다. ${Math.ceil(remainingTime / 1000)}초 후 다시 시도하세요.`,
              remainingTime,
            };
          }

          // 비밀번호 검증
          if (password === ADMIN_PASSWORD) {
            // 관리자 인증 성공
            set(state => ({
              ...state,
              attempts: 0,
              adminMode: {
                isAuthenticated: true,
                lastLoginTime: Date.now(),
              },
            }));

            console.log('✅ [Admin] 관리자 인증 성공 - AI 관리자 기능 활성화');

            return {
              success: true,
              message:
                'AI 관리자 모드가 활성화되었습니다. 이제 AI 관리자 페이지에 접근할 수 있습니다.',
            };
          } else {
            // 인증 실패
            const newAttempts = attempts + 1;
            console.warn(
              `❌ [Auth] 관리자 인증 실패 (${newAttempts}/${MAX_ATTEMPTS})`
            );

            if (newAttempts >= MAX_ATTEMPTS) {
              // 계정 잠금
              const lockoutEnd = Date.now() + LOCKOUT_DURATION;
              set(state => ({
                ...state,
                attempts: newAttempts,
                isLocked: true,
                lockoutEndTime: lockoutEnd,
              }));

              console.warn('🔒 [Auth] 최대 시도 횟수 초과 - 계정 잠금');
              return {
                success: false,
                message: `5번 틀려서 잠겼습니다. ${LOCKOUT_DURATION / 1000}초 후 다시 시도하세요.`,
                remainingTime: LOCKOUT_DURATION,
              };
            } else {
              // 시도 횟수 증가
              set(state => ({
                ...state,
                attempts: newAttempts,
              }));

              const remainingAttempts = MAX_ATTEMPTS - newAttempts;
              return {
                success: false,
                message: `관리자 비밀번호가 틀렸습니다. (${remainingAttempts}번 더 시도 가능)`,
              };
            }
          }
        } catch (error) {
          console.error('❌ [Auth] 관리자 인증 처리 중 오류:', error);
          return {
            success: false,
            message: '인증 처리 중 오류가 발생했습니다.',
          };
        }
      },

      // 관리자 로그아웃
      logoutAdmin: () => {
        try {
          set(state => ({
            ...state,
            adminMode: {
              isAuthenticated: false,
              lastLoginTime: null,
            },
            attempts: 0, // 로그아웃 시 시도 횟수 초기화
          }));

          console.log('🔐 [Admin] 관리자 로그아웃 완료');
        } catch (error) {
          console.error('❌ [Admin] 관리자 로그아웃 실패:', error);
        }
      },

      // 전체 로그아웃 (시스템 + 관리자)
      logout: () => {
        try {
          get().stopSystem();
          get().logoutAdmin();
          console.log('🔐 [System] 전체 로그아웃 완료');
        } catch (error) {
          console.error('❌ [System] 전체 로그아웃 실패:', error);
        }
      },

      // AI 에이전트 토글
      toggleAI: () => {
        try {
          set(state => ({
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
        set(state => ({
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
      partialize: state => ({
        // AI 에이전트는 항상 활성화 상태이므로 저장하지 않음
        adminMode: state.adminMode, // 관리자 모드 상태만 저장
        attempts: state.attempts,
        isLocked: state.isLocked,
        lockoutEndTime: state.lockoutEndTime,
      }),
      // SSR 안전성을 위한 skipHydration 추가
      skipHydration: true,
    }
  )
);
