/**
 * 🌐 GCP 서버 데이터 생성기 (Cloud Storage 최적화 버전)
 * 
 * 사용자 트리거 방식으로 20분간 실시간 서버 메트릭을 생성하는 시스템
 * Cloud Storage 업로드 한도(5K/월) 최적화: 배치 처리 + Firestore 중심
 */

import {
    BaselineDataset,
    CustomMetricDefinition,
    ExtendedTimeSeriesMetrics,
    GCPCloudStorageClient,
    GCPDataResponse,
    GCPFirestoreClient,
    GenerationLog,
    GenerationOptions,
    ScenarioContext,
    ServerData,
    TimeSeriesMetrics
} from '@/types/gcp-data-generator';

// 타입 정의
interface ProcessInfo {
    pid: number;
    name: string;
    cpuUsage: number;
    memoryUsage: number;
    status: 'running' | 'sleeping' | 'stopped';
    user: string;
    startTime: string;
}

interface AnomalyInfo {
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    confidence: number;
}

interface ServerData {
    id: string;
    name: string;
    type: string;
    environment: string;
    specs: any;
    baseline: any;
}

export class GCPServerDataGenerator {
    private firestore: GCPFirestoreClient;
    private cloudStorage: GCPCloudStorageClient;
    private baselineDataset: BaselineDataset | null = null;
    private customMetrics: Map<string, CustomMetricDefinition> = new Map();
    private cache: Map<string, any> = new Map();
    private isInitialized: boolean = false;

    // 🔄 배치 처리를 위한 버퍼
    private metricsBuffer: Map<string, TimeSeriesMetrics[]> = new Map();
    private batchSize: number = 40; // 20분 세션 = 40개 메트릭 (30초 간격)
    private lastCloudStorageSync: number = 0;
    private cloudStorageSyncInterval: number = 24 * 60 * 60 * 1000; // 24시간

    constructor(firestore: GCPFirestoreClient, cloudStorage: GCPCloudStorageClient) {
        this.firestore = firestore;
        this.cloudStorage = cloudStorage;
    }

    /**
     * 🏗️ 10개 서버 기본 데이터셋 생성 (초기 1회만)
     */
    async generateBaselineDataset(): Promise<BaselineDataset> {
        console.log('🏗️ GCP 기본 데이터셋 생성 시작...');

        const servers: ServerData[] = [
            // 웹서버 (3대)
            this.createServerData('srv-web-01', 'Web Server 01', 'nginx', 'production'),
            this.createServerData('srv-web-02', 'Web Server 02', 'apache', 'production'),
            this.createServerData('srv-web-03', 'Load Balancer', 'nginx', 'production'),

            // 애플리케이션 서버 (2대)
            this.createServerData('srv-app-01', 'API Server 01', 'nodejs', 'production'),
            this.createServerData('srv-app-02', 'API Server 02', 'springboot', 'production'),

            // 데이터베이스 (3대)
            this.createServerData('srv-db-01', 'Primary Database', 'postgresql', 'production'),
            this.createServerData('srv-db-02', 'Replica Database', 'postgresql', 'production'),
            this.createServerData('srv-cache-01', 'Redis Cache', 'redis', 'production'),

            // 인프라 서비스 (2대)
            this.createServerData('srv-search-01', 'Elasticsearch', 'elasticsearch', 'production'),
            this.createServerData('srv-queue-01', 'Message Queue', 'rabbitmq', 'production')
        ];

        const dataset: BaselineDataset = {
            dataset_version: '1.0',
            generated_at: new Date().toISOString(),
            servers,
            scenarios: {
                normal: { probability: 0.5, load_multiplier: 1.0 },
                warning: { probability: 0.3, load_multiplier: 1.4 },
                critical: { probability: 0.2, load_multiplier: 1.8 }
            }
        };

        // 🎯 Firestore에 기본 저장, Cloud Storage는 일일 백업용으로만 사용
        await this.saveBaselineToFirestore(dataset);
        this.baselineDataset = dataset;

        console.log(`✅ 기본 데이터셋 생성 완료: ${servers.length}개 서버`);
        return dataset;
    }

