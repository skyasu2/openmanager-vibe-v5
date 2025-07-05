/**
 * 🤖 GCP AI 데이터 어댑터
 * 
 * GCP 실시간 서버 데이터를 AI 엔진이 사용할 수 있는 형태로 변환
 * 기존 AIAnalysisDataset 인터페이스와 완벽한 호환성 보장
 */

import { AIAnalysisDataset, ServerMetadata, TimeSeriesMetrics } from '@/types/ai-agent-input-schema';
import { GCPDataResponse } from '@/types/gcp-data-generator';

interface GCPAIAdapterOptions {
    sessionId?: string;
    enableAnomalyDetection?: boolean;
    includeHistoricalData?: boolean;
    dataRetentionHours?: number;
    aiOptimization?: boolean;
}

interface ProcessedAIData {
    dataset: AIAnalysisDataset;
    metadata: {
        source: 'GCP' | 'Local' | 'Hybrid';
        processingTime: number;
        dataQuality: number;
        confidence: number;
        totalMetrics: number;
        anomaliesDetected: number;
    };
    insights: {
        summary: string;
        recommendations: string[];
        criticalAlerts: string[];
        patterns: string[];
    };
}

export class GCPAIDataAdapter {
    private cache: Map<string, any> = new Map();
    private lastUpdate: number = 0;
    private cacheTimeout: number = 30000; // 30초
    private sessionId: string | null = null;

    constructor(private options: GCPAIAdapterOptions = {}) {
        this.sessionId = options.sessionId || null;
    }

    /**
     * 🎯 GCP 데이터를 AI 분석용 데이터셋으로 변환 (메인 메서드)
     */
    async getAIAnalysisDataset(sessionId?: string): Promise<ProcessedAIData> {
        const startTime = Date.now();
        const targetSessionId = sessionId || this.sessionId;

        try {
            console.log('🤖 GCP → AI 데이터 변환 시작...');

            // 1. GCP 데이터 조회
            const gcpData = await this.fetchGCPData(targetSessionId || undefined);

            if (!gcpData.success) {
                console.warn('⚠️ GCP 데이터 조회 실패, 로컬 데이터로 폴백');
                return await this.generateLocalFallbackData();
            }

            // 2. AI 분석용 데이터셋 변환
            const dataset = await this.transformToAIDataset(gcpData.data!);

            // 3. AI 최적화 처리
            if (this.options.aiOptimization) {
                await this.optimizeForAI(dataset);
            }

            // 4. 이상 탐지 (옵션)
            let anomaliesDetected = 0;
            if (this.options.enableAnomalyDetection) {
                anomaliesDetected = await this.detectAnomalies(dataset);
            }

            // 5. 인사이트 생성
            const insights = this.generateInsights(dataset);

            // 6. 데이터 품질 평가
            const dataQuality = this.assessDataQuality(dataset);

            const processingTime = Date.now() - startTime;

            const result: ProcessedAIData = {
                dataset,
                metadata: {
                    source: 'GCP',
                    processingTime,
                    dataQuality,
                    confidence: this.calculateConfidence(dataset),
                    totalMetrics: dataset.metrics.length,
                    anomaliesDetected
                },
                insights
            };

            console.log(`✅ GCP → AI 변환 완료: ${dataset.metrics.length}개 메트릭, ${processingTime}ms`);
            return result;

        } catch (error) {
            console.error('❌ GCP → AI 변환 실패:', error);

            // 폴백으로 로컬 데이터 사용
            console.log('🔄 로컬 데이터로 폴백...');
            return await this.generateLocalFallbackData();
        }
    }

    /**
     * 📊 GCP 데이터 조회
     */
    private async fetchGCPData(sessionId?: string): Promise<GCPDataResponse> {
        if (!sessionId) {
            throw new Error('GCP 세션 ID가 필요합니다');
        }

        const cacheKey = `gcp-data-${sessionId}`;
        const now = Date.now();

        // 캐시 확인
        if (this.cache.has(cacheKey) && (now - this.lastUpdate) < this.cacheTimeout) {
            console.log('📦 GCP 데이터 캐시 사용');
            return this.cache.get(cacheKey);
        }

        try {
            const response = await fetch(`/api/gcp/server-data?sessionId=${sessionId}&limit=50`);
            const data = await response.json();

            if (data.success) {
                this.cache.set(cacheKey, data);
                this.lastUpdate = now;
            }

            return data;
        } catch (error) {
            console.error('GCP 데이터 조회 실패:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'GCP 연결 실패'
            };
        }
    }

