# 🎨 커스텀 서버 환경 특화 시나리오

> **레벨**: 커스텀 (Custom)
> **대상**: 특정 서버 구성 및 환경별 맞춤 모니터링
> **특징**: 서버 구성에 따른 특화된 메트릭 및 대응 방식

## 🏗️ 서버 아키텍처별 특화 시나리오

### **단일 서버 환경 (Single Server)**
```yaml
구성: 모든 서비스가 하나의 서버에서 동작
특징: 리소스 공유, 상호 의존성 높음
모니터링 포인트:
  - 프로세스간 리소스 경합
  - 서비스별 포트 충돌 감지
  - 단일 장애점(SPOF) 모니터링
  - 백업 및 복구 계획

자동 대응:
  - 리소스 사용량 높은 프로세스 우선순위 조정
  - 서비스별 자동 재시작
  - 디스크 공간 자동 정리
  - 메모리 누수 프로세스 감지 및 재시작

임계값 설정:
  - CPU: 80% (다른 서비스 영향 고려)
  - Memory: 85% (스왑 사용 방지)
  - Disk: 90% (로그 정리 및 백업 공간 확보)
```

### **마스터-슬레이브 구성 (Master-Slave)**
```yaml
구성: 활성(Master) + 대기(Slave) 서버
특징: 고가용성, 자동 페일오버
모니터링 포인트:
  - 마스터-슬레이브 동기화 상태
  - 하트비트 신호 모니터링
  - 페일오버 테스트 자동화
  - 데이터 일관성 검증

페일오버 시나리오:
  - 마스터 서버 다운 감지 (30초 이내)
  - 슬레이브 서버 활성화 (60초 이내)
  - DNS/로드밸런서 재설정
  - 클라이언트 연결 재설정 가이드

모니터링 메트릭:
  - 동기화 지연 시간: <5초
  - 하트비트 간격: 10초
  - 데이터 불일치 검사: 매 5분
  - 페일오버 시간: <2분
```

### **로드밸런서 + 멀티 백엔드**
```yaml
구성: 로드밸런서 + 여러 백엔드 서버
특징: 수평 확장, 트래픽 분산
모니터링 포인트:
  - 로드밸런서 상태 및 성능
  - 백엔드 서버별 트래픽 분산
  - 헬스체크 통과율
  - 세션 스티키니스 문제

트래픽 분산 모니터링:
  - 서버별 요청 수 균형 (편차 <20%)
  - 응답 시간 편차 모니터링
  - 실패 서버 자동 제외
  - 복구 서버 자동 복귀

자동 스케일링:
  - CPU 사용률 80% 초과 시 스케일아웃
  - 새 인스턴스 부팅 시간: 3분
  - 헬스체크 통과 후 트래픽 분산
  - 비용 최적화를 위한 스케일인
```

## 🗄️ 데이터베이스 환경별 특화

### **단일 DB 서버**
```yaml
모니터링 포인트:
  - 동시 연결 수 (최대 100개)
  - 쿼리 실행 시간 분석
  - 인덱스 사용률 모니터링
  - 백업 완료 상태 확인

성능 최적화:
  - 슬로우 쿼리 자동 감지 (>1초)
  - 인덱스 최적화 제안
  - 테이블 파편화 정리 스케줄링
  - 연결 풀 크기 동적 조정

백업 전략:
  - 매일 자정 풀 백업
  - 매시간 증분 백업
  - 백업 파일 무결성 검증
  - 원격 저장소 동기화
```

### **마스터-리플리카 DB**
```yaml
구성: 쓰기용 마스터 + 읽기용 리플리카
모니터링 포인트:
  - 복제 지연 시간 (<1초)
  - 마스터-리플리카 데이터 일치성
  - 읽기/쓰기 트래픽 분산
  - 복제 에러 발생 감지

복제 관리:
  - 복제 지연 임계값: 5초
  - 데이터 불일치 감지 시 알림
  - 복제 중단 시 자동 재시작
  - 바이너리 로그 공간 관리

읽기 분산:
  - 읽기 쿼리 리플리카 라우팅 (80%)
  - 쓰기 쿼리 마스터 전용
  - 리플리카 장애 시 마스터로 폴백
  - 리플리카 복구 시 자동 분산 재개
```

