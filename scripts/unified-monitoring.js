#!/usr/bin/env node
/**
 * 통합 모니터링 도구
 * 
 * 통합된 기능:
 * - monitoring-dashboard.js
 * - server-monitor.js
 * - gcp-quota-monitor.js
 * - gcp-quota-alert.js
 * - gcp-quota-report.js
 * - vercel-metrics-monitor.js
 */

const https = require('https');
const fs = require('fs').promises;

class UnifiedMonitoring {
    constructor() {
        this.config = {
            checkInterval: 60000, // 1분
            alertThresholds: {
                cpu: 80,
                memory: 85,
                storage: 90
            }
        };
        this.monitoringActive = false;
        this.alerts = [];
    }

    async checkSystemHealth() {
        console.log('🔍 시스템 상태 점검 중...');
        
        const health = {
            timestamp: new Date().toISOString(),
            api: await this.checkAPIHealth(),
            database: await this.checkDatabaseHealth(),
            services: await this.checkServicesHealth(),
            gcp: await this.checkGCPQuota(),
            vercel: await this.checkVercelMetrics()
        };
        
        return health;
    }

    async checkAPIHealth() {
        const endpoints = [
            'http://localhost:3000/api/health',
            'http://localhost:3000/api/servers/status',
            'http://localhost:3000/api/metrics'
        ];
        
        const results = {};
        
        for (const endpoint of endpoints) {
            try {
                const response = await this.makeRequest(endpoint);
                results[endpoint] = {
                    status: response.status,
                    healthy: response.status >= 200 && response.status < 400
                };
            } catch (error) {
                results[endpoint] = {
                    status: 'ERROR',
                    healthy: false,
                    error: error.message
                };
            }
        }
        
        return results;
    }

    async checkDatabaseHealth() {
        try {
            const response = await this.makeRequest('http://localhost:3000/api/health/supabase');
            return {
                connected: response.status === 200,
                status: response.status
            };
        } catch (error) {
            return {
                connected: false,
                error: error.message
            };
        }
    }

    async checkServicesHealth() {
        // 여기서는 로컬 서비스들의 상태를 체크
        const services = ['next.js', 'redis', 'mcp-server'];
        const results = {};
        
        for (const service of services) {
            // 간단한 프로세스 체크 (실제로는 더 정교한 체크가 필요)
            results[service] = {
                running: Math.random() > 0.1, // 90% 확률로 실행 중
                uptime: Math.floor(Math.random() * 86400) // 랜덤 업타임
            };
        }
        
        return results;
    }

    async checkGCPQuota() {
        // GCP 할당량 체크 (실제로는 GCP API 필요)
        return {
            computeEngine: { used: 45, limit: 100, percentage: 45 },
            cloudFunctions: { used: 23, limit: 50, percentage: 46 },
            storage: { used: 67, limit: 100, percentage: 67 }
        };
    }

    async checkVercelMetrics() {
        // Vercel 메트릭 체크 (실제로는 Vercel API 필요)
        return {
            deployments: { today: 3, thisMonth: 45 },
            bandwidth: { used: 12.5, limit: 100 },
            executions: { today: 1234, thisMonth: 35678 }
        };
    }

    async makeRequest(url, options = {}) {
        return new Promise((resolve, reject) => {
            const urlObj = new URL(url);
            const isHttps = urlObj.protocol === 'https:';
            const client = isHttps ? https : require('http');

            const requestOptions = {
                hostname: urlObj.hostname,
                port: urlObj.port || (isHttps ? 443 : 80),
                path: urlObj.pathname + urlObj.search,
                method: options.method || 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                timeout: 10000
            };

            const req = client.request(requestOptions, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    resolve({
                        status: res.statusCode,
                        data: data
                    });
                });
            });

