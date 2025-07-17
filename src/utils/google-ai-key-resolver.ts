/**
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
    if (envKey && envKey.startsWith('AIza')) {
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
    const envPassword = process.env.GOOGLE_AI_TEAM_PASSWORD || 'team2025secure';

    if (envEncrypted && envSalt && envIV) {
      try {
        console.log('🔍 환경변수 암호화된 키 복호화 시도...');
        const encryptedData = {
          encrypted: envEncrypted,
          salt: envSalt,
          iv: envIV,
          authTag: '',  // 이전 버전 호환성
          algorithm: 'aes-256-gcm' as const,
          iterations: 100000,
          timestamp: Date.now(),
          version: '2.0',
        };

        enhancedCryptoManager.initializeMasterKey(envPassword);
        const decryptedKey = enhancedCryptoManager.decryptVariable(encryptedData, envPassword);
        if (decryptedKey && decryptedKey.startsWith('AIza')) {
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

    // 3. 팀 설정 암호화된 키 (자동 복호화)
    if (ENCRYPTED_GOOGLE_AI_CONFIG) {
      const defaultPasswords = [
        'team2025secure',
        'openmanager2025',
        'openmanager-vibe-v5-2025',
        'team-password-2025',
      ];

      for (const password of defaultPasswords) {
        try {
          console.log(`🔍 팀 설정 복호화 시도: ${password.substring(0, 3)}***`);

          const encryptedData = {
            encrypted: ENCRYPTED_GOOGLE_AI_CONFIG.encryptedKey,
            salt: ENCRYPTED_GOOGLE_AI_CONFIG.salt,
            iv: ENCRYPTED_GOOGLE_AI_CONFIG.iv,
            authTag: ENCRYPTED_GOOGLE_AI_CONFIG.authTag || '',  // 이전 버전 호환성
            algorithm: 'aes-256-gcm' as const,
            iterations: 100000,
            timestamp: Date.parse(ENCRYPTED_GOOGLE_AI_CONFIG.createdAt),
            version: ENCRYPTED_GOOGLE_AI_CONFIG.version,
          };

          enhancedCryptoManager.initializeMasterKey(password);
          const decryptedKey = enhancedCryptoManager.decryptVariable(encryptedData, password);
          if (decryptedKey && decryptedKey.startsWith('AIza')) {
            console.log(
              `✅ 팀 설정 복호화 성공: ${password.substring(0, 3)}***`
            );
            return {
              success: true,
              key: decryptedKey,
              source: 'team_config',
            };
          }
        } catch (error) {
          console.warn(
            `⚠️ 팀 설정 복호화 실패: ${password.substring(0, 3)}***`
          );
          continue;
        }
      }
    }

    // 4. 개발 환경 기본값 (임시)
    if (process.env.NODE_ENV === 'development') {
      console.log('🚧 개발 환경: 기본 키 사용');
      return {
        success: true,
        key: 'SENSITIVE_INFO_REMOVED', // 새로운 키
        source: 'development',
      };
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
  if (envKey && envKey.startsWith('AIza')) {
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
    hasEnvKey: !!(
      process.env.GOOGLE_AI_API_KEY &&
      process.env.GOOGLE_AI_API_KEY.startsWith('AIza')
    ),
    hasEncryptedEnvKey: !!(
      process.env.GOOGLE_AI_ENCRYPTED_KEY &&
      process.env.GOOGLE_AI_ENCRYPTED_SALT &&
      process.env.GOOGLE_AI_ENCRYPTED_IV
    ),
    hasTeamConfig: !!(
      ENCRYPTED_GOOGLE_AI_CONFIG && ENCRYPTED_GOOGLE_AI_CONFIG.encryptedKey
    ),
    isProduction: process.env.NODE_ENV === 'production',
  };
}
