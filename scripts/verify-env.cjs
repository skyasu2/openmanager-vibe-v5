#!/usr/bin/env node

/**
 * 🔍 환경변수 검증 스크립트
 * OpenManager Vibe v5 - 환경변수 설정 검증
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 OpenManager Vibe v5 - 환경변수 검증');
console.log('==========================================');
console.log('');

// 환경변수 로드
require('dotenv').config({ path: '.env.local' });

// 필수 환경변수 목록
const REQUIRED_ENV_VARS = [
    // Supabase
    'SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    
    // Redis
    'UPSTASH_REDIS_REST_URL',
    'UPSTASH_REDIS_REST_TOKEN',
    'KV_URL',
    'KV_REST_API_URL',
    'KV_REST_API_TOKEN',
    
    // GitHub OAuth
    'GITHUB_CLIENT_ID',
    'GITHUB_CLIENT_SECRET',
    'NEXTAUTH_SECRET',
    
    // Google AI
    'GOOGLE_AI_API_KEY'
];

// 플레이스홀더 패턴
const PLACEHOLDER_PATTERNS = [
    'YOUR_PLACEHOLDER',
    'YOUR_PLACEHOLDER',
    'YOUR_PLACEHOLDER',
    'YOUR_PLACEHOLDER',
    'YOUR_PLACEHOLDER',
    'YOUR_PLACEHOLDER',
    'YOUR_PLACEHOLDER',
    'YOUR_PLACEHOLDER',
    'YOUR_PLACEHOLDER',
    'YOUR_PLACEHOLDER_generate_random_string',
    'YOUR_GOOGLE_AI_API_KEY_PLACEHOLDER'
];

// 검증 결과
let validationResults = {
    passed: 0,
    failed: 0,
    warnings: 0,
    errors: []
};

// 1. .env.local 파일 존재 확인
console.log('📁 .env.local 파일 확인...');
if (fs.existsSync('.env.local')) {
    console.log('✅ .env.local 파일 존재');
    validationResults.passed++;
} else {
    console.log('❌ .env.local 파일 없음');
    validationResults.failed++;
    validationResults.errors.push('.env.local 파일이 없습니다. env.local.template을 복사하세요.');
}

console.log('');

// 2. 필수 환경변수 확인
console.log('🔍 필수 환경변수 확인...');
for (const envVar of REQUIRED_ENV_VARS) {
    const value = process.env[envVar];
    
    if (!value) {
        console.log(`❌ ${envVar}: 설정되지 않음`);
        validationResults.failed++;
        validationResults.errors.push(`${envVar}가 설정되지 않았습니다.`);
    } else if (PLACEHOLDER_PATTERNS.some(pattern => value.includes(pattern))) {
        console.log(`⚠️  ${envVar}: 플레이스홀더 값 사용 중`);
        validationResults.warnings++;
        validationResults.errors.push(`${envVar}에 실제 값을 설정해주세요.`);
    } else {
        console.log(`✅ ${envVar}: 설정됨`);
        validationResults.passed++;
    }
}

console.log('');

// 3. 환경변수 형식 검증
console.log('🔍 환경변수 형식 검증...');

// Supabase URL 형식 검증
const supabaseUrl = process.env.SUPABASE_URL;
if (supabaseUrl && !supabaseUrl.startsWith('https://') && !supabaseUrl.endsWith('.supabase.co')) {
    console.log('⚠️  SUPABASE_URL 형식이 올바르지 않습니다.');
    validationResults.warnings++;
}

// Redis URL 형식 검증
const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
if (redisUrl && !redisUrl.startsWith('https://') && !redisUrl.includes('upstash.io')) {
    console.log('⚠️  UPSTASH_REDIS_REST_URL 형식이 올바르지 않습니다.');
    validationResults.warnings++;
}

// Google AI API Key 형식 검증
const googleAiKey = process.env.GOOGLE_AI_API_KEY;
if (googleAiKey && !googleAiKey.startsWith('AIzaSy')) {
    console.log('⚠️  GOOGLE_AI_API_KEY 형식이 올바르지 않습니다.');
    validationResults.warnings++;
}

console.log('');

// 4. 보안 검증
console.log('🔒 보안 검증...');

// 하드코딩된 시크릿 검사
const hardcodedSecrets = [
    'AbYGAAIjcDE5MjNmYjhiZDkwOGQ0MTUyOGZiZjUyMmQ0YTkyMzIwM3AxMA',
    'charming-condor-46598.upstash.io',
    'Ov23liFnUsRO0ttNegju',
    'c7a990fa0259aa25af76ed38ab60a2a69252b2c5'
];

let hardcodedFound = false;
for (const secret of hardcodedSecrets) {
    if (fs.readFileSync('.env.local', 'utf8').includes(secret)) {
        console.log(`❌ 하드코딩된 시크릿 발견: ${secret.substring(0, 20)}...`);
        validationResults.failed++;
        hardcodedFound = true;
    }
}

if (!hardcodedFound) {
    console.log('✅ 하드코딩된 시크릿 없음');
    validationResults.passed++;
}

console.log('');

// 5. 결과 요약
console.log('📊 검증 결과 요약');
console.log('==========================================');
console.log(`✅ 통과: ${validationResults.passed}개`);
console.log(`❌ 실패: ${validationResults.failed}개`);
console.log(`⚠️  경고: ${validationResults.warnings}개`);
console.log('');

// 6. 상세 오류 메시지
if (validationResults.errors.length > 0) {
    console.log('🔍 상세 오류 목록:');
    validationResults.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
    });
    console.log('');
}

// 7. 권장사항
console.log('💡 권장사항:');
if (validationResults.failed > 0) {
    console.log('- 실패한 환경변수를 설정해주세요.');
    console.log('- ./scripts/setup-env-interactive.sh 스크립트를 사용하세요.');
}
if (validationResults.warnings > 0) {
    console.log('- 플레이스홀더 값을 실제 값으로 교체해주세요.');
    console.log('- 각 서비스의 대시보드에서 올바른 값을 확인하세요.');
}
if (validationResults.passed > 10) {
    console.log('- 로컬 테스트를 실행하세요: npm run dev');
    console.log('- Vercel 환경변수도 설정하세요.');
}

console.log('');

// 8. 최종 판정
if (validationResults.failed === 0 && validationResults.warnings === 0) {
    console.log('🎉 모든 환경변수가 올바르게 설정되었습니다!');
    console.log('');
    console.log('다음 단계:');
    console.log('1. 로컬 테스트: npm run dev');
    console.log('2. Vercel 환경변수 설정');
    console.log('3. 프로덕션 배포');
    process.exit(0);
} else if (validationResults.failed === 0) {
    console.log('⚠️  환경변수 설정에 경고가 있습니다.');
    console.log('위의 권장사항을 확인하고 수정해주세요.');
    process.exit(1);
} else {
    console.log('❌ 환경변수 설정에 오류가 있습니다.');
    console.log('위의 오류를 수정하고 다시 실행해주세요.');
    process.exit(1);
}
