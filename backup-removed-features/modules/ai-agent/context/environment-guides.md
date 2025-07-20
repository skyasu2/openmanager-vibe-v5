# 🏗️ 환경별 세부 가이드

> **분류**: 추가 컨텍스트 (보조 자료)  
> **우선순위**: 기본 → 고급 → **환경별** (필요시 참조)  
> **역할**: 특수 환경에서의 세부 대응 가이드

## 🎯 가이드 목적

특정 환경이나 상황에서 **기본/고급 가이드로 해결되지 않는** 경우에만 참조하는 보조 자료입니다.

---

## 🖥️ 1. 운영 체제별 가이드

### **Windows Server 환경**

```yaml
모니터링 특이사항:
  - Performance Counter 기반 메트릭 수집
  - Windows Service 상태 확인 필수
  - Registry 설정 영향도 고려
  - Event Log 연동 모니터링

주요 명령어:
  - "wmic cpu get loadpercentage" (CPU 사용률)
  - "systeminfo | findstr Memory" (메모리 정보)
  - "perfmon" (성능 모니터 실행)

Windows 특화 이슈:
  - KB 업데이트 후 재부팅 필요성
  - .NET Framework 종속성 문제
  - IIS 프로세스 격리 모니터링
```

### **Linux 서버 환경**

```yaml
모니터링 특이사항:
  - systemd 서비스 상태 관리
  - cgroup 리소스 제한 확인
  - iptables/firewall 연결 상태
  - journalctl 로그 분석

주요 명령어:
  - "systemctl status [service]" (서비스 상태)
  - "htop" 또는 "top -H" (프로세스 모니터링)
  - "iostat -x 1" (디스크 I/O 모니터링)
  - "ss -tulpn" (네트워크 연결 상태)

Linux 특화 이슈:
  - Out of Memory Killer (OOM) 발생
  - inode 부족 문제
  - file descriptor 제한
  - swap 사용량 급증
```

---

## 🐳 2. 컨테이너 환경별 가이드

### **Docker 컨테이너**

```yaml
모니터링 특이사항:
  - 컨테이너별 리소스 격리 상태
  - Docker 호스트 vs 컨테이너 메트릭 구분
  - 볼륨 마운트 상태 확인
  - 네트워크 브리지 연결성

모니터링 명령어:
  - "docker stats [container]" (실시간 리소스)
  - "docker logs --tail 100 [container]" (로그 확인)
  - "docker inspect [container]" (상세 정보)

Docker 특화 이슈:
  - Container OOMKilled 상태
  - 이미지 크기로 인한 디스크 부족
  - 네트워크 모드 충돌
  - 볼륨 권한 문제
```

### **Kubernetes 환경**

```yaml
모니터링 특이사항:
  - Pod/Node 단위 리소스 관리
  - Service Discovery 상태
  - Ingress Controller 연결성
  - Cluster 전체 상태 확인

주요 명령어:
  - "kubectl top pods" (Pod 리소스)
  - "kubectl describe pod [name]" (Pod 상세)
  - "kubectl get events --sort-by='.lastTimestamp'" (최근 이벤트)

Kubernetes 특화 이슈:
  - Pod 재시작 루프 (CrashLoopBackOff)
  - Resource Quota 초과
  - PersistentVolume 바인딩 실패
  - DNS 해석 문제
```

---

## 🗄️ 3. 데이터베이스별 가이드

### **MySQL/MariaDB**

```yaml
모니터링 특이사항:
  - Connection Pool 상태
  - Slow Query 발생률
  - InnoDB Buffer Pool 효율성
  - Replication Lag (마스터-슬레이브)

주요 메트릭:
  - Threads_connected / max_connections
  - Slow_queries 증가율
  - Innodb_buffer_pool_hit_rate
  - Seconds_behind_master

MySQL 특화 이슈:
  - Table Lock 대기 시간 증가
  - Binary Log 디스크 공간 부족
  - Character Set 충돌
  - Query Cache 무효화 빈발
```

### **PostgreSQL**

```yaml
모니터링 특이사항:
  - Connection 풀 관리 (pgbouncer)
  - VACUUM/ANALYZE 실행 상태
  - WAL 로그 크기 증가
  - Lock 대기 상황

주요 메트릭:
  - pg_stat_activity (활성 쿼리)
  - pg_stat_bgwriter (백그라운드 작업)
  - pg_stat_database (DB별 통계)

PostgreSQL 특화 이슈:
  - VACUUM 작업 지연으로 인한 Bloat
  - Connection Limit 도달
  - WAL 파일 급증으로 디스크 부족
  - Autovacuum 설정 부적절
```

---

## ☁️ 4. 클라우드 환경별 가이드

### **AWS 환경**

```yaml
모니터링 특이사항:
  - CloudWatch 메트릭 연동
  - EC2 Instance Health Check
  - ELB Health Target 상태
  - RDS Connection Pool

AWS 특화 도구:
  - CloudWatch Alarms
  - Systems Manager (SSM)
  - X-Ray 트레이싱
  - VPC Flow Logs

AWS 특화 이슈:
  - Instance 타입별 네트워크 대역폭 제한
  - EBS 볼륨 IOPS 제한
  - Security Group 규칙 충돌
  - IAM 권한 부족
```

### **Azure 환경**

