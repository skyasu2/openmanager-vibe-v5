# 🎯 Claude Monitor 다른 컴퓨터 설치 가이드

다른 컴퓨터에 동일한 Claude Monitor 환경을 구축하는 완벽한 가이드입니다.

## 📋 사전 준비사항

1. **Python 3.8+** 설치 확인
   ```bash
   python3 --version
   ```

2. **UV 도구** 설치 (Python 패키지 매니저)
   ```bash
   # UV 설치 (아직 없다면)
   curl -LsSf https://astral.sh/uv/install.sh | sh
   
   # 또는 pip으로 설치
   pip install uv
   ```

3. **tmux** 설치 (백그라운드 실행용)
   ```bash
   # Ubuntu/Debian
   sudo apt-get install tmux
   
   # macOS
   brew install tmux
   ```

## 🚀 설치 단계

### 1단계: claude-usage-monitor 설치

```bash
# UV 도구로 claude-monitor 설치
uv tool install claude-usage-monitor

# 설치 확인
which claude-monitor
```

### 2단계: 설정 디렉토리 생성

```bash
# 홈 디렉토리에 .claude-monitor 폴더 생성
mkdir -p ~/.claude-monitor/{logs,sessions}
cd ~/.claude-monitor
```

### 3단계: 모니터 스크립트 다운로드

현재 컴퓨터의 `~/.claude-monitor/` 디렉토리에서 다음 파일들을 복사:

1. **claude_code_monitor.py** - 메인 모니터 스크립트
2. **claude-monitor** - 래퍼 스크립트
3. **aliases.sh** - 별칭 설정

또는 새로 생성:

```bash
# 래퍼 스크립트 생성
cat > ~/.claude-monitor/claude-monitor << 'EOF'
#!/bin/bash
# Claude Monitor Wrapper Script

# 기본 경로 설정
MONITOR_DIR="$HOME/.claude-monitor"
MONITOR_SCRIPT="$MONITOR_DIR/claude_code_monitor.py"
SESSION_DIR="$MONITOR_DIR/sessions"

# 세션 디렉토리 확인 및 생성
mkdir -p "$SESSION_DIR"

# Python 경로 확인
if command -v python3 &> /dev/null; then
    PYTHON_CMD="python3"
else
    echo "Error: Python 3 not found"
    exit 1
fi

# 세션 디렉토리로 이동 후 실행
cd "$SESSION_DIR" && $PYTHON_CMD "$MONITOR_SCRIPT" "$@"
EOF

chmod +x ~/.claude-monitor/claude-monitor
```

### 4단계: 별칭(Alias) 설정

```bash
# .bashrc 또는 .zshrc에 추가
echo '' >> ~/.bashrc
echo '# Claude Monitor Aliases' >> ~/.bashrc
echo 'alias cm="claude-monitor --plan max20"' >> ~/.bashrc
echo 'alias 사용량="claude-monitor --plan max20"' >> ~/.bashrc
echo '' >> ~/.bashrc
echo '# 한국어 명령어 함수' >> ~/.bashrc
echo '클로드() {' >> ~/.bashrc
echo '    case "$1" in' >> ~/.bashrc
echo '        "사용량"|"모니터"|"monitor")' >> ~/.bashrc
echo '            claude-monitor --plan max20' >> ~/.bashrc
echo '            ;;' >> ~/.bashrc
echo '        *)' >> ~/.bashrc
echo '            echo "사용법: 클로드 [사용량|모니터|monitor]"' >> ~/.bashrc
echo '            ;;' >> ~/.bashrc
echo '    esac' >> ~/.bashrc
echo '}' >> ~/.bashrc

# 설정 즉시 적용
source ~/.bashrc
```

### 5단계: 프로젝트 스크립트 설정

프로젝트 내에서 사용하는 스크립트들:

