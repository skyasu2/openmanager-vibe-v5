#!/usr/bin/env node

/**
 * Real-time Monitoring Dashboard
 * 응급 조치 후 핵심 지표 모니터링
 */

const https = require('https');
const fs = require('fs');

class MonitoringDashboard {
    constructor() {
        this.baseUrl = 'https://openmanager-vibe-v5.vercel.app';
        this.safetyLimits = {
            dailyRequests: 10000,
            avgResponseTime: 200,
            errorRate: 1,
            cacheHitRate: 70
        };
        this.metrics = {
            requests: [],
            errors: [],
            responseTimes: [],
            cacheHits: []
        };
    }

    async makeRequest(endpoint) {
        return new Promise((resolve) => {
            const startTime = Date.now();

            https.get(`${this.baseUrl}${endpoint}`, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    resolve({
                        success: true,
                        responseTime: Date.now() - startTime,
                        status: res.statusCode,
                        cacheStatus: res.headers['x-vercel-cache'] || 'unknown',
                        timestamp: new Date().toISOString()
                    });
                });
            }).on('error', (err) => {
                resolve({
                    success: false,
                    responseTime: Date.now() - startTime,
                    error: err.message,
                    timestamp: new Date().toISOString()
                });
            });
        });
    }

    async collectMetrics() {
        const endpoints = [
            '/api/system/status',
            '/api/metrics',
            '/api/unified-metrics'
        ];

        for (const endpoint of endpoints) {
            const result = await this.makeRequest(endpoint);

            this.metrics.requests.push({
                endpoint,
                ...result
            });

            if (!result.success) {
                this.metrics.errors.push(result);
            }

            this.metrics.responseTimes.push(result.responseTime);

            if (result.cacheStatus === 'HIT') {
                this.metrics.cacheHits.push(result);
            }
        }
    }

    calculateStats() {
        const last24h = Date.now() - (24 * 60 * 60 * 1000);
        const recentRequests = this.metrics.requests.filter(r =>
            new Date(r.timestamp).getTime() > last24h
        );

        const recentErrors = this.metrics.errors.filter(e =>
            new Date(e.timestamp).getTime() > last24h
        );

        const recentResponseTimes = this.metrics.responseTimes.slice(-100);
        const recentCacheHits = this.metrics.cacheHits.filter(c =>
            new Date(c.timestamp).getTime() > last24h
        );

        return {
            dailyRequests: recentRequests.length,
            avgResponseTime: recentResponseTimes.reduce((a, b) => a + b, 0) / recentResponseTimes.length || 0,
            errorRate: (recentErrors.length / recentRequests.length) * 100 || 0,
            cacheHitRate: (recentCacheHits.length / recentRequests.length) * 100 || 0,
            totalRequests: this.metrics.requests.length,
            uptime: this.calculateUptime()
        };
    }

    calculateUptime() {
        if (this.metrics.requests.length === 0) return 100;

        const successfulRequests = this.metrics.requests.filter(r => r.success).length;
        return (successfulRequests / this.metrics.requests.length) * 100;
    }

    checkSafetyLimits(stats) {
        const alerts = [];

        if (stats.dailyRequests > this.safetyLimits.dailyRequests) {
            alerts.push(`🚨 일일 요청 한도 초과: ${stats.dailyRequests} > ${this.safetyLimits.dailyRequests}`);
        }

        if (stats.avgResponseTime > this.safetyLimits.avgResponseTime) {
            alerts.push(`⚠️ 평균 응답 시간 초과: ${Math.round(stats.avgResponseTime)}ms > ${this.safetyLimits.avgResponseTime}ms`);
        }

        if (stats.errorRate > this.safetyLimits.errorRate) {
            alerts.push(`❌ 에러율 초과: ${Math.round(stats.errorRate)}% > ${this.safetyLimits.errorRate}%`);
        }

        if (stats.cacheHitRate < this.safetyLimits.cacheHitRate) {
            alerts.push(`🗄️ 캐시 히트율 부족: ${Math.round(stats.cacheHitRate)}% < ${this.safetyLimits.cacheHitRate}%`);
        }

        return alerts;
    }

    displayDashboard() {
        const stats = this.calculateStats();
        const alerts = this.checkSafetyLimits(stats);

        console.clear();
        console.log('='.repeat(80));
        console.log('🎯 OpenManager Vibe v5 - 실시간 모니터링 대시보드');
        console.log('='.repeat(80));
        console.log(`📊 업데이트: ${new Date().toLocaleString()}`);
        console.log('');

        console.log('📈 핵심 지표:');
        console.log(`  일일 요청: ${stats.dailyRequests.toLocaleString()} / ${this.safetyLimits.dailyRequests.toLocaleString()}`);
        console.log(`  평균 응답: ${Math.round(stats.avgResponseTime)}ms / ${this.safetyLimits.avgResponseTime}ms`);
        console.log(`  에러율: ${Math.round(stats.errorRate)}% / ${this.safetyLimits.errorRate}%`);
        console.log(`  캐시 히트율: ${Math.round(stats.cacheHitRate)}% / ${this.safetyLimits.cacheHitRate}%`);
        console.log(`  가동률: ${Math.round(stats.uptime)}%`);
        console.log('');

        // 예상 일일 사용량 계산
        const currentHour = new Date().getHours();
        const projectedDaily = Math.round((stats.dailyRequests / currentHour) * 24);

        console.log('🔮 예상 일일 사용량:');
        console.log(`  현재 추세: ${projectedDaily.toLocaleString()} 요청/일`);
        console.log(`  위기 대비: ${Math.round(((920000 - projectedDaily) / 920000) * 100)}% 감소`);
        console.log('');

        if (alerts.length > 0) {
            console.log('🚨 경고사항:');
            alerts.forEach(alert => console.log(`  ${alert}`));
            console.log('');
        } else {
            console.log('✅ 모든 지표가 안전 범위 내에 있습니다.');
            console.log('');
        }

        console.log('🎯 응급 조치 현황:');
        console.log('  폴링 간격: 300초 (5분)');
        console.log('  캐시 TTL: 60초');
        console.log('  런타임: Node.js');
        console.log('  레이트 제한: 활성화');
        console.log('');

        console.log('='.repeat(80));
        console.log('Press Ctrl+C to stop monitoring');
        console.log('='.repeat(80));
    }

    async startMonitoring(intervalMinutes = 5) {
        console.log(`🎯 모니터링 시작 (${intervalMinutes}분 간격)`);

        const intervalMs = intervalMinutes * 60 * 1000;

        // 즉시 첫 번째 수집
        await this.collectMetrics();
        this.displayDashboard();

        const interval = setInterval(async () => {
            try {
                await this.collectMetrics();
                this.displayDashboard();

                // 메트릭 저장 (매시간)
                if (this.metrics.requests.length % 12 === 0) {
                    await this.saveMetrics();
                }
            } catch (error) {
                console.error('모니터링 에러:', error.message);
            }
        }, intervalMs);

        // Graceful shutdown
        process.on('SIGINT', async () => {
            clearInterval(interval);
            await this.saveMetrics();
            console.log('\n👋 모니터링 중지됨');
            process.exit(0);
        });
    }

    async saveMetrics() {
        try {
            const stats = this.calculateStats();
            const report = {
                timestamp: new Date().toISOString(),
                stats,
                alerts: this.checkSafetyLimits(stats),
                recentMetrics: {
                    requests: this.metrics.requests.slice(-50),
                    errors: this.metrics.errors.slice(-10),
                    responseTimes: this.metrics.responseTimes.slice(-100)
                }
            };

            const filename = `monitoring-${new Date().toISOString().split('T')[0]}.json`;
            fs.writeFileSync(`test-results/${filename}`, JSON.stringify(report, null, 2));
            console.log(`💾 메트릭 저장: ${filename}`);
        } catch (error) {
            console.error('메트릭 저장 실패:', error.message);
        }
    }
}

// 실행
if (require.main === module) {
    const dashboard = new MonitoringDashboard();
    const interval = parseInt(process.argv[2]) || 5;

    dashboard.startMonitoring(interval);
}

module.exports = MonitoringDashboard; 