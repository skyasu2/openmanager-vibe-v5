#!/usr/bin/env node
/**
 * 🔧 TypeScript 컴파일러 래퍼
 * tsc 명령어 안전 실행 및 에러 처리
 */

const { spawn } = require('child_process');
const path = require('path');

const args = process.argv.slice(2);

console.log('🔧 TypeScript 컴파일러 실행 중...');

// Resolve local typescript compiler path
let tscPath;
try {
  tscPath = require.resolve('typescript/bin/tsc');
} catch (e) {
  console.error('❌ TypeScript 패키지를 찾을 수 없습니다.');
  process.exit(1);
}

const tsc = spawn(process.execPath, [tscPath, ...args], {
  stdio: 'inherit',
  shell: false,
});

tsc.on('close', (code) => {
  if (code === 0) {
    console.log('✅ TypeScript 컴파일 성공');
  } else {
    console.error('❌ TypeScript 컴파일 실패');
  }
  process.exit(code);
});

tsc.on('error', (error) => {
  console.error('❌ TypeScript 컴파일러 실행 오류:', error.message);
  process.exit(1);
});
