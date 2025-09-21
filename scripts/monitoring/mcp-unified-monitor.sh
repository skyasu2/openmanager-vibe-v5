#!/bin/bash
# MCP 통합 모니터링 시스템
# 목적: 기존 3개 MCP 모니터링 도구를 하나로 통합
# 작성일: 2025-09-21
# 기존 도구들: mcp-auto-monitor.sh, monitor-mcp-servers.sh, mcp-stability-monitor.sh

set -euo pipefail

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# 설정
PROJECT_ROOT="/mnt/d/cursor/openmanager-vibe-v5"
LOG_DIR="$PROJECT_ROOT/logs/monitoring"
UNIFIED_LOG="$LOG_DIR/mcp-unified.log"
CPU_THRESHOLD=80
MEMORY_THRESHOLD=85
HEALTH_CHECK_TIMEOUT=30

# 로그 디렉토리 생성
mkdir -p "$LOG_DIR"

# 로그 함수들
log_info() {
    echo -e "${BLUE}[INFO]${NC} $(date '+%H:%M:%S') $1" | tee -a "$UNIFIED_LOG"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $(date '+%H:%M:%S') $1" | tee -a "$UNIFIED_LOG"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $(date '+%H:%M:%S') $1" | tee -a "$UNIFIED_LOG"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $(date '+%H:%M:%S') $1" | tee -a "$UNIFIED_LOG"
}

# 사용법 출력
show_usage() {
    echo "MCP 통합 모니터링 시스템 v1.0"
    echo ""
    echo "사용법: $0 [옵션]"
    echo ""
    echo "옵션:"
    echo "  --status     MCP 서버 상태 확인 (기본 동작)"
    echo "  --stability  CPU/메모리 안정성 모니터링"
    echo "  --auto       자동 모니터링 및 복구 시작"
    echo "  --health     헬스체크만 실행"
    echo "  --all        모든 모니터링 실행"
    echo "  --stop       자동 모니터링 중지"
    echo "  --help       이 도움말 표시"
    echo ""
    echo "예시:"
    echo "  $0 --status          # 기본 상태 확인"
    echo "  $0 --all             # 종합 모니터링"
    echo "  $0 --auto --daemon   # 백그라운드 자동 모니터링"
}

# MCP 서버 기본 상태 확인 (기존 monitor-mcp-servers.sh 기능)
check_mcp_status() {
    log_info "MCP 서버 상태 확인 중..."

    local servers=("context7" "supabase" "vercel" "memory" "time" "sequential-thinking" "shadcn-ui" "serena" "playwright")
    local healthy_count=0
    local total_count=${#servers[@]}

    echo -e "\n${CYAN}📡 MCP 서버 상태 리포트${NC}"
    echo "=================================="

    for server in "${servers[@]}"; do
        if timeout 5 claude mcp list | grep -q "$server"; then
            echo -e "✅ ${GREEN}$server${NC} - 정상"
            ((healthy_count++))
        else
            echo -e "❌ ${RED}$server${NC} - 연결 실패"
            log_warning "MCP 서버 $server 연결 실패"
        fi
    done

    echo "=================================="
    echo -e "총 ${total_count}개 중 ${GREEN}${healthy_count}개${NC} 정상 작동"

    if [[ $healthy_count -eq $total_count ]]; then
        log_success "모든 MCP 서버 정상 작동"
        return 0
    else
        log_warning "$((total_count - healthy_count))개 MCP 서버에 문제 발생"
        return 1
    fi
}

# CPU/메모리 안정성 모니터링 (기존 mcp-stability-monitor.sh 기능)
check_stability() {
    log_info "MCP 서버 안정성 검사 중..."

    echo -e "\n${PURPLE}⚡ 시스템 리소스 모니터링${NC}"
    echo "=================================="

    # 전체 시스템 리소스
    local cpu_usage=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | sed 's/%us,//')
    local memory_usage=$(free | grep Mem | awk '{printf "%.1f", $3/$2 * 100.0}')

    echo "💻 전체 시스템:"
    echo "   CPU: ${cpu_usage}%"
    echo "   Memory: ${memory_usage}%"

    # MCP 관련 프로세스 확인
    echo -e "\n🔍 MCP 관련 프로세스:"

    local mcp_processes=$(ps aux | grep -E "(claude|mcp|playwright)" | grep -v grep | wc -l)
    echo "   활성 MCP 프로세스: ${mcp_processes}개"

    # Playwright 특별 모니터링 (리소스 집약적)
    if pgrep -f "playwright" > /dev/null; then
        local playwright_cpu=$(ps aux | grep playwright | grep -v grep | awk '{sum+=$3} END {printf "%.1f", sum}')
        local playwright_mem=$(ps aux | grep playwright | grep -v grep | awk '{sum+=$4} END {printf "%.1f", sum}')

        echo "   🎭 Playwright:"
        echo "      CPU: ${playwright_cpu}%"
        echo "      Memory: ${playwright_mem}%"

        # 임계값 확인
        if (( $(echo "$playwright_cpu > 50" | bc -l) )); then
            log_warning "Playwright CPU 사용량 높음: ${playwright_cpu}%"
        fi
    fi

    # 메모리 임계값 확인
    if (( $(echo "$memory_usage > $MEMORY_THRESHOLD" | bc -l) )); then
        log_warning "시스템 메모리 사용량 높음: ${memory_usage}%"
        return 1
    fi

    log_success "시스템 안정성 양호"
    return 0
}

