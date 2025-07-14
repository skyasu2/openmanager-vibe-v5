#!/usr/bin/env node

/**
 * 🔍 중지 상태 시스템 사용량 분석 테스트
 * 
 * 시스템이 중지된 상태에서도 계속 실행되는 백그라운드 프로세스와
 * API 호출들을 분석하여 의도치 않은 사용량을 찾아냅니다.
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

class IdleSystemUsageAnalyzer {
    constructor() {
        this.baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://openmanager-vibe-v5.vercel.app';
        this.testDuration = 5 * 60 * 1000; // 5분 테스트
        this.checkInterval = 30 * 1000; // 30초마다 체크
        this.apiCalls = [];
        this.startTime = Date.now();
    }

    /**
     * 🔍 메인 분석 실행
     */
    async runAnalysis() {
        console.log('🔍 중지 상태 시스템 사용량 분석 시작');
        console.log(`📊 분석 시간: ${this.testDuration / 1000 / 60}분`);
        console.log(`🌐 대상 URL: ${this.baseUrl}`);

        // 시스템 상태 확인
        await this.checkSystemStatus();

        // API 호출 모니터링
        await this.monitorApiCalls();

        // 결과 분석
        await this.analyzeResults();
    }

    async checkSystemStatus() {
        try {
            const status = await this.makeApiCall('/api/system/status');
            console.log(`🔍 시스템 상태: ${status.isRunning ? '실행 중' : '중지됨'}`);

            if (status.isRunning) {
                console.log('⚠️ 시스템이 실행 중입니다. 중지 후 테스트하는 것을 권장합니다.');
            }
        } catch (error) {
            console.log('❌ 시스템 상태 확인 실패:', error.message);
        }
    }

    /**
     * 📊 API 호출 모니터링
     */
    async monitorApiCalls() {
        console.log('📊 API 호출 모니터링 시작...');

        const endpoints = [
            '/api/system/status',
            '/api/metrics',
            '/api/health'
        ];

        const promises = endpoints.map(endpoint => this.monitorEndpoint(endpoint));
        await Promise.all(promises);
    }

    /**
     * �� 특정 엔드포인트 모니터링
     */
    async monitorEndpoint(endpoint) {
        const calls = [];
        const endTime = Date.now() + this.testDuration;

        while (Date.now() < endTime) {
            try {
                const start = Date.now();
                const response = await this.makeApiCall(endpoint);
                const duration = Date.now() - start;

                calls.push({
                    timestamp: new Date(),
                    responseTime: duration,
                    success: true
                });

                console.log(`📞 ${endpoint}: ${duration}ms`);

            } catch (error) {
                calls.push({
                    timestamp: new Date(),
                    success: false,
                    error: error.message
                });
            }

            await this.sleep(this.checkInterval);
        }

        this.apiCalls.push({
            endpoint,
            calls,
            totalCalls: calls.length
        });
    }

    /**
     * 📊 결과 분석
     */
    async analyzeResults() {
        console.log('\n📊 결과 분석');

        const totalCalls = this.apiCalls.reduce((sum, ep) => sum + ep.totalCalls, 0);
        const testMinutes = this.testDuration / 1000 / 60;
        const callsPerMinute = totalCalls / testMinutes;

        console.log(`📈 총 API 호출 수: ${totalCalls}회`);
        console.log(`🔥 분당 호출 수: ${callsPerMinute.toFixed(1)}회/분`);
        console.log(`📊 하루 예상 호출 수: ${Math.round(callsPerMinute * 60 * 24)}회/일`);

        // 보고서 저장
        const report = {
            timestamp: new Date().toISOString(),
            totalCalls,
            callsPerMinute,
            dailyProjection: Math.round(callsPerMinute * 60 * 24),
            apiCalls: this.apiCalls
        };

        const reportPath = path.join(process.cwd(), 'test-results', 'idle-system-usage.json');
        const reportDir = path.dirname(reportPath);

        if (!fs.existsSync(reportDir)) {
            fs.mkdirSync(reportDir, { recursive: true });
        }

        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        console.log(`📄 보고서 저장: ${reportPath}`);
    }

    /**
     * 🌐 API 호출 실행
     */
    async makeApiCall(endpoint) {
        return new Promise((resolve, reject) => {
            const url = new URL(endpoint, this.baseUrl);

            const req = https.request(url, { method: 'GET' }, (res) => {
                let body = '';
                res.on('data', (chunk) => body += chunk);
                res.on('end', () => {
                    try {
                        resolve(JSON.parse(body));
                    } catch (error) {
                        resolve({ statusCode: res.statusCode, body });
                    }
                });
            });

            req.on('error', reject);
            req.end();
        });
    }

    /**
     * 😴 대기 함수
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// 스크립트 실행
if (require.main === module) {
    const analyzer = new IdleSystemUsageAnalyzer();
    analyzer.runAnalysis()
        .then(() => console.log('\n✅ 분석 완료'))
        .catch(error => console.error('❌ 분석 실패:', error));
}

module.exports = IdleSystemUsageAnalyzer; 