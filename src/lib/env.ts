import { z } from 'zod'

const EnvironmentSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  NEXT_PUBLIC_APP_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  UPSTASH_REDIS_REST_URL: z.string().url(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1),
})

// 빌드 타임 체크 함수
function isBuildTime() {
  return process.env.NODE_ENV === undefined || process.env.npm_lifecycle_event === 'build'
}

function validateEnvironment() {
  // 빌드 타임에는 환경변수 검증 건너뛰기
  if (isBuildTime()) {
    console.log('🔨 빌드 타임: 환경변수 검증 건너뜀')
    return {
      NODE_ENV: process.env.NODE_ENV || 'development',
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
      UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL || '',
      UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN || '',
    }
  }

  try {
    const parsed = EnvironmentSchema.parse({
      NODE_ENV: process.env.NODE_ENV || 'development',
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
      UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
      UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
    
    return parsed
  } catch (error) {
    console.error('❌ 환경변수 설정이 필요합니다:')
    console.error('NEXT_PUBLIC_APP_URL - 애플리케이션 URL')
    console.error('NEXT_PUBLIC_SUPABASE_URL - Supabase 프로젝트 URL')
    console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY - Supabase 익명 키')
    console.error('SUPABASE_SERVICE_ROLE_KEY - Supabase 서비스 역할 키')
    console.error('UPSTASH_REDIS_REST_URL - Upstash Redis URL')
    console.error('UPSTASH_REDIS_REST_TOKEN - Upstash Redis 토큰')
    console.error('')
    console.error('📋 .env.local 파일을 생성하고 위 환경변수들을 설정해주세요.')
    throw new Error('필수 환경변수가 설정되지 않았습니다')
  }
}

export const env = validateEnvironment()

// 런타임 환경변수 검증 함수 (API에서 사용)
export function validateRuntimeEnvironment() {
  if (isBuildTime()) {
    return { valid: false, reason: 'Build time - skipping validation' }
  }
  
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY', 
    'SUPABASE_SERVICE_ROLE_KEY',
    'UPSTASH_REDIS_REST_URL',
    'UPSTASH_REDIS_REST_TOKEN'
  ]
  
  const missing = requiredVars.filter(varName => !process.env[varName])
  
  if (missing.length > 0) {
    return { 
      valid: false, 
      missing,
      reason: `Missing environment variables: ${missing.join(', ')}`
    }
  }
  
  return { valid: true }
} 