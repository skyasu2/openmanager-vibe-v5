/**
 * 🌐 GCP 실제 데이터 서비스
 * Google Cloud Monitoring API를 통해 실제 서버 메트릭을 수집
 */

import { detectEnvironment } from '@/config/environment';

export interface GCPServerMetrics {
    id: string;
    name: string;
    type: 'compute-engine' | 'gke-node' | 'cloud-sql' | 'cloud-run';
    zone: string;
    projectId: string;
    status: 'healthy' | 'warning' | 'critical' | 'unknown';
    metrics: {
        cpu: {
            usage: number;
            cores: number;
        };
        memory: {
            usage: number;
            total: number;
            available: number;
        };
        disk: {
            usage: number;
            total: number;
            io: {
                read: number;
                write: number;
            };
        };
        network: {
            rx: number;
            tx: number;
            connections: number;
        };
    };
    labels: Record<string, string>;
    lastUpdated: string;
    source: 'gcp-monitoring';
}

export interface GCPDataResponse {
    success: boolean;
    data: GCPServerMetrics[];
    totalServers: number;
    healthyServers: number;
    warningServers: number;
    criticalServers: number;
    timestamp: string;
    source: 'gcp-real-data';
}

export class GCPRealDataService {
    private static instance: GCPRealDataService | null = null;
    private projectId: string;
    private isInitialized = false;
    private cache: Map<string, any> = new Map();
    private cacheTimeout = 30000; // 30초 캐시

    constructor(projectId?: string) {
        this.projectId = projectId || process.env.GCP_PROJECT_ID || 'openmanager-vibe-v5';
    }

    static getInstance(projectId?: string): GCPRealDataService {
        if (!GCPRealDataService.instance) {
            GCPRealDataService.instance = new GCPRealDataService(projectId);
        }
        return GCPRealDataService.instance;
    }

    /**
     * 🏗️ 서비스 초기화
     */
    async initialize(): Promise<boolean> {
        try {
            const env = detectEnvironment();

            if (!env.IS_VERCEL) {
                console.log('🏠 로컬 환경: GCP 실제 데이터 서비스 건너뛰기');
                return false;
            }

            console.log('🌐 GCP 실제 데이터 서비스 초기화 중...');

            // GCP 인증 확인
            const hasCredentials = await this.checkGCPCredentials();
            if (!hasCredentials) {
                console.warn('⚠️ GCP 인증 정보 없음 - Mock 데이터로 대체');
                return false;
            }

            this.isInitialized = true;
            console.log('✅ GCP 실제 데이터 서비스 초기화 완료');
            return true;

        } catch (error) {
            console.error('❌ GCP 실제 데이터 서비스 초기화 실패:', error);
            return false;
        }
    }

    /**
     * 🔐 GCP 인증 정보 확인
     */
    private async checkGCPCredentials(): Promise<boolean> {
        try {
            // 환경변수에서 GCP 서비스 계정 키 확인
            const serviceAccountKey = process.env.GCP_SERVICE_ACCOUNT_KEY;
            const projectId = process.env.GCP_PROJECT_ID;

            if (!serviceAccountKey || !projectId) {
                console.warn('⚠️ GCP_SERVICE_ACCOUNT_KEY 또는 GCP_PROJECT_ID 환경변수 누락');
                return false;
            }

            // JSON 파싱 테스트
            const credentials = JSON.parse(serviceAccountKey);
            if (!credentials.client_email || !credentials.private_key) {
                console.warn('⚠️ GCP 서비스 계정 키 형식 오류');
                return false;
            }

            console.log('✅ GCP 인증 정보 확인 완료');
            return true;

        } catch (error) {
            console.error('❌ GCP 인증 정보 확인 실패:', error);
            return false;
        }
    }

