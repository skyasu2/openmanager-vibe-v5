#!/bin/bash

# 🚀 OpenManager Vibe v5 로컬 개발 환경 실행 스크립트
# 
# 이 스크립트는 로컬 환경에서 개발 서버를 쉽게 시작할 수 있도록 도와줍니다.

echo "🏠 OpenManager Vibe v5 로컬 개발 환경을 시작합니다..."
echo "================================================"

# 환경 변수 강제 설정 (로컬 모드)
export DEV_MODE=local
export NODE_ENV=development

# 현재 디렉토리 확인
if [ ! -f "package.json" ]; then
    echo "❌ package.json 파일을 찾을 수 없습니다. 프로젝트 루트 디렉토리에서 실행해주세요."
    exit 1
fi

echo "📍 작업 디렉토리: $(pwd)"
echo "🐳 개발 모드: $DEV_MODE (강제 설정)"

# .env.local 파일 존재 확인
if [ ! -f ".env.local" ]; then
    echo "⚠️ .env.local 파일이 없습니다."
    echo "dev-env.example 파일을 참고해서 .env.local을 생성하거나"
    echo "다음 명령어로 기본 파일을 생성할 수 있습니다:"
    echo ""
    echo "cp dev-env.example .env.local"
    echo ""
    echo "계속 진행하시겠습니까? (y/N)"
    read -r response
    if [[ ! "$response" =~ ^[Yy]$ ]]; then
        echo "🚫 실행을 중단합니다."
        exit 1
    fi
fi

# Node.js 의존성 확인
echo "📦 Node.js 의존성을 확인합니다..."
if [ ! -d "node_modules" ]; then
    echo "📥 node_modules가 없습니다. 의존성을 설치합니다..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ npm install 실패"
        exit 1
    fi
fi

# 로컬 서비스 상태 확인 함수
check_local_service() {
    local service=$1
    local host=$2
    local port=$3
    
    if command -v nc >/dev/null 2>&1; then
        if nc -z "$host" "$port" >/dev/null 2>&1; then
            echo "✅ $service ($host:$port) - 연결 가능"
            return 0
        else
            echo "❌ $service ($host:$port) - 연결 불가"
            return 1
        fi
    else
        echo "⚠️ $service ($host:$port) - nc 명령어 없음 (연결 확인 불가)"
        return 0
    fi
}

# 로컬 서비스 연결 확인
echo ""
echo "🔍 로컬 서비스 연결을 확인합니다..."
echo "------------------------------------------------"

postgres_ok=false
redis_ok=false

# PostgreSQL 확인
if check_local_service "PostgreSQL" "localhost" "5432"; then
    postgres_ok=true
fi

# Redis 확인
if check_local_service "Redis" "localhost" "6379"; then
    redis_ok=true
fi

# 서비스 상태 요약
echo ""
echo "📊 로컬 서비스 상태 요약:"
if $postgres_ok; then
    echo "   🐘 PostgreSQL: 정상"
else
    echo "   🐘 PostgreSQL: 연결 불가 ⚠️"
    echo "      → PostgreSQL을 설치하고 실행해주세요"
    echo "      → 또는 Docker를 사용하세요: docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=postgres postgres"
fi

if $redis_ok; then
    echo "   🔴 Redis: 정상"
else
    echo "   🔴 Redis: 연결 불가 ⚠️"
    echo "      → Redis를 설치하고 실행해주세요"
    echo "      → 또는 Docker를 사용하세요: docker run -d -p 6379:6379 redis"
fi

# 경고 메시지
if ! $postgres_ok || ! $redis_ok; then
    echo ""
    echo "⚠️ 일부 서비스에 연결할 수 없습니다."
    echo "앱이 실행되지만 일부 기능이 제한될 수 있습니다."
    echo ""
    echo "계속 진행하시겠습니까? (y/N)"
    read -r response
    if [[ ! "$response" =~ ^[Yy]$ ]]; then
        echo "🚫 실행을 중단합니다."
        echo ""
        echo "💡 서비스 설치 가이드:"
        echo "PostgreSQL: https://www.postgresql.org/download/"
        echo "Redis: https://redis.io/download"
        echo ""
        echo "또는 DevContainer를 사용하세요: VS Code에서 'Reopen in Container'"
        exit 1
    fi
fi

# 빠른 검증 실행
echo ""
echo "🔍 빠른 코드 검증을 수행합니다..."
npm run validate:quick
if [ $? -ne 0 ]; then
    echo "⚠️ 코드 검증에서 문제가 발견되었습니다."
    echo "계속 진행하시겠습니까? (y/N)"
    read -r response
    if [[ ! "$response" =~ ^[Yy]$ ]]; then
        echo "🚫 실행을 중단합니다. 코드 문제를 먼저 해결해주세요."
        exit 1
    fi
fi

# 개발 서버 시작
echo ""
echo "🚀 로컬 개발 서버를 시작합니다..."
echo "================================================"
echo ""
echo "📋 개발 서버 정보:"
echo "   🌐 메인 애플리케이션: http://localhost:3000"
echo "   📚 Storybook: npm run storybook (포트 6006)"
echo "   🧪 테스트: npm run test:unit"
echo "   🔧 빌드: npm run build"
echo ""
echo "⌨️ 종료하려면 Ctrl+C를 누르세요"
echo ""

# 환경 변수 최종 확인
echo "🔧 환경 설정:"
echo "   NODE_ENV: $NODE_ENV"
echo "   DEV_MODE: $DEV_MODE"
echo ""

# 개발 서버 실행
exec npm run dev

# 스크립트 종료 후 정리 메시지
echo ""
echo "🏁 로컬 개발 서버가 종료되었습니다."
echo "감사합니다!" 