/**
 * ⚙️ 환경 설정 관리자 - 환경별 설정 관리 전담
 *
 * 책임:
 * - 환경 감지 및 설정
 * - 모드별 최적화 적용
 * - 플러그인 설정 관리
 */

import { CustomEnvironmentConfig } from '../types/ServerTypes';
import {
  detectEnvironment,
  env as defaultEnv,
  getDataGeneratorConfig,
  isPluginEnabled,
  getPluginConfig,
  getVercelOptimizedConfig,
} from '@/config/environment';

export class EnvironmentConfigManager {
  private environmentConfig: CustomEnvironmentConfig;
  private dataGeneratorConfig: ReturnType<typeof getDataGeneratorConfig>;
  private vercelConfig = getVercelOptimizedConfig();

  constructor() {
    this.environmentConfig = this.getEnvironmentSpecificConfig();
    this.dataGeneratorConfig = getDataGeneratorConfig();
    this.applyModeOptimizations();
  }

  /**
   * 환경별 특화 설정 생성
   */
  private getEnvironmentSpecificConfig(): CustomEnvironmentConfig {
    const environment = detectEnvironment();

    // 개발 환경별 기본 설정
    const configs: Record<string, Partial<CustomEnvironmentConfig>> = {
      local: {
        serverArchitecture: 'microservices',
        databaseType: 'distributed',
        networkTopology: 'multi-cloud',
        specialWorkload: 'container',
        scalingPolicy: 'auto',
        securityLevel: 'enterprise',
      },
      development: {
        serverArchitecture: 'load-balanced',
        databaseType: 'replica',
        networkTopology: 'dmz',
        specialWorkload: 'standard',
        scalingPolicy: 'manual',
        securityLevel: 'enhanced',
      },
      preview: {
        serverArchitecture: 'master-slave',
        databaseType: 'replica',
        networkTopology: 'simple',
        specialWorkload: 'standard',
        scalingPolicy: 'manual',
        securityLevel: 'basic',
      },
      production: {
        serverArchitecture: 'single',
        databaseType: 'single',
        networkTopology: 'simple',
        specialWorkload: 'standard',
        scalingPolicy: 'manual',
        securityLevel: 'basic',
      },
    };

    const baseConfig =
      configs[environment as unknown as string] || configs.production;

    return {
      serverArchitecture: baseConfig.serverArchitecture || 'single',
      databaseType: baseConfig.databaseType || 'single',
      networkTopology: baseConfig.networkTopology || 'simple',
      specialWorkload: baseConfig.specialWorkload || 'standard',
      scalingPolicy: baseConfig.scalingPolicy || 'manual',
      securityLevel: baseConfig.securityLevel || 'basic',
    };
  }

  /**
   * 모드별 최적화 적용
   */
  private applyModeOptimizations(): void {
    const mode = (this.vercelConfig as any).mode;

    switch (mode) {
      case 'local':
        // 로컬 개발 환경 - 모든 기능 활성화
        this.environmentConfig.serverArchitecture = 'microservices';
        this.environmentConfig.specialWorkload = 'container';
        this.environmentConfig.scalingPolicy = 'auto';
        break;

      case 'premium':
        // 프리미엄 환경 - 고성능 설정
        this.environmentConfig.serverArchitecture = 'load-balanced';
        this.environmentConfig.databaseType = 'distributed';
        this.environmentConfig.scalingPolicy = 'predictive';
        break;

      case 'basic':
        // 기본 환경 - 리소스 절약
        this.environmentConfig.serverArchitecture = 'single';
        this.environmentConfig.databaseType = 'single';
        this.environmentConfig.specialWorkload = 'standard';
        this.environmentConfig.scalingPolicy = 'manual';
        break;

      default:
        // 기본값 유지
        break;
    }
  }

  /**
   * 서버 개수 제한 적용
   */
  getServerLimit(): number {
    const mode = (this.vercelConfig as any).mode;
    const limits = {
      local: 50,
      premium: 25,
      basic: 10,
    };

    return limits[mode] || 10;
  }

  /**
   * 고급 기능 활성화 여부 확인
   */
  getAdvancedFeaturesStatus() {
    return {
      networkTopology: isPluginEnabled('network-topology'),
      baselineOptimizer: isPluginEnabled('baseline-optimizer'),
      demoScenarios: isPluginEnabled('demo-scenarios'),
      config: {
        networkTopology: getPluginConfig('network-topology'),
        baselineOptimizer: getPluginConfig('baseline-optimizer'),
        demoScenarios: getPluginConfig('demo-scenarios'),
      },
    };
  }

  /**
   * 환경 설정 가져오기
   */
  getEnvironmentConfig(): CustomEnvironmentConfig {
    return { ...this.environmentConfig };
  }

  /**
   * 데이터 생성기 설정 가져오기
   */
  getDataGeneratorConfig() {
    return { ...this.dataGeneratorConfig };
  }

  /**
   * Vercel 최적화 설정 가져오기
   */
  getVercelConfig() {
    return { ...this.vercelConfig };
  }

  /**
   * 환경 설정 업데이트
   */
  updateEnvironmentConfig(config: Partial<CustomEnvironmentConfig>): void {
    this.environmentConfig = { ...this.environmentConfig, ...config };
  }

