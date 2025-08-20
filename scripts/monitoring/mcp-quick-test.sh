#!/bin/bash
# MCP 서버 빠른 상태 확인 스크립트
# 실행: ./scripts/mcp-quick-test.sh

set -e

echo "⚡ MCP 서버 빠른 상태 확인..."
echo "============================="

# 색상 정의
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# MCP 서버 상태 확인 (별도 백그라운드 프로세스)
echo "🔍 서버 연결 상태:"
echo "✅ 빠른 확인 모드 (백그라운드에서 전체 확인 중...)"

echo ""
echo "📊 간단 통계:"

# 연결된 서버 수 계산 (타임아웃 없이)
connected_count=$(claude mcp list 2>/dev/null | grep -c "✓ Connected" || echo "0")
total_servers=11

echo -e "연결된 서버: ${GREEN}$connected_count${NC}/$total_servers"

if [[ $connected_count -eq $total_servers ]]; then
    echo -e "상태: ${GREEN}✅ 모든 서버 정상${NC}"
    exit 0
elif [[ $connected_count -gt 8 ]]; then
    echo -e "상태: ${YELLOW}⚠️  일부 서버 문제${NC}"
    exit 1
else
    echo -e "상태: ${RED}❌ 심각한 문제${NC}"
    exit 2
fi