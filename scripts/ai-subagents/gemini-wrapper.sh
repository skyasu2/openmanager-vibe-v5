#!/bin/bash

# Gemini CLI Wrapper - 단순화된 300초 타임아웃
# 버전: 2.5.0
# 날짜: 2025-10-17 (환경 독립성 개선 - 포터블화)

set -euo pipefail

# 프로젝트 루트 자동 결정 (포터블)
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"


# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 로그 디렉터리
# 로그 디렉터리 (프로젝트 루트 기준)
LOG_DIR="${PROJECT_ROOT}/logs/ai-perf"
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


# 고정 타임아웃 (5분)
TIMEOUT_SECONDS=300

# Gemini 실행 함수
execute_gemini() {
    local query="$1"
    local model="${2:-gemini-2.5-pro}"

    log_info "🟢 Gemini 실행 중 (모델: $model, 타임아웃 ${TIMEOUT_SECONDS}초 = 5분)..."

    local start_time=$(date +%s)
    local output_file=$(mktemp)
    local exit_code=0

    # Gemini 실행 (모델 지정 필수)
    if timeout "${TIMEOUT_SECONDS}s" gemini "$query" --model "$model" > "$output_file" 2>&1; then
        exit_code=0
    else
        exit_code=$?
    fi

    local end_time=$(date +%s)
    local duration=$((end_time - start_time))

    if [ $exit_code -eq 0 ]; then
        log_success "Gemini 실행 성공 (${duration}초)"
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] DURATION: ${duration}s" >> "$LOG_FILE"

        # Auto-logging to Decision Log (Phase 1)

        cat "$output_file"
        rm -f "$output_file"
        return 0
    elif [ $exit_code -eq 124 ]; then
        log_error "Gemini 타임아웃 (${TIMEOUT_SECONDS}초 = 5분 초과)"
        echo ""
        echo -e "${YELLOW}💡 타임아웃 해결 방법:${NC}"
        echo "  1️⃣  질문을 더 작은 단위로 분할하세요"
        echo "  2️⃣  질문을 더 간결하게 만드세요"
        echo "  3️⃣  핵심 부분만 먼저 질문하세요"
        echo ""
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
${CYAN}🟢 Gemini CLI Wrapper v2.5.0 - Claude Code 내부 도구${NC}

${YELLOW}⚠️  이 스크립트는 Claude Code가 제어하는 내부 도구입니다${NC}
${YELLOW}   사용자는 직접 실행하지 않고, 서브에이전트를 통해 사용합니다${NC}

사용 방법:
  ${GREEN}사용자${NC}: "LoginClient를 AI 교차검증해줘"
  ${GREEN}Claude${NC}: Task multi-ai-verification-specialist 호출
  ${GREEN}서브에이전트${NC}: 이 wrapper를 자동 실행

직접 실행 (디버깅/테스트 전용):
  $0 "쿼리 내용" [모델]

예시 (디버깅):
  $0 "아키텍처 검토"
  $0 "SOLID 원칙 준수 여부 확인"
  $0 "성능 분석" gemini-2.5-flash

특징:
  ✅ 고정 타임아웃: 300초 (5분)
  ✅ 재시도 없음 (자원 낭비 방지)
  ✅ 타임아웃 시 분할/간소화 제안
  ✅ 기본 모델: gemini-2.5-pro
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
    if [ $# -eq 0 ]; then
        usage
    fi

    local query="$1"
    local model="${2:-gemini-2.5-pro}"

    if ! command -v gemini >/dev/null 2>&1; then
        log_error "Gemini CLI가 설치되지 않았습니다"
        log_info "설치: npm install -g @google-ai/gemini-cli"
        exit 1
    fi

    # 환경변수 확인 (선택적)
    # 환경변수 확인 (선택적, 프로젝트 루트 기준)
    if [ -f "${PROJECT_ROOT}/.env.local" ]; then
        # shellcheck disable=SC1091
        source "${PROJECT_ROOT}/.env.local" 2>/dev/null || true
    fi

    echo ""
    log_info "🚀 Gemini Wrapper v2.5.0 시작"
    echo ""

    if execute_gemini "$query" "$model"; then
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
