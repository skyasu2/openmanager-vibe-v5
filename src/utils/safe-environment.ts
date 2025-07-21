/**
 * 🔐 안전한 환경변수 접근 유틸리티
 *
 * 모든 환경변수 접근을 이 클래스를 통해 수행하여 보안과 일관성 보장
 */

import type {
  SafeEnvironmentAccess,
  EnvironmentValidationResult,
  EnvironmentName,
  SupabaseEnvConfig,
  RedisEnvConfig,
  GoogleAIEnvConfig,
  DeploymentEnvConfig,
  SecurityEnvConfig,
  MonitoringEnvConfig,
  EnvironmentConfig,
} from '@/types/environment';
import { isValidEnvironmentName } from '@/types/environment';

class SafeEnvironmentAccessImpl implements SafeEnvironmentAccess {
  private readonly _isBuildTime: boolean;
  private readonly _isServer: boolean;
  private readonly _isVercel: boolean;

  constructor() {
    this._isBuildTime = this.detectBuildTime();
    this._isServer = typeof window === 'undefined';
    this._isVercel = this.detectVercelEnvironment();
  }

  // 🔍 환경 감지 메서드들
  private detectBuildTime(): boolean {
    // Vercel 런타임에서는 절대 빌드 타임으로 인식하지 않음
    if (process.env.VERCEL === '1' && typeof window === 'undefined') {
      // Vercel 서버사이드 실행 중 - 빌드 타임이 아님
      return false;
    }

    // 실제 빌드 중일 때만 true
    return (
      process.env.npm_lifecycle_event === 'build' ||
      process.env.NEXT_PHASE === 'phase-production-build'
    );
  }

  private detectVercelEnvironment(): boolean {
    return process.env.VERCEL === '1' || !!process.env.VERCEL_ENV;
  }

  // 🛡️ 기본 환경변수 접근 메서드들
  get<T = string>(key: keyof NodeJS.ProcessEnv, defaultValue?: T): T {
    const value = process.env[key];

    if (value === undefined) {
      if (defaultValue !== undefined) {
        return defaultValue;
      }
      throw new Error(
        `Environment variable ${String(key)} is not set and no default value provided`
      );
    }

    return value as T;
  }

  getRequired<T = string>(key: keyof NodeJS.ProcessEnv): T {
    const value = process.env[key];

    if (!value) {
      throw new Error(
        `Required environment variable ${String(key)} is not set`
      );
    }

    return value as T;
  }

  getBoolean(
    key: keyof NodeJS.ProcessEnv,
    defaultValue: boolean = false
  ): boolean {
    const value = process.env[key];

    if (!value) {
      return defaultValue;
    }

    return value.toLowerCase() === 'true' || value === '1';
  }

  getNumber(key: keyof NodeJS.ProcessEnv, defaultValue: number = 0): number {
    const value = process.env[key];

    if (!value) {
      return defaultValue;
    }

    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? defaultValue : parsed;
  }

  getArray(key: keyof NodeJS.ProcessEnv, separator: string = ','): string[] {
    const value = process.env[key];

    if (!value) {
      return [];
    }

    return value
      .split(separator)
      .map(item => item.trim())
      .filter(Boolean);
  }

  validate(keys: (keyof NodeJS.ProcessEnv)[]): EnvironmentValidationResult {
    if (this._isBuildTime) {
      return { valid: false, reason: 'Build time - skipping validation' };
    }

    const missing: string[] = [];
    const errors: string[] = [];
    const warnings: string[] = [];

    for (const key of keys) {
      const value = process.env[key];

      if (!value) {
        missing.push(String(key));
      } else if (value.length === 0) {
        warnings.push(`Environment variable ${String(key)} is empty`);
      }
    }

    return {
      valid: missing.length === 0 && errors.length === 0,
      missing: missing.length > 0 ? missing : undefined,
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined,
      reason: missing.length > 0 ? `Missing: ${missing.join(', ')}` : undefined,
    };
  }

