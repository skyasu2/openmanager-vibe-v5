/**
 * 🚀 한국어 NLP 성능 분석 및 최적화 도구
 * 
 * 목표:
 * - Vercel 환경에서 한국어 처리 성능 분석
 * - 품질 vs 속도 트레이드오프 분석
 * - 최적화 권장사항 제공
 */

const { performance } = require('perf_hooks');

// 테스트 환경 설정
const VERCEL_URL = 'https://openmanager-vibe-v5.vercel.app';
const LOCAL_URL = 'http://localhost:3000';

// Vercel 플랜별 제한사항
const VERCEL_LIMITS = {
    HOBBY: { timeout: 10000, memory: 1024 },
    PRO: { timeout: 60000, memory: 3008 },
    ENTERPRISE: { timeout: 900000, memory: 3008 }
};

// 복잡도별 테스트 쿼리
const TEST_QUERIES = [
    {
        name: '단순 쿼리',
        query: '서버 상태 확인',
        complexity: 'basic',
        expectedTime: 2000,
        expectedQuality: 0.75
    },
    {
        name: '중간 복잡도',
        query: '웹서버 CPU 사용률이 높아서 응답시간이 느려지고 있어요',
        complexity: 'intermediate',
        expectedTime: 4000,
        expectedQuality: 0.75
    },
    {
        name: '복잡한 쿼리',
        query: '데이터베이스 서버 클러스터에서 메모리 누수가 발생해서 로드밸런서 처리량이 급격히 감소하고 있습니다',
        complexity: 'advanced',
        expectedTime: 6000,
        expectedQuality: 0.75
    },
    {
        name: '매우 복잡한 쿼리',
        query: '마이크로서비스 아키텍처에서 API 게이트웨이와 서비스 메시 간의 네트워크 레이턴시가 증가하면서 분산 트랜잭션 처리 성능이 저하되고 있고, 동시에 Redis 클러스터의 메모리 파편화로 인한 캐시 미스율이 상승하여 전체 시스템의 응답시간이 평소 대비 300% 증가했습니다',
        complexity: 'very_advanced',
        expectedTime: 8000,
        expectedQuality: 0.70
    }
];

class PerformanceAnalyzer {
    constructor() {
        this.results = [];
        this.stats = {
            totalTests: 0,
            successfulTests: 0,
            averageResponseTime: 0,
            averageQuality: 0,
            vercelCompatibility: {
                HOBBY: { compatible: true, issues: [] },
                PRO: { compatible: true, issues: [] },
                ENTERPRISE: { compatible: true, issues: [] }
            }
        };
    }

    async analyzePerformance(baseUrl = VERCEL_URL) {
        console.log('🚀 한국어 NLP 성능 분석 시작');
        console.log('='.repeat(60));
        console.log(`🌐 테스트 URL: ${baseUrl}`);
        console.log(`📊 테스트 쿼리 수: ${TEST_QUERIES.length}`);
        console.log('');

        for (const testCase of TEST_QUERIES) {
            console.log(`\n🧪 테스트: ${testCase.name}`);
            console.log(`📝 쿼리: "${testCase.query.substring(0, 80)}${testCase.query.length > 80 ? '...' : ''}"`);
            console.log(`🎯 목표: ${testCase.expectedTime}ms, 품질 ${Math.round(testCase.expectedQuality * 100)}%`);

            const result = await this.testQuery(baseUrl, testCase);
            this.results.push(result);

            this.displayResult(result, testCase);

            // API 제한 방지를 위한 대기
            await this.sleep(2000);
        }

        this.analyzeResults();
        this.generateRecommendations();
    }

    async testQuery(baseUrl, testCase) {
        const startTime = performance.now();

        try {
            const response = await fetch(`${baseUrl}/api/ai/unified-query`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json; charset=utf-8',
                },
                body: JSON.stringify({
                    query: testCase.query,
                    mode: 'LOCAL',
                    category: 'server-monitoring',
                    context: {
                        timestamp: new Date().toISOString(),
                        source: 'performance-analysis',
                        complexity: testCase.complexity,
                    }
                })
            });

            const endTime = performance.now();
            const responseTime = Math.round(endTime - startTime);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();

