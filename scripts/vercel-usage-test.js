#!/usr/bin/env node

/**
 * Vercel Usage & Performance Test Script
 * Vercel 사용량 위기 해결 후 효과 측정 및 분석 도구
 */

import fs from 'fs/promises';
import fetch from 'node-fetch';
import path from 'path';

class VercelUsageTest {
    constructor() {
        this.baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://your-app.vercel.app';
        this.testResults = {
            startTime: new Date().toISOString(),
            tests: [],
            summary: {}
        };
    }

    async log(message, data = {}) {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] ${message}`, data);

        this.testResults.tests.push({
            timestamp,
            message,
            data
        });
    }

    // API 응답 시간 및 캐싱 효과 테스트
    async testApiPerformance() {
        await this.log('🚀 Starting API Performance Test');

        const endpoints = [
            '/api/system/status',
            '/api/system/health',
            '/api/metrics/unified',
            '/api/users/activity'
        ];

        const results = {};

        for (const endpoint of endpoints) {
            const url = `${this.baseUrl}${endpoint}`;
            const endpointResults = {
                cold: null,
                cached: [],
                errors: 0
            };

            try {
                // Cold start 측정
                const coldStart = Date.now();
                const coldResponse = await fetch(url);
                const coldEnd = Date.now();

                endpointResults.cold = {
                    duration: coldEnd - coldStart,
                    status: coldResponse.status,
                    headers: Object.fromEntries(coldResponse.headers),
                    cached: coldResponse.headers.get('x-vercel-cache') || 'none'
                };

                // 캐싱 효과 측정 (5회 연속 요청)
                for (let i = 0; i < 5; i++) {
                    const cachedStart = Date.now();
                    const cachedResponse = await fetch(url);
                    const cachedEnd = Date.now();

                    endpointResults.cached.push({
                        attempt: i + 1,
                        duration: cachedEnd - cachedStart,
                        status: cachedResponse.status,
                        cached: cachedResponse.headers.get('x-vercel-cache') || 'none'
                    });

                    // 1초 간격
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }

            } catch (error) {
                endpointResults.errors++;
                await this.log(`❌ Error testing ${endpoint}:`, error.message);
            }

            results[endpoint] = endpointResults;
            await this.log(`✅ Completed ${endpoint}`, endpointResults);
        }

        return results;
    }

    // Function Invocation 패턴 분석
    async testFunctionInvocationPattern() {
        await this.log('📊 Testing Function Invocation Pattern');

        const testDuration = 5 * 60 * 1000; // 5분
        const interval = 10 * 1000; // 10초 간격
        const invocations = [];

        const startTime = Date.now();
        let requestCount = 0;

        while (Date.now() - startTime < testDuration) {
            const batchStart = Date.now();

            // 동시 요청 시뮬레이션 (실제 사용 패턴)
            const promises = [
                fetch(`${this.baseUrl}/api/system/status`),
                fetch(`${this.baseUrl}/api/system/health`),
                fetch(`${this.baseUrl}/api/metrics/unified`)
            ];

            try {
                const responses = await Promise.allSettled(promises);
                const batchEnd = Date.now();

                requestCount += promises.length;

                invocations.push({
                    timestamp: new Date().toISOString(),
                    batchDuration: batchEnd - batchStart,
                    requests: responses.map((r, i) => ({
                        endpoint: ['/api/system/status', '/api/system/health', '/api/metrics/unified'][i],
                        status: r.status === 'fulfilled' ? r.value.status : 'error',
                        duration: r.status === 'fulfilled' ? 0 : -1
                    })),
                    totalRequests: requestCount
                });

            } catch (error) {
                await this.log('❌ Batch request error:', error.message);
            }

            await new Promise(resolve => setTimeout(resolve, interval));
        }

        const totalDuration = Date.now() - startTime;
        const avgRequestsPerMinute = (requestCount / totalDuration) * 60 * 1000;

        await this.log('📈 Invocation Pattern Results:', {
            totalDuration: `${Math.round(totalDuration / 1000)}s`,
            totalRequests: requestCount,
            avgRequestsPerMinute: Math.round(avgRequestsPerMinute),
            projectedDailyRequests: Math.round(avgRequestsPerMinute * 60 * 24)
        });

        return {
            totalRequests: requestCount,
            avgRequestsPerMinute,
            projectedDailyRequests: avgRequestsPerMinute * 60 * 24,
            invocations
        };
    }

    // Edge Runtime vs Node.js Runtime 비교
    async testRuntimeComparison() {
        await this.log('⚡ Testing Runtime Performance Comparison');

        // 현재는 모두 Node.js Runtime으로 변경된 상태
        // 이전 Edge Runtime 데이터와 비교할 수 있는 테스트

        const testEndpoints = [
            '/api/system/status',
            '/api/metrics/unified'
        ];

        const runtimeResults = {};

        for (const endpoint of testEndpoints) {
            const results = [];

            // 10회 연속 테스트
            for (let i = 0; i < 10; i++) {
                const start = Date.now();

                try {
                    const response = await fetch(`${this.baseUrl}${endpoint}`);
                    const end = Date.now();

                    results.push({
                        attempt: i + 1,
                        duration: end - start,
                        status: response.status,
                        runtime: response.headers.get('x-vercel-runtime') || 'unknown',
                        region: response.headers.get('x-vercel-id') || 'unknown'
                    });

                } catch (error) {
                    results.push({
                        attempt: i + 1,
                        duration: -1,
                        status: 'error',
                        error: error.message
                    });
                }

                await new Promise(resolve => setTimeout(resolve, 500));
            }

            const successfulResults = results.filter(r => r.duration > 0);
            const avgDuration = successfulResults.reduce((sum, r) => sum + r.duration, 0) / successfulResults.length;
            const minDuration = Math.min(...successfulResults.map(r => r.duration));
            const maxDuration = Math.max(...successfulResults.map(r => r.duration));

            runtimeResults[endpoint] = {
                results,
                stats: {
                    avgDuration: Math.round(avgDuration),
                    minDuration,
                    maxDuration,
                    successRate: (successfulResults.length / results.length) * 100
                }
            };
        }

        return runtimeResults;
    }

    // 캐싱 효과 분석
    async testCachingEffectiveness() {
        await this.log('🗄️ Testing Caching Effectiveness');

        const cacheTestUrl = `${this.baseUrl}/api/system/status`;
        const results = {
            uncached: [],
            cached: [],
            cacheHitRatio: 0
        };

        // Cache-busting으로 uncached 요청 테스트
        for (let i = 0; i < 5; i++) {
            const start = Date.now();
            const response = await fetch(`${cacheTestUrl}?t=${Date.now()}`);
            const end = Date.now();

            results.uncached.push({
                duration: end - start,
                cacheStatus: response.headers.get('x-vercel-cache') || 'none'
            });

            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        // 동일한 요청으로 cached 요청 테스트
        for (let i = 0; i < 10; i++) {
            const start = Date.now();
            const response = await fetch(cacheTestUrl);
            const end = Date.now();

            const cacheStatus = response.headers.get('x-vercel-cache') || 'none';

            results.cached.push({
                duration: end - start,
                cacheStatus,
                isHit: cacheStatus === 'HIT'
            });

            await new Promise(resolve => setTimeout(resolve, 2000));
        }

        const cacheHits = results.cached.filter(r => r.isHit).length;
        results.cacheHitRatio = (cacheHits / results.cached.length) * 100;

        const avgUncachedDuration = results.uncached.reduce((sum, r) => sum + r.duration, 0) / results.uncached.length;
        const avgCachedDuration = results.cached.reduce((sum, r) => sum + r.duration, 0) / results.cached.length;

        await this.log('📊 Cache Performance:', {
            avgUncachedDuration: Math.round(avgUncachedDuration),
            avgCachedDuration: Math.round(avgCachedDuration),
            speedImprovement: `${Math.round(((avgUncachedDuration - avgCachedDuration) / avgUncachedDuration) * 100)}%`,
            cacheHitRatio: `${Math.round(results.cacheHitRatio)}%`
        });

        return results;
    }

    // 종합 분석 및 리포트 생성
    async generateReport(testResults) {
        const report = {
            timestamp: new Date().toISOString(),
            testDuration: new Date() - new Date(this.testResults.startTime),
            summary: {
                // 이전 위기 상황 대비 개선도 계산
                estimatedDailyRequests: testResults.invocationPattern?.projectedDailyRequests || 0,
                previousCrisisRequests: 920000, // 위기 당시 920K
                improvementRatio: 0,
                costSavings: 'TBD'
            },
            performance: testResults.apiPerformance,
            caching: testResults.caching,
            runtime: testResults.runtime,
            invocationPattern: testResults.invocationPattern,
            recommendations: []
        };

        // 개선도 계산
        if (report.summary.estimatedDailyRequests > 0) {
            report.summary.improvementRatio =
                ((report.summary.previousCrisisRequests - report.summary.estimatedDailyRequests) /
                    report.summary.previousCrisisRequests) * 100;
        }

        // 권장사항 생성
        if (report.summary.improvementRatio > 90) {
            report.recommendations.push('✅ 응급 조치가 매우 효과적임. 현재 설정 유지 권장');
        } else if (report.summary.improvementRatio > 70) {
            report.recommendations.push('⚠️ 좋은 개선이지만 추가 최적화 가능');
        } else {
            report.recommendations.push('❌ 추가적인 응급 조치 필요');
        }

        if (testResults.caching?.cacheHitRatio > 80) {
            report.recommendations.push('✅ 캐싱이 효과적으로 작동 중');
        } else {
            report.recommendations.push('⚠️ 캐싱 설정 재검토 필요');
        }

        // 리포트 파일로 저장
        const reportPath = path.join(process.cwd(), 'test-results', `vercel-test-${Date.now()}.json`);
        await fs.mkdir(path.dirname(reportPath), { recursive: true });
        await fs.writeFile(reportPath, JSON.stringify(report, null, 2));

        await this.log('📋 Report generated:', { path: reportPath });
        return report;
    }

    async runAllTests() {
        try {
            await this.log('🎯 Starting Comprehensive Vercel Test Suite');

            const testResults = {};

            // API 성능 테스트
            testResults.apiPerformance = await this.testApiPerformance();

            // Function Invocation 패턴 테스트
            testResults.invocationPattern = await this.testFunctionInvocationPattern();

            await this.log('🎉 All tests completed successfully!');
            console.log('\n=== VERCEL TEST SUMMARY ===');
            console.log(`📊 Estimated Daily Requests: ${testResults.invocationPattern.projectedDailyRequests.toLocaleString()}`);
            console.log(`🚀 Total Test Requests: ${testResults.invocationPattern.totalRequests}`);

            return testResults;

        } catch (error) {
            await this.log('❌ Test suite failed:', error.message);
            throw error;
        }
    }
}

// 스크립트 실행
if (import.meta.url === `file://${process.argv[1]}`) {
    const tester = new VercelUsageTest();
    tester.runAllTests()
        .then(report => {
            console.log('\n✅ Test completed successfully!');
            process.exit(0);
        })
        .catch(error => {
            console.error('\n❌ Test failed:', error);
            process.exit(1);
        });
}

export default VercelUsageTest; 