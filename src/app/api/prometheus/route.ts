/**
 * 📊 Prometheus 호환 API 엔드포인트
 * 
 * OpenManager Vibe v5 - Prometheus 메트릭 및 쿼리 API
 * - PromQL 쿼리 지원
 * - 메트릭 수집 및 포맷팅
 * - 서버 상태 모니터링
 */

import { NextRequest, NextResponse } from 'next/server';
import { unifiedMetricsManager } from '@/services/UnifiedMetricsManager';

// 안전한 import 처리
let OptimizedDataGenerator: any = null;
try {
    const optimizedModule = require('@/services/OptimizedDataGenerator');
    OptimizedDataGenerator = optimizedModule.OptimizedDataGenerator;
} catch (error) {
    console.warn('OptimizedDataGenerator import 실패:', error.message);
}

/**
 * 📊 Prometheus 메트릭 조회 (GET)
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const action = searchParams.get('action') || 'metrics';
        const format = searchParams.get('format') || 'prometheus';

        console.log(`📊 Prometheus API 요청: action=${action}, format=${format}`);

        switch (action) {
            case 'metrics':
                return await getPrometheusMetrics(format);

            case 'targets':
                return await getPrometheusTargets();

            case 'config':
                return await getPrometheusConfig();

            case 'status':
                return await getPrometheusStatus();

            default:
                return NextResponse.json({
                    success: true,
                    message: 'Prometheus Compatible API',
                    availableActions: ['metrics', 'targets', 'config', 'status'],
                    availableFormats: ['prometheus', 'json', 'openmetrics'],
                    timestamp: new Date().toISOString(),
                });
        }
    } catch (error) {
        console.error('❌ Prometheus API 오류:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString(),
        }, { status: 500 });
    }
}

/**
 * 🔍 PromQL 쿼리 실행 (POST)
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { query, time, timeout, step } = body;

        console.log(`🔍 PromQL 쿼리 실행: ${query}`);

        if (!query) {
            return NextResponse.json({
                status: 'error',
                error: 'Query parameter is required',
                errorType: 'bad_data',
            }, { status: 400 });
        }

        // PromQL 쿼리 실행
        const result = await executePromQLQuery(query, time, step);

        return NextResponse.json({
            status: 'success',
            data: {
                resultType: 'vector',
                result: result,
            },
            query: query,
            timestamp: new Date().toISOString(),
        });

    } catch (error) {
        console.error('❌ PromQL 쿼리 실행 실패:', error);
        return NextResponse.json({
            status: 'error',
            error: 'Query execution failed',
            errorType: 'execution',
            details: error instanceof Error ? error.message : String(error),
        }, { status: 400 });
    }
}

/**
 * 📊 Prometheus 메트릭 수집
 */
