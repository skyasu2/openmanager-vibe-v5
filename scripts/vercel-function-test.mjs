#!/usr/bin/env node
/**
 * 베르셀 환경 기능별 동작 테스트 스크립트 v2.0
 * OpenManager Vibe v5 - 실제 API 엔드포인트 기반 검증
 */

import fs from 'fs';
import https from 'https';

const BASE_URL = 'https://openmanager-vibe-v5.vercel.app';
const TEST_RESULTS = [];

// HTTP 요청 헬퍼 함수
function makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
        const req = https.request(url, options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                resolve({
                    statusCode: res.statusCode,
                    headers: res.headers,
                    body: data,
                    url: url
                });
            });
        });

        req.on('error', reject);
        req.setTimeout(15000, () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });

        if (options.body) {
            req.write(options.body);
        }
        req.end();
    });
}

// 테스트 결과 기록
function recordTest(name, success, details) {
    const result = {
        name,
        success,
        details,
        timestamp: new Date().toISOString()
    };
    TEST_RESULTS.push(result);

    const status = success ? '✅' : '❌';
    console.log(`${status} ${name}: ${details}`);
}

// 1. 기본 헬스체크 테스트
async function testHealthCheck() {
    try {
        const response = await makeRequest(`${BASE_URL}/api/health`);

        if (response.statusCode === 200) {
            const data = JSON.parse(response.body);
            recordTest('헬스체크 API', true, `상태: ${data.status}, 버전: ${data.version}`);
            return data;
        } else {
            recordTest('헬스체크 API', false, `HTTP ${response.statusCode}`);
            return null;
        }
    } catch (error) {
        recordTest('헬스체크 API', false, error.message);
        return null;
    }
}

// 2. 메인 페이지 테스트
async function testMainPage() {
    try {
        const response = await makeRequest(`${BASE_URL}/`);

        if (response.statusCode === 200) {
            const hasReactRoot = response.body.includes('__next');
            const hasTitle = response.body.includes('OpenManager');

            recordTest('메인 페이지', hasReactRoot && hasTitle,
                `HTML 로드됨, React: ${hasReactRoot}, 타이틀: ${hasTitle}`);
        } else {
            recordTest('메인 페이지', false, `HTTP ${response.statusCode}`);
        }
    } catch (error) {
        recordTest('메인 페이지', false, error.message);
    }
}

// 3. 대시보드 페이지 테스트
async function testDashboard() {
    try {
        const response = await makeRequest(`${BASE_URL}/dashboard`);

        if (response.statusCode === 200) {
            const hasContent = response.body.length > 1000;
            recordTest('대시보드 페이지', hasContent, `페이지 크기: ${response.body.length} bytes`);
        } else {
            recordTest('대시보드 페이지', false, `HTTP ${response.statusCode}`);
        }
    } catch (error) {
        recordTest('대시보드 페이지', false, error.message);
    }
}

// 4. 실제 존재하는 API 엔드포인트 테스트
async function testAPIEndpoints() {
    const endpoints = [
        '/api/status',
        '/api/logs',
        '/api/simulate/data',
        '/api/data-generator/unified',
        '/api/unified-metrics',
        '/api/performance',
        '/api/mcp',
        '/api/admin/monitoring',
        '/api/ai-agent/integrated'
    ];

    for (const endpoint of endpoints) {
        try {
            const response = await makeRequest(`${BASE_URL}${endpoint}`);
            const success = response.statusCode === 200;
            recordTest(`API ${endpoint}`, success, `HTTP ${response.statusCode}`);
        } catch (error) {
            recordTest(`API ${endpoint}`, false, error.message);
        }
    }
}

// 5. AI 기능 테스트 (실제 엔드포인트)
async function testAIFeatures() {
    const aiEndpoints = [
        { path: '/api/ai-agent/integrated?action=status', name: 'AI 에이전트 상태' },
        { path: '/api/ai-agent/integrated?action=health', name: 'AI 에이전트 헬스' },
        { path: '/api/ai/learning', name: 'AI 학습 시스템' },
        { path: '/api/ai/fallback-mode', name: 'AI 폴백 모드' }
    ];

    for (const endpoint of aiEndpoints) {
        try {
            const response = await makeRequest(`${BASE_URL}${endpoint.path}`);
            const success = response.statusCode === 200;
            recordTest(endpoint.name, success, `HTTP ${response.statusCode}`);
        } catch (error) {
            recordTest(endpoint.name, false, error.message);
        }
    }
}

// 6. 데이터 생성기 테스트
async function testDataGenerators() {
    const dataEndpoints = [
        { path: '/api/data-generator/unified', name: '통합 데이터 생성기' },
        { path: '/api/data-generator/optimized', name: '최적화 데이터 생성기' },
        { path: '/api/data-generator/unified-preprocessing', name: '통합 전처리 엔진' }
    ];

    for (const endpoint of dataEndpoints) {
        try {
            const response = await makeRequest(`${BASE_URL}${endpoint.path}`);
            const success = response.statusCode === 200;
            recordTest(endpoint.name, success, `HTTP ${response.statusCode}`);
        } catch (error) {
            recordTest(endpoint.name, false, error.message);
        }
    }
}

// 7. 정적 리소스 테스트
async function testStaticResources() {
    const resources = [
        '/favicon.ico',
        '/manifest.json'
    ];

    for (const resource of resources) {
        try {
            const response = await makeRequest(`${BASE_URL}${resource}`);
            const success = response.statusCode === 200;
            recordTest(`정적 리소스 ${resource}`, success, `HTTP ${response.statusCode}`);
        } catch (error) {
            recordTest(`정적 리소스 ${resource}`, false, error.message);
        }
    }
}

