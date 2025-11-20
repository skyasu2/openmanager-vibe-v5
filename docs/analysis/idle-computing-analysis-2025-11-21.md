# 🔍 시스템 중단 상태 컴퓨팅 사용량 분석

> **분석 일시**: 2025-11-21 07:42 KST  
> **목적**: 시스템 시작 버튼을 누르지 않았는데도 발생하는 컴퓨팅 사용량 원인 파악 및 최적화

---

## 📊 현재 상황

### 문제
- **시스템 중단 상태**에서도 Vercel 컴퓨팅 사용량이 조금씩 발생
- 사용자가 "시스템 시작" 버튼을 누르지 않았는데도 리소스 소비

### 예상 원인
1. **항상 동작하는 API 엔드포인트**
2. **Middleware 실행**
3. **Edge Functions 자동 실행**
4. **헬스체크 및 모니터링**

---

## 🔍 분석 결과

### 1. 항상 동작하는 API 엔드포인트 (시스템 상태 무관)

#### ⚡ Edge Runtime API (무료 100만 호출/월)
```typescript
// 1. /api/ping - 초경량 헬스체크
export const runtime = 'edge';
- 응답시간: ~5ms
- 캐싱: 60초
- 사용량: 거의 0 (Edge Functions)

// 2. /api/time - 시간 정보
export const runtime = 'edge';
- 응답시간: ~3ms
- 캐싱: 1초
- 사용량: 거의 0 (Edge Functions)

// 3. /api/vercel-usage - 사용량 모니터링
export const runtime = 'edge';
- 응답시간: ~10ms
- 캐싱: 없음 (실시간)
- 사용량: 거의 0 (Edge Functions)
```

#### 🔧 Node.js Runtime API (컴퓨팅 사용)
```typescript
// 4. /api/health - 종합 헬스체크
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

✅ 체크 항목:
- Database (Supabase) - 2초 타임아웃
- Cache (메모리) - 즉시
- AI (GCP VM) - 3초 타임아웃

⚠️ 문제점:
- 매 요청마다 3개 서비스 체크
- 총 응답시간: 50-200ms
- 캐싱 없음 (force-dynamic)

💰 비용 영향:
- 1회 호출: ~0.15초 컴퓨팅
- 1분마다 호출 시: 9초/시간 = 216초/일
```

---

### 2. Middleware 실행 (모든 요청에 실행)

```typescript
// middleware.ts
export const runtime = 'edge'; // ✅ Edge Runtime 사용

실행 조건:
1. 모든 페이지 접근 (/*)
2. 모든 API 호출 (/api/*)
3. 정적 파일 제외 (_next/static/*)

주요 작업:
- IP 화이트리스트 체크 (Module-level 캐싱)
- CSRF 토큰 검증
- Supabase 인증 체크
- Rate Limiting

💰 비용 영향:
- Edge Runtime이므로 무료 (100만 호출/월)
- 실제 컴퓨팅 비용 거의 없음
```

---

### 3. 자동 실행되는 백그라운드 작업

#### 없음 ✅
```
✅ Cron Job 없음
✅ 백그라운드 워커 없음
✅ 자동 데이터 생성 없음
✅ 실시간 WebSocket 없음 (시스템 시작 전)
```

---

### 4. 외부 헬스체크 (추정)

```
가능성 있는 외부 호출:
1. Vercel 자체 헬스체크
   - 주기: 5-10분마다
   - 대상: /api/health 또는 /api/ping

2. Uptime 모니터링 서비스 (설정된 경우)
   - UptimeRobot, Pingdom 등
   - 주기: 1-5분마다

3. 검색 엔진 크롤러
   - Google Bot, Bing Bot
   - 빈도: 불규칙

💰 예상 비용:
- Vercel 헬스체크: 144회/일 × 0.15초 = 21.6초/일
- 외부 모니터링: 288회/일 × 0.15초 = 43.2초/일
- 크롤러: 50회/일 × 0.15초 = 7.5초/일
- 총 예상: ~72초/일 = 2,160초/월 = 36분/월
```

---

## 💡 최적화 방안

