/**
 * 개선된 환경변수 검증 시스템
 * 타입 안전성 유지하면서 빌드/런타임 분리
 */

import { z } from 'zod';

// 환경변수 스키마 정의
const EnvironmentSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1).optional(),
  CRON_SECRET: z.string().optional(),
});

// 런타임 필수 환경변수
const RUNTIME_REQUIRED = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'UPSTASH_REDIS_REST_URL',
  'UPSTASH_REDIS_REST_TOKEN',
] as const;

// 컨텍스트 감지
export function getExecutionContext() {
  return {
    isBuild: process.env.npm_lifecycle_event === 'build',
    isServer: typeof window === 'undefined' || process.env.NODE_ENV === 'test',
    isProduction: process.env.NODE_ENV === 'production',
    isVercel: Boolean(process.env.VERCEL),
    isCron: Boolean(process.env.VERCEL_CRON_ID),
  };
}

// 환경변수 타입 (항상 사용 가능)
export type Environment = z.infer<typeof EnvironmentSchema>;

// 안전한 환경변수 객체 (빌드 시에도 사용 가능)
export const env: Environment = (() => {
  const context = getExecutionContext();

  // 기본 환경변수 파싱 (항상 성공)
  const baseEnv = EnvironmentSchema.parse({
    NODE_ENV: process.env.NODE_ENV || 'development',
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
    CRON_SECRET: process.env.CRON_SECRET,
  });

  // 빌드 시에는 검증 없이 반환
  if (context.isBuild) {
    console.log('🔨 빌드 컨텍스트: 환경변수 검증 건너뜀');
    return baseEnv;
  }

  return baseEnv;
})();

// 런타임 환경변수 검증 함수
export function validateRuntimeEnvironment(): {
  isValid: boolean;
  missing: string[];
  errors: string[];
  canUseSupabase: boolean;
  canUseRedis: boolean;
} {
  const context = getExecutionContext();

  // 빌드 시에는 항상 유효
  if (context.isBuild) {
    return {
      isValid: true,
      missing: [],
      errors: [],
      canUseSupabase: false,
      canUseRedis: false,
    };
  }

  const missing: string[] = [];
  const errors: string[] = [];

  // 필수 환경변수 체크
  for (const key of RUNTIME_REQUIRED) {
    if (!process.env[key] || process.env[key]?.trim() === '') {
      missing.push(key);
    }
  }

  // URL 형식 검증
  try {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
      new URL(process.env.NEXT_PUBLIC_SUPABASE_URL);
    }
  } catch {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
      errors.push('NEXT_PUBLIC_SUPABASE_URL은 유효한 URL이어야 합니다');
    }
  }

  try {
    if (process.env.UPSTASH_REDIS_REST_URL) {
      new URL(process.env.UPSTASH_REDIS_REST_URL);
    }
  } catch {
    if (process.env.UPSTASH_REDIS_REST_URL) {
      errors.push('UPSTASH_REDIS_REST_URL은 유효한 URL이어야 합니다');
    }
  }

  // 서비스별 사용 가능성 체크
  const canUseSupabase = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() &&
      process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
  );

  const canUseRedis = Boolean(
    process.env.UPSTASH_REDIS_REST_URL?.trim() &&
      process.env.UPSTASH_REDIS_REST_TOKEN?.trim()
  );

  return {
    isValid: missing.length === 0 && errors.length === 0,
    missing,
    errors,
    canUseSupabase,
    canUseRedis,
  };
}

// API 핸들러에서 사용할 환경변수 검증 미들웨어
export function requireEnvironmentVariables(required: (keyof Environment)[]) {
  return function middleware() {
    const context = getExecutionContext();

    if (context.isBuild) {
      return { success: true };
    }

    const missingVars = required.filter(key => !process.env[key as string]);

    if (missingVars.length > 0) {
      return {
        success: false,
        error: `Missing required environment variables: ${missingVars.join(', ')}`,
        missing: missingVars,
      };
    }

    return { success: true };
  };
}

// 개발용 환경변수 상태 출력
export function logEnvironmentStatus() {
  const context = getExecutionContext();
  const validation = validateRuntimeEnvironment();

  console.log('🔍 환경변수 상태:');
  console.log(`  컨텍스트: ${JSON.stringify(context, null, 2)}`);
  console.log(`  검증 결과: ${JSON.stringify(validation, null, 2)}`);

  if (validation.missing.length > 0) {
    console.warn(`  ⚠️ 누락된 환경변수: ${validation.missing.join(', ')}`);
  }

  if (validation.errors.length > 0) {
    console.error(`❌ 검증 에러: ${validation.errors.join(', ')}`);
  }
}
