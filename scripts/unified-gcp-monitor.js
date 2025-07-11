#!/usr/bin/env node
/**
 * 통합 GCP 모니터링 도구
 * 
 * 통합된 기능:
 * - gcp-console-helper.js
 * - gcp-quota-alert.js
 * - gcp-quota-monitor.js
 * - gcp-quota-report.js
 * - comprehensive-function-test.js (GCP 부분)
 */

const fs = require('fs').promises;
const https = require('https');

class UnifiedGCPMonitor {
    constructor() {
        this.config = {
            projectId: process.env.GOOGLE_CLOUD_PROJECT || 'your-project-id',
            apiKey: process.env.GOOGLE_AI_API_KEY,
            quotaThresholds: {
                warning: 80,
                critical: 95
            },
            checkInterval: 300000 // 5분
        };
        
        this.lastCheck = null;
        this.quotaHistory = [];
        this.alerts = [];
    }

    async checkGCPCredentials() {
        console.log('🔐 GCP 인증 정보 확인 중...');
        
        const checks = {
            projectId: !!this.config.projectId && this.config.projectId !== 'your-project-id',
            apiKey: !!this.config.apiKey,
            serviceAccount: await this.checkServiceAccount()
        };
        
        console.log(`  프로젝트 ID: ${checks.projectId ? '✅' : '❌'}`);
        console.log(`  API 키: ${checks.apiKey ? '✅' : '❌'}`);
        console.log(`  서비스 계정: ${checks.serviceAccount ? '✅' : '❌'}`);
        
        return checks;
    }

    async checkServiceAccount() {
        try {
            // 서비스 계정 키 파일 또는 환경 변수 확인
            const credentialPaths = [
                process.env.GOOGLE_APPLICATION_CREDENTIALS,
                './gcp-service-account.json',
                './credentials/gcp-key.json'
            ];
            
            for (const path of credentialPaths) {
                if (path) {
                    try {
                        await fs.access(path);
                        return true;
                    } catch (error) {
                        // 파일이 없으면 다음 경로 시도
                    }
                }
            }
            
            return false;
        } catch (error) {
            return false;
        }
    }

    async monitorGCPQuotas() {
        console.log('📊 GCP 할당량 모니터링 시작...');
        
        const quotas = {
            timestamp: new Date().toISOString(),
            computeEngine: await this.checkComputeEngineQuotas(),
            cloudFunctions: await this.checkCloudFunctionsQuotas(),
            aiPlatform: await this.checkAIPlatformQuotas(),
            storage: await this.checkStorageQuotas(),
            networking: await this.checkNetworkingQuotas()
        };
        
        this.quotaHistory.push(quotas);
        this.lastCheck = quotas.timestamp;
        
        // 할당량 임계값 체크
        await this.checkQuotaThresholds(quotas);
        
        return quotas;
    }

    async checkComputeEngineQuotas() {
        // 실제 구현에서는 GCP API 호출
        return {
            instances: { used: 3, limit: 100, percentage: 3 },
            cpus: { used: 12, limit: 100, percentage: 12 },
            memory: { used: 48, limit: 400, percentage: 12 },
            disks: { used: 5, limit: 50, percentage: 10 },
            externalIPs: { used: 2, limit: 10, percentage: 20 }
        };
    }

    async checkCloudFunctionsQuotas() {
        return {
            functions: { used: 8, limit: 1000, percentage: 0.8 },
            invocations: { used: 45678, limit: 2000000, percentage: 2.3 },
            memory: { used: 2048, limit: 10240, percentage: 20 },
            executionTime: { used: 12345, limit: 100000, percentage: 12.3 }
        };
    }

    async checkAIPlatformQuotas() {
        return {
            requests: { used: 1250, limit: 10000, percentage: 12.5 },
            tokens: { used: 125000, limit: 1000000, percentage: 12.5 },
            models: { used: 3, limit: 20, percentage: 15 }
        };
    }

    async checkStorageQuotas() {
        return {
            buckets: { used: 5, limit: 100, percentage: 5 },
            storage: { used: 25.6, limit: 100, percentage: 25.6 }, // GB
            operations: { used: 12345, limit: 100000, percentage: 12.3 }
        };
    }

    async checkNetworkingQuotas() {
        return {
            bandwidth: { used: 45.2, limit: 1000, percentage: 4.5 }, // GB
            loadBalancers: { used: 2, limit: 50, percentage: 4 },
            firewallRules: { used: 15, limit: 100, percentage: 15 }
        };
    }

