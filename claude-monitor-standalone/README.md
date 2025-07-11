# 🎯 Claude Monitor

실시간 Claude Code 토큰 사용량 모니터링 도구 (WSL/Linux 최적화)

![Python](https://img.shields.io/badge/python-3.8+-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

## ✨ 특징

- 🔥 **실시간 모니터링**: 5초마다 자동 갱신
- 📊 **시각적 진행률**: 토큰 사용량과 시간 진행률 표시
- 🎯 **정확한 데이터**: ccusage 공식 API 사용
- 🌏 **한국 시간대**: KST 기본 지원
- 💻 **WSL 최적화**: 경량화된 Python 구현

## 📸 스크린샷

```
🎯 Claude Code Usage Monitor v2.0
Seoul Time: 2025-07-11 23:30:00 KST
════════════════════════════════════

📊 Token Usage:
   🟢 [██░░░░░░░░░░░░░░░░░░░░░░░░░░░░░] 5.0%

⏳ Time to Reset:
   ⏰ [████████░░░░░░░░░░░░░░░░░░░░░░░] 02:30:00
```

## 🚀 빠른 시작

### 1. 필수 요구사항

- Python 3.8+
- [ccusage](https://github.com/kharvd/ccusage) CLI 도구

### 2. 설치

```bash
# 저장소 클론
git clone https://github.com/yourusername/claude-monitor.git
cd claude-monitor

# Python 패키지 설치
pip install -r requirements.txt

# 실행 권한 부여
chmod +x claude-monitor.py
```

### 3. 실행

```bash
# 기본 실행 (Max20 플랜)
./claude-monitor.py

# 다른 플랜 사용
./claude-monitor.py --plan pro      # 7,000 토큰
./claude-monitor.py --plan max5     # 35,000 토큰
./claude-monitor.py --plan max20    # 140,000 토큰

# 한 번만 실행
./claude-monitor.py --once
```

## 🛠️ 고급 사용법

### tmux 백그라운드 실행

```bash
# 백그라운드 시작
tmux new-session -d -s claude './claude-monitor.py'

# 세션 보기
tmux attach -t claude

# 세션 종료
tmux kill-session -t claude
```

### 자동 시작 설정

```bash
# ~/.profile 또는 ~/.bashrc에 추가
cd ~/claude-monitor && tmux new-session -d -s claude './claude-monitor.py'
```

## 📋 명령어 옵션

| 옵션 | 설명 | 기본값 |
|------|------|--------|
| `--plan` | Claude 플랜 (pro/max5/max20/custom_max/auto) | max20 |
| `--timezone` | 시간대 설정 | Asia/Seoul |
| `--once` | 한 번만 실행하고 종료 | False |

## 🔧 문제 해결

### ccusage를 찾을 수 없음

```bash
# ccusage 설치
npm install -g ccusage

# PATH 확인
export PATH="$HOME/.local/bin:$PATH"
```

### Python 모듈 오류

```bash
# 의존성 재설치
pip install --user -r requirements.txt
```

## 🤝 기여

PR과 이슈는 언제나 환영합니다!

## 📄 라이선스

MIT License - 자유롭게 사용하세요!

---

Made with ❤️ for Claude Code users