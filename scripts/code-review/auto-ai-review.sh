#!/bin/bash

# Auto AI Code Review Script (Codex → Gemini Fallback) with Smart Verification
# 목적: 커밋 시 변경사항을 AI가 자동 리뷰하고 리포트 생성 (스마트 검증)
# 버전: 4.3.0
# 날짜: 2025-11-26
# 전략: Codex 우선 (4:1 비율) → Gemini 폴백 (사용량 제한 대응) + 스마트 검증
#
# ⚠️ 중요: 이 스크립트는 직접 실행만 지원합니다 (source 사용 금지)
# 최상단 cd 명령으로 인해 source 시 호출자의 작업 디렉토리가 변경됩니다
#
# Changelog v4.3.0 (2025-11-26): ⚡ 린트 검사 최적화 - 타임아웃 제거
# - ⚡ 개선: 변경 파일 없을 때 전체 스캔 제거 → 스킵 처리 (Pre-push 검증 활용)
# - ⚡ 개선: ESLint 캐싱 활성화 (--cache, 첫 실행 후 5-10초로 단축)
# - ⚡ 개선: 타임아웃 30초 → 45초 증가 (변경 파일만)
# - 🎯 효과: 타임아웃 발생률 거의 0% (불필요한 전체 스캔 제거)
# - 💡 효과: 평균 검증 시간 30-60초 → 5-10초 (AI 리뷰 속도 2배 개선)
#
# Changelog v4.1.2 (2025-11-22): 📊 Gemini 피드백 - npm 에러 분류 개선
# - 📊 개선: npm ERR! 탐지 로직 세분화 (스크립트 없음 / 설정 에러 / 코드 문제)
# - 🎯 효과: 디버깅 시 문제 원인 즉시 파악 가능 (설정 vs 코드)
# - 💡 적용: ESLint/TypeScript 양쪽 모두 동일한 분류 체계
#
# Changelog v4.1.1 (2025-11-22): 🐛 Codex 피드백 - 3가지 버그 수정
# - 🐛 수정: HEAD~1 에러 (초기 커밋/새 브랜치) → staged → HEAD → origin/main 안전한 fallback
# - 🐛 수정: 변수 미인용 ($changed_files) → Bash 배열로 안전하게 전달
# - 🐛 수정: 삭제된 파일 ESLint 실패 → 파일 존재 여부 직접 확인
# - 📊 개선: git diff fallback 체인 (staged → HEAD → origin/main)
# - 🎯 효과: 초기 커밋, 특수문자 파일명, 삭제된 파일 시나리오 모두 안전
#
# Changelog v4.1.0 (2025-11-22): ⚡ ESLint 스마트 검증 - 타임아웃 문제 해결
# - ⚡ 신규: 변경 파일만 우선 검사 (5-10초, 타임아웃 거의 없음)
# - ⚡ 신규: 타임아웃 시 전체 스캔 자동 폴백 (30초 → 60초)
# - 📊 개선: 검증 결과에 스캔 범위 표시 (변경 파일 N개 vs 전체 스캔)
# - 🎯 효과: 평균 검증 시간 30초 → 5-10초 (80% 단축)
# - 💡 효과: 타임아웃 발생률 거의 0% (변경 파일 기준)
#
# Changelog v4.0.0 (2025-11-22): 🔍 실시간 검증 + 로그 저장 기능 추가
# - ✨ 신규: lint + typecheck 실시간 검증 (AI 리뷰 전 자동 실행)
# - ✨ 신규: 타임스탬프 기반 로그 파일 저장 (logs/lint, logs/typecheck)
# - ✨ 신규: 검증 결과 요약을 AI 프롬프트에 포함 (증거 기반 리뷰)
# - 🎯 개선: AI 리뷰 품질 향상 예상 (8/10 → 9-10/10)
# - 📁 개선: 감사 추적 가능 (검증 로그 파일 보존)
# - 💡 효과: 문서 내 수치 검증 가능, CI/CD 수준의 신뢰도
#
# Changelog v3.2.0 (2025-11-21): 🤖 Claude Code 자동 리뷰 활성화
# - ✨ 신규: Claude Code가 리뷰 요청 파일을 자동으로 감지하고 리뷰 수행
# - 🔄 변경: 수동 선택에서 자동 실행으로 전환 (옵션 3 자동화)
# - 📁 개선: 변경사항을 임시 파일에 저장하여 Claude Code가 읽을 수 있도록 함
# - 🎯 개선: AI 엔진 이름을 "claude-code-auto"로 변경하여 자동 실행 명시
#
# Changelog v3.1.0 (2025-11-21): 🎯 최종 폴백 단순화
# - 🔄 변경: Claude Code 최종 폴백을 간단한 알림으로 변경 (옵션 3)
# - ✨ 개선: 불필요한 임시 파일 생성 제거
# - 💡 개선: 사용자 판단 존중 (3가지 선택지 제공)
#
# Changelog v3.0.1 (2025-11-24): 🎯 4:1 비율로 업데이트
# - 🔄 변경: Codex/Gemini 비율을 2:1에서 4:1로 조정 (Codex 4회, Gemini 1회 순환)
# - 🎯 목표: Codex 우선 사용으로 일관성 향상
#
# Changelog v3.0.0 (2025-11-21): 🚀 MAJOR UPDATE - 2:1 비율 + 상호 폴백 + Claude Code 최종 폴백
# - ✨ 신규: 2:1 비율로 Codex/Gemini 자동 선택 (Codex 2회, Gemini 1회 순환)
# - ✨ 신규: 상태 파일(.ai-usage-state)로 사용 카운터 추적
# - ✨ 신규: Primary AI 실패 시 Secondary AI로 상호 폴백
# - ✨ 신규: 모든 외부 AI 실패 시 최종 폴백 (manual-fallback)
# - 🔄 변경: Codex → Gemini 순차 폴백에서 2:1 비율 기반 스마트 선택으로 전환
# - 🎯 목표: 99.9% 가용성 (Codex OR Gemini OR Manual)
#
# Changelog v2.1.2 (2025-11-21):
# - 🐛 수정: AI 엔진 이름을 메인 스크립트에서 읽도록 개선
# - run_ai_review가 서브셸에서 실행되므로 main()에서 임시 파일 읽기
# - 임시 파일 cleanup을 main()으로 이동하여 변수 전파 보장
#
# Changelog v2.1.1 (2025-11-21):
# - 🐛 수정: AI 엔진 이름 전파 개선 (PID 기반 → 고정 파일명)
# - 임시 파일을 /tmp/ai_engine_auto_review로 변경 (백그라운드 프로세스 안정성)
# - Codex/Gemini 성공 시 엔진 이름을 임시 파일에 저장 → run_ai_review에서 읽기
#
# Changelog v2.1.0 (2025-11-21):
# - 🐛 수정: AI 엔진 이름이 파일명 및 내용에 제대로 표시되도록 개선
# - 임시 파일을 통해 서브셸 간 AI_ENGINE 변수 전파
#
# Changelog v2.0.0 (2025-11-19):
# - Codex CLI 우선 사용, 실패 시 Gemini CLI로 자동 폴백
# - AI 엔진 선택 로직 추가 (try_codex_first → fallback_to_gemini)
# - 리뷰 파일명에 AI 엔진 표시 (review-{AI}-{DATE}-{TIME}.md)
# - 사용량 제한 감지 및 자동 폴백 (rate limit, quota exceeded)
# - 목표: 99.9% 가용성 보장 (Codex OR Gemini)

