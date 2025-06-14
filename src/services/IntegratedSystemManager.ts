/**
 * 🎯 통합 시스템 관리자 v6.0
 * 
 * 모든 통합 서비스를 중앙에서 관리:
 * - UnifiedNotificationService
 * - AIStateManager
 * - CentralizedPerformanceMonitor
 * - 시스템 라이프사이클 관리
 * - 서비스 간 통신 및 동기화
 */

import { unifiedNotificationService } from '@/services/notifications/UnifiedNotificationService';
import { aiStateManager } from '@/services/ai/AIStateManager';
import { centralizedPerformanceMonitor } from '@/services/monitoring/CentralizedPerformanceMonitor';

// 시스템 상태 타입
export interface SystemState {
    overall: {
        status: 'starting' | 'healthy' | 'degraded' | 'critical' | 'maintenance' | 'shutdown';
        uptime: number;
        lastUpdate: Date;
        version: string;
    };
    services: {
        notifications: {
            status: 'active' | 'inactive' | 'error';
            stats: any;
        };
        aiStateManager: {
            status: 'active' | 'inactive' | 'error';
            stats: any;
        };
        performanceMonitor: {
            status: 'active' | 'inactive' | 'error';
            stats: any;
        };
    };
    health: {
        score: number; // 0-100
        issues: string[];
        recommendations: string[];
    };
}

// 초기화 설정
export interface InitializationConfig {
    notifications: {
        enabled: boolean;
        autoStart: boolean;
        quietMode: boolean;
    };
    aiStateManager: {
        enabled: boolean;
        autoStart: boolean;
        healthCheckEnabled: boolean;
    };
    performanceMonitor: {
        enabled: boolean;
        autoStart: boolean;
        collectMetricsOnStart: boolean;
    };
    system: {
        startupDelay: number; // ms
        gracefulShutdownTimeout: number; // ms
        healthCheckInterval: number; // ms
    };
}

/**
 * 🎯 통합 시스템 관리자
 */
export class IntegratedSystemManager {
    private static instance: IntegratedSystemManager;

    // 설정 및 상태
    private config: InitializationConfig;
    private systemState: SystemState;
    private isInitialized = false;
    private startTime = Date.now();

    // 스케줄러
    private healthCheckInterval: NodeJS.Timeout | null = null;

    // 통계
    private stats = {
        totalStartups: 0,
        totalShutdowns: 0,
        totalRestarts: 0,
        uptime: Date.now(),
        lastHealthCheck: null as Date | null,
    };

    private constructor() {
        this.config = this.loadDefaultConfig();
        this.systemState = this.initializeSystemState();
        console.log('🎯 통합 시스템 관리자 초기화 완료');
    }

    /**
     * 🏭 싱글톤 인스턴스 획득
     */
    static getInstance(): IntegratedSystemManager {
        if (!IntegratedSystemManager.instance) {
            IntegratedSystemManager.instance = new IntegratedSystemManager();
        }
        return IntegratedSystemManager.instance;
    }

    /**
     * 🚀 전체 시스템 초기화 및 시작
     */
    async initializeSystem(): Promise<void> {
        if (this.isInitialized) {
            console.log('⚠️ 시스템이 이미 초기화되었습니다.');
            return;
        }

        console.log('🚀 OpenManager Vibe v6.0 통합 시스템 시작...');
        this.systemState.overall.status = 'starting';
        this.stats.totalStartups++;

        try {
            // 1. 시작 지연 (다른 시스템 초기화 대기)
            if (this.config.system.startupDelay > 0) {
                console.log(`⏰ 시스템 시작 지연: ${this.config.system.startupDelay}ms`);
                await new Promise(resolve => setTimeout(resolve, this.config.system.startupDelay));
            }

            // 2. 알림 시스템 초기화
            if (this.config.notifications.enabled) {
                await this.initializeNotificationService();
            }

            // 3. AI 상태 관리 초기화
            if (this.config.aiStateManager.enabled) {
                await this.initializeAIStateManager();
            }

            // 4. 성능 모니터링 초기화
            if (this.config.performanceMonitor.enabled) {
                await this.initializePerformanceMonitor();
            }

            // 5. 시스템 헬스 체크 시작
            this.startSystemHealthCheck();

            // 6. 초기화 완료
            this.isInitialized = true;
            this.systemState.overall.status = 'healthy';
            this.startTime = Date.now();

            // 시작 완료 알림 (조용한 모드가 아닌 경우에만)
            if (!this.config.notifications.quietMode) {
                await unifiedNotificationService.sendSystemAlert(
                    'OpenManager Vibe v6.0 시작',
                    '통합 시스템이 성공적으로 시작되었습니다.',
                    'success'
                );
            }

            console.log('✅ OpenManager Vibe v6.0 통합 시스템 시작 완료');

        } catch (error) {
            console.error('❌ 시스템 초기화 실패:', error);
            this.systemState.overall.status = 'critical';

            // 에러 알림
            await unifiedNotificationService.sendSystemAlert(
                '시스템 초기화 실패',
                `통합 시스템 시작 중 오류가 발생했습니다: ${error}`,
                'critical'
            );

            throw error;
        }
    }