  // 🌟 특화된 환경변수 구성 getter들
  getSupabaseConfig(): SupabaseEnvConfig {
    // 환경변수 직접 확인 (빌드 타임 체크 전에)
    const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const envAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    // 환경변수가 실제로 설정되어 있으면 사용
    if (envUrl && envAnonKey) {
      const serviceRoleKey = this._isServer
        ? this.get('SUPABASE_SERVICE_ROLE_KEY', '')
        : '';
      return {
        url: envUrl,
        anonKey: envAnonKey,
        serviceRoleKey,
        isConfigured: true,
      };
    }

    // 빌드 타임이거나 환경변수가 없는 경우에만 임시값 반환
    if (this._isBuildTime) {
      return {
        url: 'https://temp.supabase.co',
        anonKey: 'temp-anon-key',
        serviceRoleKey: 'temp-service-key',
        isConfigured: false,
      };
    }

    // 런타임이지만 환경변수가 없는 경우
    const url = this.get('NEXT_PUBLIC_SUPABASE_URL', '');
    const anonKey = this.get('NEXT_PUBLIC_SUPABASE_ANON_KEY', '');
    const serviceRoleKey = this._isServer
      ? this.get('SUPABASE_SERVICE_ROLE_KEY', '')
      : '';

    return {
      url,
      anonKey,
      serviceRoleKey,
      isConfigured: !!(url && anonKey),
    };
  }

  getRedisConfig(): RedisEnvConfig {
    if (this._isBuildTime) {
      return {
        url: '',
        token: '',
        isConfigured: false,
      };
    }

    const url =
      this.get('UPSTASH_REDIS_REST_URL', '') || this.get('KV_REST_API_URL', '');
    const token =
      this.get('UPSTASH_REDIS_REST_TOKEN', '') ||
      this.get('KV_REST_API_TOKEN', '');

    return {
      url,
      token,
      isConfigured: !!(url && token),
    };
  }

  getGoogleAIConfig(): GoogleAIEnvConfig {
    if (this._isBuildTime) {
      return {
        apiKey: '',
        enabled: false,
        quotaProtection: true,
        forceMock: false,
        isConfigured: false,
      };
    }

    const apiKey = this.get('GOOGLE_AI_API_KEY', '');
    const enabled = this.getBoolean('GOOGLE_AI_ENABLED', !!apiKey);
    const quotaProtection = this.getBoolean('GOOGLE_AI_QUOTA_PROTECTION', true);
    const forceMock = this.getBoolean('FORCE_MOCK_GOOGLE_AI', false);

    return {
      apiKey,
      enabled,
      quotaProtection,
      forceMock,
      isConfigured: !!apiKey,
    };
  }

  getDeploymentConfig(): DeploymentEnvConfig {
    const nodeEnv = this.get('NODE_ENV', 'development');
    const environment: EnvironmentName = isValidEnvironmentName(nodeEnv)
      ? nodeEnv
      : 'development';

    // 타입 안전성을 위한 명시적 비교
    const isProduction = (environment as string) === 'production';
    const isDevelopment = (environment as string) === 'development';
    const isTest = (environment as string) === 'test';

    return {
      environment,
      isVercel: this._isVercel,
      isProduction,
      isDevelopment,
      isTest,
      appUrl: this.get('NEXT_PUBLIC_APP_URL', 'http://localhost:3000'),
      appName: this.get('NEXT_PUBLIC_APP_NAME', 'OpenManager VIBE'),
      appVersion: this.get('NEXT_PUBLIC_APP_VERSION', '1.0.0'),
    };
  }

  getSecurityConfig(): SecurityEnvConfig {
    if (this._isBuildTime) {
      return {
        adminPassword: '',
        jwtSecret: '',
        encryptionKey: '',
        isConfigured: false,
      };
    }

    const adminPassword = this.get('ADMIN_PASSWORD', '');
    const jwtSecret = this.get('JWT_SECRET', '');
    const encryptionKey = this.get('ENCRYPTION_KEY', '');

    return {
      adminPassword,
      jwtSecret,
      encryptionKey,
      isConfigured: !!(adminPassword && jwtSecret && encryptionKey),
    };
  }

  getMonitoringConfig(): MonitoringEnvConfig {
    const enableLogging = this.getBoolean('ENABLE_LOGGING', true);
    const logLevel = this.get('LOG_LEVEL', 'info') as
      | 'debug'
      | 'info'
      | 'warn'
      | 'error';
    const sentryDsn = this.get('SENTRY_DSN', '');
    const analyticsId = this.get('ANALYTICS_ID', '');

    return {
      enableLogging,
      logLevel,
      sentryDsn,
      analyticsId,
      isConfigured: enableLogging,
    };
  }

