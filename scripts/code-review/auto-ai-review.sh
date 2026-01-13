#!/bin/bash

# Auto AI Code Review Script (2-AI 순환) with Smart Verification
# 목적: 커밋 시 변경사항을 AI가 자동 리뷰하고 리포트 생성 (스마트 검증)
# 버전: 7.4.0
# 날짜: 2026-01-13
# 전략: 2-AI 순환 (Codex ↔ Gemini) 1:1 비율 + 중복 방지 + 소규모 변경 필터 + 누적 리뷰
#
# v7.4.0 (2026-01-13): 리포트 품질 개선
# - ✨ 신규: 삭제 전용 커밋 감지 → "해당 없음 (코드 삭제)" 표시
# - ✨ 신규: 일반 커밋 → "자동 검증 (pre-push)" 표시
# - 🎯 효과: 검증 결과 섹션이 더 이상 N/A로 비어있지 않음
#
# v7.0.0 (2026-01-07): Qwen 제거 - 2-AI 시스템으로 단순화
# - Qwen 제거 사유: 평균 201초 (Gemini 89초의 2.3배), 실패율 13.3%
# - 2-AI 1:1 순환: codex → gemini → codex (상호 폴백)
#
# ⚠️ 중요: 이 스크립트는 직접 실행만 지원합니다 (source 사용 금지)
# 최상단 cd 명령으로 인해 source 시 호출자의 작업 디렉토리가 변경됩니다
#
# Changelog v6.13.0 (2025-12-23): 🔧 미검토 커밋 누락 방지 개선
# - 🐛 수정: get_unreviewed_commits()가 .reviewed-commits 기반으로 변경
# - 🐛 수정: 중간 스킵된 커밋이 영구 누락되던 문제 해결
# - ✨ 신규: 3시간 초과 미검토 커밋은 자동 마킹하여 제외 (max_age_hours=3)
# - 🎯 효과: 정확한 미검토 커밋 탐지 + 오래된 커밋 불필요한 리뷰 방지
#
# Changelog v6.12.0 (2025-12-23): 🔄 누적 리뷰 기능 추가 (Windows 스킵 대응)
# - ✨ 신규: 미검토 커밋 누적 리뷰 기능 (CUMULATIVE_REVIEW)
# - ✨ 신규: .last-reviewed-commit 파일로 마지막 성공 리뷰 커밋 추적
# - ✨ 신규: Windows에서 hook이 스킵되어도 다음 WSL 실행 시 누적 리뷰
# - 🎯 효과: 리뷰 누락 방지, 환경 불일치 대응
#
# Changelog v6.11.0 (2025-12-19): 📋 문서/테스트 검증 경고 자동 생성
# - ✨ 신규: doc-test-validator.sh 통합 (새 함수/클래스 추가 시 테스트 필요 여부 감지)
# - ✨ 신규: API/설정 변경 시 문서 업데이트 필요 여부 경고 생성
# - 📁 출력: logs/doc-validation-warning.txt (AI 프롬프트에 자동 포함)
#
# Changelog v6.10.1 (2025-12-18): 🐛 라인 카운팅 버그 수정
# - 🐛 수정: grep -cE '^[+-]' → git diff-tree --numstat (+++/--- 헤더 제외)
# - 🎯 효과: 정확한 변경 라인 수 계산으로 소규모 변경 필터 정확도 향상
#
# Changelog v6.10.0 (2025-12-17): 📄 소규모 변경 필터 추가
# - ✨ 신규: 문서만 변경(.md/.txt) 시 AI 리뷰 스킵 (SKIP_DOCS_ONLY)
# - ✨ 신규: 최소 변경 라인 기준 미달 시 스킵 (SKIP_MIN_LINES=3)
# - 🎯 효과: 불필요한 AI 리뷰 호출 감소, 리소스 절약
#
# Changelog v6.5.0 (2025-12-07): 🔒 중복 리뷰 방지 기능 추가
# - ✨ 신규: 커밋 해시 기반 중복 리뷰 방지 (.reviewed-commits)
# - ✨ 신규: 락 파일로 동시 실행 방지 (.review-lock)
# - ✨ 신규: 5분 타임아웃 후 자동 락 해제 (프로세스 충돌 방지)
# - 🎯 효과: 동일 커밋 다중 리뷰 문제 해결 (5회 → 1회)
#
# Changelog v6.0.0 (2025-12-01): 🎯 단순화 - 1회 재시도 + 지연 보상
# - ✨ 신규: 1회 재시도 후 지연 보상 시스템 (.pending-reviews)
# - 🔄 변경: 4단계 폴백 → 1회 재시도 + 실패 시 다음 커밋에서 보상
# - 🔄 변경: fallback_to_gemini_review → try_gemini_review (함수명 통일)
# - 📉 개선: 코드 복잡도 대폭 감소 (500줄 → 200줄)
# - 🐛 수정: AI 엔진 표기 버그 (모든 AI가 "Fallback"으로 표기되던 문제)
# - 🎯 효과: 유지보수성 향상, 디버깅 용이
#
# Changelog v5.0.0 (2025-11-27): 🚀 MAJOR UPDATE - 분할 리뷰 + AI 교차검증
# - ✨ 신규: AI 분배 시스템 (현재: 2-AI codex↔gemini, v7.0.0에서 단순화)
# - ✨ 신규: Claude Code 스킬 통합 (ai-code-review)
# - ✨ 신규: 대량 파일 분할 리뷰 (10개 파일 초과 시 자동 분할)
# - 📦 개선: 모듈화 구조 (lib/ 디렉토리로 분리)
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

