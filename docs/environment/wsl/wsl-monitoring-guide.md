# 🛠️ WSL 문제 해결 가이드 - 모니터링 도구 활용

OpenManager VIBE 개발 환경에서 발생하는 WSL 관련 문제들을 체계적으로 분석하고 해결하기 위한 가이드입니다.

## 🎯 개요

WSL 환경에서 자주 발생하는 문제들:

- **WSL 멈춤/응답 없음**
- **터미널 갑작스러운 종료**
- **MCP 서버 연결 실패**
- **메모리 부족 현상**
- **Claude Code 성능 저하**

이 모든 문제들을 **WSL 통합 모니터링 도구**를 활용하여 사전 감지하고 해결할 수 있습니다.

## 🔍 모니터링 도구 소개

### 📊 핵심 기능

- **실시간 시스템 리소스 모니터링** (메모리, CPU, 디스크)
- **MCP 서버 9개 상태 추적** (연결, 응답시간, 실패 패턴)
- **프로세스별 리소스 점유율 분석**
- **Serena MCP 특별 디버깅**
- **구조화된 JSON 로그 시스템**

### 🚀 도구 위치

```
./scripts/wsl-monitor/wsl-monitor.sh
```

## 🚨 문제별 진단 및 해결 방법

### 1. 🧊 WSL 멈춤/응답 없음 문제

#### 🔍 진단 방법

```bash
# 즉시 시스템 상태 체크
./scripts/wsl-monitor/wsl-monitor.sh --once

# 실시간 모니터링으로 패턴 관찰
./scripts/wsl-monitor/wsl-monitor.sh --interval 3
```

#### 📊 확인 지표

- **메모리 사용률**: 85% 이상 시 위험
- **스왑 메모리**: 지속적 사용 시 성능 저하
- **로드 평균**: CPU 코어 수의 2배 초과 시 과부하
- **좀비 프로세스**: 시스템 리소스 누수

#### 🛠️ 해결 방법

```bash
# 1. 메모리 집약적 프로세스 확인
./scripts/wsl-monitor/wsl-monitor.sh --once | grep "상위 프로세스"

# 2. 메모리 85% 이상 시 - 큰 프로세스 종료
kill -9 $(ps aux --sort=-%mem | head -n 2 | tail -n 1 | awk '{print $2}')

# 3. 좀비 프로세스 정리
ps aux | awk '$8 ~ /^Z/ {print $2}' | xargs -r kill -9

# 4. WSL 재시작 (최후 수단)
wsl --shutdown && wsl
```

### 2. 💥 터미널 갑작스러운 종료

#### 🔍 진단 방법

```bash
# 백그라운드 모니터링으로 종료 전 상황 기록
./scripts/wsl-monitor/wsl-monitor.sh --daemon

# 로그 분석 (종료 후)
tail -f scripts/wsl-monitor/logs/system/metrics-$(date +%Y%m%d).log
tail -f scripts/wsl-monitor/logs/process/analysis-$(date +%Y%m%d).log
```

#### 📊 위험 신호

- **Claude 프로세스**: 1GB 이상 메모리 사용
- **Node.js 프로세스**: 500MB 이상 집단 사용
- **MCP 서버**: 연속 실패 3회 이상
- **시스템**: 메모리 90% 이상 지속

#### 🛠️ 예방 및 해결

```bash
# 1. 사전 경고 설정 (75% 메모리 시 알림)
./scripts/wsl-monitor/wsl-monitor.sh --daemon

# 2. Claude 메모리 제한 설정
export NODE_OPTIONS="--max-old-space-size=6144"

# 3. 정기적 시스템 체크 (5분마다)
watch -n 300 './scripts/wsl-monitor/wsl-monitor.sh --once'

# 4. 터미널 안전 종료 전 체크
./scripts/wsl-monitor/wsl-monitor.sh --check-mcp
```

### 3. 🌐 MCP 서버 연결 실패

