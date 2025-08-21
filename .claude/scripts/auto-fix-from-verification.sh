#!/bin/bash

# 🔧 AI 검증 결과 기반 자동 수정 스크립트
# 검증된 문제들을 자동으로 수정하거나 사용자 확인을 요청합니다
#
# 사용법: ./auto-fix-from-verification.sh [options]
# Options:
#   --dry-run     실제 수정 없이 계획만 표시
#   --auto        사용자 확인 없이 자동 수정
#   --file FILE   특정 파일만 수정

set -e

# === 설정 ===
PROJECT_ROOT="/mnt/d/cursor/openmanager-vibe-v5"
CLAUDE_DIR="$PROJECT_ROOT/.claude"
STATUS_FILE="$CLAUDE_DIR/verification-status.json"
MATRIX_FILE="$CLAUDE_DIR/ai-assignment-matrix.json"
PERMISSION_FILE="$CLAUDE_DIR/fix-permission-matrix.json"
FIX_LOG="$CLAUDE_DIR/auto-fix.log"
FIX_QUEUE="$CLAUDE_DIR/fix-queue.json"

# === 색상 코드 ===
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# === 옵션 파싱 ===
DRY_RUN=false
AUTO_MODE=false
TARGET_FILE=""

while [[ $# -gt 0 ]]; do
    case $1 in
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --auto)
            AUTO_MODE=true
            shift
            ;;
        --file)
            TARGET_FILE="$2"
            shift 2
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

# === 함수 정의 ===

# 로그 기록
log_message() {
    local level="$1"
    local message="$2"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    echo "[$timestamp] [$level] $message" >> "$FIX_LOG"
    
    case "$level" in
        ERROR)   echo -e "${RED}❌ $message${NC}" ;;
        SUCCESS) echo -e "${GREEN}✅ $message${NC}" ;;
        WARNING) echo -e "${YELLOW}⚠️  $message${NC}" ;;
        INFO)    echo -e "${BLUE}ℹ️  $message${NC}" ;;
        ACTION)  echo -e "${PURPLE}🔧 $message${NC}" ;;
        *)       echo "$message" ;;
    esac
}

# 검증 결과 파싱
parse_verification_results() {
    local file="$1"
    
    # verification-status.json에서 해당 파일의 검증 결과 추출
    if [ -f "$STATUS_FILE" ]; then
        jq -r --arg file "$file" '
            .pending[] | select(.file == $file) |
            {
                file: .file,
                level: .level,
                timestamp: .timestamp,
                issues: []
            }
        ' "$STATUS_FILE" 2>/dev/null || echo "{}"
    else
        echo "{}"
    fi
}

