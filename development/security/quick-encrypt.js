#!/usr/bin/env node

/* eslint-disable @typescript-eslint/no-require-imports */
// Node.js 스크립트이므로 require 사용 허용

/**
 * 빠른 Google AI API 키 암호화
 */

const CryptoJS = require('crypto-js');
const readline = require('readline');

// 제공된 API 키
const apiKey = process.env.GOOGLE_AI_API_KEY || 'your_google_ai_api_key_here';

// ⚠️ 보안 개선: 비밀번호를 환경변수 또는 사용자 입력으로 받기
const password = process.env.GOOGLE_AI_TEAM_PASSWORD || '4231'; // 임시 기본값

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
    console.error('암호화 오류:', error.message);
    return null;
  }
}

console.log('⚠️  경고: 이 스크립트는 개발/테스트 목적입니다.');
console.log('⚠️  실제 운영에서는 scripts/encrypt-google-ai.js를 사용하세요.\n');

// 암호화 실행
const result = encryptAPIKey(apiKey, password);

if (result) {
  console.log('✅ 암호화 완료!');
  console.log('팀 비밀번호:', password);
  console.log('\n암호화된 설정:');
  console.log(JSON.stringify(result, null, 2));
} else {
  console.log('❌ 암호화 실패');
}