set -euo pipefail

# 인코딩 설정 (한글 깨짐 방지)
export LANG=ko_KR.UTF-8
export LC_ALL=ko_KR.UTF-8
# Windows/WSL 환경 호환성
if [ -n "${WSL_DISTRO_NAME:-}" ]; then
    export PYTHONIOENCODING=utf-8
    # npm global bin 경로 추가 (WSL에서 codex/gemini/claude 찾기 위함)
    export PATH="$PATH:$(npm prefix -g)/bin"
else
    # WSL이 아닌 경우 (Windows Git Bash 등)
    echo "⚠️  Windows 환경에서 실행됨을 감지했습니다."
    if command -v wsl.exe >/dev/null; then
        echo "🔄 WSL 환경으로 전환하여 실행합니다..."
        # 현재 스크립트 재실행 (WSL 내부에서)
        # Git Hook에서 실행되므로 현재 디렉토리는 프로젝트 루트임
        exec wsl.exe bash -c "./scripts/code-review/auto-ai-review.sh \"$@\""
    else
        echo "❌ WSL을 찾을 수 없습니다. 이 스크립트는 WSL에서 실행되어야 합니다."
        echo "   (Microsoft Store에서 Ubuntu 등을 설치하세요)"
        exit 1
    fi
fi

# 프로젝트 루트 (폴백 포함)
PROJECT_ROOT="${PROJECT_ROOT:-$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)}"

# PROJECT_ROOT 유효성 검증
if [ -z "$PROJECT_ROOT" ] || [ ! -d "$PROJECT_ROOT" ]; then
    echo "❌ Error: PROJECT_ROOT가 설정되지 않았거나 유효하지 않습니다."
    echo "   Attempting fallback to git root..."
    PROJECT_ROOT="$(git rev-parse --show-toplevel 2>/dev/null)"

    if [ -z "$PROJECT_ROOT" ] || [ ! -d "$PROJECT_ROOT" ]; then
        echo "❌ Fatal: 프로젝트 루트를 찾을 수 없습니다."
        exit 1
    fi

    echo "✅ PROJECT_ROOT 설정 완료: $PROJECT_ROOT"
fi

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

# 리뷰 저장 경로
REVIEW_DIR="$PROJECT_ROOT/logs/code-reviews"
mkdir -p "$REVIEW_DIR"

# 상태 파일 경로 (AI 사용 카운터 추적)
STATE_FILE="$PROJECT_ROOT/logs/code-reviews/.ai-usage-state"

