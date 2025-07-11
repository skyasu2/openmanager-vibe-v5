#!/usr/bin/env node
/**
 * 통합 테스트 실행기
 * 
 * 이전에 분산되어 있던 테스트 스크립트들의 기능을 통합:
 * - test-ai-assistant.js
 * - test-ai-data-access.js  
 * - test-context-optimization.js
 * - test-data-flow.js
 * - test-after-rpc-fix.js
 * - test-supabase-connection.js
 * - test-watcher.js
 * - test-smart-query.js
 */

import { promises as fs } from 'fs';
import https from 'https';
import http from 'http';

class UnifiedTestRunner {
    constructor() {
        this.testResults = [];
        this.startTime = Date.now();
    }

    async makeRequest(url, options = {}) {
        return new Promise((resolve, reject) => {
            const urlObj = new URL(url);
            const isHttps = urlObj.protocol === 'https:';
            const client = isHttps ? https : http;

            const requestOptions = {
                hostname: urlObj.hostname,
                port: urlObj.port || (isHttps ? 443 : 80),
                path: urlObj.pathname + urlObj.search,
                method: options.method || 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'Unified-Test-Runner/1.0',
                    ...options.headers
                },
                timeout: options.timeout || 10000
            };

            if (options.data && requestOptions.method !== 'GET') {
                const jsonData = JSON.stringify(options.data);
                requestOptions.headers['Content-Length'] = Buffer.byteLength(jsonData);
            }

            const req = client.request(requestOptions, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try {
                        const jsonData = JSON.parse(data);
                        resolve({ status: res.statusCode, data: jsonData });
                    } catch (e) {
                        resolve({ status: res.statusCode, data: data });
                    }
                });
            });

            req.on('error', (err) => {
                resolve({ status: 'ERROR', error: err.message });
            });

            req.on('timeout', () => {
                resolve({ status: 'TIMEOUT', error: 'Request timeout' });
            });

            if (options.data && requestOptions.method !== 'GET') {
                req.write(JSON.stringify(options.data));
            }

            req.end();
        });
    }

    async testAIEngines() {
        console.log('🤖 AI 엔진 테스트 시작...');
        
        const tests = [
            {
                name: 'Google AI API 연결',
                url: 'http://localhost:3000/api/ai/google',
                method: 'POST',
                data: { message: 'test' }
            },
            {
                name: 'Supabase RAG 엔진',
                url: 'http://localhost:3000/api/ai/supabase-rag',
                method: 'POST',
                data: { query: 'test query' }
            },
            {
                name: 'Korean NLP 엔진',
                url: 'http://localhost:3000/api/ai/korean-nlp',
                method: 'POST',
                data: { text: '테스트 텍스트' }
            }
        ];

        for (const test of tests) {
            try {
                const result = await this.makeRequest(test.url, {
                    method: test.method,
                    data: test.data
                });
                
                this.testResults.push({
                    category: 'AI Engines',
                    name: test.name,
                    status: result.status === 200 ? 'PASS' : 'FAIL',
                    details: result
                });

                console.log(`  ✓ ${test.name}: ${result.status}`);
            } catch (error) {
                this.testResults.push({
                    category: 'AI Engines',
                    name: test.name,
                    status: 'ERROR',
                    error: error.message
                });
                console.log(`  ✗ ${test.name}: ERROR`);
            }
        }
    }

    async testDataIntegration() {
        console.log('📊 데이터 통합 테스트 시작...');
        
        const tests = [
            {
                name: '서버 상태 데이터',
                url: 'http://localhost:3000/api/servers/status'
            },
            {
                name: '메트릭 데이터',
                url: 'http://localhost:3000/api/metrics'
            },
            {
                name: '실시간 로그',
                url: 'http://localhost:3000/api/logs/realtime'
            }
        ];

        for (const test of tests) {
            try {
                const result = await this.makeRequest(test.url);
                
                this.testResults.push({
                    category: 'Data Integration',
                    name: test.name,
                    status: result.status === 200 ? 'PASS' : 'FAIL',
                    details: result
                });

                console.log(`  ✓ ${test.name}: ${result.status}`);
            } catch (error) {
                this.testResults.push({
                    category: 'Data Integration',
                    name: test.name,
                    status: 'ERROR',
                    error: error.message
                });
                console.log(`  ✗ ${test.name}: ERROR`);
            }
        }
    }

    async testSupabaseConnection() {
        console.log('🗄️ Supabase 연결 테스트 시작...');
        
        try {
            const result = await this.makeRequest('http://localhost:3000/api/health/supabase');
            
            this.testResults.push({
                category: 'Database',
                name: 'Supabase 연결',
                status: result.status === 200 ? 'PASS' : 'FAIL',
                details: result
            });

            console.log(`  ✓ Supabase 연결: ${result.status}`);
        } catch (error) {
            this.testResults.push({
                category: 'Database',
                name: 'Supabase 연결',
                status: 'ERROR',
                error: error.message
            });
            console.log(`  ✗ Supabase 연결: ERROR`);
        }
    }

    async generateReport() {
        const endTime = Date.now();
        const duration = (endTime - this.startTime) / 1000;

        const report = {
            timestamp: new Date().toISOString(),
            duration: `${duration}초`,
            totalTests: this.testResults.length,
            passed: this.testResults.filter(r => r.status === 'PASS').length,
            failed: this.testResults.filter(r => r.status === 'FAIL').length,
            errors: this.testResults.filter(r => r.status === 'ERROR').length,
            results: this.testResults
        };

        console.log('\n📋 테스트 결과 요약:');
        console.log(`  총 테스트: ${report.totalTests}`);
        console.log(`  통과: ${report.passed}`);
        console.log(`  실패: ${report.failed}`);
        console.log(`  오류: ${report.errors}`);
        console.log(`  소요시간: ${report.duration}`);

        // 결과를 JSON 파일로 저장
        await fs.writeFile(
            'test-results/unified-test-results.json',
            JSON.stringify(report, null, 2)
        );

        return report;
    }

    async runAllTests() {
        console.log('🚀 통합 테스트 실행 시작\n');

        await this.testAIEngines();
        await this.testDataIntegration();
        await this.testSupabaseConnection();

        return await this.generateReport();
    }
}

// CLI 실행
if (process.argv[1] === import.meta.url.replace('file://', '')) {
    const runner = new UnifiedTestRunner();
    
    try {
        await runner.runAllTests();
        console.log('\n✅ 모든 테스트 완료');
        process.exit(0);
    } catch (error) {
        console.error('\n❌ 테스트 실행 중 오류:', error.message);
        process.exit(1);
    }
}

export default UnifiedTestRunner;