    /**
     * 🔔 알림 서비스 초기화
     */
    private async initializeNotificationService(): Promise<void> {
        console.log('🔔 통합 알림 서비스 초기화 중...');

        try {
            // 조용한 모드 설정
            if (this.config.notifications.quietMode) {
                unifiedNotificationService.updateSettings({
                    filters: { systemStartupQuietMode: true }
                });
            }

            this.systemState.services.notifications = {
                status: 'active',
                stats: unifiedNotificationService.getStats(),
            };

            console.log('✅ 통합 알림 서비스 초기화 완료');

        } catch (error) {
            console.error('❌ 알림 서비스 초기화 실패:', error);
            this.systemState.services.notifications.status = 'error';
            throw error;
        }
    }

    /**
     * 🤖 AI 상태 관리 초기화
     */
    private async initializeAIStateManager(): Promise<void> {
        console.log('🤖 AI 상태 관리자 초기화 중...');

        try {
            // AI 상태 모니터링 시작
            if (this.config.aiStateManager.autoStart) {
                await aiStateManager.startMonitoring();
            }

            this.systemState.services.aiStateManager = {
                status: 'active',
                stats: aiStateManager.getStats(),
            };

            console.log('✅ AI 상태 관리자 초기화 완료');

        } catch (error) {
            console.error('❌ AI 상태 관리자 초기화 실패:', error);
            this.systemState.services.aiStateManager.status = 'error';
            throw error;
        }
    }

    /**
     * 📊 성능 모니터링 초기화
     */
    private async initializePerformanceMonitor(): Promise<void> {
        console.log('📊 성능 모니터링 초기화 중...');

        try {
            // 성능 모니터링 시작
            if (this.config.performanceMonitor.autoStart) {
                await centralizedPerformanceMonitor.startMonitoring();
            }

            // 초기 메트릭 수집
            if (this.config.performanceMonitor.collectMetricsOnStart) {
                await centralizedPerformanceMonitor.collectAllMetrics();
            }

            this.systemState.services.performanceMonitor = {
                status: 'active',
                stats: centralizedPerformanceMonitor.getStats(),
            };

            console.log('✅ 성능 모니터링 초기화 완료');

        } catch (error) {
            console.error('❌ 성능 모니터링 초기화 실패:', error);
            this.systemState.services.performanceMonitor.status = 'error';
            throw error;
        }
    }

    /**
     * 🔍 시스템 헬스 체크 시작
     */
    private startSystemHealthCheck(): void {
        this.healthCheckInterval = setInterval(async () => {
            await this.performSystemHealthCheck();
        }, this.config.system.healthCheckInterval);

        console.log(`⏰ 시스템 헬스 체크 시작 (${this.config.system.healthCheckInterval}ms 간격)`);
    }

    /**
     * 🔍 시스템 헬스 체크 수행
     */
    private async performSystemHealthCheck(): Promise<void> {
        try {
            this.stats.lastHealthCheck = new Date();

            // 각 서비스 상태 확인
            const notificationStatus = unifiedNotificationService.getStatus();
            const aiStatus = aiStateManager.getStats();
            const performanceStatus = centralizedPerformanceMonitor.getStats();

            // 서비스 상태 업데이트
            this.systemState.services.notifications.stats = notificationStatus;
            this.systemState.services.aiStateManager.stats = aiStatus;
            this.systemState.services.performanceMonitor.stats = performanceStatus;

            // 전체 시스템 상태 계산
            const healthScore = this.calculateSystemHealthScore();
            const issues = this.identifySystemIssues();
            const recommendations = this.generateSystemRecommendations();

            this.systemState.health = {
                score: healthScore,
                issues,
                recommendations,
            };

            // 전체 상태 결정
            let overallStatus: SystemState['overall']['status'] = 'healthy';

            if (healthScore < 30) {
                overallStatus = 'critical';
            } else if (healthScore < 60) {
                overallStatus = 'degraded';
            }

            // 상태 변경 시 알림
            if (this.systemState.overall.status !== overallStatus) {
                const previousStatus = this.systemState.overall.status;
                this.systemState.overall.status = overallStatus;

                await unifiedNotificationService.sendSystemAlert(
                    '시스템 상태 변경',
                    `시스템 상태가 ${previousStatus}에서 ${overallStatus}로 변경되었습니다. (점수: ${healthScore}/100)`,
                    overallStatus === 'critical' ? 'critical' : overallStatus === 'degraded' ? 'warning' : 'info'
                );
            }

            // 시스템 상태 업데이트
            this.systemState.overall.uptime = Date.now() - this.startTime;
            this.systemState.overall.lastUpdate = new Date();

        } catch (error) {
            console.error('❌ 시스템 헬스 체크 실패:', error);
        }
    }

