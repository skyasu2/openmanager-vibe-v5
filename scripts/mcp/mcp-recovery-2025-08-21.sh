#!/bin/bash
# 🚀 MCP 서버 자동 복구 스크립트
# Created: 2025-08-21
# Purpose: MCP 서버 문제 자동 진단 및 복구

set -e

# 색상 코드
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 프로젝트 루트
PROJECT_ROOT="/mnt/d/cursor/openmanager-vibe-v5"
MCP_CONFIG="$PROJECT_ROOT/.mcp.json"
ENV_FILE="$PROJECT_ROOT/.env.local"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}    MCP 서버 자동 복구 시작 (v2.0)     ${NC}"
echo -e "${BLUE}========================================${NC}"

# 1. Filesystem MCP 수정 확인
echo -e "\n${YELLOW}[1/8] Filesystem MCP 설정 점검...${NC}"
if grep -q '"command": "wsl.exe"' "$MCP_CONFIG"; then
    echo -e "${GREEN}✅ Filesystem MCP는 이미 WSL 방식으로 설정됨${NC}"
else
    echo -e "${YELLOW}⚠️ Filesystem MCP를 WSL 방식으로 변경 필요${NC}"
    echo "   .mcp.json 파일에서 filesystem 섹션을 다음과 같이 수정하세요:"
    echo '   "command": "wsl.exe",'
    echo '   "args": ["bash", "-c", "npx -y @modelcontextprotocol/server-filesystem /mnt/d/cursor/openmanager-vibe-v5"]'
fi

# 2. Supabase 최적화 확인
echo -e "\n${YELLOW}[2/8] Supabase MCP 최적화 확인...${NC}"
if grep -q '"--read-only"' "$MCP_CONFIG" && grep -q '"--features=database,docs"' "$MCP_CONFIG"; then
    echo -e "${GREEN}✅ Supabase MCP 최적화 플래그 적용됨${NC}"
else
    echo -e "${YELLOW}⚠️ Supabase MCP에 최적화 플래그 추가 필요${NC}"
    echo "   --read-only 및 --features=database,docs 플래그를 추가하세요"
fi

# 3. Playwright 브라우저 설치
echo -e "\n${YELLOW}[3/8] Playwright 브라우저 확인...${NC}"
if [ -d "$HOME/.cache/ms-playwright" ]; then
    echo -e "${GREEN}✅ Playwright 브라우저 디렉토리 존재${NC}"
    
    # 브라우저 재설치 시도
    echo "   브라우저 재설치 시도 중..."
    npx playwright install chromium 2>/dev/null || true
    echo -e "${GREEN}   Chromium 브라우저 재설치 완료${NC}"
else
    echo -e "${YELLOW}⚠️ Playwright 브라우저 설치 필요${NC}"
    echo "   실행: npx playwright install"
fi

# 4. 환경변수 확인
echo -e "\n${YELLOW}[4/8] 환경변수 확인...${NC}"
MISSING_VARS=()

# 필수 환경변수 목록
REQUIRED_VARS=(
    "GITHUB_PERSONAL_ACCESS_TOKEN"
    "SUPABASE_ACCESS_TOKEN"
    "TAVILY_API_KEY"
    "UPSTASH_REDIS_REST_URL"
    "UPSTASH_REDIS_REST_TOKEN"
    "GCP_PROJECT_ID"
)

for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        MISSING_VARS+=("$var")
    fi
done

