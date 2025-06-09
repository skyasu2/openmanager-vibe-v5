/**
 * ⚙️ Configuration Manager v1.0
 * 
 * 환경 설정 및 시뮬레이션 설정 관리 전담 모듈
 * - 환경별 설정 관리
 * - 동적 설정 업데이트
 * - 설정 검증 및 최적화
 */

import {
    detectEnvironment,
    getDataGeneratorConfig,
    getVercelOptimizedConfig,
    isPluginEnabled,
    getPluginConfig
} from '@/config/environment';
import { CustomEnvironmentConfig } from '../types/DataGeneratorTypes';

export interface ConfigurationState {
    environment: string;
    mode: string;
    isVercel: boolean;
    interval: number;
    batchSize: number;
    features: {
        realMetrics: boolean;
        aiPredictions: boolean;
        autoScaling: boolean;
        monitoring: boolean;
        alerting: boolean;
    };
    limits: {
        maxServers: number;
        maxClusters: number;
        maxApplications: number;
        memoryLimit: number;
        cpuLimit: number;
    };
}

export interface SimulationSettings {
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

export class ConfigurationManager {
    private config = getVercelOptimizedConfig();
    private dataGeneratorConfig = getDataGeneratorConfig();
    private environmentConfig: CustomEnvironmentConfig;
    private simulationSettings: SimulationSettings;

    constructor() {
        // 환경별 기본 설정 초기화
        this.environmentConfig = this.initializeEnvironmentConfig();
        this.simulationSettings = this.initializeSimulationSettings();

        console.log('⚙️ ConfigurationManager 초기화 완료', {
            environment: detectEnvironment(),
            mode: this.dataGeneratorConfig.mode,
            isVercel: this.config.IS_VERCEL,
        });
    }

    /**
     * 🌍 환경 설정 초기화
     */
    private initializeEnvironmentConfig(): CustomEnvironmentConfig {
        const environment = detectEnvironment();

        // 환경별 기본 설정
        const baseConfig: CustomEnvironmentConfig = {
            mode: this.dataGeneratorConfig.mode,
            serverArchitecture: 'microservices',
            performanceProfile: 'balanced',
            features: ['real-metrics', 'monitoring'],
            limits: {
                maxServers: this.config.IS_VERCEL ? 6 : 12,
                maxClusters: 3,
                maxApplications: 5,
                memoryLimit: this.config.IS_VERCEL ? 512 : 2048,
                cpuLimit: this.config.IS_VERCEL ? 1 : 4,
            },
            optimizations: {
                batchSize: this.config.IS_VERCEL ? 10 : 50,
                updateInterval: this.config.interval || 10000,
                cacheSize: 100,
                compressionEnabled: true,
                lazyLoading: true,
            },
        };

        // 환경별 최적화
        switch (environment) {
            case 'vercel':
                baseConfig.performanceProfile = 'resource-efficient';
                baseConfig.features = ['monitoring']; // 최소 기능만
                break;
            case 'local':
                baseConfig.performanceProfile = 'high-performance';
                baseConfig.features = ['real-metrics', 'ai-predictions', 'auto-scaling', 'monitoring', 'alerting'];
                break;
            case 'premium':
                baseConfig.performanceProfile = 'balanced';
                baseConfig.features = ['real-metrics', 'monitoring', 'alerting'];
                break;
        }

        return baseConfig;
    }

