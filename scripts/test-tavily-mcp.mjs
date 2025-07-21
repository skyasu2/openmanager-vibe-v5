#!/usr/bin/env node

/**
 * Tavily MCP 테스트 스크립트
 * Tavily MCP 서버가 정상적으로 작동하는지 확인합니다.
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🔍 Tavily MCP 테스트 시작...\n');

// 1. 필요한 파일 확인
console.log('📁 파일 확인:');
const checks = [
  {
    path: join(__dirname, '../node_modules/tavily-mcp'),
    name: 'tavily-mcp 패키지',
  },
  {
    path: join(__dirname, 'tavily-mcp-wrapper.mjs'),
    name: 'Tavily 래퍼 스크립트',
  },
  {
    path: join(__dirname, '../config/tavily-encrypted.json'),
    name: 'API 키 설정',
  },
];

let allChecksPass = true;
for (const check of checks) {
  if (fs.existsSync(check.path)) {
    console.log(`✅ ${check.name} - OK`);
  } else {
    console.log(`❌ ${check.name} - 찾을 수 없음`);
    allChecksPass = false;
  }
}

if (!allChecksPass) {
  console.error('\n❌ 필요한 파일이 없습니다. 설치를 확인하세요.');
  process.exit(1);
}

// 2. Tavily 래퍼 테스트
console.log('\n🚀 Tavily 래퍼 실행 테스트:');

const wrapperProcess = spawn(
  'node',
  [join(__dirname, 'tavily-mcp-wrapper.mjs')],
  {
    env: { ...process.env },
    stdio: ['pipe', 'pipe', 'pipe'],
  }
);

let output = '';
let errorOutput = '';

wrapperProcess.stdout.on('data', data => {
  output += data.toString();
});

wrapperProcess.stderr.on('data', data => {
  errorOutput += data.toString();
});

// 2초 후 프로세스 종료
setTimeout(() => {
  wrapperProcess.kill('SIGTERM');
}, 2000);

wrapperProcess.on('close', code => {
  console.log('\n📋 래퍼 출력:');
  if (errorOutput) {
    console.log(errorOutput);
  }
  if (output) {
    console.log(output);
  }

  if (
    errorOutput.includes('API 키 로드 성공') &&
    errorOutput.includes('Tavily MCP 서버 시작 중')
  ) {
    console.log('\n✅ Tavily MCP가 정상적으로 시작되었습니다!');
  } else {
    console.log('\n❌ Tavily MCP 시작에 문제가 있습니다.');
  }

  console.log('\n💡 팁:');
  console.log('- Claude Code에서 /mcp 명령으로 상태를 확인하세요');
  console.log('- mcp__tavily__search 함수를 사용하여 웹 검색을 할 수 있습니다');
  console.log('- 문제가 지속되면 scripts/check-mcp-status.ps1을 실행하세요');
});

wrapperProcess.on('error', error => {
  console.error('❌ 래퍼 실행 오류:', error.message);
  process.exit(1);
});
