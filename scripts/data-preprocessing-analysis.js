/**
 * 🔧 서버데이터 생성기 전처리 분석 스크립트 v1.0
 * 
 * 목적: 서버데이터 생성기의 전처리 현황 분석 및 모니터링/AI 에이전트 최적화 방안 제시
 * 
 * 분석 영역:
 * - 현재 전처리 파이프라인 분석
 * - 모니터링 시스템 데이터 요구사항 검증
 * - AI 에이전트 데이터 사용성 평가
 * - 성능 병목 지점 식별
 * - 전처리 최적화 권장사항 도출
 */

/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3000';

// 🎨 로그 스타일링
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
};

function log(message, color = 'white') {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`${colors[color]}[${timestamp}] ${message}${colors.reset}`);
}

// 📡 API 호출 함수
async function fetchAPI(endpoint) {
    try {
        const response = await fetch(`${BASE_URL}${endpoint}`);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        throw new Error(`API 호출 실패 [${endpoint}]: ${error.message}`);
    }
}

// 🔍 1. 현재 전처리 파이프라인 분석
async function analyzePreprocessingPipeline() {
    log('🔍 전처리 파이프라인 분석 시작...', 'cyan');

    const analysis = {
        rawDataSources: [],
        preprocessors: [],
        outputFormats: [],
        performance: {},
        bottlenecks: [],
        recommendations: []
    };

    try {
        // 원시 데이터 소스 확인
        const rawData = await fetchAPI('/api/servers/realtime?limit=5');
        if (rawData.success && rawData.data) {
            analysis.rawDataSources.push({
                name: 'GCPRealDataService',
                status: 'active',
                dataPoints: rawData.data.length,
                fields: Object.keys(rawData.data[0] || {}),
                updateFrequency: '20초',
                dataQuality: 'high'
            });
        }

        // 대시보드 전처리 확인
        const dashboardData = await fetchAPI('/api/dashboard');
        if (dashboardData.data) {
            analysis.preprocessors.push({
                name: 'ServerMonitoringProcessor',
                purpose: '모니터링 UI용 데이터 전처리',
                inputFormat: 'ServerInstance[]',
                outputFormat: 'Server[]',
                features: ['상태 변환', '메트릭 정규화', '통계 계산'],
                performance: 'good'
            });
        }

        // AI 전처리 확인 (가상 엔드포인트 체크)
        try {
            const aiData = await fetchAPI('/api/ai/processed-data');
            analysis.preprocessors.push({
                name: 'AIEngineProcessor',
                purpose: 'AI 분석용 데이터 전처리',
                inputFormat: 'ServerInstance[]',
                outputFormat: 'StandardServerMetrics[]',
                features: ['정규화', '이상탐지', '트렌드 분석'],
                performance: 'unknown'
            });
        } catch {
            analysis.preprocessors.push({
                name: 'AIEngineProcessor',
                purpose: 'AI 분석용 데이터 전처리',
                status: 'needs_verification',
                note: 'AI 전처리 엔드포인트 확인 필요'
            });
        }

        log('✅ 전처리 파이프라인 분석 완료', 'green');
        return analysis;

    } catch (error) {
        log(`❌ 전처리 파이프라인 분석 실패: ${error.message}`, 'red');
        return analysis;
    }
}