### **샤딩 DB 환경**
```yaml
구성: 데이터를 여러 샤드로 분산
모니터링 포인트:
  - 샤드별 데이터 분포 균형
  - 크로스 샤드 쿼리 성능
  - 샤드 키 분포 분석
  - 리샤딩 필요성 감지

샤드 밸런싱:
  - 샤드별 크기 편차 <30%
  - 핫 샤드 자동 감지
  - 리샤딩 권장 시점 예측
  - 샤드 추가/제거 자동화

성능 모니터링:
  - 샤드별 쿼리 응답시간
  - 분산 트랜잭션 추적
  - 데이터 일관성 검증
  - 네트워크 지연 시간 분석
```

## 🌐 네트워크 토폴로지별 특화

### **DMZ 구성 환경**
```yaml
구성: DMZ + 내부 네트워크 분리
보안 모니터링:
  - 방화벽 로그 실시간 분석
  - 침입 탐지 시스템(IDS) 연동
  - 네트워크 트래픽 패턴 분석
  - SSL/TLS 인증서 만료 감시

접근 제어:
  - DMZ 서버 접근 로그 추적
  - 내부 네트워크 접근 시도 감지
  - VPN 연결 상태 모니터링
  - 권한 상승 시도 감지

성능 모니터링:
  - 네트워크 지연 시간 측정
  - 대역폭 사용률 분석
  - 방화벽 처리 성능
  - 로드밸런서 성능 지표
```

### **멀티 클라우드 환경**
```yaml
구성: AWS + Azure + GCP 혼합 운영
모니터링 포인트:
  - 클라우드별 리소스 사용률
  - 크로스 클라우드 네트워크 지연
  - 클라우드별 비용 효율성
  - 데이터 전송 비용 분석

고가용성:
  - 클라우드 장애 시 자동 페일오버
  - 트래픽 지역별 라우팅 최적화
  - 데이터 백업 다중화 전략
  - 재해 복구 계획 자동화

비용 최적화:
  - 클라우드별 인스턴스 최적화
  - 예약 인스턴스 vs 온디맨드 분석
  - 스팟 인스턴스 활용 전략
  - 자동 스케일링 정책 조정
```

### **하이브리드 클라우드 (온프레미스 + 클라우드)**
```yaml
구성: 온프레미스 + 퍼블릭 클라우드
연결 모니터링:
  - VPN/전용선 연결 상태
  - 네트워크 지연 시간 측정
  - 데이터 동기화 상태
  - 보안 터널 상태 확인

워크로드 분산:
  - 온프레미스 vs 클라우드 성능 비교
  - 비용 기반 워크로드 배치
  - 컴플라이언스 요구사항 준수
  - 데이터 위치 규제 관리

데이터 관리:
  - 온프레미스-클라우드 데이터 동기화
  - 백업 및 아카이브 정책
  - 데이터 거버넌스 준수
  - 개인정보 보호 규정 준수
```

## ⚙️ 특수 워크로드 환경

### **GPU 컴퓨팅 환경**
```yaml
하드웨어 모니터링:
  - GPU 사용률 및 메모리 사용량
  - GPU 온도 및 전력 소비
  - CUDA 커널 실행 상태
  - 멀티 GPU 작업 분산

성능 최적화:
  - GPU 메모리 할당 최적화
  - 배치 크기 동적 조정
  - GPU-CPU 데이터 전송 최적화
  - 병렬 처리 효율성 분석

작업 스케줄링:
  - GPU 작업 큐 관리
  - 우선순위 기반 스케줄링
  - 장시간 실행 작업 모니터링
  - 자동 체크포인트 및 복구
```