### Phase 1: 즉시 적용 가능 (5분)

#### 1. /api/health 캐싱 추가
```typescript
// src/app/api/health/route.ts
export const dynamic = 'force-dynamic'; // ❌ 제거
export const revalidate = 30; // ✅ 30초 캐싱 추가

// 또는 응답 헤더에 캐싱 추가
headers: {
  'Cache-Control': 'public, max-age=30, stale-while-revalidate=60'
}

💰 절감 효과:
- 현재: 144회/일 × 0.15초 = 21.6초/일
- 개선: 48회/일 × 0.15초 = 7.2초/일
- 절감: 14.4초/일 = 432초/월 = 7.2분/월 (67% 절감)
```

#### 2. Database 체크 최적화
```typescript
// 현재: 매번 실제 쿼리 실행
const { data, error } = await supabase
  .from('command_vectors')
  .select('id')
  .limit(1);

// 개선: 간단한 연결 체크만
const { error } = await supabase
  .from('command_vectors')
  .select('count')
  .limit(0); // ✅ 데이터 가져오지 않음

💰 절감 효과:
- 쿼리 시간: 50-100ms → 10-20ms (80% 절감)
- 대역폭: 1KB → 100B (90% 절감)
```

#### 3. AI 체크 조건부 실행
```typescript
// 현재: 항상 GCP VM 체크
const response = await fetch(`${vmUrl}/health`, ...);

// 개선: 시스템 시작 상태일 때만 체크
if (systemStatus === 'running') {
  const response = await fetch(`${vmUrl}/health`, ...);
} else {
  return { status: 'disconnected', latency: 0 };
}

💰 절감 효과:
- 시스템 중단 시: 3초 타임아웃 제거
- 응답시간: 200ms → 50ms (75% 개선)
- 컴퓨팅: 0.15초 → 0.05초 (67% 절감)
```

---

### Phase 2: 구조적 개선 (30분)

#### 1. 경량 헬스체크 엔드포인트 추가
```typescript
// src/app/api/health/lite/route.ts
export const runtime = 'edge'; // ✅ Edge Runtime

export function GET() {
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  }, {
    headers: {
      'Cache-Control': 'public, max-age=60'
    }
  });
}

💰 절감 효과:
- Edge Runtime으로 컴퓨팅 비용 0
- 외부 헬스체크를 /api/health/lite로 리다이렉트
- 100% 비용 절감
```

#### 2. 시스템 상태 기반 응답 분기
```typescript
// src/app/api/health/route.ts
const systemStatus = await getSystemStatus(); // Redis/Memory 캐시

if (systemStatus === 'stopped') {
  // 경량 응답
  return NextResponse.json({
    status: 'healthy',
    services: {
      database: { status: 'standby' },
      cache: { status: 'standby' },
      ai: { status: 'standby' },
    },
    system: 'stopped',
  }, {
    headers: {
      'Cache-Control': 'public, max-age=300' // 5분 캐싱
    }
  });
}

// 시스템 실행 중일 때만 실제 체크
const [dbResult, cacheResult, aiResult] = await Promise.all([...]);

💰 절감 효과:
- 시스템 중단 시: 0.15초 → 0.01초 (93% 절감)
- 캐싱으로 호출 빈도 감소: 144회/일 → 29회/일 (80% 절감)
- 총 절감: 21.6초/일 → 0.3초/일 (99% 절감)
```

---

### Phase 3: 모니터링 최적화 (1시간)

#### 1. 헬스체크 통합 대시보드
```typescript
// src/app/api/health/dashboard/route.ts
export const runtime = 'edge';

// 모든 헬스체크 정보를 한 번에
export function GET() {
  return NextResponse.json({
    endpoints: {
      lite: '/api/health/lite',    // 외부 모니터링용
      full: '/api/health',          // 내부 진단용
      ping: '/api/ping',            // 초경량 체크
    },
    recommendations: {
      external_monitoring: '/api/health/lite',
      internal_dashboard: '/api/health',
      uptime_check: '/api/ping',
    }
  });
}
```

