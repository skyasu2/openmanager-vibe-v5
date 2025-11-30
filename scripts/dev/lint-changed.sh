#!/usr/bin/env bash
# scripts/dev/lint-changed.sh
# 변경된 파일만 Biome 검사 (타임아웃 방지)

set -euo pipefail

echo "🔍 Linting changed files only (Biome)..."

# Git에서 변경된 파일 가져오기 (staged + unstaged)
# Biome은 json, css도 지원하므로 확장자 추가
CHANGED_FILES=$(git diff --name-only --diff-filter=ACM HEAD 2>/dev/null | grep -E '\.(ts|tsx|js|jsx|json|css)$' || true)

# Staged 파일도 포함
STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM 2>/dev/null | grep -E '\.(ts|tsx|js|jsx|json|css)$' || true)

# 합치기
ALL_CHANGED=$(echo -e "$CHANGED_FILES\n$STAGED_FILES" | sort -u | grep -v '^$' || true)

if [ -z "$ALL_CHANGED" ]; then
  echo "✅ No supported files changed"
  exit 0
fi

echo "📝 Changed files:"
echo "$ALL_CHANGED" | sed 's/^/  - /'

# 파일 개수 확인
FILE_COUNT=$(echo "$ALL_CHANGED" | wc -l)
echo ""
echo "📊 Total: $FILE_COUNT file(s)"

# Biome 실행 (변경된 파일만)
echo ""
echo "🔧 Running Biome..."
# Biome은 파일 리스트를 인자로 받을 수 있음
# xargs를 사용하여 파일 목록 전달
echo "$ALL_CHANGED" | xargs npx @biomejs/biome check --write --no-errors-on-unmatched

echo ""
echo "✅ Biome passed for changed files!"
