#!/bin/bash

# 🚀 Claude Code WSL 개발 환경 - tmux 세션 자동 구성
# 4개 창으로 분할된 개발 환경을 자동으로 설정합니다.

SESSION_NAME="openmanager-dev"
PROJECT_DIR="/mnt/d/cursor/openmanager-vibe-v5"

# 색상 정의
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Claude Code + tmux 개발 환경 시작${NC}"

# 의존성 체크
if ! command -v tmux &> /dev/null; then
    echo -e "${RED}❌ tmux가 설치되지 않았습니다.${NC}"
    echo "설치: sudo apt update && sudo apt install tmux"
    exit 1
fi

if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}⚠️  Node.js가 설치되지 않았습니다.${NC}"
    echo "nvm 또는 apt를 통해 설치해주세요."
fi

# 프로젝트 디렉토리로 이동
cd "$PROJECT_DIR"

# 기존 세션이 있으면 연결
if tmux has-session -t "$SESSION_NAME" 2>/dev/null; then
    echo -e "${YELLOW}⚡ 기존 세션에 연결합니다...${NC}"
    tmux attach-session -t "$SESSION_NAME"
    exit 0
fi

# 새 세션 생성
echo -e "${GREEN}✨ 새 tmux 세션을 생성합니다...${NC}"

# 메인 세션 생성 (개발 서버)
tmux new-session -d -s "$SESSION_NAME" -n "dev-server" -c "$PROJECT_DIR"
tmux send-keys -t "$SESSION_NAME:0" "echo -e '${GREEN}📦 개발 서버를 시작합니다...${NC}'" C-m
tmux send-keys -t "$SESSION_NAME:0" "npm run dev" C-m

# 두 번째 창 생성 (로그 모니터링)
tmux new-window -t "$SESSION_NAME:1" -n "logs" -c "$PROJECT_DIR"
tmux send-keys -t "$SESSION_NAME:1" "echo -e '${YELLOW}📊 로그 모니터링 준비 완료${NC}'" C-m
tmux send-keys -t "$SESSION_NAME:1" "echo '사용 가능한 명령어:'" C-m
tmux send-keys -t "$SESSION_NAME:1" "echo '  - npm run test:watch (테스트 감시 모드)'" C-m
tmux send-keys -t "$SESSION_NAME:1" "echo '  - npm run lint:watch (린트 감시 모드)'" C-m
tmux send-keys -t "$SESSION_NAME:1" "echo '  - tail -f .next/trace (Next.js 추적 로그)'" C-m

# 세 번째 창 생성 (작업 공간)
tmux new-window -t "$SESSION_NAME:2" -n "workspace" -c "$PROJECT_DIR"
tmux send-keys -t "$SESSION_NAME:2" "echo -e '${BLUE}💻 Claude Code 작업 공간${NC}'" C-m
tmux send-keys -t "$SESSION_NAME:2" "echo '현재 브랜치: $(git branch --show-current)'" C-m
tmux send-keys -t "$SESSION_NAME:2" "echo ''" C-m
tmux send-keys -t "$SESSION_NAME:2" "# 유용한 명령어:" C-m
tmux send-keys -t "$SESSION_NAME:2" "# npm run test:quick    - 빠른 테스트" C-m
tmux send-keys -t "$SESSION_NAME:2" "# npm run type-check    - 타입 체크" C-m
tmux send-keys -t "$SESSION_NAME:2" "# npm run lint:quick    - 빠른 린트" C-m

# 네 번째 창 생성 (시스템 모니터링)
tmux new-window -t "$SESSION_NAME:3" -n "monitor" -c "$PROJECT_DIR"
tmux split-window -h -t "$SESSION_NAME:3"
tmux send-keys -t "$SESSION_NAME:3.0" "htop" C-m
tmux send-keys -t "$SESSION_NAME:3.1" "watch -n 2 'echo -e \"${GREEN}=== 시스템 상태 ===${NC}\"; free -h; echo; df -h /mnt/d; echo; echo -e \"${YELLOW}=== Node 프로세스 ===${NC}\"; ps aux | grep node | grep -v grep | head -5'" C-m

# 첫 번째 창으로 이동
tmux select-window -t "$SESSION_NAME:0"

# 세션에 연결
echo -e "${GREEN}✅ tmux 세션이 준비되었습니다!${NC}"
echo ""
echo "창 전환 단축키:"
echo "  - Ctrl+b 0-3: 창 번호로 이동"
echo "  - Ctrl+b n/p: 다음/이전 창"
echo "  - Ctrl+b d: 세션 분리 (detach)"
echo ""

# 세션 연결
tmux attach-session -t "$SESSION_NAME"