#!/bin/bash

# Qwen CLI Wrapper - YOLO Mode + stderr 필터링
# 버전: 3.2.0
# 날짜: 2025-12-02 (temp_stdout unbound variable 버그 수정)

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
LOG_FILE="$LOG_DIR/qwen-perf-$(date +%F).log"
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

log_error() {
    echo -e "${RED}❌ $1${NC}" >&2
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $1" >> "$LOG_FILE"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}" >&2
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] WARNING: $1" >> "$LOG_FILE"
}


# 고정 타임아웃 (10분)
TIMEOUT_SECONDS=600

# 전역 임시 파일 변수 (EXIT trap에서 접근 필요)
QWEN_TEMP_STDOUT=""
QWEN_TEMP_STDERR=""

# 임시 파일 정리 함수 (trap에서 호출)
cleanup_temp_files() {
    rm -f "${QWEN_TEMP_STDOUT:-}" "${QWEN_TEMP_STDERR:-}" 2>/dev/null || true
}

# EXIT trap 설정 (스크립트 종료 시 임시 파일 정리)
trap cleanup_temp_files EXIT

# Qwen 실행 함수
execute_qwen() {
    local query="$1"
    
    # Comprehensive Reviewer Context (v3.3.0)
    # v3.3.0: 1인 개발자 제약 제거 -> 포괄적 리뷰어 관점 적용
    local context="**당신의 관점**: Senior Full-Stack Developer & Architect.
    - **목표**: 코드의 품질, 안정성, 보안, 성능을 타협 없이 검증.
    - **범위**: 1인 개발자 관점에 국한되지 않고, 확장성과 유지보수성까지 고려한 '전반적인(Overall)' 리뷰 수행."
    query="$context

$query"
    
    log_info "⚙️  Qwen YOLO Mode 실행 중 (타임아웃 ${TIMEOUT_SECONDS}초 = 10분)..."

    local start_time=$(date +%s)
    local exit_code=0

    # v3.2.0: 전역 변수 사용으로 EXIT trap에서 접근 가능
    if ! QWEN_TEMP_STDOUT=$(mktemp) || ! QWEN_TEMP_STDERR=$(mktemp); then
        log_error "임시 파일 생성 실패 (디스크 공간 또는 권한 문제)"
        return 1
    fi

    # YOLO Mode: 모든 도구 자동 승인, 완전 무인 동작 (stderr 분리)
    if timeout "${TIMEOUT_SECONDS}s" qwen --approval-mode yolo -p "$query" > "$QWEN_TEMP_STDOUT" 2> "$QWEN_TEMP_STDERR"; then
        exit_code=0
    else
        exit_code=$?
    fi

    local end_time=$(date +%s)
    local duration=$((end_time - start_time))

    # stderr 필터링 (Qwen은 현재 무해한 에러 없음, 향후 대비)
    local filtered_errors=$(cat "$QWEN_TEMP_STDERR" 2>/dev/null || true)

    if [ $exit_code -eq 0 ]; then
        local qwen_output=$(cat "$QWEN_TEMP_STDOUT")

        # 실제 출력이 있는지 확인 (공백 제거 후)
        if [ -n "$(echo "$qwen_output" | tr -d '[:space:]')" ]; then
            log_success "Qwen 실행 성공 (${duration}초)"
            echo "[$(date '+%Y-%m-%d %H:%M:%S')] MODE: YOLO, DURATION: ${duration}s" >> "$LOG_FILE"

            # stderr에 실제 에러가 있으면 경고
            if [ -n "$filtered_errors" ]; then
                log_warning "stderr 경고 메시지 발견"
                echo "[$(date '+%Y-%m-%d %H:%M:%S')] STDERR: $filtered_errors" >> "$LOG_FILE"
            fi

            # Auto-logging to Decision Log (Phase 1)

            echo "$qwen_output"
            return 0
        else
            log_error "Qwen이 빈 응답을 반환했습니다"
            return 1
        fi
    elif [ $exit_code -eq 124 ]; then
        log_error "Qwen 타임아웃 (${TIMEOUT_SECONDS}초 = 10분 초과)"
        echo "" >&2
        echo -e "${YELLOW}💡 타임아웃 해결 방법:${NC}" >&2
        echo "  1️⃣  질문을 더 작은 단위로 분할하세요" >&2
        echo "  2️⃣  질문을 더 간결하게 만드세요" >&2
        echo "  3️⃣  핵심 부분만 먼저 질문하세요" >&2
        echo "" >&2
        return 124
    else
        log_error "Qwen 실행 오류 (종료 코드: $exit_code)"

        # stderr가 있으면 출력
        if [ -s "$QWEN_TEMP_STDERR" ]; then
            echo -e "${RED}stderr 내용:${NC}" >&2
            cat "$QWEN_TEMP_STDERR" >&2
        fi

        return $exit_code
    fi
}

