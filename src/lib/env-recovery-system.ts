/**
 * 🔧 통합 환경변수 복구 시스템 v3.0
 * OpenManager Vibe v5 - 기존 암호화 복호화 기능 통합
 */

import { EnvBackupManager } from './env-backup-manager';
import { EnvironmentCryptoManager } from './env-crypto-manager';

export interface EnvRecoveryResult {
  success: boolean;
  recovered: string[];
  failed: string[];
  method: 'encrypted' | 'backup' | 'defaults' | 'mixed';
  message: string;
  timestamp: string;
}

export class IntegratedEnvRecoverySystem {
  private static instance: IntegratedEnvRecoverySystem;
  private envCryptoManager: EnvironmentCryptoManager;
  private envBackupManager: EnvBackupManager;

  private constructor() {
    this.envCryptoManager = EnvironmentCryptoManager.getInstance();
    this.envBackupManager = EnvBackupManager.getInstance();
  }

  public static getInstance(): IntegratedEnvRecoverySystem {
    if (!IntegratedEnvRecoverySystem.instance) {
      IntegratedEnvRecoverySystem.instance = new IntegratedEnvRecoverySystem();
    }
    return IntegratedEnvRecoverySystem.instance;
  }

  async recoverEnvironmentVariables(
    missingVars: string[]
  ): Promise<EnvRecoveryResult> {
    const result: EnvRecoveryResult = {
      success: false,
      recovered: [],
      failed: [...missingVars],
      method: 'mixed',
      message: '복구 시작',
      timestamp: new Date().toISOString(),
    };

    try {
      // 1단계: 암호화된 백업에서 복구 시도
      const encryptedResult = await this.tryEncryptedRecovery(missingVars);
      result.recovered.push(...encryptedResult.recovered);
      result.failed = result.failed.filter(
        v => !encryptedResult.recovered.includes(v)
      );

      // 2단계: 로컬 백업에서 복구 시도
      if (result.failed.length > 0) {
        const backupResult = await this.tryBackupRecovery(result.failed);
        result.recovered.push(...backupResult.recovered);
        result.failed = result.failed.filter(
          v => !backupResult.recovered.includes(v)
        );
      }

      result.success = result.recovered.length > 0;
      result.message = `복구 완료: ${result.recovered.length}개 성공, ${result.failed.length}개 실패`;

      return result;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : '알 수 없는 오류';
      return {
        ...result,
        success: false,
        message: `복구 실패: ${errorMessage}`,
      };
    }
  }

  private async tryEncryptedRecovery(
    missingVars: string[]
  ): Promise<{ recovered: string[] }> {
    const recovered: string[] = [];
    const defaultPasswords = [
      'openmanager-vibe-v5-2025',
      process.env.CRON_SECRET || 'openmanager-vibe-v5-backup',
      'team-password-2025',
    ];

    for (const password of defaultPasswords) {
      try {
        const unlockResult =
          await this.envCryptoManager.unlockEnvironmentVars(password);
        if (unlockResult.success) {
          for (const varName of missingVars) {
            const value = this.envCryptoManager.getEnvironmentVar(varName);
            if (value && value.trim() !== '') {
              process.env[varName] = value;
              recovered.push(varName);
            }
          }
          if (recovered.length > 0) break;
        }
      } catch {
        continue;
      }
    }

    return { recovered };
  }

  private async tryBackupRecovery(
    missingVars: string[]
  ): Promise<{ recovered: string[] }> {
    try {
      const backupResult =
        await this.envBackupManager.emergencyRestore('critical');
      const recovered = missingVars.filter(varName =>
        backupResult.restored.includes(varName)
      );
      return { recovered };
    } catch {
      return { recovered: [] };
    }
  }

  async quickRecover(): Promise<EnvRecoveryResult> {
    const criticalVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'SUPABASE_SERVICE_ROLE_KEY',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    ];

    const missingVars = criticalVars.filter(
      varName => !process.env[varName] || process.env[varName]?.trim() === ''
    );

    if (missingVars.length === 0) {
      return {
        success: true,
        recovered: [],
        failed: [],
        method: 'mixed',
        message: '모든 환경변수가 이미 설정되어 있습니다.',
        timestamp: new Date().toISOString(),
      };
    }

    return this.recoverEnvironmentVariables(missingVars);
  }
}

export async function quickEnvRecover(): Promise<EnvRecoveryResult> {
  const recoverySystem = IntegratedEnvRecoverySystem.getInstance();
  return recoverySystem.quickRecover();
}
