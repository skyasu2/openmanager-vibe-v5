#!/bin/bash

# 훅 시스템 공통 함수 라이브러리
# 모든 훅에서 source로 포함하여 사용

# 로그 설정
HOOK_LOG_DIR=".claude/audit"
ISSUE_DIR=".claude/issues"
METRICS_DIR=".claude/metrics"

# 디렉토리 생성
mkdir -p "$HOOK_LOG_DIR" "$ISSUE_DIR" "$METRICS_DIR"

# 색상 코드
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 타임스탬프 함수
get_timestamp() {
    date '+%Y-%m-%d %H:%M:%S'
}

get_formatted_date() {
    date '+%Y-%m-%d-%H-%M'
}

# 로그 함수
log() {
    local level="$1"
    local message="$2"
    local timestamp=$(get_timestamp)
    echo "[$timestamp] $level: $message" | tee -a "$HOOK_LOG_DIR/hook.log"
}

log_info() {
    log "INFO" "$1"
}

log_warning() {
    log "WARNING" "$1"
}

log_error() {
    log "ERROR" "$1"
}

log_success() {
    log "SUCCESS" "$1"
}

# Audit 로그 기록
write_audit_log() {
    local hook_name="$1"
    local action="$2"
    local details="$3"
    local timestamp=$(get_timestamp)
    
    cat >> "$HOOK_LOG_DIR/audit.log" << EOF
{
  "timestamp": "$timestamp",
  "hook": "$hook_name",
  "action": "$action",
  "details": $details
}
EOF
}

# 이슈 파일 생성
create_issue_file() {
    local issue_type="$1"
    local title="$2"
    local content="$3"
    local priority="${4:-medium}"
    local formatted_date=$(get_formatted_date)
    local filename="$ISSUE_DIR/${issue_type}-${formatted_date}.md"
    
    cat > "$filename" << EOF
# $title

**생성 시간**: $(get_timestamp)  
**우선순위**: $priority  
**유형**: $issue_type  

## 내용

$content

---
자동 생성됨 - 훅 시스템
EOF
    
    echo "$filename"
}

# 스킬 호출 권장
suggest_skill() {
    local skill="$1"
    local reason="$2"
    echo -e "${YELLOW}💡 권장 스킬: $skill${NC} - $reason"
}

# 스킬로 위임 (Exit code 2)
delegate_to_skill() {
    local skill="$1"
    local task="$2"
    echo -e "${BLUE}🤖 자동 위임: $skill 스킬${NC}"
    log_info "스킬 $skill 로 작업 위임: $task"
    exit 2
}

# 파일 패턴 매칭
is_security_file() {
    local file_path="$1"
    [[ "$file_path" =~ (auth|security|payment|admin|api/.*/(route|handler)) ]]
}

is_typescript_file() {
    local file_path="$1"
    [[ "$file_path" =~ \.(ts|tsx)$ ]]
}

is_javascript_file() {
    local file_path="$1"
    [[ "$file_path" =~ \.(js|jsx)$ ]]
}

is_markdown_file() {
    local file_path="$1"
    [[ "$file_path" =~ \.md$ ]]
}

is_schema_file() {
    local file_path="$1"
    [[ "$file_path" =~ (schema|migration|\.sql$) ]]
}

# 스킬 우선순위 가져오기
get_skill_priority() {
    local skill_name="$1"
    case "$skill_name" in
        "ai-code-review"|"security-audit-workflow")
            echo "high"
            ;;
        "lint-smoke"|"validation-analysis"|"playwright-triage")
            echo "medium"
            ;;
        *)
            echo "low"
            ;;
    esac
}

# 다음 훅 트리거
trigger_next_hook() {
    local next_hook="$1"
    shift
    if [ -x "hooks/$next_hook" ]; then
        log_info "다음 훅 트리거: $next_hook"
        "hooks/$next_hook" "$@"
    fi
}

# 성능 메트릭 기록
record_performance_metric() {
    local metric_name="$1"
    local value="$2"
    local timestamp=$(get_timestamp)
    local formatted_date=$(get_formatted_date)
    local metric_file="$METRICS_DIR/performance-${formatted_date}.json"
    
    cat >> "$metric_file" << EOF
{
  "timestamp": "$timestamp",
  "metric": "$metric_name",
  "value": "$value"
}
EOF
}

# 무료 티어 사용량 체크
check_free_tier_usage() {
    local service="$1"
    local current_usage="$2"
    local limit="$3"
    local usage_percent=$(echo "scale=2; $current_usage * 100 / $limit" | bc)
    
    if (( $(echo "$usage_percent > 80" | bc -l) )); then
        log_warning "$service 무료 티어 사용량 ${usage_percent}% - 주의 필요"
        return 1
    fi
    return 0
}

# 스킬 작업 프롬프트 생성
create_skill_prompt() {
    local skill_name="$1"
    local task_description="$2"
    local file_path="${3:-}"
    local additional_context="${4:-}"

    cat << EOF
🤖 스킬 작업 요청

**스킬**: $skill_name
**작업**: $task_description
**시간**: $(get_timestamp)

EOF

    if [ -n "$file_path" ]; then
        echo "**대상 파일**: $file_path"
        echo ""
        echo "⚠️ **중요**: 기존 파일을 수정하는 경우 반드시 Read 도구로 파일을 먼저 읽어주세요!"
        echo ""
    fi

    if [ -n "$additional_context" ]; then
        echo "**추가 컨텍스트**:"
        echo "$additional_context"
        echo ""
    fi

    echo "다음 작업을 수행해주세요:"
}

# EXIT CODE 표준화
EXIT_SUCCESS=0
EXIT_BLOCKED=1
EXIT_DELEGATED=2
EXIT_WARNING=3