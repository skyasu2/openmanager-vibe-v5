# MCP 서버 모니터링 가이드

**WSL 환경에서 11개 MCP 서버의 상태 모니터링 및 문제 해결**

## 📊 모니터링 도구

### 1. 실시간 상태 확인
```bash
# 전체 서버 상태 확인
claude mcp list

# 빠른 기능 테스트
./scripts/mcp-quick-test.sh

# 상세 헬스 체크
./scripts/mcp-health-check.sh

# 자동 복구 실행
./scripts/mcp-auto-recovery.sh
```

### 2. 프로세스 모니터링
```bash
# MCP 관련 프로세스 확인
ps aux | grep -E "(mcp|npx|uvx)" | grep -v grep

# 메모리 사용량 확인
ps aux | grep -E "(mcp|npx)" | awk '{print $4, $11}' | sort -nr

# 프로세스 개수 확인
ps aux | grep -E "(mcp|npx|uvx)" | grep -v grep | wc -l
```

### 3. 로그 모니터링
```bash
# 시스템 로그에서 MCP 관련 오류 확인
journalctl -f | grep -i mcp

# npm 로그 확인
ls ~/.npm/_logs/
```

## 🚨 주요 문제 유형 및 해결책

### 1. 환경변수 인식 문제
**증상**: `mcp__supabase__*` 관련 에러
**원인**: Windows CRLF 라인 엔딩으로 인한 파싱 오류
**해결책**:
```bash
dos2unix /mnt/d/cursor/openmanager-vibe-v5/.env.local
source /mnt/d/cursor/openmanager-vibe-v5/.env.local
```

### 2. Playwright 응답 지연 (5초 이상)
**증상**: 브라우저 자동화 요청 시 타임아웃
**원인**: Chromium 브라우저 미설치 또는 캐시 문제
**해결책**:
```bash
npx -y playwright install chromium
npm cache clean --force
```

### 3. Memory 서버 간헐적 연결 실패
**증상**: 메모리 그래프 기능 불안정
**원인**: 프로세스 좀비화 또는 메모리 부족
**해결책**:
```bash
# 좀비 프로세스 정리
pkill -f "mcp-server-memory"
# Claude Code에서 자동 재시작됨

# 메모리 정리
echo 1 | sudo tee /proc/sys/vm/drop_caches
```

### 4. UV 기반 서버 문제 (time, serena)
**증상**: Python 기반 MCP 서버 시작 실패
**원인**: UV 캐시 손상 또는 버전 불일치
**해결책**:
```bash
/home/skyasu/.local/bin/uv cache clean
/home/skyasu/.local/bin/uv self update
```

## 🔧 자동화 설정

### 1. Cron을 통한 주기적 모니터링
```bash
# crontab 편집
crontab -e

# 1시간마다 헬스체크 (로그 저장)
0 * * * * /mnt/d/cursor/openmanager-vibe-v5/scripts/mcp-health-check.sh >> /tmp/mcp-monitor.log 2>&1

# 4시간마다 자동 복구
0 */4 * * * /mnt/d/cursor/openmanager-vibe-v5/scripts/mcp-auto-recovery.sh
```

### 2. 시스템 서비스 등록 (선택사항)
```bash
# systemd 서비스 파일 생성
sudo tee /etc/systemd/system/mcp-monitor.service <<EOF
[Unit]
Description=MCP Server Monitor
After=network.target

[Service]
Type=oneshot
ExecStart=/mnt/d/cursor/openmanager-vibe-v5/scripts/mcp-quick-test.sh
User=skyasu
WorkingDirectory=/mnt/d/cursor/openmanager-vibe-v5

[Install]
WantedBy=multi-user.target
EOF

# 타이머 설정 (10분마다)
sudo tee /etc/systemd/system/mcp-monitor.timer <<EOF
[Unit]
Description=Run MCP Monitor every 10 minutes
Requires=mcp-monitor.service

[Timer]
OnCalendar=*:0/10
Persistent=true

[Install]
WantedBy=timers.target
EOF

# 서비스 활성화
sudo systemctl enable mcp-monitor.timer
sudo systemctl start mcp-monitor.timer
```

## 📈 성능 최적화

### 1. 메모리 사용량 최적화
```bash
# 현재 메모리 사용률 확인
free -h

# MCP 프로세스 메모리 사용량 Top 5
ps aux | grep -E "(mcp|npx)" | sort -k4 -nr | head -5

# 메모리 사용량이 높은 경우 (>80%)
echo 1 | sudo tee /proc/sys/vm/drop_caches
```

### 2. 캐시 관리 전략
```bash
# 주간 캐시 정리 (추천)
npm cache clean --force
/home/skyasu/.local/bin/uv cache clean

# 캐시 크기 확인
du -sh ~/.npm/_cacache ~/.cache/uv
```

### 3. 프로세스 수 관리
- **정상 범위**: 25-35개 프로세스
- **주의 범위**: 15-24개 프로세스
- **문제 범위**: 15개 미만

## 🚀 예방 조치

### 1. 환경 설정 베스트 프랙티스
- `.env.local` 파일은 항상 Unix 라인 엔딩(LF) 사용
- 환경변수는 `.mcp.json`에서 `${변수명}` 형태로 참조
- 하드코딩된 토큰/키 사용 금지

### 2. 정기 유지보수 일정
- **일일**: 빠른 상태 체크
- **주간**: 캐시 정리, 프로세스 최적화
- **월간**: 패키지 업데이트, 보안 검토

### 3. 모니터링 알림 설정
```bash
# 서버 실패 시 알림 스크립트
#!/bin/bash
failed_count=$(claude mcp list | grep -c "Failed" || echo 0)
if [ $failed_count -gt 0 ]; then
    echo "MCP Server Alert: $failed_count server(s) failed" | wall
fi
```

## 🔍 트러블슈팅 체크리스트

### 문제 발생 시 순서대로 확인:

1. **[ ]** 환경변수 로드 확인 (`source .env.local`)
2. **[ ]** `.env.local` 파일 라인 엔딩 확인 (`file .env.local`)
3. **[ ]** MCP 서버 상태 확인 (`claude mcp list`)
4. **[ ]** 프로세스 상태 확인 (`ps aux | grep mcp`)
5. **[ ]** 메모리 사용량 확인 (`free -h`)
6. **[ ]** 캐시 정리 (`npm cache clean --force`)
7. **[ ]** 자동 복구 실행 (`./scripts/mcp-auto-recovery.sh`)
8. **[ ]** Claude Code 재시작

## 📞 지원 연락처

문제가 지속되는 경우:
- **GitHub Issues**: 프로젝트 저장소에 이슈 등록
- **로그 파일**: `/tmp/mcp-*.log` 파일 첨부
- **시스템 정보**: WSL 버전, Node.js 버전, UV 버전 포함