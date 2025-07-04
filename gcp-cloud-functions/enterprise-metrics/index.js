/**
 * 🏢 GCP Enterprise Metrics Generator v2.0
 * 25개 핵심 엔터프라이즈 메트릭 생성 (Vercel 대체)
 */

import { onRequest } from 'firebase-functions/v2/https';

// 🎯 엔터프라이즈 메트릭 생성 클래스
class GCPEnterpriseMetrics {
    constructor() {
        this.enabled = true;
        this.servers = this.initializeServers();
        this.scenarios = new Map();
        this.lastUpdate = Date.now();
    }

    // 🏗️ 8개 표준 서버 초기화
    initializeServers() {
        return [
            { id: 'web-lb-01', name: 'Load Balancer 01', type: 'loadbalancer', cores: 8, ram: 32 },
            { id: 'web-app-01', name: 'Web Server 01', type: 'web', cores: 16, ram: 64 },
            { id: 'web-app-02', name: 'Web Server 02', type: 'web', cores: 16, ram: 64 },
            { id: 'db-master-01', name: 'Database Master', type: 'database', cores: 32, ram: 128 },
            { id: 'db-slave-01', name: 'Database Slave', type: 'database', cores: 32, ram: 128 },
            { id: 'api-gw-01', name: 'API Gateway 01', type: 'api', cores: 24, ram: 96 },
            { id: 'cache-redis-01', name: 'Redis Cache 01', type: 'cache', cores: 8, ram: 64 },
            { id: 'monitor-01', name: 'Monitoring Server', type: 'monitoring', cores: 12, ram: 48 }
        ];
    }

    // 🎭 6가지 실제 장애 시나리오 생성
    generateScenario() {
        const scenarios = [
            { name: 'normal', weight: 70 },
            { name: 'peak', weight: 15 },
            { name: 'memory_leak', weight: 5 },
            { name: 'disk_issue', weight: 3 },
            { name: 'network_slow', weight: 4 },
            { name: 'service_down', weight: 3 }
        ];

        const random = Math.random() * 100;
        let accumulated = 0;

        for (const scenario of scenarios) {
            accumulated += scenario.weight;
            if (random <= accumulated) {
                return scenario.name;
            }
        }

        return 'normal';
    }

    // 🎲 랜덤값 생성 유틸리티
    rand(center, variation) {
        return Math.random() * variation * 2 - variation + center;
    }

    // 📊 25개 엔터프라이즈 메트릭 생성
    generateMetrics() {
        return this.servers.map(server => {
            const scenario = this.generateScenario();
            const multiplier = this.getMultiplier(scenario);
            const timestamp = new Date().toISOString();

            return {
                serverId: server.id,
                serverName: server.name,
                serverType: server.type,
                timestamp,
                scenario,

                // 🖥️ 시스템 리소스 메트릭 (10개)
                systemResources: {
                    cpuUsage: this.generateCPU(server, scenario, multiplier),
                    loadAverage: this.generateLoad(server, multiplier),
                    cpuTemperature: this.generateTemp(server, scenario),
                    memoryUsage: this.generateMemory(server, scenario, multiplier),
                    swapUsage: this.generateSwap(server, scenario),
                    diskUsage: this.generateDisk(server, scenario),
                    diskIOPS: this.generateIOPS(server, scenario, multiplier),
                    networkInbound: this.generateNetIn(server, scenario, multiplier),
                    networkOutbound: this.generateNetOut(server, scenario, multiplier),
                    networkConnections: this.generateConnections(server, scenario, multiplier)
                },

                // 🚀 애플리케이션 성능 메트릭 (8개)
                applicationPerformance: {
                    responseTime: this.generateResponse(server, scenario, multiplier),
                    requestsPerSecond: this.generateRPS(server, scenario, multiplier),
                    errorRate: this.generateErrors(server, scenario),
                    activeConnections: this.generateActiveConns(server, scenario, multiplier),
                    threadPoolUsage: this.generateThreads(server, scenario, multiplier),
                    cacheHitRate: this.generateCacheHit(server, scenario),
                    dbQueryTime: this.generateQueryTime(server, scenario, multiplier),
                    sslHandshakeTime: this.generateSSL(server, scenario)
                },

                // 🛡️ 시스템 상태 메트릭 (7개)
                systemHealth: {
                    processCount: this.generateProcesses(server, scenario),
                    fileDescriptorUsage: this.generateFileDesc(server, scenario, multiplier),
                    uptime: this.generateUptime(),
                    securityEvents: this.generateSecurity(server, scenario),
                    logErrors: this.generateLogErrors(server, scenario),
                    serviceHealthScore: this.generateHealthScore(server, scenario),
                    memoryLeakIndicator: this.generateMemoryLeak(scenario)
                }
            };
        });
    }

