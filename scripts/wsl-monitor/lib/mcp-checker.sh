#!/bin/bash
# MCP 서버 상태 체크 모듈
# Serena MCP 특별 디버깅 포함

# MCP 서버 상태 저장 배열 (메인 스크립트에서 선언됨)

# MCP 서버 목록 (예상되는 서버들)
MCP_SERVER_LIST=(
    "memory"
    "time" 
    "sequential-thinking"
    "playwright"
    "shadcn-ui"
    "serena"
    "supabase"
    "vercel"
    "context7"
)

# MCP 서버 상태 체크 메인 함수
check_mcp_servers() {
    local iteration=${1:-1}
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    local log_file="$LOG_DIR/mcp/status-$(date '+%Y%m%d').log"
    
    log_debug "MCP 서버 상태 체크 시작 (반복 #$iteration)"
    
    # Claude MCP 명령어로 서버 목록 가져오기
    get_mcp_server_list
    
    # 각 서버별 상태 체크
    for server in "${MCP_SERVER_LIST[@]}"; do
        check_individual_server "$server"
    done
    
    # Serena MCP 특별 디버깅
    if [[ "${MCP_STATUS[serena]}" == "Connected" ]]; then
        debug_serena_mcp
    fi
    
    # 결과를 JSON 로그로 저장
    save_mcp_status_to_log "$timestamp" "$log_file" "$iteration"
    
    log_debug "MCP 서버 상태 체크 완료"
}

# Claude MCP 명령어로 실제 서버 목록 가져오기
get_mcp_server_list() {
    local start_time=$(date +%s%N)
    
    if command -v claude >/dev/null 2>&1; then
        local mcp_output
        if mcp_output=$(timeout 10 claude mcp list 2>/dev/null); then
            log_debug "Claude MCP 명령어 실행 성공"
            
            # 출력에서 서버명과 상태 파싱
            while IFS= read -r line; do
                # "server_name: command - ✓ Connected" 형식 파싱
                if [[ $line =~ ^([^:]+):[[:space:]]*.*[[:space:]]-[[:space:]]*([✓✗])[[:space:]]*([[:alpha:]]+) ]]; then
                    local server_name="${BASH_REMATCH[1]}"
                    local status_icon="${BASH_REMATCH[2]}"
                    local status_text="${BASH_REMATCH[3]}"
                    
                    MCP_SERVERS["$server_name"]="$line"
                    
                    if [[ "$status_icon" == "✓" ]] && [[ "$status_text" == "Connected" ]]; then
                        MCP_STATUS["$server_name"]="Connected"
                    else
                        MCP_STATUS["$server_name"]="Disconnected"
                    fi
                fi
            done <<< "$mcp_output"
        else
            log_warning "Claude MCP 명령어 실행 실패 또는 타임아웃"
            # 기본값으로 모든 서버를 Disconnected로 설정
            for server in "${MCP_SERVER_LIST[@]}"; do
                MCP_STATUS["$server"]="Disconnected"
            done
        fi
    else
        log_error "Claude 명령어를 찾을 수 없습니다"
        for server in "${MCP_SERVER_LIST[@]}"; do
            MCP_STATUS["$server"]="Unknown"
        done
    fi
    
    local end_time=$(date +%s%N)
    local duration=$(( (end_time - start_time) / 1000000 )) # 밀리초
    MCP_RESPONSE_TIMES["claude_mcp_list"]=$duration
}

# 개별 서버 상태 체크 (응답 시간 측정)
check_individual_server() {
    local server_name="$1"
    local start_time=$(date +%s%N)
    
    # 서버별 특별 체크 방법
    case "$server_name" in
        "serena")
            check_serena_detailed
            ;;
        "memory")
            check_memory_server
            ;;
        "time")
            check_time_server
            ;;
        "supabase")
            check_supabase_server
            ;;
        "vercel")
            check_vercel_server
            ;;
        *)
            # 기본 체크 (프로세스 확인)
            check_server_process "$server_name"
            ;;
    esac
    
    local end_time=$(date +%s%N)
    local duration=$(( (end_time - start_time) / 1000000 )) # 밀리초
    MCP_RESPONSE_TIMES["$server_name"]=$duration
    
    # 실패 카운트 관리
    if [[ "${MCP_STATUS[$server_name]}" != "Connected" ]]; then
        MCP_FAIL_COUNT["$server_name"]=$((${MCP_FAIL_COUNT[$server_name]:-0} + 1))
    else
        MCP_FAIL_COUNT["$server_name"]=0
    fi
}

