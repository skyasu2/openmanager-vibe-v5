#!/bin/bash
# MCP Health Check Script
# 목적: 9개 MCP 서버 연결 상태 정기 점검
# 작성: 2025-10-16
# 사용: ./scripts/mcp-health-check.sh

set -euo pipefail

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 로그 디렉토리 생성
LOG_DIR="logs/mcp-health"
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/$(date +%Y-%m-%d).log"

# 현재 시간
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

echo -e "${BLUE}🏥 MCP Health Check${NC}"
echo -e "${BLUE}==================${NC}"
echo "시작 시간: $TIMESTAMP"
echo ""

# 로그 시작
{
  echo "==================================="
  echo "MCP Health Check - $TIMESTAMP"
  echo "==================================="
  echo ""
} >> "$LOG_FILE"

# MCP 서버 목록 (9개)
EXPECTED_SERVERS=(
  "vercel"
  "serena"
  "supabase"
  "context7"
  "playwright"
  "memory"
  "time"
  "sequential-thinking"
  "shadcn-ui"
)

# MCP 상태 확인
echo -e "${BLUE}📊 MCP 서버 연결 상태:${NC}"
echo "📊 MCP 서버 연결 상태:" >> "$LOG_FILE"
echo "" >> "$LOG_FILE"

# claude mcp list 실행 (타임아웃 10초)
MCP_OUTPUT=$(timeout 10 claude mcp list 2>&1 || echo "ERROR: claude mcp list 실행 실패")

# 연결 성공 카운터
SUCCESS_COUNT=0
FAIL_COUNT=0

# 각 서버 상태 확인
for server in "${EXPECTED_SERVERS[@]}"; do
  if echo "$MCP_OUTPUT" | grep -q "$server"; then
    echo -e "${GREEN}✅${NC} $server: 연결 성공"
    echo "✅ $server: 연결 성공" >> "$LOG_FILE"
    ((SUCCESS_COUNT++))
  else
    echo -e "${RED}❌${NC} $server: 연결 실패"
    echo "❌ $server: 연결 실패" >> "$LOG_FILE"
    ((FAIL_COUNT++))
  fi
done

echo ""
echo "" >> "$LOG_FILE"

# 연결 성공률 계산
TOTAL_SERVERS=${#EXPECTED_SERVERS[@]}
SUCCESS_RATE=$((SUCCESS_COUNT * 100 / TOTAL_SERVERS))

# 결과 요약
echo -e "${BLUE}📈 연결 요약:${NC}"
echo "📈 연결 요약:" >> "$LOG_FILE"
echo -e "  - 연결 성공: ${GREEN}$SUCCESS_COUNT${NC}/$TOTAL_SERVERS"
echo -e "  - 연결 실패: ${RED}$FAIL_COUNT${NC}/$TOTAL_SERVERS"
echo -e "  - 성공률: ${GREEN}$SUCCESS_RATE%${NC}"
echo "  - 연결 성공: $SUCCESS_COUNT/$TOTAL_SERVERS" >> "$LOG_FILE"
echo "  - 연결 실패: $FAIL_COUNT/$TOTAL_SERVERS" >> "$LOG_FILE"
echo "  - 성공률: $SUCCESS_RATE%" >> "$LOG_FILE"
echo ""
echo "" >> "$LOG_FILE"

# 상태 판정
if [ "$SUCCESS_COUNT" -eq "$TOTAL_SERVERS" ]; then
  echo -e "${GREEN}✅ 모든 MCP 서버 정상 연결 (9/9)${NC}"
  echo "✅ 모든 MCP 서버 정상 연결 (9/9)" >> "$LOG_FILE"
  STATUS="SUCCESS"
elif [ "$SUCCESS_COUNT" -ge 7 ]; then
  echo -e "${YELLOW}⚠️  일부 MCP 서버 연결 문제 (확인 필요)${NC}"
  echo "⚠️  일부 MCP 서버 연결 문제 (확인 필요)" >> "$LOG_FILE"
  STATUS="WARNING"
else
  echo -e "${RED}❌ 다수의 MCP 서버 연결 실패 (긴급 조치 필요)${NC}"
  echo "❌ 다수의 MCP 서버 연결 실패 (긴급 조치 필요)" >> "$LOG_FILE"
  STATUS="CRITICAL"
fi

echo ""
echo "" >> "$LOG_FILE"

# 문제 해결 가이드
if [ "$FAIL_COUNT" -gt 0 ]; then
  echo -e "${YELLOW}💡 문제 해결 방법:${NC}"
  echo "💡 문제 해결 방법:" >> "$LOG_FILE"
  echo "  1. claude mcp list 직접 실행하여 에러 메시지 확인"
  echo "  2. ~/.config/claude-code/settings.json 설정 확인"
  echo "  3. MCP 서버 재시작: claude mcp restart"
  echo "  4. OAuth 인증 필요 시: 해당 MCP 서버 재연결"
  echo "  1. claude mcp list 직접 실행하여 에러 메시지 확인" >> "$LOG_FILE"
  echo "  2. ~/.config/claude-code/settings.json 설정 확인" >> "$LOG_FILE"
  echo "  3. MCP 서버 재시작: claude mcp restart" >> "$LOG_FILE"
  echo "  4. OAuth 인증 필요 시: 해당 MCP 서버 재연결" >> "$LOG_FILE"
  echo ""
  echo "" >> "$LOG_FILE"
fi

# 로그 위치 안내
echo -e "${BLUE}📁 로그 저장 위치:${NC} $LOG_FILE"
echo "📁 로그 저장 위치: $LOG_FILE" >> "$LOG_FILE"
echo ""
echo "" >> "$LOG_FILE"

# 종료 시간
END_TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
echo "종료 시간: $END_TIMESTAMP"
echo "종료 시간: $END_TIMESTAMP" >> "$LOG_FILE"
echo "" >> "$LOG_FILE"

# 상태별 종료 코드
if [ "$STATUS" = "SUCCESS" ]; then
  exit 0
elif [ "$STATUS" = "WARNING" ]; then
  exit 1
else
  exit 2
fi
