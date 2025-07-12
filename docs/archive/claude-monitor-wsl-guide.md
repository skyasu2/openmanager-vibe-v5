# 🐧 Claude Monitor WSL 특화 가이드

Claude Monitor를 WSL 환경에서 최적화하여 사용하는 완벽한 가이드입니다.

## 📋 목차

1. [WSL 환경 확인](#wsl-환경-확인)
2. [빠른 설치 (3분)](#빠른-설치-3분)
3. [듀얼 시스템 구성](#듀얼-시스템-구성)
4. [사용 방법](#사용-방법)
5. [고급 설정](#고급-설정)
6. [문제 해결](#문제-해결)
7. [성능 비교](#성능-비교)

## 🔍 WSL 환경 확인

```bash
# WSL 버전 확인
wsl -l -v

# WSL2 권장 (더 나은 성능)
wsl --set-version Ubuntu 2

# Python 버전 확인
python3 --version  # 3.8+ 필요
```

## 🚀 빠른 설치 (3분)

### 자동 설치 (권장)

```bash
# 프로젝트 디렉토리에서
npm run cm:wsl:setup

# 또는 직접 실행
bash scripts/setup-claude-monitor-wsl.sh
```

### 수동 설치

```bash
# 1. Python 패키지 설치
pip3 install pytz --user

# 2. 실행 권한 부여
chmod +x scripts/claude-monitor.py

# 3. 별칭 설정 (선택사항)
echo "alias cm-py='python3 $(pwd)/scripts/claude-monitor.py --plan max20'" >> ~/.bashrc
source ~/.bashrc
```

## 🔄 듀얼 시스템 구성

현재 두 가지 모니터링 시스템을 제공합니다:

### 1. 기존 시스템 (claude-usage-monitor)

- 외부 npm 패키지 사용
- 안정적이고 검증됨
- UV 도구 필요

```bash
# 실행
npm run cm                # 실시간 모니터링
npm run claude:usage      # 빠른 확인
npm run cm:background     # tmux 백그라운드
```

### 2. 새로운 WSL 최적화 시스템 (Python)

- 직접 구현, 커스터마이징 가능
- WSL 환경에 최적화
- 경량화된 실행

```bash
# 실행
npm run cm:py             # 실시간 모니터링
npm run cm:py:once        # 한 번만 실행
npm run cm:py:background  # tmux 백그라운드
```

## 💻 사용 방법

### 기본 사용법

```bash
# Python 버전 실행 (WSL 최적화)
python3 scripts/claude-monitor.py --plan max20

# npm 스크립트로 실행
npm run cm:py

# 한 번만 실행하고 종료
npm run cm:py:once
```

### 플랜 옵션

```bash
# Pro 플랜 (7,000 토큰)
python3 scripts/claude-monitor.py --plan pro

# Max5 플랜 (35,000 토큰)
python3 scripts/claude-monitor.py --plan max5

# Max20 플랜 (140,000 토큰) - 기본값
python3 scripts/claude-monitor.py --plan max20

# 커스텀 최대 (200,000 토큰)
python3 scripts/claude-monitor.py --plan custom_max

# 자동 감지
python3 scripts/claude-monitor.py --plan auto
```

### 백그라운드 실행

```bash
# tmux를 사용한 백그라운드 실행
npm run cm:py:background

# 또는 직접 실행
tmux new-session -d -s claude-py 'python3 scripts/claude-monitor.py --plan max20'

# 세션 보기
tmux attach -t claude-py

# 세션 종료
tmux kill-session -t claude-py
```

## ⚙️ 고급 설정

### WSL 시작 시 자동 실행

1. **~/.profile에 추가**:

```bash
# Claude Monitor 자동 시작
if [ -f ~/openmanager-vibe-v5/scripts/claude-monitor.py ]; then
    cd ~/openmanager-vibe-v5
    tmux new-session -d -s claude-monitor 'python3 scripts/claude-monitor.py --plan max20'
fi
```

2. **Windows 작업 스케줄러 사용**:

```powershell
# PowerShell에서 실행
$action = New-ScheduledTaskAction -Execute "wsl.exe" -Argument "-d Ubuntu -- bash -c 'cd ~/openmanager-vibe-v5 && python3 scripts/claude-monitor.py --plan max20'"
$trigger = New-ScheduledTaskTrigger -AtLogOn
Register-ScheduledTask -Action $action -Trigger $trigger -TaskName "ClaudeMonitor" -Description "Start Claude Monitor on WSL"
```

### Windows Terminal 프로필 추가

1. Windows Terminal 설정 열기 (Ctrl+,)
2. profiles.list에 추가:

```json
{
  "guid": "{07b52e3e-de2c-5db4-bd2d-ba144ed6c273}",
  "hidden": false,
  "name": "Claude Monitor",
  "commandline": "wsl.exe -d Ubuntu -- bash -c \"cd ~/openmanager-vibe-v5 && python3 scripts/claude-monitor.py --plan max20\"",
  "icon": "🎯",
  "startingDirectory": "//wsl$/Ubuntu/home/username/openmanager-vibe-v5",
  "colorScheme": "Campbell"
}
```

### VS Code 통합

1. **작업 추가** (.vscode/tasks.json):

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Claude Monitor",
      "type": "shell",
      "command": "python3 scripts/claude-monitor.py --plan max20",
      "options": {
        "cwd": "${workspaceFolder}"
      },
      "presentation": {
        "reveal": "always",
        "panel": "new"
      },
      "problemMatcher": []
    }
  ]
}
```

2. **키보드 단축키** (keybindings.json):

```json
{
  "key": "ctrl+shift+m",
  "command": "workbench.action.tasks.runTask",
  "args": "Claude Monitor"
}
```

## 🔧 문제 해결

### 일반적인 문제

#### 1. "ccusage를 찾을 수 없음"

```bash
# ccusage 위치 확인
which ccusage

# PATH에 추가
export PATH="$HOME/.local/bin:$PATH"
```

#### 2. Python 모듈 오류

```bash
# pytz 재설치
pip3 install --user --force-reinstall pytz

# Python 경로 확인
python3 -c "import sys; print(sys.path)"
```

#### 3. 화면 깨짐

```bash
# 터미널 환경 설정
export TERM=xterm-256color

# Windows Terminal 사용 권장
```

#### 4. WSL 경로 문제

```bash
# WSL 홈 디렉토리 사용
cd ~
pwd  # /home/username

# Windows 경로 변환
wslpath -w $(pwd)  # \\wsl$\Ubuntu\home\username
```

### 디버그 모드

```bash
# 상세 로그와 함께 실행
python3 -u scripts/claude-monitor.py --plan max20 2>&1 | tee debug.log

# 환경 변수 확인
env | grep -E '(TERM|PATH|PYTHON)'
```

## 📊 성능 비교

### 시스템 비교

| 기능 | 기존 (claude-usage-monitor) | 새로운 (Python WSL) |
|------|---------------------------|-------------------|
| 메모리 사용량 | ~50MB | ~15MB |
| 시작 시간 | 2-3초 | <1초 |
| CPU 사용률 | 2-3% | <1% |
| 의존성 | UV, Node.js 22+ | Python 3.8+ |
| 커스터마이징 | 제한적 | 자유로움 |
| WSL 최적화 | 일반적 | 특화됨 |

### 사용 시나리오

**기존 시스템이 적합한 경우**:

- 안정성이 최우선
- 여러 컴퓨터에서 동일한 환경 필요
- 업데이트 자동화 필요

**새 Python 시스템이 적합한 경우**:

- WSL 전용 환경
- 빠른 시작과 낮은 리소스 사용 필요
- 프로젝트별 커스터마이징 필요
- 오프라인 환경

## 🎯 베스트 프랙티스

1. **듀얼 시스템 활용**
   - 안정성이 필요할 때: 기존 시스템
   - 빠른 확인이 필요할 때: Python 시스템

2. **자동화**
   - Git hooks에 Python 버전 사용 (더 빠름)
   - 백그라운드 모니터링은 기존 시스템 사용

3. **리소스 관리**
   - 동시에 두 시스템 실행 피하기
   - tmux 세션 정리 주기적으로 하기

## 📚 추가 리소스

- [기존 Claude Monitor 가이드](./claude-monitor-guide.md)
- [WSL 최적화 팁](https://docs.microsoft.com/en-us/windows/wsl/compare-versions)
- [Python in WSL](https://docs.microsoft.com/en-us/windows/python/web-frameworks)

---

## 🎉 설치 완료 체크리스트

- [ ] WSL2 환경 확인
- [ ] Python 3.8+ 설치
- [ ] pytz 패키지 설치
- [ ] ccusage 명령어 확인
- [ ] 스크립트 실행 권한 설정
- [ ] npm scripts 테스트
- [ ] 선호하는 시스템 선택
- [ ] 자동 시작 설정 (선택사항)

이제 WSL 환경에서 최적화된 Claude Monitor를 사용할 수 있습니다! 🚀
