#!/usr/bin/env node

/**
 * 🔍 GitHub OAuth 설정 검증 스크립트
 * 
 * 현재 설정을 분석하고 문제점을 찾아 해결책을 제시합니다.
 */

const https = require('https');
const { URL } = require('url');

// 환경변수 로드
require('dotenv').config({ path: '.env.local' });

const config = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  githubClientId: process.env.GITHUB_CLIENT_ID,
  githubClientSecret: process.env.GITHUB_CLIENT_SECRET,
  nextAuthUrl: process.env.NEXTAUTH_URL,
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL,
};

console.log('🔍 GitHub OAuth 설정 검증 시작...\n');

// 1. 환경변수 검증
function validateEnvironmentVariables() {
  console.log('📋 1. 환경변수 검증:');
  
  const checks = [
    { name: 'NEXT_PUBLIC_SUPABASE_URL', value: config.supabaseUrl, required: true },
    { name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', value: config.supabaseAnonKey, required: true },
    { name: 'GITHUB_CLIENT_ID', value: config.githubClientId, required: true },
    { name: 'GITHUB_CLIENT_SECRET', value: config.githubClientSecret, required: true },
    { name: 'NEXTAUTH_URL', value: config.nextAuthUrl, required: true },
    { name: 'NEXT_PUBLIC_SITE_URL', value: config.siteUrl, required: true },
  ];

  let allValid = true;
  
  checks.forEach(check => {
    const isSet = check.value && check.value !== '' && !check.value.includes('test') && !check.value.includes('YOUR_');
    const status = isSet ? '✅' : (check.required ? '❌' : '⚠️');
    const displayValue = check.value ? 
      (check.name.includes('SECRET') || check.name.includes('KEY') ? 
        check.value.substring(0, 10) + '...' : check.value) : 'NOT SET';
    
    console.log(`  ${status} ${check.name}: ${displayValue}`);
    
    if (check.required && !isSet) {
      allValid = false;
    }
  });
  
  return allValid;
}

// 2. URL 구조 검증
function validateUrlStructure() {
  console.log('\n🔗 2. URL 구조 검증:');
  
  try {
    const supabaseUrl = new URL(config.supabaseUrl);
    const siteUrl = new URL(config.siteUrl);
    
    console.log(`  ✅ Supabase URL: ${supabaseUrl.origin}`);
    console.log(`  ✅ Site URL: ${siteUrl.origin}`);
    
    // 예상되는 콜백 URL들
    const expectedCallbacks = {
      githubOAuth: `${supabaseUrl.origin}/auth/v1/callback`,
      appCallback: `${siteUrl.origin}/auth/callback`,
      mainRedirect: `${siteUrl.origin}/main`,
    };
    
    console.log('\n  📍 설정해야 할 콜백 URL들:');
    console.log(`    GitHub OAuth App: ${expectedCallbacks.githubOAuth}`);
    console.log(`    Supabase Redirect: ${expectedCallbacks.appCallback}`);
    console.log(`    Supabase Redirect: ${expectedCallbacks.mainRedirect}`);
    
    return expectedCallbacks;
  } catch (error) {
    console.log(`  ❌ URL 파싱 오류: ${error.message}`);
    return null;
  }
}

// 3. Supabase 연결 테스트
function testSupabaseConnection() {
  return new Promise((resolve) => {
    console.log('\n🔌 3. Supabase 연결 테스트:');
    
    if (!config.supabaseUrl || !config.supabaseAnonKey) {
      console.log('  ❌ Supabase 설정이 불완전합니다.');
      resolve(false);
      return;
    }
    
    const url = new URL('/rest/v1/', config.supabaseUrl);
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname,
      method: 'GET',
      headers: {
        'apikey': config.supabaseAnonKey,
        'Authorization': `Bearer ${config.supabaseAnonKey}`,
      },
    };
    
    const req = https.request(options, (res) => {
      console.log(`  📡 응답 상태: ${res.statusCode}`);
      
      if (res.statusCode === 200 || res.statusCode === 404) {
        console.log('  ✅ Supabase 연결 성공');
        resolve(true);
      } else {
        console.log('  ❌ Supabase 연결 실패');
        resolve(false);
      }
    });
    
    req.on('error', (error) => {
      console.log(`  ❌ 연결 오류: ${error.message}`);
      resolve(false);
    });
    
    req.setTimeout(5000, () => {
      console.log('  ⏰ 연결 타임아웃');
      req.destroy();
      resolve(false);
    });
    
    req.end();
  });
}

