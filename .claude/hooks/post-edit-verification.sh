#!/bin/bash

# 🔍 Post-Edit Verification Hook
# Claude Code에서 파일 수정 후 자동 실행되는 검증 스크립트
# 
# 인자:
# $1: 수정된 파일 경로
# $2: 사용된 도구 (Edit/Write/MultiEdit)
# $3: 변경 내용 (선택적)

set -e

# === 설정 ===
PROJECT_ROOT="/mnt/d/cursor/openmanager-vibe-v5"
CLAUDE_DIR="$PROJECT_ROOT/.claude"
REVIEW_QUEUE="$CLAUDE_DIR/review-queue.txt"
SECURITY_QUEUE="$CLAUDE_DIR/security-review-queue.txt"
LOG_FILE="$CLAUDE_DIR/hooks.log"

# === 색상 코드 ===
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# === 함수 정의 ===

# 로그 기록
log_message() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
    echo -e "$1"
}

# 파일 크기 계산
get_file_size() {
    local file="$1"
    if [ -f "$file" ]; then
        wc -l "$file" | awk '{print $1}'
    else
        echo "0"
    fi
}

# 변경 크기 분석
analyze_change_size() {
    local file="$1"
    local size=$(get_file_size "$file")
    
    if [ "$size" -lt 50 ]; then
        echo "LEVEL_1"
    elif [ "$size" -lt 200 ]; then
        echo "LEVEL_2"
    else
        echo "LEVEL_3"
    fi
}

# 중요 파일 확인
is_critical_file() {
    local file="$1"
    
    # 중요 파일 패턴
    if [[ "$file" =~ /(api|auth)/ ]] || \
       [[ "$file" =~ \.(config|env) ]] || \
       [[ "$file" =~ (middleware|route|schema) ]]; then
        return 0  # true
    fi
    
    return 1  # false
}

# === 메인 로직 ===

# 인자 확인
FILE_PATH="${1:-}"
TOOL_USED="${2:-}"
CHANGES="${3:-}"

if [ -z "$FILE_PATH" ]; then
    log_message "${YELLOW}⚠️ 파일 경로가 제공되지 않았습니다.${NC}"
    exit 0
fi

log_message "${BLUE}📝 파일 수정 감지: $FILE_PATH (도구: $TOOL_USED)${NC}"

# 1. 변경 크기 분석
REVIEW_LEVEL=$(analyze_change_size "$FILE_PATH")
log_message "📊 검토 레벨: $REVIEW_LEVEL"

# 2. 중요 파일 확인
if is_critical_file "$FILE_PATH"; then
    log_message "${RED}🔐 중요 파일 변경 감지!${NC}"
    echo "$FILE_PATH" >> "$SECURITY_QUEUE"
    REVIEW_LEVEL="LEVEL_3"  # 중요 파일은 무조건 Level 3
fi

# 3. 검토 큐에 추가
echo "$FILE_PATH:$REVIEW_LEVEL:$(date '+%s')" >> "$REVIEW_QUEUE"

# 4. 자동 검증 트리거 메시지
case "$REVIEW_LEVEL" in
    LEVEL_1)
        log_message "${GREEN}✅ Level 1 검토 - 단일 에이전트 검증으로 충분${NC}"
        echo "💡 팁: 'Task verification-specialist' 실행을 권장합니다."
        ;;
    LEVEL_2)
        log_message "${YELLOW}⚠️ Level 2 검토 필요 - 2개 에이전트 병렬 검증${NC}"
        echo "💡 팁: 'Task ai-collaboration-coordinator' 실행을 권장합니다."
        ;;
    LEVEL_3)
        log_message "${RED}🚨 Level 3 전체 검토 필요 - 멀티 AI 검증${NC}"
        echo "💡 팁: 'Task ai-collaboration-coordinator' + 외부 AI 검증이 필요합니다."
        touch "$CLAUDE_DIR/needs-full-review.flag"
        ;;
esac

# 5. 특정 패턴 검사
if grep -q "dangerouslySetInnerHTML\|eval(\|innerHTML" "$FILE_PATH" 2>/dev/null; then
    log_message "${RED}⚠️ 보안 위험 패턴 감지! 즉시 검토 필요${NC}"
    echo "SECURITY_RISK:$FILE_PATH" >> "$SECURITY_QUEUE"
fi

# 6. TypeScript 에러 체크 (선택적)
if [[ "$FILE_PATH" =~ \.(ts|tsx)$ ]]; then
    # TypeScript 컴파일러로 간단한 체크 (비동기)
    (cd "$PROJECT_ROOT" && npx tsc --noEmit --skipLibCheck "$FILE_PATH" 2>/dev/null) &
fi

# 7. 검토 대기 파일 수 표시
PENDING_COUNT=$(wc -l < "$REVIEW_QUEUE" 2>/dev/null || echo "0")
if [ "$PENDING_COUNT" -gt 0 ]; then
    log_message "${YELLOW}📋 검토 대기 중인 파일: $PENDING_COUNT개${NC}"
fi

# 8. 보안 검토 필요 파일 확인
if [ -f "$SECURITY_QUEUE" ]; then
    SECURITY_COUNT=$(wc -l < "$SECURITY_QUEUE" 2>/dev/null || echo "0")
    if [ "$SECURITY_COUNT" -gt 0 ]; then
        log_message "${RED}🔐 보안 검토 필요 파일: $SECURITY_COUNT개${NC}"
        echo "💡 'Task security-auditor-enhanced' 실행을 강력히 권장합니다!"
    fi
fi

log_message "${GREEN}✅ Post-edit 검증 훅 완료${NC}"
exit 0