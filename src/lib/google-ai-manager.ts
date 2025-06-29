import { ENCRYPTED_GOOGLE_AI_CONFIG } from '@/config/google-ai-config';
import CryptoJS from 'crypto-js';

/**
 * Google AI API 키 관리자
 *
 * 우선순위:
 * 1. 개인 환경변수 (GOOGLE_AI_API_KEY)
 * 2. 팀 설정 (비밀번호로 복호화)
 * 3. 시연용 하드코딩 키 (임시)
 * 4. 에러 (키 없음)
 */
class GoogleAIManager {
  private static instance: GoogleAIManager;
  private decryptedTeamKey: string | null = null;
  private isTeamKeyUnlocked = false;

  // 🚀 시연용 임시 API 키 (내일 시연 후 제거 예정)
  // 🚨 데모 키 제거 - 환경변수에서만 API 키 사용
  private readonly DEMO_API_KEY =
    process.env.NODE_ENV === 'development' ? '' : null;

  private constructor() {}

  static getInstance(): GoogleAIManager {
    if (!GoogleAIManager.instance) {
      GoogleAIManager.instance = new GoogleAIManager();
    }
    return GoogleAIManager.instance;
  }

  /**
   * Google AI API 키 가져오기
   * @returns API 키 또는 null (키가 없거나 잠김)
   */
  getAPIKey(): string | null {
    // 0순위: 환경변수 강제 로딩 시도 (서버 사이드에서만)
    if (typeof window === 'undefined') {
      try {
        const { getGoogleAIKeyWithFallback } = require('@/lib/env-loader');
        const fallbackKey = getGoogleAIKeyWithFallback();
        if (fallbackKey && fallbackKey.trim() !== '') {
          console.log('🔑 Google AI API 키 소스: 환경변수 (강제 로딩)');
          return fallbackKey.trim();
        }
      } catch (error) {
        console.warn('⚠️ 환경변수 강제 로딩 실패:', error.message);
      }
    } else {
      // 클라이언트에서는 환경변수 강제 로딩 건너뜀
      console.log('🌐 클라이언트 사이드 - 환경변수 강제 로딩 건너뜀');
    }

    // 1순위: 개인 환경변수 (베르셀 호환성 개선)
    const envKey = process.env.GOOGLE_AI_API_KEY;
    if (envKey && envKey.trim() !== '') {
      // 베르셀 환경변수에서 발생할 수 있는 \r\n 문자 제거
      const cleanKey = envKey.replace(/[\r\n]/g, '').trim();
      if (cleanKey && cleanKey.length > 10) {
        console.log('🔑 Google AI API 키 소스: 환경변수 (베르셀 호환)');
        return cleanKey;
      }
    }

    // 2순위: 팀 설정 (복호화된 키)
    if (this.isTeamKeyUnlocked && this.decryptedTeamKey) {
      console.log('🔑 Google AI API 키 소스: 팀 설정');
      return this.decryptedTeamKey;
    }

    // 🚀 3순위: 시연용 하드코딩 키 (임시)
    if (this.DEMO_API_KEY) {
      console.log('🚀 Google AI API 키 소스: 시연용 임시 키 (내일 시연 전용)');
      return this.DEMO_API_KEY;
    }

    // 4순위: null (키 없음)
    return null;
  }

  /**
   * API 키 사용 가능 여부 확인
   */
  isAPIKeyAvailable(): boolean {
    return this.getAPIKey() !== null;
  }

  /**
   * API 키 상태 정보
   */
  getKeyStatus(): {
    source: 'env' | 'team' | 'demo' | 'none';
    isAvailable: boolean;
    needsUnlock: boolean;
  } {
    const envKey = process.env.GOOGLE_AI_API_KEY;

    if (envKey && envKey.trim() !== '') {
      // 베르셀 환경변수 호환성 개선
      const cleanKey = envKey.replace(/[\r\n]/g, '').trim();
      if (cleanKey && cleanKey.length > 10) {
        return {
          source: 'env',
          isAvailable: true,
          needsUnlock: false,
        };
      }
    }

    if (this.isTeamKeyUnlocked && this.decryptedTeamKey) {
      return {
        source: 'team',
        isAvailable: true,
        needsUnlock: false,
      };
    }

    // 🚀 시연용 키 사용 가능
    if (this.DEMO_API_KEY) {
      return {
        source: 'demo',
        isAvailable: true,
        needsUnlock: false,
      };
    }

    const hasTeamConfig = ENCRYPTED_GOOGLE_AI_CONFIG !== null;
    return {
      source: 'none',
      isAvailable: false,
      needsUnlock: hasTeamConfig,
    };
  }