# 리뷰 저장 경로 (reports/ = 동적 문서, logs/ = 순수 로그)
REVIEW_DIR="$PROJECT_ROOT/reports/ai-review"
mkdir -p "$REVIEW_DIR"

# 상태 파일 경로 (reports/ai-review/에 통합)
STATE_FILE="$REVIEW_DIR/.ai-usage-state"

# ===== 분할 리뷰 설정 (v5.0.0) =====
MAX_FILES_PER_REVIEW=10  # 한 번에 리뷰할 최대 파일 수 (초과 시 자동 분할)

# ===== 소규모 변경 필터 설정 (v6.10.0) =====
SKIP_DOCS_ONLY=${SKIP_DOCS_ONLY:-true}   # .md/.txt만 변경 시 리뷰 스킵
SKIP_MIN_LINES=${SKIP_MIN_LINES:-3}       # 최소 변경 라인 수 (미달 시 스킵)

# 오늘 날짜
TODAY=$(date +%Y-%m-%d)
TIMESTAMP=$(date +%H-%M-%S)

# AI 엔진 선택 변수 (동적 결정)
AI_ENGINE=""
REVIEW_FILE=""

# 검증 결과 변수 (lib 모듈에서 사용)
VERIFY_TIMESTAMP=""
LINT_SUMMARY=""
TS_SUMMARY=""
LINT_LOG=""
TS_LOG=""

# v7.4.0: 삭제 전용 커밋 감지 함수
is_delete_only_commit() {
    local commit_hash="${1:-HEAD}"

    # numstat: additions deletions filename
    # 삭제 전용이면 additions가 모두 0
    local additions=$(git -C "$PROJECT_ROOT" diff-tree --numstat -r "$commit_hash" 2>/dev/null | awk '{sum += $1} END {print sum+0}')
    local deletions=$(git -C "$PROJECT_ROOT" diff-tree --numstat -r "$commit_hash" 2>/dev/null | awk '{sum += $2} END {print sum+0}')

    # 추가된 줄이 0이고 삭제된 줄이 0보다 크면 삭제 전용
    if [ "$additions" -eq 0 ] && [ "$deletions" -gt 0 ]; then
        return 0  # True: 삭제 전용
    fi
    return 1  # False: 일반 커밋
}

# v7.4.0: 검증 결과 변수 설정
set_verification_status() {
    local commit_hash="${1:-HEAD}"

    VERIFY_TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

    if is_delete_only_commit "$commit_hash"; then
        LINT_SUMMARY="해당 없음 (코드 삭제)"
        TS_SUMMARY="해당 없음 (코드 삭제)"
        LINT_LOG="N/A (삭제 전용 커밋)"
        TS_LOG="N/A (삭제 전용 커밋)"
    else
        # 일반 커밋: 검증 스킵 표시 (별도 스크립트에서 실행)
        LINT_SUMMARY="자동 검증 (pre-push)"
        TS_SUMMARY="자동 검증 (pre-push)"
        LINT_LOG="logs/validation/"
        TS_LOG="logs/validation/"
    fi

    # 변수 내보내기 (lib 모듈에서 사용)
    export VERIFY_TIMESTAMP LINT_SUMMARY TS_SUMMARY LINT_LOG TS_LOG
}

