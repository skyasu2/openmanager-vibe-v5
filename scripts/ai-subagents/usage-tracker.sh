#!/bin/bash
# 📊 Usage Tracker - AI CLI 사용량 추적 및 한도 관리 시스템
# Gemini(1K/day), Qwen(2K/day), ChatGPT Plus(150/5h) 한도 관리

set -uo pipefail

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# 설정값
USAGE_DIR="${HOME}/.ai-usage-tracker"
LOG_FILE="$USAGE_DIR/usage.log"
CONFIG_FILE="$USAGE_DIR/config.json"
VERSION="1.0.0"

# 기본 한도 설정 (CLAUDE.md 기준)
declare -A DEFAULT_LIMITS=(
    ["gemini_daily"]="1000"
    ["qwen_daily"]="2000"
    ["codex_5hour"]="150"  # ChatGPT Plus 보수적 기준
)

# 로깅 함수
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# 초기화 함수
init_tracker() {
    # 디렉토리 생성
    mkdir -p "$USAGE_DIR"
    
    # 설정 파일 생성
    if [[ ! -f "$CONFIG_FILE" ]]; then
        cat > "$CONFIG_FILE" << EOF
{
  "version": "$VERSION",
  "limits": {
    "gemini_daily": ${DEFAULT_LIMITS[gemini_daily]},
    "qwen_daily": ${DEFAULT_LIMITS[qwen_daily]},
    "codex_5hour": ${DEFAULT_LIMITS[codex_5hour]}
  },
  "warnings": {
    "gemini": 800,
    "qwen": 1600,
    "codex": 120
  },
  "created": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF
        log_success "Usage tracker 초기화 완료"
    fi
    
    # 로그 파일 생성
    if [[ ! -f "$LOG_FILE" ]]; then
        echo "# AI Usage Log - Created $(date)" > "$LOG_FILE"
        echo "# Format: timestamp,ai_name,action,status,duration_ms" >> "$LOG_FILE"
    fi
}

# 현재 시간 Unix timestamp
get_timestamp() {
    date +%s
}

# 일일 시작 timestamp (00:00 UTC)
get_daily_start() {
    local today=$(date -u +%Y-%m-%d)
    date -u -d "$today 00:00:00" +%s
}

# 5시간 블록 시작 timestamp 
get_5hour_start() {
    local now=$(get_timestamp)
    echo $((now - (now % 18000)))  # 18000 = 5시간(초)
}

# 사용량 기록
log_usage() {
    local ai_name="$1"
    local action="$2"
    local status="${3:-success}"
    local duration="${4:-0}"
    
    local timestamp=$(get_timestamp)
    echo "$timestamp,$ai_name,$action,$status,$duration" >> "$LOG_FILE"
}

# 특정 기간 사용량 조회
get_usage_count() {
    local ai_name="$1"
    local start_time="$2"
    local end_time="${3:-$(get_timestamp)}"
    
    if [[ ! -f "$LOG_FILE" ]]; then
        echo 0
        return
    fi
    
    local count
    count=$(awk -F',' -v ai="$ai_name" -v start="$start_time" -v end="$end_time" '
        $1 >= start && $1 <= end && $2 == ai && $4 == "success" { count++ }
        END { print count+0 }
    ' "$LOG_FILE" 2>/dev/null || echo 0)
    
    echo "$count"
}

# 일일 사용량 조회
get_daily_usage() {
    local ai_name="$1"
    local start_time=$(get_daily_start)
    get_usage_count "$ai_name" "$start_time"
}

# 5시간 블록 사용량 조회
get_5hour_usage() {
    local ai_name="$1"
    local start_time=$(get_5hour_start)
    get_usage_count "$ai_name" "$start_time"
}

# 한도 확인
check_limit() {
    local ai_name="$1"
    local limit_type="$2"  # daily, 5hour
    
    local current_usage=0
    local limit=0
    
    case "$limit_type" in
        daily)
            current_usage=$(get_daily_usage "$ai_name")
            case "$ai_name" in
                gemini) limit=${DEFAULT_LIMITS[gemini_daily]} ;;
                qwen) limit=${DEFAULT_LIMITS[qwen_daily]} ;;
                *) limit=999999 ;;
            esac
            ;;
        5hour)
            if [[ "$ai_name" == "codex" ]]; then
                current_usage=$(get_5hour_usage "$ai_name")
                limit=${DEFAULT_LIMITS[codex_5hour]}
            else
                limit=999999  # 5시간 한도가 없는 AI
            fi
            ;;
    esac
    
    local remaining=$((limit - current_usage))
    local usage_percent=$((current_usage * 100 / limit))
    
    echo "$current_usage|$limit|$remaining|$usage_percent"
}

