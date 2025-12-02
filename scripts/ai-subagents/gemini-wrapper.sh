#!/bin/bash

# Gemini CLI Wrapper - 600초 타임아웃 + stderr 필터링
# 버전: 3.2.0
# 날짜: 2025-12-02 (mktemp 에러 처리 강화 + 임시파일 생성 검증)

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

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] WARNING: $1" >> "$LOG_FILE"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $1" >> "$LOG_FILE"
}


# 고정 타임아웃 (10분) - Codex/Qwen과 동일하게 통일
TIMEOUT_SECONDS=600

# Gemini 실행 함수
execute_gemini() {
    local query="$1"
    local model="${2:-gemini-2.5-pro}"

    # 1인 개발자 환경 컨텍스트 자동 추가 (Codex와 동일)
    local context="**당신의 관점**: 1인 개발자 실용성 - 보수적이되 대기업 운영 관점(kill-switch, watchdog, idle alarm 등) 불필요. ROI 중심 판단."
    query="$context

$query"

    log_info "🟢 Gemini 실행 중 (모델: $model, 타임아웃 ${TIMEOUT_SECONDS}초 = 10분)..."

    local start_time=$(date +%s)
    local temp_stdout temp_stderr temp_query
    local exit_code=0

    # v3.2.0: mktemp 에러 처리 강화 (Qwen 리뷰 제안 반영)
    if ! temp_stdout=$(mktemp) || ! temp_stderr=$(mktemp) || ! temp_query=$(mktemp); then
        log_error "임시 파일 생성 실패 (디스크 공간 또는 권한 문제)"
        return 1
    fi

    # 함수 종료 시 임시 파일 자동 정리 (인터럽트 포함)
    trap 'rm -f "$temp_stdout" "$temp_stderr" "$temp_query"' RETURN

    # 쿼리를 임시 파일에 저장 (백틱/$()/특수문자 안전하게 처리)
    if ! printf '%s' "$query" > "$temp_query"; then
        log_error "쿼리 파일 저장 실패"
        return 1
    fi

    # Gemini 실행 (stderr 분리) - 임시파일 방식으로 쿼리 전달 (v3.1.0)
    if timeout "${TIMEOUT_SECONDS}s" cat "$temp_query" | gemini --model "$model" > "$temp_stdout" 2> "$temp_stderr"; then
        exit_code=0
    else
        exit_code=$?
    fi

    local end_time=$(date +%s)
    local duration=$((end_time - start_time))

    # stderr 필터링: 무해한 에러 메시지 제거
    local filtered_errors=$(grep -vE "\[ImportProcessor\]|Loaded cached credentials|Got it|Attempt .* failed:" "$temp_stderr" 2>/dev/null || true)

    if [ $exit_code -eq 0 ]; then
        local gemini_output=$(cat "$temp_stdout")

        # 실제 출력이 있는지 확인 (공백 제거 후)
        if [ -n "$(echo "$gemini_output" | tr -d '[:space:]')" ]; then
            log_success "Gemini 실행 성공 (${duration}초)"
            echo "[$(date '+%Y-%m-%d %H:%M:%S')] DURATION: ${duration}s" >> "$LOG_FILE"

            # stderr에 실제 에러가 있으면 경고 (무해한 메시지 제외)
            if [ -n "$filtered_errors" ]; then
                log_warning "stderr 경고 메시지 발견"
                echo "[$(date '+%Y-%m-%d %H:%M:%S')] STDERR: $filtered_errors" >> "$LOG_FILE"
            fi

            # 결과 출력
            echo "$gemini_output"
            return 0
        else
            log_error "Gemini가 빈 응답을 반환했습니다"
            return 1
        fi
    elif [ $exit_code -eq 124 ]; then
        log_error "Gemini 타임아웃 (${TIMEOUT_SECONDS}초 = 10분 초과)"
        echo ""
        echo -e "${YELLOW}💡 타임아웃 해결 방법:${NC}"
        echo "  1️⃣  질문을 더 작은 단위로 분할하세요"
        echo "  2️⃣  질문을 더 간결하게 만드세요"
        echo "  3️⃣  핵심 부분만 먼저 질문하세요"
        echo ""
        return 124
    else
        log_error "Gemini 실행 오류 (종료 코드: $exit_code)"

        # stderr가 있으면 출력
        if [ -s "$temp_stderr" ]; then
            echo -e "${RED}stderr 내용:${NC}" >&2
            cat "$temp_stderr" >&2
        fi

        return $exit_code
    fi
}

# 도움말
usage() {
    cat << EOF
${CYAN}🟢 Gemini CLI Wrapper v3.2.0 - Claude Code 내부 도구${NC}

${YELLOW}⚠️  이 스크립트는 Claude Code가 제어하는 내부 도구입니다${NC}
${YELLOW}   사용자는 직접 실행하지 않고, 서브에이전트를 통해 사용합니다${NC}

사용 방법:
  ${GREEN}사용자${NC}: "이 코드 Gemini한테 물어봐줘"
  ${GREEN}Claude${NC}: 이 wrapper를 자동 실행

직접 실행 (디버깅/테스트 전용):
  $0 "쿼리 내용" [모델]

예시 (디버깅):
  $0 "간단한 질문: 2+2는?"
  $0 "이 TypeScript 코드를 분석하고 개선점 3가지를 제시해주세요."
  $0 "아키텍처 검토" gemini-2.5-flash

특징:
  ✅ 고정 타임아웃: 600초 (10분) - Codex와 동일
  ✅ stderr 분리 + 필터링 (ImportProcessor 에러 무시)
  ✅ 공백 응답 자동 감지
  ✅ mktemp + trap (안전한 임시 파일 관리)
  ✅ 1인 개발자 컨텍스트 자동 추가
  ✅ 재시도 없음 (자원 낭비 방지)
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
    log_info "🚀 Gemini Wrapper v3.2.0 시작"
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
