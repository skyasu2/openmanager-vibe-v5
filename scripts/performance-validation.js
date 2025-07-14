#!/usr/bin/env node

/**
 * 🚀 실운영 환경 성능 검증 스크립트 v2.0
 * 
 * ✅ 자동화된 성능 테스트 실행
 * ✅ 상세한 성능 리포트 생성
 * ✅ 임계값 기반 Pass/Fail 판정
 * ✅ CI/CD 통합 지원
 */

const fs = require('fs');
const path = require('path');
const { performance } = require('perf_hooks');

// 성능 임계값 설정
const THRESHOLDS = {
    API_RESPONSE_TIME: 5000, // 5초
    AI_RESPONSE_TIME: 10000, // 10초
    DATABASE_QUERY_TIME: 2000, // 2초
    CONCURRENT_REQUESTS: 10,
    SUCCESS_RATE_THRESHOLD: 95, // 95%
    MEMORY_USAGE_THRESHOLD: 80, // 80%
    CPU_USAGE_THRESHOLD: 70 // 70%
};

// 테스트 결과 저장
const testResults = [];
const performanceMetrics = {
    startTime: new Date(),
    endTime: null,
    totalTests: 0,
    passedTests: 0,
    failedTests: 0,
    averageResponseTime: 0,
    maxResponseTime: 0,
    minResponseTime: Infinity,
    successRate: 0
};

// 로깅 함수
function log(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const logEntry = {
        timestamp,
        level,
        message,
        data
    };

    const colors = {
        INFO: '\x1b[36m',  // 청록
        SUCCESS: '\x1b[32m', // 녹색
        WARNING: '\x1b[33m', // 노랑
        ERROR: '\x1b[31m',   // 빨강
        RESET: '\x1b[0m'
    };

    console.log(`${colors[level] || ''}[${level}] ${timestamp} - ${message}${colors.RESET}`);
    if (data) {
        console.log(JSON.stringify(data, null, 2));
    }
}

// 성능 측정 헬퍼
async function measurePerformance(operation, label) {
    const startTime = performance.now();
    try {
        const result = await operation();
        const duration = performance.now() - startTime;

        // 메트릭 업데이트
        performanceMetrics.totalTests++;
        performanceMetrics.passedTests++;

        if (duration > performanceMetrics.maxResponseTime) {
            performanceMetrics.maxResponseTime = duration;
        }
        if (duration < performanceMetrics.minResponseTime) {
            performanceMetrics.minResponseTime = duration;
        }

        log('SUCCESS', `${label}: ${duration.toFixed(2)}ms`);

        return { result, duration, success: true };
    } catch (error) {
        const duration = performance.now() - startTime;
        performanceMetrics.totalTests++;
        performanceMetrics.failedTests++;

        log('ERROR', `${label}: ${duration.toFixed(2)}ms - ${error.message}`);

        return { result: null, duration, success: false, error: error.message };
    }
}

// API 요청 함수
async function apiRequest(endpoint, options = {}) {
    const baseUrl = process.env.TEST_BASE_URL || 'http://localhost:3000';
    const url = `${baseUrl}${endpoint}`;

    const defaultOptions = {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Performance-Validator/2.0'
        },
        timeout: 30000
    };

    const finalOptions = { ...defaultOptions, ...options };

    return fetch(url, finalOptions);
}

// 동시 요청 테스트
async function concurrentTest(endpoint, count = THRESHOLDS.CONCURRENT_REQUESTS) {
    log('INFO', `동시 요청 테스트 시작: ${endpoint} (${count}개 요청)`);

    const promises = Array(count).fill(null).map((_, index) =>
        measurePerformance(
            () => apiRequest(endpoint),
            `동시요청-${index + 1}`
        )
    );

    const results = await Promise.allSettled(promises);
    const successCount = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
    const successRate = (successCount / count) * 100;

    log('INFO', `동시 요청 결과: ${successCount}/${count} 성공 (${successRate.toFixed(2)}%)`);

    return {
        total: count,
        successful: successCount,
        failed: count - successCount,
        successRate,
        results: results.map(r => r.status === 'fulfilled' ? r.value : { success: false, error: r.reason })
    };
}

// 시스템 리소스 모니터링
function getSystemMetrics() {
    try {
        const memUsage = process.memoryUsage();
        const cpuUsage = process.cpuUsage();

        return {
            memory: {
                used: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
                total: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
                external: Math.round(memUsage.external / 1024 / 1024), // MB
                usage: Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100) // %
            },
            cpu: {
                user: cpuUsage.user,
                system: cpuUsage.system
            },
            uptime: Math.round(process.uptime()),
            pid: process.pid
        };
    } catch (error) {
        log('WARNING', '시스템 메트릭 수집 실패', error.message);
        return null;
    }
}