  // 🎯 전체 환경변수 구성 반환
  getFullConfig(): EnvironmentConfig {
    return {
      supabase: this.getSupabaseConfig(),
      redis: this.getRedisConfig(),
      googleAI: this.getGoogleAIConfig(),
      deployment: this.getDeploymentConfig(),
      security: this.getSecurityConfig(),
      monitoring: this.getMonitoringConfig(),
    };
  }

  // 🔍 디버깅 및 모니터링 메서드들
  logEnvironmentStatus(): void {
    if (this._isBuildTime) {
      console.log('🔨 Build time - environment status logging skipped');
      return;
    }

    const config = this.getFullConfig();

    console.log('🌍 Environment Configuration Status:');
    console.log(
      `  🚀 Deployment: ${config.deployment.environment} (${config.deployment.isVercel ? 'Vercel' : 'Local'})`
    );
    console.log(
      `  🔐 Supabase: ${config.supabase.isConfigured ? '✅ Configured' : '❌ Not configured'}`
    );
    console.log(
      `  🗄️ Redis: ${config.redis.isConfigured ? '✅ Configured' : '❌ Not configured'}`
    );
    console.log(
      `  🤖 Google AI: ${config.googleAI.isConfigured ? '✅ Configured' : '❌ Not configured'}`
    );
    console.log(
      `  🔒 Security: ${config.security.isConfigured ? '✅ Configured' : '❌ Not configured'}`
    );
    console.log(
      `  📊 Monitoring: ${config.monitoring.isConfigured ? '✅ Configured' : '❌ Not configured'}`
    );
  }

  // 🛡️ 환경변수 보안 체크
  checkSecurityVulnerabilities(): string[] {
    const vulnerabilities: string[] = [];

    if (!this._isBuildTime) {
      // 빈 필수 환경변수 체크
      const requiredVars = [
        'NEXT_PUBLIC_SUPABASE_URL',
        'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      ];
      for (const key of requiredVars) {
        const value = process.env[key];
        if (!value || value.length === 0) {
          vulnerabilities.push(
            `Required environment variable ${key} is missing or empty`
          );
        }
      }

      // 개발 환경에서 프로덕션 키 사용 체크
      const deploymentConfig = this.getDeploymentConfig();
      if (deploymentConfig.isDevelopment) {
        const prodPatterns = ['prod', 'production', 'live'];
        for (const [key, value] of Object.entries(process.env)) {
          if (
            value &&
            prodPatterns.some(pattern => value.toLowerCase().includes(pattern))
          ) {
            vulnerabilities.push(
              `Development environment using production-like value for ${key}`
            );
          }
        }
      }
    }

    return vulnerabilities;
  }

  // 🎨 환경변수 타입 가드들
  isBuildTime(): boolean {
    return this._isBuildTime;
  }

  isServer(): boolean {
    return this._isServer;
  }

  isVercel(): boolean {
    return this._isVercel;
  }

  isProduction(): boolean {
    return this.getDeploymentConfig().isProduction;
  }

  isDevelopment(): boolean {
    return this.getDeploymentConfig().isDevelopment;
  }

  isTest(): boolean {
    return this.getDeploymentConfig().isTest;
  }
}

// 🌟 싱글톤 인스턴스 생성 및 export
export const safeEnv = new SafeEnvironmentAccessImpl();

// 🎯 편의 함수들
export const getSupabaseConfig = () => safeEnv.getSupabaseConfig();
export const getRedisConfig = () => safeEnv.getRedisConfig();
export const getGoogleAIConfig = () => safeEnv.getGoogleAIConfig();
export const getDeploymentConfig = () => safeEnv.getDeploymentConfig();
export const getSecurityConfig = () => safeEnv.getSecurityConfig();
export const getMonitoringConfig = () => safeEnv.getMonitoringConfig();
export const getFullEnvironmentConfig = () => safeEnv.getFullConfig();

// 🔍 디버깅 편의 함수
export const logEnvironmentStatus = () => safeEnv.logEnvironmentStatus();
export const checkEnvironmentSecurity = () =>
  safeEnv.checkSecurityVulnerabilities();

// 🛡️ 타입 가드 편의 함수들
export const isBuildTime = () => safeEnv.isBuildTime();
export const isServer = () => safeEnv.isServer();
export const isVercel = () => safeEnv.isVercel();
export const isProduction = () => safeEnv.isProduction();
export const isDevelopment = () => safeEnv.isDevelopment();
export const isTest = () => safeEnv.isTest();

export { SafeEnvironmentAccessImpl };
