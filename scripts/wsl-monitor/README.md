# 🖥️ WSL 통합 모니터링 도구

OpenManager VIBE 개발 환경을 위한 WSL 전용 모니터링 도구입니다. 시스템 리소스, MCP 서버 상태, 프로세스 분석을 실시간으로 모니터링하고 로깅합니다.

## 🎯 주요 기능

### 📊 시스템 모니터링
- **메모리 사용량**: 전체/사용중/버퍼/캐시/스왑 메모리 분석
- **CPU 사용률**: 코어별 부하, 로드 평균 추적
- **디스크 I/O**: 읽기/쓰기 속도, 디스크 사용률
- **네트워크**: 기본적인 송수신 트래픽 모니터링

### 🔄 프로세스 분석
- **상위 프로세스**: CPU/메모리 사용률 기준 상위 프로세스 추적
- **MCP 프로세스**: 9개 MCP 서버 프로세스 특별 모니터링
- **Claude 프로세스**: Claude Code 프로세스 리소스 사용 분석
- **좀비 프로세스**: 좀비 프로세스 감지 및 알림

### 🌐 MCP 서버 모니터링
- **연결 상태**: 9개 MCP 서버 실시간 연결 상태 체크
- **응답 시간**: 각 서버별 응답 시간 측정 및 기록
- **Serena 특별 디버깅**: Serena MCP 메모리/CPU 사용량, 로그 분석
- **실패 패턴**: 연속 실패 횟수 추적 및 복구 제안

## 🚀 설치 및 사용법

### 기본 사용
```bash
# 실시간 모니터링 시작 (5초 간격)
./scripts/wsl-monitor/wsl-monitor.sh

# 도움말 보기
./scripts/wsl-monitor/wsl-monitor.sh --help

# 한 번만 실행하고 종료
./scripts/wsl-monitor/wsl-monitor.sh --once

# MCP 서버 상태만 체크
./scripts/wsl-monitor/wsl-monitor.sh --check-mcp
```

### 고급 옵션
```bash
# 데몬 모드로 백그라운드 실행
./scripts/wsl-monitor/wsl-monitor.sh --daemon

# 10초 간격으로 상세 로그와 함께 실행
./scripts/wsl-monitor/wsl-monitor.sh --interval 10 --verbose

# 데몬 중지
./scripts/wsl-monitor/wsl-monitor.sh --stop
```

## 📁 파일 구조

```
scripts/wsl-monitor/
├── wsl-monitor.sh              # 메인 실행 스크립트
├── lib/                        # 핵심 모듈들
│   ├── system-metrics.sh       # 시스템 메트릭 수집
│   ├── process-analyzer.sh     # 프로세스 분석
│   └── mcp-checker.sh          # MCP 서버 상태 체크
├── dashboard/                  # 사용자 인터페이스
│   └── terminal-ui.sh          # 터미널 대시보드
├── logs/                       # 로그 저장소
│   ├── system/                 # 시스템 메트릭 로그
│   ├── process/                # 프로세스 분석 로그
│   └── mcp/                    # MCP 서버 상태 로그
└── README.md                   # 이 파일
```

## 📊 대시보드 화면

