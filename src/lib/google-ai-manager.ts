import { ENCRYPTED_GOOGLE_AI_CONFIG } from '@/config/google-ai-config';
import { enhancedCryptoManager } from '@/lib/crypto/EnhancedEnvCryptoManager';
import { getSecureGoogleAIKey } from '@/utils/encryption';

/**
 * Google AI API 키 관리자 v3.0 (Node.js crypto 호환)
 *
 * 기존 환경변수 암복호화 시스템과 통합
 * 우선순위:
 * 1. 환경변수 (암호화/평문)
 * 2. 팀 설정 (Node.js crypto - 복호화)
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

    // 2순위: 팀 설정 (Node.js crypto)
    if (this.isTeamKeyUnlocked && this.decryptedTeamKey) {
      console.log('🔑 Google AI API 키 소스: 팀 설정 (Node.js crypto)');
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
    cryptoMethod: 'crypto-js' | 'node-crypto' | 'none';
  } {
    const secureKey = getSecureGoogleAIKey();

    if (secureKey) {
      return {
        source: 'env',
        isAvailable: true,
        needsUnlock: false,
        cryptoMethod: 'node-crypto',
      };
    }

    if (this.isTeamKeyUnlocked && this.decryptedTeamKey) {
      return {
        source: 'team',
        isAvailable: true,
        needsUnlock: false,
        cryptoMethod: 'node-crypto',
      };
    }

    const hasTeamConfig = ENCRYPTED_GOOGLE_AI_CONFIG !== null;
    return {
      source: 'none',
      isAvailable: false,
      needsUnlock: hasTeamConfig,
      cryptoMethod: 'none',
    };
  }

  /**
   * 팀 비밀번호로 Google AI 키 잠금 해제 (Node.js crypto)
   */
  async unlockTeamKey(
    password: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      if (!ENCRYPTED_GOOGLE_AI_CONFIG) {
        return {
          success: false,
          error: '팀 설정이 없습니다. 환경변수를 사용하세요.',
        };
      }

      // 새로운 암호화 방식 사용
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

      // EnhancedEnvCryptoManager로 복호화 (동기 함수)
      enhancedCryptoManager.initializeMasterKey(password);
      const decryptedText = enhancedCryptoManager.decryptVariable(
        encryptedData,
        password
      );

      if (!decryptedText || !decryptedText.startsWith('AIza')) {
        return {
          success: false,
          error: '비밀번호가 올바르지 않거나 복호화에 실패했습니다.',
        };
      }

      // 성공: 메모리에 저장
      this.decryptedTeamKey = decryptedText;
      this.isTeamKeyUnlocked = true;

      console.log(
        '✅ Google AI 팀 키가 성공적으로 잠금 해제되었습니다 (Node.js crypto).'
      );
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
   * 기본 팀 비밀번호로 자동 잠금 해제 시도
   */
  async tryAutoUnlock(): Promise<boolean> {
    const defaultPasswords = [
      'team2025secure',
      'openmanager2025',
      'openmanager-vibe-v5-2025',
      'team-password-2025',
    ];

    for (const password of defaultPasswords) {
      const result = await this.unlockTeamKey(password);
      if (result.success) {
        console.log(`🔓 자동 잠금 해제 성공: ${password.substring(0, 3)}***`);
        return true;
      }
    }

    console.log('🔒 자동 잠금 해제 실패');
    return false;
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
export const tryAutoUnlockGoogleAI = () => googleAIManager.tryAutoUnlock();

export default googleAIManager;
