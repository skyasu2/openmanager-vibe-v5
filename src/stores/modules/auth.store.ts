import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

/**
 * 🔐 Auth Store Module
 * 인증 및 보안 관리 전용 스토어
 */

const ADMIN_PASSWORD = '4231';
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 10000; // 10초

export interface AuthState {
  // 상태
  isAuthenticated: boolean;
  attempts: number;
  isLocked: boolean;
  lockoutEndTime: number | null;
  lastLoginTime: number | null;

  // 사용자 정보
  user: {
    name: string;
    role: 'admin' | 'user';
    permissions: string[];
  } | null;

  // 액션
  authenticate: (password: string) => {
    success: boolean;
    message: string;
    remainingTime?: number;
  };
  logout: () => void;
  checkLockStatus: () => boolean;
  getRemainingLockTime: () => number;
  resetAttempts: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // 초기 상태
      isAuthenticated: false,
      attempts: 0,
      isLocked: false,
      lockoutEndTime: null,
      lastLoginTime: null,
      user: null,

      // 인증
      authenticate: (password: string) => {
        try {
          const { attempts, checkLockStatus } = get();

          // 잠금 상태 확인
          if (!checkLockStatus()) {
            return {
              success: false,
              message: '계정이 잠겨있습니다.',
              remainingTime: get().getRemainingLockTime(),
            };
          }

          // 비밀번호 검증
          if (password === ADMIN_PASSWORD) {
            set({
              isAuthenticated: true,
              attempts: 0,
              lastLoginTime: Date.now(),
              user: {
                name: '관리자',
                role: 'admin',
                permissions: ['system:control', 'ai:access', 'servers:manage'],
              },
            });

            console.log('✅ [Auth] 인증 성공');

            // 인증 성공 이벤트
            if (typeof window !== 'undefined') {
              window.dispatchEvent(
                new CustomEvent('auth:success', {
                  detail: { timestamp: Date.now() },
                })
              );
            }

            return {
              success: true,
              message: '인증이 완료되었습니다.',
            };
          } else {
            const newAttempts = attempts + 1;

            if (newAttempts >= MAX_ATTEMPTS) {
              const lockoutEndTime = Date.now() + LOCKOUT_DURATION;

              set({
                attempts: newAttempts,
                isLocked: true,
                lockoutEndTime,
              });

              console.log(`🔒 [Auth] 계정 잠금 - ${MAX_ATTEMPTS}회 실패`);

              return {
                success: false,
                message: `${MAX_ATTEMPTS}회 실패로 계정이 잠겼습니다.`,
                remainingTime: LOCKOUT_DURATION,
              };
            } else {
              set({ attempts: newAttempts });

              return {
                success: false,
                message: `비밀번호가 틀렸습니다. (${newAttempts}/${MAX_ATTEMPTS})`,
              };
            }
          }
        } catch (error) {
          console.error('❌ [Auth] 인증 오류:', error);
          return {
            success: false,
            message: '인증 중 오류가 발생했습니다.',
          };
        }
      },

      // 로그아웃
      logout: () => {
        try {
          set({
            isAuthenticated: false,
            user: null,
            lastLoginTime: null,
          });

          console.log('👋 [Auth] 로그아웃');

          // 로그아웃 이벤트
          if (typeof window !== 'undefined') {
            window.dispatchEvent(
              new CustomEvent('auth:logout', {
                detail: { timestamp: Date.now() },
              })
            );
          }
        } catch (error) {
          console.error('❌ [Auth] 로그아웃 오류:', error);
        }
      },

      // 잠금 상태 확인
      checkLockStatus: () => {
        try {
          const { isLocked, lockoutEndTime } = get();

          if (isLocked && lockoutEndTime) {
            const now = Date.now();
            if (now < lockoutEndTime) {
              return false; // 아직 잠김
            } else {
              // 잠금 해제
              set({
                isLocked: false,
                lockoutEndTime: null,
                attempts: 0,
              });

              console.log('🔓 [Auth] 계정 잠금 해제');
              return true;
            }
          }

          return !isLocked;
        } catch (error) {
          console.error('❌ [Auth] 잠금 상태 확인 실패:', error);
          return false;
        }
      },

      // 남은 잠금 시간
      getRemainingLockTime: () => {
        try {
          const { isLocked, lockoutEndTime } = get();
          if (!isLocked || !lockoutEndTime) return 0;
          return Math.max(0, lockoutEndTime - Date.now());
        } catch (error) {
          console.error('❌ [Auth] 잠금 시간 계산 실패:', error);
          return 0;
        }
      },

      // 시도 횟수 초기화
      resetAttempts: () => {
        set({
          attempts: 0,
          isLocked: false,
          lockoutEndTime: null,
        });

        console.log('🔄 [Auth] 시도 횟수 초기화');
      },
    }),
    {
      name: 'auth-store',
      storage: createJSONStorage(() => localStorage),
      // 민감한 정보는 세션 종료 시 제거
      partialize: state => ({
        attempts: state.attempts,
        isLocked: state.isLocked,
        lockoutEndTime: state.lockoutEndTime,
        lastLoginTime: state.lastLoginTime,
      }),
    }
  )
);
