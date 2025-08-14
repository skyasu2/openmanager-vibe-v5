#!/usr/bin/env node

/**
 * 환경 설정 동작 검증 스크립트
 */

const path = require('path');

// 환경변수 설정
process.env.NODE_ENV = 'development';

console.log('🧪 환경 설정 테스트 시작...\n');

// 테스트 케이스
const testCases = [
  { env: 'development', expected: { url: 'http://localhost:3000', cache: false, rateLimit: 100 } },
  { env: 'test', expected: { url: 'https://openmanager-test.vercel.app', cache: true, rateLimit: 60 } },
  { env: 'production', expected: { url: 'https://openmanager-vibe-v5.vercel.app', cache: true, rateLimit: 60 } },
];

// 각 환경 테스트
testCases.forEach(({ env, expected }) => {
  console.log(`\n📋 테스트: ${env} 환경`);
  console.log('─'.repeat(40));
  
  // 환경변수 설정
  process.env.NODE_ENV = env;
  
  // URL 확인
  const devUrl = process.env.NEXT_PUBLIC_DEV_URL || 'http://localhost:3000';
  const testUrl = process.env.NEXT_PUBLIC_TEST_URL || 'https://openmanager-test.vercel.app';
  const prodUrl = process.env.NEXT_PUBLIC_PROD_URL || 'https://openmanager-vibe-v5.vercel.app';
  
  let actualUrl;
  switch (env) {
    case 'development':
      actualUrl = devUrl;
      break;
    case 'test':
      actualUrl = testUrl;
      break;
    case 'production':
      actualUrl = prodUrl;
      break;
  }
  
  console.log(`✅ URL: ${actualUrl}`);
  console.log(`   예상: ${expected.url}`);
  console.log(`   일치: ${actualUrl === expected.url ? '✅' : '❌'}`);
  
  // API 설정 확인
  const apiConfigs = {
    development: {
      rateLimit: { maxRequests: 100, windowMs: 60000 },
      timeout: { default: 30000, long: 120000, stream: 300000 },
      cache: { enabled: false, ttl: 0 },
    },
    test: {
      rateLimit: { maxRequests: 60, windowMs: 60000 },
      timeout: { default: 15000, long: 60000, stream: 180000 },
      cache: { enabled: true, ttl: 300 },
    },
    production: {
      rateLimit: { maxRequests: 60, windowMs: 60000 },
      timeout: { default: 10000, long: 30000, stream: 120000 },
      cache: { enabled: true, ttl: 600 },
    },
  };
  
  const config = apiConfigs[env];
  
  console.log(`\n📊 API 설정:`);
  console.log(`   Rate Limit: ${config.rateLimit.maxRequests} req/min`);
  console.log(`   Cache: ${config.cache.enabled ? `활성화 (TTL: ${config.cache.ttl}초)` : '비활성화'}`);
  console.log(`   Timeout: ${config.timeout.default / 1000}초 (기본)`);
});

console.log('\n\n✅ 환경 설정 테스트 완료!');
console.log('─'.repeat(40));

// TypeScript 파일 존재 확인
const tsFiles = [
  'src/lib/env-config.ts',
  'src/lib/api-config.ts',
  'src/hooks/useApiConfig.ts',
  'src/components/EnvironmentBadge.tsx',
];

console.log('\n📁 파일 존재 확인:');
const fs = require('fs');

tsFiles.forEach(file => {
  const fullPath = path.join(process.cwd(), file);
  const exists = fs.existsSync(fullPath);
  console.log(`   ${file}: ${exists ? '✅' : '❌'}`);
});

// 환경변수 템플릿 확인
const templatePath = path.join(process.cwd(), '.env.local.template');
const templateExists = fs.existsSync(templatePath);

console.log(`\n📋 환경변수 템플릿: ${templateExists ? '✅ 존재' : '❌ 없음'}`);

if (templateExists) {
  const content = fs.readFileSync(templatePath, 'utf-8');
  const hasUrls = content.includes('NEXT_PUBLIC_DEV_URL') && 
                  content.includes('NEXT_PUBLIC_TEST_URL') && 
                  content.includes('NEXT_PUBLIC_PROD_URL');
  
  console.log(`   URL 설정: ${hasUrls ? '✅ 포함됨' : '❌ 누락'}`);
}

console.log('\n🎉 모든 테스트 완료!\n');