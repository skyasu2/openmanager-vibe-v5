#!/bin/bash

# Vercel 환경 변수 설정 스크립트
# 주의: 이 스크립트를 실행하기 전에 Vercel CLI가 설치되어 있고 로그인되어 있어야 합니다.
# 주의: 실행 전에 .env.local 파일에서 환경 변수를 로드해야 합니다.

# .env.local 파일에서 환경 변수 로드
if [ -f .env.local ]; then
    source .env.local
    echo "✅ .env.local 파일에서 환경 변수를 로드했습니다."
else
    echo "❌ .env.local 파일을 찾을 수 없습니다. 먼저 .env.local 파일을 생성하세요."
    exit 1
fi

echo "Vercel 환경 변수를 설정합니다..."

# 필수 환경 변수 확인
if [ -z "$NEXTAUTH_SECRET" ] || [ -z "$GITHUB_CLIENT_SECRET" ] || [ -z "$GITHUB_CLIENT_ID" ]; then
    echo "❌ 필수 환경 변수가 설정되지 않았습니다. .env.local 파일을 확인하세요."
    exit 1
fi

# NEXTAUTH_URL
vercel env add NEXTAUTH_URL production <<< "https://openmanager-vibe-v5.vercel.app"

# NEXTAUTH_SECRET (환경 변수에서 가져옴)
vercel env add NEXTAUTH_SECRET production <<< "$NEXTAUTH_SECRET"

# GITHUB_CLIENT_SECRET (환경 변수에서 가져옴)
vercel env add GITHUB_CLIENT_SECRET production <<< "$GITHUB_CLIENT_SECRET"

# GITHUB_CLIENT_ID (환경 변수에서 가져옴)
vercel env add GITHUB_CLIENT_ID production <<< "$GITHUB_CLIENT_ID"

echo ""
echo "✅ 모든 환경 변수가 설정되었습니다!"
echo ""
echo "다음 명령어로 재배포하세요:"
echo "vercel --prod"