// 4. GitHub OAuth App 설정 확인
function checkGitHubOAuthSettings() {
  console.log('\n🐙 4. GitHub OAuth App 설정 확인:');
  
  const clientId = config.githubClientId;
  if (!clientId || clientId.includes('test')) {
    console.log('  ❌ GitHub Client ID가 설정되지 않았습니다.');
    return false;
  }
  
  console.log(`  📋 Client ID: ${clientId}`);
  console.log('  📍 GitHub OAuth App에서 확인해야 할 설정:');
  console.log(`    - Homepage URL: ${config.siteUrl}`);
  console.log(`    - Authorization callback URL: ${config.supabaseUrl}/auth/v1/callback`);
  
  return true;
}

// 5. 로컬 개발 서버 테스트
function testLocalServer() {
  return new Promise((resolve) => {
    console.log('\n🏠 5. 로컬 개발 서버 테스트:');
    
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/auth/debug',
      method: 'GET',
      timeout: 3000,
    };
    
    const req = https.request(options, (res) => {
      console.log(`  📡 로컬 서버 응답: ${res.statusCode}`);
      resolve(res.statusCode === 200);
    });
    
    req.on('error', (error) => {
      console.log('  ⚠️ 로컬 서버가 실행되지 않았거나 접근할 수 없습니다.');
      console.log('  💡 npm run dev로 개발 서버를 시작하세요.');
      resolve(false);
    });
    
    req.setTimeout(3000, () => {
      console.log('  ⏰ 로컬 서버 응답 타임아웃');
      req.destroy();
      resolve(false);
    });
    
    req.end();
  });
}

// 6. 해결책 제시
function provideSolutions(results) {
  console.log('\n🔧 6. 해결책 및 다음 단계:');
  
  if (!results.envValid) {
    console.log('\n  ❌ 환경변수 문제:');
    console.log('    1. Supabase 대시보드에서 실제 anon key를 복사하세요');
    console.log('    2. .env.local에서 test 값들을 실제 값으로 교체하세요');
    console.log('    3. GitHub OAuth App에서 Client Secret을 확인하세요');
  }
  
  if (!results.supabaseConnection) {
    console.log('\n  ❌ Supabase 연결 문제:');
    console.log('    1. Supabase 프로젝트가 활성화되어 있는지 확인하세요');
    console.log('    2. anon key가 올바른지 확인하세요');
    console.log('    3. 네트워크 연결을 확인하세요');
  }
  
  console.log('\n  ✅ 권장 테스트 순서:');
  console.log('    1. npm run dev (로컬 서버 시작)');
  console.log('    2. http://localhost:3000/api/auth/debug (설정 확인)');
  console.log('    3. http://localhost:3000/login (로그인 테스트)');
  console.log('    4. GitHub OAuth 플로우 테스트');
  
  console.log('\n  🔗 유용한 링크:');
  console.log('    - Supabase 대시보드: https://supabase.com/dashboard');
  console.log('    - GitHub OAuth Apps: https://github.com/settings/applications');
  console.log('    - 로컬 디버그: http://localhost:3000/api/auth/debug');
}

// 메인 실행 함수
async function main() {
  const results = {
    envValid: validateEnvironmentVariables(),
    urlStructure: validateUrlStructure(),
    supabaseConnection: await testSupabaseConnection(),
    githubSettings: checkGitHubOAuthSettings(),
    localServer: await testLocalServer(),
  };
  
  provideSolutions(results);
  
  console.log('\n🎯 검증 완료!');
  console.log('문제가 해결되지 않으면 각 단계를 차례대로 확인해주세요.');
}

// 스크립트 실행
main().catch(console.error);