    /**
     * 🖥️ 서버 데이터 생성 헬퍼
     */
    private createServerData(id: string, name: string, type: string, environment: string): ServerData {
        const specs = this.getServerSpecs(type);
        const baselineMetrics = this.getBaselineMetrics(type);
        const historicalPatterns = this.generateHistoricalPatterns(type);

        return {
            id,
            name,
            type: type as any,
            specs,
            baseline_metrics: baselineMetrics,
            historical_patterns: historicalPatterns
        };
    }

    /**
     * 🔧 서버 타입별 스펙 정의
     */
    private getServerSpecs(type: string) {
        const specsMap: Record<string, any> = {
            nginx: {
                cpu: { cores: 4, model: 'Intel Xeon E5-2680', clockSpeed: 2.7 },
                memory: { total: 8 * 1024 * 1024 * 1024, type: 'DDR4' },
                disk: { total: 100 * 1024 * 1024 * 1024, type: 'SSD' },
                network: { bandwidth: 1000, type: '1G' }
            },
            apache: {
                cpu: { cores: 4, model: 'Intel Xeon E5-2680', clockSpeed: 2.7 },
                memory: { total: 8 * 1024 * 1024 * 1024, type: 'DDR4' },
                disk: { total: 100 * 1024 * 1024 * 1024, type: 'SSD' },
                network: { bandwidth: 1000, type: '1G' }
            },
            nodejs: {
                cpu: { cores: 8, model: 'Intel Xeon Gold 6154', clockSpeed: 3.0 },
                memory: { total: 16 * 1024 * 1024 * 1024, type: 'DDR4' },
                disk: { total: 200 * 1024 * 1024 * 1024, type: 'SSD' },
                network: { bandwidth: 1000, type: '1G' }
            },
            springboot: {
                cpu: { cores: 8, model: 'Intel Xeon Gold 6154', clockSpeed: 3.0 },
                memory: { total: 16 * 1024 * 1024 * 1024, type: 'DDR4' },
                disk: { total: 200 * 1024 * 1024 * 1024, type: 'SSD' },
                network: { bandwidth: 1000, type: '1G' }
            },
            postgresql: {
                cpu: { cores: 16, model: 'Intel Xeon Platinum 8175M', clockSpeed: 2.5 },
                memory: { total: 64 * 1024 * 1024 * 1024, type: 'DDR4' },
                disk: { total: 1024 * 1024 * 1024 * 1024, type: 'NVMe' },
                network: { bandwidth: 10000, type: '10G' }
            },
            redis: {
                cpu: { cores: 4, model: 'Intel Xeon E5-2680', clockSpeed: 2.7 },
                memory: { total: 32 * 1024 * 1024 * 1024, type: 'DDR4' },
                disk: { total: 100 * 1024 * 1024 * 1024, type: 'SSD' },
                network: { bandwidth: 1000, type: '1G' }
            },
            elasticsearch: {
                cpu: { cores: 8, model: 'Intel Xeon Gold 6154', clockSpeed: 3.0 },
                memory: { total: 32 * 1024 * 1024 * 1024, type: 'DDR4' },
                disk: { total: 500 * 1024 * 1024 * 1024, type: 'SSD' },
                network: { bandwidth: 1000, type: '1G' }
            },
            rabbitmq: {
                cpu: { cores: 4, model: 'Intel Xeon E5-2680', clockSpeed: 2.7 },
                memory: { total: 8 * 1024 * 1024 * 1024, type: 'DDR4' },
                disk: { total: 200 * 1024 * 1024 * 1024, type: 'SSD' },
                network: { bandwidth: 1000, type: '1G' }
            }
        };

        return specsMap[type] || specsMap.nginx;
    }

