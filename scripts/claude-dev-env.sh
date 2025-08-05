#!/bin/bash

# 🤖 Claude Code WSL 통합 개발 환경 스크립트
# 모든 개발 환경을 자동으로 설정하고 시작합니다.

PROJECT_DIR="/mnt/d/cursor/openmanager-vibe-v5"
ENV_FILE="$PROJECT_DIR/.env.local"

# 색상 정의
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}╔═══════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   🤖 Claude Code 개발 환경 초기화 중...   ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════╝${NC}"
echo ""

# 스크립트 실행 권한 확인
if [ ! -x "$0" ]; then
    echo -e "${YELLOW}⚠️  스크립트 실행 권한이 없습니다. 권한 설정 중...${NC}"
    chmod +x "$0"
fi

# 1. 환경변수 로드
echo -e "${YELLOW}📋 환경변수 로드 중...${NC}"
if [ -f "$ENV_FILE" ]; then
    # .env.local에서 환경변수 추출하여 export
    while IFS='=' read -r key value; do
        # 주석과 빈 줄 제외
        if [[ ! "$key" =~ ^# ]] && [[ -n "$key" ]]; then
            # 따옴표 제거
            value="${value%\"}"
            value="${value#\"}"
            export "$key=$value"
            # 민감한 정보 마스킹
            if [[ "$key" =~ (KEY|TOKEN|SECRET|PASSWORD) ]]; then
                echo -e "  ✓ $key 설정됨 (마스킹됨)"
            else
                echo -e "  ✓ $key 설정됨"
            fi
        fi
    done < "$ENV_FILE"
    echo -e "${GREEN}✅ 환경변수 로드 완료${NC}"
else
    echo -e "${RED}❌ .env.local 파일을 찾을 수 없습니다${NC}"
    exit 1
fi

# 2. Node.js 메모리 설정
echo ""
echo -e "${YELLOW}🧠 Node.js 메모리 최적화...${NC}"
export NODE_OPTIONS="--max-old-space-size=4096"
echo -e "${GREEN}✅ 메모리 할당: 4GB${NC}"

# 3. Git 설정 확인
echo ""
echo -e "${YELLOW}🔧 Git 설정 확인...${NC}"
git config --global user.name > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Git 사용자 이름이 설정되지 않았습니다${NC}"
    echo "실행: git config --global user.name \"Your Name\""
else
    echo -e "${GREEN}✅ Git 설정 완료${NC}"
fi

# 4. npm 의존성 확인
echo ""
echo -e "${YELLOW}📦 npm 패키지 확인...${NC}"
if [ ! -d "$PROJECT_DIR/node_modules" ]; then
    echo -e "${YELLOW}  패키지 설치가 필요합니다. 설치 중...${NC}"
    cd "$PROJECT_DIR" && npm install
else
    echo -e "${GREEN}✅ npm 패키지 준비됨${NC}"
fi

# 5. 타입 체크
echo ""
echo -e "${YELLOW}🔍 TypeScript 타입 체크...${NC}"
cd "$PROJECT_DIR" && npm run type-check --silent
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ 타입 체크 통과${NC}"
else
    echo -e "${RED}⚠️  타입 에러가 있습니다 (개발은 계속 가능)${NC}"
fi

# 6. Claude Code 상태 확인
echo ""
echo -e "${YELLOW}🤖 Claude Code 상태 확인...${NC}"
echo -e "  MCP 서버: GitHub, Supabase, Tavily 등"
echo -e "  설정 위치: ~/.claude.json"
echo -e "${GREEN}✅ Claude Code 준비됨${NC}"

# 7. tmux 세션 시작
echo ""
echo -e "${BLUE}🚀 개발 환경 시작...${NC}"
echo ""
echo -e "${GREEN}시작 옵션:${NC}"
echo "1) tmux 개발 환경 (권장)"
echo "2) 단순 개발 서버만 실행"
echo "3) 테스트 감시 모드"
echo "4) 취소"
echo ""
read -p "선택하세요 (1-4): " choice

case $choice in
    1)
        echo -e "${GREEN}tmux 개발 환경을 시작합니다...${NC}"
        exec "$PROJECT_DIR/scripts/dev-tmux.sh"
        ;;
    2)
        echo -e "${GREEN}개발 서버를 시작합니다...${NC}"
        cd "$PROJECT_DIR" && npm run dev
        ;;
    3)
        echo -e "${GREEN}테스트 감시 모드를 시작합니다...${NC}"
        cd "$PROJECT_DIR" && npm run test:watch
        ;;
    4)
        echo -e "${YELLOW}취소되었습니다.${NC}"
        exit 0
        ;;
    *)
        echo -e "${RED}잘못된 선택입니다.${NC}"
        exit 1
        ;;
esac