// 개별 API 테스트
async function testApiEndpoints() {
    log('INFO', '📡 API 엔드포인트 성능 테스트 시작');

    const endpoints = [
        { path: '/api/system/status', name: '시스템 상태' },
        { path: '/api/performance', name: '성능 모니터링' },
        { path: '/api/logs?limit=50', name: '로그 시스템' },
        { path: '/api/health', name: '헬스 체크' }
    ];

    for (const endpoint of endpoints) {
        const test = await measurePerformance(
            async () => {
                const response = await apiRequest(endpoint.path);
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                return response.json();
            },
            endpoint.name
        );

        testResults.push({
            category: 'API',
            name: endpoint.name,
            endpoint: endpoint.path,
            ...test,
            timestamp: new Date().toISOString()
        });

        // 임계값 검증
        if (test.success && test.duration > THRESHOLDS.API_RESPONSE_TIME) {
            log('WARNING', `${endpoint.name} 응답시간 임계값 초과: ${test.duration.toFixed(2)}ms > ${THRESHOLDS.API_RESPONSE_TIME}ms`);
        }
    }
}

// AI 엔진 테스트
async function testAIEngines() {
    log('INFO', '🤖 AI 엔진 성능 테스트 시작');

    const aiTests = [
        {
            name: '통합 AI 엔진',
            endpoint: '/api/ai/unified-query',
            payload: {
                query: '시스템 상태를 간단히 확인해주세요',
                mode: 'AUTO',
                includeThinking: false
            }
        },
        {
            name: 'MCP 컨텍스트',
            endpoint: '/api/mcp/context-analysis',
            payload: {
                query: 'system status'
            }
        }
    ];

    for (const aiTest of aiTests) {
        const test = await measurePerformance(
            async () => {
                const response = await apiRequest(aiTest.endpoint, {
                    method: 'POST',
                    body: JSON.stringify(aiTest.payload)
                });

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                return response.json();
            },
            aiTest.name
        );

        testResults.push({
            category: 'AI',
            name: aiTest.name,
            endpoint: aiTest.endpoint,
            ...test,
            timestamp: new Date().toISOString()
        });

        // AI 엔진 임계값 검증
        if (test.success && test.duration > THRESHOLDS.AI_RESPONSE_TIME) {
            log('WARNING', `${aiTest.name} 응답시간 임계값 초과: ${test.duration.toFixed(2)}ms > ${THRESHOLDS.AI_RESPONSE_TIME}ms`);
        }
    }
}

// 부하 테스트
async function loadTesting() {
    log('INFO', '🏋️ 부하 테스트 시작');

    const loadTests = [
        { endpoint: '/api/system/status', name: '시스템 상태 부하 테스트' },
        { endpoint: '/api/performance', name: '성능 API 부하 테스트' },
        { endpoint: '/api/health', name: '헬스 체크 부하 테스트' }
    ];

    for (const loadTest of loadTests) {
        const result = await concurrentTest(loadTest.endpoint);

        testResults.push({
            category: 'LOAD',
            name: loadTest.name,
            endpoint: loadTest.endpoint,
            success: result.successRate >= THRESHOLDS.SUCCESS_RATE_THRESHOLD,
            duration: 0, // 부하 테스트는 개별 응답시간이 아닌 전체 성공률 중요
            successRate: result.successRate,
            totalRequests: result.total,
            successfulRequests: result.successful,
            failedRequests: result.failed,
            timestamp: new Date().toISOString()
        });

        if (result.successRate < THRESHOLDS.SUCCESS_RATE_THRESHOLD) {
            log('WARNING', `${loadTest.name} 성공률 임계값 미달: ${result.successRate.toFixed(2)}% < ${THRESHOLDS.SUCCESS_RATE_THRESHOLD}%`);
        }
    }
}

// 리포트 생성
function generateReport() {
    performanceMetrics.endTime = new Date();
    performanceMetrics.successRate = (performanceMetrics.passedTests / performanceMetrics.totalTests) * 100;

    const successfulTests = testResults.filter(t => t.success);
    if (successfulTests.length > 0) {
        performanceMetrics.averageResponseTime = successfulTests
            .reduce((sum, t) => sum + (t.duration || 0), 0) / successfulTests.length;
    }

    const report = {
        summary: {
            testDate: performanceMetrics.startTime.toISOString(),
            duration: performanceMetrics.endTime - performanceMetrics.startTime,
            totalTests: performanceMetrics.totalTests,
            passedTests: performanceMetrics.passedTests,
            failedTests: performanceMetrics.failedTests,
            successRate: parseFloat(performanceMetrics.successRate.toFixed(2)),
            averageResponseTime: parseFloat(performanceMetrics.averageResponseTime.toFixed(2)),
            maxResponseTime: parseFloat(performanceMetrics.maxResponseTime.toFixed(2)),
            minResponseTime: performanceMetrics.minResponseTime === Infinity ? 0 : parseFloat(performanceMetrics.minResponseTime.toFixed(2))
        },
        thresholds: THRESHOLDS,
        systemMetrics: getSystemMetrics(),
        results: testResults,
        recommendations: generateRecommendations()
    };

    return report;
}

