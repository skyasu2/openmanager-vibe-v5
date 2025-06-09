import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { modeTimerManager } from '@/utils/ModeTimerManager';

const ADMIN_PASSWORD = '4231';
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 10000; // 10초 (UI에서는 10분이라고 표시)
const SYSTEM_AUTO_SHUTDOWN_TIME = 30 * 60 * 1000; // 30분

// 🔓 개발 환경 비밀번호 우회 설정 (로컬에서는 항상 우회)
const DEVELOPMENT_MODE =
  process.env.NODE_ENV === 'development' || typeof window !== 'undefined';
const BYPASS_PASSWORD = true; // 항상 비밀번호 우회 허용

interface UnifiedAdminState {
  // 시스템 상태
  isSystemStarted: boolean;
  systemStartTime: number | null;
  systemShutdownTimer: NodeJS.Timeout | null;

  // AI 에이전트 통합 상태 (관리자 모드와 통합)
  aiAgent: {
    isEnabled: boolean; // AI 에이전트 활성화 여부 (관리자 모드와 동일)
    isAuthenticated: boolean; // 인증 상태
    state: 'disabled' | 'enabled' | 'processing' | 'idle';
  };

  // 인증 및 보안
  attempts: number;
  isLocked: boolean;
  lockoutEndTime: number | null;

  // 액션 메소드
  startSystem: () => void;
  stopSystem: () => void;
  authenticateAIAgent: (
    password: string
  ) => Promise<{ success: boolean; message: string; remainingTime?: number }>;
  disableAIAgent: () => void;
  toggleAIProcessing: () => Promise<void>;
  checkLockStatus: () => boolean;
  getRemainingLockTime: () => number;
  getSystemRemainingTime: () => number;
  logout: () => void;
}