    /**
     * 📊 서버 타입별 기본 메트릭
     */
    private getBaselineMetrics(type: string) {
        const metricsMap: Record<string, any> = {
            nginx: {
                cpu: { usage: 25, load1: 0.8, load5: 0.6, load15: 0.4 },
                memory: { used: 2 * 1024 * 1024 * 1024, available: 6 * 1024 * 1024 * 1024 },
                disk: { utilization: 40, io: { read: 50, write: 25 } },
                network: { io: { rx: 1024 * 1024, tx: 512 * 1024 } }
            },
            apache: {
                cpu: { usage: 30, load1: 1.0, load5: 0.8, load15: 0.6 },
                memory: { used: 3 * 1024 * 1024 * 1024, available: 5 * 1024 * 1024 * 1024 },
                disk: { utilization: 45, io: { read: 60, write: 30 } },
                network: { io: { rx: 1536 * 1024, tx: 768 * 1024 } }
            },
            nodejs: {
                cpu: { usage: 40, load1: 2.0, load5: 1.5, load15: 1.0 },
                memory: { used: 8 * 1024 * 1024 * 1024, available: 8 * 1024 * 1024 * 1024 },
                disk: { utilization: 30, io: { read: 100, write: 80 } },
                network: { io: { rx: 2048 * 1024, tx: 1024 * 1024 } }
            },
            springboot: {
                cpu: { usage: 45, load1: 2.5, load5: 2.0, load15: 1.5 },
                memory: { used: 10 * 1024 * 1024 * 1024, available: 6 * 1024 * 1024 * 1024 },
                disk: { utilization: 35, io: { read: 120, write: 100 } },
                network: { io: { rx: 2048 * 1024, tx: 1024 * 1024 } }
            },
            postgresql: {
                cpu: { usage: 60, load1: 4.0, load5: 3.5, load15: 3.0 },
                memory: { used: 48 * 1024 * 1024 * 1024, available: 16 * 1024 * 1024 * 1024 },
                disk: { utilization: 70, io: { read: 500, write: 300 } },
                network: { io: { rx: 5120 * 1024, tx: 2560 * 1024 } }
            },
            redis: {
                cpu: { usage: 20, load1: 0.5, load5: 0.4, load15: 0.3 },
                memory: { used: 16 * 1024 * 1024 * 1024, available: 16 * 1024 * 1024 * 1024 },
                disk: { utilization: 15, io: { read: 200, write: 100 } },
                network: { io: { rx: 3072 * 1024, tx: 1536 * 1024 } }
            },
            elasticsearch: {
                cpu: { usage: 50, load1: 3.0, load5: 2.5, load15: 2.0 },
                memory: { used: 24 * 1024 * 1024 * 1024, available: 8 * 1024 * 1024 * 1024 },
                disk: { utilization: 60, io: { read: 300, write: 200 } },
                network: { io: { rx: 2048 * 1024, tx: 1024 * 1024 } }
            },
            rabbitmq: {
                cpu: { usage: 15, load1: 0.4, load5: 0.3, load15: 0.2 },
                memory: { used: 2 * 1024 * 1024 * 1024, available: 6 * 1024 * 1024 * 1024 },
                disk: { utilization: 25, io: { read: 80, write: 40 } },
                network: { io: { rx: 1024 * 1024, tx: 512 * 1024 } }
            }
        };

        return metricsMap[type] || metricsMap.nginx;
    }

    /**
     * 📈 히스토리컬 패턴 생성
     */
    private generateHistoricalPatterns(type: string) {
        // 24시간 사이클 (업무시간 높음, 새벽 낮음)
        const dailyCycle = [
            0.2, 0.15, 0.1, 0.1, 0.15, 0.3,  // 00-05시
            0.5, 0.7, 0.9, 1.0, 0.95, 0.9,   // 06-11시
            0.85, 0.9, 0.95, 1.0, 0.9, 0.8,  // 12-17시
            0.7, 0.6, 0.5, 0.4, 0.3, 0.25    // 18-23시
        ];

        // 주간 사이클 (평일 높음, 주말 낮음)
        const weeklyCycle = [1.0, 1.1, 1.2, 1.2, 1.1, 0.6, 0.5]; // 월-일

        // 서버 타입별 이상 패턴
        const anomalyPatterns = {
            cpu_spike: { probability: 0.05, multiplier: 2.0, duration: 300 },
            memory_leak: { probability: 0.02, multiplier: 1.5, duration: 1800 },
            disk_io_storm: { probability: 0.03, multiplier: 3.0, duration: 600 }
        };

        // 데이터베이스는 더 안정적
        if (type.includes('postgresql') || type.includes('mysql')) {
            anomalyPatterns.cpu_spike.probability = 0.02;
            anomalyPatterns.memory_leak.probability = 0.01;
        }

        // 웹서버는 트래픽 스파이크가 더 빈번
        if (type.includes('nginx') || type.includes('apache')) {
            anomalyPatterns.cpu_spike.probability = 0.08;
        }

        return {
            daily_cycle: dailyCycle,
            weekly_cycle: weeklyCycle,
            anomaly_patterns: anomalyPatterns
        };
    }

