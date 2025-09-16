# WSL 설정 안전 가이드

## 📋 개요

WSL 설정 변경 시 MCP 서버 안정성을 보장하기 위한 안전 가이드입니다. 
잘못된 설정 변경으로 인한 MCP 서버 크래시 및 성능 저하를 방지합니다.

## ⚠️ 변경 금지 설정 (Critical)

### 🔒 절대 변경하지 말 것

```ini
# .wslconfig 필수 유지 설정
[wsl2]
dnsTunneling=true     # MCP DNS 해석 필수 - false 시 연결 실패
autoProxy=true        # MCP 프록시 연결 필수 - false 시 timeout
memory=16GB          # 최소 12GB 권장 - 8GB 이하 시 서버 크래시
```

### 🚨 위험 사유

| 설정 | 변경 시 위험 | 영향받는 MCP 서버 | 복구 시간 |
|------|-------------|------------------|-----------|
| `dnsTunneling=false` | DNS 해석 실패 | context7, vercel | 즉시 |
| `autoProxy=false` | 프록시 연결 실패 | 모든 외부 연결 서버 | 즉시 |
| `memory=8GB` | 메모리 부족 크래시 | serena, playwright | WSL 재시작 |

## ✅ 안전한 설정 변경

### 🎯 성능 최적화 가능 설정

```ini
# 안전하게 조정 가능한 설정들
[wsl2]
processors=6              # CPU 코어 수 (시스템 코어 수의 80% 권장)
swap=8GB                  # 스왑 메모리 (메모리의 50% 권장)
autoMemoryReclaim=gradual # 메모리 회수 방식 (dropcache 금지)
sparseVhd=true           # VHD 압축 (디스크 공간 절약)

[experimental]
hostAddressLoopback=true  # localhost 접근 개선
```

### 📊 권장 설정값

| 시스템 사양 | memory | processors | swap | 비고 |
|------------|---------|------------|------|------|
| 16GB RAM, 8 Core | 12GB | 6 | 6GB | 기본 권장 |
| 32GB RAM, 12 Core | 16GB | 8 | 8GB | 고성능 |
| 64GB RAM, 16 Core | 24GB | 12 | 12GB | 서버급 |

## ❌ 호환성 문제 설정

### 🚫 사용 불가 설정

```ini
# WSL 버전별 호환성 문제로 사용 금지
pageReporting=true       # 최신 WSL 빌드에서만 지원
useWindowsDriver=true    # 실험적 기능, 불안정
networkingMode=mirrored  # Windows 11 22H2+ 전용
```

## 🛠️ 설정 변경 절차

### 1단계: 백업 생성
```bash
# 현재 설정 백업
cp /mnt/c/Users/$(whoami)/.wslconfig /mnt/c/Users/$(whoami)/.wslconfig.backup
```

### 2단계: 변경 전 상태 확인
```bash
# MCP 서버 상태 확인
claude mcp status

# 메모리 사용량 확인
free -h

# WSL 버전 확인
wsl --version
```

### 3단계: 단계적 변경
```bash
# 한 번에 하나씩 설정 변경
# 변경 후 반드시 테스트
```

### 4단계: 변경 후 검증
```bash
# WSL 재시작
wsl --shutdown

# 2-3분 대기 후 WSL 재진입
wsl

# MCP 서버 상태 재확인
claude mcp status
```

## 🔧 트러블슈팅

### MCP 서버 연결 실패 시

```bash
# 1. WSL 네트워크 재설정
wsl --shutdown
# Windows에서 1분 대기
wsl

# 2. DNS 캐시 초기화
sudo systemctl restart systemd-resolved

# 3. MCP 서버 개별 재시작
claude mcp remove [server_name]
claude mcp add [server_name] [command]
```

### 메모리 부족 문제 시

```bash
# 1. 메모리 사용량 확인
free -h
ps aux --sort=-%mem | head -10

# 2. .wslconfig 메모리 증량
memory=20GB  # 16GB → 20GB로 증량

# 3. WSL 재시작 필수
wsl --shutdown
```

### 성능 저하 문제 시

```bash
# 1. autoMemoryReclaim 확인
grep autoMemoryReclaim /mnt/c/Users/$(whoami)/.wslconfig

# 2. dropcache로 설정된 경우 gradual로 변경
autoMemoryReclaim=gradual

# 3. sparseVhd 활성화
sparseVhd=true
```

## 📋 체크리스트

### 변경 전 체크리스트
- [ ] 현재 설정 백업 완료
- [ ] MCP 서버 상태 정상 확인
- [ ] 변경 계획 검토 (한 번에 하나씩)
- [ ] 롤백 계획 수립

### 변경 후 체크리스트
- [ ] WSL 재시작 완료
- [ ] MCP 서버 9개 모두 연결 확인
- [ ] 응답시간 50ms 이내 확인
- [ ] 메모리 사용량 정상 범위 확인
- [ ] 기능 테스트 완료

## 🚨 긴급 복구 절차

### MCP 서버 전체 실패 시

```bash
# 1. 즉시 백업 설정으로 복구
cp /mnt/c/Users/$(whoami)/.wslconfig.backup /mnt/c/Users/$(whoami)/.wslconfig

# 2. WSL 강제 재시작
wsl --shutdown
wsl

# 3. MCP 서버 상태 확인
claude mcp status

# 4. 여전히 실패 시 안전 설정 적용
```

### 안전 설정 (Failsafe Configuration)

```ini
# 최소 안전 설정 - 긴급 시 사용
[wsl2]
memory=16GB
processors=6
swap=8GB
dnsTunneling=true
autoProxy=true
firewall=true
debugConsole=false
autoMemoryReclaim=gradual

[experimental]
sparseVhd=true
hostAddressLoopback=true
```

## 📞 지원 및 문의

- **문서 위치**: `/docs/development/wsl-safety-guide.md`
- **설정 파일**: `/mnt/c/Users/[username]/.wslconfig`
- **백업 파일**: `/mnt/c/Users/[username]/.wslconfig.backup`
- **로그 확인**: `claude mcp status --verbose`

---

**⚠️ 중요**: WSL 설정 변경 시 항상 이 가이드를 참조하여 MCP 서버 안정성을 보장하세요.