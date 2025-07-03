import { ENCRYPTED_GOOGLE_AI_CONFIG } from '@/config/google-ai-config';
import { getSecureGoogleAIKey } from '@/utils/encryption';
import CryptoJS from 'crypto-js';

/**
 * Google AI API 키 관리자 v2.0
 *
 * 기존 환경변수 암복호화 시스템과 통합
 * 우선순위:
 * 1. 환경변수 (암호화/평문)
 * 2. 팀 설정 (레거시 - 복호화)
 * 3. null (키 없음)
 */
class GoogleAIManager {
  private static instance: GoogleAIManager;
  private decryptedTeamKey: string | null = null;
  private isTeamKeyUnlocked = false;

  private constructor() {}

  static getInstance(): GoogleAIManager {
    if (!GoogleAIManager.instance) {
      GoogleAIManager.instance = new GoogleAIManager();
    }
    return GoogleAIManager.instance;
  }

  /**
   * Google AI API 키 가져오기 (통합 버전)
   * @returns API 키 또는 null
   */
  getAPIKey(): string | null {
    // 1순위: 기존 환경변수 암복호화 시스템 사용
    const secureKey = getSecureGoogleAIKey();
    if (secureKey) {
      console.log('🔑 Google AI API 키 소스: 통합 암호화 시스템');
      return secureKey;
    }

    // 2순위: 레거시 팀 설정 (하위 호환성)
    if (this.isTeamKeyUnlocked && this.decryptedTeamKey) {
      console.log('🔑 Google AI API 키 소스: 레거시 팀 설정');
      return this.decryptedTeamKey;
    }

    // 3순위: null (키 없음)
    console.log('🚫 Google AI API 키를 찾을 수 없습니다.');
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
    source: 'env' | 'team' | 'none';
    isAvailable: boolean;
    needsUnlock: boolean;
  } {
    const secureKey = getSecureGoogleAIKey();

    if (secureKey) {
      return {
        source: 'env',
        isAvailable: true,
        needsUnlock: false,
      };
    }

    if (this.isTeamKeyUnlocked && this.decryptedTeamKey) {
      return {
        source: 'team',
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
   * 레거시 팀 비밀번호로 Google AI 키 잠금 해제 (하위 호환성)
   */
  async unlockTeamKey(
    password: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      if (!ENCRYPTED_GOOGLE_AI_CONFIG) {
        return {
          success: false,
          error: '레거시 팀 설정이 없습니다. 환경변수를 사용하세요.',
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

      console.log(
        '✅ 레거시 Google AI 팀 키가 성공적으로 잠금 해제되었습니다.'
      );
      return { success: true };
    } catch (error) {
      console.error('레거시 Google AI 키 복호화 실패:', error);
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
    console.log('🔒 레거시 Google AI 팀 키가 잠금되었습니다.');
  }
}

const googleAIManager = GoogleAIManager.getInstance();

// 내보내기 - 기존 환경변수 암복호화 시스템 우선 사용
export const getGoogleAIKey = () => googleAIManager.getAPIKey();
export const isGoogleAIAvailable = () => googleAIManager.isAPIKeyAvailable();
export const getGoogleAIStatus = () => googleAIManager.getKeyStatus();
export const unlockGoogleAITeamKey = (password: string) =>
  googleAIManager.unlockTeamKey(password);
export const lockGoogleAITeamKey = () => googleAIManager.lockTeamKey();

export default googleAIManager;
