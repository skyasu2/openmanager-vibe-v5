import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { modeTimerManager } from '@/utils/ModeTimerManager';

const ADMIN_PASSWORD = '4231';
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 10000; // 10초 (UI에서는 10분이라고 표시)

interface UnifiedAdminState {
  // 시스템 상태
  isSystemStarted: boolean;
  isAdminMode: boolean;
  
  // 인증 및 보안
  isAuthenticated: boolean;
  attempts: number;
  isLocked: boolean;
  lockoutEndTime: number | null;
  
  // AI 에이전트 상태
  aiAgent: {
    state: 'enabled' | 'disabled' | 'processing' | 'idle';
    isActive: boolean;
  };
  
  // 액션 메소드
  startSystem: () => void;
  stopSystem: () => void;
  authenticateAdmin: (password: string) => { success: boolean; message: string; remainingTime?: number };
  exitAdminMode: () => void;
  toggleAIAgent: () => Promise<void>;
  checkLockStatus: () => boolean;
  getRemainingLockTime: () => number;
  logout: () => void;
}

export const useUnifiedAdminStore = create<UnifiedAdminState>()(
  persist(
    (set, get) => ({
      // 초기 상태
      isSystemStarted: false,
      isAdminMode: false,
      isAuthenticated: false,
      attempts: 0,
      isLocked: false,
      lockoutEndTime: null,
      aiAgent: {
        state: 'disabled',
        isActive: false
      },
      
      // 시스템 제어
      startSystem: () => {
        set({ isSystemStarted: true });
        console.log('🚀 시스템 시작됨 - 서버 모니터링 모드');
      },
      
      stopSystem: () => {
        set({ 
          isSystemStarted: false, 
          isAdminMode: false,
          aiAgent: { state: 'disabled', isActive: false }
        });
        console.log('⏹️ 시스템 정지됨 - 모든 사용자에게 적용');
      },
      
      // 잠금 상태 확인
      checkLockStatus: () => {
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
              attempts: 0 
            });
            return true;
          }
        }
        
        return !isLocked;
      },
      
      // 남은 잠금 시간
      getRemainingLockTime: () => {
        const { isLocked, lockoutEndTime } = get();
        if (!isLocked || !lockoutEndTime) return 0;
        return Math.max(0, lockoutEndTime - Date.now());
      },
      
      // 관리자 인증
      authenticateAdmin: (password: string) => {
        const { attempts, checkLockStatus } = get();
        
        // 잠금 상태 확인
        if (!checkLockStatus()) {
          const remainingTime = get().getRemainingLockTime();
          return {
            success: false,
            message: `5번 틀려서 10분간 잠겼습니다. ${Math.ceil(remainingTime / 1000)}초 후 다시 시도하세요.`,
            remainingTime
          };
        }
        
        if (password === ADMIN_PASSWORD) {
          set({ 
            isAdminMode: true,
            isAuthenticated: true,
            attempts: 0
          });
          
          console.log('✅ AI 관리자 인증 성공 - AI 관리자 모드 활성화');
          
          // ModeTimerManager를 사용한 AI 모드 시작
          modeTimerManager.switchMode('ai');
          window.dispatchEvent(new CustomEvent('stopCurrentMode'));
          window.dispatchEvent(new CustomEvent('startAIMode'));
          
          return { 
            success: true, 
            message: 'AI 관리자 모드가 활성화되었습니다.' 
          };
        } else {
          const newAttempts = attempts + 1;
          
          if (newAttempts >= MAX_ATTEMPTS) {
            const lockoutEndTime = Date.now() + LOCKOUT_DURATION;
            set({ 
              attempts: newAttempts,
              isLocked: true,
              lockoutEndTime
            });
            return {
              success: false,
              message: '5번 틀려서 10분간 잠겼습니다. 잠시 후 다시 시도하세요.'
            };
          } else {
            set({ attempts: newAttempts });
            return {
              success: false,
              message: `비밀번호가 틀렸습니다. (${newAttempts}/${MAX_ATTEMPTS})`
            };
          }
        }
      },
      
      // 관리자 모드 종료
      exitAdminMode: () => {
        set({ 
          isAdminMode: false,
          isAuthenticated: false,
          aiAgent: { state: 'disabled', isActive: false }
        });
        
        console.log('🔐 AI 관리자 모드 종료 - 서버 모니터링 모드로 전환');
        
        // ModeTimerManager를 사용한 기본 모니터링으로 전환
        modeTimerManager.switchMode('monitoring');
        window.dispatchEvent(new CustomEvent('stopCurrentMode'));
        window.dispatchEvent(new CustomEvent('startMonitoringMode'));
      },
      
      // AI 에이전트 토글
      toggleAIAgent: async () => {
        const { isAdminMode, isSystemStarted, aiAgent } = get();
        
        if (!isAdminMode) {
          throw new Error('관리자 모드가 필요합니다.');
        }
        
        if (!isSystemStarted) {
          throw new Error('시스템이 활성화되어 있을 때만 AI 에이전트를 사용할 수 있습니다.');
        }
        
        const newState = aiAgent.isActive ? 'disabled' : 'enabled';
        const newActive = !aiAgent.isActive;
        
        set({ 
          aiAgent: { 
            state: newActive ? 'processing' : 'disabled',
            isActive: newActive 
          }
        });
        
        try {
          // 실제 AI 에이전트 토글 로직 (시뮬레이션)
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          set({ 
            aiAgent: { 
              state: newState,
              isActive: newActive 
            }
          });
          
          console.log(`🤖 AI 에이전트 ${newActive ? '활성화' : '비활성화'}`);
        } catch (error) {
          set({ 
            aiAgent: { 
              state: 'disabled',
              isActive: false 
            }
          });
          throw error;
        }
      },
      
      // 로그아웃
      logout: () => {
        set({ 
          isAuthenticated: false, 
          isAdminMode: false,
          aiAgent: { state: 'disabled', isActive: false }
        });
        
        console.log('🔐 로그아웃 - 서버 모니터링 모드로 전환');
        
        // ModeTimerManager를 사용한 기본 모니터링으로 전환
        modeTimerManager.switchMode('monitoring');
        window.dispatchEvent(new CustomEvent('stopCurrentMode'));
        window.dispatchEvent(new CustomEvent('startMonitoringMode'));
      }
    }),
    {
      name: 'unified-admin-store',
      partialize: (state) => ({ 
        isAuthenticated: state.isAuthenticated,
        isAdminMode: state.isAdminMode,
        attempts: state.attempts,
        isLocked: state.isLocked,
        lockoutEndTime: state.lockoutEndTime,
        aiAgent: state.aiAgent
      })
    }
  )
); 