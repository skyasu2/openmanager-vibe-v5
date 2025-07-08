#!/usr/bin/env node

/**
 * 🧪 독립형 Fetch MCP 테스트 스크립트 (ES 모듈)
 * 
 * 로컬 및 베르셀 환경에서 독립형 fetch 도구를 테스트
 * 의존성 없이 분리 가능한 개발 도구 검증
 */

import http from 'http';
import https from 'https';

class StandaloneFetchTester {
    constructor() {
        this.baseURL = process.env.TEST_URL || 'http://localhost:3000';
        this.results = [];
    }

    async runAllTests() {
        console.log('🧪 독립형 Fetch MCP 테스트 시작');
        console.log(`📍 테스트 대상: ${this.baseURL}`);
        console.log('='.repeat(50));

        await this.testHealthCheck();
        await this.testFetchHTML();
        await this.testFetchJSON();
        await this.testFetchText();
        await this.testFetchBatch();
        await this.testErrorHandling();

        this.printSummary();
    }

    async testHealthCheck() {
        console.log('\n🔍 헬스체크 테스트');

        try {
            const result = await this.makeRequest('GET', '/api/dev-tools/fetch?action=health');

            if (result.success && result.data.status === 'healthy') {
                this.logSuccess('헬스체크', result.data);
            } else {
                this.logError('헬스체크', '응답 형식 오류', result);
            }
        } catch (error) {
            this.logError('헬스체크', error.message);
        }
    }

    async testFetchHTML() {
        console.log('\n🌐 HTML 가져오기 테스트');

        try {
            const result = await this.makeRequest('POST', '/api/dev-tools/fetch', {
                type: 'html',
                url: 'https://httpbin.org/html'
            });

            if (result.success && result.data.success && result.data.data.content) {
                this.logSuccess('HTML 가져오기', {
                    title: result.data.data.title,
                    contentLength: result.data.data.content.length,
                    responseTime: result.data.responseTime
                });
            } else {
                this.logError('HTML 가져오기', '데이터 형식 오류', result);
            }
        } catch (error) {
            this.logError('HTML 가져오기', error.message);
        }
    }

    async testFetchJSON() {
        console.log('\n📊 JSON 가져오기 테스트');

        try {
            const result = await this.makeRequest('POST', '/api/dev-tools/fetch', {
                type: 'json',
                url: 'https://httpbin.org/json'
            });

            if (result.success && result.data.success && result.data.data) {
                this.logSuccess('JSON 가져오기', {
                    dataKeys: Object.keys(result.data.data),
                    responseTime: result.data.responseTime
                });
            } else {
                this.logError('JSON 가져오기', '데이터 형식 오류', result);
            }
        } catch (error) {
            this.logError('JSON 가져오기', error.message);
        }
    }

    async testFetchText() {
        console.log('\n📝 텍스트 가져오기 테스트');

        try {
            const result = await this.makeRequest('POST', '/api/dev-tools/fetch', {
                type: 'text',
                url: 'https://httpbin.org/robots.txt'
            });

            if (result.success && result.data.success && typeof result.data.data === 'string') {
                this.logSuccess('텍스트 가져오기', {
                    textLength: result.data.data.length,
                    responseTime: result.data.responseTime
                });
            } else {
                this.logError('텍스트 가져오기', '데이터 형식 오류', result);
            }
        } catch (error) {
            this.logError('텍스트 가져오기', error.message);
        }
    }

    async testFetchBatch() {
        console.log('\n🔄 배치 요청 테스트');

        try {
            const result = await this.makeRequest('POST', '/api/dev-tools/fetch', {
                type: 'batch',
                requests: [
                    { name: 'json_test', url: 'https://httpbin.org/json', type: 'json' },
                    { name: 'html_test', url: 'https://httpbin.org/html', type: 'html' },
                ]
            });

            if (result.success && result.data && result.data.data) {
                const batchResults = result.data.data;
                const successCount = Object.values(batchResults).filter(r => r.success).length;

                this.logSuccess('배치 요청', {
                    totalRequests: Object.keys(batchResults).length,
                    successCount: successCount,
                    results: Object.keys(batchResults)
                });
            } else {
                this.logError('배치 요청', '데이터 형식 오류', result);
            }
        } catch (error) {
            this.logError('배치 요청', error.message);
        }
    }

