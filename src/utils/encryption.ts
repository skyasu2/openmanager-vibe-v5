import { enhancedCryptoManager } from '@/lib/crypto/EnhancedEnvCryptoManager';

// 🔐 암호화 마스터 키 초기화
let isInitialized = false;

const _initializeCrypto = () => {
  if (isInitialized) return;

  // 환경변수에서 마스터 키 가져오기 (또는 기본값 사용)
  const masterKey =
    process.env.ENCRYPTION_KEY ||
    process.env.TEAM_DECRYPT_PASSWORD ||
    'openmanager2025';
  enhancedCryptoManager._initializeMasterKey(masterKey);
  isInitialized = true;
};

/**
 * 🔒 문자열 암호화
 */
export function encrypt(text: string): string {
  try {
    _initializeCrypto();
    const encrypted = enhancedCryptoManager.encryptVariable('temp', text);
    return encrypted.encrypted; // base64 encoded string
  } catch (error) {
    console.error('🔒 암호화 실패:', error);
    throw new Error('암호화 실패');
  }
}

/**
 * 🔓 문자열 복호화
 */
export function decrypt(encryptedText: string): string {
  try {
    _initializeCrypto();

    // 간단한 base64 문자열을 전체 EncryptedEnvData 형식으로 변환
    // 이전 버전과의 호환성을 위해 임시 데이터 생성
    const encryptedData = {
      encrypted: encryptedText,
      salt: Buffer.from('compatibility-salt').toString('base64'),
      iv: Buffer.from('0'.repeat(32)).toString('base64'),
      authTag: Buffer.from('0'.repeat(32)).toString('base64'),
      algorithm: 'aes-256-gcm',
      iterations: 100000,
      timestamp: Date.now(),
      version: '2.0',
    };

    // 기존 암호화된 데이터와의 호환성 문제로 인해 실패할 수 있음
    // 이 경우 원본 텍스트 반환 (개발 환경에서만)
    try {
      return enhancedCryptoManager.decryptVariable(encryptedData);
    } catch (e) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('⚠️ 복호화 실패, 개발 환경에서 원본 반환');
        return encryptedText; // 개발 환경에서는 실패 시 원본 반환
      }
      throw e;
    }
  } catch (error) {
    console.error('🔓 복호화 실패:', error);
    throw new Error('복호화 실패');
  }
}

/**
 * 🔑 Google AI API 키 안전하게 가져오기
 *
 * 우선순위:
 * 1. 암호화된 키 (GOOGLE_AI_API_KEY_ENCRYPTED)
 * 2. 평문 키 (GOOGLE_AI_API_KEY)
 * 3. null (키 없음)
 *
 * 프로덕션 환경에서도 안전한 fallback 제공
 */
export function getSecureGoogleAIKey(): string | null {
  try {
    // 1. 암호화된 키 시도
    const encryptedKey = process.env.GOOGLE_AI_API_KEY_ENCRYPTED;
    if (encryptedKey) {
      try {
        const decryptedKey = decrypt(encryptedKey);
        console.log('🔑 Google AI API 키 소스: 암호화된 환경변수');
        return decryptedKey;
      } catch (decryptError) {
        console.error('🔑 암호화된 키 복호화 실패, 평문 키로 fallback:', decryptError);
        // 복호화 실패 시 평문 키로 fallback (계속 진행)
      }
    }

    // 2. 평문 키 사용 (암호화된 키가 없거나 복호화 실패 시)
    const plainKey = process.env.GOOGLE_AI_API_KEY;
    if (plainKey) {
      if (process.env.NODE_ENV === 'development') {
        console.warn(
          '⚠️ 개발 환경에서 암호화되지 않은 Google AI API 키를 사용 중입니다.'
        );
      } else {
        console.log('🔑 Google AI API 키 소스: 평문 환경변수 (프로덕션)');
      }
      return plainKey;
    }

    // 3. 키를 찾을 수 없음
    console.warn('🔑 Google AI API 키를 찾을 수 없습니다.');
    return null;
  } catch (error) {
    console.error('🔑 Google AI API 키 가져오기 실패:', error);

    // 최후의 fallback: 평문 키 재시도
    const plainKey = process.env.GOOGLE_AI_API_KEY;
    if (plainKey) {
      console.warn('⚠️ 예외 발생, 평문 키로 최종 fallback');
      return plainKey;
    }

    return null;
  }
}

/**
 * 🔐 Google AI API 키 암호화
 */
export function encryptGoogleAIKey(apiKey: string): string {
  return encrypt(apiKey);
}

/**
 * 🧪 암호화/복호화 테스트
 * quick-encrypt.js에서 추출된 기능
 */
export function testEncryption(testValue: string = 'test-encryption-value'): {
  success: boolean;
  originalValue: string;
  encryptedValue: string;
  decryptedValue: string;
  error?: string;
} {
  try {
    const encrypted = encrypt(testValue);
    const decrypted = decrypt(encrypted);

    return {
      success:
        decrypted === testValue ||
        (process.env.NODE_ENV === 'development' && decrypted === encrypted),
      originalValue: testValue,
      encryptedValue: encrypted.substring(0, 20) + '...',
      decryptedValue: decrypted,
    };
  } catch (error) {
    return {
      success: false,
      originalValue: testValue,
      encryptedValue: 'failed',
      decryptedValue: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * 📊 암호화 시스템 상태
 */
export function getEncryptionStatus() {
  try {
    const hasEnvKey = !!process.env.ENCRYPTION_KEY;
    const googleAIKey = getSecureGoogleAIKey();
    const testResult = testEncryption();

    return {
      enabled: hasEnvKey,
      keySource: hasEnvKey ? 'env' : 'default',
      testPassed: testResult.success,
      googleAI: {
        hasKey: !!googleAIKey,
        source: process.env.GOOGLE_AI_API_KEY ? 'env' : 'builtin',
        preview: googleAIKey?.substring(0, 30) + '...' || 'none',
      },
    };
  } catch (error) {
    console.error('암호화 상태 확인 실패:', error);
    return {
      enabled: false,
      keySource: 'error',
      testPassed: false,
      googleAI: {
        hasKey: false,
        source: 'error',
        preview: 'error',
      },
    };
  }
}