```bash
# scripts/claude-usage.sh
cat > ~/your-project/scripts/claude-usage.sh << 'EOF'
#!/bin/bash
# Claude Usage Quick Check Script

# 색상 정의
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}🎯 Claude Code Usage Monitor${NC}"
echo "================================"
echo ""

# Claude monitor 실행
if command -v claude-monitor &> /dev/null; then
    echo -e "${GREEN}실행 중...${NC}"
    echo ""
    # 10초 타임아웃으로 실행
    timeout 10s claude-monitor --plan max20
else
    echo -e "${YELLOW}⚠️  claude-monitor가 설치되어 있지 않습니다.${NC}"
    echo "설치 명령어: uv tool install claude-usage-monitor"
fi

echo ""
echo -e "${BLUE}빠른 명령어:${NC}"
echo "  cm              - Claude 모니터 실행"
echo "  사용량          - Claude 사용량 확인"
echo "  클로드 사용량   - 한국어 명령"
echo "  claude_usage    - 함수로 실행"
EOF

chmod +x ~/your-project/scripts/claude-usage.sh
```

```bash
# scripts/show-claude-usage.sh
cat > ~/your-project/scripts/show-claude-usage.sh << 'EOF'
#!/bin/bash
# Claude token usage display script

echo ""
echo "🎯 Claude Token Usage Status"
echo "============================"

# Run claude-monitor with a 10-second timeout
# Using system-installed version
timeout 10s claude-monitor --plan max20 2>/dev/null || {
    echo "📊 Quick status check completed."
}

echo ""
EOF

chmod +x ~/your-project/scripts/show-claude-usage.sh
```

## 🔧 설정 확인

### 1. 설치 확인
```bash
# claude-monitor 위치 확인
which claude-monitor

# 실행 테스트
claude-monitor --help
```

### 2. 별칭 테스트
```bash
# 별칭 동작 확인
cm
사용량
클로드 사용량
```

### 3. 스크립트 테스트
```bash
# 프로젝트 스크립트 실행
./scripts/claude-usage.sh
./scripts/show-claude-usage.sh
```

## 🎮 사용 방법

### 기본 사용
```bash
# MAX20 플랜으로 실행
cm

# 또는
claude-monitor --plan max20
```

### 백그라운드 실행 (tmux)
```bash
# 백그라운드에서 시작
tmux new-session -d -s claude-monitor 'claude-monitor --plan max20'

# 세션 확인
tmux list-sessions

# 모니터 화면 보기
tmux attach -t claude-monitor

# 세션 종료
tmux kill-session -t claude-monitor
```

## 🌍 시간대 설정

한국 시간으로 설정하려면:
```bash
claude-monitor --plan max20 --timezone Asia/Seoul
```

## 📝 package.json 스크립트 추가 (선택사항)

프로젝트의 package.json에 추가:
```json
{
  "scripts": {
    "claude:usage": "bash scripts/claude-usage.sh",
    "claude:show": "bash scripts/show-claude-usage.sh",
    "cm": "claude-monitor --plan max20"
  }
}
```

## 🚨 문제 해결

### 1. claude-monitor를 찾을 수 없음
```bash
# PATH 확인
echo $PATH

# UV 도구 경로 추가
export PATH="$HOME/.local/bin:$PATH"
```

### 2. Python 버전 문제
```bash
# Python 3.8+ 필요
python3 --version

# 필요시 Python 업그레이드
```

### 3. 권한 문제
```bash
chmod +x ~/.claude-monitor/claude-monitor
chmod +x ~/your-project/scripts/*.sh
```

## 🔄 업데이트

```bash
# 최신 버전으로 업데이트
uv tool upgrade claude-usage-monitor
```

## ✅ 설치 완료 체크리스트

- [ ] UV 도구 설치
- [ ] claude-usage-monitor 설치
- [ ] ~/.claude-monitor 디렉토리 생성
- [ ] 별칭 설정 (.bashrc/.zshrc)
- [ ] 프로젝트 스크립트 생성
- [ ] 실행 권한 설정
- [ ] 테스트 실행 성공

이제 다른 컴퓨터에서도 동일한 Claude Monitor 환경을 사용할 수 있습니다! 🎉