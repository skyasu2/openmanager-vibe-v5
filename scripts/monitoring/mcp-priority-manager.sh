#!/bin/bash

# MCP 서버 우선순위 관리 시스템
# 작성일: 2025-09-17
# 목적: 리소스 상황에 따른 MCP 서버 동적 관리

set -euo pipefail

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# MCP 서버 우선순위 정의
declare -A CRITICAL_SERVERS=(
    ["memory"]="핵심 메모리 관리"
    ["serena"]="코드베이스 분석"
    ["supabase"]="데이터베이스 연결"
)

declare -A IMPORTANT_SERVERS=(
    ["time"]="시간 유틸리티"
    ["sequential-thinking"]="사고 프로세스"
    ["vercel"]="배포 관리"
)

declare -A OPTIONAL_SERVERS=(
    ["playwright"]="브라우저 자동화"
    ["shadcn-ui"]="UI 컴포넌트"
    ["context7"]="컨텍스트 검색"
)

# 설정
LOG_FILE="/tmp/mcp-priority-manager.log"
MEMORY_CRITICAL_THRESHOLD=90
MEMORY_WARNING_THRESHOLD=80
CPU_CRITICAL_THRESHOLD=85
CPU_WARNING_THRESHOLD=70

USER_HOME="${HOME:-$(getent passwd "$USER" | cut -d: -f6)}"
DEFAULT_UVX_PATH="$USER_HOME/.local/bin/uvx"

if command -v uvx >/dev/null 2>&1; then
    UVX_BIN_COMMAND="uvx"
    UVX_BIN_PATH="$(command -v uvx)"
else
    UVX_BIN_COMMAND="$DEFAULT_UVX_PATH"
    UVX_BIN_PATH="$DEFAULT_UVX_PATH"
fi

# 로그 함수
log_message() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# 현재 리소스 상태 확인
get_system_status() {
    # CPU 사용률
    local cpu_usage=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | awk -F'%' '{print $1}')
    cpu_usage=${cpu_usage%.*}

    # 메모리 사용률
    local memory_info=$(free | grep Mem)
    local total=$(echo $memory_info | awk '{print $2}')
    local used=$(echo $memory_info | awk '{print $3}')
    local memory_usage=$((used * 100 / total))

    echo "$cpu_usage $memory_usage"
}

# 현재 실행 중인 MCP 서버 확인
get_active_servers() {
    claude mcp list 2>/dev/null | grep "✓ Connected" | awk -F: '{print $1}' || true
}

# 서버 우선순위 분류
classify_server() {
    local server="$1"
    
    if [[ -n "${CRITICAL_SERVERS[$server]:-}" ]]; then
        echo "critical"
    elif [[ -n "${IMPORTANT_SERVERS[$server]:-}" ]]; then
        echo "important"
    elif [[ -n "${OPTIONAL_SERVERS[$server]:-}" ]]; then
        echo "optional"
    else
        echo "unknown"
    fi
}

# MCP 서버 상태 표시
show_server_status() {
    echo -e "${BLUE}📊 MCP 서버 우선순위 현황${NC}"
    echo "=================================="
    
    local active_servers=$(get_active_servers)
    
    echo -e "${RED}🔴 중요 서버 (항상 유지):${NC}"
    for server in "${!CRITICAL_SERVERS[@]}"; do
        local status="❌ 비활성"
        if echo "$active_servers" | grep -q "^$server$"; then
            status="✅ 활성"
        fi
        echo "  $server: $status - ${CRITICAL_SERVERS[$server]}"
    done
    
    echo -e "\n${YELLOW}🟡 중간 서버 (조건부 유지):${NC}"
    for server in "${!IMPORTANT_SERVERS[@]}"; do
        local status="❌ 비활성"
        if echo "$active_servers" | grep -q "^$server$"; then
            status="✅ 활성"
        fi
        echo "  $server: $status - ${IMPORTANT_SERVERS[$server]}"
    done
    
    echo -e "\n${GREEN}🟢 선택적 서버 (필요시 비활성화):${NC}"
    for server in "${!OPTIONAL_SERVERS[@]}"; do
        local status="❌ 비활성"
        if echo "$active_servers" | grep -q "^$server$"; then
            status="✅ 활성"
        fi
        echo "  $server: $status - ${OPTIONAL_SERVERS[$server]}"
    done
}

