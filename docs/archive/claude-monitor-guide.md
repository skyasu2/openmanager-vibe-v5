# 🎯 Claude Monitor 완전 가이드

Claude Code 사용량을 실시간으로 모니터링하는 전문적인 도구의 완벽한 가이드입니다.

## 📖 목차

1. [개요](#개요)
2. [설치 요구사항](#설치-요구사항)
3. [설치 방법](#설치-방법)
4. [기본 사용법](#기본-사용법)
5. [고급 기능 및 설정](#고급-기능-및-설정)
6. [npm scripts 설명](#npm-scripts-설명)
7. [Git hooks 연동](#git-hooks-연동)
8. [문제 해결 가이드](#문제-해결-가이드)
9. [팁과 모범 사례](#팁과-모범-사례)

## 🚀 개요

Claude Monitor는 Claude Code의 토큰 사용량을 실시간으로 추적하고 시각화하는 도구입니다. 한국 시간대(KST)에 최적화되어 있으며, 5시간 롤링 윈도우 시스템을 기반으로 정확한 사용량 예측과 경고를 제공합니다.

### 주요 기능

- 🔋 실시간 토큰 사용량 모니터링
- 📊 시각적 진행률 표시
- ⏰ 자동 리셋 시간 계산
- 🔥 토큰 소비율 분석
- ⚠️ 사용량 경고 시스템
- 💾 세션 데이터 저장
- 🌏 한국 시간대 지원

## 📋 설치 요구사항

### 시스템 요구사항

- **Python 3.8+**
- **tmux** (백그라운드 실행용)
- **UV 도구** (Python 패키지 매니저)

### 확인 방법

```bash
# Python 버전 확인
python3 --version

# tmux 설치 여부 확인
which tmux

# UV 도구 확인
which uv
```

## 🔧 설치 방법

### 1단계: UV 도구 설치

```bash
# UV 설치 (권장)
curl -LsSf https://astral.sh/uv/install.sh | sh

# 또는 pip으로 설치
pip install uv
```

### 2단계: claude-usage-monitor 설치

```bash
# UV 도구로 설치
uv tool install claude-usage-monitor

# 설치 확인
which claude-monitor
```

### 3단계: 설정 디렉토리 구성

```bash
# 홈 디렉토리에 설정 폴더 생성
mkdir -p ~/.claude-monitor/{logs,sessions}
cd ~/.claude-monitor
```

### 4단계: 래퍼 스크립트 생성

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

# 실행 권한 부여
chmod +x ~/.claude-monitor/claude-monitor
```

### 5단계: 환경 변수 및 별칭 설정

```bash
# PATH에 추가 (아직 없다면)
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc

# 별칭 추가
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

### 6단계: 프로젝트별 스크립트 설정

프로젝트에서 사용할 스크립트를 생성합니다:

```bash
# scripts/claude-usage.sh 생성
mkdir -p scripts
cat > scripts/claude-usage.sh << 'EOF'
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
EOF

chmod +x scripts/claude-usage.sh
```

```bash
# scripts/claude-monitor-tmux.sh 생성
cat > scripts/claude-monitor-tmux.sh << 'EOF'
#!/bin/bash

# tmux 세션 관리 스크립트
SESSION_NAME="claude-monitor"

# 기존 세션 확인
if tmux has-session -t "$SESSION_NAME" 2>/dev/null; then
    echo "⚠️  기존 Claude Monitor 세션이 실행 중입니다."
    echo "옵션:"
    echo "  1) 세션 보기"
    echo "  2) 세션 종료 후 재시작"
    echo "  3) 취소"
    read -p "선택하세요 (1-3): " choice
    
    case $choice in
        1)
            tmux attach -t "$SESSION_NAME"
            ;;
        2)
            tmux kill-session -t "$SESSION_NAME"
            echo "세션을 종료했습니다. 새로 시작합니다..."
            tmux new-session -d -s "$SESSION_NAME" 'claude-monitor --plan max20'
            echo "✅ 백그라운드에서 시작되었습니다."
            ;;
        *)
            echo "취소되었습니다."
            ;;
    esac
else
    # 새 세션 시작
    tmux new-session -d -s "$SESSION_NAME" 'claude-monitor --plan max20'
    echo "✅ Claude Monitor가 백그라운드에서 시작되었습니다."
    echo "세션 보기: tmux attach -t $SESSION_NAME"
fi
EOF

chmod +x scripts/claude-monitor-tmux.sh
```

## 🎮 기본 사용법

### 터미널에서 직접 실행

```bash
# 기본 실행 (별칭 사용)
cm

# 또는 한국어 명령
사용량

# 전체 명령어로 실행
claude-monitor --plan max20
```

### npm 스크립트로 실행

```bash
# 빠른 상태 확인 (10초 제한)
npm run claude:usage

# 지속적인 모니터링
npm run cm

# tmux 백그라운드 실행
npm run cm:background
```

### 백그라운드 실행 (tmux)

```bash
# 백그라운드에서 시작
tmux new-session -d -s claude-monitor 'claude-monitor --plan max20'

# 모니터 화면 보기
tmux attach -t claude-monitor

# 현재 상태만 확인
tmux capture-pane -t claude-monitor -p

# 세션 종료
tmux kill-session -t claude-monitor
```

## 🔧 고급 기능 및 설정

### Claude 계획 옵션

```bash
# Pro 계획 (7,000 토큰)
claude-monitor --plan pro

# Max5 계획 (35,000 토큰)
claude-monitor --plan max5

# Max20 계획 (140,000 토큰) - 기본값
claude-monitor --plan max20

# 커스텀 최대 (200,000 토큰)
claude-monitor --plan custom_max

# 자동 감지
claude-monitor --plan auto
```

### 리셋 시간 설정

Claude의 5시간 롤링 윈도우 시스템에 맞춰 리셋 시간을 설정할 수 있습니다:

```bash
# 오전 9시 리셋 (기본값)
claude-monitor --plan max20 --reset-hour 9

# 오후 2시 리셋
claude-monitor --plan max20 --reset-hour 14

# 오후 6시 리셋
claude-monitor --plan max20 --reset-hour 18
```

### 시간대 설정

```bash
# 서울 시간대 (기본값)
claude-monitor --plan max20 --timezone Asia/Seoul

# 다른 시간대
claude-monitor --plan max20 --timezone America/New_York
```

## 📊 화면 구성 설명

### 메인 디스플레이

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                    🎯 Claude Code Usage Monitor v2.0                        ║
║                          Seoul Time:   2025-07-09 07:58:38 KST           ║
╚══════════════════════════════════════════════════════════════════════════════╝

🔋 Token Usage:
   █████████████████░░░░░░░░░░░░░░░░░░░░░░░ 42.9%
   Current: 15,031 | Total: 35,000 | Remaining: 19,969

⏰ Timing Information:
   🔥 Burn Rate: 63403.9 tokens/min
   🔄 Next Reset: 09:00:00 KST
   ⏱️  Time to Reset: 01:01:21
   🔮 Predicted End: 07:58:57 KST ⚠️  WARNING: Will run out before reset!

📊 Session Information:
   📅 Started: 2025-07-09 07:58:24 KST
   ⏳ Duration: 0 minutes
   🎯 Plan: MAX5
```

### 색상 코딩 시스템

- 🟢 **녹색** (0-69%): 안전한 사용량
- 🟡 **노란색** (70-89%): 주의 필요
- 🔴 **빨간색** (90%+): 위험 수준

### 경고 메시지

- `⚠️ WARNING: Will run out before reset!` - 리셋 전 토큰 소진 예상
- `✅ Safe until next reset` - 리셋까지 충분한 토큰

## 📦 npm scripts 설명

### package.json 설정

```json
{
  "scripts": {
    "cm": "claude-monitor --plan max20",
    "claude:usage": "bash scripts/claude-usage.sh",
    "cm:background": "bash scripts/claude-monitor-tmux.sh"
  }
}
```

### 스크립트 용도

1. **`npm run cm`**
   - 실시간 모니터링 모드
   - Ctrl+C로 종료

2. **`npm run claude:usage`**
   - 빠른 상태 확인 (10초 타임아웃)
   - 현재 사용량만 빠르게 확인

3. **`npm run cm:background`**
   - tmux를 사용한 백그라운드 실행
   - 세션 관리 대화형 인터페이스

## 🔗 Git hooks 연동

Git commit 시 자동으로 Claude 사용량을 확인하도록 설정할 수 있습니다:

### pre-commit hook 설정

```bash
# .git/hooks/pre-commit 생성
cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash

echo "📊 Claude 사용량 확인 중..."
timeout 5s claude-monitor --plan max20 --quiet || true
echo ""
EOF

chmod +x .git/hooks/pre-commit
```

### post-commit hook 설정

```bash
# .git/hooks/post-commit 생성
cat > .git/hooks/post-commit << 'EOF'
#!/bin/bash

# 백그라운드에서 사용량 기록
(claude-monitor --plan max20 --log-only 2>&1 | \
 tee -a ~/.claude-monitor/logs/commit-usage.log) &
EOF

chmod +x .git/hooks/post-commit
```

## 🚨 문제 해결 가이드

### 일반적인 문제와 해결방법

#### 1. claude-monitor를 찾을 수 없음

```bash
# PATH 확인
echo $PATH

# UV 도구 경로 추가
export PATH="$HOME/.local/bin:$PATH"

# .bashrc에 영구 추가
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

#### 2. Python 버전 문제

```bash
# Python 버전 확인
python3 --version

# Python 3.8+ 필요
# Ubuntu/Debian에서 업그레이드
sudo apt update
sudo apt install python3.8
```

#### 3. tmux 관련 문제

```bash
# tmux 설치 확인
which tmux

# 설치되지 않은 경우
# Ubuntu/Debian
sudo apt-get install tmux

# macOS
brew install tmux

# 실행 중인 세션 확인
tmux list-sessions

# 모든 세션 종료
tmux kill-server
```

#### 4. 권한 문제

```bash
# 스크립트 실행 권한 확인
ls -la ~/.claude-monitor/

# 권한 부여
chmod +x ~/.claude-monitor/claude-monitor
chmod +x scripts/*.sh
```

#### 5. 세션 데이터 문제

```bash
# 세션 데이터 확인
cat ~/.claude-monitor/sessions/.claude_session.json

# 세션 초기화
rm -f ~/.claude-monitor/sessions/.claude_session.json
```

### 로그 확인

```bash
# 로그 디렉토리 확인
ls -la ~/.claude-monitor/logs/

# 최신 로그 보기
tail -f ~/.claude-monitor/logs/claude_monitor_*.log

# 오류 로그만 필터링
grep ERROR ~/.claude-monitor/logs/*.log
```

### 디버그 모드 실행

```bash
# 상세 로그와 함께 실행
claude-monitor --plan max20 --debug

# 로그 파일로 출력 리다이렉션
claude-monitor --plan max20 2>&1 | tee debug.log
```

## 💡 팁과 모범 사례

### 1. 효율적인 모니터링 전략

- **작업 시작 시**: 백그라운드 모니터 시작
- **작업 중**: 주기적으로 상태 확인
- **작업 종료 시**: 세션 정리

```bash
# 작업 시작
npm run cm:background

# 상태 확인 (작업 중)
tmux capture-pane -t claude-monitor -p | head -20

# 작업 종료
tmux kill-session -t claude-monitor
```

### 2. 토큰 절약 팁

- 사용량이 70%를 넘으면 주의
- Burn Rate가 높을 때는 작업 속도 조절
- 리셋 시간 가까이에서는 신중하게 사용

### 3. 다중 프로젝트 관리

여러 프로젝트에서 작업할 때:

```bash
# 프로젝트별 tmux 세션
tmux new-session -d -s project1-monitor 'claude-monitor --plan max20'
tmux new-session -d -s project2-monitor 'claude-monitor --plan max5'

# 세션 목록 확인
tmux list-sessions
```

### 4. 자동화 설정

쉘 시작 시 자동으로 모니터 시작:

```bash
# .bashrc 또는 .zshrc에 추가
# Claude Monitor 자동 시작 (조건부)
if ! tmux has-session -t claude-monitor 2>/dev/null; then
    tmux new-session -d -s claude-monitor 'claude-monitor --plan max20'
fi
```

### 5. 데이터 분석

사용 패턴 분석을 위한 로그 활용:

```bash
# 일별 사용량 집계
grep "Current:" ~/.claude-monitor/logs/*.log | \
awk '{print $1, $3}' | sort | uniq -c

# 피크 시간대 분석
grep "Burn Rate:" ~/.claude-monitor/logs/*.log | \
awk '{print substr($1,12,2), $5}' | sort -n
```

### 6. 팀 협업

팀에서 사용할 때:

1. 공통 설정 파일 공유
2. 사용량 리포트 자동화
3. Slack/Discord 알림 연동

```bash
# 사용량 리포트 생성
claude-monitor --plan max20 --report > daily-usage.txt

# 임계값 도달 시 알림
if [[ $(claude-monitor --plan max20 --check-threshold 80) == "exceeded" ]]; then
    echo "Claude 사용량 80% 초과!" | mail -s "Claude Alert" team@example.com
fi
```

## 🔄 업데이트 및 유지관리

### 도구 업데이트

```bash
# 최신 버전으로 업데이트
uv tool upgrade claude-usage-monitor

# 버전 확인
claude-monitor --version
```

### 설정 백업

```bash
# 설정 백업
tar -czf claude-monitor-backup.tar.gz ~/.claude-monitor/

# 복원
tar -xzf claude-monitor-backup.tar.gz -C ~/
```

## 📚 추가 리소스

- [Claude API 문서](https://claude.ai/docs)
- [UV 도구 문서](https://github.com/astral-sh/uv)
- [tmux 치트시트](https://tmuxcheatsheet.com/)

---

## 🎉 설치 완료 체크리스트

- [ ] Python 3.8+ 설치 확인
- [ ] UV 도구 설치
- [ ] claude-usage-monitor 설치
- [ ] ~/.claude-monitor 디렉토리 생성
- [ ] 래퍼 스크립트 생성
- [ ] 별칭 설정 (.bashrc/.zshrc)
- [ ] 프로젝트 스크립트 생성
- [ ] npm scripts 추가
- [ ] 실행 권한 설정
- [ ] 테스트 실행 성공

축하합니다! 이제 Claude Monitor를 사용하여 효율적으로 토큰 사용량을 관리할 수 있습니다. 🚀