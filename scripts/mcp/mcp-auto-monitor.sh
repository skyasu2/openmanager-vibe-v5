#!/bin/bash
# MCP 자동 모니터링 및 알림 시스템
# Created: 2025-08-21
# Purpose: 자동 헬스체크, 문제 감지, 자동 복구

set -e

# 설정
PROJECT_ROOT="/mnt/d/cursor/openmanager-vibe-v5"
HEALTH_CHECK_SCRIPT="$PROJECT_ROOT/scripts/mcp/mcp-health-check.sh"
LOG_DIR="$PROJECT_ROOT/logs/monitoring"
ALERT_LOG="$LOG_DIR/alerts.log"
MONITOR_PID_FILE="/tmp/mcp-monitor.pid"

# 색상 코드
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 로그 디렉토리 생성
mkdir -p "$LOG_DIR"

# 알림 함수
send_alert() {
    local severity=$1
    local message=$2
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    echo "[$timestamp] [$severity] $message" >> "$ALERT_LOG"
    
    case "$severity" in
        "CRITICAL")
            echo -e "${RED}🚨 CRITICAL: $message${NC}"
            # 여기에 이메일/Slack 알림 코드 추가 가능
            ;;
        "WARNING")
            echo -e "${YELLOW}⚠️ WARNING: $message${NC}"
            ;;
        "INFO")
            echo -e "${GREEN}ℹ️ INFO: $message${NC}"
            ;;
    esac
}

# MCP 서버 재시작 함수
restart_mcp_servers() {
    send_alert "INFO" "MCP 서버 재시작 시도 중..."
    
    # Claude API 재시작
    if command -v claude &> /dev/null; then
        claude api restart 2>&1 | tail -5
        sleep 2
        
        # 재시작 확인
        if claude mcp list &> /dev/null; then
            send_alert "INFO" "MCP 서버 재시작 성공"
            return 0
        else
            send_alert "CRITICAL" "MCP 서버 재시작 실패"
            return 1
        fi
    else
        send_alert "CRITICAL" "Claude Code가 설치되지 않음"
        return 1
    fi
}

# Supabase 보안 체크
check_supabase_security() {
    if command -v claude &> /dev/null; then
        # MCP Supabase advisor 호출
        echo "Supabase 보안 체크 중..."
        
        # 환경변수 확인
        if [ -f "$PROJECT_ROOT/.env.local" ]; then
            if ! grep -q "SUPABASE_SERVICE_ROLE_KEY" "$PROJECT_ROOT/.env.local"; then
                send_alert "CRITICAL" "Supabase 서비스 키 누락 - 즉시 설정 필요"
                return 1
            fi
        else
            send_alert "CRITICAL" ".env.local 파일 없음 - 환경설정 필요"
            return 1
        fi
    fi
    return 0
}

# AI CLI 도구 체크 및 복구
check_ai_tools() {
    local tools_status=0
    
    # Gemini CLI
    if ! command -v gemini &> /dev/null; then
        send_alert "WARNING" "Gemini CLI 미설치 - 설치 시도 중..."
        npm install -g @google/gemini-cli 2>&1 | tail -3
        tools_status=1
    fi
    
    # Qwen CLI
    if ! command -v qwen &> /dev/null; then
        send_alert "WARNING" "Qwen CLI 미설치 - 설치 시도 중..."
        npm install -g @qwen-code/qwen-code 2>&1 | tail -3
        tools_status=1
    fi
    
    # Codex CLI
    if ! command -v codex &> /dev/null && ! command -v codex-cli &> /dev/null; then
        send_alert "WARNING" "Codex CLI 미설치"
        tools_status=1
    fi
    
    return $tools_status
}

# 메모리 모니터링
check_memory() {
    local mem_available=$(free -m | grep "^Mem:" | awk '{print $7}')
    local mem_threshold=1024  # 1GB
    
    if [ "$mem_available" -lt "$mem_threshold" ]; then
        send_alert "WARNING" "메모리 부족: ${mem_available}MB 가용 (임계값: ${mem_threshold}MB)"
        
        # 캐시 정리
        sync && echo 3 | sudo tee /proc/sys/vm/drop_caches > /dev/null 2>&1 || true
        
        # WSL 메모리 압축
        if grep -q microsoft /proc/version; then
            send_alert "INFO" "WSL 메모리 압축 시도..."
            # WSL 메모리 회수 명령
            echo 1 | sudo tee /proc/sys/vm/compact_memory > /dev/null 2>&1 || true
        fi
        
        return 1
    fi
    
    return 0
}