    /**
     * 🔄 GCP 데이터를 AIAnalysisDataset으로 변환
     */
    private async transformToAIDataset(gcpData: any): Promise<AIAnalysisDataset> {
        const metrics = gcpData.metrics as TimeSeriesMetrics[];
        const sessionInfo = gcpData.sessionInfo;

        // 서버 메타데이터 생성
        const servers = this.extractServerMetadata(metrics);

        // 시간 범위 계산
        const timestamps = metrics.map(m => m.timestamp.getTime());
        const timeRange = {
            start: new Date(Math.min(...timestamps)),
            end: new Date(Math.max(...timestamps))
        };

        // 로그 및 트레이스 데이터 생성 (GCP 메트릭 기반)
        const logs = this.generateLogsFromMetrics(metrics);
        const traces = this.generateTracesFromMetrics(metrics);

        // 패턴 분석
        const patterns = await this.analyzePatterns(metrics);

        const dataset: AIAnalysisDataset = {
            metadata: {
                generationTime: new Date(),
                timeRange,
                serverCount: servers.length,
                dataPoints: metrics.length,
                version: '2.0-gcp'
            },
            servers,
            metrics,
            logs,
            traces,
            patterns
        };

        return dataset;
    }

    /**
     * 🖥️ 메트릭에서 서버 메타데이터 추출
     */
    private extractServerMetadata(metrics: TimeSeriesMetrics[]): ServerMetadata[] {
        const serverMap = new Map<string, ServerMetadata>();

        metrics.forEach(metric => {
            if (!serverMap.has(metric.serverId)) {
                const server: ServerMetadata = {
                    id: metric.serverId,
                    name: this.getServerName(metric.serverId),
                    serverType: this.getServerType(metric.serverId),
                    location: {
                        region: 'local',
                        zone: 'local-a',
                        datacenter: 'Local',
                        cloud: 'On-Premise'
                    },
                    os: {
                        type: 'Linux',
                        distribution: 'Ubuntu',
                        version: '22.04',
                        architecture: 'x64'
                    },
                    usageProfile: {
                        type: 'Web',
                        tier: 'Production',
                        criticality: 'High',
                        scalingType: 'Auto'
                    },
                    resources: this.estimateServerResources(metric),
                    tags: {
                        environment: 'development',
                        type: 'fallback'
                    },
                    created: new Date(Date.now() - Math.random() * 86400000),
                    lastUpdate: metric.timestamp,
                    processes: []
                };
                serverMap.set(metric.serverId, server);
            }
        });

        return Array.from(serverMap.values());
    }

    /**
     * 📝 메트릭에서 로그 데이터 생성
     */
    private generateLogsFromMetrics(metrics: TimeSeriesMetrics[]): any[] {
        const logs: any[] = [];

        metrics.forEach(metric => {
            // 에러 로그 생성
            if (metric.application.requests.errors > 0) {
                logs.push({
                    timestamp: metric.timestamp,
                    serverId: metric.serverId,
                    level: 'ERROR',
                    message: `HTTP errors detected: ${metric.application.requests.errors} out of ${metric.application.requests.total} requests`,
                    source: 'application',
                    metadata: {
                        errorRate: metric.application.requests.errors / metric.application.requests.total,
                        latencyP99: metric.application.requests.latency.p99
                    }
                });
            }

            // 성능 경고 로그
            if (metric.system.cpu.usage > 80) {
                logs.push({
                    timestamp: metric.timestamp,
                    serverId: metric.serverId,
                    level: 'WARN',
                    message: `High CPU usage detected: ${metric.system.cpu.usage.toFixed(1)}%`,
                    source: 'system',
                    metadata: {
                        cpuUsage: metric.system.cpu.usage,
                        load1: metric.system.cpu.load1
                    }
                });
            }

            // 메모리 경고 로그
            const memoryUsage = metric.system.memory.used / (metric.system.memory.used + metric.system.memory.available) * 100;
            if (memoryUsage > 85) {
                logs.push({
                    timestamp: metric.timestamp,
                    serverId: metric.serverId,
                    level: 'WARN',
                    message: `High memory usage detected: ${memoryUsage.toFixed(1)}%`,
                    source: 'system',
                    metadata: {
                        memoryUsage,
                        availableMemory: metric.system.memory.available
                    }
                });
            }
        });

        return logs;
    }