# 수정 권한 확인
check_fix_permission() {
    local issue_type="$1"
    
    # fix-permission-matrix.json 확인
    if [ -f "$PERMISSION_FILE" ]; then
        local permission=$(jq -r --arg type "$issue_type" '
            if .auto_fix | index($type) then
                "auto"
            elif .confirm_required | index($type) then
                "confirm"
            elif .manual_only | index($type) then
                "manual"
            else
                "confirm"
            end
        ' "$PERMISSION_FILE" 2>/dev/null)
        
        echo "$permission"
    else
        echo "confirm"  # 기본값: 확인 필요
    fi
}

# 수정 우선순위 결정
prioritize_fixes() {
    local fixes_json="$1"
    
    # 우선순위: Critical > Security > Performance > Logic > Style
    echo "$fixes_json" | jq -r '
        sort_by(
            if .priority == "critical" then 0
            elif .priority == "security" then 1
            elif .priority == "performance" then 2
            elif .priority == "logic" then 3
            elif .priority == "style" then 4
            else 5 end
        )
    '
}

# TypeScript/JavaScript 자동 수정
fix_typescript_issues() {
    local file="$1"
    local issues="$2"
    
    log_message "ACTION" "TypeScript 문제 수정 중: $file"
    
    # any 타입 제거
    if echo "$issues" | grep -q "any_type"; then
        log_message "INFO" "any 타입을 적절한 타입으로 변경"
        if [ "$DRY_RUN" != "true" ]; then
            # Task 명령으로 Claude에게 수정 요청
            echo "Task code-review-specialist \"$file의 any 타입을 적절한 타입으로 변경\""
        fi
    fi
    
    # 미사용 변수 제거
    if echo "$issues" | grep -q "unused_variable"; then
        log_message "INFO" "미사용 변수 제거"
        if [ "$DRY_RUN" != "true" ]; then
            echo "Task code-review-specialist \"$file의 미사용 변수 제거\""
        fi
    fi
    
    # 누락된 타입 추가
    if echo "$issues" | grep -q "missing_types"; then
        log_message "INFO" "누락된 타입 정의 추가"
        if [ "$DRY_RUN" != "true" ]; then
            echo "Task code-review-specialist \"$file에 누락된 타입 정의 추가\""
        fi
    fi
}

# 보안 문제 수정
fix_security_issues() {
    local file="$1"
    local issues="$2"
    
    log_message "WARNING" "보안 문제 발견: $file"
    
    # eval 사용 제거
    if echo "$issues" | grep -q "eval_usage"; then
        log_message "ERROR" "eval() 사용 발견 - 수동 검토 필요"
        echo -e "${RED}🚨 보안 경고: eval() 사용을 안전한 대안으로 교체해야 합니다${NC}"
        
        if [ "$AUTO_MODE" != "true" ]; then
            read -p "자동으로 수정을 시도하시겠습니까? (y/n): " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                echo "Task security-auditor \"$file의 eval() 사용을 안전한 대안으로 교체\""
            fi
        fi
    fi
    
    # 하드코딩된 API 키
    if echo "$issues" | grep -q "hardcoded_key"; then
        log_message "ERROR" "하드코딩된 API 키 발견"
        echo -e "${RED}🔑 API 키를 환경변수로 이동해야 합니다${NC}"
        
        if [ "$DRY_RUN" != "true" ]; then
            echo "Task security-auditor \"$file의 하드코딩된 API 키를 환경변수로 이동\""
        fi
    fi
}

# 성능 문제 수정
fix_performance_issues() {
    local file="$1"
    local issues="$2"
    
    log_message "ACTION" "성능 문제 수정 중: $file"
    
    # O(n^3) 복잡도
    if echo "$issues" | grep -q "high_complexity"; then
        log_message "INFO" "높은 시간 복잡도 알고리즘 최적화"
        if [ "$DRY_RUN" != "true" ]; then
            echo "Task unified-ai-wrapper \"qwen으로 $file의 알고리즘 최적화\""
        fi
    fi
}

# 수정 적용
apply_fix() {
    local file="$1"
    local fix_type="$2"
    local fix_command="$3"
    
    local permission=$(check_fix_permission "$fix_type")
    
    case "$permission" in
        auto)
            log_message "SUCCESS" "자동 수정 적용: $fix_type"
            if [ "$DRY_RUN" != "true" ]; then
                eval "$fix_command"
            else
                echo "  [DRY-RUN] $fix_command"
            fi
            ;;
        confirm)
            if [ "$AUTO_MODE" == "true" ]; then
                log_message "SUCCESS" "자동 모드: 수정 적용"
                if [ "$DRY_RUN" != "true" ]; then
                    eval "$fix_command"
                fi
            else
                echo -e "${YELLOW}수정 확인 필요: $fix_type${NC}"
                echo "  명령어: $fix_command"
                read -p "이 수정을 적용하시겠습니까? (y/n): " -n 1 -r
                echo
                if [[ $REPLY =~ ^[Yy]$ ]]; then
                    if [ "$DRY_RUN" != "true" ]; then
                        eval "$fix_command"
                    fi
                fi
            fi
            ;;
        manual)
            log_message "WARNING" "수동 검토 필요: $fix_type"
            echo -e "${RED}⚠️ 이 문제는 수동으로 검토해야 합니다: $fix_type${NC}"
            echo "  제안: $fix_command"
            ;;
    esac
}

