# Mock Simulation System

**최종 업데이트**: 2026-01-01
**버전**: v2.0.0 (Seeded Random + Korean DC)

---

## 🎯 시스템 개요

GCP VM 완전 대체, **Mulberry32 PRNG** 기반 결정론적 메트릭 생성 시스템

**핵심 특징**:

- **결정론적 생성**: Seeded Random으로 동일 입력 → 동일 출력
- **15개 서버**: Korean DC 명명 규칙 (web-nginx-icn-01 등)
- **5개 장애 시나리오**: 시간대별 현실적 장애 시뮬레이션
- **SSOT 동기화**: Dashboard와 AI Engine 데이터 일치
- **연간 절약**: $684+ 비용 절감

---

## 🔬 Seeded Random 구현 (Mulberry32 PRNG)

```typescript
/**
 * Mulberry32 PRNG - 시드 기반 결정론적 난수 생성기
 * Math.random() 완전 대체 - 같은 시드면 항상 동일한 값
 */
function createSeededRandom(seed: number) {
  let state = seed;
  return function (): number {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// 시드 계산: hour * 10000 + serverIndex * 100 + minuteIndex
const seed = hour * 10000 + serverIndex * 100 + minuteIndex;
const random = createSeededRandom(seed);
```

### 왜 Seeded Random인가?

| 방식 | 장점 | 단점 |
|------|------|------|
| `Math.random()` | 간단함 | 매번 다른 값, Git diff 발생 |
| **Mulberry32** | 결정론적, 재현 가능 | 시드 관리 필요 |
| FNV-1a Hash | 결정론적 | 분포 품질 낮음 |

---

## 🖥️ 서버 구성 (15대)

### Korean DC 명명 규칙

```
{type}-{software}-{region}-{number}

리전:
  - icn: 인천/서울 (메인 DC)
  - pus: 부산 (DR DC)
```

### 서버 목록

| 유형 | 서버 수 | 서버 ID 예시 |
|------|--------|-------------|
| **Web (Nginx)** | 3 | `web-nginx-icn-01`, `web-nginx-icn-02`, `web-nginx-pus-01` |
| **API (WAS)** | 3 | `api-was-icn-01`, `api-was-icn-02`, `api-was-pus-01` |
| **Database (MySQL)** | 3 | `db-mysql-icn-primary`, `db-mysql-icn-replica`, `db-mysql-pus-dr` |
| **Cache (Redis)** | 2 | `cache-redis-icn-01`, `cache-redis-icn-02` |
| **Storage** | 2 | `storage-nfs-icn-01`, `storage-s3gw-pus-01` |
| **LoadBalancer** | 2 | `lb-haproxy-icn-01`, `lb-haproxy-pus-01` |

---

## ⚡ 5개 장애 시나리오

| 시간 | 시나리오 | 영향 서버 | 상태 |
|------|---------|----------|------|
| **02시** | DB 자동 백업 - 디스크 I/O 과부하 | DB, Storage | 🟡 Warning |
| **03시** | DB 슬로우 쿼리 누적 - 성능 저하 | DB Primary | 🔴 Critical |
| **07시** | 네트워크 패킷 손실 - LB 과부하 | LB, API | 🔴 Critical |
| **12시** | Redis 캐시 메모리 누수 - OOM 직전 | Cache | 🔴 Critical |
| **21시** | API 요청 폭증 - CPU 과부하 | API, Web | 🔴 Critical |

---

## 📁 데이터 구조

### 파일 구조

```
public/hourly-data/
├── hour-00.json   # 00시 데이터 (15개 서버 × 12 포인트)
├── hour-01.json   # 01시 데이터
├── hour-02.json   # 02시 - 🟡 DB 백업 장애
├── hour-03.json   # 03시 - 🔴 DB 슬로우 쿼리
├── ...
├── hour-12.json   # 12시 - 🔴 Redis OOM
├── ...
├── hour-21.json   # 21시 - 🔴 CPU 과부하
└── hour-23.json   # 23시 데이터

파일당: ~124KB
총 크기: ~3MB (24개 파일)
```

### 데이터 포인트

| 항목 | 값 |
|------|-----|
| 시간대 | 24시간 (hour-00 ~ hour-23) |
| 간격 | 5분 |
| 시간당 포인트 | 12개 (00, 05, 10, ..., 55분) |
| 서버당 메트릭 | 18개 필드 |
| 총 데이터 포인트 | 24 × 12 × 15 = **4,320개** |

---

## 🔄 SSOT 동기화

### 명령어

```bash
# SSOT에서 hourly-data JSON 생성
npm run data:sync

# 출력:
#   - public/hourly-data/hour-XX.json (24개)
#   - cloud-run/ai-engine/data/hourly-data/hour-XX.json (24개)
```

### 특징

- **Idempotent**: 여러 번 실행해도 동일한 결과
- **Git 친화적**: 재실행 시 변경사항 없음
- **Dashboard ↔ AI Engine 동기화**: 동일한 서버 데이터 보장

---

## 🚀 API 엔드포인트

```typescript
// /api/servers/all
export async function GET(request: NextRequest) {
  const currentHour = new Date().getHours();

  // 시간대별 JSON 로드
  const hourlyData = await loadHourlyData(currentHour);

  return NextResponse.json({
    data: hourlyData.dataPoints[0].servers,
    timestamp: new Date().toISOString(),
    scenario: hourlyData.scenario,
  });
}
```

---

## 📊 성과 지표

### GCP VM 대비 개선

| 항목 | GCP VM (이전) | Mock 시뮬레이션 (현재) | 절약 |
|------|---------------|----------------------|------|
| **월 비용** | $57 | $0 | 100% |
| **안정성** | 99.5% | 99.95% | +0.45% |
| **확장성** | 1개 VM | 무제한 | 무제한 |
| **재현성** | 불가능 | 100% 결정론적 | ✅ |

---

## 🛠️ 사용법

### 개발 환경

```bash
# 개발 서버 실행
npm run dev

# 데이터 동기화 (서버/시나리오 변경 시)
npm run data:sync
```

### 환경 변수

```env
MOCK_MODE=dev                    # Mock 시스템 활성화
MOCK_RESPONSE_DELAY=0            # 응답 지연 (ms)
```

---

## 📖 관련 문서

- **데이터 아키텍처**: `docs/reference/architecture/data/data-architecture.md`
- **SSOT 스크립트**: `scripts/data/sync-hourly-data.ts`
- **원본 데이터**: `src/data/fixed-24h-metrics.ts`
