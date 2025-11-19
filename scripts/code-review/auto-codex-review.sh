#!/bin/bash

# Auto Codex Code Review Script
# 목적: 커밋 시 변경사항을 Codex가 자동 리뷰하고 리포트 생성
# 버전: 1.0.0
# 날짜: 2025-11-19

set -euo pipefail

# 프로젝트 루트
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 리뷰 저장 경로
REVIEW_DIR="$PROJECT_ROOT/logs/code-reviews"
mkdir -p "$REVIEW_DIR"

# 오늘 날짜
TODAY=$(date +%Y-%m-%d)
TIMESTAMP=$(date +%H-%M-%S)

# 리뷰 파일명
REVIEW_FILE="$REVIEW_DIR/review-$TODAY-$TIMESTAMP.md"

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

# 변경사항 수집
collect_changes() {
    log_info "📊 변경사항 수집 중..."
    
    # Staged 파일 목록
    local staged_files=$(git diff --cached --name-only --diff-filter=ACM)
    
    if [ -z "$staged_files" ]; then
        log_warning "변경된 파일이 없습니다"
        return 1
    fi
    
    # 파일별 diff 수집
    local changes_summary=""
    
    for file in $staged_files; do
        changes_summary+="## 📄 $file\n\n"
        changes_summary+="\`\`\`diff\n"
        changes_summary+="$(git diff --cached "$file")\n"
        changes_summary+="\`\`\`\n\n"
    done
    
    echo -e "$changes_summary"
}

# Codex 리뷰 실행
run_codex_review() {
    local changes="$1"
    
    log_info "🤖 Codex 코드 리뷰 시작..."
    
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
    if codex_output=$("$PROJECT_ROOT/scripts/ai-subagents/codex-wrapper.sh" "$query" 2>&1); then
        echo "$codex_output"
        return 0
    else
        log_error "Codex 리뷰 실패"
        return 1
    fi
}

# 리뷰 리포트 생성
generate_review_report() {
    local changes="$1"
    local codex_review="$2"
    
    log_info "📝 리뷰 리포트 생성 중..."
    
    cat > "$REVIEW_FILE" << EOF
# 🤖 Codex 자동 코드 리뷰 리포트

**날짜**: $TODAY $TIMESTAMP
**커밋**: \`$(git log -1 --format=%h)\`
**브랜치**: \`$(git branch --show-current)\`

---

## 📊 변경사항 요약

$changes

---

## 🤖 Codex 리뷰 결과

$codex_review

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
EOF

    log_success "리뷰 리포트 생성 완료: $REVIEW_FILE"
}

# 리뷰 결과 요약 출력
show_review_summary() {
    local review_file="$1"
    
    echo ""
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}📋 Codex 코드 리뷰 완료${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo -e "${BLUE}📂 리뷰 파일:${NC} $review_file"
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
    log_info "🚀 Auto Codex Review 시작"
    echo ""
    
    # 변경사항 수집
    local changes
    if ! changes=$(collect_changes); then
        exit 0
    fi
    
    # Codex 리뷰 실행
    local codex_review
    if ! codex_review=$(run_codex_review "$changes"); then
        log_error "Codex 리뷰 실패"
        exit 1
    fi
    
    # 리뷰 리포트 생성
    generate_review_report "$changes" "$codex_review"
    
    # 요약 출력
    show_review_summary "$REVIEW_FILE"
    
    log_success "✅ Auto Codex Review 완료"
}

# 실행
main "$@"
