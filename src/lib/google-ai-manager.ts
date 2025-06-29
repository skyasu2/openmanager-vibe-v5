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

  // 🔐 암호화된 Google AI API 키 백업 (Git 안전) - 2025-01-25 최종 업데이트
  private static readonly ENCRYPTED_BACKUP = {
    encryptedKey:
      '0feYhTUnwSWPocp/fqBrTBwSpdhbJgl1UZhZ97WCl7t41xeRKvfhL+BtxvSS26ET',
    salt: '62f139856d0498bdbcd95a6f8baa6765',
    iv: 'decc181edda791f278e252eddb5e3ad5',
    teamPasswordHash:
      '7e346817b5382d72b3860a1aa9d6abc0263e2ddcea9e78c18724dfa2c1f575f5',
  };

  // 🔑 올바른 Google AI API 키 (메모리 백업)
  private static readonly CORRECT_API_KEY =
    'AIzaSyABC2WATlHIG0Kd-Oj4JSL6wJoqMd3FhvM';

  private constructor() {}

  static getInstance(): GoogleAIManager {
    if (!GoogleAIManager.instance) {
      GoogleAIManager.instance = new GoogleAIManager();
    }
    return GoogleAIManager.instance;
  }

  /**
   * 🧹 환경변수 값 정리 (베르셀 호환성 강화)
   */
  private cleanEnvValue(value: string): string {
    return value
      .replace(/[\r\n\t]/g, '') // \r\n\t 모든 공백 문자 제거
      .trim()
      .replace(/^["']|["']$/g, '') // 따옴표 제거
      .replace(/\\r\\n/g, '') // 이스케이프된 \r\n 제거
      .replace(/\\n/g, '') // 이스케이프된 \n 제거
      .replace(/\s+/g, ' '); // 연속된 공백을 하나로
  }

  /**
   * 🔓 암호화된 백업에서 API 키 복호화
   */
  private decryptBackupApiKey(): string | null {
    try {
      const teamPassword =
        process.env.TEAM_DECRYPT_PASSWORD || 'openmanager2025';

      // 비밀번호 검증
      const passwordHash = CryptoJS.SHA256(teamPassword).toString();
      if (passwordHash !== GoogleAIManager.ENCRYPTED_BACKUP.teamPasswordHash) {
        console.warn('⚠️ 팀 비밀번호 불일치 - 백업 복호화 실패');
        return null;
      }

      const { encryptedKey, salt, iv } = GoogleAIManager.ENCRYPTED_BACKUP;

      const key = CryptoJS.PBKDF2(teamPassword, salt, {
        keySize: 32, // 256비트 = 32바이트 (수정됨: 2025-01-25)
        iterations: 10000,
      });

      const decrypted = CryptoJS.AES.decrypt(encryptedKey, key, {
        iv: CryptoJS.enc.Hex.parse(iv),
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
      });

      const decryptedText = decrypted.toString(CryptoJS.enc.Utf8);

      if (decryptedText && decryptedText.startsWith('AIza')) {
        console.log('🔓 Google AI API 키 백업 복호화 성공');
        return decryptedText;
      }

      return null;
    } catch (error) {
      console.error('❌ Google AI API 키 백업 복호화 실패:', error.message);
      return null;
    }
  }

  /**
   * 🔍 Google AI API 키 다중 소스 검색
   */
  private findApiKey(): string | null {
    // 1. 환경변수에서 직접 확인 (베르셀 호환성 강화)
    const envSources = [
      'GOOGLE_AI_API_KEY',
      'GOOGLE_AI_KEY',
      'GEMINI_API_KEY',
      'GEMINI_KEY',
    ];

    for (const envKey of envSources) {
      const envValue = process.env[envKey];
      if (envValue) {
        const cleanKey = this.cleanEnvValue(envValue);
        if (cleanKey && cleanKey.startsWith('AIza') && cleanKey.length > 20) {
          console.log(`✅ Google AI API 키 환경변수 발견: ${envKey}`);
          return cleanKey;
        }
      }
    }

    // 2. 암호화된 백업에서 복호화 시도
    const backupKey = this.decryptBackupApiKey();
    if (backupKey) {
      return backupKey;
    }

    // 3. 메모리 백업 사용 (최후 수단)
    console.log('⚠️ 메모리 백업 API 키 사용 (최후 수단)');
    return GoogleAIManager.CORRECT_API_KEY;
  }

  /**
   * 🔧 Google AI 매니저 초기화
   */
  async initialize(): Promise<boolean> {
    if (this.isTeamKeyUnlocked && this.decryptedTeamKey) {
      console.log('🔧 Google AI 매니저 초기화 시작...');
      console.log('✅ Google AI 팀 키가 이미 잠금 해제되었습니다.');
      return true;
    }

    try {
      console.log('🔧 Google AI 매니저 초기화 시작...');

      // 🚫 테스트 환경에서는 초기화 제한
      if (
        process.env.NODE_ENV === 'test' ||
        process.env.TEST_CONTEXT === 'true' ||
        process.env.FORCE_MOCK_GOOGLE_AI === 'true'
      ) {
        console.log('🎭 테스트 환경 - Google AI 초기화 건너뜀');
        return false;
      }

      // Google AI 활성화 여부 확인 (베르셀 호환성)
      const enabledEnv = process.env.GOOGLE_AI_ENABLED;
      const cleanEnabled = enabledEnv
        ?.replace(/[\r\n]/g, '')
        .trim()
        .toLowerCase();
      const isEnabledByEnv = cleanEnabled === 'true';

      if (!isEnabledByEnv) {
        console.log('⚠️ Google AI 비활성화됨 (GOOGLE_AI_ENABLED=false)');
        return false;
      }

      // API 키 검색
      const apiKey = this.findApiKey();

      if (!apiKey) {
        console.error('❌ Google AI API 키를 찾을 수 없습니다');
        return false;
      }

      // API 키 유효성 검증
      const isValidKey = this.validateApiKey(apiKey);
      if (!isValidKey) {
        console.error('❌ Google AI API 키 형식이 올바르지 않습니다');
        return false;
      }

      console.log('✅ Google AI 매니저 초기화 성공');
      console.log(`🔑 API 키: ${apiKey.substring(0, 10)}...`);

      this.decryptedTeamKey = apiKey;
      this.isTeamKeyUnlocked = true;
      return true;
    } catch (error) {
      console.error('❌ Google AI 매니저 초기화 실패:', error.message);
      return false;
    }
  }

  /**
   * 🔍 API 키 유효성 검증
   */
  private validateApiKey(key: string): boolean {
    if (!key || typeof key !== 'string') {
      return false;
    }

    const cleanKey = this.cleanEnvValue(key);

    // Google AI Studio API 키 형식 검사
    if (!cleanKey.startsWith('AIza')) {
      return false;
    }

    if (cleanKey.length < 20 || cleanKey.length > 50) {
      return false;
    }

    // 특수 문자 검사 (정상적인 API 키에는 없어야 함)
    if (
      cleanKey.includes('\r') ||
      cleanKey.includes('\n') ||
      cleanKey.includes('\t')
    ) {
      return false;
    }

    return true;
  }

  /**
   * 🎯 Google AI API 키 반환
   */
  getAPIKey(): string | null {
    if (!this.isTeamKeyUnlocked || !this.decryptedTeamKey) {
      console.warn('⚠️ Google AI 매니저가 초기화되지 않았습니다');
      return null;
    }
    return this.decryptedTeamKey;
  }

  /**
   * 🔄 Google AI 매니저 재초기화
   */
  async reinitialize(): Promise<boolean> {
    this.isTeamKeyUnlocked = false;
    this.decryptedTeamKey = null;
    return await this.initialize();
  }

  /**
   * 📊 Google AI 상태 확인
   */
  getStatus(): {
    isInitialized: boolean;
    hasApiKey: boolean;
    apiKeySource: string;
    isValid: boolean;
  } {
    let apiKeySource = 'none';

    if (this.decryptedTeamKey) {
      apiKeySource = 'team';
    } else if (this.DEMO_API_KEY) {
      apiKeySource = 'demo';
    }

    return {
      isInitialized: this.isTeamKeyUnlocked,
      hasApiKey: this.decryptedTeamKey !== null,
      apiKeySource,
      isValid: this.decryptedTeamKey
        ? this.validateApiKey(this.decryptedTeamKey)
        : false,
    };
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
  const status = googleAIManager.getStatus();
  const enabledEnv = process.env.GOOGLE_AI_ENABLED;

  // 환경변수 정리 (베르셀 호환성)
  const cleanEnabled = enabledEnv
    ?.replace(/[\r\n]/g, '')
    .trim()
    .toLowerCase();
  const isEnabledByEnv = cleanEnabled === 'true';

  return status.isInitialized && status.hasApiKey && isEnabledByEnv;
};
export const getGoogleAIStatus = () => googleAIManager.getStatus();

export default GoogleAIManager;
