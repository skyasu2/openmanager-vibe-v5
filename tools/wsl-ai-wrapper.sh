#!/bin/bash

# 🐧 WSL AI Wrapper - Claude Code와 Gemini CLI 통합 도구
# 
# WSL 환경에서 최적화된 AI 협업 도구
# - 자동 환경 감지
# - 스마트 경로 변환
# - 통합 명령어 인터페이스

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 스크립트 디렉토리
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# WSL 환경 감지
is_wsl() {
    if grep -qE "(Microsoft|WSL)" /proc/version &> /dev/null; then
        return 0
    else
        return 1
    fi
}

# Windows 경로를 WSL 경로로 변환
win_to_wsl_path() {
    echo "$1" | sed -e 's/\\/\//g' -e 's/^\([A-Za-z]\):/\/mnt\/\L\1/'
}

# WSL 경로를 Windows 경로로 변환
wsl_to_win_path() {
    wslpath -w "$1" 2>/dev/null || echo "$1"
}

# 환경 정보 출력
print_env_info() {
    echo -e "${CYAN}🐧 WSL AI Wrapper 환경 정보${NC}"
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    
    if is_wsl; then
        echo -e "환경: ${GREEN}WSL$(grep -oE 'WSL[0-9]+' /proc/version 2>/dev/null || echo '')${NC}"
        echo -e "배포판: ${GREEN}$(lsb_release -d 2>/dev/null | cut -f2 || echo 'Unknown')${NC}"
    else
        echo -e "환경: ${GREEN}Native Linux${NC}"
    fi
    
    echo -e "프로젝트: ${BLUE}$PROJECT_ROOT${NC}"
    echo -e "Node.js: ${GREEN}$(node --version 2>/dev/null || echo 'Not installed')${NC}"
    echo -e "Gemini CLI: ${GREEN}$(gemini --version 2>&1 | head -n1 || echo 'Not installed')${NC}"
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

# Gemini 설치 확인 및 가이드
check_gemini() {
    if ! command -v gemini &> /dev/null; then
        echo -e "${RED}❌ Gemini CLI가 설치되어 있지 않습니다.${NC}"
        echo -e "${YELLOW}설치 방법:${NC}"
        echo -e "  1. https://github.com/google/generative-ai-docs/tree/main/gemini-cli"
        echo -e "  2. npm install -g @google/generative-ai-cli"
        echo -e "  3. gemini auth"
        return 1
    fi
    return 0
}

# Node.js 및 npm 확인
check_node() {
    if ! command -v node &> /dev/null; then
        echo -e "${RED}❌ Node.js가 설치되어 있지 않습니다.${NC}"
        echo -e "${YELLOW}설치 방법:${NC}"
        echo -e "  curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -"
        echo -e "  sudo apt-get install -y nodejs"
        return 1
    fi
    return 0
}

# TypeScript 실행 환경 확인
check_tsx() {
    if ! command -v tsx &> /dev/null; then
        echo -e "${YELLOW}⚠️  tsx가 전역으로 설치되어 있지 않습니다. npx를 사용합니다.${NC}"
        TSX_CMD="npx tsx"
    else
        TSX_CMD="tsx"
    fi
}

# 스마트 Gemini 실행
run_smart_gemini() {
    check_tsx
    cd "$PROJECT_ROOT"
    $TSX_CMD "$SCRIPT_DIR/smart-gemini-wrapper.ts" "$@"
}

# AI Orchestrator 실행
run_orchestrator() {
    check_tsx
    cd "$PROJECT_ROOT"
    $TSX_CMD "$SCRIPT_DIR/ai-orchestrator.ts" "$@"
}

# 기존 도구 호환성 래퍼
run_legacy_gemini() {
    cd "$PROJECT_ROOT"
    node "$SCRIPT_DIR/gemini-dev-tools.js" "$@"
}

# 파일 경로 자동 변환 (WSL ↔ Windows)
convert_file_paths() {
    local args=()
    for arg in "$@"; do
        # 파일이나 디렉토리인 경우 경로 변환
        if [[ -e "$arg" ]] || [[ "$arg" =~ ^[./~] ]]; then
            if is_wsl; then
                # 절대 경로로 변환
                arg=$(realpath "$arg" 2>/dev/null || echo "$arg")
            fi
        fi
        args+=("$arg")
    done
    echo "${args[@]}"
}

# 메인 명령어 처리
main() {
    case "$1" in
        "info"|"--info")
            print_env_info
            ;;
            
        "chat"|"c")
            shift
            check_gemini || exit 1
            run_smart_gemini chat "$@"
            ;;
            
        "analyze"|"a")
            shift
            check_gemini || exit 1
            check_node || exit 1
            
            # 인자 변환
            converted_args=$(convert_file_paths "$@")
            run_orchestrator analyze $converted_args
            ;;
            
        "quick"|"q")
            shift
            check_gemini || exit 1
            run_orchestrator quick "$@"
            ;;
            
        "file"|"f")
            shift
            if [[ -z "$1" ]]; then
                echo -e "${RED}❌ 파일 경로를 입력해주세요${NC}"
                exit 1
            fi
            
            # 파일 경로 변환
            file_path=$(convert_file_paths "$1")
            shift
            
            run_legacy_gemini analyze "$file_path" "$@"
            ;;
            
        "diff"|"d")
            shift
            run_legacy_gemini diff "$@"
            ;;
            
        "stats"|"s")
            run_smart_gemini report
            ;;
            
        "health"|"h")
            run_smart_gemini health
            ;;
            
        "setup")
            # WSL 환경 설정
            echo -e "${CYAN}🔧 WSL AI 도구 설정 시작...${NC}"
            
            # 1. bashrc 별칭 추가
            if ! grep -q "# WSL AI Wrapper aliases" ~/.bashrc; then
                echo -e "\n# WSL AI Wrapper aliases" >> ~/.bashrc
                echo "alias ai='$SCRIPT_DIR/wsl-ai-wrapper.sh'" >> ~/.bashrc
                echo "alias aic='$SCRIPT_DIR/wsl-ai-wrapper.sh chat'" >> ~/.bashrc
                echo "alias aia='$SCRIPT_DIR/wsl-ai-wrapper.sh analyze'" >> ~/.bashrc
                echo "alias aiq='$SCRIPT_DIR/wsl-ai-wrapper.sh quick'" >> ~/.bashrc
                echo -e "${GREEN}✅ 별칭이 ~/.bashrc에 추가되었습니다${NC}"
                echo -e "${YELLOW}   source ~/.bashrc 를 실행하여 적용하세요${NC}"
            else
                echo -e "${BLUE}ℹ️  별칭이 이미 설정되어 있습니다${NC}"
            fi
            
            # 2. 실행 권한 설정
            chmod +x "$SCRIPT_DIR"/*.sh
            chmod +x "$SCRIPT_DIR"/g
            echo -e "${GREEN}✅ 실행 권한이 설정되었습니다${NC}"
            
            # 3. 의존성 확인
            echo -e "\n${CYAN}📦 의존성 확인 중...${NC}"
            check_node
            check_gemini
            check_tsx
            
            echo -e "\n${GREEN}✅ 설정 완료!${NC}"
            echo -e "${YELLOW}사용 방법:${NC}"
            echo -e "  ai chat \"질문\"     - 스마트 채팅"
            echo -e "  ai analyze \"문제\"  - 협업 분석"
            echo -e "  ai quick \"문제\"    - 빠른 해결"
            echo -e "  ai stats           - 사용량 통계"
            ;;
            
        *)
            echo -e "${CYAN}🤖 WSL AI Wrapper - 통합 AI 도구${NC}"
            echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
            echo -e ""
            echo -e "${GREEN}기본 명령어:${NC}"
            echo -e "  ${BLUE}info${NC}              환경 정보 확인"
            echo -e "  ${BLUE}chat${NC} \"질문\"       스마트 채팅 (자동 fallback)"
            echo -e "  ${BLUE}analyze${NC} \"문제\"    AI 협업 분석"
            echo -e "  ${BLUE}quick${NC} \"문제\"      빠른 해결책"
            echo -e "  ${BLUE}file${NC} <경로>       파일 분석"
            echo -e "  ${BLUE}diff${NC}              Git diff 분석"
            echo -e "  ${BLUE}stats${NC}             사용량 통계"
            echo -e "  ${BLUE}health${NC}            헬스 체크"
            echo -e "  ${BLUE}setup${NC}             WSL 환경 설정"
            echo -e ""
            echo -e "${GREEN}단축 명령어 (setup 후):${NC}"
            echo -e "  ${MAGENTA}ai${NC}  = 이 도구"
            echo -e "  ${MAGENTA}aic${NC} = ai chat"
            echo -e "  ${MAGENTA}aia${NC} = ai analyze"
            echo -e "  ${MAGENTA}aiq${NC} = ai quick"
            echo -e ""
            echo -e "${GREEN}예시:${NC}"
            echo -e "  ./wsl-ai-wrapper.sh chat \"TypeScript 에러 해결법\""
            echo -e "  ./wsl-ai-wrapper.sh analyze \"로그인이 간헐적으로 실패\""
            echo -e "  ./wsl-ai-wrapper.sh file src/app/page.tsx"
            echo -e ""
            echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
            
            # 환경 확인
            if is_wsl; then
                echo -e "${GREEN}✅ WSL 환경 감지됨${NC}"
            fi
            ;;
    esac
}

# 스크립트 실행
main "$@"