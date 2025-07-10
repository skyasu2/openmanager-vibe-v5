#!/usr/bin/env node

/**
 * 🔓 단일 환경변수 복호화 스크립트
 * 특정 환경변수만 복호화하여 출력
 * 
 * 사용법: node scripts/decrypt-single-var.mjs VARIABLE_NAME [password]
 */

import { createDecipheriv, pbkdf2Sync } from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// CLI 인자 파싱
const varName = process.argv[2];
const password = process.argv[3] || process.env.ENV_MASTER_PASSWORD || 'openmanager2025';

if (!varName) {
  console.error('Usage: node decrypt-single-var.mjs VARIABLE_NAME [password]');
  process.exit(1);
}

// 설정
const CONFIG = {
  algorithm: 'aes-256-gcm',
  iterations: 100000,
  keyLength: 32,
};

/**
 * 값 복호화
 */
function decryptValue(encryptedData, password) {
  try {
    const { encrypted, salt, iv, authTag } = encryptedData;

    const key = pbkdf2Sync(
      password,
      Buffer.from(salt, 'hex'),
      CONFIG.iterations,
      CONFIG.keyLength,
      'sha256'
    );

    const decipher = createDecipheriv(
      CONFIG.algorithm,
      key,
      Buffer.from(iv, 'hex')
    );

    decipher.setAuthTag(Buffer.from(authTag, 'hex'));

    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(encrypted, 'base64')),
      decipher.final(),
    ]);

    return decrypted.toString('utf8');
  } catch (error) {
    throw new Error(`Decryption failed: ${error.message}`);
  }
}

async function main() {
  try {
    // 암호화된 설정 파일 로드
    const configPath = path.join(__dirname, '..', 'config', 'encrypted-env-config.ts');
    
    if (!fs.existsSync(configPath)) {
      throw new Error('Encrypted config file not found');
    }

    // TypeScript 파일 읽기
    const configContent = fs.readFileSync(configPath, 'utf8');
    
    // ENCRYPTED_ENV_CONFIG JSON 부분만 추출
    const jsonMatch = configContent.match(/export const ENCRYPTED_ENV_CONFIG[^=]*=\s*({[\s\S]*?})\s*;/);
    if (!jsonMatch) {
      throw new Error('Could not parse config file');
    }

    // JSON 파싱
    const configObject = JSON.parse(jsonMatch[1]);
    
    // 요청된 변수 찾기
    if (!configObject.variables[varName]) {
      throw new Error(`Variable ${varName} not found in encrypted config`);
    }

    // 복호화
    const decryptedValue = decryptValue(configObject.variables[varName], password);
    
    // stdout으로 출력 (오류 메시지는 stderr로)
    process.stdout.write(decryptedValue);
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}

main();