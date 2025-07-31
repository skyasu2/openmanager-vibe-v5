#!/bin/bash
# MCP 설정 검증 스크립트 (CLI 기반)
# Claude Code v1.16.0+

set -e

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 프로젝트 경로
PROJECT_ROOT="/mnt/d/cursor/openmanager-vibe-v5"
ENV_FILE="$PROJECT_ROOT/.env.local"

echo -e "${BLUE}🔍 MCP 설정 검증 시작...${NC}"
echo "================================"

# 1. CLI 도구 확인
echo -e "\n${YELLOW}1. CLI 도구 확인${NC}"

# Claude Code CLI 확인
if command -v claude &> /dev/null; then
    CLAUDE_VERSION=$(claude --version 2>/dev/null || echo "버전 확인 불가")
    echo -e "${GREEN}✅ Claude Code CLI 설치됨: $CLAUDE_VERSION${NC}"
else
    echo -e "${RED}❌ Claude Code CLI가 설치되지 않았습니다${NC}"
    exit 1
fi

# uvx 확인 (Python MCP 서버용)
if command -v uvx &> /dev/null; then
    UVX_VERSION=$(uvx --version 2>/dev/null || echo "버전 확인 불가")
    echo -e "${GREEN}✅ uvx 설치됨: $UVX_VERSION${NC}"
else
    echo -e "${YELLOW}⚠️  uvx가 설치되지 않았습니다 (Python MCP 서버 필요)${NC}"
fi

# 2. MCP 서버 상태 확인
echo -e "\n${YELLOW}2. MCP 서버 연결 상태${NC}"

# MCP 서버 목록 가져오기
echo -e "${BLUE}현재 설정된 MCP 서버:${NC}"
claude mcp list || {
    echo -e "${RED}❌ MCP 서버 목록을 가져올 수 없습니다${NC}"
    exit 1
}

# 연결 상태 분석
CONNECTED_COUNT=$(claude mcp list | grep -c "✓ Connected" || true)
FAILED_COUNT=$(claude mcp list | grep -c "✗ Failed" || true)
TOTAL_COUNT=$((CONNECTED_COUNT + FAILED_COUNT))

echo -e "\n${BLUE}📊 연결 통계:${NC}"
echo -e "- 전체 서버: $TOTAL_COUNT개"
echo -e "- 연결 성공: ${GREEN}$CONNECTED_COUNT개${NC}"
echo -e "- 연결 실패: ${RED}$FAILED_COUNT개${NC}"

# 3. 환경변수 확인
echo -e "\n${YELLOW}3. 환경변수 확인${NC}"

if [ -f "$ENV_FILE" ]; then
    echo -e "${GREEN}✅ .env.local 파일 존재${NC}"
    
    # 환경변수 로드
    set -a
    source <(grep -v '^#' "$ENV_FILE" | grep -v '^$') 2>/dev/null || true
    set +a
    
    # 필수 환경변수 확인
    declare -A env_vars=(
        ["GITHUB_TOKEN"]="GitHub MCP"
        ["SUPABASE_URL"]="Supabase MCP"
        ["SUPABASE_SERVICE_ROLE_KEY"]="Supabase MCP"
        ["TAVILY_API_KEY"]="Tavily MCP"
        ["UPSTASH_REDIS_REST_URL"]="Context7 MCP"
        ["UPSTASH_REDIS_REST_TOKEN"]="Context7 MCP"
    )
    
    MISSING_ENV=0
    for var in "${!env_vars[@]}"; do
        if [ -n "${!var}" ]; then
            echo -e "${GREEN}✅ $var: 설정됨${NC} (${env_vars[$var]})"
        else
            echo -e "${RED}❌ $var: 미설정${NC} (${env_vars[$var]})"
            ((MISSING_ENV++))
        fi
    done
    
    if [ $MISSING_ENV -gt 0 ]; then
        echo -e "\n${YELLOW}⚠️  $MISSING_ENV개의 환경변수가 설정되지 않았습니다${NC}"
    fi
else
    echo -e "${RED}❌ .env.local 파일이 없습니다${NC}"
fi

# 4. 프로젝트 공유 설정 확인
echo -e "\n${YELLOW}4. 프로젝트 설정 파일${NC}"

