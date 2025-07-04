/**
 * 🏢 Enterprise Metrics Generator Cloud Function
 * Vercel /api/enterprise/metrics를 대체하는 GCP 무료 티어 버전
 */

import { onRequest } from 'firebase-functions/v2/https';

// 🎯 엔터프라이즈 메트릭 생성기 클래스
class EnterpriseMetricsGenerator {
    constructor() {
        this.enabled = true;
        this.servers = this.initializeServers();
        this.history = new Map(); // 서버별 24시간 히스토리 (144개 데이터포인트)
        this.lastUpdate = Date.now();
        this.scenarios = new Map(); // 활성 시나리오 관리

        // 서버별 임계값 설정
        this.thresholds = {
            web: {
                cpu: { warning: 70, critical: 85 },
                memory: { warning: 80, critical: 90 },
                disk: { warning: 85, critical: 95 }
            },
            database: {
                cpu: { warning: 60, critical: 80 },
                memory: { warning: 85, critical: 95 },
                disk: { warning: 90, critical: 98 }
            },
            api: {
                cpu: { warning: 75, critical: 90 },
                memory: { warning: 75, critical: 90 },
                disk: { warning: 80, critical: 95 }
            },
            cache: {
                cpu: { warning: 50, critical: 70 },
                memory: { warning: 90, critical: 98 },
                disk: { warning: 70, critical: 85 }
            }
        };
    }

    // 🏗️ 초기 서버 설정
    initializeServers() {
        return [
            { id: 'web-01', name: 'Web Server 01', type: 'web', region: 'us-east-1' },
            { id: 'web-02', name: 'Web Server 02', type: 'web', region: 'us-west-2' },
            { id: 'db-01', name: 'Database Primary', type: 'database', region: 'us-east-1' },
            { id: 'db-02', name: 'Database Replica', type: 'database', region: 'us-west-2' },
            { id: 'api-01', name: 'API Gateway 01', type: 'api', region: 'us-east-1' },
            { id: 'api-02', name: 'API Gateway 02', type: 'api', region: 'us-west-2' },
            { id: 'cache-01', name: 'Redis Cache 01', type: 'cache', region: 'us-east-1' },
            { id: 'cache-02', name: 'Redis Cache 02', type: 'cache', region: 'us-west-2' }
        ];
    }

    // 🎲 실제 장애 시나리오 생성
    generateScenario(serverId) {
        const scenarios = [
            { name: 'normal', weight: 70, description: '정상 운영' },
            { name: 'peak_load', weight: 15, description: '피크 부하' },
            { name: 'memory_leak', weight: 5, description: '메모리 누수' },
            { name: 'disk_explosion', weight: 3, description: '디스크 폭증' },
            { name: 'network_congestion', weight: 4, description: '네트워크 혼잡' },
            { name: 'service_failure', weight: 3, description: '서비스 장애' }
        ];

        const random = Math.random() * 100;
        let accumulated = 0;

        for (const scenario of scenarios) {
            accumulated += scenario.weight;
            if (random <= accumulated) {
                return scenario;
            }
        }

        return scenarios[0]; // fallback
    }

    // 📊 엔터프라이즈급 메트릭 생성
    generateMetrics(serverId) {
        const server = this.servers.find(s => s.id === serverId);
        if (!server) return null;

        const scenario = this.generateScenario(serverId);
        const timestamp = new Date().toISOString();

        // 시나리오별 메트릭 조정
        const multipliers = this.getScenarioMultipliers(scenario.name);

        return {
            serverId,
            serverName: server.name,
            serverType: server.type,
            timestamp,
            scenario: scenario.name,

            // 🔧 시스템 리소스 메트릭 (10개)
            cpuUsage: this.generateMetric(20, 95, multipliers.cpu),
            loadAverage: this.generateMetric(0.5, 8.0, multipliers.load),
            cpuTemperature: this.generateMetric(35, 85, multipliers.temp),
            memoryUsage: this.generateMetric(30, 98, multipliers.memory),
            swapUsage: this.generateMetric(0, 50, multipliers.swap),
            diskUsage: this.generateMetric(40, 95, multipliers.disk),
            diskIops: this.generateMetric(100, 5000, multipliers.iops),
            networkInbound: this.generateMetric(10, 1000, multipliers.network),
            networkOutbound: this.generateMetric(5, 800, multipliers.network),
            networkConnections: this.generateMetric(50, 2000, multipliers.connections),

            // 🚀 애플리케이션 성능 메트릭 (8개)
            responseTime: this.generateMetric(50, 5000, multipliers.responseTime),
            requestsPerSecond: this.generateMetric(10, 500, multipliers.rps),
            errorRate: this.generateMetric(0, 15, multipliers.errors),
            activeConnections: this.generateMetric(20, 800, multipliers.activeConn),
            threadPoolUsage: this.generateMetric(10, 95, multipliers.threads),
            cacheHitRate: this.generateMetric(60, 98, multipliers.cache),
            dbQueryTime: this.generateMetric(10, 2000, multipliers.dbQuery),
            sslHandshakeTime: this.generateMetric(50, 500, multipliers.ssl),

            // 🛡️ 시스템 상태 메트릭 (7개)
            processCount: this.generateMetric(50, 300, multipliers.processes),
            fileDescriptorUsage: this.generateMetric(20, 90, multipliers.fd),
            uptimeHours: this.generateMetric(1, 8760, 1),
            securityEvents: this.generateMetric(0, 50, multipliers.security),
            logErrors: this.generateMetric(0, 100, multipliers.logErrors),
            healthScore: this.generateMetric(70, 100, multipliers.health),
            memoryLeakIndicator: this.generateMetric(0, 100, multipliers.memoryLeak)
        };
    }

