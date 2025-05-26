import { useSystemStore } from '../stores/systemStore';
import { systemLogger } from '../lib/logger';

export const useSystemControl = () => {
  const {
    state,
    startSystem,
    stopSystem,
    aiAgent,
    enableAIAgent,
    disableAIAgent,
    getFormattedTime
  } = useSystemStore();

  /**
   * 🚀 시스템 전체 시작
   * 1. 서버 시딩 → 2. 시뮬레이션 → 3. 데이터 생성 → 4. AI 에이전트 활성화
   */
  const startFullSystem = async (): Promise<{
    success: boolean;
    message: string;
    errors: string[];
  }> => {
    const errors: string[] = [];
    let message = '';

    try {
      systemLogger.system('🚀 통합 시스템 시작...');

      // 1단계: 시스템 타이머 시작 (20분)
      startSystem(20 * 60);
      
      // 2단계: 시뮬레이션 엔진 시작 (통합 시스템)
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
          throw new Error(`시뮬레이션 엔진 시작 실패: ${systemData.message || '알 수 없는 오류'}`);
        }
      } catch (error) {
        const errorMsg = '시뮬레이션 엔진 시작 실패';
        errors.push(errorMsg);
        systemLogger.error(errorMsg, error);
      }

      // 3단계: AI 에이전트 활성화
      try {
        systemLogger.system('4️⃣ AI 에이전트 활성화...');
        await enableAIAgent();
        systemLogger.system('✅ AI 에이전트 활성화 완료');
      } catch (error) {
        const errorMsg = 'AI 에이전트 활성화 실패';
        errors.push(errorMsg);
        systemLogger.error(errorMsg, error);
      }

      if (errors.length === 0) {
        message = '🎉 시스템 전체 시작 완료! 모든 서비스가 정상 동작 중입니다.';
        systemLogger.system('🎉 통합 시스템 시작 완료');
        return { success: true, message, errors };
      } else {
        message = `⚠️ 시스템 시작 완료 (${errors.length}개 오류 발생)`;
        systemLogger.warn(`시스템 시작 시 ${errors.length}개 오류 발생`);
        return { success: false, message, errors };
      }

    } catch (error) {
      const errorMsg = '시스템 시작 중 치명적 오류 발생';
      systemLogger.error(errorMsg, error);
      
      // 실패 시 시스템 중지
      stopSystem();
      
      return { 
        success: false, 
        message: errorMsg, 
        errors: [errorMsg, ...errors] 
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
      systemLogger.system('🛑 통합 시스템 중지...');

      // 1단계: AI 에이전트 비활성화
      try {
        systemLogger.system('1️⃣ AI 에이전트 비활성화...');
        await disableAIAgent();
        systemLogger.system('✅ AI 에이전트 비활성화 완료');
      } catch (error) {
        const errorMsg = 'AI 에이전트 비활성화 실패';
        errors.push(errorMsg);
        systemLogger.error(errorMsg, error);
      }

      // 2단계: 시뮬레이션 엔진 중지 (통합 시스템)
      try {
        systemLogger.system('2️⃣ 시뮬레이션 엔진 중지...');
        const systemResponse = await fetch('/api/system/stop', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        
        const systemData = await systemResponse.json();
        
        if (systemResponse.ok) {
          systemLogger.system(`✅ 시뮬레이션 엔진 중지: ${systemData.message}`);
        } else if (systemResponse.status === 400 && systemData.message?.includes('실행되지 않')) {
          // 이미 중지된 경우는 정상적인 상황으로 처리
          systemLogger.system(`ℹ️ 시뮬레이션 엔진 이미 중지됨: ${systemData.message}`);
        } else {
          throw new Error(`시뮬레이션 엔진 중지 실패: ${systemData.message || '알 수 없는 오류'}`);
        }
      } catch (error) {
        const errorMsg = '시뮬레이션 엔진 중지 실패';
        errors.push(errorMsg);
        systemLogger.error(errorMsg, error);
      }

      // 4단계: 시스템 타이머 중지
      stopSystem();
      systemLogger.system('✅ 시스템 타이머 중지 완료');

      const message = errors.length === 0 
        ? '🔴 시스템 전체 중지 완료' 
        : `🔴 시스템 중지 완료 (${errors.length}개 경고)`;
        
      systemLogger.system('🔴 통합 시스템 중지 완료');
      
      return { 
        success: errors.length === 0, 
        message, 
        errors 
      };

    } catch (error) {
      const errorMsg = '시스템 중지 중 치명적 오류 발생';
      systemLogger.error(errorMsg, error);
      
      // 강제 중지
      stopSystem();
      
      return { 
        success: false, 
        message: errorMsg, 
        errors: [errorMsg, ...errors] 
      };
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

  return {
    // 상태
    systemState: state,
    aiAgentState: aiAgent,
    isSystemActive: state === 'active',
    isAIEnabled: aiAgent.isEnabled,
    formattedTime: getFormattedTime(),
    
    // 액션
    startFullSystem,
    stopFullSystem,
    restartSystem,
    
    // 개별 제어 (필요시)
    startSystemOnly: () => startSystem(20 * 60),
    stopSystemOnly: stopSystem,
    enableAIOnly: enableAIAgent,
    disableAIOnly: disableAIAgent
  };
}; 