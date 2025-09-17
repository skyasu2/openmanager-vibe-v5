#!/bin/bash
# 프로세스 분석 모듈
# MCP 관련 프로세스 특별 추적

# 프로세스 정보 저장 배열 (메인 스크립트에서 선언됨)

# 프로세스 분석 메인 함수
analyze_processes() {
    local iteration=${1:-1}
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    local log_file="$LOG_DIR/process/analysis-$(date '+%Y%m%d').log"
    
    log_debug "프로세스 분석 시작 (반복 #$iteration)"
    
    # 전체 프로세스 정보 수집
    collect_all_processes
    
    # 상위 프로세스 분석
    analyze_top_processes
    
    # MCP 관련 프로세스 특별 분석
    analyze_mcp_processes
    
    # Claude 관련 프로세스 분석
    analyze_claude_processes
    
    # Node.js 프로세스 힙 메모리 분석
    analyze_nodejs_processes
    
    # Python 프로세스 분석
    analyze_python_processes
    
    # 좀비 프로세스 체크
    check_zombie_processes
    
    # 결과를 JSON 로그로 저장
    save_process_analysis_to_log "$timestamp" "$log_file" "$iteration"
    
    log_debug "프로세스 분석 완료"
}

# 전체 프로세스 정보 수집
collect_all_processes() {
    # ps 명령으로 상세 프로세스 정보 수집
    local ps_output
    if ps_output=$(ps aux --sort=-%cpu | head -n 50); then
        PROCESS_INFO[total_processes]=$(ps aux | wc -l)
        PROCESS_INFO[running_processes]=$(ps aux | awk '$8 ~ /^R/ {count++} END {print count+0}')
        PROCESS_INFO[sleeping_processes]=$(ps aux | awk '$8 ~ /^S/ {count++} END {print count+0}')
        PROCESS_INFO[zombie_processes]=$(ps aux | awk '$8 ~ /^Z/ {count++} END {print count+0}')
        
        log_debug "전체 프로세스: ${PROCESS_INFO[total_processes]}, 실행중: ${PROCESS_INFO[running_processes]}"
    else
        log_warning "프로세스 정보 수집 실패"
    fi
}

# 상위 프로세스 분석 (CPU/메모리 사용량 기준)
analyze_top_processes() {
    log_debug "상위 프로세스 분석 중"
    
    # CPU 사용률 상위 10개
    local top_cpu
    if top_cpu=$(ps aux --sort=-%cpu | head -n 11 | tail -n 10); then
        TOP_PROCESSES=()
        while IFS= read -r line; do
            local fields=($line)
            local user=${fields[0]}
            local pid=${fields[1]}
            local cpu=${fields[2]}
            local mem=${fields[3]}
            local command="${fields[@]:10}"
            
            # 높은 CPU 사용률 프로세스 기록
            if (( $(echo "$cpu > 5.0" | bc -l 2>/dev/null || echo 0) )); then
                TOP_PROCESSES+=("$pid:$cpu:$mem:$command")
                log_debug "높은 CPU 사용 프로세스: PID=$pid, CPU=$cpu%, 명령어=$command"
            fi
        done <<< "$top_cpu"
    fi
    
    # 메모리 사용률 상위 체크
    local high_memory_processes
    if high_memory_processes=$(ps aux --sort=-%mem | head -n 11 | tail -n 10 | awk '$4 > 5.0 {print $2":"$4":"$11}'); then
        PROCESS_INFO[high_memory_count]=$(echo "$high_memory_processes" | wc -l)
    else
        PROCESS_INFO[high_memory_count]=0
    fi
}