  /**
   * 팀 비밀번호로 Google AI 키 잠금 해제
   * @param password 팀 비밀번호
   * @returns 성공 여부
   */
  async unlockTeamKey(
    password: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      if (!ENCRYPTED_GOOGLE_AI_CONFIG) {
        return {
          success: false,
          error:
            'Google AI 팀 설정이 없습니다. 개인 환경변수를 사용하거나 관리자에게 문의하세요.',
        };
      }

      const { encryptedKey, salt, iv } = ENCRYPTED_GOOGLE_AI_CONFIG;

      // 비밀번호와 솔트로 키 생성
      const key = CryptoJS.PBKDF2(password, salt, {
        keySize: 256 / 32,
        iterations: 10000,
      });

      // 복호화 시도
      const decrypted = CryptoJS.AES.decrypt(encryptedKey, key, {
        iv: CryptoJS.enc.Hex.parse(iv),
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
      });

      const decryptedText = decrypted.toString(CryptoJS.enc.Utf8);

      if (!decryptedText || !decryptedText.startsWith('AIza')) {
        return {
          success: false,
          error: '비밀번호가 올바르지 않습니다.',
        };
      }

      // 성공: 메모리에 저장
      this.decryptedTeamKey = decryptedText;
      this.isTeamKeyUnlocked = true;

      console.log('✅ Google AI 팀 키가 성공적으로 잠금 해제되었습니다.');
      return { success: true };
    } catch (error) {
      console.error('Google AI 키 복호화 실패:', error);
      return {
        success: false,
        error: '복호화 중 오류가 발생했습니다.',
      };
    }
  }

  /**
   * 팀 키 잠금 (로그아웃)
   */
  lockTeamKey(): void {
    this.decryptedTeamKey = null;
    this.isTeamKeyUnlocked = false;
    console.log('🔒 Google AI 팀 키가 잠금되었습니다.');
  }

  /**
   * Google AI API 키 암호화 (관리자용)
   * @param apiKey Google AI API 키
   * @param password 팀 비밀번호
   * @returns 암호화된 설정
   */
  static encryptAPIKey(
    apiKey: string,
    password: string
  ): {
    encryptedKey: string;
    salt: string;
    iv: string;
    createdAt: string;
    version: string;
  } {
    // 랜덤 솔트와 IV 생성
    const salt = CryptoJS.lib.WordArray.random(128 / 8).toString();
    const iv = CryptoJS.lib.WordArray.random(128 / 8);

    // 비밀번호와 솔트로 키 생성
    const key = CryptoJS.PBKDF2(password, salt, {
      keySize: 256 / 32,
      iterations: 10000,
    });

    // API 키 암호화
    const encrypted = CryptoJS.AES.encrypt(apiKey, key, {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });

    return {
      encryptedKey: encrypted.toString(),
      salt: salt,
      iv: iv.toString(),
      createdAt: new Date().toISOString(),
      version: '1.0.0',
    };
  }
}

// 싱글톤 인스턴스 내보내기
export const googleAIManager = GoogleAIManager.getInstance();

// 편의 함수들
export const getGoogleAIKey = () => googleAIManager.getAPIKey();
export const isGoogleAIAvailable = (): boolean => {
  const status = googleAIManager.getKeyStatus();
  const enabledEnv = process.env.GOOGLE_AI_ENABLED;

  // 환경변수 정리 (베르셀 호환성)
  const cleanEnabled = enabledEnv
    ?.replace(/[\r\n]/g, '')
    .trim()
    .toLowerCase();
  const isEnabledByEnv = cleanEnabled === 'true';

  return status.isAvailable && isEnabledByEnv;
};
export const getGoogleAIStatus = () => googleAIManager.getKeyStatus();

export default GoogleAIManager;
