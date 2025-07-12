#!/bin/bash
# cm 명령어 - 사용 방법 안내 스크립트

# 색상 코드 정의 (WSL 호환)
YELLOW='\033[1;33m'
BLUE='\033[1;34m'
GREEN='\033[1;32m'
CYAN='\033[1;36m'
MAGENTA='\033[1;35m'
RESET='\033[0m'

# 현재 설정
PLAN="MAX20"
TIMEZONE="Asia/Seoul (KST)"

# 사용법 표시 함수
show_usage() {
    echo ""
    echo -e "${YELLOW}🎯 Claude Monitor - 토큰 사용량 모니터링 도구${RESET}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo -e "${GREEN}📊 현재 설정:${RESET}"
    echo -e "   • 요금제: ${MAGENTA}$PLAN${RESET} (140,000 토큰/5시간)"
    echo -e "   • 시간대: ${MAGENTA}$TIMEZONE${RESET}"
    echo ""
    echo -e "${CYAN}📚 사용 가능한 명령어:${RESET}"
    echo -e "   ${BLUE}cm:once${RESET}      - 현재 사용량 확인 (한번만 실행)"
    echo -e "   ${BLUE}cm:live${RESET}      - 실시간 모니터링 (5초마다 갱신)"
    echo -e "   ${BLUE}cm:compact${RESET}   - 간결 모드로 사용량 확인"
    echo ""
    echo -e "${CYAN}📈 다른 요금제:${RESET}"
    echo -e "   ${BLUE}cm:pro${RESET}       - Pro 플랜 모니터링 (7,000 토큰)"
    echo -e "   ${BLUE}cm:max5${RESET}      - Max5 플랜 모니터링 (35,000 토큰)"
    echo ""
    echo -e "${GREEN}💡 사용 예시:${RESET}"
    echo -e "   ${YELLOW}cm:once${RESET}      # 지금 토큰 사용량 확인"
    echo -e "   ${YELLOW}cm:live${RESET}      # 실시간 모니터링 시작 (Ctrl+C로 종료)"
    echo ""
    echo -e "${CYAN}🔧 설정:${RESET}"
    echo -e "   ${BLUE}cm:setup${RESET}     - cm 명령어 alias 설정/업데이트"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
}

# 메인 실행
show_usage