```
🖥️ WSL System Monitor - OpenManager VIBE
2025-09-17 09:30:45 | 반복: #42 | 간격: 5초
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 시스템 리소스:
  메모리: 10240/16384 MB (62%) [████████░░░░░░░░░░░░]
  CPU:    45% (6 코어)          [█████░░░░░░░░░░░░░░░]
  디스크:  850G/2.0T (42%)      [████░░░░░░░░░░░░░░░░]
  로드:   2.1 1.8 1.5 (1분, 5분, 15분)

🔄 프로세스 현황:
  전체: 234개 | 실행중: 12개
  Claude: PID 12341 | 519MB | 9.3%CPU
  MCP:    9개 프로세스 | 67MB | 2.1%CPU
  상위 프로세스:
    PID 12341  9.3% CPU | claude
    PID 1272   0.2% CPU | playwright-mcp-server
    PID 12457  0.0% CPU | mcp-server-time

🌐 MCP 서버 상태:
  연결: 9/9 서버 ✅ 모든 서버 정상
  ✅ memory        12ms     ✅ time          8ms
  ✅ context7      45ms     ✅ serena       180ms
  ✅ supabase      23ms     ✅ vercel       67ms
  ✅ playwright    15ms     ✅ shadcn-ui    19ms
  ✅ sequential    11ms

⚠️ 알림:
  🔧 Serena MCP 문제: 180ms, 실패 0회

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Ctrl+C: 종료 | 로그: ./logs | 다음 업데이트: 5초 후
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## 🔍 Serena MCP 특별 디버깅

Serena MCP 문제 해결을 위한 특별 기능들:

### 상세 진단 정보
- **응답 시간 추적**: 200ms 이상 시 경고
- **메모리 사용량**: 500MB 이상 시 알림  
- **CPU 사용률**: 지속적인 높은 사용률 감지
- **로그 분석**: 최근 오류 메시지 자동 수집

### 문제 해결 제안
```bash
# Serena MCP 문제 발생 시 제안되는 해결책:
# 1. 로그 레벨 변경: --log-level INFO → DEBUG
# 2. 타임아웃 증가: --tool-timeout 180 → 300  
# 3. 메모리 체크: 현재 사용량 확인
# 4. 재시작: claude mcp remove serena && claude mcp add serena [명령어]
```

## 📈 로그 시스템

### JSON 형태 구조화된 로그
```json
{
  "timestamp": "2025-09-17 09:30:45",
  "iteration": 42,
  "memory": {
    "total_mb": 16384,
    "used_mb": 10240,
    "usage_percent": 62
  },
  "mcp_analysis": {
    "total_processes": 9,
    "total_memory_mb": 67,
    "processes": [...]
  }
}
```

### 로그 파일 위치
- **시스템 메트릭**: `logs/system/metrics-YYYYMMDD.log`
- **프로세스 분석**: `logs/process/analysis-YYYYMMDD.log`
- **MCP 서버 상태**: `logs/mcp/status-YYYYMMDD.log`
- **Serena 디버깅**: `logs/mcp/serena-debug-YYYYMMDD.log`

### 자동 로그 로테이션
- 100MB 초과 시 자동 백업
- 일별 로그 파일 생성
- 디스크 공간 절약을 위한 압축

## ⚠️ 알림 시스템

### 시스템 알림
- **메모리 사용률**: 70% 주의, 85% 경고
- **CPU 사용률**: 80% 이상 경고
- **디스크 공간**: 90% 이상 경고
- **좀비 프로세스**: 발견 시 즉시 알림

### MCP 서버 알림
- **연결 실패**: 서버별 연결 상태 모니터링
- **응답 지연**: 100ms 주의, 200ms 경고
- **연속 실패**: 3회 이상 시 재시작 제안

## 🛠️ 문제 해결

### 일반적인 문제
```bash
# 1. 권한 문제
chmod +x scripts/wsl-monitor/wsl-monitor.sh

# 2. 모듈 로딩 실패
ls -la scripts/wsl-monitor/lib/

# 3. Claude 명령어 없음
which claude
```

### Serena MCP 문제 진단
```bash
# Serena 프로세스 확인
ps aux | grep serena-mcp-server

# Serena 메모리 사용량 확인
ps -p $(pgrep serena-mcp-server) -o pid,rss,command

# Claude MCP 연결 상태 확인
claude mcp list | grep serena
```

## 📚 개발자 참고

### 모듈 구조
- **system-metrics.sh**: `/proc` 파일시스템 기반 메트릭 수집
- **mcp-checker.sh**: Claude CLI 래핑 및 프로세스 모니터링
- **process-analyzer.sh**: `ps aux` 기반 프로세스 분석
- **terminal-ui.sh**: ncurses 없이 구현된 터미널 UI

### 확장 가능한 설계
- 새로운 메트릭 추가: `collect_*_info()` 함수 추가
- 새로운 알림: `print_alerts_section()` 수정
- 새로운 대시보드: `show_*_dashboard()` 함수 추가

---

💡 **팁**: 이 도구는 OpenManager VIBE 개발 환경에 특화되어 있습니다. WSL 환경에서 최적의 성능을 발휘하며, MCP 서버 문제 진단에 특히 유용합니다.