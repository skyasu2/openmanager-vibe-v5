#!/usr/bin/env node

import { UnifiedAIEngineRouter } from './src/core/ai/engines/UnifiedAIEngineRouter.js';
import { KoreanMorphologyAnalyzer } from './src/lib/ml/korean-morphology-analyzer.js';

console.log('🤖 UnifiedAIEngineRouter v3.0 테스트 시작\n');

async function testAIEngine() {
    try {
        // AI 엔진 라우터 초기화
        const router = new UnifiedAIEngineRouter();
        console.log('✅ UnifiedAIEngineRouter 초기화 완료\n');

        // 한국어 형태소 분석기 테스트
        console.log('🔤 한국어 형태소 분석기 테스트:');
        const analyzer = new KoreanMorphologyAnalyzer();
        const morphResult = analyzer.analyze('서버 성능이 좋지 않아요. CPU 사용률이 높습니다.');
        console.log('분석 결과:', JSON.stringify(morphResult, null, 2));
        console.log('');

        // 테스트 쿼리들
        const testQueries = [
            {
                query: '서버 성능이 좋지 않아요. CPU 사용률이 높습니다.',
                mode: 'AUTO',
                description: '성능 문제 (AUTO 모드)'
            },
            {
                query: '메모리 사용량이 90%를 넘었어요. 어떻게 해야 하나요?',
                mode: 'LOCAL',
                description: '메모리 문제 (LOCAL 모드)'
            },
            {
                query: '시스템 전체 상태를 확인하고 싶습니다.',
                mode: 'GOOGLE_ONLY',
                description: '시스템 상태 (GOOGLE_ONLY 모드)'
            }
        ];

        // 각 모드별 테스트 실행
        for (const test of testQueries) {
            console.log(`🎯 테스트: ${test.description}`);
            console.log(`📝 쿼리: "${test.query}"`);
            console.log(`🔧 모드: ${test.mode}`);

            const startTime = Date.now();

            try {
                const result = await router.processQuery(test.query, test.mode);
                const duration = Date.now() - startTime;

                console.log('✅ 응답 성공:');
                console.log(`⏱️  처리 시간: ${duration}ms`);
                console.log(`🎯 사용된 엔진: ${result.metadata?.primaryEngine || 'Unknown'}`);
                console.log(`📊 신뢰도: ${result.metadata?.confidence || 'N/A'}`);
                console.log(`💬 응답: ${result.response?.substring(0, 100)}...`);
                console.log('');

            } catch (error) {
                const duration = Date.now() - startTime;
                console.log(`❌ 오류 발생 (${duration}ms):`, error.message);
                console.log('');
            }
        }

        // 상태 정보 확인
        console.log('📊 AI 엔진 상태 정보:');
        const status = await router.getStatus();
        console.log(JSON.stringify(status, null, 2));

    } catch (error) {
        console.error('❌ 테스트 실행 중 오류:', error);
    }
}

// 테스트 실행
testAIEngine().then(() => {
    console.log('\n🏁 테스트 완료');
    process.exit(0);
}).catch(error => {
    console.error('❌ 테스트 실패:', error);
    process.exit(1);
}); 