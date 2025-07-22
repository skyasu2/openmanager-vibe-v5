#!/bin/bash

# 🔧 GitHub OAuth 로그인 문제 해결 스크립트

echo "🔧 GitHub OAuth 설정 문제 해결 중..."

# 1. 현재 설정 확인
echo "📋 현재 설정 확인:"
echo "SUPABASE_URL: $NEXT_PUBLIC_SUPABASE_URL"
echo "GITHUB_CLIENT_ID: $GITHUB_CLIENT_ID"
echo "NEXTAUTH_URL: $NEXTAUTH_URL"

# 2. 필요한 URL들 출력
echo ""
echo "🔗 설정해야 할 URL들:"
echo ""
echo "GitHub OAuth App 설정:"
echo "  Homepage URL: https://openmanager-vibe-v5.vercel.app"
echo "  Authorization callback URL: https://vnswjnltnhpsueosf.supabase.co/auth/v1/callback"
echo ""
echo "Supabase 설정:"
echo "  Site URL: https://openmanager-vibe-v5.vercel.app"
echo "  Redirect URLs:"
echo "    - https://openmanager-vibe-v5.vercel.app/auth/callback"
echo "    - https://openmanager-vibe-v5.vercel.app/main"
echo "    - http://localhost:3000/auth/callback"
echo "    - http://localhost:3000/main"

# 3. 테스트 명령어
echo ""
echo "🧪 테스트 명령어:"
echo "curl -s https://openmanager-vibe-v5.vercel.app/api/auth/test"

echo ""
echo "✅ 설정 완료 후 다음 단계:"
echo "1. GitHub OAuth App에서 callback URL 수정"
echo "2. Supabase에서 redirect URLs 추가"
echo "3. .env.local에서 실제 Supabase 키 값 설정"
echo "4. 로그인 테스트: https://openmanager-vibe-v5.vercel.app/login"