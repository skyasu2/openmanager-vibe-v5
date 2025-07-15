#!/bin/bash

# setup-claude-code-wsl.sh
# Claude Code WSL 전용 통합 설정 스크립트
# 모든 MCP 서버 및 환경설정을 WSL에서 한번에 처리

echo "🚀 Claude Code WSL 전용 설정 스크립트"
echo "====================================="
echo "모든 설정을 WSL 환경에 최적화하여 진행합니다."
echo

# 색상 정의
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# 프로젝트 경로
PROJECT_PATH="/mnt/d/cursor/openmanager-vibe-v5"
cd "$PROJECT_PATH" || exit 1

# 1. 환경변수 설정
echo -e "\n${CYAN}1. 환경변수 설정${NC}"
echo "==================="

# .env.local에서 환경변수 읽기
if [ -f ".env.local" ]; then
    echo -e "${GREEN}✅ .env.local 파일 발견${NC}"
    
    # 환경변수 읽기
    GITHUB_TOKEN=$(grep "^GITHUB_TOKEN=" .env.local 2>/dev/null | cut -d'=' -f2)
    SUPABASE_URL=$(grep "^NEXT_PUBLIC_SUPABASE_URL=" .env.local 2>/dev/null | cut -d'=' -f2)
    SUPABASE_SERVICE_ROLE_KEY=$(grep "^SUPABASE_SERVICE_ROLE_KEY=" .env.local 2>/dev/null | cut -d'=' -f2)
    TAVILY_API_KEY=$(grep "^TAVILY_API_KEY=" .env.local 2>/dev/null | cut -d'=' -f2)
    GOOGLE_AI_API_KEY=$(grep "^GOOGLE_AI_API_KEY=" .env.local 2>/dev/null | cut -d'=' -f2)
    
    # ~/.bashrc 백업
    cp ~/.bashrc ~/.bashrc.backup.$(date +%Y%m%d_%H%M%S)
    
    # 기존 MCP 환경변수 섹션 제거
    sed -i '/# Claude Code WSL Environment Variables/,/# End Claude Code WSL Environment Variables/d' ~/.bashrc
    
    # 새로운 환경변수 추가
    cat >> ~/.bashrc << EOF

# Claude Code WSL Environment Variables
# Generated on $(date)
export PROJECT_PATH="$PROJECT_PATH"

# GitHub Token
$([ -n "$GITHUB_TOKEN" ] && echo "export GITHUB_TOKEN='$GITHUB_TOKEN'")

# Supabase Configuration
$([ -n "$SUPABASE_URL" ] && echo "export SUPABASE_URL='$SUPABASE_URL'")
$([ -n "$SUPABASE_URL" ] && echo "export NEXT_PUBLIC_SUPABASE_URL='$SUPABASE_URL'")
$([ -n "$SUPABASE_SERVICE_ROLE_KEY" ] && echo "export SUPABASE_SERVICE_ROLE_KEY='$SUPABASE_SERVICE_ROLE_KEY'")

# Tavily API Key
$([ -n "$TAVILY_API_KEY" ] && echo "export TAVILY_API_KEY='$TAVILY_API_KEY'")

# Google AI API Key
$([ -n "$GOOGLE_AI_API_KEY" ] && echo "export GOOGLE_AI_API_KEY='$GOOGLE_AI_API_KEY'")

# Node.js Memory Settings
export NODE_OPTIONS="--max-old-space-size=8192"

# End Claude Code WSL Environment Variables
EOF

    # 현재 세션에도 export
    export GITHUB_TOKEN="$GITHUB_TOKEN"
    export SUPABASE_URL="$SUPABASE_URL"
    export NEXT_PUBLIC_SUPABASE_URL="$SUPABASE_URL"
    export SUPABASE_SERVICE_ROLE_KEY="$SUPABASE_SERVICE_ROLE_KEY"
    export TAVILY_API_KEY="$TAVILY_API_KEY"
    export GOOGLE_AI_API_KEY="$GOOGLE_AI_API_KEY"
    export NODE_OPTIONS="--max-old-space-size=8192"
    
    echo -e "${GREEN}✅ 환경변수 설정 완료${NC}"
else
    echo -e "${RED}❌ .env.local 파일을 찾을 수 없습니다!${NC}"
    exit 1
fi

# 2. Gemini CLI WSL 설정
echo -e "\n${CYAN}2. Gemini CLI 별칭 설정${NC}"
echo "========================"

# Gemini CLI 별칭 설정 제거 및 추가
sed -i '/# Gemini CLI Aliases for WSL/,/# End Gemini CLI Aliases/d' ~/.bashrc

cat >> ~/.bashrc << 'EOF'

