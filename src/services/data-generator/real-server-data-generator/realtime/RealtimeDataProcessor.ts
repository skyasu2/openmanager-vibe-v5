/**
 * ⚡ Realtime Data Processor v1.0
 * 
 * 실시간 서버 데이터 생성 및 처리 전담 모듈
 * - 실시간 메트릭 업데이트
 * - 자동 데이터 생성 관리
 * - 서버 상태 기반 메트릭 생성
 */

import {
    ServerInstance,
    ServerCluster,
    ApplicationMetrics
} from '../types/DataGeneratorTypes';
import { getVercelOptimizedConfig } from '@/config/environment';
import { MetricsGenerator } from '../../MetricsGenerator';

export interface SimulationConfig {
    baseLoad: number;
    peakHours: number[];
    incidents: {
        probability: number;
        duration: number;
    };
    scaling: {
        enabled: boolean;
        threshold: number;
        cooldown: number;
    };
}

export class RealtimeDataProcessor {
    private config = getVercelOptimizedConfig();
    private isGenerating = false;
    private isRunning = false;
    private generationInterval: NodeJS.Timeout | null = null;
    private metricsGenerator: MetricsGenerator;

    // 시뮬레이션 설정 (환경별 동적 조정)
    private simulationConfig: SimulationConfig = {
        baseLoad: 0.3, // 기본 부하 30%
        peakHours: [9, 10, 11, 14, 15, 16], // 피크 시간
        incidents: {
            probability: 0.02, // 2% 확률로 문제 발생
            duration: 300000, // 5분간 지속
        },
        scaling: {
            enabled: true,
            threshold: 0.8, // 80% 이상시 스케일링
            cooldown: 180000, // 3분 대기
        },
    };

    constructor(simulationConfig?: Partial<SimulationConfig>) {
        if (simulationConfig) {
            this.simulationConfig = { ...this.simulationConfig, ...simulationConfig };
        }

        this.metricsGenerator = new MetricsGenerator(this.simulationConfig);
    }

    /**
     * 🚀 실시간 데이터 생성 시작
     */
    public startAutoGeneration(): void {
        if (this.isRunning) return;

        this.isRunning = true;
        console.log('🚀 실시간 데이터 생성 시작');

        const loop = async () => {
            try {
                await this.generateRealtimeData();
                // TODO: 캐싱 및 모니터링 구현 예정
                // await this.cacheGeneratedData();
                // await this.pingMonitoringSystem();
            } catch (error) {
                console.error('데이터 생성 오류:', error);
                // await this.handleGenerationError(error);
            }
        };

        // 즉시 실행 후 주기적 실행
        loop();
        this.generationInterval = setInterval(loop, this.config.interval);
    }

    /**
     * ⏹️ 실시간 데이터 생성 중지
     */
    public stopAutoGeneration(): void {
        this.isRunning = false;
        if (this.generationInterval) {
            clearInterval(this.generationInterval);
            this.generationInterval = null;
        }
        console.log('⏹️ 실시간 서버 데이터 생성 중지');
    }

    /**
     * 📊 실시간 데이터 생성 메인 로직
     */
    private async generateRealtimeData(): Promise<void> {
        if (this.isGenerating) return;

        this.isGenerating = true;

        try {
            // 현재 시간에 따른 부하 계산
            const hour = new Date().getHours();
            const loadMultiplier = this.getTimeMultiplier(hour);

            // 실제 시스템 메트릭 수집 (임시로 빈 객체 사용)
            const realMetrics = {};

            console.log(`📊 메트릭 업데이트 시작 (부하: ${(loadMultiplier * 100).toFixed(1)}%)`);

            return Promise.resolve();
        } finally {
            this.isGenerating = false;
        }
    }

    /**
     * 🔄 서버 메트릭 업데이트
     */
    public updateServerMetrics(
        servers: ServerInstance[],
        loadMultiplier: number,
        realMetrics: any = {}
    ): void {
        this.metricsGenerator.updateAllServerMetrics(servers, loadMultiplier, realMetrics);
    }

    /**
     * 🔄 클러스터 메트릭 업데이트
     */
    public updateClusterMetrics(clusters: ServerCluster[]): void {
        this.metricsGenerator.updateClusterMetrics(clusters);
    }

    /**
     * 🔄 애플리케이션 메트릭 업데이트
     */
    public updateApplicationMetrics(applications: ApplicationMetrics[]): void {
        this.metricsGenerator.updateApplicationMetrics(applications);
    }

    /**
     * ⏰ 시간대별 부하 패턴 계산
     */
    private getTimeMultiplier(hour: number): number {
        // 업무 시간 (9-18시)에 높은 부하
        if (hour >= 9 && hour <= 18) {
            // 점심시간(12-13시)에는 약간 감소
            if (hour >= 12 && hour <= 13) {
                return 0.7;
            }
            // 오전/오후 피크 시간
            if ((hour >= 10 && hour <= 11) || (hour >= 14 && hour <= 16)) {
                return 1.0;
            }
            return 0.8;
        }

        // 야간 시간 (22-6시)에 낮은 부하
        if (hour >= 22 || hour <= 6) {
            return 0.2;
        }

        // 전환 시간
        return 0.5;
    }

    /**
     * 🎯 상태별 서버 생성 확률 조정
     */
    private generateServerStatus(): 'healthy' | 'warning' | 'critical' {
        const random = Math.random();

        // 🚨 심각: 15% 확률
        if (random < 0.15) return 'critical';

        // ⚠️ 경고: 25% 확률
        if (random < 0.4) return 'warning';

        // ✅ 정상: 60% 확률
        return 'healthy';
    }

