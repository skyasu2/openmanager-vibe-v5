#!/bin/bash
# WSL 통합 모니터링 도구
# OpenManager VIBE 개발 환경 전용
# 작성자: Claude Code
# 사용법: ./scripts/wsl-monitor/wsl-monitor.sh [옵션]

set -e

# 설정 변수
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
LOG_DIR="$SCRIPT_DIR/logs"
LIB_DIR="$SCRIPT_DIR/lib"

# 기본 설정
MONITOR_INTERVAL=5  # 초 단위
DAEMON_MODE=false
VERBOSE=false
LOG_LEVEL="INFO"
MAX_LOG_SIZE="100M"

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color

# 로그 함수들
log_info() {
    echo -e "${BLUE}[INFO]${NC} $(date '+%H:%M:%S') $1" >&2
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $(date '+%H:%M:%S') $1" >&2
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $(date '+%H:%M:%S') $1" >&2
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $(date '+%H:%M:%S') $1" >&2
}

log_debug() {
    if [[ "$VERBOSE" == "true" ]]; then
        echo -e "${PURPLE}[DEBUG]${NC} $(date '+%H:%M:%S') $1" >&2
    fi
}

# 헬프 메시지
show_help() {
    cat << EOF
🖥️ WSL 통합 모니터링 도구 - OpenManager VIBE 개발 환경 전용

사용법: $0 [옵션]

옵션:
  -h, --help          이 도움말 표시
  -d, --daemon        백그라운드 데몬 모드로 실행
  -i, --interval SEC  모니터링 주기 (기본: 5초)
  -v, --verbose       상세 로그 출력
  -o, --once          한 번만 실행하고 종료
  --dashboard         터미널 대시보드만 표시
  --logs              로그 분석 모드
  --check-mcp         MCP 서버 상태만 체크

예시:
  $0                          # 기본 모니터링 시작
  $0 -d -i 10                 # 10초 간격으로 데몬 모드 실행
  $0 --dashboard              # 실시간 대시보드만 표시
  $0 --check-mcp             # MCP 서버 상태만 체크

🔍 모니터링 항목:
  • WSL 시스템 리소스 (메모리, CPU, 디스크)
  • 프로세스별 리소스 점유율
  • MCP 서버 9개 상태 및 응답시간
  • Serena MCP 특별 디버깅

📂 로그 위치: $LOG_DIR
EOF
}

