#!/bin/bash
# Claude Monitor Background Execution with tmux

# 색상 정의
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

SESSION_NAME="claude-monitor"

echo ""
echo -e "${BLUE}🖥️  Claude Monitor - tmux Background Manager${NC}"
echo "==========================================="

# tmux 설치 확인
if ! command -v tmux &> /dev/null; then
    echo -e "${RED}❌ tmux가 설치되어 있지 않습니다.${NC}"
    echo "설치 명령어: sudo apt install tmux"
    exit 1
fi

# claude-monitor 설치 확인
if ! command -v claude-monitor &> /dev/null; then
    echo -e "${RED}❌ claude-monitor가 설치되어 있지 않습니다.${NC}"
    echo "설치 명령어: uv tool install claude-usage-monitor"
    exit 1
fi

# 기존 세션 확인
if tmux has-session -t $SESSION_NAME 2>/dev/null; then
    echo -e "${YELLOW}⚠️  이미 실행 중인 세션이 있습니다.${NC}"
    echo ""
    echo "옵션:"
    echo "  1) 기존 세션에 연결: tmux attach -t $SESSION_NAME"
    echo "  2) 기존 세션 종료: tmux kill-session -t $SESSION_NAME"
    echo "  3) 새 세션으로 재시작 (y/n)?"
    read -r restart
    
    if [ "$restart" = "y" ] || [ "$restart" = "Y" ]; then
        tmux kill-session -t $SESSION_NAME 2>/dev/null
        echo -e "${GREEN}✅ 기존 세션을 종료했습니다.${NC}"
    else
        echo -e "${BLUE}ℹ️  기존 세션을 유지합니다.${NC}"
        echo "세션에 연결하려면: tmux attach -t $SESSION_NAME"
        exit 0
    fi
fi

# 새 tmux 세션 생성
echo -e "${GREEN}🚀 Claude Monitor를 백그라운드에서 시작합니다...${NC}"
tmux new-session -d -s $SESSION_NAME "claude-monitor --plan max20"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Claude Monitor가 백그라운드에서 실행 중입니다!${NC}"
    echo ""
    echo -e "${BLUE}💡 유용한 명령어:${NC}"
    echo "  세션 연결:   tmux attach -t $SESSION_NAME"
    echo "  세션 분리:   Ctrl+B, D"
    echo "  세션 목록:   tmux ls"
    echo "  세션 종료:   tmux kill-session -t $SESSION_NAME"
    echo ""
    echo -e "${YELLOW}💡 팁: 세션에서 나가려면 Ctrl+B 후 D를 누르세요.${NC}"
else
    echo -e "${RED}❌ tmux 세션 생성에 실패했습니다.${NC}"
    exit 1
fi