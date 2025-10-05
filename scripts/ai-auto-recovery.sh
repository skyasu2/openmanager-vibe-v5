#!/bin/bash
# 🔄 AI Auto Recovery System - 지능형 자동 복구 시스템
# AI CLI 도구들의 건강 상태를 모니터링하고 자동으로 복구

set -euo pipefail

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 설정
MONITOR_INTERVAL=30  # 30초마다 체크
MAX_RETRY_ATTEMPTS=3
LOG_FILE="/tmp/claude/ai-recovery.log"
HEALTH_CHECK_TIMEOUT=15

# 로그 디렉토리 생성
mkdir -p "$(dirname "$LOG_FILE")"

# 로깅 함수들
log() {
    local level="$1"
    local message="$2"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$timestamp] [$level] $message" | tee -a "$LOG_FILE"
}

log_info() {
    echo -e "${BLUE}ℹ️  [$(date '+%H:%M:%S')] $1${NC}"
    log "INFO" "$1"
}

log_success() {
    echo -e "${GREEN}✅ [$(date '+%H:%M:%S')] $1${NC}"
    log "SUCCESS" "$1"
}

log_warning() {
    echo -e "${YELLOW}⚠️  [$(date '+%H:%M:%S')] $1${NC}"
    log "WARNING" "$1"
}

log_error() {
    echo -e "${RED}❌ [$(date '+%H:%M:%S')] $1${NC}"
    log "ERROR" "$1"
}

log_recovery() {
    echo -e "${PURPLE}🔧 [$(date '+%H:%M:%S')] $1${NC}"
    log "RECOVERY" "$1"
}

# AI 도구별 건강 상태 체크
health_check_claude() {
    timeout "$HEALTH_CHECK_TIMEOUT" claude --version >/dev/null 2>&1
}

health_check_codex() {
    timeout 90 codex exec "ping" >/dev/null 2>&1
}

health_check_gemini() {
    timeout "$HEALTH_CHECK_TIMEOUT" gemini --version >/dev/null 2>&1
}

health_check_qwen() {
    timeout "$HEALTH_CHECK_TIMEOUT" qwen --version >/dev/null 2>&1
}

# MCP 서버 건강 상태 체크
health_check_mcp() {
    if command -v claude >/dev/null 2>&1; then
        timeout 10 claude mcp list >/dev/null 2>&1
    else
        return 1
    fi
}

# AI 도구별 자동 복구 함수들
recover_claude() {
    log_recovery "Claude Code 복구 시도..."

    # 1. 프로세스 정리
    pkill -f "claude" 2>/dev/null || true
    sleep 2

    # 2. 버전 확인으로 재시작 유도
    if timeout 10 claude --version >/dev/null 2>&1; then
        log_success "Claude Code 복구 성공"
        return 0
    else
        log_error "Claude Code 복구 실패"
        return 1
    fi
}

recover_codex() {
    log_recovery "Codex CLI 복구 시도..."

    # 1. Node.js Codex 프로세스 정리
    pkill -f "node.*codex" 2>/dev/null || true
    pkill -f "codex" 2>/dev/null || true
    sleep 3

    # 2. 재인증이 필요할 수 있으므로 상태만 확인
    if timeout 90 codex exec "recovery test" >/dev/null 2>&1; then
        log_success "Codex CLI 복구 성공"
        return 0
    else
        log_warning "Codex CLI 복구 실패 - API 한도 또는 인증 문제"
        return 1
    fi
}

recover_gemini() {
    log_recovery "Gemini CLI 복구 시도..."

    # 1. Gemini 관련 프로세스 정리
    pkill -f "gemini" 2>/dev/null || true
    sleep 2

    # 2. OAuth 상태 확인
    if timeout "$HEALTH_CHECK_TIMEOUT" gemini --version >/dev/null 2>&1; then
        log_success "Gemini CLI 복구 성공"
        return 0
    else
        log_warning "Gemini CLI 복구 실패 - OAuth 재인증 필요할 수 있음"
        return 1
    fi
}

recover_qwen() {
    log_recovery "Qwen CLI 복구 시도..."

    # 1. Qwen 관련 프로세스 정리
    pkill -f "qwen" 2>/dev/null || true
    sleep 2

    # 2. OAuth 상태 확인
    if timeout "$HEALTH_CHECK_TIMEOUT" qwen --version >/dev/null 2>&1; then
        log_success "Qwen CLI 복구 성공"
        return 0
    else
        log_warning "Qwen CLI 복구 실패 - OAuth 재인증 필요할 수 있음"
        return 1
    fi
}

