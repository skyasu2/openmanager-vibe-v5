#!/bin/bash

# Codex CLI Wrapper - 600초 타임아웃 + stderr 필터링
# 버전: 3.4.0
# 날짜: 2026-01-07 (2-AI 시스템 적용)
#
# v3.4.0 (2026-01-07): 2-AI 시스템 (codex ↔ gemini) 문서 업데이트

set -euo pipefail

# 프로젝트 루트 자동 결정 (포터블)
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

# npm global bin 경로 추가 (WSL에서 codex/gemini 찾기 위함)
export PATH="$PATH:$(npm prefix -g)/bin"

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

# 로그 함수 (모두 stderr로 출력 - stdout은 AI 응답 전용)
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}" >&2
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] INFO: $1" >> "$LOG_FILE"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}" >&2
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] SUCCESS: $1" >> "$LOG_FILE"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}" >&2
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] WARNING: $1" >> "$LOG_FILE"
}

log_error() {
    echo -e "${RED}❌ $1${NC}" >&2
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $1" >> "$LOG_FILE"
}


# 고정 타임아웃 (10분) - 복잡한 코드 분석 대응
TIMEOUT_SECONDS=600

# 전역 임시 파일 변수 (EXIT trap에서 접근 필요)
CODEX_TEMP_STDOUT=""
CODEX_TEMP_STDERR=""

# 임시 파일 정리 함수 (trap에서 호출)
cleanup_temp_files() {
    rm -f "${CODEX_TEMP_STDOUT:-}" "${CODEX_TEMP_STDERR:-}" 2>/dev/null || true
}

# EXIT trap 설정 (스크립트 종료 시 임시 파일 정리)
trap cleanup_temp_files EXIT

# Codex 실행 함수
execute_codex() {
    local query="$1"

    # v4.0.0: AGENTS.md에서 Identity 로드 (동적 페르소나)
    local identity_file="${PROJECT_ROOT}/AGENTS.md"
    local identity_content=""
    
    if [ -f "$identity_file" ]; then
        identity_content=$(cat "$identity_file")
    else
        # Fallback Identity
        identity_content="You are a Senior Full-Stack Developer."
    fi

    # 쿼리와 결합 (Identity + User Query)
    # 리뷰 스크립트에서 호출 시 "Review Mode" 관련 프롬프트가 query에 포함되어 들어옴
    query="[System Configuration]
$identity_content

[User Request]
$query"

    log_info "🤖 Codex 실행 중 (타임아웃 ${TIMEOUT_SECONDS}초 = 10분)..."

    local start_time=$(date +%s)
    local exit_code=0

    # v3.2.0: 전역 변수 사용으로 EXIT trap에서 접근 가능
    if ! CODEX_TEMP_STDOUT=$(mktemp) || ! CODEX_TEMP_STDERR=$(mktemp); then
        log_error "임시 파일 생성 실패 (디스크 공간 또는 권한 문제)"
        return 1
    fi

    # Codex 실행 (stderr 분리)
    if timeout "${TIMEOUT_SECONDS}s" codex exec "$query" > "$CODEX_TEMP_STDOUT" 2> "$CODEX_TEMP_STDERR"; then
        exit_code=0
    else
        exit_code=$?
    fi

    local end_time=$(date +%s)
    local duration=$((end_time - start_time))

    # stderr 필터링 (Codex는 현재 무해한 에러 없음, 향후 대비)
    local filtered_errors=$(cat "$CODEX_TEMP_STDERR" 2>/dev/null || true)

    # 결과 분석
    if [ $exit_code -eq 0 ]; then
        local codex_output=$(cat "$CODEX_TEMP_STDOUT")

        # 실제 출력이 있는지 확인 (공백 제거 후)
        if [ -n "$(echo "$codex_output" | tr -d '[:space:]')" ]; then
            log_success "Codex 실행 성공 (${duration}초)"

            # 토큰 사용량 추출
            local tokens_used=$(echo "$codex_output" | grep "tokens used:" | tail -1 | sed 's/.*tokens used: //' | tr -d ',')
            if [ -n "$tokens_used" ]; then
                log_info "📊 토큰 사용: $tokens_used"
                echo "[$(date '+%Y-%m-%d %H:%M:%S')] TOKENS: $tokens_used, DURATION: ${duration}s" >> "$LOG_FILE"
            fi

            # stderr에 실제 에러가 있으면 경고
            if [ -n "$filtered_errors" ]; then
                log_warning "stderr 경고 메시지 발견"
                echo "[$(date '+%Y-%m-%d %H:%M:%S')] STDERR: $filtered_errors" >> "$LOG_FILE"
            fi

            # Auto-logging to Decision Log (Phase 1)

            # 결과 출력
            echo "$codex_output"
            return 0
        else
            log_error "Codex가 빈 응답을 반환했습니다"
            return 1
        fi
    elif [ $exit_code -eq 124 ]; then
        log_error "Codex 타임아웃 (${TIMEOUT_SECONDS}초 = 10분 초과)"
        echo "" >&2
        echo -e "${YELLOW}💡 타임아웃 해결 방법:${NC}" >&2
        echo "  1️⃣  질문을 더 작은 단위로 분할하세요" >&2
        echo "  2️⃣  질문을 더 간결하게 만드세요" >&2
        echo "  3️⃣  핵심 부분만 먼저 질문하세요" >&2
        echo "" >&2
        return 124
    else
        log_error "Codex 실행 오류 (종료 코드: $exit_code)"

        # stderr가 있으면 출력
        if [ -s "$CODEX_TEMP_STDERR" ]; then
            echo -e "${RED}stderr 내용:${NC}" >&2
            cat "$CODEX_TEMP_STDERR" >&2
        fi

        return $exit_code
    fi
}

# 도움말
usage() {
    cat << EOF
${CYAN}🤖 Codex CLI Wrapper v3.4.0 - Claude Code 내부 도구${NC}

${YELLOW}⚠️  이 스크립트는 AI 교차검증 시스템의 내부 도구입니다${NC}
${YELLOW}   직접 실행보다 auto-ai-review.sh 또는 Skill ai-code-review 사용을 권장합니다${NC}

사용 방법:
  ${GREEN}사용자${NC}: "코드 리뷰해줘" 또는 "Skill ai-code-review"
  ${GREEN}auto-ai-review.sh${NC}: 이 wrapper를 자동 실행 (2-AI 순환: codex ↔ gemini)

직접 실행 (디버깅/테스트 전용):
  $0 "쿼리 내용"

예시 (디버깅):
  $0 "간단한 질문: 2+2는?"
  $0 "이 TypeScript 코드를 분석하고 개선점 3가지를 제시해주세요."

특징:
  ✅ 고정 타임아웃: 600초 (10분) - Gemini와 동일
  ✅ stderr 분리 + 필터링 (향후 대비)
  ✅ 공백 응답 자동 감지
  ✅ mktemp + trap (안전한 임시 파일 관리)
  ✅ Senior Full-Stack Developer 컨텍스트 자동 추가
  ✅ 재시도 없음 (자원 낭비 방지)
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
    echo "" >&2
    log_info "🚀 Codex Wrapper v3.4.0 시작"
    echo "" >&2

    if execute_codex "$query"; then
        echo "" >&2
        log_success "✅ 완료"
        exit 0
    else
        echo "" >&2
        log_error "❌ 실패"
        exit 1
    fi
}

# 실행
main "$@"