    // 🎯 시나리오별 승수 계산
    getScenarioMultipliers(scenarioName) {
        const multipliers = {
            normal: {
                cpu: 1.0, memory: 1.0, disk: 1.0, network: 1.0,
                responseTime: 1.0, errors: 0.5, health: 1.0,
                load: 1.0, temp: 1.0, swap: 0.3, iops: 1.0,
                connections: 1.0, rps: 1.0, activeConn: 1.0,
                threads: 1.0, cache: 1.0, dbQuery: 1.0, ssl: 1.0,
                processes: 1.0, fd: 1.0, security: 0.5, logErrors: 0.5,
                memoryLeak: 0.2
            },
            peak_load: {
                cpu: 1.8, memory: 1.4, disk: 1.2, network: 2.0,
                responseTime: 2.5, errors: 2.0, health: 0.8,
                load: 2.2, temp: 1.5, swap: 1.8, iops: 2.0,
                connections: 2.5, rps: 2.0, activeConn: 2.2,
                threads: 1.9, cache: 0.9, dbQuery: 1.8, ssl: 1.5,
                processes: 1.3, fd: 1.7, security: 1.5, logErrors: 1.8,
                memoryLeak: 0.3
            },
            memory_leak: {
                cpu: 1.3, memory: 2.5, disk: 1.1, network: 1.2,
                responseTime: 2.0, errors: 3.0, health: 0.6,
                load: 1.4, temp: 1.2, swap: 3.0, iops: 1.1,
                connections: 1.3, rps: 0.8, activeConn: 1.4,
                threads: 1.2, cache: 0.7, dbQuery: 1.5, ssl: 1.1,
                processes: 1.6, fd: 1.8, security: 1.2, logErrors: 2.5,
                memoryLeak: 4.0
            },
            disk_explosion: {
                cpu: 1.4, memory: 1.2, disk: 3.0, network: 1.3,
                responseTime: 3.0, errors: 2.5, health: 0.5,
                load: 1.6, temp: 1.3, swap: 1.5, iops: 4.0,
                connections: 1.1, rps: 0.6, activeConn: 1.2,
                threads: 1.3, cache: 0.8, dbQuery: 2.2, ssl: 1.2,
                processes: 1.4, fd: 1.9, security: 1.3, logErrors: 2.0,
                memoryLeak: 0.4
            },
            network_congestion: {
                cpu: 1.1, memory: 1.1, disk: 1.0, network: 3.5,
                responseTime: 4.0, errors: 2.8, health: 0.4,
                load: 1.2, temp: 1.1, swap: 1.0, iops: 1.1,
                connections: 3.0, rps: 0.4, activeConn: 3.5,
                threads: 1.1, cache: 0.6, dbQuery: 1.8, ssl: 2.5,
                processes: 1.0, fd: 1.5, security: 1.8, logErrors: 2.2,
                memoryLeak: 0.2
            },
            service_failure: {
                cpu: 0.3, memory: 0.8, disk: 1.0, network: 0.5,
                responseTime: 10.0, errors: 8.0, health: 0.1,
                load: 0.5, temp: 0.9, swap: 0.5, iops: 0.3,
                connections: 0.2, rps: 0.1, activeConn: 0.3,
                threads: 0.4, cache: 0.2, dbQuery: 0.1, ssl: 0.1,
                processes: 0.6, fd: 0.4, security: 3.0, logErrors: 5.0,
                memoryLeak: 0.1
            }
        };

        return multipliers[scenarioName] || multipliers.normal;
    }

    // 🎲 메트릭 값 생성
    generateMetric(min, max, multiplier = 1.0) {
        const baseValue = min + Math.random() * (max - min);
        const adjustedValue = baseValue * multiplier;
        return Math.max(min, Math.min(max, adjustedValue));
    }

    // 📈 24시간 히스토리 관리
    updateHistory(serverId, metrics) {
        if (!this.history.has(serverId)) {
            this.history.set(serverId, []);
        }

        const serverHistory = this.history.get(serverId);
        serverHistory.push(metrics);

        // 24시간 (144개 데이터포인트, 10분 간격) 유지
        if (serverHistory.length > 144) {
            serverHistory.shift();
        }

        this.history.set(serverId, serverHistory);
    }

