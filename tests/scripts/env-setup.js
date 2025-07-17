import fs from 'fs';
import path from 'path';

/**
 * 🔧 환경변수 설정 스크립트
 * Google AI API 키와 Slack 웹훅을 포함한 완전한 환경변수 파일을 생성합니다.
 */
function createEnvFile() {
  const envContent = `# OpenManager Vibe v5 - Local Environment Variables
# 로컬 개발 및 테스트 환경용 설정

# 🤖 Google AI Studio (Gemini) 설정
GOOGLE_AI_API_KEY=your_google_ai_api_key_here
GOOGLE_AI_ENABLED=true
GOOGLE_AI_MODEL=gemini-1.5-flash
GOOGLE_AI_BETA_MODE=true
GEMINI_LEARNING_ENABLED=true

# 📢 알림 설정 (Slack 제거됨)
# 브라우저 알림만 사용

# 🗄️ Supabase 설정 (기존 환경변수 유지)
NEXT_PUBLIC_SUPABASE_URL=https://vnswjnltnhpsueosfhmw.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZuc3dqbmx0bmhwc3Vlb3NmaG13Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzMzNjAzNjIsImV4cCI6MjA0ODkzNjM2Mn0.gL_xJ3BqcK3gBGcxrxQbROcf3JMN_Ov7L9D4qJ5n1ps
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZuc3dqbmx0bmhwc3Vlb3NmaG13Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMzM2MDM2MiwiZXhwIjoyMDQ4OTM2MzYyfQ.zJnAUZUxcQwHPW2A3Ku8K_3kB_c3TCPU_LlhGaKf0RQ

# 🔄 Redis 설정 (Upstash)
REDIS_URL=rediss://default:your_redis_token_here@your_redis_host_here:6379
UPSTASH_REDIS_REST_URL=https://your_redis_host_here
UPSTASH_REDIS_REST_TOKEN=your_redis_token_here

# 🛡️ Next.js 보안 설정
NEXTAUTH_SECRET=openmanager-vibe-v5-auth-secret-key-2024
NEXTAUTH_URL=http://localhost:3000

# 🔧 개발 도구 설정
NODE_ENV=development
DEBUG=false`;

  const envPath = path.join(process.cwd(), '.env.local');

  try {
    fs.writeFileSync(envPath, envContent, 'utf8');
    console.log('✅ .env.local 파일이 성공적으로 생성되었습니다.');
    console.log('📁 위치:', envPath);

    // 파일 내용 확인
    const content = fs.readFileSync(envPath, 'utf8');
    console.log('📋 파일 크기:', content.length, '바이트');

    return true;
  } catch (error) {
    console.error('❌ .env.local 파일 생성 실패:', error.message);
    return false;
  }
}

// 스크립트 실행
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('🚀 환경변수 파일 생성 시작...');
  createEnvFile();
}

export { createEnvFile };