    // 🎯 시나리오별 승수 계산
    getMultiplier(scenario) {
        const multipliers = {
            normal: 1.0,
            peak: 1.8,
            memory_leak: 1.3,
            disk_issue: 1.4,
            network_slow: 1.1,
            service_down: 0.3
        };
        return multipliers[scenario] || 1.0;
    }

    // 🖥️ 시스템 리소스 메트릭 생성 함수들
    generateCPU(server, scenario, multiplier) {
        const base = { web: 35, database: 25, api: 45, cache: 20, loadbalancer: 30, monitoring: 40 }[server.type] || 30;
        const adj = scenario === 'peak' ? 25 : scenario === 'service_down' ? -15 : 0;
        return Math.max(5, Math.min(98, base * multiplier + adj + this.rand(0, 15)));
    }

    generateLoad(server, multiplier) {
        const base = { web: 1.2, database: 0.8, api: 1.5, cache: 0.6, loadbalancer: 2.0, monitoring: 1.0 }[server.type] || 1.0;
        return Math.max(0.1, Math.min(8.0, base * multiplier + this.rand(0, 0.5)));
    }

    generateTemp(server, scenario) {
        const base = { web: 55, database: 45, api: 60, cache: 40, loadbalancer: 50, monitoring: 48 }[server.type] || 50;
        const increase = scenario === 'peak' ? 15 : scenario === 'service_down' ? -10 : 0;
        return Math.max(35, Math.min(85, base + increase + this.rand(0, 8)));
    }

    generateMemory(server, scenario, multiplier) {
        const base = { web: 60, database: 75, api: 55, cache: 80, loadbalancer: 45, monitoring: 50 }[server.type] || 60;
        const adj = scenario === 'memory_leak' ? 25 : scenario === 'peak' ? 15 : 0;
        return Math.max(20, Math.min(98, base * multiplier + adj + this.rand(0, 12)));
    }

    generateSwap(server, scenario) {
        const base = { web: 5, database: 2, api: 8, cache: 1, loadbalancer: 3, monitoring: 4 }[server.type] || 3;
        const increase = scenario === 'memory_leak' ? 20 : scenario === 'peak' ? 10 : 0;
        return Math.max(0, Math.min(50, base + increase + this.rand(0, 5)));
    }

    generateDisk(server, scenario) {
        const base = { web: 70, database: 85, api: 65, cache: 45, loadbalancer: 55, monitoring: 60 }[server.type] || 65;
        const increase = scenario === 'disk_issue' ? 25 : 0;
        return Math.max(40, Math.min(98, base + increase + this.rand(0, 10)));
    }

    generateIOPS(server, scenario, multiplier) {
        const base = { web: 800, database: 2000, api: 600, cache: 1200, loadbalancer: 400, monitoring: 500 }[server.type] || 700;
        const increase = scenario === 'disk_issue' ? 2.5 : scenario === 'peak' ? 1.8 : 1.0;
        return Math.max(50, Math.round(base * multiplier * increase + this.rand(0, 200)));
    }

