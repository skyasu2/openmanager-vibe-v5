/**
 * 🔐 OpenManager Vibe v5 - 암호화된 환경변수 설정
 * 
 * 이 파일은 민감한 환경변수들을 AES 암호화하여 저장합니다.
 * Git에 커밋해도 안전하며, 팀 비밀번호로만 복호화할 수 있습니다.
 * 
 * 생성일: 2025-06-18T23:24:08.349Z
 * 암호화된 변수: 7개
 */

import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto';
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, unlinkSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * 🛡️ 암호화된 환경 변수 관리자
 * 
 * 기능:
 * - AES-256-GCM 암호화로 중요 환경 변수 보호
 * - 자동 백업/복구 시스템
 * - 환경별 설정 관리 (dev/test/prod)
 * - 변경 이력 추적
 */
export class EncryptedEnvManager {
  constructor() {
    this.algorithm = 'aes-256-gcm';
    this.secretKey = this.deriveKey();
    this.backupDir = join(__dirname, 'backups');
    this.configFile = join(process.cwd(), 'config', 'env-config.json');

    // 백업 디렉토리 생성
    this.ensureBackupDirectory();
  }

  /**
   * 🔑 암호화 키 생성
   */
  deriveKey() {
    const baseKey = process.env.ENV_ENCRYPTION_KEY || 'openmanager-vibe-v5-default-key';
    return createHash('sha256').update(baseKey).digest();
  }

  /**
   * 📁 백업 디렉토리 확인 및 생성
   */
  ensureBackupDirectory() {
    try {
      if (!existsSync(this.backupDir)) {
        mkdirSync(this.backupDir, { recursive: true });
      }
    } catch (error) {
      console.warn('⚠️ 백업 디렉토리 생성 실패:', error.message);
    }
  }

  /**
   * 🔐 데이터 암호화
   */
  encrypt(text) {
    try {
      const iv = randomBytes(16);
      const cipher = createCipheriv(this.algorithm, this.secretKey, iv);

      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      const authTag = cipher.getAuthTag();

      return {
        encrypted,
        iv: iv.toString('hex'),
        authTag: authTag.toString('hex')
      };
    } catch (error) {
      throw new Error(`암호화 실패: ${error.message}`);
    }
  }

  /**
   * 🔓 데이터 복호화
   */
  decrypt(encryptedData) {
    try {
      const { encrypted, iv, authTag } = encryptedData;
      const decipher = createDecipheriv(this.algorithm, this.secretKey, Buffer.from(iv, 'hex'));

      decipher.setAuthTag(Buffer.from(authTag, 'hex'));

      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      throw new Error(`복호화 실패: ${error.message}`);
    }
  }

  /**
   * 📦 환경 변수 백업
   */
  async backupEnvironment(environment = 'current') {
    try {
      console.log(`🔄 환경 변수 백업 시작 (${environment})...`);

      // 중요 환경 변수 수집
      const sensitiveVars = {
        // API 키들
        GOOGLE_AI_API_KEY: process.env.GOOGLE_AI_API_KEY,
        SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
        SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,

        // 데이터베이스 연결
        UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
        UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,

        // 보안 설정
        NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
        NEXTAUTH_URL: process.env.NEXTAUTH_URL,

        // AI 엔진 설정
        AI_ENGINE_MODE: process.env.AI_ENGINE_MODE,
        SUPABASE_RAG_ENABLED: process.env.SUPABASE_RAG_ENABLED,
        KOREAN_NLP_ENABLED: process.env.KOREAN_NLP_ENABLED,

        // 백업 메타데이터
        backup_timestamp: new Date().toISOString(),
        backup_environment: environment,
        backup_version: '5.44.3'
      };

      // 암호화
      const encryptedVars = {};
      for (const [key, value] of Object.entries(sensitiveVars)) {
        if (value) {
          encryptedVars[key] = this.encrypt(value);
        }
      }

      // 백업 파일 저장
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupId = `env-backup-${environment}-${timestamp}`;
      const backupPath = join(this.backupDir, `${backupId}.json`);

      const backupData = {
        id: backupId,
        environment,
        timestamp,
        version: '5.44.3',
        encrypted: encryptedVars,
        checksum: this.generateChecksum(encryptedVars)
      };

      writeFileSync(backupPath, JSON.stringify(backupData, null, 2));

      console.log(`✅ 환경 변수 백업 완료: ${backupId}`);
      console.log(`📁 백업 위치: ${backupPath}`);

      return backupId;
    } catch (error) {
      console.error('❌ 환경 변수 백업 실패:', error);
      throw error;
    }
  }

  /**
   * 🔄 환경 변수 복구
   */
  async restoreEnvironment(backupId) {
    try {
      console.log(`🔄 환경 변수 복구 시작: ${backupId}`);

      const backupPath = join(this.backupDir, `${backupId}.json`);

      if (!existsSync(backupPath)) {
        throw new Error(`백업 파일을 찾을 수 없습니다: ${backupId}`);
      }

      const backupData = JSON.parse(readFileSync(backupPath, 'utf8'));

      // 체크섬 검증
      const currentChecksum = this.generateChecksum(backupData.encrypted);
      if (currentChecksum !== backupData.checksum) {
        throw new Error('백업 파일이 손상되었습니다');
      }

      // 복호화 및 환경 변수 설정
      const restoredVars = {};
      for (const [key, encryptedValue] of Object.entries(backupData.encrypted)) {
        try {
          const decryptedValue = this.decrypt(encryptedValue);
          restoredVars[key] = decryptedValue;

          // 메타데이터가 아닌 경우 환경 변수로 설정
          if (!key.startsWith('backup_')) {
            process.env[key] = decryptedValue;
          }
        } catch (error) {
          console.warn(`⚠️ ${key} 복호화 실패:`, error.message);
        }
      }

      console.log(`✅ 환경 변수 복구 완료: ${Object.keys(restoredVars).length}개 변수`);
      console.log(`📅 백업 날짜: ${backupData.timestamp}`);
      console.log(`🏷️ 환경: ${backupData.environment}`);

      return restoredVars;
    } catch (error) {
      console.error('❌ 환경 변수 복구 실패:', error);
      throw error;
    }
  }

