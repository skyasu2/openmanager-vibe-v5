#!/bin/bash

# 🧪 tmux 내에서 테스트 실행 및 결과 확인
# 테스트 실패 시 시각적 알림을 제공합니다.

SESSION_NAME="openmanager-dev"
PROJECT_DIR="/mnt/d/cursor/openmanager-vibe-v5"

# 색상 정의
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# 테스트 타입 선택
echo -e "${BLUE}🧪 테스트 실행 옵션${NC}"
echo "1) 빠른 테스트 (test:quick)"
echo "2) 스마트 테스트 (변경된 파일만)"
echo "3) 전체 테스트"
echo "4) 커버리지 테스트"
echo "5) 특정 파일 테스트"
echo ""
read -p "선택하세요 (1-5): " test_choice

# tmux 세션 확인
if ! tmux has-session -t "$SESSION_NAME" 2>/dev/null; then
    echo -e "${YELLOW}⚠️  tmux 세션이 없습니다. 생성합니다...${NC}"
    "$PROJECT_DIR/scripts/dev-tmux.sh" &
    sleep 2
fi

# 테스트 창으로 이동 또는 생성
if ! tmux list-windows -t "$SESSION_NAME" | grep -q "test"; then
    tmux new-window -t "$SESSION_NAME" -n "test" -c "$PROJECT_DIR"
fi

# 테스트 명령 설정
case $test_choice in
    1)
        TEST_CMD="npm run test:quick"
        TEST_NAME="빠른 테스트"
        ;;
    2)
        TEST_CMD="npm run test:smart"
        TEST_NAME="스마트 테스트"
        ;;
    3)
        TEST_CMD="npm test"
        TEST_NAME="전체 테스트"
        ;;
    4)
        TEST_CMD="npm run test:coverage"
        TEST_NAME="커버리지 테스트"
        ;;
    5)
        read -p "테스트할 파일 경로: " test_file
        TEST_CMD="npx vitest run $test_file"
        TEST_NAME="파일 테스트: $test_file"
        ;;
    *)
        echo -e "${RED}잘못된 선택입니다.${NC}"
        exit 1
        ;;
esac

# 테스트 실행
echo -e "${YELLOW}🔄 $TEST_NAME 실행 중...${NC}"

# tmux 창에서 테스트 실행
tmux send-keys -t "$SESSION_NAME:test" C-c C-m  # 기존 명령 중단
tmux send-keys -t "$SESSION_NAME:test" "clear" C-m
tmux send-keys -t "$SESSION_NAME:test" "echo -e '${BLUE}═══════════════════════════════════${NC}'" C-m
tmux send-keys -t "$SESSION_NAME:test" "echo -e '${BLUE}  🧪 $TEST_NAME 시작${NC}'" C-m
tmux send-keys -t "$SESSION_NAME:test" "echo -e '${BLUE}═══════════════════════════════════${NC}'" C-m
tmux send-keys -t "$SESSION_NAME:test" "echo ''" C-m

# 테스트 실행 및 결과 저장
TEST_LOG="/tmp/test-result-$$.log"
touch "$TEST_LOG" && chmod 600 "$TEST_LOG"
tmux send-keys -t "$SESSION_NAME:test" "$TEST_CMD 2>&1 | tee $TEST_LOG" C-m

# 테스트 창으로 전환
tmux select-window -t "$SESSION_NAME:test"

# 백그라운드에서 결과 모니터링
(
    TEST_LOG_FILE="$TEST_LOG"
    sleep 3  # 테스트 시작 대기
    
    # 테스트 완료 대기
    while pgrep -f "vitest|jest" > /dev/null; do
        sleep 1
    done
    
    # 결과 확인
    if [ -f "$TEST_LOG_FILE" ]; then
        if grep -q "failed\|FAIL\|Error" "$TEST_LOG_FILE"; then
            # 실패 알림
            tmux display-message -t "$SESSION_NAME" "❌ 테스트 실패!"
            echo -e "\a" # 비프음
        else
            # 성공 알림
            tmux display-message -t "$SESSION_NAME" "✅ 테스트 성공!"
        fi
        rm -f "$TEST_LOG_FILE"
    fi
) &

echo -e "${GREEN}✅ 테스트가 tmux 창에서 실행 중입니다.${NC}"
echo -e "   창 전환: Ctrl+b 숫자"
echo -e "   세션 연결: tmux attach -t $SESSION_NAME"