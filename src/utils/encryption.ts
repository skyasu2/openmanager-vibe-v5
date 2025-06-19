import CryptoJS from 'crypto-js';

// 암호화 키 (실제 환경에서는 더 안전한 방법 사용)
const ENCRYPTION_KEY =
  process.env.ENCRYPTION_KEY || 'openmanager-vibe-v5-default-key';

/**
 * 🔒 문자열 암호화
 */
export function encrypt(text: string): string {
  try {
    const encrypted = CryptoJS.AES.encrypt(text, ENCRYPTION_KEY).toString();
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
    const bytes = CryptoJS.AES.decrypt(encryptedText, ENCRYPTION_KEY);
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
 * 📊 암호화 시스템 상태
 */
export function getEncryptionStatus() {
  return {
    enabled: !!process.env.ENCRYPTION_KEY,
    keySource: process.env.ENCRYPTION_KEY ? 'env' : 'default',
    googleAI: {
      hasKey: !!getSecureGoogleAIKey(),
      source: process.env.GOOGLE_AI_API_KEY ? 'env' : 'builtin',
      preview: getSecureGoogleAIKey()?.substring(0, 30) + '...' || 'none',
    },
  };
}