# AI별 상태 확인
check_ai_status() {
    local ai_name="$1"
    
    case "$ai_name" in
        gemini)
            local status=$(check_limit "gemini" "daily")
            IFS='|' read -r current limit remaining percent <<< "$status"
            
            echo -e "${CYAN}🧠 Gemini (Google AI 무료):${NC}"
            echo "  일일 사용량: $current/${limit}회 (${percent}%)"
            echo "  남은 횟수: $remaining회"
            
            if [[ $percent -ge 90 ]]; then
                echo -e "  상태: ${RED}🚨 한도 거의 소진${NC}"
            elif [[ $percent -ge 70 ]]; then
                echo -e "  상태: ${YELLOW}⚠️ 주의 필요${NC}"
            else
                echo -e "  상태: ${GREEN}✅ 정상${NC}"
            fi
            ;;
            
        qwen)
            local status=$(check_limit "qwen" "daily")
            IFS='|' read -r current limit remaining percent <<< "$status"
            
            echo -e "${MAGENTA}⚡ Qwen (OAuth 무료):${NC}"
            echo "  일일 사용량: $current/${limit}회 (${percent}%)"
            echo "  남은 횟수: $remaining회"
            
            if [[ $percent -ge 90 ]]; then
                echo -e "  상태: ${RED}🚨 한도 거의 소진${NC}"
            elif [[ $percent -ge 70 ]]; then
                echo -e "  상태: ${YELLOW}⚠️ 주의 필요${NC}"
            else
                echo -e "  상태: ${GREEN}✅ 정상${NC}"
            fi
            ;;
            
        codex)
            local status=$(check_limit "codex" "5hour")
            IFS='|' read -r current limit remaining percent <<< "$status"
            
            local block_start=$(get_5hour_start)
            local block_end=$((block_start + 18000))
            local now=$(get_timestamp)
            local time_remaining=$((block_end - now))
            local hours_remaining=$((time_remaining / 3600))
            local minutes_remaining=$(((time_remaining % 3600) / 60))
            
            echo -e "${YELLOW}🤖 Codex (ChatGPT Plus):${NC}"
            echo "  5시간 사용량: $current/${limit}회 (${percent}%)"
            echo "  남은 횟수: $remaining회"
            echo "  블록 리셋: ${hours_remaining}시간 ${minutes_remaining}분 후"
            
            if [[ $percent -ge 90 ]]; then
                echo -e "  상태: ${RED}🚨 한도 거의 소진${NC}"
            elif [[ $percent -ge 70 ]]; then
                echo -e "  상태: ${YELLOW}⚠️ 주의 필요${NC}"
            else
                echo -e "  상태: ${GREEN}✅ 정상${NC}"
            fi
            ;;
            
        claude)
            echo -e "${BLUE}🎭 Claude Code (Max 20x):${NC}"
            echo "  한도: 무제한 (정액제)"
            echo -e "  상태: ${GREEN}✅ 정상 (Max 구독)${NC}"
            echo "  참고: ccusage daily로 토큰 사용량 확인 가능"
            ;;
    esac
}

# 전체 상태 확인
show_status() {
    echo -e "${BOLD}📊 AI CLI 사용량 현황${NC}"
    echo -e "${CYAN}$(printf '%.0s─' {1..50})${NC}"
    
    local ais=("claude" "codex" "gemini" "qwen")
    
    for ai in "${ais[@]}"; do
        echo ""
        check_ai_status "$ai"
    done
    
    echo ""
    echo -e "${CYAN}$(printf '%.0s─' {1..50})${NC}"
    echo "마지막 업데이트: $(date)"
}

# 사용량 히스토리
show_history() {
    local days="${1:-7}"
    
    echo -e "${BOLD}📈 사용량 히스토리 (최근 ${days}일)${NC}"
    echo -e "${CYAN}$(printf '%.0s─' {1..50})${NC}"
    
    if [[ ! -f "$LOG_FILE" ]]; then
        log_warning "사용량 기록이 없습니다"
        return
    fi
    
    local now=$(get_timestamp)
    local days_ago=$((now - (days * 86400)))
    
    echo "날짜        | Codex | Gemini | Qwen  | 총합"
    echo "------------|-------|--------|-------|-------"
    
    for i in $(seq $((days-1)) -1 0); do
        local day_start=$((now - (i * 86400)))
        local day_end=$((day_start + 86400))
        local date_str=$(date -d "@$day_start" +%m-%d)
        
        local codex_count=$(get_usage_count "codex" "$day_start" "$day_end")
        local gemini_count=$(get_usage_count "gemini" "$day_start" "$day_end")
        local qwen_count=$(get_usage_count "qwen" "$day_start" "$day_end")
        local total=$((codex_count + gemini_count + qwen_count))
        
        printf "%-11s | %5d | %6d | %5d | %5d\n" "$date_str" "$codex_count" "$gemini_count" "$qwen_count" "$total"
    done
}

