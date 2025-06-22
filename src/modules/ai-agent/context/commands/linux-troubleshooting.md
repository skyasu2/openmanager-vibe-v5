# 🐧 리눅스 시스템 트러블슈팅 명령어 가이드

> **분류**: 핵심 컨텍스트 (실무 필수)  
> **우선순위**: 높음  
> **역할**: 리눅스 시스템 문제 진단 및 해결

## 🚨 CPU 사용률 높음 (90% 이상)

### 즉시 진단 명령어

```bash
# 실시간 프로세스 모니터링
top -o %CPU

# CPU 사용률 순 정렬
ps aux --sort=-%cpu | head -10

# 개선된 프로세스 뷰어 (설치 필요)
htop

# 특정 프로세스 상세 정보
ps -p [PID] -o pid,ppid,cmd,%cpu,%mem
```

### 해결 명령어

```bash
# 프로세스 정상 종료 (권장)
kill -15 [PID]

# 프로세스 강제 종료 (주의!)
kill -9 [PID]

# 서비스 재시작
systemctl restart [service_name]

# 서비스 상태 확인
systemctl status [service_name]
```

### ⚠️ 안전성 경고

- `kill -9` 사용 전 반드시 프로세스 확인
- 중요 시스템 프로세스 종료 금지
- 프로덕션 환경에서는 `kill -15` 우선 사용

---

## 💾 메모리 부족 문제

### 메모리 상태 확인

```bash
# 메모리 사용량 (사람이 읽기 쉬운 형태)
free -h

# 가상 메모리 통계
vmstat 1 5

# 메모리 사용 히스토리
sar -r 1 5

# 프로세스별 메모리 사용량
ps aux --sort=-%mem | head -10
```

### 메모리 최적화

```bash
# 스왑 사용량 확인
swapon --show

# 스왑 설정 조정
sysctl vm.swappiness=10

# 캐시 정리 (주의!)
sync && echo 3 > /proc/sys/vm/drop_caches

# 메모리 집약적 프로세스 재시작
systemctl restart [memory_intensive_service]
```

### ⚠️ 안전성 경고

- 캐시 정리는 성능에 일시적 영향
- 스왑 설정 변경 시 시스템 전체 성능 고려
- 메모리 정리 전 중요 프로세스 백업

---

## 💿 디스크 공간 부족

### 디스크 사용량 진단

```bash
# 파일시스템별 사용량
df -h

# 디렉토리별 용량 (최상위)
du -sh /*

# 대화형 디스크 분석기
ncdu /

# 큰 파일 찾기 (100MB 이상)
find / -type f -size +100M -exec ls -lh {} \;

# 오래된 로그 파일 찾기
find /var/log -name "*.log" -mtime +7
```

### 공간 정리

```bash
# 로그 파일 압축
gzip /var/log/*.log

# 오래된 파일 삭제 (주의!)
find /tmp -type f -mtime +7 -delete

# 패키지 캐시 정리
apt autoremove && apt autoclean  # Ubuntu/Debian
yum clean all                    # CentOS/RHEL

# 저널 로그 정리
journalctl --vacuum-time=7d
```

### ⚠️ 안전성 경고

- 파일 삭제 전 반드시 백업 확인
- `/var/log` 정리 시 로그 순환 설정 점검
- 시스템 파일 삭제 금지

---

## 🌐 네트워크 연결 문제

### 네트워크 진단

```bash
# 기본 연결 테스트
ping -c 4 8.8.8.8

# 포트 상태 확인
netstat -tuln

# 소켓 상태 (netstat 대체)
ss -tulpn

# 특정 포트 테스트
telnet [host] [port]
nc -zv [host] [port]
```

### 고급 네트워크 진단

```bash
# 방화벽 규칙 확인
iptables -L

# 네트워크 인터페이스 상태
ip addr show

# 라우팅 테이블
ip route show

# DNS 해석 테스트
nslookup [domain]
dig [domain]
```

### ⚠️ 안전성 경고

- `iptables` 규칙 변경 시 SSH 연결 끊어질 수 있음
- 방화벽 변경 전 콘솔 접근 확보
- 네트워크 설정 변경 시 원격 접근 고려

---

## 📊 성능 모니터링

### 실시간 모니터링

```bash
# I/O 통계
iostat -x 1

# 시스템 활동 보고서
sar -u 1 5

# 가상 메모리 통계
vmstat 1 5

# CPU 정보
lscpu

# 블록 디바이스 정보
lsblk
```

### 로그 분석

```bash
# 실시간 로그 확인
tail -f /var/log/syslog

# 에러 로그 검색
grep -i error /var/log/syslog

# systemd 서비스 로그
journalctl -u [service] -f

# 최근 시스템 이벤트
journalctl -xe
```

---

## 🔧 서비스 관리

### 서비스 상태 관리

```bash
# 서비스 상태 확인
systemctl status [service]

# 서비스 시작/중지/재시작
systemctl start [service]
systemctl stop [service]
systemctl restart [service]

# 부팅 시 자동 시작 설정
systemctl enable [service]
systemctl disable [service]

# 모든 서비스 목록
systemctl list-units --type=service
```

### ⚠️ 안전성 경고

- 중요 서비스 재시작 시 서비스 중단 발생
- `enable/disable` 설정 변경 시 부팅 동작 영향
- 의존성 있는 서비스 순서 고려

---

## 🚀 응급 상황 대응

### 시스템 부하 급증 시

1. `top` 또는 `htop`로 원인 프로세스 식별
2. `kill -15 [PID]`로 정상 종료 시도
3. 필요시 `kill -9 [PID]`로 강제 종료
4. `systemctl restart [service]`로 서비스 재시작
5. 로그 확인: `journalctl -xe`

### 디스크 100% 사용 시

1. `df -h`로 가득 찬 파티션 확인
2. `du -sh /*`로 용량 큰 디렉토리 식별
3. 로그 파일 정리: `find /var/log -name "*.log" -mtime +7`
4. 임시 파일 정리: `rm -rf /tmp/*` (주의!)
5. 서비스 재시작으로 로그 순환 확인

### 네트워크 불통 시

1. `ping 8.8.8.8`로 외부 연결 확인
2. `ss -tulpn`으로 포트 상태 확인
3. `systemctl status [network_service]`로 서비스 상태 확인
4. `iptables -L`로 방화벽 규칙 확인
5. 필요시 네트워크 서비스 재시작

---

**💡 핵심 원칙**

- 항상 안전한 명령어부터 시도
- 변경 전 현재 상태 백업
- 프로덕션 환경에서는 더욱 신중하게
- 로그를 통한 원인 분석 우선
