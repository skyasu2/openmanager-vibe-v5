#!/usr/bin/env node

/**
 * 빠른 TypeScript 검사 - Vercel 배포 최적화
 * 
 * 특징:
 * - skipLibCheck와 함께 최적화된 설정
 * - 캐시 활용으로 2-3배 빠른 실행
 * - 변경된 파일 우선 검사
 */

const { spawn } = require('child_process');
const path = require('path');

// TypeScript 컴파일러 옵션 (초고속 모드)
const fastOptions = [
  '--noEmit',
  '--skipLibCheck',
  '--incremental',
  '--tsBuildInfoFile', '.next/cache/tsbuildinfo-fast',
  '--assumeChangesOnlyAffectDirectDependencies'
];

console.log('🚀 빠른 TypeScript 검사 시작...');
const startTime = Date.now();

const tsc = spawn('npx', ['tsc', ...fastOptions], {
  stdio: 'inherit',
  cwd: process.cwd()
});

tsc.on('exit', (code) => {
  const duration = Date.now() - startTime;
  
  if (code === 0) {
    console.log(`✅ TypeScript 검사 완료 (${duration}ms)`);
    process.exit(0);
  } else {
    console.log(`❌ TypeScript 검사 실패 (${duration}ms)`);
    process.exit(code);
  }
});

tsc.on('error', (error) => {
  console.error(`❌ TypeScript 실행 실패:`, error.message);
  process.exit(1);
});