    /**
     * 🔗 메트릭에서 트레이스 데이터 생성
     */
    private generateTracesFromMetrics(metrics: TimeSeriesMetrics[]): any[] {
        const traces: any[] = [];

        metrics.forEach(metric => {
            // 요청 트레이스 생성
            if (metric.application.requests.total > 0) {
                traces.push({
                    traceId: `trace-${metric.serverId}-${metric.timestamp.getTime()}`,
                    spanId: `span-${metric.serverId}`,
                    timestamp: metric.timestamp,
                    serverId: metric.serverId,
                    operation: 'http_request',
                    duration: metric.application.requests.latency.p50,
                    status: metric.application.requests.errors > 0 ? 'error' : 'success',
                    metadata: {
                        totalRequests: metric.application.requests.total,
                        successRate: metric.application.requests.success / metric.application.requests.total,
                        latency: metric.application.requests.latency
                    }
                });
            }

            // 데이터베이스 트레이스 생성
            if (metric.application.database.queries.total > 0) {
                traces.push({
                    traceId: `db-trace-${metric.serverId}-${metric.timestamp.getTime()}`,
                    spanId: `db-span-${metric.serverId}`,
                    timestamp: metric.timestamp,
                    serverId: metric.serverId,
                    operation: 'database_query',
                    duration: metric.application.database.queries.slow > 0 ? 1000 : 100,
                    status: metric.application.database.deadlocks > 0 ? 'error' : 'success',
                    metadata: {
                        totalQueries: metric.application.database.queries.total,
                        slowQueries: metric.application.database.queries.slow,
                        connections: metric.application.database.connections
                    }
                });
            }
        });

        return traces;
    }

    /**
     * 📈 패턴 분석
     */
    private async analyzePatterns(metrics: TimeSeriesMetrics[]): Promise<any> {
        const anomalies: any[] = [];
        const correlations: any[] = [];
        const trends: any[] = [];

        // 이상 패턴 탐지
        metrics.forEach(metric => {
            const cpuUsage = metric.system.cpu.usage;
            const memoryUsage = metric.system.memory.used / (metric.system.memory.used + metric.system.memory.available) * 100;
            const errorRate = metric.application.requests.total > 0
                ? metric.application.requests.errors / metric.application.requests.total
                : 0;

            // CPU 이상
            if (cpuUsage > 90) {
                anomalies.push({
                    type: 'cpu_spike',
                    serverId: metric.serverId,
                    timestamp: metric.timestamp,
                    severity: 'critical',
                    value: cpuUsage,
                    threshold: 90,
                    confidence: 0.95
                });
            }

            // 메모리 이상
            if (memoryUsage > 95) {
                anomalies.push({
                    type: 'memory_exhaustion',
                    serverId: metric.serverId,
                    timestamp: metric.timestamp,
                    severity: 'critical',
                    value: memoryUsage,
                    threshold: 95,
                    confidence: 0.9
                });
            }

            // 에러율 이상
            if (errorRate > 0.05) {
                anomalies.push({
                    type: 'high_error_rate',
                    serverId: metric.serverId,
                    timestamp: metric.timestamp,
                    severity: errorRate > 0.1 ? 'critical' : 'warning',
                    value: errorRate,
                    threshold: 0.05,
                    confidence: 0.85
                });
            }
        });

        // 상관관계 분석 (간단한 예시)
        const serverGroups = this.groupMetricsByServer(metrics);
        Object.entries(serverGroups).forEach(([serverId, serverMetrics]) => {
            if (serverMetrics.length > 1) {
                const avgCpu = serverMetrics.reduce((sum, m) => sum + m.system.cpu.usage, 0) / serverMetrics.length;
                const avgErrors = serverMetrics.reduce((sum, m) => sum + m.application.requests.errors, 0) / serverMetrics.length;

                if (avgCpu > 70 && avgErrors > 10) {
                    correlations.push({
                        type: 'cpu_error_correlation',
                        serverId,
                        description: 'High CPU usage correlates with increased errors',
                        strength: 0.8,
                        confidence: 0.75
                    });
                }
            }
        });

        // 트렌드 분석
        Object.entries(serverGroups).forEach(([serverId, serverMetrics]) => {
            if (serverMetrics.length >= 3) {
                const sortedMetrics = serverMetrics.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
                const cpuTrend = this.calculateTrend(sortedMetrics.map(m => m.system.cpu.usage));

                if (Math.abs(cpuTrend) > 0.1) {
                    trends.push({
                        type: 'cpu_usage_trend',
                        serverId,
                        direction: cpuTrend > 0 ? 'increasing' : 'decreasing',
                        slope: cpuTrend,
                        confidence: 0.7
                    });
                }
            }
        });

        return {
            anomalies,
            correlations,
            trends
        };
    }

