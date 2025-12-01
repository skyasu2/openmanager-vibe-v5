#!/bin/bash
# 문서 검증 스크립트 v1.1.0
# - 400줄 경고, 500줄 분리 권고 (docs/*.md만)
# - 중복 파일명 검사 (environment/ vs core/ 분리는 정상)
# - YAML frontmatter 검사

set -e

DOCS_DIR="${1:-docs}"
WARN_LINES=400
SPLIT_LINES=500
ERRORS=0
WARNINGS=0

echo "📚 문서 검증 시작..."
echo "================================================"

# 1. 줄 수 검사 (400줄 경고, 500줄 분리 권고)
echo ""
echo "📏 [1/3] 문서 크기 검사 (400줄 경고 / 500줄 분리)"
echo "------------------------------------------------"

OVER_500=0
OVER_400=0

find "$DOCS_DIR" -name "*.md" -type f ! -path "*/archive/*" | while read -r file; do
    lines=$(wc -l < "$file")
    if [ "$lines" -gt "$SPLIT_LINES" ]; then
        echo "🔴 분리 필요: $file ($lines줄)"
    elif [ "$lines" -gt "$WARN_LINES" ]; then
        echo "🟡 경고: $file ($lines줄)"
    fi
done

echo ""
echo "   💡 archive/ 폴더는 검사에서 제외됩니다."

# 2. 중복 파일명 검사 (environment/ vs core/ 분리는 정상)
echo ""
echo "🔍 [2/3] 중복 파일명 검사"
echo "------------------------------------------------"
echo "   💡 README.md, environment/ vs core/ 분리는 정상입니다."
echo ""

# 같은 상위 디렉토리 내 중복만 검사 (environment/tools/ai-tools/ 내부 등)
find "$DOCS_DIR" -name "*.md" -type f ! -name "README.md" | while read -r file; do
    basename_file=$(basename "$file")
    dir_file=$(dirname "$file")

    # 같은 계층(ai/, ai-tools/ 등)에서 중복 찾기
    count=$(find "$DOCS_DIR" -name "$basename_file" -type f ! -name "README.md" | wc -l)
    if [ "$count" -gt 1 ]; then
        # environment/ vs core/ 분리는 허용
        env_count=$(find "$DOCS_DIR/environment" -name "$basename_file" -type f 2>/dev/null | wc -l)
        core_count=$(find "$DOCS_DIR/core" -name "$basename_file" -type f 2>/dev/null | wc -l)
        other_count=$((count - env_count - core_count))

        # 동일 영역 내 중복만 경고
        if [ "$env_count" -gt 1 ] || [ "$core_count" -gt 1 ] || [ "$other_count" -gt 1 ]; then
            echo "⚠️  $basename_file (${count}개):"
            find "$DOCS_DIR" -name "$basename_file" -type f | sed 's/^/      /'
        fi
    fi
done | sort -u

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
TOTAL_DOCS=$(find "$DOCS_DIR" -name "*.md" -type f | wc -l)
ACTIVE_DOCS=$(find "$DOCS_DIR" -name "*.md" -type f ! -path "*/archive/*" | wc -l)
ARCHIVE_DOCS=$(find "$DOCS_DIR/archive" -name "*.md" -type f 2>/dev/null | wc -l)
OVER_500=$(find "$DOCS_DIR" -name "*.md" -type f ! -path "*/archive/*" -exec wc -l {} + 2>/dev/null | awk -v limit=500 '$1 > limit && !/total$/ {count++} END {print count+0}')
OVER_400=$(find "$DOCS_DIR" -name "*.md" -type f ! -path "*/archive/*" -exec wc -l {} + 2>/dev/null | awk -v limit=400 '$1 > limit && $1 <= 500 && !/total$/ {count++} END {print count+0}')

echo "   총 문서: ${TOTAL_DOCS}개 (활성: ${ACTIVE_DOCS}, 아카이브: ${ARCHIVE_DOCS})"
echo "   🔴 500줄+ (분리 필요): ${OVER_500}개"
echo "   🟡 400-500줄 (경고): ${OVER_400}개"
echo "================================================"

echo ""
echo "📋 규칙:"
echo "   - 400줄 이상: 경고 (검토 필요)"
echo "   - 500줄 이상: 분리 필요"
echo "   - archive/: 검사 제외 (삭제 가능한 문서)"
echo "   - environment/ vs core/: 분리 유지 (중복 아님)"
echo ""

if [ "$OVER_500" -gt 0 ]; then
    echo "⚠️  ${OVER_500}개 파일이 500줄을 초과합니다. 분리를 권장합니다."
    exit 0
else
    echo "✅ 검증 완료!"
    exit 0
fi
