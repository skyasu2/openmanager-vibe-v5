#!/bin/bash

# Gemini CLI Wrapper - 빠른 응답 최적화
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
LOG_FILE="$LOG_DIR/gemini-perf-$(date +%F).log"
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

# Gemini 실행 함수
execute_gemini() {
    local query="$1"
    local timeout_seconds="${2:-60}"
    local model="${3:-gemini-2.5-pro}"

    log_info "🟢 Gemini 실행 중 (모델: $model, 타임아웃 ${timeout_seconds}초)..."

    local start_time=$(date +%s)
    local output_file=$(mktemp)
    local exit_code=0

    # Gemini 실행 (모델 지정 필수)
    if timeout "${timeout_seconds}s" gemini "$query" --model "$model" > "$output_file" 2>&1; then
        exit_code=0
    else
        exit_code=$?
    fi

    local end_time=$(date +%s)
    local duration=$((end_time - start_time))

    if [ $exit_code -eq 0 ]; then
        log_success "Gemini 실행 성공 (${duration}초)"
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] DURATION: ${duration}s" >> "$LOG_FILE"
        cat "$output_file"
        rm -f "$output_file"
        return 0
    elif [ $exit_code -eq 124 ]; then
        log_error "Gemini 타임아웃 (${timeout_seconds}초 초과)"
        rm -f "$output_file"
        return 124
    else
        log_error "Gemini 실행 오류 (종료 코드: $exit_code)"
        cat "$output_file" >&2
        rm -f "$output_file"
        return $exit_code
    fi
}

# 도움말
usage() {
    cat << EOF
${CYAN}🟢 Gemini CLI Wrapper - 빠른 응답 최적화${NC}

사용법:
  $0 "쿼리 내용" [타임아웃(초)] [모델]

예시:
  $0 "아키텍처 검토"
  $0 "SOLID 원칙 준수 여부 확인" 90
  $0 "성능 분석" 60 gemini-2.5-flash

특징:
  ✅ 즉시 응답 (평균 5초)
  ✅ 기본 타임아웃 60초 (안전 마진 2배)
  ✅ 기본 모델: gemini-2.5-pro
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
    local timeout="${2:-60}"
    local model="${3:-gemini-2.5-pro}"

    if ! command -v gemini >/dev/null 2>&1; then
        log_error "Gemini CLI가 설치되지 않았습니다"
        log_info "설치: npm install -g @google-ai/gemini-cli"
        exit 1
    fi

    echo ""
    log_info "🚀 Gemini Wrapper 시작"
    echo ""

    if execute_gemini "$query" "$timeout" "$model"; then
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