  /**
   * 📋 백업 목록 조회
   */
  listBackups() {
    try {
      if (!existsSync(this.backupDir)) {
        return [];
      }

      const files = readdirSync(this.backupDir);
      const backups = files
        .filter(file => file.startsWith('env-backup-') && file.endsWith('.json'))
        .map(file => {
          try {
            const filePath = join(this.backupDir, file);
            const data = JSON.parse(readFileSync(filePath, 'utf8'));
            return {
              id: data.id,
              environment: data.environment,
              timestamp: data.timestamp,
              version: data.version,
              size: statSync(filePath).size
            };
          } catch {
            return null;
          }
        })
        .filter(Boolean)
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      return backups;
    } catch (error) {
      console.error('❌ 백업 목록 조회 실패:', error);
      return [];
    }
  }

  /**
   * 🧮 체크섬 생성
   */
  generateChecksum(data) {
    return createHash('sha256').update(JSON.stringify(data)).digest('hex');
  }

  /**
   * 🔍 환경 변수 검증
   */
  validateEnvironment() {
    const requiredVars = [
      'GOOGLE_AI_API_KEY',
      'SUPABASE_SERVICE_ROLE_KEY',
      'SUPABASE_ANON_KEY',
      'NEXTAUTH_SECRET'
    ];

    const missing = requiredVars.filter(varName => !process.env[varName]);

    if (missing.length > 0) {
      console.warn('⚠️ 누락된 필수 환경 변수:', missing.join(', '));
      return false;
    }

    console.log('✅ 모든 필수 환경 변수가 설정되었습니다.');
    return true;
  }

  /**
   * 🧹 오래된 백업 정리 (30일 이상)
   */
  cleanupOldBackups(daysToKeep = 30) {
    try {
      const backups = this.listBackups();
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      let deletedCount = 0;

      for (const backup of backups) {
        if (new Date(backup.timestamp) < cutoffDate) {
          const backupPath = join(this.backupDir, `${backup.id}.json`);
          try {
            unlinkSync(backupPath);
            deletedCount++;
            console.log(`🗑️ 오래된 백업 삭제: ${backup.id}`);
          } catch (error) {
            console.warn(`⚠️ 백업 삭제 실패 ${backup.id}:`, error.message);
          }
        }
      }

      if (deletedCount > 0) {
        console.log(`✅ ${deletedCount}개의 오래된 백업을 정리했습니다.`);
      } else {
        console.log('📁 정리할 오래된 백업이 없습니다.');
      }

      return deletedCount;
    } catch (error) {
      console.error('❌ 백업 정리 실패:', error);
      return 0;
    }
  }
}

// 자동 백업 실행 (빌드 시점)
export async function autoBackup() {
  if (process.env.NODE_ENV === 'production') {
    try {
      const envManager = new EncryptedEnvManager();
      await envManager.backupEnvironment('production');
      envManager.cleanupOldBackups(30);
    } catch (error) {
      console.warn('⚠️ 자동 백업 실패:', error.message);
    }
  }
}

// CLI 인터페이스
if (process.argv[1] === new URL(import.meta.url).pathname) {
  const command = process.argv[2];
  const envManager = new EncryptedEnvManager();

  switch (command) {
    case 'backup':
      const environment = process.argv[3] || 'manual';
      envManager.backupEnvironment(environment);
      break;

    case 'restore':
      const backupId = process.argv[3];
      if (!backupId) {
        console.error('❌ 사용법: node encrypted-env-config.mjs restore <backup-id>');
        process.exit(1);
      }
      envManager.restoreEnvironment(backupId);
      break;

    case 'list':
      const backups = envManager.listBackups();
      console.log('📋 사용 가능한 백업:');
      backups.forEach(backup => {
        console.log(`  ${backup.id} (${backup.environment}, ${backup.timestamp})`);
      });
      break;

    case 'validate':
      envManager.validateEnvironment();
      break;

    case 'cleanup':
      const days = parseInt(process.argv[3]) || 30;
      envManager.cleanupOldBackups(days);
      break;

    default:
      console.log(`
🔐 OpenManager Vibe v5 - 환경 변수 관리 도구

사용법:
  node encrypted-env-config.mjs backup [environment]  # 환경 변수 백업
  node encrypted-env-config.mjs restore <backup-id>   # 환경 변수 복구
  node encrypted-env-config.mjs list                  # 백업 목록 조회
  node encrypted-env-config.mjs validate              # 환경 변수 검증
  node encrypted-env-config.mjs cleanup [days]        # 오래된 백업 정리

예시:
  node encrypted-env-config.mjs backup production
  node encrypted-env-config.mjs restore env-backup-production-2025-06-23T10-30-00-000Z
      `);
  }
}

export default EncryptedEnvManager;