            return {
                success: true,
                testCase: testCase.name,
                complexity: testCase.complexity,
                responseTime,
                confidence: result.confidence || 0,
                engine: result.engine,
                enginePath: result.enginePath || [],
                fallbacksUsed: result.fallbacksUsed || 0,
                koreanAnalysis: result.metadata?.koreanAnalysis,
                expectedTime: testCase.expectedTime,
                expectedQuality: testCase.expectedQuality,
                metGoals: {
                    time: responseTime <= testCase.expectedTime,
                    quality: (result.confidence || 0) >= testCase.expectedQuality
                }
            };

        } catch (error) {
            const endTime = performance.now();
            const responseTime = Math.round(endTime - startTime);

            return {
                success: false,
                testCase: testCase.name,
                complexity: testCase.complexity,
                responseTime,
                error: error.message,
                expectedTime: testCase.expectedTime,
                expectedQuality: testCase.expectedQuality,
                metGoals: { time: false, quality: false }
            };
        }
    }

    displayResult(result, testCase) {
        const timeIcon = result.metGoals?.time ? '✅' : '⚠️';
        const qualityIcon = result.metGoals?.quality ? '✅' : '⚠️';

        if (result.success) {
            console.log(`${timeIcon} 응답시간: ${result.responseTime}ms (목표: ${testCase.expectedTime}ms)`);
            console.log(`${qualityIcon} 품질: ${Math.round((result.confidence || 0) * 100)}% (목표: ${Math.round(testCase.expectedQuality * 100)}%)`);
            console.log(`🔧 엔진: ${result.engine}`);
            console.log(`🛤️ 경로: ${result.enginePath.join(' → ') || 'N/A'}`);
            console.log(`🔄 폴백: ${result.fallbacksUsed}회`);

            if (result.koreanAnalysis) {
                console.log(`🇰🇷 한국어 분석: ✅ (처리시간: ${result.koreanAnalysis.qualityMetrics?.processingTime || 'N/A'}ms)`);
            } else {
                console.log(`🇰🇷 한국어 분석: ❌ (기본 엔진 사용)`);
            }
        } else {
            console.log(`❌ 실패: ${result.error}`);
            console.log(`⏱️ 실패시간: ${result.responseTime}ms`);
        }
    }

    analyzeResults() {
        console.log('\n\n📊 성능 분석 결과');
        console.log('='.repeat(60));

        const successful = this.results.filter(r => r.success);
        const failed = this.results.filter(r => !r.success);

        this.stats.totalTests = this.results.length;
        this.stats.successfulTests = successful.length;

        if (successful.length > 0) {
            this.stats.averageResponseTime = successful.reduce((sum, r) => sum + r.responseTime, 0) / successful.length;
            this.stats.averageQuality = successful.reduce((sum, r) => sum + (r.confidence || 0), 0) / successful.length;
        }

        console.log(`✅ 성공률: ${successful.length}/${this.results.length} (${Math.round(successful.length / this.results.length * 100)}%)`);
        console.log(`⏱️ 평균 응답시간: ${Math.round(this.stats.averageResponseTime)}ms`);
        console.log(`🎯 평균 품질: ${Math.round(this.stats.averageQuality * 100)}%`);

        // 복잡도별 분석
        console.log('\n📈 복잡도별 성능:');
        const complexityGroups = this.groupByComplexity(successful);

        Object.entries(complexityGroups).forEach(([complexity, results]) => {
            if (results.length > 0) {
                const avgTime = results.reduce((sum, r) => sum + r.responseTime, 0) / results.length;
                const avgQuality = results.reduce((sum, r) => sum + (r.confidence || 0), 0) / results.length;
                const timeGoals = results.filter(r => r.metGoals?.time).length;
                const qualityGoals = results.filter(r => r.metGoals?.quality).length;

                console.log(`  ${complexity}: ${Math.round(avgTime)}ms, ${Math.round(avgQuality * 100)}% (목표달성: 시간 ${timeGoals}/${results.length}, 품질 ${qualityGoals}/${results.length})`);
            }
        });

        // Vercel 호환성 분석
        this.analyzeVercelCompatibility();

        // 한국어 NLP 활성화 상태 분석
        this.analyzeKoreanNLPStatus();
    }

    groupByComplexity(results) {
        return results.reduce((groups, result) => {
            const complexity = result.complexity;
            if (!groups[complexity]) groups[complexity] = [];
            groups[complexity].push(result);
            return groups;
        }, {});
    }

    analyzeVercelCompatibility() {
        console.log('\n🌐 Vercel 호환성 분석:');

        Object.entries(VERCEL_LIMITS).forEach(([plan, limits]) => {
            const compatibleTests = this.results.filter(r =>
                r.success && r.responseTime <= limits.timeout
            );

            const compatibility = compatibleTests.length / this.results.length;
            const status = compatibility >= 0.8 ? '✅' : compatibility >= 0.6 ? '⚠️' : '❌';

            console.log(`  ${plan}: ${status} ${Math.round(compatibility * 100)}% 호환 (제한: ${limits.timeout / 1000}초)`);

            this.stats.vercelCompatibility[plan] = {
                compatible: compatibility >= 0.8,
                compatibility: compatibility,
                issues: compatibility < 0.8 ? ['타임아웃 초과'] : []
            };
        });
    }

    analyzeKoreanNLPStatus() {
        console.log('\n🇰🇷 한국어 NLP 엔진 상태:');

        const koreanAnalysisResults = this.results.filter(r =>
            r.success && r.koreanAnalysis
        );

        const activationRate = koreanAnalysisResults.length / this.results.length;

        if (activationRate > 0.8) {
            console.log(`✅ 한국어 NLP 활성화: ${Math.round(activationRate * 100)}% (우수)`);
        } else if (activationRate > 0.5) {
            console.log(`⚠️ 한국어 NLP 활성화: ${Math.round(activationRate * 100)}% (개선 필요)`);
        } else {
            console.log(`❌ 한국어 NLP 활성화: ${Math.round(activationRate * 100)}% (문제 있음)`);
        }

        if (koreanAnalysisResults.length > 0) {
            const avgProcessingTime = koreanAnalysisResults
                .filter(r => r.koreanAnalysis.qualityMetrics?.processingTime)
                .reduce((sum, r) => sum + r.koreanAnalysis.qualityMetrics.processingTime, 0) / koreanAnalysisResults.length;

            console.log(`   평균 한국어 처리시간: ${Math.round(avgProcessingTime)}ms`);
        }
    }

    generateRecommendations() {
        console.log('\n💡 최적화 권장사항');
        console.log('='.repeat(60));

        const recommendations = [];

        // 응답시간 최적화
        if (this.stats.averageResponseTime > 5000) {
            recommendations.push({
                priority: 'HIGH',
                category: '성능',
                issue: `평균 응답시간이 ${Math.round(this.stats.averageResponseTime)}ms로 너무 깁니다`,
                solution: '병렬 처리 최적화 및 캐싱 시스템 도입 필요'
            });
        }

        // 품질 개선
        if (this.stats.averageQuality < 0.75) {
            recommendations.push({
                priority: 'HIGH',
                category: '품질',
                issue: `평균 품질이 ${Math.round(this.stats.averageQuality * 100)}%로 목표 미달`,
                solution: '한국어 NLP 엔진 튜닝 및 RAG 데이터 품질 개선 필요'
            });
        }

        // Vercel 호환성
        if (!this.stats.vercelCompatibility.HOBBY.compatible) {
            recommendations.push({
                priority: 'CRITICAL',
                category: 'Vercel',
                issue: 'HOBBY 플랜 호환성 문제',
                solution: '처리 시간을 10초 이내로 최적화 필요'
            });
        }

        // 한국어 NLP 활성화
        const koreanNLPRate = this.results.filter(r => r.koreanAnalysis).length / this.results.length;
        if (koreanNLPRate < 0.8) {
            recommendations.push({
                priority: 'HIGH',
                category: '한국어 처리',
                issue: `한국어 NLP 활성화율이 ${Math.round(koreanNLPRate * 100)}%로 낮음`,
                solution: 'OptimizedKoreanNLPEngine 통합 및 라우팅 로직 개선 필요'
            });
        }

        // 권장사항 출력
        if (recommendations.length === 0) {
            console.log('🎉 모든 성능 지표가 목표를 달성했습니다!');
        } else {
            recommendations.forEach((rec, index) => {
                const priorityIcon = rec.priority === 'CRITICAL' ? '🔴' : rec.priority === 'HIGH' ? '🟡' : '🟢';
                console.log(`${index + 1}. ${priorityIcon} [${rec.category}] ${rec.issue}`);
                console.log(`   💡 해결방안: ${rec.solution}\n`);
            });
        }

        // 구체적인 구현 가이드
        console.log('\n🛠️ 구현 가이드');
        console.log('='.repeat(60));

        if (this.stats.averageResponseTime > 5000) {
            console.log('1. 병렬 처리 최적화:');
            console.log('   - 3-4단계 (RAG + MCP) 병렬 실행');
            console.log('   - Promise.all() 활용');
            console.log('   - 단계별 타임아웃 설정\n');
        }

        if (koreanNLPRate < 0.8) {
            console.log('2. 한국어 NLP 엔진 통합:');
            console.log('   - OptimizedKoreanNLPEngine을 UnifiedAIEngineRouter에 통합');
            console.log('   - 한국어 쿼리 우선 라우팅 구현');
            console.log('   - 5단계 최적화 파이프라인 적용\n');
        }

        console.log('3. Vercel 최적화:');
        console.log('   - maxProcessingTime을 8초로 설정');
        console.log('   - 메모리 사용량 모니터링');
        console.log('   - 에러 핸들링 강화');
    }

    async sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// 메인 실행
async function main() {
    const analyzer = new PerformanceAnalyzer();

    try {
        await analyzer.analyzePerformance();
    } catch (error) {
        console.error('❌ 성능 분석 실패:', error);
    }
}

if (require.main === module) {
    main();
}

module.exports = { PerformanceAnalyzer }; 