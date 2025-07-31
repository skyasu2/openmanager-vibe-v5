#!/bin/bash
# MCP 서버 CLI 기반 설정 스크립트
# Claude Code v1.16.0+ CLI 방식

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

echo -e "${BLUE}🚀 MCP 서버 CLI 기반 설정 시작${NC}"
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

# 3. MCP 서버 CLI 설치
install_mcp_servers() {
    echo -e "\n${YELLOW}3. MCP 서버 CLI 설정${NC}"
    
    # 현재 설정된 서버 확인
    echo -e "\n${BLUE}📋 현재 MCP 서버 상태:${NC}"
    claude mcp list || echo -e "${YELLOW}⚠️  MCP 서버가 설정되지 않았습니다${NC}"
    
    # 환경변수 로드
    if [ -f "$ENV_FILE" ]; then
        set -a
        source <(grep -v '^#' "$ENV_FILE" | grep -v '^$')
        set +a
    fi
    
    # MCP 서버 설치
    echo -e "\n${BLUE}🔧 MCP 서버 CLI 설치 시작${NC}"
    
    # 1. Filesystem
    echo -e "\n${BLUE}📦 Filesystem 서버 설정${NC}"
    claude mcp add filesystem npx -- -y @modelcontextprotocol/server-filesystem@latest "$PROJECT_ROOT"
    
    # 2. GitHub
    if [ -n "$GITHUB_TOKEN" ]; then
        echo -e "\n${BLUE}📦 GitHub 서버 설정${NC}"
        claude mcp add github npx -e GITHUB_PERSONAL_ACCESS_TOKEN="$GITHUB_TOKEN" -- -y @modelcontextprotocol/server-github@latest
    fi
    
    # 3. Memory
    echo -e "\n${BLUE}📦 Memory 서버 설정${NC}"
    claude mcp add memory npx -- -y @modelcontextprotocol/server-memory@latest
    
    # 4. Supabase
    if [ -n "$SUPABASE_URL" ] && [ -n "$SUPABASE_SERVICE_ROLE_KEY" ]; then
        echo -e "\n${BLUE}📦 Supabase 서버 설정${NC}"
        # URL에서 프로젝트 ID 추출
        PROJECT_REF=$(echo "$SUPABASE_URL" | sed -E 's|https://([^.]+)\.supabase\.co|\1|')
        claude mcp add supabase npx \
            -e SUPABASE_URL="$SUPABASE_URL" \
            -e SUPABASE_SERVICE_ROLE_KEY="$SUPABASE_SERVICE_ROLE_KEY" \
            -- -y @supabase/mcp-server-supabase@latest \
            --project-ref="$PROJECT_REF"
    fi
    
    # 5. Tavily
    if [ -n "$TAVILY_API_KEY" ]; then
        echo -e "\n${BLUE}📦 Tavily 서버 설정${NC}"
        claude mcp add tavily-mcp npx -e TAVILY_API_KEY="$TAVILY_API_KEY" -- -y tavily-mcp@0.2.9
    fi
    
    # 6. Sequential Thinking
    echo -e "\n${BLUE}📦 Sequential Thinking 서버 설정${NC}"
    claude mcp add sequential-thinking npx -- -y @modelcontextprotocol/server-sequential-thinking@latest
    
    # 7. Playwright
    echo -e "\n${BLUE}📦 Playwright 서버 설정${NC}"
    claude mcp add playwright npx -- -y @playwright/mcp@latest
    
    # 8. Context7
    echo -e "\n${BLUE}📦 Context7 서버 설정${NC}"
    claude mcp add context7 npx -- -y @upstash/context7-mcp@latest
    
    # 9. Time (Python)
    echo -e "\n${BLUE}📦 Time 서버 설정 (Python)${NC}"
    claude mcp add time uvx -- mcp-server-time
    
    # 10. Serena (Python)
    echo -e "\n${BLUE}📦 Serena 서버 설정 (Python)${NC}"
    claude mcp add serena uvx -- \
        --from git+https://github.com/oraios/serena \
        serena-mcp-server \
        --context ide-assistant \
        --project "$PROJECT_ROOT"
}

