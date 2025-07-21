#!/usr/bin/env node

/**
 * Tavily MCP Wrapper
 * API 키를 안전하게 로드하고 Tavily MCP 서버를 시작하는 래퍼
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// CryptoJS를 동적으로 import
async function loadDecryptionModule() {
  try {
    // CommonJS 모듈 로드
    const keyLoaderPath = join(__dirname, 'tavily-key-loader.cjs');
    const { loadTavilyApiKey } = await import(
      `file:///${keyLoaderPath.replace(/\\/g, '/')}`
    );
    return loadTavilyApiKey;
  } catch (error) {
    console.error('❌ 키 로더 모듈 로드 실패:', error);

    // 대체 방법: 직접 암호화된 설정 파일 읽기
    try {
      const configPath = join(__dirname, '../config/tavily-encrypted.json');
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

      // 간단한 복호화 로직
      const CryptoJS = await import('crypto-js');
      const bytes = CryptoJS.AES.decrypt(config.apiKey, 'openmanager2025');
      return () => bytes.toString(CryptoJS.enc.Utf8);
    } catch (fallbackError) {
      console.error('❌ 대체 방법도 실패:', fallbackError);
      return null;
    }
  }
}

async function main() {
  console.error('[Tavily MCP Wrapper] 시작...');

  // API 키 로드
  const loadTavilyApiKey = await loadDecryptionModule();
  if (!loadTavilyApiKey) {
    console.error('[Tavily MCP Wrapper] ❌ API 키 로더를 찾을 수 없습니다');
    process.exit(1);
  }

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
