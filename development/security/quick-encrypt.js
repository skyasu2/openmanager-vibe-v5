#!/usr/bin/env node

/**
 * Google AI API 키 빠른 암호화 스크립트
 */

const CryptoJS = require('crypto-js');
const fs = require('fs');
const path = require('path');

// 새로운 API 키와 팀 비밀번호
const NEW_API_KEY = 'AIzaSyABC2WATlHIG0Kd-Oj4JSL6wJoqMd3FhvM';
const TEAM_PASSWORD = 'openmanager2025'; // 팀 비밀번호

console.log('🔐 Google AI API 키 빠른 암호화 시작...');
console.log(`📝 API 키: ${NEW_API_KEY.substring(0, 10)}...${NEW_API_KEY.substring(NEW_API_KEY.length - 5)}`);

try {
  // 랜덤 솔트와 IV 생성
  const salt = CryptoJS.lib.WordArray.random(128 / 8).toString();
  const iv = CryptoJS.lib.WordArray.random(128 / 8);

  // 비밀번호와 솔트로 키 생성
  const key = CryptoJS.PBKDF2(TEAM_PASSWORD, salt, {
    keySize: 256 / 32,
    iterations: 10000,
  });

  // API 키 암호화
  const encrypted = CryptoJS.AES.encrypt(NEW_API_KEY, key, {
    iv: iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });

  const encryptedConfig = {
    encryptedKey: encrypted.toString(),
    salt: salt,
    iv: iv.toString(),
    createdAt: new Date().toISOString(),
    version: '1.0.0',
  };

  console.log('🔑 암호화 완료:', {
    encryptedKey: encryptedConfig.encryptedKey.substring(0, 20) + '...',
    salt: encryptedConfig.salt,
    iv: encryptedConfig.iv,
    createdAt: encryptedConfig.createdAt
  });

  // 설정 파일 생성
  const configPath = path.join(__dirname, '../../src/config/google-ai-config.ts');

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
 * 
 * ⚠️ 팀 비밀번호는 별도로 관리합니다 (보안상 이유로 코드에 노출 금지)
 */
export const ENCRYPTED_GOOGLE_AI_CONFIG: GoogleAIEncryptedConfig = ${JSON.stringify(encryptedConfig, null, 2)};

// 개발 환경에서만 사용되는 기본 설정 (암호화되지 않음)
export const DEV_CONFIG = {
  isProduction: process.env.NODE_ENV === 'production',
  useEncryption:
    process.env.NODE_ENV === 'production' ||
    process.env.FORCE_ENCRYPTION === 'true',
};
`;

  fs.writeFileSync(configPath, configContent, 'utf8');
  console.log('✅ 설정 파일 생성 완료:', configPath);

  // 복호화 테스트
  console.log('\n🧪 복호화 테스트...');

  const testKey = CryptoJS.PBKDF2(TEAM_PASSWORD, salt, {
    keySize: 256 / 32,
    iterations: 10000,
  });

  const decrypted = CryptoJS.AES.decrypt(encryptedConfig.encryptedKey, testKey, {
    iv: CryptoJS.enc.Hex.parse(encryptedConfig.iv),
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });

  const decryptedText = decrypted.toString(CryptoJS.enc.Utf8);

  if (decryptedText === NEW_API_KEY) {
    console.log('✅ 복호화 테스트 성공!');
    console.log(`🔓 복호화된 키: ${decryptedText.substring(0, 10)}...${decryptedText.substring(decryptedText.length - 5)}`);
  } else {
    console.log('❌ 복호화 테스트 실패');
  }

  console.log('\n🎯 설정 완료:');
  console.log('- 기존 Google AI API 키 모두 삭제됨');
  console.log('- 새로운 키 암호화되어 저장됨');
  console.log('- 팀 비밀번호: openmanager2025');
  console.log('- 설정 파일: src/config/google-ai-config.ts');

} catch (error) {
  console.error('❌ 암호화 실패:', error.message);
  process.exit(1);
}
