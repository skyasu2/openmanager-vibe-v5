#!/bin/bash
# 통합 MCP 서버 설정 스크립트
# Windows WSL 환경에서 Claude Code MCP 서버 설정

set -e

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 프로젝트 루트 경로
PROJECT_ROOT="/mnt/d/cursor/openmanager-vibe-v5"
ENV_FILE="$PROJECT_ROOT/.env.local"
MCP_CONFIG="$HOME/.config/claude/claude_desktop_config.json"

echo -e "${BLUE}🚀 MCP 서버 통합 설정 시작${NC}"
echo "================================"

# 1. 환경 확인
check_environment() {
    echo -e "\n${YELLOW}1. 환경 확인${NC}"
    
    # WSL 확인
    if grep -q Microsoft /proc/version; then
        echo -e "${GREEN}✅ WSL 환경 확인됨${NC}"
    else
        echo -e "${RED}❌ WSL 환경이 아닙니다${NC}"
        exit 1
    fi
    
    # Node.js 확인
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node -v)
        echo -e "${GREEN}✅ Node.js 설치됨: $NODE_VERSION${NC}"
    else
        echo -e "${RED}❌ Node.js가 설치되지 않았습니다${NC}"
        exit 1
    fi
    
    # 프로젝트 디렉토리 확인
    if [ -d "$PROJECT_ROOT" ]; then
        echo -e "${GREEN}✅ 프로젝트 디렉토리 확인됨${NC}"
    else
        echo -e "${RED}❌ 프로젝트 디렉토리를 찾을 수 없습니다: $PROJECT_ROOT${NC}"
        exit 1
    fi
}

# 2. 환경 변수 설정
setup_env_variables() {
    echo -e "\n${YELLOW}2. 환경 변수 설정${NC}"
    
    if [ -f "$ENV_FILE" ]; then
        echo -e "${GREEN}✅ .env.local 파일 발견${NC}"
        
        # 환경 변수 로드
        set -a
        source <(grep -v '^#' "$ENV_FILE" | grep -v '^$')
        set +a
        
        # 필수 환경 변수 확인
        echo -e "\n${BLUE}📋 필수 환경 변수 상태:${NC}"
        
        check_env_var() {
            local var_name=$1
            local var_value=${!var_name}
            
            if [ -n "$var_value" ]; then
                echo -e "${GREEN}✅ $var_name: 설정됨${NC}"
                return 0
            else
                echo -e "${RED}❌ $var_name: 미설정${NC}"
                return 1
            fi
        }
        
        local all_set=true
        
        # Supabase
        check_env_var "SUPABASE_URL" || all_set=false
        check_env_var "SUPABASE_SERVICE_ROLE_KEY" || all_set=false
        
        # GitHub
        check_env_var "GITHUB_TOKEN" || all_set=false
        
        # Tavily
        check_env_var "TAVILY_API_KEY" || all_set=false
        
        if [ "$all_set" = false ]; then
            echo -e "\n${YELLOW}⚠️  일부 환경 변수가 설정되지 않았습니다${NC}"
            echo "필요한 환경 변수를 .env.local 파일에 추가해주세요"
        fi
    else
        echo -e "${RED}❌ .env.local 파일을 찾을 수 없습니다${NC}"
        echo -e "${YELLOW}💡 .env.local.example을 참고하여 생성해주세요${NC}"
        exit 1
    fi
}

# 3. MCP 서버 설치
install_mcp_servers() {
    echo -e "\n${YELLOW}3. MCP 서버 설치${NC}"
    
    cd "$PROJECT_ROOT"
    
    # 필수 MCP 서버 목록
    declare -a mcp_servers=(
        "@modelcontextprotocol/server-filesystem"
        "@modelcontextprotocol/server-github" 
        "@modelcontextprotocol/server-memory"
        "@supabase/mcp"
        "@context-labs/context7-mcp"
        "@tavily/mcp"
        "@modelcontextprotocol/server-sequential-thinking"
        "@executeautomation/playwright-mcp-server"
        "@joshuarileydev/serena"
    )
    
    for server in "${mcp_servers[@]}"; do
        echo -e "\n${BLUE}📦 설치 중: $server${NC}"
        if npm list "$server" &>/dev/null; then
            echo -e "${GREEN}✅ 이미 설치됨${NC}"
        else
            npm install -g "$server"
            echo -e "${GREEN}✅ 설치 완료${NC}"
        fi
    done
}