    /**
     * 🧠 AI 최적화 처리
     */
    private async optimizeForAI(dataset: AIAnalysisDataset): Promise<void> {
        // 메트릭 정규화 (0-1 스케일)
        dataset.metrics.forEach(metric => {
            (metric as any).normalized = {
                cpu: metric.system.cpu.usage / 100,
                memory: metric.system.memory.used / (metric.system.memory.used + metric.system.memory.available),
                disk: metric.system.disk.utilization / 100,
                errorRate: metric.application.requests.total > 0
                    ? metric.application.requests.errors / metric.application.requests.total
                    : 0
            };
        });

        // AI 컨텍스트 정보 추가
        if (this.options.aiOptimization) {
            (dataset.metadata as any).aiContext = {
                optimization: true,
                modelVersion: '2.0',
                features: ['anomaly_detection', 'pattern_analysis'],
                confidence: this.calculateConfidence(dataset)
            };
        }
    }

    /**
     * 💡 인사이트 생성
     */
    private generateInsights(dataset: AIAnalysisDataset): any {
        const metrics = dataset.metrics;
        const serverCount = dataset.servers.length;

        // 전체 시스템 상태 분석
        const avgCpu = metrics.reduce((sum, m) => sum + m.system.cpu.usage, 0) / metrics.length;
        const avgMemory = metrics.reduce((sum, m) => {
            return sum + (m.system.memory.used / (m.system.memory.used + m.system.memory.available) * 100);
        }, 0) / metrics.length;

        const totalErrors = metrics.reduce((sum, m) => sum + m.application.requests.errors, 0);
        const totalRequests = metrics.reduce((sum, m) => sum + m.application.requests.total, 0);
        const errorRate = totalRequests > 0 ? totalErrors / totalRequests : 0;

        // 심각도 분류
        const criticalServers = metrics.filter(m =>
            m.system.cpu.usage > 90 ||
            (m.system.memory.used / (m.system.memory.used + m.system.memory.available)) > 0.95
        ).length;

        const warningServers = metrics.filter(m =>
            m.system.cpu.usage > 80 ||
            (m.system.memory.used / (m.system.memory.used + m.system.memory.available)) > 0.85
        ).length;

        return {
            summary: `${serverCount}개 서버 모니터링 중. 평균 CPU: ${avgCpu.toFixed(1)}%, 메모리: ${avgMemory.toFixed(1)}%, 전체 에러율: ${(errorRate * 100).toFixed(2)}%`,

            recommendations: [
                avgCpu > 80 ? '🚨 CPU 사용률이 높습니다. 스케일링을 고려하세요.' : null,
                avgMemory > 85 ? '🚨 메모리 사용률이 높습니다. 메모리 최적화가 필요합니다.' : null,
                errorRate > 0.05 ? '🚨 에러율이 높습니다. 애플리케이션 로그를 확인하세요.' : null,
                criticalServers > 0 ? `🔥 ${criticalServers}개 서버가 임계 상태입니다.` : null,
                '📊 GCP 실시간 데이터를 기반으로 한 분석입니다.'
            ].filter(Boolean),

            criticalAlerts: [
                criticalServers > 0 ? `${criticalServers}개 서버 임계 상태` : null,
                errorRate > 0.1 ? '높은 에러율 감지' : null,
                dataset.patterns?.anomalies && dataset.patterns.anomalies.length > 5 ? '다수 이상 패턴 감지' : null ||
                    '정상 운영 상태'
            ].filter(Boolean),

            patterns: [
                `${dataset.patterns?.anomalies?.length || 0}개 이상 패턴 감지`,
                `${dataset.patterns?.correlations?.length || 0}개 상관관계 발견`,
                `${dataset.patterns?.trends?.length || 0}개 트렌드 분석`
            ]
        };
    }

