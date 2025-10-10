#!/bin/bash

# Qwen CLI Wrapper - 단순화된 300초 타임아웃
# 버전: 2.0.0
# 날짜: 2025-10-10
# 변경: 타임아웃 300초 통일, 타임아웃 시 분할/간소화 제안

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

# 고정 타임아웃 (5분)
TIMEOUT_SECONDS=300

# Qwen 실행 함수
execute_qwen() {
    local query="$1"
    local use_plan_mode="${2:-true}"

    if [ "$use_plan_mode" = "true" ]; then
        log_info "⚙️  Qwen Plan Mode 실행 중 (타임아웃 ${TIMEOUT_SECONDS}초 = 5분)..."
    else
        log_info "🟡 Qwen 일반 모드 실행 중 (타임아웃 ${TIMEOUT_SECONDS}초 = 5분)..."
    fi

    local start_time=$(date +%s)
    local output_file=$(mktemp)
    local exit_code=0

    # Qwen 실행 (non-interactive 모드)
    if [ "$use_plan_mode" = "true" ]; then
        # Plan Mode: --approval-mode plan + -p (non-interactive)
        if timeout "${TIMEOUT_SECONDS}s" qwen --approval-mode plan -p "$query" > "$output_file" 2>&1; then
            exit_code=0
        else
            exit_code=$?
        fi
    else
        # Normal Mode: -p만 사용 (non-interactive)
        if timeout "${TIMEOUT_SECONDS}s" qwen -p "$query" > "$output_file" 2>&1; then
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
        log_error "Qwen 타임아웃 (${TIMEOUT_SECONDS}초 = 5분 초과)"
        echo ""
        echo -e "${YELLOW}💡 타임아웃 해결 방법:${NC}"
        echo "  1️⃣  질문을 더 작은 단위로 분할하세요"
        echo "  2️⃣  질문을 더 간결하게 만드세요"
        echo "  3️⃣  핵심 부분만 먼저 질문하세요"
        echo ""
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
${CYAN}🟡 Qwen CLI Wrapper v2.0.0 - Claude Code 내부 도구${NC}

${YELLOW}⚠️  이 스크립트는 Claude Code가 제어하는 내부 도구입니다${NC}
${YELLOW}   사용자는 직접 실행하지 않고, 서브에이전트를 통해 사용합니다${NC}

사용 방법:
  ${GREEN}사용자${NC}: "성능 최적화를 AI 교차검증해줘"
  ${GREEN}Claude${NC}: Task multi-ai-verification-specialist 호출
  ${GREEN}서브에이전트${NC}: 이 wrapper를 자동 실행

직접 실행 (디버깅/테스트 전용):
  $0 [-p] "쿼리 내용"

옵션:
  -p    Plan Mode (권장): 안전한 계획 수립
  -h    도움말 표시

예시 (디버깅):
  $0 -p "성능 병목점 분석"           # Plan Mode
  $0 "간단한 계산: 2+2"             # Normal Mode

특징:
  ✅ 고정 타임아웃: 300초 (5분, Plan/Normal 통일)
  ✅ 재시도 없음 (자원 낭비 방지)
  ✅ 타임아웃 시 분할/간소화 제안
  ✅ Non-interactive: -p 플래그로 자동 실행
  ✅ 성능 로깅 ($LOG_FILE)

타임아웃 발생 시:
  - 질문을 더 작은 단위로 분할
  - 질문을 더 간결하게 수정
  - 핵심 부분만 먼저 질문

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
    log_info "🚀 Qwen Wrapper v2.0.0 시작"
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