### **고성능 스토리지 환경**
```yaml
스토리지 유형별 모니터링:
  - NVMe SSD: IOPS, 지연시간
  - SAN: 파이버 채널 성능
  - NAS: 네트워크 파일시스템 성능
  - 분산 스토리지: 노드별 성능

성능 메트릭:
  - 읽기/쓰기 처리량 (MB/s)
  - IOPS (초당 입출력 작업 수)
  - 평균 지연 시간 (ms)
  - 큐 깊이 및 대기 시간

용량 관리:
  - 스토리지 풀 사용률
  - 자동 계층화 상태
  - 중복 제거 효율성
  - 압축률 및 공간 절약
```

### **컨테이너 오케스트레이션 환경**
```yaml
Kubernetes 클러스터:
  - 노드별 리소스 사용률
  - 파드 생명주기 관리
  - 서비스 디스커버리 상태
  - 인그레스 트래픽 분석

Docker 스웜:
  - 서비스 복제본 상태
  - 오버레이 네트워크 성능
  - 시크릿 및 설정 관리
  - 로드밸런싱 효율성

컨테이너 성능:
  - 컨테이너별 리소스 제한
  - 이미지 풀 시간 최적화
  - 레지스트리 캐시 효율성
  - 컨테이너 시작 시간 분석
```

## 🔧 서버 데이터 생성기 연동

### **환경별 데이터 패턴**
```typescript
// 커스텀 환경 설정
interface CustomEnvironmentConfig {
  serverArchitecture: 'single' | 'master-slave' | 'load-balanced' | 'microservices';
  databaseType: 'single' | 'replica' | 'sharded' | 'distributed';
  networkTopology: 'simple' | 'dmz' | 'multi-cloud' | 'hybrid';
  specialWorkload: 'standard' | 'gpu' | 'storage' | 'container';
}

// 환경에 따른 메트릭 생성 조정
function generateCustomMetrics(config: CustomEnvironmentConfig) {
  // 서버 아키텍처에 따른 메트릭 조정
  // 데이터베이스 유형에 따른 특화 메트릭 추가
  // 네트워크 토폴로지에 따른 네트워크 메트릭 강화
  // 특수 워크로드에 따른 전용 메트릭 생성
}
```

### **실시간 시나리오 시뮬레이션**
```yaml
시나리오 자동 실행:
  - 정상 운영: 기본 메트릭 패턴
  - 부하 테스트: CPU/Memory 임계값 근접
  - 장애 시뮬레이션: 특정 서버 다운
  - 확장 시나리오: 자동 스케일링 트리거

메트릭 조정 규칙:
  - 환경별 기본 임계값 설정
  - 서버 역할별 메트릭 가중치
  - 시간대별 트래픽 패턴 반영
  - 계절성 및 비즈니스 사이클 고려
```

---

**관리**: src/modules/ai-agent/context/
**업데이트**: 새로운 서버 환경 추가시 시나리오 확장
**용도**: AI 에이전트가 특정 서버 구성에 특화된 모니터링 및 최적화 제안 제공
**연동**: RealServerDataGenerator와 연계하여 실제 시나리오 구현 

# ⚙️ 서버 환경별 커스텀 시나리오 (보조 지식)

> **역할**: 기본/고급 지식으로 해결되지 않는 **특수한 서버 구성**에 대한 **보조적 가이드**
> **범위**: 표준화되지 않은 환경별 특화 설정 및 대응 방법
> **우선순위**: 기본 → 고급 → 커스텀 순으로 활용

## 🎯 커스텀 설정 활용 원칙