```yaml
모니터링 특이사항:
  - Azure Monitor 메트릭
  - Virtual Machine Scale Set 상태
  - Application Gateway Health
  - Azure SQL Database DTU

Azure 특화 도구:
  - Azure Monitor
  - Application Insights
  - Log Analytics
  - Network Watcher

Azure 특화 이슈:
  - VM 크기별 리소스 제한
  - Storage Account 처리량 제한
  - Network Security Group 충돌
  - Azure AD 인증 문제
```

---

## 🏢 5. 엔터프라이즈 환경별 가이드

### **온프레미스 데이터센터**

```yaml
물리적 인프라 고려사항:
  - 물리 서버 하드웨어 상태
  - 네트워크 스위치/라우터 상태
  - UPS 전원 공급 상태
  - 공조 시스템 온도 관리

모니터링 확장:
  - IPMI/BMC를 통한 하드웨어 모니터링
  - SNMP 기반 네트워크 장비 모니터링
  - 온도/습도 환경 센서 연동
  - 전력 사용량 모니터링

온프레미스 특화 이슈:
  - 하드웨어 장애 (디스크, 메모리, 전원)
  - 네트워크 스위치 포트 장애
  - 정전/전력 불안정
  - 냉각 시스템 문제
```

### **하이브리드 클라우드**

```yaml
복합 환경 관리:
  - 온프레미스 ↔ 클라우드 네트워크 연결성
  - 데이터 동기화 상태
  - 하이브리드 로드밸런싱
  - 비용 최적화 모니터링

모니터링 통합:
  - 멀티 클라우드 대시보드
  - 통합 로그 수집 (ELK, Splunk)
  - 크로스 플랫폼 알림 체계
  - 보안 정책 일관성

하이브리드 특화 이슈:
  - VPN/Direct Connect 연결 불안정
  - 데이터 전송 비용 급증
  - 보안 정책 불일치
  - 멀티 클라우드 관리 복잡성
```

---

## 📊 6. 워크로드별 가이드

### **고성능 컴퓨팅 (HPC)**

```yaml
특수 메트릭:
  - GPU 활용률 (nvidia-smi)
  - InfiniBand 네트워크 처리량
  - MPI 작업 분산 상태
  - CUDA 메모리 사용률

HPC 특화 모니터링:
  - Job Scheduler 대기열 상태
  - 노드간 통신 지연시간
  - 병렬 처리 효율성
  - 스토리지 I/O 병목

HPC 특화 이슈:
  - GPU 메모리 부족 (Out of Memory)
  - 노드간 통신 병목
  - Job 스케줄링 불균형
  - 고온으로 인한 성능 throttling
```

### **실시간 스트리밍**

```yaml
특수 메트릭:
  - 스트림 처리 지연시간 (Latency)
  - 메시지 큐 백로그 크기
  - 처리량 (Throughput) 변화
  - 데이터 유실률 (Loss Rate)

스트리밍 특화 모니터링:
  - Kafka Consumer Lag
  - Redis 큐 길이
  - WebSocket 연결 수
  - CDN 캐시 적중률

스트리밍 특화 이슈:
  - 메시지 큐 오버플로우
  - 네트워크 지터(Jitter) 증가
  - 백프레셔(Backpressure) 발생
  - 실시간 처리 지연 누적
```

---

## 🚨 7. 긴급 상황별 대응 가이드

### **대규모 트래픽 급증 (DDoS/Viral)**

```yaml
즉시 확인사항: 1. 트래픽 소스 분석 (정상 vs 비정상)
  2. CDN/Load Balancer 상태
  3. Auto Scaling 동작 여부
  4. Database Connection Pool 포화도

단계적 대응: 1. Rate Limiting 활성화
  2. 정적 콘텐츠 캐싱 강화
  3. 불필요한 기능 임시 비활성화
  4. 긴급 스케일 아웃

모니터링 우선순위:
  - 응답 시간 (Response Time)
  - 에러율 (Error Rate)
  - 큐 대기 시간
  - 인프라 리소스 사용률
```

### **데이터 센터 장애 (재해 복구)**

```yaml
즉시 확인사항: 1. Primary 데이터센터 연결성
  2. Backup 데이터센터 준비 상태
  3. 데이터 동기화 상태 (RPO/RTO)
  4. DNS Failover 설정

단계적 복구: 1. 트래픽 Failover 실행
  2. 데이터 정합성 확인
  3. 서비스별 우선순위 복구
  4. 모니터링 시스템 재구성

긴급 모니터링:
  - Cross-region 연결성
  - 데이터 복제 지연시간
  - 서비스 가용성 상태
  - 사용자 영향도 측정
```

---

## 🔧 8. 사용 가이드라인

### **이 가이드 활용 시점**

1. **기본 가이드**로 해결되지 않는 특수 상황
2. **고급 가이드**의 AI 분석이 불충분한 경우
3. 특정 환경/기술 스택에 특화된 문제
4. 긴급 상황에서 빠른 참조가 필요한 경우

### **참조 우선순위**

```
1차: 기본 지식 (system-knowledge.md) - 70-80%
2차: 고급 지식 (advanced-monitoring.md) - 15-25%
3차: 환경별 가이드 (environment-guides.md) - 5-15%
```

### **업데이트 주기**

- **분기별**: 새로운 환경/기술 추가
- **월별**: 특화 이슈 업데이트
- **주간**: 긴급 대응 사례 반영

---

**📍 위치**: `src/modules/ai-agent/context/environment-guides.md`  
**🎯 목적**: 특수 환경별 세부 대응 가이드 (보조 자료)  
**🔄 업데이트**: 환경별 이슈 발생 시 즉시 반영
