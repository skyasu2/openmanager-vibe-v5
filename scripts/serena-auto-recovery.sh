#!/bin/bash

# =============================================================================
# 🤖 Serena MCP SSE 자동 복구 시스템 v2.0.0
# =============================================================================
# 📅 생성일: 2025-08-18
# 🎯 목적: Serena MCP SSE 서버 완전 자동 관리 및 복구
# 🛠️ 기능: 헬스체크 → 자동 재시작 → 연결 검증 → 모니터링
# 🔧 특징: 타임아웃 방지, 하트비트, 자동 복구, 프로세스 관리
# =============================================================================

set -euo pipefail

# 🎨 색상 정의
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly PURPLE='\033[0;35m'
readonly CYAN='\033[0;36m'
readonly WHITE='\033[1;37m'
readonly NC='\033[0m'

# 📋 전역 변수
readonly SCRIPT_VERSION="2.0.0"
readonly SERENA_PORT=9121
readonly SERENA_HOST="localhost"
readonly SERENA_URL="http://${SERENA_HOST}:${SERENA_PORT}"
readonly SERENA_SSE_URL="${SERENA_URL}/sse"
readonly HEALTH_ENDPOINT="${SERENA_URL}/health"
readonly LOG_DIR="./logs"
readonly PID_FILE="${LOG_DIR}/serena-sse.pid"
readonly LOG_FILE="${LOG_DIR}/serena-auto-recovery-$(date +%Y%m%d_%H%M%S).log"
readonly SERENA_LOG="${LOG_DIR}/serena-sse-$(date +%Y%m%d_%H%M%S).log"
readonly MAX_RESTART_ATTEMPTS=3
readonly HEALTH_CHECK_INTERVAL=30
readonly STARTUP_TIMEOUT=60

# 📊 상태 변수
RESTART_COUNT=0
START_TIME=$(date +%s)

print_header() {
    echo -e "${CYAN}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║${WHITE}      🤖 Serena MCP SSE 자동 복구 시스템 v${SCRIPT_VERSION}         ${CYAN}║${NC}"
    echo -e "${CYAN}╚══════════════════════════════════════════════════════════════╝${NC}"
    echo
}

log() {
    local level="$1"
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    mkdir -p "$LOG_DIR"
    echo "[$timestamp] [$level] $message" >> "$LOG_FILE"
    
    case "$level" in
        "INFO")  echo -e "${BLUE}ℹ️  $message${NC}" ;;
        "SUCCESS") echo -e "${GREEN}✅ $message${NC}" ;;
        "WARNING") echo -e "${YELLOW}⚠️  $message${NC}" ;;
        "ERROR") echo -e "${RED}❌ $message${NC}" ;;
        "DEBUG") echo -e "${PURPLE}🔍 $message${NC}" ;;
        "SYSTEM") echo -e "${CYAN}🔧 $message${NC}" ;;
    esac
}

# 🔍 시스템 사전 체크
check_prerequisites() {
    log "INFO" "🔍 Serena 사전 요구사항 확인 중..."
    
    # uvx 설치 확인
    if ! command -v uvx &> /dev/null; then
        log "ERROR" "uvx가 설치되지 않음 - Python/uv 환경 설정 필요"
        echo -e "${CYAN}💡 설치 방법:${NC}"
        echo "  curl -LsSf https://astral.sh/uv/install.sh | sh"
        echo "  source ~/.bashrc"
        return 1
    fi
    
    local uvx_version=$(uvx --version 2>/dev/null || echo "unknown")
    log "SUCCESS" "uvx 설치됨: $uvx_version"
    
    # Serena 패키지 확인
    if ! uvx serena --help &> /dev/null; then
        log "WARNING" "Serena 패키지 설치 확인 중..."
        # Serena는 first-run에서 자동 설치됨
    fi
    
    # 포트 사용 확인
    if netstat -tuln 2>/dev/null | grep -q ":${SERENA_PORT} "; then
        log "WARNING" "포트 $SERENA_PORT 이미 사용 중"
        return 2
    fi
    
    log "SUCCESS" "사전 요구사항 확인 완료"
    return 0
}

