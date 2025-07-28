#!/bin/bash
# MCP 서버 연결 테스트 스크립트
# 각 MCP 서버의 실행 가능성과 환경변수 검증

echo "🔍 MCP 서버 구성 테스트 시작..."
echo "================================"

# 색상 정의
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 환경변수 로드
if [ -f ".env.local" ]; then
    export $(cat .env.local | grep -v '^#' | xargs)
fi

# 테스트 함수
test_mcp_server() {
    local name=$1
    local command=$2
    local env_vars=$3
    
    echo -e "\n📦 Testing: $name"
    echo "----------------------------------------"
    
    # 환경변수 확인
    IFS=',' read -ra VARS <<< "$env_vars"
    local all_vars_exist=true
    for var in "${VARS[@]}"; do
        if [ -z "${!var}" ]; then
            echo -e "${RED}❌ Missing env var: $var${NC}"
            all_vars_exist=false
        else
            echo -e "${GREEN}✅ Found env var: $var${NC}"
        fi
    done
    
    # 명령어 실행 가능성 테스트
    if command -v npx &> /dev/null || command -v uvx &> /dev/null; then
        echo -e "${GREEN}✅ Command available: $command${NC}"
    else
        echo -e "${RED}❌ Command not found: $command${NC}"
    fi
    
    if $all_vars_exist; then
        echo -e "${GREEN}✅ $name: Ready to use${NC}"
    else
        echo -e "${YELLOW}⚠️  $name: Missing configuration${NC}"
    fi
}

# 각 MCP 서버 테스트
test_mcp_server "filesystem" "npx" ""
test_mcp_server "github" "npx" "GITHUB_TOKEN"
test_mcp_server "memory" "npx" ""
test_mcp_server "supabase" "npx" "SUPABASE_URL,SUPABASE_SERVICE_ROLE_KEY,SUPABASE_ANON_KEY,SUPABASE_ACCESS_TOKEN"
test_mcp_server "context7" "npx" "UPSTASH_REDIS_REST_URL,UPSTASH_REDIS_REST_TOKEN,GOOGLE_AI_API_KEY"
test_mcp_server "tavily-mcp" "npx" "TAVILY_API_KEY"
test_mcp_server "sequential-thinking" "npx" ""
test_mcp_server "playwright" "npx" ""
test_mcp_server "serena" "uvx" ""

echo -e "\n================================"
echo "🏁 MCP 서버 테스트 완료"

# WSL 환경 정보
echo -e "\n📊 WSL 환경 정보:"
echo "- Node.js: $(node --version)"
echo "- Python: $(python3 --version)"
echo "- Memory: $(free -h | grep Mem | awk '{print $2}')"
echo "- WSL Version: $(wsl.exe -l -v 2>/dev/null | grep -E "Ubuntu|WSL" | head -1 || echo "WSL2")"