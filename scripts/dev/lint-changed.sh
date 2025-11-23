#!/usr/bin/env bash
# scripts/dev/lint-changed.sh
# 변경된 파일만 ESLint 검사 (타임아웃 방지)

set -euo pipefail

echo "🔍 Linting changed files only..."

# Git에서 변경된 파일 가져오기 (staged + unstaged)
CHANGED_FILES=$(git diff --name-only --diff-filter=ACM HEAD 2>/dev/null | grep -E '\.(ts|tsx|js|jsx)$' || true)

# Staged 파일도 포함
STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM 2>/dev/null | grep -E '\.(ts|tsx|js|jsx)$' || true)

# 합치기
ALL_CHANGED=$(echo -e "$CHANGED_FILES\n$STAGED_FILES" | sort -u | grep -v '^$' || true)

if [ -z "$ALL_CHANGED" ]; then
  echo "✅ No TypeScript/JavaScript files changed"
  exit 0
fi

echo "📝 Changed files:"
echo "$ALL_CHANGED" | sed 's/^/  - /'

# 파일 개수 확인
FILE_COUNT=$(echo "$ALL_CHANGED" | wc -l)
echo ""
echo "📊 Total: $FILE_COUNT file(s)"

# ESLint 실행 (변경된 파일만)
echo ""
echo "🔧 Running ESLint..."
echo "$ALL_CHANGED" | xargs npx eslint --max-warnings=100 --fix

echo ""
echo "✅ ESLint passed for changed files!"
