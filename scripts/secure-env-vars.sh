#!/bin/bash
# 환경변수 보안 강화 스크립트
# API 키를 안전하게 관리하고 Git에서 제외

echo "🔐 환경변수 보안 강화 시작..."

# .env.local.example 생성 (민감한 값 제거)
cat > .env.local.example << 'EOF'
# OpenManager VIBE v5 - 환경변수 예제
# 실제 값은 .env.vault 또는 환경변수로 관리

# 애플리케이션 URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SITE_URL=https://your-domain.vercel.app

# Supabase 데이터베이스
SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_JWT_SECRET=your-jwt-secret

# MCP 서버용 추가 환경변수
SUPABASE_ACCESS_TOKEN=your-access-token
SUPABASE_PROJECT_ID=your-project-id

# Upstash Redis
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-redis-token

# Google AI
GOOGLE_AI_API_KEY=your-google-ai-key

# GitHub
GITHUB_TOKEN=ghp_your-github-token
GITHUB_CLIENT_ID=your-client-id
GITHUB_CLIENT_SECRET=your-client-secret

# Tavily
TAVILY_API_KEY=tvly-your-api-key

# 보안
NEXTAUTH_SECRET=your-nextauth-secret
ENCRYPTION_KEY=your-encryption-key
EOF

# .gitignore 업데이트
echo "# 환경변수 파일" >> .gitignore
echo ".env.local" >> .gitignore
echo ".env.vault" >> .gitignore
echo ".env.*.local" >> .gitignore
echo "!.env.local.example" >> .gitignore

# 환경변수 검증 스크립트
cat > scripts/validate-env.js << 'EOF'
const fs = require('fs');
const path = require('path');

const requiredEnvVars = {
  // MCP 필수
  'GITHUB_TOKEN': 'GitHub MCP 서버용',
  'SUPABASE_URL': 'Supabase MCP 서버용',
  'SUPABASE_SERVICE_ROLE_KEY': 'Supabase 관리자 권한',
  'SUPABASE_ACCESS_TOKEN': 'Supabase MCP 액세스',
  'UPSTASH_REDIS_REST_URL': 'Context7 MCP용',
  'UPSTASH_REDIS_REST_TOKEN': 'Context7 인증',
  'TAVILY_API_KEY': 'Tavily 검색 API',
  // 애플리케이션 필수
  'GOOGLE_AI_API_KEY': 'Google AI 서비스',
  'NEXTAUTH_SECRET': '세션 암호화',
};

console.log('🔍 환경변수 검증 시작...\n');

let missingVars = [];
let sensitiveVars = [];

for (const [varName, description] of Object.entries(requiredEnvVars)) {
  if (!process.env[varName]) {
    missingVars.push(`❌ ${varName} - ${description}`);
  } else if (process.env[varName].includes('your-') || process.env[varName].includes('example')) {
    sensitiveVars.push(`⚠️  ${varName} - 예제 값으로 설정됨`);
  } else {
    console.log(`✅ ${varName} - ${description}`);
  }
}

if (missingVars.length > 0) {
  console.log('\n🚨 누락된 환경변수:');
  missingVars.forEach(v => console.log(v));
}

if (sensitiveVars.length > 0) {
  console.log('\n⚠️  주의가 필요한 환경변수:');
  sensitiveVars.forEach(v => console.log(v));
}

if (missingVars.length === 0 && sensitiveVars.length === 0) {
  console.log('\n✅ 모든 환경변수가 올바르게 설정되었습니다!');
} else {
  console.log('\n📌 .env.local.example 파일을 참고하여 환경변수를 설정하세요.');
  process.exit(1);
}
EOF

echo "✅ 보안 강화 완료!"
echo ""
echo "📌 다음 단계:"
echo "1. .env.local.example을 참고하여 실제 환경변수 설정"
echo "2. npm run validate:env 로 환경변수 검증"
echo "3. git add .env.local.example .gitignore"
echo "4. git rm --cached .env.local (이미 추적중인 경우)"