# ============================================================================
# 모듈 임포트 (v5.0.0: 모듈화 구조)
# ============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LIB_DIR="$SCRIPT_DIR/lib"

# 유틸리티 함수들 (로그, 카운터, 변경사항 수집)
source "$LIB_DIR/ai-review-utils.sh"

# AI 리뷰 실행 함수들 (Codex, Gemini, Qwen, Claude)
source "$LIB_DIR/ai-review-core.sh"

# 분할 리뷰 및 리포트 생성 함수들
source "$LIB_DIR/ai-review-split.sh"

# 문서/테스트 검증 함수 (v6.11.0)
source "$LIB_DIR/doc-test-validator.sh"

# ============================================================================
# 중복 리뷰 방지 함수 (v6.5.0)
# ============================================================================

# 락 파일 및 상태 파일 경로 (reports/ai-review/에 통합)
LOCK_FILE="$REVIEW_DIR/.review-lock"
REVIEWED_COMMITS_FILE="$REVIEW_DIR/.reviewed-commits"
LAST_REVIEWED_COMMIT_FILE="$REVIEW_DIR/.last-reviewed-commit"

# 누적 리뷰 설정 (v6.12.0)
CUMULATIVE_REVIEW=${CUMULATIVE_REVIEW:-true}  # 미검토 커밋 누적 리뷰 활성화

# 커밋이 이미 리뷰되었는지 확인
is_commit_reviewed() {
    local commit_hash="$1"
    local short_hash="${commit_hash:0:7}"

    # 1. 리뷰 파일 존재 확인 (review-*-YYYY-MM-DD-*.md 패턴에서 커밋 해시 검색)
    if ls "$REVIEW_DIR"/review-*-"$TODAY"-*.md 2>/dev/null | head -1 | xargs grep -l "$short_hash" >/dev/null 2>&1; then
        return 0  # 이미 리뷰됨
    fi

    # 2. 리뷰된 커밋 목록 파일 확인
    if [ -f "$REVIEWED_COMMITS_FILE" ] && grep -q "^$short_hash$" "$REVIEWED_COMMITS_FILE" 2>/dev/null; then
        return 0  # 이미 리뷰됨
    fi

    return 1  # 리뷰 안 됨
}

# 커밋을 리뷰 완료로 마킹
mark_commit_reviewed() {
    local commit_hash="$1"
    local short_hash="${commit_hash:0:7}"

    echo "$short_hash" >> "$REVIEWED_COMMITS_FILE"

    # 7일 이상 된 항목 정리 (파일 크기 관리)
    if [ -f "$REVIEWED_COMMITS_FILE" ]; then
        tail -100 "$REVIEWED_COMMITS_FILE" > "$REVIEWED_COMMITS_FILE.tmp" 2>/dev/null || true
        mv "$REVIEWED_COMMITS_FILE.tmp" "$REVIEWED_COMMITS_FILE" 2>/dev/null || true
    fi
}

# 락 파일로 동시 실행 방지
acquire_lock() {
    local lock_timeout=300  # 5분 타임아웃

    # 오래된 락 파일 정리 (5분 이상)
    if [ -f "$LOCK_FILE" ]; then
        local lock_age=$(( $(date +%s) - $(stat -c %Y "$LOCK_FILE" 2>/dev/null || echo 0) ))
        if [ "$lock_age" -gt "$lock_timeout" ]; then
            log_warning "오래된 락 파일 정리 (${lock_age}초)"
            rm -f "$LOCK_FILE"
        fi
    fi

    # 락 획득 시도
    if [ -f "$LOCK_FILE" ]; then
        log_warning "다른 리뷰가 진행 중입니다 (락 파일 존재)"
        return 1
    fi

    echo "$$" > "$LOCK_FILE"
    return 0
}

# 락 해제
release_lock() {
    rm -f "$LOCK_FILE"
}

# ============================================================================
# 누적 리뷰 함수 (v6.12.0)
# ============================================================================

# 마지막 성공 리뷰 커밋 가져오기
get_last_reviewed_commit() {
    if [ -f "$LAST_REVIEWED_COMMIT_FILE" ]; then
        cat "$LAST_REVIEWED_COMMIT_FILE" 2>/dev/null | head -1
    else
        echo ""
    fi
}

