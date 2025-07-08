#!/usr/bin/env node

/**
 * Vercel Metrics Real-time Monitor
 * 실시간 Vercel 사용량 및 성능 모니터링 도구
 */

import fs from 'fs/promises';
import fetch from 'node-fetch';
import path from 'path';

class VercelMetricsMonitor {
    constructor() {
        this.baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        this.monitoringActive = true;
        this.metrics = {
            startTime: new Date().toISOString(),
            samples: [],
            summary: {
                totalRequests: 0,
                avgResponseTime: 0,
                cacheHitRate: 0,
                errorRate: 0
            }
        };
    }

    async log(message, data = null) {
        const timestamp = new Date().toISOString();
        const logMessage = data ? `${message}: ${JSON.stringify(data)}` : message;
        console.log(`[${timestamp}] ${logMessage}`);
    }

    // 단일 API 요청 메트릭 수집
    async collectSample(endpoint) {
        const startTime = Date.now();
        const url = `${this.baseUrl}${endpoint}`;

        try {
            const response = await fetch(url);
            const endTime = Date.now();
            const responseTime = endTime - startTime;

            const sample = {
                timestamp: new Date().toISOString(),
                endpoint,
                responseTime,
                status: response.status,
                success: response.ok,
                cacheStatus: response.headers.get('x-vercel-cache') || 'none',
                region: response.headers.get('x-vercel-id') || 'unknown',
                runtime: response.headers.get('x-vercel-runtime') || 'unknown'
            };

            this.metrics.samples.push(sample);
            this.metrics.summary.totalRequests++;

            return sample;

        } catch (error) {
            const sample = {
                timestamp: new Date().toISOString(),
                endpoint,
                responseTime: -1,
                status: 0,
                success: false,
                error: error.message
            };

            this.metrics.samples.push(sample);
            this.metrics.summary.totalRequests++;

            return sample;
        }
    }

    // 여러 엔드포인트 동시 모니터링
    async collectBatch() {
        const endpoints = [
            '/api/system/status',
            '/api/system/health',
            '/api/metrics/unified'
        ];

        const promises = endpoints.map(endpoint => this.collectSample(endpoint));
        const results = await Promise.allSettled(promises);

        const batch = {
            timestamp: new Date().toISOString(),
            samples: results.map((result, index) => ({
                endpoint: endpoints[index],
                success: result.status === 'fulfilled',
                data: result.status === 'fulfilled' ? result.value : { error: result.reason }
            }))
        };

        return batch;
    }

    // 실시간 통계 계산
    calculateStats() {
        const recentSamples = this.metrics.samples.slice(-100); // 최근 100개 샘플

        if (recentSamples.length === 0) return this.metrics.summary;

        const successfulSamples = recentSamples.filter(s => s.success);
        const cachedSamples = recentSamples.filter(s => s.cacheStatus === 'HIT');
        const responseTimes = successfulSamples.map(s => s.responseTime).filter(rt => rt > 0);

        this.metrics.summary = {
            totalRequests: this.metrics.samples.length,
            recentSamples: recentSamples.length,
            avgResponseTime: responseTimes.length > 0 ?
                Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length) : 0,
            minResponseTime: responseTimes.length > 0 ? Math.min(...responseTimes) : 0,
            maxResponseTime: responseTimes.length > 0 ? Math.max(...responseTimes) : 0,
            successRate: (successfulSamples.length / recentSamples.length) * 100,
            cacheHitRate: (cachedSamples.length / recentSamples.length) * 100,
            errorRate: ((recentSamples.length - successfulSamples.length) / recentSamples.length) * 100,
            requestsPerMinute: this.calculateRequestsPerMinute()
        };