    generateNetIn(server, scenario, multiplier) {
        const base = { web: 150, database: 80, api: 200, cache: 100, loadbalancer: 300, monitoring: 120 }[server.type] || 150;
        const increase = scenario === 'network_slow' ? 2.0 : scenario === 'peak' ? 1.5 : 1.0;
        return Math.max(10, Math.round(base * multiplier * increase + this.rand(0, 50)));
    }

    generateNetOut(server, scenario, multiplier) {
        const base = { web: 120, database: 60, api: 180, cache: 80, loadbalancer: 250, monitoring: 100 }[server.type] || 120;
        const increase = scenario === 'network_slow' ? 1.8 : scenario === 'peak' ? 1.3 : 1.0;
        return Math.max(5, Math.round(base * multiplier * increase + this.rand(0, 40)));
    }

    generateConnections(server, scenario, multiplier) {
        const base = { web: 400, database: 200, api: 600, cache: 150, loadbalancer: 800, monitoring: 100 }[server.type] || 300;
        const increase = scenario === 'peak' ? 2.0 : scenario === 'network_slow' ? 1.5 : 1.0;
        return Math.max(20, Math.round(base * multiplier * increase + this.rand(0, 100)));
    }

    // 🚀 애플리케이션 성능 메트릭 생성 함수들
    generateResponse(server, scenario, multiplier) {
        const base = { web: 150, database: 50, api: 200, cache: 20, loadbalancer: 80, monitoring: 300 }[server.type] || 150;
        const increase = scenario === 'service_down' ? 8.0 : scenario === 'network_slow' ? 3.0 : scenario === 'peak' ? 2.0 : 1.0;
        return Math.max(10, Math.round(base * multiplier * increase + this.rand(0, 50)));
    }

    generateRPS(server, scenario, multiplier) {
        const base = { web: 120, database: 50, api: 200, cache: 300, loadbalancer: 180, monitoring: 30 }[server.type] || 100;
        const factor = scenario === 'service_down' ? 0.1 : scenario === 'peak' ? 1.8 : 1.0;
        return Math.max(1, Math.round(base * multiplier * factor + this.rand(0, 20)));
    }

    generateErrors(server, scenario) {
        const base = { web: 0.5, database: 0.2, api: 1.0, cache: 0.1, loadbalancer: 0.8, monitoring: 0.3 }[server.type] || 0.5;
        const increase = scenario === 'service_down' ? 15 : scenario === 'peak' ? 3 : 0;
        return Math.max(0, Math.min(20, base + increase + this.rand(0, 1)));
    }

    generateActiveConns(server, scenario, multiplier) {
        const base = { web: 200, database: 100, api: 300, cache: 80, loadbalancer: 400, monitoring: 50 }[server.type] || 150;
        const increase = scenario === 'peak' ? 1.8 : scenario === 'network_slow' ? 1.4 : 1.0;
        return Math.max(10, Math.round(base * multiplier * increase + this.rand(0, 50)));
    }

    generateThreads(server, scenario, multiplier) {
        const base = { web: 60, database: 70, api: 55, cache: 40, loadbalancer: 30, monitoring: 45 }[server.type] || 50;
        const adj = scenario === 'peak' ? 25 : scenario === 'service_down' ? -20 : 0;
        return Math.max(10, Math.min(100, base * multiplier + adj + this.rand(0, 20)));
    }

    generateCacheHit(server, scenario) {
        const base = server.type === 'cache' ? 92 : 85;
        const decrease = scenario === 'peak' ? 15 : scenario === 'memory_leak' ? 10 : 0;
        return Math.max(50, Math.min(99, base - decrease + this.rand(0, 10)));
    }

    generateQueryTime(server, scenario, multiplier) {
        const base = { web: 25, database: 8, api: 35, cache: 2, loadbalancer: 1, monitoring: 45 }[server.type] || 20;
        const increase = scenario === 'disk_issue' ? 5.0 : scenario === 'peak' ? 3.0 : 1.0;
        return Math.max(0.5, Math.round(base * multiplier * increase + this.rand(0, 10)));
    }