# 마지막 성공 리뷰 커밋 저장
save_last_reviewed_commit() {
    local commit_hash="$1"
    echo "$commit_hash" > "$LAST_REVIEWED_COMMIT_FILE"
}

# 미검토 커밋 목록 가져오기 (v6.13.0: .reviewed-commits 기반 + 시간 필터)
# 기존: last_reviewed..HEAD 범위만 확인 → 중간 스킵된 커밋 누락 문제
# 변경: 최근 N개 커밋 중 .reviewed-commits에 없고 3시간 이내인 것만 찾기
get_unreviewed_commits() {
    local max_lookback=${1:-30}  # 최대 조회 범위 (기본 30개)
    local max_age_hours=${2:-3}  # 최대 커밋 나이 (기본 3시간)
    local unreviewed_commits=""
    local now_epoch=$(date +%s)
    local max_age_seconds=$((max_age_hours * 3600))

    # 최근 N개 커밋 순회
    for commit in $(git -C "$PROJECT_ROOT" log -${max_lookback} --format=%H 2>/dev/null); do
        local short_hash="${commit:0:7}"

        # 1. .reviewed-commits 파일에 있으면 스킵
        if grep -q "^$short_hash$" "$REVIEWED_COMMITS_FILE" 2>/dev/null; then
            continue
        fi

        # 2. 커밋 시간 확인 (3시간 초과하면 스킵)
        local commit_epoch=$(git -C "$PROJECT_ROOT" log -1 --format=%ct "$commit" 2>/dev/null)
        if [ -n "$commit_epoch" ]; then
            local age_seconds=$((now_epoch - commit_epoch))
            if [ "$age_seconds" -gt "$max_age_seconds" ]; then
                # 3시간 초과: 스킵하고 리뷰됨으로 마킹 (향후 무시)
                echo "$short_hash" >> "$REVIEWED_COMMITS_FILE"
                continue
            fi
        fi

        # 미검토 + 3시간 이내 커밋 추가
        if [ -z "$unreviewed_commits" ]; then
            unreviewed_commits="$commit"
        else
            unreviewed_commits="$unreviewed_commits $commit"
        fi
    done

    if [ -z "$unreviewed_commits" ]; then
        # 모두 리뷰됨: HEAD 반환 (fallback)
        git -C "$PROJECT_ROOT" log -1 --format=%H
    else
        # 오래된 순으로 정렬하여 반환
        echo "$unreviewed_commits" | tr ' ' '\n' | tac | tr '\n' ' ' | xargs
    fi
}

# 미검토 커밋들의 누적 변경 파일 목록 가져오기
get_cumulative_changed_files() {
    local last_reviewed=$(get_last_reviewed_commit)
    local head_commit=$(git -C "$PROJECT_ROOT" log -1 --format=%H)

    if [ -z "$last_reviewed" ] || [ "$last_reviewed" = "$head_commit" ]; then
        # 첫 실행 또는 이미 최신: 마지막 커밋만
        git -C "$PROJECT_ROOT" diff-tree --no-commit-id --name-only -r "$head_commit"
    else
        # 누적 diff: last_reviewed..HEAD
        git -C "$PROJECT_ROOT" diff --name-only "$last_reviewed" HEAD 2>/dev/null || \
            git -C "$PROJECT_ROOT" diff-tree --no-commit-id --name-only -r "$head_commit"
    fi
}

# 미검토 커밋 수 가져오기 (v6.13.0: get_unreviewed_commits와 동기화)
get_unreviewed_commit_count() {
    local commits=$(get_unreviewed_commits 30 3)
    echo "$commits" | wc -w | tr -d ' '
}

# ============================================================================
# 메인 함수
# ============================================================================

