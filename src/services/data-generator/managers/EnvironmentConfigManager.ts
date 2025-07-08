/**
 * ⚙️ 환경 설정 관리자 - 환경별 설정 관리 전담
 *
 * 책임:
 * - 환경 감지 및 설정
 * - 모드별 최적화 적용
 * - 플러그인 설정 관리
 */

import {
  detectEnvironment,
  getDataGeneratorConfig,
  getVercelOptimizedConfig,
} from '@/config/environment';
import { CustomEnvironmentConfig } from '@/types/data-generator';

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
   * 🌐 환경별 설정 반환
   */
  private getEnvironmentSpecificConfig(): CustomEnvironmentConfig {
    const env = detectEnvironment();

    // 🚫 Vercel 환경: 목업 데이터 생성 완전 비활성화
    if (env.IS_VERCEL) {
      console.log('🚫 Vercel 환경: 목업 데이터 생성 시스템 비활성화');
      return {
        serverArchitecture: 'single',
        databaseType: 'single',
        networkTopology: 'simple',
        specialWorkload: 'standard',
        scalingPolicy: 'manual',
        securityLevel: 'basic',
        mode: 'gcp-real-data',
        enableMockData: false,
        enableRealtime: false,
        maxServers: 0,
        updateInterval: 0,
        cacheEnabled: false,
        performanceMode: 'minimal',
        features: {
          networkTopology: false,
          demoScenarios: false,
          baselineOptimization: false,
          autoRotate: false,
        },
      };
    }

    // 🏠 로컬 환경: 목업 데이터 생성 활성화
    return {
      serverArchitecture: 'load-balanced',
      databaseType: 'replica',
      networkTopology: 'multi-cloud',
      specialWorkload: 'vm',
      scalingPolicy: 'auto',
      securityLevel: 'enhanced',
      mode: env.IS_DEVELOPMENT ? 'development' : 'production',
      enableMockData: true,
      enableRealtime: this.dataGeneratorConfig.enabled,
      maxServers: this.dataGeneratorConfig.maxServers,
      updateInterval: this.dataGeneratorConfig.updateInterval,
      cacheEnabled: true,
      performanceMode: env.IS_DEVELOPMENT ? 'development' : 'production',
      features: this.dataGeneratorConfig.features,
    };
  }

  /**
   * ⚡ 모드별 최적화 적용
   */
  private applyModeOptimizations(): void {
    const env = detectEnvironment();

    if (env.IS_VERCEL) {
      // Vercel 환경: 모든 목업 기능 비활성화
      this.environmentConfig.enableMockData = false;
      this.environmentConfig.enableRealtime = false;
      this.environmentConfig.maxServers = 0;
      this.environmentConfig.updateInterval = 0;

      console.log('🚫 Vercel 최적화: 모든 목업 데이터 생성 기능 비활성화');
    } else {
      // 로컬 환경: 기존 최적화 적용
      // 🔧 안전한 접근 - emergency 속성이 없을 수 있음
      const emergency = (this.vercelConfig as any).emergency;
      if (emergency?.throttle) {
        this.environmentConfig.updateInterval = Math.max(
          this.environmentConfig.updateInterval || 30000,
          60000 // 최소 1분 간격
        );
      }

      console.log('🏠 로컬 최적화: 목업 데이터 생성 기능 활성화');
    }
  }

  /**
   * 📊 현재 환경 설정 반환
   */
  getConfig(): CustomEnvironmentConfig {
    return { ...this.environmentConfig };
  }

  /**
   * 🔧 설정 업데이트
   */
  updateConfig(updates: Partial<CustomEnvironmentConfig>): void {
    const env = detectEnvironment();

    // Vercel 환경에서는 목업 관련 설정 변경 금지
    if (env.IS_VERCEL) {
      const allowedUpdates = { ...updates };
      delete allowedUpdates.enableMockData;
      delete allowedUpdates.enableRealtime;
      delete allowedUpdates.maxServers;

      this.environmentConfig = {
        ...this.environmentConfig,
        ...allowedUpdates,
      };

      console.log('🚫 Vercel 환경: 목업 관련 설정 변경 차단');
    } else {
      this.environmentConfig = {
        ...this.environmentConfig,
        ...updates,
      };

      console.log('🏠 로컬 환경: 설정 업데이트 완료');
    }
  }

  /**
   * 🌐 GCP 실제 데이터 사용 여부 확인
   */
  shouldUseGCPRealData(): boolean {
    const env = detectEnvironment();
    return env.IS_VERCEL;
  }

  /**
   * 🏠 목업 데이터 사용 여부 확인
   */
  shouldUseMockData(): boolean {
    const env = detectEnvironment();
    return !env.IS_VERCEL && (this.environmentConfig.enableMockData ?? false);
  }

  /**
   * 📋 환경 정보 요약
   */
  getEnvironmentSummary() {
    const env = detectEnvironment();

    return {
      environment: env.IS_VERCEL ? 'vercel' : 'local',
      dataSource: env.IS_VERCEL ? 'gcp-real-data' : 'mock-data',
      mockDataEnabled: this.environmentConfig.enableMockData,
      realtimeEnabled: this.environmentConfig.enableRealtime,
      maxServers: this.environmentConfig.maxServers,
      updateInterval: this.environmentConfig.updateInterval,
      performanceMode: this.environmentConfig.performanceMode,
    };
  }
}
