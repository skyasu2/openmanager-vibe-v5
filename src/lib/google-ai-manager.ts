import { ENCRYPTED_GOOGLE_AI_CONFIG } from '@/config/google-ai-config';
import { enhancedCryptoManager } from '@/lib/crypto/EnhancedEnvCryptoManager';
import { getSecureGoogleAIKey } from '@/utils/encryption';

/**
 * Google AI API 키 관리자 v4.0 (Rate Limiting + ToS Compliance)
 *
 * 기존 환경변수 암복호화 시스템과 통합
 * 우선순위:
 * 1. 환경변수 (암호화/평문)
 * 2. 팀 설정 (Node.js crypto - 복호화)
 * 3. null (키 없음)
 *
 * ⚠️ ToS 준수 요구사항:
 * - Primary/Secondary 키는 반드시 동일한 Google Cloud Project에서 발급
 * - 서로 다른 계정의 키를 사용하여 Rate Limit 우회 시도는 ToS 위반
 * - 계정 정지 위험
 *
 * 🚦 Rate Limiting (Free Tier):
 * - gemini-2.0-flash: 15 RPM, 250,000 TPM, 1,000 RPD
 * - RPD 할당량은 매일 자정(Pacific Time)에 초기화
 */
class GoogleAIManager {
  private static instance: GoogleAIManager;
  private primaryKey: string | null = null;
  private secondaryKey: string | null = null;
  private decryptedTeamKey: string | null = null;
  private isTeamKeyUnlocked = false;

  // Rate limiting 추적
  private requestLog: number[] = []; // 타임스탬프 배열
  private dailyRequestCount = 0;
  private lastResetDate: string = '';

  private constructor() {
    this.loadAPIKeys();
  }

  static getInstance(): GoogleAIManager {
    if (!GoogleAIManager.instance) {
      GoogleAIManager.instance = new GoogleAIManager();
    }
    return GoogleAIManager.instance;
  }

  private loadAPIKeys(): void {
    this.primaryKey =
      process.env.GEMINI_API_KEY_PRIMARY ||
      process.env.GOOGLE_AI_API_KEY ||
      process.env.GOOGLE_AI_PRIMARY_API_KEY ||
      process.env.NEXT_PUBLIC_GOOGLE_AI_PRIMARY_API_KEY ||
      null;
    this.secondaryKey =
      process.env.GEMINI_API_KEY_SECONDARY ||
      process.env.GOOGLE_AI_SECONDARY_API_KEY ||
      process.env.NEXT_PUBLIC_GOOGLE_AI_SECONDARY_API_KEY ||
      null;
  }

  /**
   * 주 Google AI API 키 가져오기
   * @returns 주 API 키 또는 null
   */
  getPrimaryAPIKey(): string | null {
    if (this.primaryKey) {
      console.log('🔑 Google AI 주 API 키 소스: 환경변수');
      return this.primaryKey;
    }
    return null;
  }

  /**
   * 보조 Google AI API 키 가져오기 (팀 키 또는 백업)
   * @returns 보조 API 키 또는 null
   */
  getSecondaryAPIKey(): string | null {
    if (this.secondaryKey) {
      console.log('🔑 Google AI 보조 API 키 소스: 환경변수');
      return this.secondaryKey;
    }
    if (this.isTeamKeyUnlocked && this.decryptedTeamKey) {
      console.log('🔑 Google AI 보조 API 키 소스: 팀 설정 (Node.js crypto)');
      return this.decryptedTeamKey;
    }
    return null;
  }

  /**
   * API 키 사용 가능 여부 확인 (주 키 기준)
   */
  isAPIKeyAvailable(): boolean {
    return this.getPrimaryAPIKey() !== null || this.getSecondaryAPIKey() !== null;
  }

