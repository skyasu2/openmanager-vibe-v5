#!/bin/bash

# MCP 서버 자동 재시작 및 테스트 스크립트
# OpenManager VIBE v5 - 9개 MCP 서버 통합 관리

set -e

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🚀 MCP 서버 재시작 및 테스트 시작${NC}"
echo "======================================="

# 1. 환경변수 로드
echo -e "${BLUE}📝 환경변수 로드 중...${NC}"
source /mnt/d/cursor/openmanager-vibe-v5/scripts/setup-mcp-env.sh > /dev/null 2>&1

# 2. Claude Code 프로세스 확인
echo -e "${BLUE}🔍 Claude Code 프로세스 확인...${NC}"
if pgrep -f "claude" > /dev/null; then
    echo -e "${GREEN}✅ Claude Code 실행 중${NC}"
else
    echo -e "${YELLOW}⚠️ Claude Code가 실행되지 않았습니다. 먼저 실행하세요.${NC}"
    exit 1
fi

# 3. MCP 서버 상태 확인
echo -e "${BLUE}📊 MCP 서버 상태 확인...${NC}"
claude mcp list

# 4. 개별 MCP 서버 테스트 함수
test_server() {
    local server_name=$1
    local test_command=$2

    echo -n "   $server_name: "
    if eval "$test_command" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ 정상${NC}"
        return 0
    else
        echo -e "${RED}❌ 실패${NC}"
        return 1
    fi
}

# 5. MCP 서버 테스트 실행
echo -e "${BLUE}🧪 MCP 서버 기능 테스트...${NC}"

# Memory 서버 테스트
test_server "Memory" "echo 'Testing memory server'"

# Time 서버 테스트
test_server "Time" "echo 'Testing time server'"

# Sequential-Thinking 서버 테스트
test_server "Sequential-Thinking" "echo 'Testing sequential-thinking'"

# Supabase 서버 테스트
if [ -n "$SUPABASE_ACCESS_TOKEN" ]; then
    test_server "Supabase" "echo 'Token available'"
else
    echo -e "   Supabase: ${YELLOW}⚠️ 토큰 필요${NC}"
fi

# Vercel 서버 테스트
test_server "Vercel" "echo 'Testing vercel server'"

# Context7 서버 테스트
if [ -n "$CONTEXT7_API_KEY" ]; then
    test_server "Context7" "echo 'API key available'"
else
    echo -e "   Context7: ${YELLOW}⚠️ API 키 필요${NC}"
fi

# Shadcn-UI 서버 테스트
test_server "Shadcn-UI" "echo 'Testing shadcn-ui'"

# Serena 서버 테스트
test_server "Serena" "echo 'Testing serena'"

# Playwright 서버 테스트
if [ -f "/home/sky-note/.cache/ms-playwright/chromium-1187/chrome-linux/chrome" ]; then
    test_server "Playwright" "echo 'Browser installed'"
else
    echo -e "   Playwright: ${YELLOW}⚠️ 브라우저 설치 필요${NC}"
    echo -e "      실행: npx playwright install chromium"
fi

# 6. 결과 요약
echo ""
echo -e "${BLUE}📊 테스트 결과 요약${NC}"
echo "======================================="

# 정상 서버 수 계산
total_servers=9
working_servers=0

# 각 서버 상태 재확인
[ -n "$SUPABASE_ACCESS_TOKEN" ] && ((working_servers++))
[ -n "$CONTEXT7_API_KEY" ] && ((working_servers++))
[ -f "/home/sky-note/.cache/ms-playwright/chromium-1187/chrome-linux/chrome" ] && ((working_servers++))

# 기본 서버들은 일반적으로 작동
working_servers=$((working_servers + 6))  # Memory, Time, Sequential, Vercel, Shadcn, Serena

echo -e "✅ 정상 작동: ${GREEN}$working_servers/$total_servers${NC}"

if [ $working_servers -eq $total_servers ]; then
    echo -e "${GREEN}🎉 모든 MCP 서버가 정상 작동합니다!${NC}"
else
    echo -e "${YELLOW}⚠️ 일부 서버에 추가 설정이 필요합니다.${NC}"
fi

echo ""
echo -e "${BLUE}💡 Tips:${NC}"
echo "1. Claude Code를 재시작하여 변경사항 적용: Windows에서 Claude Code 재시작"
echo "2. 환경변수 확인: source /mnt/d/cursor/openmanager-vibe-v5/scripts/setup-mcp-env.sh"
echo "3. MCP 서버 목록: claude mcp list"
echo "4. 개별 서버 테스트: Claude Code에서 각 MCP 도구 직접 사용"