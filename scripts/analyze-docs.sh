#!/bin/bash

# docs 디렉토리 구조 분석 스크립트

echo "=== docs 디렉토리 전체 구조 분석 ==="
echo

# 전체 파일 수
echo "📊 전체 통계:"
echo "- 총 파일 수: $(find docs -name "*.md" | wc -l)"
echo "- 총 디렉토리 수: $(find docs -type d | wc -l)"
echo

# 디렉토리별 파일 수
echo "📁 디렉토리별 파일 수:"
find docs -type d | while read dir; do
    count=$(find "$dir" -maxdepth 1 -name "*.md" | wc -l)
    if [ $count -gt 0 ]; then
        echo "  $dir: $count개"
    fi
done | sort -nr -k2
echo

# 중복 파일명 검사
echo "🔍 중복 파일명 검사:"
find docs -name "*.md" -exec basename {} \; | sort | uniq -d | while read filename; do
    echo "  $filename:"
    find docs -name "$filename" | while read filepath; do
        size=$(stat -c%s "$filepath")
        echo "    - $filepath (${size}B)"
    done
    echo
done

# 파일 크기 분포
echo "📊 파일 크기 분포:"
echo "  - 1KB 미만: $(find docs -name "*.md" -size -1k | wc -l)개"
echo "  - 1-10KB: $(find docs -name "*.md" -size +1k -size -10k | wc -l)개"
echo "  - 10-50KB: $(find docs -name "*.md" -size +10k -size -50k | wc -l)개"
echo "  - 50KB 이상: $(find docs -name "*.md" -size +50k | wc -l)개"
echo

# TODO/FIXME/업데이트 필요 파일
echo "⚠️ 업데이트 필요 파일:"
grep -r -l "TODO\|FIXME\|업데이트\|outdated\|deprecated" docs --include="*.md" 2>/dev/null | head -10
echo

# 최근 수정된 파일 (최신 5개)
echo "📅 최근 수정된 파일 (최신 5개):"
find docs -name "*.md" -type f -printf '%T@ %p\n' | sort -nr | head -5 | while read timestamp filepath; do
    date=$(date -d "@$timestamp" +"%Y-%m-%d %H:%M")
    echo "  $date - $filepath"
done
