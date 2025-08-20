#!/bin/bash

# MCP 서버 의존성 자동 설치 스크립트
# 작성일: 2025-08-20
# 용도: MCP 서버 실행에 필요한 모든 의존성 자동 설치

set -e

echo "🔧 MCP 서버 의존성 설치 시작..."
echo "================================"

# 색상 코드
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Node.js 버전 확인
echo -e "\n${YELLOW}[1/4]${NC} Node.js 확인 중..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✅ Node.js 설치됨: $NODE_VERSION${NC}"
    
    # 버전 체크 (v18 이상 권장)
    MAJOR_VERSION=$(echo $NODE_VERSION | cut -d. -f1 | sed 's/v//')
    if [ "$MAJOR_VERSION" -lt 18 ]; then
        echo -e "${YELLOW}⚠️  Node.js v18+ 권장 (현재: $NODE_VERSION)${NC}"
    fi
else
    echo -e "${RED}❌ Node.js가 설치되지 않았습니다${NC}"
    echo "설치 방법: https://nodejs.org/en/download/"
    exit 1
fi

# 2. Python 및 uvx 설치 (Time, Serena MCP용)
echo -e "\n${YELLOW}[2/4]${NC} Python 패키지 관리자 (uvx) 확인 중..."
if command -v uvx &> /dev/null; then
    UVX_VERSION=$(uvx --version 2>/dev/null || echo "unknown")
    echo -e "${GREEN}✅ uvx 설치됨: $UVX_VERSION${NC}"
else
    echo -e "${YELLOW}⚠️  uvx가 설치되지 않았습니다. 설치를 시작합니다...${NC}"
    
    # uv 설치 (uvx 포함)
    if command -v curl &> /dev/null; then
        curl -LsSf https://astral.sh/uv/install.sh | sh
        
        # PATH 업데이트
        export PATH="$HOME/.local/bin:$PATH"
        
        # bashrc 업데이트
        if ! grep -q ".local/bin" ~/.bashrc; then
            echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
            echo -e "${GREEN}✅ PATH 환경변수 업데이트됨${NC}"
        fi
        
        # 설치 확인
        if command -v uvx &> /dev/null; then
            echo -e "${GREEN}✅ uvx 설치 완료${NC}"
        else
            echo -e "${RED}❌ uvx 설치 실패. 수동 설치 필요${NC}"
            echo "설치 방법: https://github.com/astral-sh/uv"
        fi
    else
        echo -e "${RED}❌ curl이 설치되지 않았습니다${NC}"
        echo "apt-get install curl 또는 brew install curl 실행 필요"
    fi
fi

# 3. GCP CLI 확인 (선택사항)
echo -e "\n${YELLOW}[3/4]${NC} GCP CLI 확인 중... (선택사항)"
if command -v gcloud &> /dev/null; then
    GCLOUD_VERSION=$(gcloud --version | head -n1)
    echo -e "${GREEN}✅ GCP CLI 설치됨: $GCLOUD_VERSION${NC}"
    
    # 인증 상태 확인
    if gcloud auth application-default print-access-token &> /dev/null; then
        echo -e "${GREEN}✅ GCP 인증 설정됨${NC}"
    else
        echo -e "${YELLOW}⚠️  GCP 인증 필요: gcloud auth application-default login${NC}"
    fi
else
    echo -e "${YELLOW}ℹ️  GCP CLI 미설치 (GCP MCP 사용시 필요)${NC}"
    echo "설치 방법: https://cloud.google.com/sdk/docs/install"
fi

# 4. npm 패키지 캐시 준비 (성능 최적화)
echo -e "\n${YELLOW}[4/4]${NC} npm 패키지 캐시 준비 중..."

# npx로 자동 설치되는 패키지들을 미리 캐시
PACKAGES=(
    "@modelcontextprotocol/server-filesystem"
    "@modelcontextprotocol/server-memory"
    "@modelcontextprotocol/server-github"
    "@supabase/mcp-server-supabase@latest"
    "tavily-mcp"
    "@executeautomation/playwright-mcp-server"
    "@modelcontextprotocol/server-sequential-thinking@latest"
    "@upstash/context7-mcp"
    "@jpisnice/shadcn-ui-mcp-server@latest"
)

for package in "${PACKAGES[@]}"; do
    echo -n "  캐싱: $package ... "
    npx -y $package --help > /dev/null 2>&1 && echo -e "${GREEN}✓${NC}" || echo -e "${YELLOW}스킵${NC}"
done

# 5. jq 설치 확인 (JSON 파싱용)
echo -e "\n${YELLOW}[보너스]${NC} jq (JSON 파서) 확인 중..."
if command -v jq &> /dev/null; then
    echo -e "${GREEN}✅ jq 설치됨${NC}"
else
    echo -e "${YELLOW}ℹ️  jq 미설치 (선택사항)${NC}"
    echo "설치: sudo apt-get install jq 또는 brew install jq"
fi

# 최종 요약
echo -e "\n================================"
echo -e "${GREEN}🎉 MCP 의존성 설치 완료!${NC}"
echo -e "================================"

# 체크리스트
echo -e "\n📋 설치 상태 요약:"
echo -e "  ✅ Node.js: $(node --version 2>/dev/null || echo '미설치')"
echo -e "  ✅ npm: $(npm --version 2>/dev/null || echo '미설치')"
echo -e "  ✅ uvx: $(uvx --version 2>/dev/null || echo '미설치')"
echo -e "  $(command -v gcloud &> /dev/null && echo '✅' || echo '⚠️ ') GCP CLI: $(gcloud --version 2>/dev/null | head -n1 || echo '미설치 (선택사항)')"
echo -e "  $(command -v jq &> /dev/null && echo '✅' || echo 'ℹ️ ') jq: $(jq --version 2>/dev/null || echo '미설치 (선택사항)')"

echo -e "\n다음 단계:"
echo -e "1. .env.local 파일 설정"
echo -e "2. source .env.local 실행"
echo -e "3. Claude Code 재시작"
echo -e "4. MCP 도구 테스트"

echo -e "\n💡 도움말: ./diagnose-status.sh로 전체 상태 진단 가능"