#!/bin/bash

echo "🧹 병합된 브랜치 정리 스크립트 시작..."

# 병합된 브랜치들 목록
MERGED_BRANCHES=(
  "codex/add-ai-insights-generation-to-generateaiinsights"
  "codex/add-integration-test-for-hybridaiengine"
  "codex/python-관련-코드-및-디렉터리-삭제"
  "codex/update-ai-engine-methods-and-add-tests"
  "codex/update-hybrid-ai-engine.ts-functions"
  "codex/write-tests-for-hybridaiengine.processhybridquery"
  "codex/문서-업데이트-및-구조-수정"
  "codex/수정-tensorflow-분석-및-mcp-액션-구현"
)

# 중복된 브랜치들
DUPLICATE_BRANCHES=(
  "codex/delete-python-warmup-and-fastapi-components"
  "codex/빈-메서드에-로직-추가"
  "txkuaa-codex/빈-메서드에-로직-추가"
)

echo "✅ 병합된 브랜치 삭제 중..."
for branch in "${MERGED_BRANCHES[@]}"; do
  echo "🗑️ 삭제 중: $branch"
  git push origin --delete "$branch" --no-verify 2>/dev/null || echo "⚠️ $branch 삭제 실패 또는 이미 삭제됨"
done

echo "🔄 중복 브랜치 삭제 중..."
for branch in "${DUPLICATE_BRANCHES[@]}"; do
  echo "🗑️ 삭제 중: $branch"
  git push origin --delete "$branch" --no-verify 2>/dev/null || echo "⚠️ $branch 삭제 실패 또는 이미 삭제됨"
done

echo "🔄 로컬 브랜치 참조 정리..."
git remote prune origin
git fetch --prune

echo "✅ 브랜치 정리 완료!"
echo "📊 현재 원격 브랜치 상태:"
git branch -r 