#### 🔍 진단 방법

```bash
# MCP 서버 전용 진단
./scripts/wsl-monitor/wsl-monitor.sh --check-mcp

# 지속적 MCP 상태 모니터링
./scripts/wsl-monitor/wsl-monitor.sh --interval 10 | grep MCP
```

#### 📊 MCP 서버별 정상 기준

| 서버명     | 정상 응답시간 | 메모리 사용량 | 상태             |
| ---------- | ------------- | ------------- | ---------------- |
| memory     | < 50ms        | < 20MB        | ✅               |
| time       | < 30ms        | < 15MB        | ✅               |
| context7   | < 100ms       | < 50MB        | ✅               |
| **serena** | **< 100ms**   | **< 200MB**   | ⚠️ **특별 관리** |
| supabase   | < 80ms        | < 30MB        | ✅               |
| vercel     | < 150ms       | HTTP 연결     | ✅               |
| playwright | < 50ms        | < 25MB        | ✅               |
| shadcn-ui  | < 60ms        | < 20MB        | ✅               |
| sequential | < 40ms        | < 15MB        | ✅               |

#### 🛠️ MCP 서버별 해결 방법

**Serena MCP 문제 (특별 관리)**

```bash
# 1. 상세 진단
./scripts/wsl-monitor/wsl-monitor.sh --check-mcp
ps aux | grep serena-mcp-server  # 메모리 사용량 확인

# 2. 응답시간 200ms 이상 시
claude mcp remove serena
claude mcp add serena $HOME/.local/bin/serena-mcp-server \
  --project /mnt/d/cursor/openmanager-vibe-v5 \
  --log-level INFO \
  --tool-timeout 300

# 3. 메모리 500MB 이상 시 재시작 권장
```

**일반 MCP 서버 문제**

```bash
# 1. 연결 실패 서버 재연결
claude mcp remove [SERVER_NAME]
claude mcp add [SERVER_NAME] [COMMAND]

# 2. 환경변수 문제 시
source ./scripts/setup-mcp-env.sh
claude mcp list

# 3. 전체 MCP 재초기화
./scripts/monitoring/mcp-health-check.sh
```

### 4. 💾 메모리 부족 현상

#### 🔍 진단 방법

```bash
# 메모리 집약적 분석
./scripts/wsl-monitor/wsl-monitor.sh --once | grep -A 10 "시스템 리소스"

# 프로세스별 메모리 분석
./scripts/wsl-monitor/wsl-monitor.sh --once | grep -A 15 "프로세스 현황"
```

#### 📊 메모리 사용량 기준

- **정상**: 60% 이하
- **주의**: 60-75%
- **경고**: 75-85%
- **위험**: 85% 이상

#### 🛠️ 메모리 최적화 방법

```bash
# 1. 즉시 메모리 확보
echo 1 | sudo tee /proc/sys/vm/drop_caches  # 캐시 정리
echo 2 | sudo tee /proc/sys/vm/drop_caches  # 덴트리/아이노드 정리

# 2. Claude 메모리 제한
export NODE_OPTIONS="--max-old-space-size=4096"

# 3. 대용량 프로세스 식별 및 종료
ps aux --sort=-%mem | head -n 10

# 4. WSL 메모리 설정 최적화 (.wslconfig)
[wsl2]
memory=16GB
swap=8GB
autoMemoryReclaim=gradual
```

### 5. 🐌 Claude Code 성능 저하

#### 🔍 진단 방법

```bash
# Claude 프로세스 상세 분석
./scripts/wsl-monitor/wsl-monitor.sh --once | grep "Claude:"

# Node.js 프로세스 전체 분석
./scripts/wsl-monitor/wsl-monitor.sh --once | grep -A 5 "Node.js:"
```

#### 📊 Claude 성능 기준

