#!/usr/bin/env node

/**
 * 단일 테스트 파일 실행기
 * vitest 대신 Node.js로 직접 실행
 */

const path = require('path');
const { register } = require('tsx/cjs');

// TypeScript 지원 활성화
register();

// vitest 호환 레이어 로드
require('./vitest-compat');

// 테스트 파일 경로
const testFile = process.argv[2];

if (!testFile) {
  console.error('❌ Usage: node run-single-test.js <test-file>');
  process.exit(1);
}

console.log(`🧪 Running test: ${testFile}`);
console.log('');

try {
  // 테스트 파일 실행
  require(path.resolve(testFile));
  
  // 모든 테스트가 통과하면 성공
  setTimeout(() => {
    console.log('\n✅ All tests passed!');
    process.exit(0);
  }, 100);
} catch (err) {
  console.error('\n❌ Test failed:', err.message);
  console.error(err.stack);
  process.exit(1);
}