### **기본 원칙**
```yaml
대응 우선순위:
  1순위: 기본 지식 (system-knowledge.md)     → 일반적인 서버 모니터링 대응
  2순위: 고급 지식 (advanced-monitoring.md)  → AI 기반 예측 및 고급 분석
  3순위: 커스텀 시나리오 (현재 문서)         → 특수 환경별 보조 가이드

적용 시점:
  - 표준 방법으로 해결되지 않는 경우
  - 특수한 서버 구성으로 인한 예외 상황
  - 환경별 특화된 메트릭 해석이 필요한 경우
```

### **보조적 역할 정의**
- **주 역할**: 기본/고급 지식 보완
- **활용 빈도**: 전체 케이스의 10-20% 미만
- **목적**: 특수 환경에서도 일관된 서비스 품질 유지

## 🏗️ 1. 단일 서버 환경 (All-in-One)

### **특징 및 한계점**
```yaml
구성: 웹서버 + DB + 캐시가 한 서버에 통합
장점: 간단한 구성, 낮은 네트워크 지연
한계: 단일 장애점, 리소스 경합 발생 가능
특별 고려사항: 프로세스간 리소스 분배 모니터링 필요
```

### **보조 모니터링 포인트** (기본 지식에 추가)
```yaml
⚠️ 기본 CPU/Memory/Disk 모니터링 외 추가 사항:

프로세스별 리소스 분석:
  - Nginx: CPU 5-10%, Memory 50-100MB
  - MySQL: CPU 10-30%, Memory 500MB-2GB  
  - Redis: CPU 2-5%, Memory 100-500MB
  - Application: CPU 20-50%, Memory 500MB-1GB

포트 경합 모니터링:
  - 동일 서버 내 포트 충돌 감지
  - 프로세스간 파일 락 경합 확인
```

### **단일 서버 전용 알림** (보조 기능)
```yaml
⚠️ 표준 알림으로 해결 안되는 경우에만 사용:

특수 상황 예시:
- "MySQL이 정상이지만 웹서버가 DB 연결 실패"
- "Redis 메모리 부족으로 웹 세션 손실"
- "로그 파일 크기로 인한 디스크 I/O 경합"

대응 방법:
1. 기본 지식 적용 (일반적인 해결책)
2. 고급 지식 적용 (AI 예측 기반 분석)  
3. 단일서버 특화 대응 (최후 수단)
```

## 🔄 2. 마스터-슬레이브 환경

### **보조 모니터링 항목**
```yaml
⚠️ 일반 DB 모니터링 + 추가 항목:

복제 지연 특별 관리:
  - 정상: <1초 → 기본 지식으로 충분
  - 주의: 1-5초 → 고급 지식으로 예측 분석
  - 위험: >5초 → 마스터-슬레이브 전용 대응

Split-brain 방지:
  - 마스터 이중화 상황 감지
  - 자동 페일오버 상태 확인
  - VIP(Virtual IP) 이동 모니터링
```

## ⚖️ 3. 로드밸런싱 환경

### **특수 상황 대응** (기본 해결 안될 때만)
```yaml
로드밸런서 특화 이슈:
  - 세션 스티키니스 문제
  - 백엔드 서버 헬스체크 실패
  - 트래픽 불균등 분산

보조 대응 방법:
1. 먼저 기본 지식으로 각 서버 개별 점검
2. 고급 지식으로 트래픽 패턴 AI 분석
3. 최후에 로드밸런싱 환경 특화 대응
```

## 🏢 4. 마이크로서비스 환경  

### **서비스 메시 모니터링** (보조 기능)
```yaml
⚠️ 표준 모니터링으로 감지 안되는 경우:

서비스간 통신 추적:
  - API Gateway 응답 시간
  - 서비스 디스커버리 상태
  - 서킷 브레이커 동작 상태

분산 추적 연동:
  - Jaeger/Zipkin 연동시에만 활용
  - 기본/고급 지식으로 해결 안될 때 사용
```

## 🗃️ 5. 데이터베이스 특화 환경

