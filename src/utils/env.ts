/**
 * 🔐 환경변수 타입 안전성 보장 시스템
 * 
 * AI 교차 검증 권고사항 적용:
 * - zod 스키마로 런타임 검증
 * - 타입 안전성 확보
 * - 개발/프로덕션 환경별 검증
 */

import { z } from 'zod';

// 환경변수 스키마 정의
const envSchema = z.object({
  // Supabase Database Configuration
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('유효한 Supabase URL이 필요합니다'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'Supabase Anon Key가 필요합니다'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'Supabase Service Role Key가 필요합니다').optional(),
  SUPABASE_PROJECT_ID: z.string().min(1, 'Supabase Project ID가 필요합니다').optional(),
  
  // Memory-based Caching System
  MEMORY_CACHE_ENABLED: z.string().transform(val => val === 'true').optional(),
  MEMORY_CACHE_MAX_SIZE: z.string().transform(val => parseInt(val) || 100).optional(),
  MEMORY_CACHE_TTL_SECONDS: z.string().transform(val => parseInt(val) || 900).optional(),
  
  // GCP Configuration (Cloud Functions only)
  GCP_PROJECT_ID: z.string().min(1, 'GCP Project ID가 필요합니다').optional(),
  GCP_MCP_SERVER_URL: z.string().url().optional(),
  
  // GitHub OAuth & API
  GITHUB_CLIENT_ID: z.string().min(1, 'GitHub Client ID가 필요합니다').optional(),
  GITHUB_CLIENT_SECRET: z.string().min(1, 'GitHub Client Secret이 필요합니다').optional(),
  GITHUB_TOKEN: z.string().startsWith('ghp_', 'GitHub Token은 ghp_로 시작해야 합니다').optional(),
  
  // AI Services
  GOOGLE_AI_API_KEY: z.string().optional(),
  TAVILY_API_KEY: z.string().startsWith('tvly-', 'Tavily API Key는 tvly-로 시작해야 합니다').optional(),
  
  // Next.js 환경
  NODE_ENV: z.enum(['development', 'production', 'test']).optional(),
  VERCEL_ENV: z.enum(['development', 'preview', 'production']).optional(),
});

// 환경변수 타입 추출
export type Env = z.infer<typeof envSchema>;

// 환경변수 파싱 및 검증
function parseEnv(): Env {
  try {
    const result = envSchema.safeParse(process.env);
    
    if (!result.success) {
      console.error('❌ 환경변수 검증 실패:', result.error.format());
      
      // 개발환경에서는 경고만 출력
      if (process.env.NODE_ENV === 'development') {
        console.warn('⚠️ 개발환경: 필수 환경변수 누락 시 기본값 사용');
        return result.data || {} as Env;
      }
      
      // 프로덕션에서는 에러 발생
      throw new Error(`환경변수 검증 실패: ${result.error.message}`);
    }
    
    return result.data;
  } catch (error) {
    console.error('❌ 환경변수 파싱 오류:', error);
    
    // 개발환경에서는 기본값으로 대체
    if (process.env.NODE_ENV === 'development') {
      return {} as Env;
    }
    
    throw error;
  }
}

// 타입 안전한 환경변수 익스포트
export const env = parseEnv();

// 환경별 검증 헬퍼
export const isProduction = env.NODE_ENV === 'production';
export const isDevelopment = env.NODE_ENV === 'development';
export const isTest = env.NODE_ENV === 'test';
export const isVercelProduction = env.VERCEL_ENV === 'production';

// 특정 기능 활성화 검사
export const features = {
  supabase: !!env.NEXT_PUBLIC_SUPABASE_URL && !!env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  github: !!env.GITHUB_CLIENT_ID && !!env.GITHUB_CLIENT_SECRET,
  gcp: !!env.GCP_PROJECT_ID,
  ai: !!env.GOOGLE_AI_API_KEY,
  search: !!env.TAVILY_API_KEY,
  cache: env.MEMORY_CACHE_ENABLED ?? true,
} as const;

// 개발용 환경변수 상태 로깅
if (isDevelopment) {
  console.log('🔧 환경변수 기능 상태:', features);
}