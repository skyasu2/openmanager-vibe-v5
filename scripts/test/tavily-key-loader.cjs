#!/usr/bin/env node

/**
 * 🔓 Tavily API 키 복호화 로더
 * MCP 서버에서 사용할 수 있도록 암호화된 키를 복호화
 */

const CryptoJS = require('crypto-js');
const fs = require('fs');
const path = require('path');

// 암호화 키
const ENCRYPTION_KEY = 'openmanager2025';

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

function loadTavilyApiKey() {
  try {
    // 1. 환경 변수에서 확인
    if (process.env.TAVILY_API_KEY) {
      return process.env.TAVILY_API_KEY;
    }

    // 2. 암호화된 환경 변수 확인
    if (process.env.TAVILY_API_KEY_ENCRYPTED) {
      return decrypt(process.env.TAVILY_API_KEY_ENCRYPTED);
    }

    // 3. 설정 파일에서 로드
    const configPath = path.join(__dirname, '../config/tavily-encrypted.json');
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      if (config.apiKey) {
        return decrypt(config.apiKey);
      }
    }

    throw new Error('Tavily API 키를 찾을 수 없습니다');
  } catch (error) {
    console.error('❌ Tavily API 키 로드 실패:', error.message);
    return null;
  }
}

// 모듈로 내보내기
if (module.exports) {
  module.exports = { loadTavilyApiKey, decrypt };
}

// CLI로 실행시 키 출력 (테스트용)
if (require.main === module) {
  const apiKey = loadTavilyApiKey();
  if (apiKey) {
    console.log('✅ Tavily API 키 로드 성공');
    console.log(`키 길이: ${apiKey.length}자`);
    console.log(`키 시작: ${apiKey.substring(0, 4)}...`);
  } else {
    console.log('❌ Tavily API 키 로드 실패');
    process.exit(1);
  }
}
