#!/usr/bin/env node

/**
 * 🛡️ 커서 폴백 시스템
 * 
 * Google AI API 장애 시 대안:
 * 1. 로컬 RAG 엔진 활용
 * 2. 사전 정의된 패턴 매칭
 * 3. 정적 분석 도구 활용
 * 4. 캐시된 이전 분석 결과 활용
 */

class CursorFallbackSystem {
    constructor() {
        this.fallbackLevels = [
            'google-ai',      // 1차: Google AI
            'local-rag',      // 2차: 로컬 RAG
            'pattern-match',  // 3차: 패턴 매칭
            'static-analysis', // 4차: 정적 분석
            'cached-results'  // 5차: 캐시 결과
        ];

        this.currentLevel = 0;
        this.analysisCache = new Map();

        // 사전 정의된 문제 패턴
        this.problemPatterns = {
            performance: {
                keywords: ['느림', 'slow', '응답시간', 'timeout'],
                solutions: [
                    '캐싱 레이어 추가',
                    'API 호출 최적화',
                    '데이터베이스 쿼리 개선',
                    '번들 크기 최적화'
                ]
            },
            memory: {
                keywords: ['메모리', 'memory', 'heap', 'leak'],
                solutions: [
                    '메모리 누수 점검',
                    '가비지 컬렉션 최적화',
                    '불필요한 객체 정리',
                    '이미지 최적화'
                ]
            },
            api: {
                keywords: ['api', '404', '500', 'error'],
                solutions: [
                    'API 엔드포인트 확인',
                    '에러 핸들링 강화',
                    '재시도 로직 추가',
                    '상태 코드 검증'
                ]
            }
        };
    }

    /**
     * 🔄 다단계 폴백 분석
     */
    async performFallbackAnalysis(systemData) {
        console.log('🛡️ 폴백 시스템 분석 시작...');

        for (let level = 0; level < this.fallbackLevels.length; level++) {
            const fallbackType = this.fallbackLevels[level];

            try {
                console.log(`🔄 ${level + 1}차 폴백: ${fallbackType} 시도 중...`);

                const result = await this.tryFallbackLevel(fallbackType, systemData);

                if (result && result.success) {
                    console.log(`✅ ${fallbackType} 성공!`);
                    return {
                        success: true,
                        fallbackLevel: level + 1,
                        method: fallbackType,
                        result: result.data,
                        timestamp: new Date().toISOString()
                    };
                }

            } catch (error) {
                console.log(`❌ ${fallbackType} 실패: ${error.message}`);
                continue;
            }
        }

        console.log('🚨 모든 폴백 방법 실패');
        return {
            success: false,
            error: '모든 분석 방법이 실패했습니다',
            timestamp: new Date().toISOString()
        };
    }

    /**
     * 개별 폴백 레벨 시도
     */
    async tryFallbackLevel(fallbackType, systemData) {
        switch (fallbackType) {
            case 'google-ai':
                return await this.tryGoogleAI(systemData);

            case 'local-rag':
                return await this.tryLocalRAG(systemData);

            case 'pattern-match':
                return await this.tryPatternMatching(systemData);

            case 'static-analysis':
                return await this.tryStaticAnalysis(systemData);

            case 'cached-results':
                return await this.tryCachedResults(systemData);

            default:
                throw new Error(`Unknown fallback type: ${fallbackType}`);
        }
    }

    /**
     * 1차: Google AI 시도
     */
    async tryGoogleAI(systemData) {
        // 실제 Google AI 호출 시뮬레이션
        const random = Math.random();

        if (random < 0.3) { // 30% 실패율 시뮬레이션
            throw new Error('Google AI API 한도 초과');
        }

        return {
            success: true,
            data: {
                analysis: 'Google AI 분석 결과',
                recommendations: [
                    'API 응답시간 최적화 필요',
                    'Google AI 사용량 제한 관리',
                    '캐싱 레이어 강화'
                ],
                confidence: 0.9
            }
        };
    }

    /**
     * 2차: 로컬 RAG 엔진
     */
    async tryLocalRAG(systemData) {
        console.log('🧠 로컬 RAG 엔진 분석 중...');

        // 로컬 지식 베이스 기반 분석
        const localAnalysis = {
            performanceIssues: [],
            memoryIssues: [],
            apiIssues: []
        };

        // 시스템 데이터 분석
        if (systemData.responseTime > 5000) {
            localAnalysis.performanceIssues.push('응답시간 5초 초과');
        }

        if (systemData.errors && systemData.errors.length > 0) {
            localAnalysis.apiIssues.push(`${systemData.errors.length}개 API 에러 발견`);
        }

        return {
            success: true,
            data: {
                analysis: '로컬 RAG 분석 결과',
                issues: localAnalysis,
                recommendations: this.generateLocalRecommendations(localAnalysis),
                confidence: 0.7
            }
        };
    }

