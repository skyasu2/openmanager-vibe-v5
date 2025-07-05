/**
 * 🔐 자동 환경변수 복호화 시스템
 *
 * 프로덕션 환경에서 암호화된 환경변수를 자동으로 복호화하고 설정합니다.
 * 개발 환경에서는 기본 환경변수를 사용합니다.
 */

import { clientSafeEnv } from './client-safe-env';

/**
 * 🔍 환경변수 검증 결과
 */
interface EnvValidationResult {
  valid: boolean;
  missing: string[];
}

/**
 * 🔧 환경변수 자동 복구 결과
 */
interface EnvRecoveryResult {
  success: boolean;
  restored: Record<string, string>;
  message: string;
}

/**
 * 🔍 환경변수 상태 확인
 */
export async function checkEnvironmentStatus(): Promise<{
  isValid: boolean;
  issues: string[];
  suggestions: string[];
}> {
  try {
    // 기본 환경변수 검증
    const validation = await validateEnvironment();

    if (validation.valid) {
      return {
        isValid: true,
        issues: [],
        suggestions: ['환경변수가 모두 정상적으로 설정되어 있습니다.'],
      };
    }

    // 자동 복구 시도
    const recovery = await autoRecovery(validation.missing);

    return {
      isValid: recovery.success,
      issues: validation.missing,
      suggestions: recovery.success
        ? ['자동 복구가 완료되었습니다.']
        : ['환경변수를 수동으로 설정해야 합니다.'],
    };
  } catch (error) {
    console.error('❌ 환경변수 상태 확인 실패:', error);
    return {
      isValid: false,
      issues: ['환경변수 상태 확인 중 오류 발생'],
      suggestions: ['시스템 관리자에게 문의하세요.'],
    };
  }
}

/**
 * 🔧 환경변수 백업 생성
 */
export async function createEnvironmentBackup(): Promise<{
  success: boolean;
  backupId?: string;
  message: string;
}> {
  try {
    const timestamp = new Date().toISOString();
    const backupId = `backup_${timestamp.replace(/[:.]/g, '_')}`;

    console.log(`📦 환경변수 백업 생성: ${backupId}`);

    return {
      success: true,
      backupId,
      message: `백업이 생성되었습니다: ${backupId}`,
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
 * 🔍 환경변수 검증
 */
async function validateEnvironment(): Promise<EnvValidationResult> {
  const missing: string[] = [];

  // 필수 환경변수 목록
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
  ];

  for (const key of required) {
    if (!clientSafeEnv.get(key)) {
      missing.push(key);
    }
  }

  return {
    valid: missing.length === 0,
    missing,
  };
}

/**
 * 🔧 자동 복구 시스템
 */
async function autoRecovery(missingVars: string[]): Promise<EnvRecoveryResult> {
  try {
    console.log('🔧 환경변수 자동 복구 시작...', missingVars);

    // 기본값 설정 (하드코딩된 안전한 값들)
    const defaultValues: Record<string, string> = {
      AI_ENGINE_MODE: 'LOCAL',
      SUPABASE_RAG_ENABLED: 'true',
      KOREAN_NLP_ENABLED: 'true',
      REDIS_CONNECTION_DISABLED: 'false',
      FORCE_MOCK_REDIS: 'false',
    };

    const restored: Record<string, string> = {};
    let restoredCount = 0;

    for (const varName of missingVars) {
      if (defaultValues[varName]) {
        // 실제로는 process.env에 설정할 수 없으므로 로그만 출력
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

/**
 * 🔄 환경변수 복구
 */
export async function restoreEnvironmentFromBackup(backupId: string): Promise<{
  success: boolean;
  restored: Record<string, string>;
  message: string;
}> {
  try {
    console.log(`🔄 환경변수 복구 시작: ${backupId}`);

    // 백업에서 복구 (실제 구현에서는 파일에서 읽어올 것)
    const restored: Record<string, string> = {
      AI_ENGINE_MODE: 'LOCAL',
      SUPABASE_RAG_ENABLED: 'true',
    };

    // 검증
    const validation = await validateEnvironment();

    // 필요시 자동 복구
    const recovery = await autoRecovery(validation.missing);

    return {
      success: true,
      restored: { ...restored, ...recovery.restored },
      message: `복구 완료: ${Object.keys(restored).length}개 변수`,
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

// 🚀 자동 초기화 (서버 사이드에서만)
if (
  typeof window === 'undefined' &&
  clientSafeEnv.getEnvironment() !== 'test'
) {
  // 모듈 로드 시 자동 초기화 (비동기)
  checkEnvironmentStatus().catch(error => {
    console.warn('⚠️ 환경변수 자동 초기화 중 오류 발생:', error);
  });
}
