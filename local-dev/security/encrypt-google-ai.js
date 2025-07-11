#!/usr/bin/env node

/* eslint-disable @typescript-eslint/no-require-imports */
// Node.js 스크립트이므로 require 사용 허용

/**
 * Google AI API 키 암호화 도구
 * 팀 협업을 위한 안전한 API 키 저장소
 *
 * 사용법:
 * node scripts/encrypt-google-ai.js
 *
 * 이 스크립트는:
 * 1. Google AI API 키를 입력받습니다
 * 2. 팀 비밀번호를 설정합니다
 * 3. API 키를 AES 암호화합니다
 * 4. src/config/google-ai-config.ts 파일을 생성/수정합니다
 */

const crypto = require('crypto');
const CryptoJS = require('crypto-js');
const readline = require('readline');
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

function createInterface() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
}

// 비밀번호 입력 (숨김 처리)
function hiddenQuestion(query) {
  return new Promise(resolve => {
    const stdin = process.stdin;
    const stdout = process.stdout;

    stdout.write(query);
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding('utf8');

    let password = '';

    stdin.on('data', function (ch) {
      ch = ch + '';

      switch (ch) {
        case '\n':
        case '\r':
        case '\u0004': // Ctrl+D
          stdin.setRawMode(false);
          stdin.pause();
          stdout.write('\n');
          resolve(password);
          break;
        case '\u0003': // Ctrl+C
          stdout.write('\n');
          process.exit();
          break;
        case '\u007f': // Backspace
          if (password.length > 0) {
            password = password.slice(0, -1);
            stdout.write('\b \b');
          }
          break;
        default:
          password += ch;
          stdout.write('*');
          break;
      }
    });
  });
}

// 일반 질문
function question(query) {
  return new Promise(resolve => {
    const rl = createInterface();
    rl.question(query, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

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

// 비밀번호 유효성 검사
function validatePassword(password) {
  if (!password || typeof password !== 'string') {
    return false;
  }

  const trimmed = password.trim();

  if (trimmed.length < 4) {
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
  const configPath = path.join(__dirname, '../src/config/google-ai-config.ts');

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
    `${colors.bright}${colors.blue}🔐 Google AI API 키 암호화 도구${colors.reset}\n`
  );
  console.log(
    `${colors.cyan}이 도구는 Google AI Studio API 키를 안전하게 암호화하여 Git에 저장할 수 있도록 합니다.${colors.reset}\n`
  );

  try {
    // 1. API 키 입력
    let apiKey;
    while (true) {
      apiKey = await question(
        `${colors.yellow}Google AI Studio API 키를 입력하세요:${colors.reset} `
      );

      if (validateAPIKey(apiKey)) {
        break;
      } else {
        console.log(
          `${colors.red}❌ 올바르지 않은 API 키 형식입니다. (AIza로 시작해야 하며, 20-50자 사이여야 합니다)${colors.reset}`
        );
      }
    }

    // 2. 팀 비밀번호 설정
    let password;
    while (true) {
      password = await hiddenQuestion(
        `${colors.yellow}팀 비밀번호를 설정하세요 (4자 이상):${colors.reset} `
      );

      if (validatePassword(password)) {
        break;
      } else {
        console.log(
          `${colors.red}❌ 비밀번호는 4자 이상이어야 합니다.${colors.reset}`
        );
      }
    }

    // 3. 비밀번호 확인
    const confirmPassword = await hiddenQuestion(
      `${colors.yellow}비밀번호를 다시 입력하세요:${colors.reset} `
    );

    if (password.trim() !== confirmPassword.trim()) {
      console.log(
        `${colors.red}❌ 비밀번호가 일치하지 않습니다.${colors.reset}`
      );
      process.exit(1);
    }

    console.log(
      `\n${colors.green}✅ 입력이 완료되었습니다. 암호화를 시작합니다...${colors.reset}`
    );

    // 4. 암호화 실행
    const encryptedConfig = encryptAPIKey(apiKey.trim(), password.trim());

    if (!encryptedConfig) {
      console.log(`${colors.red}❌ 암호화에 실패했습니다.${colors.reset}`);
      process.exit(1);
    }

    // 5. 복호화 테스트
    console.log(`${colors.blue}🧪 복호화 테스트 중...${colors.reset}`);
    const testResult = testDecryption(encryptedConfig, password.trim());

    if (!testResult) {
      console.log(
        `${colors.red}❌ 복호화 테스트에 실패했습니다.${colors.reset}`
      );
      process.exit(1);
    }

    // 6. 설정 파일 생성
    console.log(`${colors.blue}📁 설정 파일을 생성 중...${colors.reset}`);
    const fileResult = generateConfigFile(encryptedConfig);

    if (!fileResult) {
      console.log(
        `${colors.red}❌ 설정 파일 생성에 실패했습니다.${colors.reset}`
      );
      process.exit(1);
    }

    // 7. 완료 메시지
    console.log(
      `\n${colors.bright}${colors.green}🎉 Google AI 키 암호화가 완료되었습니다!${colors.reset}\n`
    );

    console.log(`${colors.cyan}📋 생성된 파일:${colors.reset}`);
    console.log(
      `   ${colors.magenta}src/config/google-ai-config.ts${colors.reset}`
    );

    console.log(`\n${colors.cyan}🚀 다음 단계:${colors.reset}`);
    console.log(`   1. git add src/config/google-ai-config.ts`);
    console.log(`   2. git commit -m "Google AI 키 암호화 설정 추가"`);
    console.log(
      `   3. 팀원들에게 비밀번호 공유: ${colors.bright}${password.trim()}${colors.reset}`
    );

    console.log(`\n${colors.yellow}💡 사용법:${colors.reset}`);
    console.log(`   - 웹에서 Google AI 기능 사용 시 비밀번호 입력 요구`);
    console.log(`   - 개인 환경변수 GOOGLE_AI_API_KEY 설정 시 비밀번호 불필요`);
  } catch (error) {
    console.error(
      `\n${colors.red}❌ 오류가 발생했습니다:${colors.reset}`,
      error.message
    );
    process.exit(1);
  } finally {
    // 더 이상 rl.close() 필요 없음
  }
}

// 스크립트 실행
if (require.main === module) {
  main();
}
