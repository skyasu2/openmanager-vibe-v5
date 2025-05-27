import { useSystemStore } from '../stores/systemStore';
import { systemLogger } from '../lib/logger';

export const useSystemControl = () => {
  const {
    state,
    startSystem,
    stopSystem,
    pauseSystem,
    resumeSystem,
    aiAgent,
    enableAIAgent,
    disableAIAgent,
    getFormattedTime,
    updateActivity,
    shouldAutoStop,
    isPaused,
    pauseReason,
    userInitiated
  } = useSystemStore();

  /**
   * 🚀 시스템 전체 시작 (사용자 세션)
   * 사용자가 직접 시작하는 세션은 자동 종료되지 않음
   */
  const startFullSystem = async (): Promise<{
    success: boolean;
    message: string;
    errors: string[];
  }> => {
    const errors: string[] = [];
    let message = '';

    try {
      systemLogger.system('🚀 사용자 시스템 시작...');

      // 1단계: 시스템 타이머 시작 (사용자 세션 - 60분)
      startSystem(60 * 60, true); // 사용자 세션은 60분으로 시작
      
      // 2단계: 시뮬레이션 엔진 시작
      try {
        systemLogger.system('1️⃣ 시뮬레이션 엔진 시작...');
        const systemResponse = await fetch('/api/system/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        
        const systemData = await systemResponse.json();
        
        if (systemResponse.ok) {
          systemLogger.system(`✅ 시뮬레이션 엔진 시작: ${systemData.message}`);
        } else if (systemResponse.status === 400 && systemData.message?.includes('이미 실행 중')) {
          // 이미 실행 중인 경우는 정상적인 상황으로 처리
          systemLogger.system(`ℹ️ 시뮬레이션 엔진 이미 실행 중: ${systemData.message}`);
        } else {
          // 시뮬레이션 엔진 시작 실패는 경고로 처리 (시스템은 계속 동작)
          const errorMsg = `시뮬레이션 엔진 시작 실패: ${systemData.message || '알 수 없는 오류'}`;
          errors.push(errorMsg);
          systemLogger.warn(errorMsg);
        }
      } catch (error) {
        const errorMsg = '시뮬레이션 엔진 시작 실패';
        errors.push(errorMsg);
        systemLogger.warn(errorMsg, error);
      }

      // 3단계: AI 에이전트 활성화 (선택적)
      try {
        systemLogger.system('2️⃣ AI 에이전트 활성화...');
        await enableAIAgent();
        systemLogger.system('✅ AI 에이전트 활성화 완료');
      } catch (error) {
        const errorMsg = 'AI 에이전트 활성화 실패';
        errors.push(errorMsg);
        systemLogger.warn(errorMsg, error);
      }

      // 결과 처리
      if (errors.length === 0) {
        message = '🎉 시스템이 성공적으로 시작되었습니다!';
        systemLogger.system(message);
        return { success: true, message, errors };
      } else {
        message = `⚠️ 시스템이 부분적으로 시작되었습니다. (${errors.length}개 경고)`;
        systemLogger.warn(message);
        return { success: true, message, errors }; // 부분 실패도 success: true
      }

    } catch (error) {
      const errorMsg = '시스템 시작 중 치명적 오류 발생';
      systemLogger.error(errorMsg, error);
      
      // 치명적 오류 시 시스템 중지
      stopSystem('시작 실패');
      
      return {
        success: false,
        message: errorMsg,
        errors: [error instanceof Error ? error.message : '알 수 없는 오류']
      };
    }
  };

  /**
   * 🛑 시스템 전체 중지
   * 모든 서비스를 순차적으로 중지하고 리소스 정리
   */
  const stopFullSystem = async (): Promise<{
    success: boolean;
    message: string;
    errors: string[];
  }> => {
    const errors: string[] = [];
    
    try {
      systemLogger.system('🛑 시스템 중지 시작...');

      // 1단계: AI 에이전트 비활성화
      try {
        systemLogger.system('1️⃣ AI 에이전트 비활성화...');
        await disableAIAgent();
        systemLogger.system('✅ AI 에이전트 비활성화 완료');
      } catch (error) {
        const errorMsg = 'AI 에이전트 비활성화 실패';
        errors.push(errorMsg);
        systemLogger.warn(errorMsg, error);
      }

      // 2단계: 시뮬레이션 엔진 중지
      try {
        systemLogger.system('2️⃣ 시뮬레이션 엔진 중지...');
        const systemResponse = await fetch('/api/system/stop', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        
        const systemData = await systemResponse.json();
        
        if (systemResponse.ok) {
          systemLogger.system(`✅ 시뮬레이션 엔진 중지: ${systemData.message}`);
        } else if (systemResponse.status === 400) {
          // 400 에러는 이미 중지된 상태로 간주하고 정상 처리
          if (systemData.message?.includes('실행 중이 아닙니다') || 
              systemData.message?.includes('실행되지 않')) {
            systemLogger.system(`ℹ️ 시뮬레이션 엔진 이미 중지됨: ${systemData.message}`);
          } else {
            systemLogger.warn(`⚠️ 시뮬레이션 엔진 중지 경고: ${systemData.message}`);
            errors.push(`시뮬레이션 엔진: ${systemData.message}`);
          }
        } else {
          const errorMsg = `시뮬레이션 엔진 중지 실패: ${systemData.message || '알 수 없는 오류'}`;
          errors.push(errorMsg);
          systemLogger.warn(errorMsg);
        }
      } catch (error) {
        if (error instanceof TypeError && error.message.includes('fetch')) {
          // 네트워크 오류는 시스템이 이미 중지된 것으로 간주
          systemLogger.system('ℹ️ 시뮬레이션 엔진 API 접근 불가 (이미 중지된 것으로 추정)');
        } else {
          const errorMsg = '시뮬레이션 엔진 중지 실패';
          errors.push(errorMsg);
          systemLogger.warn(errorMsg, error);
        }
      }

      // 3단계: 시스템 타이머 중지
      stopSystem('사용자 요청');
      systemLogger.system('✅ 시스템 타이머 중지 완료');

      // 결과 처리
      if (errors.length === 0) {
        const message = '🎉 시스템이 성공적으로 중지되었습니다!';
        systemLogger.system(message);
        return { success: true, message, errors };
      } else {
        const message = `⚠️ 시스템이 부분적으로 중지되었습니다. (${errors.length}개 경고)`;
        systemLogger.warn(message);
        return { success: true, message, errors }; // 부분 실패도 success: true로 처리
      }

    } catch (error) {
      const errorMsg = '시스템 중지 중 치명적 오류 발생';
      systemLogger.error(errorMsg, error);
      
      // 치명적 오류가 발생해도 타이머는 중지
      stopSystem('중지 실패');
      
      return {
        success: false,
        message: errorMsg,
        errors: [error instanceof Error ? error.message : '알 수 없는 오류']
      };
    }
  };

  /**
   * ⏸️ 시스템 일시정지
   */
  const pauseFullSystem = async (reason: string = '사용자 요청'): Promise<{
    success: boolean;
    message: string;
  }> => {
    try {
      pauseSystem(reason);
      const message = `⏸️ 시스템이 일시정지되었습니다: ${reason}`;
      systemLogger.system(message);
      return { success: true, message };
    } catch (error) {
      const errorMsg = '시스템 일시정지 실패';
      systemLogger.error(errorMsg, error);
      return { success: false, message: errorMsg };
    }
  };

  /**
   * ▶️ 시스템 재개
   */
  const resumeFullSystem = async (): Promise<{
    success: boolean;
    message: string;
  }> => {
    try {
      resumeSystem();
      const message = '▶️ 시스템이 재개되었습니다';
      systemLogger.system(message);
      return { success: true, message };
    } catch (error) {
      const errorMsg = '시스템 재개 실패';
      systemLogger.error(errorMsg, error);
      return { success: false, message: errorMsg };
    }
  };

  /**
   * 🔄 시스템 재시작
   */
  const restartSystem = async (): Promise<{
    success: boolean;
    message: string;
    errors: string[];
  }> => {
    systemLogger.system('🔄 시스템 재시작...');
    
    // 중지 후 시작
    const stopResult = await stopFullSystem();
    
    // 3초 대기 후 시작
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const startResult = await startFullSystem();
    
    return {
      success: stopResult.success && startResult.success,
      message: `🔄 재시작 완료: ${startResult.message}`,
      errors: [...stopResult.errors, ...startResult.errors]
    };
  };

  /**
   * 🤖 AI 트리거 시스템 시작 (자동 세션)
   */
  const startAISession = async (reason: string): Promise<{
    success: boolean;
    message: string;
  }> => {
    try {
      // AI 세션은 20분으로 시작하고 자동 종료됨
      startSystem(20 * 60, false);
      
      // AI 에이전트 활성화
      await enableAIAgent();
      
      const message = `🤖 AI 세션 시작: ${reason}`;
      systemLogger.ai(message);
      return { success: true, message };
    } catch (error) {
      const errorMsg = 'AI 세션 시작 실패';
      systemLogger.error(errorMsg, error);
      return { success: false, message: errorMsg };
    }
  };

  /**
   * 📊 사용자 활동 업데이트
   */
  const recordActivity = () => {
    updateActivity();
  };

  return {
    // 상태
    state,
    isSystemActive: state === 'active',
    isSystemPaused: state === 'paused',
    formattedTime: getFormattedTime(),
    aiAgent,
    isPaused,
    pauseReason,
    isUserSession: userInitiated,
    shouldAutoStop: shouldAutoStop(),
    
    // 액션
    startFullSystem,
    stopFullSystem,
    pauseFullSystem,
    resumeFullSystem,
    restartSystem,
    startAISession,
    recordActivity,
    enableAIAgent,
    disableAIAgent
  };
}; 