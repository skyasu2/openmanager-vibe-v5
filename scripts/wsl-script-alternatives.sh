#!/bin/bash

# ========================================
# WSL 스크립트 대안 제공
# ========================================
# 목적: package.json의 PowerShell 스크립트들에 대한 WSL 대안 제공
# 사용법: bash scripts/wsl-script-alternatives.sh [스크립트명]
# ========================================

set -e

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔧 WSL 스크립트 대안 도구${NC}"
echo ""

# 스크립트 매핑 정의
declare -A SCRIPT_ALTERNATIVES=(
    ["env:optimize"]="echo 'WSL에서는 시스템 최적화가 자동으로 처리됩니다.'"
    ["env:clean"]="pkill -f node || true; pkill -f npm || true; echo 'Node.js 프로세스 정리 완료'"
    ["env:monitor"]="htop || top"
    ["dev:start"]="npm run dev"
    ["dev:fast"]="npm run dev:optimized"
    ["dev:full"]="npm run dev && npm run test:watch"
    ["vm:ps"]="ps aux | grep -E '(node|npm|next)'"
    ["automation:start"]="echo 'WSL에서는 cron이나 systemd를 사용하여 자동화를 설정하세요.'"
    ["automation:background"]="nohup npm run dev > dev.log 2>&1 &"
    ["automation:monitor"]="tail -f dev.log"
    ["automation:quality"]="npm run lint && npm run type-check"
    ["automation:stop"]="pkill -f 'npm run dev' || pkill -f next"
    ["automation:status"]="ps aux | grep -E '(npm|next)' | grep -v grep"
    ["automation:help"]="echo 'WSL 자동화 도움말: systemctl, cron, nohup 명령어를 활용하세요.'"
)

# 함수: 사용법 출력
show_usage() {
    echo "사용법: $0 [스크립트명]"
    echo ""
    echo "사용 가능한 스크립트 대안:"
    for script in "${!SCRIPT_ALTERNATIVES[@]}"; do
        echo "  - $script"
    done
    echo ""
    echo "예시:"
    echo "  $0 env:clean"
    echo "  $0 dev:start"
    echo "  $0 automation:status"
}

# 함수: 스크립트 실행
run_alternative() {
    local script_name="$1"
    local alternative="${SCRIPT_ALTERNATIVES[$script_name]}"
    
    if [ -z "$alternative" ]; then
        echo -e "${RED}❌ '$script_name'에 대한 WSL 대안을 찾을 수 없습니다.${NC}"
        echo ""
        show_usage
        return 1
    fi
    
    echo -e "${GREEN}🚀 '$script_name' WSL 대안 실행:${NC}"
    echo -e "${YELLOW}$alternative${NC}"
    echo ""
    
    # 실행 확인
    read -p "실행하시겠습니까? (y/N): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${BLUE}실행 중...${NC}"
        eval "$alternative"
        echo -e "${GREEN}✅ 완료${NC}"
    else
        echo -e "${YELLOW}⏭️  건너뜀${NC}"
    fi
}

# 함수: 모든 대안 나열
list_all_alternatives() {
    echo -e "${BLUE}📋 모든 WSL 스크립트 대안:${NC}"
    echo ""
    
    for script in "${!SCRIPT_ALTERNATIVES[@]}"; do
        echo -e "${GREEN}$script:${NC}"
        echo -e "  ${SCRIPT_ALTERNATIVES[$script]}"
        echo ""
    done
}

# 함수: 자주 사용되는 스크립트들 실행
run_common_setup() {
    echo -e "${BLUE}🔧 WSL 환경 일반적인 설정 실행${NC}"
    echo ""
    
    # 프로세스 정리
    echo -e "${YELLOW}1. 기존 Node.js 프로세스 정리...${NC}"
    eval "${SCRIPT_ALTERNATIVES['env:clean']}"
    echo ""
    
    # 개발 서버 시작 준비
    echo -e "${YELLOW}2. 개발 환경 확인...${NC}"
    if command -v node &> /dev/null; then
        echo "  ✅ Node.js: $(node --version)"
    else
        echo "  ❌ Node.js가 설치되지 않았습니다."
    fi
    
    if command -v npm &> /dev/null; then
        echo "  ✅ npm: $(npm --version)"
    else
        echo "  ❌ npm이 설치되지 않았습니다."
    fi
    echo ""
    
    # 의존성 확인
    echo -e "${YELLOW}3. 의존성 확인...${NC}"
    if [ -d "node_modules" ]; then
        echo "  ✅ node_modules 존재"
    else
        echo "  📦 의존성 설치 중..."
        npm install
    fi
    echo ""
    
    echo -e "${GREEN}✅ WSL 환경 설정 완료${NC}"
    echo ""
    echo "다음 명령어로 개발을 시작할 수 있습니다:"
    echo "  npm run dev"
    echo "  npm run dev:optimized"
}

# 메인 로직
case "${1:-}" in
    "")
        show_usage
        ;;
    "--list"|"-l")
        list_all_alternatives
        ;;
    "--setup"|"-s")
        run_common_setup
        ;;
    "--help"|"-h")
        show_usage
        ;;
    *)
        run_alternative "$1"
        ;;
esac