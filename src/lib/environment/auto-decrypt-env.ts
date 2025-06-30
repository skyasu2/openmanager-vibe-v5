/**
 * 🔐 자동 환경변수 복호화 시스템 (개선된 버전)
 *
 * 근본적 개선사항:
 * - 클라이언트/서버 완전 분리
 * - 동적 import를 통한 서버 전용 모듈 로드
 * - 타입 안전성 강화
 * - 에러 처리 개선
 */

import { envManagerProxy } from './client-safe-env';

// 🚨 클라이언트 사이드에서는 실행하지 않음
if (typeof window !== 'undefined') {
  console.log('🌐 클라이언트 사이드 - 환경변수 복호화 건너뜀');
}

/**
 * 🔧 환경변수 자동 초기화 시스템
 */
export async function initializeEnvironment(): Promise<void> {
  // 클라이언트에서는 실행하지 않음
  if (typeof window !== 'undefined') {
    console.log('🌐 클라이언트 사이드 - 환경변수 초기화 건너뜀');
    return;
  }

  try {
    console.log('🔧 환경변수 자동 초기화 시작...');

    // UTF-8 콘솔 활성화 (서버 사이드에서만)
    try {
      const { enableUTF8Console } = await import('@/utils/utf8-logger');
      enableUTF8Console();
      console.log('🔤 UTF-8 콘솔 활성화 완료');
    } catch (error) {
      console.warn('⚠️ UTF-8 콘솔 활성화 실패:', error);
    }

    // 환경변수 검증
    const validation = await envManagerProxy.validateEnvironment();

    if (!validation.valid && validation.missing.length > 0) {
      console.warn('⚠️ 누락된 환경변수 발견:', validation.missing);

      // 자동 복구 시도
      const recovery = await envManagerProxy.autoRecovery(validation.missing);

      if (recovery.success) {
        console.log('✅ 환경변수 자동 복구 완료:', recovery.message);
      } else {
        console.warn('⚠️ 환경변수 자동 복구 실패:', recovery.message);
      }
    } else {
      console.log('✅ 모든 환경변수가 정상적으로 설정되었습니다.');
    }

    // 환경변수 자동 백업 (운영 환경에서만) - 빈도 제한 추가
    if (
      process.env.NODE_ENV === 'production' &&
      !process.env.DISABLE_AUTO_BACKUP && // 수동 비활성화 옵션
      process.env.VERCEL === '1' // Vercel 배포에서만
    ) {
      console.log('🔄 운영 환경 감지 - 환경변수 백업 진행');
      const backup = await envManagerProxy.backupEnvironment('production');
      if (backup.success) {
        console.log('📦 환경변수 자동 백업 완료:', backup.message);
      }
    } else {
      console.log('🚫 환경변수 백업 건너뜀 (조건 미충족)');
    }

    console.log('🎉 환경변수 자동 초기화 완료');
  } catch (error) {
    console.error('❌ 환경변수 자동 초기화 실패:', error);

    // 치명적 오류가 아닌 경우 계속 진행
    if (error instanceof Error && !error.message.includes('critical')) {
      console.log('⚠️ 환경변수 오류를 무시하고 계속 진행합니다.');
    }
  }
}

/**
 * 🔍 환경변수 상태 확인
 */
export async function checkEnvironmentStatus(): Promise<{
  initialized: boolean;
  valid: boolean;
  missing: string[];
  message: string;
}> {
  try {
    const validation = await envManagerProxy.validateEnvironment();

    return {
      initialized: true,
      valid: validation.valid,
      missing: validation.missing,
      message: validation.valid
        ? '모든 환경변수가 정상적으로 설정되었습니다.'
        : `누락된 환경변수: ${validation.missing.join(', ')}`,
    };
  } catch (error) {
    return {
      initialized: false,
      valid: false,
      missing: ['초기화 실패'],
      message: `환경변수 상태 확인 실패: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * 🔄 환경변수 수동 복구
 */
export async function manualEnvironmentRecovery(backupId?: string): Promise<{
  success: boolean;
  message: string;
  restored: Record<string, string>;
}> {
  try {
    if (backupId) {
      // 특정 백업에서 복구
      const result = await envManagerProxy.restoreEnvironment(backupId);
      return {
        success: result.success,
        message: result.message,
        restored: result.restored,
      };
    } else {
      // 자동 복구
      const validation = await envManagerProxy.validateEnvironment();
      if (!validation.valid) {
        const recovery = await envManagerProxy.autoRecovery(validation.missing);
        return {
          success: recovery.success,
          message: recovery.message,
          restored: recovery.restored,
        };
      } else {
        return {
          success: true,
          message: '환경변수가 이미 정상 상태입니다.',
          restored: {},
        };
      }
    }
  } catch (error) {
    return {
      success: false,
      message: `수동 복구 실패: ${error instanceof Error ? error.message : 'Unknown error'}`,
      restored: {},
    };
  }
}

// 🚀 자동 초기화 (서버 사이드에서만) - 중복 실행 방지 추가
let initializationPromise: Promise<void> | null = null;

export async function ensureInitialized(): Promise<void> {
  if (!initializationPromise) {
    initializationPromise = initializeEnvironment();
  }
  return initializationPromise;
}

// 🛑 무한 백업 생성 방지: 조건을 더욱 엄격하게 설정
if (
  typeof window === 'undefined' &&
  process.env.NODE_ENV !== 'test' &&
  !process.env.DISABLE_AUTO_ENV_INIT // 수동 비활성화 옵션
  // ✅ NODE_ENV 조건 제거: 개발환경에서도 환경변수 초기화 필요
) {
  // 한 번만 실행되도록 보장
  ensureInitialized().catch(error => {
    console.warn('⚠️ 환경변수 자동 초기화 중 오류 발생:', error);
  });
}
