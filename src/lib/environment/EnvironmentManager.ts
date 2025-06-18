/**
 * 🌍 환경 감지 및 분리 관리자
 * 빌드/런타임/개발환경별 최적화 전략 제공
 */

export type Environment = 'build' | 'development' | 'production' | 'test';
export type Platform = 'vercel' | 'local' | 'render' | 'unknown';

interface EnvironmentConfig {
  // 서버 초기화 설정
  enableMCPServers: boolean;
  enableAIEngines: boolean;
  enableDatabaseConnections: boolean;
  enableRealTimeFeatures: boolean;

  // 성능 설정
  maxMemoryUsage: number; // MB
  maxBuildTime: number; // seconds
  enableCaching: boolean;
  enableLogging: boolean;

  // 기능 플래그
  enableHealthChecks: boolean;
  enableMetricsCollection: boolean;
  enableErrorReporting: boolean;
}

export class EnvironmentManager {
  private static instance: EnvironmentManager;
  private _environment: Environment;
  private _platform: Platform;
  private _config: EnvironmentConfig;

  private constructor() {
    this._environment = this.detectEnvironment();
    this._platform = this.detectPlatform();
    this._config = this.getEnvironmentConfig();
  }

  static getInstance(): EnvironmentManager {
    if (!EnvironmentManager.instance) {
      EnvironmentManager.instance = new EnvironmentManager();
    }
    return EnvironmentManager.instance;
  }

  // 환경 감지
  private detectEnvironment(): Environment {
    // 빌드 타임 감지
    if (process.env.NEXT_PHASE === 'phase-production-build') {
      return 'build';
    }

    // 테스트 환경 감지
    if (process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID) {
      return 'test';
    }

    // 개발/프로덕션 환경
    return process.env.NODE_ENV === 'development'
      ? 'development'
      : 'production';
  }

  // 플랫폼 감지
  private detectPlatform(): Platform {
    if (process.env.VERCEL) return 'vercel';
    if (process.env.RENDER) return 'render';
    if (process.env.NODE_ENV === 'development') return 'local';
    return 'unknown';
  }

  // 환경별 설정
  private getEnvironmentConfig(): EnvironmentConfig {
    const baseConfig: EnvironmentConfig = {
      enableMCPServers: false,
      enableAIEngines: false,
      enableDatabaseConnections: false,
      enableRealTimeFeatures: false,
      maxMemoryUsage: 30,
      maxBuildTime: 15,
      enableCaching: true,
      enableLogging: false,
      enableHealthChecks: false,
      enableMetricsCollection: false,
      enableErrorReporting: false,
    };

    switch (this._environment) {
      case 'build':
        return {
          ...baseConfig,
          enableLogging: true,
          maxMemoryUsage: 50, // 빌드 시 추가 메모리 허용
          maxBuildTime: 30,
        };

      case 'development':
        return {
          ...baseConfig,
          enableMCPServers: true,
          enableAIEngines: true,
          enableDatabaseConnections: true,
          enableRealTimeFeatures: true,
          enableLogging: true,
          enableHealthChecks: true,
          maxMemoryUsage: 100, // 개발 시 더 많은 메모리 허용
        };

      case 'production':
        return {
          ...baseConfig,
          enableMCPServers: true,
          enableAIEngines: true,
          enableDatabaseConnections: true,
          enableRealTimeFeatures: true,
          enableHealthChecks: true,
          enableMetricsCollection: true,
          enableErrorReporting: true,
          maxMemoryUsage: this._platform === 'vercel' ? 40 : 70,
        };

      case 'test':
        return {
          ...baseConfig,
          enableLogging: false,
          maxMemoryUsage: 20,
          maxBuildTime: 10,
        };

      default:
        return baseConfig;
    }
  }

  // Getter 메서드들
  get environment(): Environment {
    return this._environment;
  }
  get platform(): Platform {
    return this._platform;
  }
  get config(): EnvironmentConfig {
    return this._config;
  }

  // 환경별 조건부 실행
  get isBuildTime(): boolean {
    return this._environment === 'build';
  }
  get isDevelopment(): boolean {
    return this._environment === 'development';
  }
  get isProduction(): boolean {
    return this._environment === 'production';
  }
  get isTest(): boolean {
    return this._environment === 'test';
  }
  get isVercel(): boolean {
    return this._platform === 'vercel';
  }

  // 기능 활성화 체크
  shouldInitializeMCP(): boolean {
    return this._config.enableMCPServers;
  }
  shouldInitializeAI(): boolean {
    return this._config.enableAIEngines;
  }
  shouldConnectDatabase(): boolean {
    return this._config.enableDatabaseConnections;
  }
  shouldEnableRealTime(): boolean {
    return this._config.enableRealTimeFeatures;
  }
  shouldEnableHealthChecks(): boolean {
    return this._config.enableHealthChecks;
  }
  shouldCollectMetrics(): boolean {
    return this._config.enableMetricsCollection;
  }
  shouldReportErrors(): boolean {
    return this._config.enableErrorReporting;
  }

  /**
   * 💓 Keep-Alive 스케줄러 시작 허용 여부
   */
  shouldStartKeepAlive(): boolean {
    // 빌드 시에는 Keep-Alive 비활성화
    if (this.isBuildTime) return false;

    // 테스트 환경에서는 Keep-Alive 비활성화
    if (this.isTest) return false;

    // 개발/프로덕션에서만 활성화
    return this.isDevelopment || this.isProduction;
  }

  // 로깅 유틸리티
  log(level: 'info' | 'warn' | 'error', message: string, data?: any): void {
    if (!this._config.enableLogging) return;

    const prefix = `[${this._environment.toUpperCase()}:${this._platform.toUpperCase()}]`;
    const timestamp = new Date().toISOString();

    switch (level) {
      case 'info':
        console.log(`${prefix} ${timestamp} ℹ️ ${message}`, data || '');
        break;
      case 'warn':
        console.warn(`${prefix} ${timestamp} ⚠️ ${message}`, data || '');
        break;
      case 'error':
        console.error(`${prefix} ${timestamp} ❌ ${message}`, data || '');
        break;
    }
  }

  // 환경 정보 출력
  printEnvironmentInfo(): void {
    this.log('info', '🌍 환경 정보', {
      environment: this._environment,
      platform: this._platform,
      config: this._config,
      nodeEnv: process.env.NODE_ENV,
      nextPhase: process.env.NEXT_PHASE,
      vercel: !!process.env.VERCEL,
    });
  }
}

// 전역 인스턴스 내보내기
export const envManager = EnvironmentManager.getInstance();

// 편의 함수들
export const isBuildTime = () => envManager.isBuildTime;
export const isDevelopment = () => envManager.isDevelopment;
export const isProduction = () => envManager.isProduction;
export const isVercel = () => envManager.isVercel;