async function getPrometheusMetrics(format: string) {
    try {
        // 통합 메트릭 관리자에서 서버 데이터 조회
        const managerStatus = unifiedMetricsManager.getStatus();
        if (!managerStatus.isRunning) {
            unifiedMetricsManager.start();
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        const servers = unifiedMetricsManager.getServers();
        const timestamp = Math.floor(Date.now() / 1000);

        if (format === 'prometheus') {
            // Prometheus 텍스트 포맷
            const metrics = formatPrometheusMetrics(servers, timestamp);
            return new NextResponse(metrics, {
                headers: {
                    'Content-Type': 'text/plain; version=0.0.4; charset=utf-8',
                },
            });
        } else {
            // JSON 포맷
            const metrics = formatJsonMetrics(servers, timestamp);
            return NextResponse.json({
                success: true,
                data: metrics,
                timestamp: new Date().toISOString(),
                format: format,
            });
        }
    } catch (error) {
        console.error('❌ Prometheus 메트릭 수집 실패:', error);
        return NextResponse.json({
            success: false,
            error: 'Failed to collect metrics',
            details: error instanceof Error ? error.message : String(error),
        }, { status: 500 });
    }
}

/**
 * 🎯 Prometheus 타겟 정보
 */
async function getPrometheusTargets() {
    const servers = unifiedMetricsManager.getServers();

    const targets = servers.map((server: any) => ({
        targets: [`${server.hostname}:${server.port || 9100}`],
        labels: {
            job: server.role || 'openmanager',
            instance: server.id,
            environment: server.environment || 'production',
            region: server.region || 'us-east-1',
            __address__: `${server.hostname}:${server.port || 9100}`,
        },
    }));

    return NextResponse.json({
        success: true,
        data: {
            activeTargets: targets,
            droppedTargets: [],
            total: targets.length,
        },
        timestamp: new Date().toISOString(),
    });
}

/**
 * ⚙️ Prometheus 설정 정보
 */
async function getPrometheusConfig() {
    return NextResponse.json({
        success: true,
        data: {
            yaml: `
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'openmanager-vibe'
    static_configs:
      - targets: ['localhost:3000']
    scrape_interval: 5s
    metrics_path: '/api/prometheus'
    params:
      action: ['metrics']
      format: ['prometheus']

  - job_name: 'node-exporter'
    static_configs:
      - targets: ['localhost:9100']
    scrape_interval: 15s
      `,
            version: '2.40.0',
            configFile: '/etc/prometheus/prometheus.yml',
        },
        timestamp: new Date().toISOString(),
    });
}

/**
 * 📈 Prometheus 상태 정보
 */
async function getPrometheusStatus() {
    const servers = unifiedMetricsManager.getServers();
    const managerStatus = unifiedMetricsManager.getStatus();

    return NextResponse.json({
        success: true,
        data: {
            status: 'ready',
            version: '2.40.0 (OpenManager Vibe v5 Compatible)',
            uptime: Date.now() - (managerStatus.startTime || Date.now()),
            config: {
                configFile: '/etc/prometheus/prometheus.yml',
                configOK: true,
            },
            runtimeInfo: {
                startTime: new Date(managerStatus.startTime || Date.now()).toISOString(),
                CWD: '/app',
                reloadConfigSuccess: true,
                lastConfigTime: new Date().toISOString(),
                corruptionCount: 0,
                goroutines: 42,
                GOMAXPROCS: 4,
            },
            build: {
                version: '2.40.0',
                revision: 'openmanager-vibe-v5',
                branch: 'main',
                buildUser: 'openmanager@vibe',
                buildDate: '2024-12-11T10:00:00Z',
                goVersion: 'go1.19.4',
            },
            activeAlertmanagers: [],
            droppedAlertmanagers: [],
            targets: {
                active: servers.length,
                dropped: 0,
                total: servers.length,
            },
        },
        timestamp: new Date().toISOString(),
    });
}

/**
 * 🔍 PromQL 쿼리 실행 엔진
 */
async function executePromQLQuery(query: string, time?: number, step?: number): Promise<any[]> {
    const servers = unifiedMetricsManager.getServers();
    const timestamp = time || Math.floor(Date.now() / 1000);

    // 간단한 PromQL 쿼리 파싱 및 실행
    if (query.includes('cpu_usage') || query.includes('node_cpu_usage_percent')) {
        return servers.map((server: any) => ({
            metric: {
                __name__: 'node_cpu_usage_percent',
                instance: server.id,
                job: server.role || 'openmanager',
                environment: server.environment || 'production',
                hostname: server.hostname,
            },
            value: [timestamp, (server.cpu_usage || server.node_cpu_usage_percent || 0).toString()],
        }));
    }

    if (query.includes('memory_usage') || query.includes('node_memory_usage_percent')) {
        return servers.map((server: any) => ({
            metric: {
                __name__: 'node_memory_usage_percent',
                instance: server.id,
                job: server.role || 'openmanager',
                environment: server.environment || 'production',
                hostname: server.hostname,
            },
            value: [timestamp, (server.memory_usage || server.node_memory_usage_percent || 0).toString()],
        }));
    }

    if (query.includes('disk_usage') || query.includes('node_disk_usage_percent')) {
        return servers.map((server: any) => ({
            metric: {
                __name__: 'node_disk_usage_percent',
                instance: server.id,
                job: server.role || 'openmanager',
                environment: server.environment || 'production',
                hostname: server.hostname,
            },
            value: [timestamp, (server.disk_usage || server.node_disk_usage_percent || 0).toString()],
        }));
    }

    if (query.includes('network_io') || query.includes('node_network_receive_bytes')) {
        return servers.map((server: any) => ({
            metric: {
                __name__: 'node_network_receive_bytes_total',
                instance: server.id,
                job: server.role || 'openmanager',
                environment: server.environment || 'production',
                hostname: server.hostname,
                device: 'eth0',
            },
            value: [timestamp, (server.network_io?.rx_bytes || Math.floor(Math.random() * 1000000)).toString()],
        }));
    }

    if (query.includes('up') || query.includes('server_status')) {
        return servers.map((server: any) => {
            const isUp = server.status === 'healthy' || server.status === 'running' ? 1 : 0;
            return {
                metric: {
                    __name__: 'up',
                    instance: server.id,
                    job: server.role || 'openmanager',
                    environment: server.environment || 'production',
                    hostname: server.hostname,
                },
                value: [timestamp, isUp.toString()],
            };
        });
    }

    // 기본적으로 빈 결과 반환
    return [];
}

/**
 * 📊 Prometheus 텍스트 포맷 변환
 */
function formatPrometheusMetrics(servers: any[], timestamp: number): string {
    let output = '';

    // HELP 및 TYPE 정의
    output += '# HELP node_cpu_usage_percent CPU usage percentage\n';
    output += '# TYPE node_cpu_usage_percent gauge\n';

    servers.forEach((server: any) => {
        const cpuUsage = server.cpu_usage || server.node_cpu_usage_percent || 0;
        output += `node_cpu_usage_percent{instance="${server.id}",job="${server.role || 'openmanager'}",hostname="${server.hostname}",environment="${server.environment || 'production'}"} ${cpuUsage} ${timestamp * 1000}\n`;
    });

    output += '\n# HELP node_memory_usage_percent Memory usage percentage\n';
    output += '# TYPE node_memory_usage_percent gauge\n';

    servers.forEach((server: any) => {
        const memoryUsage = server.memory_usage || server.node_memory_usage_percent || 0;
        output += `node_memory_usage_percent{instance="${server.id}",job="${server.role || 'openmanager'}",hostname="${server.hostname}",environment="${server.environment || 'production'}"} ${memoryUsage} ${timestamp * 1000}\n`;
    });

    output += '\n# HELP up Server up status\n';
    output += '# TYPE up gauge\n';

    servers.forEach((server: any) => {
        const isUp = server.status === 'healthy' || server.status === 'running' ? 1 : 0;
        output += `up{instance="${server.id}",job="${server.role || 'openmanager'}",hostname="${server.hostname}",environment="${server.environment || 'production'}"} ${isUp} ${timestamp * 1000}\n`;
    });

    return output;
}

/**
 * 📊 JSON 포맷 변환
 */
function formatJsonMetrics(servers: any[], timestamp: number) {
    return {
        metrics: [
            {
                name: 'node_cpu_usage_percent',
                help: 'CPU usage percentage',
                type: 'gauge',
                samples: servers.map((server: any) => ({
                    labels: {
                        instance: server.id,
                        job: server.role || 'openmanager',
                        hostname: server.hostname,
                        environment: server.environment || 'production',
                    },
                    value: server.cpu_usage || server.node_cpu_usage_percent || 0,
                    timestamp: timestamp * 1000,
                })),
            },
            {
                name: 'node_memory_usage_percent',
                help: 'Memory usage percentage',
                type: 'gauge',
                samples: servers.map((server: any) => ({
                    labels: {
                        instance: server.id,
                        job: server.role || 'openmanager',
                        hostname: server.hostname,
                        environment: server.environment || 'production',
                    },
                    value: server.memory_usage || server.node_memory_usage_percent || 0,
                    timestamp: timestamp * 1000,
                })),
            },
            {
                name: 'up',
                help: 'Server up status',
                type: 'gauge',
                samples: servers.map((server: any) => ({
                    labels: {
                        instance: server.id,
                        job: server.role || 'openmanager',
                        hostname: server.hostname,
                        environment: server.environment || 'production',
                    },
                    value: server.status === 'healthy' || server.status === 'running' ? 1 : 0,
                    timestamp: timestamp * 1000,
                })),
            },
        ],
        timestamp: timestamp,
        total_samples: servers.length * 3,
    };
} 