#!/bin/bash

# 🚀 OpenManager Vibe v5 DevContainer 시작 스크립트

echo "🔄 DevContainer 시작 중..."

# 현재 디렉토리 확인
cd /workspace

# 서비스 상태 확인
echo "🔍 서비스 상태를 확인합니다..."

# PostgreSQL 연결 확인
if pg_isready -h postgres -p 5432 -U postgres > /dev/null 2>&1; then
    echo "✅ PostgreSQL 서버 연결됨"
else
    echo "⚠️ PostgreSQL 서버 연결 대기 중..."
fi

# Redis 연결 확인
if redis-cli -h redis -p 6379 ping > /dev/null 2>&1; then
    echo "✅ Redis 서버 연결됨"
else
    echo "⚠️ Redis 서버 연결 대기 중..."
fi

# Node.js 모듈 상태 확인
if [ ! -d "node_modules" ]; then
    echo "📦 Node.js 의존성을 설치합니다..."
    npm install
fi

# 환경 변수 파일 존재 확인
if [ ! -f ".env.local" ]; then
    echo "⚠️ .env.local 파일이 없습니다. 개발 환경 설정이 필요합니다."
    echo "post-create.sh 스크립트를 실행하거나 수동으로 .env.local을 생성해주세요."
fi

# 개발 환경 상태 요약
echo ""
echo "📊 개발 환경 상태:"
echo "- 작업 디렉토리: $(pwd)"
echo "- Node.js 버전: $(node --version)"
echo "- npm 버전: $(npm --version)"
echo "- TypeScript 버전: $(npx tsc --version)"
echo ""

# 빠른 시작 가이드
echo "🚀 빠른 시작 명령어:"
echo "- npm run dev              # 개발 서버 시작"
echo "- npm run dev:monitor      # 모니터링과 함께 개발 서버 시작"
echo "- npm run storybook        # Storybook UI 컴포넌트 뷰어"
echo "- npm run test:unit        # 단위 테스트 실행"
echo "- npm run validate:quick   # 코드 검증 (린트 + 타입 체크)"
echo ""

# 서비스 확인 스크립트 실행 (존재하는 경우)
if [ -f "scripts/check-services.js" ]; then
    echo "🔧 서비스 상태를 확인합니다..."
    npm run services:status || echo "⚠️ 서비스 상태 확인 스크립트를 실행할 수 없습니다."
fi

echo "✅ DevContainer 시작 완료!"
echo "" 