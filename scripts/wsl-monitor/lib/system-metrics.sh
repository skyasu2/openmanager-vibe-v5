#!/bin/bash
# 시스템 메트릭 수집 모듈
# WSL 환경 최적화됨

# 전역 변수 (메인 스크립트에서 선언됨)

# 시스템 메트릭 수집 함수
collect_system_metrics() {
    local iteration=${1:-1}
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    local log_file="$LOG_DIR/system/metrics-$(date '+%Y%m%d').log"
    
    log_debug "시스템 메트릭 수집 시작 (반복 #$iteration)"
    
    # 메모리 정보 수집
    collect_memory_info
    
    # CPU 정보 수집
    collect_cpu_info
    
    # 디스크 정보 수집
    collect_disk_info
    
    # 네트워크 정보 수집 (기본적인 것만)
    collect_network_info
    
    # 로드 평균 수집
    collect_load_average
    
    # JSON 형태로 로그 저장
    save_metrics_to_log "$timestamp" "$log_file" "$iteration"
    
    log_debug "시스템 메트릭 수집 완료"
}

# 메모리 정보 수집
collect_memory_info() {
    if [[ -f /proc/meminfo ]]; then
        local meminfo
        meminfo=$(cat /proc/meminfo)
        
        # 메모리 정보 파싱
        SYSTEM_METRICS[mem_total]=$(echo "$meminfo" | awk '/MemTotal:/ {print int($2/1024)}')
        SYSTEM_METRICS[mem_free]=$(echo "$meminfo" | awk '/MemFree:/ {print int($2/1024)}')
        SYSTEM_METRICS[mem_available]=$(echo "$meminfo" | awk '/MemAvailable:/ {print int($2/1024)}')
        SYSTEM_METRICS[mem_buffers]=$(echo "$meminfo" | awk '/Buffers:/ {print int($2/1024)}')
        SYSTEM_METRICS[mem_cached]=$(echo "$meminfo" | awk '/^Cached:/ {print int($2/1024)}')
        
        # 스왑 정보
        SYSTEM_METRICS[swap_total]=$(echo "$meminfo" | awk '/SwapTotal:/ {print int($2/1024)}')
        SYSTEM_METRICS[swap_free]=$(echo "$meminfo" | awk '/SwapFree:/ {print int($2/1024)}')
        
        # 계산된 값들
        local mem_used=$((${SYSTEM_METRICS[mem_total]} - ${SYSTEM_METRICS[mem_free]} - ${SYSTEM_METRICS[mem_buffers]} - ${SYSTEM_METRICS[mem_cached]}))
        SYSTEM_METRICS[mem_used]=$mem_used
        
        if [[ ${SYSTEM_METRICS[mem_total]} -gt 0 ]]; then
            SYSTEM_METRICS[mem_usage_percent]=$(( (mem_used * 100) / ${SYSTEM_METRICS[mem_total]} ))
        else
            SYSTEM_METRICS[mem_usage_percent]=0
        fi
        
        local swap_used=$((${SYSTEM_METRICS[swap_total]} - ${SYSTEM_METRICS[swap_free]}))
        SYSTEM_METRICS[swap_used]=$swap_used
        
        if [[ ${SYSTEM_METRICS[swap_total]} -gt 0 ]]; then
            SYSTEM_METRICS[swap_usage_percent]=$(( (swap_used * 100) / ${SYSTEM_METRICS[swap_total]} ))
        else
            SYSTEM_METRICS[swap_usage_percent]=0
        fi
    else
        log_warning "메모리 정보를 읽을 수 없습니다"
    fi
}