    // ===== 헬퍼 메서드들 =====

    private async generateLocalFallbackData(): Promise<ProcessedAIData> {
        console.log('🔄 로컬 폴백 데이터 생성...');

        // 기본 폴백 데이터셋 생성
        const fallbackDataset: AIAnalysisDataset = {
            metadata: {
                generationTime: new Date(),
                timeRange: {
                    start: new Date(Date.now() - 3600000),
                    end: new Date()
                },
                serverCount: 3,
                dataPoints: 30,
                version: '2.0-fallback'
            },
            servers: [
                {
                    id: 'fallback-web-01',
                    name: 'Fallback Web Server',
                    serverType: 'nginx',
                    location: {
                        region: 'local',
                        zone: 'local-a',
                        datacenter: 'Local',
                        cloud: 'On-Premise'
                    },
                    os: {
                        type: 'Linux',
                        distribution: 'Ubuntu',
                        version: '22.04',
                        architecture: 'x64'
                    },
                    usageProfile: {
                        type: 'Web',
                        tier: 'Production',
                        criticality: 'High',
                        scalingType: 'Auto'
                    },
                    resources: this.estimateServerResources({
                        system: {
                            cpu: {
                                usage: 80,
                                load1: 0.5
                            },
                            memory: {
                                used: 4294967296,
                                available: 4294967296
                            },
                            disk: {
                                utilization: 0.5
                            }
                        },
                        application: {
                            requests: {
                                errors: 0,
                                total: 100,
                                success: 100
                            },
                            database: {
                                queries: {
                                    total: 0,
                                    slow: 0,
                                    deadlocks: 0
                                },
                                connections: 0
                            }
                        }
                    }),
                    tags: {
                        environment: 'development',
                        type: 'fallback'
                    },
                    created: new Date(Date.now() - Math.random() * 86400000),
                    lastUpdate: new Date(),
                    processes: []
                }
            ],
            metrics: [],
            logs: [],
            traces: [],
            patterns: {
                anomalies: [],
                correlations: [],
                trends: []
            }
        };

        return {
            dataset: fallbackDataset,
            metadata: {
                source: 'Local',
                processingTime: 10,
                dataQuality: 0.5,
                confidence: 0.3,
                totalMetrics: 0,
                anomaliesDetected: 0
            },
            insights: {
                summary: '로컬 폴백 데이터를 사용 중입니다.',
                recommendations: ['GCP 연결을 확인하세요.'],
                criticalAlerts: ['GCP 데이터 소스 연결 실패'],
                patterns: ['폴백 모드 활성화']
            }
        };
    }

    private groupMetricsByServer(metrics: TimeSeriesMetrics[]): Record<string, TimeSeriesMetrics[]> {
        return metrics.reduce((groups, metric) => {
            if (!groups[metric.serverId]) {
                groups[metric.serverId] = [];
            }
            groups[metric.serverId].push(metric);
            return groups;
        }, {} as Record<string, TimeSeriesMetrics[]>);
    }

