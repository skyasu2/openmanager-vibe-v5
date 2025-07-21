#!/usr/bin/env node

/* eslint-disable @typescript-eslint/no-require-imports */
const crypto = require('crypto');
const CryptoJS = require('crypto-js');
const fs = require('fs');
const path = require('path');

// 콘솔 색상
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

// 새로운 Google AI API 키와 팀 비밀번호
const NEW_API_KEY = 'SENSITIVE_INFO_REMOVED';
const TEAM_PASSWORD = 'team2025secure';

// API 키 유효성 검사
function validateAPIKey(apiKey) {
  if (!apiKey || typeof apiKey !== 'string') {
    return false;
  }

  const trimmed = apiKey.trim();

  // Google AI Studio API 키 형식 검사
  if (!trimmed.startsWith('AIza')) {
    return false;
  }

  if (trimmed.length < 20 || trimmed.length > 50) {
    return false;
  }

  return true;
}

// API 키 암호화
function encryptAPIKey(apiKey, password) {
  try {
    // 랜덤 솔트와 IV 생성
    const salt = CryptoJS.lib.WordArray.random(128 / 8).toString();
    const iv = CryptoJS.lib.WordArray.random(128 / 8);

    // 비밀번호와 솔트로 키 생성
    const key = CryptoJS.PBKDF2(password, salt, {
      keySize: 256 / 32,
      iterations: 10000,
    });

    // API 키 암호화
    const encrypted = CryptoJS.AES.encrypt(apiKey, key, {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });

    return {
      encryptedKey: encrypted.toString(),
      salt: salt,
      iv: iv.toString(),
      createdAt: new Date().toISOString(),
      version: '1.0.0',
    };
  } catch (error) {
    console.error(`${colors.red}암호화 오류:${colors.reset}`, error.message);
    return null;
  }
}

// 설정 파일 생성
function generateConfigFile(encryptedConfig) {
  const configPath = path.join(
    __dirname,
    '../../src/config/google-ai-config.ts'
  );

  const configContent = `/**
 * Google AI API 키 암호화 설정
 * 
 * 이 파일은 암호화된 Google AI API 키를 저장합니다.
 * Git에 커밋해도 안전하며, 팀 비밀번호로만 복호화할 수 있습니다.
 * 
 * 구조:
 * - encryptedKey: AES 암호화된 Google AI API 키
 * - salt: 암호화에 사용된 솔트
 * - iv: 초기화 벡터
 */

export interface GoogleAIEncryptedConfig {
  encryptedKey: string;
  salt: string;
  iv: string;
  createdAt: string;
  version: string;
}

/**
 * 암호화된 Google AI 설정
 * 이 값들은 encrypt-google-ai.js 스크립트로 생성됩니다.
 */
export const ENCRYPTED_GOOGLE_AI_CONFIG: GoogleAIEncryptedConfig = ${JSON.stringify(encryptedConfig, null, 2)};

// 개발 환경에서만 사용되는 기본 설정 (암호화되지 않음)
export const DEV_CONFIG = {
  isProduction: process.env.NODE_ENV === 'production',
  useEncryption: process.env.NODE_ENV === 'production' || process.env.FORCE_ENCRYPTION === 'true'
};`;

  try {
    fs.writeFileSync(configPath, configContent, 'utf8');
    return true;
  } catch (error) {
    console.error(`${colors.red}파일 쓰기 오류:${colors.reset}`, error.message);
    return false;
  }
}

// 복호화 테스트
function testDecryption(encryptedConfig, password) {
  try {
    const { encryptedKey, salt, iv } = encryptedConfig;

    // 비밀번호와 솔트로 키 생성
    const key = CryptoJS.PBKDF2(password, salt, {
      keySize: 256 / 32,
      iterations: 10000,
    });

    // 복호화 시도
    const decrypted = CryptoJS.AES.decrypt(encryptedKey, key, {
      iv: CryptoJS.enc.Hex.parse(iv),
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });

    const decryptedText = decrypted.toString(CryptoJS.enc.Utf8);
    return decryptedText && decryptedText.startsWith('AIza');
  } catch (error) {
    return false;
  }
}

// 메인 함수
async function main() {
  console.log(
    `${colors.bright}${colors.blue}🔐 Google AI API 키 암호화 도구 (간단 버전)${colors.reset}\n`
  );

  console.log(`${colors.cyan}새로운 API 키: ${NEW_API_KEY}${colors.reset}`);
  console.log(`${colors.cyan}팀 비밀번호: ${TEAM_PASSWORD}${colors.reset}\n`);

  try {
    // 1. API 키 유효성 검사
    if (!validateAPIKey(NEW_API_KEY)) {
      console.log(
        `${colors.red}❌ 올바르지 않은 API 키 형식입니다.${colors.reset}`
      );
      process.exit(1);
    }

    console.log(`${colors.green}✅ API 키 형식이 올바릅니다.${colors.reset}`);

    // 2. 암호화 실행
    console.log(`${colors.blue}🔒 암호화를 시작합니다...${colors.reset}`);
    const encryptedConfig = encryptAPIKey(NEW_API_KEY, TEAM_PASSWORD);

    if (!encryptedConfig) {
      console.log(`${colors.red}❌ 암호화에 실패했습니다.${colors.reset}`);
      process.exit(1);
    }

    console.log(`${colors.green}✅ 암호화가 완료되었습니다.${colors.reset}`);

    // 3. 복호화 테스트
    console.log(`${colors.blue}🧪 복호화 테스트 중...${colors.reset}`);
    const testResult = testDecryption(encryptedConfig, TEAM_PASSWORD);

    if (!testResult) {
      console.log(
        `${colors.red}❌ 복호화 테스트에 실패했습니다.${colors.reset}`
      );
      process.exit(1);
    }

    console.log(
      `${colors.green}✅ 복호화 테스트가 성공했습니다.${colors.reset}`
    );

    // 4. 설정 파일 생성
    console.log(`${colors.blue}📁 설정 파일을 생성 중...${colors.reset}`);
    const fileResult = generateConfigFile(encryptedConfig);

    if (!fileResult) {
      console.log(
        `${colors.red}❌ 설정 파일 생성에 실패했습니다.${colors.reset}`
      );
      process.exit(1);
    }

    // 5. 완료 메시지
    console.log(
      `\n${colors.bright}${colors.green}🎉 Google AI 키 암호화가 완료되었습니다!${colors.reset}\n`
    );

    console.log(`${colors.cyan}📋 생성된 파일:${colors.reset}`);
    console.log(
      `   ${colors.magenta}src/config/google-ai-config.ts${colors.reset}`
    );

    console.log(`\n${colors.cyan}🔑 암호화 정보:${colors.reset}`);
    console.log(
      `   팀 비밀번호: ${colors.bright}${TEAM_PASSWORD}${colors.reset}`
    );
    console.log(`   생성 시간: ${encryptedConfig.createdAt}`);
    console.log(`   버전: ${encryptedConfig.version}`);

    console.log(`\n${colors.cyan}🚀 다음 단계:${colors.reset}`);
    console.log(`   1. git add src/config/google-ai-config.ts`);
    console.log(`   2. git commit -m "Google AI 키 암호화 설정 업데이트"`);
    console.log(`   3. Vercel 환경 변수 업데이트 필요`);
  } catch (error) {
    console.error(
      `\n${colors.red}❌ 오류가 발생했습니다:${colors.reset}`,
      error.message
    );
    process.exit(1);
  }
}

// 스크립트 실행
if (require.main === module) {
  main();
}