# CPU 정보 수집
collect_cpu_info() {
    if [[ -f /proc/stat ]]; then
        local cpu_line
        cpu_line=$(head -n1 /proc/stat)
        
        # CPU 시간 파싱 (user, nice, system, idle, iowait, irq, softirq, steal)
        local cpu_times=($cpu_line)
        local user=${cpu_times[1]}
        local nice=${cpu_times[2]}
        local system=${cpu_times[3]}
        local idle=${cpu_times[4]}
        local iowait=${cpu_times[5]:-0}
        local irq=${cpu_times[6]:-0}
        local softirq=${cpu_times[7]:-0}
        local steal=${cpu_times[8]:-0}
        
        local total=$((user + nice + system + idle + iowait + irq + softirq + steal))
        local work=$((user + nice + system + irq + softirq + steal))
        
        # 이전 값과 비교하여 CPU 사용률 계산
        if [[ -n "${PREV_SYSTEM_METRICS[cpu_total]}" ]]; then
            local prev_total=${PREV_SYSTEM_METRICS[cpu_total]}
            local prev_work=${PREV_SYSTEM_METRICS[cpu_work]}
            
            local total_diff=$((total - prev_total))
            local work_diff=$((work - prev_work))
            
            if [[ $total_diff -gt 0 ]]; then
                SYSTEM_METRICS[cpu_usage_percent]=$(( (work_diff * 100) / total_diff ))
            else
                SYSTEM_METRICS[cpu_usage_percent]=0
            fi
        else
            SYSTEM_METRICS[cpu_usage_percent]=0
        fi
        
        # 다음 계산을 위해 값 저장
        PREV_SYSTEM_METRICS[cpu_total]=$total
        PREV_SYSTEM_METRICS[cpu_work]=$work
        
        # CPU 코어 수
        SYSTEM_METRICS[cpu_cores]=$(nproc)
        
        # 개별 코어 정보 (간단히)
        SYSTEM_METRICS[cpu_model]=$(grep "model name" /proc/cpuinfo | head -n1 | cut -d: -f2 | sed 's/^ *//')
        
    else
        log_warning "CPU 정보를 읽을 수 없습니다"
    fi
}

