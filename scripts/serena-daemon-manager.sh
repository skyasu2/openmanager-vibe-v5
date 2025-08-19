#!/bin/bash

# =============================================================================
# Serena MCP 통합 데몬 관리자
# Cron, systemd, 백그라운드 프로세스 방식을 통합 관리
# =============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_FILE="/mnt/d/cursor/openmanager-vibe-v5/logs/serena-daemon-manager.log"

# 색상 코드
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() {
    echo -e "[$(date '+%H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# 환경 검사
check_environment() {
    log "${BLUE}🔍 WSL 환경 검사...${NC}"
    
    local checks=0
    local total=4
    
    # WSL 확인
    if grep -qi microsoft /proc/version; then
        log "${GREEN}✅ WSL 환경 확인${NC}"
        ((checks++))
    else
        log "${RED}❌ WSL 환경이 아닙니다${NC}"
    fi
    
    # systemd 확인
    if command -v systemctl >/dev/null 2>&1 && systemctl status >/dev/null 2>&1; then
        log "${GREEN}✅ systemd 사용 가능${NC}"
        ((checks++))
    else
        log "${YELLOW}⚠️ systemd 비활성화됨${NC}"
    fi
    
    # cron 확인
    if command -v crontab >/dev/null 2>&1; then
        log "${GREEN}✅ cron 사용 가능${NC}"
        ((checks++))
    else
        log "${RED}❌ cron 미설치${NC}"
    fi
    
    # 스크립트 확인
    if [[ -x "$SCRIPT_DIR/serena-auto-monitor.sh" ]]; then
        log "${GREEN}✅ 모니터링 스크립트 준비됨${NC}"
        ((checks++))
    else
        log "${RED}❌ 모니터링 스크립트 없음${NC}"
    fi
    
    log "${BLUE}📊 환경 점수: $checks/$total${NC}"
    return $((total - checks))
}

# 현재 실행 중인 데몬 확인
check_running_daemons() {
    log "${BLUE}🔍 실행 중인 Serena 데몬 확인...${NC}"
    
    local running=0
    
    # systemd 서비스 확인
    if command -v systemctl >/dev/null 2>&1 && sudo systemctl is-active --quiet serena-mcp-monitor 2>/dev/null; then
        log "${GREEN}✅ systemd 서비스 실행 중${NC}"
        ((running++))
    fi
    
    # cron 작업 확인
    if crontab -l 2>/dev/null | grep -q serena; then
        log "${GREEN}✅ cron 작업 등록됨${NC}"
        ((running++))
    fi
    
    # 백그라운드 프로세스 확인
    if pgrep -f "serena.*monitor" >/dev/null; then
        log "${GREEN}✅ 백그라운드 프로세스 실행 중${NC}"
        local pids=$(pgrep -f "serena.*monitor" | tr '\n' ' ')
        log "   PID: $pids"
        ((running++))
    fi
    
    if [[ $running -eq 0 ]]; then
        log "${YELLOW}⚠️ 실행 중인 Serena 데몬 없음${NC}"
    else
        log "${GREEN}📊 총 $running개 데몬 실행 중${NC}"
    fi
    
    return $running
}

# 데몬 방식 추천
recommend_daemon_type() {
    log "${BLUE}💡 데몬 방식 추천...${NC}"
    
    # systemd 사용 가능하면 추천
    if command -v systemctl >/dev/null 2>&1 && systemctl status >/dev/null 2>&1; then
        log "${GREEN}🏆 추천: systemd 서비스 (안정성 최고)${NC}"
        log "   - 자동 재시작, 로그 관리, 부팅 시 자동 시작"
        log "   - 실행: $0 systemd install"
        return 0
    fi
    
    # cron이 사용 가능하면 추천
    if command -v crontab >/dev/null 2>&1; then
        log "${YELLOW}🥈 추천: cron 기반 (간단하고 안정적)${NC}"
        log "   - 설정 간단, 주기적 실행"
        log "   - 실행: $0 cron install"
        return 1
    fi
    
    # 백그라운드 프로세스
    log "${BLUE}🥉 추천: 백그라운드 프로세스 (기본)${NC}"
    log "   - 즉시 실행 가능, 수동 관리"
    log "   - 실행: $0 background start"
    return 2
}

# systemd 방식 관리
manage_systemd() {
    local action="$1"
    log "${BLUE}🔧 systemd 방식: $action${NC}"
    
    if [[ -x "$SCRIPT_DIR/serena-daemon-systemd.sh" ]]; then
        "$SCRIPT_DIR/serena-daemon-systemd.sh" "$action"
    else
        log "${RED}❌ systemd 관리 스크립트 없음${NC}"
        return 1
    fi
}

# cron 방식 관리
manage_cron() {
    local action="$1"
    log "${BLUE}📅 cron 방식: $action${NC}"
    
    if [[ -x "$SCRIPT_DIR/serena-daemon-cron.sh" ]]; then
        "$SCRIPT_DIR/serena-daemon-cron.sh" "$action"
    else
        log "${RED}❌ cron 관리 스크립트 없음${NC}"
        return 1
    fi
}

# 백그라운드 프로세스 관리
manage_background() {
    local action="$1"
    log "${BLUE}🏃 백그라운드 방식: $action${NC}"
    
    case "$action" in
        "start"|"install")
            if pgrep -f "serena.*monitor" >/dev/null; then
                log "${YELLOW}⚠️ 이미 실행 중인 프로세스 있음${NC}"
                return 1
            fi
            
            log "▶️ 백그라운드 모니터링 시작..."
            nohup "$SCRIPT_DIR/serena-auto-monitor.sh" > "$LOG_FILE" 2>&1 &
            local pid=$!
            log "${GREEN}✅ 시작됨 (PID: $pid)${NC}"
            ;;
        "stop"|"remove")
            local pids=$(pgrep -f "serena.*monitor" || echo "")
            if [[ -n "$pids" ]]; then
                log "⏹️ 프로세스 종료..."
                pkill -f "serena.*monitor"
                log "${GREEN}✅ 종료 완료${NC}"
            else
                log "${YELLOW}⚠️ 실행 중인 프로세스 없음${NC}"
            fi
            ;;
        "status")
            if pgrep -f "serena.*monitor" >/dev/null; then
                local pids=$(pgrep -f "serena.*monitor" | tr '\n' ' ')
                log "${GREEN}✅ 실행 중 (PID: $pids)${NC}"
            else
                log "${YELLOW}⚠️ 실행 중이지 않음${NC}"
            fi
            ;;
    esac
}

