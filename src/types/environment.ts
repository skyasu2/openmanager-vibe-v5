/**
 * 🌍 환경변수 타입 정의 (중앙집중화)
 * 
 * 모든 환경변수 타입을 여기서 관리하여 일관성 보장
 */

// 🔧 기본 환경변수 타입 확장
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      readonly NODE_ENV: 'development' | 'production' | 'test';
      
      // 🚀 Next.js 및 Vercel 환경변수
      readonly NEXT_PHASE?: string;
      VERCEL?: "1";  // next-auth와의 타입 호환성을 위해 readonly 제거 및 리터럴 타입 사용
      readonly VERCEL_ENV?: 'development' | 'preview' | 'production';
      readonly VERCEL_URL?: string;
      readonly VERCEL_BRANCH_URL?: string;
      readonly VERCEL_PROJECT_PRODUCTION_URL?: string;
      
      // 🔐 Supabase 환경변수
      readonly NEXT_PUBLIC_SUPABASE_URL?: string;
      readonly NEXT_PUBLIC_SUPABASE_ANON_KEY?: string;
      readonly SUPABASE_SERVICE_ROLE_KEY?: string;
      
      // 🗄️ Redis 환경변수
      readonly UPSTASH_REDIS_REST_URL?: string;
      readonly UPSTASH_REDIS_REST_TOKEN?: string;
      readonly KV_REST_API_URL?: string;
      readonly KV_REST_API_TOKEN?: string;
      
      // 🤖 AI 관련 환경변수
      readonly GOOGLE_AI_API_KEY?: string;
      readonly GOOGLE_AI_ENABLED?: string;
      readonly GOOGLE_AI_QUOTA_PROTECTION?: string;
      readonly FORCE_MOCK_GOOGLE_AI?: string;
      
      // 🔧 개발 및 테스트 환경변수
      readonly ENABLE_MOCK_DATA?: string;
      readonly DISABLE_EXTERNAL_CALLS?: string;
      readonly REDIS_CONNECTION_DISABLED?: string;
      readonly UPSTASH_REDIS_DISABLED?: string;
      readonly DISABLE_HEALTH_CHECK?: string;
      readonly HEALTH_CHECK_CONTEXT?: string;
      readonly MCP_SERVER_ENABLED?: string;
      readonly SKIP_ENV_VALIDATION?: string;
      
      // 🌐 애플리케이션 환경변수
      readonly NEXT_PUBLIC_APP_URL?: string;
      readonly NEXT_PUBLIC_APP_NAME?: string;
      readonly NEXT_PUBLIC_APP_VERSION?: string;
      
      // 🔒 보안 관련 환경변수
      readonly ADMIN_PASSWORD?: string;
      readonly JWT_SECRET?: string;
      readonly ENCRYPTION_KEY?: string;
      
      // 📊 모니터링 및 로깅
      readonly ENABLE_LOGGING?: string;
      readonly LOG_LEVEL?: 'debug' | 'info' | 'warn' | 'error';
      readonly SENTRY_DSN?: string;
      readonly ANALYTICS_ID?: string;
      
      // 🛠️ 빌드 및 배포
      readonly npm_lifecycle_event?: string;
      readonly CI?: string;
      readonly GITHUB_ACTIONS?: string;
      
      // 🔍 기타 환경변수 (확장 가능)
      [key: string]: string | undefined;
    }
  }
}

// 📋 환경변수 그룹별 타입 정의
export interface SupabaseEnvConfig {
  url: string;
  anonKey: string;
  serviceRoleKey?: string;
  isConfigured: boolean;
}

export interface RedisEnvConfig {
  url: string;
  token: string;
  isConfigured: boolean;
}

export interface GoogleAIEnvConfig {
  apiKey: string;
  enabled: boolean;
  quotaProtection: boolean;
  forceMock: boolean;
  isConfigured: boolean;
}

export interface DeploymentEnvConfig {
  environment: 'development' | 'production' | 'test';
  isVercel: boolean;
  isProduction: boolean;
  isDevelopment: boolean;
  isTest: boolean;
  appUrl: string;
  appName: string;
  appVersion: string;
}

export interface SecurityEnvConfig {
  adminPassword: string;
  jwtSecret: string;
  encryptionKey: string;
  isConfigured: boolean;
}

export interface MonitoringEnvConfig {
  enableLogging: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  sentryDsn?: string;
  analyticsId?: string;
  isConfigured: boolean;
}

// 📊 전체 환경변수 구성 타입
export interface EnvironmentConfig {
  supabase: SupabaseEnvConfig;
  redis: RedisEnvConfig;
  googleAI: GoogleAIEnvConfig;
  deployment: DeploymentEnvConfig;
  security: SecurityEnvConfig;
  monitoring: MonitoringEnvConfig;
}

// 🎯 환경변수 검증 결과 타입
export interface EnvironmentValidationResult {
  valid: boolean;
  missing?: string[];
  errors?: string[];
  warnings?: string[];
  reason?: string;
}

// 🔧 Mock 환경변수 설정 타입
export interface MockEnvironmentConfig {
  ENABLE_MOCK_DATA?: boolean;
  DISABLE_EXTERNAL_CALLS?: boolean;
  REDIS_CONNECTION_DISABLED?: boolean;
  UPSTASH_REDIS_DISABLED?: boolean;
  DISABLE_HEALTH_CHECK?: boolean;
  HEALTH_CHECK_CONTEXT?: boolean;
  GOOGLE_AI_QUOTA_PROTECTION?: boolean;
  FORCE_MOCK_GOOGLE_AI?: boolean;
  MCP_SERVER_ENABLED?: boolean;
}

// 🌟 환경변수 유틸리티 타입들
export type EnvironmentName = 'development' | 'production' | 'test';
export type DeploymentPlatform = 'local' | 'vercel' | 'docker' | 'other';
export type ConfigurationStatus = 'configured' | 'partial' | 'missing' | 'invalid';

// 🎨 환경변수 접근 패턴 타입
export interface SafeEnvironmentAccess {
  get<T = string>(key: keyof NodeJS.ProcessEnv, defaultValue?: T): T;
  getRequired<T = string>(key: keyof NodeJS.ProcessEnv): T;
  getBoolean(key: keyof NodeJS.ProcessEnv, defaultValue?: boolean): boolean;
  getNumber(key: keyof NodeJS.ProcessEnv, defaultValue?: number): number;
  getArray(key: keyof NodeJS.ProcessEnv, separator?: string): string[];
  validate(keys: (keyof NodeJS.ProcessEnv)[]): EnvironmentValidationResult;
}

// 🛡️ 타입 가드 함수들
export function isValidEnvironmentName(env: string): env is EnvironmentName {
  return ['development', 'production', 'test'].includes(env);
}

export function isValidDeploymentPlatform(platform: string): platform is DeploymentPlatform {
  return ['local', 'vercel', 'docker', 'other'].includes(platform);
}

export function isValidConfigurationStatus(status: string): status is ConfigurationStatus {
  return ['configured', 'partial', 'missing', 'invalid'].includes(status);
}

// Export the global ProcessEnv interface for use in other files
export {};