    /**
     * 📊 시스템 헬스 스코어 계산
     */
    private calculateSystemHealthScore(): number {
        let totalScore = 0;
        let serviceCount = 0;

        // 알림 서비스 점수
        if (this.config.notifications.enabled) {
            const notificationScore = this.systemState.services.notifications.status === 'active' ? 100 : 0;
            totalScore += notificationScore;
            serviceCount++;
        }

        // AI 상태 관리 점수
        if (this.config.aiStateManager.enabled) {
            const aiScore = this.systemState.services.aiStateManager.status === 'active' ? 100 : 0;
            totalScore += aiScore;
            serviceCount++;
        }

        // 성능 모니터링 점수
        if (this.config.performanceMonitor.enabled) {
            const performanceScore = this.systemState.services.performanceMonitor.status === 'active' ? 100 : 0;
            totalScore += performanceScore;
            serviceCount++;
        }

        return serviceCount > 0 ? Math.round(totalScore / serviceCount) : 0;
    }

    /**
     * 🚨 시스템 이슈 식별
     */
    private identifySystemIssues(): string[] {
        const issues: string[] = [];

        // 서비스별 이슈 확인
        if (this.systemState.services.notifications.status === 'error') {
            issues.push('알림 시스템에 오류가 발생했습니다.');
        }

        if (this.systemState.services.aiStateManager.status === 'error') {
            issues.push('AI 상태 관리에 오류가 발생했습니다.');
        }

        if (this.systemState.services.performanceMonitor.status === 'error') {
            issues.push('성능 모니터링에 오류가 발생했습니다.');
        }

        // 성능 관련 이슈
        const performanceMetrics = centralizedPerformanceMonitor.getCurrentMetrics();
        if (performanceMetrics) {
            if (performanceMetrics.system.memory.usage > 85) {
                issues.push(`메모리 사용량이 높습니다: ${performanceMetrics.system.memory.usage}%`);
            }

            if (performanceMetrics.system.cpu.usage > 80) {
                issues.push(`CPU 사용량이 높습니다: ${performanceMetrics.system.cpu.usage.toFixed(1)}%`);
            }
        }

        return issues;
    }

    /**
     * 💡 시스템 추천사항 생성
     */
    private generateSystemRecommendations(): string[] {
        const recommendations: string[] = [];
        const issues = this.systemState.health.issues;

        if (issues.length === 0) {
            recommendations.push('시스템이 정상적으로 작동하고 있습니다.');
            return recommendations;
        }

        // 이슈별 추천사항
        if (issues.some(issue => issue.includes('메모리 사용량'))) {
            recommendations.push('메모리 사용량을 줄이기 위해 불필요한 서비스를 중지하거나 메모리 최적화를 고려하세요.');
        }

        if (issues.some(issue => issue.includes('CPU 사용량'))) {
            recommendations.push('CPU 사용량을 줄이기 위해 부하 분산이나 프로세스 최적화를 고려하세요.');
        }

        if (issues.some(issue => issue.includes('알림 시스템'))) {
            recommendations.push('알림 시스템을 재시작하거나 설정을 확인해보세요.');
        }

        if (issues.some(issue => issue.includes('AI 상태 관리'))) {
            recommendations.push('AI 엔진들의 상태를 확인하고 필요시 재시작하세요.');
        }

        if (issues.some(issue => issue.includes('성능 모니터링'))) {
            recommendations.push('성능 모니터링 서비스를 재시작하고 설정을 확인하세요.');
        }

        return recommendations;
    }

