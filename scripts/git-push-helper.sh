#!/bin/bash
# 🚀 Git Push Helper for Claude Code
# 암호화된 GitHub 토큰을 사용한 안전한 push

# 색상 정의
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}🔐 Git Push Helper${NC}"
echo "========================"

# 암호화된 설정에서 GitHub 토큰 복호화
if [ -f "scripts/decrypt-single-var.mjs" ]; then
    echo -e "${YELLOW}📦 GitHub 토큰 복호화 중...${NC}"
    GITHUB_TOKEN=$(node scripts/decrypt-single-var.mjs GITHUB_TOKEN 2>/dev/null)
    
    if [ -z "$GITHUB_TOKEN" ]; then
        echo -e "${RED}❌ 암호화된 GitHub 토큰을 찾을 수 없습니다.${NC}"
        echo -e "${YELLOW}💡 수동으로 토큰을 입력하세요:${NC}"
        read -s -p "GitHub Personal Access Token: " GITHUB_TOKEN
        echo
    fi
else
    echo -e "${YELLOW}💡 토큰을 입력하세요:${NC}"
    read -s -p "GitHub Personal Access Token: " GITHUB_TOKEN
    echo
fi

# Remote URL 설정
REPO_URL="https://${GITHUB_TOKEN}@github.com/skyasu2/openmanager-vibe-v5.git"

# Push 실행
echo -e "${GREEN}🚀 Push 시작...${NC}"
git push "$REPO_URL" main

# 메모리에서 토큰 제거
unset GITHUB_TOKEN
unset REPO_URL

echo -e "${GREEN}✅ Push 완료!${NC}"