    generateSSL(server, scenario) {
        const base = { web: 45, database: 25, api: 35, cache: 15, loadbalancer: 30, monitoring: 40 }[server.type] || 35;
        const increase = scenario === 'network_slow' ? 2.5 : scenario === 'peak' ? 1.8 : 1.0;
        return Math.max(5, Math.round(base * increase + this.rand(0, 20)));
    }

    // 🛡️ 시스템 상태 메트릭 생성 함수들
    generateProcesses(server, scenario) {
        const base = { web: 180, database: 120, api: 150, cache: 80, loadbalancer: 90, monitoring: 200 }[server.type] || 120;
        const change = scenario === 'service_down' ? 50 : scenario === 'peak' ? 30 : 0;
        return Math.max(50, base + change + this.rand(0, 40));
    }

    generateFileDesc(server, scenario, multiplier) {
        const base = { web: 55, database: 70, api: 60, cache: 45, loadbalancer: 80, monitoring: 50 }[server.type] || 55;
        const increase = scenario === 'peak' ? 20 : scenario === 'network_slow' ? 15 : 0;
        return Math.max(20, Math.min(98, base * multiplier + increase + this.rand(0, 16)));
    }

    generateUptime() {
        return Math.round((15 + Math.random() * 60) * 24 * 3600);
    }

    generateSecurity(server, scenario) {
        const base = { web: 3, database: 1, api: 5, cache: 0, loadbalancer: 8, monitoring: 2 }[server.type] || 2;
        const increase = scenario === 'service_down' ? 10 : 0;
        return Math.max(0, base + increase + Math.floor(Math.random() * 5));
    }

    generateLogErrors(server, scenario) {
        const base = { web: 8, database: 3, api: 12, cache: 1, loadbalancer: 15, monitoring: 5 }[server.type] || 5;
        const increase = scenario === 'service_down' ? 25 : scenario === 'peak' ? 10 : 0;
        return Math.max(0, base + increase + Math.floor(Math.random() * 8));
    }

    generateHealthScore(server, scenario) {
        const base = { web: 92, database: 95, api: 88, cache: 96, loadbalancer: 90, monitoring: 93 }[server.type] || 90;
        const decrease = scenario === 'service_down' ? 40 : scenario === 'peak' ? 15 : 0;
        return Math.max(30, Math.min(100, base - decrease + this.rand(0, 10)));
    }

    generateMemoryLeak(scenario) {
        return scenario === 'memory_leak' ? this.rand(25, 15) : this.rand(2, 3);
    }

    // 🔍 공개 API
    getAllServers() {
        return [...this.servers];
    }

    getCurrentScenario(serverId) {
        return this.scenarios.get(serverId) || 'normal';
    }

    getDashboardSummary() {
        const metrics = this.generateMetrics();
        return {
            summary: {
                totalServers: metrics.length,
                healthyServers: metrics.filter(m => m.systemHealth.serviceHealthScore >= 90).length,
                warningServers: metrics.filter(m =>
                    m.systemHealth.serviceHealthScore >= 70 && m.systemHealth.serviceHealthScore < 90
                ).length,
                criticalServers: metrics.filter(m => m.systemHealth.serviceHealthScore < 70).length,
                avgCpuUsage: Math.round(
                    metrics.reduce((sum, m) => sum + m.systemResources.cpuUsage, 0) / metrics.length
                ),
                avgMemoryUsage: Math.round(
                    metrics.reduce((sum, m) => sum + m.systemResources.memoryUsage, 0) / metrics.length
                ),
                totalErrors: metrics.reduce((sum, m) => sum + m.systemHealth.logErrors, 0)
            },
            servers: metrics
        };
    }

    getActiveScenarios() {
        return this.servers.map(server => ({
            serverId: server.id,
            serverName: server.name,
            serverType: server.type,
            scenario: this.getCurrentScenario(server.id)
        }));
    }

    getStatus() {
        return {
            enabled: this.enabled,
            serverCount: this.servers.length,
            activeScenarios: Object.fromEntries(this.scenarios),
            lastUpdate: new Date(this.lastUpdate).toISOString(),
            gcpFunctions: true,
            version: '2.0'
        };
    }

