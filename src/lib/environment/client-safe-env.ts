/**
 * 🌐 클라이언트 안전 환경변수 프록시
 *
 * 이 파일은 클라이언트와 서버 모두에서 안전하게 import할 수 있습니다.
 * 서버 전용 기능은 동적 import로 처리하여 클라이언트 번들에 포함되지 않습니다.
 */

// 클라이언트/서버 공통 타입 정의
export interface EnvValidationResult {
  valid: boolean;
  missing: string[];
}

export interface EnvBackupResult {
  success: boolean;
  backupId?: string;
  message: string;
}

export interface EnvRestoreResult {
  success: boolean;
  restored: Record<string, string>;
  message: string;
}

/**
 * 🔧 환경변수 관리 프록시 클래스
 * 클라이언트에서는 더미 동작, 서버에서는 실제 기능 제공
 */
export class EnvironmentManagerProxy {
  private static instance: EnvironmentManagerProxy;

  static getInstance(): EnvironmentManagerProxy {
    if (!EnvironmentManagerProxy.instance) {
      EnvironmentManagerProxy.instance = new EnvironmentManagerProxy();
    }
    return EnvironmentManagerProxy.instance;
  }

  /**
   * 📦 환경변수 백업 (서버 전용)
   */
  async backupEnvironment(environment = 'current'): Promise<EnvBackupResult> {
    // 클라이언트 사이드 체크
    if (typeof window !== 'undefined') {
      console.log('🌐 클라이언트 사이드 - 환경변수 백업 건너뜀');
      return {
        success: false,
        message: '클라이언트에서는 환경변수 백업을 할 수 없습니다.',
      };
    }

    try {
      // 서버에서만 동적 import
      const { serverEnvManager } = await import('./server-only-env');
      const backupId = await serverEnvManager.backupEnvironment(environment);

      return {
        success: !!backupId,
        backupId: backupId || undefined,
        message: backupId ? `백업 완료: ${backupId}` : '백업 실패',
      };
    } catch (error) {
      console.error('❌ 환경변수 백업 실패:', error);
      return {
        success: false,
        message: `백업 실패: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * 🔄 환경변수 복구 (서버 전용)
   */
  async restoreEnvironment(backupId: string): Promise<EnvRestoreResult> {
    // 클라이언트 사이드 체크
    if (typeof window !== 'undefined') {
      console.log('🌐 클라이언트 사이드 - 환경변수 복구 건너뜀');
      return {
        success: false,
        restored: {},
        message: '클라이언트에서는 환경변수 복구를 할 수 없습니다.',
      };
    }

    try {
      // 서버에서만 동적 import
      const { serverEnvManager } = await import('./server-only-env');
      const restored = await serverEnvManager.restoreEnvironment(backupId);

      return {
        success: !!restored,
        restored: restored || {},
        message: restored
          ? `복구 완료: ${Object.keys(restored).length}개 변수`
          : '복구 실패',
      };
    } catch (error) {
      console.error('❌ 환경변수 복구 실패:', error);
      return {
        success: false,
        restored: {},
        message: `복구 실패: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * 🔍 환경변수 검증 (서버 전용)
   */
  async validateEnvironment(): Promise<EnvValidationResult> {
    // 클라이언트 사이드 체크
    if (typeof window !== 'undefined') {
      console.log('🌐 클라이언트 사이드 - 환경변수 검증 건너뜀');
      return {
        valid: true,
        missing: [],
      };
    }

    try {
      // 서버에서만 동적 import
      const { serverEnvManager } = await import('./server-only-env');
      return serverEnvManager.validateEnvironment();
    } catch (error) {
      console.error('❌ 환경변수 검증 실패:', error);
      return {
        valid: false,
        missing: ['검증 실패'],
      };
    }
  }

  /**
   * 🔧 환경변수 자동 복구 시스템 (서버 전용)
   */
  async autoRecovery(missingVars: string[]): Promise<EnvRestoreResult> {
    // 클라이언트 사이드 체크
    if (typeof window !== 'undefined') {
      return {
        success: false,
        restored: {},
        message: '클라이언트에서는 자동 복구를 할 수 없습니다.',
      };
    }

    try {
      console.log('🔧 환경변수 자동 복구 시작...', missingVars);

      // 기본값 설정 (하드코딩된 안전한 값들)
      const defaultValues: Record<string, string> = {
        AI_ENGINE_MODE: 'AUTO',
        SUPABASE_RAG_ENABLED: 'true',
        KOREAN_NLP_ENABLED: 'true',
        REDIS_CONNECTION_DISABLED: 'false',
        FORCE_MOCK_REDIS: 'false',

        // 🛡️ 베르셀 시스템 관련 기본값 추가
        VERCEL: 'false', // 개발환경에서는 false
        NODE_ENV: process.env.NODE_ENV || 'development',

        // 🛡️ Google AI 관련 기본값
        GOOGLE_AI_ENABLED: 'false', // 기본적으로 비활성화
        GOOGLE_AI_QUOTA_PROTECTION: 'true',

        // 🛡️ 기타 시스템 관련 기본값
        DISABLE_AUTO_BACKUP: 'true', // 개발환경에서는 백업 비활성화
        DISABLE_HEALTH_CHECK: 'false',
        HEALTH_CHECK_CONTEXT: 'true',

        // 🛡️ 데이터베이스 관련 기본값
        DATABASE_CONNECTION_POOLING: 'true',
        CACHE_ENABLED: 'true',
      };

      const restored: Record<string, string> = {};
      let restoredCount = 0;

      for (const varName of missingVars) {
        if (defaultValues[varName]) {
          process.env[varName] = defaultValues[varName];
          restored[varName] = defaultValues[varName];
          restoredCount++;
          console.log(`✅ ${varName}: 기본값으로 복구됨`);
        }
      }

      return {
        success: restoredCount > 0,
        restored,
        message: `자동 복구 완료: ${restoredCount}개 변수`,
      };
    } catch (error) {
      console.error('❌ 환경변수 자동 복구 실패:', error);
      return {
        success: false,
        restored: {},
        message: `자동 복구 실패: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }
}

/**
 * 🔧 환경변수 관리 프록시 인스턴스 (클라이언트/서버 공통)
 */
export const envManagerProxy = EnvironmentManagerProxy.getInstance();