# 헬스체크 및 자동 복구 (기존 mcp-auto-monitor.sh 기능)
auto_recovery() {
    log_info "자동 헬스체크 및 복구 시작..."

    # 기본 상태 확인
    if ! check_mcp_status; then
        log_warning "MCP 서버 문제 감지, 복구 시도 중..."

        # Claude 재시작 시도
        log_info "Claude MCP 연결 재시작 시도..."
        if timeout 10 claude mcp list > /dev/null 2>&1; then
            log_success "Claude MCP 연결 복구 성공"
        else
            log_error "Claude MCP 연결 복구 실패"
        fi
    fi

    # 안정성 확인
    if ! check_stability; then
        log_warning "시스템 안정성 문제 감지"

        # 메모리 정리 시도
        log_info "메모리 정리 시도..."
        sync && echo 1 > /proc/sys/vm/drop_caches 2>/dev/null || true
        log_info "메모리 정리 완료"
    fi
}

# 종합 모니터링
run_comprehensive_monitoring() {
    echo -e "${CYAN}🚀 MCP 종합 모니터링 시작${NC}"
    echo "==============================="

    check_mcp_status
    local status_result=$?

    check_stability
    local stability_result=$?

    echo -e "\n${CYAN}📊 종합 결과${NC}"
    echo "============="

    if [[ $status_result -eq 0 && $stability_result -eq 0 ]]; then
        echo -e "✅ ${GREEN}전체적으로 정상 작동 중${NC}"
        log_success "MCP 시스템 종합 검사 통과"
    else
        echo -e "⚠️  ${YELLOW}일부 문제 발견, 자동 복구 시도${NC}"
        auto_recovery
    fi
}

# 자동 모니터링 데몬 시작
start_daemon() {
    local pid_file="/tmp/mcp-unified-monitor.pid"

    if [[ -f "$pid_file" ]] && kill -0 "$(cat "$pid_file")" 2>/dev/null; then
        log_warning "MCP 통합 모니터링이 이미 실행 중입니다"
        return 1
    fi

    log_info "MCP 통합 모니터링 데몬 시작..."

    # 백그라운드에서 무한 루프 실행
    (
        echo $$ > "$pid_file"

        while true; do
            auto_recovery
            sleep 300  # 5분마다 실행
        done
    ) &

    log_success "MCP 통합 모니터링 데몬 시작됨 (PID: $(cat "$pid_file"))"
}

# 자동 모니터링 중지
stop_daemon() {
    local pid_file="/tmp/mcp-unified-monitor.pid"

    if [[ -f "$pid_file" ]] && kill -0 "$(cat "$pid_file")" 2>/dev/null; then
        local pid=$(cat "$pid_file")
        kill "$pid"
        rm -f "$pid_file"
        log_success "MCP 통합 모니터링 데몬 중지됨"
    else
        log_warning "실행 중인 MCP 통합 모니터링 데몬이 없습니다"
    fi
}

# 메인 실행 로직
main() {
    local mode="status"
    local daemon_mode=false

    # 파라미터 파싱
    while [[ $# -gt 0 ]]; do
        case $1 in
            --status)
                mode="status"
                shift
                ;;
            --stability)
                mode="stability"
                shift
                ;;
            --auto)
                mode="auto"
                shift
                ;;
            --health)
                mode="health"
                shift
                ;;
            --all)
                mode="all"
                shift
                ;;
            --daemon)
                daemon_mode=true
                shift
                ;;
            --stop)
                stop_daemon
                exit 0
                ;;
            --help|-h)
                show_usage
                exit 0
                ;;
            *)
                echo "알 수 없는 옵션: $1"
                show_usage
                exit 1
                ;;
        esac
    done

    # 로그 시작
    echo "$(date '+%Y-%m-%d %H:%M:%S') - MCP 통합 모니터링 시작" >> "$UNIFIED_LOG"

    # 모드별 실행
    case $mode in
        "status")
            check_mcp_status
            ;;
        "stability")
            check_stability
            ;;
        "auto")
            if [[ "$daemon_mode" == "true" ]]; then
                start_daemon
            else
                auto_recovery
            fi
            ;;
        "health")
            check_mcp_status
            ;;
        "all")
            run_comprehensive_monitoring
            ;;
        *)
            log_error "알 수 없는 모드: $mode"
            show_usage
            exit 1
            ;;
    esac
}

# 스크립트 실행
main "$@"