#!/bin/bash

# MCP 상태 체크 자동화 스크립트
# 생성일: 2025-09-20
# 목적: MCP 서버 상태 체크 및 문제 진단

set -e

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 로그 파일
LOG_FILE="./logs/mcp-health-check.log"
mkdir -p ./logs

# 현재 시간
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

echo -e "${BLUE}🔍 MCP 서버 상태 체크 시작 - $TIMESTAMP${NC}"
echo "[$TIMESTAMP] MCP Health Check Started" >> "$LOG_FILE"

# 함수: 상태 체크
check_mcp_status() {
    echo -e "\n${YELLOW}📊 MCP 서버 목록 및 연결 상태${NC}"

    # claude mcp list 실행 및 결과 파싱
    MCP_OUTPUT=$(claude mcp list 2>&1)
    echo "$MCP_OUTPUT"

    # 연결된 서버 개수 확인
    CONNECTED_COUNT=$(echo "$MCP_OUTPUT" | grep -c "✓ Connected" 2>/dev/null || echo "0")
    FAILED_COUNT=$(echo "$MCP_OUTPUT" | grep -c "✗ Failed" 2>/dev/null || echo "0")

    # 숫자가 아닌 경우 기본값 설정
    if ! [[ "$CONNECTED_COUNT" =~ ^[0-9]+$ ]]; then
        CONNECTED_COUNT=0
    fi
    if ! [[ "$FAILED_COUNT" =~ ^[0-9]+$ ]]; then
        FAILED_COUNT=0
    fi

    echo -e "\n${GREEN}✅ 연결된 서버: $CONNECTED_COUNT개${NC}"
    if [ "$FAILED_COUNT" -gt 0 ]; then
        echo -e "${RED}❌ 실패한 서버: $FAILED_COUNT개${NC}"
    fi

    echo "[$TIMESTAMP] Connected: $CONNECTED_COUNT, Failed: $FAILED_COUNT" >> "$LOG_FILE"
}

# 함수: 개별 서버 테스트
test_individual_servers() {
    echo -e "\n${YELLOW}🧪 개별 서버 기능 테스트${NC}"

    # Supabase 테스트
    echo -e "\n${BLUE}Testing Supabase MCP...${NC}"
    if claude --verbose 2>&1 | grep -q "mcp__supabase__execute_sql"; then
        echo -e "${GREEN}✅ Supabase MCP 도구 사용 가능${NC}"
        echo "[$TIMESTAMP] Supabase MCP: Available" >> "$LOG_FILE"
    else
        echo -e "${RED}❌ Supabase MCP 도구 사용 불가${NC}"
        echo "[$TIMESTAMP] Supabase MCP: Failed" >> "$LOG_FILE"
    fi

    # Vercel 테스트
    echo -e "\n${BLUE}Testing Vercel MCP...${NC}"
    if claude --verbose 2>&1 | grep -q "mcp__vercel__list_teams"; then
        echo -e "${GREEN}✅ Vercel MCP 도구 사용 가능${NC}"
        echo "[$TIMESTAMP] Vercel MCP: Available" >> "$LOG_FILE"
    else
        echo -e "${RED}❌ Vercel MCP 도구 사용 불가${NC}"
        echo "[$TIMESTAMP] Vercel MCP: Failed" >> "$LOG_FILE"
    fi
}

# 함수: 메모리 사용량 체크
check_memory_usage() {
    echo -e "\n${YELLOW}💾 MCP 프로세스 메모리 사용량${NC}"

    echo -e "${BLUE}Top 5 MCP 관련 프로세스:${NC}"
    ps aux | grep -E "(mcp|serena|supabase|vercel|playwright|shadcn)" | grep -v grep | \
        sort -k4 -rn | head -5 | \
        awk '{printf "%-15s %6s %6s %s\n", $1, $3"%", $4"%", substr($0, index($0,$11))}'

    # 총 메모리 사용량
    TOTAL_MCP_MEM=$(ps aux | grep -E "(mcp|serena|supabase|vercel|playwright|shadcn)" | grep -v grep | awk '{sum+=$4} END {printf "%.1f", sum}')
    echo -e "\n${GREEN}📊 총 MCP 메모리 사용량: ${TOTAL_MCP_MEM}%${NC}"

    echo "[$TIMESTAMP] Total MCP Memory Usage: ${TOTAL_MCP_MEM}%" >> "$LOG_FILE"
}

# 함수: 문제 진단 및 해결 제안
diagnose_issues() {
    echo -e "\n${YELLOW}🔧 문제 진단 및 해결 제안${NC}"

    # WSL 메모리 상태 확인
    AVAILABLE_MEM=$(free -h | awk '/^Mem:/ {print $7}')
    echo -e "${BLUE}💾 WSL 사용 가능 메모리: $AVAILABLE_MEM${NC}"

    # 좀비 프로세스 확인
    ZOMBIE_COUNT=$(ps aux | awk '{if ($8 == "Z") count++} END {print count+0}')
    if [ "$ZOMBIE_COUNT" -gt 0 ]; then
        echo -e "${RED}⚠️  좀비 프로세스 $ZOMBIE_COUNT개 발견${NC}"
        echo -e "${YELLOW}💡 해결: Claude Code 재시작 권장${NC}"
    fi

    # MCP 설정 파일 확인
    if [ -f ".mcp.json" ]; then
        SERVER_COUNT=$(grep -c '"command"' .mcp.json)
        echo -e "${BLUE}📋 .mcp.json 설정된 서버: ${SERVER_COUNT}개${NC}"
    fi
}

# 함수: 자동 복구 제안
suggest_recovery() {
    echo -e "\n${YELLOW}🚑 자동 복구 명령어${NC}"

    echo -e "${BLUE}MCP 서버 재시작:${NC}"
    echo "  claude mcp remove supabase -s local"
    echo "  claude mcp add supabase -s local -e SUPABASE_ACCESS_TOKEN=\$TOKEN -- npx -y @supabase/mcp-server-supabase@latest --read-only --project-ref=\$PROJECT_REF"

    echo -e "\n${BLUE}시스템 정리:${NC}"
    echo "  pkill -f 'mcp-server'"
    echo "  claude --version  # 재시작"

    echo -e "\n${BLUE}메모리 정리:${NC}"
    echo "  sudo sysctl vm.drop_caches=1"
}

# 메인 실행
main() {
    check_mcp_status
    MCP_STATUS=$?

    test_individual_servers
    check_memory_usage
    diagnose_issues

    if [ "$MCP_STATUS" -eq 0 ]; then
        echo -e "\n${GREEN}🎉 모든 MCP 서버가 정상 작동 중입니다!${NC}"
        echo "[$TIMESTAMP] Status: All MCP servers healthy" >> "$LOG_FILE"
    else
        echo -e "\n${RED}⚠️  일부 MCP 서버에 문제가 있습니다.${NC}"
        suggest_recovery
        echo "[$TIMESTAMP] Status: Some MCP servers have issues" >> "$LOG_FILE"
    fi

    echo -e "\n${BLUE}📝 상세 로그: $LOG_FILE${NC}"
    echo -e "${BLUE}📋 다음 체크 권장: 1시간 후${NC}"
}

# 스크립트 실행
main "$@"

# 에러가 발생해도 스크립트 종료 코드는 0으로 (cron 호환)
exit 0