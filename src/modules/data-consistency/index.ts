/**
 * 🎯 데이터 일관성 모듈 v1.0 - 진입점
 * 
 * 프론트엔드-백엔드 간 데이터 불일치 문제를 원천적으로 해결하는
 * 중앙집중식 데이터 일관성 관리 시스템
 */

// 🎯 핵심 관리자
export {
  DataConsistencyManager,
  dataConsistencyManager, getCacheSettings,
  getSafeHealthCheckConfig, getServerSettings, validateConsistency, type DataConsistencyConfig
} from './DataConsistencyManager';

// 🔍 검증 시스템
export {
  DataConsistencyValidator,
  dataConsistencyValidator, getValidationHistory,
  getValidationStats, quickValidation, validateDataConsistency, type AutoRecoveryResult, type ValidationIssue,
  type ValidationMetrics, type ValidationResult
} from './DataConsistencyValidator';

/**
 * 🚀 통합 초기화 함수
 */
export async function initializeDataConsistency(options?: {
  enableAutoRecovery?: boolean;
  enableValidation?: boolean;
  logLevel?: 'none' | 'basic' | 'detailed';
}) {
  const {
    enableAutoRecovery = true,
    enableValidation = true,
    logLevel = 'basic'
  } = options || {};

  console.log('🎯 데이터 일관성 시스템 초기화 시작...');

  try {
    // 1. 관리자 초기화
    const { dataConsistencyManager } = await import('./DataConsistencyManager');
    const manager = dataConsistencyManager;

    // 2. 설정 업데이트
    if (!enableAutoRecovery) {
      manager.updateConfig({
        autoRecovery: { enabled: false, maxAttempts: 0, backoffDelay: 0 }
      });
    }

    // 3. 초기 검증 실행
    if (enableValidation) {
      const { dataConsistencyValidator } = await import('./DataConsistencyValidator');
      const validator = dataConsistencyValidator;
      const result = await validator.validateComprehensive('initialization');

      if (logLevel !== 'none') {
        console.log(`🔍 초기 검증 결과: ${result.isValid ? '✅ 통과' : '⚠️ 문제 발견'}`);

        if (logLevel === 'detailed' && result.issues.length > 0) {
          console.log('📋 발견된 문제들:');
          result.issues.forEach((issue, index) => {
            console.log(`  ${index + 1}. [${issue.severity}] ${issue.description}`);
          });
        }
      }
    }

    console.log('✅ 데이터 일관성 시스템 초기화 완료');
    return true;

  } catch (error) {
    console.error('❌ 데이터 일관성 시스템 초기화 실패:', error);
    return false;
  }
}

/**
 * 📊 시스템 상태 조회
 */
export async function getDataConsistencyStatus() {
  try {
    const { dataConsistencyManager } = await import('./DataConsistencyManager');
    const { dataConsistencyValidator } = await import('./DataConsistencyValidator');

    const manager = dataConsistencyManager;
    const validator = dataConsistencyValidator;

    return {
      manager: {
        statistics: manager.getStatistics(),
        serverConfig: manager.getServerConfig(),
        cacheConfig: manager.getCacheConfig(),
        validationConfig: manager.getValidationConfig(),
        autoRecoveryConfig: manager.getAutoRecoveryConfig(),
      },
      validator: {
        statistics: validator.getValidationStatistics(),
        recentHistory: validator.getValidationHistory(5),
      },
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('❌ 데이터 일관성 상태 조회 실패:', error);
    return null;
  }
}

/**
 * 🛠️ 개발자 도구 함수들
 */
export const DataConsistencyDevTools = {
  /**
   * 🔧 강제 검증 실행
   */
  async forceValidation(context: string = 'manual') {
    const { validateDataConsistency } = await import('./DataConsistencyValidator');
    return await validateDataConsistency(context);
  },

  /**
   * 🔄 설정 리셋
   */
  resetConfiguration() {
    console.log('🔄 데이터 일관성 설정 리셋');
    return true;
  },

  /**
   * 📋 전체 상태 덤프
   */
  async dumpFullState() {
    return {
      status: await getDataConsistencyStatus(),
      environment: {
        nodeEnv: process.env.NODE_ENV,
        timestamp: new Date().toISOString(),
      },
    };
  },

  /**
   * 🧪 테스트 시나리오 실행
   */
  async runTestScenario(scenario: 'pagination_mismatch' | 'api_limit_mismatch' | 'cache_issues') {
    try {
      const { dataConsistencyManager } = await import('./DataConsistencyManager');
      const { validateDataConsistency } = await import('./DataConsistencyValidator');

      const manager = dataConsistencyManager;
      const originalConfig = manager.getServerConfig();

      console.log(`🧪 테스트 시나리오 실행: ${scenario}`);

      switch (scenario) {
        case 'pagination_mismatch':
          manager.updateConfig({
            servers: { ...originalConfig, itemsPerPage: 8 } // 의도적 불일치
          });
          break;

        case 'api_limit_mismatch':
          manager.updateConfig({
            servers: { ...originalConfig, apiDefaultLimit: 10 } // 의도적 불일치
          });
          break;

        case 'cache_issues':
          const cacheConfig = manager.getCacheConfig();
          manager.updateConfig({
            cache: { ...cacheConfig, healthCheckInterval: 30000 } // 너무 짧은 간격
          });
          break;
      }

      // 검증 실행
      const result = await validateDataConsistency(`test_${scenario}`);

      // 설정 복원
      manager.updateConfig({ servers: originalConfig });

      return result;

    } catch (error) {
      console.error(`❌ 테스트 시나리오 실행 실패 (${scenario}):`, error);
      throw error;
    }
  },
};

// 🚀 자동 초기화 (개발 환경에서만)
if (typeof window === 'undefined' && process.env.NODE_ENV === 'development') {
  // 서버 사이드에서만 자동 초기화
  initializeDataConsistency({
    enableAutoRecovery: true,
    enableValidation: true,
    logLevel: 'basic',
  }).catch(error => {
    console.warn('⚠️ 데이터 일관성 자동 초기화 실패:', error);
  });
}
