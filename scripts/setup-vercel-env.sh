#!/bin/bash

# 🚀 Vercel 환경변수 설정 스크립트
# GitHub OAuth 리다이렉트 문제 해결을 위한 필수 환경변수 설정

echo "🚀 Vercel 환경변수 설정 시작..."

# Vercel CLI 설치 확인
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI가 설치되지 않았습니다."
    echo "💡 설치 방법: npm install -g vercel"
    exit 1
fi

echo "✅ Vercel CLI 확인됨"

# 프로젝트 루트 확인
if [ ! -f "package.json" ]; then
    echo "❌ package.json을 찾을 수 없습니다. 프로젝트 루트에서 실행해주세요."
    exit 1
fi

echo "📦 프로젝트: $(grep -o '"name": "[^"]*' package.json | cut -d'"' -f4)"

# .env.local에서 환경변수 로드
if [ ! -f ".env.local" ]; then
    echo "❌ .env.local 파일을 찾을 수 없습니다."
    exit 1
fi

echo "📋 .env.local에서 환경변수 로드 중..."

# 필수 환경변수 목록
REQUIRED_VARS=(
    "NEXTAUTH_URL"
    "NEXT_PUBLIC_APP_URL"
    "NEXT_PUBLIC_SITE_URL"
    "GITHUB_CLIENT_ID"
    "GITHUB_CLIENT_SECRET"
    "GITHUB_TOKEN"
    "SUPABASE_URL"
    "NEXT_PUBLIC_SUPABASE_URL"
    "NEXT_PUBLIC_SUPABASE_ANON_KEY"
    "NEXTAUTH_SECRET"
    "ENCRYPTION_KEY"
)

# 환경변수 설정 함수
set_vercel_env() {
    local var_name=$1
    local var_value=$2
    local env_type=${3:-"production,preview,development"}
    
    if [ -n "$var_value" ]; then
        echo "🔧 설정 중: $var_name"
        vercel env add "$var_name" "$env_type" <<< "$var_value" > /dev/null 2>&1
        if [ $? -eq 0 ]; then
            echo "✅ $var_name 설정 완료"
        else
            echo "⚠️ $var_name 설정 실패 (이미 존재할 수 있음)"
        fi
    else
        echo "❌ $var_name 값이 비어있습니다"
    fi
}

# .env.local에서 변수 읽기
source .env.local

echo ""
echo "🔐 필수 환경변수 설정 중..."

# 각 환경변수 설정
set_vercel_env "NEXTAUTH_URL" "$NEXTAUTH_URL"
set_vercel_env "NEXT_PUBLIC_APP_URL" "$NEXT_PUBLIC_APP_URL"
set_vercel_env "NEXT_PUBLIC_SITE_URL" "$NEXT_PUBLIC_SITE_URL"
set_vercel_env "GITHUB_CLIENT_ID" "$GITHUB_CLIENT_ID"
set_vercel_env "GITHUB_CLIENT_SECRET" "$GITHUB_CLIENT_SECRET"
set_vercel_env "GITHUB_TOKEN" "$GITHUB_TOKEN"
set_vercel_env "SUPABASE_URL" "$SUPABASE_URL"
set_vercel_env "NEXT_PUBLIC_SUPABASE_URL" "$NEXT_PUBLIC_SUPABASE_URL"
set_vercel_env "NEXT_PUBLIC_SUPABASE_ANON_KEY" "$NEXT_PUBLIC_SUPABASE_ANON_KEY"
set_vercel_env "NEXTAUTH_SECRET" "$NEXTAUTH_SECRET"
set_vercel_env "ENCRYPTION_KEY" "$ENCRYPTION_KEY"

echo ""
echo "📊 추가 설정..."

# Vercel 특화 환경변수
set_vercel_env "VERCEL_ENV" "production" "production"
set_vercel_env "VERCEL_ENV" "preview" "preview"
set_vercel_env "VERCEL_ENV" "development" "development"

echo ""
echo "🔍 설정된 환경변수 확인..."
vercel env ls

echo ""
echo "🎉 Vercel 환경변수 설정 완료!"
echo ""
echo "📋 다음 단계:"
echo "1. Supabase 대시보드에서 Site URL 확인"
echo "2. GitHub OAuth App 콜백 URL 확인"
echo "3. Vercel에서 재배포: vercel --prod"
echo ""
echo "🔗 확인 URL:"
echo "- Vercel: https://vercel.com/dashboard"
echo "- Supabase: https://supabase.com/dashboard"
echo "- GitHub: https://github.com/settings/developers"