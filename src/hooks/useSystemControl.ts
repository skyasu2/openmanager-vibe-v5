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
      
      // 2단계: Enterprise 서버 데이터 시딩
      try {
        systemLogger.system('1️⃣ 서버 데이터 시딩 시작...');
        const seedResponse = await fetch('/api/enterprise/seed', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (seedResponse.ok) {
          const seedData = await seedResponse.json();
          systemLogger.system(`✅ 서버 데이터 시딩 완료: ${seedData.message}`);
        } else {
          throw new Error('서버 데이터 시딩 실패');
        }
      } catch (error) {
        const errorMsg = '서버 데이터 시딩 실패';
        errors.push(errorMsg);
        systemLogger.error(errorMsg, error);
      }

      // 3단계: 시뮬레이션 시작
      try {
        systemLogger.system('2️⃣ 시뮬레이션 시작...');
        const simResponse = await fetch('/api/simulate', {
          method: 'POST'
        });
        
        if (simResponse.ok) {
          const simData = await simResponse.json();
          systemLogger.system(`✅ 시뮬레이션 시작: ${simData.message}`);
        } else {
          throw new Error('시뮬레이션 시작 실패');
        }
      } catch (error) {
        const errorMsg = '시뮬레이션 시작 실패';
        errors.push(errorMsg);
        systemLogger.error(errorMsg, error);
      }

      // 4단계: 데이터 생성기 시작
      try {
        systemLogger.system('3️⃣ 데이터 생성기 시작...');
        const genResponse = await fetch('/api/data-generator', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            action: 'start-realtime',
            pattern: 'normal'
          })
        });
        
        if (genResponse.ok) {
          const genData = await genResponse.json();
          systemLogger.system(`✅ 데이터 생성기 시작: ${genData.message}`);
        } else {
          throw new Error('데이터 생성기 시작 실패');
        }
      } catch (error) {
        const errorMsg = '데이터 생성기 시작 실패';
        errors.push(errorMsg);
        systemLogger.error(errorMsg, error);
      }

      // 5단계: AI 에이전트 활성화
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

      // 2단계: 데이터 생성기 중지
      try {
        systemLogger.system('2️⃣ 데이터 생성기 중지...');
        const genResponse = await fetch('/api/data-generator', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'stop-realtime' })
        });
        
        if (genResponse.ok) {
          systemLogger.system('✅ 데이터 생성기 중지 완료');
        } else {
          throw new Error('데이터 생성기 중지 실패');
        }
      } catch (error) {
        const errorMsg = '데이터 생성기 중지 실패';
        errors.push(errorMsg);
        systemLogger.error(errorMsg, error);
      }

      // 3단계: 시뮬레이션 중지
      try {
        systemLogger.system('3️⃣ 시뮬레이션 중지...');
        const simResponse = await fetch('/api/simulate', {
          method: 'DELETE'
        });
        
        if (simResponse.ok) {
          systemLogger.system('✅ 시뮬레이션 중지 완료');
        } else {
          // 시뮬레이션 중지 API가 없을 수 있으므로 오류로 처리하지 않음
          systemLogger.warn('시뮬레이션 중지 API 호출 실패 (무시됨)');
        }
      } catch (error) {
        systemLogger.warn('시뮬레이션 중지 실패 (무시됨)', error);
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