# MCP 관련 프로세스 특별 분석
analyze_mcp_processes() {
    log_debug "MCP 프로세스 분석 중"
    
    MCP_PROCESSES=()
    local total_mcp_memory=0
    local total_mcp_cpu=0
    
    # MCP 관련 패턴들
    local mcp_patterns=(
        "mcp-server"
        "claude"
        "context7-mcp"
        "playwright-mcp"
        "serena-mcp"
        "supabase.*mcp"
        "sequential-thinking"
    )
    
    for pattern in "${mcp_patterns[@]}"; do
        local mcp_procs
        if mcp_procs=$(ps aux | grep -E "$pattern" | grep -v grep); then
            while IFS= read -r line; do
                if [[ -n "$line" ]]; then
                    local fields=($line)
                    local pid=${fields[1]}
                    local cpu=${fields[2]}
                    local mem=${fields[3]}
                    local rss=${fields[5]}  # KB 단위
                    local command="${fields[@]:10}"
                    
                    # 메모리를 MB로 변환
                    local mem_mb=$((rss / 1024))
                    
                    MCP_PROCESSES+=("$pattern:$pid:$cpu:$mem:$mem_mb:$command")
                    
                    # 총합 계산
                    total_mcp_memory=$((total_mcp_memory + mem_mb))
                    total_mcp_cpu=$(echo "$total_mcp_cpu + $cpu" | bc -l 2>/dev/null || echo "$total_mcp_cpu")
                    
                    log_debug "MCP 프로세스: $pattern PID=$pid CPU=$cpu% MEM=${mem_mb}MB"
                fi
            done <<< "$mcp_procs"
        fi
    done
    
    PROCESS_INFO[mcp_total_memory_mb]=$total_mcp_memory
    PROCESS_INFO[mcp_total_cpu]=${total_mcp_cpu%.*}  # 정수 부분만
    PROCESS_INFO[mcp_process_count]=${#MCP_PROCESSES[@]}
    
    log_debug "MCP 프로세스 총 ${#MCP_PROCESSES[@]}개, 메모리: ${total_mcp_memory}MB, CPU: ${total_mcp_cpu}%"
}

# Claude 관련 프로세스 분석
analyze_claude_processes() {
    local claude_procs
    if claude_procs=$(ps aux | grep -E "claude" | grep -v grep); then
        while IFS= read -r line; do
            if [[ -n "$line" ]]; then
                local fields=($line)
                local pid=${fields[1]}
                local cpu=${fields[2]}
                local mem=${fields[3]}
                local rss=${fields[5]}
                local mem_mb=$((rss / 1024))
                
                PROCESS_INFO[claude_pid]=$pid
                PROCESS_INFO[claude_cpu]=$cpu
                PROCESS_INFO[claude_memory_mb]=$mem_mb
                
                # Claude 프로세스가 높은 리소스를 사용하는지 체크
                if (( $(echo "$cpu > 10.0" | bc -l 2>/dev/null || echo 0) )); then
                    log_warning "Claude 높은 CPU 사용: $cpu%"
                fi
                
                if [[ $mem_mb -gt 1000 ]]; then
                    log_warning "Claude 높은 메모리 사용: ${mem_mb}MB"
                fi
                
                break  # 첫 번째 Claude 프로세스만 분석
            fi
        done <<< "$claude_procs"
    fi
}

# Node.js 프로세스 힙 메모리 분석
analyze_nodejs_processes() {
    local nodejs_procs
    if nodejs_procs=$(ps aux | grep -E "node|npm|npx" | grep -v grep); then
        local total_nodejs_memory=0
        local nodejs_count=0
        
        while IFS= read -r line; do
            if [[ -n "$line" ]]; then
                local fields=($line)
                local pid=${fields[1]}
                local rss=${fields[5]}
                local mem_mb=$((rss / 1024))
                local command="${fields[@]:10}"
                
                total_nodejs_memory=$((total_nodejs_memory + mem_mb))
                nodejs_count=$((nodejs_count + 1))
                
                # 특히 큰 Node.js 프로세스 체크 (500MB 이상)
                if [[ $mem_mb -gt 500 ]]; then
                    log_warning "대용량 Node.js 프로세스: PID=$pid, 메모리=${mem_mb}MB, 명령어=$command"
                fi
            fi
        done <<< "$nodejs_procs"
        
        PROCESS_INFO[nodejs_total_memory_mb]=$total_nodejs_memory
        PROCESS_INFO[nodejs_process_count]=$nodejs_count
        
        log_debug "Node.js 프로세스: ${nodejs_count}개, 총 메모리: ${total_nodejs_memory}MB"
    fi
}

# Python 프로세스 분석
analyze_python_processes() {
    local python_procs
    if python_procs=$(ps aux | grep -E "python|uvx" | grep -v grep); then
        local total_python_memory=0
        local python_count=0
        
        while IFS= read -r line; do
            if [[ -n "$line" ]]; then
                local fields=($line)
                local rss=${fields[5]}
                local mem_mb=$((rss / 1024))
                
                total_python_memory=$((total_python_memory + mem_mb))
                python_count=$((python_count + 1))
            fi
        done <<< "$python_procs"
        
        PROCESS_INFO[python_total_memory_mb]=$total_python_memory
        PROCESS_INFO[python_process_count]=$python_count
        
        log_debug "Python 프로세스: ${python_count}개, 총 메모리: ${total_python_memory}MB"
    fi
}

# 좀비 프로세스 체크
check_zombie_processes() {
    local zombie_count=${PROCESS_INFO[zombie_processes]:-0}
    
    if [[ $zombie_count -gt 0 ]]; then
        log_warning "좀비 프로세스 발견: ${zombie_count}개"
        
        # 좀비 프로세스 상세 정보
        local zombie_details
        if zombie_details=$(ps aux | awk '$8 ~ /^Z/ {print $2":"$11}'); then
            echo "좀비 프로세스 목록: $zombie_details" >> "$LOG_DIR/process/zombies-$(date '+%Y%m%d').log"
        fi
    fi
}

# 프로세스 분석 결과를 JSON 로그로 저장
save_process_analysis_to_log() {
    local timestamp="$1"
    local log_file="$2"
    local iteration="$3"
    
    # MCP 프로세스 목록을 JSON 배열로 구성
    local mcp_processes_json="["
    local first=true
    for proc in "${MCP_PROCESSES[@]}"; do
        if [[ "$first" == "true" ]]; then
            first=false
        else
            mcp_processes_json+=","
        fi
        
        IFS=':' read -r pattern pid cpu mem mem_mb command <<< "$proc"
        mcp_processes_json+=$(cat << EOF

    {
      "pattern": "$pattern",
      "pid": $pid,
      "cpu_percent": $cpu,
      "memory_percent": $mem,
      "memory_mb": $mem_mb,
      "command": "$command"
    }
EOF
)
    done
    mcp_processes_json+=$(echo -e "\n  ]")
    
    # JSON 로그 구성
    local json_log=$(cat << EOF
{
  "timestamp": "$timestamp",
  "iteration": $iteration,
  "summary": {
    "total_processes": ${PROCESS_INFO[total_processes]:-0},
    "running_processes": ${PROCESS_INFO[running_processes]:-0},
    "sleeping_processes": ${PROCESS_INFO[sleeping_processes]:-0},
    "zombie_processes": ${PROCESS_INFO[zombie_processes]:-0}
  },
  "mcp_analysis": {
    "total_processes": ${PROCESS_INFO[mcp_process_count]:-0},
    "total_memory_mb": ${PROCESS_INFO[mcp_total_memory_mb]:-0},
    "total_cpu_percent": ${PROCESS_INFO[mcp_total_cpu]:-0},
    "processes": $mcp_processes_json
  },
  "claude": {
    "pid": ${PROCESS_INFO[claude_pid]:-0},
    "cpu_percent": ${PROCESS_INFO[claude_cpu]:-0},
    "memory_mb": ${PROCESS_INFO[claude_memory_mb]:-0}
  },
  "nodejs": {
    "process_count": ${PROCESS_INFO[nodejs_process_count]:-0},
    "total_memory_mb": ${PROCESS_INFO[nodejs_total_memory_mb]:-0}
  },
  "python": {
    "process_count": ${PROCESS_INFO[python_process_count]:-0},
    "total_memory_mb": ${PROCESS_INFO[python_total_memory_mb]:-0}
  }
}
EOF
)
    
    # 로그 파일에 추가
    echo "$json_log" >> "$log_file"
}

# 프로세스 분석 요약 출력
get_process_summary() {
    cat << EOF
🔄 프로세스 현황:
  전체: ${PROCESS_INFO[total_processes]:-0}개 (실행중: ${PROCESS_INFO[running_processes]:-0}, 좀비: ${PROCESS_INFO[zombie_processes]:-0})
  MCP: ${PROCESS_INFO[mcp_process_count]:-0}개 (메모리: ${PROCESS_INFO[mcp_total_memory_mb]:-0}MB, CPU: ${PROCESS_INFO[mcp_total_cpu]:-0}%)
  Claude: PID ${PROCESS_INFO[claude_pid]:-N/A} (메모리: ${PROCESS_INFO[claude_memory_mb]:-0}MB, CPU: ${PROCESS_INFO[claude_cpu]:-0}%)
  Node.js: ${PROCESS_INFO[nodejs_process_count]:-0}개 (${PROCESS_INFO[nodejs_total_memory_mb]:-0}MB)
  Python: ${PROCESS_INFO[python_process_count]:-0}개 (${PROCESS_INFO[python_total_memory_mb]:-0}MB)
EOF
}

# 상위 프로세스 목록 출력
get_top_processes_list() {
    echo "🔝 상위 프로세스 (CPU 5% 이상):"
    
    local count=0
    for proc in "${TOP_PROCESSES[@]}"; do
        if [[ $count -ge 5 ]]; then break; fi
        
        IFS=':' read -r pid cpu mem command <<< "$proc"
        printf "  PID %-6s %5s%% %5s%% %s\n" "$pid" "$cpu" "$mem" "$(echo "$command" | cut -c1-40)"
        count=$((count + 1))
    done
    
    if [[ $count -eq 0 ]]; then
        echo "  (CPU 5% 이상 프로세스 없음)"
    fi
}

# MCP 프로세스 상세 목록
get_mcp_processes_detail() {
    if [[ ${#MCP_PROCESSES[@]} -eq 0 ]]; then
        echo "🤖 MCP 프로세스: 없음"
        return
    fi
    
    echo "🤖 MCP 프로세스 상세:"
    echo "  패턴           PID     CPU   메모리  명령어"
    echo "  ────────────   ──────  ────  ──────  ──────────"
    
    for proc in "${MCP_PROCESSES[@]}"; do
        IFS=':' read -r pattern pid cpu mem mem_mb command <<< "$proc"
        printf "  %-12s   %-6s  %4s%%  %5sMB  %s\n" \
            "$(echo "$pattern" | cut -c1-12)" \
            "$pid" \
            "$cpu" \
            "$mem_mb" \
            "$(echo "$command" | cut -c1-30)"
    done
}

# 메모리 누수 감지
detect_memory_leaks() {
    # Claude 프로세스 메모리 사용량 체크
    local claude_memory=${PROCESS_INFO[claude_memory_mb]:-0}
    if [[ $claude_memory -gt 1500 ]]; then
        echo "⚠️  메모리 누수 의심: Claude 프로세스 ${claude_memory}MB"
    fi
    
    # MCP 프로세스들의 총 메모리 체크
    local mcp_total_memory=${PROCESS_INFO[mcp_total_memory_mb]:-0}
    if [[ $mcp_total_memory -gt 500 ]]; then
        echo "⚠️  높은 MCP 메모리 사용: ${mcp_total_memory}MB"
    fi
    
    # 좀비 프로세스 체크
    local zombie_count=${PROCESS_INFO[zombie_processes]:-0}
    if [[ $zombie_count -gt 0 ]]; then
        echo "🧟 좀비 프로세스 정리 필요: ${zombie_count}개"
    fi
}