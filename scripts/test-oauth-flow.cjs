#!/usr/bin/env node
/**
 * 🔐 OAuth 플로우 테스트 도구
 * 
 * OAuth 리다이렉트가 올바르게 작동하는지 확인합니다.
 */

const https = require('https');
const http = require('http');

function testOAuthFlow() {
  console.log('🔐 OAuth 플로우 테스트 시작...\n');

  const testUrls = [
    'http://localhost:3000/auth/callback',
    'https://openmanager-vibe-v5.vercel.app/auth/callback'
  ];

  testUrls.forEach(url => {
    console.log(`🔗 테스트 중: ${url}`);
    
    const client = url.startsWith('https') ? https : http;
    const request = client.get(url, { timeout: 5000 }, (res) => {
      if (res.statusCode === 200) {
        console.log(`✅ ${url} - 정상 응답 (${res.statusCode})`);
      } else {
        console.log(`⚠️ ${url} - 응답 코드: ${res.statusCode}`);
      }
    });

    request.on('error', (error) => {
      if (error.code === 'ECONNREFUSED') {
        console.log(`🔄 ${url} - 서버 미실행 (정상)`);
      } else {
        console.log(`❌ ${url} - 에러: ${error.message}`);
      }
    });

    request.on('timeout', () => {
      console.log(`⏰ ${url} - 타임아웃`);
      request.destroy();
    });
  });

  console.log('\n📋 Supabase 설정 체크리스트:');
  console.log('1. Settings → Authentication');
  console.log('2. Site URL: https://openmanager-vibe-v5.vercel.app');
  console.log('3. Redirect URLs에 추가:');
  console.log('   - http://localhost:3000/auth/callback');
  console.log('   - https://openmanager-vibe-v5.vercel.app/auth/callback');
  console.log('\n🔗 테스트 URL: https://openmanager-vibe-v5.vercel.app/login?redirectTo=%2Fmain');
}

if (require.main === module) {
  testOAuthFlow();
}

module.exports = { testOAuthFlow };