# Serena MCP 상세 체크
check_serena_detailed() {
    log_debug "Serena MCP 상세 체크 시작"
    
    # 프로세스 확인
    local serena_pid
    if serena_pid=$(pgrep -f "serena-mcp-server"); then
        log_debug "Serena 프로세스 발견: PID $serena_pid"
        
        # 메모리 사용량 체크
        local mem_usage
        if mem_usage=$(ps -p "$serena_pid" -o rss= 2>/dev/null); then
            mem_usage=$((mem_usage / 1024)) # MB로 변환
            MCP_RESPONSE_TIMES["serena_memory_mb"]=$mem_usage
            
            if [[ $mem_usage -gt 500 ]]; then
                log_warning "Serena MCP 높은 메모리 사용량: ${mem_usage}MB"
            fi
        fi
        
        # CPU 사용량 체크
        local cpu_usage
        if cpu_usage=$(ps -p "$serena_pid" -o %cpu= 2>/dev/null); then
            MCP_RESPONSE_TIMES["serena_cpu_percent"]=${cpu_usage%.*}
        fi
        
    else
        log_warning "Serena MCP 프로세스를 찾을 수 없습니다"
    fi
}

# Memory 서버 체크
check_memory_server() {
    if pgrep -f "mcp-server-memory" >/dev/null; then
        log_debug "Memory MCP 서버 프로세스 확인됨"
    else
        log_debug "Memory MCP 서버 프로세스 없음"
        if [[ "${MCP_STATUS[memory]}" == "Connected" ]]; then
            log_warning "Memory 서버 상태 불일치: Connected이지만 프로세스 없음"
        fi
    fi
}

# Time 서버 체크
check_time_server() {
    if pgrep -f "mcp-server-time" >/dev/null; then
        log_debug "Time MCP 서버 프로세스 확인됨"
    else
        log_debug "Time MCP 서버 프로세스 없음"
        if [[ "${MCP_STATUS[time]}" == "Connected" ]]; then
            log_warning "Time 서버 상태 불일치: Connected이지만 프로세스 없음"
        fi
    fi
}

# Supabase 서버 체크
check_supabase_server() {
    if pgrep -f "supabase.*mcp" >/dev/null; then
        log_debug "Supabase MCP 서버 프로세스 확인됨"
    else
        log_debug "Supabase MCP 서버 프로세스 없음"
    fi
}

# Vercel 서버 체크 (HTTP 연결이므로 프로세스 없음)
check_vercel_server() {
    log_debug "Vercel MCP는 HTTP 연결 (프로세스 체크 건너뜀)"
    # HTTP 연결이므로 별도 체크 방법 필요 시 구현
}

# 기본 서버 프로세스 체크
check_server_process() {
    local server_name="$1"
    
    if pgrep -f "$server_name" >/dev/null; then
        log_debug "$server_name MCP 서버 프로세스 확인됨"
    else
        log_debug "$server_name MCP 서버 프로세스 없음"
    fi
}

# Serena MCP 특별 디버깅
debug_serena_mcp() {
    log_debug "Serena MCP 특별 디버깅 시작"
    
    # 로그 파일 체크
    local serena_logs=(
        "$LOG_DIR/mcp/serena-debug.log"
        "/tmp/serena-mcp.log"
        "$HOME/.cache/serena/logs"
    )
    
    for log_path in "${serena_logs[@]}"; do
        if [[ -f "$log_path" ]]; then
            local recent_errors
            if recent_errors=$(tail -n 10 "$log_path" | grep -i "error\|exception\|failed" 2>/dev/null); then
                log_warning "Serena 로그에서 최근 오류 발견: $log_path"
                echo "$recent_errors" >> "$LOG_DIR/mcp/serena-errors-$(date '+%Y%m%d').log"
            fi
        fi
    done
    
    # 연결 응답 시간 분석
    local response_time=${MCP_RESPONSE_TIMES[serena]:-0}
    if [[ $response_time -gt 100 ]]; then
        log_warning "Serena MCP 느린 응답 시간: ${response_time}ms"
        
        # 상세 진단 정보 수집
        local debug_info=$(cat << EOF
Serena MCP 진단 정보 ($(date '+%Y-%m-%d %H:%M:%S')):
- 응답 시간: ${response_time}ms
- 메모리 사용: ${MCP_RESPONSE_TIMES[serena_memory_mb]:-N/A}MB
- CPU 사용: ${MCP_RESPONSE_TIMES[serena_cpu_percent]:-N/A}%
- 연속 실패: ${MCP_FAIL_COUNT[serena]:-0}회
- 프로세스 상태: $(ps aux | grep serena-mcp-server | grep -v grep || echo "프로세스 없음")
EOF
)
        
        echo "$debug_info" >> "$LOG_DIR/mcp/serena-debug-$(date '+%Y%m%d').log"
    fi
}

