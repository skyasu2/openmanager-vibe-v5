/**
 * 🔐 서버 전용 환경변수 관리 시스템
 *
 * 이 파일은 서버 사이드에서만 실행되며, 클라이언트에서는 절대 import되지 않습니다.
 * Next.js의 서버 컴포넌트와 API 라우트에서만 사용됩니다.
 */

import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from 'crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

// 서버 사이드 체크 (런타임 보안)
if (typeof window !== 'undefined') {
  throw new Error(
    '🚨 server-only-env.ts는 서버 사이드 전용입니다. 클라이언트에서 import할 수 없습니다.'
  );
}

interface EncryptedEnvVar {
  encrypted: string;
  iv: string;
  authTag: string;
  salt: string;
}

interface EnvBackupData {
  id: string;
  timestamp: string;
  version: string;
  encrypted: Record<string, EncryptedEnvVar>;
  checksum: string;
}

export class ServerEnvironmentManager {
  private static instance: ServerEnvironmentManager;
  private readonly algorithm = 'aes-256-gcm';
  private readonly backupDir: string;
  private readonly teamPassword: string;
  private readonly masterKey: string;

  private constructor() {
    this.teamPassword =
      process.env.ENV_ENCRYPTION_KEY || 'openmanager-vibe-v5-default-key';
    this.backupDir = join(process.cwd(), 'config', 'env-backups');
    this.masterKey =
      process.env.ENV_ENCRYPTION_KEY || 'openmanager-vibe-v5-default-key';
    this.ensureBackupDirectory();
  }

  static getInstance(): ServerEnvironmentManager {
    if (!ServerEnvironmentManager.instance) {
      ServerEnvironmentManager.instance = new ServerEnvironmentManager();
    }
    return ServerEnvironmentManager.instance;
  }

  /**
   * 🔐 텍스트 암호화
   */
  private encrypt(text: string): EncryptedEnvVar {
    try {
      const salt = randomBytes(32);
      const key = createHash('sha256')
        .update(this.masterKey + salt.toString('hex'))
        .digest();
      const iv = randomBytes(16);

      const cipher = createCipheriv(this.algorithm, key, iv);
      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      const authTag = cipher.getAuthTag();

      return {
        encrypted,
        iv: iv.toString('hex'),
        authTag: authTag.toString('hex'),
        salt: salt.toString('hex'),
      };
    } catch (error) {
      console.error('❌ 암호화 실패:', error);
      throw new Error(
        `암호화 실패: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * 🔓 텍스트 복호화
   */
  private decrypt(encryptedData: EncryptedEnvVar): string {
    try {
      const key = createHash('sha256')
        .update(this.masterKey + encryptedData.salt)
        .digest();
      const decipher = createDecipheriv(
        this.algorithm,
        key,
        Buffer.from(encryptedData.iv, 'hex')
      );

      decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));

      let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      console.error('❌ 복호화 실패:', error);
      throw new Error(
        `복호화 실패: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * 📁 백업 디렉토리 생성
   */
  private ensureBackupDirectory(): void {
    try {
      if (!existsSync(this.backupDir)) {
        mkdirSync(this.backupDir, { recursive: true });
      }
    } catch (error) {
      console.warn('⚠️ 백업 디렉토리 생성 실패:', error);
    }
  }

  /**
   * 📦 환경변수 백업
   */
  async backupEnvironment(environment = 'current'): Promise<string | null> {
    try {
      console.log(`🔄 환경변수 백업 시작 (${environment})...`);

      const sensitiveVars = {
        GOOGLE_AI_API_KEY: process.env.GOOGLE_AI_API_KEY,
        SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
        SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
        UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
        UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
        NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
        NEXTAUTH_URL: process.env.NEXTAUTH_URL,
      };

      const encryptedVars: Record<string, EncryptedEnvVar> = {};
      for (const [key, value] of Object.entries(sensitiveVars)) {
        if (value) {
          encryptedVars[key] = this.encrypt(value);
        }
      }

      const timestamp = new Date().toISOString();
      const backupId = `env-backup-${environment}-${timestamp.replace(/[:.]/g, '-')}`;

      const backupData: EnvBackupData = {
        id: backupId,
        timestamp,
        version: '5.44.0',
        encrypted: encryptedVars,
        checksum: this.generateChecksum(encryptedVars),
      };

      const backupPath = join(this.backupDir, `${backupId}.json`);
      writeFileSync(backupPath, JSON.stringify(backupData, null, 2));

      console.log(`✅ 환경변수 백업 완료: ${backupId}`);
      return backupId;
    } catch (error) {
      console.error('❌ 환경변수 백업 실패:', error);
      return null;
    }
  }

  /**
   * 🔄 환경변수 복구
   */
  async restoreEnvironment(
    backupId: string
  ): Promise<Record<string, string> | null> {
    try {
      console.log(`🔄 환경변수 복구 시작: ${backupId}`);

      const backupPath = join(this.backupDir, `${backupId}.json`);
      if (!existsSync(backupPath)) {
        throw new Error(`백업 파일을 찾을 수 없습니다: ${backupId}`);
      }

      const backupData: EnvBackupData = JSON.parse(
        readFileSync(backupPath, 'utf8')
      );

      // 체크섬 검증
      const currentChecksum = this.generateChecksum(backupData.encrypted);
      if (currentChecksum !== backupData.checksum) {
        throw new Error('백업 파일이 손상되었습니다');
      }

      const restoredVars: Record<string, string> = {};
      for (const [key, encryptedValue] of Object.entries(
        backupData.encrypted
      )) {
        try {
          const decryptedValue = this.decrypt(encryptedValue);
          restoredVars[key] = decryptedValue;
          process.env[key] = decryptedValue;
        } catch (error) {
          console.warn(`⚠️ ${key} 복호화 실패:`, error);
        }
      }

      console.log(
        `✅ 환경변수 복구 완료: ${Object.keys(restoredVars).length}개 변수`
      );
      return restoredVars;
    } catch (error) {
      console.error('❌ 환경변수 복구 실패:', error);
      return null;
    }
  }

  /**
   * 🧮 체크섬 생성
   */
  private generateChecksum(data: Record<string, EncryptedEnvVar>): string {
    return createHash('sha256').update(JSON.stringify(data)).digest('hex');
  }

  /**
   * 🔍 환경변수 검증
   */
  validateEnvironment(): { valid: boolean; missing: string[] } {
    const requiredVars = [
      'GOOGLE_AI_API_KEY',
      'SUPABASE_SERVICE_ROLE_KEY',
      'SUPABASE_ANON_KEY',
    ];

    const missing = requiredVars.filter(varName => !process.env[varName]);

    if (missing.length > 0) {
      console.warn('⚠️ 누락된 필수 환경변수:', missing.join(', '));
      return { valid: false, missing };
    }

    console.log('✅ 모든 필수 환경변수가 설정되었습니다.');
    return { valid: true, missing: [] };
  }
}

/**
 * 🔧 서버 전용 환경변수 관리자 인스턴스
 */
export const serverEnvManager = ServerEnvironmentManager.getInstance();
