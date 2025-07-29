/**
 * 🔐 암호화된 환경변수 자동 로더
 *
 * - 앱 시작 시 자동으로 암호화된 환경변수 로드
 * - Vercel 배포 환경 감지 및 자동 처리
 * - 안전한 환경변수 접근 인터페이스 제공
 */

import {
  enhancedCryptoManager,
  type EncryptedEnvConfig,
} from '@/lib/crypto/EnhancedEnvCryptoManager';

class EncryptedEnvLoader {
  private static instance: EncryptedEnvLoader;
  private _initialized = false;
  private loadError: Error | null = null;

  private constructor() {}

  static getInstance(): EncryptedEnvLoader {
    if (!EncryptedEnvLoader.instance) {
      EncryptedEnvLoader.instance = new EncryptedEnvLoader();
    }
    return EncryptedEnvLoader.instance;
  }

  /**
   * 환경변수 초기화
   */
  async _initialize(): Promise<boolean> {
    if (this._initialized) {
      return true;
    }

    try {
      // 클라이언트 사이드에서는 실행하지 않음
      if (typeof window !== 'undefined') {
        console.log('🌐 클라이언트 사이드 - 암호화된 환경변수 로드 건너뜀');
        return false;
      }

      // 마스터 비밀번호 가져오기
      const masterPassword = this.getMasterPassword();
      if (!masterPassword) {
        console.log(
          '⚠️ ENV_MASTER_PASSWORD가 설정되지 않음 - 일반 환경변수 사용'
        );
        return false;
      }

      // 암호화된 설정 로드
      const encryptedConfig = await this.loadEncryptedConfig();
      if (!encryptedConfig) {
        console.log('⚠️ 암호화된 환경변수 설정 파일 없음');
        return false;
      }

      // 마스터 키 초기화
      enhancedCryptoManager._initializeMasterKey(masterPassword);

      // 환경변수 복호화 및 로드
      enhancedCryptoManager.loadToProcess(encryptedConfig);

      this._initialized = true;
      console.log('✅ 암호화된 환경변수 로드 완료');

      // 보안을 위해 마스터 비밀번호 삭제
      if (process.env.ENV_MASTER_PASSWORD) {
        delete process.env.ENV_MASTER_PASSWORD;
      }

      return true;
    } catch (error) {
      this.loadError = error as Error;
      console.error('❌ 암호화된 환경변수 로드 실패:', error);
      return false;
    }
  }

  /**
   * 마스터 비밀번호 가져오기
   */
  private getMasterPassword(): string | undefined {
    // 1. 환경변수에서 직접 가져오기 (Vercel 등)
    if (process.env.ENV_MASTER_PASSWORD) {
      return process.env.ENV_MASTER_PASSWORD;
    }

    // 2. 파일에서 가져오기 (로컬 개발)
    if (typeof window === 'undefined') {
      try {
        const fs = require('fs');
        const path = require('path');
        const keyPath = path.join(process.cwd(), '.env.key');

        if (fs.existsSync(keyPath)) {
          return fs.readFileSync(keyPath, 'utf-8').trim();
        }
      } catch (error) {
        // 파일 읽기 실패는 무시
      }
    }

    return undefined;
  }

  /**
   * 암호화된 설정 로드
   */
  private async loadEncryptedConfig(): Promise<EncryptedEnvConfig | null> {
    try {
      // 동적 import로 설정 파일 로드
      const configModule = await import('../../../config/encrypted-env-config');
      return configModule.ENCRYPTED_ENV_CONFIG as unknown as EncryptedEnvConfig;
    } catch (error) {
      // 파일이 없거나 import 실패
      return null;
    }
  }

  /**
   * 초기화 상태 확인
   */
  isInitialized(): boolean {
    return this._initialized;
  }

  /**
   * 로드 에러 확인
   */
  getLoadError(): Error | null {
    return this.loadError;
  }

  /**
   * 안전한 환경변수 접근
   */
  getEnv(key: string): string | undefined {
    if (!this._initialized && !process.env[key]) {
      console.warn(`⚠️ 환경변수 ${key}에 접근했지만 아직 초기화되지 않음`);
    }
    return process.env[key];
  }

  /**
   * 필수 환경변수 접근 (없으면 에러)
   */
  requireEnv(key: string): string {
    const value = this.getEnv(key);
    if (!value) {
      throw new Error(`필수 환경변수 ${key}가 설정되지 않았습니다`);
    }
    return value;
  }

  /**
   * 환경변수 존재 여부 확인
   */
  hasEnv(key: string): boolean {
    return process.env[key] !== undefined;
  }
}

// 싱글톤 인스턴스
export const encryptedEnvLoader = EncryptedEnvLoader.getInstance();

/**
 * 환경변수 초기화 함수 (앱 시작 시 호출)
 */
export async function _initializeEncryptedEnv(): Promise<boolean> {
  return encryptedEnvLoader._initialize();
}

/**
 * 안전한 환경변수 접근 인터페이스
 */
export const secureEnv = {
  // Google AI
  GOOGLE_AI_API_KEY: () => encryptedEnvLoader.getEnv('GOOGLE_AI_API_KEY'),
  GOOGLE_AI_MODEL: () =>
    encryptedEnvLoader.getEnv('GOOGLE_AI_MODEL') || 'gemini-1.5-flash',

  // NextAuth
  NEXTAUTH_SECRET: () => encryptedEnvLoader.getEnv('NEXTAUTH_SECRET'),
  NEXTAUTH_URL: () => encryptedEnvLoader.getEnv('NEXTAUTH_URL'),

  // GitHub OAuth
  GITHUB_CLIENT_ID: () => encryptedEnvLoader.getEnv('GITHUB_CLIENT_ID'),
  GITHUB_CLIENT_SECRET: () => encryptedEnvLoader.getEnv('GITHUB_CLIENT_SECRET'),

  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: () =>
    encryptedEnvLoader.getEnv('NEXT_PUBLIC_SUPABASE_URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: () =>
    encryptedEnvLoader.getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
  SUPABASE_SERVICE_ROLE_KEY: () =>
    encryptedEnvLoader.getEnv('SUPABASE_SERVICE_ROLE_KEY'),

  // Redis
  UPSTASH_REDIS_REST_URL: () =>
    encryptedEnvLoader.getEnv('UPSTASH_REDIS_REST_URL'),
  UPSTASH_REDIS_REST_TOKEN: () =>
    encryptedEnvLoader.getEnv('UPSTASH_REDIS_REST_TOKEN'),

  // 기타
  NODE_ENV: () => process.env.NODE_ENV || 'development',
  NEXT_PUBLIC_APP_URL: () =>
    process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',

  // 헬퍼 메서드
  isProduction: () => process.env.NODE_ENV === 'production',
  isDevelopment: () => process.env.NODE_ENV === 'development',
  isTest: () => process.env.NODE_ENV === 'test',

  // 환경변수 검증
  validate: () => {
    const required = ['GOOGLE_AI_API_KEY', 'NEXTAUTH_SECRET'];

    const missing = required.filter(key => !encryptedEnvLoader.hasEnv(key));

    if (missing.length > 0) {
      console.error('❌ 필수 환경변수 누락:', missing.join(', '));
      return false;
    }

    return true;
  },
};

/**
 * Next.js 앱 초기화 시 자동 실행을 위한 IIFE
 * (서버 사이드에서만 실행)
 */
if (
  typeof window === 'undefined' &&
  process.env.AUTO_LOAD_ENCRYPTED_ENV !== 'false'
) {
  _initializeEncryptedEnv().catch(error => {
    console.error('환경변수 자동 로드 실패:', error);
  });
}