# 전체 상태 보고서
status_report() {
    log "${BLUE}📊 Serena MCP 데몬 종합 상태 보고서${NC}"
    echo ""
    
    check_environment
    echo ""
    
    check_running_daemons
    echo ""
    
    recommend_daemon_type
    echo ""
    
    # 최근 로그
    log "${BLUE}📝 최근 활동 로그:${NC}"
    if [[ -f "$LOG_FILE" ]]; then
        tail -5 "$LOG_FILE" | sed 's/^/   /'
    else
        log "   로그 없음"
    fi
}

# 모든 데몬 중지
stop_all() {
    log "${YELLOW}🛑 모든 Serena 데몬 중지...${NC}"
    
    # systemd 서비스 중지
    if command -v systemctl >/dev/null 2>&1; then
        sudo systemctl stop serena-mcp-monitor 2>/dev/null || true
    fi
    
    # 백그라운드 프로세스 종료
    pkill -f "serena.*monitor" 2>/dev/null || true
    
    log "${GREEN}✅ 모든 데몬 중지 완료${NC}"
}

# 사용법
usage() {
    cat << EOF
${BLUE}Serena MCP 통합 데몬 관리자${NC}

사용법: $0 [방식] [명령어]

데몬 방식:
  systemd     - systemd 서비스 (가장 안정적)
  cron        - cron 기반 주기 실행 (간단)
  background  - 백그라운드 프로세스 (기본)

명령어:
  install     - 데몬 설치 및 시작
  remove      - 데몬 제거
  start       - 데몬 시작
  stop        - 데몬 중지
  restart     - 데몬 재시작
  status      - 상태 확인
  logs [N]    - 로그 보기

특수 명령어:
  check       - 환경 검사 및 추천
  status-all  - 전체 상태 보고서
  stop-all    - 모든 데몬 중지
  auto        - 자동 추천 방식으로 설치

예시:
  $0 check                # 환경 검사 및 추천
  $0 auto                 # 자동 추천 방식으로 설치
  $0 systemd install      # systemd 서비스 설치
  $0 cron install         # cron 데몬 설치
  $0 background start     # 백그라운드 프로세스 시작
  $0 status-all           # 전체 상태 확인
  $0 stop-all             # 모든 데몬 중지
EOF
}

# 자동 설치
auto_install() {
    log "${BLUE}🤖 자동 추천 방식으로 설치...${NC}"
    
    recommend_daemon_type
    local recommended=$?
    
    case $recommended in
        0)
            log "${GREEN}📦 systemd 방식으로 자동 설치${NC}"
            manage_systemd "install"
            ;;
        1)
            log "${YELLOW}📦 cron 방식으로 자동 설치${NC}"
            manage_cron "install"
            ;;
        2)
            log "${BLUE}📦 백그라운드 방식으로 자동 설치${NC}"
            manage_background "start"
            ;;
    esac
}

# 스크립트 실행 권한 확인
chmod +x "$SCRIPT_DIR"/serena-daemon-*.sh 2>/dev/null || true

# 메인 실행 로직
case "${1:-help}" in
    "systemd")
        manage_systemd "$2"
        ;;
    "cron")
        manage_cron "$2"
        ;;
    "background")
        manage_background "$2"
        ;;
    "check")
        check_environment
        echo ""
        recommend_daemon_type
        ;;
    "status-all")
        status_report
        ;;
    "stop-all")
        stop_all
        ;;
    "auto")
        auto_install
        ;;
    "help"|"-h"|"--help"|"")
        usage
        ;;
    *)
        echo "알 수 없는 명령어: $1"
        usage
        exit 1
        ;;
esac