# 4. Claude 설정 파일 생성
create_claude_config() {
    echo -e "\n${YELLOW}4. Claude 설정 파일 생성${NC}"
    
    mkdir -p "$(dirname "$MCP_CONFIG")"
    
    # 기존 설정 백업
    if [ -f "$MCP_CONFIG" ]; then
        cp "$MCP_CONFIG" "$MCP_CONFIG.backup.$(date +%Y%m%d_%H%M%S)"
        echo -e "${GREEN}✅ 기존 설정 백업 완료${NC}"
    fi
    
    # 새 설정 생성
    cat > "$MCP_CONFIG" << 'EOF'
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/mnt/d/cursor/openmanager-vibe-v5"]
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_TOKEN": "${GITHUB_TOKEN}"
      }
    },
    "memory": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-memory"]
    },
    "supabase": {
      "command": "npx",
      "args": ["@supabase/mcp"],
      "env": {
        "SUPABASE_URL": "${SUPABASE_URL}",
        "SUPABASE_SERVICE_ROLE_KEY": "${SUPABASE_SERVICE_ROLE_KEY}"
      }
    },
    "context7": {
      "command": "npx",
      "args": ["-y", "@context-labs/context7-mcp"]
    },
    "tavily-mcp": {
      "command": "npx",
      "args": ["-y", "@tavily/mcp"],
      "env": {
        "TAVILY_API_KEY": "${TAVILY_API_KEY}"
      }
    },
    "sequential-thinking": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-sequential-thinking"]
    },
    "playwright": {
      "command": "npx",
      "args": ["-y", "@executeautomation/playwright-mcp-server"]
    },
    "serena": {
      "command": "npx",
      "args": ["-y", "@joshuarileydev/serena", "config", "/mnt/d/cursor/openmanager-vibe-v5"]
    }
  }
}
EOF
    
    echo -e "${GREEN}✅ Claude 설정 파일 생성 완료${NC}"
}

# 5. 검증
validate_setup() {
    echo -e "\n${YELLOW}5. 설정 검증${NC}"
    
    if [ -f "$MCP_CONFIG" ]; then
        echo -e "${GREEN}✅ MCP 설정 파일 존재${NC}"
        
        # JSON 유효성 검사
        if python3 -m json.tool "$MCP_CONFIG" > /dev/null 2>&1; then
            echo -e "${GREEN}✅ 설정 파일 JSON 유효성 확인${NC}"
        else
            echo -e "${RED}❌ 설정 파일 JSON 오류${NC}"
            exit 1
        fi
    else
        echo -e "${RED}❌ MCP 설정 파일이 없습니다${NC}"
        exit 1
    fi
}

# 6. 완료 메시지
show_completion_message() {
    echo -e "\n${GREEN}🎉 MCP 서버 설정 완료!${NC}"
    echo "================================"
    echo -e "${BLUE}다음 단계:${NC}"
    echo "1. Claude Code를 완전히 종료 (Ctrl+Shift+P → 'Exit')"
    echo "2. Claude Code 재시작"
    echo "3. MCP 서버 활성화 확인"
    echo ""
    echo -e "${YELLOW}💡 문제 발생 시:${NC}"
    echo "- 로그 확인: ~/.config/claude/logs/"
    echo "- 설정 재검증: ./scripts/mcp/validate.sh"
    echo "- 설정 초기화: ./scripts/mcp/reset.sh"
}

# 메인 실행
main() {
    check_environment
    setup_env_variables
    install_mcp_servers
    create_claude_config
    validate_setup
    show_completion_message
}

# 스크립트 실행
main "$@"