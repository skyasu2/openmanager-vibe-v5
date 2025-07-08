#!/usr/bin/env node

/**
 * 🚀 Supabase RAG 환경 설정 스크립트 (OpenAI 제거)
 * 
 * 이 스크립트는 Supabase 벡터 DB만을 활용한 RAG 시스템을 위한
 * 환경변수를 자동으로 설정합니다. (OpenAI 의존성 완전 제거)
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Supabase RAG 환경 설정 시작 (OpenAI 제거 버전)...\n');

// .env.local 파일 경로
const envPath = path.join(process.cwd(), '.env.local');

// 필수 환경변수 설정 (OpenAI 제거, Slack 제거)
const requiredEnvVars = {
    // Supabase 설정 (벡터 DB) - 1차 환경변수
    'NEXT_PUBLIC_SUPABASE_URL': 'https://vnswjnltnhpsueosfhmw.supabase.co',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZuc3dqbmx0bmhwc3Vlb3NmaG13Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc5MjMzMjcsImV4cCI6MjA2MzQ5OTMyN30.09ApSnuXNv_yYVJWQWGpOFWw3tkLbxSA21k5sroChGU',

    // Supabase 설정 (벡터 DB) - 2차 환경변수 (Vercel 배포용)
    'ENCRYPTED_SUPABASE_URL': 'https://vnswjnltnhpsueosfhmw.supabase.co',
    'ENCRYPTED_SUPABASE_KEY': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZuc3dqbmx0bmhwc3Vlb3NmaG13Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc5MjMzMjcsImV4cCI6MjA2MzQ5OTMyN30.09ApSnuXNv_yYVJWQWGpOFWw3tkLbxSA21k5sroChGU',

    // RAG 엔진 설정
    'FORCE_SUPABASE_RAG': 'true',
    'RAG_VECTOR_DIMENSION': '384',
    'RAG_SIMILARITY_THRESHOLD': '0.7',
    'RAG_MAX_RESULTS': '5',
    'RAG_ENGINE_TYPE': 'SUPABASE_ONLY',

    // 기존 설정 유지 (OpenAI 제거, Slack 제거)
    'GOOGLE_AI_API_KEY': 'YOUR_GOOGLE_AI_API_KEY_HERE',
    'GOOGLE_AI_ENABLED': 'true',
    'REDIS_URL': 'redis://default:AbYGAAIjcDE5MjNmYjhiZDkwOGQ0MTUyOGFiZjUyMmQ0YTkyMzIwM3AxMA@charming-condor-46598.upstash.io:6379'
};

// 기존 .env.local 파일 읽기
let existingEnv = {};
if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0 && !key.startsWith('#')) {
            existingEnv[key.trim()] = valueParts.join('=').trim();
        }
    });
    console.log('📄 기존 .env.local 파일 발견, 병합 중...');
} else {
    console.log('📄 새로운 .env.local 파일 생성 중...');
}

// OpenAI 및 Slack 관련 환경변수 제거
delete existingEnv.OPENAI_API_KEY;
delete existingEnv.OPENAI_ENABLED;
delete existingEnv.SLACK_WEBHOOK_URL;

// 환경변수 병합
const mergedEnv = { ...existingEnv, ...requiredEnvVars };

// .env.local 파일 생성
const envContent = [
    '# 🔐 OpenManager Vibe v5 - Supabase RAG 환경변수 (OpenAI/Slack 제거)',
    '# 자동 생성됨: ' + new Date().toISOString(),
    '',
    '# ===========================================',
    '# 🗄️ SUPABASE 설정 (벡터 DB) - 1차 점검',
    '# ===========================================',
    `NEXT_PUBLIC_SUPABASE_URL=${mergedEnv.NEXT_PUBLIC_SUPABASE_URL}`,
    `NEXT_PUBLIC_SUPABASE_ANON_KEY=${mergedEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
    '',
    '# ===========================================',
    '# 🗄️ SUPABASE 설정 (벡터 DB) - 2차 점검 (Vercel용)',
    '# ===========================================',
    `ENCRYPTED_SUPABASE_URL=${mergedEnv.ENCRYPTED_SUPABASE_URL}`,
    `ENCRYPTED_SUPABASE_KEY=${mergedEnv.ENCRYPTED_SUPABASE_KEY}`,
    '',
    '# ===========================================',
    '# 🔧 RAG 엔진 설정 (OpenAI 제거)',
    '# ===========================================',
    `FORCE_SUPABASE_RAG=${mergedEnv.FORCE_SUPABASE_RAG}`,
    `RAG_VECTOR_DIMENSION=${mergedEnv.RAG_VECTOR_DIMENSION}`,
    `RAG_SIMILARITY_THRESHOLD=${mergedEnv.RAG_SIMILARITY_THRESHOLD}`,
    `RAG_MAX_RESULTS=${mergedEnv.RAG_MAX_RESULTS}`,
    `RAG_ENGINE_TYPE=${mergedEnv.RAG_ENGINE_TYPE}`,
    '',
    '# ===========================================',
    '# 🤖 기존 AI 설정',
    '# ===========================================',
    `GOOGLE_AI_API_KEY=${mergedEnv.GOOGLE_AI_API_KEY}`,
    `GOOGLE_AI_ENABLED=${mergedEnv.GOOGLE_AI_ENABLED}`,
    '',
    '# ===========================================',
    '# 📊 기존 서비스 설정',
    '# ===========================================',
    `REDIS_URL=${mergedEnv.REDIS_URL}`,
    ''
].join('\n');

try {
    fs.writeFileSync(envPath, envContent);
    console.log('✅ .env.local 파일 생성/업데이트 완료! (OpenAI/Slack 제거)');
    console.log('📁 위치:', envPath);

    console.log('\n🔍 설정된 환경변수:');
    Object.entries(requiredEnvVars).forEach(([key, value]) => {
        const displayValue = value.length > 50 ? value.substring(0, 50) + '...' : value;
        console.log(`   ${key}=${displayValue}`);
    });

    console.log('\n✅ 주요 개선사항:');
    console.log('   1. ❌ OpenAI API 의존성 완전 제거');
    console.log('   2. ❌ Slack 알림 기능 완전 제거');
    console.log('   3. 🔧 로컬 임베딩 생성 시스템 적용');
    console.log('   4. 🔍 Vercel 배포용 2회 환경변수 점검 시스템');
    console.log('   5. 📊 Supabase 벡터 DB 전용 최적화');

    console.log('\n⚠️  다음 단계:');
    console.log('   1. 개발 서버 재시작: npm run dev');
    console.log('   2. RAG 시스템 테스트: /api/test-supabase-rag');
    console.log('   3. Vercel 환경변수 동기화 확인');

} catch (error) {
    console.error('❌ 환경변수 파일 생성 실패:', error.message);
    process.exit(1);
}

console.log('\n🎉 Supabase RAG 환경 설정 완료! (OpenAI/Slack 제거 버전)'); 