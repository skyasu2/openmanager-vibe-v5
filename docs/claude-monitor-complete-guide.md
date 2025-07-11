# 🎯 Claude Monitor 완전 가이드

Claude Code 사용량을 실시간으로 모니터링하는 WSL 최적화 도구입니다.

## 🚀 빠른 시작 (1분)

```bash
# 설치
npm run cm:setup

# 실행
npm run cm        # 실시간 모니터링
npm run cm:once   # 빠른 확인
npm run cm:tmux   # 백그라운드 실행
```

## 📋 목차

1. [특징](#특징)
2. [설치](#설치)
3. [사용법](#사용법)
4. [명령어](#명령어)
5. [문제 해결](#문제-해결)
6. [기술 사양](#기술-사양)

## ✨ 특징

- **정확한 데이터**: ccusage 공식 데이터 사용
- **실시간 모니터링**: 5초마다 자동 갱신
- **WSL 최적화**: 경량화된 Python 구현
- **시각적 UI**: 진행률 바와 색상 코딩
- **한국 시간대**: KST 기본 지원

## 🔧 설치

### 필수 요구사항

- Python 3.8+
- ccusage CLI 도구
- WSL2 (권장) 또는 Linux/macOS

### 자동 설치

```bash
# 프로젝트 디렉토리에서
npm run cm:setup
```

### 수동 설치

```bash
# 1. Python 패키지 설치
pip3 install pytz --user

# 2. ccusage 확인
which ccusage  # 없다면 npm install -g ccusage

# 3. 실행 권한
chmod +x scripts/claude-monitor.py scripts/cm.sh
```

## 💻 사용법

### 기본 명령어

```bash
# npm scripts 사용 (권장)
npm run cm        # 실시간 모니터링
npm run cm:once   # 한 번만 실행
npm run cm:tmux   # tmux 백그라운드

# 직접 실행
bash scripts/cm.sh
python3 scripts/claude-monitor.py --plan max20
```

### 플랜 옵션

- `pro`: 7,000 토큰
- `max5`: 35,000 토큰
- `max20`: 140,000 토큰 (기본값)
- `custom_max`: 200,000 토큰
- `auto`: 자동 감지

### 백그라운드 실행

```bash
# tmux로 백그라운드 실행
npm run cm:tmux

# 세션 확인
tmux ls

# 세션 연결
tmux attach -t claude-monitor

# 세션 종료
tmux kill-session -t claude-monitor
```

## 📊 화면 구성

```
🎯 Claude Code Usage Monitor v2.0
Seoul Time: 2025-07-11 23:30:00 KST
════════════════════════════════════

📊 Token Usage:
   🟢 [██░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░] 5.0%

⏳ Time to Reset:
   ⏰ [████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░] 02:30:00

⏰ Timing Information:
   🔥 Burn Rate: 65.2 tokens/min
   🔄 Next Reset: 03:00:00 KST
   🔮 Predicted End: 03:15:00 KST ✅ Safe

📊 Session Information:
   📅 Started: 2025-07-11 22:00:00 KST
   ⏳ Duration: 90 minutes
   💰 Cost: $20.50 (₩26,650)
```

### 색상 코드

- 🟢 **녹색** (0-69%): 안전
- 🟡 **노란색** (70-89%): 주의
- 🔴 **빨간색** (90%+): 위험

## 🛠️ 고급 설정

### 자동 시작 (WSL)

```bash
# ~/.profile에 추가
if [ -f ~/openmanager-vibe-v5/scripts/cm.sh ]; then
    cd ~/openmanager-vibe-v5
    tmux new-session -d -s claude-monitor 'npm run cm'
fi
```

### VS Code 통합

`.vscode/tasks.json`:
```json
{
  "label": "Claude Monitor",
  "type": "shell",
  "command": "npm run cm",
  "presentation": {
    "reveal": "always",
    "panel": "new"
  }
}
```

### Git Hooks

자동으로 commit/push 시 사용량 확인:
```json
// package.json
"postcommit": "npm run cm:once",
"postpush": "npm run cm:once"
```

## 🔍 문제 해결

### ccusage를 찾을 수 없음

```bash
# PATH 확인
echo $PATH

# 직접 경로 추가
export PATH="$HOME/.local/bin:$PATH"
```

### Python 모듈 오류

```bash
# pytz 재설치
pip3 install --user --force-reinstall pytz
```

### 화면 깨짐

```bash
# 터미널 설정
export TERM=xterm-256color

# Windows Terminal 사용 권장
```

## 📈 성능

### 시스템 비교

| 항목 | 외부 패키지 | Claude Monitor |
|------|------------|----------------|
| 시작 시간 | 2.0초 | 1.2초 |
| 메모리 | 20MB | 16MB |
| CPU | 2-3% | <1% |

### 성능 테스트

```bash
npm run cm:test
```

## 🔧 기술 사양

### 데이터 소스
- ccusage CLI의 blocks API
- 5시간 윈도우 기반 세션 관리
- UTC → KST 자동 변환

### 핵심 계산
- **Burn Rate**: `tokensPerMinuteForIndicator` 사용
- **리셋 시간**: 세션 `endTime`에서 추출
- **진행률**: 현재 세션 시간 / 5시간

## 📦 파일 구조

```
scripts/
├── claude-monitor.py    # 메인 Python 스크립트
├── cm.sh               # 통합 실행 스크립트
├── setup-claude-monitor-wsl.sh  # WSL 설치
└── claude-monitor-benchmark.sh  # 성능 테스트
```

## 🤝 기여

버그 리포트나 기능 제안은 GitHub Issues에 등록해주세요.

## 📄 라이선스

MIT License

---

### 🎉 빠른 명령어 정리

```bash
npm run cm        # 시작
npm run cm:once   # 빠른 확인
npm run cm:tmux   # 백그라운드
npm run cm:setup  # 설치
npm run cm:test   # 성능 테스트
```

즐거운 코딩 되세요! 🚀