    enable() {
        this.enabled = true;
    }

    disable() {
        this.enabled = false;
    }

    isActive() {
        return this.enabled;
    }
}

// 🎯 싱글톤 인스턴스
const metricsGenerator = new GCPEnterpriseMetrics();

// 🔌 GCP Functions 엔드포인트
export const enterpriseMetrics = onRequest((req, res) => {
    // CORS 헤더 설정
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return;
    }

    try {
        const action = req.query.action || 'current';
        const serverId = req.query.serverId;

        if (req.method === 'POST') {
            const { action: postAction } = req.body || {};

            switch (postAction) {
                case 'enable':
                    metricsGenerator.enable();
                    res.status(200).json({
                        success: true,
                        message: '엔터프라이즈 메트릭 생성기가 활성화되었습니다',
                        data: metricsGenerator.getStatus(),
                        timestamp: new Date().toISOString()
                    });
                    return;

                case 'disable':
                    metricsGenerator.disable();
                    res.status(200).json({
                        success: true,
                        message: '엔터프라이즈 메트릭 생성기가 비활성화되었습니다',
                        data: metricsGenerator.getStatus(),
                        timestamp: new Date().toISOString()
                    });
                    return;

                default:
                    res.status(400).json({
                        success: false,
                        error: `지원하지 않는 POST 액션: ${postAction}`
                    });
                    return;
            }
        }

        // GET 요청 처리
        switch (action) {
            case 'current':
                const currentMetrics = metricsGenerator.generateMetrics();
                res.status(200).json({
                    success: true,
                    action: 'current',
                    data: {
                        metrics: currentMetrics,
                        servers: metricsGenerator.getAllServers()
                    },
                    timestamp: new Date().toISOString(),
                    metricsCount: 25,
                    serversCount: currentMetrics.length,
                    source: 'gcp-functions'
                });
                break;

            case 'server':
                if (!serverId) {
                    res.status(400).json({
                        success: false,
                        error: 'serverId 파라미터가 필요합니다'
                    });
                    return;
                }

                const allMetrics = metricsGenerator.generateMetrics();
                const serverMetrics = allMetrics.find(m => m.serverId === serverId);

                if (!serverMetrics) {
                    res.status(404).json({
                        success: false,
                        error: '서버를 찾을 수 없습니다'
                    });
                    return;
                }

                res.status(200).json({
                    success: true,
                    action: 'server',
                    data: {
                        server: serverMetrics,
                        scenario: metricsGenerator.getCurrentScenario(serverId)
                    },
                    timestamp: new Date().toISOString(),
                    source: 'gcp-functions'
                });
                break;

            case 'dashboard':
                const dashboardData = metricsGenerator.getDashboardSummary();
                res.status(200).json({
                    success: true,
                    action: 'dashboard',
                    data: dashboardData,
                    timestamp: new Date().toISOString(),
                    source: 'gcp-functions'
                });
                break;

            case 'scenarios':
                const scenarios = metricsGenerator.getActiveScenarios();
                res.status(200).json({
                    success: true,
                    action: 'scenarios',
                    data: scenarios,
                    timestamp: new Date().toISOString(),
                    source: 'gcp-functions'
                });
                break;

            case 'status':
                const status = metricsGenerator.getStatus();
                res.status(200).json({
                    success: true,
                    action: 'status',
                    data: {
                        ...status,
                        isActive: metricsGenerator.isActive()
                    },
                    timestamp: new Date().toISOString(),
                    source: 'gcp-functions'
                });
                break;

            default:
                res.status(400).json({
                    success: false,
                    error: `지원하지 않는 GET 액션: ${action}`
                });
                break;
        }
    } catch (error) {
        console.error('GCP Enterprise Metrics 오류:', error);
        res.status(500).json({
            success: false,
            error: 'GCP Functions에서 메트릭 생성 중 오류가 발생했습니다',
            details: error.message,
            source: 'gcp-functions'
        });
    }
}); 