# 🔄 기존 Serena 프로세스 정리
cleanup_existing_processes() {
    log "INFO" "🔄 기존 Serena 프로세스 정리 중..."
    
    local cleanup_count=0
    
    # PID 파일 기반 정리
    if [[ -f "$PID_FILE" ]]; then
        local old_pid=$(cat "$PID_FILE")
        if kill -0 "$old_pid" 2>/dev/null; then
            log "INFO" "PID $old_pid Serena 프로세스 종료 중..."
            kill -TERM "$old_pid" 2>/dev/null || true
            sleep 2
            if kill -0 "$old_pid" 2>/dev/null; then
                kill -KILL "$old_pid" 2>/dev/null || true
            fi
            ((cleanup_count++))
        fi
        rm -f "$PID_FILE"
    fi
    
    # 포트 기반 정리
    local port_pids=$(lsof -ti:$SERENA_PORT 2>/dev/null || true)
    if [[ -n "$port_pids" ]]; then
        log "INFO" "포트 $SERENA_PORT 사용 프로세스 정리 중..."
        for pid in $port_pids; do
            log "DEBUG" "프로세스 $pid 종료 중..."
            kill -TERM "$pid" 2>/dev/null || true
            ((cleanup_count++))
        done
        sleep 2
        
        # 강제 종료 필요한 경우
        port_pids=$(lsof -ti:$SERENA_PORT 2>/dev/null || true)
        if [[ -n "$port_pids" ]]; then
            for pid in $port_pids; do
                kill -KILL "$pid" 2>/dev/null || true
            done
        fi
    fi
    
    # 프로세스 이름 기반 정리
    local serena_pids=$(pgrep -f "serena.*sse" 2>/dev/null || true)
    if [[ -n "$serena_pids" ]]; then
        log "INFO" "Serena SSE 프로세스 정리 중..."
        for pid in $serena_pids; do
            kill -TERM "$pid" 2>/dev/null || true
            ((cleanup_count++))
        done
    fi
    
    if [[ $cleanup_count -gt 0 ]]; then
        log "SUCCESS" "$cleanup_count개 기존 프로세스 정리 완료"
        sleep 3 # 정리 후 대기
    else
        log "INFO" "정리할 기존 프로세스 없음"
    fi
}

# 🚀 Serena SSE 서버 시작
start_serena_sse() {
    log "INFO" "🚀 Serena SSE 서버 시작 중..."
    
    # 환경 설정
    export SERENA_LOG_LEVEL="INFO"
    export SERENA_SSE_HEARTBEAT="30"  # 30초마다 하트비트
    export SERENA_TIMEOUT="300"       # 5분 타임아웃
    
    # 로그 디렉토리 생성
    mkdir -p "$LOG_DIR"
    
    # Serena SSE 서버 시작 (백그라운드)
    log "SYSTEM" "uvx serena --transport sse --port $SERENA_PORT 실행 중..."
    
    # 프로세스 시작
    nohup uvx serena --transport sse --port $SERENA_PORT > "$SERENA_LOG" 2>&1 &
    local serena_pid=$!
    
    # PID 저장
    echo "$serena_pid" > "$PID_FILE"
    log "SUCCESS" "Serena 프로세스 시작됨 (PID: $serena_pid)"
    
    # 시작 대기 및 검증
    log "INFO" "서버 시작 대기 중... (최대 ${STARTUP_TIMEOUT}초)"
    
    local wait_count=0
    local startup_success=false
    
    while [[ $wait_count -lt $STARTUP_TIMEOUT ]]; do
        if curl -s --max-time 5 "$HEALTH_ENDPOINT" &>/dev/null; then
            startup_success=true
            break
        fi
        
        # 프로세스가 죽었는지 확인
        if ! kill -0 "$serena_pid" 2>/dev/null; then
            log "ERROR" "Serena 프로세스가 예기치 않게 종료됨"
            return 1
        fi
        
        sleep 2
        ((wait_count += 2))
        
        if [[ $((wait_count % 10)) -eq 0 ]]; then
            log "DEBUG" "시작 대기 중... (${wait_count}/${STARTUP_TIMEOUT}초)"
        fi
    done
    
    if $startup_success; then
        log "SUCCESS" "Serena SSE 서버 시작 완료 (${wait_count}초 소요)"
        return 0
    else
        log "ERROR" "Serena SSE 서버 시작 타임아웃 (${STARTUP_TIMEOUT}초)"
        cleanup_existing_processes
        return 1
    fi
}

