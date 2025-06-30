/**
 * 🚨 긴급 환경변수 설정 시스템
 * 692d48d 이후 첫 페이지 문제 해결을 위한 임시 해결책
 *
 * 생성일: 2025-01-31 14:48 KST
 */

/**
 * 🔧 필수 환경변수 강제 설정
 */
export function forceSetEnvironmentVariables(): void {
  console.log('🚨 긴급 환경변수 설정 시작...');

  // 🗄️ Supabase 관련 필수 환경변수 (가장 중요!)
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    process.env.NEXT_PUBLIC_SUPABASE_URL =
      'https://vnswjnltnhpsueosfhmw.supabase.co';
    console.log('✅ NEXT_PUBLIC_SUPABASE_URL 설정됨');
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZuc3dqbmx0bmhwc3Vlb3NmaG13Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc5MjMzMjcsImV4cCI6MjA2MzQ5OTMyN30.09ApSnuXNv_yYVJWQWGpOFWw3tkLbxSA21k5sroChGU';
    console.log('✅ NEXT_PUBLIC_SUPABASE_ANON_KEY 설정됨');
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    process.env.SUPABASE_SERVICE_ROLE_KEY =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZuc3dqbmx0bmhwc3Vlb3NmaG13Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzkyMzMyNywiZXhwIjoyMDYzNDk5MzI3fQ.xk2DUcqBZnaF-iuO7sbeXS-H43h8D5gppIlsJYw7xi8';
    console.log('✅ SUPABASE_SERVICE_ROLE_KEY 설정됨');
  }

  // 📡 Redis 관련 환경변수 (Mock 모드로 설정)
  if (!process.env.UPSTASH_REDIS_REST_URL) {
    process.env.UPSTASH_REDIS_REST_URL =
      'https://charming-condor-46598.upstash.io';
    console.log('✅ UPSTASH_REDIS_REST_URL 설정됨');
  }

  if (!process.env.UPSTASH_REDIS_REST_TOKEN) {
    process.env.UPSTASH_REDIS_REST_TOKEN =
      'AbYGAAIjcDE5MjNmYjhiZDkwOGQ0MTUyOGFiZjUyMmQ0YTkyMzIwM3AxMA';
    console.log('✅ UPSTASH_REDIS_REST_TOKEN 설정됨');
  }

  // 개발환경에서는 Mock Redis 강제 사용
  process.env.FORCE_MOCK_REDIS = 'true';
  process.env.REDIS_CONNECTION_DISABLED = 'false';

  // 🤖 Google AI 관련 환경변수
  if (!process.env.GOOGLE_AI_API_KEY) {
    process.env.GOOGLE_AI_API_KEY = 'AIzaSyABC2WATlHIG0Kd-Oj4JSL6wJoqMd3FhvM';
    console.log('✅ GOOGLE_AI_API_KEY 설정됨');
  }

  process.env.GOOGLE_AI_ENABLED = 'true';
  process.env.GOOGLE_AI_QUOTA_PROTECTION = 'true';

  // 🎯 AI 엔진 관련 설정
  process.env.AI_ENGINE_MODE = 'AUTO';
  process.env.SUPABASE_RAG_ENABLED = 'true';
  process.env.LOCAL_AI_FALLBACK = 'true';
  process.env.KOREAN_NLP_ENABLED = 'true';

  // 🔌 MCP 서버 관련
  if (!process.env.RENDER_MCP_SERVER_URL) {
    process.env.RENDER_MCP_SERVER_URL =
      'https://openmanager-vibe-v5.onrender.com';
    console.log('✅ RENDER_MCP_SERVER_URL 설정됨');
  }
  process.env.MCP_SERVER_PORT = '10000';

  // 🛡️ 보안 및 시스템 설정
  process.env.DISABLE_AUTO_BACKUP = 'true';
  process.env.DISABLE_HEALTH_CHECK = 'false';
  process.env.HEALTH_CHECK_CONTEXT = 'true';
  process.env.DATABASE_CONNECTION_POOLING = 'true';
  process.env.CACHE_ENABLED = 'true';
  process.env.TEAM_DECRYPT_PASSWORD = 'openmanager2025';

  // 🚀 베르셀 관련 설정 (개발환경)
  process.env.VERCEL = 'false';
  process.env.RENDER = 'false';

  console.log('🎉 긴급 환경변수 설정 완료!');
}
