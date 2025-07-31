#!/bin/bash

# 🚀 GitHub OAuth 빠른 해결 스크립트

echo "🔧 GitHub OAuth 로그인 문제 빠른 해결"
echo "====================================="
echo ""

# 1. 현재 상황 확인
echo "1️⃣ 현재 상황:"
echo "  - 로컬에서 개발 중이신가요? (y/n)"
read -p "> " IS_LOCAL

if [ "$IS_LOCAL" = "y" ]; then
    echo ""
    echo "✅ 로컬 개발 해결책:"
    echo "  1. 개발 서버 실행: npm run dev"
    echo "  2. http://localhost:3000 에서 접속"
    echo "  3. GitHub OAuth 앱의 콜백 URL이 http://localhost:3000/auth/callback 인지 확인"
else
    echo ""
    echo "✅ 배포 환경 해결책:"
    echo "  1. Vercel 대시보드에서 환경 변수 설정:"
    echo "     NEXTAUTH_URL=https://your-domain.vercel.app"
    echo "  2. GitHub OAuth 앱의 콜백 URL을 배포 도메인으로 변경"
    echo "  3. 또는 게스트 로그인 사용 (즉시 가능)"
fi

echo ""
echo "2️⃣ GitHub OAuth 앱 설정 확인:"
echo "  https://github.com/settings/developers"
echo ""
echo "  현재 Client ID: your_github_client_id_here"
echo "  콜백 URL 설정 필요:"
echo "  - 로컬: http://localhost:3000/auth/callback"
echo "  - 배포: https://your-domain.vercel.app/auth/callback"

echo ""
echo "3️⃣ 즉시 사용 가능한 대안:"
echo "  🟢 게스트 로그인 사용 (GitHub 인증 불필요)"
echo "     - 로그인 페이지에서 '게스트로 시작하기' 클릭"
echo "     - 모든 기본 기능 사용 가능"

echo ""
echo "====================================="
echo "진단 도구 실행: node scripts/diagnose-oauth-issue.js"