#!/usr/bin/env node

/**
 * 🔍 시스템 시작/종료 동작 분석기
 * 
 * 시스템 시작과 종료 시 동작을 분석하고,
 * 중지 상태에서 불필요한 백그라운드 프로세스를 식별합니다.
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

class SystemAnalyzer {
    constructor() {
        this.baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://openmanager-vibe-v5.vercel.app';
        this.results = {
            backgroundProcesses: [],
            issues: [],
            improvements: []
        };
    }

    /**
     * 🔍 메인 분석 실행
     */
    async runAnalysis() {
        console.log('🔍 시스템 분석 시작');

        // 백그라운드 프로세스 감지
        await this.detectBackgroundProcesses();

        // 중지 상태 모니터링
        await this.monitorIdleState();

        // 결과 분석
        await this.analyzeResults();

        // 보고서 생성
        await this.generateReport();
    }

    /**
     * 🔍 백그라운드 프로세스 감지
     */
    async detectBackgroundProcesses() {
        console.log('🔍 백그라운드 프로세스 감지 중...');

        const processes = [
            // 삭제된 API 엔드포인트들 (참고용)
            // { name: 'Keep-Alive 스케줄러', endpoint: '/api/keep-alive/status' },
            { name: '서버 데이터 스케줄러', endpoint: '/api/scheduler/server-data' },
            { name: '메트릭 수집기', endpoint: '/api/metrics' },
            { name: '시스템 상태', endpoint: '/api/system/status' }
        ];

        for (const process of processes) {
            try {
                const start = Date.now();
                const response = await this.makeApiCall(process.endpoint);
                const duration = Date.now() - start;

                this.results.backgroundProcesses.push({
                    name: process.name,
                    endpoint: process.endpoint,
                    active: true,
                    responseTime: duration,
                    response: response
                });

                console.log(`✅ ${process.name}: 활성 (${duration}ms)`);

            } catch (error) {
                this.results.backgroundProcesses.push({
                    name: process.name,
                    endpoint: process.endpoint,
                    active: false,
                    error: error.message
                });

                console.log(`❌ ${process.name}: 비활성`);
            }
        }
    }

    /**
     * 🔍 중지 상태 모니터링
     */
    async monitorIdleState() {
        console.log('🔍 중지 상태 모니터링 중...');

        const duration = 2 * 60 * 1000; // 2분
        const interval = 30 * 1000; // 30초
        const endTime = Date.now() + duration;

        const calls = [];

        while (Date.now() < endTime) {
            try {
                const start = Date.now();
                const response = await this.makeApiCall('/api/system/status');
                const responseTime = Date.now() - start;

                calls.push({
                    timestamp: new Date(),
                    responseTime,
                    success: true,
                    isRunning: response.isRunning
                });

                console.log(`📊 상태 체크: ${responseTime}ms (실행: ${response.isRunning})`);

            } catch (error) {
                calls.push({
                    timestamp: new Date(),
                    success: false,
                    error: error.message
                });
            }

            await this.sleep(interval);
        }

        this.results.idleMonitoring = {
            totalCalls: calls.length,
            successfulCalls: calls.filter(c => c.success).length,
            avgResponseTime: calls.filter(c => c.success).reduce((sum, c) => sum + c.responseTime, 0) / calls.filter(c => c.success).length || 0,
            calls: calls
        };

        console.log(`📊 모니터링 완료: ${calls.length}회 호출`);
    }

    /**
     * 📊 결과 분석
     */
    async analyzeResults() {
        console.log('📊 결과 분석 중...');

        const issues = [];
        const improvements = [];

        // 중지 상태 사용량 분석
        if (this.results.idleMonitoring) {
            const { totalCalls } = this.results.idleMonitoring;
            const callsPerMinute = totalCalls / 2; // 2분 모니터링
            const dailyProjection = Math.round(callsPerMinute * 60 * 24);

            if (dailyProjection > 500) {
                issues.push({
                    type: 'high-idle-usage',
                    severity: 'high',
                    description: `중지 상태에서 하루 ${dailyProjection}회 API 호출 예상`
                });

                improvements.push({
                    type: 'reduce-polling',
                    priority: 'high',
                    description: '폴링 간격 증가 또는 중지 상태에서 비활성화'
                });
            }
        }

        // 활성 백그라운드 프로세스 분석
        const activeProcesses = this.results.backgroundProcesses.filter(p => p.active);
        if (activeProcesses.length > 2) {
            issues.push({
                type: 'too-many-active-processes',
                severity: 'medium',
                description: `${activeProcesses.length}개의 백그라운드 프로세스가 활성 상태`
            });

            improvements.push({
                type: 'disable-unnecessary-processes',
                priority: 'medium',
                description: '불필요한 백그라운드 프로세스 비활성화'
            });
        }

        this.results.issues = issues;
        this.results.improvements = improvements;
    }

    /**
     * 📊 결과 분석 및 보고서 생성
     */
    async generateReport() {
        console.log('\n📋 분석 결과');
        console.log('=' * 40);

        if (this.results.issues.length > 0) {
            console.log('⚠️ 발견된 문제점:');
            this.results.issues.forEach((issue, index) => {
                console.log(`  ${index + 1}. [${issue.severity.toUpperCase()}] ${issue.description}`);
            });
        } else {
            console.log('✅ 심각한 문제점 없음');
        }

        if (this.results.improvements.length > 0) {
            console.log('\n💡 개선 방안:');
            this.results.improvements.forEach((improvement, index) => {
                console.log(`  ${index + 1}. [${improvement.priority.toUpperCase()}] ${improvement.description}`);
            });
        }

        // 환경변수 추천
        if (this.results.issues.some(i => i.type === 'high-idle-usage')) {
            console.log('\n🔧 권장 환경변수:');
            console.log('  KEEP_ALIVE_SCHEDULER_DISABLED=true');
            console.log('  SERVER_DATA_SCHEDULER_DISABLED=true');
            console.log('  SYSTEM_POLLING_INTERVAL=300000  # 5분');
        }

        await this.saveReport();
    }

    /**
     * 💾 보고서 저장
     */
    async saveReport() {
        const reportPath = path.join(process.cwd(), 'test-results', 'system-analysis.json');
        const reportDir = path.dirname(reportPath);

        if (!fs.existsSync(reportDir)) {
            fs.mkdirSync(reportDir, { recursive: true });
        }

        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                totalIssues: this.results.issues.length,
                totalImprovements: this.results.improvements.length,
                activeBackgroundProcesses: this.results.backgroundProcesses.filter(p => p.active).length
            },
            ...this.results
        };

        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        console.log(`\n📄 보고서 저장: ${reportPath}`);
    }

    /**
     * 🌐 API 호출 실행
     */
    async makeApiCall(endpoint) {
        return new Promise((resolve, reject) => {
            const url = new URL(endpoint, this.baseUrl);

            const req = https.request(url, { method: 'GET', timeout: 10000 }, (res) => {
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
            req.on('timeout', () => {
                req.destroy();
                reject(new Error('Request timeout'));
            });

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
    const analyzer = new SystemAnalyzer();
    analyzer.runAnalysis()
        .then(() => console.log('\n✅ 분석 완료'))
        .catch(error => console.error('❌ 분석 실패:', error));
}

module.exports = SystemAnalyzer; 