# .mcp.json 확인
if [ -f "$PROJECT_ROOT/.mcp.json" ]; then
    echo -e "${GREEN}✅ .mcp.json 파일 존재 (프로젝트 공유용)${NC}"
    
    # JSON 유효성 검사
    if python3 -m json.tool "$PROJECT_ROOT/.mcp.json" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ .mcp.json 문법 올바름${NC}"
    else
        echo -e "${RED}❌ .mcp.json 문법 오류${NC}"
    fi
else
    echo -e "${YELLOW}ℹ️  .mcp.json 파일 없음 (CLI 설정만 사용 중)${NC}"
fi

# 레거시 파일 확인
if [ -f "$PROJECT_ROOT/.claude/mcp.json" ]; then
    echo -e "${YELLOW}⚠️  레거시 .claude/mcp.json 파일 발견 (더 이상 사용되지 않음)${NC}"
fi

# 5. 개별 서버 상태 상세 확인
echo -e "\n${YELLOW}5. 개별 서버 상태 상세${NC}"

# 연결 실패한 서버 목록
FAILED_SERVERS=$(claude mcp list | grep "✗ Failed" | awk -F':' '{print $1}' || true)

if [ -n "$FAILED_SERVERS" ]; then
    echo -e "\n${RED}연결 실패한 서버:${NC}"
    for server in $FAILED_SERVERS; do
        echo -e "- ${RED}$server${NC}"
        
        # 서버별 해결 방법 제시
        case $server in
            "supabase")
                echo -e "  ${YELLOW}해결: --project-ref 인자 필요${NC}"
                echo -e "  ${BLUE}claude mcp remove supabase${NC}"
                echo -e "  ${BLUE}claude mcp add supabase npx -e SUPABASE_URL=... -e SUPABASE_SERVICE_ROLE_KEY=... -- -y @supabase/mcp-server-supabase@latest --project-ref=YOUR_PROJECT_ID${NC}"
                ;;
            "github")
                echo -e "  ${YELLOW}해결: GitHub 토큰 확인${NC}"
                echo -e "  ${BLUE}GITHUB_TOKEN 환경변수 설정 필요${NC}"
                ;;
            "tavily-mcp")
                echo -e "  ${YELLOW}해결: Tavily API 키 확인${NC}"
                echo -e "  ${BLUE}TAVILY_API_KEY 환경변수 설정 필요${NC}"
                ;;
            *)
                echo -e "  ${YELLOW}해결: 로그 확인 필요${NC}"
                ;;
        esac
    done
fi

# 6. 권장사항
echo -e "\n${YELLOW}6. 검증 결과 및 권장사항${NC}"
echo "================================"

if [ "$CONNECTED_COUNT" -eq "$TOTAL_COUNT" ] && [ "$TOTAL_COUNT" -gt 0 ]; then
    echo -e "${GREEN}✅ 모든 MCP 서버가 정상적으로 연결되었습니다!${NC}"
    echo -e "\n${BLUE}현재 상태:${NC}"
    echo "- CLI 기반 설정 활성화"
    echo "- 10개 MCP 서버 모두 정상"
    if [ -f "$PROJECT_ROOT/.mcp.json" ]; then
        echo "- 프로젝트 공유 설정 준비됨"
    fi
elif [ "$CONNECTED_COUNT" -gt 0 ]; then
    echo -e "${YELLOW}⚠️  일부 MCP 서버 연결 문제가 있습니다${NC}"
    echo -e "\n${BLUE}다음 단계:${NC}"
    echo "1. 위의 해결 방법 참고"
    echo "2. claude api restart 실행"
    echo "3. 문제 지속 시 ./scripts/mcp/reset.sh 실행"
else
    echo -e "${RED}❌ MCP 서버 연결에 심각한 문제가 있습니다${NC}"
    echo -e "\n${BLUE}긴급 조치:${NC}"
    echo "1. ./scripts/mcp/setup.sh 재실행"
    echo "2. 환경변수 확인"
    echo "3. Claude Code 재시작"
fi

echo -e "\n${GREEN}✅ MCP 설정 검증 완료!${NC}"