    /**
     * ⚡ 실시간 메트릭 생성 (핵심 기능)
     */
    async generateRealtimeMetrics(sessionId: string, options: GenerationOptions = {}): Promise<TimeSeriesMetrics[]> {
        const startTime = Date.now();

        // 20분 제한 체크
        const sessionInfo = await this.getSessionInfo(sessionId);
        if (!sessionInfo) {
            throw new Error('세션을 찾을 수 없습니다');
        }

        const elapsed = Date.now() - sessionInfo.startTime;
        if (elapsed > 20 * 60 * 1000) {
            console.log(`⏰ 세션 ${sessionId} 시간 만료 (${Math.round(elapsed / 1000)}초)`);
            await this.stopSession(sessionId);
            return [];
        }

        // 기본 데이터셋 로드
        if (!this.baselineDataset) {
            await this.loadBaselineDataset();
        }

        const timestamp = new Date();
        const metrics: TimeSeriesMetrics[] = [];

        // 시나리오 컨텍스트 생성 (심각 20%, 경고 30% 보장)
        const scenario = options.scenario || this.generateScenarioContext();
        const timeMultiplier = options.timeMultiplier || this.getTimeMultiplier(timestamp.getHours());

        console.log(`🎭 시나리오: ${scenario.type} (부하: ${scenario.loadMultiplier}x, 이상: ${scenario.anomalyChance})`);

        // 각 서버별 메트릭 생성
        for (const server of this.baselineDataset!.servers) {
            const serverMetric = await this.generateServerMetrics(
                server,
                scenario,
                timeMultiplier,
                timestamp,
                options.customMetrics?.[server.id]
            );
            metrics.push(serverMetric);
        }

        // 🔄 배치 처리로 저장 (Cloud Storage 최적화)
        await this.addMetricsToBatch(sessionId, metrics, scenario);

        // 로그 기록
        const generationLog: GenerationLog = {
            sessionId,
            timestamp: Date.now(),
            metricsCount: metrics.length,
            processingTime: Date.now() - startTime,
            scenario
        };
        await this.saveGenerationLog(generationLog);

        console.log(`✅ 메트릭 생성 완료: ${metrics.length}개 서버, ${Date.now() - startTime}ms`);
        return metrics;
    }

    /**
     * 🖥️ 개별 서버 메트릭 생성
     */
    private async generateServerMetrics(
        server: ServerData,
        scenario: ScenarioContext,
        timeMultiplier: number,
        timestamp: Date,
        customMetrics?: any
    ): Promise<TimeSeriesMetrics> {
        const baseline = server.baseline_metrics;
        const finalMultiplier = timeMultiplier * scenario.loadMultiplier;

        // 시스템 메트릭 생성
        const systemMetrics = this.generateSystemMetrics(server, baseline, finalMultiplier, scenario);

        // 애플리케이션 메트릭 생성
        const applicationMetrics = this.generateApplicationMetrics(server, baseline, finalMultiplier, scenario);

        // 인프라 메트릭 생성
        const infrastructureMetrics = this.generateInfrastructureMetrics(server, finalMultiplier, scenario);

        const metric: TimeSeriesMetrics = {
            timestamp,
            serverId: server.id,
            system: systemMetrics,
            application: applicationMetrics,
            infrastructure: infrastructureMetrics
        };

        // 커스텀 메트릭 추가
        if (customMetrics) {
            (metric as ExtendedTimeSeriesMetrics).custom = customMetrics;
        }

        // 이상 감지 추가
        if (scenario.type !== 'normal') {
            (metric as ExtendedTimeSeriesMetrics).anomalies = this.detectAnomalies(metric, scenario);
        }

        return metric;
    }

