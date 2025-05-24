import { z } from 'zod'

// 개발 환경에서는 더미 값도 허용하도록 설정
const isDevelopment = process.env.NODE_ENV === 'development'

const EnvironmentSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
  NEXT_PUBLIC_SUPABASE_URL: isDevelopment 
    ? z.string().default('https://dummy-project.supabase.co')
    : z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).default('dummy_anon_key'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).default('dummy_service_key'),
  UPSTASH_REDIS_REST_URL: isDevelopment
    ? z.string().default('https://dummy-redis.upstash.io')
    : z.string().url(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1).default('dummy_redis_token'),
})

function validateEnvironment() {
  try {
    const parsed = EnvironmentSchema.parse({
      NODE_ENV: process.env.NODE_ENV || 'development',
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dummy-project.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dummy_anon_key',
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || 'dummy_service_key',
      UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL || 'https://dummy-redis.upstash.io',
      UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN || 'dummy_redis_token',
    })
    
    if (isDevelopment) {
      console.log('🔧 Development mode: Using fallback values for missing environment variables')
    }
    
    return parsed
  } catch (error) {
    console.error('Environment validation failed:', error)
    if (isDevelopment) {
      console.warn('⚠️ Using fallback values for development')
      return {
        NODE_ENV: 'development' as const,
        NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
        NEXT_PUBLIC_SUPABASE_URL: 'https://dummy-project.supabase.co',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: 'dummy_anon_key',
        SUPABASE_SERVICE_ROLE_KEY: 'dummy_service_key',
        UPSTASH_REDIS_REST_URL: 'https://dummy-redis.upstash.io',
        UPSTASH_REDIS_REST_TOKEN: 'dummy_redis_token',
      }
    }
    throw new Error('Invalid environment configuration')
  }
}

export const env = validateEnvironment() 