  /**
   * 서버 위치 생성
   */
  getServerLocation(): string {
    const locations = {
      single: ['Seoul-DC-1'],
      'master-slave': ['Seoul-DC-1', 'Busan-DC-1'],
      'load-balanced': ['Seoul-DC-1', 'Busan-DC-1', 'Daegu-DC-1'],
      microservices: [
        'Seoul-DC-1',
        'Busan-DC-1',
        'Daegu-DC-1',
        'Incheon-DC-1',
        'Gwangju-DC-1',
        'Ulsan-DC-1',
      ],
    };

    const availableLocations =
      locations[this.environmentConfig.serverArchitecture] || locations.single;
    return availableLocations[
      Math.floor(Math.random() * availableLocations.length)
    ];
  }

  /**
   * 시뮬레이션 설정 생성
   */
  getSimulationConfig() {
    const architecture = this.environmentConfig.serverArchitecture;

    // 아키텍처별 시뮬레이션 설정
    const configs = {
      single: {
        baseLoad: 0.2,
        peakHours: [9, 10, 11, 14, 15, 16],
        incidents: { probability: 0.01, duration: 300000 },
        scaling: { enabled: false, threshold: 0.8, cooldown: 180000 },
      },
      'master-slave': {
        baseLoad: 0.3,
        peakHours: [9, 10, 11, 14, 15, 16, 17],
        incidents: { probability: 0.015, duration: 240000 },
        scaling: { enabled: false, threshold: 0.8, cooldown: 180000 },
      },
      'load-balanced': {
        baseLoad: 0.4,
        peakHours: [8, 9, 10, 11, 14, 15, 16, 17, 18],
        incidents: { probability: 0.02, duration: 200000 },
        scaling: { enabled: true, threshold: 0.75, cooldown: 120000 },
      },
      microservices: {
        baseLoad: 0.5,
        peakHours: [8, 9, 10, 11, 12, 14, 15, 16, 17, 18, 19],
        incidents: { probability: 0.025, duration: 180000 },
        scaling: { enabled: true, threshold: 0.7, cooldown: 90000 },
      },
    };

    return configs[architecture] || configs.single;
  }

  /**
   * 특수 워크로드별 설정
   */
  getWorkloadConfig() {
    const workload = this.environmentConfig.specialWorkload;

    const configs = {
      standard: {
        cpuMultiplier: 1.0,
        memoryMultiplier: 1.0,
        networkMultiplier: 1.0,
        features: [],
      },
      gpu: {
        cpuMultiplier: 2.0,
        memoryMultiplier: 4.0,
        networkMultiplier: 1.5,
        features: ['gpu_acceleration', 'cuda_support'],
      },
      storage: {
        cpuMultiplier: 0.8,
        memoryMultiplier: 1.2,
        networkMultiplier: 2.0,
        features: ['high_iops', 'redundancy'],
      },
      container: {
        cpuMultiplier: 1.2,
        memoryMultiplier: 1.5,
        networkMultiplier: 1.3,
        features: ['orchestration', 'auto_scaling'],
      },
    };

    return configs[workload] || configs.standard;
  }

  /**
   * 보안 레벨별 설정
   */
  getSecurityConfig() {
    const level = this.environmentConfig.securityLevel;

    const configs = {
      basic: {
        scanInterval: 86400000, // 24시간
        vulnThreshold: 10,
        features: ['basic_monitoring'],
      },
      enhanced: {
        scanInterval: 43200000, // 12시간
        vulnThreshold: 5,
        features: ['basic_monitoring', 'intrusion_detection'],
      },
      enterprise: {
        scanInterval: 21600000, // 6시간
        vulnThreshold: 2,
        features: [
          'basic_monitoring',
          'intrusion_detection',
          'compliance_check',
          'threat_intelligence',
        ],
      },
    };

    return configs[level] || configs.basic;
  }

  /**
   * 환경별 메모리 제한
   */
  getMemoryLimits() {
    const mode = (this.vercelConfig as any).mode;

    const limits = {
      local: {
        maxServers: 100,
        maxCacheSize: 512 * 1024 * 1024, // 512MB
        batchSize: 50,
      },
      premium: {
        maxServers: 50,
        maxCacheSize: 256 * 1024 * 1024, // 256MB
        batchSize: 25,
      },
      basic: {
        maxServers: 20,
        maxCacheSize: 128 * 1024 * 1024, // 128MB
        batchSize: 10,
      },
    };

    return limits[mode] || limits.basic;
  }

  /**
   * 현재 환경 정보 요약
   */
  getEnvironmentSummary() {
    const environment = detectEnvironment();
    const mode = (this.vercelConfig as any).mode;
    const advancedFeatures = this.getAdvancedFeaturesStatus();

    return {
      environment,
      mode,
      config: this.environmentConfig,
      dataGenerator: this.dataGeneratorConfig,
      vercel: this.vercelConfig,
      advancedFeatures,
      limits: this.getMemoryLimits(),
      simulation: this.getSimulationConfig(),
      workload: this.getWorkloadConfig(),
      security: this.getSecurityConfig(),
    };
  }
}