- **메모리**: 500MB 이하 정상, 1GB 이상 시 주의
- **CPU**: 10% 이하 정상, 20% 이상 지속 시 문제
- **MCP 응답**: 전체 서버 평균 100ms 이하

#### 🛠️ 성능 최적화

```bash
# 1. Claude 재시작
pkill claude && sleep 3 && claude

# 2. MCP 서버 최적화
./scripts/monitoring/optimize-mcp-config.sh

# 3. Node.js 힙 메모리 최적화
export NODE_OPTIONS="--max-old-space-size=6144 --gc-interval=100"

# 4. WSL I/O 성능 향상
echo 'none /tmp tmpfs defaults 0 0' | sudo tee -a /etc/fstab
```

## 📊 로그 분석 가이드

### 🗂️ 로그 파일 위치

```
scripts/wsl-monitor/logs/
├── system/metrics-YYYYMMDD.log      # 시스템 메트릭
├── process/analysis-YYYYMMDD.log    # 프로세스 분석
├── mcp/status-YYYYMMDD.log          # MCP 서버 상태
└── mcp/serena-debug-YYYYMMDD.log    # Serena 특별 로그
```

### 🔍 로그 분석 명령어

```bash
# 오늘 시스템 메트릭 요약
cat scripts/wsl-monitor/logs/system/metrics-$(date +%Y%m%d).log | \
  jq '.memory.usage_percent' | \
  awk '{sum+=$1; count++} END {print "평균 메모리 사용률:", sum/count "%"}'

# MCP 서버 응답 시간 분석
cat scripts/wsl-monitor/logs/mcp/status-$(date +%Y%m%d).log | \
  jq '.servers.serena.response_time_ms' | \
  sort -n | tail -10

# 메모리 사용량 추이 분석
cat scripts/wsl-monitor/logs/system/metrics-$(date +%Y%m%d).log | \
  jq -r '"\(.timestamp) \(.memory.usage_percent)%"' | tail -20

# 문제 발생 시점 특정
grep -A 5 -B 5 "경고\|위험\|실패" scripts/wsl-monitor/logs/**/*.log
```

## ⏰ 예방적 모니터링 설정

### 🔄 자동 모니터링 스케줄

```bash
# 1. 지속적 백그라운드 모니터링
./scripts/wsl-monitor/wsl-monitor.sh --daemon

# 2. 정기 체크 (매 30분)
echo "*/30 * * * * /mnt/d/cursor/openmanager-vibe-v5/scripts/wsl-monitor/wsl-monitor.sh --once" | crontab -

# 3. 시스템 시작 시 자동 실행 (.bashrc 추가)
echo './scripts/wsl-monitor/wsl-monitor.sh --daemon' >> ~/.bashrc
```

### 🚨 알림 설정

```bash
# 메모리 85% 이상 시 알림 파일 생성
./scripts/wsl-monitor/wsl-monitor.sh --daemon | \
  grep "높은 메모리" >> /tmp/wsl-alerts.log

# Serena MCP 200ms 이상 시 알림
./scripts/wsl-monitor/wsl-monitor.sh --check-mcp | \
  grep "Serena.*200" && echo "Serena MCP 성능 저하!" >> /tmp/mcp-alerts.log
```

## 📋 문제 해결 체크리스트

### ✅ WSL 멈춤 시 체크리스트

- [ ] `./scripts/wsl-monitor/wsl-monitor.sh --once` 실행
- [ ] 메모리 사용률 85% 이상인가?
- [ ] 스왑 메모리 지속 사용 중인가?
- [ ] 좀비 프로세스 존재하는가?
- [ ] Claude 프로세스 1GB 이상 사용 중인가?
- [ ] 로드 평균이 CPU 코어 수의 2배 이상인가?

### ✅ MCP 문제 시 체크리스트