    /**
     * 🔄 전체 시스템 재시작
     */
    async restartSystem(): Promise<void> {
        console.log('🔄 통합 시스템 재시작 중...');
        this.stats.totalRestarts++;

        try {
            // 1. 모든 서비스 중지
            await this.shutdownSystem(false);

            // 2. 잠시 대기
            await new Promise(resolve => setTimeout(resolve, 2000));

            // 3. 시스템 재시작
            this.isInitialized = false;
            await this.initializeSystem();

            await unifiedNotificationService.sendSystemAlert(
                '시스템 재시작 완료',
                '통합 시스템이 성공적으로 재시작되었습니다.',
                'success'
            );

            console.log('✅ 통합 시스템 재시작 완료');

        } catch (error) {
            console.error('❌ 시스템 재시작 실패:', error);

            await unifiedNotificationService.sendSystemAlert(
                '시스템 재시작 실패',
                `재시작 중 오류가 발생했습니다: ${error}`,
                'critical'
            );

            throw error;
        }
    }

    /**
     * 🛑 전체 시스템 종료
     */
    async shutdownSystem(isGraceful = true): Promise<void> {
        console.log('🛑 통합 시스템 종료 중...');
        this.systemState.overall.status = 'shutdown';
        this.stats.totalShutdowns++;

        try {
            // 헬스 체크 중지
            if (this.healthCheckInterval) {
                clearInterval(this.healthCheckInterval);
                this.healthCheckInterval = null;
            }

            // 종료 알림 (graceful shutdown인 경우)
            if (isGraceful) {
                await unifiedNotificationService.sendSystemAlert(
                    '시스템 종료',
                    '통합 시스템을 안전하게 종료합니다.',
                    'info'
                );
            }

            // 각 서비스 순차적 종료
            const shutdownPromises = [];

            if (this.config.performanceMonitor.enabled) {
                shutdownPromises.push(centralizedPerformanceMonitor.shutdown());
            }

            if (this.config.aiStateManager.enabled) {
                shutdownPromises.push(aiStateManager.shutdown());
            }

            // Graceful shutdown 타임아웃 설정
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Shutdown timeout')), this.config.system.gracefulShutdownTimeout);
            });

            await Promise.race([
                Promise.allSettled(shutdownPromises),
                timeoutPromise
            ]);

            this.isInitialized = false;
            console.log('✅ 통합 시스템 종료 완료');

        } catch (error) {
            console.error('❌ 시스템 종료 중 오류:', error);
            // 강제 종료
            this.isInitialized = false;
        }
    }

    /**
     * 📊 공개 API 메서드들
     */

    /**
     * 🔍 시스템 상태 조회
     */
    getSystemState(): SystemState {
        return { ...this.systemState };
    }

    /**
     * 📈 시스템 통계 조회
     */
    getSystemStats() {
        return {
            ...this.stats,
            isInitialized: this.isInitialized,
            config: this.config,
            currentUptime: this.isInitialized ? Date.now() - this.startTime : 0,
            totalSystemUptime: Date.now() - this.stats.uptime,
        };
    }

    /**
     * ⚙️ 설정 업데이트
     */
    updateConfig(newConfig: Partial<InitializationConfig>): void {
        this.config = { ...this.config, ...newConfig };
        console.log('⚙️ 통합 시스템 설정 업데이트:', newConfig);
    }

    /**
     * 🔍 초기화 상태 확인
     */
    isSystemInitialized(): boolean {
        return this.isInitialized;
    }

    /**
     * 🔧 기본 설정 로드
     */
    private loadDefaultConfig(): InitializationConfig {
        return {
            notifications: {
                enabled: true,
                autoStart: true,
                quietMode: true, // 시작 시 조용한 모드
            },
            aiStateManager: {
                enabled: true,
                autoStart: true,
                healthCheckEnabled: true,
            },
            performanceMonitor: {
                enabled: true,
                autoStart: true,
                collectMetricsOnStart: true,
            },
            system: {
                startupDelay: 2000, // 2초 지연
                gracefulShutdownTimeout: 30000, // 30초 타임아웃
                healthCheckInterval: 60000, // 1분마다 헬스 체크
            },
        };
    }

    /**
     * 🔧 시스템 상태 초기화
     */
    private initializeSystemState(): SystemState {
        return {
            overall: {
                status: 'maintenance',
                uptime: 0,
                lastUpdate: new Date(),
                version: '6.0.0',
            },
            services: {
                notifications: {
                    status: 'inactive',
                    stats: {},
                },
                aiStateManager: {
                    status: 'inactive',
                    stats: {},
                },
                performanceMonitor: {
                    status: 'inactive',
                    stats: {},
                },
            },
            health: {
                score: 0,
                issues: [],
                recommendations: [],
            },
        };
    }
}

// 싱글톤 인스턴스 export
export const integratedSystemManager = IntegratedSystemManager.getInstance();

// 기본 export
export default integratedSystemManager;