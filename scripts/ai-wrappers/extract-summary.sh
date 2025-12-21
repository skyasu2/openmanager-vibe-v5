#!/bin/bash

# 분석 파일 핵심 요약 추출 헬퍼
# 버전: 1.0.0
# 날짜: 2025-10-15
# 목적: Gemini CLI git-ignore 제약 우회

set -euo pipefail

# 사용법
if [ $# -eq 0 ]; then
    echo "Usage: $0 <file1.md> [file2.md] [file3.md] ..."
    echo "Example: $0 reports/planning/analysis/ai-architecture-report.md"
    exit 1
fi

# Executive Summary 섹션 추출 함수
extract_executive_summary() {
    local file="$1"
    local filename=$(basename "$file")

    echo ""
    echo "## 📄 $filename"
    echo ""

    # Executive Summary 섹션만 추출 (다음 ## 전까지)
    awk '
    /^## 📊 Executive Summary/ { found=1; print; next }
    found && /^## [^📊]/ { exit }
    found { print }
    ' "$file"
}

# 모든 파일 처리
for file in "$@"; do
    if [ -f "$file" ]; then
        extract_executive_summary "$file"
    else
        echo "⚠️  파일 없음: $file" >&2
    fi
done
