#!/bin/bash
# Claude Monitor WSL 최적화 설정 스크립트

# 색상 정의
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🎯 Claude Monitor WSL 설정${NC}"
echo "=================================="

# 1. alias 등록
echo -e "\n${YELLOW}1. Alias 설정 중...${NC}"

# .bashrc에 alias 추가
if ! grep -q "alias claude-mon" ~/.bashrc; then
    echo "" >> ~/.bashrc
    echo "# Claude Monitor 별칭" >> ~/.bashrc
    echo "alias claude-mon='cd ~/Claude-Code-Usage-Monitor && python3 claude_monitor.py'" >> ~/.bashrc
    echo "alias cm='cd ~/Claude-Code-Usage-Monitor && python3 claude_monitor.py --plan max20'" >> ~/.bashrc
    echo "alias cm-once='cd ~/Claude-Code-Usage-Monitor && python3 claude_monitor.py --plan max20 --timezone Asia/Seoul --reset-hour 4'" >> ~/.bashrc
    echo -e "${GREEN}✅ Alias 추가 완료${NC}"
else
    echo -e "${BLUE}ℹ️  Alias가 이미 설정되어 있습니다.${NC}"
fi

# 2. tmux 자동 시작 스크립트
echo -e "\n${YELLOW}2. tmux 스크립트 생성 중...${NC}"

cat > ~/Claude-Code-Usage-Monitor/cm-tmux.sh << 'EOF'
#!/bin/bash
# Claude Monitor tmux 실행 스크립트

SESSION_NAME="claude-monitor"

# 기존 세션 확인
if tmux has-session -t "$SESSION_NAME" 2>/dev/null; then
    echo "⚠️  이미 실행 중인 Claude Monitor 세션이 있습니다."
    echo "세션 보기: tmux attach -t $SESSION_NAME"
    echo "세션 종료: tmux kill-session -t $SESSION_NAME"
    read -p "기존 세션을 종료하고 새로 시작하시겠습니까? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        tmux kill-session -t "$SESSION_NAME"
    else
        exit 0
    fi
fi

# 새 세션 시작
cd ~/Claude-Code-Usage-Monitor
tmux new-session -d -s "$SESSION_NAME" "python3 claude_monitor.py --plan max20 --timezone Asia/Seoul --reset-hour 4"
echo "✅ Claude Monitor가 백그라운드에서 시작되었습니다."
echo "세션 보기: tmux attach -t $SESSION_NAME"
echo "세션 종료: tmux kill-session -t $SESSION_NAME"
EOF

chmod +x ~/Claude-Code-Usage-Monitor/cm-tmux.sh

# tmux alias 추가
if ! grep -q "alias cm-tmux" ~/.bashrc; then
    echo "alias cm-tmux='~/Claude-Code-Usage-Monitor/cm-tmux.sh'" >> ~/.bashrc
    echo -e "${GREEN}✅ tmux 스크립트 생성 완료${NC}"
fi

# 3. 자동 시작 옵션
echo -e "\n${YELLOW}3. 자동 시작 설정${NC}"
echo "WSL 시작 시 자동으로 Claude Monitor를 실행하시겠습니까?"
read -p "(y/n) " -n 1 -r
echo

if [[ $REPLY =~ ^[Yy]$ ]]; then
    if ! grep -q "Claude Monitor 자동 시작" ~/.profile; then
        echo "" >> ~/.profile
        echo "# Claude Monitor 자동 시작" >> ~/.profile
        echo "if [ -f ~/Claude-Code-Usage-Monitor/cm-tmux.sh ]; then" >> ~/.profile
        echo "    ~/Claude-Code-Usage-Monitor/cm-tmux.sh > /dev/null 2>&1" >> ~/.profile
        echo "fi" >> ~/.profile
        echo -e "${GREEN}✅ 자동 시작 설정 완료${NC}"
    fi
fi

echo -e "\n${GREEN}✅ 모든 설정이 완료되었습니다!${NC}"
echo ""
echo -e "${BLUE}사용 가능한 명령어:${NC}"
echo "  cm          - Claude Monitor 실행 (Max20 플랜)"
echo "  cm-once     - 한 번만 실행 (한국 시간대, 새벽 4시 리셋)"
echo "  cm-tmux     - tmux 백그라운드 실행"
echo "  claude-mon  - 기본 실행"
echo ""
echo -e "${YELLOW}💡 설정을 적용하려면 다음 명령어를 실행하세요:${NC}"
echo "  source ~/.bashrc"