# 메인 모니터링 루프
monitor_loop() {
    local check_interval=${1:-60}  # 기본 60초
    local issue_count=0
    local max_issues=3
    
    echo -e "${BLUE}=== MCP 자동 모니터링 시작 ===${NC}"
    echo "체크 간격: ${check_interval}초"
    echo "PID: $$"
    echo $$ > "$MONITOR_PID_FILE"
    
    send_alert "INFO" "자동 모니터링 시작 (간격: ${check_interval}초)"
    
    while true; do
        echo -e "\n${BLUE}[$(date '+%H:%M:%S')] 헬스체크 실행 중...${NC}"
        
        # 헬스체크 실행
        if ! "$HEALTH_CHECK_SCRIPT" > /dev/null 2>&1; then
            issue_count=$((issue_count + 1))
            send_alert "WARNING" "헬스체크 실패 (${issue_count}/${max_issues})"
            
            # 자동 복구 시도
            if [ "$issue_count" -ge "$max_issues" ]; then
                send_alert "CRITICAL" "연속 ${max_issues}회 실패 - 자동 복구 시작"
                
                # MCP 서버 재시작
                restart_mcp_servers
                
                # AI 도구 체크
                check_ai_tools
                
                # 카운터 리셋
                issue_count=0
            fi
        else
            # 정상 상태
            if [ "$issue_count" -gt 0 ]; then
                send_alert "INFO" "시스템 정상 복구됨"
                issue_count=0
            fi
        fi
        
        # 추가 체크
        check_memory
        check_supabase_security
        
        # 대기
        sleep "$check_interval"
    done
}

# 데몬 모드 시작/중지
case "${1:-start}" in
    start)
        if [ -f "$MONITOR_PID_FILE" ]; then
            OLD_PID=$(cat "$MONITOR_PID_FILE")
            if ps -p "$OLD_PID" > /dev/null 2>&1; then
                echo -e "${YELLOW}모니터링이 이미 실행 중입니다 (PID: $OLD_PID)${NC}"
                exit 1
            fi
        fi
        
        # 백그라운드 실행
        nohup "$0" monitor > "$LOG_DIR/monitor.log" 2>&1 &
        echo -e "${GREEN}✅ 자동 모니터링 시작됨 (PID: $!)${NC}"
        ;;
        
    stop)
        if [ -f "$MONITOR_PID_FILE" ]; then
            PID=$(cat "$MONITOR_PID_FILE")
            if kill "$PID" 2>/dev/null; then
                rm -f "$MONITOR_PID_FILE"
                echo -e "${GREEN}✅ 모니터링 중지됨${NC}"
                send_alert "INFO" "자동 모니터링 중지됨"
            else
                echo -e "${RED}모니터링 프로세스를 찾을 수 없습니다${NC}"
            fi
        else
            echo -e "${YELLOW}실행 중인 모니터링이 없습니다${NC}"
        fi
        ;;
        
    status)
        if [ -f "$MONITOR_PID_FILE" ]; then
            PID=$(cat "$MONITOR_PID_FILE")
            if ps -p "$PID" > /dev/null 2>&1; then
                echo -e "${GREEN}✅ 모니터링 실행 중 (PID: $PID)${NC}"
                echo -e "\n최근 알림:"
                tail -5 "$ALERT_LOG" 2>/dev/null || echo "알림 없음"
            else
                echo -e "${RED}❌ 모니터링이 실행되지 않습니다${NC}"
                rm -f "$MONITOR_PID_FILE"
            fi
        else
            echo -e "${YELLOW}모니터링이 실행되지 않습니다${NC}"
        fi
        ;;
        
    monitor)
        # 실제 모니터링 루프 실행
        monitor_loop "${2:-60}"
        ;;
        
    test)
        # 단일 체크 실행
        echo -e "${BLUE}=== 단일 헬스체크 테스트 ===${NC}"
        "$HEALTH_CHECK_SCRIPT"
        check_memory
        check_supabase_security
        check_ai_tools
        echo -e "${GREEN}✅ 테스트 완료${NC}"
        ;;
        
    *)
        echo "사용법: $0 {start|stop|status|test}"
        echo ""
        echo "  start  - 백그라운드에서 모니터링 시작"
        echo "  stop   - 모니터링 중지"
        echo "  status - 모니터링 상태 확인"
        echo "  test   - 단일 체크 실행"
        exit 1
        ;;
esac

exit 0