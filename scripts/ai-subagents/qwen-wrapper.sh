#!/bin/bash

# Qwen CLI Wrapper - Plan Mode 안정화
# 버전: 1.1.0
# 날짜: 2025-10-05
# 개선: 파라미터 처리 및 Plan Mode 수정

set -euo pipefail

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 로그 디렉터리
LOG_DIR="/mnt/d/cursor/openmanager-vibe-v5/logs/ai-perf"
LOG_FILE="$LOG_DIR/qwen-perf-$(date +%F).log"
mkdir -p "$LOG_DIR"

# 로그 함수
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] INFO: $1" >> "$LOG_FILE"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] SUCCESS: $1" >> "$LOG_FILE"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $1" >> "$LOG_FILE"
}

# Qwen 실행 함수
execute_qwen() {
    local query="$1"
    local use_plan_mode="${2:-true}"
    local timeout_seconds

    if [ "$use_plan_mode" = "true" ]; then
        timeout_seconds=90
        log_info "⚙️  Qwen Plan Mode 실행 중 (타임아웃 ${timeout_seconds}초)..."
    else
        timeout_seconds=45
        log_info "🟡 Qwen 일반 모드 실행 중 (타임아웃 ${timeout_seconds}초)..."
    fi

    local start_time=$(date +%s)
    local output_file=$(mktemp)
    local exit_code=0

    # Qwen 실행 (non-interactive 모드)
    if [ "$use_plan_mode" = "true" ]; then
        # Plan Mode: --approval-mode plan + -p (non-interactive)
        if timeout "${timeout_seconds}s" qwen --approval-mode plan -p "$query" > "$output_file" 2>&1; then
            exit_code=0
        else
            exit_code=$?
        fi
    else
        # Normal Mode: -p만 사용 (non-interactive)
        if timeout "${timeout_seconds}s" qwen -p "$query" > "$output_file" 2>&1; then
            exit_code=0
        else
            exit_code=$?
        fi
    fi

    local end_time=$(date +%s)
    local duration=$((end_time - start_time))

    if [ $exit_code -eq 0 ]; then
        log_success "Qwen 실행 성공 (${duration}초)"
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] MODE: $([ "$use_plan_mode" = "true" ] && echo "Plan" || echo "Normal"), DURATION: ${duration}s" >> "$LOG_FILE"
        cat "$output_file"
        rm -f "$output_file"
        return 0
    elif [ $exit_code -eq 124 ]; then
        log_error "Qwen 타임아웃 (${timeout_seconds}초 초과)"
        rm -f "$output_file"
        return 124
    else
        log_error "Qwen 실행 오류 (종료 코드: $exit_code)"
        cat "$output_file" >&2
        rm -f "$output_file"
        return $exit_code
    fi
}

# 도움말
usage() {
    cat << EOF
${CYAN}🟡 Qwen CLI Wrapper v1.1.0 - Plan Mode 안정화${NC}

사용법:
  $0 [-p] "쿼리 내용"

옵션:
  -p    Plan Mode (권장): 90초 타임아웃, 안전한 계획 수립
  -h    도움말 표시

예시:
  $0 -p "성능 병목점 분석"           # Plan Mode
  $0 "간단한 계산: 2+2"             # Normal Mode

특징:
  ✅ Plan Mode: --approval-mode plan, 90초 타임아웃
  ✅ Normal Mode: 45초 타임아웃, 빠른 응답
  ✅ Non-interactive: -p 플래그로 자동 실행
  ✅ 성능 로깅 ($LOG_FILE)

로그 위치:
  $LOG_FILE
EOF
    exit 1
}

# 메인 실행
main() {
    local use_plan_mode="false"
    local query=""

    # 파라미터 파싱
    while getopts "ph" opt; do
        case $opt in
            p)
                use_plan_mode="true"
                ;;
            h)
                usage
                ;;
            \?)
                echo "잘못된 옵션: -$OPTARG" >&2
                usage
                ;;
        esac
    done
    shift $((OPTIND-1))

    # 쿼리 확인
    if [ $# -eq 0 ]; then
        echo "오류: 쿼리를 입력해주세요" >&2
        usage
    fi

    query="$1"

    # Qwen CLI 설치 확인
    if ! command -v qwen >/dev/null 2>&1; then
        log_error "Qwen CLI가 설치되지 않았습니다"
        log_info "설치: npm install -g qwen-cli"
        exit 1
    fi

    echo ""
    log_info "🚀 Qwen Wrapper v1.1.0 시작"
    echo ""

    if execute_qwen "$query" "$use_plan_mode"; then
        echo ""
        log_success "✅ 완료"
        exit 0
    else
        echo ""
        log_error "❌ 실패"
        exit 1
    fi
}

main "$@"
