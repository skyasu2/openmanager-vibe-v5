# 📊 서버 메트릭 데이터 생성기 가이드

OpenManager Vibe V5에서 사용하는 현실적인 서버 모니터링 시계열 데이터 생성 시스템입니다.

## 🎯 **목적**

- **AI 분석을 위한 현실적인 데이터**: 인위적인 태그 없이도 AI가 장애 패턴을 감지할 수 있는 시계열 데이터
- **Vercel + Supabase 최적화**: 무료 티어에서 안정적으로 동작하는 경량 시스템
- **다양한 장애 시나리오**: 매 실행마다 다른 장애 패턴으로 AI 학습 데이터 다양성 확보

## 🏗️ **시스템 구조**

```
📦 Metrics Generator System
├── 🗄️ Supabase (PostgreSQL)
│   └── daily_metrics 테이블
├── 🔧 Data Generation Engine
│   ├── Server Configuration (20대 서버)
│   ├── Failure Pattern Engine (7가지 장애 패턴)
│   └── Realistic Metrics Generator
└── 📡 API Endpoints
    └── /api/metrics/daily (조회 API)
```

## 📋 **데이터 스키마**

### `daily_metrics` 테이블

| 컬럼 | 타입 | 설명 | 범위 |
|------|------|------|------|
| `id` | BIGSERIAL | 기본키 | - |
| `timestamp` | TIMESTAMPTZ | 측정 시간 (10분 간격) | ISO8601 |
| `server_id` | VARCHAR(50) | 서버 식별자 | web-01~06, api-01~06, db-01~04, cache-01~02, worker-01~02 |
| `cpu` | DECIMAL(5,2) | CPU 사용률 | 0-100% |
| `memory` | DECIMAL(5,2) | 메모리 사용률 | 0-100% |
| `disk` | DECIMAL(5,2) | 디스크 사용률 | 0-100% |
| `response_time` | INTEGER | 응답 시간 | 밀리초 |
| `status` | VARCHAR(20) | 서버 상태 | healthy/warning/critical |
| `created_at` | TIMESTAMPTZ | 레코드 생성 시간 | 자동 생성 |

## 🖥️ **서버 구성 (20대)**

| 타입 | 개수 | 서버 ID | 특성 |
|------|------|---------|------|
| **Web** | 6대 | web-01~06 | 트래픽 변동성 높음, 응답시간 민감 |
| **API** | 6대 | api-01~06 | CPU/메모리 사용량 높음, 스파이크 빈번 |
| **Database** | 4대 | db-01~04 | 안정적이지만 락 발생 시 치명적 |
| **Cache** | 2대 | cache-01~02 | 메모리 집약적, 빠른 응답 |
| **Worker** | 2대 | worker-01~02 | 높은 CPU 사용률, 배치 작업 |

## 🔥 **장애 패턴 (7가지)**

### 1. **Memory Leak** (메모리 누수)
- **대상**: Web, API, Worker 서버
- **특징**: 메모리 사용률이 시간에 따라 점진적 증가
- **지속시간**: 2-6시간
- **연쇄효과**: CPU 사용률도 함께 증가, 응답시간 저하

### 2. **CPU Spike** (CPU 스파이크)
- **대상**: 모든 서버 타입
- **특징**: 갑작스러운 CPU 사용률 급증 (종 모양 곡선)
- **지속시간**: 10분-1시간
- **연쇄효과**: 응답시간 3배 증가

### 3. **Disk Full** (디스크 포화)
- **대상**: Database, Cache 서버
- **특징**: 디스크 사용률 점진적 증가, 70% 초과 시 성능 급락
- **지속시간**: 1-7시간
- **연쇄효과**: CPU 스파이크, 응답시간 4배 증가

### 4. **Cascade Failure** (연쇄 장애)
- **대상**: 모든 서버 (연쇄 전파)
- **특징**: 한 서버 장애가 관련 서버들로 전파
- **지속시간**: 1-4시간
- **연쇄효과**: 같은 타입 서버 60% 확률, DB 장애 시 Web/API 80% 확률

### 5. **Network Latency** (네트워크 지연)
- **대상**: 모든 서버
- **특징**: 응답시간만 급증, 다른 리소스는 정상
- **지속시간**: 30분-2시간30분
- **연쇄효과**: 응답시간 2-10배 증가 (사인파 패턴)

### 6. **Database Lock** (데이터베이스 락)
- **대상**: Database 서버 (다른 서버에도 영향)
- **특징**: DB 서버 CPU 80% 급증, 다른 서버 대기시간 증가
- **지속시간**: 20분-1시간40분
- **연쇄효과**: DB는 10배, 다른 서버는 3배 응답시간 증가

### 7. **Gradual Degradation** (점진적 성능 저하)
- **대상**: 모든 서버
- **특징**: 모든 리소스가 서서히 증가하는 패턴
- **지속시간**: 4-12시간
- **연쇄효과**: 장기간에 걸친 전반적 성능 저하

## 🚀 **사용 방법**

### 1. **환경 설정**

```bash
# 1. Supabase 환경 변수 설정 (.env.local)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# 2. 의존성 설치
npm install

# 3. 데이터베이스 테이블 생성
# Supabase Dashboard에서 sql/create-daily-metrics-table.sql 실행
```

### 2. **데이터 생성**

```bash
# 기본 생성 (기존 데이터 유지)
npm run generate:metrics

# 초기화 후 생성 (기존 데이터 삭제)
npm run generate:metrics:clear

# 도움말
npm run metrics:help
```