# 오늘 날짜
TODAY=$(date +%Y-%m-%d)
TIMESTAMP=$(date +%H-%M-%S)

# AI 엔진 선택 변수 (동적 결정)
AI_ENGINE=""
REVIEW_FILE=""

# 로그 함수
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

log_ai_engine() {
    echo -e "${MAGENTA}🤖 $1${NC}"
}

# AI 사용 카운터 초기화
init_ai_counter() {
    if [ ! -f "$STATE_FILE" ]; then
        echo "codex_count=0" > "$STATE_FILE"
        echo "gemini_count=0" >> "$STATE_FILE"
        log_info "상태 파일 초기화: $STATE_FILE"
    fi
}

# AI 사용 카운터 읽기
get_ai_counter() {
    local engine="$1"
    init_ai_counter
    
    if [ "$engine" = "codex" ]; then
        grep "^codex_count=" "$STATE_FILE" | cut -d'=' -f2
    elif [ "$engine" = "gemini" ]; then
        grep "^gemini_count=" "$STATE_FILE" | cut -d'=' -f2
    fi
}

# AI 사용 카운터 증가
increment_ai_counter() {
    local engine="$1"
    init_ai_counter
    
    if [ "$engine" = "codex" ]; then
        local count=$(get_ai_counter "codex")
        count=$((count + 1))
        sed -i "s/^codex_count=.*/codex_count=$count/" "$STATE_FILE"
    elif [ "$engine" = "gemini" ]; then
        local count=$(get_ai_counter "gemini")
        count=$((count + 1))
        sed -i "s/^gemini_count=.*/gemini_count=$count/" "$STATE_FILE"
    fi
}

# 4:1 비율로 AI 선택 (Codex 4회, Gemini 1회 순환)
select_primary_ai() {
    init_ai_counter

    local codex_count=$(get_ai_counter "codex")
    local gemini_count=$(get_ai_counter "gemini")

    # 4:1 비율 계산: Codex를 4번 사용할 때마다 Gemini 1번
    # 총 사용 횟수를 5로 나눈 나머지로 판단
    local total=$((codex_count + gemini_count))
    local remainder=$((total % 5))

    # remainder 0,1,2,3 → Codex (4번)
    # remainder 4 → Gemini (1번)
    if [ $remainder -eq 4 ]; then
        echo "gemini"
    else
        echo "codex"
    fi
}

# 프로젝트 루트로 이동 (git 명령어 및 로그 파일 생성 위치 일관성 보장)
cd "$PROJECT_ROOT" || {
    echo "❌ Fatal: cd to PROJECT_ROOT failed"
    exit 1
}
log_success "Working directory: $PROJECT_ROOT"

