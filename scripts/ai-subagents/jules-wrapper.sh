#!/bin/bash

# Jules CLI Wrapper - 비동기 세션 관리 + 결과 추적
# 버전: 1.0.0
# 날짜: 2025-12-15 (Google 비동기 코딩 에이전트)

set -euo pipefail

# 프로젝트 루트 자동 결정 (포터블)
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

# npm global bin 경로 추가 (WSL에서 jules 찾기 위함)
export PATH="$PATH:$(npm prefix -g)/bin"

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# 로그 디렉터리 (프로젝트 루트 기준)
LOG_DIR="${PROJECT_ROOT}/logs/ai-perf"
LOG_FILE="$LOG_DIR/jules-perf-$(date +%F).log"
SESSION_DIR="${PROJECT_ROOT}/logs/jules-sessions"
mkdir -p "$LOG_DIR" "$SESSION_DIR"

# 로그 함수 (모두 stderr로 출력 - stdout은 AI 응답 전용)
log_info() {
    echo -e "${BLUE}🤖 Jules: $1${NC}" >&2
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] INFO: $1" >> "$LOG_FILE"
}

log_success() {
    echo -e "${GREEN}✅ Jules: $1${NC}" >&2
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] SUCCESS: $1" >> "$LOG_FILE"
}

log_warning() {
    echo -e "${YELLOW}⚠️  Jules: $1${NC}" >&2
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] WARNING: $1" >> "$LOG_FILE"
}

log_error() {
    echo -e "${RED}❌ Jules: $1${NC}" >&2
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $1" >> "$LOG_FILE"
}

log_session() {
    echo -e "${PURPLE}📋 Session: $1${NC}" >&2
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] SESSION: $1" >> "$LOG_FILE"
}

# Jules CLI 가용성 확인
check_jules_availability() {
    if ! command -v jules &> /dev/null; then
        log_error "Jules CLI not found in PATH"
        return 1
    fi
    
    # 로그인 상태 확인 (간단한 명령으로 테스트)
    if ! jules remote list --session &>/dev/null; then
        log_warning "Jules CLI not logged in. Run 'jules login' first"
        return 1
    fi
    
    return 0
}

# 세션 생성 및 추적
create_session() {
    local task_description="$1"
    local repo_option="${2:-}"
    local parallel="${3:-1}"
    
    log_info "Creating Jules session: '$task_description'"
    
    # 세션 생성 명령 구성
    local cmd="jules new"
    if [[ -n "$repo_option" ]]; then
        cmd="$cmd --repo $repo_option"
    fi
    if [[ "$parallel" -gt 1 ]]; then
        cmd="$cmd --parallel $parallel"
    fi
    cmd="$cmd \"$task_description\""
    
    # 세션 생성 실행
    local session_output
    if session_output=$(eval "$cmd" 2>&1); then
        # 세션 ID 추출 (Jules CLI 출력 형식에 따라 조정 필요)
        local session_id
        if session_id=$(echo "$session_output" | grep -oE '[0-9]{6,}' | head -1); then
            log_session "Created session ID: $session_id"
            
            # 세션 정보 저장
            local session_file="$SESSION_DIR/session-$session_id-$(date +%Y%m%d-%H%M%S).json"
            cat > "$session_file" << EOF
{
  "session_id": "$session_id",
  "task_description": "$task_description",
  "repo": "$repo_option",
  "parallel": $parallel,
  "created_at": "$(date -Iseconds)",
  "status": "created",
  "output": $(echo "$session_output" | jq -Rs .)
}
EOF
            
            echo "$session_id"
            return 0
        else
            log_error "Failed to extract session ID from output: $session_output"
            return 1
        fi
    else
        log_error "Failed to create session: $session_output"
        return 1
    fi
}

# 세션 상태 확인
check_session_status() {
    local session_id="$1"
    
    log_info "Checking session $session_id status"
    
    if jules remote list --session | grep -q "$session_id"; then
        local status_line
        status_line=$(jules remote list --session | grep "$session_id")
        echo "$status_line" | awk '{print $NF}'  # 마지막 컬럼이 상태
    else
        echo "not_found"
    fi
}