# 도움말
usage() {
    cat << EOF
${CYAN}🟡 Qwen CLI Wrapper v3.2.0 - Claude Code 내부 도구${NC}

${YELLOW}⚠️  이 스크립트는 Claude Code가 제어하는 내부 도구입니다${NC}
${YELLOW}   사용자는 직접 실행하지 않고, 서브에이전트를 통해 사용합니다${NC}

${RED}🚨 YOLO Mode 보안 경고:${NC}
${RED}   - 모든 도구 호출을 자동 승인 (--approval-mode yolo)${NC}
${RED}   - 읽기 전용 분석 작업에만 안전${NC}
${RED}   - 파일 수정/삭제 작업 시 주의 필요${NC}
${RED}   - 신뢰할 수 없는 입력에 사용 금지${NC}

사용 방법:
  ${GREEN}사용자${NC}: "성능 최적화를 AI 교차검증해줘"
  ${GREEN}Claude${NC}: Task multi-ai-verification-specialist 호출
  ${GREEN}서브에이전트${NC}: 이 wrapper를 자동 실행

직접 실행 (디버깅/테스트 전용):
  $0 "쿼리 내용"              # Plan Mode (기본값, 승인 불필요)

옵션:
  -h    도움말 표시

예시 (디버깅):
  $0 "성능 병목점 분석"
  $0 "복잡한 리팩토링 계획"
  $0 "알고리즘 최적화 방안"

특징 (v3.1.0):
  🚀 YOLO Mode (--approval-mode yolo) - 완전 무인 동작
  🚨 보안 경고 강화 (읽기 전용 분석에만 안전)
  ✅ stdout/stderr 완전 분리 (파이프라인 호환성)
  ✅ mktemp 에러 처리 강화 (디스크/권한 문제 감지)
  ✅ trap EXIT 사용 (비정상 종료 시에도 정리)
  ✅ 공백 응답 자동 감지
  ✅ 1인 개발자 컨텍스트 자동 추가
  ✅ 환경변수 로딩 표준화 (.env.local)
  ✅ 고정 타임아웃: 600초 (10분)
  ✅ 재시도 없음 (자원 낭비 방지)
  ✅ 타임아웃 시 분할/간소화 제안
  ✅ 성능 로깅 ($LOG_FILE)

v2.5.0 개선 사항:
  🚨 보안 경고 추가: YOLO Mode 위험성 명시
  ✅ 환경변수 로딩: 다른 wrapper와 동일 패턴
  📋 버전 라벨 통일: v2.5.0 (Codex/Gemini와 동기화)

v2.3.0 이전 성과:
  🚀 YOLO Mode 채택: 완전 무인 동작 (Plan Mode 블로킹 해결)
  ⏱️  타임아웃 600초: 복잡한 분석 대응 (TypeScript 타입 시스템 등)
  ✅ 간단한 쿼리: 24초 → 16초 (33% 개선)
  ✅ 복잡한 React 쿼리: 111초 → 108초
  ✅ 복잡한 TypeScript 쿼리: 300초+ 타임아웃 → 121초 성공

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
    local query=""

    # 파라미터 파싱
    while getopts "hp" opt; do
        case $opt in
            h)
                usage
                ;;
            p)
                # -p 옵션은 무시 (v2.3.0에서는 항상 plan mode)
                # 하위 호환성을 위해 허용만 함
                ;;
            \?)
                echo "잘못된 옵션: -${OPTARG:-unknown}" >&2
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

    # 환경변수 확인 (선택적)
    # 환경변수 확인 (선택적, 프로젝트 루트 기준)
    if [ -f "${PROJECT_ROOT}/.env.local" ]; then
        # shellcheck disable=SC1091
        source "${PROJECT_ROOT}/.env.local" 2>/dev/null || true
    fi

    echo "" >&2
    log_info "🚀 Qwen Wrapper v3.1.0 시작"
    echo "" >&2

    if execute_qwen "$query"; then
        echo "" >&2
        log_success "✅ 완료"
        exit 0
    else
        echo "" >&2
        log_error "❌ 실패"
        exit 1
    fi
}

main "$@"