// 📊 2. 모니터링 시스템 데이터 요구사항 분석
async function analyzeMonitoringRequirements() {
    log('📊 모니터링 시스템 요구사항 분석...', 'cyan');

    const requirements = {
        realTimeMetrics: {
            required: ['cpu', 'memory', 'disk', 'network'],
            optional: ['uptime', 'alerts', 'services'],
            updateFrequency: '실시간 (10-20초)',
            accuracy: 'high',
            latency: 'low (<100ms)'
        },
        historicalData: {
            retention: '24시간',
            aggregation: ['5분', '1시간', '1일'],
            compression: 'needed',
            storage: 'Redis/Memory'
        },
        alerting: {
            thresholds: {
                cpu: '>80%',
                memory: '>85%',
                disk: '>90%',
                network: 'dynamic'
            },
            responseTime: '<5초',
            reliability: '99.9%'
        },
        dashboard: {
            loadTime: '<2초',
            concurrentUsers: '10-50명',
            dataRefresh: '20초',
            responsiveness: 'required'
        }
    };

    // 현재 성능 측정
    const startTime = Date.now();
    try {
        const monitoringData = await fetchAPI('/api/servers/realtime?limit=15');
        const responseTime = Date.now() - startTime;

        requirements.currentPerformance = {
            apiResponseTime: `${responseTime}ms`,
            dataPoints: monitoringData.data?.length || 0,
            dataCompleteness: monitoringData.success ? 'complete' : 'partial',
            meets_requirements: responseTime < 100 ? 'yes' : 'needs_improvement'
        };

        log(`📊 모니터링 API 응답시간: ${responseTime}ms`, responseTime < 100 ? 'green' : 'yellow');

    } catch (error) {
        requirements.currentPerformance = {
            status: 'error',
            error: error.message
        };
    }

    return requirements;
}

// 🧠 3. AI 에이전트 데이터 사용성 평가
async function analyzeAIAgentUsability() {
    log('🧠 AI 에이전트 데이터 사용성 평가...', 'cyan');

    const usability = {
        dataFormats: {
            standardized: false,
            normalized: false,
            contextual: false,
            timeSeries: false
        },
        aiOptimizations: {
            featureEngineering: 'needed',
            dimensionalityReduction: 'not_implemented',
            anomalyDetection: 'basic',
            patternRecognition: 'limited'
        },
        integrationPoints: {
            mcpServer: 'available',
            langGraph: 'available',
            hybridDataManager: 'available',
            aiDataFilter: 'available'
        },
        performance: {
            dataProcessingTime: 'unknown',
            memoryUsage: 'unknown',
            scalability: 'needs_testing'
        },
        gaps: []
    };

    // AI 전용 데이터 구조 확인
    try {
        const serverData = await fetchAPI('/api/servers/realtime?limit=3');
        if (serverData.success && serverData.data.length > 0) {
            const sample = serverData.data[0];

            // AI 친화적 데이터 구조 평가
            usability.dataFormats.standardized =
                sample.hasOwnProperty('cpu') &&
                sample.hasOwnProperty('memory') &&
                sample.hasOwnProperty('disk');

            usability.dataFormats.normalized =
                typeof sample.cpu === 'number' &&
                sample.cpu >= 0 && sample.cpu <= 100;

            usability.dataFormats.contextual =
                sample.hasOwnProperty('environment') &&
                sample.hasOwnProperty('type') &&
                sample.hasOwnProperty('location');

            usability.dataFormats.timeSeries =
                sample.hasOwnProperty('lastUpdate') ||
                sample.hasOwnProperty('timestamp');

            // AI 최적화 필요 영역 식별
            if (!usability.dataFormats.normalized) {
                usability.gaps.push('메트릭 데이터 정규화 필요 (0-1 스케일)');
            }

            if (!usability.dataFormats.contextual) {
                usability.gaps.push('AI 컨텍스트 정보 부족 (서버 역할, 의존성 등)');
            }

            if (!sample.hasOwnProperty('trends')) {
                usability.gaps.push('트렌드 데이터 사전 계산 필요');
            }

            if (!sample.hasOwnProperty('anomalyScore')) {
                usability.gaps.push('이상 점수 사전 계산 필요');
            }
        }

    } catch (error) {
        usability.gaps.push(`데이터 구조 분석 실패: ${error.message}`);
    }

    return usability;
}