# 세션 결과 가져오기
pull_session_result() {
    local session_id="$1"
    local apply_patch="${2:-false}"
    
    log_info "Pulling session $session_id result"
    
    local pull_cmd="jules remote pull --session $session_id"
    if [[ "$apply_patch" == "true" ]]; then
        pull_cmd="$pull_cmd --apply"
        log_warning "Will apply patch to local repository"
    fi
    
    local result_output
    if result_output=$(eval "$pull_cmd" 2>&1); then
        log_success "Successfully pulled session $session_id"
        
        # 결과 저장
        local result_file="$SESSION_DIR/result-$session_id-$(date +%Y%m%d-%H%M%S).txt"
        echo "$result_output" > "$result_file"
        
        echo "$result_output"
        return 0
    else
        log_error "Failed to pull session $session_id: $result_output"
        return 1
    fi
}

# 활성 세션 목록
list_active_sessions() {
    log_info "Listing active sessions"
    jules remote list --session
}

# 메인 실행 로직
main() {
    local start_time=$(date +%s)
    
    # .env.local 로드 (존재하는 경우)
    if [[ -f "${PROJECT_ROOT}/.env.local" ]]; then
        set -a
        source "${PROJECT_ROOT}/.env.local"
        set +a
        log_info "Loaded .env.local"
    fi
    
    # Jules CLI 가용성 확인
    if ! check_jules_availability; then
        log_error "Jules CLI not available"
        exit 1
    fi
    
    # 인자 처리
    if [[ $# -eq 0 ]]; then
        log_info "No arguments provided. Listing active sessions:"
        list_active_sessions
        exit 0
    fi
    
    local command="$1"
    shift
    
    case "$command" in
        "new"|"create")
            if [[ $# -eq 0 ]]; then
                log_error "Task description required for new session"
                exit 1
            fi
            local task="$1"
            local repo="${2:-}"
            local parallel="${3:-1}"
            
            if session_id=$(create_session "$task" "$repo" "$parallel"); then
                log_success "Session created: $session_id"
                echo "Session ID: $session_id"
            else
                exit 1
            fi
            ;;
        
        "status"|"check")
            if [[ $# -eq 0 ]]; then
                log_error "Session ID required"
                exit 1
            fi
            local session_id="$1"
            local status
            status=$(check_session_status "$session_id")
            echo "Session $session_id status: $status"
            ;;
        
        "pull"|"get")
            if [[ $# -eq 0 ]]; then
                log_error "Session ID required"
                exit 1
            fi
            local session_id="$1"
            local apply="${2:-false}"
            
            if pull_session_result "$session_id" "$apply"; then
                log_success "Session result retrieved"
            else
                exit 1
            fi
            ;;
        
        "list")
            list_active_sessions
            ;;
        
        *)
            # 기본 동작: 새 세션 생성
            if session_id=$(create_session "$command" "${1:-}" "${2:-1}"); then
                log_success "Session created: $session_id"
                
                # 세션 완료 대기 (선택적)
                if [[ "${JULES_WAIT:-false}" == "true" ]]; then
                    log_info "Waiting for session completion..."
                    local max_wait=1800  # 30분
                    local wait_time=0
                    
                    while [[ $wait_time -lt $max_wait ]]; do
                        local status
                        status=$(check_session_status "$session_id")
                        
                        if [[ "$status" == "completed" ]]; then
                            log_success "Session completed. Pulling result..."
                            pull_session_result "$session_id"
                            break
                        elif [[ "$status" == "failed" ]]; then
                            log_error "Session failed"
                            break
                        fi
                        
                        sleep 30
                        wait_time=$((wait_time + 30))
                        log_info "Waiting... ($wait_time/${max_wait}s)"
                    done
                    
                    if [[ $wait_time -ge $max_wait ]]; then
                        log_warning "Session timeout. Check manually with: jules remote list --session"
                    fi
                else
                    echo "Session ID: $session_id"
                    echo "Check status with: $0 status $session_id"
                    echo "Pull result with: $0 pull $session_id"
                fi
            else
                exit 1
            fi
            ;;
    esac
    
    # 실행 시간 로깅
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    log_success "Jules wrapper completed in ${duration}s"
}

# 스크립트 실행
main "$@"
