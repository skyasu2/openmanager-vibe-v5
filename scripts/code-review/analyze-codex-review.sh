#!/bin/bash

# Analyze Codex Review for Claude Code
# 목적: Codex 리뷰 결과를 분석하고 Claude Code에게 개선 제안
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
NC='\033[0m'

# 리뷰 디렉터리
REVIEW_DIR="$PROJECT_ROOT/logs/code-reviews"

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

# 최신 리뷰 파일 찾기
find_latest_review() {
    local latest_review=$(find "$REVIEW_DIR" -name "review-*.md" -type f -printf '%T@ %p\n' 2>/dev/null | sort -rn | head -1 | cut -d' ' -f2-)
    
    if [ -z "$latest_review" ]; then
        log_error "리뷰 파일을 찾을 수 없습니다"
        return 1
    fi
    
    echo "$latest_review"
}

# 리뷰 분석
analyze_review() {
    local review_file="$1"
    
    log_info "📊 Codex 리뷰 분석 중..."
    echo ""
    
    # 리뷰 내용 출력
    cat "$review_file"
    echo ""
    
    # 주요 지표 추출
    log_info "🔍 주요 지표 추출..."
    echo ""
    
    # 종합 점수 추출 (정규식으로 찾기)
    local score=$(grep -oP '(?<=점수|평가).*?(\d+)/10' "$review_file" | head -1 || echo "N/A")
    
    # 버그 위험 카운트
    local bug_count=$(grep -c "버그 위험" "$review_file" || echo "0")
    
    # 보안 이슈 카운트
    local security_count=$(grep -c "보안 이슈" "$review_file" || echo "0")
    
    echo -e "${CYAN}📈 분석 결과:${NC}"
    echo "  - 종합 점수: $score"
    echo "  - 버그 위험: $bug_count 항목"
    echo "  - 보안 이슈: $security_count 항목"
    echo ""
}

# Claude Code 제안 생성
generate_claude_suggestions() {
    local review_file="$1"
    
    log_info "💡 Claude Code 개선 제안 생성 중..."
    echo ""
    
    cat << EOF
${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}
${CYAN}💬 Claude Code에게 전달할 메시지${NC}
${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}

Codex가 방금 커밋한 변경사항을 리뷰했습니다.

📂 리뷰 파일: $review_file

다음 작업을 수행해주세요:

1️⃣  **리뷰 파일 확인**
   cat $review_file

2️⃣  **개선 필요 사항 파악**
   - 버그 위험 항목 확인
   - 보안 이슈 확인
   - TypeScript 안전성 문제 확인

3️⃣  **코드 수정 제안**
   - 우선순위 높은 항목부터 수정 제안
   - 구체적인 코드 개선 방법 제시

4️⃣  **재커밋 여부 판단**
   - 심각한 문제가 있다면 수정 후 재커밋
   - 경미한 문제는 다음 커밋에 반영

${YELLOW}⚠️  주의사항:${NC}
- Codex는 실무 관점의 제안을 제공합니다
- 모든 제안을 반영할 필요는 없으며, 프로젝트 컨텍스트를 고려하세요
- 1인 개발자 환경이므로 과도한 방어 로직은 불필요합니다

${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}

EOF
}

# 메인 실행
main() {
    log_info "🚀 Codex Review Analyzer 시작"
    echo ""
    
    # 최신 리뷰 파일 찾기
    local review_file
    if ! review_file=$(find_latest_review); then
        log_error "리뷰 파일이 없습니다. 먼저 커밋을 해주세요."
        exit 1
    fi
    
    log_success "최신 리뷰 파일 발견: $review_file"
    echo ""
    
    # 리뷰 분석
    analyze_review "$review_file"
    
    # Claude Code 제안 생성
    generate_claude_suggestions "$review_file"
    
    log_success "✅ 분석 완료"
}

# 실행
main "$@"
