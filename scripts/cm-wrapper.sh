#!/bin/bash
# cm 명령어 - Claude Monitor Korean 실행 스크립트
# WSL 환경에서 interactive/non-interactive 상관없이 동작하도록 하는 래퍼

# 기본 설정
PLAN="max20"
TIMEZONE="Asia/Seoul"
ARGS="--no-clear"  # 기본값: 실시간 모니터링

# 명령행 인수 처리
while [[ $# -gt 0 ]]; do
    case $1 in
        --plan)
            PLAN="$2"
            shift 2
            ;;
        --once)
            ARGS="$ARGS --once"
            shift
            ;;
        --compact)
            ARGS="$ARGS --compact"
            shift
            ;;
        *)
            ARGS="$ARGS $1"
            shift
            ;;
    esac
done

# 명령어 목록 표시 함수
show_command_list() {
    # 색상 코드 정의 (WSL 호환)
    YELLOW='\033[1;33m'
    BLUE='\033[1;34m'
    GREEN='\033[1;32m'
    CYAN='\033[1;36m'
    RESET='\033[0m'
    
    echo ""
    echo -e "${YELLOW}📚 사용 가능한 cm 명령어:${RESET}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo -e "  ${CYAN}cm${RESET}                   - 사용 방법 안내"
    echo -e "  ${CYAN}cm:once${RESET}              - 현재 사용량 확인 (한번만 실행)"
    echo -e "  ${CYAN}cm:live${RESET}              - 실시간 모니터링 (Ctrl+C로 종료)"
    echo -e "  ${CYAN}cm:compact${RESET}           - 간결 모드 (한번 실행)"
    echo -e "  ${CYAN}cm:pro${RESET}               - Pro 플랜 모니터링 (7,000 토큰)"
    echo -e "  ${CYAN}cm:max5${RESET}              - Max5 플랜 모니터링 (35,000 토큰)"
    echo ""
    echo -e "${GREEN}💡 팁:${RESET}"
    echo -e "  • 사용량 확인은 ${BLUE}cm:once${RESET} 사용"
    echo -e "  • 실시간 모니터링은 ${BLUE}cm:live${RESET} 사용"
    echo ""
    echo -e "${YELLOW}🎯 현재 설정:${RESET} ${GREEN}$PLAN${RESET} 플랜, ${GREEN}$TIMEZONE${RESET} 시간대"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

# Claude Monitor 실행
cd ~/Claude-Code-Usage-Monitor && python3 claude_monitor_korean.py --plan "$PLAN" --timezone "$TIMEZONE" $ARGS

# --once 옵션이 있을 때만 명령어 목록 표시
if [[ $ARGS == *"--once"* ]]; then
    # Python 스크립트 종료 후 확실한 구분을 위한 처리
    sleep 0.1  # 출력 버퍼 플러시를 위한 짧은 대기
    echo ""  # 빈 줄 추가
    echo ""  # 추가 빈 줄로 구분 강화
    
    # 명령어 목록 표시
    show_command_list
    
    # 추가 빈 줄로 마무리
    echo ""
fi