#!/usr/bin/env bash
# scripts/dev/typecheck-changed.sh
# 변경된 파일만 TypeScript 검사 (증분 컴파일)

set -euo pipefail

echo "🔍 Type-checking changed files only..."

# Git에서 변경된 파일 가져오기
CHANGED_FILES=$(git diff --name-only --diff-filter=ACM HEAD 2>/dev/null | grep -E '\.(ts|tsx)$' || true)
STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM 2>/dev/null | grep -E '\.(ts|tsx)$' || true)

# 합치기
ALL_CHANGED=$(echo -e "$CHANGED_FILES\n$STAGED_FILES" | sort -u | grep -v '^$' || true)

if [ -z "$ALL_CHANGED" ]; then
  echo "✅ No TypeScript files changed"
  exit 0
fi

echo "📝 Changed files:"
echo "$ALL_CHANGED" | sed 's/^/  - /'

# 파일 개수 확인
FILE_COUNT=$(echo "$ALL_CHANGED" | wc -l)
echo ""
echo "📊 Total: $FILE_COUNT file(s)"

# TypeScript 증분 컴파일 (tsc --incremental)
echo ""
echo "🔧 Running TypeScript compiler (incremental mode)..."

# tsconfig.json에 incremental 옵션 추가하여 빌드 캐시 활용
npx tsc --noEmit --incremental --pretty

echo ""
echo "✅ TypeScript check passed for changed files!"