// 권장사항 생성
function generateRecommendations() {
    const recommendations = [];

    // 성공률 검증
    if (performanceMetrics.successRate < THRESHOLDS.SUCCESS_RATE_THRESHOLD) {
        recommendations.push({
            type: 'CRITICAL',
            message: `전체 성공률이 임계값보다 낮습니다 (${performanceMetrics.successRate.toFixed(2)}% < ${THRESHOLDS.SUCCESS_RATE_THRESHOLD}%)`,
            action: '실패한 테스트들을 분석하고 근본 원인을 해결하세요'
        });
    }

    // 응답시간 검증
    if (performanceMetrics.averageResponseTime > THRESHOLDS.API_RESPONSE_TIME) {
        recommendations.push({
            type: 'WARNING',
            message: `평균 응답시간이 임계값을 초과했습니다 (${performanceMetrics.averageResponseTime.toFixed(2)}ms > ${THRESHOLDS.API_RESPONSE_TIME}ms)`,
            action: 'API 성능 최적화 또는 캐싱 전략을 검토하세요'
        });
    }

    // 시스템 리소스 검증
    const systemMetrics = getSystemMetrics();
    if (systemMetrics?.memory.usage > THRESHOLDS.MEMORY_USAGE_THRESHOLD) {
        recommendations.push({
            type: 'WARNING',
            message: `메모리 사용률이 높습니다 (${systemMetrics.memory.usage}% > ${THRESHOLDS.MEMORY_USAGE_THRESHOLD}%)`,
            action: '메모리 누수 확인 또는 메모리 최적화를 진행하세요'
        });
    }

    // 실패한 테스트 분석
    const failedTests = testResults.filter(t => !t.success);
    if (failedTests.length > 0) {
        const failuresByCategory = failedTests.reduce((acc, test) => {
            acc[test.category] = (acc[test.category] || 0) + 1;
            return acc;
        }, {});

        recommendations.push({
            type: 'INFO',
            message: `실패한 테스트 분포: ${JSON.stringify(failuresByCategory)}`,
            action: '각 카테고리별 실패 원인을 분석하세요'
        });
    }

    return recommendations;
}

// 리포트 저장
function saveReport(report) {
    const reportsDir = path.join(process.cwd(), 'tests', 'reports');

    // 디렉토리 생성
    if (!fs.existsSync(reportsDir)) {
        fs.mkdirSync(reportsDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportPath = path.join(reportsDir, `performance-${timestamp}.json`);

    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    log('SUCCESS', `성능 리포트 저장 완료: ${reportPath}`);

    // 간단한 요약도 저장
    const summaryPath = path.join(reportsDir, 'latest-summary.json');
    fs.writeFileSync(summaryPath, JSON.stringify(report.summary, null, 2));

    return reportPath;
}

// 메인 실행 함수
async function main() {
    try {
        log('INFO', '🚀 OpenManager Vibe v5 성능 검증 시작');
        log('INFO', `임계값: ${JSON.stringify(THRESHOLDS, null, 2)}`);

        const startSystemMetrics = getSystemMetrics();
        log('INFO', '시작 시점 시스템 메트릭', startSystemMetrics);

        // 테스트 실행
        await testApiEndpoints();
        await testAIEngines();
        await loadTesting();

        // 리포트 생성 및 저장
        const report = generateReport();
        const reportPath = saveReport(report);

        const endSystemMetrics = getSystemMetrics();
        log('INFO', '종료 시점 시스템 메트릭', endSystemMetrics);

        // 결과 출력
        log('INFO', '📊 성능 검증 결과 요약');
        console.table(report.summary);

        // 권장사항 출력
        if (report.recommendations.length > 0) {
            log('INFO', '💡 권장사항');
            report.recommendations.forEach((rec, index) => {
                log(rec.type, `${index + 1}. ${rec.message}`);
                log('INFO', `   → ${rec.action}`);
            });
        }

        // 성공/실패 판정
        const overallSuccess = report.summary.successRate >= THRESHOLDS.SUCCESS_RATE_THRESHOLD &&
            report.summary.averageResponseTime <= THRESHOLDS.API_RESPONSE_TIME;

        if (overallSuccess) {
            log('SUCCESS', '✅ 성능 검증 통과!');
            process.exit(0);
        } else {
            log('ERROR', '❌ 성능 검증 실패!');
            process.exit(1);
        }

    } catch (error) {
        log('ERROR', '성능 검증 중 오류 발생', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

// 스크립트 실행
if (require.main === module) {
    main();
}

module.exports = {
    measurePerformance,
    apiRequest,
    concurrentTest,
    generateReport,
    THRESHOLDS
}; 