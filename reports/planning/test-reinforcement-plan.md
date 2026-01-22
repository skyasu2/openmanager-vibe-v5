# 테스트 보강 작업 계획서

**작성일**: 2026-01-22
**목표**: 커버리지 4% → 25%+ 향상 (무료 티어 안전)

---

## 개요

### 제약 조건
- 성능/부하 테스트 제외
- 외부 API 호출 없음 (Mock 사용)
- Vercel/Supabase 무료 티어 부담 없음

### 목표 영역

| Phase | 영역 | 현재 | 목표 | 예상 테스트 수 |
|:-----:|------|:----:|:----:|:--------------:|
| 1 | Zustand Stores | 0% | 80% | ~40개 |
| 2 | API Routes | 4% | 50% | ~30개 |
| 3 | AI Hooks | 5% | 60% | ~25개 |

---

## Phase 1: Zustand Stores (0% → 80%)

### 대상 파일

| 파일 | 라인 | 우선순위 | 테스트 케이스 |
|------|:----:|:--------:|:-------------:|
| `useDashboardToggleStore.ts` | 100 | 높음 | ~12개 |
| `auth-store.ts` | 160 | 높음 | ~15개 |
| `useAISidebarStore.ts` | 529 | 중간 | ~13개 |

### 1.1 useDashboardToggleStore 테스트

**파일**: `src/stores/useDashboardToggleStore.test.ts`

```typescript
// 테스트 케이스 목록
describe('useDashboardToggleStore', () => {
  // 초기 상태
  - 기본 섹션 상태 확인 (9개 섹션 모두 true)

  // toggleSection
  - 개별 섹션 토글 동작
  - 토글 후 상태 유지 확인

  // setSectionState
  - 특정 섹션 상태 직접 설정
  - 다른 섹션에 영향 없음 확인

  // expandAll / collapseAll
  - 전체 펼치기 동작
  - 전체 접기 동작

  // resetToDefaults
  - 기본값 복원 확인

  // persist 미들웨어
  - skipHydration 동작 확인
});
```

### 1.2 auth-store 테스트

**파일**: `src/stores/auth-store.test.ts`

```typescript
describe('useAuthStore', () => {
  // 초기 상태
  - authType null 확인
  - sessionId null 확인
  - user null 확인

  // setAuth
  - guest 인증 설정
  - github 인증 설정
  - 부분 업데이트 (sessionId만 변경)

  // setGitHubAuth
  - GitHub 사용자 정보 설정
  - authType 자동 변경 확인

  // clearAuth
  - 모든 상태 초기화
  - CustomEvent 발생 확인

  // persist 미들웨어
  - localStorage 저장 확인
});
```

### 1.3 useAISidebarStore 테스트 (핵심 액션만)

**파일**: `src/stores/useAISidebarStore.test.ts`

```typescript
describe('useAISidebarStore', () => {
  // 기본 상태
  - isOpen 초기값 확인
  - messages 빈 배열 확인

  // 사이드바 토글
  - open/close 동작
  - toggle 동작

  // 메시지 관리
  - addMessage 동작
  - clearMessages 동작
  - 최대 메시지 수 제한 확인
});
```

---

## Phase 2: API Routes Integration Tests

### 대상 라우트

| 라우트 | 라인 | 테스트 파일 |
|--------|:----:|------------|
| `/api/ai/supervisor` | 513 | `tests/api/ai-supervisor.test.ts` |
| `/api/ai/raw-metrics` | 730 | `tests/api/ai-metrics.test.ts` |

### 2.1 AI Supervisor 테스트

**파일**: `tests/api/ai-supervisor.test.ts`

```typescript
describe('POST /api/ai/supervisor', () => {
  // 요청 검증
  - 빈 메시지 거부
  - 긴 메시지 truncate

  // 응답 형식
  - 정상 응답 구조 확인
  - 메타데이터 포함 확인

  // 에러 처리
  - 500 에러 시 fallback 응답
  - 타임아웃 처리
});
```

### 2.2 Raw Metrics 테스트

**파일**: `tests/api/ai-metrics.test.ts`

```typescript
describe('GET /api/ai/raw-metrics', () => {
  // 정상 케이스
  - serverId 파라미터 처리
  - timeRange 파라미터 처리
  - 데이터 포맷 확인

  // 에러 케이스
  - 존재하지 않는 서버 404
  - 잘못된 파라미터 400
});
```

---

## Phase 3: AI Hooks Unit Tests

### 대상 훅

| 훅 | 라인 | 테스트 파일 |
|----|:----:|------------|
| `useHybridAIQuery` | 823 | `src/hooks/ai/useHybridAIQuery.test.ts` |

### 3.1 useHybridAIQuery 테스트

**파일**: `src/hooks/ai/useHybridAIQuery.test.ts`

```typescript
describe('useHybridAIQuery', () => {
  // 쿼리 모드 선택
  - simple 쿼리 → streaming 모드
  - complex 쿼리 → job queue 모드

  // 메시지 정규화
  - user 메시지 포맷
  - system 컨텍스트 추가

  // 상태 관리
  - isLoading 상태
  - error 상태
  - data 상태

  // 캐시 처리
  - 동일 쿼리 캐시 히트
  - 캐시 무효화
});
```

---

## 실행 순서

```
Phase 1.1 → 1.2 → 1.3 → Phase 2.1 → 2.2 → Phase 3.1
   ↓         ↓      ↓        ↓        ↓        ↓
  12개     15개   13개     15개     15개     25개
```

**총 예상 테스트**: ~95개

---

## 검증 명령어

```bash
# 개별 테스트 실행
npm run test -- src/stores/useDashboardToggleStore.test.ts

# 전체 테스트
npm run test:quick

# 커버리지 확인
npm run test:coverage
```

---

## 완료 기준

- [x] Phase 1: 3개 Store 테스트 완료 (48개)
- [x] Phase 2: API Route 테스트 완료 (12개)
- [x] Phase 3: Hook 테스트 완료 (22개)
- [x] 전체 테스트 통과
- [x] TypeScript 컴파일 성공

---

## 실제 결과 (2026-01-22)

| Phase | 영역 | 테스트 파일 | 테스트 수 | 상태 |
|:-----:|------|------------|:--------:|:----:|
| 1.1 | useDashboardToggleStore | `src/stores/useDashboardToggleStore.test.ts` | 11 | ✅ |
| 1.2 | auth-store | `src/stores/auth-store.test.ts` | 14 | ✅ |
| 1.3 | useAISidebarStore | `src/stores/useAISidebarStore.test.ts` | 23 | ✅ |
| 2.1 | AI Raw Metrics API | `tests/api/ai-raw-metrics.test.ts` | 12 | ✅ |
| 3.1 | useHybridAIQuery | `src/hooks/ai/useHybridAIQuery.test.ts` | 22 | ✅ |

**총 신규 테스트: 82개**
