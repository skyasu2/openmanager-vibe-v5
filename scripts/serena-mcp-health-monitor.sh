#!/bin/bash

# =============================================================================
# Serena MCP Health Monitor & Auto Recovery System
# WSL 환경 전용 - Serena MCP 연결 모니터링 및 자동 복구
# =============================================================================

set -euo pipefail

# 설정 변수
PROJECT_ROOT="/mnt/d/cursor/openmanager-vibe-v5"
LOG_FILE="$PROJECT_ROOT/logs/serena-mcp-health.log"
MAX_RETRY_ATTEMPTS=3
HEALTH_CHECK_INTERVAL=30  # 30초마다 체크
RECOVERY_TIMEOUT=60       # 복구 시도 타임아웃

# 색상 코드
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 로그 디렉토리 생성
mkdir -p "$(dirname "$LOG_FILE")"

# 로그 함수
log() {
    local level="$1"
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "[$timestamp] [$level] $message" | tee -a "$LOG_FILE"
}

log_info() { log "INFO" "$@"; }
log_warn() { log "WARN" "$@"; }
log_error() { log "ERROR" "$@"; }
log_success() { log "SUCCESS" "$@"; }

# Serena MCP 상태 체크
check_serena_status() {
    log_info "🔍 Serena MCP 상태 확인 중..."
    
    # Claude MCP 목록에서 Serena 상태 확인
    local mcp_status
    if mcp_status=$(claude mcp list 2>/dev/null | grep "serena:" | grep -o "✓ Connected\|✗ Failed to connect" || echo "NOT_FOUND"); then
        case "$mcp_status" in
            "✓ Connected")
                log_success "✅ Serena MCP 정상 연결됨"
                return 0
                ;;
            "✗ Failed to connect")
                log_error "❌ Serena MCP 연결 실패"
                return 1
                ;;
            "NOT_FOUND")
                log_error "❌ Serena MCP 설정을 찾을 수 없음"
                return 1
                ;;
        esac
    else
        log_error "❌ Claude MCP 목록 조회 실패"
        return 1
    fi
}

# Serena MCP 재시작 시도
restart_serena_mcp() {
    log_info "🔄 Serena MCP 재시작 시도 중..."
    
    # 1. Claude Code API 재시작
    log_info "1️⃣ Claude Code API 재시작..."
    if timeout "$RECOVERY_TIMEOUT" claude api restart 2>/dev/null; then
        log_success "✅ Claude Code API 재시작 완료"
        sleep 5
    else
        log_warn "⚠️ Claude Code API 재시작 실패, 계속 진행"
    fi
    
    # 2. Serena 설치 상태 확인 및 재설치
    log_info "2️⃣ Serena 설치 상태 확인..."
    if ! command -v serena-mcp-server >/dev/null 2>&1; then
        log_info "📦 Serena MCP 서버 재설치 중..."
        if timeout "$RECOVERY_TIMEOUT" /home/skyasu/.local/bin/uvx --from git+https://github.com/oraios/serena serena-mcp-server --help >/dev/null 2>&1; then
            log_success "✅ Serena MCP 서버 재설치 완료"
        else
            log_error "❌ Serena MCP 서버 재설치 실패"
            return 1
        fi
    fi
    
    # 3. 프로젝트 권한 확인
    log_info "3️⃣ 프로젝트 권한 확인..."
    if [[ ! -r "$PROJECT_ROOT" ]]; then
        log_error "❌ 프로젝트 디렉토리 읽기 권한 없음: $PROJECT_ROOT"
        return 1
    fi
    
    # 4. 잠시 대기 후 상태 재확인
    log_info "4️⃣ 10초 대기 후 연결 상태 재확인..."
    sleep 10
    
    return 0
}