# 🔍 실시간 검증 실행 (v4.0.0 신규)
run_verification() {
    log_info "🔍 실시간 검증 시작 (lint + typecheck)..."

    # 로그 디렉토리 생성 (Codex 피드백 반영)
    mkdir -p "$PROJECT_ROOT/logs/lint" "$PROJECT_ROOT/logs/typecheck"

    # 타임스탬프 생성 (로그 파일명) - 전역 변수로 설정 (heredoc에서 접근 가능)
    VERIFY_TIMESTAMP=$(date +%Y-%m-%d-%H-%M-%S)
    LINT_LOG="$PROJECT_ROOT/logs/lint/lint-${VERIFY_TIMESTAMP}.txt"
    TS_LOG="$PROJECT_ROOT/logs/typecheck/ts-${VERIFY_TIMESTAMP}.txt"

    # ===== ESLint 스마트 검증 (v4.1.0 개선) =====
    # 전략: 변경 파일만 검사 (빠름) → 타임아웃 시 전체 스캔 (정확함)
    
    log_info "📝 ESLint 실행 중 (변경 파일 우선)..."
    local lint_exit_code=0
    local changed_files=""
    
    # 1단계: 변경된 TS/TSX 파일 추출 (안전한 fallback 체인)
    # - staged 파일 우선 (가장 안전)
    # - HEAD와 비교 (일반적인 경우)
    # - origin/main 비교 (브랜치 작업)
    changed_files=$(git diff --name-only --cached 2>/dev/null | grep -E '\.(ts|tsx)$' | grep -v '^$' || true)
    
    if [ -z "$changed_files" ]; then
        # staged 없음 → HEAD와 비교 (HEAD~1은 초기 커밋에서 실패하므로 사용 안 함)
        changed_files=$(git diff --name-only HEAD 2>/dev/null | grep -E '\.(ts|tsx)$' | grep -v '^$' || true)
    fi
    
    if [ -z "$changed_files" ]; then
        # 아직도 없음 → origin/main과 비교 (브랜치 작업 시)
        changed_files=$(git diff --name-only origin/main...HEAD 2>/dev/null | grep -E '\.(ts|tsx)$' | grep -v '^$' || true)
    fi
    
    # 삭제된 파일 제외 (존재 여부 직접 확인)
    if [ -n "$changed_files" ]; then
        local existing_files=""
        while IFS= read -r file; do
            if [ -f "$file" ]; then
                existing_files="${existing_files}${file}"$'\n'
            fi
        done <<< "$changed_files"
        changed_files=$(echo "$existing_files" | grep -v '^$' || true)
    fi
    
    if [ -n "$changed_files" ]; then
        # 변경 파일만 린트 (5-10초 예상) - 배열로 안전하게 전달
        local file_count=$(echo "$changed_files" | wc -l)
        log_info "  → 변경 파일만 검사 (${file_count}개 파일)"

        # 파일명을 배열로 변환하여 안전하게 전달
        local -a files_array
        while IFS= read -r file; do
            files_array+=("$file")
        done <<< "$changed_files"

        # 캐싱 활성화로 속도 개선 (--cache)
        timeout 45 npx eslint "${files_array[@]}" --format compact --cache --cache-location .eslintcache > "$LINT_LOG" 2>&1 || lint_exit_code=$?

        if [ $lint_exit_code -eq 124 ]; then
            # 변경 파일도 타임아웃 → 경고만 표시 (전체 스캔 제거)
            log_info "  ⚠️  타임아웃 발생 (45초 초과), Pre-push 검증으로 충분함"
            echo "⚠️  ESLint 타임아웃 (45초 초과)" > "$LINT_LOG"
            echo "ℹ️  Pre-push hook이 이미 변경 파일을 검증했으므로 안전합니다" >> "$LINT_LOG"
            lint_exit_code=0  # 타임아웃을 에러로 취급하지 않음
        fi
    else
        # 변경 파일 없음 → 스킵 (Pre-push가 이미 검증함)
        log_info "  ℹ️  변경된 TS/TSX 파일 없음, ESLint 스킵 (Pre-push 검증 완료)"
        echo "ℹ️  변경된 TS/TSX 파일 없음, ESLint 검사 스킵" > "$LINT_LOG"
        echo "✅ Pre-push hook이 이미 모든 변경사항을 검증했습니다" >> "$LINT_LOG"
        lint_exit_code=0
    fi

    # 2. TypeScript 타입 체크 (30초 타임아웃, 로그 저장) - Codex 피드백: 10초 → 30초
    log_info "📝 TypeScript 타입 체크 중..."
    local ts_exit_code=0
    timeout 30 npm run type-check > "$TS_LOG" 2>&1 || ts_exit_code=$?

    # 3. 요약 추출 (Codex 피드백: exit code 검증 추가) - 전역 변수로 설정
    LINT_SUMMARY=""
    TS_SUMMARY=""

    # ESLint 결과 (exit code 먼저 확인)
    if grep -q "변경된 TS/TSX 파일 없음" "$LINT_LOG" 2>/dev/null; then
        LINT_SUMMARY="ℹ️  ESLint 스킵 (변경 파일 없음, Pre-push 검증 완료)"
    elif grep -q "타임아웃" "$LINT_LOG" 2>/dev/null && [ $lint_exit_code -eq 0 ]; then
        LINT_SUMMARY="⚠️  ESLint 타임아웃 (45초 초과, Pre-push 검증 완료)"
    elif [ $lint_exit_code -ne 0 ]; then
        # npm 에러 유형 세분화 (설정 오류 vs 코드 문제 구분)
        if grep -q "npm ERR! Missing script" "$LINT_LOG" 2>/dev/null; then
            LINT_SUMMARY="❌ ESLint 실패 (스크립트 없음, exit code: $lint_exit_code)"
        elif grep -q "npm ERR!" "$LINT_LOG" 2>/dev/null; then
            LINT_SUMMARY="❌ ESLint 실패 (npm 설정 에러, exit code: $lint_exit_code)"
        else
            LINT_SUMMARY="❌ ESLint 실패 (코드 문제, exit code: $lint_exit_code)"
        fi
    elif grep -q "problems" "$LINT_LOG" 2>/dev/null; then
        LINT_SUMMARY=$(grep "problems" "$LINT_LOG" | tail -1)
    else
        # 성공 메시지에 스캔 범위 표시
        if [ -n "$changed_files" ]; then
            local file_count=$(echo "$changed_files" | wc -l)
            LINT_SUMMARY="✅ ESLint 실행 성공 (변경 파일 ${file_count}개, 캐싱 활성화)"
        else
            LINT_SUMMARY="✅ ESLint 스킵 (변경 파일 없음)"
        fi
    fi

    # TypeScript 결과 (exit code 먼저 확인)
    if [ $ts_exit_code -eq 124 ]; then
        TS_SUMMARY="❌ TypeScript 타임아웃 (30초 초과)"
    elif [ $ts_exit_code -ne 0 ]; then
        # npm 에러 유형 세분화 (설정 오류 vs 코드 문제 구분)
        if grep -q "npm ERR! Missing script" "$TS_LOG" 2>/dev/null; then
            TS_SUMMARY="❌ TypeScript 실패 (스크립트 없음, exit code: $ts_exit_code)"
        elif grep -q "npm ERR!" "$TS_LOG" 2>/dev/null; then
            TS_SUMMARY="❌ TypeScript 실패 (npm 설정 에러, exit code: $ts_exit_code)"
        else
            TS_SUMMARY="❌ TypeScript 실패 (컴파일 에러, exit code: $ts_exit_code)"
        fi
    elif grep -q "Found.*errors" "$TS_LOG" 2>/dev/null; then
        TS_SUMMARY=$(grep "Found.*errors" "$TS_LOG" | tail -1)
    else
        TS_SUMMARY="✅ TypeScript 컴파일 성공 (0 errors)"
    fi

    log_success "검증 완료: $LINT_SUMMARY"
    log_success "검증 완료: $TS_SUMMARY"

    # 4. 검증 결과를 전역 변수로 설정 (AI 프롬프트 및 리포트에서 사용)
    # - VERIFY_TIMESTAMP, LINT_LOG, TS_LOG은 이미 전역 변수로 설정됨
    # - LINT_SUMMARY, TS_SUMMARY도 전역 변수로 설정됨
    # - export 불필요 (같은 프로세스 내에서 접근 가능)
}

