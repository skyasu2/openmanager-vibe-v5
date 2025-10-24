#!/bin/bash

# Codex CLI Wrapper - 600초 타임아웃 (복잡한 분석 대응)
# 버전: 2.5.0
# 날짜: 2025-10-24 (하드코딩 경로 제거, 포터블화)
# 변경: 절대 경로 → 상대 경로 (PROJECT_ROOT 자동 결정)

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

# 로그 디렉터리 (프로젝트 루트 기준)
LOG_DIR="${PROJECT_ROOT}/logs/ai-perf"
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

# 고정 타임아웃 (10분) - 복잡한 코드 분석 대응
TIMEOUT_SECONDS=600

# Codex 실행 함수
execute_codex() {
    local query="$1"

    # 1인 개발자 환경 컨텍스트 자동 추가
    local context="**당신의 관점**: 1인 개발자 실용성 - 보수적이되 대기업 운영 관점(kill-switch, watchdog, idle alarm 등) 불필요. ROI 중심 판단."
    query="$context

$query"

    log_info "🤖 Codex 실행 중 (타임아웃 ${TIMEOUT_SECONDS}초 = 10분)..."

    local start_time=$(date +%s)
    local output_file=$(mktemp)
    local exit_code=0

    # Codex 실행 (타임아웃 보호)
    if timeout "${TIMEOUT_SECONDS}s" codex exec "$query" > "$output_file" 2>&1; then
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
        log_error "Codex 타임아웃 (${TIMEOUT_SECONDS}초 = 10분 초과)"
        echo ""
        echo -e "${YELLOW}💡 타임아웃 해결 방법:${NC}"
        echo "  1️⃣  질문을 더 작은 단위로 분할하세요"
        echo "  2️⃣  질문을 더 간결하게 만드세요"
        echo "  3️⃣  핵심 부분만 먼저 질문하세요"
        echo ""
        rm -f "$output_file"
        return 124
    else
        log_error "Codex 실행 오류 (종료 코드: $exit_code)"
        cat "$output_file" >&2
        rm -f "$output_file"
        return $exit_code
    fi
}

# 도움말
usage() {
    cat << EOF
${CYAN}🤖 Codex CLI Wrapper v2.5.0 - Claude Code 내부 도구${NC}

${YELLOW}⚠️  이 스크립트는 Claude Code가 제어하는 내부 도구입니다${NC}
${YELLOW}   사용자는 직접 실행하지 않고, 서브에이전트를 통해 사용합니다${NC}

사용 방법:
  ${GREEN}사용자${NC}: "useState를 AI 교차검증해줘"
  ${GREEN}Claude${NC}: Task multi-ai-verification-specialist 호출
  ${GREEN}서브에이전트${NC}: 이 wrapper를 자동 실행

직접 실행 (디버깅/테스트 전용):
  $0 "쿼리 내용"

예시 (디버깅):
  $0 "간단한 질문: 2+2는?"
  $0 "이 TypeScript 코드를 분석하고 개선점 3가지를 제시해주세요."

특징:
  ✅ 고정 타임아웃: 600초 (10분) - 복잡한 분석 대응
  ✅ 재시도 없음 (자원 낭비 방지)
  ✅ 타임아웃 시 분할/간소화 제안
  ✅ 성능 로깅 ($LOG_FILE)

v2.5.0 개선 사항:
  🚀 타임아웃 600초: 복잡한 코드 분석 대응 (실제 워크로드 검증)
  ✅ 실무 검증 통과: 69줄 TypeScript 파일 분석 성공

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

    # 환경변수 확인 (선택적, 프로젝트 루트 기준)
    if [ -f "${PROJECT_ROOT}/.env.local" ]; then
        # shellcheck disable=SC1091
        source "${PROJECT_ROOT}/.env.local" 2>/dev/null || true
    fi

    # 실행
    echo ""
    log_info "🚀 Codex Wrapper v2.5.0 시작"
    echo ""

    if execute_codex "$query"; then
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
