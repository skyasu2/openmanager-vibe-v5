#!/bin/bash
# 문서 검증 스크립트 v1.0.0
# - 400줄 초과 파일 검사
# - 깨진 링크 검사 (선택)
# - 중복 파일명 검사

set -e

DOCS_DIR="${1:-docs}"
MAX_LINES=400
ERRORS=0
WARNINGS=0

echo "📚 문서 검증 시작..."
echo "================================================"

# 1. 400줄 초과 파일 검사
echo ""
echo "📏 [1/3] 400줄 초과 파일 검사"
echo "------------------------------------------------"

OVER_LIMIT=$(find "$DOCS_DIR" -name "*.md" -type f | while read -r file; do
    lines=$(wc -l < "$file")
    if [ "$lines" -gt "$MAX_LINES" ]; then
        echo "$file:$lines"
    fi
done)

if [ -n "$OVER_LIMIT" ]; then
    echo "⚠️  400줄 초과 파일 발견:"
    echo "$OVER_LIMIT" | while IFS=: read -r file lines; do
        echo "   - $file ($lines줄)"
    done
    WARNINGS=$((WARNINGS + $(echo "$OVER_LIMIT" | wc -l)))
else
    echo "✅ 모든 파일이 400줄 이하입니다."
fi

# 2. 중복 파일명 검사
echo ""
echo "🔍 [2/3] 중복 파일명 검사"
echo "------------------------------------------------"

DUPLICATES=$(find "$DOCS_DIR" -name "*.md" -type f -exec basename {} \; | sort | uniq -d)

if [ -n "$DUPLICATES" ]; then
    echo "⚠️  중복 파일명 발견:"
    for dup in $DUPLICATES; do
        echo "   - $dup:"
        find "$DOCS_DIR" -name "$dup" -type f | sed 's/^/      /'
    done
    WARNINGS=$((WARNINGS + $(echo "$DUPLICATES" | wc -w)))
else
    echo "✅ 중복 파일명이 없습니다."
fi

# 3. YAML frontmatter 검사
echo ""
echo "📋 [3/3] YAML frontmatter 검사"
echo "------------------------------------------------"

MISSING_FRONTMATTER=0
for file in $(find "$DOCS_DIR" -name "*.md" -type f ! -path "*/archive/*"); do
    if ! head -1 "$file" | grep -q "^---$"; then
        if [ "$MISSING_FRONTMATTER" -eq 0 ]; then
            echo "⚠️  YAML frontmatter 누락:"
        fi
        echo "   - $file"
        MISSING_FRONTMATTER=$((MISSING_FRONTMATTER + 1))
    fi
done

if [ "$MISSING_FRONTMATTER" -eq 0 ]; then
    echo "✅ 모든 활성 문서에 frontmatter가 있습니다."
else
    WARNINGS=$((WARNINGS + MISSING_FRONTMATTER))
fi

# 결과 요약
echo ""
echo "================================================"
echo "📊 검증 결과 요약"
echo "------------------------------------------------"
echo "   총 문서: $(find "$DOCS_DIR" -name "*.md" -type f | wc -l)개"
echo "   경고: ${WARNINGS}건"
echo "   오류: ${ERRORS}건"
echo "================================================"

if [ "$ERRORS" -gt 0 ]; then
    echo "❌ 검증 실패 (오류 ${ERRORS}건)"
    exit 1
elif [ "$WARNINGS" -gt 0 ]; then
    echo "⚠️  검증 완료 (경고 ${WARNINGS}건)"
    exit 0
else
    echo "✅ 검증 성공!"
    exit 0
fi
