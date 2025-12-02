#!/bin/bash

# AI Review Utilities - v6.0.0
# 유틸리티 함수 모음 (로그, 카운터, 변경사항 수집 등)
# v6.0.0 (2025-12-02): 순서 기반 AI 선택 (codex↔gemini 교대, qwen은 최종 폴백)

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

# 로그 함수들
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

log_ai_engine() {
    echo -e "${MAGENTA}🤖 $1${NC}"
}

# AI 사용 카운터 초기화 (v6.0.0: last_ai 추가)
init_ai_counter() {
    if [ ! -f "$STATE_FILE" ]; then
        echo "codex_count=0" > "$STATE_FILE"
        echo "gemini_count=0" >> "$STATE_FILE"
        echo "qwen_count=0" >> "$STATE_FILE"
        echo "claude_count=0" >> "$STATE_FILE"
        echo "last_ai=gemini" >> "$STATE_FILE"  # 초기값: gemini → 첫 실행 시 codex 선택
        log_info "상태 파일 초기화: $STATE_FILE"
    fi

    # 🆕 마이그레이션: qwen_count, claude_count, last_ai 없으면 추가
    if ! grep -q "^qwen_count=" "$STATE_FILE"; then
        echo "qwen_count=0" >> "$STATE_FILE"
        log_info "qwen_count 마이그레이션 완료"
    fi
    if ! grep -q "^claude_count=" "$STATE_FILE"; then
        echo "claude_count=0" >> "$STATE_FILE"
        log_info "claude_count 마이그레이션 완료"
    fi
    if ! grep -q "^last_ai=" "$STATE_FILE"; then
        echo "last_ai=gemini" >> "$STATE_FILE"
        log_info "last_ai 마이그레이션 완료"
    fi
}

# 마지막 사용 AI 읽기
get_last_ai() {
    init_ai_counter
    grep "^last_ai=" "$STATE_FILE" | cut -d'=' -f2
}

# 마지막 사용 AI 설정
set_last_ai() {
    local ai_name="$1"
    init_ai_counter
    sed -i "s/^last_ai=.*/last_ai=$ai_name/" "$STATE_FILE"
}

# AI 사용 카운터 읽기 (v5.0.0: qwen, claude 추가)
get_ai_counter() {
    local engine="$1"
    init_ai_counter

    case "$engine" in
        codex)
            grep "^codex_count=" "$STATE_FILE" | cut -d'=' -f2
            ;;
        gemini)
            grep "^gemini_count=" "$STATE_FILE" | cut -d'=' -f2
            ;;
        qwen)
            grep "^qwen_count=" "$STATE_FILE" | cut -d'=' -f2
            ;;
        claude)
            grep "^claude_count=" "$STATE_FILE" | cut -d'=' -f2
            ;;
    esac
}

# AI 사용 카운터 증가 (v5.0.0: qwen, claude 추가)
increment_ai_counter() {
    local engine="$1"
    init_ai_counter

    case "$engine" in
        codex)
            local count=$(get_ai_counter "codex")
            count=$((count + 1))
            sed -i "s/^codex_count=.*/codex_count=$count/" "$STATE_FILE"
            ;;
        gemini)
            local count=$(get_ai_counter "gemini")
            count=$((count + 1))
            sed -i "s/^gemini_count=.*/gemini_count=$count/" "$STATE_FILE"
            ;;
        qwen)
            local count=$(get_ai_counter "qwen")
            count=$((count + 1))
            sed -i "s/^qwen_count=.*/qwen_count=$count/" "$STATE_FILE"
            ;;
        claude)
            local count=$(get_ai_counter "claude")
            count=$((count + 1))
            sed -i "s/^claude_count=.*/claude_count=$count/" "$STATE_FILE"
            ;;
    esac
}

