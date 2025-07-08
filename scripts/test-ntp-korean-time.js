#!/usr/bin/env node
/**
 * 🕒 한국시간 NTP 동기화 및 Google AI API 키 테스트
 * 작성일: 2025-07-03 12:38 (KST)
 * 
 * 기능:
 * - NTP 서버 동기화 테스트
 * - 한국시간 정확성 검증
 * - Google AI API 키 유효성 확인
 * - 환경변수 백업 상태 점검
 */

require('dotenv').config({ path: '.env.local' });

console.log('🚀 한국시간 NTP 동기화 및 시스템 점검 시작...');
console.log('='.repeat(60));

// 1. 시스템 시간 정보 표시
console.log('📅 시스템 시간 정보:');
console.log(`   로컬 시간: ${new Date().toString()}`);
console.log(`   UTC 시간: ${new Date().toISOString()}`);
console.log(`   한국시간: ${new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })} (KST)`);
console.log(`   시간대: ${Intl.DateTimeFormat().resolvedOptions().timeZone}`);
console.log();

// 2. 환경변수 확인
console.log('🔧 환경변수 확인:');
console.log(`   NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`   TZ: ${process.env.TZ}`);
console.log(`   GOOGLE_AI_API_KEY: ${process.env.GOOGLE_AI_API_KEY ? '✅ 설정됨 (길이: ' + process.env.GOOGLE_AI_API_KEY.length + ')' : '❌ 미설정'}`);
console.log(`   GOOGLE_AI_MODEL: ${process.env.GOOGLE_AI_MODEL || '미설정'}`);
console.log(`   GOOGLE_AI_DAILY_LIMIT: ${process.env.GOOGLE_AI_DAILY_LIMIT || '미설정'}`);
console.log();

// 3. NTP 동기화 테스트 (간단한 WorldTimeAPI 호출)
async function testNTPSync() {
    console.log('🌐 NTP 시간 동기화 테스트:');

    try {
        const startTime = Date.now();
        const response = await fetch('https://worldtimeapi.org/api/timezone/Asia/Seoul', {
            method: 'GET',
            headers: { 'User-Agent': 'OpenManager-Vibe-v5/Test' }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        const endTime = Date.now();
        const networkDelay = (endTime - startTime) / 2;

        const serverTime = new Date(data.datetime);
        const localTime = new Date();
        const timeDiff = Math.abs(serverTime.getTime() - localTime.getTime());

        console.log(`   WorldTimeAPI 서버: ✅ 연결 성공`);
        console.log(`   서버 시간: ${serverTime.toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })} (KST)`);
        console.log(`   로컬 시간: ${localTime.toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })} (KST)`);
        console.log(`   시간 차이: ${timeDiff}ms (네트워크 지연: ${networkDelay.toFixed(1)}ms)`);
        console.log(`   동기화 상태: ${timeDiff < 5000 ? '✅ 정상 (5초 이내)' : '⚠️ 주의 (5초 초과)'}`);

        return { success: true, timeDiff, networkDelay };
    } catch (error) {
        console.log(`   NTP 동기화: ❌ 실패 - ${error.message}`);
        console.log(`   폴백: 로컬 시간 사용`);
        return { success: false, error: error.message };
    }
}

// 4. Google AI API 키 테스트
async function testGoogleAIKey() {
    console.log('🤖 Google AI API 키 테스트:');

    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) {
        console.log('   ❌ API 키가 설정되지 않음');
        return { success: false, error: 'No API key' };
    }

    try {
        // Google AI API 헬스체크 (단순한 토큰 카운트 API 사용)
        const response = await fetch(`https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`, {
            method: 'GET',
            headers: { 'User-Agent': 'OpenManager-Vibe-v5/Test' }
        });

        if (response.status === 200) {
            const data = await response.json();
            console.log(`   ✅ API 키 유효성: 정상`);
            console.log(`   사용 가능한 모델 수: ${data.models ? data.models.length : 0}개`);

            // Gemini 2.0 Flash 모델 확인
            const gemini20Flash = data.models?.find(m => m.name.includes('gemini-2.0-flash'));
            console.log(`   Gemini 2.0 Flash: ${gemini20Flash ? '✅ 사용 가능' : '⚠️ 확인 필요'}`);

            return { success: true, modelCount: data.models?.length || 0 };
        } else if (response.status === 429) {
            console.log(`   ⚠️ 할당량 초과 (429) - 정상적인 차단`);
            return { success: true, note: 'Quota exceeded but key is valid' };
        } else {
            console.log(`   ❌ API 키 오류: HTTP ${response.status}`);
            return { success: false, status: response.status };
        }
    } catch (error) {
        console.log(`   ❌ API 연결 실패: ${error.message}`);
        return { success: false, error: error.message };
    }
}

// 5. 메인 테스트 실행
async function main() {
    const ntpResult = await testNTPSync();
    console.log();

    const apiResult = await testGoogleAIKey();
    console.log();

    // 결과 요약
    console.log('📊 테스트 결과 요약:');
    console.log(`   NTP 동기화: ${ntpResult.success ? '✅ 성공' : '❌ 실패'}`);
    console.log(`   Google AI API: ${apiResult.success ? '✅ 정상' : '❌ 문제'}`);
    console.log();

    console.log('🎯 권장사항:');
    if (!ntpResult.success) {
        console.log('   - NTP 서버 연결을 확인하세요');
        console.log('   - 네트워크 방화벽 설정을 점검하세요');
    }

    if (!apiResult.success) {
        console.log('   - Google AI API 키를 다시 확인하세요');
        console.log('   - API 할당량 상태를 점검하세요');
    }

    if (ntpResult.success && apiResult.success) {
        console.log('   - 모든 시스템이 정상 작동합니다! 🎉');
    }

    console.log();
    console.log('✅ 테스트 완료:', new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }) + ' (KST)');
}

// 실행
main().catch(console.error); 