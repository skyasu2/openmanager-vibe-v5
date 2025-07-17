#!/usr/bin/env node

/**
 * 빠른 테스트 스크립트
 * Husky 훅에서 사용할 수 있는 최적화된 테스트
 */

import { execSync } from 'child_process';
import path from 'path';

console.log('🚀 빠른 테스트 시작...');

try {
  // TypeScript 타입 체크
  console.log('📝 TypeScript 타입 체크...');
  execSync('npx tsc --noEmit', { stdio: 'inherit' });
  
  // ESLint 검사
  console.log('🔍 ESLint 검사...');
  execSync('npx next lint', { stdio: 'inherit' });
  
  // 핵심 테스트만 실행 (빠른 테스트)
  console.log('🧪 핵심 테스트 실행...');
  execSync('npx vitest run tests/unit/api --reporter=basic', { stdio: 'inherit' });
  
  console.log('✅ 모든 검증 통과!');
  process.exit(0);
} catch (error) {
  console.error('❌ 테스트 실패:', error.message);
  process.exit(1);
} 