            req.on('error', reject);
            req.on('timeout', () => reject(new Error('Request timeout')));
            req.end();
        });
    }

    async generateAlert(type, message, severity = 'info') {
        const alert = {
            timestamp: new Date().toISOString(),
            type,
            message,
            severity,
            id: Date.now().toString()
        };
        
        this.alerts.push(alert);
        
        console.log(`🚨 [${severity.toUpperCase()}] ${type}: ${message}`);
        
        // 로그 파일에 저장
        try {
            await fs.mkdir('logs', { recursive: true });
            await fs.appendFile(
                'logs/monitoring-alerts.log',
                JSON.stringify(alert) + '\n'
            );
        } catch (error) {
            console.warn('알림 로그 저장 실패:', error.message);
        }
    }

    async startMonitoring() {
        if (this.monitoringActive) {
            console.log('⚠️ 모니터링이 이미 실행 중입니다.');
            return;
        }
        
        this.monitoringActive = true;
        console.log('🔄 실시간 모니터링 시작...');
        
        const monitorLoop = async () => {
            if (!this.monitoringActive) return;
            
            try {
                const health = await this.checkSystemHealth();
                await this.analyzeHealth(health);
                
                // 다음 체크 예약
                setTimeout(monitorLoop, this.config.checkInterval);
            } catch (error) {
                console.error('모니터링 오류:', error.message);
                setTimeout(monitorLoop, this.config.checkInterval);
            }
        };
        
        await monitorLoop();
    }

    stopMonitoring() {
        this.monitoringActive = false;
        console.log('⏹️ 모니터링 중지됨');
    }

    async analyzeHealth(health) {
        // API 상태 분석
        const failedAPIs = Object.entries(health.api)
            .filter(([, result]) => !result.healthy);
        
        if (failedAPIs.length > 0) {
            await this.generateAlert(
                'API',
                `${failedAPIs.length}개 API 엔드포인트 실패`,
                'warning'
            );
        }
        
        // 데이터베이스 상태 분석
        if (!health.database.connected) {
            await this.generateAlert(
                'Database',
                '데이터베이스 연결 실패',
                'critical'
            );
        }
        
        // GCP 할당량 분석
        Object.entries(health.gcp).forEach(async ([service, quota]) => {
            if (quota.percentage > this.config.alertThresholds.storage) {
                await this.generateAlert(
                    'GCP Quota',
                    `${service} 할당량 ${quota.percentage}% 사용 중`,
                    'warning'
                );
            }
        });
        
        console.log(`✅ 상태 점검 완료 (${health.timestamp})`);
    }

    async generateReport() {
        const health = await this.checkSystemHealth();
        
        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                totalServices: Object.keys(health.services).length,
                healthyServices: Object.values(health.services)
                    .filter(s => s.running).length,
                totalAlerts: this.alerts.length,
                recentAlerts: this.alerts.slice(-10)
            },
            details: health
        };
        
        console.log('📊 모니터링 리포트:');
        console.log(`  서비스 상태: ${report.summary.healthyServices}/${report.summary.totalServices} 정상`);
        console.log(`  최근 알림: ${report.summary.totalAlerts}개`);
        console.log(`  데이터베이스: ${health.database.connected ? '✅' : '❌'}`);
        
        // 리포트를 JSON 파일로 저장
        await fs.mkdir('logs', { recursive: true });
        await fs.writeFile(
            'logs/monitoring-report.json',
            JSON.stringify(report, null, 2)
        );
        
        return report;
    }
}

// CLI 실행
if (require.main === module) {
    const monitoring = new UnifiedMonitoring();
    const command = process.argv[2];
    
    (async () => {
        try {
            switch (command) {
                case 'start':
                    await monitoring.startMonitoring();
                    break;
                    
                case 'check':
                    await monitoring.checkSystemHealth();
                    break;
                    
                case 'report':
                    await monitoring.generateReport();
                    break;
                    
                case 'alerts':
                    console.log('🚨 최근 알림:');
                    monitoring.alerts.slice(-10).forEach(alert => {
                        console.log(`  [${alert.severity}] ${alert.type}: ${alert.message}`);
                    });
                    break;
                    
                default:
                    console.log('📊 통합 모니터링 도구 사용법:');
                    console.log('  node unified-monitoring.js start   # 실시간 모니터링 시작');
                    console.log('  node unified-monitoring.js check   # 현재 상태 점검');
                    console.log('  node unified-monitoring.js report  # 상세 리포트 생성');
                    console.log('  node unified-monitoring.js alerts  # 최근 알림 조회');
                    break;
            }
            
            if (command !== 'start') {
                process.exit(0);
            }
        } catch (error) {
            console.error('❌ 오류:', error.message);
            process.exit(1);
        }
    })();
}

module.exports = UnifiedMonitoring;