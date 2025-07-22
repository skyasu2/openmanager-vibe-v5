#!/usr/bin/env node

/**
 * 🔍 OAuth 설정 검증 스크립트
 *
 * 사용법: node scripts/verify-oauth-setup.js
 */

const https = require('https');

console.log('🔍 OAuth 설정 검증 시작...\n');

// 1. 환경변수 확인
console.log('1️⃣ 환경변수 확인:');
console.log('─'.repeat(50));

const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
];

let envVarsOk = true;
requiredEnvVars.forEach(varName => {
  const value = process.env[varName];
  if (!value) {
    console.log(`❌ ${varName}: 설정되지 않음`);
    envVarsOk = false;
  } else if (value.includes('test') || value.includes('your-')) {
    console.log(
      `⚠️  ${varName}: 테스트 값으로 보임 (${value.substring(0, 20)}...)`
    );
    envVarsOk = false;
  } else {
    console.log(`✅ ${varName}: ${value.substring(0, 30)}...`);
  }
});

if (!envVarsOk) {
  console.log('\n❌ 환경변수 설정이 필요합니다!');
  console.log(
    'Vercel Dashboard > Settings > Environment Variables에서 설정하세요.\n'
  );
}

// 2. Supabase URL 유효성 확인
console.log('\n2️⃣ Supabase 연결 테스트:');
console.log('─'.repeat(50));

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
if (supabaseUrl) {
  const url = new URL(supabaseUrl);

  https
    .get(`${supabaseUrl}/auth/v1/health`, res => {
      if (res.statusCode === 200) {
        console.log('✅ Supabase Auth 서비스 정상 작동');
      } else {
        console.log(`⚠️  Supabase Auth 서비스 응답 코드: ${res.statusCode}`);
      }
    })
    .on('error', err => {
      console.log('❌ Supabase 연결 실패:', err.message);
    });
}

// 3. 현재 도메인 정보
console.log('\n3️⃣ 배포 환경 정보:');
console.log('─'.repeat(50));
console.log(`VERCEL: ${process.env.VERCEL ? 'Yes' : 'No'}`);
console.log(`VERCEL_ENV: ${process.env.VERCEL_ENV || 'Not set'}`);
console.log(`VERCEL_URL: ${process.env.VERCEL_URL || 'Not set'}`);
console.log(`NODE_ENV: ${process.env.NODE_ENV}`);

// 4. 권장 설정 출력
console.log('\n4️⃣ 권장 OAuth 설정:');
console.log('─'.repeat(50));

if (supabaseUrl) {
  console.log('\n📌 GitHub OAuth App 설정:');
  console.log(`Authorization callback URL: ${supabaseUrl}/auth/v1/callback`);

  console.log('\n📌 Supabase Dashboard 설정:');
  const vercelUrl = process.env.VERCEL_URL || 'openmanager-vibe-v5.vercel.app';
  console.log(`Site URL: https://${vercelUrl}`);
  console.log('Redirect URLs:');
  console.log(`  - https://${vercelUrl}/auth/callback`);
  console.log(
    `  - https://${vercelUrl.replace('.vercel.app', '-*.vercel.app')}/auth/callback`
  );
  console.log('  - http://localhost:3000/auth/callback');
}

// 5. 디버깅 명령어
console.log('\n5️⃣ 디버깅 명령어:');
console.log('─'.repeat(50));
console.log('# Vercel 로그 확인:');
console.log('vercel logs --follow');
console.log('\n# 환경변수 재배포:');
console.log('vercel env pull');
console.log('vercel --prod');

console.log('\n✨ 검증 완료!\n');
