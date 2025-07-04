#!/bin/bash

# 🔧 서버 개수 8개 고정 환경변수 설정 스크립트
# OpenManager Vibe v5 - 2025년 7월 2일

echo "🔧 서버 개수 8개 고정 환경변수 설정 시작..."

# 1. 로컬 환경변수 설정 (.env.local)
echo "1. 로컬 환경변수 설정 중..."
cat >> .env.local << 'EOF'

# ========================================
# 📊 서버 개수 8개 고정 설정 (자동 추가)
# ========================================
TARGET_SERVER_COUNT=8
DEFAULT_SERVER_COUNT=8
FALLBACK_SERVER_COUNT=8
FIXED_SERVER_COUNT=8
DISABLE_LOCAL_DATA_GENERATION=true
USE_GCP_FUNCTIONS_ONLY=true

EOF

echo "✅ .env.local 파일에 서버 개수 설정 추가 완료"

# 2. Vercel 환경변수 설정 (CLI 사용)
echo "2. Vercel 환경변수 설정 중..."
echo "다음 명령어를 실행하여 Vercel에 환경변수를 설정하세요:"
echo ""
echo "vercel env add TARGET_SERVER_COUNT production"
echo "vercel env add DEFAULT_SERVER_COUNT production"
echo "vercel env add FALLBACK_SERVER_COUNT production"
echo "vercel env add FIXED_SERVER_COUNT production"
echo "vercel env add DISABLE_LOCAL_DATA_GENERATION production"
echo "vercel env add USE_GCP_FUNCTIONS_ONLY production"
echo ""
echo "각 환경변수에 대해 값을 8 또는 true로 설정하세요."

# 3. 설정 확인
echo "3. 설정 확인 중..."
echo "✅ 서버 개수 8개 고정 설정 완료"
echo ""
echo "📋 적용된 환경변수:"
echo "- TARGET_SERVER_COUNT=8"
echo "- DEFAULT_SERVER_COUNT=8"
echo "- FALLBACK_SERVER_COUNT=8"
echo "- FIXED_SERVER_COUNT=8"
echo "- DISABLE_LOCAL_DATA_GENERATION=true"
echo "- USE_GCP_FUNCTIONS_ONLY=true"
echo ""
echo "🚀 변경사항 적용을 위해 다음 명령어를 실행하세요:"
echo "npm run build"
echo "npm run dev"
echo ""
echo "🎯 이제 서버 데이터 생성 개수가 8개로 고정됩니다." 