    async testErrorHandling() {
        console.log('\n⚠️ 오류 처리 테스트');

        try {
            const result = await this.makeRequest('POST', '/api/dev-tools/fetch', {
                type: 'html',
                url: 'https://httpbin.org/status/404'
            });

            if (result.success && result.data.success === false && result.data.error) {
                this.logSuccess('오류 처리', {
                    errorHandled: true,
                    errorMessage: result.data.error
                });
            } else {
                this.logError('오류 처리', '오류가 제대로 처리되지 않음', result);
            }
        } catch (error) {
            this.logError('오류 처리', error.message);
        }
    }

    async makeRequest(method, path, body = null) {
        return new Promise((resolve, reject) => {
            const url = new URL(this.baseURL + path);
            const options = {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'StandaloneFetchTester/1.0.0'
                }
            };

            if (body) {
                options.headers['Content-Length'] = Buffer.byteLength(JSON.stringify(body));
            }

            const client = url.protocol === 'https:' ? https : http;

            const req = client.request(url, options, (res) => {
                let data = '';

                res.on('data', (chunk) => {
                    data += chunk;
                });

                res.on('end', () => {
                    try {
                        const result = JSON.parse(data);
                        resolve(result);
                    } catch (error) {
                        reject(new Error(`JSON 파싱 오류: ${error.message}`));
                    }
                });
            });

            req.on('error', (error) => {
                reject(error);
            });

            if (body) {
                req.write(JSON.stringify(body));
            }

            req.end();
        });
    }

    logSuccess(testName, data) {
        console.log(`✅ ${testName}: 성공`);
        console.log(`   📊 결과:`, JSON.stringify(data, null, 2));
        this.results.push({ test: testName, status: 'success', data });
    }

    logError(testName, error, data = null) {
        console.log(`❌ ${testName}: 실패`);
        console.log(`   🚨 오류: ${error}`);
        if (data) {
            console.log(`   📊 응답:`, JSON.stringify(data, null, 2));
        }
        this.results.push({ test: testName, status: 'error', error, data });
    }

    printSummary() {
        console.log('\n' + '='.repeat(50));
        console.log('📊 테스트 결과 요약');
        console.log('='.repeat(50));

        const successful = this.results.filter(r => r.status === 'success').length;
        const failed = this.results.filter(r => r.status === 'error').length;
        const total = this.results.length;

        console.log(`✅ 성공: ${successful}/${total}`);
        console.log(`❌ 실패: ${failed}/${total}`);
        console.log(`📈 성공률: ${((successful / total) * 100).toFixed(1)}%`);

        if (failed > 0) {
            console.log('\n🚨 실패한 테스트:');
            this.results
                .filter(r => r.status === 'error')
                .forEach(r => console.log(`   - ${r.test}: ${r.error}`));
        }

        console.log('\n🎯 다음 단계:');
        if (successful === total) {
            console.log('   ✨ 모든 테스트 통과! 베르셀 배포 준비 완료');
        } else {
            console.log('   🔧 실패한 테스트를 수정한 후 재시도');
        }
    }
}

// 스크립트 실행
const tester = new StandaloneFetchTester();

// 명령줄 인수 처리
if (process.argv.includes('--vercel')) {
    tester.baseURL = 'https://openmanager-vibe-v5.vercel.app';
} else if (process.argv.includes('--vercel-new')) {
    tester.baseURL = 'https://openmanager-vibe-v5-9olwn7twp-skyasus-projects.vercel.app';
}

tester.runAllTests().catch(console.error);

export default StandaloneFetchTester; 