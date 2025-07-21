#!/usr/bin/env node

/**
 * 🔐 Tavily API 키 암호화
 * CryptoJS를 사용한 안전한 키 관리
 */

const CryptoJS = require('crypto-js');
const fs = require('fs');
const path = require('path');

console.log('🔐 Tavily API 키 암호화 시작...\n');

// 암호화 키 (프로젝트 표준)
const ENCRYPTION_KEY = 'openmanager2025';

// Tavily API 키
const TAVILY_API_KEY = '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';

function encrypt(text) {
  try {
    return CryptoJS.AES.encrypt(text, ENCRYPTION_KEY).toString();
  } catch (error) {
    throw new Error(`암호화 실패: ${error.message}`);
  }
}

function decrypt(encryptedText) {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedText, ENCRYPTION_KEY);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    if (!decrypted) {
      throw new Error('복호화 결과가 비어있음');
    }
    return decrypted;
  } catch (error) {
    throw new Error(`복호화 실패: ${error.message}`);
  }
}

try {
  console.log('🔒 Tavily API 키 암호화 중...');

  const encryptedKey = encrypt(TAVILY_API_KEY);
  console.log(`✅ 암호화 완료`);

  // config 디렉토리 확인
  const configDir = path.join(__dirname, '../config');
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }

  // 암호화된 설정 저장
  const encryptedConfig = {
    version: '1.0',
    timestamp: new Date().toISOString(),
    service: 'tavily',
    encryptionKey: 'openmanager2025',
    apiKey: encryptedKey,
    limits: {
      monthly: 1000,
      daily: 33,
      rateLimit: '1 request per second',
    },
    features: {
      search: true,
      extract: true,
      rag: true,
    },
  };

  const configPath = path.join(configDir, 'tavily-encrypted.json');
  fs.writeFileSync(configPath, JSON.stringify(encryptedConfig, null, 2));
  console.log(`💾 암호화된 설정 저장: ${configPath}`);

  // 복호화 테스트
  console.log('\n🧪 복호화 테스트 중...');
  const decryptedKey = decrypt(encryptedKey);
  if (decryptedKey === TAVILY_API_KEY) {
    console.log('✅ 복호화 성공!');
  } else {
    throw new Error('복호화된 키가 원본과 일치하지 않습니다');
  }

  console.log('\n🎉 Tavily API 키가 성공적으로 암호화되었습니다!');
  console.log('\n📋 다음 단계:');
  console.log('1. MCP 설정에 Tavily 추가');
  console.log('2. 환경 변수 설정:');
  console.log('   - TAVILY_API_KEY_ENCRYPTED 또는');
  console.log('   - config/tavily-encrypted.json 파일 사용');
  console.log('\n💡 월 1,000회 무료 사용 가능');
  console.log('   - 일일 약 33회');
  console.log('   - RAG 워크플로우에 최적화');
} catch (error) {
  console.error('❌ 암호화 처리 실패:', error);
  process.exit(1);
}
