#!/bin/bash

# 아카이브 문서 AI 최적화 배치 스크립트
# 보존 가치가 높은 문서들을 우선으로 AI 메타데이터 적용

set -e

ARCHIVE_DIR="/mnt/d/cursor/openmanager-vibe-v5/docs/archive"
LOG_FILE="/mnt/d/cursor/openmanager-vibe-v5/docs/logs/archive-optimization-$(date +%Y%m%d).log"

echo "🚀 아카이브 문서 AI 최적화 시작: $(date)" | tee -a "$LOG_FILE"

# 우선순위 높은 카테고리 정의
HIGH_PRIORITY_DIRS=(
    "ai-tools"
    "design" 
    "guides"
    "development"
    "api"
    "mcp"
    "performance"
)

# 중복/레거시 제외 패턴
EXCLUDE_PATTERNS=(
    "*/blog/*"
    "*/reports/*" 
    "*/duplicate-cleanup-*"
    "*-v5.[0-6]*"
    "*-2024-*"
)

# 처리된 파일 카운터
PROCESSED=0
SKIPPED=0

# 보존 가치 문서 처리 함수
process_high_value_doc() {
    local file="$1"
    local category="$2"
    
    echo "📄 처리 중: $file" | tee -a "$LOG_FILE"
    
    # 이미 AI 최적화된 파일 스킵
    if grep -q "ai_optimized: true" "$file" 2>/dev/null; then
        echo "   ✅ 이미 최적화됨 - 스킵"
        ((SKIPPED++))
        return
    fi
    
    # 파일명에서 ID 생성
    local filename=$(basename "$file" .md)
    local id="${category}-${filename,,}"
    id=$(echo "$id" | sed 's/[^a-z0-9-]/-/g' | sed 's/--*/-/g')
    
    # 카테고리별 키워드 설정
    local keywords=""
    case "$category" in
        "ai-tools") keywords='["ai", "cli", "tools", "automation"]' ;;
        "design") keywords='["design", "architecture", "system"]' ;;
        "guides") keywords='["guide", "setup", "configuration"]' ;;
        "development") keywords='["development", "workflow", "process"]' ;;
        "api") keywords='["api", "endpoints", "schema"]' ;;
        "mcp") keywords='["mcp", "protocol", "integration"]' ;;
        "performance") keywords='["performance", "optimization", "metrics"]' ;;
        *) keywords='["archive", "documentation"]' ;;
    esac
    
    # 임시 파일 생성
    local temp_file=$(mktemp)
    
    # YAML frontmatter 생성
    cat > "$temp_file" << EOF
---
id: $id
title: "$(head -1 "$file" | sed 's/^# *//' | sed 's/"//g')"
keywords: $keywords
priority: medium
ai_optimized: true
related_docs: []
updated: "2025-09-16"
archived: true
category: "$category"
---

EOF
    
    # 기존 내용에서 첫 번째 헤딩 제거하고 추가
    tail -n +2 "$file" >> "$temp_file"
    
    # 원본 파일 교체
    mv "$temp_file" "$file"
    
    echo "   ✅ AI 메타데이터 적용 완료"
    ((PROCESSED++))
}

# 메인 처리 루프
echo "📋 우선순위 높은 카테고리 처리 시작..." | tee -a "$LOG_FILE"

for category in "${HIGH_PRIORITY_DIRS[@]}"; do
    category_path="$ARCHIVE_DIR/$category"
    
    if [[ ! -d "$category_path" ]]; then
        echo "⚠️  카테고리 없음: $category" | tee -a "$LOG_FILE"
        continue
    fi
    
    echo "📁 처리 중: $category" | tee -a "$LOG_FILE"
    
    # 해당 카테고리의 모든 .md 파일 처리
    find "$category_path" -name "*.md" -type f | while read -r file; do
        # 제외 패턴 체크
        skip=false
        for pattern in "${EXCLUDE_PATTERNS[@]}"; do
            if [[ "$file" == $pattern ]]; then
                skip=true
                break
            fi
        done
        
        if [[ "$skip" == "true" ]]; then
            echo "   ⏭️  제외 패턴: $(basename "$file")"
            ((SKIPPED++))
            continue
        fi
        
        process_high_value_doc "$file" "$category"
    done
    
    echo "   ✅ $category 카테고리 처리 완료" | tee -a "$LOG_FILE"
done

# 처리 결과 요약
echo "" | tee -a "$LOG_FILE"
echo "🎉 아카이브 문서 AI 최적화 완료: $(date)" | tee -a "$LOG_FILE"
echo "📊 처리 결과:" | tee -a "$LOG_FILE"
echo "   - 처리된 문서: $PROCESSED개" | tee -a "$LOG_FILE"
echo "   - 스킵된 문서: $SKIPPED개" | tee -a "$LOG_FILE"
echo "   - 로그 파일: $LOG_FILE" | tee -a "$LOG_FILE"

exit 0