# 🎯 Claude Code Usage Monitor - 완전한 설정 가이드

Seoul 시간대에 최적화된 전문적인 Claude Code 사용량 모니터링 시스템

## 🚀 설치 완료됨!

### 📋 설치된 구성요소

1. **메인 모니터**: `~/.claude-monitor/claude_code_monitor.py`
2. **래퍼 스크립트**: `~/.claude-monitor/claude-monitor`
3. **로그 디렉토리**: `~/.claude-monitor/logs/`
4. **세션 디렉토리**: `~/.claude-monitor/sessions/`

## 🎮 사용 방법

### 기본 사용법

```bash
# 직접 실행
python3 ~/.claude-monitor/claude_code_monitor.py --plan auto --reset-hour 9

# 래퍼 스크립트 사용
~/.claude-monitor/claude-monitor --plan auto --reset-hour 9
```

### 백그라운드 모니터링 (tmux)

```bash
# 백그라운드 시작
tmux new-session -d -s claude-monitor 'cd ~/.claude-monitor/sessions && python3 ~/.claude-monitor/claude_code_monitor.py --plan auto --reset-hour 9'

# 세션 확인
tmux list-sessions

# 모니터 화면 보기
tmux capture-pane -t claude-monitor -p

# 세션 연결
tmux attach -t claude-monitor

# 세션 종료
tmux kill-session -t claude-monitor
```

## 🔧 옵션 설정

### Claude 계획 타입
- `--plan pro`: Pro 계획 (7,000 토큰)
- `--plan max5`: Max5 계획 (35,000 토큰)  
- `--plan max20`: Max20 계획 (140,000 토큰)
- `--plan custom_max`: 커스텀 최대 (200,000 토큰)
- `--plan auto`: 자동 감지 (기본값)

### 리셋 시간 설정
- `--reset-hour 9`: 오전 9시 리셋 (기본값)
- `--reset-hour 14`: 오후 2시 리셋
- `--reset-hour 18`: 오후 6시 리셋

### 시간대 설정
- `--timezone Asia/Seoul`: 서울 시간대 (기본값)

## 📊 화면 구성

### 현재 화면 예시
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

────────────────────────────────────────────────────────────────────────────────
Updates every 3 seconds | Press Ctrl+C to exit | Data refreshes automatically
```

### 화면 요소 설명

#### 🔋 Token Usage
- **진행률 바**: 시각적 토큰 사용량 표시
- **Current**: 현재 사용된 토큰 수
- **Total**: 계획별 총 토큰 한도
- **Remaining**: 남은 토큰 수

#### ⏰ Timing Information
- **🔥 Burn Rate**: 분당 토큰 소비율
- **🔄 Next Reset**: 다음 토큰 리셋 시간
- **⏱️ Time to Reset**: 리셋까지 남은 시간
- **🔮 Predicted End**: 예상 토큰 소진 시간

#### 📊 Session Information
- **📅 Started**: 모니터링 시작 시간
- **⏳ Duration**: 현재 세션 지속 시간
- **🎯 Plan**: 감지된 Claude 계획

## 🔄 리셋 시간 시스템

Claude의 5시간 롤링 윈도우 시스템:
- **04:00 KST**: 새벽 4시
- **09:00 KST**: 오전 9시
- **14:00 KST**: 오후 2시  
- **18:00 KST**: 오후 6시
- **23:00 KST**: 밤 11시

## 🚨 경고 시스템

### 색상 코딩
- **🟢 녹색**: 안전 (70% 미만)
- **🟡 노란색**: 주의 (70-90%)
- **🔴 빨간색**: 위험 (90% 이상)

### 경고 메시지
- `⚠️ WARNING: Will run out before reset!`: 리셋 전에 토큰 소진 예상
- `✅ Safe until next reset`: 리셋까지 안전

## 📁 파일 구조

```
~/.claude-monitor/
├── claude_code_monitor.py    # 메인 모니터
├── claude-monitor            # 래퍼 스크립트
├── logs/                     # 로그 파일들
│   └── claude_monitor_*.log
├── sessions/                 # 세션 데이터
│   └── .claude_session.json
└── aliases.sh               # 별칭 설정
```

## 🔧 문제 해결

### 일반적인 문제

1. **Python 찾을 수 없음**
   ```bash
   which python3
   ```

2. **tmux 세션 문제**
   ```bash
   tmux list-sessions
   tmux kill-session -t claude-monitor
   ```

3. **권한 문제**
   ```bash
   chmod +x ~/.claude-monitor/claude-monitor
   chmod +x ~/.claude-monitor/claude_code_monitor.py
   ```

### 로그 확인
```bash
ls -la ~/.claude-monitor/logs/
tail -f ~/.claude-monitor/logs/claude_monitor_*.log
```

### 세션 데이터 확인
```bash
cat ~/.claude-monitor/sessions/.claude_session.json
```

## 🎯 최적 사용 패턴

1. **시작 시**: `tmux new-session -d -s claude-monitor`로 백그라운드 실행
2. **작업 중**: `tmux capture-pane -t claude-monitor -p`로 상태 확인
3. **종료 시**: `tmux kill-session -t claude-monitor`로 정리

## 💡 팁

1. **다중 세션 모니터링**: 여러 tmux 세션으로 다른 계획 동시 모니터링
2. **로그 분석**: 로그 파일로 토큰 사용 패턴 분석
3. **자동 시작**: 쉘 시작 스크립트에 추가하여 자동 시작

## 🔄 업데이트

새로운 기능이나 수정이 필요한 경우:
1. `claude_code_monitor.py` 파일 수정
2. `~/.claude-monitor/`에 복사
3. tmux 세션 재시작

---

## 🎉 성공적으로 설정 완료!

이제 전문적인 Claude Code 사용량 모니터링을 시작할 수 있습니다. 

**바로 시작하기**: `tmux attach -t claude-monitor`