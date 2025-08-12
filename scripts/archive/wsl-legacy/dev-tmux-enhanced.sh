#!/bin/bash

# 🚀 Enhanced Claude Code WSL 개발 환경 - tmux 세션 자동 구성
# 5개 창으로 확장된 개발 환경 (테스트 서버 포함)

SESSION_NAME="openmanager-dev"
PROJECT_DIR="/mnt/d/cursor/openmanager-vibe-v5"

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

# 설정 옵션
AUTO_START_TEST_SERVER=${AUTO_START_TEST_SERVER:-false}
AUTO_SHUTDOWN_MINUTES=${AUTO_SHUTDOWN_MINUTES:-30}
MEMORY_THRESHOLD=${MEMORY_THRESHOLD:-80}

echo -e "${BLUE}🚀 Enhanced Claude Code + tmux 개발 환경 시작${NC}"
echo -e "${CYAN}📋 설정: 테스트 서버 자동 시작=${AUTO_START_TEST_SERVER}, 자동 종료=${AUTO_SHUTDOWN_MINUTES}분${NC}"

# 의존성 체크
check_dependencies() {
    local missing=()
    
    if ! command -v tmux &> /dev/null; then
        missing+=("tmux")
    fi
    
    if ! command -v node &> /dev/null; then
        missing+=("node")
    fi
    
    if ! command -v npm &> /dev/null; then
        missing+=("npm")
    fi
    
    if [ ${#missing[@]} -gt 0 ]; then
        echo -e "${RED}❌ 다음 프로그램이 설치되지 않았습니다: ${missing[*]}${NC}"
        echo "설치 방법:"
        echo "  tmux: sudo apt update && sudo apt install tmux"
        echo "  node/npm: nvm install --lts"
        exit 1
    fi
}

# 서버 상태 체크
check_server_status() {
    local port=$1
    if lsof -i:$port > /dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# 메모리 사용량 체크 (%)
get_memory_usage() {
    free | grep Mem | awk '{print int($3/$2 * 100)}'
}

check_dependencies

# 프로젝트 디렉토리로 이동
cd "$PROJECT_DIR"

# 기존 세션이 있으면 연결
if tmux has-session -t "$SESSION_NAME" 2>/dev/null; then
    echo -e "${YELLOW}⚡ 기존 세션에 연결합니다...${NC}"
    tmux attach-session -t "$SESSION_NAME"
    exit 0
fi

# 새 세션 생성
echo -e "${GREEN}✨ Enhanced tmux 세션을 생성합니다...${NC}"

# 1. 메인 세션 생성 (개발 서버)
tmux new-session -d -s "$SESSION_NAME" -n "dev-server" -c "$PROJECT_DIR"
tmux send-keys -t "$SESSION_NAME:0" "echo -e '${GREEN}📦 개발 서버를 시작합니다...${NC}'" C-m
tmux send-keys -t "$SESSION_NAME:0" "echo '포트 3000에서 실행됩니다.'" C-m
tmux send-keys -t "$SESSION_NAME:0" "npm run dev" C-m

# 2. 테스트 감시 창 (새로 추가!)
tmux new-window -t "$SESSION_NAME:1" -n "test-watch" -c "$PROJECT_DIR"
tmux send-keys -t "$SESSION_NAME:1" "echo -e '${MAGENTA}🧪 테스트 감시 모드${NC}'" C-m

if [ "$AUTO_START_TEST_SERVER" = "true" ]; then
    tmux send-keys -t "$SESSION_NAME:1" "echo '테스트 감시 모드를 시작합니다...'" C-m
    tmux send-keys -t "$SESSION_NAME:1" "npm run test:watch" C-m
else
    tmux send-keys -t "$SESSION_NAME:1" "echo '테스트 명령어:'" C-m
    tmux send-keys -t "$SESSION_NAME:1" "echo '  npm run test:watch    - 테스트 감시 모드'" C-m
    tmux send-keys -t "$SESSION_NAME:1" "echo '  npm run test:e2e      - E2E 테스트 실행'" C-m
    tmux send-keys -t "$SESSION_NAME:1" "echo '  npm run test:quick    - 빠른 테스트'" C-m
    tmux send-keys -t "$SESSION_NAME:1" "echo '  npm run test:coverage - 커버리지 리포트'" C-m
fi

# 3. 로그 모니터링 창
tmux new-window -t "$SESSION_NAME:2" -n "logs" -c "$PROJECT_DIR"
tmux send-keys -t "$SESSION_NAME:2" "echo -e '${YELLOW}📊 로그 모니터링${NC}'" C-m
tmux send-keys -t "$SESSION_NAME:2" "echo '로그 명령어:'" C-m
tmux send-keys -t "$SESSION_NAME:2" "echo '  tail -f .next/trace             - Next.js 추적 로그'" C-m
tmux send-keys -t "$SESSION_NAME:2" "echo '  npm run lint:watch              - 린트 감시 모드'" C-m
tmux send-keys -t "$SESSION_NAME:2" "echo '  journalctl -f -u npm            - 시스템 로그'" C-m

# 4. 작업 공간 창
tmux new-window -t "$SESSION_NAME:3" -n "workspace" -c "$PROJECT_DIR"
tmux send-keys -t "$SESSION_NAME:3" "echo -e '${BLUE}💻 Claude Code 작업 공간${NC}'" C-m
tmux send-keys -t "$SESSION_NAME:3" "echo '현재 브랜치: $(git branch --show-current)'" C-m
tmux send-keys -t "$SESSION_NAME:3" "echo '변경 파일: $(git status --porcelain | wc -l)개'" C-m
tmux send-keys -t "$SESSION_NAME:3" "echo ''" C-m
tmux send-keys -t "$SESSION_NAME:3" "echo '빠른 명령어:'" C-m
tmux send-keys -t "$SESSION_NAME:3" "echo '  npm run validate:quick - 빠른 검증 (타입+테스트)'" C-m
tmux send-keys -t "$SESSION_NAME:3" "echo '  npm run lint:quick     - 빠른 린트'" C-m
tmux send-keys -t "$SESSION_NAME:3" "echo '  npm run type-check     - 타입 체크'" C-m
tmux send-keys -t "$SESSION_NAME:3" "echo '  HUSKY=0 git commit     - 훅 스킵 커밋'" C-m

# 5. 시스템 모니터링 창 (개선됨)
tmux new-window -t "$SESSION_NAME:4" -n "monitor" -c "$PROJECT_DIR"
tmux split-window -h -t "$SESSION_NAME:4"
tmux split-window -v -t "$SESSION_NAME:4.1"

# 상단 왼쪽: htop
tmux send-keys -t "$SESSION_NAME:4.0" "htop" C-m

# 상단 오른쪽: 서버 상태 모니터링
tmux send-keys -t "$SESSION_NAME:4.1" "watch -n 2 'echo -e \"${GREEN}=== 서버 상태 ===${NC}\"; echo; echo \"개발 서버 (3000): $(if lsof -i:3000 > /dev/null 2>&1; then echo \"✅ 실행중\"; else echo \"❌ 중지됨\"; fi)\"; echo \"테스트 서버 (3001): $(if lsof -i:3001 > /dev/null 2>&1; then echo \"✅ 실행중\"; else echo \"❌ 중지됨\"; fi)\"; echo; echo -e \"${YELLOW}=== 메모리 사용량 ===${NC}\"; free -h | head -2; echo; echo \"사용률: $(free | grep Mem | awk \"{print int(\\$3/\\$2 * 100)}\")%\"'" C-m

# 하단 오른쪽: Node 프로세스 모니터링
tmux send-keys -t "$SESSION_NAME:4.2" "watch -n 3 'echo -e \"${CYAN}=== Node.js 프로세스 ===${NC}\"; ps aux | grep node | grep -v grep | head -5; echo; echo -e \"${MAGENTA}=== 포트 사용 현황 ===${NC}\"; lsof -i :3000,3001,3002 2>/dev/null | tail -n +2'" C-m

# 6. 자동 종료 타이머 설정 (백그라운드)
if [ "$AUTO_SHUTDOWN_MINUTES" -gt 0 ]; then
    (
        sleep $((AUTO_SHUTDOWN_MINUTES * 60))
        
        # 메모리 체크
        mem_usage=$(get_memory_usage)
        if [ $mem_usage -gt $MEMORY_THRESHOLD ]; then
            tmux send-keys -t "$SESSION_NAME:2" "" C-m
            tmux send-keys -t "$SESSION_NAME:2" "echo -e '${RED}⚠️  메모리 사용량 ${mem_usage}% - 서버 재시작 권장${NC}'" C-m
        fi
        
        # 유휴 상태 체크 (개발 서버가 실행 중이 아니면)
        if ! check_server_status 3000; then
            tmux send-keys -t "$SESSION_NAME:2" "" C-m
            tmux send-keys -t "$SESSION_NAME:2" "echo -e '${YELLOW}⏰ ${AUTO_SHUTDOWN_MINUTES}분 유휴 - 자동 종료 대기${NC}'" C-m
        fi
    ) &
fi

# 첫 번째 창으로 이동
tmux select-window -t "$SESSION_NAME:0"

# 사용 안내
echo -e "${GREEN}✅ Enhanced tmux 세션이 준비되었습니다!${NC}"
echo ""
echo -e "${CYAN}📋 창 구성:${NC}"
echo "  0: dev-server  - 개발 서버 (포트 3000)"
echo "  1: test-watch  - 테스트 감시 모드"
echo "  2: logs        - 로그 모니터링"
echo "  3: workspace   - 작업 공간"
echo "  4: monitor     - 시스템 모니터링 (3분할)"
echo ""
echo -e "${YELLOW}⌨️  단축키:${NC}"
echo "  Ctrl+b 0-4  : 창 번호로 이동"
echo "  Ctrl+b n/p  : 다음/이전 창"
echo "  Ctrl+b d    : 세션 분리 (detach)"
echo "  Ctrl+b x    : 현재 창 닫기"
echo "  Ctrl+b c    : 새 창 생성"
echo ""
echo -e "${MAGENTA}💡 팁:${NC}"
echo "  재연결: tmux attach -t $SESSION_NAME"
echo "  종료: tmux kill-session -t $SESSION_NAME"
echo ""

# 세션 연결
tmux attach-session -t "$SESSION_NAME"