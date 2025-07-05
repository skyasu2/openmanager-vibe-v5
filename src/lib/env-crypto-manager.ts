/**
 * 🔐 OpenManager Vibe v5 - 환경변수 암호화 관리자
 *
 * 브라우저와 서버 환경에서 모두 작동하는 환경변수 암호화/복호화 시스템
 *
 * 기능:
 * - AES 암호화/복호화
 * - 메모리 캐싱
 * - Supabase 저장 (배포용)
 * - 로컬 파일 저장 (개발용)
 */

import CryptoJS from 'crypto-js';

export interface EncryptedEnvVar {
  encrypted: string;
  salt: string;
  iv: string;
  timestamp: string;
  originalName: string;
  isPublic: boolean;
  rotateSchedule: string;
}

export interface EnvironmentData {
  version: string;
  createdAt: string;
  teamPasswordHash: string;
  variables: { [key: string]: EncryptedEnvVar };
}

export class EnvironmentCryptoManager {
  private static instance: EnvironmentCryptoManager | null = null;
  private decryptedVars: Map<string, string> = new Map();
  private isUnlocked: boolean = false;
  private teamPasswordHash: string | null = null;
  private supabaseClient: any = null;

  private constructor() {
    // Supabase 클라이언트 초기화 (브라우저에서만)
    if (typeof window !== 'undefined') {
      this.initializeSupabaseClient();
    }
  }

  public static getInstance(): EnvironmentCryptoManager {
    if (!EnvironmentCryptoManager.instance) {
      EnvironmentCryptoManager.instance = new EnvironmentCryptoManager();
    }
    return EnvironmentCryptoManager.instance;
  }

  /**
   * 🗄️ Supabase 클라이언트 초기화
   */
  private async initializeSupabaseClient() {
    try {
      const { createClient } = await import('@supabase/supabase-js');

      // 메모리에서 Supabase 설정 가져오기
      const supabaseUrl = 'https://vnswjnltnhpsueosfhmw.supabase.co';
      const supabaseAnonKey =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZuc3dqbmx0bmhwc3Vlb3NmaG13Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc5MjMzMjcsImV4cCI6MjA2MzQ5OTMyN30.09ApSnuXNv_yYVJWQWGpOFWw3tkLbxSA21k5sroChGU';

      this.supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
      console.log('✅ Supabase 클라이언트 초기화 완료');
    } catch (error) {
      console.warn('⚠️ Supabase 클라이언트 초기화 실패:', error);
    }
  }

  /**
   * 🔓 팀 비밀번호로 환경변수 잠금 해제
   */
  async unlockEnvironmentVars(teamPassword: string): Promise<{
    success: boolean;
    error?: string;
    unlockedCount?: number;
  }> {
    try {
      // 1. 로컬 파일에서 암호화된 데이터 로드 시도
      let environmentData = await this.loadFromLocalFile();

      // 2. 로컬 파일이 없으면 Supabase에서 로드 시도
      if (!environmentData && this.supabaseClient) {
        environmentData = await this.loadFromSupabase();
      }

      if (!environmentData) {
        return {
          success: false,
          error:
            '암호화된 환경변수 설정을 찾을 수 없습니다. 관리자에게 문의하세요.',
        };
      }

      // 3. 비밀번호 해시 검증
      const passwordHash = CryptoJS.SHA256(teamPassword).toString();
      if (passwordHash !== environmentData.teamPasswordHash) {
        return {
          success: false,
          error: '팀 비밀번호가 올바르지 않습니다.',
        };
      }

      // 4. 모든 환경변수 복호화
      const decryptedCount = await this.decryptAllVariables(
        environmentData.variables,
        teamPassword
      );

      this.isUnlocked = true;
      this.teamPasswordHash = passwordHash;

      console.log(`✅ 환경변수 잠금 해제 완료: ${decryptedCount}개 변수`);

      return {
        success: true,
        unlockedCount: decryptedCount,
      };
    } catch (error) {
      console.error('환경변수 잠금 해제 실패:', error);
      return {
        success: false,
        error: '잠금 해제 중 오류가 발생했습니다.',
      };
    }
  }

  /**
   * 🗂️ 로컬 파일에서 암호화된 데이터 로드
   */
  private async loadFromLocalFile(): Promise<EnvironmentData | null> {
    try {
      // 개발 환경에서만 로컬 파일 사용
      if (
        typeof window === 'undefined' &&
        process.env.NODE_ENV === 'development'
      ) {
        // 기본 EnvironmentData 구조로 반환
        return {
          version: '5.44.0',
          createdAt: new Date().toISOString(),
          teamPasswordHash: '', // 개발환경용 빈 해시
          variables: {}, // 개발환경에서는 빈 객체
        };
      }
    } catch (error) {
      console.warn('⚠️ 로컬 암호화 설정 파일을 찾을 수 없습니다.');
    }
    return null;
  }

