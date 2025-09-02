import { safeEnv } from '../utils/safe-environment';
import { z } from 'zod';

const EnvironmentSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  NEXT_PUBLIC_APP_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
  // SUPABASE_SERVICE_ROLE_KEY removed - use env-server.ts for server-only env vars
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1).optional(),
  KV_REST_API_URL: z.string().url().optional(),
  KV_REST_API_TOKEN: z.string().min(1).optional(),
});

// 🔄 레거시 호환성: 기존 isBuildTime 함수 (새로운 시스템으로 위임)
function isBuildTime() {
  return safeEnv.isBuildTime();
}

// 🔄 레거시 호환성: 기존 getDefaultEnvironment 함수 (새로운 시스템으로 위임)
function getDefaultEnvironment() {
  const deploymentConfig = safeEnv.getDeploymentConfig();
  const supabaseConfig = safeEnv.getSupabaseConfig();
  // Redis 제거됨 - 메모리 최적화

  return {
    NODE_ENV: deploymentConfig.environment,
    NEXT_PUBLIC_APP_URL: deploymentConfig.appUrl,
    NEXT_PUBLIC_SUPABASE_URL: supabaseConfig.url,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: supabaseConfig.anonKey,
    // SUPABASE_SERVICE_ROLE_KEY removed - use env-server.ts for server-only env vars
    // Redis 제거됨 - 메모리 최적화
    UPSTASH_REDIS_REST_URL: '',
    UPSTASH_REDIS_REST_TOKEN: '',
    KV_REST_API_URL: '',
    KV_REST_API_TOKEN: '',
  };
}

function validateEnvironment() {
  // 빌드 타임 또는 환경변수 검증 스킵 시
  if (isBuildTime() || process.env.SKIP_ENV_VALIDATION === 'true') {
    console.log('🔨 빌드 타임: 환경변수 검증 건너뜀');
    return getDefaultEnvironment();
  }

  try {
    // 개발 환경에서는 NEXT_PUBLIC_APP_URL이 없어도 기본값으로 진행
    const requiredVars = ['NEXT_PUBLIC_APP_URL'];
    const hasMissing = requiredVars.some((varName) => !process.env[varName]);

    if (hasMissing) {
      const nodeEnv = process.env.NODE_ENV || 'development';
      if (nodeEnv === 'development') {
        console.log('🔧 개발 환경: 일부 환경변수 누락, 기본값으로 진행');
      } else {
        console.log(
          'ℹ️ 선택적 환경변수가 설정되지 않음 (Redis, AI 등) - 핵심 기능은 정상 작동'
        );
      }
      return getDefaultEnvironment();
    }

    const parsed = EnvironmentSchema.parse({
      NODE_ENV: process.env.NODE_ENV || 'development',
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      // SUPABASE_SERVICE_ROLE_KEY removed - use env-server.ts for server-only env vars
      UPSTASH_REDIS_REST_URL:
        process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL,
      UPSTASH_REDIS_REST_TOKEN:
        process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN,
      KV_REST_API_URL: process.env.KV_REST_API_URL,
      KV_REST_API_TOKEN: process.env.KV_REST_API_TOKEN,
    });

    return parsed;
  } catch (error) {
    // 에러 발생 시에도 기본값 반환 (빌드 중단 방지)
    console.warn(
      '⚠️ 환경변수 검증 실패, 기본값 사용:',
      error instanceof Error ? error.message : 'Unknown error'
    );
    return getDefaultEnvironment();
  }
}

export const env = validateEnvironment();

// 런타임 환경변수 검증 함수 (API에서 사용) - 안전한 버전
export function validateRuntimeEnvironment() {
  // 빌드 타임에는 항상 유효하지 않다고 반환
  if (isBuildTime() || process.env.SKIP_ENV_VALIDATION === 'true') {
    return { valid: false, reason: 'Build time - skipping validation' };
  }

  try {
    const requiredVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      // SUPABASE_SERVICE_ROLE_KEY removed - checked in server-only code
    ];

    // Redis 제거됨 - 메모리 최적화

    const missing = requiredVars.filter((varName) => !process.env[varName]);

    if (missing.length > 0) {
      const allMissing = [...missing];

      return {
        valid: false,
        missing: allMissing,
        reason: `Missing environment variables: ${allMissing.join(', ')}`,
      };
    }

    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      reason: `Environment validation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

// 🔄 레거시 호환성: 기존 getSupabaseConfig 함수 (새로운 시스템으로 위임)
export function getSupabaseConfig() {
  return safeEnv.getSupabaseConfig();
}

// 🔄 레거시 호환성: Redis 제거됨
export function getRedisConfig() {
  return { isConfigured: false, url: '', token: '' };

  // Redis 제거됨 - 메모리 최적화
}

// 🌟 새로운 환경변수 시스템으로의 마이그레이션을 위한 추가 export
export {
  checkEnvironmentSecurity,
  getDeploymentConfig,
  getFullEnvironmentConfig,
  getGoogleAIConfig,
  getMonitoringConfig,
  getSecurityConfig,
  getSupabaseConfig as getSupabaseConfigNew,
  isBuildTime as isBuildTimeNew,
  isDevelopment,
  isProduction,
  isServer,
  isTest,
  isVercel,
  logEnvironmentStatus,
  safeEnv,
} from '../utils/safe-environment';

// 🎯 타입 재export
export type {
  DeploymentEnvConfig,
  EnvironmentConfig,
  EnvironmentValidationResult,
  GoogleAIEnvConfig,
  MonitoringEnvConfig,
  SafeEnvironmentAccess,
  SecurityEnvConfig,
  SupabaseEnvConfig,
} from '../types/environment';
