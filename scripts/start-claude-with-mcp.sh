#!/bin/bash
# Claude Code with MCP 환경변수 자동 로드 및 검증
#
# 사용법: ./scripts/start-claude-with-mcp.sh

clear
echo -e "\033[36m===============================================\033[0m"
echo -e "\033[36m   🚀 Claude Code + MCP Server Launcher\033[0m"
echo -e "\033[36m===============================================\033[0m"
echo ""

# 색상 코드 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
GRAY='\033[0;90m'
NC='\033[0m' # No Color

# 1. 환경변수 로드
echo -e "${YELLOW}STEP 1: Loading environment variables...${NC}"
source "$(dirname "$0")/load-mcp-env.sh"

if [ $? -ne 0 ]; then
    echo ""
    echo -e "${RED}❌ Failed to load environment variables. Exiting...${NC}"
    exit 1
fi

# 2. Claude API 재시작 (환경변수 적용)
echo ""
echo -e "${YELLOW}STEP 2: Restarting Claude API to apply environment...${NC}"
echo -e "${GRAY}  Executing: claude api restart${NC}"
claude api restart

sleep 2

# 3. MCP 서버 상태 확인
echo ""
echo -e "${YELLOW}STEP 3: Checking MCP servers connection status...${NC}"
echo -e "${GRAY}  Executing: claude mcp list${NC}"
echo ""
claude mcp list

# 4. 환경변수 상세 검증
echo ""
echo -e "${YELLOW}STEP 4: Detailed environment verification...${NC}"

# 함수: 변수 확인
check_var() {
    local var_name=$1
    local service_name=$2
    local is_required=$3
    local docs=$4
    
    if [ ! -z "${!var_name}" ]; then
        local masked_value="${!var_name:0:10}..."
        echo -e "  ${GREEN}✅ ${service_name}${NC}"
        echo -e "${GRAY}     Variable: ${var_name}${NC}"
        echo -e "${GRAY}     Status: Configured (${masked_value})${NC}"
        return 0
    else
        if [ "$is_required" = "true" ]; then
            echo -e "  ${RED}❌ ${service_name}${NC}"
            echo -e "${GRAY}     Variable: ${var_name}${NC}"
            echo -e "${YELLOW}     Get key from: ${docs}${NC}"
            return 1
        else
            echo -e "  ${GRAY}⚪ ${service_name} - Not configured (optional)${NC}"
            return 2
        fi
    fi
}

core_ready=true
optional_count=0
supabase_count=0

echo ""
echo -e "${CYAN}🔐 Core MCP Services:${NC}"
check_var "TAVILY_API_KEY" "Tavily Web Search" "true" "https://tavily.com" || core_ready=false
check_var "SUPABASE_ACCESS_TOKEN" "Supabase Database" "true" "Supabase Dashboard > Account > Access Tokens" || core_ready=false

echo ""
echo -e "${CYAN}📦 Optional Services:${NC}"
check_var "GITHUB_TOKEN" "GitHub API" "false" "GitHub Settings > Developer settings"
[ $? -eq 0 ] && ((optional_count++))
check_var "GOOGLE_AI_API_KEY" "Google AI (Gemini)" "false" "https://makersuite.google.com/app/apikey"
[ $? -eq 0 ] && ((optional_count++))

echo ""
echo -e "${CYAN}🗄️ Supabase Extended Config:${NC}"
check_var "SUPABASE_URL" "Supabase Project URL" "false" "Supabase Dashboard > Settings > API"
[ $? -eq 0 ] && ((supabase_count++))
check_var "SUPABASE_PROJECT_REF" "Supabase Project Reference" "false" "From Supabase URL"
[ $? -eq 0 ] && ((supabase_count++))

# 5. 최종 상태 요약
echo ""
echo -e "${CYAN}===============================================${NC}"
echo -e "${CYAN}   📊 Final Status Report${NC}"
echo -e "${CYAN}===============================================${NC}"
echo ""

if [ "$core_ready" = true ]; then
    echo -e "${GREEN}✨ Core MCP services are fully configured!${NC}"
    echo -e "${GRAY}   - Tavily Web Search: Ready${NC}"
    echo -e "${GRAY}   - Supabase Database: Ready${NC}"
else
    echo -e "${YELLOW}⚠️  Some core MCP services are not configured${NC}"
    echo -e "${YELLOW}   Please add the missing API keys to .env.local${NC}"
fi

echo ""
echo -e "${CYAN}📈 Service Coverage:${NC}"
if [ "$core_ready" = true ]; then
    echo -e "${GRAY}   Core Services: 2/2 ✅${NC}"
else
    echo -e "${GRAY}   Core Services: Incomplete ⚠️${NC}"
fi
echo -e "${GRAY}   Optional Services: ${optional_count}/2 configured${NC}"
echo -e "${GRAY}   Supabase Extended: ${supabase_count}/2 configured${NC}"

echo ""
echo -e "${GREEN}🎯 You can now use Claude Code with MCP servers!${NC}"
echo -e "${GRAY}   Command: claude${NC}"
echo ""

# 6. 유용한 명령어 제공
echo -e "${CYAN}📝 Useful Commands:${NC}"
echo -e "${GRAY}   claude mcp list         - List all MCP servers${NC}"
echo -e "${GRAY}   claude api restart      - Restart Claude API${NC}"
echo -e "${GRAY}   claude --help          - Show Claude help${NC}"
echo ""
echo -e "${CYAN}📚 Documentation:${NC}"
echo -e "${GRAY}   MCP Usage Guide: docs/mcp-usage-guide-2025.md${NC}"
echo -e "${GRAY}   Environment Setup: docs/mcp-environment-variables-guide.md${NC}"
echo ""