#!/usr/bin/env node

/**
 * Tavily MCP Wrapper (Simple Version)
 * API 키를 안전하게 로드하고 Tavily MCP 서버를 시작하는 래퍼
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// 키 로더 가져오기
const { loadTavilyApiKey } = require('./tavily-key-loader.cjs');

async function main() {
  console.error('[Tavily MCP Wrapper] 시작...');

  // API 키 로드
  const apiKey = loadTavilyApiKey();
  if (!apiKey) {
    console.error('[Tavily MCP Wrapper] ❌ API 키를 로드할 수 없습니다');
    process.exit(1);
  }

  console.error('[Tavily MCP Wrapper] ✅ API 키 로드 성공');

  // Tavily MCP 서버 경로
  const tavilyMcpPath = path.join(__dirname, '../node_modules/tavily-mcp/build/index.js');

  // 환경 변수 설정
  const env = {
    ...process.env,
    TAVILY_API_KEY: apiKey,
    NODE_ENV: 'production'
  };

  // Tavily MCP 서버 시작
  console.error('[Tavily MCP Wrapper] Tavily MCP 서버 시작 중...');
  
  const tavilyProcess = spawn('node', [tavilyMcpPath], {
    env,
    stdio: 'inherit'
  });

  tavilyProcess.on('error', (error) => {
    console.error('[Tavily MCP Wrapper] ❌ 서버 시작 실패:', error);
    process.exit(1);
  });

  tavilyProcess.on('exit', (code) => {
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