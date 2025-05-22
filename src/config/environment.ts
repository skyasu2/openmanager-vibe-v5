// 환경 변수에 안전하게 접근하기 위한 도우미 함수
function getEnv(key: string, defaultValue?: string): string {
  const value = process.env[key] || defaultValue
  
  if (!value) {
    throw new Error(`환경 변수 ${key}가 설정되지 않았습니다.`)
  }
  
  return value
}

// 중요 환경 변수들
export const env = {
  // 앱 설정
  NODE_ENV: getEnv('NODE_ENV', 'development'),
  APP_URL: getEnv('NEXT_PUBLIC_APP_URL', 'http://localhost:3000'),
  
  // Supabase
  SUPABASE_URL: getEnv('NEXT_PUBLIC_SUPABASE_URL'),
  SUPABASE_ANON_KEY: getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
  SUPABASE_SERVICE_ROLE_KEY: getEnv('SUPABASE_SERVICE_ROLE_KEY'),
  
  // Upstash Redis
  REDIS_URL: getEnv('UPSTASH_REDIS_REST_URL'),
  REDIS_TOKEN: getEnv('UPSTASH_REDIS_REST_TOKEN'),
  
  // 환경 판별 도우미
  isProd: process.env.NODE_ENV === 'production',
  isDev: process.env.NODE_ENV === 'development',
  isTest: process.env.NODE_ENV === 'test',
} 