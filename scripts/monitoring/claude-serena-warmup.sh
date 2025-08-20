#!/bin/bash

# Claude Code + Serena MCP 워밍업 스크립트 (개선된 버전)
# WSL 환경에서 Serena 사전 초기화 후 Claude Code 시작

set -e

# 설정 변수
PROJECT_ROOT="/mnt/d/cursor/openmanager-vibe-v5"
SERENA_DASHBOARD="http://127.0.0.1:24282/dashboard/"
LOG_FILE="/tmp/serena-warmup.log"
PID_FILE="/tmp/serena-warmup.pid"
STATE_FILE="/tmp/serena-warmup-state.json"
TIMEOUT=240  # 4분으로 증가

# 로그 함수
log_info() {
    echo "[$(date '+%H:%M:%S')] ℹ️  $1"
}

log_success() {
    echo "[$(date '+%H:%M:%S')] ✅ $1"
}

log_error() {
    echo "[$(date '+%H:%M:%S')] ❌ $1" >&2
}

log_warn() {
    echo "[$(date '+%H:%M:%S')] ⚠️  $1"
}

# 진행률 표시 함수
show_progress() {
    local current=$1
    local total=$2
    local msg=$3
    local percent=$((current * 100 / total))
    local filled=$((percent / 2))
    local empty=$((50 - filled))
    
    printf "\r   [%s%s] %d%% %s" \
        "$(printf '█%.0s' $(seq 1 $filled))" \
        "$(printf '░%.0s' $(seq 1 $empty))" \
        "$percent" "$msg"
}

# 상태 저장 함수
save_state() {
    local state="$1"
    local message="$2"
    local timestamp=$(date -Iseconds)
    
    cat > "$STATE_FILE" << EOF
{
  "state": "$state",
  "message": "$message", 
  "timestamp": "$timestamp",
  "pid": "${SERENA_PID:-null}",
  "log_file": "$LOG_FILE"
}
EOF
}

# 프로세스 정리 함수
cleanup() {
    log_info "정리 작업 실행 중..."
    
    # 이전 PID 파일이 있으면 해당 프로세스 종료
    if [ -f "$PID_FILE" ]; then
        local old_pid=$(cat "$PID_FILE" 2>/dev/null || echo "")
        if [ -n "$old_pid" ] && kill -0 "$old_pid" 2>/dev/null; then
            log_info "이전 Serena 프로세스 (PID: $old_pid) 종료 중..."
            kill "$old_pid" 2>/dev/null || true
            sleep 2
        fi
        rm -f "$PID_FILE"
    fi
    
    # 이름으로 프로세스 정리 (백업)
    pkill -f "serena-mcp-server" || true
    sleep 1
}

# 로그 모니터링 함수
monitor_initialization() {
    local start_time=$(date +%s)
    
    while true; do
        if [ -f "$LOG_FILE" ]; then
            # 초기화 단계 감지
            if grep -q "Starting Serena server" "$LOG_FILE" 2>/dev/null; then
                log_info "Serena 서버 시작됨"
            fi
            
            if grep -q "Loading document symbols cache" "$LOG_FILE" 2>/dev/null; then
                log_info "문서 심볼 캐시 로딩 중..."
            fi
            
            if grep -q "Starting language server" "$LOG_FILE" 2>/dev/null; then
                log_info "언어 서버 시작 중..."
            fi
            
            if grep -q "Serena web dashboard started" "$LOG_FILE" 2>/dev/null; then
                log_success "웹 대시보드 시작됨"
                break
            fi
            
            # 에러 감지
            if grep -q "ERROR\|Error\|FATAL" "$LOG_FILE" 2>/dev/null; then
                local error_line=$(grep "ERROR\|Error\|FATAL" "$LOG_FILE" | tail -1)
                log_error "초기화 오류 감지: $error_line"
                return 1
            fi
        fi
        
        sleep 2
        
        # 타임아웃 체크
        local current_time=$(date +%s)
        local elapsed=$((current_time - start_time))
        if [ $elapsed -gt $TIMEOUT ]; then
            log_error "로그 모니터링 타임아웃 ($TIMEOUT초)"
            return 1
        fi
    done
}

