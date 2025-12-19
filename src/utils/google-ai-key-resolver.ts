/**
 * @deprecated v5.84.0 - Hybrid Architecture 전환
 *
 * ⚠️ DEPRECATED: API 키 관리는 Cloud Run으로 이관되었습니다.
 *
 * Hybrid Architecture 설계:
 * - Vercel = Frontend/Proxy Only (API 키 없음)
 * - Cloud Run = ALL AI processing (API 키 관리)
 *
 * 대체 방법:
 * - 프록시: src/lib/ai-proxy/proxy.ts (proxyToCloudRun 함수)
 * - 임베딩: Cloud Run /api/ai/embedding 엔드포인트
 * - 생성: Cloud Run /api/ai/generate 엔드포인트
 *
 * 이 파일은 하위 호환성을 위해 유지됩니다:
 * - Cloud Run 미활성화 시 폴백으로 사용
 * - 로컬 개발 환경에서 직접 테스트용
 *
 * ---
 *
 * 🔑 Google AI API 키 통합 해결사
 *
 * 우선순위:
 * 1. 환경변수 GOOGLE_AI_API_KEY (평문)
 * 2. 환경변수 GOOGLE_AI_ENCRYPTED_* (암호화된 값들)
 * 3. 팀 설정 암호화된 키 (기본 비밀번호로 자동 복호화)
 * 4. 개발 환경 기본값
 */

import { ENCRYPTED_GOOGLE_AI_CONFIG } from '@/config/google-ai-config';
import { enhancedCryptoManager } from '@/lib/crypto/EnhancedEnvCryptoManager';

export interface GoogleAIKeyResult {
  success: boolean;
  key: string | null;
  source:
    | 'env_plain'
    | 'env_encrypted'
    | 'team_config'
    | 'development'
    | 'none';
  error?: string;
}

/**
 * Google AI API 키 통합 해결
 */
export async function resolveGoogleAIKey(): Promise<GoogleAIKeyResult> {
  try {
    console.log('🔍 Google AI API 키 해결 시작...');

    // 1. 환경변수 평문 키 확인
    const envKey = process.env.GOOGLE_AI_API_KEY;
    if (envKey?.startsWith('AIza')) {
      console.log('✅ 환경변수 평문 키 발견');
      return {
        success: true,
        key: envKey,
        source: 'env_plain',
      };
    }

    // 2. 환경변수 암호화된 키 확인
    const envEncrypted = process.env.GOOGLE_AI_ENCRYPTED_KEY;
    const envSalt = process.env.GOOGLE_AI_ENCRYPTED_SALT;
    const envIV = process.env.GOOGLE_AI_ENCRYPTED_IV;
    const envPassword = process.env.GOOGLE_AI_TEAM_PASSWORD;

    if (envEncrypted && envSalt && envIV && envPassword) {
      try {
        console.log('🔍 환경변수 암호화된 키 복호화 시도...');
        const encryptedData = {
          encrypted: envEncrypted,
          salt: envSalt,
          iv: envIV,
          authTag: '', // 이전 버전 호환성
          algorithm: 'aes-256-gcm' as const,
          iterations: 100000,
          timestamp: Date.now(),
          version: '2.0',
        };

        enhancedCryptoManager._initializeMasterKey(envPassword);
        const decryptedKey = enhancedCryptoManager.decryptVariable(
          encryptedData,
          envPassword
        );
        if (decryptedKey?.startsWith('AIza')) {
          console.log('✅ 환경변수 암호화된 키 복호화 성공');
          return {
            success: true,
            key: decryptedKey,
            source: 'env_encrypted',
          };
        }
      } catch (error) {
        console.warn('⚠️ 환경변수 암호화된 키 복호화 실패:', error);
      }
    }

    // 3. 팀 설정 암호화된 키 (환경변수 패스워드로만 복호화)
    if (ENCRYPTED_GOOGLE_AI_CONFIG && envPassword) {
      try {
        console.log(`🔍 팀 설정 복호화 시도`);

        const encryptedData = {
          encrypted: ENCRYPTED_GOOGLE_AI_CONFIG.encryptedKey,
          salt: ENCRYPTED_GOOGLE_AI_CONFIG.salt,
          iv: ENCRYPTED_GOOGLE_AI_CONFIG.iv,
          authTag: ENCRYPTED_GOOGLE_AI_CONFIG.authTag || '', // 이전 버전 호환성
          algorithm: 'aes-256-gcm' as const,
          iterations: 100000,
          timestamp: Date.parse(ENCRYPTED_GOOGLE_AI_CONFIG.createdAt),
          version: ENCRYPTED_GOOGLE_AI_CONFIG.version,
        };

        enhancedCryptoManager._initializeMasterKey(envPassword);
        const decryptedKey = enhancedCryptoManager.decryptVariable(
          encryptedData,
          envPassword
        );
        if (decryptedKey?.startsWith('AIza')) {
          console.log(`✅ 팀 설정 복호화 성공`);
          return {
            success: true,
            key: decryptedKey,
            source: 'team_config',
          };
        }
      } catch {
        console.warn(`⚠️ 팀 설정 복호화 실패`);
      }
    }

    // 4. 개발 환경에서도 환경변수 필요
    if (process.env.NODE_ENV === 'development') {
      console.log('🚧 개발 환경: 환경변수를 설정해주세요');
    }

    // 5. 키를 찾을 수 없음
    console.error('❌ Google AI API 키를 찾을 수 없습니다');
    return {
      success: false,
      key: null,
      source: 'none',
      error: 'API 키를 찾을 수 없습니다. 환경변수 또는 팀 설정을 확인해주세요.',
    };
  } catch (error) {
    console.error('❌ Google AI API 키 해결 중 오류:', error);
    return {
      success: false,
      key: null,
      source: 'none',
      error: error instanceof Error ? error.message : '알 수 없는 오류',
    };
  }
}

/**
 * Google AI API 키 가져오기 (동기 버전)
 */
export function getGoogleAIKey(): string | null {
  // 환경변수 평문 키 우선 확인
  const envKey = process.env.GOOGLE_AI_API_KEY;
  if (envKey?.startsWith('AIza')) {
    return envKey;
  }

  // 개발 환경 기본값
  if (process.env.NODE_ENV === 'development') {
    return 'SENSITIVE_INFO_REMOVED';
  }

  return null;
}

/**
 * Google AI API 키 상태 확인
 */
export function checkGoogleAIKeyStatus(): {
  hasEnvKey: boolean;
  hasEncryptedEnvKey: boolean;
  hasTeamConfig: boolean;
  isProduction: boolean;
} {
  return {
    hasEnvKey: !!process.env.GOOGLE_AI_API_KEY?.startsWith('AIza'),
    hasEncryptedEnvKey: !!(
      process.env.GOOGLE_AI_ENCRYPTED_KEY &&
      process.env.GOOGLE_AI_ENCRYPTED_SALT &&
      process.env.GOOGLE_AI_ENCRYPTED_IV
    ),
    hasTeamConfig: !!ENCRYPTED_GOOGLE_AI_CONFIG?.encryptedKey,
    isProduction: process.env.NODE_ENV === 'production',
  };
}
