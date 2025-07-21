#!/usr/bin/env node

/**
 * 🔓 환경변수 복호화 스크립트
 * OpenManager Vibe v5
 */

import CryptoJS from 'crypto-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 팀 비밀번호 (CLI 인자에서 받기)
const TEAM_PASSWORD = process.argv[2] || 'openmanager2025';

/**
 * 값 복호화
 */
function decryptValue(encryptedData, password) {
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
    throw new Error(`복호화 실패: ${error.message}`);
  }
}

/**
 * 암호화된 설정 파일에서 환경변수 복호화
 */
async function decryptEnvironmentVars() {
  try {
    console.log('🔓 환경변수 복호화 시작...');

    // 암호화된 설정 파일 로드
    const configPath = path.join(
      __dirname,
      '..',
      'config',
      'encrypted-env-config.mjs'
    );

    if (!fs.existsSync(configPath)) {
      throw new Error('암호화된 설정 파일을 찾을 수 없습니다.');
    }

    // 동적 import로 설정 파일 로드
    const configUrl = `file://${configPath}`;
    const { ENCRYPTED_ENV_CONFIG } = await import(configUrl);

    // 비밀번호 검증
    const passwordHash = CryptoJS.SHA256(TEAM_PASSWORD).toString();
    if (passwordHash !== ENCRYPTED_ENV_CONFIG.teamPasswordHash) {
      throw new Error('팀 비밀번호가 올바르지 않습니다.');
    }

    console.log('✅ 팀 비밀번호 인증 성공');

    // 모든 환경변수 복호화
    const decryptedVars = {};
    let successCount = 0;

    for (const [varName, encryptedData] of Object.entries(
      ENCRYPTED_ENV_CONFIG.variables
    )) {
      try {
        const decryptedValue = decryptValue(encryptedData, TEAM_PASSWORD);
        decryptedVars[varName] = decryptedValue;
        successCount++;

        // 민감한 정보는 일부만 표시
        const displayValue =
          varName.includes('TOKEN') || varName.includes('KEY')
            ? `${decryptedValue.substring(0, 10)}...`
            : decryptedValue;

        console.log(`✅ ${varName}: ${displayValue}`);
      } catch (error) {
        console.error(`❌ ${varName}: 복호화 실패 - ${error.message}`);
      }
    }

    // .env 파일 생성
    const envContent = Object.entries(decryptedVars)
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');

    const envPath = path.join(__dirname, '..', '.env.decrypted');
    fs.writeFileSync(envPath, envContent, 'utf8');

    console.log(`\n🎉 총 ${successCount}개 환경변수 복호화 완료!`);
    console.log(`📁 저장 위치: ${envPath}`);
    console.log(`⚠️  보안을 위해 사용 후 .env.decrypted 파일을 삭제하세요.`);

    return decryptedVars;
  } catch (error) {
    console.error('❌ 복호화 실패:', error.message);
    process.exit(1);
  }
}

/**
 * 특정 환경변수만 복호화
 */
async function decryptSpecificVar(varName) {
  try {
    console.log(`🔍 ${varName} 복호화 시도 중...`);

    const configPath = path.join(
      __dirname,
      '..',
      'config',
      'encrypted-env-config.mjs'
    );
    const configUrl = `file://${configPath}`;
    const { ENCRYPTED_ENV_CONFIG } = await import(configUrl);

    const passwordHash = CryptoJS.SHA256(TEAM_PASSWORD).toString();
    if (passwordHash !== ENCRYPTED_ENV_CONFIG.teamPasswordHash) {
      throw new Error('팀 비밀번호가 올바르지 않습니다.');
    }

    console.log('✅ 팀 비밀번호 인증 성공');

    if (!ENCRYPTED_ENV_CONFIG.variables[varName]) {
      throw new Error(`환경변수 ${varName}을 찾을 수 없습니다.`);
    }

    const decryptedValue = decryptValue(
      ENCRYPTED_ENV_CONFIG.variables[varName],
      TEAM_PASSWORD
    );
    console.log(`${varName}=${decryptedValue}`);

    return decryptedValue;
  } catch (error) {
    console.error('❌ 복호화 실패:', error.message);
    process.exit(1);
  }
}

// CLI 사용법
function showUsage() {
  console.log(`
🔓 환경변수 복호화 스크립트 사용법:

전체 복호화:
  node scripts/decrypt-env-vars.mjs [팀비밀번호]

특정 변수 복호화:
  node scripts/decrypt-env-vars.mjs [팀비밀번호] [변수명]

예시:
  node scripts/decrypt-env-vars.mjs openmanager2025
  node scripts/decrypt-env-vars.mjs openmanager2025 UPSTASH_REDIS_REST_TOKEN
`);
}

// 스크립트 실행
const varName = process.argv[3];

if (process.argv.includes('--help') || process.argv.includes('-h')) {
  showUsage();
} else if (varName) {
  decryptSpecificVar(varName);
} else {
  decryptEnvironmentVars();
}