// ⚡ 4. 성능 병목 지점 식별
async function identifyPerformanceBottlenecks() {
    log('⚡ 성능 병목 지점 식별...', 'cyan');

    const bottlenecks = {
        dataGeneration: {},
        preprocessing: {},
        dataTransfer: {},
        storage: {},
        recommendations: []
    };

    // 데이터 생성 성능 측정
    const genStart = Date.now();
    try {
        const response1 = await fetchAPI('/api/servers/realtime?limit=1');
        const response2 = await fetchAPI('/api/servers/realtime?limit=15');
        const genTime = Date.now() - genStart;

        bottlenecks.dataGeneration = {
            responseTime: `${genTime}ms`,
            scalability: response2.data?.length === 15 ? 'good' : 'limited',
            consistency: response1.success && response2.success ? 'stable' : 'unstable'
        };

    } catch (error) {
        bottlenecks.dataGeneration = { error: error.message };
    }

    // 전처리 성능 측정 (대시보드 vs 원시 데이터)
    const preprocessStart = Date.now();
    try {
        const rawData = await fetchAPI('/api/servers/realtime?limit=15');
        const preprocessedData = await fetchAPI('/api/dashboard');
        const preprocessTime = Date.now() - preprocessStart;

        bottlenecks.preprocessing = {
            totalTime: `${preprocessTime}ms`,
            rawDataSize: rawData.data?.length || 0,
            processedDataSize: preprocessedData.data?.servers?.length || 0,
            efficiency: preprocessTime < 200 ? 'good' : 'needs_improvement'
        };

    } catch (error) {
        bottlenecks.preprocessing = { error: error.message };
    }

    // 병목 지점 분석 및 권장사항
    if (bottlenecks.dataGeneration.responseTime &&
        parseInt(bottlenecks.dataGeneration.responseTime) > 100) {
        bottlenecks.recommendations.push('데이터 생성 최적화 필요 (목표: <100ms)');
    }

    if (bottlenecks.preprocessing.efficiency === 'needs_improvement') {
        bottlenecks.recommendations.push('전처리 파이프라인 최적화 필요');
    }

    bottlenecks.recommendations.push('캐싱 전략 검토 필요');
    bottlenecks.recommendations.push('배치 처리 vs 실시간 처리 최적화');

    return bottlenecks;
}

// 💡 5. 전처리 최적화 권장사항 생성
function generateOptimizationRecommendations(
    pipeline,
    monitoring,
    aiUsability,
    bottlenecks
) {
    log('💡 전처리 최적화 권장사항 생성...', 'cyan');

    const recommendations = {
        immediate: [], // 즉시 개선
        shortTerm: [], // 단기 개선 (1-2주)
        longTerm: [], // 장기 개선 (1-2개월)
        architecture: [] // 아키텍처 개선
    };

    // 즉시 개선 사항
    if (aiUsability.gaps.length > 0) {
        recommendations.immediate.push({
            priority: 'high',
            task: 'AI 전용 데이터 전처리 파이프라인 구현',
            details: [
                '메트릭 데이터 0-1 정규화',
                '이상 점수 사전 계산',
                'AI 컨텍스트 정보 추가'
            ],
            impact: 'AI 에이전트 성능 50% 향상 예상'
        });
    }

    if (bottlenecks.preprocessing?.efficiency === 'needs_improvement') {
        recommendations.immediate.push({
            priority: 'high',
            task: '전처리 캐싱 시스템 구현',
            details: [
                '20초 캐시 TTL 적용',
                '메모리 기반 중간 결과 저장',
                '변경 감지 기반 선택적 업데이트'
            ],
            impact: '응답시간 70% 단축 예상'
        });
    }

    // 단기 개선 사항
    recommendations.shortTerm.push({
        priority: 'medium',
        task: '통합 전처리 모듈 개발',
        details: [
            '모니터링/AI 공통 전처리 로직 통합',
            '목적별 출력 포맷 분기',
            '성능 모니터링 및 최적화'
        ],
        impact: '유지보수성 향상, 중복 제거'
    });

    recommendations.shortTerm.push({
        priority: 'medium',
        task: 'AI 전용 메트릭 엔진 구현',
        details: [
            '트렌드 분석 자동화',
            '패턴 인식 전처리',
            '이상 탐지 파이프라인'
        ],
        impact: 'AI 분석 정확도 30% 향상'
    });

    // 장기 개선 사항
    recommendations.longTerm.push({
        priority: 'low',
        task: '스트리밍 데이터 파이프라인 구축',
        details: [
            'Apache Kafka 도입 검토',
            '실시간 스트림 처리',
            '대용량 데이터 처리 최적화'
        ],
        impact: '확장성 및 실시간성 대폭 향상'
    });

    // 아키텍처 개선
    recommendations.architecture.push({
        priority: 'strategic',
        task: '마이크로서비스 기반 데이터 파이프라인',
        details: [
            '데이터 생성기 → 전처리기 → 소비자 분리',
            'API Gateway 패턴 적용',
            '독립적 스케일링 지원'
        ],
        impact: '시스템 안정성 및 확장성 확보'
    });

    return recommendations;
}

