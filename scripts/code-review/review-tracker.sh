#!/bin/bash

# Review Tracker - 검토 완료 추적 시스템
# 버전: 1.0.0
# 날짜: 2025-12-23
#
# 기능:
# - ack: 현재/지정 커밋의 리뷰를 검토 완료로 마킹
# - pending: 검토 대기 중인 리뷰 목록 표시
# - status: 특정 커밋의 검토 상태 확인

set -e

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 프로젝트 루트
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# 파일 경로 (reports/ai-review/에 통합)
REVIEW_DIR="$PROJECT_ROOT/reports/ai-review"
REVIEWED_COMMITS_FILE="$REVIEW_DIR/.reviewed-commits"
ACKNOWLEDGED_FILE="$REVIEW_DIR/.reviewed-by-human"

# 도움말
show_help() {
    echo -e "${BLUE}🔍 Review Tracker - 코드 리뷰 검토 추적${NC}"
    echo ""
    echo "사용법:"
    echo "  $0 ack [commit_hash]   현재/지정 커밋의 리뷰를 검토 완료로 마킹"
    echo "  $0 pending             검토 대기 중인 리뷰 목록"
    echo "  $0 status [commit]     특정 커밋의 검토 상태 확인"
    echo "  $0 list                모든 검토 완료된 커밋 목록"
    echo "  $0 help                이 도움말 표시"
    echo ""
    echo "예시:"
    echo "  $0 ack                 # HEAD 커밋 리뷰 검토 완료"
    echo "  $0 ack abc1234         # 특정 커밋 리뷰 검토 완료"
    echo "  $0 pending             # 검토 대기 중인 리뷰 확인"
}

# 파일 초기화
init_files() {
    mkdir -p "$REVIEW_DIR"
    touch "$ACKNOWLEDGED_FILE"
}

# 커밋이 AI 리뷰 완료됐는지 확인
is_ai_reviewed() {
    local commit="$1"
    local short="${commit:0:7}"
    grep -q "^$short" "$REVIEWED_COMMITS_FILE" 2>/dev/null
}

# 커밋이 사람에 의해 검토됐는지 확인
is_human_acknowledged() {
    local commit="$1"
    local short="${commit:0:7}"
    grep -q "^$short" "$ACKNOWLEDGED_FILE" 2>/dev/null
}

# 검토 완료 마킹
cmd_ack() {
    local commit="${1:-$(git -C "$PROJECT_ROOT" rev-parse HEAD)}"
    local short="${commit:0:7}"
    local full_commit=$(git -C "$PROJECT_ROOT" rev-parse "$commit" 2>/dev/null || echo "$commit")
    local msg=$(git -C "$PROJECT_ROOT" log -1 --format="%s" "$full_commit" 2>/dev/null || echo "Unknown")

    init_files

    # 이미 검토됐는지 확인
    if is_human_acknowledged "$commit"; then
        echo -e "${YELLOW}⚠️  이미 검토 완료된 커밋입니다: ${short}${NC}"
        return 0
    fi

    # AI 리뷰가 있는지 확인
    if ! is_ai_reviewed "$commit"; then
        echo -e "${YELLOW}⚠️  AI 리뷰가 없는 커밋입니다: ${short}${NC}"
        echo -e "   리뷰 파일 확인: ls $REVIEW_DIR/review-*${short}*.md"
    fi

    # 검토 완료 마킹
    echo "$short $(date +%Y-%m-%d\ %H:%M) $msg" >> "$ACKNOWLEDGED_FILE"
    echo -e "${GREEN}✅ 검토 완료 마킹: ${short} - ${msg}${NC}"
}

