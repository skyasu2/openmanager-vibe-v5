#!/bin/bash
# cm:live 전용 스크립트 - 실시간 모니터링

# 기본 설정
PLAN="max20"
TIMEZONE="Asia/Seoul"

# 색상 코드 정의
YELLOW='\033[1;33m'
GREEN='\033[1;32m'
RED='\033[1;31m'
RESET='\033[0m'

# Python 스크립트 경로 확인
MONITOR_PATH="$HOME/Claude-Code-Usage-Monitor/claude_monitor_korean.py"

if [ ! -f "$MONITOR_PATH" ]; then
    echo -e "${RED}❌ 에러: Claude Monitor가 설치되지 않았습니다.${RESET}"
    echo -e "${YELLOW}다음 명령어로 설치해주세요:${RESET}"
    echo "  git clone https://github.com/skyler-dev/Claude-Code-Usage-Monitor.git ~/Claude-Code-Usage-Monitor"
    exit 1
fi

echo -e "${YELLOW}🔄 Claude Monitor 실시간 모니터링을 시작합니다...${RESET}"
echo -e "${GREEN}종료하려면 Ctrl+C를 누르세요.${RESET}"
echo ""

# Claude Monitor 실행 (연속 모드)
cd ~/Claude-Code-Usage-Monitor && python3 claude_monitor_korean.py --plan "$PLAN" --timezone "$TIMEZONE" --no-clear