#!/bin/bash
# 🤖 스마트 AI 사용량 관리 시스템
# Claude Code + 3개 보조 AI의 효율적 활용

set -euo pipefail

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

# AI 사용량 현황 (일일 기준)
declare -A AI_LIMITS=(
    ["codex"]="150"      # 30-150 메시지/5시간
    ["gemini"]="1000"    # 1,000 요청/일
    ["qwen"]="2000"      # 2,000 요청/일
)

# AI 사용량 추적 파일
USAGE_FILE="$HOME/.ai-usage-$(date +%Y%m%d).json"

# 로깅 함수
log_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
log_ai() { echo -e "${PURPLE}🤖 $1${NC}"; }

# 사용량 추적 초기화
init_usage_tracking() {
    if [ ! -f "$USAGE_FILE" ]; then
        cat > "$USAGE_FILE" << 'EOF'
{
  "codex": 0,
  "gemini": 0,
  "qwen": 0,
  "last_updated": ""
}
EOF
        log_info "사용량 추적 파일 생성: $USAGE_FILE"
    fi
}

# 사용량 증가
increment_usage() {
    local ai_name="$1"
    local current_usage
    local new_usage
    
    current_usage=$(jq -r ".$ai_name" "$USAGE_FILE")
    new_usage=$((current_usage + 1))
    
    jq ".$ai_name = $new_usage | .last_updated = \"$(date)\"" "$USAGE_FILE" > "${USAGE_FILE}.tmp"
    mv "${USAGE_FILE}.tmp" "$USAGE_FILE"
}

# 사용량 확인
check_usage() {
    local ai_name="$1"
    local current_usage limit_usage
    
    current_usage=$(jq -r ".$ai_name" "$USAGE_FILE")
    limit_usage=${AI_LIMITS[$ai_name]}
    
    echo "$current_usage/$limit_usage"
    
    if [ "$current_usage" -ge "$limit_usage" ]; then
        return 1  # 한도 초과
    else
        return 0  # 사용 가능
    fi
}

# 스마트 AI 선택
select_best_ai() {
    local task_type="$1"
    local task_complexity="$2"
    
    log_info "작업 타입: $task_type, 복잡도: $task_complexity"
    
    case "$task_type" in
        "typescript"|"nextjs"|"testing")
            if check_usage "codex" >/dev/null; then
                echo "codex"
                log_ai "Codex CLI 선택 (TypeScript 전문)"
            else
                echo "claude"
                log_warning "Codex 한도 초과, Claude Code 대체 사용"
            fi
            ;;
        "architecture"|"refactoring"|"solid")
            if check_usage "gemini" >/dev/null; then
                echo "gemini"
                log_ai "Gemini CLI 선택 (아키텍처 전문)"
            else
                echo "claude"
                log_warning "Gemini 한도 초과, Claude Code 대체 사용"
            fi
            ;;
        "performance"|"algorithm"|"optimization")
            if check_usage "qwen" >/dev/null; then
                echo "qwen"
                log_ai "Qwen CLI 선택 (성능 최적화 전문)"
            else
                echo "claude"
                log_warning "Qwen 한도 초과, Claude Code 대체 사용"
            fi
            ;;
        *)
            echo "claude"
            log_ai "Claude Code 선택 (범용 작업)"
            ;;
    esac
}

# AI CLI 실행 (사용량 추적 포함)
execute_ai_task() {
    local ai_name="$1"
    local prompt="$2"
    
    # 사용량 추적
    if [ "$ai_name" != "claude" ]; then
        if ! check_usage "$ai_name" >/dev/null; then
            log_warning "$ai_name 한도 초과! Claude Code로 대체 실행"
            ai_name="claude"
        else
            increment_usage "$ai_name"
            local usage_info
            usage_info=$(check_usage "$ai_name")
            log_info "$ai_name 사용량: $usage_info"
        fi
    fi
    
    # AI 실행
    case "$ai_name" in
        "codex")
            log_ai "Codex (GPT-5) 실행 중..."
            codex exec "$prompt"
            ;;
        "gemini")
            log_ai "Gemini 실행 중..."
            gemini -p "$prompt"
            ;;
        "qwen")
            log_ai "Qwen 실행 중..."
            qwen -p "$prompt"
            ;;
        "claude")
            log_ai "Claude Code 계속 사용"
            echo "🤖 Claude Code가 직접 처리할 작업입니다."
            ;;
    esac
}

# 일일 사용량 리포트
show_usage_report() {
    log_info "📊 오늘의 AI 사용량 현황"
    echo "================================"
    
    for ai in "${!AI_LIMITS[@]}"; do
        local usage_info
        usage_info=$(check_usage "$ai")
        local current_usage="${usage_info%/*}"
        local limit_usage="${usage_info#*/}"
        local percentage=$((current_usage * 100 / limit_usage))
        
        printf "%-8s: %3d/%4d (%3d%%) " "$ai" "$current_usage" "$limit_usage" "$percentage"
        
        if [ "$percentage" -ge 90 ]; then
            echo -e "${RED}🚨 거의 한도${NC}"
        elif [ "$percentage" -ge 70 ]; then
            echo -e "${YELLOW}⚠️ 70% 사용${NC}"
        else
            echo -e "${GREEN}✅ 여유있음${NC}"
        fi
    done
    echo
}

# 메인 함수
main() {
    echo -e "${PURPLE}🤖 스마트 AI 사용량 관리 시스템${NC}"
    echo
    
    init_usage_tracking
    
    case "${1:-help}" in
        "select")
            select_best_ai "${2:-general}" "${3:-medium}"
            ;;
        "execute")
            local ai_name="$2"
            local prompt="$3"
            execute_ai_task "$ai_name" "$prompt"
            ;;
        "status"|"report")
            show_usage_report
            ;;
        "auto")
            local task_type="$2"
            local complexity="${3:-medium}"
            local prompt="$4"
            
            local selected_ai
            selected_ai=$(select_best_ai "$task_type" "$complexity")
            execute_ai_task "$selected_ai" "$prompt"
            ;;
        "help"|*)
            cat << 'EOF'
🤖 스마트 AI 사용량 관리 시스템

사용법:
  ./smart-ai-usage.sh select <타입> [복잡도]     # 최적 AI 선택
  ./smart-ai-usage.sh execute <AI> "<프롬프트>"  # AI 실행 (사용량 추적)
  ./smart-ai-usage.sh status                    # 사용량 현황
  ./smart-ai-usage.sh auto <타입> [복잡도] "<프롬프트>" # 자동 선택 + 실행

작업 타입:
  typescript, nextjs, testing     → Codex CLI (GPT-5)
  architecture, refactoring, solid → Gemini CLI  
  performance, algorithm, optimization → Qwen CLI
  기타 모든 작업 → Claude Code

예시:
  ./smart-ai-usage.sh auto typescript medium "이 코드 리팩토링해줘"
  ./smart-ai-usage.sh auto architecture high "SOLID 원칙 검증해줘"
  ./smart-ai-usage.sh status
EOF
            ;;
    esac
}

# 스크립트 실행
main "$@"