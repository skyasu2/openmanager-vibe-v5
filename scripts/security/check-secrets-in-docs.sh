#!/bin/bash

# 🔍 문서 파일의 시크릿 검사 스크립트
# 마크다운 파일에서도 실제 토큰 패턴을 검사

set -e

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔍 문서 파일의 시크릿 검사 중...${NC}"

# 실제 토큰 패턴들
PATTERNS=(
    'ghp_[A-Za-z0-9]{36}'              # GitHub Personal Access Token
    'ghs_[A-Za-z0-9]{36}'              # GitHub Server Token
    'gho_[A-Za-z0-9]{36}'              # GitHub OAuth Token
    'github_pat_[A-Za-z0-9_]{82}'      # New GitHub PAT format
    'sbp_[a-f0-9]{48}'                 # Supabase Personal Access Token
    'AIza[A-Za-z0-9-_]{35}'            # Google AI API Key
    'sk-[A-Za-z0-9]{48}'               # OpenAI API Key
    'xoxb-[0-9]{11}-[0-9]{13}-[a-zA-Z0-9]{24}'  # Slack Token
    'tvly-[A-Za-z0-9-]{36}'            # Tavily API Key
)

FOUND_SECRETS=0

# 문서 디렉토리 검사
echo -e "${BLUE}📁 검사 대상: ./docs, .claude, README.md, CHANGELOG.md, 모든 .md 파일${NC}"

for pattern in "${PATTERNS[@]}"; do
    echo -n "검사 중: ${pattern:0:10}... "
    
    # 모든 마크다운 파일 검사 (재귀적)
    if find . -name "*.md" -not -path "./node_modules/*" -not -path "./.git/*" -exec grep -E "$pattern" {} \; 2>/dev/null | grep -v '\[REDACTED\]' | grep -v 'ghp_1234' | grep -v 'example' | grep -v "환경변수에서 설정"; then
        echo -e "${RED}[발견!]${NC}"
        FOUND_SECRETS=1
    else
        echo -e "${GREEN}[안전]${NC}"
    fi
done

echo ""

if [ $FOUND_SECRETS -eq 1 ]; then
    echo -e "${RED}❌ 문서에서 실제 토큰이 발견되었습니다!${NC}"
    echo -e "${YELLOW}해결 방법:${NC}"
    echo "1. 토큰을 [REDACTED]로 교체"
    echo "2. 예시 토큰은 ghp_1234... 형태로 사용"
    echo "3. git filter-branch로 히스토리 정리 필요"
    exit 1
else
    echo -e "${GREEN}✅ 문서에서 실제 토큰이 발견되지 않았습니다!${NC}"
fi