    /**
     * 🔧 시스템 메트릭 생성
     */
    private generateSystemMetrics(server: ServerData, baseline: any, multiplier: number, scenario: ScenarioContext) {
        let cpuUsage = baseline.cpu.usage * multiplier;
        let memoryUsed = baseline.memory.used * multiplier;

        // 시나리오별 조정
        if (scenario.type === 'critical') {
            cpuUsage = Math.min(95, cpuUsage * 1.6 + Math.random() * 10);
            memoryUsed = Math.min(server.specs.memory.total * 0.95, memoryUsed * 1.5);
        } else if (scenario.type === 'warning') {
            cpuUsage = Math.min(85, cpuUsage * 1.3 + Math.random() * 8);
            memoryUsed = Math.min(server.specs.memory.total * 0.85, memoryUsed * 1.3);
        }

        // 자연스러운 변동 추가
        cpuUsage += (Math.random() - 0.5) * 5;
        memoryUsed += (Math.random() - 0.5) * (1024 * 1024 * 100);

        return {
            cpu: {
                usage: Math.max(0, Math.min(100, cpuUsage)),
                load1: cpuUsage / 100 * server.specs.cpu.cores,
                load5: cpuUsage / 100 * server.specs.cpu.cores * 0.8,
                load15: cpuUsage / 100 * server.specs.cpu.cores * 0.6,
                processes: Math.floor(30 + Math.random() * 40),
                threads: Math.floor(120 + Math.random() * 200)
            },
            memory: {
                used: Math.max(0, Math.floor(memoryUsed)),
                available: Math.max(0, server.specs.memory.total - Math.floor(memoryUsed)),
                buffers: Math.floor(Math.random() * 1024 * 1024 * 100),
                cached: Math.floor(Math.random() * 1024 * 1024 * 500),
                swap: { used: 0, total: 1024 * 1024 * 1024 }
            },
            disk: {
                io: {
                    read: Math.max(0, baseline.disk.io.read * multiplier + (Math.random() - 0.5) * 50),
                    write: Math.max(0, baseline.disk.io.write * multiplier + (Math.random() - 0.5) * 25)
                },
                throughput: {
                    read: Math.random() * 100,
                    write: Math.random() * 50
                },
                utilization: Math.max(0, Math.min(100, baseline.disk.utilization + (Math.random() - 0.5) * 10)),
                queue: Math.floor(Math.random() * (scenario.type === 'critical' ? 10 : 3))
            },
            network: {
                io: {
                    rx: Math.max(0, baseline.network.io.rx * multiplier + (Math.random() - 0.5) * 100000),
                    tx: Math.max(0, baseline.network.io.tx * multiplier + (Math.random() - 0.5) * 50000)
                },
                packets: {
                    rx: Math.floor(Math.random() * 1000),
                    tx: Math.floor(Math.random() * 800)
                },
                errors: {
                    rx: scenario.type === 'critical' ? Math.floor(Math.random() * 5) : 0,
                    tx: scenario.type === 'critical' ? Math.floor(Math.random() * 3) : 0
                },
                connections: {
                    active: Math.floor(10 + Math.random() * 50),
                    established: Math.floor(5 + Math.random() * 30)
                }
            },
            processes: this.generateProcessList(server)
        };
    }

    /**
     * 📱 애플리케이션 메트릭 생성
     */
    private generateApplicationMetrics(server: ServerData, baseline: any, multiplier: number, scenario: ScenarioContext) {
        const baseRequests = this.getBaseRequestsForServerType(server.type);
        const totalRequests = Math.floor(baseRequests * multiplier);

        let errorRate = 0.001; // 기본 0.1%
        if (scenario.type === 'critical') errorRate = 0.02; // 2%
        else if (scenario.type === 'warning') errorRate = 0.005; // 0.5%

        const errors = Math.floor(totalRequests * errorRate);
        const success = totalRequests - errors;

        return {
            requests: {
                total: totalRequests,
                success,
                errors,
                latency: {
                    p50: this.generateLatency(50, scenario.type),
                    p95: this.generateLatency(95, scenario.type),
                    p99: this.generateLatency(99, scenario.type)
                }
            },
            database: {
                connections: {
                    active: Math.floor(10 + Math.random() * 20),
                    idle: Math.floor(5 + Math.random() * 15)
                },
                queries: {
                    total: Math.floor(totalRequests * 0.3),
                    slow: Math.floor(totalRequests * 0.01)
                },
                locks: Math.floor(Math.random() * 5),
                deadlocks: scenario.type === 'critical' ? Math.floor(Math.random() * 3) : 0
            },
            cache: {
                hits: Math.floor(totalRequests * 0.8),
                misses: Math.floor(totalRequests * 0.2),
                evictions: Math.floor(Math.random() * 10),
                memory: Math.floor(Math.random() * 1024 * 1024 * 100)
            }
        };
    }