# Gemini CLI Aliases for WSL
# Windows의 gemini.exe를 WSL에서 사용하기 위한 별칭
alias gemini='cmd.exe /c "gemini"'
alias gp='cmd.exe /c "gemini -p"'
alias gs='cmd.exe /c "gemini /stats"'
alias gc='cmd.exe /c "gemini /clear"'
alias gcomp='cmd.exe /c "gemini /compress"'

# 파이프 입력을 위한 특별 함수
gemini-pipe() {
    local input=$(cat)
    echo "$input" | cmd.exe /c "gemini $*"
}

# End Gemini CLI Aliases
EOF

echo -e "${GREEN}✅ Gemini CLI 별칭 설정 완료${NC}"

# 3. MCP 서버 확인
echo -e "\n${CYAN}3. MCP 서버 설정 확인${NC}"
echo "======================="

if [ -f ".claude/mcp.json" ]; then
    echo -e "${GREEN}✅ MCP 설정 파일 확인${NC}"
    
    # MCP 서버 목록 표시
    echo -e "\n${BLUE}설정된 MCP 서버:${NC}"
    jq -r '.mcpServers | keys[] | "  - " + .' .claude/mcp.json 2>/dev/null || echo "  JSON 파싱 실패"
else
    echo -e "${RED}❌ .claude/mcp.json 파일을 찾을 수 없습니다!${NC}"
fi

# 4. npm 의존성 설치
echo -e "\n${CYAN}4. npm 의존성 설치${NC}"
echo "==================="

if [ -f "package.json" ]; then
    echo -e "${YELLOW}npm install 실행 중...${NC}"
    npm install
    echo -e "${GREEN}✅ npm 의존성 설치 완료${NC}"
else
    echo -e "${RED}❌ package.json을 찾을 수 없습니다!${NC}"
fi

# 5. Git 설정
echo -e "\n${CYAN}5. Git 설정${NC}"
echo "============="

# Git 사용자 정보 설정 (이미 설정되어 있지 않은 경우)
if [ -z "$(git config --global user.name)" ]; then
    echo -n "Git 사용자 이름: "
    read git_name
    git config --global user.name "$git_name"
fi

if [ -z "$(git config --global user.email)" ]; then
    echo -n "Git 이메일: "
    read git_email
    git config --global user.email "$git_email"
fi

echo -e "${GREEN}✅ Git 설정 완료${NC}"

# 6. 테스트 명령어
echo -e "\n${CYAN}6. 설정 확인 명령어${NC}"
echo "==================="

cat << EOF
환경변수 확인:
  ${YELLOW}echo \$GITHUB_TOKEN${NC} - GitHub 토큰 확인
  ${YELLOW}echo \$SUPABASE_URL${NC} - Supabase URL 확인
  ${YELLOW}echo \$TAVILY_API_KEY${NC} - Tavily API 키 확인

MCP 테스트:
  ${YELLOW}npx -y @modelcontextprotocol/server-filesystem --version${NC}
  ${YELLOW}npx -y @modelcontextprotocol/server-github --version${NC}
  ${YELLOW}npx -y @supabase/mcp-server-supabase --version 2>/dev/null || echo "버전 정보 없음"${NC}
  ${YELLOW}npx -y tavily-mcp@0.2.8 --version 2>/dev/null || echo "버전 정보 없음"${NC}

Gemini CLI 테스트:
  ${YELLOW}gemini --version${NC} - Gemini CLI 버전 확인
  ${YELLOW}echo "안녕하세요" | gemini-pipe -p "한 줄로 답변"${NC}
EOF

# 7. 완료 메시지
echo -e "\n${GREEN}✨ Claude Code WSL 설정 완료!${NC}"
echo -e "\n다음 단계:"
echo -e "1. 새 터미널을 열거나: ${YELLOW}source ~/.bashrc${NC}"
echo -e "2. Claude Code 재시작"
echo -e "3. MCP 상태 확인: ${YELLOW}/mcp${NC} 명령 실행"

# 8. 자동 source 실행 옵션
echo -e "\n${CYAN}지금 설정을 적용하시겠습니까? (y/n)${NC}"
read -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    source ~/.bashrc
    echo -e "${GREEN}✅ 설정이 현재 세션에 적용되었습니다!${NC}"
fi

echo -e "\n${BLUE}📌 문제 발생 시:${NC}"
echo -e "  - 백업 파일: ~/.bashrc.backup.*"
echo -e "  - 문제 해결: ${YELLOW}./scripts/diagnose-mcp-issue.ps1${NC} (PowerShell에서 실행)"
echo -e "  - 로그 확인: ${YELLOW}journalctl -xe${NC}"