#!/bin/bash

# Auto AI Code Review Script (Codex → Gemini Fallback)
# 목적: 커밋 시 변경사항을 AI가 자동 리뷰하고 리포트 생성
# 버전: 2.0.0
# 날짜: 2025-11-19
# 전략: Codex 우선 → Gemini 폴백 (사용량 제한 대응)
#
# ⚠️ 중요: 이 스크립트는 직접 실행만 지원합니다 (source 사용 금지)
# 최상단 cd 명령으로 인해 source 시 호출자의 작업 디렉토리가 변경됩니다
#
# Changelog v2.0.0:
# - Codex CLI 우선 사용, 실패 시 Gemini CLI로 자동 폴백
# - AI 엔진 선택 로직 추가 (try_codex_first → fallback_to_gemini)
# - 리뷰 파일명에 AI 엔진 표시 (review-{AI}-{DATE}-{TIME}.md)
# - 사용량 제한 감지 및 자동 폴백 (rate limit, quota exceeded)
# - 목표: 99.9% 가용성 보장 (Codex OR Gemini)

set -euo pipefail

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

# 프로젝트 루트로 이동 (git 명령어 및 로그 파일 생성 위치 일관성 보장)
cd "$PROJECT_ROOT" || {
    echo "❌ Fatal: cd to PROJECT_ROOT failed"
    exit 1
}
log_success "Working directory: $PROJECT_ROOT"

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

# Codex 리뷰 실행 (우선 시도)
try_codex_review() {
    local changes="$1"

    log_ai_engine "🚀 Codex 코드 리뷰 시도 중..."

    # Codex 쿼리 생성
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

    # Codex 실행 (wrapper 사용)
    local codex_output
    local codex_exit_code=0

    if codex_output=$("$PROJECT_ROOT/scripts/ai-subagents/codex-wrapper.sh" "$query" 2>&1); then
        # Rate limit 체크
        if detect_codex_rate_limit "$codex_output"; then
            log_warning "Codex 사용량 제한 감지 (Rate limit or quota exceeded)"
            return 1  # 실패 반환 → Gemini로 폴백
        fi

        AI_ENGINE="codex"
        echo "$codex_output"
        return 0
    else
        codex_exit_code=$?
        log_error "Codex 리뷰 실패 (Exit code: $codex_exit_code)"
        return 1
    fi
}

# Gemini 리뷰 실행 (폴백)
fallback_to_gemini_review() {
    local changes="$1"

    log_ai_engine "🔄 Gemini CLI로 폴백..."

    # Gemini 쿼리 생성 (동일한 형식)
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

    # Gemini 실행 (wrapper 사용)
    local gemini_output
    if gemini_output=$("$PROJECT_ROOT/scripts/ai-subagents/gemini-wrapper.sh" "$query" 2>&1); then
        AI_ENGINE="gemini"
        echo "$gemini_output"
        return 0
    else
        log_error "Gemini 리뷰도 실패"
        return 1
    fi
}

# AI 리뷰 실행 (Codex → Gemini 순차 시도)
run_ai_review() {
    local changes="$1"
    local review_output=""

    # 1차 시도: Codex
    if review_output=$(try_codex_review "$changes"); then
        log_success "Codex 리뷰 성공!"
        echo "$review_output"
        return 0
    fi

    # 2차 시도: Gemini (폴백)
    log_warning "Codex 실패 → Gemini로 폴백 시도"
    if review_output=$(fallback_to_gemini_review "$changes"); then
        log_success "Gemini 폴백 성공!"
        echo "$review_output"
        return 0
    fi

    # 모든 AI 실패
    log_error "모든 AI 엔진 실패 (Codex + Gemini)"
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
    log_info "🚀 Auto AI Review 시작 (Codex → Gemini Fallback)"
    echo ""

    # 변경사항 수집
    local changes
    if ! changes=$(collect_changes); then
        exit 0
    fi

    # AI 리뷰 실행 (Codex → Gemini 순차 시도)
    local ai_review
    if ! ai_review=$(run_ai_review "$changes"); then
        log_error "AI 리뷰 실패 (모든 엔진 실패)"
        exit 1
    fi

    # 리뷰 리포트 생성
    generate_review_report "$changes" "$ai_review"

    # 요약 출력
    show_review_summary "$REVIEW_FILE"

    log_success "✅ Auto AI Review 완료 (Engine: ${AI_ENGINE^^})"
}

# 실행
main "$@"
