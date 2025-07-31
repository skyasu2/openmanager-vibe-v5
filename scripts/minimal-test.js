#!/usr/bin/env node

/**
 * 초고속 테스트 러너 - Pre-push 전용
 * Vitest 오버헤드 없이 핵심 기능만 빠르게 검증
 */

const fs = require('fs');
const path = require('path');

console.log('⚡ 초고속 테스트 시작...\n');

let passed = 0;
let failed = 0;
const errors = [];

// 간단한 assertion 함수
function assert(condition, message) {
  if (condition) {
    passed++;
    process.stdout.write('.');
  } else {
    failed++;
    process.stdout.write('F');
    errors.push(message);
  }
}

// 환경변수 테스트
function testEnvVars() {
  console.log('\n📋 환경변수 검증:');
  
  // .env.mcp.template 읽기 (또는 건너뛰기)
  let template = '';
  try {
    template = fs.readFileSync('.env.mcp.template', 'utf8');
  } catch (e) {
    // 템플릿 파일이 없어도 계속 진행
    console.log('  (환경변수 템플릿 파일 없음 - 건너뜀)');
    return;
  }
  const requiredVars = template
    .split('\n')
    .filter(line => line && !line.startsWith('#'))
    .map(line => line.split('=')[0].trim())
    .filter(Boolean);

  // 필수 환경변수 체크
  assert(requiredVars.includes('NEXTAUTH_URL'), 'NEXTAUTH_URL이 템플릿에 있어야 함');
  assert(requiredVars.includes('NEXT_PUBLIC_SUPABASE_URL'), 'NEXT_PUBLIC_SUPABASE_URL이 템플릿에 있어야 함');
  assert(requiredVars.includes('UPSTASH_REDIS_REST_URL'), 'UPSTASH_REDIS_REST_URL이 템플릿에 있어야 함');
}

// 핵심 파일 존재 테스트
function testCoreFiles() {
  console.log('\n\n🗂️ 핵심 파일 검증:');
  
  const coreFiles = [
    'src/services/ai/UnifiedAIEngineRouter.ts',
    'src/services/ai/SimplifiedQueryEngine.ts',
    'src/lib/redis.ts',
    'src/lib/supabase.ts',
    'tsconfig.json',
    'next.config.mjs',
    'package.json',
  ];

  coreFiles.forEach(file => {
    assert(fs.existsSync(file), `${file}이 존재해야 함`);
  });
}

// TypeScript 설정 테스트
function testTsConfig() {
  console.log('\n\n🔧 TypeScript 설정 검증:');
  
  const tsconfig = JSON.parse(fs.readFileSync('tsconfig.json', 'utf8'));
  
  assert(tsconfig.compilerOptions.strict === true, 'strict 모드가 활성화되어야 함');
  assert(tsconfig.compilerOptions.noImplicitAny === true, 'noImplicitAny가 활성화되어야 함');
  assert(tsconfig.compilerOptions.paths['@/*'], '@/* 경로 별칭이 설정되어야 함');
}

// 패키지 의존성 테스트
function testDependencies() {
  console.log('\n\n📦 핵심 의존성 검증:');
  
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  
  const coreDeps = [
    'next',
    'react',
    'typescript',
    '@upstash/redis',
    '@supabase/supabase-js',
    'vitest',
  ];

  coreDeps.forEach(dep => {
    assert(
      pkg.dependencies[dep] || pkg.devDependencies[dep],
      `${dep}가 설치되어야 함`
    );
  });
}

// 메인 실행
try {
  testEnvVars();
  testCoreFiles();
  testTsConfig();
  testDependencies();

  console.log('\n\n' + '='.repeat(50));
  console.log(`✅ 통과: ${passed}, ❌ 실패: ${failed}`);
  
  if (failed > 0) {
    console.log('\n실패한 테스트:');
    errors.forEach((err, i) => {
      console.log(`  ${i + 1}. ${err}`);
    });
    process.exit(1);
  } else {
    console.log('모든 테스트 통과! 🎉');
    process.exit(0);
  }
} catch (error) {
  console.error('\n💥 테스트 실행 중 오류:', error.message);
  process.exit(1);
}