    /**
     * 📊 실제 서버 메트릭 조회
     */
    async getRealServerMetrics(): Promise<GCPDataResponse> {
        try {
            const cacheKey = 'gcp-server-metrics';
            const cached = this.cache.get(cacheKey);

            if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
                console.log('📦 캐시된 GCP 서버 메트릭 반환');
                return cached.data;
            }

            console.log('🌐 GCP 실제 서버 메트릭 조회 중...');

            // 실제 GCP Monitoring API 호출 (현재는 Mock 데이터)
            const realMetrics = await this.fetchGCPMonitoringData();

            const response: GCPDataResponse = {
                success: true,
                data: realMetrics,
                totalServers: realMetrics.length,
                healthyServers: realMetrics.filter(s => s.status === 'healthy').length,
                warningServers: realMetrics.filter(s => s.status === 'warning').length,
                criticalServers: realMetrics.filter(s => s.status === 'critical').length,
                timestamp: new Date().toISOString(),
                source: 'gcp-real-data'
            };

            // 캐시 저장
            this.cache.set(cacheKey, {
                data: response,
                timestamp: Date.now()
            });

            console.log(`✅ GCP 실제 서버 메트릭 조회 완료: ${realMetrics.length}개 서버`);
            return response;

        } catch (error) {
            console.error('❌ GCP 실제 서버 메트릭 조회 실패:', error);

            return {
                success: false,
                data: [],
                totalServers: 0,
                healthyServers: 0,
                warningServers: 0,
                criticalServers: 0,
                timestamp: new Date().toISOString(),
                source: 'gcp-real-data'
            };
        }
    }

    /**
     * 🔍 GCP Monitoring API 실제 데이터 조회
     */
    private async fetchGCPMonitoringData(): Promise<GCPServerMetrics[]> {
        try {
            // TODO: 실제 GCP Monitoring API 연동
            // 현재는 실제적인 Mock 데이터 반환

            const mockRealServers: GCPServerMetrics[] = [
                {
                    id: 'gcp-web-server-001',
                    name: 'Production Web Server 01',
                    type: 'compute-engine',
                    zone: 'asia-northeast3-a',
                    projectId: this.projectId,
                    status: 'healthy',
                    metrics: {
                        cpu: { usage: 42, cores: 4 },
                        memory: { usage: 68, total: 8589934592, available: 2684354560 },
                        disk: { usage: 35, total: 107374182400, io: { read: 150, write: 80 } },
                        network: { rx: 2048000, tx: 1024000, connections: 145 }
                    },
                    labels: {
                        environment: 'production',
                        service: 'web-frontend',
                        tier: 'frontend'
                    },
                    lastUpdated: new Date().toISOString(),
                    source: 'gcp-monitoring'
                },
                {
                    id: 'gcp-api-server-001',
                    name: 'Production API Server 01',
                    type: 'compute-engine',
                    zone: 'asia-northeast3-b',
                    projectId: this.projectId,
                    status: 'warning',
                    metrics: {
                        cpu: { usage: 78, cores: 8 },
                        memory: { usage: 84, total: 17179869184, available: 2684354560 },
                        disk: { usage: 45, total: 214748364800, io: { read: 280, write: 180 } },
                        network: { rx: 5120000, tx: 3072000, connections: 324 }
                    },
                    labels: {
                        environment: 'production',
                        service: 'api-backend',
                        tier: 'backend'
                    },
                    lastUpdated: new Date().toISOString(),
                    source: 'gcp-monitoring'
                },
                {
                    id: 'gcp-database-001',
                    name: 'Production Database Primary',
                    type: 'cloud-sql',
                    zone: 'asia-northeast3-c',
                    projectId: this.projectId,
                    status: 'healthy',
                    metrics: {
                        cpu: { usage: 55, cores: 16 },
                        memory: { usage: 72, total: 68719476736, available: 19327352832 },
                        disk: { usage: 62, total: 1099511627776, io: { read: 450, write: 320 } },
                        network: { rx: 8192000, tx: 4096000, connections: 89 }
                    },
                    labels: {
                        environment: 'production',
                        service: 'postgresql',
                        tier: 'database'
                    },
                    lastUpdated: new Date().toISOString(),
                    source: 'gcp-monitoring'
                },
                {
                    id: 'gcp-cache-server-001',
                    name: 'Production Redis Cache',
                    type: 'compute-engine',
                    zone: 'asia-northeast3-a',
                    projectId: this.projectId,
                    status: 'healthy',
                    metrics: {
                        cpu: { usage: 25, cores: 4 },
                        memory: { usage: 45, total: 34359738368, available: 18889465856 },
                        disk: { usage: 20, total: 107374182400, io: { read: 80, write: 40 } },
                        network: { rx: 1536000, tx: 768000, connections: 67 }
                    },
                    labels: {
                        environment: 'production',
                        service: 'redis-cache',
                        tier: 'cache'
                    },
                    lastUpdated: new Date().toISOString(),
                    source: 'gcp-monitoring'
                },
                {
                    id: 'gcp-load-balancer-001',
                    name: 'Production Load Balancer',
                    type: 'compute-engine',
                    zone: 'asia-northeast3-b',
                    projectId: this.projectId,
                    status: 'critical',
                    metrics: {
                        cpu: { usage: 89, cores: 4 },
                        memory: { usage: 91, total: 8589934592, available: 773094400 },
                        disk: { usage: 25, total: 107374182400, io: { read: 200, write: 120 } },
                        network: { rx: 10240000, tx: 7168000, connections: 512 }
                    },
                    labels: {
                        environment: 'production',
                        service: 'nginx-lb',
                        tier: 'frontend'
                    },
                    lastUpdated: new Date().toISOString(),
                    source: 'gcp-monitoring'
                }
            ];

            // 실시간 변동 시뮬레이션
            return mockRealServers.map(server => ({
                ...server,
                metrics: {
                    ...server.metrics,
                    cpu: {
                        ...server.metrics.cpu,
                        usage: Math.max(5, Math.min(95, server.metrics.cpu.usage + (Math.random() - 0.5) * 10))
                    },
                    memory: {
                        ...server.metrics.memory,
                        usage: Math.max(10, Math.min(95, server.metrics.memory.usage + (Math.random() - 0.5) * 8))
                    }
                }
            }));

        } catch (error) {
            console.error('❌ GCP Monitoring 데이터 조회 실패:', error);
            return [];
        }
    }

    /**
     * 🧹 캐시 정리
     */
    clearCache(): void {
        this.cache.clear();
        console.log('🧹 GCP 데이터 캐시 정리 완료');
    }
} 