# 순서 기반 AI 선택 (v6.0.0: codex↔gemini 교대, qwen/claude는 폴백 전용)
# - 이전 AI가 codex → 이번에 gemini
# - 이전 AI가 gemini → 이번에 codex
# - Qwen, Claude는 Primary에서 제외 (폴백으로만 사용)
select_primary_ai() {
    init_ai_counter

    local last_ai=$(get_last_ai)

    # 순서 기반 선택: codex ↔ gemini 교대
    case "$last_ai" in
        codex)
            echo "gemini"
            ;;
        gemini|qwen|claude|*)
            # gemini 이후 또는 기타 모든 경우 → codex
            echo "codex"
            ;;
    esac
}

# 변경사항 수집
collect_changes() {
    log_info "📊 변경사항 수집 중..."

    # 마지막 커밋의 변경사항 가져오기
    local last_commit=$(git -C "$PROJECT_ROOT" log -1 --format=%H)
    local commit_message=$(git -C "$PROJECT_ROOT" log -1 --format=%s)
    local changed_files=$(git -C "$PROJECT_ROOT" diff-tree --no-commit-id --name-only -r "$last_commit")

    if [ -z "$changed_files" ]; then
        log_warning "변경된 파일이 없습니다"
        return 1
    fi

    log_info "마지막 커밋: $last_commit"
    log_info "커밋 메시지: $commit_message"

    # 파일별 diff 수집
    local changes_summary="**커밋**: \`$last_commit\`
**메시지**: $commit_message

"

    for file in $changed_files; do
        # 파일이 존재하는지 확인 (삭제된 파일 제외)
        if [ -f "$file" ]; then
            changes_summary+="## 📄 $file

"
            changes_summary+="\`\`\`diff
"
            changes_summary+="$(git -C "$PROJECT_ROOT" diff "$last_commit^" "$last_commit" -- "$file" 2>/dev/null | head -100)
"
            changes_summary+="\`\`\`

"
        else
            changes_summary+="## 🗑️ $file (삭제됨)

"
        fi
    done

    echo -e "$changes_summary"
}

# 특정 파일들의 변경사항만 수집 (v5.0.0: 분할 리뷰용)
collect_changes_for_files() {
    local files_list="$1"  # 줄바꿈으로 구분된 파일 목록

    # 마지막 커밋 정보
    local last_commit=$(git -C "$PROJECT_ROOT" log -1 --format=%H)
    local commit_message=$(git -C "$PROJECT_ROOT" log -1 --format=%s)

    local changes_summary="**커밋**: \`$last_commit\`
**메시지**: $commit_message

"

    # 파일 개수 계산
    local file_count=0
    while IFS= read -r file; do
        if [ -n "$file" ]; then
            file_count=$((file_count + 1))
        fi
    done <<< "$files_list"

    log_info "  📄 파일 ${file_count}개의 변경사항 수집 중..."

    # 각 파일의 diff 수집
    while IFS= read -r file; do
        if [ -z "$file" ]; then
            continue
        fi

        # 파일이 존재하는지 확인 (삭제된 파일 제외)
        if [ -f "$file" ]; then
            changes_summary+="## 📄 $file

"
            changes_summary+="\`\`\`diff
"
            changes_summary+="$(git -C "$PROJECT_ROOT" diff "$last_commit^" "$last_commit" -- "$file" 2>/dev/null | head -100)
"
            changes_summary+="\`\`\`

"
        else
            changes_summary+="## 🗑️ $file (삭제됨)

"
        fi
    done <<< "$files_list"

    echo -e "$changes_summary"
}

# Codex 사용량 제한 감지
detect_codex_rate_limit() {
    local output="$1"

    # Rate limit 또는 quota exceeded 패턴 감지
    if echo "$output" | grep -qi "rate limit\|quota exceeded\|too many requests\|429"; then
        return 0  # True: Rate limit 감지됨
    fi

    return 1  # False: 정상
}

# 검증 실행 함수는 별도 스크립트로 분리되었으므로 여기서는 제외
