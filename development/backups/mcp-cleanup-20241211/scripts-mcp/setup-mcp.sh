#!/bin/bash
# MCP 완벽 설정 자동화 스크립트 (Linux/macOS)
# 검증된 성공 사례 기반 (2025-06-09)

echo "🚀 MCP 완벽 설정을 시작합니다..."
echo "📌 검증된 성공 사례 기반으로 설정합니다."

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color

# 1. 환경 확인
echo -e "\n${YELLOW}🔍 환경 확인 중...${NC}"

if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✅ Node.js: $NODE_VERSION${NC}"
else
    echo -e "${RED}❌ Node.js가 설치되지 않았습니다. Node.js 18+ 설치가 필요합니다.${NC}"
    exit 1
fi

if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    echo -e "${GREEN}✅ npm: $NPM_VERSION${NC}"
else
    echo -e "${RED}❌ npm이 설치되지 않았습니다.${NC}"
    exit 1
fi

# 2. 디렉토리 생성
echo -e "\n${YELLOW}📁 디렉토리 구조 생성 중...${NC}"
mkdir -p .cursor
mkdir -p mcp-memory
echo -e "${GREEN}✅ .cursor/ 디렉토리 생성 완료${NC}"
echo -e "${GREEN}✅ mcp-memory/ 디렉토리 생성 완료${NC}"

# 3. MCP 설정 파일 생성
echo -e "\n${YELLOW}⚙️ MCP 설정 파일 생성 중...${NC}"
cat > .cursor/mcp.json << 'EOF'
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "."],
      "env": {
        "NODE_OPTIONS": "--max-old-space-size=512"
      },
      "description": "프로젝트 파일 시스템 접근",
      "enabled": true
    },
    "memory": {
      "command": "npx", 
      "args": ["-y", "@modelcontextprotocol/server-memory"],
      "env": {
        "MEMORY_STORE_PATH": "./mcp-memory"
      },
      "description": "지식 그래프 기반 메모리 시스템",
      "enabled": true
    },
    "duckduckgo-search": {
      "command": "npx",
      "args": ["-y", "duckduckgo-mcp-server"],
      "env": {
        "NODE_OPTIONS": "--max-old-space-size=256"
      },
      "description": "DuckDuckGo 웹 검색 (프라이버시 중심)",
      "enabled": true
    },
    "sequential-thinking": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-sequential-thinking"],
      "env": {
        "THINKING_MODE": "development",
        "MAX_DEPTH": "10"
      },
      "description": "고급 순차적 사고 처리",
      "enabled": true
    }
  }
}
EOF

# 프로젝트 루트에도 복사
cp .cursor/mcp.json cursor.mcp.json
echo -e "${GREEN}✅ .cursor/mcp.json 생성 완료${NC}"
echo -e "${GREEN}✅ cursor.mcp.json 생성 완료${NC}"

# 4. Cursor 설정 파일 생성
echo -e "\n${YELLOW}⚙️ Cursor IDE 설정 파일 생성 중...${NC}"
cat > .cursor/settings.json << 'EOF'
{
  "mcp.enabled": true,
  "mcp.servers": {},
  "workbench.sideBar.location": "left",
  "editor.minimap.enabled": true,
  "editor.lineNumbers": "on",
  "files.autoSave": "afterDelay",
  "files.autoSaveDelay": 1000,
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll": "explicit"
  }
}
EOF

echo -e "${GREEN}✅ .cursor/settings.json 생성 완료${NC}"

# 5. 패키지 사전 다운로드 (선택사항)
echo -e "\n${YELLOW}📦 MCP 서버 패키지 사전 캐시 중...${NC}"
echo -e "${CYAN}   이 과정은 첫 실행 시간을 단축시킵니다...${NC}"

if npx -y @modelcontextprotocol/server-filesystem --version > /dev/null 2>&1; then
    echo -e "${GREEN}✅ filesystem 서버 캐시 완료${NC}"
else
    echo -e "${YELLOW}⚠️ filesystem 서버 캐시 실패 (첫 실행 시 다운로드됩니다)${NC}"
fi

if npx -y @modelcontextprotocol/server-memory --version > /dev/null 2>&1; then
    echo -e "${GREEN}✅ memory 서버 캐시 완료${NC}"
else
    echo -e "${YELLOW}⚠️ memory 서버 캐시 실패 (첫 실행 시 다운로드됩니다)${NC}"
fi

if npx -y duckduckgo-mcp-server --version > /dev/null 2>&1; then
    echo -e "${GREEN}✅ duckduckgo-search 서버 캐시 완료${NC}"
else
    echo -e "${YELLOW}⚠️ duckduckgo-search 서버 캐시 실패 (첫 실행 시 다운로드됩니다)${NC}"
fi

if npx -y @modelcontextprotocol/server-sequential-thinking --version > /dev/null 2>&1; then
    echo -e "${GREEN}✅ sequential-thinking 서버 캐시 완료${NC}"
else
    echo -e "${YELLOW}⚠️ sequential-thinking 서버 캐시 실패 (첫 실행 시 다운로드됩니다)${NC}"
fi

# 6. 설정 완료 안내
echo -e "\n${GREEN}🎉 MCP 설정이 완료되었습니다!${NC}"
echo ""
echo -e "${CYAN}📂 생성된 파일들:${NC}"
echo -e "${WHITE}  ├── .cursor/mcp.json${NC}"
echo -e "${WHITE}  ├── .cursor/settings.json${NC}"
echo -e "${WHITE}  ├── cursor.mcp.json${NC}"
echo -e "${WHITE}  └── mcp-memory/${NC}"
echo ""
echo -e "${CYAN}🚀 다음 단계:${NC}"
echo -e "${YELLOW}  1. Cursor IDE를 완전히 종료하세요${NC}"
echo -e "${YELLOW}  2. Cursor IDE를 다시 시작하세요${NC}"
echo -e "${YELLOW}  3. Cmd+Shift+P → 'MCP' 검색으로 패널 확인${NC}"
echo -e "${YELLOW}  4. 모든 서버가 Active 상태인지 확인하세요${NC}"
echo ""
echo -e "${GREEN}✨ 성공하면 4개 MCP 서버가 모두 활성화됩니다!${NC}"
echo -e "${WHITE}   - filesystem (파일 접근)${NC}"
echo -e "${WHITE}   - memory (정보 저장)${NC}"
echo -e "${WHITE}   - duckduckgo-search (웹 검색)${NC}"
echo -e "${WHITE}   - sequential-thinking (고급 사고)${NC}"
echo ""
echo -e "${CYAN}❓ 문제가 있다면 docs/MCP_완벽_설정_가이드.md를 확인하세요.${NC}" 