# 수정 큐 처리
process_fix_queue() {
    log_message "INFO" "수정 큐 처리 시작"
    
    # verification-status.json에서 pending 파일들 가져오기
    local pending_files=$(jq -r '.pending[].file' "$STATUS_FILE" 2>/dev/null | sort -u)
    
    if [ -z "$pending_files" ]; then
        log_message "INFO" "수정할 파일이 없습니다"
        return
    fi
    
    local total_files=$(echo "$pending_files" | wc -l)
    local current=0
    
    echo -e "${CYAN}📋 총 $total_files개 파일 수정 예정${NC}"
    echo
    
    for file in $pending_files; do
        # TARGET_FILE이 지정된 경우 해당 파일만 처리
        if [ -n "$TARGET_FILE" ] && [ "$file" != "$TARGET_FILE" ]; then
            continue
        fi
        
        ((current++))
        echo -e "${BLUE}[$current/$total_files] 처리 중: $file${NC}"
        echo "────────────────────────────────────────"
        
        # 파일별 문제 유형 식별 (간단한 패턴 매칭)
        local has_typescript_issues=false
        local has_security_issues=false
        local has_performance_issues=false
        
        # 실제 파일 내용 검사
        if [ -f "$file" ]; then
            if grep -q "any\|unused\|missing" "$file" 2>/dev/null; then
                has_typescript_issues=true
            fi
            if grep -q "eval(\|sk_live_\|ghp_\|sbp_" "$file" 2>/dev/null; then
                has_security_issues=true
            fi
            if grep -q "for.*for.*for" "$file" 2>/dev/null; then
                has_performance_issues=true
            fi
        fi
        
        # 각 문제 유형별 수정 적용
        if [ "$has_security_issues" == "true" ]; then
            fix_security_issues "$file" "security"
        fi
        
        if [ "$has_typescript_issues" == "true" ]; then
            fix_typescript_issues "$file" "typescript"
        fi
        
        if [ "$has_performance_issues" == "true" ]; then
            fix_performance_issues "$file" "performance"
        fi
        
        echo
    done
}

# 수정 통계 표시
show_fix_statistics() {
    echo
    echo -e "${CYAN}═══════════════════════════════════════════${NC}"
    echo -e "${CYAN}           📊 수정 통계 요약              ${NC}"
    echo -e "${CYAN}═══════════════════════════════════════════${NC}"
    
    if [ -f "$FIX_LOG" ]; then
        local total_fixes=$(grep -c "SUCCESS" "$FIX_LOG" 2>/dev/null || echo "0")
        local auto_fixes=$(grep -c "자동 수정 적용" "$FIX_LOG" 2>/dev/null || echo "0")
        local manual_reviews=$(grep -c "수동 검토 필요" "$FIX_LOG" 2>/dev/null || echo "0")
        local errors=$(grep -c "ERROR" "$FIX_LOG" 2>/dev/null || echo "0")
        
        echo -e "  ${GREEN}✅ 성공한 수정:${NC} $total_fixes"
        echo -e "  ${BLUE}🤖 자동 수정:${NC} $auto_fixes"
        echo -e "  ${YELLOW}👤 수동 검토:${NC} $manual_reviews"
        echo -e "  ${RED}❌ 오류:${NC} $errors"
    fi
    
    echo -e "${CYAN}═══════════════════════════════════════════${NC}"
}

# === 메인 로직 ===

log_message "INFO" "AI 검증 기반 자동 수정 시작"

if [ "$DRY_RUN" == "true" ]; then
    echo -e "${YELLOW}🔍 DRY-RUN 모드: 실제 수정은 수행되지 않습니다${NC}"
fi

if [ "$AUTO_MODE" == "true" ]; then
    echo -e "${PURPLE}🤖 자동 모드: 사용자 확인 없이 수정 적용${NC}"
fi

# 수정 큐 처리
process_fix_queue

# 통계 표시
show_fix_statistics

log_message "INFO" "자동 수정 프로세스 완료"

# 수정 후 대시보드 업데이트
if [ -f "$CLAUDE_DIR/scripts/update-verification-status.sh" ]; then
    bash "$CLAUDE_DIR/scripts/update-verification-status.sh"
fi

exit 0