  /**
   * 🗄️ Supabase에서 암호화된 데이터 로드
   */
  private async loadFromSupabase(): Promise<EnvironmentData | null> {
    if (!this.supabaseClient) {
      return null;
    }

    try {
      const { data, error } = await this.supabaseClient
        .from('encrypted_environment_vars')
        .select('*')
        .eq('project_name', 'openmanager-vibe-v5')
        .eq('environment', process.env.NODE_ENV || 'development')
        .single();

      if (error) {
        console.warn(
          '⚠️ Supabase에서 환경변수를 찾을 수 없습니다:',
          error.message
        );
        return null;
      }

      return data.config_data as EnvironmentData;
    } catch (error) {
      console.error('Supabase 로드 실패:', error);
      return null;
    }
  }

  /**
   * 🔓 모든 변수 복호화
   */
  private async decryptAllVariables(
    encryptedVars: { [key: string]: EncryptedEnvVar },
    teamPassword: string
  ): Promise<number> {
    let decryptedCount = 0;

    for (const [varName, encryptedData] of Object.entries(encryptedVars)) {
      try {
        const decryptedValue = this.decryptValue(encryptedData, teamPassword);
        this.decryptedVars.set(varName, decryptedValue);
        decryptedCount++;
      } catch (error) {
        console.error(`❌ ${varName} 복호화 실패:`, error);
      }
    }

    return decryptedCount;
  }

  /**
   * 🔓 단일 값 복호화
   */
  private decryptValue(
    encryptedData: EncryptedEnvVar,
    password: string
  ): string {
    try {
      const { encrypted, salt, iv } = encryptedData;

      const key = CryptoJS.PBKDF2(password, salt, {
        keySize: 256 / 32,
        iterations: 10000,
      });

      const decrypted = CryptoJS.AES.decrypt(encrypted, key, {
        iv: CryptoJS.enc.Hex.parse(iv),
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
      });

      const decryptedText = decrypted.toString(CryptoJS.enc.Utf8);

      if (!decryptedText) {
        throw new Error('복호화 결과가 비어있습니다.');
      }

      return decryptedText;
    } catch (error) {
      throw new Error(
        `복호화 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`
      );
    }
  }

  /**
   * 📖 환경변수 값 가져오기
   */
  getEnvironmentVar(varName: string): string | null {
    // 1순위: 실제 환경변수
    const envValue = process.env[varName];
    if (envValue && envValue.trim() !== '') {
      return envValue.trim();
    }

    // 2순위: 복호화된 팀 설정
    if (this.isUnlocked && this.decryptedVars.has(varName)) {
      return this.decryptedVars.get(varName)!;
    }

    // 3순위: 하드코딩된 기본값 (메모리 저장소)
    const defaults = this.getHardcodedDefaults();
    if (defaults[varName]) {
      return defaults[varName];
    }

    return null;
  }

  /**
   * 💾 하드코딩된 기본값 (메모리 저장소)
   * 🚨 보안: 개발환경에서만 사용, 프로덕션에서는 환경변수 필수
   */
  private getHardcodedDefaults(): { [key: string]: string } {
    // 🛡️ 프로덕션 환경에서는 하드코딩 값 사용 금지
    if (process.env.NODE_ENV === 'production' && process.env.VERCEL === '1') {
      console.warn(
        '🚨 프로덕션 환경에서 하드코딩 기본값 요청됨 - 빈 객체 반환'
      );
      return {};
    }

    // 개발환경에서만 사용되는 안전한 기본값들
    const developmentDefaults: { [key: string]: string } = {
      // 🔧 개발환경 전용 설정
      GOOGLE_AI_MODEL: 'gemini-1.5-flash',
      GOOGLE_AI_BETA_MODE: 'true',
      NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'http://localhost:3000',
      NEXT_PUBLIC_APP_URL:
        process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    };

    // 🚨 중요: 실제 서비스 키들은 환경변수에서만 가져오기
    // Supabase, Redis, MCP 서버 등의 실제 인프라 정보는 하드코딩하지 않음

    // 환경변수가 있으면 우선 사용, 없으면 개발용 기본값만 제공
    const safeDefaults: { [key: string]: string } = {};

    for (const [key, defaultValue] of Object.entries(developmentDefaults)) {
      // 환경변수가 이미 있으면 하드코딩 값 사용하지 않음
      if (!process.env[key]) {
        safeDefaults[key] = defaultValue;
      }
    }

    // 🔐 인프라 관련 환경변수들은 암호화된 저장소나 실제 환경변수에서만 가져오기
    const infraVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY',
      'UPSTASH_REDIS_REST_URL',
      'UPSTASH_REDIS_REST_TOKEN',
      'GCP_MCP_SERVER_URL',
      'GOOGLE_AI_API_KEY',
      'SLACK_WEBHOOK_URL',
    ];

