/**
 * 🔧 환경 설정 관리자 v1.0
 * 
 * 책임:
 * - 환경별 서버 아키텍처 설정
 * - 모드 최적화 적용
 * - 플러그인 설정 관리
 */

import type { CustomEnvironmentConfig } from '@/types/data-generator';
import {
    detectEnvironment,
    getDataGeneratorConfig,
    isPluginEnabled,
    getPluginConfig,
    getVercelOptimizedConfig
} from '@/config/environment';

export class EnvironmentConfigManager {
    private environmentConfig: CustomEnvironmentConfig;
    private dataGeneratorConfig: ReturnType<typeof getDataGeneratorConfig>;

    constructor() {
        this.dataGeneratorConfig = getDataGeneratorConfig();
        this.environmentConfig = this.getEnvironmentSpecificConfig();
        this.applyModeOptimizations();
    }

    /**
     * 환경별 설정 가져오기
     */
    private getEnvironmentSpecificConfig(): CustomEnvironmentConfig {
        const environment = detectEnvironment();

        console.log(`🌍 환경 감지: ${environment.name} (${environment.tier})`);

        const configs: Record<string, CustomEnvironmentConfig> = {
            // 로컬 개발 환경
            local: {
                serverArchitecture: 'load-balanced',
                databaseType: 'replica',
                networkTopology: 'hybrid',
                specialWorkload: 'standard',
                scalingPolicy: 'auto',
                securityLevel: 'enhanced',
            },

            // Vercel 프로덕션
            vercel: {
                serverArchitecture: 'microservices',
                databaseType: 'distributed',
                networkTopology: 'multi-cloud',
                specialWorkload: 'container',
                scalingPolicy: 'predictive',
                securityLevel: 'enterprise',
            },

            // 일반 클라우드
            cloud: {
                serverArchitecture: 'load-balanced',
                databaseType: 'sharded',
                networkTopology: 'multi-cloud',
                specialWorkload: 'standard',
                scalingPolicy: 'auto',
                securityLevel: 'enhanced',
            },

            // 엣지 환경
            edge: {
                serverArchitecture: 'single',
                databaseType: 'single',
                networkTopology: 'simple',
                specialWorkload: 'standard',
                scalingPolicy: 'manual',
                securityLevel: 'basic',
            },
        };

        return configs[environment.name] || configs.local;
    }



    /**
     * 환경 설정 반환
     */
    getEnvironmentConfig(): CustomEnvironmentConfig {
        return { ...this.environmentConfig };
    }

    /**
     * 간단한 설정 반환 (별칭)
     */
    getConfig(): CustomEnvironmentConfig {
        return this.getEnvironmentConfig();
    }

    /**
     * 모드 최적화 공개 메서드
     */
    public applyModeOptimizations(): void {
        // 내부 private 메서드 로직 재구현
        const mode = this.dataGeneratorConfig.mode;
        console.log(`⚡ ${mode.toUpperCase()} 모드 최적화 적용 중...`);

        switch (mode) {
            case 'DEVELOPMENT':
                this.environmentConfig.serverArchitecture = 'load-balanced';
                this.environmentConfig.scalingPolicy = 'auto';
                break;

            case 'PREMIUM':
                this.environmentConfig.serverArchitecture = 'microservices';
                this.environmentConfig.databaseType = 'distributed';
                this.environmentConfig.scalingPolicy = 'predictive';
                break;

            case 'BASIC':
                this.environmentConfig.serverArchitecture = 'single';
                this.environmentConfig.databaseType = 'single';
                this.environmentConfig.scalingPolicy = 'manual';
                break;
        }

        console.log(`✅ ${mode} 모드 최적화 적용 완료`);
    }

    /**
     * 데이터 생성기 설정 반환
     */
    getDataGeneratorConfig() {
        return this.dataGeneratorConfig;
    }

    /**
     * 환경 설정 업데이트
     */
    updateEnvironmentConfig(config: Partial<CustomEnvironmentConfig>): void {
        this.environmentConfig = { ...this.environmentConfig, ...config };
        console.log(`🔄 환경 설정 업데이트:`, config);
    }

    /**
     * 플러그인 활성화 여부 확인
     */
    isPluginEnabled(pluginName: string): boolean {
        return isPluginEnabled(pluginName);
    }

    /**
     * 플러그인 설정 가져오기
     */
    getPluginConfig(pluginName: string): any {
        return getPluginConfig(pluginName);
    }

    /**
     * 서버 수 제한 가져오기
     */
    getServerCountLimit(): number {
        const config = getVercelOptimizedConfig();
        return config.maxServers || 20;
    }

    /**
     * 갱신 간격 가져오기
     */
    getUpdateInterval(): number {
        return this.dataGeneratorConfig.updateInterval;
    }

    /**
     * 환경별 서버 생성 전략
     */
    getServerGenerationStrategy(): {
        maxServers: number;
        architectureType: CustomEnvironmentConfig['serverArchitecture'];
        includeAdvancedFeatures: boolean;
    } {
        const environment = detectEnvironment();

        const strategies = {
            local: {
                maxServers: 30,
                architectureType: this.environmentConfig.serverArchitecture,
                includeAdvancedFeatures: true,
            },
            vercel: {
                maxServers: 15,
                architectureType: 'microservices' as const,
                includeAdvancedFeatures: false,
            },
            cloud: {
                maxServers: 50,
                architectureType: this.environmentConfig.serverArchitecture,
                includeAdvancedFeatures: true,
            },
            edge: {
                maxServers: 5,
                architectureType: 'single' as const,
                includeAdvancedFeatures: false,
            },
        };

        return strategies[environment.name] || strategies.local;
    }

    /**
     * 고급 기능 활성화 상태
     */
    getAdvancedFeaturesStatus() {
        return {
            networkTopology: isPluginEnabled('networkTopology'),
            demoScenarios: isPluginEnabled('demoScenarios'),
            baselineOptimization: isPluginEnabled('baselineOptimization'),
            maxNodes: isPluginEnabled('maxNodes'),
            autoRotate: isPluginEnabled('autoRotate'),
        };
    }

    /**
     * 환경 정보 요약
     */
    getEnvironmentSummary() {
        const environment = detectEnvironment();
        const strategy = this.getServerGenerationStrategy();
        const features = this.getAdvancedFeaturesStatus();

        return {
            environment: environment.name,
            tier: environment.tier,
            mode: this.dataGeneratorConfig.mode,
            config: this.environmentConfig,
            strategy,
            features,
            limits: {
                maxServers: strategy.maxServers,
                updateInterval: this.getUpdateInterval(),
            },
        };
    }
} 