main() {
    log_info "🚀 Auto AI Review 시작 (v6.13.0 - 미검토 커밋 정확 탐지)"
    echo ""

    # 0단계: 락 획득 (동시 실행 방지)
    if ! acquire_lock; then
        log_warning "⏭️  다른 리뷰가 진행 중 - 스킵"
        exit 0
    fi

    # 종료 시 락 해제
    trap 'release_lock' EXIT

    # 1단계: 실시간 검증 실행 (v5.0.0: 별도 스크립트로 분리)
    # run_verification  # Disabled: 별도 스크립트로 실행 (post-commit)

    # 2단계: 변경된 파일 목록 가져오기
    local head_commit=$(git -C "$PROJECT_ROOT" log -1 --format=%H)

    # v7.4.0: 검증 결과 변수 설정 (삭제 전용 커밋 감지)
    set_verification_status "$head_commit"

    # 2-0단계: 누적 리뷰 체크 (v6.12.0)
    local unreviewed_count=1
    local changed_files=""
    local review_range_desc=""

    if [ "$CUMULATIVE_REVIEW" = "true" ]; then
        unreviewed_count=$(get_unreviewed_commit_count)
        local last_reviewed=$(get_last_reviewed_commit)

        if [ "$unreviewed_count" -gt 1 ]; then
            log_info "📚 미검토 커밋 ${unreviewed_count}개 발견 (누적 리뷰 모드)"
            log_info "   마지막 리뷰: ${last_reviewed:0:7} → HEAD: ${head_commit:0:7}"
            changed_files=$(get_cumulative_changed_files)
            review_range_desc="누적 ${unreviewed_count}개 커밋"
        else
            changed_files=$(git -C "$PROJECT_ROOT" diff-tree --no-commit-id --name-only -r "$head_commit")
            review_range_desc="단일 커밋 ${head_commit:0:7}"
        fi
    else
        changed_files=$(git -C "$PROJECT_ROOT" diff-tree --no-commit-id --name-only -r "$head_commit")
        review_range_desc="단일 커밋 ${head_commit:0:7}"
    fi

    # 2-1단계: 중복 리뷰 체크 (v6.5.0) - 단일 커밋 모드에서만
    if [ "$unreviewed_count" -eq 1 ] && is_commit_reviewed "$head_commit"; then
        log_warning "⏭️  이미 리뷰된 커밋입니다: ${head_commit:0:7}"
        # 누적 추적 파일도 업데이트 (sync)
        save_last_reviewed_commit "$head_commit"
        exit 0
    fi

    if [ -z "$changed_files" ]; then
        log_warning "변경된 파일이 없습니다"
        save_last_reviewed_commit "$head_commit"  # 마킹해서 다음에 스킵
        exit 0
    fi

    log_info "📁 리뷰 대상: $review_range_desc (파일 $(echo "$changed_files" | wc -l | tr -d ' ')개)"

    # 2-2단계: 소규모 변경 필터 (v6.10.0)
    # 필터 1: 문서만 변경된 경우 스킵
    if [ "$SKIP_DOCS_ONLY" = "true" ]; then
        local non_doc_files=$(echo "$changed_files" | grep -vE '\.(md|txt|MD|TXT)$' || true)
        if [ -z "$non_doc_files" ]; then
            log_info "📄 문서만 변경됨 (.md/.txt) - AI 리뷰 스킵"
            mark_commit_reviewed "$head_commit"
            save_last_reviewed_commit "$head_commit"
            exit 0
        fi
    fi

    # 필터 2: 변경량이 너무 작은 경우 스킵 (단일 커밋 모드에서만)
    if [ "$unreviewed_count" -eq 1 ]; then
        local total_lines=$(git -C "$PROJECT_ROOT" diff-tree --numstat -r "$head_commit" 2>/dev/null | awk '{sum += ($1 + $2)} END {print sum+0}')
        if [ "$total_lines" -lt "$SKIP_MIN_LINES" ]; then
            log_info "📝 변경량 ${total_lines}줄 < ${SKIP_MIN_LINES}줄 - AI 리뷰 스킵"
            mark_commit_reviewed "$head_commit"
            save_last_reviewed_commit "$head_commit"
            exit 0
        fi
    fi

    # 2-3단계: 문서/테스트 검증 경고 생성 (v6.11.0)
    log_info "📋 문서/테스트 업데이트 필요성 분석 중..."
    analyze_changes "$head_commit" 2>/dev/null || true

    # 3단계: 분할 리뷰 실행 (v5.0.0: 자동 분할 또는 일반 리뷰)
    if ! split_and_review "$changed_files"; then
        log_error "AI 리뷰 실패"
        exit 1
    fi

    # 4단계: 리뷰 완료 마킹 (v6.5.0: 중복 방지 + v6.12.0: 누적 추적)
    mark_commit_reviewed "$head_commit"
    save_last_reviewed_commit "$head_commit"

    if [ "$unreviewed_count" -gt 1 ]; then
        log_success "✅ 누적 리뷰 완료 (${unreviewed_count}개 커밋)"
    else
        log_success "✅ Auto AI Review 완료"
    fi
}

# ============================================================================
# 스크립트 실행
# ============================================================================

main "$@"