### **RDBMS 클러스터** (보조 가이드)
```yaml
MySQL Cluster / Galera:
  - 노드간 동기화 상태 (wsrep_local_state)
  - Split-brain 감지 및 복구
  - 스토리지 엔진별 특화 메트릭

PostgreSQL HA:
  - Streaming Replication 지연
  - WAL 파일 적재 상태
  - Failover 시나리오별 대응
```

### **NoSQL 클러스터** (보조 가이드)
```yaml
MongoDB Replica Set:
  - Primary 선출 과정 모니터링
  - Oplog 크기 및 지연 관리
  - Sharding 환경 밸런스 확인

Redis Cluster:
  - 키 분산 상태 확인
  - 노드 추가/제거시 리밸런싱
  - Failover 자동화 상태
```

## 🌐 6. 네트워크 토폴로지별 특화

### **멀티 데이터센터** (고급 보조 기능)
```yaml
⚠️ 기본 네트워크 모니터링으로 해결 안될 때:

지역간 지연 관리:
  - 데이터센터간 RTT 모니터링  
  - 지역별 사용자 트래픽 분산
  - Disaster Recovery 절차 자동화

CDN 연동 모니터링:
  - Edge 서버 히트율
  - Origin 서버 부하 분산
  - 지역별 성능 차이 분석
```

## 🎮 7. 특수 워크로드 환경

### **GPU 집약적 서버** (특화 보조 기능)
```yaml
⚠️ 일반 서버 모니터링 + GPU 특화:

GPU 리소스 모니터링:
  - CUDA 메모리 사용률
  - GPU 온도 및 팬 속도
  - 머신러닝 작업 큐 상태

특수 상황 대응:
  - GPU 메모리 누수 감지
  - CUDA 드라이버 호환성 이슈
  - 분산 학습 환경 동기화 문제
```

### **스토리지 집약적 서버** (특화 보조 기능)
```yaml
대용량 스토리지 환경:
  - RAID 상태 모니터링
  - 디스크 교체 예측 (SMART)
  - I/O 대기 시간 패턴 분석

분산 스토리지:
  - Ceph/GlusterFS 클러스터 상태
  - 복제본 일관성 확인
  - 스토리지 노드 밸런싱
```

## 📊 커스텀 환경별 데이터 생성 조정

### **환경 설정 변경시 자동 조정**
```typescript
// 데이터 생성기가 환경에 맞게 메트릭 조정
interface CustomEnvironmentMetrics {
  // 기본 메트릭은 유지하되, 환경별 가중치 적용
  environmentType: 'single' | 'cluster' | 'microservice' | 'gpu' | 'storage';
  customWeights: {
    cpu_weight: number;      // 환경별 CPU 사용 패턴
    memory_weight: number;   // 메모리 사용 특성
    network_weight: number;  // 네트워크 트래픽 특성
    disk_weight: number;     // 디스크 I/O 특성
  };
  specialMetrics?: string[]; // 환경별 추가 메트릭
}
```

## 🚨 커스텀 시나리오 적용 기준

### **언제 커스텀 지식을 사용하나?**
```yaml
적용 조건 (모두 만족시에만):
  1. 기본 지식으로 해결되지 않음
  2. 고급 AI 분석으로도 명확한 답 없음  
  3. 특수한 서버 구성으로 인한 예외상황
  4. 표준 대응 방법이 환경에 적합하지 않음

예시 상황:
  ❌ 일반적인 CPU 사용률 증가 → 기본 지식 사용
  ❌ 트래픽 패턴 예측 필요 → 고급 지식 사용  
  ✅ MySQL Galera 클러스터 split-brain → 커스텀 사용
  ✅ GPU 메모리 누수로 인한 CUDA 오류 → 커스텀 사용
```

---

**관리**: src/modules/ai-agent/context/
**업데이트**: 새로운 특수 환경 도입시에만 추가
**활용 빈도**: 전체 문의의 10-20% 미만 (보조적 역할)
**우선순위**: 기본 → 고급 → 커스텀 순서로 적용 