        return this.metrics.summary;
    }

    calculateRequestsPerMinute() {
        const now = Date.now();
        const oneMinuteAgo = now - (60 * 1000);
        const recentRequests = this.metrics.samples.filter(s =>
            new Date(s.timestamp).getTime() > oneMinuteAgo
        );
        return recentRequests.length;
    }

    // 실시간 대시보드 출력
    displayDashboard() {
        const stats = this.calculateStats();

        console.clear();
        console.log('='.repeat(80));
        console.log('🚀 VERCEL REAL-TIME METRICS DASHBOARD');
        console.log('='.repeat(80));
        console.log(`⏰ Started: ${this.metrics.startTime}`);
        console.log(`📊 Total Requests: ${stats.totalRequests.toLocaleString()}`);
        console.log(`⚡ Requests/Min: ${stats.requestsPerMinute}`);
        console.log(`🎯 Success Rate: ${Math.round(stats.successRate)}%`);
        console.log(`🗄️ Cache Hit Rate: ${Math.round(stats.cacheHitRate)}%`);
        console.log(`⏱️ Avg Response: ${stats.avgResponseTime}ms`);
        console.log(`📈 Response Range: ${stats.minResponseTime}ms - ${stats.maxResponseTime}ms`);
        console.log(`❌ Error Rate: ${Math.round(stats.errorRate)}%`);
        console.log('='.repeat(80));

        // 예상 일일 사용량 계산
        if (stats.requestsPerMinute > 0) {
            const projectedDaily = stats.requestsPerMinute * 60 * 24;
            const previousCrisis = 920000;
            const improvement = ((previousCrisis - projectedDaily) / previousCrisis) * 100;

            console.log(`📅 Projected Daily: ${projectedDaily.toLocaleString()} requests`);
            console.log(`📉 vs Crisis (920K): ${Math.round(improvement)}% improvement`);

            if (improvement > 90) {
                console.log('✅ EXCELLENT: Crisis resolved successfully!');
            } else if (improvement > 70) {
                console.log('⚠️ GOOD: Significant improvement, monitor closely');
            } else {
                console.log('❌ WARNING: May need additional emergency measures');
            }
        }

        console.log('='.repeat(80));
        console.log('Press Ctrl+C to stop monitoring');
        console.log('='.repeat(80));
    }

    // 모니터링 시작
    async startMonitoring(intervalSeconds = 30) {
        await this.log('🎯 Starting Vercel metrics monitoring', {
            interval: `${intervalSeconds}s`,
            baseUrl: this.baseUrl
        });

        const interval = setInterval(async () => {
            if (!this.monitoringActive) {
                clearInterval(interval);
                return;
            }

            try {
                await this.collectBatch();
                this.displayDashboard();

                // 메트릭 파일로 저장 (매 5분마다)
                if (this.metrics.samples.length % 10 === 0) {
                    await this.saveMetrics();
                }

            } catch (error) {
                await this.log('❌ Monitoring error', error.message);
            }
        }, intervalSeconds * 1000);

        // 첫 번째 샘플 즉시 수집
        await this.collectBatch();
        this.displayDashboard();

        // Graceful shutdown
        process.on('SIGINT', async () => {
            this.monitoringActive = false;
            clearInterval(interval);
            await this.saveMetrics();
            await this.log('👋 Monitoring stopped');
            process.exit(0);
        });
    }

    // 메트릭 저장
    async saveMetrics() {
        try {
            const metricsDir = path.join(process.cwd(), 'test-results');
            await fs.mkdir(metricsDir, { recursive: true });

            const filename = `vercel-metrics-${new Date().toISOString().split('T')[0]}.json`;
            const filepath = path.join(metricsDir, filename);

            const data = {
                ...this.metrics,
                summary: this.calculateStats(),
                savedAt: new Date().toISOString()
            };

            await fs.writeFile(filepath, JSON.stringify(data, null, 2));
            await this.log('💾 Metrics saved', { filepath });

        } catch (error) {
            await this.log('❌ Failed to save metrics', error.message);
        }
    }

    // 로드 테스트 모드
    async runLoadTest(durationMinutes = 5, requestsPerSecond = 2) {
        await this.log('🔥 Starting load test', {
            duration: `${durationMinutes} minutes`,
            rps: requestsPerSecond
        });

        const endTime = Date.now() + (durationMinutes * 60 * 1000);
        const interval = 1000 / requestsPerSecond;

        while (Date.now() < endTime) {
            const startBatch = Date.now();
            await this.collectBatch();
            const batchDuration = Date.now() - startBatch;

            // 목표 간격 유지
            const waitTime = Math.max(0, interval - batchDuration);
            if (waitTime > 0) {
                await new Promise(resolve => setTimeout(resolve, waitTime));
            }

            // 주기적으로 통계 출력
            if (this.metrics.samples.length % 30 === 0) {
                this.displayDashboard();
            }
        }

        await this.log('✅ Load test completed');
        this.displayDashboard();
        await this.saveMetrics();
    }
}

// 명령행 인자 처리
const args = process.argv.slice(2);
const command = args[0] || 'monitor';

const monitor = new VercelMetricsMonitor();

switch (command) {
    case 'monitor':
        const interval = parseInt(args[1]) || 30;
        monitor.startMonitoring(interval);
        break;

    case 'load':
        const duration = parseInt(args[1]) || 5;
        const rps = parseFloat(args[2]) || 2;
        monitor.runLoadTest(duration, rps)
            .then(() => process.exit(0))
            .catch(error => {
                console.error('Load test failed:', error);
                process.exit(1);
            });
        break;

    default:
        console.log('Usage:');
        console.log('  node vercel-metrics-monitor.js monitor [interval_seconds]');
        console.log('  node vercel-metrics-monitor.js load [duration_minutes] [requests_per_second]');
        break;
} 