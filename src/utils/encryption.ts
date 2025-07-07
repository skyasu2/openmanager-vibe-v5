import CryptoJS from 'crypto-js';

// 🔐 암호화 키 lazy loading - 빌드 타임 오류 방지
let _encryptionKey: string | null = null;

const getEncryptionKey = (): string => {
  if (_encryptionKey) {
    return _encryptionKey;
  }

  // 1순위: 환경변수에서 가져오기
  if (process.env.ENCRYPTION_KEY) {
    _encryptionKey = process.env.ENCRYPTION_KEY;
    return _encryptionKey;
  }

  // 2순위: 프로덕션에서는 에러 (런타임에만)
  if (process.env.NODE_ENV === 'production') {
    // 빌드 타임 vs 런타임 구분
    if (typeof window === 'undefined' && !(global as any).vercelBuildTime) {
      // 서버 런타임에서만 에러 발생
      throw new Error('🚨 프로덕션에서는 ENCRYPTION_KEY 환경변수가 필수입니다');
    } else {
      // 빌드 타임이나 클라이언트에서는 임시 키 사용
      console.warn('⚠️ 빌드 타임: 임시 암호화 키 사용');
      _encryptionKey = 'build-time-temp-key-' + Date.now();
      return _encryptionKey;
    }
  }

  // 3순위: 개발환경에서만 동적 생성
  const nodeVersion = process.version;
  const projectHash = require('crypto')
    .createHash('sha256')
    .update(process.cwd() + 'openmanager-vibe-v5')
    .digest('hex')
    .substring(0, 32);

  console.warn(
    '⚠️ 개발환경: 동적 암호화 키 생성됨 (프로덕션에서는 ENCRYPTION_KEY 설정 필요)'
  );
  _encryptionKey = `dev-${nodeVersion}-${projectHash}`;
  return _encryptionKey;
};

/**
 * 🔒 문자열 암호화
 */
export function encrypt(text: string): string {
  try {
    const key = getEncryptionKey();
    const encrypted = CryptoJS.AES.encrypt(text, key).toString();
    return encrypted;
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
    const key = getEncryptionKey();
    const bytes = CryptoJS.AES.decrypt(encryptedText, key);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);

    if (!decrypted) {
      throw new Error('복호화 결과가 비어있음');
    }

    return decrypted;
  } catch (error) {
    console.error('🔓 복호화 실패:', error);
    throw new Error('복호화 실패');
  }
}

/**
 * 🔑 Google AI API 키 안전하게 가져오기
 */
export function getSecureGoogleAIKey(): string | null {
  try {
    // 1. 암호화된 키 확인
    const encryptedKey = process.env.GOOGLE_AI_API_KEY_ENCRYPTED;
    if (encryptedKey) {
      return decrypt(encryptedKey);
    }

    // 2. 평문 키 확인 (개발 환경)
    const plainKey = process.env.GOOGLE_AI_API_KEY;
    if (plainKey) {
      console.warn(
        '⚠️ 개발 환경에서 암호화되지 않은 Google AI API 키를 사용 중입니다.'
      );
      return plainKey;
    }

    console.warn('🔑 Google AI API 키를 찾을 수 없습니다.');
    return null;
  } catch (error) {
    console.error('🔑 Google AI API 키 복호화 실패:', error);
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
      success: decrypted === testValue,
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
