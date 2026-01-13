#!/bin/bash

# Review Issue Tracker v1.0.0
# 목적: AI 코드 리뷰에서 발견된 이슈 추적 및 관리
# 사용: bash scripts/code-review/review-issue-tracker.sh [command]
#
# Commands:
#   scan      - 미확인 크리티컬 이슈 스캔
#   list      - 전체 이슈 목록 출력
#   resolve   - 이슈 해결 마킹
#   report    - 이슈 요약 리포트 생성
#   help      - 도움말

set -uo pipefail
# Note: -e removed to allow grep to return non-zero without exiting

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
REVIEWS_DIR="$PROJECT_ROOT/reports/ai-review"
TRACKING_FILE="$REVIEWS_DIR/.issue-tracking.json"

# 색상 정의
RED='\033[0;31m'
YELLOW='\033[0;33m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

# 초기화: 트래킹 파일 생성
init_tracking_file() {
    if [[ ! -f "$TRACKING_FILE" ]]; then
        echo '{"issues":[],"resolved":[],"ignored":[]}' > "$TRACKING_FILE"
        echo -e "${GREEN}✅ 이슈 트래킹 파일 생성됨${NC}"
    fi
}

# 크리티컬 이슈 스캔 (AI 리뷰 섹션에서만 검색)
scan_critical_issues() {
    echo -e "${BLUE}🔍 크리티컬 이슈 스캔 중...${NC}"
    echo -e "${YELLOW}   (AI 리뷰 결과 섹션에서만 검색, diff 내용 제외)${NC}"
    echo ""

    local count=0
    local reviewed_count=0

    # 최근 리뷰 파일 검색
    for review_file in "$REVIEWS_DIR"/review-*-2025-12-*.md; do
        [[ -f "$review_file" ]] || continue

        # 이미 검토완료된 파일 스킵
        if grep -q "^\# ✅ \[검토완료\]" "$review_file" 2>/dev/null; then
            ((reviewed_count++))
            continue
        fi

        # AI 리뷰 결과 섹션 추출 후 크리티컬 이슈 검색
        # (diff 내용에서 🔴가 있는 경우 제외)
        local ai_section=$(sed -n '/## 🚀 AI 리뷰 결과\|## 🤖 AI 코드 리뷰/,$p' "$review_file" 2>/dev/null)

        if echo "$ai_section" | grep -q "### 🔴\|^🔴 (중요)" 2>/dev/null; then
            local filename=$(basename "$review_file")
            local commit=$(grep -m1 "^\*\*커밋\*\*:" "$review_file" 2>/dev/null | sed 's/.*`\([^`]*\)`.*/\1/' || echo "N/A")
            local date_str=$(echo "$filename" | grep -oE '[0-9]{4}-[0-9]{2}-[0-9]{2}')
            local ai_engine=$(echo "$filename" | grep -oE 'codex|gemini|qwen|claude' | head -1)

            echo -e "${RED}🔴 Critical Issue Found${NC}"
            echo "   파일: $filename"
            echo "   커밋: $commit"
            echo "   날짜: $date_str"
            echo "   AI: $ai_engine"

            # AI 리뷰 섹션에서 이슈 내용 추출
            echo "$ai_section" | grep -A 3 "### 🔴" 2>/dev/null | head -5
            echo ""
            ((count++))
        fi
    done

    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "미확인 크리티컬 이슈: ${RED}${count}개${NC}"
    echo -e "검토 완료 리뷰: ${GREEN}${reviewed_count}개${NC}"
}

# 이슈 요약 리포트
generate_report() {
    echo -e "${BLUE}📊 코드 리뷰 이슈 요약 리포트${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""

    # 통계
    local total_reviews=$(ls -1 "$REVIEWS_DIR"/review-*.md 2>/dev/null | wc -l)
    local critical_count=$(grep -l "🔴" "$REVIEWS_DIR"/review-*.md 2>/dev/null | wc -l)
    local warning_count=$(grep -l "🟡\|⚠️" "$REVIEWS_DIR"/review-*.md 2>/dev/null | wc -l)
    local human_reviewed=$(wc -l < "$REVIEWS_DIR/.reviewed-by-human" 2>/dev/null || echo "0")

    echo "📈 전체 통계"
    echo "   총 리뷰 파일: $total_reviews"
    echo "   크리티컬 이슈 포함: $critical_count"
    echo "   경고 이슈 포함: $warning_count"
    echo "   인간 확인 완료: $human_reviewed"
    echo ""

    # AI 사용량
    if [[ -f "$REVIEWS_DIR/.ai-usage-state" ]]; then
        echo "🤖 AI 사용량"
        cat "$REVIEWS_DIR/.ai-usage-state"
    fi
    echo ""

    # 최근 7일 크리티컬 이슈
    echo "🔴 최근 크리티컬 이슈 (7일)"
    local recent_critical=$(find "$REVIEWS_DIR" -name "review-*.md" -mtime -7 -exec grep -l "🔴" {} \; 2>/dev/null | wc -l)
    echo "   발견: ${recent_critical}건"
}

# 이슈 해결 마킹
resolve_issue() {
    local commit_hash="$1"
    local resolved_file="$REVIEWS_DIR/.resolved-issues"

    echo "$commit_hash $(date +%Y-%m-%d)" >> "$resolved_file"
    echo -e "${GREEN}✅ 이슈 해결 마킹됨: $commit_hash${NC}"
}

# 인간 확인 추가
mark_human_reviewed() {
    local commit_hash="$1"
    local description="${2:-manual review}"

    echo "$commit_hash $(date +%Y-%m-%d) $description" >> "$REVIEWS_DIR/.reviewed-by-human"
    echo -e "${GREEN}✅ 인간 확인 마킹됨: $commit_hash${NC}"
}

# 도움말
show_help() {
    echo "Review Issue Tracker v1.0.0"
    echo ""
    echo "사용법: $0 [command] [args]"
    echo ""
    echo "Commands:"
    echo "  scan              크리티컬 이슈 스캔"
    echo "  report            이슈 요약 리포트"
    echo "  resolve <hash>    이슈 해결 마킹"
    echo "  human <hash>      인간 확인 마킹"
    echo "  help              도움말"
}

# 메인
main() {
    init_tracking_file

    local command="${1:-help}"

    case "$command" in
        scan)
            scan_critical_issues
            ;;
        report)
            generate_report
            ;;
        resolve)
            resolve_issue "${2:-}"
            ;;
        human)
            mark_human_reviewed "${2:-}" "${3:-}"
            ;;
        help|*)
            show_help
            ;;
    esac
}

main "$@"