# 사용 가능 여부 확인 (다른 스크립트에서 호출용)
can_use_ai() {
    local ai_name="$1"
    local margin="${2:-5}"  # 여유분 (%)
    
    case "$ai_name" in
        gemini)
            local status=$(check_limit "gemini" "daily")
            IFS='|' read -r current limit remaining percent <<< "$status"
            ;;
        qwen)
            local status=$(check_limit "qwen" "daily") 
            IFS='|' read -r current limit remaining percent <<< "$status"
            ;;
        codex)
            local status=$(check_limit "codex" "5hour")
            IFS='|' read -r current limit remaining percent <<< "$status"
            ;;
        claude)
            echo "true"  # 무제한
            return 0
            ;;
        *)
            echo "false"
            return 1
            ;;
    esac
    
    local safe_limit=$((100 - margin))
    if [[ $percent -le $safe_limit ]]; then
        echo "true"
        return 0
    else
        echo "false"
        return 1
    fi
}

# 로그 정리 (30일 이상 된 기록 삭제)
cleanup_logs() {
    if [[ ! -f "$LOG_FILE" ]]; then
        return
    fi
    
    local thirty_days_ago=$(($(get_timestamp) - (30 * 86400)))
    local temp_file="${LOG_FILE}.tmp"
    
    # 헤더와 최근 30일 데이터만 보존
    head -n 2 "$LOG_FILE" > "$temp_file"
    awk -F',' -v cutoff="$thirty_days_ago" '$1 >= cutoff' "$LOG_FILE" >> "$temp_file"
    
    mv "$temp_file" "$LOG_FILE"
    log_success "30일 이상 된 로그 정리 완료"
}

# 도움말
show_help() {
    cat << EOF
${BOLD}📊 Usage Tracker v$VERSION${NC}
${CYAN}AI CLI 사용량 추적 및 한도 관리 시스템${NC}

${YELLOW}사용법:${NC}
  $0 status                 전체 사용량 현황
  $0 log <AI> <action>      사용량 기록 (래퍼에서 자동 호출)
  $0 check <AI>             특정 AI 사용 가능 여부
  $0 history [days]         사용량 히스토리 (기본: 7일)
  $0 cleanup               30일 이상 된 로그 정리
  $0 init                  초기 설정

${YELLOW}AI 이름:${NC}
  codex     ChatGPT Plus (150회/5시간)
  gemini    Google AI (1,000회/일)
  qwen      Qwen OAuth (2,000회/일)  
  claude    Claude Max (무제한)

${YELLOW}예시:${NC}
  $0 status
  $0 check gemini
  $0 history 14
  $0 log codex analyze

${YELLOW}한도 정보:${NC}
  • Gemini: 1,000회/일 (Google AI 무료)
  • Qwen: 2,000회/일 (OAuth 무료)
  • Codex: 150회/5시간 (ChatGPT Plus 보수적)
  • Claude: 무제한 (Max 20x 구독)

${YELLOW}파일 위치:${NC}
  설정: $CONFIG_FILE
  로그: $LOG_FILE
EOF
}

# 메인 함수
main() {
    local command="${1:-status}"
    local ai_name="${2:-}"
    local action="${3:-}"
    local param="${4:-}"
    
    # 초기화 확인
    if [[ "$command" != "init" ]] && [[ ! -f "$CONFIG_FILE" ]]; then
        log_warning "Usage tracker가 초기화되지 않았습니다. 자동 초기화 중..."
        init_tracker
    fi
    
    case "$command" in
        status)
            show_status
            ;;
        log)
            if [[ -z "$ai_name" ]] || [[ -z "$action" ]]; then
                log_error "사용법: $0 log <AI이름> <액션>"
                exit 1
            fi
            log_usage "$ai_name" "$action" "success"
            log_success "사용량 기록됨: $ai_name $action"
            ;;
        check)
            if [[ -z "$ai_name" ]]; then
                log_error "사용법: $0 check <AI이름>"
                exit 1
            fi
            local can_use=$(can_use_ai "$ai_name")
            if [[ "$can_use" == "true" ]]; then
                log_success "$ai_name 사용 가능"
                exit 0
            else
                log_warning "$ai_name 한도 초과 또는 임박"
                exit 1
            fi
            ;;
        history)
            local days="${ai_name:-7}"
            show_history "$days"
            ;;
        cleanup)
            cleanup_logs
            ;;
        init)
            init_tracker
            ;;
        --help|-h|help)
            show_help
            ;;
        *)
            log_error "알 수 없는 명령어: $command"
            echo "도움말: $0 --help"
            exit 1
            ;;
    esac
}

# 함수 export (다른 스크립트에서 사용 가능)
if [[ "${BASH_SOURCE[0]}" != "${0}" ]]; then
    # 소스되는 경우 함수만 export
    export -f log_usage
    export -f can_use_ai
    export -f check_limit
    export -f init_tracker
else
    # 직접 실행되는 경우 main 함수 호출
    main "$@"
fi