    /**
     * 🎮 시뮬레이션 설정 초기화
     */
    private initializeSimulationSettings(): SimulationSettings {
        const environment = detectEnvironment();

        const baseSettings: SimulationSettings = {
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

        // 환경별 시뮬레이션 조정
        switch (environment) {
            case 'vercel':
                baseSettings.baseLoad = 0.2; // 낮은 부하
                baseSettings.incidents.probability = 0.01; // 적은 문제
                baseSettings.scaling.enabled = false; // 스케일링 비활성화
                break;
            case 'local':
                baseSettings.baseLoad = 0.4; // 높은 부하
                baseSettings.incidents.probability = 0.05; // 많은 문제 (테스트용)
                break;
        }

        return baseSettings;
    }

    /**
     * 🔧 환경 설정 업데이트
     */
    public updateEnvironmentConfig(newConfig: Partial<CustomEnvironmentConfig>): void {
        this.environmentConfig = {
            ...this.environmentConfig,
            ...newConfig,
            // limits와 optimizations는 병합
            limits: { ...this.environmentConfig.limits, ...newConfig.limits },
            optimizations: { ...this.environmentConfig.optimizations, ...newConfig.optimizations },
        };

        console.log('🔧 환경 설정 업데이트 완료:', this.environmentConfig);
    }

    /**
     * 🎮 시뮬레이션 설정 업데이트
     */
    public updateSimulationSettings(newSettings: Partial<SimulationSettings>): void {
        this.simulationSettings = {
            ...this.simulationSettings,
            ...newSettings,
            // 중첩 객체는 병합
            incidents: { ...this.simulationSettings.incidents, ...newSettings.incidents },
            scaling: { ...this.simulationSettings.scaling, ...newSettings.scaling },
        };

        console.log('🎮 시뮬레이션 설정 업데이트 완료:', this.simulationSettings);
    }

    /**
     * 📋 현재 환경 설정 조회
     */
    public getEnvironmentConfig(): CustomEnvironmentConfig {
        return { ...this.environmentConfig };
    }

    /**
     * 🎮 현재 시뮬레이션 설정 조회
     */
    public getSimulationSettings(): SimulationSettings {
        return { ...this.simulationSettings };
    }

    /**
     * 📊 설정 상태 조회
     */
    public getConfigurationState(): ConfigurationState {
        return {
            environment: detectEnvironment(),
            mode: this.environmentConfig.mode,
            isVercel: this.config.IS_VERCEL,
            interval: this.environmentConfig.optimizations.updateInterval,
            batchSize: this.environmentConfig.optimizations.batchSize,
            features: {
                realMetrics: this.environmentConfig.features.includes('real-metrics'),
                aiPredictions: this.environmentConfig.features.includes('ai-predictions'),
                autoScaling: this.environmentConfig.features.includes('auto-scaling'),
                monitoring: this.environmentConfig.features.includes('monitoring'),
                alerting: this.environmentConfig.features.includes('alerting'),
            },
            limits: this.environmentConfig.limits,
        };
    }

    /**
     * 🔍 플러그인 설정 조회
     */
    public getPluginStatus() {
        return {
            networkTopology: {
                enabled: isPluginEnabled('network-topology'),
                config: isPluginEnabled('network-topology') ? getPluginConfig('network-topology') : null,
            },
            baselineOptimizer: {
                enabled: isPluginEnabled('baseline-optimizer'),
                config: isPluginEnabled('baseline-optimizer') ? getPluginConfig('baseline-optimizer') : null,
            },
            demoScenarios: {
                enabled: isPluginEnabled('demo-scenarios'),
                config: isPluginEnabled('demo-scenarios') ? getPluginConfig('demo-scenarios') : null,
            },
        };
    }

    /**
     * ✅ 설정 검증
     */
    public validateConfiguration(): { valid: boolean; errors: string[] } {
        const errors: string[] = [];

        // 환경 설정 검증
        if (this.environmentConfig.limits.maxServers <= 0) {
            errors.push('maxServers는 0보다 커야 합니다');
        }

        if (this.environmentConfig.limits.maxServers > 100) {
            errors.push('maxServers는 100을 초과할 수 없습니다');
        }

        if (this.environmentConfig.optimizations.updateInterval < 1000) {
            errors.push('updateInterval은 1초(1000ms) 이상이어야 합니다');
        }

        // 시뮬레이션 설정 검증
        if (this.simulationSettings.baseLoad < 0 || this.simulationSettings.baseLoad > 1) {
            errors.push('baseLoad는 0과 1 사이의 값이어야 합니다');
        }

        if (this.simulationSettings.scaling.threshold < 0 || this.simulationSettings.scaling.threshold > 1) {
            errors.push('scaling threshold는 0과 1 사이의 값이어야 합니다');
        }

        // Vercel 환경별 제한 검증
        if (this.config.IS_VERCEL) {
            if (this.environmentConfig.limits.maxServers > 10) {
                errors.push('Vercel 환경에서는 maxServers가 10을 초과할 수 없습니다');
            }

            if (this.environmentConfig.limits.memoryLimit > 1024) {
                errors.push('Vercel 환경에서는 memoryLimit이 1024MB를 초과할 수 없습니다');
            }
        }

        return {
            valid: errors.length === 0,
            errors,
        };
    }

    /**
     * 🚀 환경별 모드 최적화 적용
     */
    public applyModeOptimizations(): void {
        const mode = this.environmentConfig.mode;

        console.log(`🚀 ${mode} 모드 최적화 적용 중...`);

        switch (mode) {
            case 'local':
                this.applyLocalOptimizations();
                break;
            case 'premium':
                this.applyPremiumOptimizations();
                break;
            case 'basic':
                this.applyBasicOptimizations();
                break;
            case 'minimal':
                this.applyMinimalOptimizations();
                break;
        }

        console.log(`✅ ${mode} 모드 최적화 적용 완료`);
    }

    /**
     * 🏠 로컬 환경 최적화
     */
    private applyLocalOptimizations(): void {
        this.updateEnvironmentConfig({
            limits: {
                maxServers: 15,
                maxClusters: 5,
                maxApplications: 8,
                memoryLimit: 4096,
                cpuLimit: 8,
            },
            optimizations: {
                batchSize: 100,
                updateInterval: 5000, // 5초
                cacheSize: 200,
                compressionEnabled: true,
                lazyLoading: false, // 즉시 로딩
            },
        });

        this.updateSimulationSettings({
            baseLoad: 0.4,
            incidents: { probability: 0.05, duration: 180000 }, // 3분
            scaling: { enabled: true, threshold: 0.75, cooldown: 120000 }, // 2분
        });
    }

    /**
     * 💎 프리미엄 환경 최적화
     */
    private applyPremiumOptimizations(): void {
        this.updateEnvironmentConfig({
            limits: {
                maxServers: 10,
                maxClusters: 3,
                maxApplications: 6,
                memoryLimit: 2048,
                cpuLimit: 4,
            },
            optimizations: {
                batchSize: 50,
                updateInterval: 10000, // 10초
                cacheSize: 150,
                compressionEnabled: true,
                lazyLoading: true,
            },
        });
    }

    /**
     * 🎯 기본 환경 최적화
     */
    private applyBasicOptimizations(): void {
        this.updateEnvironmentConfig({
            limits: {
                maxServers: 6,
                maxClusters: 2,
                maxApplications: 4,
                memoryLimit: 1024,
                cpuLimit: 2,
            },
            optimizations: {
                batchSize: 25,
                updateInterval: 15000, // 15초
                cacheSize: 100,
                compressionEnabled: true,
                lazyLoading: true,
            },
        });
    }

    /**
     * 🔧 최소 환경 최적화
     */
    private applyMinimalOptimizations(): void {
        this.updateEnvironmentConfig({
            limits: {
                maxServers: 3,
                maxClusters: 1,
                maxApplications: 2,
                memoryLimit: 512,
                cpuLimit: 1,
            },
            optimizations: {
                batchSize: 10,
                updateInterval: 30000, // 30초
                cacheSize: 50,
                compressionEnabled: true,
                lazyLoading: true,
            },
        });

        this.updateSimulationSettings({
            baseLoad: 0.2,
            incidents: { probability: 0.01, duration: 600000 }, // 10분
            scaling: { enabled: false, threshold: 0.9, cooldown: 300000 }, // 5분
        });
    }

    /**
     * 📊 설정 요약 정보
     */
    public getConfigurationSummary() {
        const validation = this.validateConfiguration();

        return {
            environment: detectEnvironment(),
            mode: this.environmentConfig.mode,
            isValid: validation.valid,
            errors: validation.errors,
            serverLimits: {
                maxServers: this.environmentConfig.limits.maxServers,
                maxClusters: this.environmentConfig.limits.maxClusters,
                maxApplications: this.environmentConfig.limits.maxApplications,
            },
            performance: {
                updateInterval: this.environmentConfig.optimizations.updateInterval,
                batchSize: this.environmentConfig.optimizations.batchSize,
                cacheSize: this.environmentConfig.optimizations.cacheSize,
            },
            simulation: {
                baseLoad: this.simulationSettings.baseLoad,
                scalingEnabled: this.simulationSettings.scaling.enabled,
                incidentProbability: this.simulationSettings.incidents.probability,
            },
            plugins: this.getPluginStatus(),
            lastUpdate: new Date().toISOString(),
        };
    }

    /**
     * 🔄 설정 초기화
     */
    public resetToDefaults(): void {
        this.environmentConfig = this.initializeEnvironmentConfig();
        this.simulationSettings = this.initializeSimulationSettings();
        this.applyModeOptimizations();

        console.log('🔄 설정이 기본값으로 초기화되었습니다');
    }

    /**
     * 🏥 헬스체크
     */
    public async healthCheck() {
        const validation = this.validateConfiguration();

        return {
            status: validation.valid ? 'healthy' : 'warning',
            configValid: validation.valid,
            errors: validation.errors,
            environment: detectEnvironment(),
            mode: this.environmentConfig.mode,
            lastUpdate: new Date().toISOString(),
        };
    }
} 