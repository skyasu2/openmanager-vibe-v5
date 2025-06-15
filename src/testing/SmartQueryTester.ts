/**
 * 스마트 질의 테스터 모듈
 * 바로바로 테스트할 수 있는 완전한 테스트 시스템
 */

import { SmartQueryProcessor } from '@/services/ai/SmartQueryProcessor';

interface TestCase {
    name: string;
    query: string;
    expectedIntent: 'datetime' | 'weather' | 'mixed' | 'general';
    expectedTypos: boolean;
    expectedLocalProcessing: boolean;
    expectedLearning: boolean;
    description: string;
}

interface TestResult {
    testCase: TestCase;
    result: any;
    passed: boolean;
    errors: string[];
    executionTime: number;
    timestamp: string;
}

interface TestSuite {
    name: string;
    tests: TestCase[];
}

export class SmartQueryTester {
    private processor: SmartQueryProcessor;
    private testResults: TestResult[] = [];

    constructor() {
        this.processor = new SmartQueryProcessor();
    }

    /**
     * 미리 정의된 테스트 케이스들
     */
    private getTestSuites(): TestSuite[] {
        return [
            {
                name: '날짜/시간 테스트',
                tests: [
                    {
                        name: '기본 시간 질의',
                        query: '지금 몇시인가요?',
                        expectedIntent: 'datetime',
                        expectedTypos: false,
                        expectedLocalProcessing: true,
                        expectedLearning: false,
                        description: '기본적인 시간 질의 - 로컬에서 즉시 처리 가능'
                    },
                    {
                        name: '오타 포함 시간 질의',
                        query: '지금 몇시인가여?',
                        expectedIntent: 'datetime',
                        expectedTypos: true,
                        expectedLocalProcessing: true,
                        expectedLearning: false,
                        description: '오타가 포함된 시간 질의 - 교정 후 처리'
                    },
                    {
                        name: '날짜 질의',
                        query: '오늘 날짜 알려주세요',
                        expectedIntent: 'datetime',
                        expectedTypos: false,
                        expectedLocalProcessing: true,
                        expectedLearning: false,
                        description: '날짜 정보 요청 - 서버 로컬에서 제공'
                    },
                    {
                        name: '현재 시간 질의',
                        query: '현재 시간은?',
                        expectedIntent: 'datetime',
                        expectedTypos: false,
                        expectedLocalProcessing: true,
                        expectedLearning: false,
                        description: '현재 시간 요청 - 즉시 응답 가능'
                    }
                ]
            },
            {
                name: '날씨 테스트',
                tests: [
                    {
                        name: '기본 날씨 질의',
                        query: '오늘 날씨는 어때요?',
                        expectedIntent: 'weather',
                        expectedTypos: false,
                        expectedLocalProcessing: false,
                        expectedLearning: false,
                        description: '날씨 정보 요청 - 외부 API 필요'
                    },
                    {
                        name: '오타 포함 날씨 질의',
                        query: '오늘 날시는 어떄요?',
                        expectedIntent: 'weather',
                        expectedTypos: true,
                        expectedLocalProcessing: false,
                        expectedLearning: false,
                        description: '오타가 포함된 날씨 질의 - 교정 후 외부 API 필요'
                    },
                    {
                        name: '기온 질의',
                        query: '지금 기온이 몇도인가요?',
                        expectedIntent: 'weather',
                        expectedTypos: false,
                        expectedLocalProcessing: false,
                        expectedLearning: false,
                        description: '기온 정보 요청 - 실시간 데이터 필요'
                    }
                ]
            },
            {
                name: '복합 질의 테스트',
                tests: [
                    {
                        name: '시간+날씨 질의',
                        query: '지금 시간과 날씨를 알려주세요',
                        expectedIntent: 'mixed',
                        expectedTypos: false,
                        expectedLocalProcessing: true,
                        expectedLearning: false,
                        description: '시간(로컬)+날씨(외부API) 복합 질의'
                    },
                    {
                        name: '오타 포함 복합 질의',
                        query: '지금 몇시인가여? 오늘 날시는 어떄요?',
                        expectedIntent: 'mixed',
                        expectedTypos: true,
                        expectedLocalProcessing: true,
                        expectedLearning: false,
                        description: '오타가 포함된 복합 질의 - 교정 후 혼합 처리'
                    }
                ]
            },
            {
                name: '일반 질의 테스트',
                tests: [
                    {
                        name: '서버 상태 질의',
                        query: '서버 상태는 어떤가요?',
                        expectedIntent: 'general',
                        expectedTypos: false,
                        expectedLocalProcessing: true,
                        expectedLearning: true,
                        description: '일반적인 질의 - 학습 가능'
                    },
                    {
                        name: '알 수 없는 질의',
                        query: '이것은 무엇인가요?',
                        expectedIntent: 'general',
                        expectedTypos: false,
                        expectedLocalProcessing: true,
                        expectedLearning: true,
                        description: '모호한 질의 - 학습을 통한 개선 필요'
                    }
                ]
            }
        ];
    }

