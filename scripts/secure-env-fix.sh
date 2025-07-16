#!/bin/bash

# 🔐 환경변수 보안 수정 스크립트
# 작성일: 2025-07-16

echo "🔐 환경변수 보안 수정 시작..."

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Git 캐시에서 민감한 파일 제거
echo -e "${YELLOW}📋 Git 캐시에서 민감한 파일 제거 중...${NC}"

files_to_remove=(
    ".mcp.json"
    ".env.local"
    ".env"
    ".claude/mcp.json"
    "docs/environment-variables-production.md"
)

for file in "${files_to_remove[@]}"; do
    if git ls-files --error-unmatch "$file" &>/dev/null; then
        echo -e "${RED}❌ 제거: $file${NC}"
        git rm --cached "$file" 2>/dev/null || true
    fi
done

# 2. 백업 파일들의 민감한 정보 마스킹
echo -e "${YELLOW}📋 백업 파일 보안 처리 중...${NC}"

# sed를 사용하여 백업 파일의 토큰 마스킹
if [ -f "docs/backup/mcp-2025-07-16/claude-mcp.json.backup" ]; then
    sed -i 's/"GITHUB_TOKEN": "ghp_[^"]*"/"GITHUB_TOKEN": "[REDACTED]"/g' \
        docs/backup/mcp-2025-07-16/claude-mcp.json.backup 2>/dev/null || true
fi

# 3. 환경변수 체크
echo -e "${YELLOW}📋 환경변수 설정 확인...${NC}"

required_vars=(
    "GITHUB_TOKEN"
    "TAVILY_API_KEY"
    "SUPABASE_URL"
    "SUPABASE_SERVICE_ROLE_KEY"
)

missing_vars=()
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        missing_vars+=("$var")
    fi
done

if [ ${#missing_vars[@]} -eq 0 ]; then
    echo -e "${GREEN}✅ 모든 필수 환경변수가 설정되어 있습니다.${NC}"
else
    echo -e "${RED}❌ 다음 환경변수가 설정되지 않았습니다:${NC}"
    printf '%s\n' "${missing_vars[@]}"
    echo -e "${YELLOW}💡 .env.local 파일을 확인하거나 시스템 환경변수를 설정하세요.${NC}"
fi

# 4. .gitignore 확인
echo -e "${YELLOW}📋 .gitignore 파일 확인...${NC}"

gitignore_patterns=(
    ".env*"
    ".mcp.json"
    ".claude/mcp.json"
    "*.token"
    "*.pat"
)

for pattern in "${gitignore_patterns[@]}"; do
    if ! grep -q "^$pattern" .gitignore; then
        echo -e "${RED}⚠️  .gitignore에 '$pattern' 패턴이 없습니다.${NC}"
    fi
done

# 5. 보안 경고 표시
echo -e "\n${RED}⚠️  중요 보안 경고 ⚠️${NC}"
echo -e "${YELLOW}다음 작업을 즉시 수행하세요:${NC}"
echo "1. GitHub Personal Access Token 재생성"
echo "   - https://github.com/settings/tokens"
echo "2. Tavily API Key 재생성 (필요시)"
echo "   - Tavily 대시보드에서 재생성"
echo "3. 새 토큰으로 .env.local 업데이트"
echo "4. Claude Code 재시작"

echo -e "\n${GREEN}✅ 보안 수정 스크립트 완료${NC}"
echo -e "${YELLOW}📚 자세한 내용은 docs/SECURITY-ALERT-2025-07-16.md 참조${NC}"