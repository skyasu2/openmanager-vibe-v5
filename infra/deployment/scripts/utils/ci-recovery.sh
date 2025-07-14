#!/bin/bash

# CI/CD 복구 스크립트
# 사용법: ./scripts/ci-recovery.sh

set -e

echo "🔄 CI/CD 복구 스크립트 시작..."

# 1. Git 상태 확인
echo "📋 Git 상태 확인..."
git status
git log --oneline -5

# 2. 빈 커밋으로 CI 재트리거
echo "🔄 빈 커밋으로 CI 재트리거..."
git commit --allow-empty -m "🔄 CI 재트리거 - $(date '+%Y-%m-%d %H:%M:%S')"

# 3. 강제 푸시 (조심해서 사용)
read -p "강제 푸시를 실행하시겠습니까? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🚀 강제 푸시 실행..."
    git push origin main --force-with-lease
else
    echo "📤 일반 푸시 실행..."
    git push origin main
fi

echo "✅ CI/CD 복구 스크립트 완료!"
echo "🔗 GitHub Actions: https://github.com/$(git config --get remote.origin.url | sed 's/.*github.com[:\/]\([^.]*\).*/\1/')/actions" 