    /**
     * 🏗️ 인프라 메트릭 생성
     */
    private generateInfrastructureMetrics(server: ServerData, multiplier: number, scenario: ScenarioContext) {
        const infrastructure: any = {};

        // 컨테이너 환경
        if (server.type.includes('node') || server.type.includes('spring')) {
            infrastructure.containers = {
                running: Math.floor(2 + Math.random() * 8),
                stopped: Math.floor(Math.random() * 2),
                cpu: Math.random() * 100,
                memory: Math.random() * 1024 * 1024 * 1024
            };
        }

        // 클라우드 메트릭
        infrastructure.cloud = {
            credits: Math.random() * 1000,
            costs: {
                hourly: Math.random() * 10,
                daily: Math.random() * 240
            },
            scaling: {
                instances: Math.floor(1 + Math.random() * 5),
                target: Math.floor(2 + Math.random() * 8)
            }
        };

        return infrastructure;
    }

    /**
     * 🎭 시나리오 컨텍스트 생성 (심각 20%, 경고 30% 보장)
     */
    generateScenarioContext(): ScenarioContext {
        const random = Math.random();

        if (random < 0.2) {
            return {
                type: 'critical',
                loadMultiplier: 1.8,
                anomalyChance: 0.8
            };
        } else if (random < 0.5) {
            return {
                type: 'warning',
                loadMultiplier: 1.4,
                anomalyChance: 0.4
            };
        } else {
            return {
                type: 'normal',
                loadMultiplier: 1.0,
                anomalyChance: 0.1
            };
        }
    }

    /**
     * ⏰ 시간대별 부하 배율 계산
     */
    private getTimeMultiplier(hour: number): number {
        // 업무시간(9-18시) 높음, 새벽(2-6시) 낮음
        const hourlyMultipliers = [
            0.2, 0.15, 0.1, 0.1, 0.15, 0.3,  // 00-05시
            0.5, 0.7, 0.9, 1.0, 0.95, 0.9,   // 06-11시
            0.85, 0.9, 0.95, 1.0, 0.9, 0.8,  // 12-17시
            0.7, 0.6, 0.5, 0.4, 0.3, 0.25    // 18-23시
        ];

        return hourlyMultipliers[hour] || 0.5;
    }

    /**
     * 📊 Vercel 연동 API
     */
    async fetchMetricsForVercel(sessionId: string, limit: number = 10): Promise<GCPDataResponse> {
        try {
            const sessionInfo = await this.getSessionInfo(sessionId);
            if (!sessionInfo) {
                return {
                    success: false,
                    error: '세션을 찾을 수 없습니다'
                };
            }

            // Firestore에서 최신 메트릭 조회
            const metricsSnapshot = await this.firestore
                .collection('sessions')
                .doc(sessionId)
                .collection('metrics')
                .orderBy('timestamp', 'desc')
                .limit(limit)
                .get();

            const metrics: TimeSeriesMetrics[] = [];
            metricsSnapshot.docs.forEach(doc => {
                const data = doc.data();
                metrics.push(...data.metrics);
            });

            return {
                success: true,
                data: {
                    sessionId,
                    metrics,
                    dataSource: 'GCP',
                    timestamp: new Date().toISOString(),
                    totalMetrics: metrics.length,
                    sessionInfo
                }
            };
        } catch (error) {
            console.error('GCP 메트릭 조회 실패:', error);
            return {
                success: false,
                error: 'GCP 연결 실패'
            };
        }
    }

    // ===== 헬퍼 메서드들 =====

    private async loadBaselineDataset(): Promise<void> {
        if (this.cache.has('baseline')) {
            this.baselineDataset = this.cache.get('baseline');
            return;
        }

        try {
            const file = this.cloudStorage.bucket('openmanager-baseline-data').file('baseline-dataset.json');
            const [exists] = await file.exists();

            if (!exists) {
                this.baselineDataset = await this.generateBaselineDataset();
            } else {
                const [data] = await file.download();
                this.baselineDataset = JSON.parse(data.toString());
            }

            this.cache.set('baseline', this.baselineDataset);
        } catch (error) {
            console.error('기본 데이터셋 로드 실패:', error);
            this.baselineDataset = await this.generateBaselineDataset();
        }
    }

    private async saveBaselineToFirestore(dataset: BaselineDataset): Promise<void> {
        try {
            await this.firestore.collection('baseline_datasets').add(dataset);
            console.log('✅ 기본 데이터셋 Firestore 저장 완료');
        } catch (error) {
            console.error('기본 데이터셋 저장 실패:', error);
        }
    }