# 🏥 헬스체크 수행
health_check() {
    local check_type="${1:-basic}"
    
    case "$check_type" in
        "basic")
            curl -s --max-time 5 "$HEALTH_ENDPOINT" &>/dev/null
            ;;
        "detailed")
            local response=$(curl -s --max-time 10 "$HEALTH_ENDPOINT" 2>/dev/null || echo "")
            if [[ -n "$response" ]]; then
                log "DEBUG" "헬스체크 응답: $response"
                return 0
            else
                return 1
            fi
            ;;
        "sse")
            # SSE 엔드포인트 테스트
            timeout 10s curl -s "$SERENA_SSE_URL" &>/dev/null
            ;;
    esac
}

# 📊 서버 상태 모니터링
monitor_server() {
    log "INFO" "📊 Serena SSE 서버 모니터링 시작..."
    
    while true; do
        if [[ -f "$PID_FILE" ]]; then
            local pid=$(cat "$PID_FILE")
            
            # 프로세스 존재 확인
            if kill -0 "$pid" 2>/dev/null; then
                # 헬스체크
                if health_check "basic"; then
                    log "SUCCESS" "서버 정상 동작 중 (PID: $pid)"
                else
                    log "WARNING" "헬스체크 실패 - 서버 응답 없음"
                    
                    # 복구 시도
                    if [[ $RESTART_COUNT -lt $MAX_RESTART_ATTEMPTS ]]; then
                        log "INFO" "자동 복구 시도 중... ($((RESTART_COUNT + 1))/$MAX_RESTART_ATTEMPTS)"
                        restart_serena
                    else
                        log "ERROR" "최대 재시작 횟수 초과 - 수동 개입 필요"
                        break
                    fi
                fi
            else
                log "ERROR" "Serena 프로세스 종료됨 (PID: $pid)"
                
                # 자동 재시작
                if [[ $RESTART_COUNT -lt $MAX_RESTART_ATTEMPTS ]]; then
                    log "INFO" "자동 재시작 시도 중... ($((RESTART_COUNT + 1))/$MAX_RESTART_ATTEMPTS)"
                    restart_serena
                else
                    log "ERROR" "최대 재시작 횟수 초과"
                    break
                fi
            fi
        else
            log "ERROR" "PID 파일 없음 - 서버가 시작되지 않음"
            break
        fi
        
        sleep $HEALTH_CHECK_INTERVAL
    done
}

# 🔄 서버 재시작
restart_serena() {
    ((RESTART_COUNT++))
    log "WARNING" "🔄 Serena SSE 서버 재시작 중... (시도 $RESTART_COUNT)"
    
    cleanup_existing_processes
    sleep 2
    
    if start_serena_sse; then
        log "SUCCESS" "서버 재시작 성공"
        return 0
    else
        log "ERROR" "서버 재시작 실패"
        return 1
    fi
}

# 🛑 서버 중지
stop_serena() {
    log "INFO" "🛑 Serena SSE 서버 중지 중..."
    
    cleanup_existing_processes
    
    # 포트 확인
    if netstat -tuln 2>/dev/null | grep -q ":${SERENA_PORT} "; then
        log "WARNING" "포트 여전히 사용 중 - 추가 정리 필요"
        sleep 2
        cleanup_existing_processes
    fi
    
    log "SUCCESS" "Serena SSE 서버 중지 완료"
}

