#!/usr/bin/env node
/**
 * 통합 환경변수 관리 도구
 *
 * 통합된 기능:
 * - decrypt-env-vars.mjs
 * - decrypt-single-var.mjs
 * - encryption-manager.js
 * - unified-encrypt-env.mjs
 * - env-management.js
 */

import { promises as fs } from 'fs';
import { createCipher, createDecipher, randomBytes } from 'crypto';

class UnifiedEnvManager {
  constructor() {
    this.encryptionKey = process.env.ENCRYPTION_KEY || 'default-key-change-me';
    this.envBackupPath = 'config/env-backups';
  }

  encrypt(text, key = this.encryptionKey) {
    const cipher = createCipher('aes192', key);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  }

  decrypt(encryptedText, key = this.encryptionKey) {
    const decipher = createDecipher('aes192', key);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  async backupEnvFile() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = `${this.envBackupPath}/env-backup-${timestamp}.json`;

    try {
      const envContent = await fs.readFile('.env.local', 'utf8');
      const envVars = {};

      envContent.split('\n').forEach(line => {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length) {
          envVars[key.trim()] = valueParts.join('=').trim();
        }
      });

      await fs.mkdir(this.envBackupPath, { recursive: true });
      await fs.writeFile(backupFile, JSON.stringify(envVars, null, 2));

      console.log(`✅ 환경변수 백업 완료: ${backupFile}`);
      return backupFile;
    } catch (error) {
      console.error('백업 실패:', error.message);
      return null;
    }
  }

  async encryptEnvFile() {
    try {
      const envContent = await fs.readFile('.env.local', 'utf8');
      const encryptedContent = this.encrypt(envContent);

      await fs.writeFile('.env.local.encrypted', encryptedContent);
      console.log('✅ 환경변수 파일 암호화 완료');
      return true;
    } catch (error) {
      console.error('암호화 실패:', error.message);
      return false;
    }
  }

  async decryptEnvFile() {
    try {
      const encryptedContent = await fs.readFile(
        '.env.local.encrypted',
        'utf8'
      );
      const decryptedContent = this.decrypt(encryptedContent);

      await fs.writeFile('.env.local', decryptedContent);
      console.log('✅ 환경변수 파일 복호화 완료');
      return true;
    } catch (error) {
      console.error('복호화 실패:', error.message);
      return false;
    }
  }

  async listEnvVars() {
    try {
      const envContent = await fs.readFile('.env.local', 'utf8');
      const lines = envContent
        .split('\n')
        .filter(line => line.trim() && !line.startsWith('#'));

      console.log('📋 현재 환경변수 목록:');
      lines.forEach((line, index) => {
        const [key] = line.split('=');
        if (key) {
          console.log(`  ${index + 1}. ${key.trim()}`);
        }
      });

      return lines.length;
    } catch (error) {
      console.error('환경변수 목록 조회 실패:', error.message);
      return 0;
    }
  }

  async setEnvVar(key, value, encrypt = false) {
    try {
      let envContent = '';
      try {
        envContent = await fs.readFile('.env.local', 'utf8');
      } catch (error) {
        // 파일이 없으면 새로 생성
      }

      const lines = envContent.split('\n');
      const keyIndex = lines.findIndex(line => line.startsWith(`${key}=`));

      const newValue = encrypt ? this.encrypt(value) : value;
      const newLine = `${key}=${newValue}`;

      if (keyIndex >= 0) {
        lines[keyIndex] = newLine;
        console.log(`✅ 환경변수 업데이트: ${key}`);
      } else {
        lines.push(newLine);
        console.log(`✅ 환경변수 추가: ${key}`);
      }

      await fs.writeFile('.env.local', lines.join('\n'));
      return true;
    } catch (error) {
      console.error('환경변수 설정 실패:', error.message);
      return false;
    }
  }

  async getEnvVar(key, decrypt = false) {
    try {
      const envContent = await fs.readFile('.env.local', 'utf8');
      const line = envContent
        .split('\n')
        .find(line => line.startsWith(`${key}=`));

      if (line) {
        const [, ...valueParts] = line.split('=');
        let value = valueParts.join('=');

        if (decrypt) {
          try {
            value = this.decrypt(value);
          } catch (error) {
            console.log('⚠️ 복호화 실패, 원본 값 반환');
          }
        }

        console.log(`${key}=${decrypt ? '[DECRYPTED]' : value}`);
        return value;
      } else {
        console.log(`❌ 환경변수를 찾을 수 없습니다: ${key}`);
        return null;
      }
    } catch (error) {
      console.error('환경변수 조회 실패:', error.message);
      return null;
    }
  }
}

// CLI 실행
if (process.argv[1] === import.meta.url.replace('file://', '')) {
  const envManager = new UnifiedEnvManager();
  const command = process.argv[2];
  const args = process.argv.slice(3);

  try {
    switch (command) {
      case 'list':
        await envManager.listEnvVars();
        break;

      case 'get':
        const [getKey, decryptFlag] = args;
        await envManager.getEnvVar(getKey, decryptFlag === '--decrypt');
        break;

      case 'set':
        const [setKey, setValue, encryptFlag] = args;
        await envManager.setEnvVar(
          setKey,
          setValue,
          encryptFlag === '--encrypt'
        );
        break;

      case 'backup':
        await envManager.backupEnvFile();
        break;

      case 'encrypt':
        await envManager.encryptEnvFile();
        break;

      case 'decrypt':
        await envManager.decryptEnvFile();
        break;

      default:
        console.log('🔐 통합 환경변수 관리 도구 사용법:');
        console.log(
          '  node unified-env-manager.mjs list                    # 환경변수 목록'
        );
        console.log(
          '  node unified-env-manager.mjs get KEY [--decrypt]     # 환경변수 조회'
        );
        console.log(
          '  node unified-env-manager.mjs set KEY VALUE [--encrypt] # 환경변수 설정'
        );
        console.log(
          '  node unified-env-manager.mjs backup                  # 백업 생성'
        );
        console.log(
          '  node unified-env-manager.mjs encrypt                 # 파일 암호화'
        );
        console.log(
          '  node unified-env-manager.mjs decrypt                 # 파일 복호화'
        );
        break;
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ 오류:', error.message);
    process.exit(1);
  }
}

export default UnifiedEnvManager;