# 4. 프로젝트 공유 설정 생성 (선택사항)
create_project_mcp_config() {
    echo -e "\n${YELLOW}4. 프로젝트 공유 설정 생성${NC}"
    
    # .mcp.json 파일 생성 여부 확인
    read -p "프로젝트 공유를 위한 .mcp.json 파일을 생성하시겠습니까? (y/N): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        # 프로젝트 루트에 .mcp.json 생성
        cat > "$PROJECT_ROOT/.mcp.json" << 'EOF'
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem@latest", "."]
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github@latest"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_TOKEN}"
      }
    },
    "memory": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-memory@latest"]
    },
    "supabase": {
      "command": "npx",
      "args": ["-y", "@supabase/mcp-server-supabase@latest", "--project-ref", "${SUPABASE_PROJECT_ID}"],
      "env": {
        "SUPABASE_URL": "${SUPABASE_URL}",
        "SUPABASE_SERVICE_ROLE_KEY": "${SUPABASE_SERVICE_ROLE_KEY}"
      }
    },
    "tavily-mcp": {
      "command": "npx",
      "args": ["-y", "tavily-mcp@0.2.9"],
      "env": {
        "TAVILY_API_KEY": "${TAVILY_API_KEY}"
      }
    },
    "sequential-thinking": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-sequential-thinking@latest"]
    },
    "playwright": {
      "command": "npx",
      "args": ["-y", "@playwright/mcp@latest"]
    },
    "context7": {
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp@latest"]
    },
    "time": {
      "command": "uvx",
      "args": ["mcp-server-time"]
    },
    "serena": {
      "command": "uvx",
      "args": ["--from", "git+https://github.com/oraios/serena", "serena-mcp-server", "--context", "ide-assistant", "--project", "."]
    }
  }
}
EOF
        echo -e "${GREEN}✅ .mcp.json 파일 생성 완료${NC}"
    else
        echo -e "${YELLOW}⏭️  .mcp.json 파일 생성을 건너뜁니다${NC}"
    fi
}

# 5. 검증
validate_setup() {
    echo -e "\n${YELLOW}5. 설정 검증${NC}"
    
    # MCP 서버 연결 상태 확인
    echo -e "\n${BLUE}🔍 MCP 서버 연결 상태 확인:${NC}"
    claude mcp list
    
    # 성공적으로 연결된 서버 수 확인
    connected_count=$(claude mcp list | grep -c "✓ Connected" || true)
    total_count=$(claude mcp list | grep -c ":" || true)
    
    echo -e "\n${BLUE}📊 연결 상태: $connected_count/$total_count 서버 연결됨${NC}"
    
    if [ "$connected_count" -eq "$total_count" ] && [ "$total_count" -gt 0 ]; then
        echo -e "${GREEN}✅ 모든 MCP 서버가 정상적으로 연결되었습니다${NC}"
    elif [ "$connected_count" -gt 0 ]; then
        echo -e "${YELLOW}⚠️  일부 MCP 서버가 연결되지 않았습니다${NC}"
    else
        echo -e "${RED}❌ MCP 서버가 연결되지 않았습니다${NC}"
    fi
}

# 6. 완료 메시지
show_completion_message() {
    echo -e "\n${GREEN}🎉 MCP 서버 CLI 설정 완료!${NC}"
    echo "================================"
    echo -e "${BLUE}설정된 내용:${NC}"
    echo "- CLI 기반 MCP 서버 설정 완료"
    echo "- 환경변수 자동 적용"
    if [ -f "$PROJECT_ROOT/.mcp.json" ]; then
        echo "- 프로젝트 공유용 .mcp.json 파일 생성됨"
    fi
    echo ""
    echo -e "${YELLOW}💡 유용한 명령어:${NC}"
    echo "- 서버 상태 확인: claude mcp list"
    echo "- 서버 추가: claude mcp add <name> ..."
    echo "- 서버 제거: claude mcp remove <name>"
    echo "- API 재시작: claude api restart"
    echo ""
    echo -e "${BLUE}문제 해결:${NC}"
    echo "- 상세 가이드: /docs/mcp-servers-complete-guide.md"
    echo "- 검증 스크립트: ./scripts/mcp/validate.sh"
}

# 메인 실행
main() {
    check_environment
    setup_env_variables
    install_mcp_servers
    create_project_mcp_config
    validate_setup
    show_completion_message
}

# 스크립트 실행
main "$@"