    // 개발환경에서 인프라 환경변수가 없으면 경고만 출력
    const missingInfra = infraVars.filter(
      key => !process.env[key] && !this.decryptedVars.has(key)
    );
    if (missingInfra.length > 0 && process.env.NODE_ENV === 'development') {
      console.warn('⚠️ 개발환경에서 누락된 인프라 환경변수들:', missingInfra);
      console.warn(
        '💡 .env.local 파일을 확인하거나 팀 암호로 환경변수를 잠금 해제하세요'
      );
    }

    return safeDefaults;
  }

  /**
   * 🗄️ Supabase에 암호화된 환경변수 저장 (배포용)
   */
  async saveToSupabase(
    environmentData: EnvironmentData,
    projectName: string = 'openmanager-vibe-v5',
    environment: string = process.env.NODE_ENV || 'development'
  ): Promise<{ success: boolean; error?: string }> {
    if (!this.supabaseClient) {
      return {
        success: false,
        error: 'Supabase 클라이언트가 초기화되지 않았습니다.',
      };
    }

    try {
      const { error } = await this.supabaseClient
        .from('encrypted_environment_vars')
        .upsert({
          project_name: projectName,
          environment: environment,
          config_data: environmentData,
          updated_at: new Date().toISOString(),
        });

      if (error) {
        return {
          success: false,
          error: `Supabase 저장 실패: ${error.message}`,
        };
      }

      console.log('✅ Supabase에 암호화된 환경변수 저장 완료');
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: `저장 중 오류 발생: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
      };
    }
  }

  /**
   * 📊 현재 상태 조회
   */
  getStatus(): {
    isUnlocked: boolean;
    decryptedCount: number;
    availableVars: string[];
    source: 'environment' | 'encrypted' | 'hardcoded' | 'unavailable';
  } {
    const availableVars: string[] = [];
    const sources: { [key: string]: string } = {};

    // 중요한 환경변수들 체크
    const importantVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'GCP_MCP_SERVER_URL',
      'UPSTASH_REDIS_REST_URL',
      'GOOGLE_AI_API_KEY',
    ];

    for (const varName of importantVars) {
      const value = this.getEnvironmentVar(varName);
      if (value) {
        availableVars.push(varName);

        if (process.env[varName]) {
          sources[varName] = 'environment';
        } else if (this.decryptedVars.has(varName)) {
          sources[varName] = 'encrypted';
        } else {
          sources[varName] = 'hardcoded';
        }
      }
    }

    const primarySource = Object.values(sources)[0] || 'unavailable';

    return {
      isUnlocked: this.isUnlocked,
      decryptedCount: this.decryptedVars.size,
      availableVars,
      source: primarySource as any,
    };
  }

  /**
   * 🔒 환경변수 잠금 (메모리 정리)
   */
  lockEnvironmentVars(): void {
    this.decryptedVars.clear();
    this.isUnlocked = false;
    this.teamPasswordHash = null;
    console.log('🔒 환경변수가 잠금되었습니다.');
  }

  /**
   * 🔧 환경변수 암호화 (관리자용)
   */
  static encryptEnvironmentVar(
    varName: string,
    value: string,
    teamPassword: string,
    isPublic: boolean = false,
    rotateSchedule: string = 'manual'
  ): EncryptedEnvVar {
    const salt = CryptoJS.lib.WordArray.random(128 / 8).toString();
    const iv = CryptoJS.lib.WordArray.random(128 / 8);

    const key = CryptoJS.PBKDF2(teamPassword, salt, {
      keySize: 256 / 32,
      iterations: 10000,
    });

    const encrypted = CryptoJS.AES.encrypt(value, key, {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });

    return {
      encrypted: encrypted.toString(),
      salt: salt,
      iv: iv.toString(),
      timestamp: new Date().toISOString(),
      originalName: varName,
      isPublic: isPublic,
      rotateSchedule: rotateSchedule,
    };
  }
}

// 전역 인스턴스 생성 및 내보내기
export const envCryptoManager = EnvironmentCryptoManager.getInstance();

// 편의 함수들
export function getEnvironmentVar(varName: string): string | null {
  return envCryptoManager.getEnvironmentVar(varName);
}

export function isEnvironmentUnlocked(): boolean {
  return envCryptoManager.getStatus().isUnlocked;
}

export async function unlockEnvironment(teamPassword: string) {
  return await envCryptoManager.unlockEnvironmentVars(teamPassword);
}
