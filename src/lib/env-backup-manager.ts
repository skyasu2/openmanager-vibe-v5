/**
 * 🔧 OpenManager Vibe v5 - 환경변수 백업 및 긴급 복구 시스템
 *
 * 기능:
 * - 중요 환경변수 백업 및 복구
 * - 헬스체크 통합 자동 복구
 * - 보안 암호화 저장
 * - 복구 로깅 및 알림
 */

import { AILogger, LogCategory } from '@/services/ai/logging/AILogger';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

export interface EnvBackupConfig {
  critical: string[];
  important: string[];
  optional: string[];
  defaults: Record<string, string>;
}

export interface EnvBackupEntry {
  key: string;
  value: string;
  encrypted: boolean;
  priority: 'critical' | 'important' | 'optional';
  lastUpdated: string;
}

export interface EnvBackupData {
  version: string;
  created: string;
  lastBackup: string;
  entries: EnvBackupEntry[];
  checksum: string;
}

export class EnvBackupManager {
  private static instance: EnvBackupManager;
  private logger: AILogger;
  private backupPath: string;
  private encryptionKey: string;

  private config: EnvBackupConfig = {
    critical: [
      'NEXT_PUBLIC_SUPABASE_URL',
      'SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY',
      'NODE_ENV',
    ],
    important: [
      'REDIS_URL',
      'REDIS_TOKEN',
      'UPSTASH_REDIS_REST_URL',
      'UPSTASH_REDIS_REST_TOKEN',
      'GOOGLE_AI_API_KEY',
      'POSTGRES_URL',
    ],
    optional: [
      'SLACK_WEBHOOK_URL',
      'GOOGLE_AI_DAILY_LIMIT',
      'GOOGLE_AI_RPM_LIMIT',
      'CRON_SECRET',
    ],
    defaults: {
      NODE_ENV: 'development',
      NEXT_TELEMETRY_DISABLED: '1',
      SKIP_ENV_VALIDATION: 'true',
      GOOGLE_AI_BETA_MODE: 'true',
      GOOGLE_AI_ENABLED: 'true',
      GOOGLE_AI_DAILY_LIMIT: '10000',
      GOOGLE_AI_RPM_LIMIT: '100',
      DEVELOPMENT_MODE: 'true',
      LOCAL_DEVELOPMENT: 'true',
    },
  };

  private constructor() {
    this.logger = AILogger.getInstance();
    this.backupPath = path.join(
      this.getSafeWorkingDirectory(),
      'config',
      'env-backup.json'
    );
    this.encryptionKey = this.generateEncryptionKey();
    this.ensureBackupDirectory();
  }

  public static getInstance(): EnvBackupManager {
    if (!EnvBackupManager.instance) {
      EnvBackupManager.instance = new EnvBackupManager();
    }
    return EnvBackupManager.instance;
  }

  /**
   * 🔐 암호화 키 생성
   */
  private generateEncryptionKey(): string {
    const baseKey = process.env.CRON_SECRET || 'openmanager-vibe-v5-backup';
    return crypto
      .createHash('sha256')
      .update(baseKey)
      .digest('hex')
      .slice(0, 32);
  }