    // 🎯 액션별 응답 처리
    handleAction(action, serverId = null) {
        const timestamp = new Date().toISOString();

        switch (action) {
            case 'current':
                return this.getCurrentMetrics();

            case 'server':
                if (!serverId) {
                    throw new Error('serverId required for server action');
                }
                return this.getServerMetrics(serverId);

            case 'dashboard':
                return this.getDashboardSummary();

            case 'scenarios':
                return this.getActiveScenarios();

            case 'thresholds':
                return this.getThresholds();

            case 'status':
                return this.getGeneratorStatus();

            default:
                throw new Error(`Unknown action: ${action}`);
        }
    }

    // 📊 현재 모든 서버 메트릭
    getCurrentMetrics() {
        const metrics = [];

        for (const server of this.servers) {
            const serverMetrics = this.generateMetrics(server.id);
            this.updateHistory(server.id, serverMetrics);
            metrics.push(serverMetrics);
        }

        return {
            timestamp: new Date().toISOString(),
            totalServers: this.servers.length,
            metrics
        };
    }

    // 🔍 특정 서버 메트릭 및 히스토리
    getServerMetrics(serverId) {
        const server = this.servers.find(s => s.id === serverId);
        if (!server) {
            throw new Error(`Server not found: ${serverId}`);
        }

        const currentMetrics = this.generateMetrics(serverId);
        this.updateHistory(serverId, currentMetrics);

        return {
            server,
            current: currentMetrics,
            history: this.history.get(serverId) || [],
            thresholds: this.thresholds[server.type] || {}
        };
    }

    // 📋 대시보드 요약
    getDashboardSummary() {
        const metrics = this.getCurrentMetrics();

        let totalCpu = 0, totalMemory = 0, totalDisk = 0;
        let healthyServers = 0, warningServers = 0, criticalServers = 0;

        for (const metric of metrics.metrics) {
            totalCpu += metric.cpuUsage;
            totalMemory += metric.memoryUsage;
            totalDisk += metric.diskUsage;

            if (metric.healthScore > 80) healthyServers++;
            else if (metric.healthScore > 60) warningServers++;
            else criticalServers++;
        }

        const serverCount = metrics.metrics.length;

        return {
            timestamp: metrics.timestamp,
            summary: {
                totalServers: serverCount,
                healthyServers,
                warningServers,
                criticalServers,
                avgCpuUsage: totalCpu / serverCount,
                avgMemoryUsage: totalMemory / serverCount,
                avgDiskUsage: totalDisk / serverCount
            },
            topMetrics: metrics.metrics.slice(0, 5)
        };
    }

    // 🎪 활성 시나리오들
    getActiveScenarios() {
        const scenarios = new Map();

        for (const server of this.servers) {
            const scenario = this.generateScenario(server.id);
            if (!scenarios.has(scenario.name)) {
                scenarios.set(scenario.name, {
                    name: scenario.name,
                    description: scenario.description,
                    servers: []
                });
            }
            scenarios.get(scenario.name).servers.push(server.id);
        }

        return {
            timestamp: new Date().toISOString(),
            scenarios: Array.from(scenarios.values())
        };
    }

    // 🚨 임계값 설정
    getThresholds() {
        return {
            timestamp: new Date().toISOString(),
            thresholds: this.thresholds
        };
    }

    // 📊 생성기 상태
    getGeneratorStatus() {
        return {
            timestamp: new Date().toISOString(),
            enabled: this.enabled,
            servers: this.servers.length,
            historySize: Array.from(this.history.values()).reduce((sum, h) => sum + h.length, 0),
            lastUpdate: new Date(this.lastUpdate).toISOString(),
            platform: 'gcp-cloud-functions',
            version: '1.0.0'
        };
    }
}

// 🌐 전역 인스턴스 (콜드 스타트 최적화)
let metricsGenerator = null;

// 🚀 메인 Cloud Function
export const enterpriseMetrics = onRequest({ timeout: 540, memory: '1GB' }, async (req, res) => {
    // CORS 헤더 설정
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // OPTIONS 요청 처리
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    try {
        // 🔄 지연 초기화 (콜드 스타트 최적화)
        if (!metricsGenerator) {
            metricsGenerator = new EnterpriseMetricsGenerator();
            console.log('🏗️ 엔터프라이즈 메트릭 생성기 초기화 완료');
        }

        // 🎯 액션 파라미터 추출
        const action = req.query.action || 'current';
        const serverId = req.query.serverId || null;

        // 📊 액션 처리
        const result = metricsGenerator.handleAction(action, serverId);

        // 🎉 성공 응답
        res.status(200).json({
            success: true,
            data: result,
            meta: {
                action,
                serverId,
                timestamp: new Date().toISOString(),
                platform: 'gcp-cloud-functions',
                executionTime: Date.now() - req.get('X-Request-Start') || 0
            }
        });

    } catch (error) {
        console.error('❌ 엔터프라이즈 메트릭 오류:', error);

        // 🚨 에러 응답
        res.status(500).json({
            success: false,
            error: error.message,
            meta: {
                timestamp: new Date().toISOString(),
                platform: 'gcp-cloud-functions'
            }
        });
    }
}); 