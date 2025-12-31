#!/bin/bash
# 문서 품질 검증 스크립트
# Usage: bash scripts/docs/check-docs.sh [--fix]

set -e

DOCS_DIR="docs"
REPORTS_DIR="logs/docs-reports"
FIX_MODE=false

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 인자 파싱
if [[ "$1" == "--fix" ]]; then
  FIX_MODE=true
fi

# 리포트 디렉토리 생성
mkdir -p "$REPORTS_DIR"

echo -e "${BLUE}📚 문서 품질 검증 시작${NC}"
echo "========================================"

# 1. Markdown Lint 검사
echo -e "\n${YELLOW}[1/4] Markdown Lint 검사${NC}"
if $FIX_MODE; then
  npx markdownlint-cli2 "$DOCS_DIR/**/*.md" --fix 2>&1 | tee "$REPORTS_DIR/markdownlint.log" || true
  echo -e "${GREEN}✅ Lint 자동 수정 완료${NC}"
else
  if npx markdownlint-cli2 "$DOCS_DIR/**/*.md" 2>&1 | tee "$REPORTS_DIR/markdownlint.log"; then
    echo -e "${GREEN}✅ Markdown Lint 통과${NC}"
  else
    echo -e "${RED}❌ Lint 오류 발견 (--fix 로 자동 수정 가능)${NC}"
  fi
fi

# 2. 링크 유효성 검사 (샘플링)
echo -e "\n${YELLOW}[2/4] 링크 유효성 검사 (주요 문서)${NC}"
MAIN_DOCS=("docs/README.md" "docs/status.md" "docs/QUICK-START.md" "CLAUDE.md")
LINK_ERRORS=0

for doc in "${MAIN_DOCS[@]}"; do
  if [[ -f "$doc" ]]; then
    if npx markdown-link-check "$doc" --quiet 2>/dev/null; then
      echo -e "  ${GREEN}✓${NC} $doc"
    else
      echo -e "  ${RED}✗${NC} $doc"
      ((LINK_ERRORS++))
    fi
  fi
done

if [[ $LINK_ERRORS -eq 0 ]]; then
  echo -e "${GREEN}✅ 링크 검사 통과${NC}"
else
  echo -e "${RED}❌ $LINK_ERRORS 개 파일에서 깨진 링크 발견${NC}"
fi

# 3. 오래된 문서 감지 (90일 이상)
echo -e "\n${YELLOW}[3/4] 오래된 문서 감지 (90일+)${NC}"
STALE_DOCS=$(find "$DOCS_DIR" -name "*.md" -mtime +90 -type f 2>/dev/null | head -10)

if [[ -z "$STALE_DOCS" ]]; then
  echo -e "${GREEN}✅ 오래된 문서 없음${NC}"
else
  echo -e "${YELLOW}⚠️  90일 이상 미수정 문서:${NC}"
  echo "$STALE_DOCS" | while read -r file; do
    DAYS=$(( ($(date +%s) - $(stat -c %Y "$file")) / 86400 ))
    echo -e "  ${YELLOW}•${NC} $file (${DAYS}일 전)"
  done
fi

# 4. 문서 통계
echo -e "\n${YELLOW}[4/4] 문서 통계${NC}"
TOTAL_DOCS=$(find "$DOCS_DIR" -name "*.md" -type f | wc -l)
TOTAL_LINES=$(find "$DOCS_DIR" -name "*.md" -type f -exec cat {} \; | wc -l)
LARGE_DOCS=$(find "$DOCS_DIR" -name "*.md" -type f -exec wc -l {} \; | awk '$1 > 400 {print $2}' | wc -l)

echo -e "  📄 총 문서 수: ${GREEN}${TOTAL_DOCS}${NC}개"
echo -e "  📝 총 라인 수: ${GREEN}${TOTAL_LINES}${NC}줄"
echo -e "  📏 400줄 초과 문서: ${YELLOW}${LARGE_DOCS}${NC}개"

echo -e "\n========================================"
echo -e "${BLUE}📚 문서 검증 완료${NC}"
echo -e "리포트: ${REPORTS_DIR}/"
