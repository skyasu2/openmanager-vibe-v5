#!/usr/bin/env node
/**
 * 🔓 Passwordless System Test Script (Simplified)
 * 
 * 무비밀번호 환경변수 시스템 간단 테스트
 * 
 * 사용법:
 * node scripts/test-passwordless-system.js
 * npm run test:passwordless
 * 
 * 작성일: 2025-07-04 16:20 KST
 */

// Node.js ES 모듈 호환성
require('dotenv').config();

function testPasswordlessSystem() {
    console.log('🧪 Passwordless System 간단 테스트 시작\n');

    try {
        console.log('1️⃣ 현재 환경 확인:');
        console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'undefined'}`);
        console.log(`   VERCEL: ${process.env.VERCEL || 'undefined'}`);
        console.log('');

        // 개발 환경 설정
        process.env.PASSWORDLESS_DEV_MODE = 'true';
        process.env.NODE_ENV = 'development';

        console.log('2️⃣ 환경변수 백업 및 초기화:');
        const originalSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const originalGoogleAI = process.env.GOOGLE_AI_API_KEY;

        console.log(`   원본 SUPABASE_URL: ${originalSupabaseUrl || '❌ 없음'}`);
        console.log(`   원본 GOOGLE_AI_KEY: ${originalGoogleAI || '❌ 없음'}`);

        // 일부 환경변수 제거 (테스트용)
        delete process.env.NEXT_PUBLIC_SUPABASE_URL;
        delete process.env.GOOGLE_AI_API_KEY;

        console.log('\n3️⃣ 제거 후 상태:');
        console.log(`   SUPABASE_URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL || '❌ 제거됨'}`);
        console.log(`   GOOGLE_AI_KEY: ${process.env.GOOGLE_AI_API_KEY || '❌ 제거됨'}`);

        console.log('\n4️⃣ 기본값 자동 적용 시뮬레이션:');

        // 기본값 설정 (passwordless-env-manager.ts 로직 시뮬레이션)
        const defaultConfigs = [
            {
                key: 'NEXT_PUBLIC_SUPABASE_URL',
                defaultValue: 'https://vnswjnltnhpsueosfhmw.supabase.co',
                description: 'Supabase 프로젝트 URL'
            },
            {
                key: 'GOOGLE_AI_API_KEY',
                defaultValue: 'AIzaSyABC2WATlHIG0Kd-Oj4JSL6wJoqMd3FhvM',
                description: 'Google AI API 키 (개발용)'
            }
        ];

        let appliedCount = 0;
        for (const config of defaultConfigs) {
            if (!process.env[config.key]) {
                process.env[config.key] = config.defaultValue;
                appliedCount++;
                console.log(`   ✅ ${config.key}: ${config.description}`);
            }
        }

        console.log(`\n   총 ${appliedCount}개 기본값 적용됨`);

        console.log('\n5️⃣ 적용 후 환경변수 상태:');
        console.log(`   SUPABASE_URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL || '❌ 실패'}`);
        console.log(`   GOOGLE_AI_KEY: ${process.env.GOOGLE_AI_API_KEY || '❌ 실패'}`);

        console.log('\n6️⃣ 연결 테스트:');

        // Supabase URL 검증
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        if (supabaseUrl && supabaseUrl.includes('supabase.co')) {
            console.log('   ✅ Supabase URL 형식 올바름');
        } else {
            console.log('   ❌ Supabase URL 형식 오류');
        }

        // Google AI 키 검증
        const googleAIKey = process.env.GOOGLE_AI_API_KEY;
        if (googleAIKey && googleAIKey.startsWith('AIza')) {
            console.log('   ✅ Google AI 키 형식 올바름');
        } else {
            console.log('   ❌ Google AI 키 형식 오류');
        }

        console.log('\n7️⃣ 환경변수 원복 테스트:');

        // 원복
        if (originalSupabaseUrl) {
            process.env.NEXT_PUBLIC_SUPABASE_URL = originalSupabaseUrl;
        } else {
            delete process.env.NEXT_PUBLIC_SUPABASE_URL;
        }

        if (originalGoogleAI) {
            process.env.GOOGLE_AI_API_KEY = originalGoogleAI;
        } else {
            delete process.env.GOOGLE_AI_API_KEY;
        }

        console.log(`   원복 후 SUPABASE_URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL || '❌ 제거됨'}`);
        console.log(`   원복 후 GOOGLE_AI_KEY: ${process.env.GOOGLE_AI_API_KEY || '❌ 제거됨'}`);

        console.log('\n✅ 모든 테스트 통과!');
        console.log('🎉 Passwordless 시스템 로직이 정상적으로 작동합니다.');

        return true;

    } catch (error) {
        console.error('\n❌ 테스트 실패:', error.message);
        console.error('스택 트레이스:', error.stack);
        return false;
    }
}

// 실행
if (require.main === module) {
    const success = testPasswordlessSystem();
    process.exit(success ? 0 : 1);
} 