#!/bin/bash

# Vercel 환경 변수 설정 스크립트
# 주의: 이 스크립트를 실행하기 전에 Vercel CLI가 설치되어 있고 로그인되어 있어야 합니다.

echo "Vercel 환경 변수를 설정합니다..."

# NEXTAUTH_URL
vercel env add NEXTAUTH_URL production <<< "https://openmanager-vibe-v5.vercel.app"

# NEXTAUTH_SECRET
vercel env add NEXTAUTH_SECRET production <<< "9caaf42e78ea0758039f9dc44d371b23"

# GITHUB_CLIENT_SECRET
vercel env add GITHUB_CLIENT_SECRET production <<< "e696b1911a31d283d829aca73eb3fea8abbe7291"

# GITHUB_CLIENT_ID
vercel env add GITHUB_CLIENT_ID production <<< "Ov23liFnUsRO0ttNegju"

echo ""
echo "✅ 모든 환경 변수가 설정되었습니다!"
echo ""
echo "다음 명령어로 재배포하세요:"
echo "vercel --prod"