    /**
     * 3차: 패턴 매칭
     */
    async tryPatternMatching(systemData) {
        console.log('🔍 패턴 매칭 분석 중...');

        const matchedPatterns = [];
        const recommendations = [];

        // 시스템 데이터를 문자열로 변환하여 패턴 매칭
        const dataString = JSON.stringify(systemData).toLowerCase();

        for (const [category, pattern] of Object.entries(this.problemPatterns)) {
            const hasMatch = pattern.keywords.some(keyword =>
                dataString.includes(keyword.toLowerCase())
            );

            if (hasMatch) {
                matchedPatterns.push(category);
                recommendations.push(...pattern.solutions);
            }
        }

        if (matchedPatterns.length === 0) {
            throw new Error('매칭되는 패턴 없음');
        }

        return {
            success: true,
            data: {
                analysis: '패턴 매칭 분석 결과',
                matchedPatterns,
                recommendations: [...new Set(recommendations)], // 중복 제거
                confidence: 0.6
            }
        };
    }

    /**
     * 4차: 정적 분석
     */
    async tryStaticAnalysis(systemData) {
        console.log('📊 정적 분석 중...');

        const staticAnalysis = {
            issues: [],
            recommendations: []
        };

        // 기본적인 정적 분석 규칙
        if (systemData.responseTime > 10000) {
            staticAnalysis.issues.push('심각한 성능 문제');
            staticAnalysis.recommendations.push('즉시 성능 최적화 필요');
        }

        if (systemData.errors && systemData.errors.length > 10) {
            staticAnalysis.issues.push('높은 에러율');
            staticAnalysis.recommendations.push('에러 핸들링 개선 필요');
        }

        // 기본 권장사항
        staticAnalysis.recommendations.push(
            '로그 모니터링 강화',
            '헬스 체크 개선',
            '에러 알림 설정'
        );

        return {
            success: true,
            data: {
                analysis: '정적 분석 결과',
                issues: staticAnalysis.issues,
                recommendations: staticAnalysis.recommendations,
                confidence: 0.5
            }
        };
    }

    /**
     * 5차: 캐시된 결과
     */
    async tryCachedResults(systemData) {
        console.log('💾 캐시된 결과 확인 중...');

        // 캐시에서 유사한 분석 결과 찾기
        for (const [key, cachedResult] of this.analysisCache.entries()) {
            if (this.isSimilarData(systemData, cachedResult.originalData)) {
                console.log(`📦 유사한 캐시 결과 발견: ${key}`);

                return {
                    success: true,
                    data: {
                        analysis: '캐시된 분석 결과',
                        ...cachedResult.analysis,
                        note: '이전 분석 결과를 기반으로 한 추정',
                        confidence: 0.3
                    }
                };
            }
        }

        // 기본 폴백 결과
        return {
            success: true,
            data: {
                analysis: '기본 폴백 분석',
                recommendations: [
                    '시스템 재시작 고려',
                    '로그 확인 필요',
                    '수동 점검 권장'
                ],
                confidence: 0.2
            }
        };
    }

    /**
     * 로컬 권장사항 생성
     */
    generateLocalRecommendations(analysis) {
        const recommendations = [];

        if (analysis.performanceIssues.length > 0) {
            recommendations.push('성능 최적화 우선 진행');
        }

        if (analysis.apiIssues.length > 0) {
            recommendations.push('API 에러 해결 필요');
        }

        if (analysis.memoryIssues.length > 0) {
            recommendations.push('메모리 사용량 점검');
        }

        // 기본 권장사항
        recommendations.push(
            '정기적인 시스템 점검',
            '모니터링 도구 활용',
            '백업 및 복구 계획 수립'
        );

        return recommendations;
    }

    /**
     * 데이터 유사성 검사
     */
    isSimilarData(data1, data2) {
        // 간단한 유사성 검사 (실제로는 더 정교한 알고리즘 필요)
        const threshold = 0.7;

        const keys1 = Object.keys(data1 || {});
        const keys2 = Object.keys(data2 || {});

        const commonKeys = keys1.filter(key => keys2.includes(key));
        const similarity = commonKeys.length / Math.max(keys1.length, keys2.length);

        return similarity >= threshold;
    }

    /**
     * 분석 결과 캐싱
     */
    cacheAnalysisResult(systemData, analysis) {
        const cacheKey = `analysis_${Date.now()}`;
        this.analysisCache.set(cacheKey, {
            originalData: systemData,
            analysis,
            timestamp: new Date().toISOString()
        });

        // 캐시 크기 제한 (최대 10개)
        if (this.analysisCache.size > 10) {
            const firstKey = this.analysisCache.keys().next().value;
            this.analysisCache.delete(firstKey);
        }
    }
}

// CLI 실행
async function main() {
    const fallbackSystem = new CursorFallbackSystem();

    // 테스트 데이터
    const testSystemData = {
        responseTime: 16145,
        errors: ['404 error', 'timeout error'],
        status: 'degraded'
    };

    try {
        const result = await fallbackSystem.performFallbackAnalysis(testSystemData);

        console.log('\n🎯 폴백 분석 결과:');
        console.log(JSON.stringify(result, null, 2));

        if (result.success) {
            fallbackSystem.cacheAnalysisResult(testSystemData, result.result);
        }

    } catch (error) {
        console.error('❌ 폴백 시스템 실패:', error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = CursorFallbackSystem; 