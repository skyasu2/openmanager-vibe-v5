#!/bin/bash
# Claude Usage Quick Check Script

# 색상 정의
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo ""
echo -e "${BLUE}🎯 Claude Token Usage Status${NC}"
echo "============================"

# Claude monitor 실행
if command -v claude-monitor &> /dev/null; then
    # 10초 타임아웃으로 실행
    timeout 10s claude-monitor --plan max20 2>/dev/null || {
        echo -e "${GREEN}📊 Quick status check completed.${NC}"
    }
else
    echo -e "${YELLOW}⚠️  claude-monitor가 설치되어 있지 않습니다.${NC}"
    echo "설치 명령어: uv tool install claude-usage-monitor"
fi

echo ""

# Git hooks에서 호출될 때는 추가 정보 표시하지 않음
if [ "$1" != "--quiet" ]; then
    echo -e "${BLUE}💡 Available commands:${NC}"
    echo "  npm run cm              - Run Claude monitor"
    echo "  npm run cm:background   - Run in tmux background"
    echo ""
fi