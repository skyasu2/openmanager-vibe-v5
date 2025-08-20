#!/bin/bash

# 🏥 Claude Code WSL 환경 건강 체크 스크립트
# 개발 환경의 모든 구성 요소를 빠르게 점검합니다.

PROJECT_DIR="/mnt/d/cursor/openmanager-vibe-v5"

# 색상 정의
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${BLUE}╔═══════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     🏥 개발 환경 건강 체크 시작 중...     ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════╝${NC}"
echo ""

# 점수 초기화
TOTAL_SCORE=0
MAX_SCORE=0

# 체크 함수
check_item() {
    local name=$1
    local command=$2
    local success_msg=$3
    local fail_msg=$4
    local weight=${5:-1}
    
    MAX_SCORE=$((MAX_SCORE + weight))
    
    if eval "$command" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ $name: $success_msg${NC}"
        TOTAL_SCORE=$((TOTAL_SCORE + weight))
    else
        echo -e "${RED}❌ $name: $fail_msg${NC}"
    fi
}

# 1. WSL 환경 체크
echo -e "${CYAN}🐧 WSL 환경${NC}"
check_item "WSL 버전" "[ -n \"\$WSL_DISTRO_NAME\" ]" "WSL2 환경 감지됨" "WSL 환경이 아님"
echo ""

# 2. Node.js 환경
echo -e "${CYAN}🟢 Node.js 환경${NC}"
check_item "Node.js" "node --version" "$(node --version 2>/dev/null || echo '설치 안됨')" "Node.js 설치 필요" 2
check_item "npm" "npm --version" "$(npm --version 2>/dev/null || echo '설치 안됨')" "npm 설치 필요" 2
check_item "메모리 설정" "[ \"\${NODE_OPTIONS:-}\" = \"--max-old-space-size=4096\" ]" "4GB 할당됨" "메모리 설정 필요"
echo ""

# 3. Git 설정
echo -e "${CYAN}🔧 Git 설정${NC}"
check_item "Git 사용자" "git config --global user.name" "$(git config --global user.name || echo '미설정')" "Git 사용자 설정 필요"
check_item "Git 이메일" "git config --global user.email" "$(git config --global user.email || echo '미설정')" "Git 이메일 설정 필요"
echo ""

# 4. 프로젝트 파일
echo -e "${CYAN}📁 프로젝트 파일${NC}"
check_item "프로젝트 디렉토리" "[ -d \"$PROJECT_DIR\" ]" "디렉토리 존재" "프로젝트 없음" 2
check_item "package.json" "[ -f \"$PROJECT_DIR/package.json\" ]" "파일 존재" "package.json 없음" 2
check_item "node_modules" "[ -d \"$PROJECT_DIR/node_modules\" ]" "의존성 설치됨" "npm install 필요" 2
check_item ".env.local" "[ -f \"$PROJECT_DIR/.env.local\" ]" "환경변수 설정됨" "환경변수 파일 필요" 2
echo ""

# 5. 개발 도구
echo -e "${CYAN}🛠️ 개발 도구${NC}"
check_item "tmux" "which tmux" "$(tmux -V 2>/dev/null || echo '설치 안됨')" "tmux 설치 필요"
check_item "htop" "which htop" "시스템 모니터 준비됨" "htop 설치 권장"
check_item "Claude 별칭" "grep -q 'Claude Code Aliases' ~/.bashrc" "별칭 설정됨" "별칭 설정 필요"
echo ""

# 6. 시스템 리소스
echo -e "${CYAN}💻 시스템 리소스${NC}"
MEMORY_PERCENT=$(free | grep Mem | awk '{print int($3/$2 * 100)}')
DISK_PERCENT=$(df -h /mnt/d | tail -1 | awk '{print $5}' | sed 's/%//')

if [ "$MEMORY_PERCENT" -lt 80 ]; then
    echo -e "${GREEN}✅ 메모리 사용률: ${MEMORY_PERCENT}%${NC}"
    TOTAL_SCORE=$((TOTAL_SCORE + 1))
else
    echo -e "${RED}❌ 메모리 사용률: ${MEMORY_PERCENT}% (높음)${NC}"
fi
MAX_SCORE=$((MAX_SCORE + 1))

if [ "$DISK_PERCENT" -lt 90 ]; then
    echo -e "${GREEN}✅ 디스크 사용률: ${DISK_PERCENT}%${NC}"
    TOTAL_SCORE=$((TOTAL_SCORE + 1))
else
    echo -e "${RED}❌ 디스크 사용률: ${DISK_PERCENT}% (높음)${NC}"
fi
MAX_SCORE=$((MAX_SCORE + 1))
echo ""

# 7. 포트 상태
echo -e "${CYAN}🌐 포트 상태${NC}"
if lsof -i :3000 >/dev/null 2>&1; then
    echo -e "${GREEN}✅ 개발 서버: 포트 3000 활성${NC}"
else
    echo -e "${YELLOW}⚠️  개발 서버: 실행 중이 아님${NC}"
fi
echo ""

# 최종 점수
PERCENTAGE=$((TOTAL_SCORE * 100 / MAX_SCORE))
echo -e "${BLUE}════════════════════════════════════════════${NC}"
echo -e "${BLUE}최종 점수: ${TOTAL_SCORE}/${MAX_SCORE} (${PERCENTAGE}%)${NC}"

if [ "$PERCENTAGE" -ge 90 ]; then
    echo -e "${GREEN}🎉 환경 상태: 매우 좋음!${NC}"
elif [ "$PERCENTAGE" -ge 70 ]; then
    echo -e "${YELLOW}😊 환경 상태: 양호${NC}"
elif [ "$PERCENTAGE" -ge 50 ]; then
    echo -e "${YELLOW}⚠️  환경 상태: 개선 필요${NC}"
else
    echo -e "${RED}❌ 환경 상태: 설정 필요${NC}"
fi
echo ""

# 권장사항
if [ "$PERCENTAGE" -lt 90 ]; then
    echo -e "${YELLOW}📝 권장사항:${NC}"
    
    if ! which node > /dev/null 2>&1; then
        echo "  • Node.js 설치: nvm install --lts"
    fi
    
    if ! [ -d "$PROJECT_DIR/node_modules" ]; then
        echo "  • 의존성 설치: cd $PROJECT_DIR && npm install"
    fi
    
    if ! [ -f "$PROJECT_DIR/.env.local" ]; then
        echo "  • 환경변수 설정: cp .env.local.template .env.local"
    fi
    
    if [ "$MEMORY_PERCENT" -gt 80 ]; then
        echo "  • 메모리 정리: ./scripts/claude-cleanup.sh"
    fi
    
    if ! grep -q 'Claude Code Aliases' ~/.bashrc 2>/dev/null; then
        echo "  • 별칭 설정: ./scripts/setup-claude-aliases.sh"
    fi
fi