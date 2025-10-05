#!/bin/bash

# Qwen CLI Wrapper - Plan Mode 안정화
# 버전: 1.0.0
# 날짜: 2025-10-05

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
        timeout_seconds=60
        log_info "⚙️  Qwen Plan Mode 실행 중 (타임아웃 ${timeout_seconds}초)..."
    else
        timeout_seconds=30
        log_info "🟡 Qwen 일반 모드 실행 중 (타임아웃 ${timeout_seconds}초)..."
    fi

    local start_time=$(date +%s)
    local output_file=$(mktemp)
    local exit_code=0

    # Qwen 실행
    if [ "$use_plan_mode" = "true" ]; then
        if timeout "${timeout_seconds}s" qwen -p "$query" > "$output_file" 2>&1; then
            exit_code=0
        else
            exit_code=$?
        fi
    else
        if timeout "${timeout_seconds}s" qwen "$query" > "$output_file" 2>&1; then
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
${CYAN}🟡 Qwen CLI Wrapper - Plan Mode 안정화${NC}

사용법:
  $0 "쿼리 내용" [plan|normal]

예시:
  $0 "성능 병목점 분석" plan
  $0 "간단한 계산: 2+2" normal

특징:
  ✅ Plan Mode (권장): 60초 타임아웃, 안전한 계획 수립
  ✅ Normal Mode: 30초 타임아웃, 빠른 응답
  ✅ 성능 로깅 ($LOG_FILE)

로그 위치:
  $LOG_FILE
EOF
    exit 1
}

# 메인 실행
main() {
    if [ $# -eq 0 ]; then
        usage
    fi

    local query="$1"
    local mode="${2:-plan}"
    local use_plan_mode="true"

    if [ "$mode" = "normal" ]; then
        use_plan_mode="false"
    fi

    if ! command -v qwen >/dev/null 2>&1; then
        log_error "Qwen CLI가 설치되지 않았습니다"
        log_info "설치: npm install -g qwen-cli"
        exit 1
    fi

    echo ""
    log_info "🚀 Qwen Wrapper 시작"
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
