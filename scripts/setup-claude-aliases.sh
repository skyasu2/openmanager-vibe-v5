#!/bin/bash

# 🚀 Claude Code 전용 bash 별칭 설정 스크립트

PROJECT_DIR="/mnt/d/cursor/openmanager-vibe-v5"
BASHRC="$HOME/.bashrc"

# 색상 정의
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔧 Claude Code 별칭 설정 중...${NC}"

# 별칭 섹션 시작 마커
ALIAS_MARKER="# Claude Code Aliases"

# 기존 별칭 제거
sed -i "/$ALIAS_MARKER/,/# End Claude Code Aliases/d" "$BASHRC" 2>/dev/null

# 새 별칭 추가
cat >> "$BASHRC" << 'EOF'

# Claude Code Aliases
alias ccdev='cd /mnt/d/cursor/openmanager-vibe-v5 && ./scripts/claude-dev-env.sh'
alias cctmux='cd /mnt/d/cursor/openmanager-vibe-v5 && ./scripts/dev-tmux.sh'
alias cctest='cd /mnt/d/cursor/openmanager-vibe-v5 && ./scripts/test-in-tmux.sh'
alias ccperf='cd /mnt/d/cursor/openmanager-vibe-v5 && ./scripts/wsl-performance.sh'
alias cclog='cd /mnt/d/cursor/openmanager-vibe-v5 && tail -f .next/trace'
alias ccrestart='cd /mnt/d/cursor/openmanager-vibe-v5 && npm run dev'
alias ccquick='cd /mnt/d/cursor/openmanager-vibe-v5 && npm run test:quick && npm run type-check && npm run lint:quick'
alias ccfix='cd /mnt/d/cursor/openmanager-vibe-v5 && npm run lint:fix'
alias ccbuild='cd /mnt/d/cursor/openmanager-vibe-v5 && npm run build'
alias ccgit='cd /mnt/d/cursor/openmanager-vibe-v5 && git status'
alias cchealth='cd /mnt/d/cursor/openmanager-vibe-v5 && ./scripts/claude-health-check.sh'
alias ccclean='cd /mnt/d/cursor/openmanager-vibe-v5 && ./scripts/claude-cleanup.sh'

# 프로젝트 디렉토리 바로가기
alias om='cd /mnt/d/cursor/openmanager-vibe-v5'

# 유용한 함수들
cchelp() {
    echo -e "${BLUE}🤖 Claude Code 명령어 도움말${NC}"
    echo ""
    echo "개발 환경:"
    echo "  ccdev    - Claude Code 통합 개발 환경 시작"
    echo "  cctmux   - tmux 개발 세션 시작"
    echo "  ccperf   - WSL 성능 모니터"
    echo ""
    echo "테스트:"
    echo "  cctest   - tmux에서 테스트 실행"
    echo "  ccquick  - 빠른 검증 (테스트+타입+린트)"
    echo ""
    echo "유틸리티:"
    echo "  cclog    - Next.js 추적 로그 확인"
    echo "  ccrestart - 개발 서버 재시작"
    echo "  ccfix    - ESLint 자동 수정"
    echo "  ccbuild  - 프로덕션 빌드"
    echo "  ccgit    - Git 상태 확인"
    echo "  cchealth - 개발 환경 건강 체크"
    echo "  ccclean  - 메모리 정리"
    echo "  om       - 프로젝트 디렉토리로 이동"
    echo ""
    echo "도움말: cchelp"
}

# tmux 세션 상태 확인 함수
ccstatus() {
    echo -e "${BLUE}📊 개발 환경 상태${NC}"
    echo ""
    
    # tmux 세션
    if tmux has-session -t openmanager-dev 2>/dev/null; then
        echo -e "${GREEN}✅ tmux 세션: 활성${NC}"
        tmux list-windows -t openmanager-dev | sed 's/^/   /'
    else
        echo -e "${YELLOW}⚠️  tmux 세션: 비활성${NC}"
    fi
    echo ""
    
    # 개발 서버
    if lsof -i :3000 >/dev/null 2>&1; then
        echo -e "${GREEN}✅ 개발 서버: 실행 중 (포트 3000)${NC}"
    else
        echo -e "${YELLOW}⚠️  개발 서버: 중지됨${NC}"
    fi
    echo ""
    
    # Node.js 프로세스
    node_count=$(ps aux | grep -E "node|npm" | grep -v grep | wc -l)
    echo -e "${BLUE}Node.js 프로세스: ${node_count}개${NC}"
}

# End Claude Code Aliases
EOF

echo -e "${GREEN}✅ 별칭 설정 완료!${NC}"
echo ""
echo -e "${YELLOW}별칭을 활성화하려면 다음 명령을 실행하세요:${NC}"
echo -e "   ${BLUE}source ~/.bashrc${NC}"
echo ""
echo -e "또는 새 터미널을 열어주세요."
echo ""
echo -e "${GREEN}사용 가능한 명령어를 보려면: cchelp${NC}"