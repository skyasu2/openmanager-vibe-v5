import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { modeTimerManager } from '@/utils/ModeTimerManager';

interface SystemState {
  // 시스템 상태
  isSystemStarted: boolean;
  isAIAdminMode: boolean;
  
  // 인증 상태
  isAuthenticated: boolean;
  showPinModal: boolean;
  failedAttempts: number;
  isBlocked: boolean;
  blockUntil: number | null;
  
  // 액션 메소드
  startSystem: () => void;
  stopSystem: () => void;
  toggleAIAdminMode: () => void;
  showPinDialog: () => void;
  hidePinDialog: () => void;
  authenticate: (pin: string) => boolean;
  logout: () => void;
  resetFailedAttempts: () => void;
  checkBlockStatus: () => boolean;
}

export const useSystemStore = create<SystemState>()(
  persist(
    (set, get) => ({
      // 초기 상태
      isSystemStarted: false,
      isAIAdminMode: false,
      isAuthenticated: false,
      showPinModal: false,
      failedAttempts: 0,
      isBlocked: false,
      blockUntil: null,
      
      // 시스템 제어
      startSystem: () => {
        set({ isSystemStarted: true });
        console.log('🚀 시스템 시작됨 - 서버 모니터링 모드');
      },
      
      stopSystem: () => {
        set({ 
          isSystemStarted: false, 
          isAIAdminMode: false 
        });
        console.log('⏹️ 시스템 정지됨 - 모든 사용자에게 적용');
      },
      
      // AI 관리자 모드 토글
      toggleAIAdminMode: () => {
        const { isAuthenticated, isAIAdminMode, checkBlockStatus } = get();
        
        // 차단 상태 확인
        if (!checkBlockStatus()) {
          return;
        }
        
        if (!isAuthenticated) {
          // 인증되지 않은 경우 PIN 모달 표시
          set({ showPinModal: true });
          return;
        }
        
        // 모드 전환
        const newAIMode = !isAIAdminMode;
        set({ isAIAdminMode: newAIMode });
        
        if (newAIMode) {
          console.log('🤖 AI 관리자 모드 활성화 - 기존 모니터링 정지 후 AI 에이전트 시작');
          // ModeTimerManager를 사용한 모드 전환
          modeTimerManager.switchMode('ai');
          // 기존 CustomEvent도 유지 (호환성)
          window.dispatchEvent(new CustomEvent('stopCurrentMode'));
          window.dispatchEvent(new CustomEvent('startAIMode'));
        } else {
          console.log('📊 서버 모니터링 모드 - AI 에이전트 정지 후 기본 모니터링 시작');
          // ModeTimerManager를 사용한 모드 전환
          modeTimerManager.switchMode('monitoring');
          // 기존 CustomEvent도 유지 (호환성)
          window.dispatchEvent(new CustomEvent('stopCurrentMode'));
          window.dispatchEvent(new CustomEvent('startMonitoringMode'));
        }
      },
      
      // PIN 모달 제어
      showPinDialog: () => set({ showPinModal: true }),
      hidePinDialog: () => set({ showPinModal: false }),
      
      // 차단 상태 확인
      checkBlockStatus: () => {
        const { isBlocked, blockUntil } = get();
        
        if (isBlocked && blockUntil) {
          const now = Date.now();
          if (now < blockUntil) {
            // 아직 차단 시간
            return false;
          } else {
            // 차단 시간 만료
            set({ 
              isBlocked: false, 
              blockUntil: null, 
              failedAttempts: 0 
            });
            return true;
          }
        }
        
        return !isBlocked;
      },
      
      // PIN 인증
      authenticate: (pin: string) => {
        const { failedAttempts, checkBlockStatus } = get();
        
        // 차단 상태 확인
        if (!checkBlockStatus()) {
          return false;
        }
        
        if (pin === '4231') {
          set({ 
            isAuthenticated: true, 
            showPinModal: false,
            isAIAdminMode: true,
            failedAttempts: 0
          });
          console.log('✅ AI 관리자 인증 성공 - AI 에이전트 모드 활성화');
          
          // ModeTimerManager를 사용한 AI 모드 시작
          modeTimerManager.switchMode('ai');
          // 기존 CustomEvent도 유지 (호환성)
          window.dispatchEvent(new CustomEvent('stopCurrentMode'));
          window.dispatchEvent(new CustomEvent('startAIMode'));
          
          return true;
        } else {
          const newFailedAttempts = failedAttempts + 1;
          console.log(`❌ PIN 인증 실패 (${newFailedAttempts}/5)`);
          
          if (newFailedAttempts >= 5) {
            // 5회 실패 시 30초 차단 (UI에서는 30분이라고 표시)
            const blockUntil = Date.now() + (30 * 1000); // 30초
            set({ 
              failedAttempts: newFailedAttempts,
              isBlocked: true,
              blockUntil,
              showPinModal: false
            });
            console.log('🚫 5회 실패로 30초간 사용 차단 (UI에서는 30분으로 표시)');
          } else {
            set({ failedAttempts: newFailedAttempts });
          }
          
          return false;
        }
      },
      
      // 실패 횟수 리셋
      resetFailedAttempts: () => {
        set({ failedAttempts: 0 });
      },
      
      // 로그아웃
      logout: () => {
        set({ 
          isAuthenticated: false, 
          isAIAdminMode: false,
          showPinModal: false
        });
        console.log('🔐 AI 관리자 모드 로그아웃');
        
        // ModeTimerManager를 사용한 기본 모니터링으로 전환
        modeTimerManager.switchMode('monitoring');
        // 기존 CustomEvent도 유지 (호환성)
        window.dispatchEvent(new CustomEvent('stopCurrentMode'));
        window.dispatchEvent(new CustomEvent('startMonitoringMode'));
      }
    }),
    {
      name: 'system-store',
      partialize: (state) => ({ 
        isAuthenticated: state.isAuthenticated,
        isAIAdminMode: state.isAIAdminMode,
        failedAttempts: state.failedAttempts,
        isBlocked: state.isBlocked,
        blockUntil: state.blockUntil
      })
    }
  )
); 