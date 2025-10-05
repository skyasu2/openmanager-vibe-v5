#!/bin/bash

# Codex CLI Wrapper - 적응형 타임아웃 및 재시도 로직
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
LOG_FILE="$LOG_DIR/codex-perf-$(date +%F).log"
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

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] WARNING: $1" >> "$LOG_FILE"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $1" >> "$LOG_FILE"
}

# 복잡도 감지 함수 (쿼리 길이 기반)
detect_query_complexity() {
    local query="$1"
    local query_length=${#query}

    if [ "$query_length" -lt 50 ]; then
        echo "simple"
    elif [ "$query_length" -lt 200 ]; then
        echo "medium"
    else
        echo "complex"
    fi
}

# 적응형 타임아웃 설정
get_adaptive_timeout() {
    local complexity="$1"

    case "$complexity" in
        "simple")
            echo 30
            ;;
        "medium")
            echo 90
            ;;
        "complex")
            echo 120
            ;;
        *)
            echo 90
            ;;
    esac
}

# Codex 실행 함수
execute_codex() {
    local query="$1"
    local timeout_seconds="$2"
    local attempt="$3"

    log_info "🤖 Codex 실행 중 (시도 $attempt, 타임아웃 ${timeout_seconds}초)..."

    local start_time=$(date +%s)
    local output_file=$(mktemp)
    local exit_code=0

    # Codex 실행 (타임아웃 보호)
    if timeout "${timeout_seconds}s" codex exec "$query" > "$output_file" 2>&1; then
        exit_code=0
    else
        exit_code=$?
    fi

    local end_time=$(date +%s)
    local duration=$((end_time - start_time))

    # 결과 분석
    if [ $exit_code -eq 0 ]; then
        log_success "Codex 실행 성공 (${duration}초)"

        # 토큰 사용량 추출
        local tokens_used=$(grep "tokens used:" "$output_file" | tail -1 | sed 's/.*tokens used: //' | tr -d ',')
        if [ -n "$tokens_used" ]; then
            log_info "📊 토큰 사용: $tokens_used"
            echo "[$(date '+%Y-%m-%d %H:%M:%S')] TOKENS: $tokens_used, DURATION: ${duration}s" >> "$LOG_FILE"
        fi

        # 결과 출력
        cat "$output_file"
        rm -f "$output_file"
        return 0
    elif [ $exit_code -eq 124 ]; then
        log_error "Codex 타임아웃 (${timeout_seconds}초 초과)"
        rm -f "$output_file"
        return 124
    else
        log_error "Codex 실행 오류 (종료 코드: $exit_code)"
        cat "$output_file" >&2
        rm -f "$output_file"
        return $exit_code
    fi
}

# 재시도 로직
codex_with_retry() {
    local query="$1"
    local complexity=$(detect_query_complexity "$query")
    local initial_timeout=$(get_adaptive_timeout "$complexity")

    log_info "🔍 쿼리 복잡도: $complexity"
    log_info "⏱️  초기 타임아웃: ${initial_timeout}초"

    # 첫 번째 시도
    if execute_codex "$query" "$initial_timeout" 1; then
        return 0
    fi

    # 타임아웃 발생 시 재시도 (타임아웃 50% 증가)
    local retry_timeout=$((initial_timeout * 3 / 2))
    log_warning "🔄 재시도 (타임아웃 ${retry_timeout}초로 증가)..."

    if execute_codex "$query" "$retry_timeout" 2; then
        return 0
    fi

    # 재시도 실패
    log_error "❌ 모든 시도 실패"
    return 1
}

# 도움말
usage() {
    cat << EOF
${CYAN}🤖 Codex CLI Wrapper - 적응형 타임아웃 및 재시도 로직${NC}

사용법:
  $0 "쿼리 내용"

예시:
  $0 "간단한 질문: 2+2는?"
  $0 "이 TypeScript 코드를 분석하고 개선점 3가지를 제시해주세요."

특징:
  ✅ 자동 복잡도 감지 (쿼리 길이 기반)
  ✅ 적응형 타임아웃 (간단: 30초, 보통: 90초, 복잡: 120초)
  ✅ 자동 재시도 (1회, 타임아웃 50% 증가)
  ✅ 성능 로깅 ($LOG_FILE)

복잡도 기준:
  - 간단 (< 50자): 30초 타임아웃
  - 보통 (50-200자): 90초 타임아웃
  - 복잡 (> 200자): 120초 타임아웃

로그 위치:
  $LOG_FILE
EOF
    exit 1
}

# 메인 실행
main() {
    # 인자 확인
    if [ $# -eq 0 ]; then
        usage
    fi

    local query="$*"

    # Codex 설치 확인
    if ! command -v codex >/dev/null 2>&1; then
        log_error "Codex CLI가 설치되지 않았습니다"
        log_info "설치: npm install -g openai-cli"
        exit 1
    fi

    # 환경변수 확인 (선택적)
    if [ -f "/mnt/d/cursor/openmanager-vibe-v5/.env.local" ]; then
        # shellcheck disable=SC1091
        source "/mnt/d/cursor/openmanager-vibe-v5/.env.local" 2>/dev/null || true
    fi

    # 실행
    echo ""
    log_info "🚀 Codex Wrapper 시작"
    echo ""

    if codex_with_retry "$query"; then
        echo ""
        log_success "✅ 완료"
        exit 0
    else
        echo ""
        log_error "❌ 실패"
        exit 1
    fi
}

# 실행
main "$@"
