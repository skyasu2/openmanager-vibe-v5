#!/bin/bash

# Vercel 배포 스크립트 - OpenManager Vibe v5
# 작성일: 2025-01-04
# 목적: Vercel 플랫폼에 최적화된 배포 자동화

echo "🚀 Vercel 배포 시작 - OpenManager Vibe v5"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 1. 배포 전 확인
echo "📋 1. 배포 전 확인 단계"
echo "   ✅ 로컬 빌드 테스트 중..."
npm run build
if [ $? -ne 0 ]; then
    echo "❌ 로컬 빌드 실패! 배포를 중단합니다."
    exit 1
fi
echo "   ✅ 로컬 빌드 성공"

# 2. Vercel CLI 확인
echo "📋 2. Vercel CLI 확인"
if ! command -v vercel &> /dev/null; then
    echo "   📦 Vercel CLI 설치 중..."
    npm install -g vercel
else
    echo "   ✅ Vercel CLI 이미 설치됨"
fi

# 3. 환경변수 확인
echo "📋 3. 환경변수 확인"
echo "   📝 중요: 다음 환경변수들이 Vercel Dashboard에 설정되어 있는지 확인하세요:"
echo "   🔑 SUPABASE_URL"
echo "   🔑 SUPABASE_ANON_KEY" 
echo "   🔑 GOOGLE_AI_API_KEY"
echo "   🔑 NODE_ENV=production"
echo "   🔑 VERCEL=1"
echo "   📚 전체 목록: vercel-env-template.txt 참조"

# 4. Git 상태 확인
echo "📋 4. Git 상태 확인"
if [ -n "$(git status --porcelain)" ]; then
    echo "   ⚠️ 커밋되지 않은 변경사항이 있습니다."
    echo "   📤 변경사항을 커밋하시겠습니까? (y/N)"
    read -r response
    if [[ "$response" =~ ^[Yy]$ ]]; then
        git add .
        git commit -m "feat: Vercel 배포 최적화"
        git push origin main
        echo "   ✅ 변경사항 커밋 완료"
    fi
else
    echo "   ✅ Git 상태 클린"
fi

# 5. 배포 실행
echo "📋 5. Vercel 배포 실행"
echo "   🚀 배포 모드를 선택하세요:"
echo "   1) 프로덕션 배포 (--prod)"
echo "   2) 프리뷰 배포 (기본값)"
echo "   선택 (1/2): "
read -r deploy_mode

if [ "$deploy_mode" = "1" ]; then
    echo "   🌟 프로덕션 배포 시작..."
    vercel --prod
else
    echo "   🔍 프리뷰 배포 시작..."
    vercel
fi

# 6. 배포 후 확인
echo "📋 6. 배포 후 확인"
echo "   🔗 배포된 URL을 확인하고 다음 기능들을 테스트하세요:"
echo "   ✅ 홈페이지 로딩"
echo "   ✅ 대시보드 데이터 표시"
echo "   ✅ AI 채팅 기능"
echo "   ✅ 서버 모니터링"

echo ""
echo "🎉 Vercel 배포 스크립트 완료!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📚 추가 정보:"
echo "   📖 환경변수 설정: vercel-env-template.txt"
echo "   🔧 문제 해결: README.md의 Vercel 섹션 참조"
echo "   🌐 대시보드: https://vercel.com/dashboard" 