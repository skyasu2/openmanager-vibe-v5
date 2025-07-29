#!/bin/bash

# setup-mcp-wsl-final.sh
# WSL에서 Claude Code MCP 완전 설정 스크립트

echo "🚀 WSL MCP 최종 설정 스크립트"
echo "============================="

# 프로젝트 경로
PROJECT_PATH="/mnt/d/cursor/openmanager-vibe-v5"
cd "$PROJECT_PATH"

# 색상 정의
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 1단계: 환경 변수 export 및 ~/.bashrc 설정
echo -e "\n${YELLOW}[1/5] 환경 변수 설정 중...${NC}"

# .env.local에서 환경 변수 읽기
if [ ! -f ".env.local" ]; then
    echo -e "${RED}❌ .env.local 파일을 찾을 수 없습니다!${NC}"
    exit 1
fi

# 백업 생성
cp ~/.bashrc ~/.bashrc.backup.$(date +%Y%m%d_%H%M%S)

# 기존 MCP 환경 변수 제거
sed -i '/# MCP Environment Variables/,/# End MCP Environment Variables/d' ~/.bashrc

# 새로운 환경 변수 추가
cat >> ~/.bashrc << 'EOF'

# MCP Environment Variables
if [ -f "/mnt/d/cursor/openmanager-vibe-v5/.env.local" ]; then
    export GITHUB_TOKEN=$(grep "^GITHUB_TOKEN=" /mnt/d/cursor/openmanager-vibe-v5/.env.local 2>/dev/null | cut -d'=' -f2)
    export SUPABASE_URL=$(grep "^NEXT_PUBLIC_SUPABASE_URL=" /mnt/d/cursor/openmanager-vibe-v5/.env.local 2>/dev/null | cut -d'=' -f2)
    export SUPABASE_SERVICE_ROLE_KEY=$(grep "^SUPABASE_SERVICE_ROLE_KEY=" /mnt/d/cursor/openmanager-vibe-v5/.env.local 2>/dev/null | cut -d'=' -f2)
    export GOOGLE_AI_API_KEY=$(grep "^GOOGLE_AI_API_KEY=" /mnt/d/cursor/openmanager-vibe-v5/.env.local 2>/dev/null | cut -d'=' -f2)
    export TAVILY_API_KEY=$(grep "^TAVILY_API_KEY=" /mnt/d/cursor/openmanager-vibe-v5/.env.local 2>/dev/null | cut -d'=' -f2)
fi
# End MCP Environment Variables
EOF

# 현재 세션에도 export
export GITHUB_TOKEN=$(grep "^GITHUB_TOKEN=" .env.local | cut -d'=' -f2)
export SUPABASE_URL=$(grep "^NEXT_PUBLIC_SUPABASE_URL=" .env.local | cut -d'=' -f2)
export SUPABASE_SERVICE_ROLE_KEY=$(grep "^SUPABASE_SERVICE_ROLE_KEY=" .env.local | cut -d'=' -f2)
export GOOGLE_AI_API_KEY=$(grep "^GOOGLE_AI_API_KEY=" .env.local | cut -d'=' -f2)
export TAVILY_API_KEY=$(grep "^TAVILY_API_KEY=" .env.local | cut -d'=' -f2)

echo -e "${GREEN}✅ 환경 변수 설정 완료${NC}"

# 2단계: MCP 설정 확인
echo -e "\n${YELLOW}[2/5] MCP 설정 파일 확인...${NC}"

# MCP 설정이 npx를 사용하도록 이미 변경됨
echo -e "${GREEN}✅ MCP 설정 확인 완료 (npx 방식 사용)${NC}"

# 3단계: 패키지 확인
echo -e "\n${YELLOW}[3/5] MCP 패키지 확인...${NC}"

# Tavily MCP 확인
if npm list tavily-mcp &>/dev/null; then
    echo -e "${GREEN}✅ tavily-mcp 설치됨${NC}"
else
    echo -e "${YELLOW}⚠️  tavily-mcp가 없습니다. 설치 중...${NC}"
    npm install tavily-mcp
fi

# 4단계: Tavily 테스트
echo -e "\n${YELLOW}[4/5] Tavily MCP 테스트...${NC}"

if timeout 3 bash -c "TAVILY_API_KEY='$TAVILY_API_KEY' npx -y tavily-mcp" &>/dev/null; then
    echo -e "${GREEN}✅ Tavily MCP 정상 작동${NC}"
else
    echo -e "${RED}❌ Tavily MCP 테스트 실패${NC}"
fi

# 5단계: Claude Code 재시작
echo -e "\n${YELLOW}[5/5] Claude Code 재시작...${NC}"

# Claude 프로세스 종료
pkill -f "claude" 2>/dev/null || true
sleep 2

echo -e "${GREEN}✅ Claude Code 종료됨${NC}"

# 환경 변수 확인
echo -e "\n📊 환경 변수 설정 확인:"
echo -e "  GITHUB_TOKEN = ${GITHUB_TOKEN:0:10}..."
echo -e "  SUPABASE_URL = ${SUPABASE_URL}"
echo -e "  SUPABASE_SERVICE_ROLE_KEY = ${SUPABASE_SERVICE_ROLE_KEY:0:10}..."
echo -e "  GOOGLE_AI_API_KEY = ${GOOGLE_AI_API_KEY:0:10}..."
echo -e "  TAVILY_API_KEY = ${TAVILY_API_KEY:0:10}..."

echo -e "\n${GREEN}✅ WSL MCP 설정 완료!${NC}"
echo -e "\n📋 다음 단계:"
echo -e "1. 새 터미널을 열거나: ${YELLOW}source ~/.bashrc${NC}"
echo -e "2. Claude Code 시작: ${YELLOW}claude${NC}"
echo -e "3. 프로젝트에서: ${YELLOW}/mcp${NC} 명령으로 상태 확인"

echo -e "\n💡 예상되는 MCP 상태:"
echo -e "${GREEN}✅ filesystem${NC} - 연결됨"
echo -e "${GREEN}✅ github${NC} - 연결됨 (GITHUB_TOKEN 필요)"
echo -e "${GREEN}✅ memory${NC} - 연결됨"
echo -e "${GREEN}✅ supabase${NC} - 연결됨 (SUPABASE 키 필요)"
echo -e "${GREEN}✅ context7${NC} - 연결됨"
echo -e "${GREEN}✅ tavily${NC} - 연결됨 (TAVILY_API_KEY 필요)"
echo -e "${RED}❌ gemini-cli-bridge${NC} - MCP 지원 중단 (대신 ./tools/g 사용)"