    private async saveMetricsToFirestore(sessionId: string, metrics: TimeSeriesMetrics[], scenario: ScenarioContext): Promise<void> {
        try {
            await this.firestore
                .collection('sessions')
                .doc(sessionId)
                .collection('metrics')
                .add({
                    timestamp: Date.now(),
                    metrics,
                    scenario,
                    count: metrics.length
                });
        } catch (error) {
            console.error('Firestore 메트릭 저장 실패:', error);
        }
    }

    private async getSessionInfo(sessionId: string): Promise<any> {
        try {
            const doc = await this.firestore.collection('sessions').doc(sessionId).get();
            return doc.exists ? doc.data() : null;
        } catch (error) {
            console.error('세션 정보 조회 실패:', error);
            return null;
        }
    }

    private async stopSession(sessionId: string): Promise<void> {
        try {
            await this.firestore.collection('sessions').doc(sessionId).set({
                status: 'stopped',
                endTime: Date.now()
            }, { merge: true });
        } catch (error) {
            console.error('세션 정지 실패:', error);
        }
    }

    private generateProcessList(server: ServerData): ProcessInfo[] {
        const processCount = Math.floor(20 + Math.random() * 30);
        const processes: ProcessInfo[] = [];

        for (let i = 0; i < processCount; i++) {
            processes.push({
                pid: Math.floor(1000 + Math.random() * 30000),
                name: this.getRandomProcessName(server.type),
                cpuUsage: Math.random() * 10,
                memoryUsage: Math.floor(Math.random() * 1024 * 1024 * 100),
                status: Math.random() > 0.1 ? 'running' : 'sleeping',
                user: Math.random() > 0.8 ? 'root' : 'app',
                startTime: new Date(Date.now() - Math.random() * 86400000).toISOString()
            });
        }

        return processes;
    }

    private getRandomProcessName(serverType: string): string {
        const processMap: Record<string, string[]> = {
            nginx: ['nginx', 'nginx-worker', 'php-fpm', 'supervisord'],
            nodejs: ['node', 'npm', 'pm2', 'yarn'],
            postgresql: ['postgres', 'postmaster', 'pg_wal_writer', 'pg_checkpointer'],
            redis: ['redis-server', 'redis-sentinel', 'redis-cli'],
            elasticsearch: ['java', 'elasticsearch', 'logstash', 'kibana']
        };

        const processes = processMap[serverType] || ['systemd', 'sshd', 'cron', 'docker'];
        return processes[Math.floor(Math.random() * processes.length)];
    }

    private getBaseRequestsForServerType(type: string): number {
        const requestMap: Record<string, number> = {
            nginx: 1000,
            apache: 800,
            nodejs: 500,
            springboot: 300,
            postgresql: 200,
            redis: 2000,
            elasticsearch: 100,
            rabbitmq: 50
        };

        return requestMap[type] || 500;
    }

    private generateLatency(percentile: number, scenarioType: string): number {
        let baseLatency = 50; // 50ms

        if (scenarioType === 'critical') baseLatency *= 3;
        else if (scenarioType === 'warning') baseLatency *= 1.5;

        if (percentile === 50) return baseLatency + Math.random() * 20;
        if (percentile === 95) return baseLatency * 2 + Math.random() * 50;
        if (percentile === 99) return baseLatency * 4 + Math.random() * 100;

        return baseLatency;
    }

    private detectAnomalies(metric: TimeSeriesMetrics, scenario: ScenarioContext): AnomalyInfo[] {
        const anomalies: AnomalyInfo[] = [];

        if (metric.system.cpu.usage > 80) {
            anomalies.push({
                type: 'high_cpu',
                severity: metric.system.cpu.usage > 90 ? 'critical' : 'high',
                confidence: 0.9
            });
        }

        if (metric.system.memory.used / (metric.system.memory.used + metric.system.memory.available) > 0.85) {
            anomalies.push({
                type: 'high_memory',
                severity: 'high',
                confidence: 0.85
            });
        }

        return anomalies;
    }

    private async saveGenerationLog(log: GenerationLog): Promise<void> {
        try {
            await this.firestore.collection('generation_logs').add(log);
        } catch (error) {
            console.error('생성 로그 저장 실패:', error);
        }
    }

    // ===== 확장 가능한 기능들 =====

