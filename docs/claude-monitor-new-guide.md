# 🎯 Claude Monitor 새로운 가이드

GitHub의 [Claude-Code-Usage-Monitor](https://github.com/Maciek-roboblog/Claude-Code-Usage-Monitor)를 사용한 WSL 최적화 모니터링 도구입니다.

## 🚀 빠른 시작

```bash
# 설치 (최초 1회)
npm run cm:setup

# 실행
npm run cm        # 실시간 모니터링
npm run cm:once   # 빠른 확인 (Git hooks용)
npm run cm:tmux   # 백그라운드 실행
```

## 📋 설치 과정

### 1. 필수 구성 요소
```bash
# WSL/Ubuntu에서 실행
sudo apt update && sudo apt install -y python3 python3-venv python3-pip git tmux
```

### 2. 설치 완료 확인
- GitHub에서 클론: `~/Claude-Code-Usage-Monitor/`
- Python 패키지: pytz, rich (이미 설치됨)
- 별칭(alias) 설정 완료

### 3. 사용 가능한 명령어
```bash
# 터미널에서 직접 사용
cm          # Max20 플랜으로 실행
cm-once     # 한 번만 실행 (한국 시간대)
cm-tmux     # tmux 백그라운드 실행
claude-mon  # 기본 실행

# npm scripts
npm run cm        # 실시간 모니터링
npm run cm:once   # Git hooks용
npm run cm:tmux   # 백그라운드
```

## 🔧 주요 특징

### 1. 시각적 표시
- 🟢 토큰 사용량 진행률 바
- ⏰ 리셋까지 남은 시간
- 🔥 Burn Rate (토큰/분)
- 🔮 예상 종료 시간

### 2. 자동 플랜 감지
- PRO (7,000 토큰)
- MAX5 (35,000 토큰)  
- MAX20 (140,000 토큰)
- CUSTOM_MAX (354,515 토큰) - 자동 전환

### 3. WSL 최적화
- 한국 시간대 (Asia/Seoul) 지원
- 새벽 4시 리셋 설정 가능
- tmux 백그라운드 실행

## 📊 화면 예시

```
✦ ✧ ✦ ✧ CLAUDE CODE USAGE MONITOR ✦ ✧ ✦ ✧
============================================================

📊 Token Usage:    🟢 [████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░] 16.5%

⏳ Time to Reset:  ⏰ [███████████████████████████░░░░░░░░░░░░░░░░░░░░░░] 2h 16m

🎯 Tokens:         58,613 / ~354,515 (295,902 left)
🔥 Burn Rate:      357.8 tokens/min

🏁 Predicted End: 06:30
🔄 Token Reset:   19:00

🔄 Tokens exceeded PRO limit - switched to custom_max (354,515)
```

## 🛠️ 문제 해결

### Python venv 설치 필요
```bash
sudo apt install python3-venv
```

### pip 설치 필요
```bash
sudo apt install python3-pip
```

### tmux 세션 관리
```bash
tmux ls                           # 세션 목록
tmux attach -t claude-monitor     # 세션 연결
tmux kill-session -t claude-monitor  # 세션 종료
```

## 📚 추가 정보

- **소스 코드**: [GitHub Repository](https://github.com/Maciek-roboblog/Claude-Code-Usage-Monitor)
- **원본 프로젝트**: Maciek-roboblog 작성
- **라이선스**: MIT

---

## 🎉 설치 완료!

이제 다음 명령어로 Claude 사용량을 모니터링할 수 있습니다:
```bash
npm run cm
```