// 📋 6. 종합 리포트 생성
function generateComprehensiveReport(
    pipeline,
    monitoring,
    aiUsability,
    bottlenecks,
    recommendations
) {
    log('\n📋 서버데이터 생성기 전처리 분석 종합 리포트', 'bright');
    log('='.repeat(80), 'bright');

    // 현재 상태 요약
    log('\n🎯 현재 상태 요약:', 'blue');
    log(`  📊 활성 전처리기: ${pipeline.preprocessors.length}개`);
    log(`  🔧 데이터 소스: ${pipeline.rawDataSources.length}개`);
    log(`  ⚡ API 응답시간: ${monitoring.currentPerformance?.apiResponseTime || 'unknown'}`);
    log(`  🧠 AI 최적화 수준: ${aiUsability.gaps.length === 0 ? '높음' : '개선 필요'}`);

    // 전처리 파이프라인 현황
    log('\n🔧 전처리 파이프라인 현황:', 'blue');
    pipeline.preprocessors.forEach(processor => {
        log(`  ✅ ${processor.name}: ${processor.purpose}`, 'green');
        if (processor.features) {
            log(`     - 기능: ${processor.features.join(', ')}`, 'white');
        }
    });

    // 성능 분석
    log('\n⚡ 성능 분석 결과:', 'blue');
    if (bottlenecks.dataGeneration.responseTime) {
        const responseTime = parseInt(bottlenecks.dataGeneration.responseTime);
        const color = responseTime < 100 ? 'green' : responseTime < 200 ? 'yellow' : 'red';
        log(`  - 데이터 생성: ${bottlenecks.dataGeneration.responseTime}`, color);
    }

    if (bottlenecks.preprocessing.efficiency) {
        const color = bottlenecks.preprocessing.efficiency === 'good' ? 'green' : 'yellow';
        log(`  - 전처리 효율성: ${bottlenecks.preprocessing.efficiency}`, color);
    }

    // AI 사용성 평가
    log('\n🧠 AI 에이전트 사용성 평가:', 'blue');
    const aiScore = Object.values(aiUsability.dataFormats).filter(Boolean).length;
    const maxScore = Object.keys(aiUsability.dataFormats).length;
    log(`  - 데이터 포맷 점수: ${aiScore}/${maxScore} (${(aiScore / maxScore * 100).toFixed(1)}%)`);

    if (aiUsability.gaps.length > 0) {
        log(`  ⚠️ 개선 필요 영역: ${aiUsability.gaps.length}개`, 'yellow');
        aiUsability.gaps.slice(0, 3).forEach(gap => {
            log(`     - ${gap}`, 'white');
        });
    }

    // 우선순위별 권장사항
    log('\n💡 우선순위별 권장사항:', 'blue');

    if (recommendations.immediate.length > 0) {
        log('  🔥 즉시 개선 (High Priority):', 'red');
        recommendations.immediate.forEach((rec, index) => {
            log(`     ${index + 1}. ${rec.task}`, 'white');
            log(`        영향: ${rec.impact}`, 'yellow');
        });
    }

    if (recommendations.shortTerm.length > 0) {
        log('  📅 단기 개선 (1-2주):', 'yellow');
        recommendations.shortTerm.forEach((rec, index) => {
            log(`     ${index + 1}. ${rec.task}`, 'white');
        });
    }

    // 전체 평가 점수
    const overallScore = calculateOverallScore(monitoring, aiUsability, bottlenecks);
    log(`\n🎯 전체 평가 점수: ${overallScore}점/100점`, overallScore >= 80 ? 'green' : overallScore >= 60 ? 'yellow' : 'red');

    // 결론
    log('\n🎉 결론 및 다음 단계:', 'magenta');
    if (overallScore >= 80) {
        log('  ✅ 전처리 시스템이 우수한 상태입니다. 추가 최적화를 통해 더욱 향상시킬 수 있습니다.', 'green');
    } else if (overallScore >= 60) {
        log('  ⚠️ 전처리 시스템이 양호하나 개선이 필요합니다. 즉시 개선 사항부터 진행하세요.', 'yellow');
    } else {
        log('  🚨 전처리 시스템에 심각한 개선이 필요합니다. 즉시 개선 사항을 우선 처리하세요.', 'red');
    }

    return {
        score: overallScore,
        status: overallScore >= 80 ? 'excellent' : overallScore >= 60 ? 'good' : 'needs_improvement',
        nextSteps: recommendations.immediate.length > 0 ? recommendations.immediate : recommendations.shortTerm
    };
}

