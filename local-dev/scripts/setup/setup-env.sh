#!/bin/bash
# OpenManager Vibe v5 - 환경변수 설정 스크립트

echo "🔧 .env.local 파일 생성 중..."

cat > .env.local << 'EOF'
# OpenManager Vibe v5 Environment Variables
# Database Configuration - DISABLE MOCK MODE
DATABASE_ENABLE_MOCK_MODE=false

# Supabase Configuration
SUPABASE_URL=https://vnswjnltnhpsueosfhmw.supabase.co
NEXT_PUBLIC_SUPABASE_URL=https://vnswjnltnhpsueosfhmw.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZuc3dqbmx0bmhwc3Vlb3NmaG13Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc5MjMzMjcsImV4cCI6MjA2MzQ5OTMyN30.09ApSnuXNv_yYVJWQWGpOFWw3tkLbxSA21k5sroChGU
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZuc3dqbmx0bmhwc3Vlb3NmaG13Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzkyMzMyNywiZXhwIjoyMDYzNDk5MzI3fQ.xk2DUcqBZnaF-iuO7sbeXS-H43h8D5gppIlsJYw7xi8
SUPABASE_JWT_SECRET=qNzA4/WgbksJU3xxkQJcfbCRkXhgBR7TVmI4y2XKRy59BwtRk6iuUSdkRNNQN1Yud3PGsGLTcZkdHSTZL0mhug==

# PostgreSQL Configuration
POSTGRES_URL=postgres://postgres.vnswjnltnhpsueosfhmw:2D3DWhSl8HBlgYIm@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?sslmode=require&supa=base-pooler.x
POSTGRES_PRISMA_URL=postgres://postgres.vnswjnltnhpsueosfhmw:2D3DWhSl8HBlgYIm@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?sslmode=require&supa=base-pooler.x
POSTGRES_URL_NON_POOLING=postgres://postgres.vnswjnltnhpsueosfhmw:2D3DWhSl8HBlgYIm@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres?sslmode=require
DATABASE_URL=postgres://postgres.vnswjnltnhpsueosfhmw:2D3DWhSl8HBlgYIm@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?sslmode=require&supa=base-pooler.x

# PostgreSQL Details
POSTGRES_USER=postgres
POSTGRES_PASSWORD=2D3DWhSl8HBlgYIm
POSTGRES_HOST=db.vnswjnltnhpsueosfhmw.supabase.co
POSTGRES_DATABASE=postgres

# Redis Configuration (Updated)
# Redis 설정
export KV_URL="rediss://default:${UPSTASH_REDIS_REST_TOKEN:-your_redis_token_here}@${UPSTASH_REDIS_HOST:-your_redis_host_here}:6379"
export KV_REST_API_URL="https://${UPSTASH_REDIS_HOST:-your_redis_host_here}"
export KV_REST_API_TOKEN="${UPSTASH_REDIS_REST_TOKEN:-your_redis_token_here}"
export KV_REST_API_READ_ONLY_TOKEN=ArYGAAIgcDEJt2OXeBDen9ob7LlHXZiPD3cWjKXjdo0GT-jFZwW1lw
export REDIS_URL="rediss://default:${UPSTASH_REDIS_REST_TOKEN:-your_redis_token_here}@${UPSTASH_REDIS_HOST:-your_redis_host_here}:6379"
export UPSTASH_REDIS_REST_URL="https://${UPSTASH_REDIS_HOST:-your_redis_host_here}"
export UPSTASH_REDIS_REST_TOKEN="${UPSTASH_REDIS_REST_TOKEN:-your_redis_token_here}"

# Development Configuration
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000

# AI & MCP Configuration
MCP_SERVER_URL=http://104.154.205.25:10000
AI_ENGINE_MODE=hybrid
EOF

echo "✅ .env.local 파일 생성 완료!"
echo "📊 환경변수 요약:"
echo "  - DATABASE_ENABLE_MOCK_MODE: false (실제 DB 사용)"
echo "  - Supabase: ✅ 설정됨"
echo "  - PostgreSQL: ✅ 설정됨" 
echo "  - Redis: ✅ 설정됨"
echo ""
echo "🚀 다음 단계:"
echo "1. npm run dev (개발 서버 재시작)"
echo "2. 브라우저에서 실제 DB 데이터 확인" 