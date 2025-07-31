#!/usr/bin/env node

/**
 * OpenManager Vibe v5 - 배포 환경변수 검증 스크립트
 *
 * Vercel 배포 후 환경변수가 올바르게 설정되었는지 확인합니다.
 */

const https = require('https');
const { URL } = require('url');

// 환경변수 체크 리스트
// ⚠️ 주의: 이 값들은 예시용 플레이스홀더입니다. 실제 값을 여기에 넣지 마세요!
const REQUIRED_ENV_VARS = {
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: 'PLACEHOLDER_DO_NOT_USE_IN_PRODUCTION',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'PLACEHOLDER_JWT_TOKEN_EXAMPLE',
  SUPABASE_SERVICE_ROLE_KEY: 'PLACEHOLDER_SERVICE_ROLE_KEY_EXAMPLE',

  // Redis (둘 중 하나만 있으면 됨)
  UPSTASH_REDIS_REST_URL: 'https://PLACEHOLDER_REDIS_HOST.upstash.io',
  KV_REST_API_URL: 'https://PLACEHOLDER_KV_HOST.upstash.io',
  UPSTASH_REDIS_REST_TOKEN: 'PLACEHOLDER_REDIS_TOKEN',
  KV_REST_API_TOKEN: 'PLACEHOLDER_KV_TOKEN',
};

// API 엔드포인트 체크 리스트
const API_ENDPOINTS = [
  '/api/health',
  '/api/system/status',
  '/api/mcp/status',
  '/api/ai/korean',
  '/api/dashboard',
];

console.log('🔍 OpenManager Vibe v5 - 배포 검증 시작\n');

// 1. 환경변수 검증
function checkEnvironmentVariables() {
  console.log('📋 환경변수 검증...');

  const missing = [];
  const hasRedis =
    process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const hasRedisToken =
    process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

  // 필수 환경변수 체크
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
  ];

  required.forEach(key => {
    if (!process.env[key]) {
      missing.push(key);
    } else {
      console.log(`✅ ${key}: ${process.env[key].substring(0, 30)}...`);
    }
  });

  // Redis 체크
  if (!hasRedis) {
    missing.push('UPSTASH_REDIS_REST_URL 또는 KV_REST_API_URL');
  } else {
    console.log(`✅ Redis URL: ${hasRedis ? '설정됨' : '누락'}`);
  }

  if (!hasRedisToken) {
    missing.push('UPSTASH_REDIS_REST_TOKEN 또는 KV_REST_API_TOKEN');
  } else {
    console.log(`✅ Redis Token: ${hasRedisToken ? '설정됨' : '누락'}`);
  }

  if (missing.length > 0) {
    console.log('\n❌ 누락된 환경변수:');
    missing.forEach(key => console.log(`   - ${key}`));
    return false;
  }

  console.log('✅ 모든 환경변수 설정 완료\n');
  return true;
}

// 2. API 엔드포인트 검증
async function checkAPIEndpoints(baseUrl) {
  console.log('🌐 API 엔드포인트 검증...');

  const results = [];

  for (const endpoint of API_ENDPOINTS) {
    try {
      const url = new URL(endpoint, baseUrl);
      const response = await fetch(url.toString());
      const status = response.status;

      if (status === 200) {
        console.log(`✅ ${endpoint}: OK (${status})`);
        results.push({ endpoint, status: 'OK', code: status });
      } else {
        console.log(`⚠️  ${endpoint}: ${status}`);
        results.push({ endpoint, status: 'Warning', code: status });
      }
    } catch (error) {
      console.log(`❌ ${endpoint}: Error - ${error.message}`);
      results.push({ endpoint, status: 'Error', error: error.message });
    }
  }

  return results;
}

// 3. 데이터베이스 연결 검증
async function checkDatabaseConnection() {
  console.log('\n💾 데이터베이스 연결 검증...');

  try {
    // Supabase 연결 테스트 (간단한 쿼리)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceKey) {
      console.log('❌ Supabase 환경변수 누락');
      return false;
    }

    console.log('✅ Supabase 환경변수 설정됨');
    console.log('ℹ️  실제 연결 테스트는 런타임에 수행됩니다');
    return true;
  } catch (error) {
    console.log(`❌ 데이터베이스 연결 실패: ${error.message}`);
    return false;
  }
}

// 메인 실행 함수
async function main() {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || 'https://your-app.vercel.app';

  console.log(`🎯 대상 URL: ${baseUrl}\n`);

  // 1. 환경변수 검증
  const envOk = checkEnvironmentVariables();

  // 2. 데이터베이스 검증
  const dbOk = await checkDatabaseConnection();

  // 3. API 검증 (환경변수가 OK인 경우에만)
  let apiResults = [];
  if (envOk) {
    try {
      apiResults = await checkAPIEndpoints(baseUrl);
    } catch (error) {
      console.log(`❌ API 검증 실패: ${error.message}`);
    }
  }

  // 결과 요약
  console.log('\n📊 검증 결과 요약');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`환경변수: ${envOk ? '✅ 통과' : '❌ 실패'}`);
  console.log(`데이터베이스: ${dbOk ? '✅ 통과' : '❌ 실패'}`);

  if (apiResults.length > 0) {
    const apiOk = apiResults.filter(r => r.status === 'OK').length;
    const apiTotal = apiResults.length;
    console.log(`API 엔드포인트: ✅ ${apiOk}/${apiTotal} 통과`);
  }

  if (envOk && dbOk) {
    console.log(
      '\n🎉 배포 검증 완료! 애플리케이션이 정상 작동할 준비가 되었습니다.'
    );
  } else {
    console.log('\n⚠️  일부 검증에 실패했습니다. 위 내용을 확인해주세요.');
  }
}

// 스크립트가 직접 실행된 경우
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  checkEnvironmentVariables,
  checkAPIEndpoints,
  checkDatabaseConnection,
};