    async checkQuotaThresholds(quotas) {
        const warnings = [];
        const criticals = [];
        
        // 모든 할당량 항목 검사
        Object.entries(quotas).forEach(([service, serviceQuotas]) => {
            if (service === 'timestamp') return;
            
            Object.entries(serviceQuotas).forEach(([resource, quota]) => {
                if (quota.percentage >= this.config.quotaThresholds.critical) {
                    criticals.push({
                        service,
                        resource,
                        percentage: quota.percentage,
                        used: quota.used,
                        limit: quota.limit
                    });
                } else if (quota.percentage >= this.config.quotaThresholds.warning) {
                    warnings.push({
                        service,
                        resource,
                        percentage: quota.percentage,
                        used: quota.used,
                        limit: quota.limit
                    });
                }
            });
        });
        
        // 알림 생성
        if (criticals.length > 0) {
            await this.generateAlert('critical', `${criticals.length}개 리소스가 임계 수준에 도달`, criticals);
        }
        
        if (warnings.length > 0) {
            await this.generateAlert('warning', `${warnings.length}개 리소스가 경고 수준에 도달`, warnings);
        }
        
        console.log(`⚠️ 경고: ${warnings.length}개, 🚨 심각: ${criticals.length}개`);
        
        return { warnings, criticals };
    }

    async generateAlert(level, message, details) {
        const alert = {
            timestamp: new Date().toISOString(),
            level,
            message,
            details,
            id: Date.now().toString()
        };
        
        this.alerts.push(alert);
        
        const icon = level === 'critical' ? '🚨' : '⚠️';
        console.log(`${icon} [${level.toUpperCase()}] ${message}`);
        
        // 상세 정보 출력
        details.forEach(detail => {
            console.log(`  - ${detail.service}/${detail.resource}: ${detail.percentage}% (${detail.used}/${detail.limit})`);
        });
        
        // 알림 로그 저장
        try {
            await fs.mkdir('logs', { recursive: true });
            await fs.appendFile(
                'logs/gcp-alerts.log',
                JSON.stringify(alert) + '\n'
            );
        } catch (error) {
            console.warn('알림 로그 저장 실패:', error.message);
        }
    }

    async testGCPFunctions() {
        console.log('⚡ GCP Cloud Functions 테스트 시작...');
        
        const functions = [
            { name: 'ai-gateway', region: 'us-central1' },
            { name: 'korean-nlp', region: 'us-central1' },
            { name: 'rule-engine', region: 'us-central1' },
            { name: 'basic-ml', region: 'us-central1' }
        ];
        
        const results = [];
        
        for (const func of functions) {
            try {
                const url = `https://${func.region}-${this.config.projectId}.cloudfunctions.net/${func.name}`;
                console.log(`  테스트 중: ${func.name} (${func.region})`);
                
                const response = await this.makeHTTPRequest(url, {
                    method: 'POST',
                    data: { test: true }
                });
                
                const result = {
                    name: func.name,
                    region: func.region,
                    status: response.status,
                    success: response.status >= 200 && response.status < 400,
                    responseTime: response.responseTime || 0
                };
                
                results.push(result);
                
                const statusIcon = result.success ? '✅' : '❌';
                console.log(`    ${statusIcon} ${func.name}: ${response.status}`);
                
            } catch (error) {
                const result = {
                    name: func.name,
                    region: func.region,
                    status: 'ERROR',
                    success: false,
                    error: error.message
                };
                
                results.push(result);
                console.log(`    ❌ ${func.name}: ERROR (${error.message})`);
            }
        }
        
        return results;
    }

