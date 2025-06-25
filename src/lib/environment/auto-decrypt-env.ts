/**
 * 🔐 자동 환경변수 복호화 시스템 (서버 사이드 전용)
 *
 * 암호화된 환경변수를 자동으로 복호화하여 process.env에 설정합니다.
 * 환경변수가 누락되거나 사라져도 자동으로 복구됩니다.
 */

// 🚨 클라이언트 사이드에서는 실행하지 않음
if (typeof window !== 'undefined') {
  console.log('🌐 클라이언트 사이드 - 환경변수 복호화 건너뜀');
}

// 서버 사이드에서만 모듈 import
let crypto: any = null;
let ENCRYPTED_ENV_CONFIG: any = null;

// 서버 사이드에서만 초기화
if (typeof window === 'undefined') {
  try {
    crypto = require('crypto');
    // 빌드 시 동적 import 사용
    try {
      ENCRYPTED_ENV_CONFIG =
        require('../../../config/encrypted-env-config').ENCRYPTED_ENV_CONFIG;
    } catch (error) {
      console.warn('환경변수 자동 복호화 초기화 실패:', error);
      ENCRYPTED_ENV_CONFIG = null;
    }

    // UTF-8 콘솔 활성화 (서버 사이드에서만)
    try {
      const { enableUTF8Console } = require('@/utils/utf8-logger');
      enableUTF8Console();
      console.log('🔤 UTF-8 콘솔 활성화 완료');
    } catch (error) {
      console.warn('⚠️ UTF-8 콘솔 활성화 실패:', error);
    }
  } catch (error) {
    console.warn('⚠️ 서버 사이드 모듈 로딩 실패:', error);
  }
}

interface DecryptedEnvVars {
  [key: string]: string;
}

class AutoDecryptEnv {
  private static instance: AutoDecryptEnv;
  private decryptedVars: DecryptedEnvVars = {};
  private isInitialized = false;

  // 팀 비밀번호 (실제 환경에서는 더 안전한 방법으로 관리)
  private readonly TEAM_PASSWORD = 'OpenManager-Vibe-v5-2025';

  static getInstance(): AutoDecryptEnv {
    if (!AutoDecryptEnv.instance) {
      AutoDecryptEnv.instance = new AutoDecryptEnv();
    }
    return AutoDecryptEnv.instance;
  }

  /**
   * 자동 초기화 및 환경변수 복호화
   */
  async initialize(): Promise<void> {
    // 🚨 클라이언트 사이드에서는 실행하지 않음
    if (typeof window !== 'undefined') {
      console.log('🌐 클라이언트 사이드 - 환경변수 복호화 건너뜀');
      return;
    }

    if (this.isInitialized) {
      return;
    }

    try {
      console.log('🔐 자동 환경변수 복호화 시작...');

      // crypto 모듈이 없으면 건너뛰기
      if (!crypto) {
        console.warn('⚠️ crypto 모듈을 로드할 수 없습니다.');
        this.isInitialized = true;
        return;
      }

      // ENCRYPTED_ENV_CONFIG가 없으면 건너뛰기
      if (!ENCRYPTED_ENV_CONFIG) {
        console.warn(
          '⚠️ 암호화된 환경변수 설정을 찾을 수 없습니다. .env.local 파일을 사용합니다.'
        );
        this.isInitialized = true;
        return;
      }

      // 팀 비밀번호 검증
      const passwordHash = crypto
        .createHash('sha256')
        .update(this.TEAM_PASSWORD)
        .digest('hex');

      if (passwordHash !== ENCRYPTED_ENV_CONFIG.teamPasswordHash) {
        throw new Error('팀 비밀번호가 일치하지 않습니다.');
      }

      // 모든 암호화된 변수 복호화
      for (const [varName, encryptedVar] of Object.entries(
        ENCRYPTED_ENV_CONFIG.variables
      )) {
        try {
          const decryptedValue = this.decryptVariable(encryptedVar);
          this.decryptedVars[varName] = decryptedValue;

          // process.env에 자동 설정
          process.env[varName] = decryptedValue;

          console.log(`✅ ${varName}: 복호화 완료`);
        } catch (error) {
          console.error(`❌ ${varName}: 복호화 실패`, error);
        }
      }

      this.isInitialized = true;
      console.log(
        `🎯 총 ${Object.keys(this.decryptedVars).length}개 환경변수 복호화 완료`
      );

      // 주기적으로 환경변수 상태 점검
      this.startPeriodicCheck();
    } catch (error) {
      console.error('❌ 자동 환경변수 복호화 실패:', error);
      throw error;
    }
  }

