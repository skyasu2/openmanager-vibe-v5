import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { modeTimerManager } from '@/utils/ModeTimerManager';

const ADMIN_PASSWORD = '4231';
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 10000; // 10초 (UI에서는 10분이라고 표시)

interface UnifiedAdminState {
  // 시스템 상태
  isSystemStarted: boolean;
  
  // AI 에이전트 통합 상태 (관리자 모드와 통합)
  aiAgent: {
    isEnabled: boolean;        // AI 에이전트 활성화 여부 (관리자 모드와 동일)
    isAuthenticated: boolean;  // 인증 상태
    state: 'disabled' | 'enabled' | 'processing' | 'idle';
  };
  
  // 인증 및 보안
  attempts: number;
  isLocked: boolean;
  lockoutEndTime: number | null;
  
  // 액션 메소드
  startSystem: () => void;
  stopSystem: () => void;
  authenticateAIAgent: (password: string) => { success: boolean; message: string; remainingTime?: number };
  disableAIAgent: () => void;
  toggleAIProcessing: () => Promise<void>;
  checkLockStatus: () => boolean;
  getRemainingLockTime: () => number;
  logout: () => void;
}

export const useUnifiedAdminStore = create<UnifiedAdminState>()(
  persist(
    (set, get) => ({
      // 초기 상태 - AI 기능 기본 오프
      isSystemStarted: false,
      aiAgent: {
        isEnabled: false,
        isAuthenticated: false,
        state: 'disabled'
      },
      attempts: 0,
      isLocked: false,
      lockoutEndTime: null,
      
      // 시스템 제어
      startSystem: () => {
        set({ isSystemStarted: true });
        console.log('🚀 시스템 시작됨 - 기본 모니터링 모드');
      },
      
      stopSystem: () => {
        set({ 
          isSystemStarted: false,
          aiAgent: { isEnabled: false, isAuthenticated: false, state: 'disabled' }
        });
        console.log('⏹️ 시스템 정지됨 - 모든 기능 비활성화');
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
      
      // AI 에이전트 인증 (관리자 모드 통합)
      authenticateAIAgent: (password: string) => {
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
            aiAgent: {
              isEnabled: true,
              isAuthenticated: true,
              state: 'enabled'
            },
            attempts: 0
          });
          
          console.log('✅ AI 에이전트 모드 활성화 - 지능형 분석 시작');
          
          // ModeTimerManager를 사용한 AI 모드 시작
          modeTimerManager.switchMode('ai');
          window.dispatchEvent(new CustomEvent('stopCurrentMode'));
          window.dispatchEvent(new CustomEvent('startAIMode'));
          
          return { 
            success: true, 
            message: 'AI 에이전트 모드가 활성화되었습니다. 지능형 분석을 시작합니다.' 
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
      
      // AI 에이전트 비활성화
      disableAIAgent: () => {
        set({ 
          aiAgent: {
            isEnabled: false,
            isAuthenticated: false,
            state: 'disabled'
          }
        });
        
        console.log('🔐 AI 에이전트 모드 종료 - 기본 모니터링 모드로 전환');
        
        // ModeTimerManager를 사용한 기본 모니터링으로 전환
        modeTimerManager.switchMode('monitoring');
        window.dispatchEvent(new CustomEvent('stopCurrentMode'));
        window.dispatchEvent(new CustomEvent('startMonitoringMode'));
      },
      
      // AI 처리 토글 (더 이상 사용하지 않음)
      toggleAIProcessing: async () => {
        const { aiAgent } = get();
        
        if (!aiAgent.isEnabled || !aiAgent.isAuthenticated) {
          throw new Error('AI 에이전트 모드가 필요합니다.');
        }
        
        // 간단한 상태 토글만 수행
        const newState = aiAgent.state === 'processing' ? 'enabled' : 'processing';
        
        set({ 
          aiAgent: { 
            ...aiAgent,
            state: newState
          }
        });
      },
      
      // 로그아웃
      logout: () => {
        set({ 
          aiAgent: {
            isEnabled: false,
            isAuthenticated: false,
            state: 'disabled'
          }
        });
        
        console.log('🔐 로그아웃 - 기본 모니터링 모드로 전환');
        
        // ModeTimerManager를 사용한 기본 모니터링으로 전환
        modeTimerManager.switchMode('monitoring');
        window.dispatchEvent(new CustomEvent('stopCurrentMode'));
        window.dispatchEvent(new CustomEvent('startMonitoringMode'));
      }
    }),
    {
      name: 'unified-admin-store',
      partialize: (state) => ({ 
        aiAgent: state.aiAgent,
        attempts: state.attempts,
        isLocked: state.isLocked,
        lockoutEndTime: state.lockoutEndTime
      })
    }
  )
); 