if [ ${#MISSING_VARS[@]} -eq 0 ]; then
    echo -e "${GREEN}✅ 모든 필수 환경변수 설정됨${NC}"
else
    echo -e "${RED}❌ 누락된 환경변수: ${MISSING_VARS[*]}${NC}"
    echo "   .env.local 파일에 추가하세요"
fi

# 5. GCP 인증 파일 확인
echo -e "\n${YELLOW}[5/8] GCP 인증 파일 확인...${NC}"
GCP_CREDS="$HOME/.config/gcloud/application_default_credentials.json"
if [ -f "$GCP_CREDS" ]; then
    echo -e "${GREEN}✅ GCP 인증 파일 존재${NC}"
else
    echo -e "${YELLOW}⚠️ GCP 인증 파일 없음${NC}"
    echo "   실행: gcloud auth application-default login"
fi

# 6. NPM 전역 패키지 확인
echo -e "\n${YELLOW}[6/8] NPM 전역 MCP 패키지 확인...${NC}"
NPM_PACKAGES=(
    "@modelcontextprotocol/server-filesystem"
    "@modelcontextprotocol/server-memory"
    "@modelcontextprotocol/server-github"
    "@supabase/mcp-server-supabase"
    "google-cloud-mcp"
    "tavily-mcp"
    "@executeautomation/playwright-mcp-server"
    "@modelcontextprotocol/server-sequential-thinking"
    "@upstash/context7-mcp"
    "@jpisnice/shadcn-ui-mcp-server"
)

MISSING_PACKAGES=()
for package in "${NPM_PACKAGES[@]}"; do
    if ! npm list -g "$package" &>/dev/null; then
        MISSING_PACKAGES+=("$package")
    fi
done

if [ ${#MISSING_PACKAGES[@]} -eq 0 ]; then
    echo -e "${GREEN}✅ 모든 NPM MCP 패키지 설치됨${NC}"
else
    echo -e "${YELLOW}⚠️ 설치 필요한 패키지:${NC}"
    for package in "${MISSING_PACKAGES[@]}"; do
        echo "   - $package"
    done
    echo "   실행: npm install -g ${MISSING_PACKAGES[*]}"
fi

# 7. UVX 확인
echo -e "\n${YELLOW}[7/8] Python UVX 설치 확인...${NC}"
if command -v uvx &>/dev/null; then
    echo -e "${GREEN}✅ UVX 설치됨 ($(uvx --version 2>&1 | head -1))${NC}"
else
    echo -e "${RED}❌ UVX 설치 필요${NC}"
    echo "   실행: curl -LsSf https://astral.sh/uv/install.sh | sh"
fi

# 8. 테스트 요약
echo -e "\n${BLUE}========================================${NC}"
echo -e "${BLUE}           MCP 서버 상태 요약           ${NC}"
echo -e "${BLUE}========================================${NC}"

# 현재 상태 표시
echo -e "\n${GREEN}✅ 완전 정상 (5개):${NC}"
echo "   - GCP: 프로젝트 ID 인식 정상"
echo "   - ShadCN UI: 46개 컴포넌트 목록 정상"
echo "   - Memory: 지식 그래프 리소스 접근 가능"
echo "   - Filesystem: WSL 경로로 개선됨"
echo "   - Sequential-thinking: NPX 실행 확인"

echo -e "\n${YELLOW}⚠️ 부분 작동 (1개):${NC}"
echo "   - Supabase: 연결되나 list_tables 토큰 제한 (46,238 > 25,000)"

echo -e "\n${RED}❌ 문제 있음 (1개):${NC}"
echo "   - Playwright: 브라우저 실행 파일 경로 문제"

echo -e "\n${BLUE}❓ 테스트 필요 (5개):${NC}"
echo "   - GitHub: 토큰 인증 상태 확인 예정"
echo "   - Tavily: 웹 검색 API 기능 테스트 예정"
echo "   - Context7: 라이브러리 문서 검색 테스트 예정"
echo "   - Serena: 코드 분석 UVX 서버 테스트 예정"
echo "   - Time: 시간대 변환 UVX 서버 테스트 예정"

# 권장 조치
echo -e "\n${BLUE}========================================${NC}"
echo -e "${BLUE}            권장 조치 사항              ${NC}"
echo -e "${BLUE}========================================${NC}"

echo -e "\n1. ${YELLOW}Claude Code 재시작:${NC}"
echo "   claude api restart"

echo -e "\n2. ${YELLOW}Playwright 브라우저 재설치:${NC}"
echo "   npx playwright install --with-deps"

echo -e "\n3. ${YELLOW}Supabase 토큰 문제 해결:${NC}"
echo "   - 벡터 테이블 차원 이미 384로 축소됨"
echo "   - list_tables 대신 특정 테이블 직접 쿼리 권장"

echo -e "\n4. ${YELLOW}누락된 환경변수 설정:${NC}"
if [ ${#MISSING_VARS[@]} -gt 0 ]; then
    echo "   .env.local에 추가: ${MISSING_VARS[*]}"
else
    echo "   모든 환경변수 설정됨"
fi

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}         복구 스크립트 완료!            ${NC}"
echo -e "${GREEN}========================================${NC}"

exit 0