recover_mcp() {
    log_recovery "MCP 서버 복구 시도..."

    # 1. MCP 관련 프로세스 정리
    pkill -f "mcp" 2>/dev/null || true
    pkill -f "node.*serena" 2>/dev/null || true
    sleep 2

    # 2. MCP 서버 재연결
    if command -v claude >/dev/null 2>&1; then
        if timeout 15 claude mcp list >/dev/null 2>&1; then
            log_success "MCP 서버 복구 성공"
            return 0
        else
            log_error "MCP 서버 복구 실패"
            return 1
        fi
    else
        log_error "Claude Code 없어서 MCP 복구 불가"
        return 1
    fi
}

# 시스템 리소스 정리
cleanup_system_resources() {
    log_recovery "시스템 리소스 정리..."

    # 1. 좀비 프로세스 정리
    pkill -f "defunct" 2>/dev/null || true

    # 2. 과도한 Node.js 프로세스 정리
    local node_count
    node_count=$(pgrep -f "node" | wc -l)
    if [ "$node_count" -gt 10 ]; then
        log_warning "과도한 Node.js 프로세스 감지 ($node_count개), 정리 중..."
        pkill -f "node.*@anthropic-ai" 2>/dev/null || true
        pkill -f "node.*openai" 2>/dev/null || true
        pkill -f "node.*google" 2>/dev/null || true
        pkill -f "node.*qwen" 2>/dev/null || true
        sleep 3
    fi

    # 3. 메모리 캐시 정리 (필요시)
    local mem_usage
    mem_usage=$(free | grep Mem | awk '{printf "%.0f", $3/$2 * 100}')
    if [ "$mem_usage" -gt 85 ]; then
        log_warning "높은 메모리 사용률 ($mem_usage%), 캐시 정리 시도..."
        sync
        # 페이지 캐시만 정리 (안전)
        echo 1 | sudo tee /proc/sys/vm/drop_caches >/dev/null 2>&1 || true
    fi

    log_success "시스템 리소스 정리 완료"
}

# 단일 도구 복구 시도
recover_single_tool() {
    local tool="$1"
    local attempt="$2"

    log_recovery "[$attempt/$MAX_RETRY_ATTEMPTS] $tool 복구 시도..."

    case "$tool" in
        "claude")
            recover_claude
            ;;
        "codex")
            recover_codex
            ;;
        "gemini")
            recover_gemini
            ;;
        "qwen")
            recover_qwen
            ;;
        "mcp")
            recover_mcp
            ;;
        *)
            log_error "알 수 없는 도구: $tool"
            return 1
            ;;
    esac
}

# 전체 시스템 건강 상태 체크
full_health_check() {
    local results=()
    local failed_tools=()

    log_info "🩺 전체 AI 시스템 건강 상태 체크..."

    # Claude Code 체크
    if health_check_claude; then
        results+=("Claude Code: ✅")
    else
        results+=("Claude Code: ❌")
        failed_tools+=("claude")
    fi

    # Codex CLI 체크
    if health_check_codex; then
        results+=("Codex CLI: ✅")
    else
        results+=("Codex CLI: ❌")
        failed_tools+=("codex")
    fi

    # Gemini CLI 체크
    if health_check_gemini; then
        results+=("Gemini CLI: ✅")
    else
        results+=("Gemini CLI: ❌")
        failed_tools+=("gemini")
    fi

    # Qwen CLI 체크
    if health_check_qwen; then
        results+=("Qwen CLI: ✅")
    else
        results+=("Qwen CLI: ❌")
        failed_tools+=("qwen")
    fi

    # MCP 서버 체크
    if health_check_mcp; then
        results+=("MCP 서버: ✅")
    else
        results+=("MCP 서버: ❌")
        failed_tools+=("mcp")
    fi

    # 결과 출력
    printf '%s\n' "${results[@]}"

    # 실패한 도구들 복구 시도
    if [ ${#failed_tools[@]} -gt 0 ]; then
        log_warning "실패한 도구들: ${failed_tools[*]}"

        # 시스템 리소스 정리 먼저
        cleanup_system_resources

        # 각 도구별 복구 시도
        for tool in "${failed_tools[@]}"; do
            for attempt in $(seq 1 $MAX_RETRY_ATTEMPTS); do
                if recover_single_tool "$tool" "$attempt"; then
                    break
                else
                    if [ "$attempt" -lt $MAX_RETRY_ATTEMPTS ]; then
                        log_info "재시도 대기 중... (5초)"
                        sleep 5
                    else
                        log_error "$tool 복구 완전 실패 - 수동 개입 필요"
                    fi
                fi
            done
        done
    else
        log_success "모든 AI 시스템 정상 작동"
    fi
}

# 지속적 모니터링 모드
continuous_monitor() {
    log_info "🔄 지속적 AI 시스템 모니터링 시작... (${MONITOR_INTERVAL}초 간격)"
    log_info "중지하려면 Ctrl+C를 누르세요"

    # SIGINT 핸들러 등록
    trap 'log_info "모니터링 중지됨"; exit 0' INT

    local check_count=0
    while true; do
        ((check_count++))

        echo ""
        log_info "=== 모니터링 체크 #$check_count ==="
        full_health_check

        log_info "다음 체크까지 ${MONITOR_INTERVAL}초 대기..."
        sleep "$MONITOR_INTERVAL"
    done
}

# 시스템 상태 대시보드
show_status_dashboard() {
    clear
    echo -e "${CYAN}╔══════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║           AI Auto Recovery System        ║${NC}"
    echo -e "${CYAN}║              Status Dashboard            ║${NC}"
    echo -e "${CYAN}╚══════════════════════════════════════════╝${NC}"
    echo ""

    full_health_check

    echo ""
    echo -e "${BLUE}📊 시스템 통계:${NC}"
    echo "• 모니터링 간격: ${MONITOR_INTERVAL}초"
    echo "• 최대 복구 시도: ${MAX_RETRY_ATTEMPTS}회"
    echo "• 건강 체크 타임아웃: ${HEALTH_CHECK_TIMEOUT}초"
    echo "• 로그 파일: $LOG_FILE"

    echo ""
    echo -e "${BLUE}💾 메모리 사용량:${NC}"
    free -h | grep -E "Mem:|Swap:"

    echo ""
    echo -e "${BLUE}🔧 실행 중인 AI 관련 프로세스:${NC}"
    ps aux | grep -E "(claude|codex|gemini|qwen|mcp)" | grep -v grep | head -5
}

# 메인 실행 함수
main() {
    case "${1:-status}" in
        "status")
            show_status_dashboard
            ;;
        "check")
            full_health_check
            ;;
        "monitor")
            continuous_monitor
            ;;
        "recover")
            local tool="${2:-all}"
            if [ "$tool" = "all" ]; then
                full_health_check
            else
                recover_single_tool "$tool" "1"
            fi
            ;;
        "cleanup")
            cleanup_system_resources
            ;;
        "log")
            if [ -f "$LOG_FILE" ]; then
                tail -n 20 "$LOG_FILE"
            else
                log_info "로그 파일이 없습니다: $LOG_FILE"
            fi
            ;;
        *)
            cat << EOF
🔄 AI Auto Recovery System - 지능형 자동 복구 시스템

사용법:
  $0 status                    # 상태 대시보드 표시
  $0 check                     # 한 번 건강 상태 체크 및 복구
  $0 monitor                   # 지속적 모니터링 시작 (Ctrl+C로 중지)
  $0 recover [도구명]          # 특정 도구 복구 (all, claude, codex, gemini, qwen, mcp)
  $0 cleanup                   # 시스템 리소스 정리
  $0 log                       # 최근 로그 20줄 표시

예시:
  $0 status                    # 현재 상태 확인
  $0 check                     # 문제 있는 도구들 자동 복구
  $0 monitor                   # 백그라운드 모니터링 시작
  $0 recover codex            # Codex CLI만 복구
  $0 cleanup                   # 시스템 정리

특징:
  • 🩺 실시간 건강 상태 모니터링
  • 🔧 자동 복구 (최대 ${MAX_RETRY_ATTEMPTS}회 재시도)
  • 🧹 시스템 리소스 정리
  • 📊 상태 대시보드
  • 📝 상세 로깅 ($LOG_FILE)
  • 🔄 ${MONITOR_INTERVAL}초 간격 지속 모니터링

복구 대상:
  • Claude Code (프로세스 재시작)
  • Codex CLI (Node.js 프로세스 정리)
  • Gemini CLI (OAuth 상태 복구)
  • Qwen CLI (OAuth 상태 복구)
  • MCP 서버 (서버 재연결)
  • 시스템 리소스 (좀비 프로세스, 메모리)
EOF
            ;;
    esac
}

# 직접 실행시 main 호출
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi