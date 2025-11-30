#!/bin/bash

# Auto AI Code Review Script (1:1:1:1 비율) with Smart Verification
# 목적: 커밋 시 변경사항을 AI가 자동 리뷰하고 리포트 생성 (스마트 검증)
# 버전: 6.0.0
# 날짜: 2025-12-01
# 전략: 1:1:1:1 균등 분배 + 1회 재시도 + 지연 보상 (단순화)
#
# ⚠️ 중요: 이 스크립트는 직접 실행만 지원합니다 (source 사용 금지)
# 최상단 cd 명령으로 인해 source 시 호출자의 작업 디렉토리가 변경됩니다
#
# Changelog v6.0.0 (2025-12-01): 🎯 단순화 - 1회 재시도 + 지연 보상
# - ✨ 신규: 1회 재시도 후 지연 보상 시스템 (.pending-reviews)
# - 🔄 변경: 4단계 폴백 → 1회 재시도 + 실패 시 다음 커밋에서 보상
# - 🔄 변경: fallback_to_gemini_review → try_gemini_review (함수명 통일)
# - 📉 개선: 코드 복잡도 대폭 감소 (500줄 → 200줄)
# - 🐛 수정: AI 엔진 표기 버그 (모든 AI가 "Fallback"으로 표기되던 문제)
# - 🎯 효과: 유지보수성 향상, 디버깅 용이
#
# Changelog v5.0.0 (2025-11-27): 🚀 MAJOR UPDATE - 1:1:1:1 비율 + 분할 리뷰 + 서브에이전트
# - ✨ 신규: 1:1:1:1 균등 분배 (Codex, Gemini, Claude, Qwen 각 25%)
# - ✨ 신규: Qwen 통합 (qwen-wrapper.sh v3.0.0)
# - ✨ 신규: Claude Code 서브에이전트 통합 (code-review-specialist)
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

# 리뷰 저장 경로
REVIEW_DIR="$PROJECT_ROOT/logs/code-reviews"
mkdir -p "$REVIEW_DIR"

# 상태 파일 경로 (AI 사용 카운터 추적)
STATE_FILE="$PROJECT_ROOT/logs/code-reviews/.ai-usage-state"

# ===== 분할 리뷰 설정 (v5.0.0) =====
MAX_FILES_PER_REVIEW=10  # 한 번에 리뷰할 최대 파일 수 (초과 시 자동 분할)

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

# ============================================================================
# 메인 함수
# ============================================================================

main() {
    log_info "🚀 Auto AI Review 시작 (v6.0.0 - 1회 재시도 + 지연 보상)"
    echo ""

    # 1단계: 실시간 검증 실행 (v5.0.0: 별도 스크립트로 분리)
    # run_verification  # Disabled: 별도 스크립트로 실행 (post-commit)

    # 2단계: 변경된 파일 목록 가져오기
    local last_commit=$(git -C "$PROJECT_ROOT" log -1 --format=%H)
    local changed_files=$(git -C "$PROJECT_ROOT" diff-tree --no-commit-id --name-only -r "$last_commit")

    if [ -z "$changed_files" ]; then
        log_warning "변경된 파일이 없습니다"
        exit 0
    fi

    # 3단계: 분할 리뷰 실행 (v5.0.0: 자동 분할 또는 일반 리뷰)
    if ! split_and_review "$changed_files"; then
        log_error "AI 리뷰 실패"
        exit 1
    fi

    log_success "✅ Auto AI Review 완료"
}

# ============================================================================
# 스크립트 실행
# ============================================================================

main "$@"