    /**
     * 단일 테스트 실행
     */
    async runSingleTest(testCase: TestCase): Promise<TestResult> {
        const startTime = Date.now();
        const errors: string[] = [];
        let passed = true;

        try {
            console.log(`🧪 테스트 실행: ${testCase.name}`);
            console.log(`📝 질의: "${testCase.query}"`);

            // 질의 처리
            const result = await this.processor.processQuery(testCase.query);
            const analysis = this.processor.analyzeQuery(testCase.query);
            const shouldLearn = this.processor.shouldLearn(analysis);
            const canProcessLocally = this.processor.canProcessLocally(analysis);

            // 결과 검증
            if (analysis.intent !== testCase.expectedIntent) {
                errors.push(`의도 불일치: 예상 ${testCase.expectedIntent}, 실제 ${analysis.intent}`);
                passed = false;
            }

            if (analysis.hasTypos !== testCase.expectedTypos) {
                errors.push(`오타 감지 불일치: 예상 ${testCase.expectedTypos}, 실제 ${analysis.hasTypos}`);
                passed = false;
            }

            if (canProcessLocally !== testCase.expectedLocalProcessing) {
                errors.push(`로컬 처리 가능성 불일치: 예상 ${testCase.expectedLocalProcessing}, 실제 ${canProcessLocally}`);
                passed = false;
            }

            if (shouldLearn !== testCase.expectedLearning) {
                errors.push(`학습 필요성 불일치: 예상 ${testCase.expectedLearning}, 실제 ${shouldLearn}`);
                passed = false;
            }

            const executionTime = Date.now() - startTime;

            // 결과 출력
            console.log(`📊 분석 결과:`);
            console.log(`   - 의도: ${analysis.intent} (신뢰도: ${analysis.confidence}%)`);
            console.log(`   - 오타 감지: ${analysis.hasTypos}`);
            console.log(`   - 로컬 처리: ${canProcessLocally}`);
            console.log(`   - 학습 필요: ${shouldLearn}`);
            console.log(`   - 실행 시간: ${executionTime}ms`);

            if (analysis.hasTypos) {
                console.log(`🔧 오타 교정: "${analysis.originalQuery}" → "${analysis.correctedQuery}"`);
            }

            console.log(`💬 응답: ${result.message}`);
            console.log(`${passed ? '✅ 통과' : '❌ 실패'}`);

            if (!passed) {
                console.log(`🚨 오류들:`);
                errors.forEach(error => console.log(`   - ${error}`));
            }

            console.log('─'.repeat(80));

            return {
                testCase,
                result: {
                    analysis,
                    processing: result,
                    capabilities: {
                        canProcessLocally,
                        shouldLearn,
                        requiresExternalAPI: analysis.hasWeather
                    }
                },
                passed,
                errors,
                executionTime,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            const executionTime = Date.now() - startTime;
            const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';

            console.log(`❌ 테스트 실행 중 오류: ${errorMessage}`);
            console.log('─'.repeat(80));

            return {
                testCase,
                result: null,
                passed: false,
                errors: [errorMessage],
                executionTime,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * 커스텀 질의 테스트
     */
    async testCustomQuery(query: string): Promise<TestResult> {
        const customTestCase: TestCase = {
            name: '커스텀 질의',
            query,
            expectedIntent: 'general', // 기본값
            expectedTypos: false,
            expectedLocalProcessing: true,
            expectedLearning: true,
            description: '사용자 정의 질의 테스트'
        };

        return await this.runSingleTest(customTestCase);
    }

    /**
     * 전체 테스트 스위트 실행
     */
    async runAllTests(): Promise<void> {
        console.log('🚀 스마트 질의 처리기 전체 테스트 시작');
        console.log('='.repeat(80));

        const testSuites = this.getTestSuites();
        let totalTests = 0;
        let passedTests = 0;

        for (const suite of testSuites) {
            console.log(`\n📦 테스트 스위트: ${suite.name}`);
            console.log('='.repeat(50));

            for (const testCase of suite.tests) {
                const result = await this.runSingleTest(testCase);
                this.testResults.push(result);

                totalTests++;
                if (result.passed) passedTests++;
            }
        }

        // 최종 결과 요약
        console.log('\n📊 테스트 결과 요약');
        console.log('='.repeat(80));
        console.log(`총 테스트: ${totalTests}개`);
        console.log(`통과: ${passedTests}개`);
        console.log(`실패: ${totalTests - passedTests}개`);
        console.log(`성공률: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

        if (totalTests - passedTests > 0) {
            console.log('\n❌ 실패한 테스트들:');
            this.testResults
                .filter(r => !r.passed)
                .forEach(r => {
                    console.log(`   - ${r.testCase.name}: ${r.errors.join(', ')}`);
                });
        }

        console.log('\n🎉 테스트 완료!');
    }

    /**
     * 특정 카테고리 테스트
     */
    async runCategoryTest(category: 'datetime' | 'weather' | 'mixed' | 'general'): Promise<void> {
        console.log(`🎯 ${category} 카테고리 테스트 시작`);
        console.log('='.repeat(50));

        const testSuites = this.getTestSuites();
        let totalTests = 0;
        let passedTests = 0;

        for (const suite of testSuites) {
            const relevantTests = suite.tests.filter(test => test.expectedIntent === category);

            if (relevantTests.length > 0) {
                console.log(`\n📦 ${suite.name} (${category} 관련)`);

                for (const testCase of relevantTests) {
                    const result = await this.runSingleTest(testCase);
                    totalTests++;
                    if (result.passed) passedTests++;
                }
            }
        }

        console.log(`\n📊 ${category} 테스트 결과: ${passedTests}/${totalTests} 통과`);
    }

    /**
     * 빠른 테스트 (주요 케이스만)
     */
    async runQuickTest(): Promise<void> {
        console.log('⚡ 빠른 테스트 시작');
        console.log('='.repeat(30));

        const quickTests: TestCase[] = [
            {
                name: '시간 질의',
                query: '지금 몇시인가요?',
                expectedIntent: 'datetime',
                expectedTypos: false,
                expectedLocalProcessing: true,
                expectedLearning: false,
                description: '기본 시간 질의'
            },
            {
                name: '날씨 질의',
                query: '오늘 날씨는?',
                expectedIntent: 'weather',
                expectedTypos: false,
                expectedLocalProcessing: false,
                expectedLearning: false,
                description: '기본 날씨 질의'
            },
            {
                name: '오타 복합 질의',
                query: '지금 몇시인가여? 날시는 어떄요?',
                expectedIntent: 'mixed',
                expectedTypos: true,
                expectedLocalProcessing: true,
                expectedLearning: false,
                description: '오타 포함 복합 질의'
            }
        ];

        let passed = 0;
        for (const testCase of quickTests) {
            const result = await this.runSingleTest(testCase);
            if (result.passed) passed++;
        }

        console.log(`⚡ 빠른 테스트 완료: ${passed}/${quickTests.length} 통과`);
    }

    /**
     * 테스트 결과 조회
     */
    getTestResults(): TestResult[] {
        return this.testResults;
    }

    /**
     * 테스트 결과 초기화
     */
    clearResults(): void {
        this.testResults = [];
        console.log('🧹 테스트 결과가 초기화되었습니다.');
    }
} 