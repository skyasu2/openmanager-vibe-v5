#!/bin/bash
# Claude Usage Quick Check Script

# 색상 정의
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}🎯 Claude Code Usage Monitor${NC}"
echo "================================"
echo ""

# Claude monitor 실행
if command -v claude-monitor &> /dev/null; then
    echo -e "${GREEN}실행 중...${NC}"
    echo ""
    # 10초 타임아웃으로 실행
    timeout 10s claude-monitor --plan max20
else
    echo -e "${YELLOW}⚠️  claude-monitor가 설치되어 있지 않습니다.${NC}"
    echo "설치 명령어: uv tool install claude-usage-monitor"
fi

echo ""
echo -e "${BLUE}빠른 명령어:${NC}"
echo "  cm              - Claude 모니터 실행"
echo "  사용량          - Claude 사용량 확인"
echo "  클로드 사용량   - 한국어 명령"
echo "  claude_usage    - 함수로 실행"