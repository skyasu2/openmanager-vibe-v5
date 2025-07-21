#!/usr/bin/env node

/**
 * Tavily MCP Wrapper (ES Module Version)
 * ES Module 호환 래퍼로 API 키를 안전하게 로드
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import CryptoJS from 'crypto-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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
    const configPath = join(__dirname, '../config/tavily-encrypted.json');
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

async function main() {
  console.error('[Tavily MCP Wrapper] ES Module 버전 시작...');

  // API 키 로드
  const apiKey = loadTavilyApiKey();
  if (!apiKey) {
    console.error('[Tavily MCP Wrapper] ❌ API 키를 로드할 수 없습니다');
    process.exit(1);
  }

  console.error('[Tavily MCP Wrapper] ✅ API 키 로드 성공');

  // Tavily MCP 서버 경로
  const tavilyMcpPath = join(
    __dirname,
    '../node_modules/tavily-mcp/build/index.js'
  );

  // 환경 변수 설정
  const env = {
    ...process.env,
    TAVILY_API_KEY: apiKey,
    NODE_ENV: 'production',
  };

  // Tavily MCP 서버 시작
  console.error('[Tavily MCP Wrapper] Tavily MCP 서버 시작 중...');

  const tavilyProcess = spawn('node', [tavilyMcpPath], {
    env,
    stdio: 'inherit',
  });

  tavilyProcess.on('error', error => {
    console.error('[Tavily MCP Wrapper] ❌ 서버 시작 실패:', error);
    process.exit(1);
  });

  tavilyProcess.on('exit', code => {
    console.error(`[Tavily MCP Wrapper] 서버 종료 (코드: ${code})`);
    process.exit(code || 0);
  });

  // 프로세스 종료 신호 처리
  process.on('SIGINT', () => {
    console.error('[Tavily MCP Wrapper] 종료 신호 받음');
    tavilyProcess.kill('SIGINT');
  });

  process.on('SIGTERM', () => {
    tavilyProcess.kill('SIGTERM');
  });
}

main().catch(error => {
  console.error('[Tavily MCP Wrapper] 치명적 오류:', error);
  process.exit(1);
});