    private calculateTrend(values: number[]): number {
        if (values.length < 2) return 0;

        const n = values.length;
        const sumX = (n * (n - 1)) / 2;
        const sumY = values.reduce((sum, val) => sum + val, 0);
        const sumXY = values.reduce((sum, val, i) => sum + (i * val), 0);
        const sumXX = (n * (n - 1) * (2 * n - 1)) / 6;

        return (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    }

    private calculateConfidence(dataset: AIAnalysisDataset): number {
        const factors = [
            dataset.metrics.length > 10 ? 0.3 : 0.1,
            dataset.servers.length > 5 ? 0.2 : 0.1,
            dataset.patterns.anomalies.length > 0 ? 0.2 : 0.1,
            dataset.logs.length > 0 ? 0.15 : 0.05,
            dataset.traces.length > 0 ? 0.15 : 0.05
        ];

        return Math.min(1.0, factors.reduce((sum, factor) => sum + factor, 0));
    }

    private assessDataQuality(dataset: AIAnalysisDataset): number {
        let score = 0;

        // 메트릭 완성도
        if (dataset.metrics.length > 0) score += 0.3;

        // 서버 메타데이터 완성도
        if (dataset.servers.length > 0) score += 0.2;

        // 패턴 분석 완성도
        if (dataset.patterns.anomalies.length > 0) score += 0.2;

        // 로그 데이터 완성도
        if (dataset.logs.length > 0) score += 0.15;

        // 트레이스 데이터 완성도
        if (dataset.traces.length > 0) score += 0.15;

        return Math.min(1.0, score);
    }

    private generateAIRecommendations(dataset: AIAnalysisDataset): string[] {
        const recommendations = [];

        if (dataset.patterns.anomalies.length > 5) {
            recommendations.push('다수의 이상 패턴이 감지되었습니다. 시스템 점검이 필요합니다.');
        }

        if (dataset.metrics.length < 10) {
            recommendations.push('더 많은 데이터 포인트가 필요합니다. 모니터링 주기를 늘려보세요.');
        }

        recommendations.push('GCP 실시간 데이터를 활용한 AI 분석이 진행 중입니다.');

        return recommendations;
    }

    private async detectAnomalies(dataset: AIAnalysisDataset): Promise<number> {
        // 기존 패턴에서 이상 개수 반환
        return dataset.patterns.anomalies.length;
    }

    // 서버 정보 추출 헬퍼들
    private getServerName(serverId: string): string {
        const nameMap: Record<string, string> = {
            'srv-web-01': 'Web Server 01',
            'srv-web-02': 'Web Server 02',
            'srv-web-03': 'Load Balancer',
            'srv-app-01': 'API Server 01',
            'srv-app-02': 'API Server 02',
            'srv-db-01': 'Primary Database',
            'srv-db-02': 'Replica Database',
            'srv-cache-01': 'Redis Cache',
            'srv-search-01': 'Elasticsearch',
            'srv-queue-01': 'Message Queue'
        };
        return nameMap[serverId] || serverId;
    }

    private getServerType(serverId: string): 'Host' | 'Cloud' | 'Container' | 'VM' | 'Edge' {
        if (serverId.includes('web') || serverId.includes('app')) {
            return 'Container';
        } else if (serverId.includes('db') || serverId.includes('cache')) {
            return 'VM';
        } else if (serverId.includes('edge')) {
            return 'Edge';
        } else if (serverId.includes('cloud')) {
            return 'Cloud';
        }
        return 'Host';
    }

    private calculateServerStatus(metric: TimeSeriesMetrics): string {
        const cpuUsage = metric.system.cpu.usage;
        const memoryUsage = metric.system.memory.used / (metric.system.memory.used + metric.system.memory.available) * 100;

        if (cpuUsage > 90 || memoryUsage > 95) return 'critical';
        if (cpuUsage > 80 || memoryUsage > 85) return 'warning';
        return 'healthy';
    }

    private generateServerTags(serverId: string): string[] {
        const tags = ['gcp', 'production'];

        if (serverId.includes('web')) tags.push('web-server');
        if (serverId.includes('app')) tags.push('application');
        if (serverId.includes('db')) tags.push('database');
        if (serverId.includes('cache')) tags.push('cache');

        return tags;
    }

    private estimateServerResources(metric: TimeSeriesMetrics): any {
        return {
            cpu: this.estimateCpuSpecs(metric),
            memory: this.estimateMemorySpecs(metric),
            disk: this.estimateDiskSpecs(metric),
            network: this.estimateNetworkSpecs(metric)
        };
    }

    private estimateCpuSpecs(metric: TimeSeriesMetrics): any {
        return {
            cores: Math.ceil(metric.system.cpu.load1),
            model: 'GCP Virtual CPU'
        };
    }

    private estimateMemorySpecs(metric: TimeSeriesMetrics): any {
        return {
            total: metric.system.memory.used + metric.system.memory.available,
            type: 'Virtual'
        };
    }

    private estimateDiskSpecs(metric: TimeSeriesMetrics): any {
        return {
            total: 100 * 1024 * 1024 * 1024, // 100GB 가정
            type: 'SSD'
        };
    }

    private estimateNetworkSpecs(metric: TimeSeriesMetrics): any {
        return {
            bandwidth: 1000,
            type: '1G'
        };
    }

    // ===== 공개 유틸리티 메서드들 =====

    setSessionId(sessionId: string): void {
        this.sessionId = sessionId;
    }

    clearCache(): void {
        this.cache.clear();
        this.lastUpdate = 0;
    }

    getLastUpdate(): Date | null {
        return this.lastUpdate > 0 ? new Date(this.lastUpdate) : null;
    }
} 