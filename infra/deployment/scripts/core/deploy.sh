#!/bin/bash

# 🚀 OpenManager v5 스마트 배포 스크립트
# 사용법: ./scripts/deploy.sh "commit message" [direct|ci]

COMMIT_MSG="$1"
DEPLOY_TYPE="$2"

echo "🚀 OpenManager v5 스마트 배포 시작..."

if [ -z "$COMMIT_MSG" ]; then
  echo "❌ 커밋 메시지가 필요합니다"
  echo "사용법: ./scripts/deploy.sh 'commit message' [direct|ci]"
  echo ""
  echo "📋 배포 유형:"
  echo "  direct - Vercel 직접 배포 (UI, 스타일, 문서)"
  echo "  ci     - GitHub Actions 사용 (API, 핵심 로직)"
  exit 1
fi

# 로컬 빌드 테스트
echo "🔧 로컬 빌드 테스트 중..."
npm run build || {
  echo "❌ 빌드 실패! 배포를 중단합니다."
  exit 1
}

# Git 상태 확인
echo "📋 Git 상태 확인..."
git status

# 배포 유형에 따른 처리
if [ "$DEPLOY_TYPE" = "direct" ]; then
  echo "🚀 직접 배포 모드 (GitHub Actions 스킵)"
  
  # Git 커밋 with [direct] 태그
  git add .
  git commit -m "$COMMIT_MSG [direct]"
  
  echo "📦 Vercel 직접 배포 중..."
  npm run deploy || {
    echo "❌ Vercel 배포 실패!"
    exit 1
  }
  
  echo "📤 Git 푸시 중..."
  git push
  
  echo "✅ 직접 배포 완료!"
  echo "🔗 배포 상태: https://vercel.com/dashboard"
  
elif [ "$DEPLOY_TYPE" = "ci" ] || [ -z "$DEPLOY_TYPE" ]; then
  echo "🔄 CI 배포 모드 (GitHub Actions 사용)"
  
  git add .
  git commit -m "$COMMIT_MSG"
  
  echo "📤 Git 푸시 중..."
  git push
  
  echo "✅ GitHub Actions CI 트리거됨"
  echo "🔗 GitHub Actions: https://github.com/$(git config --get remote.origin.url | sed 's/.*github.com[:\/]\([^.]*\).*/\1/')/actions"
  
else
  echo "❌ 잘못된 배포 유형: $DEPLOY_TYPE"
  echo "유효한 옵션: direct, ci"
  exit 1
fi

echo "🎉 배포 프로세스 완료!" 