### 3. **API를 통한 데이터 조회**

```bash
# 전체 데이터 조회
curl "http://localhost:3000/api/metrics/daily"

# 특정 서버 데이터
curl "http://localhost:3000/api/metrics/daily?server_id=web-01"

# 시간 범위 지정
curl "http://localhost:3000/api/metrics/daily?start_time=2024-01-01T00:00:00Z&end_time=2024-01-01T12:00:00Z"

# 상태별 필터링
curl "http://localhost:3000/api/metrics/daily?status=critical"

# 개수 제한
curl "http://localhost:3000/api/metrics/daily?limit=100"
```

### 4. **SQL 직접 조회**

```sql
-- 전체 레코드 수
SELECT COUNT(*) FROM daily_metrics;

-- 상태별 분포
SELECT status, COUNT(*) as count 
FROM daily_metrics 
GROUP BY status;

-- 서버별 장애 현황
SELECT server_id, status, COUNT(*) as count
FROM daily_metrics 
WHERE status != 'healthy'
GROUP BY server_id, status
ORDER BY server_id, status;

-- 시간대별 장애 패턴
SELECT 
  DATE_TRUNC('hour', timestamp) as hour,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE status = 'critical') as critical_count
FROM daily_metrics 
GROUP BY hour
ORDER BY hour;
```

## 📊 **생성되는 데이터 특성**

### **데이터 볼륨**
- **총 레코드**: 2,880개 (20대 × 144개/대)
- **시간 범위**: 24시간 (10분 간격)
- **크기**: 약 500KB-1MB

### **현실성 요소**
- **업무시간 패턴**: 09:00-18:00 트래픽 증가
- **노이즈 포함**: ±10% 랜덤 변동
- **리소스 누적**: 메모리/디스크 점진적 증가
- **서버별 특성**: 타입별 다른 기본 부하 패턴

### **장애 분포 (통계적)**
- **Healthy**: 70-85%
- **Warning**: 10-20%
- **Critical**: 5-15%
- **장애 이벤트**: 2-10개/일

## 🧠 **AI 분석을 위한 설계**

### **인과관계 표현**
1. **시간 선후관계**: A 증가 → B 증가 → C 급증
2. **임계점 효과**: 디스크 70% 초과 시 성능 급락
3. **연쇄 반응**: DB 장애 → API 대기시간 증가 → Web 서버 타임아웃

### **패턴 감지 가능성**
- **점진적 변화**: 메모리 누수, 점진적 성능 저하
- **급격한 변화**: CPU 스파이크, 네트워크 지연
- **상관관계**: 서버 간 영향도, 리소스 간 의존성

### **Root Cause 추론**
- **시간적 순서**: 첫 번째 이상 징후 서버 식별
- **영향 범위**: 장애 전파 패턴 분석
- **리소스 패턴**: 특정 리소스 조합으로 장애 유형 구분

## ⚠️ **주의사항**

### **Vercel 무료 티어 제한**
- **Function 실행시간**: 최대 10초 (스크립트는 로컬 실행 권장)
- **API 호출 제한**: 배치 크기 조절로 대응
- **메모리 사용량**: 경량 데이터 구조 사용

### **Supabase 무료 티어 제한**
- **데이터베이스 크기**: 500MB (약 50만 레코드 가능)
- **API 요청**: 50,000/월 (배치 처리로 최적화)
- **동시 연결**: 최대 60개

### **데이터 품질**
- **매 실행마다 다른 패턴**: 고정 시드 사용 안함
- **현실성 우선**: 완벽한 패턴보다 실제 서버 동작 모방
- **AI 학습 고려**: 명확한 인과관계 보장

## 🔧 **커스터마이징**

### **서버 구성 변경**
```typescript
// scripts/generate-daily-metrics.ts의 createServerConfigs() 함수 수정
const configs: ServerConfig[] = [];
// 원하는 서버 타입과 개수로 조정
```

### **장애 패턴 추가**
```typescript
// src/lib/failure-pattern-engine.ts에 새로운 패턴 추가
export type FailurePattern = 
  | '기존패턴'
  | 'new_failure_pattern'; // 새 패턴 추가
```

### **임계값 조정**
```typescript
// scripts/generate-daily-metrics.ts의 calculateStatus() 함수 수정
const thresholds = {
  cpu: { warning: 70, critical: 90 },    // 조정 가능
  memory: { warning: 80, critical: 95 }, // 조정 가능
  // ...
};
```

## 📈 **성능 최적화**

### **배치 처리**
- 기본 배치 크기: 100개
- API 제한 고려 딜레이: 100ms
- 메모리 효율적 스트리밍 처리

### **인덱스 최적화**
- timestamp, server_id 복합 인덱스
- 쿼리 패턴에 맞는 인덱스 구성

### **캐싱 전략**
- 자주 조회되는 통계는 캐시 활용
- API 응답 압축 적용

---

## 🎉 **완료 체크리스트**

- [ ] Supabase 프로젝트 생성 및 환경 변수 설정
- [ ] `sql/create-daily-metrics-table.sql` 실행
- [ ] `npm install` 의존성 설치
- [ ] `npm run generate:metrics:clear` 초기 데이터 생성
- [ ] API 테스트: `curl http://localhost:3000/api/metrics/daily`
- [ ] 데이터 확인: `SELECT COUNT(*) FROM daily_metrics;`

이제 AI가 분석할 수 있는 현실적인 서버 모니터링 데이터가 준비되었습니다! 🎊 