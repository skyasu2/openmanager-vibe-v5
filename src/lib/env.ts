import { z } from 'zod';

const EnvironmentSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  NEXT_PUBLIC_APP_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1).optional(),
  KV_REST_API_URL: z.string().url().optional(),
  KV_REST_API_TOKEN: z.string().min(1).optional(),
});

// 빌드 타임 체크 함수 (더 강화)
function isBuildTime() {
  return (
    process.env.NODE_ENV === undefined ||
    process.env.npm_lifecycle_event === 'build' ||
    process.env.SKIP_ENV_VALIDATION === 'true' ||
    (typeof window === 'undefined' && process.env.VERCEL_ENV === undefined)
  );
}

// 안전한 기본 환경변수 반환
function getDefaultEnvironment() {
  return {
    NODE_ENV:
      (process.env.NODE_ENV as 'development' | 'production' | 'test') ||
      'development',
    NEXT_PUBLIC_APP_URL:
      process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    NEXT_PUBLIC_SUPABASE_ANON_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    UPSTASH_REDIS_REST_URL:
      process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL || '',
    UPSTASH_REDIS_REST_TOKEN:
      process.env.UPSTASH_REDIS_REST_TOKEN ||
      process.env.KV_REST_API_TOKEN ||
      '',
    KV_REST_API_URL: process.env.KV_REST_API_URL || '',
    KV_REST_API_TOKEN: process.env.KV_REST_API_TOKEN || '',
  };
}

function validateEnvironment() {
  // 빌드 타임 또는 환경변수 검증 스킵 시
  if (isBuildTime() || process.env.SKIP_ENV_VALIDATION === 'true') {
    console.log('🔨 빌드 타임: 환경변수 검증 건너뜀');
    return getDefaultEnvironment();
  }

  try {
    // 필수 환경변수가 하나라도 없으면 기본값 반환 (에러 대신)
    const requiredVars = ['NEXT_PUBLIC_APP_URL'];
    const hasMissing = requiredVars.some(varName => !process.env[varName]);

    if (hasMissing) {
      console.log('⚠️ 일부 환경변수가 누락됨, 기본값 사용');
      return getDefaultEnvironment();
    }

    const parsed = EnvironmentSchema.parse({
      NODE_ENV: process.env.NODE_ENV || 'development',
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
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
      'SUPABASE_SERVICE_ROLE_KEY',
    ];

    // Redis는 KV 또는 UPSTASH 중 하나만 있으면 됨
    const hasRedis =
      process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
    const hasRedisToken =
      process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

    const missing = requiredVars.filter(varName => !process.env[varName]);

    if (missing.length > 0 || !hasRedis || !hasRedisToken) {
      const allMissing = [...missing];
      if (!hasRedis)
        allMissing.push('UPSTASH_REDIS_REST_URL or KV_REST_API_URL');
      if (!hasRedisToken)
        allMissing.push('UPSTASH_REDIS_REST_TOKEN or KV_REST_API_TOKEN');

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

// 안전한 환경변수 접근 함수들
export function getSupabaseConfig() {
  return {
    url: env.NEXT_PUBLIC_SUPABASE_URL || '',
    anonKey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY || '',
    isConfigured: !!(
      env.NEXT_PUBLIC_SUPABASE_URL && env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ),
  };
}

export function getRedisConfig() {
  return {
    url: env.UPSTASH_REDIS_REST_URL || env.KV_REST_API_URL || '',
    token: env.UPSTASH_REDIS_REST_TOKEN || env.KV_REST_API_TOKEN || '',
    isConfigured: !!(
      (env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN) ||
      (env.KV_REST_API_URL && env.KV_REST_API_TOKEN)
    ),
  };
}