# 대시보드 가용성 확인
check_dashboard() {
    local max_attempts=60  # 5분
    local attempt=0
    
    log_info "웹 대시보드 가용성 확인 중..."
    
    while [ $attempt -lt $max_attempts ]; do
        if curl -s --max-time 5 "$SERENA_DASHBOARD" > /dev/null 2>&1; then
            local response_code=$(curl -s -o /dev/null -w "%{http_code}" "$SERENA_DASHBOARD")
            if [ "$response_code" = "200" ]; then
                log_success "웹 대시보드 응답 확인 (HTTP $response_code)"
                return 0
            fi
        fi
        
        attempt=$((attempt + 1))
        show_progress $attempt $max_attempts "대시보드 확인 중..."
        sleep 5
    done
    
    echo  # 새 줄
    log_error "웹 대시보드 응답 없음 (5분 초과)"
    return 1
}

# 상세 상태 확인
verify_serena_status() {
    log_info "Serena 상태 검증 중..."
    
    # 프로세스 확인
    if ! kill -0 "$SERENA_PID" 2>/dev/null; then
        log_error "Serena 프로세스가 종료됨 (PID: $SERENA_PID)"
        return 1
    fi
    
    # 포트 확인
    if ! ss -tuln | grep -q ":24282"; then
        log_warn "포트 24282가 바인딩되지 않음"
    fi
    
    # 로그 파일 크기 확인 (초기화 진행 여부)
    if [ -f "$LOG_FILE" ]; then
        local log_size=$(wc -l < "$LOG_FILE")
        log_info "로그 라인 수: $log_size"
        
        if [ $log_size -lt 10 ]; then
            log_warn "로그가 적습니다. 초기화가 제대로 시작되지 않았을 수 있습니다."
        fi
    fi
    
    log_success "Serena 상태 검증 완료"
    return 0
}

# 메인 실행
main() {
    log_info "🚀 Claude Code + Serena MCP 워밍업 시작 (개선된 버전)"
    save_state "starting" "워밍업 스크립트 시작"
    
    # 1. 환경 확인
    log_info "환경 확인 중..."
    if [ ! -d "$PROJECT_ROOT" ]; then
        log_error "프로젝트 디렉토리가 존재하지 않습니다: $PROJECT_ROOT"
        exit 1
    fi
    
    if ! command -v uvx > /dev/null; then
        log_error "uvx 명령을 찾을 수 없습니다"
        exit 1
    fi
    
    # 2. 기존 프로세스 정리
    log_info "🧹 기존 Serena 프로세스 정리 중..."
    cleanup
    save_state "cleaning" "기존 프로세스 정리 완료"
    
    # 3. Serena MCP 서버 시작
    log_info "🔥 Serena MCP 서버 백그라운드 시작 중..."
    cd "$PROJECT_ROOT"
    
    # 로그 파일 초기화
    > "$LOG_FILE"
    
    # Serena 시작
    nohup /home/skyasu/.local/bin/uvx --from git+https://github.com/oraios/serena serena-mcp-server --project "$PROJECT_ROOT" > "$LOG_FILE" 2>&1 &
    SERENA_PID=$!
    
    # PID 저장
    echo "$SERENA_PID" > "$PID_FILE"
    log_info "📊 Serena PID: $SERENA_PID"
    save_state "initializing" "Serena 서버 시작됨 (PID: $SERENA_PID)"
    
    # 4. 초기화 모니터링
    log_info "⏳ Serena 초기화 모니터링 중..."
    if monitor_initialization; then
        save_state "dashboard_ready" "웹 대시보드 준비 완료"
    else
        save_state "init_failed" "초기화 실패"
        log_error "Serena 초기화 실패"
        cat "$LOG_FILE" | tail -20
        exit 1
    fi
    
    # 5. 대시보드 가용성 확인
    if check_dashboard; then
        save_state "dashboard_verified" "대시보드 검증 완료"
    else
        save_state "dashboard_failed" "대시보드 검증 실패"
        exit 1
    fi
    
    # 6. 최종 상태 검증
    if verify_serena_status; then
        save_state "ready" "모든 준비 완료"
    else
        save_state "verification_failed" "상태 검증 실패"
        exit 1
    fi
    
    # 7. 완료 메시지
    echo
    log_success "🎉 Serena MCP 워밍업 완료!"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📊 웹 대시보드: $SERENA_DASHBOARD"
    echo "📋 로그 파일: $LOG_FILE"
    echo "📍 상태 파일: $STATE_FILE"
    echo "🐧 프로세스 PID: $SERENA_PID"
    echo
    echo "🤖 이제 Claude Code를 시작하세요:"
    echo "   claude"
    echo
    echo "💡 Serena가 사전 초기화되어 즉시 연결됩니다."
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

# 시그널 핸들러
trap 'log_error "스크립트 중단됨"; save_state "interrupted" "사용자 중단"; exit 130' INT TERM

# 메인 실행
main "$@"