  /**
   * API 키 상태 정보
   */
  getKeyStatus(): {
    primaryKeySource: 'env' | 'team' | 'none';
    secondaryKeySource: 'env' | 'team' | 'none';
    isPrimaryAvailable: boolean;
    isSecondaryAvailable: boolean;
    needsUnlock: boolean;
    cryptoMethod: 'node-crypto' | 'none';
  } {
    const primaryKey = this.getPrimaryAPIKey();
    const secondaryKey = this.getSecondaryAPIKey();

    const hasTeamConfig = ENCRYPTED_GOOGLE_AI_CONFIG !== null;

    return {
      primaryKeySource: primaryKey ? 'env' : 'none',
      secondaryKeySource: secondaryKey
        ? secondaryKey === this.decryptedTeamKey
          ? 'team'
          : 'env'
        : 'none',
      isPrimaryAvailable: primaryKey !== null,
      isSecondaryAvailable: secondaryKey !== null,
      needsUnlock: hasTeamConfig && !this.isTeamKeyUnlocked,
      cryptoMethod: 'node-crypto',
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
      enhancedCryptoManager._initializeMasterKey(password);
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

      // 성공: 메모리에 저장 (보조 키로 사용)
      this.decryptedTeamKey = decryptedText;
      this.isTeamKeyUnlocked = true;
      // 보조 키가 환경변수로 설정되지 않았다면 팀 키를 보조 키로 사용
      if (!this.secondaryKey) {
        this.secondaryKey = decryptedText;
      }

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
    // 보조 키가 팀 키였다면 다시 null로 설정
    if (this.secondaryKey && this.secondaryKey === this.decryptedTeamKey) {
      this.secondaryKey = null;
    }
    console.log('🔒 Google AI 팀 키가 잠금되었습니다.');
  }

  /**
   * 🚦 Rate Limit 체크 (15 RPM, 1,000 RPD)
   * @returns {allowed: boolean, reason?: string}
   */
  checkRateLimit(): { allowed: boolean; reason?: string } {
    const now = Date.now();
    const oneMinuteAgo = now - 60 * 1000;
    const today = new Date().toISOString().split('T')[0];

    // 일일 할당량 초기화 (Pacific Time 자정 기준은 단순화)
    if (this.lastResetDate !== today) {
      this.dailyRequestCount = 0;
      this.lastResetDate = today;
    }

    // 1분 동안의 요청 수 계산
    this.requestLog = this.requestLog.filter((timestamp) => timestamp > oneMinuteAgo);
    const requestsPerMinute = this.requestLog.length;

    // RPM 한도 체크 (15 RPM)
    if (requestsPerMinute >= 15) {
      return {
        allowed: false,
        reason: `Rate limit exceeded: ${requestsPerMinute} requests in the last minute (max 15 RPM)`,
      };
    }

    // RPD 한도 체크 (1,000 RPD)
    if (this.dailyRequestCount >= 1000) {
      return {
        allowed: false,
        reason: `Daily quota exceeded: ${this.dailyRequestCount} requests today (max 1,000 RPD)`,
      };
    }

    return { allowed: true };
  }

  /**
   * 🔄 요청 기록
   */
  recordRequest(): void {
    const now = Date.now();
    this.requestLog.push(now);
    this.dailyRequestCount++;
  }

  /**
   * 📊 Rate Limit 상태 조회
   */
  getRateLimitStatus(): {
    requestsLastMinute: number;
    requestsToday: number;
    remainingRPM: number;
    remainingRPD: number;
  } {
    const now = Date.now();
    const oneMinuteAgo = now - 60 * 1000;
    const requestsLastMinute = this.requestLog.filter((timestamp) => timestamp > oneMinuteAgo).length;

    return {
      requestsLastMinute,
      requestsToday: this.dailyRequestCount,
      remainingRPM: Math.max(0, 15 - requestsLastMinute),
      remainingRPD: Math.max(0, 1000 - this.dailyRequestCount),
    };
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
        console.log('🔓 자동 잠금 해제 성공');
        return true;
      }
    }

    console.log('🔒 자동 잠금 해제 실패');
    return false;
  }
}

const googleAIManager = GoogleAIManager.getInstance();

// 내보내기 - 기존 환경변수 암복호화 시스템 우선 사용
export const getGoogleAIKey = () => googleAIManager.getPrimaryAPIKey(); // getPrimaryAPIKey로 변경
export const getGoogleAISecondaryKey = () => googleAIManager.getSecondaryAPIKey(); // 새로운 내보내기
export const isGoogleAIAvailable = () => googleAIManager.isAPIKeyAvailable();
export const getGoogleAIStatus = () => googleAIManager.getKeyStatus();
export const unlockGoogleAITeamKey = (password: string) =>
  googleAIManager.unlockTeamKey(password);
export const lockGoogleAITeamKey = () => googleAIManager.lockTeamKey();
export const tryAutoUnlockGoogleAI = () => googleAIManager.tryAutoUnlock();

// Rate limiting 관련 내보내기
export const checkGoogleAIRateLimit = () => googleAIManager.checkRateLimit();
export const recordGoogleAIRequest = () => googleAIManager.recordRequest();
export const getGoogleAIRateLimitStatus = () => googleAIManager.getRateLimitStatus();

export default googleAIManager;