# 리소스 기반 서버 관리
manage_servers_by_resources() {
    local system_status=($(get_system_status))
    local cpu_usage=${system_status[0]}
    local memory_usage=${system_status[1]}
    
    echo -e "${BLUE}📈 현재 시스템 상태:${NC}"
    echo "  CPU: ${cpu_usage}%"
    echo "  메모리: ${memory_usage}%"
    echo ""
    
    local action_needed=false
    
    # 위험 상황: 선택적 서버 비활성화
    if [[ $memory_usage -gt $MEMORY_CRITICAL_THRESHOLD ]] || [[ $cpu_usage -gt $CPU_CRITICAL_THRESHOLD ]]; then
        echo -e "${RED}🚨 위험 상황 감지! 선택적 서버 비활성화${NC}"
        log_message "CRITICAL: High resource usage detected - CPU: ${cpu_usage}%, Memory: ${memory_usage}%"
        
        for server in "${!OPTIONAL_SERVERS[@]}"; do
            if claude mcp list 2>/dev/null | grep -q "^$server:.*✓"; then
                echo -e "${YELLOW}  ⏸️  $server 비활성화 중...${NC}"
                claude mcp remove "$server" 2>/dev/null || true
                log_message "INFO: Disabled optional server: $server"
                action_needed=true
            fi
        done
        
    # 경고 상황: Playwright만 비활성화
    elif [[ $memory_usage -gt $MEMORY_WARNING_THRESHOLD ]] || [[ $cpu_usage -gt $CPU_WARNING_THRESHOLD ]]; then
        echo -e "${YELLOW}⚠️  경고 상황: Playwright 서버 확인${NC}"
        log_message "WARNING: Medium resource usage detected - CPU: ${cpu_usage}%, Memory: ${memory_usage}%"
        
        if claude mcp list 2>/dev/null | grep -q "^playwright:.*✓"; then
            echo -e "${YELLOW}  ⏸️  Playwright 비활성화 (고리소스 사용)${NC}"
            claude mcp remove "playwright" 2>/dev/null || true
            log_message "INFO: Disabled Playwright due to resource constraints"
            action_needed=true
        fi
        
    # 정상 상황: 모든 서버 활성화 가능
    else
        echo -e "${GREEN}✅ 시스템 상태 양호: 모든 서버 활성화 가능${NC}"
        
        # 비활성화된 중요/중간 서버 재활성화
        for server in "${!IMPORTANT_SERVERS[@]}"; do
            if ! claude mcp list 2>/dev/null | grep -q "^$server:.*✓"; then
                echo -e "${GREEN}  ▶️  $server 활성화 중...${NC}"
                # 서버별 재활성화 명령어 (실제 환경에 맞게 조정)
                case "$server" in
                    "time")
                        claude mcp add time "$UVX_BIN_PATH mcp-server-time" 2>/dev/null || true
                        ;;
                    "sequential-thinking")
                        claude mcp add sequential-thinking "npx -y @modelcontextprotocol/server-sequential-thinking@latest" 2>/dev/null || true
                        ;;
                esac
                log_message "INFO: Re-enabled important server: $server"
                action_needed=true
            fi
        done
    fi
    
    return $action_needed
}

# 수동 서버 관리
manual_server_management() {
    echo -e "${BLUE}🎛️  수동 MCP 서버 관리${NC}"
    echo "=================================="
    
    local active_servers=$(get_active_servers)
    
    echo "현재 활성 서버:"
    echo "$active_servers" | while read -r server; do
        local priority=$(classify_server "$server")
        local color=""
        case "$priority" in
            "critical") color="$RED" ;;
            "important") color="$YELLOW" ;;
            "optional") color="$GREEN" ;;
            *) color="$NC" ;;
        esac
        echo -e "  ${color}● $server ($priority)${NC}"
    done
    
    echo ""
    echo "작업 선택:"
    echo "1. 선택적 서버 모두 비활성화"
    echo "2. Playwright만 비활성화"
    echo "3. 모든 서버 재활성화"
    echo "4. 특정 서버 토글"
    echo "5. 취소"
    
    read -p "선택 (1-5): " -n 1 -r choice
    echo
    
    case "$choice" in
        1)
            echo -e "${YELLOW}선택적 서버 비활성화 중...${NC}"
            for server in "${!OPTIONAL_SERVERS[@]}"; do
                claude mcp remove "$server" 2>/dev/null || true
                echo "  ⏸️  $server 비활성화됨"
            done
            ;;
        2)
            echo -e "${YELLOW}Playwright 비활성화 중...${NC}"
            claude mcp remove "playwright" 2>/dev/null || true
            echo "  ⏸️  Playwright 비활성화됨"
            ;;
        3)
            echo -e "${GREEN}모든 서버 재활성화 중...${NC}"
            # 실제 재활성화 명령어는 환경에 맞게 조정 필요
            echo "  수동으로 claude mcp add 명령을 사용하세요"
            ;;
        4)
            read -p "토글할 서버 이름: " server_name
            if claude mcp list 2>/dev/null | grep -q "^$server_name:.*✓"; then
                claude mcp remove "$server_name" 2>/dev/null || true
                echo "  ⏸️  $server_name 비활성화됨"
            else
                echo "  서버 재활성화는 수동으로 진행하세요"
            fi
            ;;
        5)
            echo "취소됨"
            ;;
    esac
}

# 자동 모니터링 및 조정
auto_monitor() {
    echo -e "${BLUE}🤖 자동 모니터링 모드 시작${NC}"
    echo "=================================="
    
    while true; do
        echo -e "\n${BLUE}[$(date '+%H:%M:%S')] 시스템 상태 확인 중...${NC}"
        
        if manage_servers_by_resources; then
            echo -e "${GREEN}✅ 조정 완료${NC}"
        else
            echo -e "${GREEN}✅ 조정 불필요${NC}"
        fi
        
        echo -e "${BLUE}다음 확인까지 120초 대기... (Ctrl+C로 종료)${NC}"
        sleep 120
    done
}

# 도움말
show_help() {
    echo "MCP 서버 우선순위 관리 도구"
    echo ""
    echo "사용법:"
    echo "  $0 [명령]"
    echo ""
    echo "명령:"
    echo "  status      현재 서버 상태 표시"
    echo "  auto        리소스 기반 자동 관리"
    echo "  manual      수동 서버 관리"
    echo "  monitor     자동 모니터링 모드"
    echo "  help        도움말 표시"
    echo ""
    echo "예시:"
    echo "  $0 status               # 현재 상태 확인"
    echo "  $0 auto                 # 자동 리소스 관리"
    echo "  $0 monitor              # 연속 모니터링"
}

# 메인 실행 로직
case "${1:-status}" in
    status)
        show_server_status
        ;;
    auto)
        manage_servers_by_resources
        ;;
    manual)
        manual_server_management
        ;;
    monitor)
        auto_monitor
        ;;
    help)
        show_help
        ;;
    *)
        echo "알 수 없는 명령: $1"
        show_help
        exit 1
        ;;
esac
