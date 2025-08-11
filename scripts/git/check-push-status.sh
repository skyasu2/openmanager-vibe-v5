#!/bin/bash

# 색상 정의
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m' # No Color

echo -e "${BOLD}🔍 Git Push 상태 점검${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 1. 원격 저장소 업데이트
echo -e "\n${BLUE}📥 원격 저장소 정보 업데이트 중...${NC}"
git fetch origin --quiet

# 2. 현재 브랜치 확인
CURRENT_BRANCH=$(git branch --show-current)
echo -e "${GREEN}🌿 현재 브랜치:${NC} $CURRENT_BRANCH"

# 3. HEAD와 origin 비교
LOCAL_SHA=$(git rev-parse HEAD)
REMOTE_SHA=$(git rev-parse origin/$CURRENT_BRANCH 2>/dev/null)

if [ -z "$REMOTE_SHA" ]; then
    echo -e "${RED}❌ 원격 브랜치가 존재하지 않습니다${NC}"
    echo -e "${YELLOW}💡 첫 푸시를 하려면: git push -u origin $CURRENT_BRANCH${NC}"
    exit 1
fi

echo -e "\n${BOLD}📊 커밋 해시 비교:${NC}"
echo -e "  로컬:  ${BLUE}${LOCAL_SHA:0:8}${NC}"
echo -e "  원격:  ${BLUE}${REMOTE_SHA:0:8}${NC}"

# 4. 동기화 상태 확인
if [ "$LOCAL_SHA" == "$REMOTE_SHA" ]; then
    echo -e "\n${GREEN}✅ 완벽히 동기화됨!${NC} 모든 커밋이 푸시되었습니다."
    
    # 최근 푸시된 커밋 표시
    echo -e "\n${BOLD}📝 최근 푸시된 커밋:${NC}"
    git log --oneline --graph --decorate -5
    
else
    # 푸시되지 않은 커밋 확인
    UNPUSHED=$(git log origin/$CURRENT_BRANCH..HEAD --oneline)
    if [ -n "$UNPUSHED" ]; then
        echo -e "\n${YELLOW}⚠️  푸시되지 않은 커밋이 있습니다:${NC}"
        echo "$UNPUSHED"
        echo -e "\n${YELLOW}💡 푸시하려면: git push${NC}"
    fi
    
    # 원격이 더 앞서 있는지 확인
    BEHIND=$(git log HEAD..origin/$CURRENT_BRANCH --oneline)
    if [ -n "$BEHIND" ]; then
        echo -e "\n${RED}⚠️  원격 저장소가 더 앞서 있습니다:${NC}"
        echo "$BEHIND"
        echo -e "\n${YELLOW}💡 동기화하려면: git pull${NC}"
    fi
fi

# 5. GitHub API로 최신 커밋 확인 (옵션)
echo -e "\n${BOLD}🌐 GitHub 저장소 상태:${NC}"
GITHUB_SHA=$(curl -s "https://api.github.com/repos/skyasu2/openmanager-vibe-v5/commits/$CURRENT_BRANCH" | grep '"sha"' | head -1 | cut -d'"' -f4)

if [ -n "$GITHUB_SHA" ]; then
    echo -e "  GitHub: ${BLUE}${GITHUB_SHA:0:8}${NC}"
    if [ "${GITHUB_SHA:0:8}" == "${LOCAL_SHA:0:8}" ]; then
        echo -e "  ${GREEN}✅ GitHub과 로컬이 일치합니다${NC}"
    else
        echo -e "  ${YELLOW}⚠️  GitHub과 로컬이 다릅니다${NC}"
    fi
else
    echo -e "  ${YELLOW}GitHub API 접근 실패 (인증 필요할 수 있음)${NC}"
fi

# 6. 작업 트리 상태
echo -e "\n${BOLD}📁 작업 트리 상태:${NC}"
if git diff-index --quiet HEAD --; then
    echo -e "  ${GREEN}✅ 깨끗한 상태${NC}"
else
    echo -e "  ${YELLOW}⚠️  커밋되지 않은 변경사항이 있습니다${NC}"
    git status --short
fi

echo -e "\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✨ 점검 완료!${NC}"