// 8. 성능 및 모니터링 테스트
async function testMonitoringAPIs() {
    const monitoringEndpoints = [
        { path: '/api/performance', name: '성능 모니터링' },
        { path: '/api/admin/monitoring?type=health', name: '시스템 헬스' },
        { path: '/api/unified-metrics', name: '통합 메트릭' },
        { path: '/api/prometheus', name: 'Prometheus 메트릭' }
    ];

    for (const endpoint of monitoringEndpoints) {
        try {
            const response = await makeRequest(`${BASE_URL}${endpoint.path}`);
            const success = response.statusCode === 200;
            recordTest(endpoint.name, success, `HTTP ${response.statusCode}`);
        } catch (error) {
            recordTest(endpoint.name, false, error.message);
        }
    }
}

// 9. 전체 성능 메트릭 테스트
async function testPerformanceMetrics() {
    const startTime = Date.now();

    try {
        const response = await makeRequest(`${BASE_URL}/api/health`);
        const responseTime = Date.now() - startTime;

        recordTest('응답 시간', responseTime < 3000, `${responseTime}ms`);
        recordTest('서버 응답', response.statusCode === 200, `HTTP ${response.statusCode}`);

        // 메모리 사용량 체크 (헬스체크 응답에서)
        if (response.statusCode === 200) {
            const data = JSON.parse(response.body);
            if (data.services && data.services.memory) {
                recordTest('메모리 상태', data.services.memory === 'healthy', `상태: ${data.services.memory}`);
            }
        }
    } catch (error) {
        recordTest('성능 메트릭', false, error.message);
    }
}

// 메인 테스트 실행
async function runAllTests() {
    console.log('🚀 베르셀 환경 기능별 동작 테스트 v2.0 시작\n');
    console.log(`📍 테스트 대상: ${BASE_URL}`);
    console.log(`⏰ 시작 시간: ${new Date().toLocaleString('ko-KR')}\n`);

    // 순차적으로 테스트 실행
    console.log('🔍 1. 기본 기능 테스트');
    await testHealthCheck();
    await testMainPage();
    await testDashboard();

    console.log('\n🔌 2. API 엔드포인트 테스트');
    await testAPIEndpoints();

    console.log('\n🤖 3. AI 기능 테스트');
    await testAIFeatures();

    console.log('\n📊 4. 데이터 생성기 테스트');
    await testDataGenerators();

    console.log('\n📈 5. 모니터링 API 테스트');
    await testMonitoringAPIs();

    console.log('\n📁 6. 정적 리소스 테스트');
    await testStaticResources();

    console.log('\n⚡ 7. 성능 메트릭 테스트');
    await testPerformanceMetrics();

    // 결과 요약
    const totalTests = TEST_RESULTS.length;
    const passedTests = TEST_RESULTS.filter(r => r.success).length;
    const failedTests = totalTests - passedTests;

    console.log('\n📊 테스트 결과 요약');
    console.log(`총 테스트: ${totalTests}개`);
    console.log(`✅ 성공: ${passedTests}개`);
    console.log(`❌ 실패: ${failedTests}개`);
    console.log(`📈 성공률: ${Math.round((passedTests / totalTests) * 100)}%`);

    // 실패한 테스트 상세 출력
    if (failedTests > 0) {
        console.log('\n❌ 실패한 테스트 상세:');
        TEST_RESULTS.filter(r => !r.success).forEach(test => {
            console.log(`   - ${test.name}: ${test.details}`);
        });
    }

    // 결과를 파일로 저장
    const reportPath = 'test-results/vercel-function-test-report.json';
    const reportDir = 'test-results';

    if (!fs.existsSync(reportDir)) {
        fs.mkdirSync(reportDir, { recursive: true });
    }

    fs.writeFileSync(reportPath, JSON.stringify({
        summary: {
            total: totalTests,
            passed: passedTests,
            failed: failedTests,
            successRate: Math.round((passedTests / totalTests) * 100)
        },
        results: TEST_RESULTS,
        timestamp: new Date().toISOString(),
        baseUrl: BASE_URL,
        version: '2.0'
    }, null, 2));

    console.log(`\n📄 상세 보고서: ${reportPath}`);

    // 성공률에 따른 결과 메시지
    const successRate = Math.round((passedTests / totalTests) * 100);
    if (successRate >= 90) {
        console.log('\n🎉 훌륭합니다! 대부분의 기능이 정상 작동합니다.');
    } else if (successRate >= 80) {
        console.log('\n✅ 양호합니다! 대부분의 핵심 기능이 작동합니다.');
    } else if (successRate >= 70) {
        console.log('\n⚠️  일부 기능에 문제가 있습니다. 확인이 필요합니다.');
    } else {
        console.log('\n🚨 심각한 문제가 발견되었습니다. 즉시 점검이 필요합니다.');
    }

    // 실패한 테스트가 있으면 프로세스 종료 코드 1
    if (failedTests > 0) {
        console.log(`\n⚠️  ${failedTests}개 테스트 실패`);
        process.exit(1);
    } else {
        console.log('\n🎉 모든 테스트 통과!');
        process.exit(0);
    }
}

// 스크립트 실행
runAllTests().catch(error => {
    console.error('❌ 테스트 실행 중 오류:', error);
    process.exit(1);
}); 