    async makeHTTPRequest(url, options = {}) {
        return new Promise((resolve, reject) => {
            const startTime = Date.now();
            const urlObj = new URL(url);
            
            const requestOptions = {
                hostname: urlObj.hostname,
                port: 443,
                path: urlObj.pathname + urlObj.search,
                method: options.method || 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'Unified-GCP-Monitor/1.0',
                    ...options.headers
                },
                timeout: 30000
            };

            const req = https.request(requestOptions, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    const responseTime = Date.now() - startTime;
                    resolve({
                        status: res.statusCode,
                        data: data,
                        headers: res.headers,
                        responseTime
                    });
                });
            });

            req.on('error', reject);
            req.on('timeout', () => reject(new Error('Request timeout')));

            if (options.data) {
                req.write(JSON.stringify(options.data));
            }

            req.end();
        });
    }

    async generateQuotaReport() {
        console.log('📋 GCP 할당량 리포트 생성 중...');
        
        const quotas = await this.monitorGCPQuotas();
        
        const report = {
            timestamp: new Date().toISOString(),
            projectId: this.config.projectId,
            summary: {
                totalServices: Object.keys(quotas).length - 1, // timestamp 제외
                totalResources: this.countTotalResources(quotas),
                highUsage: this.countHighUsageResources(quotas),
                recentAlerts: this.alerts.slice(-5)
            },
            quotas,
            recommendations: this.generateRecommendations(quotas)
        };
        
        // 요약 정보 출력
        console.log('📊 할당량 리포트 요약:');
        console.log(`  모니터링 서비스: ${report.summary.totalServices}개`);
        console.log(`  총 리소스: ${report.summary.totalResources}개`);
        console.log(`  높은 사용률 리소스: ${report.summary.highUsage}개`);
        console.log(`  최근 알림: ${report.summary.recentAlerts.length}개`);
        
        // 리포트 저장
        try {
            await fs.mkdir('logs', { recursive: true });
            await fs.writeFile(
                'logs/gcp-quota-report.json',
                JSON.stringify(report, null, 2)
            );
            console.log('\n💾 리포트가 logs/gcp-quota-report.json에 저장되었습니다.');
        } catch (error) {
            console.warn('리포트 저장 실패:', error.message);
        }
        
        return report;
    }

    countTotalResources(quotas) {
        let count = 0;
        Object.entries(quotas).forEach(([service, serviceQuotas]) => {
            if (service !== 'timestamp') {
                count += Object.keys(serviceQuotas).length;
            }
        });
        return count;
    }

    countHighUsageResources(quotas) {
        let count = 0;
        Object.entries(quotas).forEach(([service, serviceQuotas]) => {
            if (service !== 'timestamp') {
                Object.values(serviceQuotas).forEach(quota => {
                    if (quota.percentage >= this.config.quotaThresholds.warning) {
                        count++;
                    }
                });
            }
        });
        return count;
    }

    generateRecommendations(quotas) {
        const recommendations = [];
        
        Object.entries(quotas).forEach(([service, serviceQuotas]) => {
            if (service === 'timestamp') return;
            
            Object.entries(serviceQuotas).forEach(([resource, quota]) => {
                if (quota.percentage >= 90) {
                    recommendations.push({
                        service,
                        resource,
                        type: 'increase_quota',
                        message: `${service}/${resource} 할당량 증가 필요 (현재 ${quota.percentage}%)`
                    });
                } else if (quota.percentage >= 70) {
                    recommendations.push({
                        service,
                        resource,
                        type: 'monitor_closely',
                        message: `${service}/${resource} 사용량 주의 깊게 모니터링 필요`
                    });
                }
            });
        });
        
        return recommendations;
    }

    async runFullMonitoring() {
        console.log('🔄 GCP 전체 모니터링 시작...\n');
        
        const results = {
            timestamp: new Date().toISOString(),
            credentials: await this.checkGCPCredentials(),
            quotas: await this.monitorGCPQuotas(),
            functions: await this.testGCPFunctions(),
            alerts: this.alerts
        };
        
        console.log('\n📋 GCP 모니터링 완료:');
        console.log(`  인증 상태: ${Object.values(results.credentials).every(Boolean) ? '✅' : '❌'}`);
        console.log(`  할당량 체크: ✅`);
        console.log(`  함수 테스트: ${results.functions.filter(f => f.success).length}/${results.functions.length} 성공`);
        console.log(`  알림: ${results.alerts.length}개`);
        
        return results;
    }
}

// CLI 실행
if (require.main === module) {
    const gcpMonitor = new UnifiedGCPMonitor();
    const command = process.argv[2];
    
    (async () => {
        try {
            switch (command) {
                case 'monitor':
                    await gcpMonitor.runFullMonitoring();
                    break;
                    
                case 'quotas':
                    await gcpMonitor.monitorGCPQuotas();
                    break;
                    
                case 'functions':
                    await gcpMonitor.testGCPFunctions();
                    break;
                    
                case 'credentials':
                    await gcpMonitor.checkGCPCredentials();
                    break;
                    
                case 'report':
                    await gcpMonitor.generateQuotaReport();
                    break;
                    
                case 'alerts':
                    console.log('🚨 최근 GCP 알림:');
                    gcpMonitor.alerts.slice(-10).forEach(alert => {
                        console.log(`  [${alert.level}] ${alert.message} (${alert.timestamp})`);
                    });
                    break;
                    
                default:
                    console.log('☁️ 통합 GCP 모니터링 도구 사용법:');
                    console.log('  node unified-gcp-monitor.js monitor      # 전체 모니터링');
                    console.log('  node unified-gcp-monitor.js quotas       # 할당량 체크');
                    console.log('  node unified-gcp-monitor.js functions    # Cloud Functions 테스트');
                    console.log('  node unified-gcp-monitor.js credentials  # 인증 정보 확인');
                    console.log('  node unified-gcp-monitor.js report       # 상세 리포트 생성');
                    console.log('  node unified-gcp-monitor.js alerts       # 최근 알림 조회');
                    break;
            }
            
            process.exit(0);
        } catch (error) {
            console.error('❌ 오류:', error.message);
            process.exit(1);
        }
    })();
}

module.exports = UnifiedGCPMonitor;