# 디스크 정보 수집
collect_disk_info() {
    # 루트 파티션 정보
    local disk_info
    if disk_info=$(df -h / 2>/dev/null); then
        local root_line
        root_line=$(echo "$disk_info" | tail -n1)
        
        SYSTEM_METRICS[disk_total]=$(echo "$root_line" | awk '{print $2}')
        SYSTEM_METRICS[disk_used]=$(echo "$root_line" | awk '{print $3}')
        SYSTEM_METRICS[disk_available]=$(echo "$root_line" | awk '{print $4}')
        SYSTEM_METRICS[disk_usage_percent]=$(echo "$root_line" | awk '{print $5}' | sed 's/%//')
    fi
    
    # 디스크 I/O 정보 (간단히)
    if [[ -f /proc/diskstats ]]; then
        local total_reads=0
        local total_writes=0
        
        while read -r line; do
            local fields=($line)
            # 필드 10: 읽기 섹터 수, 필드 14: 쓰기 섹터 수
            if [[ ${#fields[@]} -ge 14 ]]; then
                total_reads=$((total_reads + ${fields[5]}))
                total_writes=$((total_writes + ${fields[9]}))
            fi
        done < /proc/diskstats
        
        SYSTEM_METRICS[disk_reads_total]=$total_reads
        SYSTEM_METRICS[disk_writes_total]=$total_writes
        
        # 변화량 계산
        if [[ -n "${PREV_SYSTEM_METRICS[disk_reads_total]}" ]]; then
            local read_diff=$((total_reads - ${PREV_SYSTEM_METRICS[disk_reads_total]}))
            local write_diff=$((total_writes - ${PREV_SYSTEM_METRICS[disk_writes_total]}))
            
            SYSTEM_METRICS[disk_reads_per_sec]=$((read_diff / MONITOR_INTERVAL))
            SYSTEM_METRICS[disk_writes_per_sec]=$((write_diff / MONITOR_INTERVAL))
        else
            SYSTEM_METRICS[disk_reads_per_sec]=0
            SYSTEM_METRICS[disk_writes_per_sec]=0
        fi
        
        PREV_SYSTEM_METRICS[disk_reads_total]=$total_reads
        PREV_SYSTEM_METRICS[disk_writes_total]=$total_writes
    fi
}

# 네트워크 정보 수집 (기본적인 것만)
collect_network_info() {
    if [[ -f /proc/net/dev ]]; then
        local total_rx_bytes=0
        local total_tx_bytes=0
        
        while read -r line; do
            # 인터페이스 라인 확인 (콜론 포함)
            if [[ $line == *":"* ]] && [[ $line != *"lo:"* ]]; then
                local interface=${line%%:*}
                interface=$(echo "$interface" | tr -d ' ')
                
                local stats=${line#*:}
                local fields=($stats)
                
                if [[ ${#fields[@]} -ge 9 ]]; then
                    total_rx_bytes=$((total_rx_bytes + ${fields[0]}))
                    total_tx_bytes=$((total_tx_bytes + ${fields[8]}))
                fi
            fi
        done < /proc/net/dev
        
        SYSTEM_METRICS[net_rx_bytes_total]=$total_rx_bytes
        SYSTEM_METRICS[net_tx_bytes_total]=$total_tx_bytes
        
        # 초당 전송량 계산
        if [[ -n "${PREV_SYSTEM_METRICS[net_rx_bytes_total]}" ]]; then
            local rx_diff=$((total_rx_bytes - ${PREV_SYSTEM_METRICS[net_rx_bytes_total]}))
            local tx_diff=$((total_tx_bytes - ${PREV_SYSTEM_METRICS[net_tx_bytes_total]}))
            
            SYSTEM_METRICS[net_rx_bytes_per_sec]=$((rx_diff / MONITOR_INTERVAL))
            SYSTEM_METRICS[net_tx_bytes_per_sec]=$((tx_diff / MONITOR_INTERVAL))
        else
            SYSTEM_METRICS[net_rx_bytes_per_sec]=0
            SYSTEM_METRICS[net_tx_bytes_per_sec]=0
        fi
        
        PREV_SYSTEM_METRICS[net_rx_bytes_total]=$total_rx_bytes
        PREV_SYSTEM_METRICS[net_tx_bytes_total]=$total_tx_bytes
    fi
}

# 로드 평균 수집
collect_load_average() {
    if [[ -f /proc/loadavg ]]; then
        local loadavg
        loadavg=$(cat /proc/loadavg)
        local loads=($loadavg)
        
        SYSTEM_METRICS[load_1min]=${loads[0]}
        SYSTEM_METRICS[load_5min]=${loads[1]}
        SYSTEM_METRICS[load_15min]=${loads[2]}
        
        # 실행 중인 프로세스 수 / 전체 프로세스 수
        SYSTEM_METRICS[processes_running]=$(echo "${loads[3]}" | cut -d'/' -f1)
        SYSTEM_METRICS[processes_total]=$(echo "${loads[3]}" | cut -d'/' -f2)
    fi
}

# 메트릭을 JSON 로그로 저장
save_metrics_to_log() {
    local timestamp="$1"
    local log_file="$2"
    local iteration="$3"
    
    # JSON 형태로 구성
    local json_log=$(cat << EOF
{
  "timestamp": "$timestamp",
  "iteration": $iteration,
  "memory": {
    "total_mb": ${SYSTEM_METRICS[mem_total]:-0},
    "used_mb": ${SYSTEM_METRICS[mem_used]:-0},
    "free_mb": ${SYSTEM_METRICS[mem_free]:-0},
    "available_mb": ${SYSTEM_METRICS[mem_available]:-0},
    "buffers_mb": ${SYSTEM_METRICS[mem_buffers]:-0},
    "cached_mb": ${SYSTEM_METRICS[mem_cached]:-0},
    "usage_percent": ${SYSTEM_METRICS[mem_usage_percent]:-0}
  },
  "swap": {
    "total_mb": ${SYSTEM_METRICS[swap_total]:-0},
    "used_mb": ${SYSTEM_METRICS[swap_used]:-0},
    "free_mb": ${SYSTEM_METRICS[swap_free]:-0},
    "usage_percent": ${SYSTEM_METRICS[swap_usage_percent]:-0}
  },
  "cpu": {
    "usage_percent": ${SYSTEM_METRICS[cpu_usage_percent]:-0},
    "cores": ${SYSTEM_METRICS[cpu_cores]:-0},
    "model": "${SYSTEM_METRICS[cpu_model]:-unknown}"
  },
  "disk": {
    "total": "${SYSTEM_METRICS[disk_total]:-0}",
    "used": "${SYSTEM_METRICS[disk_used]:-0}",
    "available": "${SYSTEM_METRICS[disk_available]:-0}",
    "usage_percent": ${SYSTEM_METRICS[disk_usage_percent]:-0},
    "reads_per_sec": ${SYSTEM_METRICS[disk_reads_per_sec]:-0},
    "writes_per_sec": ${SYSTEM_METRICS[disk_writes_per_sec]:-0}
  },
  "network": {
    "rx_bytes_per_sec": ${SYSTEM_METRICS[net_rx_bytes_per_sec]:-0},
    "tx_bytes_per_sec": ${SYSTEM_METRICS[net_tx_bytes_per_sec]:-0}
  },
  "load": {
    "load_1min": ${SYSTEM_METRICS[load_1min]:-0},
    "load_5min": ${SYSTEM_METRICS[load_5min]:-0},
    "load_15min": ${SYSTEM_METRICS[load_15min]:-0},
    "processes_running": ${SYSTEM_METRICS[processes_running]:-0},
    "processes_total": ${SYSTEM_METRICS[processes_total]:-0}
  }
}
EOF
)
    
    # 로그 파일에 추가
    echo "$json_log" >> "$log_file"
    
    # 로그 파일 크기 제한 (100MB 초과 시 rotate)
    if [[ -f "$log_file" ]]; then
        local file_size
        file_size=$(stat -f%z "$log_file" 2>/dev/null || stat -c%s "$log_file" 2>/dev/null || echo 0)
        local max_size=$((100 * 1024 * 1024)) # 100MB
        
        if [[ $file_size -gt $max_size ]]; then
            local backup_file="${log_file}.$(date '+%H%M%S')"
            mv "$log_file" "$backup_file"
            log_info "로그 파일 로테이션: $(basename "$backup_file")"
        fi
    fi
}

# 시스템 메트릭 요약 출력
get_system_summary() {
    cat << EOF
📊 시스템 리소스:
  메모리: ${SYSTEM_METRICS[mem_used]:-0}/${SYSTEM_METRICS[mem_total]:-0} MB (${SYSTEM_METRICS[mem_usage_percent]:-0}%)
  CPU:    ${SYSTEM_METRICS[cpu_usage_percent]:-0}% (${SYSTEM_METRICS[cpu_cores]:-0} 코어)
  디스크:  ${SYSTEM_METRICS[disk_used]:-0}/${SYSTEM_METRICS[disk_total]:-0} (${SYSTEM_METRICS[disk_usage_percent]:-0}%)
  로드:   ${SYSTEM_METRICS[load_1min]:-0} ${SYSTEM_METRICS[load_5min]:-0} ${SYSTEM_METRICS[load_15min]:-0}
EOF
}

# 메모리 사용률 바 그래프
get_memory_bar() {
    local percent=${SYSTEM_METRICS[mem_usage_percent]:-0}
    local bar_length=20
    local filled=$((percent * bar_length / 100))
    local empty=$((bar_length - filled))
    
    printf "["
    printf "%*s" $filled | tr ' ' '█'
    printf "%*s" $empty | tr ' ' '░'
    printf "]"
}

# CPU 사용률 바 그래프
get_cpu_bar() {
    local percent=${SYSTEM_METRICS[cpu_usage_percent]:-0}
    local bar_length=20
    local filled=$((percent * bar_length / 100))
    local empty=$((bar_length - filled))
    
    printf "["
    printf "%*s" $filled | tr ' ' '█'
    printf "%*s" $empty | tr ' ' '░'
    printf "]"
}