    addCustomMetrics(metrics: Record<string, CustomMetricDefinition>): void {
        Object.entries(metrics).forEach(([name, definition]) => {
            this.customMetrics.set(name, definition);
        });
        console.log(`📊 커스텀 메트릭 ${Object.keys(metrics).length}개 추가됨`);
    }

    addServerType(serverConfig: any): void {
        // 런타임에 새로운 서버 타입 추가 가능
        console.log(`🖥️ 새 서버 타입 추가: ${serverConfig.type}`);
    }

    /**
     * 📦 배치 처리로 메트릭 저장 (Cloud Storage 업로드 최적화)
     */
    private async addMetricsToBatch(sessionId: string, metrics: TimeSeriesMetrics[], scenario: ScenarioContext): Promise<void> {
        // Firestore에 즉시 저장 (실시간 조회용)
        await this.saveMetricsToFirestore(sessionId, metrics, scenario);

        // 배치 버퍼에 추가
        if (!this.metricsBuffer.has(sessionId)) {
            this.metricsBuffer.set(sessionId, []);
        }

        const buffer = this.metricsBuffer.get(sessionId)!;
        buffer.push(...metrics);

        // 세션 완료 시 또는 버퍼가 가득 찬 경우 Cloud Storage에 백업
        if (buffer.length >= this.batchSize) {
            await this.flushBatchToCloudStorage(sessionId);
        }

        // 일일 백업 체크
        await this.checkDailyBackup();
    }

    /**
     * 💾 배치를 Cloud Storage에 플러시 (public 메서드)
     */
    async flushBatchToCloudStorage(sessionId: string): Promise<void> {
        const buffer = this.metricsBuffer.get(sessionId);
        if (!buffer || buffer.length === 0) return;

        try {
            const batchData = {
                sessionId,
                metrics: buffer,
                timestamp: new Date().toISOString(),
                count: buffer.length
            };

            const fileName = `metrics-batch/${sessionId}-${Date.now()}.json`;
            const file = this.cloudStorage.bucket('openmanager-metrics-backup').file(fileName);
            await file.save(JSON.stringify(batchData, null, 2));

            console.log(`💾 배치 데이터 Cloud Storage 저장: ${buffer.length}개 메트릭`);

            // 버퍼 클리어
            this.metricsBuffer.delete(sessionId);
        } catch (error) {
            console.error('배치 Cloud Storage 저장 실패:', error);
        }
    }

    /**
     * 🗓️ 일일 백업 체크 (기본 데이터셋 + 통계)
     */
    private async checkDailyBackup(): Promise<void> {
        const now = Date.now();
        if (now - this.lastCloudStorageSync < this.cloudStorageSyncInterval) {
            return;
        }

        try {
            // 기본 데이터셋 백업
            if (this.baselineDataset) {
                const file = this.cloudStorage.bucket('openmanager-baseline-data').file('baseline-dataset.json');
                await file.save(JSON.stringify(this.baselineDataset, null, 2));
            }

            // 일일 통계 백업
            const dailyStats = await this.generateDailyStats();
            const statsFile = this.cloudStorage.bucket('openmanager-daily-stats').file(`stats-${new Date().toISOString().split('T')[0]}.json`);
            await statsFile.save(JSON.stringify(dailyStats, null, 2));

            this.lastCloudStorageSync = now;
            console.log('📊 일일 백업 완료 (Cloud Storage)');
        } catch (error) {
            console.error('일일 백업 실패:', error);
        }
    }

    /**
     * 📈 일일 통계 생성
     */
    private async generateDailyStats(): Promise<any> {
        try {
            const today = new Date().toISOString().split('T')[0];
            const sessionsSnapshot = await this.firestore
                .collection('sessions')
                .where('date', '==', today)
                .get();

            return {
                date: today,
                totalSessions: sessionsSnapshot.size,
                totalMetrics: sessionsSnapshot.docs.reduce((sum, doc) => sum + (doc.data().metricsCount || 0), 0),
                cloudStorageUploads: 3, // 기본 데이터셋 + 통계 + 필요시 배치
                firestoreOperations: sessionsSnapshot.size * 40 * 2 // 읽기 + 쓰기
            };
        } catch (error) {
            console.error('일일 통계 생성 실패:', error);
            return { date: new Date().toISOString().split('T')[0], error: error.message };
        }
    }
} 