#### 2. 사용량 알림 시스템
```typescript
// src/app/api/vercel-usage/route.ts
// 이미 구현됨 ✅

// 추가: 임계값 도달 시 자동 최적화
if (usage.bandwidth.percentage > 80) {
  // 자동으로 캐싱 강화
  await enableAggressiveCaching();
  
  // 알림 전송
  await sendAlert('bandwidth-critical');
}
```

---

## 📊 예상 절감 효과

### 현재 상태 (추정)
```
일일 컴퓨팅 사용량:
- /api/health: 21.6초/일
- 외부 모니터링: 43.2초/일
- 크롤러: 7.5초/일
- 기타 API: 10초/일
━━━━━━━━━━━━━━━━━━━━━━━━━━
총 예상: 82.3초/일 = 2,469초/월 = 41.15분/월
```

### Phase 1 적용 후
```
일일 컴퓨팅 사용량:
- /api/health: 7.2초/일 (67% 절감)
- 외부 모니터링: 14.4초/일 (67% 절감)
- 크롤러: 7.5초/일 (변동 없음)
- 기타 API: 10초/일 (변동 없음)
━━━━━━━━━━━━━━━━━━━━━━━━━━
총 예상: 39.1초/일 = 1,173초/월 = 19.55분/월
절감: 52.5% (21.6분/월 절감)
```

### Phase 2 적용 후
```
일일 컴퓨팅 사용량:
- /api/health: 0.3초/일 (99% 절감)
- 외부 모니터링: 0초/일 (100% 절감, Edge로 이동)
- 크롤러: 7.5초/일 (변동 없음)
- 기타 API: 10초/일 (변동 없음)
━━━━━━━━━━━━━━━━━━━━━━━━━━
총 예상: 17.8초/일 = 534초/월 = 8.9분/월
절감: 78.4% (32.25분/월 절감)
```

---

## 🎯 권장 조치

### 즉시 적용 (우선순위 높음)
1. ✅ `/api/health` 캐싱 추가 (30초)
2. ✅ Database 체크 최적화 (count만)
3. ✅ AI 체크 조건부 실행 (시스템 상태 기반)

### 단기 적용 (1주일 내)
4. ✅ `/api/health/lite` 경량 엔드포인트 추가
5. ✅ 시스템 상태 기반 응답 분기
6. ✅ 외부 모니터링을 Edge 엔드포인트로 리다이렉트

### 장기 개선 (1개월 내)
7. ⏳ 헬스체크 통합 대시보드
8. ⏳ 사용량 알림 자동화
9. ⏳ 컴퓨팅 사용량 실시간 모니터링

---

## 📝 구현 체크리스트

### Phase 1: 즉시 최적화 (5분)
- [ ] `/api/health/route.ts` 캐싱 추가
- [ ] Database 체크 쿼리 최적화
- [ ] AI 체크 조건부 실행 추가
- [ ] 테스트 및 검증

### Phase 2: 경량 엔드포인트 (30분)
- [ ] `/api/health/lite/route.ts` 생성
- [ ] 시스템 상태 체크 로직 추가
- [ ] 응답 분기 구현
- [ ] 외부 모니터링 설정 변경

### Phase 3: 모니터링 (1시간)
- [ ] 헬스체크 대시보드 구현
- [ ] 사용량 알림 시스템 강화
- [ ] 실시간 모니터링 추가

---

## 🔍 추가 조사 필요 사항

1. **실제 Vercel 사용량 확인**
   ```bash
   # Vercel Dashboard에서 확인
   - Analytics > Functions
   - 어떤 API가 가장 많이 호출되는지
   - 시간대별 패턴 분석
   ```

2. **외부 헬스체크 확인**
   ```bash
   # Access Logs 분석
   - 어떤 IP에서 호출하는지
   - 호출 빈도 및 패턴
   - User-Agent 확인
   ```

3. **시스템 상태 저장소 구현**
   ```typescript
   // Redis 또는 Vercel KV 사용
   // 시스템 시작/중단 상태를 저장하고
   // 모든 API에서 참조
   ```

---

**분석 완료**: 2025-11-21 07:42 KST  
**다음 단계**: Phase 1 최적화 구현 및 테스트