# 자동 복구 수행
perform_auto_recovery() {
    local attempt=1
    
    while [[ $attempt -le $MAX_RETRY_ATTEMPTS ]]; do
        log_info "🔧 자동 복구 시도 $attempt/$MAX_RETRY_ATTEMPTS"
        
        if restart_serena_mcp; then
            sleep 5
            if check_serena_status; then
                log_success "🎉 자동 복구 성공! (시도 $attempt/$MAX_RETRY_ATTEMPTS)"
                return 0
            fi
        fi
        
        log_warn "⚠️ 복구 시도 $attempt 실패, $(( RECOVERY_TIMEOUT ))초 대기 후 재시도..."
        sleep "$RECOVERY_TIMEOUT"
        ((attempt++))
    done
    
    log_error "💥 자동 복구 실패 - $MAX_RETRY_ATTEMPTS회 시도 후 포기"
    return 1
}

# WSL 환경 진단
diagnose_wsl_environment() {
    log_info "🐧 WSL 환경 진단 중..."
    
    # 메모리 상태
    local memory_info=$(free -h | grep Mem: | awk '{print $3"/"$2}')
    log_info "💾 메모리 사용량: $memory_info"
    
    # 디스크 상태  
    local disk_info=$(df -h "$PROJECT_ROOT" | tail -1 | awk '{print $3"/"$2" ("$5")"}')
    log_info "💽 디스크 사용량: $disk_info"
    
    # Python/uv 설치 상태
    if command -v /home/skyasu/.local/bin/uvx >/dev/null 2>&1; then
        log_success "✅ uvx 설치됨: $(/home/skyasu/.local/bin/uvx --version 2>/dev/null || echo 'unknown version')"
    else
        log_error "❌ uvx 미설치 또는 접근 불가"
    fi
    
    # Claude Code 상태
    if command -v claude >/dev/null 2>&1; then
        log_success "✅ Claude Code 설치됨: $(claude --version 2>/dev/null | head -1 || echo 'unknown version')"
    else
        log_error "❌ Claude Code 미설치 또는 접근 불가"
    fi
}

# 메인 헬스체크 함수
main_health_check() {
    log_info "🏥 Serena MCP 헬스체크 시작"
    
    # 환경 진단
    diagnose_wsl_environment
    
    # 상태 체크
    if check_serena_status; then
        log_success "✅ Serena MCP 헬스체크 통과"
        return 0
    else
        log_warn "⚠️ Serena MCP 연결 문제 감지, 자동 복구 시작"
        if perform_auto_recovery; then
            log_success "🎉 Serena MCP 자동 복구 성공"
            return 0
        else
            log_error "💥 Serena MCP 자동 복구 실패 - 수동 개입 필요"
            return 1
        fi
    fi
}

# 연속 모니터링 모드
continuous_monitoring() {
    log_info "🔄 Serena MCP 연속 모니터링 시작 (${HEALTH_CHECK_INTERVAL}초 간격)"
    
    while true; do
        main_health_check
        log_info "😴 ${HEALTH_CHECK_INTERVAL}초 대기 중..."
        sleep "$HEALTH_CHECK_INTERVAL"
    done
}

# 사용법 출력
usage() {
    echo "사용법: $0 [옵션]"
    echo ""
    echo "옵션:"
    echo "  check     - 한 번만 헬스체크 실행"
    echo "  monitor   - 연속 모니터링 모드"
    echo "  recover   - 강제 복구 시도"
    echo "  status    - 현재 상태만 확인"
    echo "  logs      - 로그 보기"
    echo "  help      - 이 도움말 출력"
}

# 메인 실행 로직
case "${1:-check}" in
    "check")
        main_health_check
        ;;
    "monitor")
        continuous_monitoring
        ;;
    "recover")
        log_info "🔧 강제 복구 모드 시작"
        perform_auto_recovery
        ;;
    "status")
        check_serena_status
        ;;
    "logs")
        if [[ -f "$LOG_FILE" ]]; then
            tail -50 "$LOG_FILE"
        else
            echo "로그 파일이 없습니다: $LOG_FILE"
        fi
        ;;
    "help"|"-h"|"--help")
        usage
        ;;
    *)
        echo "알 수 없는 옵션: $1"
        usage
        exit 1
        ;;
esac