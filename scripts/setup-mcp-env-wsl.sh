#!/bin/bash

# setup-mcp-env-wsl.sh
# WSL 환경에서 MCP 환경변수 설정 전용 스크립트

echo "🔧 WSL MCP 환경변수 설정"
echo "========================"

# 색상 정의
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# 프로젝트 경로
PROJECT_PATH="/mnt/d/cursor/openmanager-vibe-v5"

# 1. 환경변수 설정 방법 선택
echo -e "\n${BLUE}환경변수 설정 방법을 선택하세요:${NC}"
echo "1) .env.local 파일에서 자동으로 읽기 (권장)"
echo "2) 수동으로 입력"
echo -n "선택 (1 또는 2): "
read choice

if [ "$choice" = "1" ]; then
    # .env.local에서 읽기
    if [ ! -f "$PROJECT_PATH/.env.local" ]; then
        echo -e "${RED}❌ .env.local 파일을 찾을 수 없습니다!${NC}"
        exit 1
    fi
    
    # 환경변수 읽기
    GITHUB_TOKEN=$(grep "^GITHUB_TOKEN=" "$PROJECT_PATH/.env.local" 2>/dev/null | cut -d'=' -f2)
    SUPABASE_URL=$(grep "^NEXT_PUBLIC_SUPABASE_URL=" "$PROJECT_PATH/.env.local" 2>/dev/null | cut -d'=' -f2)
    SUPABASE_SERVICE_ROLE_KEY=$(grep "^SUPABASE_SERVICE_ROLE_KEY=" "$PROJECT_PATH/.env.local" 2>/dev/null | cut -d'=' -f2)
    TAVILY_API_KEY=$(grep "^TAVILY_API_KEY=" "$PROJECT_PATH/.env.local" 2>/dev/null | cut -d'=' -f2)
    
elif [ "$choice" = "2" ]; then
    # 수동 입력
    echo -e "\n${YELLOW}환경변수를 입력하세요 (빈 값은 Enter):${NC}"
    
    echo -n "GITHUB_TOKEN: "
    read GITHUB_TOKEN
    
    echo -n "SUPABASE_URL: "
    read SUPABASE_URL
    
    echo -n "SUPABASE_SERVICE_ROLE_KEY: "
    read -s SUPABASE_SERVICE_ROLE_KEY
    echo
    
    echo -n "TAVILY_API_KEY: "
    read TAVILY_API_KEY
else
    echo -e "${RED}잘못된 선택입니다.${NC}"
    exit 1
fi

# 2. ~/.bashrc 백업
cp ~/.bashrc ~/.bashrc.backup.$(date +%Y%m%d_%H%M%S)
echo -e "${GREEN}✅ ~/.bashrc 백업 완료${NC}"

# 3. 기존 MCP 환경변수 섹션 제거
sed -i '/# MCP Environment Variables - Auto Generated/,/# End MCP Environment Variables/d' ~/.bashrc

# 4. 새로운 환경변수 추가
cat >> ~/.bashrc << EOF

# MCP Environment Variables - Auto Generated
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

# Windows 환경변수 공유 (WSLENV)
export WSLENV="\$WSLENV:GITHUB_TOKEN:SUPABASE_URL:NEXT_PUBLIC_SUPABASE_URL:SUPABASE_SERVICE_ROLE_KEY:TAVILY_API_KEY"

# End MCP Environment Variables
EOF

# 5. 현재 세션에도 export
export GITHUB_TOKEN="$GITHUB_TOKEN"
export SUPABASE_URL="$SUPABASE_URL"
export NEXT_PUBLIC_SUPABASE_URL="$SUPABASE_URL"
export SUPABASE_SERVICE_ROLE_KEY="$SUPABASE_SERVICE_ROLE_KEY"
export TAVILY_API_KEY="$TAVILY_API_KEY"

# 6. 설정 확인
echo -e "\n${BLUE}📊 설정된 환경변수:${NC}"
echo -e "  ${GREEN}✓${NC} GITHUB_TOKEN: ${GITHUB_TOKEN:+설정됨 (${GITHUB_TOKEN:0:10}...)}"
echo -e "  ${GREEN}✓${NC} SUPABASE_URL: ${SUPABASE_URL:-설정 안됨}"
echo -e "  ${GREEN}✓${NC} SUPABASE_SERVICE_ROLE_KEY: ${SUPABASE_SERVICE_ROLE_KEY:+설정됨 (${SUPABASE_SERVICE_ROLE_KEY:0:10}...)}"
echo -e "  ${GREEN}✓${NC} TAVILY_API_KEY: ${TAVILY_API_KEY:+설정됨 (${TAVILY_API_KEY:0:10}...)}"

# 7. Windows 측 환경변수 설정 제안
echo -e "\n${YELLOW}💡 Windows에서도 환경변수를 설정하려면:${NC}"
echo -e "PowerShell (관리자 권한)에서 다음 명령 실행:"
echo -e "${BLUE}cd D:\\cursor\\openmanager-vibe-v5${NC}"
echo -e "${BLUE}.\\scripts\\set-mcp-env.ps1${NC}"

# 8. 완료 메시지
echo -e "\n${GREEN}✅ WSL MCP 환경변수 설정 완료!${NC}"
echo -e "\n다음 단계:"
echo -e "1. 새 터미널을 열거나: ${YELLOW}source ~/.bashrc${NC}"
echo -e "2. Claude Code 재시작: ${YELLOW}claude${NC}"
echo -e "3. MCP 상태 확인: ${YELLOW}/mcp${NC}"

# 9. 테스트 제안
echo -e "\n${BLUE}🧪 설정 테스트:${NC}"
echo -e "${YELLOW}echo \$GITHUB_TOKEN${NC} - GitHub 토큰 확인"
echo -e "${YELLOW}echo \$SUPABASE_URL${NC} - Supabase URL 확인"