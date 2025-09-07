#!/bin/bash
# 🚀 Vercel 배포 전 자동 검사 시스템
# 
# 이 스크립트는 배포 전에 자동으로 실행되어
# Vercel 배포 실패를 방지합니다.

set -e  # 에러 시 스크립트 중단

echo "🚀 Vercel 배포 전 자동 검사 시작..."
echo "========================================"

# 1. Next.js 빌드 테스트 (타임아웃 5분)
echo "📦 1. Next.js 빌드 테스트 중..."
timeout 300s npm run build || {
    echo "❌ 빌드 실패 감지"
    echo "🔧 자동 복구 시도 중..."
    
    # 캐시 정리
    rm -rf .next
    rm -rf node_modules/.cache
    
    echo "✅ 캐시 정리 완료"
    echo "⚠️ 배포 전 빌드 문제 해결 필요"
    exit 1
}
echo "✅ Next.js 빌드 성공"

# 2. TypeScript 에러 체크 (경고만, 배포 중단하지 않음)
echo "📋 2. TypeScript 에러 체크 중..."
if ! npx tsc --noEmit > /tmp/ts-errors.log 2>&1; then
    ERROR_COUNT=$(grep -c "error TS" /tmp/ts-errors.log || echo "0")
    echo "⚠️ TypeScript 에러 ${ERROR_COUNT}개 발견 (배포는 계속 진행)"
else
    echo "✅ TypeScript 에러 없음"
fi

# 3. 중요 파일 존재 확인
echo "📁 3. 중요 파일 존재 확인 중..."
REQUIRED_FILES=(
    "src/app/page.tsx"
    "src/app/layout.tsx" 
    "src/app/login/page.tsx"
    "next.config.mjs"
    "package.json"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file 존재"
    else
        echo "❌ $file 누락 - 배포 중단"
        exit 1
    fi
done

# 4. 환경변수 확인
echo "🔐 4. 환경변수 설정 확인 중..."
if [ -f ".env.local" ]; then
    echo "✅ .env.local 존재"
    
    # 중요 환경변수 확인
    REQUIRED_ENV_VARS=(
        "NEXT_PUBLIC_SUPABASE_URL"
        "NEXT_PUBLIC_SUPABASE_ANON_KEY"
    )
    
    for var in "${REQUIRED_ENV_VARS[@]}"; do
        if grep -q "^${var}=" .env.local; then
            echo "✅ $var 설정됨"
        else
            echo "⚠️ $var 누락 (배포 후 설정 필요)"
        fi
    done
else
    echo "⚠️ .env.local 누락 (Vercel 환경변수 의존)"
fi

# 5. 미들웨어 충돌 확인
echo "⚙️ 5. 미들웨어 충돌 확인 중..."
if [ -d "src/middleware" ]; then
    echo "❌ src/middleware 디렉토리 충돌 감지 - 배포 중단"
    echo "💡 해결: src/middleware → src/validators로 이름 변경 필요"
    exit 1
else
    echo "✅ 미들웨어 충돌 없음"
fi

# 6. Vercel 설정 확인
echo "☁️ 6. Vercel 설정 확인 중..."
if [ -f "vercel.json" ]; then
    echo "✅ vercel.json 존재"
else
    echo "ℹ️ vercel.json 없음 (기본 설정 사용)"
fi

echo "========================================"
echo "🎯 Vercel 배포 준비 완료! ✅"
echo "💡 배포 명령어: npx vercel --prod"
echo "🌐 현재 배포: https://openmanager-vibe-v5-972gt772g-skyasus-projects.vercel.app"
echo ""