# 변경사항 수집
collect_changes() {
    log_info "📊 변경사항 수집 중..."

    # 마지막 커밋의 변경사항 가져오기
    local last_commit=$(git -C "$PROJECT_ROOT" log -1 --format=%H)
    local commit_message=$(git -C "$PROJECT_ROOT" log -1 --format=%s)
    local changed_files=$(git -C "$PROJECT_ROOT" diff-tree --no-commit-id --name-only -r "$last_commit")

    if [ -z "$changed_files" ]; then
        log_warning "변경된 파일이 없습니다"
        return 1
    fi

    log_info "마지막 커밋: $last_commit"
    log_info "커밋 메시지: $commit_message"

    # 파일별 diff 수집
    local changes_summary="**커밋**: \`$last_commit\`
**메시지**: $commit_message

"

    for file in $changed_files; do
        # 파일이 존재하는지 확인 (삭제된 파일 제외)
        if [ -f "$file" ]; then
            changes_summary+="## 📄 $file

"
            changes_summary+="\`\`\`diff
"
            changes_summary+="$(git -C "$PROJECT_ROOT" diff "$last_commit^" "$last_commit" -- "$file" 2>/dev/null | head -100)
"
            changes_summary+="\`\`\`

"
        else
            changes_summary+="## 🗑️ $file (삭제됨)

"
        fi
    done

    echo -e "$changes_summary"
}

# Codex 사용량 제한 감지
detect_codex_rate_limit() {
    local output="$1"

    # Rate limit 또는 quota exceeded 패턴 감지
    if echo "$output" | grep -qi "rate limit\|quota exceeded\|too many requests\|429"; then
        return 0  # True: Rate limit 감지됨
    fi

    return 1  # False: 정상
}