# 📋 서버 상태 확인
status_check() {
    echo -e "${WHITE}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${WHITE}║${CYAN}                 🤖 Serena SSE 상태 확인                       ${WHITE}║${NC}"
    echo -e "${WHITE}╚══════════════════════════════════════════════════════════════╝${NC}"
    echo
    
    # 프로세스 상태
    if [[ -f "$PID_FILE" ]]; then
        local pid=$(cat "$PID_FILE")
        if kill -0 "$pid" 2>/dev/null; then
            echo -e "${GREEN}🟢 프로세스:${NC} 실행 중 (PID: $pid)"
        else
            echo -e "${RED}🔴 프로세스:${NC} 중지됨 (PID 파일 존재하나 프로세스 없음)"
        fi
    else
        echo -e "${RED}🔴 프로세스:${NC} 중지됨 (PID 파일 없음)"
    fi
    
    # 포트 상태
    if netstat -tuln 2>/dev/null | grep -q ":${SERENA_PORT} "; then
        echo -e "${GREEN}🟢 포트 $SERENA_PORT:${NC} 사용 중"
    else
        echo -e "${RED}🔴 포트 $SERENA_PORT:${NC} 사용되지 않음"
    fi
    
    # 헬스체크
    if health_check "basic"; then
        echo -e "${GREEN}🟢 헬스체크:${NC} 통과"
        
        if health_check "sse"; then
            echo -e "${GREEN}🟢 SSE 연결:${NC} 정상"
        else
            echo -e "${YELLOW}🟡 SSE 연결:${NC} 확인 필요"
        fi
    else
        echo -e "${RED}🔴 헬스체크:${NC} 실패"
        echo -e "${RED}🔴 SSE 연결:${NC} 불가"
    fi
    
    # 설정 정보
    echo
    echo -e "${BLUE}📋 설정 정보:${NC}"
    echo -e "  ${CYAN}• URL:${NC} $SERENA_URL"
    echo -e "  ${CYAN}• SSE:${NC} $SERENA_SSE_URL"
    echo -e "  ${CYAN}• 로그:${NC} $SERENA_LOG"
    echo -e "  ${CYAN}• PID:${NC} $PID_FILE"
    
    # 로그 정보
    if [[ -f "$SERENA_LOG" ]]; then
        local log_size=$(du -h "$SERENA_LOG" | cut -f1)
        local log_lines=$(wc -l < "$SERENA_LOG")
        echo -e "  ${CYAN}• 로그 크기:${NC} $log_size ($log_lines 줄)"
    fi
    
    # 업타임
    if [[ -f "$PID_FILE" ]]; then
        local pid=$(cat "$PID_FILE")
        if kill -0 "$pid" 2>/dev/null; then
            local uptime_seconds=$(($(date +%s) - START_TIME))
            local uptime_formatted=$(printf '%02d:%02d:%02d' $((uptime_seconds/3600)) $((uptime_seconds%3600/60)) $((uptime_seconds%60)))
            echo -e "  ${CYAN}• 업타임:${NC} $uptime_formatted"
        fi
    fi
    
    echo
}

# 🧪 연결 테스트
test_connection() {
    log "INFO" "🧪 Serena SSE 연결 테스트 중..."
    
    # 기본 헬스체크
    if health_check "detailed"; then
        log "SUCCESS" "헬스체크 통과"
    else
        log "ERROR" "헬스체크 실패"
        return 1
    fi
    
    # SSE 연결 테스트
    log "INFO" "SSE 스트림 연결 테스트 중..."
    if timeout 10s curl -s "$SERENA_SSE_URL" | head -n 1 &>/dev/null; then
        log "SUCCESS" "SSE 연결 성공"
    else
        log "WARNING" "SSE 연결 타임아웃 또는 실패"
    fi
    
    # Claude Code MCP 설정 확인
    if [[ -f ".mcp.json" ]]; then
        if grep -q "\"serena\"" ".mcp.json" && grep -q "$SERENA_SSE_URL" ".mcp.json"; then
            log "SUCCESS" "Claude Code MCP 설정 확인됨"
        else
            log "WARNING" "Claude Code MCP 설정 확인 필요"
        fi
    else
        log "WARNING" ".mcp.json 파일 없음"
    fi
    
    log "SUCCESS" "연결 테스트 완료"
}