# 초기화 함수
init_monitoring() {
    log_info "WSL 모니터링 도구 초기화 중..."
    
    # 로그 디렉토리 생성
    mkdir -p "$LOG_DIR"/{system,process,mcp}
    
    # 전역 배열 초기화
    declare -gA SYSTEM_METRICS
    declare -gA PREV_SYSTEM_METRICS
    declare -gA PROCESS_INFO
    declare -ga TOP_PROCESSES
    declare -ga MCP_PROCESSES
    declare -gA MCP_SERVERS
    declare -gA MCP_STATUS
    declare -gA MCP_RESPONSE_TIMES
    declare -gA MCP_FAIL_COUNT
    
    # lib 디렉토리의 모듈들 로드
    for lib_file in "$LIB_DIR"/*.sh; do
        if [[ -f "$lib_file" ]]; then
            log_debug "로딩: $(basename "$lib_file")"
            # shellcheck source=/dev/null
            source "$lib_file"
        fi
    done
    
    # WSL 환경 확인
    if ! grep -qi microsoft /proc/version 2>/dev/null; then
        log_warning "WSL 환경이 아닙니다. 일부 기능이 제한될 수 있습니다."
    fi
    
    # 필수 명령어 확인
    local required_commands=("ps" "free" "top" "vmstat" "claude")
    for cmd in "${required_commands[@]}"; do
        if ! command -v "$cmd" >/dev/null 2>&1; then
            log_error "필수 명령어 '$cmd'를 찾을 수 없습니다."
            return 1
        fi
    done
    
    log_success "초기화 완료"
}

# 메인 모니터링 루프
start_monitoring() {
    log_info "모니터링 시작 (간격: ${MONITOR_INTERVAL}초)"
    log_info "종료하려면 Ctrl+C를 누르세요"
    
    # 시그널 핸들러 설정
    trap cleanup_and_exit SIGINT SIGTERM
    
    local iteration=0
    while true; do
        iteration=$((iteration + 1))
        
        log_debug "모니터링 반복 #$iteration"
        
        # 시스템 메트릭 수집
        if command -v collect_system_metrics >/dev/null 2>&1; then
            collect_system_metrics "$iteration"
        fi
        
        # 프로세스 분석
        if command -v analyze_processes >/dev/null 2>&1; then
            analyze_processes "$iteration"
        fi
        
        # MCP 서버 체크
        if command -v check_mcp_servers >/dev/null 2>&1; then
            check_mcp_servers "$iteration"
        fi
        
        # 대시보드 출력 (데몬 모드가 아닐 때)
        if [[ "$DAEMON_MODE" == "false" ]] && command -v show_dashboard >/dev/null 2>&1; then
            clear
            show_dashboard "$iteration"
        fi
        
        sleep "$MONITOR_INTERVAL"
    done
}

# 정리 및 종료
cleanup_and_exit() {
    log_info "모니터링 종료 중..."
    
    # 백그라운드 프로세스 정리
    if [[ -f "$LOG_DIR/monitor.pid" ]]; then
        local pid
        pid=$(cat "$LOG_DIR/monitor.pid")
        if kill -0 "$pid" 2>/dev/null; then
            kill "$pid" 2>/dev/null || true
        fi
        rm -f "$LOG_DIR/monitor.pid"
    fi
    
    log_success "모니터링 종료됨"
    exit 0
}

# 단일 실행 모드
run_once() {
    log_info "단일 실행 모드"
    
    init_monitoring
    
    # 각 모듈 한 번씩 실행
    if command -v collect_system_metrics >/dev/null 2>&1; then
        collect_system_metrics 1
    fi
    
    if command -v analyze_processes >/dev/null 2>&1; then
        analyze_processes 1
    fi
    
    if command -v check_mcp_servers >/dev/null 2>&1; then
        check_mcp_servers 1
    fi
    
    # 결과 출력
    if command -v show_dashboard >/dev/null 2>&1; then
        show_dashboard 1
    fi
}

# MCP만 체크
check_mcp_only() {
    log_info "MCP 서버 상태 체크 모드"
    
    # MCP 체크 모듈만 로드
    if [[ -f "$LIB_DIR/mcp-checker.sh" ]]; then
        # shellcheck source=/dev/null
        source "$LIB_DIR/mcp-checker.sh"
        check_mcp_servers 1
    else
        log_error "MCP 체크 모듈을 찾을 수 없습니다."
        return 1
    fi
}

# 데몬 모드 시작
start_daemon() {
    log_info "데몬 모드로 시작 중..."
    
    # 이미 실행 중인 데몬 확인
    if [[ -f "$LOG_DIR/monitor.pid" ]]; then
        local pid
        pid=$(cat "$LOG_DIR/monitor.pid")
        if kill -0 "$pid" 2>/dev/null; then
            log_error "이미 모니터링 데몬이 실행 중입니다 (PID: $pid)"
            return 1
        else
            rm -f "$LOG_DIR/monitor.pid"
        fi
    fi
    
    # 백그라운드에서 실행
    nohup "$0" --internal-daemon > "$LOG_DIR/daemon.log" 2>&1 &
    local daemon_pid=$!
    
    echo "$daemon_pid" > "$LOG_DIR/monitor.pid"
    log_success "데몬 시작됨 (PID: $daemon_pid)"
    log_info "로그: $LOG_DIR/daemon.log"
    log_info "중지: kill $daemon_pid 또는 $0 --stop"
}

# 메인 함수
main() {
    # 인자 파싱
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_help
                exit 0
                ;;
            -d|--daemon)
                DAEMON_MODE=true
                shift
                ;;
            -i|--interval)
                MONITOR_INTERVAL="$2"
                shift 2
                ;;
            -v|--verbose)
                VERBOSE=true
                shift
                ;;
            -o|--once)
                run_once
                exit 0
                ;;
            --dashboard)
                # 대시보드만 실행하는 로직은 별도 구현 필요
                log_info "대시보드 모드 (구현 예정)"
                exit 0
                ;;
            --logs)
                log_info "로그 분석 모드 (구현 예정)"
                exit 0
                ;;
            --check-mcp)
                check_mcp_only
                exit 0
                ;;
            --internal-daemon)
                # 내부 데몬 모드 (직접 호출하지 말 것)
                DAEMON_MODE=true
                shift
                break
                ;;
            --stop)
                if [[ -f "$LOG_DIR/monitor.pid" ]]; then
                    local pid
                    pid=$(cat "$LOG_DIR/monitor.pid")
                    if kill "$pid" 2>/dev/null; then
                        log_success "데몬 중지됨 (PID: $pid)"
                        rm -f "$LOG_DIR/monitor.pid"
                    else
                        log_error "데몬을 중지할 수 없습니다"
                    fi
                else
                    log_error "실행 중인 데몬을 찾을 수 없습니다"
                fi
                exit 0
                ;;
            *)
                log_error "알 수 없는 옵션: $1"
                show_help
                exit 1
                ;;
        esac
    done
    
    # 초기화
    init_monitoring || exit 1
    
    # 데몬 모드 처리
    if [[ "$DAEMON_MODE" == "true" ]]; then
        if [[ "$1" == "--internal-daemon" ]]; then
            # 실제 데몬 프로세스
            start_monitoring
        else
            # 데몬 시작 요청
            start_daemon
        fi
    else
        # 일반 모드
        start_monitoring
    fi
}

# 스크립트 시작점
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi