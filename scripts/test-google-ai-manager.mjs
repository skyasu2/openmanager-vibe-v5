#!/usr/bin/env node

/**
 * 🔧 Google AI 매니저 실제 테스트 스크립트
 * OpenManager Vibe v5 - 수정된 암복호화 시스템 검증
 * 
 * 현재 날짜: 2025-01-25 10:54 KST
 */

// 환경변수 설정 (테스트용)
process.env.GOOGLE_AI_ENABLED = 'true';
process.env.NODE_ENV = 'development';

async function testGoogleAIManager() {
    console.log('🔧 Google AI 매니저 실제 테스트 시작...\n');

    try {
        // 동적 import로 Google AI 매니저 불러오기
        const { default: GoogleAIManager, googleAIManager } = await import('../src/lib/google-ai-manager.ts');

        // 싱글톤 인스턴스 가져오기 (이미 생성된 인스턴스 사용)
        console.log('  googleAIManager instance:', googleAIManager ? '✅ 로드됨' : '❌ 로드 실패');

        console.log('📋 1. Google AI 매니저 초기 상태:');
        let status = googleAIManager.getStatus();
        console.log(`  - 초기화 상태: ${status.isInitialized ? '✅' : '❌'}`);
        console.log(`  - API 키 보유: ${status.hasApiKey ? '✅' : '❌'}`);
        console.log(`  - API 키 소스: ${status.apiKeySource}`);
        console.log(`  - 유효성: ${status.isValid ? '✅' : '❌'}\n`);

        console.log('🔧 2. Google AI 매니저 초기화 시도...');
        const initResult = await googleAIManager.initialize();
        console.log(`  초기화 결과: ${initResult ? '✅ 성공' : '❌ 실패'}\n`);

        if (initResult) {
            console.log('📋 3. 초기화 후 상태:');
            status = googleAIManager.getStatus();
            console.log(`  - 초기화 상태: ${status.isInitialized ? '✅' : '❌'}`);
            console.log(`  - API 키 보유: ${status.hasApiKey ? '✅' : '❌'}`);
            console.log(`  - API 키 소스: ${status.apiKeySource}`);
            console.log(`  - 유효성: ${status.isValid ? '✅' : '❌'}\n`);

            console.log('🔑 4. API 키 확인:');
            const apiKey = googleAIManager.getAPIKey();
            if (apiKey) {
                console.log(`  - API 키: ${apiKey.substring(0, 10)}...`);
                console.log(`  - 길이: ${apiKey.length}자`);
                console.log(`  - AIza로 시작: ${apiKey.startsWith('AIza') ? '✅' : '❌'}`);
                console.log(`  - 올바른 키: ${apiKey === 'AIzaSyABC2WATlHIG0Kd-Oj4JSL6wJoqMd3FhvM' ? '✅' : '❌'}\n`);
            } else {
                console.log('  ❌ API 키를 가져올 수 없습니다.\n');
            }

            console.log('🔄 5. 재초기화 테스트:');
            const reinitResult = await googleAIManager.reinitialize();
            console.log(`  재초기화 결과: ${reinitResult ? '✅ 성공' : '❌ 실패'}\n`);
        }

        console.log('✅ Google AI 매니저 테스트 완료!');

    } catch (error) {
        console.error('❌ Google AI 매니저 테스트 실패:', error.message);
        console.error('전체 오류:', error);
    }
}

testGoogleAIManager(); 