  /**
   * 단일 변수 복호화
   */
  private decryptVariable(encryptedVar: any): string {
    // 🚨 클라이언트 사이드에서는 실행하지 않음
    if (typeof window !== 'undefined' || !crypto) {
      return '';
    }

    const { encrypted, salt, iv } = encryptedVar;

    // 키 생성 (PBKDF2)
    const key = crypto.pbkdf2Sync(
      this.TEAM_PASSWORD,
      salt,
      10000,
      32,
      'sha256'
    );

    // 복호화
    const decipher = crypto.createDecipheriv(
      'aes-256-cbc',
      key,
      Buffer.from(iv, 'hex')
    );
    let decrypted = decipher.update(encrypted, 'base64', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  /**
   * 환경변수 상태 주기적 점검 (5분마다)
   */
  private startPeriodicCheck(): void {
    // 🚨 클라이언트 사이드에서는 실행하지 않음
    if (typeof window !== 'undefined') {
      return;
    }

    setInterval(
      () => {
        this.checkAndRestoreEnvVars();
      },
      5 * 60 * 1000
    ); // 5분마다
  }

  /**
   * 환경변수 누락 점검 및 복구
   */
  private checkAndRestoreEnvVars(): void {
    // 🚨 클라이언트 사이드에서는 실행하지 않음
    if (typeof window !== 'undefined') {
      return;
    }

    let restoredCount = 0;

    for (const [varName, value] of Object.entries(this.decryptedVars)) {
      if (!process.env[varName] || process.env[varName] !== value) {
        process.env[varName] = value;
        restoredCount++;
        console.log(`🔄 ${varName}: 환경변수 복구됨`);
      }
    }

    if (restoredCount > 0) {
      console.log(`🛠️ ${restoredCount}개 환경변수 자동 복구 완료`);
    }
  }

  /**
   * 특정 환경변수 강제 복구
   */
  forceRestore(varName: string): boolean {
    // 🚨 클라이언트 사이드에서는 실행하지 않음
    if (typeof window !== 'undefined') {
      return false;
    }

    if (this.decryptedVars[varName]) {
      process.env[varName] = this.decryptedVars[varName];
      console.log(`🔄 ${varName}: 강제 복구 완료`);
      return true;
    }
    return false;
  }

  /**
   * 모든 환경변수 강제 복구
   */
  forceRestoreAll(): number {
    // 🚨 클라이언트 사이드에서는 실행하지 않음
    if (typeof window !== 'undefined') {
      return 0;
    }

    let restoredCount = 0;

    for (const [varName, value] of Object.entries(this.decryptedVars)) {
      process.env[varName] = value;
      restoredCount++;
    }

    console.log(`🔄 ${restoredCount}개 환경변수 강제 복구 완료`);
    return restoredCount;
  }

  /**
   * 현재 상태 확인
   */
  getStatus(): {
    initialized: boolean;
    decryptedCount: number;
    missingVars: string[];
    healthStatus: 'healthy' | 'warning' | 'error';
  } {
    // 🚨 클라이언트 사이드에서는 기본값 반환
    if (typeof window !== 'undefined') {
      return {
        initialized: false,
        decryptedCount: 0,
        missingVars: [],
        healthStatus: 'healthy',
      };
    }

    const missingVars: string[] = [];
    const expectedVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY',
      'UPSTASH_REDIS_REST_URL',
      'UPSTASH_REDIS_REST_TOKEN',
      'GOOGLE_AI_API_KEY',
    ];

    for (const varName of expectedVars) {
      if (!process.env[varName] && !this.decryptedVars[varName]) {
        missingVars.push(varName);
      }
    }

    let healthStatus: 'healthy' | 'warning' | 'error' = 'healthy';
    if (missingVars.length > 0) {
      healthStatus = missingVars.length > 2 ? 'error' : 'warning';
    }

    return {
      initialized: this.isInitialized,
      decryptedCount: Object.keys(this.decryptedVars).length,
      missingVars,
      healthStatus,
    };
  }
}

// 싱글톤 인스턴스 생성
const autoDecryptEnv = AutoDecryptEnv.getInstance();

export { AutoDecryptEnv };
export default autoDecryptEnv;