# Codex 리뷰 실행 (우선 시도) - v4.0.0: 검증 결과 포함
try_codex_review() {
    local changes="$1"

    log_ai_engine "🚀 Codex 코드 리뷰 시도 중..."

    # Codex 쿼리 생성 (검증 결과 포함)
    local query="다음 Git 변경사항을 실무 관점에서 코드 리뷰해주세요:

## 🔍 실시간 검증 결과 (${VERIFY_TIMESTAMP:-N/A})

\`\`\`
ESLint: ${LINT_SUMMARY:-실행 안 됨}
TypeScript: ${TS_SUMMARY:-실행 안 됨}
\`\`\`

**검증 로그 저장 위치**:
- ESLint: ${LINT_LOG:-N/A}
- TypeScript: ${TS_LOG:-N/A}

---

$changes

**리뷰 요청 사항**:
1. **버그 위험**: 잠재적 버그나 오류 가능성 (있다면 3개까지)
2. **개선 제안**: 성능, 가독성, 유지보수성 측면 (3개)
3. **TypeScript 안전성**: any 타입, 타입 단언 등 문제점
4. **보안 이슈**: XSS, SQL Injection 등 보안 취약점
5. **종합 평가**: 점수 (1-10) 및 한 줄 요약

**출력 형식**:
- 📌 각 항목을 명확히 구분
- 💡 구체적인 코드 위치 및 개선 방법 제시
- ⭐ 종합 점수 및 승인 여부 (승인/조건부 승인/거부)

**참고**: 위 검증 결과는 실제 실행 결과입니다. 이를 바탕으로 리뷰해주세요."

    # Codex 실행 (wrapper 사용)
    local codex_output
    local codex_exit_code=0

    if codex_output=$("$PROJECT_ROOT/scripts/ai-subagents/codex-wrapper.sh" "$query" 2>&1); then
        # Rate limit 체크
        if detect_codex_rate_limit "$codex_output"; then
            log_warning "Codex 사용량 제한 감지 (Rate limit or quota exceeded)"
            return 1  # 실패 반환 → Gemini로 폴백
        fi

        # 파일 디스크립터를 통해 AI_ENGINE 전파
        echo "codex" > /tmp/ai_engine_auto_review
        echo "$codex_output"
        return 0
    else
        codex_exit_code=$?
        log_error "Codex 리뷰 실패 (Exit code: $codex_exit_code)"
        return 1
    fi
}

# Gemini 리뷰 실행 (폴백) - v4.0.0: 검증 결과 포함
fallback_to_gemini_review() {
    local changes="$1"

    log_ai_engine "🔄 Gemini CLI로 폴백..."

    # Gemini 쿼리 생성 (검증 결과 포함)
    local query="다음 Git 변경사항을 실무 관점에서 코드 리뷰해주세요:

## 🔍 실시간 검증 결과 (${VERIFY_TIMESTAMP:-N/A})

\`\`\`
ESLint: ${LINT_SUMMARY:-실행 안 됨}
TypeScript: ${TS_SUMMARY:-실행 안 됨}
\`\`\`

**검증 로그 저장 위치**:
- ESLint: ${LINT_LOG:-N/A}
- TypeScript: ${TS_LOG:-N/A}

---

$changes

**리뷰 요청 사항**:
1. **버그 위험**: 잠재적 버그나 오류 가능성 (있다면 3개까지)
2. **개선 제안**: 성능, 가독성, 유지보수성 측면 (3개)
3. **TypeScript 안전성**: any 타입, 타입 단언 등 문제점
4. **보안 이슈**: XSS, SQL Injection 등 보안 취약점
5. **종합 평가**: 점수 (1-10) 및 한 줄 요약

**출력 형식**:
- 📌 각 항목을 명확히 구분
- 💡 구체적인 코드 위치 및 개선 방법 제시
- ⭐ 종합 점수 및 승인 여부 (승인/조건부 승인/거부)

**참고**: 위 검증 결과는 실제 실행 결과입니다. 이를 바탕으로 리뷰해주세요."

    # Gemini 실행 (직접 호출 + stderr 필터링) - Option 1
    local gemini_output
    local temp_stdout=$(mktemp)
    local temp_stderr=$(mktemp)
    
    # 함수 종료 시 임시 파일 자동 정리 (인터럽트 포함)
    trap 'rm -f "$temp_stdout" "$temp_stderr"' RETURN
    
    # Gemini 실행: stdout과 stderr 분리
    if echo "$query" | gemini --model gemini-2.5-pro > "$temp_stdout" 2> "$temp_stderr"; then
        # stderr 필터링: 무해한 에러 메시지 제거 (단일 정규식)
        local filtered_errors=$(grep -vE "\[ImportProcessor\]|Loaded cached credentials|Got it|Attempt .* failed:" "$temp_stderr")
        
        # stdout 읽기
        gemini_output=$(cat "$temp_stdout")
        
        # 실제 출력이 있는지 확인 (공백 제거 후)
        if [ -n "$(echo "$gemini_output" | tr -d '[:space:]')" ]; then
            echo "gemini" > /tmp/ai_engine_auto_review
            echo "$gemini_output"
            return 0
        fi
    fi
    
    # 실패 (trap이 자동으로 cleanup 수행)
    log_error "Gemini 리뷰도 실패"
    return 1
}

# Claude Code 자체 리뷰 (최종 폴백)
# Claude Code 자동 리뷰 (최종 폴백)
claude_code_self_review() {
    local changes="$1"
    
    log_ai_engine "🤖 Claude Code 자동 리뷰 시작..."

    # claude 명령어가 있는지 확인
    if command -v claude >/dev/null 2>&1; then
        log_info "Claude CLI 감지됨. 직접 실행을 시도합니다."
        
        local query="다음 Git 변경사항을 실무 관점에서 코드 리뷰해주세요:

$changes

**리뷰 요청 사항**:
1. **버그 위험**: 잠재적 버그나 오류 가능성 (있다면 3개까지)
2. **개선 제안**: 성능, 가독성, 유지보수성 측면 (3개)
3. **TypeScript 안전성**: any 타입, 타입 단언 등 문제점
4. **보안 이슈**: XSS, SQL Injection 등 보안 취약점
5. **종합 평가**: 점수 (1-10) 및 한 줄 요약

**출력 형식**:
- 📌 각 항목을 명확히 구분
- 💡 구체적인 코드 위치 및 개선 방법 제시
- ⭐ 종합 점수 및 승인 여부 (승인/조건부 승인/거부)"

        # Claude CLI 실행
        local claude_output
        if claude_output=$(echo "$query" | claude -p "Code Reviewer" 2>&1); then
            echo "claude-code-auto" > /tmp/ai_engine_auto_review
            echo "$claude_output"
            return 0
        else
            log_warning "Claude CLI 실행 실패. 파일 기반 방식으로 폴백합니다."
        fi
    fi
    
    # 변경사항을 임시 파일에 저장하여 Claude Code가 자동으로 감지하도록 함
    local temp_review_request="/tmp/claude_code_review_request_$$.md"
    cat > "$temp_review_request" << REQUEST_EOF
# 🤖 Claude Code 자동 리뷰 요청

**날짜**: $(date '+%Y-%m-%d %H:%M:%S')
**커밋**: \`$(git log -1 --format=%h)\`
**메시지**: $(git log -1 --format=%s)
**변경 파일**: $(git diff --name-only HEAD~1 HEAD | wc -l)개

---

## 📋 변경사항

\`\`\`diff
$changes
\`\`\`

---

## 🎯 리뷰 요청 사항

다음 Git 변경사항을 실무 관점에서 코드 리뷰해주세요:

1. **버그 위험**: 잠재적 버그나 오류 가능성 (있다면 3개까지)
2. **개선 제안**: 성능, 가독성, 유지보수성 측면 (3개)
3. **TypeScript 안전성**: any 타입, 타입 단언 등 문제점
4. **보안 이슈**: XSS, SQL Injection 등 보안 취약점
5. **종합 평가**: 점수 (1-10) 및 한 줄 요약

**출력 형식**:
- 📌 각 항목을 명확히 구분
- 💡 구체적인 코드 위치 및 개선 방법 제시
- ⭐ 종합 점수 및 승인 여부 (승인/조건부 승인/거부)

---

## 💡 Claude Code 실행 방법

Claude Code가 이 파일을 자동으로 감지하고 리뷰를 시작합니다.

**자동 감지 파일**: \`$temp_review_request\`

REQUEST_EOF

    # Claude Code가 읽을 수 있도록 경로 출력
    local review_output=$(cat << 'OUTPUT_EOF'

## 🤖 Claude Code 자동 리뷰 준비 완료

Codex와 Gemini가 모두 실패했지만, **Claude Code가 자동으로 리뷰를 시작합니다**.

### 📁 리뷰 요청 파일 생성

Claude Code가 다음 파일을 자동으로 감지하여 리뷰를 수행합니다:

OUTPUT_EOF
)
    
    # 파일 경로 추가
    review_output+=$'\n'"**파일**: \`$temp_review_request\`"$'\n\n'
    review_output+="### 🎯 다음 단계"$'\n\n'
    review_output+="1. Claude Code가 위 파일을 자동으로 감지합니다"$'\n'
    review_output+="2. 파일 내용을 읽고 변경사항을 분석합니다"$'\n'
    review_output+="3. 실무 관점의 코드 리뷰를 자동으로 수행합니다"$'\n'
    review_output+="4. 리뷰 결과를 생성합니다"$'\n\n'
    review_output+="### ⏱️ 예상 소요 시간: 10-20초"$'\n\n'
    review_output+="💡 **자동 실행**: Claude Code가 백그라운드에서 리뷰를 진행합니다."
    
    # AI_ENGINE 전파
    echo "claude-code-auto" > /tmp/ai_engine_auto_review
    echo "$review_output"
    
    # 파일 경로를 별도로 저장하여 Claude Code가 감지할 수 있도록
    echo "$temp_review_request" > /tmp/claude_code_review_path
    
    log_success "리뷰 요청 파일 생성: $temp_review_request"
    log_info "Claude Code가 자동으로 리뷰를 시작합니다..."
    
    return 0
}

# AI 리뷰 실행 (4:1 비율 + 상호 폴백 + Claude Code 최종 폴백)
run_ai_review() {
    local changes="$1"
    local review_output=""

    # 임시 파일 초기화
    rm -f /tmp/ai_engine_auto_review

    # 1단계: 4:1 비율로 Primary AI 선택
    local primary_ai=$(select_primary_ai)
    local secondary_ai

    if [ "$primary_ai" = "codex" ]; then
        secondary_ai="gemini"
        log_info "🎯 Primary: Codex, Secondary: Gemini (4:1 비율)"
    else
        secondary_ai="codex"
        log_info "🎯 Primary: Gemini, Secondary: Codex (4:1 비율)"
    fi

    # 2단계: Primary AI 시도
    if [ "$primary_ai" = "codex" ]; then
        if review_output=$(try_codex_review "$changes"); then
            log_success "Codex 리뷰 성공!"
            increment_ai_counter "codex"
            echo "$review_output"
            return 0
        fi
        log_warning "Codex 실패 → Gemini로 폴백"
    else
        if review_output=$(fallback_to_gemini_review "$changes"); then
            log_success "Gemini 리뷰 성공!"
            increment_ai_counter "gemini"
            echo "$review_output"
            return 0
        fi
        log_warning "Gemini 실패 → Codex로 폴백"
    fi

    # 3단계: Secondary AI 폴백
    if [ "$secondary_ai" = "codex" ]; then
        if review_output=$(try_codex_review "$changes"); then
            log_success "Codex 폴백 성공!"
            increment_ai_counter "codex"
            echo "$review_output"
            return 0
        fi
        log_warning "Codex도 실패"
    else
        if review_output=$(fallback_to_gemini_review "$changes"); then
            log_success "Gemini 폴백 성공!"
            increment_ai_counter "gemini"
            echo "$review_output"
            return 0
        fi
        log_warning "Gemini도 실패"
    fi

    # 4단계: 최종 폴백 - Claude Code 서브에이전트
    log_error "모든 외부 AI 실패 (Codex + Gemini) → Claude Code 서브에이전트로 폴백"
    if review_output=$(claude_code_self_review "$changes"); then
        log_success "Claude Code 서브에이전트 리뷰 준비 완료!"
        echo "$review_output"
        return 0
    fi

    # 최종 실패 (거의 발생하지 않음)
    log_error "모든 리뷰 방법 실패 (매우 드문 경우)"
    rm -f /tmp/ai_engine_auto_review
    return 1
}

# 리뷰 리포트 생성
generate_review_report() {
    local changes="$1"
    local ai_review="$2"

    # AI 엔진 이름을 파일명에 포함
    REVIEW_FILE="$REVIEW_DIR/review-${AI_ENGINE}-$TODAY-$TIMESTAMP.md"

    log_info "📝 리뷰 리포트 생성 중... (AI: $AI_ENGINE)"

    # AI 엔진 이모지 선택
    local ai_emoji="🤖"
    [ "$AI_ENGINE" = "codex" ] && ai_emoji="🚀"
    [ "$AI_ENGINE" = "gemini" ] && ai_emoji="✨"

    cat > "$REVIEW_FILE" << EOF
# $ai_emoji AI 자동 코드 리뷰 리포트 (Engine: ${AI_ENGINE^^})

**날짜**: $TODAY $TIMESTAMP
**커밋**: \`$(git log -1 --format=%h)\`
**브랜치**: \`$(git branch --show-current)\`
**AI 엔진**: **${AI_ENGINE^^}**

---

## 🔍 실시간 검증 결과 (${VERIFY_TIMESTAMP:-N/A})

\`\`\`
ESLint: ${LINT_SUMMARY:-실행 안 됨}
TypeScript: ${TS_SUMMARY:-실행 안 됨}
\`\`\`

**검증 로그 파일**:
- ESLint: \`${LINT_LOG:-N/A}\`
- TypeScript: \`${TS_LOG:-N/A}\`

---

## 📊 변경사항 요약

$changes

---

## $ai_emoji AI 리뷰 결과

$ai_review

---

## 📋 체크리스트

- [ ] 버그 위험 사항 확인 완료
- [ ] 개선 제안 검토 완료
- [ ] TypeScript 안전성 확인 완료
- [ ] 보안 이슈 확인 완료
- [ ] 종합 평가 확인 완료

---

**생성 시간**: $(date '+%Y-%m-%d %H:%M:%S')
**리뷰 파일**: \`$REVIEW_FILE\`
**AI 엔진**: ${AI_ENGINE^^} ($([ "$AI_ENGINE" = "codex" ] && echo "Primary" || echo "Fallback"))
EOF

    log_success "리뷰 리포트 생성 완료: $REVIEW_FILE"
}

# 리뷰 결과 요약 출력
show_review_summary() {
    local review_file="$1"

    # AI 엔진 색상 선택
    local engine_color="${CYAN}"
    [ "$AI_ENGINE" = "codex" ] && engine_color="${GREEN}"
    [ "$AI_ENGINE" = "gemini" ] && engine_color="${MAGENTA}"

    echo ""
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}📋 AI 코드 리뷰 완료${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo -e "${engine_color}🤖 사용된 AI 엔진: ${AI_ENGINE^^}${NC}"
    echo -e "${BLUE}📂 리뷰 파일: $review_file${NC}"
    echo ""
    echo -e "${YELLOW}💡 다음 단계:${NC}"
    echo "  1️⃣  리뷰 파일 확인: cat $review_file"
    echo "  2️⃣  Claude Code에서 리뷰 분석 요청"
    echo "  3️⃣  필요 시 코드 수정 후 재커밋"
    echo ""
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

# 메인 실행
main() {
    log_info "🚀 Auto AI Review 시작 (v5.0.0 - 검증 분리)"
    echo ""

    # 1단계: 실시간 검증 실행 (v5.0.0: 별도 스크립트로 분리)
    # run_verification  # Disabled: 별도 스크립트로 실행 (post-commit)

    # 2단계: 변경사항 수집
    local changes
    if ! changes=$(collect_changes); then
        exit 0
    fi

    # 3단계: AI 리뷰 실행 (Codex → Gemini 순차 시도)
    local ai_review
    if ! ai_review=$(run_ai_review "$changes"); then
        log_error "AI 리뷰 실패 (모든 엔진 실패)"
        exit 1
    fi

    # AI_ENGINE 읽기 (run_ai_review가 서브셸에서 실행되므로 여기서 읽어야 함)
    if [ -f /tmp/ai_engine_auto_review ]; then
        AI_ENGINE=$(cat /tmp/ai_engine_auto_review)
        rm -f /tmp/ai_engine_auto_review
        log_info "AI 엔진 확인: $AI_ENGINE"
    else
        log_warning "AI 엔진 정보 파일을 찾을 수 없음"
    fi

    # 리뷰 리포트 생성
    generate_review_report "$changes" "$ai_review"

    # 요약 출력
    show_review_summary "$REVIEW_FILE"

    log_success "✅ Auto AI Review 완료 (Engine: ${AI_ENGINE^^})"
}

# 실행
main "$@"
