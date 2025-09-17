#!/bin/bash
# 터미널 대시보드 UI 모듈
# 실시간 모니터링 정보 표시

# 대시보드 출력 함수
show_dashboard() {
    local iteration=${1:-1}
    local current_time=$(date '+%Y-%m-%d %H:%M:%S')
    
    # 터미널 크기 확인
    local term_width=${COLUMNS:-$(tput cols 2>/dev/null || echo 80)}
    local term_height=${LINES:-$(tput lines 2>/dev/null || echo 24)}
    
    # 헤더 출력
    print_dashboard_header "$current_time" "$iteration" "$term_width"
    
    # 시스템 리소스 섹션
    print_system_resources_section
    
    # 프로세스 섹션
    print_processes_section
    
    # MCP 서버 섹션  
    print_mcp_servers_section
    
    # 알림 섹션
    print_alerts_section
    
    # 푸터
    print_dashboard_footer "$term_width"
}

# 대시보드 헤더
print_dashboard_header() {
    local current_time="$1"
    local iteration="$2"
    local width="$3"
    
    local title="🖥️ WSL System Monitor - OpenManager VIBE"
    local subtitle="$current_time | 반복: #$iteration | 간격: ${MONITOR_INTERVAL}초"
    
    # 상단 경계선
    printf "${CYAN}"
    printf "%*s\n" "$width" | tr ' ' '━'
    printf "${NC}"
    
    # 제목 (중앙 정렬)
    local title_padding=$(( (width - ${#title}) / 2 ))
    printf "${WHITE}%*s%s${NC}\n" "$title_padding" "" "$title"
    
    # 부제목 (중앙 정렬)
    local subtitle_padding=$(( (width - ${#subtitle}) / 2 ))
    printf "${BLUE}%*s%s${NC}\n" "$subtitle_padding" "" "$subtitle"
    
    # 구분선
    printf "${CYAN}"
    printf "%*s\n" "$width" | tr ' ' '─'
    printf "${NC}"
}

# 시스템 리소스 섹션
print_system_resources_section() {
    echo -e "${WHITE}📊 시스템 리소스:${NC}"
    
    # 메모리 정보
    local mem_used=${SYSTEM_METRICS[mem_used]:-0}
    local mem_total=${SYSTEM_METRICS[mem_total]:-0}
    local mem_percent=${SYSTEM_METRICS[mem_usage_percent]:-0}
    
    printf "  ${YELLOW}메모리:${NC} %d/%d MB (${mem_percent}%%) " "$mem_used" "$mem_total"
    print_progress_bar "$mem_percent" 20
    echo
    
    # CPU 정보
    local cpu_percent=${SYSTEM_METRICS[cpu_usage_percent]:-0}
    local cpu_cores=${SYSTEM_METRICS[cpu_cores]:-0}
    
    printf "  ${YELLOW}CPU:${NC}    %d%% (%d 코어) " "$cpu_percent" "$cpu_cores"
    print_progress_bar "$cpu_percent" 20
    echo
    
    # 디스크 정보
    local disk_used=${SYSTEM_METRICS[disk_used]:-"0G"}
    local disk_total=${SYSTEM_METRICS[disk_total]:-"0G"}
    local disk_percent=${SYSTEM_METRICS[disk_usage_percent]:-0}
    
    printf "  ${YELLOW}디스크:${NC}  %s/%s (%d%%) " "$disk_used" "$disk_total" "$disk_percent"
    print_progress_bar "$disk_percent" 20
    echo
    
    # 스왑 정보 (사용 중일 때만 표시)
    local swap_used=${SYSTEM_METRICS[swap_used]:-0}
    local swap_total=${SYSTEM_METRICS[swap_total]:-0}
    if [[ $swap_used -gt 0 ]] || [[ $swap_total -gt 0 ]]; then
        local swap_percent=${SYSTEM_METRICS[swap_usage_percent]:-0}
        printf "  ${YELLOW}스왑:${NC}   %d/%d MB (%d%%) " "$swap_used" "$swap_total" "$swap_percent"
        print_progress_bar "$swap_percent" 20
        echo
    fi
    
    # 로드 평균
    local load_1=${SYSTEM_METRICS[load_1min]:-0}
    local load_5=${SYSTEM_METRICS[load_5min]:-0}
    local load_15=${SYSTEM_METRICS[load_15min]:-0}
    printf "  ${YELLOW}로드:${NC}   %s %s %s (1분, 5분, 15분)\n" "$load_1" "$load_5" "$load_15"
    
    echo
}

# 프로세스 섹션
print_processes_section() {
    echo -e "${WHITE}🔄 프로세스 현황:${NC}"
    
    # 기본 프로세스 통계
    local total_proc=${PROCESS_INFO[total_processes]:-0}
    local running_proc=${PROCESS_INFO[running_processes]:-0}
    local zombie_proc=${PROCESS_INFO[zombie_processes]:-0}
    
    printf "  전체: %d개 | 실행중: %d개" "$total_proc" "$running_proc"
    if [[ $zombie_proc -gt 0 ]]; then
        printf " | ${RED}좀비: %d개${NC}" "$zombie_proc"
    fi
    echo
    
    # Claude 프로세스 정보
    local claude_pid=${PROCESS_INFO[claude_pid]:-"N/A"}
    local claude_mem=${PROCESS_INFO[claude_memory_mb]:-0}
    local claude_cpu=${PROCESS_INFO[claude_cpu]:-0}
    
    printf "  ${PURPLE}Claude:${NC} PID %s | %dMB | %s%%CPU\n" "$claude_pid" "$claude_mem" "$claude_cpu"
    
    # MCP 프로세스 요약
    local mcp_count=${PROCESS_INFO[mcp_process_count]:-0}
    local mcp_mem=${PROCESS_INFO[mcp_total_memory_mb]:-0}
    local mcp_cpu=${PROCESS_INFO[mcp_total_cpu]:-0}
    
    printf "  ${BLUE}MCP:${NC}    %d개 프로세스 | %dMB | %s%%CPU\n" "$mcp_count" "$mcp_mem" "$mcp_cpu"
    
    # 상위 프로세스 (간단히)
    if [[ ${#TOP_PROCESSES[@]} -gt 0 ]]; then
        echo -e "  ${YELLOW}상위 프로세스:${NC}"
        local count=0
        for proc in "${TOP_PROCESSES[@]}"; do
            if [[ $count -ge 3 ]]; then break; fi
            
            IFS=':' read -r pid cpu mem command <<< "$proc"
            local short_command=$(echo "$command" | cut -c1-25)
            printf "    PID %-6s %4s%% CPU | %s\n" "$pid" "$cpu" "$short_command"
            count=$((count + 1))
        done
    fi
    
    echo
}

# MCP 서버 섹션
print_mcp_servers_section() {
    echo -e "${WHITE}🌐 MCP 서버 상태:${NC}"
    
    # 연결 요약
    local connected_count=0
    local total_count=0
    
    for server in "${MCP_SERVER_LIST[@]}"; do
        total_count=$((total_count + 1))
        if [[ "${MCP_STATUS[$server]}" == "Connected" ]]; then
            connected_count=$((connected_count + 1))
        fi
    done
    
    printf "  연결: %d/%d 서버" "$connected_count" "$total_count"
    if [[ $connected_count -eq $total_count ]]; then
        echo -e " ${GREEN}✅ 모든 서버 정상${NC}"
    else
        echo -e " ${YELLOW}⚠️ 일부 서버 문제${NC}"
    fi
    
    # 각 서버 상태 (2열로 표시)
    local col1_servers=()
    local col2_servers=()
    local server_index=0
    
    for server in "${MCP_SERVER_LIST[@]}"; do
        if [[ $((server_index % 2)) -eq 0 ]]; then
            col1_servers+=("$server")
        else
            col2_servers+=("$server")
        fi
        server_index=$((server_index + 1))
    done
    
    # 최대 행 수 계산
    local max_rows=${#col1_servers[@]}
    if [[ ${#col2_servers[@]} -gt $max_rows ]]; then
        max_rows=${#col2_servers[@]}
    fi
    
    for ((i=0; i<max_rows; i++)); do
        # 첫 번째 열
        if [[ $i -lt ${#col1_servers[@]} ]]; then
            local server1="${col1_servers[$i]}"
            print_server_status "$server1" 25
        else
            printf "%25s" ""
        fi
        
        # 두 번째 열
        if [[ $i -lt ${#col2_servers[@]} ]]; then
            local server2="${col2_servers[$i]}"
            print_server_status "$server2" 25
        fi
        echo
    done
    
    echo
}

# 개별 서버 상태 출력
print_server_status() {
    local server="$1"
    local width="$2"
    local status="${MCP_STATUS[$server]:-Unknown}"
    local response_time="${MCP_RESPONSE_TIMES[$server]:-0}"
    
    if [[ "$status" == "Connected" ]]; then
        local icon color
        if [[ $response_time -gt 200 ]]; then
            icon="🐌"; color="$YELLOW"  # 느림
        elif [[ $response_time -gt 100 ]]; then
            icon="⚠️"; color="$YELLOW"   # 주의
        else
            icon="✅"; color="$GREEN"   # 정상
        fi
        
        printf "  ${color}%s %-12s %4dms${NC}" "$icon" "$server" "$response_time"
    else
        printf "  ${RED}❌ %-12s %s${NC}" "$server" "$status"
    fi
    
    # 나머지 공간 채우기
    local current_length=$((3 + 12 + 6))  # 아이콘 + 서버명 + 시간
    local remaining=$((width - current_length))
    if [[ $remaining -gt 0 ]]; then
        printf "%*s" "$remaining" ""
    fi
}

# 알림 섹션
print_alerts_section() {
    local alerts=()
    
    # 메모리 사용률 체크
    local mem_percent=${SYSTEM_METRICS[mem_usage_percent]:-0}
    if [[ $mem_percent -gt 85 ]]; then
        alerts+=("${RED}🔥 높은 메모리 사용률: ${mem_percent}%${NC}")
    elif [[ $mem_percent -gt 70 ]]; then
        alerts+=("${YELLOW}⚠️ 메모리 사용률 주의: ${mem_percent}%${NC}")
    fi
    
    # CPU 사용률 체크
    local cpu_percent=${SYSTEM_METRICS[cpu_usage_percent]:-0}
    if [[ $cpu_percent -gt 80 ]]; then
        alerts+=("${RED}🔥 높은 CPU 사용률: ${cpu_percent}%${NC}")
    fi
    
    # 좀비 프로세스 체크
    local zombie_count=${PROCESS_INFO[zombie_processes]:-0}
    if [[ $zombie_count -gt 0 ]]; then
        alerts+=("${YELLOW}🧟 좀비 프로세스: ${zombie_count}개${NC}")
    fi
    
    # Serena MCP 문제 체크
    local serena_response_time=${MCP_RESPONSE_TIMES[serena]:-0}
    local serena_fail_count=${MCP_FAIL_COUNT[serena]:-0}
    if [[ $serena_response_time -gt 200 ]] || [[ $serena_fail_count -gt 2 ]]; then
        alerts+=("${YELLOW}🔧 Serena MCP 문제: ${serena_response_time}ms, 실패 ${serena_fail_count}회${NC}")
    fi
    
    # 연결되지 않은 MCP 서버 체크
    local disconnected_servers=()
    for server in "${MCP_SERVER_LIST[@]}"; do
        if [[ "${MCP_STATUS[$server]}" != "Connected" ]]; then
            disconnected_servers+=("$server")
        fi
    done
    
    if [[ ${#disconnected_servers[@]} -gt 0 ]]; then
        alerts+=("${RED}🔌 연결 실패 MCP 서버: ${disconnected_servers[*]}${NC}")
    fi
    
    # 알림 출력
    if [[ ${#alerts[@]} -gt 0 ]]; then
        echo -e "${WHITE}⚠️ 알림:${NC}"
        for alert in "${alerts[@]}"; do
            echo -e "  $alert"
        done
    else
        echo -e "${GREEN}✅ 시스템 정상 - 알림 없음${NC}"
    fi
    
    echo
}

# 대시보드 푸터
print_dashboard_footer() {
    local width="$1"
    
    # 하단 구분선
    printf "${CYAN}"
    printf "%*s\n" "$width" | tr ' ' '─'
    printf "${NC}"
    
    # 도움말 및 상태 정보
    local help_text="Ctrl+C: 종료 | 로그: $LOG_DIR | 다음 업데이트: ${MONITOR_INTERVAL}초 후"
    printf "${BLUE}%s${NC}\n" "$help_text"
    
    # 하단 경계선
    printf "${CYAN}"
    printf "%*s\n" "$width" | tr ' ' '━'
    printf "${NC}"
}

# 진행률 바 출력
print_progress_bar() {
    local percent="$1"
    local length="$2"
    local filled=$((percent * length / 100))
    local empty=$((length - filled))
    
    # 색상 선택
    local bar_color
    if [[ $percent -gt 85 ]]; then
        bar_color="$RED"
    elif [[ $percent -gt 70 ]]; then
        bar_color="$YELLOW"
    else
        bar_color="$GREEN"
    fi
    
    printf "${bar_color}["
    printf "%*s" $filled | tr ' ' '█'
    printf "${BLUE}%*s" $empty | tr ' ' '░'
    printf "${bar_color}]${NC}"
}

# 간단한 대시보드 (터미널 크기가 작을 때)
show_compact_dashboard() {
    local iteration=${1:-1}
    local current_time=$(date '+%H:%M:%S')
    
    echo -e "${WHITE}🖥️ WSL Monitor ${current_time} (#$iteration)${NC}"
    echo "────────────────────────────────────────"
    
    # 시스템 한 줄 요약
    local mem_percent=${SYSTEM_METRICS[mem_usage_percent]:-0}
    local cpu_percent=${SYSTEM_METRICS[cpu_usage_percent]:-0}
    local connected_mcp=0
    
    for server in "${MCP_SERVER_LIST[@]}"; do
        if [[ "${MCP_STATUS[$server]}" == "Connected" ]]; then
            connected_mcp=$((connected_mcp + 1))
        fi
    done
    
    printf "${YELLOW}MEM:${NC} %d%% ${YELLOW}CPU:${NC} %d%% ${YELLOW}MCP:${NC} %d/9\n" \
        "$mem_percent" "$cpu_percent" "$connected_mcp"
    
    # Serena 상태만 별도 표시
    local serena_status="${MCP_STATUS[serena]:-Unknown}"
    local serena_time="${MCP_RESPONSE_TIMES[serena]:-0}"
    
    if [[ "$serena_status" == "Connected" ]]; then
        if [[ $serena_time -gt 200 ]]; then
            echo -e "${YELLOW}Serena: 연결됨 (${serena_time}ms - 느림)${NC}"
        else
            echo -e "${GREEN}Serena: 연결됨 (${serena_time}ms)${NC}"
        fi
    else
        echo -e "${RED}Serena: $serena_status${NC}"
    fi
    
    echo "────────────────────────────────────────"
}

# 터미널 크기에 따른 대시보드 선택
adaptive_dashboard() {
    local iteration=${1:-1}
    local term_width=${COLUMNS:-$(tput cols 2>/dev/null || echo 80)}
    local term_height=${LINES:-$(tput lines 2>/dev/null || echo 24)}
    
    if [[ $term_width -lt 60 ]] || [[ $term_height -lt 20 ]]; then
        show_compact_dashboard "$iteration"
    else
        show_dashboard "$iteration"
    fi
}