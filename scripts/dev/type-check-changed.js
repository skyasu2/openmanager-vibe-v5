#!/usr/bin/env node
/**
 * 🚀 Smart TypeScript Check
 * GitHub Actions Essential Check용 스마트 타입 체크
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const mode = process.argv[2] || 'smart';

console.log(`🚀 TypeScript 스마트 체크 시작 (${mode} 모드)...`);

try {
  if (mode === 'smart') {
    // Smart 모드: 빠른 체크
    console.log('✅ 스마트 모드 - 변경된 파일만 체크');
    
    // 직접 tsc 실행
    execSync('npx tsc --noEmit', { stdio: 'inherit' });
    
    console.log('✅ 스마트 타입 체크 통과!');
    process.exit(0);
  } else {
    // 전체 체크
    execSync('npx tsc --noEmit', { stdio: 'inherit' });
    console.log('✅ 전체 타입 체크 통과!');
    process.exit(0);
  }
} catch (error) {
  console.error('❌ TypeScript 타입 에러 발견');
  console.error(error.message);
  process.exit(1);
}