    /**
     * 🔄 상태에 맞는 메트릭 생성
     */
    private generateStatusBasedMetrics(status: string) {
        switch (status) {
            case 'critical':
                return {
                    cpu: Math.random() * 30 + 85, // 85-100%
                    memory: Math.random() * 25 + 90, // 90-100%
                    disk: Math.random() * 35 + 75, // 75-100%
                    uptime_hours: Math.random() * 24, // 0-24 시간 (최근 재시작)
                };

            case 'warning':
                return {
                    cpu: Math.random() * 25 + 65, // 65-90%
                    memory: Math.random() * 25 + 70, // 70-95%
                    disk: Math.random() * 30 + 50, // 50-80%
                    uptime_hours: Math.random() * 168 + 24, // 1-7일
                };

            default: // healthy
                return {
                    cpu: Math.random() * 40 + 10, // 10-50%
                    memory: Math.random() * 45 + 20, // 20-65%
                    disk: Math.random() * 35 + 15, // 15-50%
                    uptime_hours: Math.random() * 720 + 168, // 7-30일
                };
        }
    }

    /**
     * 📊 서버 인스턴스 생성 (개선)
     */
    public createServerInstance(baseServer: any): ServerInstance {
        const healthStatus = this.generateServerStatus();
        const metrics = this.generateStatusBasedMetrics(healthStatus);

        // 상태 매핑: healthy -> running, critical -> error
        const status: ServerInstance['status'] =
            healthStatus === 'healthy'
                ? 'running'
                : healthStatus === 'critical'
                    ? 'error'
                    : 'warning';

        return {
            id: baseServer.id,
            name: baseServer.name,
            type: baseServer.type,
            role: baseServer.role || 'standalone',
            location: baseServer.location,
            status,
            environment: baseServer.environment || 'production',
            specs: {
                cpu: { cores: 4, model: 'Intel Xeon' },
                memory: { total: 16, type: 'DDR4' },
                disk: { total: 500, type: 'SSD' },
                network: { bandwidth: 1000 },
            },
            metrics: {
                cpu: Math.round(metrics.cpu),
                memory: Math.round(metrics.memory),
                disk: Math.round(metrics.disk),
                network: { in: Math.random() * 100, out: Math.random() * 100 },
                requests: Math.floor(Math.random() * 1000),
                errors: Math.floor(Math.random() * 10),
                uptime: Math.round(metrics.uptime_hours),
            },
            health: {
                score:
                    healthStatus === 'healthy'
                        ? 95
                        : healthStatus === 'warning'
                            ? 70
                            : 30,
                issues: [],
                lastCheck: new Date().toISOString(),
            },
        };
    }

    /**
     * ⏰ 업타임 포맷팅
     */
    private formatUptime(hours: number): string {
        if (hours < 1) return '방금 전';
        if (hours < 24) return `${Math.floor(hours)}시간`;

        const days = Math.floor(hours / 24);
        const remainingHours = Math.floor(hours % 24);

        if (days > 0 && remainingHours > 0) {
            return `${days}일 ${remainingHours}시간`;
        }
        return `${days}일`;
    }

    /**
     * 🔧 상태별 서비스 생성
     */
    private generateServicesForStatus(serverType: string, status: string) {
        const baseServices = {
            web: ['nginx', 'nodejs', 'pm2'],
            api: ['gunicorn', 'python', 'nginx'],
            database: ['postgresql', 'redis'],
            cache: ['redis', 'memcached'],
            queue: ['celery', 'rabbitmq'],
            storage: ['minio', 'nginx'],
        };

        const services =
            baseServices[serverType as keyof typeof baseServices] || baseServices.web;

        return services.map((serviceName, index) => {
            let serviceStatus = 'running';

            // 상태에 따른 서비스 장애 확률
            if (status === 'critical') {
                // 심각 상태: 50% 확률로 서비스 정지
                serviceStatus = Math.random() < 0.5 ? 'stopped' : 'running';
            } else if (status === 'warning') {
                // 경고 상태: 20% 확률로 서비스 정지
                serviceStatus = Math.random() < 0.2 ? 'stopped' : 'running';
            }

            return {
                name: serviceName,
                status: serviceStatus,
                port: this.getDefaultPort(serviceName),
            };
        });
    }

    /**
     * 🔌 기본 포트 번호
     */
    private getDefaultPort(serviceName: string): number {
        const portMap: { [key: string]: number } = {
            nginx: 80,
            nodejs: 3000,
            pm2: 0,
            gunicorn: 8000,
            python: 3000,
            postgresql: 5432,
            redis: 6379,
            memcached: 11211,
            celery: 0,
            rabbitmq: 5672,
            minio: 9000,
        };

        return portMap[serviceName] || 8080;
    }

    /**
     * 📊 현재 상태 조회
     */
    public getCurrentStatus() {
        return {
            isRunning: this.isRunning,
            isGenerating: this.isGenerating,
            simulationConfig: this.simulationConfig,
            lastUpdate: new Date().toISOString(),
        };
    }

    /**
     * 🔧 시뮬레이션 설정 업데이트
     */
    public updateSimulationConfig(config: Partial<SimulationConfig>): void {
        this.simulationConfig = { ...this.simulationConfig, ...config };
        console.log('🔧 시뮬레이션 설정 업데이트:', this.simulationConfig);
    }

    /**
     * 🏥 헬스체크
     */
    public async healthCheck() {
        return {
            status: 'healthy',
            isGenerating: this.isGenerating,
            isRunning: this.isRunning,
            config: this.simulationConfig,
            lastUpdate: new Date().toISOString(),
        };
    }
} 