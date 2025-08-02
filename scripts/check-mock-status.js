#!/usr/bin/env node

/**
 * Mock 시스템 상태 확인 스크립트
 * Windows/WSL 개발 환경에서 Mock이 제대로 활성화되었는지 확인
 */

const chalk = require('chalk');

console.log(chalk.blue('\n🔍 Mock 시스템 상태 확인 중...\n'));

// 환경 변수 확인
const env = process.env.NODE_ENV || 'development';
const forceGoogleAI = process.env.FORCE_MOCK_GOOGLE_AI === 'true';
const forceSupabase = process.env.FORCE_MOCK_SUPABASE === 'true';
const forceGCPFunctions = process.env.FORCE_MOCK_GCP_FUNCTIONS === 'true';

console.log(chalk.yellow('📋 환경 설정:'));
console.log(`  - NODE_ENV: ${chalk.green(env)}`);
console.log(`  - FORCE_MOCK_GOOGLE_AI: ${forceGoogleAI ? chalk.green('true') : chalk.gray('false')}`);
console.log(`  - FORCE_MOCK_SUPABASE: ${forceSupabase ? chalk.green('true') : chalk.gray('false')}`);
console.log(`  - FORCE_MOCK_GCP_FUNCTIONS: ${forceGCPFunctions ? chalk.green('true') : chalk.gray('false')}`);

// Mock 활성화 상태 계산
const isDevelopment = env === 'development';
const isTest = env === 'test';
const shouldUseMocks = isDevelopment || isTest;

console.log(chalk.yellow('\n🎭 Mock 시스템 상태:'));

// Google AI Mock
const googleAIMockActive = shouldUseMocks || forceGoogleAI;
console.log(`  - Google AI Mock: ${googleAIMockActive ? chalk.green('✅ 활성') : chalk.red('❌ 비활성')}`);

// Supabase Mock
const supabaseMockActive = shouldUseMocks || forceSupabase;
console.log(`  - Supabase Mock: ${supabaseMockActive ? chalk.green('✅ 활성') : chalk.red('❌ 비활성')}`);

// GCP Functions Mock
const gcpFunctionsMockActive = shouldUseMocks || forceGCPFunctions;
console.log(`  - GCP Functions Mock: ${gcpFunctionsMockActive ? chalk.green('✅ 활성') : chalk.red('❌ 비활성')}`);

// 전체 상태
const allMocksActive = googleAIMockActive && supabaseMockActive && gcpFunctionsMockActive;

console.log(chalk.yellow('\n📊 요약:'));
if (allMocksActive) {
  console.log(chalk.green('✅ 모든 Mock 시스템이 활성화되었습니다.'));
  console.log(chalk.green('   API 사용량: 0원'));
  console.log(chalk.green('   오프라인 개발 가능'));
} else {
  console.log(chalk.red('⚠️  일부 Mock 시스템이 비활성화되어 있습니다.'));
  console.log(chalk.yellow('   실제 API가 호출될 수 있습니다.'));
}

// 권장사항
console.log(chalk.blue('\n💡 권장사항:'));
if (!isDevelopment && !isTest) {
  console.log('  - 개발 환경에서는 NODE_ENV=development로 설정하세요.');
}
if (!allMocksActive && shouldUseMocks) {
  console.log('  - .env.local 파일에 FORCE_MOCK_* 환경변수를 추가하세요.');
}

// Mock 파일 존재 확인
console.log(chalk.yellow('\n📁 Mock 파일 확인:'));
const fs = require('fs');
const path = require('path');

const mockFiles = [
  'src/lib/ai/dev-mock-google-ai.ts',
  'src/lib/supabase/dev-mock-supabase.ts',
  'src/lib/gcp/dev-mock-gcp-functions.ts',
];

mockFiles.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  const exists = fs.existsSync(filePath);
  console.log(`  - ${file}: ${exists ? chalk.green('✅') : chalk.red('❌')}`);
});

console.log(chalk.blue('\n✨ 확인 완료!\n'));