export const useUnifiedAdminStore = create<UnifiedAdminState>()(
  persist(
    (set, get) => ({
      // 초기 상태 - AI 기능 기본 오프
      isSystemStarted: false,
      systemStartTime: null,
      systemShutdownTimer: null,
      aiAgent: {
        isEnabled: false,
        isAuthenticated: false,
        state: 'disabled',
      },
      attempts: 0,
      isLocked: false,
      lockoutEndTime: null,

      // 시스템 제어
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
            console.log('⏰ [System] 30분 경과 - 자동 시스템 종료');
            get().stopSystem();
          }, SYSTEM_AUTO_SHUTDOWN_TIME);

          set(state => ({
            ...state,
            isSystemStarted: true,
            systemStartTime: now,
            systemShutdownTimer: shutdownTimer,
          }));

          console.log('🚀 [System] 시스템 시작됨 - 30분 후 자동 종료 예약');
          console.log(
            `⏰ [System] 종료 예정 시간: ${new Date(now + SYSTEM_AUTO_SHUTDOWN_TIME).toLocaleTimeString()}`
          );

          // 시스템 시작 이벤트 발생
          if (typeof window !== 'undefined') {
            window.dispatchEvent(
              new CustomEvent('system:started', {
                detail: {
                  timestamp: now,
                  autoShutdownTime: now + SYSTEM_AUTO_SHUTDOWN_TIME,
                },
              })
            );
          }
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

          // 🔧 AI 에이전트 독립 실행 모드 지원
          const currentState = get();
          const keepAIAgent =
            currentState?.aiAgent?.isEnabled &&
            currentState?.aiAgent?.isAuthenticated;

          // 상태 초기화 (AI 에이전트는 선택적 유지)
          set(state => ({
            ...state,
            isSystemStarted: false,
            systemStartTime: null,
            systemShutdownTimer: null,
            // AI 기능 선택적 유지 (독립 모드)
            aiAgent: keepAIAgent
              ? {
                  ...state.aiAgent,
                  // 독립 모드로 상태만 변경
                  state: 'enabled' as const,
                }
              : {
                  isEnabled: false,
                  isAuthenticated: false,
                  state: 'disabled' as const,
                },
            // 인증 상태는 AI가 활성화된 경우 유지
            attempts: keepAIAgent ? state.attempts : 0,
            isLocked: keepAIAgent ? state.isLocked : false,
            lockoutEndTime: keepAIAgent ? state.lockoutEndTime : null,
          }));

          if (keepAIAgent) {
            console.log(
              '⏹️ [System] 시스템 정지됨 - AI 에이전트는 독립 모드로 계속 실행'
            );
            console.log('🤖 [AI] AI 에이전트 독립 실행 모드 활성화');
            console.log('🔐 [Auth] 인증 상태 유지 (AI 독립 모드)');
          } else {
            console.log('⏹️ [System] 시스템 정지됨 - 모든 기능 비활성화');
            console.log('🤖 [AI] AI 에이전트 완전 초기화');
            console.log('🔐 [Auth] 인증 상태 초기화');
          }

          // AI 모드가 활성화되어 있었다면 종료
          try {
            modeTimerManager.switchMode('monitoring');
          } catch (timerError) {
            console.warn(
              '⚠️ [Timer] ModeTimerManager 정리 중 오류:',
              timerError
            );
          }

          // 브라우저 저장소 정리 (선택적)
          try {
            if (typeof window !== 'undefined' && window.localStorage) {
              // AI 관련 임시 데이터 정리
              const keysToRemove = Object.keys(localStorage).filter(
                key =>
                  key.startsWith('ai-temp-') ||
                  key.startsWith('agent-cache-') ||
                  key.startsWith('processing-state-')
              );
              keysToRemove.forEach(key => localStorage.removeItem(key));
              console.log('🧹 [Cleanup] 임시 AI 데이터 정리 완료');
            }
          } catch (cleanupError) {
            console.warn(
              '⚠️ [Cleanup] 브라우저 저장소 정리 중 오류:',
              cleanupError
            );
          }

          // 시스템 종료 이벤트 발생
          if (typeof window !== 'undefined') {
            window.dispatchEvent(
              new CustomEvent('system:stopped', {
                detail: {
                  timestamp: Date.now(),
                  fullReset: !keepAIAgent,
                  aiIndependentMode: keepAIAgent,
                },
              })
            );
          }
        } catch (error) {
          console.error('❌ [System] 시스템 정지 실패:', error);

          // 에러 발생 시에도 강제 초기화
          try {
            set(state => ({
              ...state,
              isSystemStarted: false,
              systemStartTime: null,
              systemShutdownTimer: null,
              aiAgent: {
                isEnabled: false,
                isAuthenticated: false,
                state: 'disabled',
              },
              attempts: 0,
              isLocked: false,
              lockoutEndTime: null,
            }));
            console.log('🔧 [System] 강제 초기화 완료');
          } catch (forceResetError) {
            console.error('❌ [System] 강제 초기화도 실패:', forceResetError);
          }
        }
      },

      // 시스템 남은 시간 계산
      getSystemRemainingTime: () => {
        try {
          const { isSystemStarted, systemStartTime } = get();
          if (!isSystemStarted || !systemStartTime) return 0;

          const elapsed = Date.now() - systemStartTime;
          const remaining = Math.max(0, SYSTEM_AUTO_SHUTDOWN_TIME - elapsed);
          return remaining;
        } catch (error) {
          console.error('❌ [System] 남은 시간 계산 실패:', error);
          return 0;
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
              set(state => ({
                ...state,
                isLocked: false,
                lockoutEndTime: null,
                attempts: 0,
              }));
              console.log('🔓 [Auth] 계정 잠금 해제됨');
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

      // AI 에이전트 인증 (관리자 모드 통합)
      authenticateAIAgent: async (password: string) => {
        try {
          // 🛡️ 상태 안전성 검증
          const state = get();
          if (!state) {
            console.error('❌ [Auth] 스토어 상태가 없음 - 인증 중단');
            return {
              success: false,
              message: '스토어 상태를 읽을 수 없습니다.',
            };
          }

          const { attempts, checkLockStatus } = state;

          // 🔧 시스템 시작 조건 제거 - AI 엔진 독립 실행 허용
          // if (!isSystemStarted) {
          //   return {
          //     success: false,
          //     message: '시스템을 먼저 시작해주세요.',
          //   };
          // }

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

          // 🔓 개발 환경 비밀번호 우회 또는 정상 비밀번호 검증
          if (BYPASS_PASSWORD || password === ADMIN_PASSWORD) {
            // 🛡️ 안전한 상태 업데이트 - 단계별 처리

            // 1단계: 인증 상태 먼저 설정
            set(state => {
              if (!state) return state;

              return {
                ...state,
                attempts: 0,
                aiAgent: {
                  ...state.aiAgent,
                  isAuthenticated: true,
                },
              };
            });

            // 2단계: 잠시 지연 후 활성화 (UI 안정화)
            await new Promise(resolve => setTimeout(resolve, 50));

            set(state => {
              if (!state) return state;

              return {
                ...state,
                aiAgent: {
                  isEnabled: true,
                  isAuthenticated: true,
                  state: 'enabled',
                },
              };
            });

            const authMode = BYPASS_PASSWORD
              ? '(개발 모드 - 비밀번호 우회)'
              : '(정상 인증)';
            console.log(
              `✅ [AI] AI 에이전트 모드 활성화 - 지능형 분석 시작 ${authMode}`
            );

            // ModeTimerManager를 사용한 AI 모드 시작 (비동기 처리)
            setTimeout(() => {
              try {
                modeTimerManager.switchMode('ai');

                // 이벤트 발생
                if (typeof window !== 'undefined') {
                  window.dispatchEvent(
                    new CustomEvent('ai:enabled', {
                      detail: {
                        timestamp: Date.now(),
                        independentMode: true, // 독립 실행 모드 표시
                        bypassMode: BYPASS_PASSWORD, // 우회 모드 여부
                      },
                    })
                  );
                }
              } catch (timerError) {
                console.warn(
                  '⚠️ [Timer] ModeTimerManager 전환 중 오류:',
                  timerError
                );
              }
            }, 100);

            const message = BYPASS_PASSWORD
              ? 'AI 에이전트가 개발 모드로 활성화되었습니다. (비밀번호 우회 적용)'
              : 'AI 에이전트가 독립 모드로 활성화되었습니다. 시스템과 독립적으로 지능형 분석을 시작합니다.';

            return {
              success: true,
              message,
            };
          } else {
            const newAttempts = attempts + 1;
            console.warn(
              `🚫 [Auth] 인증 실패 (${newAttempts}/${MAX_ATTEMPTS})`
            );

            if (newAttempts >= MAX_ATTEMPTS) {
              const lockoutEndTime = Date.now() + LOCKOUT_DURATION;
              set(state => {
                if (!state) return state;

                return {
                  ...state,
                  attempts: newAttempts,
                  isLocked: true,
                  lockoutEndTime,
                };
              });
              console.error('🔒 [Auth] 계정 잠금 - 최대 시도 횟수 초과');
              return {
                success: false,
                message: '5번 틀려서 잠겼습니다. 잠시 후 다시 시도하세요.',
              };
            } else {
              set(state => {
                if (!state) return state;
                return { ...state, attempts: newAttempts };
              });
              return {
                success: false,
                message: `비밀번호가 틀렸습니다. (${newAttempts}/${MAX_ATTEMPTS})`,
              };
            }
          }
        } catch (error) {
          console.error('❌ [AI] AI 에이전트 인증 실패:', error);
          return {
            success: false,
            message: '인증 처리 중 오류가 발생했습니다.',
          };
        }
      },

      // AI 에이전트 비활성화
      disableAIAgent: () => {
        try {
          // 🛡️ 상태 안전성 검증
          const state = get();
          if (!state) {
            console.error('❌ [AI] 스토어 상태가 없음 - 비활성화 중단');
            return;
          }

          set(state => {
            if (!state) return state;

            return {
              ...state,
              aiAgent: {
                isEnabled: false,
                isAuthenticated: false,
                state: 'disabled',
              },
            };
          });

          console.log(
            '🔐 [AI] AI 에이전트 모드 종료 - 기본 모니터링 모드로 전환'
          );

          // ModeTimerManager를 사용한 기본 모니터링으로 전환
          try {
            modeTimerManager.switchMode('monitoring');

            // 이벤트 발생
            if (typeof window !== 'undefined') {
              window.dispatchEvent(
                new CustomEvent('ai:disabled', {
                  detail: { timestamp: Date.now() },
                })
              );
            }
          } catch (timerError) {
            console.warn(
              '⚠️ [Timer] ModeTimerManager 전환 중 오류:',
              timerError
            );
          }
        } catch (error) {
          console.error('❌ [AI] AI 에이전트 비활성화 실패:', error);
        }
      },

      // AI 처리 토글 (더 이상 사용하지 않음)
      toggleAIProcessing: async () => {
        try {
          // 🛡️ 상태 안전성 검증
          const state = get();
          if (!state) {
            console.error('❌ [AI] 스토어 상태가 없음 - 토글 중단');
            throw new Error('스토어 상태를 읽을 수 없습니다.');
          }

          const { aiAgent } = state;

          if (!aiAgent || !aiAgent.isEnabled || !aiAgent.isAuthenticated) {
            throw new Error('AI 에이전트 모드가 필요합니다.');
          }

          // 간단한 상태 토글만 수행
          const newState =
            aiAgent.state === 'processing' ? 'enabled' : 'processing';

          set(state => {
            if (!state) return state;

            return {
              ...state,
              aiAgent: {
                ...state.aiAgent,
                state: newState,
              },
            };
          });

          console.log(`🔄 [AI] AI 처리 상태 변경: ${newState}`);
        } catch (error) {
          console.error('❌ [AI] AI 처리 토글 실패:', error);
          throw error;
        }
      },

      // 로그아웃
      logout: () => {
        try {
          // 🛡️ 상태 안전성 검증
          const state = get();
          if (!state) {
            console.error('❌ [Auth] 스토어 상태가 없음 - 로그아웃 중단');
            return;
          }

          set(state => {
            if (!state) return state;

            return {
              ...state,
              aiAgent: {
                isEnabled: false,
                isAuthenticated: false,
                state: 'disabled',
              },
            };
          });

          console.log('🔐 [Auth] 로그아웃 - 기본 모니터링 모드로 전환');

          // ModeTimerManager 정리
          try {
            modeTimerManager.switchMode('monitoring');
          } catch (timerError) {
            console.warn(
              '⚠️ [Timer] ModeTimerManager 정리 중 오류:',
              timerError
            );
          }

          // 로그아웃 이벤트 발생
          if (typeof window !== 'undefined') {
            window.dispatchEvent(
              new CustomEvent('auth:logout', {
                detail: { timestamp: Date.now() },
              })
            );
          }
        } catch (error) {
          console.error('❌ [Auth] 로그아웃 실패:', error);
        }
      },
    }),
    {
      name: 'unified-admin-storage',
      partialize: state => ({
        isSystemStarted: state.isSystemStarted,
        systemStartTime: state.systemStartTime,
        aiAgent: state.aiAgent,
        attempts: state.attempts,
        isLocked: state.isLocked,
        lockoutEndTime: state.lockoutEndTime,
      }),
    }
  )
);