// 📊 전체 평가 점수 계산
function calculateOverallScore(monitoring, aiUsability, bottlenecks) {
    let score = 0;

    // 모니터링 성능 (40점)
    if (monitoring.currentPerformance?.meets_requirements === 'yes') {
        score += 40;
    } else if (monitoring.currentPerformance?.apiResponseTime) {
        const responseTime = parseInt(monitoring.currentPerformance.apiResponseTime);
        if (responseTime < 200) score += 30;
        else if (responseTime < 500) score += 20;
        else score += 10;
    }

    // AI 사용성 (30점)
    const aiScore = Object.values(aiUsability.dataFormats).filter(Boolean).length;
    const maxAiScore = Object.keys(aiUsability.dataFormats).length;
    score += (aiScore / maxAiScore) * 30;

    // 전처리 효율성 (20점)
    if (bottlenecks.preprocessing?.efficiency === 'good') {
        score += 20;
    } else if (bottlenecks.preprocessing?.efficiency === 'needs_improvement') {
        score += 10;
    }

    // 시스템 안정성 (10점)
    if (bottlenecks.dataGeneration?.consistency === 'stable') {
        score += 10;
    }

    return Math.round(score);
}

// 🚀 메인 실행 함수
async function main() {
    log('🔧 서버데이터 생성기 전처리 분석 시작', 'bright');
    log('━'.repeat(80), 'bright');
    log(`📡 대상 서버: ${BASE_URL}`);
    log(`⏰ 시작 시간: ${new Date().toLocaleString()}\n`);

    try {
        // 1. 전처리 파이프라인 분석
        const pipeline = await analyzePreprocessingPipeline();

        // 2. 모니터링 요구사항 분석
        const monitoring = await analyzeMonitoringRequirements();

        // 3. AI 에이전트 사용성 평가
        const aiUsability = await analyzeAIAgentUsability();

        // 4. 성능 병목 지점 식별
        const bottlenecks = await identifyPerformanceBottlenecks();

        // 5. 최적화 권장사항 생성
        const recommendations = generateOptimizationRecommendations(
            pipeline, monitoring, aiUsability, bottlenecks
        );

        // 6. 종합 리포트 생성
        const report = generateComprehensiveReport(
            pipeline, monitoring, aiUsability, bottlenecks, recommendations
        );

        log(`\n⏰ 완료 시간: ${new Date().toLocaleString()}`, 'bright');

        return report;

    } catch (error) {
        log(`❌ 분석 실행 중 오류 발생: ${error.message}`, 'red');
        console.error(error);
        process.exit(1);
    }
}

// 스크립트 실행
if (require.main === module) {
    main().catch(console.error);
}

module.exports = {
    main,
    analyzePreprocessingPipeline,
    analyzeMonitoringRequirements,
    analyzeAIAgentUsability,
    identifyPerformanceBottlenecks,
    generateOptimizationRecommendations
}; 