# 도움말 출력
show_help() {
    echo -e "${CYAN}🤖 Serena MCP SSE 자동 복구 시스템 v${SCRIPT_VERSION}${NC}"
    echo
    echo -e "${WHITE}사용법:${NC}"
    echo "  $0 [명령] [옵션]"
    echo
    echo -e "${WHITE}명령:${NC}"
    echo "  start       Serena SSE 서버 시작"
    echo "  stop        Serena SSE 서버 중지"
    echo "  restart     Serena SSE 서버 재시작"
    echo "  status      서버 상태 확인"
    echo "  monitor     서버 모니터링 시작 (백그라운드)"
    echo "  test        연결 테스트"
    echo "  logs        최근 로그 출력"
    echo "  clean       모든 프로세스 및 로그 정리"
    echo
    echo -e "${WHITE}옵션:${NC}"
    echo "  --force     강제 실행 (기존 프로세스 무시)"
    echo "  --verbose   상세 로그 출력"
    echo "  --no-check  사전 요구사항 검사 스킵"
    echo
    echo -e "${WHITE}예시:${NC}"
    echo "  $0 start              # 서버 시작"
    echo "  $0 monitor            # 모니터링 시작"
    echo "  $0 status             # 상태 확인"
    echo "  $0 restart --force    # 강제 재시작"
    echo
}

# 🚀 메인 실행 함수
main() {
    local command="${1:-start}"
    local force_mode=false
    local verbose_mode=false
    local skip_check=false
    
    # 옵션 파싱
    while [[ $# -gt 0 ]]; do
        case "${1:-}" in
            "--force")
                force_mode=true
                shift
                ;;
            "--verbose")
                verbose_mode=true
                shift
                ;;
            "--no-check")
                skip_check=true
                shift
                ;;
            *)
                shift
                ;;
        esac
    done
    
    # 헤더 출력
    if [[ "$command" != "logs" ]]; then
        print_header
    fi
    
    # 사전 요구사항 검사
    if ! $skip_check && [[ "$command" != "clean" && "$command" != "logs" && "$command" != "status" ]]; then
        local prereq_result=0
        check_prerequisites || prereq_result=$?
        
        if [[ $prereq_result -eq 1 ]]; then
            log "ERROR" "사전 요구사항 미충족 - 실행 중단"
            exit 1
        elif [[ $prereq_result -eq 2 ]] && ! $force_mode; then
            log "WARNING" "포트 사용 중 - --force 옵션으로 강제 실행 가능"
            exit 1
        fi
    fi
    
    # 명령 실행
    case "$command" in
        "start")
            if $force_mode; then
                cleanup_existing_processes
            fi
            start_serena_sse
            test_connection
            ;;
        "stop")
            stop_serena
            ;;
        "restart")
            restart_serena
            test_connection
            ;;
        "status")
            status_check
            ;;
        "monitor")
            start_serena_sse
            monitor_server
            ;;
        "test")
            test_connection
            ;;
        "logs")
            if [[ -f "$SERENA_LOG" ]]; then
                tail -f "$SERENA_LOG"
            else
                log "WARNING" "로그 파일 없음: $SERENA_LOG"
            fi
            ;;
        "clean")
            log "INFO" "모든 프로세스 및 로그 정리 중..."
            cleanup_existing_processes
            rm -f "${LOG_DIR}"/serena-*.log
            rm -f "${LOG_DIR}"/serena-*.pid
            log "SUCCESS" "정리 완료"
            ;;
        *)
            echo -e "${RED}❌ 알 수 없는 명령: $command${NC}"
            show_help
            exit 1
            ;;
    esac
}

# 스크립트 실행
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    case "${1:-}" in
        "--help"|"-h")
            show_help
            ;;
        *)
            main "$@"
            ;;
    esac
fi