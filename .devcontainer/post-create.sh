#!/bin/bash

# 🚀 OpenManager Vibe v5 DevContainer 초기화 스크립트

echo "🔧 DevContainer 초기 설정을 시작합니다..."

# 현재 디렉토리 확인
cd /workspace

# Git 안전 디렉토리 설정
git config --global --add safe.directory /workspace

# Node.js 의존성 설치
echo "📦 Node.js 의존성을 설치합니다..."
npm install

# MCP 서버 의존성 설치
if [ -d "mcp-server" ]; then
    echo "🤖 MCP 서버 의존성을 설치합니다..."
    cd mcp-server
    npm install
    cd ..
fi

# 환경 변수 파일 생성 (존재하지 않는 경우)
if [ ! -f ".env.local" ]; then
    echo "⚙️ 개발용 환경 변수 파일을 생성합니다..."
    cat > .env.local << 'EOF'
# 🔧 OpenManager Vibe v5 개발 환경 설정

# 기본 설정
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000

# 데이터베이스 설정 (로컬 PostgreSQL)
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/openmanager_dev?schema=public
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_DB=openmanager_dev
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres

# Redis 설정 (로컬 Redis)
REDIS_URL=redis://redis:6379
REDIS_HOST=redis
REDIS_PORT=6379

# AI 엔진 설정 (개발용 - 실제 키로 교체 필요)
GOOGLE_AI_API_KEY=your-google-ai-api-key-here
GOOGLE_AI_ENABLED=false

# Slack 설정 (개발용 - 실제 웹훅으로 교체 필요)
SLACK_WEBHOOK_URL=your-slack-webhook-url-here

# 개발 도구 설정
ANALYZE=false
STORYBOOK_ENABLED=true
PLAYWRIGHT_ENABLED=true

# 보안 설정
NEXTAUTH_SECRET=dev-secret-key-change-in-production
NEXTAUTH_URL=http://localhost:3000
EOF
    echo "✅ .env.local 파일이 생성되었습니다."
    echo "⚠️  실제 API 키와 설정값으로 교체해주세요!"
fi

# 개발 환경 검증 스크립트 실행
echo "🔍 개발 환경을 검증합니다..."
npm run validate:quick || echo "⚠️ 일부 검증이 실패했습니다. 환경 설정을 확인해주세요."

# Playwright 브라우저 설치 확인
echo "🎭 Playwright 브라우저 설치를 확인합니다..."
npx playwright install chromium || echo "⚠️ Playwright 브라우저 설치가 필요할 수 있습니다."

# 데이터베이스 연결 대기
echo "🐘 PostgreSQL 서버 준비를 기다립니다..."
timeout=30
while ! pg_isready -h postgres -p 5432 -U postgres; do
    echo "PostgreSQL 서버를 기다리는 중... ($timeout초 남음)"
    sleep 2
    timeout=$((timeout - 2))
    if [ $timeout -le 0 ]; then
        echo "⚠️ PostgreSQL 서버 연결 시간 초과"
        break
    fi
done

# Redis 연결 확인
echo "🔴 Redis 서버 연결을 확인합니다..."
timeout=30
while ! redis-cli -h redis -p 6379 ping > /dev/null 2>&1; do
    echo "Redis 서버를 기다리는 중... ($timeout초 남음)"
    sleep 2
    timeout=$((timeout - 2))
    if [ $timeout -le 0 ]; then
        echo "⚠️ Redis 서버 연결 시간 초과"
        break
    fi
done

# 기본 데이터베이스 스키마 생성 (필요한 경우)
if command -v psql &> /dev/null; then
    echo "🗄️ 데이터베이스 스키마를 확인합니다..."
    PGPASSWORD=postgres psql -h postgres -U postgres -d openmanager_dev -c "SELECT 1;" > /dev/null 2>&1 \
        && echo "✅ 데이터베이스 연결 성공" \
        || echo "⚠️ 데이터베이스 연결 실패 - 수동 설정이 필요할 수 있습니다."
fi

# 개발 가이드 출력
echo ""
echo "🎉 DevContainer 초기 설정이 완료되었습니다!"
echo ""
echo "📋 다음 단계:"
echo "1. .env.local 파일에서 실제 API 키들을 설정하세요"
echo "2. 'npm run dev'로 개발 서버를 시작하세요"
echo "3. 'npm run storybook'으로 Storybook을 시작하세요"
echo "4. 'npm run test'로 테스트를 실행하세요"
echo ""
echo "🔧 유용한 명령어들:"
echo "- npm run dev              # Next.js 개발 서버 시작"
echo "- npm run dev:monitor      # 서비스 상태 모니터링과 함께 개발 서버 시작"
echo "- npm run storybook        # Storybook 시작"
echo "- npm run test:unit        # 단위 테스트 실행"
echo "- npm run test:e2e         # E2E 테스트 실행"
echo "- npm run validate:quick   # 빠른 검증 (타입 체크 + 린트)"
echo "- npm run validate:all     # 전체 검증 (타입 체크 + 린트 + 테스트 + 빌드)"
echo ""
echo "🌐 웹 관리 도구:"
echo "- http://localhost:8080    # Adminer (PostgreSQL 관리)"
echo "- http://localhost:8081    # Redis Commander (Redis 관리)"
echo ""
echo "📚 자세한 내용은 README.md를 참고하세요!"
echo ""

# Git 사용자 정보 확인 알림
if [ -z "$(git config --global user.name)" ]; then
    echo "⚠️  Git 사용자 정보가 설정되지 않았습니다."
    echo "다음 명령어로 설정해주세요:"
    echo "git config --global user.name \"Your Name\""
    echo "git config --global user.email \"your.email@example.com\""
    echo ""
fi 