- [ ] `./scripts/wsl-monitor/wsl-monitor.sh --check-mcp` 실행
- [ ] 9개 서버 중 몇 개가 연결되어 있는가?
- [ ] Serena MCP 응답 시간이 200ms 이상인가?
- [ ] Serena MCP 메모리가 500MB 이상인가?
- [ ] 연속 실패가 3회 이상인 서버가 있는가?

### ✅ 성능 저하 시 체크리스트

- [ ] 전체 시스템 리소스 현황 확인
- [ ] 상위 메모리 사용 프로세스 5개 확인
- [ ] MCP 서버 평균 응답 시간 확인
- [ ] 디스크 사용률 90% 이상인가?
- [ ] 네트워크 I/O 병목 현상이 있는가?

## 🔧 고급 문제 해결

### 🏥 응급 복구 스크립트

```bash
#!/bin/bash
# emergency-recovery.sh
echo "🚨 WSL 응급 복구 시작..."

# 1. 시스템 상태 확인
./scripts/wsl-monitor/wsl-monitor.sh --once > /tmp/emergency-status.log

# 2. 메모리 85% 이상 시 캐시 정리
MEMORY_USAGE=$(free | awk '/^Mem:/{printf "%.0f", $3/$2 * 100}')
if [ "$MEMORY_USAGE" -gt 85 ]; then
    echo "메모리 정리 중..."
    sync && echo 1 | sudo tee /proc/sys/vm/drop_caches
fi

# 3. 좀비 프로세스 정리
ZOMBIES=$(ps aux | awk '$8 ~ /^Z/ {count++} END {print count+0}')
if [ "$ZOMBIES" -gt 0 ]; then
    echo "좀비 프로세스 $ZOMBIES 개 정리 중..."
    ps aux | awk '$8 ~ /^Z/ {print $2}' | xargs -r kill -9
fi

# 4. MCP 서버 재연결
echo "MCP 서버 상태 복구 중..."
./scripts/wsl-monitor/wsl-monitor.sh --check-mcp

echo "✅ 응급 복구 완료"
```

### 📈 성능 벤치마크

```bash
# WSL 성능 기준선 측정
./scripts/wsl-monitor/wsl-monitor.sh --daemon &
sleep 300  # 5분간 데이터 수집
./scripts/wsl-monitor/wsl-monitor.sh --stop

# 평균 성능 지표 계산
cat scripts/wsl-monitor/logs/system/metrics-$(date +%Y%m%d).log | \
  jq '{memory: .memory.usage_percent, cpu: .cpu.usage_percent}' | \
  jq -s 'map({memory, cpu}) | {avg_memory: (map(.memory) | add / length), avg_cpu: (map(.cpu) | add / length)}'
```

## 📞 문제 해결 플로우차트

```
WSL 문제 발생
    ↓
1. 모니터링 도구 실행
   ./scripts/wsl-monitor/wsl-monitor.sh --once
    ↓
2. 메모리 사용률 체크
   85% 이상? → 메모리 정리 → 재체크
   85% 미만? → 다음 단계
    ↓
3. MCP 서버 상태 체크
   ./scripts/wsl-monitor/wsl-monitor.sh --check-mcp
   연결 실패? → MCP 재시작 → 재체크
   정상? → 다음 단계
    ↓
4. 프로세스 분석
   대용량 프로세스? → 프로세스 최적화
   좀비 프로세스? → 정리
   정상? → 로그 분석
    ↓
5. 로그 분석 및 패턴 파악
   → 근본 원인 해결
```

---

💡 **핵심 원칙**:

- **사전 예방이 최고**: 백그라운드 모니터링으로 문제 조기 발견
- **데이터 기반 진단**: 추측 대신 모니터링 도구로 정확한 상황 파악
- **단계적 해결**: 간단한 해결책부터 시도, 복잡한 방법은 최후 수단
- **지속적 관찰**: 해결 후에도 모니터링으로 재발 방지

이 가이드를 통해 WSL 환경의 모든 문제를 체계적이고 효율적으로 해결할 수 있습니다.