# 검토 대기 중인 리뷰 목록
cmd_pending() {
    init_files

    echo -e "${BLUE}📋 검토 대기 중인 리뷰 (AI 리뷰됨 + 미검토)${NC}"
    echo ""

    local count=0
    local max_check=30

    # 최근 커밋 중 AI 리뷰됨 + 사람 미검토 찾기
    for commit in $(git -C "$PROJECT_ROOT" log -${max_check} --format=%H 2>/dev/null); do
        local short="${commit:0:7}"

        if is_ai_reviewed "$commit" && ! is_human_acknowledged "$commit"; then
            local msg=$(git -C "$PROJECT_ROOT" log -1 --format="%s" "$commit" 2>/dev/null)
            local date=$(git -C "$PROJECT_ROOT" log -1 --format="%cr" "$commit" 2>/dev/null)

            # 리뷰 파일 찾기
            local review_file=$(ls -t "$REVIEW_DIR"/review-*-*.md 2>/dev/null | xargs grep -l "$short" 2>/dev/null | head -1)
            local ai_engine="unknown"
            if [ -n "$review_file" ]; then
                ai_engine=$(basename "$review_file" | sed 's/review-\([^-]*\)-.*/\1/')
            fi

            echo -e "❌ ${YELLOW}${short}${NC} (${ai_engine}) - ${msg} [${date}]"
            ((count++))
        fi
    done

    if [ "$count" -eq 0 ]; then
        echo -e "${GREEN}✅ 모든 리뷰가 검토 완료되었습니다!${NC}"
    else
        echo ""
        echo -e "총 ${YELLOW}${count}개${NC} 리뷰 검토 대기 중"
        echo ""
        echo -e "검토 완료 시: ${BLUE}npm run review:ack${NC} 또는 ${BLUE}npm run review:ack <commit>${NC}"
    fi
}

# 특정 커밋 상태 확인
cmd_status() {
    local commit="${1:-$(git -C "$PROJECT_ROOT" rev-parse HEAD)}"
    local short="${commit:0:7}"

    init_files

    echo -e "${BLUE}📊 커밋 ${short} 상태${NC}"
    echo ""

    # AI 리뷰 상태
    if is_ai_reviewed "$commit"; then
        echo -e "  AI 리뷰: ${GREEN}✅ 완료${NC}"

        # 리뷰 파일 찾기
        local review_files=$(ls -t "$REVIEW_DIR"/review-*-*.md 2>/dev/null | xargs grep -l "$short" 2>/dev/null | head -3)
        if [ -n "$review_files" ]; then
            echo "  리뷰 파일:"
            echo "$review_files" | while read f; do
                echo "    - $(basename "$f")"
            done
        fi
    else
        echo -e "  AI 리뷰: ${RED}❌ 없음${NC}"
    fi

    # 사람 검토 상태
    if is_human_acknowledged "$commit"; then
        local ack_info=$(grep "^$short" "$ACKNOWLEDGED_FILE" | head -1)
        echo -e "  검토 상태: ${GREEN}✅ 완료${NC}"
        echo "    - $ack_info"
    else
        echo -e "  검토 상태: ${YELLOW}⏳ 대기 중${NC}"
    fi
}

# 검토 완료 목록
cmd_list() {
    init_files

    echo -e "${BLUE}📋 검토 완료된 커밋 목록 (최근 20개)${NC}"
    echo ""

    if [ -f "$ACKNOWLEDGED_FILE" ] && [ -s "$ACKNOWLEDGED_FILE" ]; then
        tail -20 "$ACKNOWLEDGED_FILE" | tac | while read line; do
            echo -e "  ${GREEN}✅${NC} $line"
        done
    else
        echo -e "${YELLOW}검토 완료된 커밋이 없습니다.${NC}"
    fi
}

# 메인
case "${1:-}" in
    ack|a)
        cmd_ack "$2"
        ;;
    pending|p)
        cmd_pending
        ;;
    status|s)
        cmd_status "$2"
        ;;
    list|l)
        cmd_list
        ;;
    help|h|--help|-h)
        show_help
        ;;
    *)
        if [ -n "$1" ]; then
            echo -e "${RED}알 수 없는 명령: $1${NC}"
            echo ""
        fi
        show_help
        exit 1
        ;;
esac