# MCP 상태를 JSON 로그로 저장
save_mcp_status_to_log() {
    local timestamp="$1"
    local log_file="$2"
    local iteration="$3"
    
    # 연결된 서버 수 계산
    local connected_count=0
    local total_count=0
    
    for server in "${MCP_SERVER_LIST[@]}"; do
        total_count=$((total_count + 1))
        if [[ "${MCP_STATUS[$server]}" == "Connected" ]]; then
            connected_count=$((connected_count + 1))
        fi
    done
    
    # JSON 구성
    local json_log=$(cat << EOF
{
  "timestamp": "$timestamp",
  "iteration": $iteration,
  "summary": {
    "total_servers": $total_count,
    "connected_servers": $connected_count,
    "connection_rate": $(( connected_count * 100 / total_count ))
  },
  "servers": {
EOF
)
    
    # 각 서버 정보 추가
    local first=true
    for server in "${MCP_SERVER_LIST[@]}"; do
        if [[ "$first" == "true" ]]; then
            first=false
        else
            json_log+=","
        fi
        
        json_log+=$(cat << EOF

    "$server": {
      "status": "${MCP_STATUS[$server]:-Unknown}",
      "response_time_ms": ${MCP_RESPONSE_TIMES[$server]:-0},
      "fail_count": ${MCP_FAIL_COUNT[$server]:-0}
    }
EOF
)
    done
    
    json_log+=$(cat << EOF

  },
  "performance": {
    "claude_mcp_list_time_ms": ${MCP_RESPONSE_TIMES[claude_mcp_list]:-0}
  }
}
EOF
)
    
    # 로그 파일에 추가
    echo "$json_log" >> "$log_file"
}

# MCP 상태 요약 출력
get_mcp_summary() {
    local connected_count=0
    local total_count=0
    local status_line=""
    
    for server in "${MCP_SERVER_LIST[@]}"; do
        total_count=$((total_count + 1))
        local status="${MCP_STATUS[$server]:-Unknown}"
        local response_time="${MCP_RESPONSE_TIMES[$server]:-0}"
        
        if [[ "$status" == "Connected" ]]; then
            connected_count=$((connected_count + 1))
            local icon="✅"
            
            # 응답 시간에 따른 상태 표시
            if [[ $response_time -gt 200 ]]; then
                icon="🐌"  # 느림
            elif [[ $response_time -gt 100 ]]; then
                icon="⚠️"   # 주의
            fi
            
            status_line+="  $icon $server - ${response_time}ms"
        else
            status_line+="  ❌ $server - $status"
        fi
        
        # Serena 특별 표시
        if [[ "$server" == "serena" ]] && [[ "$status" == "Connected" ]] && [[ $response_time -gt 100 ]]; then
            status_line+=" (느림)"
        fi
        
        status_line+="\n"
    done
    
    cat << EOF
🌐 MCP 서버 ($connected_count/$total_count 연결됨):
$status_line
EOF
}

# MCP 서버 재시작 제안
suggest_server_restart() {
    local failed_servers=()
    
    for server in "${MCP_SERVER_LIST[@]}"; do
        local fail_count=${MCP_FAIL_COUNT[$server]:-0}
        if [[ $fail_count -ge 3 ]]; then
            failed_servers+=("$server")
        fi
    done
    
    if [[ ${#failed_servers[@]} -gt 0 ]]; then
        echo "🔄 재시작 권장 서버: ${failed_servers[*]}"
        echo "   명령어: claude mcp remove SERVER_NAME && claude mcp add SERVER_NAME"
    fi
}

# Serena MCP 문제 해결 제안
suggest_serena_fixes() {
    local serena_response_time=${MCP_RESPONSE_TIMES[serena]:-0}
    local serena_fail_count=${MCP_FAIL_COUNT[serena]:-0}
    
    if [[ $serena_response_time -gt 200 ]] || [[ $serena_fail_count -gt 2 ]]; then
        cat << EOF
🔧 Serena MCP 문제 해결 제안:
  1. 로그 레벨 변경: --log-level INFO → DEBUG
  2. 타임아웃 증가: --tool-timeout 180 → 300
  3. 메모리 체크: 현재 ${MCP_RESPONSE_TIMES[serena_memory_mb]:-N/A}MB
  4. 재시작: claude mcp remove serena && claude mcp add serena [명령어]
EOF
    fi
}