  /**
   * 📁 백업 디렉토리 확인 및 생성
   */
  private ensureBackupDirectory(): void {
    const configDir = path.dirname(this.backupPath);
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }
  }

  /**
   * 🔒 민감한 값 암호화
   */
  private encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', this.encryptionKey, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  }

  /**
   * 🔓 암호화된 값 복호화
   */
  private decrypt(encryptedText: string): string {
    try {
      const [ivHex, encrypted] = encryptedText.split(':');
      const iv = Buffer.from(ivHex, 'hex');
      const decipher = crypto.createDecipheriv(
        'aes-256-cbc',
        this.encryptionKey,
        iv
      );
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (error) {
      this.logger.logError(
        'EnvBackupManager',
        LogCategory.SYSTEM,
        `복호화 실패: ${(error as Error).message}`,
        { encryptedText }
      );
      return '';
    }
  }

  /**
   * 🔍 환경변수 우선순위 확인
   */
  private getEnvPriority(key: string): 'critical' | 'important' | 'optional' {
    if (this.config.critical.includes(key)) return 'critical';
    if (this.config.important.includes(key)) return 'important';
    return 'optional';
  }

  /**
   * 🔐 민감한 환경변수인지 확인
   */
  private isSensitive(key: string): boolean {
    const sensitivePatterns = ['KEY', 'SECRET', 'TOKEN', 'PASSWORD', 'WEBHOOK'];
    return sensitivePatterns.some(pattern => key.includes(pattern));
  }

  /**
   * 💾 현재 환경변수 백업
   */
  public async createBackup(): Promise<boolean> {
    try {
      const entries: EnvBackupEntry[] = [];
      const allEnvKeys = [
        ...this.config.critical,
        ...this.config.important,
        ...this.config.optional,
      ];

      for (const key of allEnvKeys) {
        const value = process.env[key];
        if (value) {
          const shouldEncrypt = this.isSensitive(key);
          entries.push({
            key,
            value: shouldEncrypt ? this.encrypt(value) : value,
            encrypted: shouldEncrypt,
            priority: this.getEnvPriority(key),
            lastUpdated: new Date().toISOString(),
          });
        }
      }

      const backupData: EnvBackupData = {
        version: '1.0.0',
        created: new Date().toISOString(),
        lastBackup: new Date().toISOString(),
        entries,
        checksum: this.generateChecksum(entries),
      };

      fs.writeFileSync(this.backupPath, JSON.stringify(backupData, null, 2));

      await this.logger.info(
        LogCategory.SYSTEM,
        `✅ 환경변수 백업 완료: ${entries.length}개 변수 저장`,
        {
          backupPath: this.backupPath,
          entriesCount: entries.length,
          criticalCount: entries.filter(e => e.priority === 'critical').length,
          importantCount: entries.filter(e => e.priority === 'important')
            .length,
        }
      );

      return true;
    } catch (error) {
      await this.logger.logError(
        'EnvBackupManager',
        LogCategory.SYSTEM,
        `백업 생성 실패: ${(error as Error).message}`,
        { backupPath: this.backupPath }
      );
      return false;
    }
  }

  /**
   * 🔍 체크섬 생성
   */
  private generateChecksum(entries: EnvBackupEntry[]): string {
    const data = entries.map(e => `${e.key}:${e.value}`).join('|');
    return crypto.createHash('md5').update(data).digest('hex');
  }

  /**
   * 🔍 환경변수 유효성 검증
   */
  public validateEnvironment(): {
    isValid: boolean;
    missing: string[];
    invalid: string[];
    priority: 'critical' | 'important' | 'optional' | 'ok';
  } {
    const missing: string[] = [];
    const invalid: string[] = [];

    // Critical 환경변수 검증
    for (const key of this.config.critical) {
      const value = process.env[key];
      if (!value) {
        missing.push(key);
      } else if (key.includes('URL') && !this.isValidUrl(value)) {
        invalid.push(key);
      }
    }

    // Important 환경변수 검증
    for (const key of this.config.important) {
      const value = process.env[key];
      if (!value) {
        missing.push(key);
      }
    }

    const hasCriticalIssues =
      missing.some(key => this.config.critical.includes(key)) ||
      invalid.some(key => this.config.critical.includes(key));
    const hasImportantIssues =
      missing.some(key => this.config.important.includes(key)) ||
      invalid.some(key => this.config.important.includes(key));

    let priority: 'critical' | 'important' | 'optional' | 'ok' = 'ok';
    if (hasCriticalIssues) priority = 'critical';
    else if (hasImportantIssues) priority = 'important';
    else if (missing.length > 0 || invalid.length > 0) priority = 'optional';

    return {
      isValid: missing.length === 0 && invalid.length === 0,
      missing,
      invalid,
      priority,
    };
  }

  /**
   * 🔗 URL 유효성 검증
   */
  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 🚨 긴급 복구 실행
   */
  public async emergencyRestore(
    priority: 'critical' | 'important' | 'all' = 'critical'
  ): Promise<{
    success: boolean;
    restored: string[];
    failed: string[];
    message: string;
  }> {
    try {
      if (!fs.existsSync(this.backupPath)) {
        return {
          success: false,
          restored: [],
          failed: [],
          message: '백업 파일이 존재하지 않습니다',
        };
      }

      const backupData: EnvBackupData = JSON.parse(
        fs.readFileSync(this.backupPath, 'utf8')
      );
      const restored: string[] = [];
      const failed: string[] = [];

      // 우선순위에 따른 복구
      const targetEntries = backupData.entries.filter(entry => {
        if (priority === 'all') return true;
        if (priority === 'important')
          return ['critical', 'important'].includes(entry.priority);
        return entry.priority === 'critical';
      });

      for (const entry of targetEntries) {
        try {
          const value = entry.encrypted
            ? this.decrypt(entry.value)
            : entry.value;
          if (value) {
            // .env.local 파일에 추가
            await this.appendToEnvFile(entry.key, value);
            // 런타임 환경변수 설정
            process.env[entry.key] = value;
            restored.push(entry.key);
          } else {
            failed.push(entry.key);
          }
        } catch (error) {
          failed.push(entry.key);
          await this.logger.logError(
            'EnvBackupManager',
            LogCategory.SYSTEM,
            `환경변수 복구 실패: ${entry.key}`,
            { error: (error as Error).message }
          );
        }
      }

      // 기본값 설정
      for (const [key, defaultValue] of Object.entries(this.config.defaults)) {
        if (!process.env[key]) {
          await this.appendToEnvFile(key, defaultValue);
          process.env[key] = defaultValue;
          restored.push(`${key} (기본값)`);
        }
      }

      const message = `복구 완료: ${restored.length}개 성공, ${failed.length}개 실패`;

      await this.logger.info(
        LogCategory.SYSTEM,
        `🚨 긴급 환경변수 복구 실행: ${message}`,
        {
          priority,
          restored,
          failed,
          totalEntries: targetEntries.length,
        }
      );

      return {
        success: failed.length === 0,
        restored,
        failed,
        message,
      };
    } catch (error) {
      const errorMessage = `긴급 복구 실패: ${(error as Error).message}`;
      await this.logger.logError(
        'EnvBackupManager',
        LogCategory.SYSTEM,
        errorMessage
      );
      return {
        success: false,
        restored: [],
        failed: [],
        message: errorMessage,
      };
    }
  }

  /**
   * 📝 .env.local 파일에 환경변수 추가
   */
  private async appendToEnvFile(key: string, value: string): Promise<void> {
    const envPath = path.join(process.cwd(), '.env.local');
    const envLine = `${key}=${value}\n`;

    try {
      // 기존 파일 읽기
      let existingContent = '';
      if (fs.existsSync(envPath)) {
        existingContent = fs.readFileSync(envPath, 'utf8');
      }

      // 이미 존재하는 키인지 확인
      const keyRegex = new RegExp(`^${key}=`, 'm');
      if (keyRegex.test(existingContent)) {
        // 기존 값 업데이트
        existingContent = existingContent.replace(
          new RegExp(`^${key}=.*$`, 'm'),
          `${key}=${value}`
        );
        fs.writeFileSync(envPath, existingContent);
      } else {
        // 새 키 추가
        fs.appendFileSync(envPath, envLine);
      }
    } catch (error) {
      throw new Error(`환경변수 파일 업데이트 실패: ${(error as Error).message}`);
    }
  }

  /**
   * 🔍 백업 상태 확인
   */
  public getBackupStatus(): {
    exists: boolean;
    lastBackup?: string;
    entriesCount?: number;
    isValid?: boolean;
  } {
    try {
      if (!fs.existsSync(this.backupPath)) {
        return { exists: false };
      }

      const backupData: EnvBackupData = JSON.parse(
        fs.readFileSync(this.backupPath, 'utf8')
      );
      const currentChecksum = this.generateChecksum(backupData.entries);

      return {
        exists: true,
        lastBackup: backupData.lastBackup,
        entriesCount: backupData.entries.length,
        isValid: currentChecksum === backupData.checksum,
      };
    } catch (error) {
      return { exists: false };
    }
  }

  /**
   * 🛡️ Edge Runtime 호환 작업 디렉토리 가져오기
   */
  private getSafeWorkingDirectory(): string {
    try {
      // 테스트 환경에서는 고정 경로 사용
      if (
        process.env.NODE_ENV === 'test' ||
        process.env.TEST_CONTEXT === 'true'
      ) {
        return process.env.PWD || '/test-workspace';
      }

      // process.cwd가 함수인지 확인
      if (typeof process.cwd === 'function') {
        return process.cwd();
      }

      // 폴백: 환경변수 또는 기본값
      return process.env.PWD || process.env.INIT_CWD || '/app';
    } catch (error) {
      console.warn('⚠️ process.cwd() 접근 실패, 기본 경로 사용:', error);
      return '/app';
    }
  }
}

export default EnvBackupManager;
