#!/usr/bin/env node

/**
 * 🔧 Husky 조건부 설치 스크립트
 * 
 * Vercel이나 다른 CI/CD 환경에서는 husky 설치를 스킵합니다.
 * 로컬 개발 환경에서만 Git hooks를 설정합니다.
 */

const fs = require('fs');
const { execSync } = require('child_process');

// 환경 변수 체크
const isProduction = process.env.NODE_ENV === 'production';
const isVercel = process.env.VERCEL === '1';
const isCI = process.env.CI === 'true';

// Git 디렉토리 존재 체크
const hasGitDir = fs.existsSync('.git');

console.log('🔍 Husky 설치 환경 체크:');
console.log('- NODE_ENV:', process.env.NODE_ENV);
console.log('- VERCEL:', process.env.VERCEL);
console.log('- CI:', process.env.CI);
console.log('- Git 디렉토리:', hasGitDir ? '존재' : '없음');

// 스킵 조건들
if (isProduction) {
  console.log('⚡ Production 환경 - Husky 설치 스킵');
  process.exit(0);
}

if (isVercel) {
  console.log('⚡ Vercel 환경 - Husky 설치 스킵');
  process.exit(0);
}

if (isCI) {
  console.log('⚡ CI 환경 - Husky 설치 스킵');
  process.exit(0);
}

if (!hasGitDir) {
  console.log('⚡ Git 디렉토리 없음 - Husky 설치 스킵');
  process.exit(0);
}

// Husky 설치 시도
try {
  console.log('🔧 Husky 설치 중...');
  execSync('npx husky install', { stdio: 'inherit' });
  console.log('✅ Husky 설치 완료');
} catch (error) {
  console.log('⚠️ Husky 설치 실패 (무시됨):', error.message);
  // 실패해도 종료하지 않음
} 