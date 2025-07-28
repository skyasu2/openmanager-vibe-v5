# 🔄 GCP API 마이그레이션 가이드

> **OpenManager VIBE v5 - GCP VM 서버 데이터 생성 API 정리**

## 📋 개요

기존 GCP 관련 API들을 최적화된 템플릿 시스템으로 완전 교체합니다.

## 🗂️ 레거시 API 목록 및 교체 방안

### 1. **GCP 실시간 데이터 API**

| 레거시 API                | 신규 API                  | 상태         |
| ------------------------- | ------------------------- | ------------ |
| `/api/gcp/real-servers`   | `/api/servers-optimized`  | ✅ 대체 완료 |
| `/api/gcp/server-data`    | `/api/servers-optimized`  | ✅ 대체 완료 |
| `/api/gcp/data-generator` | 제거 (템플릿 시스템 내장) | ⚠️ 제거 예정 |

### 2. **기능별 마이그레이션**

#### 🔸 서버 데이터 조회

```javascript
// ❌ 기존 (레거시)
const response = await fetch('/api/gcp/real-servers');

// ✅ 신규 (최적화)
const response = await fetch('/api/servers-optimized');
```

#### 🔸 실시간 데이터 생성

```javascript
// ❌ 기존 (레거시)
const response = await fetch('/api/gcp/data-generator', {
  method: 'POST',
  body: JSON.stringify({ count: 10 }),
});

// ✅ 신규 (자동 처리)
// 템플릿 시스템이 자동으로 데이터 생성
// 추가 API 호출 불필요
```

## 🏗️ 아키텍처 변경사항

### Before (복잡한 구조)

```
Client → /api/gcp/real-servers → GCP VM → Firestore → Cloud Functions
                                    ↓
                                  Redis
                                    ↓
                                  Client
```

### After (단순화된 구조)

```
Client → /api/servers-optimized → Redis Template Cache → Client
                                    ↓ (Fallback)
                                  Supabase
```

## 🛠️ 마이그레이션 단계

### 1단계: 코드 업데이트

```javascript
// hooks/useServerData.ts
export function useServerData() {
  // 기존
  // const { data } = useSWR('/api/gcp/real-servers');

  // 신규
  const { data } = useSWR('/api/servers-optimized');

  return data;
}
```

### 2단계: 환경 변수 정리

```env
# 제거할 환경 변수들
# GCP_PROJECT_ID=xxx (제거)
# FIRESTORE_COLLECTION=xxx (제거)
# CLOUD_FUNCTIONS_URL=xxx (제거)

# 유지할 환경 변수
UPSTASH_REDIS_REST_URL=xxx
UPSTASH_REDIS_REST_TOKEN=xxx
NEXT_PUBLIC_SUPABASE_URL=xxx
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
```

### 3단계: API 라우트 제거

```bash
# 제거할 파일들
rm -rf src/app/api/gcp/
rm -rf src/services/gcp/
```

## 🔍 주의사항

### 1. **AI 엔진 호환성**

AI 엔진들이 `/api/servers` 를 호출하는 경우:

```javascript
// ai/anomaly/route.ts 수정 예시
const serversResponse = await fetch(
  `${request.nextUrl.origin}/api/servers-optimized?limit=50`
);
```

### 2. **데이터 형식 호환성**

최적화된 API는 기존 형식과 100% 호환:

- 동일한 필드명
- 동일한 데이터 구조
- 동일한 응답 형식

### 3. **성능 모니터링**

마이그레이션 후 성능 비교:

```javascript
// 성능 테스트
const response = await fetch('/api/performance-test?action=benchmark');
```

## 📊 예상 효과

| 지표      | 기존      | 개선 후 | 개선율 |
| --------- | --------- | ------- | ------ |
| 응답 시간 | 200-500ms | 1-5ms   | 99%    |
| 서버 비용 | 높음      | 낮음    | 80%    |
| 복잡도    | 매우 복잡 | 단순    | -      |
| 유지보수  | 어려움    | 쉬움    | -      |

## 🚀 롤백 계획

문제 발생 시:

```javascript
// A/B 테스트로 즉시 롤백
await fetch('/api/ab-test', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'emergency_rollback',
    reason: 'GCP API 의존성 문제',
  }),
});
```

## ✅ 체크리스트

- [ ] 모든 GCP API 호출 코드 업데이트
- [ ] 환경 변수 정리
- [ ] AI 엔진 엔드포인트 업데이트
- [ ] 성능 테스트 실행
- [ ] 모니터링 대시보드 확인
- [ ] 레거시 파일 제거

## 📚 참고 문서

- [API 최적화 가이드](./api-optimization-guide.md)
- [동적 템플릿 시스템](./dynamic-template-system.md)
- [A/B 테스트 운영 가이드](./ab-test-operations.md)

---

**마이그레이션 완료 후 GCP 의존성이 완전히 제거되어 더 빠르고 안정적인 시스템이 됩니다! 🎉**
