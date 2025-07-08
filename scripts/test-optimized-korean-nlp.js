/**
 * 🧪 OptimizedKoreanNLPEngine 직접 테스트
 */

// ES 모듈 환경이 아니므로 동적 import 사용
async function testOptimizedKoreanNLP() {
    try {
        console.log('🧪 OptimizedKoreanNLPEngine 직접 테스트 시작\n');

        // 테스트 쿼리들
        const testQueries = [
            '서버 상태 확인',
            '웹서버 CPU 사용률이 높아요',
            '데이터베이스 메모리 누수'
        ];

        for (const query of testQueries) {
            console.log(`📝 테스트 쿼리: "${query}"`);

            try {
                // Vercel API 호출로 테스트
                const response = await fetch('https://openmanager-vibe-v5.vercel.app/api/ai/unified-query', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        query: query,
                        mode: 'LOCAL',
                        category: 'server-monitoring',
                        context: {
                            source: 'optimized-korean-nlp-test',
                            forceKoreanNLP: true
                        }
                    })
                });

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                const result = await response.json();

                console.log(`✅ 응답 성공`);
                console.log(`🔧 엔진: ${result.engine}`);
                console.log(`🛤️ 경로: ${result.enginePath?.join(' → ') || 'N/A'}`);
                console.log(`🇰🇷 한국어 분석: ${result.metadata?.koreanAnalysis ? '✅' : '❌'}`);

                if (result.metadata?.koreanAnalysis) {
                    const ka = result.metadata.koreanAnalysis;
                    console.log(`   - 처리시간: ${ka.qualityMetrics?.processingTime}ms`);
                    console.log(`   - 신뢰도: ${Math.round((ka.qualityMetrics?.confidence || 0) * 100)}%`);
                    console.log(`   - 주제: ${ka.semanticAnalysis?.mainTopic || 'N/A'}`);
                }

                console.log('');

            } catch (error) {
                console.error(`❌ 테스트 실패: ${error.message}\n`);
            }
        }

    } catch (error) {
        console.error('❌ 전체 테스트 실패:', error);
    }
}

// 메인 실행
if (require.main === module) {
    testOptimizedKoreanNLP();
}

module.exports = { testOptimizedKoreanNLP }; 